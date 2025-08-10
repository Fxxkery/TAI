<script>
  import { onMount } from 'svelte';
  import { state, rate, startTicker } from './lib/stores';
  import ResourcePanel from './components/ResourcePanel.svelte';
  import EraList from './components/EraList.svelte';

  onMount(() => startTicker());
</script>

<style>
  :global(html, body) { height: 100%; }
  :global(body) {
    margin: 0;
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: var(--fg);
  }

  :root{
    --bg: #0d0f14;
    --panel: #121522;
    --panel-2:#0f1320;
    --border:#23283a;
    --fg:#e9eaf2;
    --muted:#a7acc2;
    --accent:#6d68ff;
    --accent-2:#3b82f6;
    --ok:#1db954;
    --warn:#f59e0b;
    --bad:#ef4444;
    --chip:#1e2233;
  }

  header {
    position: sticky; top: 0; z-index: 5;
    display:flex; align-items:center; justify-content:space-between;
    padding: 12px 18px;
    background: linear-gradient(180deg, #111528 0%, #0e1221 100%);
    border-bottom: 1px solid var(--border);
  }
  .title { font-weight: 700; letter-spacing:.3px }
  .muted { color: var(--muted); font-size: 12px; }

  .wrap {
    padding: 16px;
  }
  .grid {
    display:grid; gap:16px;
    grid-template-columns: 320px 1fr;
  }
  .card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
  }
  .card > .inner { padding: 14px; }

  .hdr {
    display:flex; align-items:center; justify-content:space-between;
    padding: 10px 14px;
    background: var(--panel-2);
    border-bottom: 1px solid var(--border);
    font-weight: 600;
  }
</style>

<header>
  <div class="title">Temporal Agency Idle — Phase 6</div>
  <div class="muted">total +/s: {$rate.totalPerSec.toFixed(2)}</div>
</header>

<div class="wrap">
  <div class="grid">
    <div class="card">
      <div class="hdr">Resources</div>
      <div class="inner">
        <ResourcePanel />
      </div>
    </div>

    <div class="card">
      <div class="hdr">Eras & Upgrades</div>
      <div class="inner">
        <EraList />
      </div>
    </div>
  </div>
</div>
