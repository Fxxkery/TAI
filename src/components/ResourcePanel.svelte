<script>
  import { state } from '../lib/stores';
  import { RESOURCE_META } from '../lib/data/eras';

  const fmt = (n) => {
    if (n == null) return '0';
    if (n >= 1_000_000_000) return (n/1_000_000_000).toFixed(2)+'B';
    if (n >= 1_000_000) return (n/1_000_000).toFixed(2)+'M';
    if (n >= 1_000) return (n/1_000).toFixed(2)+'K';
    return Number(n).toFixed(2);
  };

  const label = (k) => RESOURCE_META[k]?.label ?? k.replace(/-/g,' ');
  const icon  = (k) => RESOURCE_META[k]?.icon ?? '';
</script>

<style>
  .row {
    display:flex; align-items:center; justify-content:space-between;
    padding: 8px 0; border-bottom: 1px dashed var(--border);
  }
  .row:last-child { border-bottom: 0; }
  .l { display:flex; gap:8px; align-items:center; }
  .name { min-width: 170px; text-transform: capitalize; }
  .muted { color: var(--muted); font-size: 12px; }
  .dim { opacity:.55 }
</style>

{#each Object.keys($state.resources) as k}
  {#if $state.resources[k]}
    <div class="row">
      <div class="l">
        <div class="dim">{icon(k)}</div>
        <div class="name">{label(k)}</div>
      </div>
      <div class="muted">+{fmt($state.resources[k].perSec)}/s</div>
      <div>{fmt($state.resources[k].amount)}</div>
    </div>
  {/if}
{/each}
