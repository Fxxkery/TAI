// src/lib/stores.js
import { writable, get } from 'svelte/store';
import { ERAS, RESOURCE_META } from './data/eras.js';

/** -------- Tunables -------- */
const SAVE_KEY = 'tai_v6_save';
const DEFAULT_BASE_PRIMARY = 0.05;   // per-sec for any "primary"
const DEFAULT_BASE_SECONDARY = 0.02; // per-sec for any "secondary"
const ENERGY_TAGS = new Set(['electricity','renewables','energy-credits','stellar-energy']);
const OFFLINE_CAP_HOURS = 24;

/** Optional per-resource base overrides */
const BASE_RATES = Object.create(null); // e.g. BASE_RATES['coal']=0.03

/** Research catalog (early nodes) */
export const RESEARCH_V6 = [
  { id:'r_time_efficiency', name:'Temporal Efficiency', desc:'+10% global',
    cost:[{resource:'chrono',amount:2000},{resource:'food',amount:50}] },
  { id:'r_focus', name:'Era Focus', desc:'+20% chosen era',
    cost:[{resource:'chrono',amount:15000},{resource:'tools',amount:100}] },
  { id:'r_multihunt', name:'Multi-Hunt Protocol', desc:'+1 hunt slot',
    cost:[{resource:'chrono',amount:45000},{resource:'paper',amount:40}] },
  { id:'r_fast_hunts', name:'Accelerated Hunts', desc:'-20% hunt duration',
    cost:[{resource:'chrono',amount:22000},{resource:'stone',amount:80}] },
];

/** Hunt rarities */
const RARITIES = [
  { id:'Common',    bonus:0.01, hours:1 },
  { id:'Uncommon',  bonus:0.02, hours:2 },
  { id:'Rare',      bonus:0.03, hours:4 },
  { id:'Epic',      bonus:0.05, hours:8 },
  { id:'Legendary', bonus:0.07, hours:12 },
  { id:'Mythic',    bonus:0.10, hours:24 },
];
function rollRarity(){
  const bag = 'CCCCCCUUURREEELM'; // weighted
  const ch = bag[Math.floor(Math.random()*bag.length)];
  const idx = ['C','U','R','E','L','M'].indexOf(ch);
  return RARITIES[idx];
}

/** Utilities */
const clone = (o) => JSON.parse(JSON.stringify(o));
const keys = (o) => Object.keys(o);

