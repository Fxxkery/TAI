// src/lib/stores.js
import { writable, get } from 'svelte/store';
import { ERAS, RESOURCE_META } from './data/eras.js';

/** -------- Tunable knobs -------- */
const DEFAULT_BASE_PRIMARY = 0.05;   // per-second for any "primary"
const DEFAULT_BASE_SECONDARY = 0.02; // per-second for any "secondary"
const ENERGY_TAGS = new Set(['electricity','renewables','energy-credits','stellar-energy']);

/** Optional per-resource base overrides (leave empty to use defaults) */
const BASE_RATES = Object.create(null); // e.g., BASE_RATES['coal'] = 0.03

/** Utilities */
const clone = (o) => JSON.parse(JSON.stringify(o));

/** Build initial resource map */
function buildInitialResources() {
  const resources = {};
  for (const key of Object.keys(RESOURCE_META)) {
    resources[key] = { amount: 0, perSec: 0 };
  }
  return resources;
}

/** Build initial eras with flags */
function buildInitialEras() {
  return ERAS.map((era) => ({
    ...clone(era),
    unlocked: era.order === 0,
    completed: false,
    upgrades: (era.upgrades ?? []).map((u) => ({ ...clone(u), purchased: false }))
  }));
}

/** Global state */
export const state = writable({
  eras: buildInitialEras(),
  resources: buildInitialResources(),
  lastTick: Date.now(),
  paused: false
});

/** Computed rates */
export const rate = writable({
  perSec: Object.keys(RESOURCE_META).reduce((a, k) => ((a[k] = 0), a), {}),
  totalPerSec: 0
});

/** -------- Core calc engine -------- */
function recalcRates() {
  const s = get(state);

  // 0) Figure out which resources are allowed to generate (unlocked eras only)
  const allowed = new Set();
  for (const era of s.eras) {
    if (!era.unlocked) continue;
    for (const r of era.resources?.primary ?? []) allowed.add(r);
    for (const r of era.resources?.secondary ?? []) allowed.add(r);
  }

  // 1) Start with 0 for all resources, then set base only for allowed ones
  const perSec = {};
  for (const key of Object.keys(RESOURCE_META)) perSec[key] = 0;

  for (const key of allowed) {
    const meta = RESOURCE_META[key];
    const base =
      BASE_RATES[key] ??
      (meta.group === 'primary' ? DEFAULT_BASE_PRIMARY : DEFAULT_BASE_SECONDARY);
    perSec[key] = base;
  }

  // Helper lists limited to allowed resources
  const primaries = [...allowed].filter((k) => RESOURCE_META[k].group === 'primary');
  const secondaries = [...allowed].filter((k) => RESOURCE_META[k].group === 'secondary');
  const energyBased = [...allowed].filter((k) => ENERGY_TAGS.has(k));

  // Helper to apply a multiplier to a set safely
  const applyMultToSet = (set, amount) => {
    for (const r of set) perSec[r] = perSec[r] * (1 + amount);
  };

  let globalAllMult = 1.0;
  let baseAllMult = 1.0;
  const unlockedCount = s.eras.filter((e) => e.unlocked).length;

  // 2) Walk purchased upgrades from any era (ok), but only affect allowed resources
  for (const era of s.eras) {
    for (const upg of era.upgrades) {
      if (!upg.purchased || !upg.effects) continue;

      for (const eff of upg.effects) {
        if (eff.type === 'mult') {
          switch (eff.target) {
            case 'all/sec':
              // apply only to allowed resources
              globalAllMult *= 1 + eff.amount;
              break;
            case 'base/all/sec':
              baseAllMult *= 1 + eff.amount;
              break;
            case 'primary/all/sec':
              applyMultToSet(primaries, eff.amount);
              break;
            case 'secondary/all/sec':
              applyMultToSet(secondaries, eff.amount);
              break;
            case 'energy-based/all/sec':
              applyMultToSet(energyBased, eff.amount);
              break;
            case 'earlier-eras/all/sec': {
              const earlier = s.eras.filter((e) => e.unlocked && e.order < era.order).length;
              const mult = Math.pow(1 + eff.amount, earlier);
              for (const k of allowed) perSec[k] = perSec[k] * mult;
              break;
            }
            case 'secondary→primary/synergy':
              applyMultToSet(primaries, eff.amount);
              break;
            case 'resource/sec':
              if (eff.resource && allowed.has(eff.resource)) {
                perSec[eff.resource] = perSec[eff.resource] * (1 + eff.amount);
              }
              break;
            default:
              break;
          }
        } else if (eff.type === 'per-era') {
          const mult = 1 + (eff.amount ?? 0) * unlockedCount;
          if (eff.target === 'all/sec') {
            for (const k of allowed) perSec[k] = perSec[k] * mult;
          } else if (eff.target === 'primary/all/sec') {
            applyMultToSet(primaries, mult - 1);
          } else if (eff.target === 'secondary/all/sec') {
            applyMultToSet(secondaries, mult - 1);
          } else if (eff.target === 'resource/sec' && eff.resource && allowed.has(eff.resource)) {
            perSec[eff.resource] = perSec[eff.resource] * mult;
          }
        }
        // 'offline', 'trickle', 'meta' still handled later; when we add 'trickle',
        // we’ll explicitly add tiny perSec to targeted locked resources.
      }
    }
  }

  // 3) Apply base/global multipliers to allowed resources only
  if (baseAllMult !== 1.0) for (const k of allowed) perSec[k] = perSec[k] * baseAllMult;
  if (globalAllMult !== 1.0) for (const k of allowed) perSec[k] = perSec[k] * globalAllMult;

  // 4) Commit
  rate.set({
    perSec,
    totalPerSec: [...allowed].reduce((a, k) => a + (perSec[k] ?? 0), 0)
  });

  state.update((curr) => {
    for (const k of Object.keys(curr.resources)) {
      curr.resources[k].perSec = perSec[k] ?? 0;
    }
    return curr;
  });
}


