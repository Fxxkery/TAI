<script>
  import './app.css';
  import { onMount } from 'svelte';
  import { state, rate, startTicker, buyUpgrade, advanceEra } from './lib/stores';
  import { RESOURCE_META } from './lib/data/eras';

  onMount(() => startTicker());

  // ---- helpers ----
  const fmt = (n) => {
    if (n == null) return '0';
    const num = Number(n) || 0;
    if (num >= 1_000_000_000) return (num/1_000_000_000).toFixed(2) + 'B';
    if (num >= 1_000_000)     return (num/1_000_000).toFixed(2) + 'M';
    if (num >= 1_000)         return (num/1_000).toFixed(2) + 'K';
    return num.toFixed(2);
  };
  const label = (k) => RESOURCE_META[k]?.label ?? (k||'').replace(/-/g,' ');
  const costText = (cost) => {
    if (!cost || cost.length === 0) return 'Free';
    const arr = Array.isArray(cost) ? cost : [cost];
    return arr.map(c => `${fmt(c.amount)} ${label(c.resource)}`).join(' • ');
  };
  const canAfford = (cost) => {
    if (!cost || cost.length === 0) return true;
    const arr = Array.isArray(cost) ? cost : [cost];
    return arr.every(c => (($state.resources[c.resource]?.amount) ?? 0) >= c.amount);
  };
  const nextUpgrade = (era) => (era.upgrades ?? []).find(u => !u.purchased);

  let showResources = true; // toggled by "Era Resources" pill
</script>

<!-- Banner / Title -->
<section class="banner">
  <div class="banner-inner">
    <h1 class="brand">TEMPORAL REPAIR AGENCY</h1>

    <div class="top-pills">
      <div class="stat-pill tva">+{$rate.totalPerSec.toFixed(2)}/s</div>
      <div class="stat-pill">Insights: 0</div>
      <div class="stat-pill">Unlocked: {$state.eras.filter(e=>e.unlocked).length}</div>
    </div>

    <div class="top-actions">
      <button class="btn olive-pill">Hunts</button>
      <button class="btn olive-pill">Research</button>
    </div>

    <div class="banner-right">
      <button class="btn olive-link" on:click={() => showResources = !showResources}>
        Era Resources {showResources ? '›' : '‹'}
      </button>
      <button class="btn menu-pill">Menu</button>
    </div>
  </div>
</section>

<div class="wrap">
  {#if showResources}
    <!-- Resource chips strip -->
    <div class="resources-strip card">
      {#each Object.keys($state.resources) as k}
        <div class="res-chip {($state.resources[k].perSec ?? 0) <= 0 ? 'dim' : ''}">
          <span class="dot"></span>
          <span class="res-name">{label(k)}</span>
          <span class="res-rate">+{fmt($state.resources[k].perSec)}/s</span>
          <span class="res-amt">{fmt($state.resources[k].amount)}</span>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Horizontal era strip -->
  <div class="era-strip card">
    <div class="era-track">
      {#each $state.eras as e (e.id)}
        <article class="era-card era-card--strip">
          <header class="era-card-head">
            <div class="era-title">{e.name}</div>
            {#if e.unlocked}
              <span class="pill ok">Unlocked</span>
            {:else}
              <span class="pill">Locked</span>
            {/if}
          </header>

          <div class="era-cta">
            {#if !e.unlocked}
              <button
                class="btn primary big"
                disabled={!canAfford(e.unlockCost)}
                on:click={() => advanceEra(e.id)}
              >
                Unlock ({costText(e.unlockCost)})
              </button>
            {:else if nextUpgrade(e)}
              <button
                class="btn primary big"
                disabled={!canAfford(nextUpgrade(e).cost)}
                on:click={() => buyUpgrade(e.id, nextUpgrade(e).id)}
              >
                {nextUpgrade(e).name} ({costText(nextUpgrade(e).cost)})
              </button>
            {:else}
              <button class="btn ghost big" disabled>All upgrades owned</button>
            {/if}
          </div>

          {#if e.unlocked && e.upgrades?.length}
            <div class="era-upgrades">
              <div class="upg-head">Upgrades</div>
              {#each e.upgrades as u (u.id)}
                <div class="upg-row">
                  <div class="upg-text">
                    <div class="upg-title">{u.name}</div>
                    <div class="muted">{costText(u.cost)}</div>
                  </div>
                  {#if u.purchased}
                    <span class="pill ok">Owned</span>
                  {:else}
                    <button class="btn ghost" disabled={!canAfford(u.cost)} on:click={() => buyUpgrade(e.id, u.id)}>Buy</button>
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
