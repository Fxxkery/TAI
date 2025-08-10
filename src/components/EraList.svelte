<script>
  import { state, buyUpgrade, advanceEra } from '../lib/stores';

  const fmt = (n) => {
    if (n == null) return '0';
    if (n >= 1_000_000_000) return (n/1_000_000_000).toFixed(2)+'B';
    if (n >= 1_000_000) return (n/1_000_000).toFixed(2)+'M';
    if (n >= 1_000) return (n/1_000).toFixed(2)+'K';
    return Number(n).toFixed(2);
  };
  const label = (k) => k?.replace(/-/g, ' ') ?? '';
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
  .era { border: 1px solid var(--border); border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
  .head {
    display:flex; align-items:center; justify-content:space-between;
    background: var(--panel-2); padding:10px 12px; border-bottom: 1px solid var(--border);
  }
  .id { color: var(--muted); font-size: 12px; margin-left: 6px; }
  .inner { padding: 10px 12px; }
  .pill { font-size:11px; padding:2px 8px; border-radius:999px; border:1px solid var(--border); background: var(--chip); }
  .ok { color:#7dffa7; border-color:#214a2f; background:#122018; }
  .locked { color:#cbd5e1; }
  .row { display:flex; align-items:center; gap:10px; }
  .muted { color: var(--muted); font-size: 12px; }
  .btn {
    background:#232842; color: var(--fg); border:1px solid #33416a;
    padding:6px 10px; border-radius:8px; cursor:pointer;
  }
  .btn.primary { background: var(--accent); border-color:#7e7aff; }
  .btn:disabled { opacity:.5; cursor:not-allowed; }
  .upg { display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px dashed var(--border); }
  .upg:last-child { border-bottom:0; }
</style>

{#each $state.eras as era (era.id)}
  <div class="era">
    <div class="head">
      <div>
        <strong>{era.name}</strong>
        <span class="id">({era.id})</span>
      </div>

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
    </div>

    {#if era.unlocked && era.upgrades?.length}
      <div class="inner">
        <div class="muted" style="margin-bottom:6px;">Upgrades</div>
        {#each era.upgrades as upg (upg.id)}
          <div class="upg">
            <div>
              <div>{upg.name}</div>
              <div class="muted">{costText(upg.cost)}</div>
            </div>
            {#if upg.purchased}
              <span class="pill ok">Purchased</span>
            {:else}
              <button class="btn" disabled={!canAfford(upg.cost)} on:click={() => buyUpgrade(era.id, upg.id)}>Buy</button>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/each}
