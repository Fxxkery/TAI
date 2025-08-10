<script>
  import { onMount } from 'svelte';
  import { state, rate, startTicker, buyUpgrade, advanceEra } from './lib/stores';

  // Svelte will auto-subscribe: you can use $state and $rate directly in markup or JS.
  onMount(() => {
    startTicker();
  });

  // ---- helpers for UI ----
  const fmt = (n) => {
    if (n == null) return '0';
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
    return Number(n).toFixed(2);
  };

  const label = (key) => key?.replace(/-/g, ' ') ?? '';

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
</script>


<style>
  :global(body) {
    margin: 0;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    background: #0f0f14;
    color: #e7e7ea;
  }
  header {
    position: sticky; top: 0; z-index: 5;
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px;
    background: #1b1b23;
    border-bottom: 1px solid #2a2a35;
  }
  .title { font-weight: 700; letter-spacing: 0.5px; }
  .grid {
    display: grid; gap: 16px; padding: 16px;
    grid-template-columns: 320px 1fr;
  }
  .card {
    background: #171721;
    border: 1px solid #2a2a35;
    border-radius: 12px;
    padding: 12px;
  }
  h2,h3 { margin: 8px 0 6px; }
  .resource-row, .upgrade-row, .era-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px; padding: 6px 0; border-bottom: 1px dashed #242433;
  }
  .resource-row:last-child, .upgrade-row:last-child, .era-head:last-child { border-bottom: 0; }
  .muted { color: #a7a7b3; font-size: 12px; }
  button {
    background: #2a2a35; color: #e7e7ea; border: 1px solid #3a3a4a;
    padding: 6px 10px; border-radius: 8px; cursor: pointer;
  }
  button.primary { background: #5a55ff; border-color: #6d68ff; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  .pill { font-size: 11px; padding: 2px 6px; border-radius: 999px; border: 1px solid #2a2a35; }
  .ok { color: #7dffa7; border-color: #214a2f; background: #122018; }
  .no { color: #ffb0b0; border-color: #4a2121; background: #201212; }
  .row { display:flex; gap:8px; align-items:center; }
  .era-block { margin-bottom: 14px; }
</style>

<header>
  <div class="title">Temporal Agency Idle — Phase 6</div>
  <div class="muted">total +/s: {fmt($rate.totalPerSec)}</div>
</header>

<div class="grid">
  <!-- LEFT: Resources -->
  <div class="card">
    <h2>Resources</h2>
    {#if $state}
      {#each Object.keys($state.resources) as k}
        <div class="resource-row">
          <div class="row">
            <div style="min-width: 160px; text-transform: capitalize;">{label(k)}</div>
          </div>
          <div class="muted">+{fmt($state.resources[k].perSec)}/s</div>
          <div>{fmt($state.resources[k].amount)}</div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- RIGHT: Eras & Upgrades -->
  <div class="card">
    <h2>Eras</h2>

    {#each $state.eras as era (era.id)}
      <div class="era-block">
        <div class="era-head">
          <div><strong>{era.name}</strong> <span class="muted">({era.id})</span></div>
          {#if era.unlocked}
            <span class="pill ok">Unlocked</span>
          {:else}
            <div class="row">
              <span class="muted">Cost: {costText(era.unlockCost)}</span>
              <button
                class="primary"
                disabled={!canAfford(era.unlockCost)}
                on:click={() => advanceEra(era.id)}
              >
                Advance Era
              </button>
            </div>
          {/if}
        </div>

        {#if era.unlocked && era.upgrades && era.upgrades.length}
          <h3>Upgrades</h3>
          {#each era.upgrades as upg (upg.id)}
            <div class="upgrade-row">
              <div>
                <div>{upg.name}</div>
                <div class="muted">{costText(upg.cost)}</div>
              </div>
              <div class="row">
                {#if upg.purchased}
                  <span class="pill ok">Purchased</span>
                {:else}
                  <button
                    disabled={!canAfford(upg.cost)}
                    on:click={() => buyUpgrade(era.id, upg.id)}
                  >
                    Buy
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    {/each}
  </div>
</div>