/** Build initial resource map */
function buildInitialResources() {
  const resources = {};
  for (const key of keys(RESOURCE_META)) resources[key] = { amount: 0, perSec: 0 };
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

/** Load/save */
function migrate(raw) {
  let s = raw ? JSON.parse(raw) : null;
  if (!s || !s.version || s.version < 6) {
    s = {
      version: 6,
      eras: buildInitialEras(),
      resources: buildInitialResources(),
      lastTick: Date.now(),
      paused: false,
      insights: 0,
      artifactBonus: 0,     // global multiplier source from hunts
      research: { nodes:{}, chosenEra:null },
      hunts: { slots: 1, missions: [], nextId: 1, log: [] },
      transient: { offlineReport: null }
    };
  } else {
    // ensure new fields
    s.version = 6;
    s.resources ||= buildInitialResources();
    s.eras ||= buildInitialEras();
    s.insights ||= 0;
    s.artifactBonus ||= 0;
    s.research ||= { nodes:{}, chosenEra:null };
    s.hunts ||= { slots:1, missions:[], nextId:1, log:[] };
    s.transient ||= { offlineReport: null };
    s.paused = !!s.paused;
    s.lastTick ||= Date.now();
  }
  return s;
}
function load(){ try { return migrate(localStorage.getItem(SAVE_KEY)); } catch { return migrate(null); } }
function save(s){ try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch {} }

/** Global state */
export const state = writable(load());

/** Computed rates */
export const rate = writable({
  perSec: keys(RESOURCE_META).reduce((a, k) => ((a[k] = 0), a), {}),
  totalPerSec: 0
});

/** -------- Core calc engine -------- */
function recalcRates() {
  const s = get(state);

  // 0) Which resources are allowed (from unlocked eras only)
  const allowed = new Set();
  for (const era of s.eras) {
    if (!era.unlocked) continue;
    for (const r of era.resources?.primary ?? []) allowed.add(r);
    for (const r of era.resources?.secondary ?? []) allowed.add(r);
  }

  // 1) Start with zeros; set base for allowed resources
  const perSec = {};
  for (const key of keys(RESOURCE_META)) perSec[key] = 0;

  for (const key of allowed) {
    const meta = RESOURCE_META[key];
    const base =
      BASE_RATES[key] ??
      (meta.group === 'primary' ? DEFAULT_BASE_PRIMARY : DEFAULT_BASE_SECONDARY);
    perSec[key] = base;
  }

  const primaries   = [...allowed].filter((k) => RESOURCE_META[k].group === 'primary');
  const secondaries = [...allowed].filter((k) => RESOURCE_META[k].group === 'secondary');
  const energyBased = [...allowed].filter((k) => ENERGY_TAGS.has(k));

  const applyMultToSet = (set, amount) => { for (const r of set) perSec[r] = perSec[r] * (1 + amount); };

  let globalAllMult = 1.0;
  let baseAllMult   = 1.0;
  const unlockedCount = s.eras.filter((e) => e.unlocked).length;

  // Upgrades (only affect allowed)
  for (const era of s.eras) {
    for (const upg of era.upgrades ?? []) {
      if (!upg.purchased || !upg.effects) continue;
      for (const eff of upg.effects) {
        if (eff.type === 'mult') {
          switch (eff.target) {
            case 'all/sec':                 globalAllMult *= 1 + eff.amount; break;
            case 'base/all/sec':            baseAllMult   *= 1 + eff.amount; break;
            case 'primary/all/sec':         applyMultToSet(primaries, eff.amount); break;
            case 'secondary/all/sec':       applyMultToSet(secondaries, eff.amount); break;
            case 'energy-based/all/sec':    applyMultToSet(energyBased, eff.amount); break;
            case 'earlier-eras/all/sec': {
              const earlier = s.eras.filter((e) => e.unlocked && e.order < era.order).length;
              const mult = Math.pow(1 + eff.amount, earlier);
              for (const k of allowed) perSec[k] = perSec[k] * mult;
              break;
            }
            case 'secondary→primary/synergy': applyMultToSet(primaries, eff.amount); break;
            case 'resource/sec':
              if (eff.resource && allowed.has(eff.resource)) {
                perSec[eff.resource] = perSec[eff.resource] * (1 + eff.amount);
              }
              break;
            default: break;
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
      }
    }
  }

  // Research effects (global/focus)
  const rn = s.research?.nodes || {};
  if (rn['r_time_efficiency']) globalAllMult *= 1.10;
  if (s.research?.chosenEra != null) {
    // +20% to all resources when their producing era matches chosenEra
    const era = s.eras.find(e => e.id === s.research.chosenEra);
    if (era?.unlocked) {
      const set = new Set([...(era.resources?.primary ?? []), ...(era.resources?.secondary ?? [])]);
      for (const k of set) if (allowed.has(k)) perSec[k] = perSec[k] * 1.20;
    }
  }

  // Insights (+5% each) & artifactBonus (hunts)
  globalAllMult *= 1 + (s.insights || 0) * 0.05;
  globalAllMult *= 1 + (s.artifactBonus || 0);

  // Apply base/global only to allowed resources
  if (baseAllMult   !== 1.0) for (const k of allowed) perSec[k] = perSec[k] * baseAllMult;
  if (globalAllMult !== 1.0) for (const k of allowed) perSec[k] = perSec[k] * globalAllMult;

  // Commit
  rate.set({
    perSec,
    totalPerSec: [...allowed].reduce((a, k) => a + (perSec[k] ?? 0), 0)
  });

  state.update((curr) => {
    for (const k of keys(curr.resources)) curr.resources[k].perSec = perSec[k] ?? 0;
    return curr;
  });
}

/** Costs helpers */
function canAfford(costs, s) {
  for (const c of costs) {
    const res = s.resources[c.resource];
    if (!res || res.amount < c.amount) return false;
  }
  return true;
}
function pay(costs, s) { for (const c of costs) s.resources[c.resource].amount -= c.amount; }

/** -------- Public API -------- */
let _ticker = null;
export function startTicker() {
  if (_ticker) return;
  recalcRates();

  // apply offline once at start
  state.update((s) => {
    const capMs = (OFFLINE_CAP_HOURS || 24) * 3600 * 1000;
    const now = Date.now();
    const raw = Math.max(0, now - (s.lastTick || now));
    const dtMs = Math.min(raw, capMs);
    const dt = dtMs / 1000;

    const r = get(rate).perSec;
    if (dt > 0) {
      const before = clone(s.resources);
      for (const k of keys(s.resources)) s.resources[k].amount += (r[k] ?? 0) * dt;
      const after = s.resources;
      if (raw > 60_000) {
        s.transient = s.transient || {};
        s.transient.offlineReport = {
          seconds: Math.floor(dt),
          gains: keys(after).reduce((acc, k)=>{ acc[k] = (after[k].amount - before[k].amount); return acc }, {})
        };
      } else {
        if (s.transient) s.transient.offlineReport = null;
      }
    }
    s.lastTick = now;
    return s;
  });
  save(get(state));

  _ticker = setInterval(() => {
    const now = Date.now();
    state.update((s) => {
      const dt = Math.max(0, (now - s.lastTick) / 1000);
      s.lastTick = now;
      if (!s.paused) {
        const r = get(rate).perSec;
        for (const key of keys(s.resources)) s.resources[key].amount += (r[key] ?? 0) * dt;
        // update hunt reward flags
        for (const m of s.hunts.missions) {
          if (!m.rewardReady && now >= m.endTime) m.rewardReady = true;
        }
      }
      return s;
    });
    if (now % 250 < 50) recalcRates();
    save(get(state));
  }, 50);
}

export function stopTicker() { if (_ticker) clearInterval(_ticker); _ticker = null; }

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

/** Unlock era by paying its unlockCost array */
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

export const getEra       = (id)  => get(state).eras.find((e) => e.id === id);
export const getResource  = (key) => get(state).resources[key];
export const setPaused    = (v)   => state.update((s) => ((s.paused = !!v), s));
export function hardReset(){
  stopTicker();
  state.set(migrate(null));
  rate.set({ perSec: keys(RESOURCE_META).reduce((a,k)=>(a[k]=0,a),{}), totalPerSec: 0 });
  startTicker();
}

/** -------- Hunts -------- */
export function startHunt(eraId) {
  state.update((s) => {
    const active = s.hunts.missions.filter(m => !m.rewardReady).length;
    const extra  = s.research.nodes['r_multihunt'] ? 1 : 0;
    const max    = 1 + extra;
    if (active >= max) return s;

    const era = s.eras.find(e => e.id === eraId);
    if (!era || !era.unlocked) return s;

    const rar = rollRarity();
    const timeMult = s.research.nodes['r_fast_hunts'] ? 0.8 : 1;
    const end = Date.now() + rar.hours * 3600 * 1000 * timeMult;

    s.hunts.missions.push({
      id: s.hunts.nextId++,
      eraId,
      rarity: rar.id,
      bonus: rar.bonus,
      endTime: end,
      rewardReady: false
    });
    return s;
  });
}

export function claimHunt(id) {
  state.update((s) => {
    const idx = s.hunts.missions.findIndex(m => m.id === id && m.rewardReady);
    if (idx === -1) return s;
    const m = s.hunts.missions[idx];

    // +bonus to global artifact multiplier; 10% extra if we add a later research
    const mult = 1 + (s.research.nodes['r_excavation'] ? 0.10 : 0);
    const gain = m.bonus * mult;

    s.artifactBonus = (s.artifactBonus || 0) + gain;
    s.hunts.log.unshift({ when: Date.now(), rarity: m.rarity, bonus: gain, eraId: m.eraId });

    s.hunts.missions.splice(idx, 1);
    return s;
  });
  recalcRates();
}

/** -------- Research -------- */
function canAffordResearch(s, node){
  const costs = node.cost || [];
  if (!costs.length) return true;
  return costs.every(c => (s.resources[c.resource]?.amount ?? 0) >= c.amount);
}
export function buyResearch(id){
  state.update((s) => {
    const n = RESEARCH_V6.find(x => x.id === id);
    if (!n || s.research.nodes[id]) return s;
    if (!canAffordResearch(s, n)) return s;
    for (const c of n.cost) s.resources[c.resource].amount -= c.amount;
    s.research.nodes[id] = true;
    return s;
  });
  recalcRates();
}
export function chooseEraFocus(eraId){
  state.update((s) => { s.research.chosenEra = eraId; return s; });
  recalcRates();
}

/** -------- Prestige (Insights) -------- */
export function previewInsightGain(){
  const s = get(state);
  // Simple: base on lifetime Chrono produced; approximate via current Chrono owned * 2
  // (Replace with a true tracker later if desired)
  const lifetimeChrono = (s.resources.chrono?.amount ?? 0) * 2;
  return Math.floor(lifetimeChrono / 1_000_000); // 1M Chrono → 1 Insight (tunable)
}
export function doPrestige(){
  state.update((s) => {
    const gain = previewInsightGain();
    if (gain <= 0) return s;

    s.insights = (s.insights || 0) + gain;

    // Reset everything except Time Hub unlocked + research ownership? (we reset research for now)
    const keepEraId = 'time-hub';
    for (const e of s.eras) {
      e.unlocked = (e.id === keepEraId);
      e.completed = false;
      for (const u of e.upgrades) u.purchased = false;
    }
    for (const k of keys(s.resources)) s.resources[k].amount = 0;
    s.artifactBonus = 0;
    s.hunts = { slots: 1, missions: [], nextId: 1, log: [] };
    s.research = { nodes: {}, chosenEra: null };
    s.transient.offlineReport = null;

    s.lastTick = Date.now();
    return s;
  });
  recalcRates();
  save(get(state));
}