/** -------- Public API -------- */
let _ticker = null;
export function startTicker() {
  if (_ticker) return;
  recalcRates();
  _ticker = setInterval(() => {
    const now = Date.now();
    state.update((s) => {
      const dt = Math.max(0, (now - s.lastTick) / 1000);
      s.lastTick = now;
      if (!s.paused) {
        const r = get(rate).perSec;
        for (const key of Object.keys(s.resources)) s.resources[key].amount += (r[key] ?? 0) * dt;
      }
      return s;
    });
    if (now % 1000 < 50) recalcRates();
  }, 50);
}

export function stopTicker() {
  if (_ticker) clearInterval(_ticker);
  _ticker = null;
}

function canAfford(costs, s) {
  for (const c of costs) {
    const res = s.resources[c.resource];
    if (!res || res.amount < c.amount) return false;
  }
  return true;
}
function pay(costs, s) {
  for (const c of costs) s.resources[c.resource].amount -= c.amount;
}

export function buyUpgrade(eraId, upgradeId) {
  state.update((s) => {
    const era = s.eras.find((e) => e.id === eraId);
    if (!era) return s;
    const upg = era.upgrades.find((u) => u.id === upgradeId);
    if (!upg || upg.purchased) return s;

    const costs = Array.isArray(upg.cost) ? upg.cost : upg.cost ? [upg.cost] : [];
    if (costs.length && !canAfford(costs, s)) return s;
    if (costs.length) pay(costs, s);

    upg.purchased = true;
    return s;
  });
  recalcRates();
}

/** Unlock an era by paying its unlockCost (uses previous-era resources) */
export function advanceEra(eraId) {
  state.update((s) => {
    const era = s.eras.find((e) => e.id === eraId);
    if (!era || era.unlocked) return s;

    const costs = Array.isArray(era.unlockCost) ? era.unlockCost : [];
    if (costs.length && !canAfford(costs, s)) return s;
    if (costs.length) pay(costs, s);

    era.unlocked = true;
    return s;
  });
  recalcRates();
}

/** Mark an era completed (lets you gate next unlocks in UI logic) */
export function completeEra(eraId) {
  state.update((s) => {
    const era = s.eras.find((e) => e.id === eraId);
    if (era) era.completed = true;
    return s;
  });
}

/** Dev helpers */
export function grantUpgrade(eraId, upgradeId) {
  state.update((s) => {
    const era = s.eras.find((e) => e.id === eraId);
    if (!era) return s;
    const upg = era.upgrades.find((u) => u.id === upgradeId);
    if (upg) upg.purchased = true;
    return s;
  });
  recalcRates();
}

export function hardReset() {
  stopTicker();
  state.set({
    eras: buildInitialEras(),
    resources: buildInitialResources(),
    lastTick: Date.now(),
    paused: false
  });
  rate.set({
    perSec: Object.keys(RESOURCE_META).reduce((a, k) => ((a[k] = 0), a), {}),
    totalPerSec: 0
  });
  startTicker();
}

/** Simple selectors */
export const getEra = (id) => get(state).eras.find((e) => e.id === id);
export const getResource = (key) => get(state).resources[key];
export const setPaused = (v) => state.update((s) => ((s.paused = !!v), s));
