<script>
  import './app.css';
  import { onMount } from 'svelte';
  import { state, rate, startTicker, buyUpgrade, advanceEra } from './lib/stores';
  import { RESOURCE_META } from './lib/data/eras';

  onMount(() => startTicker());

  // --- helpers ---
  const fmt = (n) => {
    if (n == null) return '0';
    const num = Number(n) || 0;
    if (num >= 1_000_000_000) return (num/1_000_000_000).toFixed(2) + 'B';
    if (num >= 1_000_000)     return (num/1_000_000).toFixed(2) + 'M';
    if (num >= 1_000)         return (num/1_000).toFixed(2) + 'K';
    return num.toFixed(2);
  };
  const label = (k) => RESOURCE_META[k]?.label ?? (k || '').replace(/-/g, ' ');
  const icon  = (k) => RESOURCE_META[k]?.icon ?? '•';

  const costText = (cost) => {
    if (!cost || cost.length === 0) return 'Free';
    const arr = Array.isArray(cost) ? cost : [cost];
    return arr.map(c => `${fmt(c.amount)} ${label(c.resource)}`).join(' + ');
  };
  const canAfford = (cost) => {
    if (!cost || cost.length === 0) return true;
    const arr = Array.isArray(cost) ? cost : [cost];
    return arr.every(c => (($state.resources[c.resource]?.amount) ?? 0) >= c.amount);
  };

  // which resources belong to unlocked eras (for greying out)
  const unlockedResourceSet = () => {
    const a = new Set();
    for (const era of $state.eras) if (era.unlocked) {
      for (const r of era.resources?.primary ?? []) a.add(r);
      for (const r of era.resources?.secondary ?? []) a.add(r);
    }
    return a;
  };
</script>

<header class="header">
  <div class="title">Temporal Agency Idle — Phase 6</div>
  <div class="muted">total +/s: {$rate.totalPerSec.toFixed(2)}</div>
</header>

<div class="wrap">
  <div class="grid">
    <!-- LEFT: Resources -->
    <div class="card">
      <div class="hdr">Resources</div>
      <div class="inner">
        {#each Object.keys($state.resources) as k}
          <div class="list-row {unlockedResourceSet().has(k) ? '' : 'locked'}">
            <div class="name"><span class="res-icon muted">{icon(k)}</span> {label(k)}</div>
            <div class="muted">+{fmt($state.resources[k].perSec)}/s</div>
            <div>{fmt($state.resources[k].amount)}</div>
          </div>
        {/each}
      </div>
    </div>

    <!-- RIGHT: Eras & Upgrades -->
    <div class="card">
      <div class="hdr">Eras & Upgrades</div>
      <div class="inner">
        {#each $state.eras as era (era.id)}
          <article class="era-card" style="margin-bottom:12px;">
            <header class="era-head">
              <div class="era-title">{era.name} <span class="muted">({era.id})</span></div>
              {#if era.unlocked}
                <span class="pill ok">Unlocked</span>
              {:else}
                <div class="row">
                  <span class="muted">Cost: {costText(era.unlockCost)}</span>
                  <button class="btn primary" disabled={!canAfford(era.unlockCost)} on:click={() => advanceEra(era.id)}>
                    Advance Era
                  </button>
                </div>
              {/if}
            </header>

            {#if era.unlocked && era.upgrades?.length}
              <div class="inner">
                <div class="muted" style="margin-bottom:6px;">Upgrades</div>
                {#each era.upgrades as upg (upg.id)}
                  <div class="upg-row">
                    <div>
                      <div>{upg.name}</div>
                      <div class="muted">{costText(upg.cost)}</div>
                    </div>
                    {#if upg.purchased}
                      <span class="pill ok">Purchased</span>
                    {:else}
                      <button class="btn" disabled={!canAfford(upg.cost)} on:click={() => buyUpgrade(era.id, upg.id)}>
                        Buy
                      </button>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </article>
        {/each}
      </div>
    </div>
  </div>
</div>
