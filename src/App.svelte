<script>
  import { onMount } from 'svelte'
  import {
    state, rate,
    unlockEra, buyAgent, buyUpgrade,
    RESEARCH, buyResearch, chooseEraFocus, agentCost, // added
    startHunt, claimHunt, toggleDevPanel, exportSave, importSave, startTicker
  } from './lib/stores.js'

  let showPanel = 'none' // 'hunts' | 'research' | 'none'
  let eraMenu = false
  let menuOpen = false
  let statsOpen = false
  let showTooltips = true
  let exportText = ''; // needed by the menu's Export Save

  function forceSave(){
    let snap; state.update(s => (snap = s, s));
    localStorage.setItem('tra_idle_save_v5_js', JSON.stringify(snap));
  }

  function onImport(e){
    const f = e.target.files?.[0]; if(!f) return;
    const rd = new FileReader();
    rd.onload = () => { try { importSave(rd.result); window.location.reload(); } catch {} };
    rd.readAsText(f);
  }

  onMount(() => {
    startTicker();
    // ticker is already started in user's stores.js on load; if not, toggleDevPanel
  });

  // helpers
  function fmt(n){ 
    if(n===undefined||n===null) return '0'; 
    const s = $state?.formatShort; 
    const num = Number(n)||0; 
    if(!s) return num.toLocaleString(); 
    const k=['','K','M','B','T']; 
    let i=0, v=num; 
    while(v>=1000 && i<k.length-1){ v/=1000; i++ } 
    return (i? v.toFixed(2):Math.floor(v)).toLocaleString()+k[i] 
  }
  
  const eraName = (e) => e?.name || '—'

  // added: resPerSec helper
  function resPerSec(e){
    return (e?.resourceRatePerAgent || 0) * (e?.agentsOwned || 0) * ($state?.boost || 1)
  }
</script>

<!-- Top bar -->
<header class="tva-topbar">
  <div class="topbar-left">
    <div class="pill pill-primary">CE <b>{fmt($state?.ce)}</b> <span class="rate">(+{fmt($rate)}/s)</span></div>
    <div class="pill">Insights: <b>{fmt($state?.insights||0)}</b></div>
    <div class="pill">Unlocked: <b>{$state?.unlockedCount||1}</b></div>
  </div>

  <div class="topbar-right">
    <div class="main-menu">
      <button class="btn secondary small" on:click={()=> menuOpen = !menuOpen} aria-expanded={menuOpen}>☰ Menu</button>
      {#if menuOpen}
        <div class="dropdown-panel">
          <div class="section">Save / Load</div>
          <button class="btn" on:click={()=>forceSave()}>Save Now</button>
          <button class="btn" on:click={()=>window.location.reload()}>Load (Reload)</button>
          <hr/>
          <div class="section">Settings</div>
          <label class="row"><input type="checkbox" bind:checked={showTooltips}> <span>Tooltips</span></label>
          <hr/>
          <div class="section">Stats</div>
          <button class="btn" on:click={()=>{ statsOpen = true; menuOpen = false; }}>Open Stats</button>
          <hr/>
          <div class="section">Developer</div>
          <button class="btn" on:click={toggleDevPanel}>Toggle Dev Tools</button>
          <hr/>
          <div class="section">Data</div>
          <button class="btn" on:click={()=> exportText = exportSave()}>Export Save</button>
          <label class="row">
            <span class="btn">Import Save</span>
            <input class="file" type="file" accept=".json,application/json" on:change={onImport}/>
          </label>
          <div class="muted small">v{$state?.version || 5}</div>
        </div>
      {/if}
    </div>
  </div>
</header>

<!-- Toggle buttons -->
<nav class="tva-togglebar">
  <div class="left">
  <button class="btn secondary" aria-pressed={showPanel==='hunts'} on:click={()=> showPanel = (showPanel==='hunts'?'none':'hunts')}>Hunts</button>
  <button class="btn secondary" aria-pressed={showPanel==='research'} on:click={()=> showPanel = (showPanel==='research'?'none':'research')}>Research</button>
<div class="left-end">
      <div class="inline-dropdown" on:mouseleave={()=> eraMenu=false}>
        <button class="btn secondary" on:click={()=> eraMenu=!eraMenu} aria-expanded={eraMenu}>Era Resources ▾</button>
        {#if eraMenu}
          <div class="dropdown-panel narrow">
            {#each $state?.eras as e}
              <div class="row between"><span>{e.name}</span><span class="mono">{fmt(e.resource)}</span></div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
</nav>

<!-- Middle panel: Hunts or Research -->
<main class="tva-main">
  {#if showPanel==='hunts'}
    <section class="panel card">
      <h3>Active Hunts</h3>
      {#if $state.hunts.missions.length === 0}
        <div class="muted">No active hunts. Start one from an unlocked era card.</div>
      {/if}
      <div class="hunt-list">
        {#each $state.hunts.missions as m (m.id)}
          <div class="hunt-row">
            <div class="tag">ID #{m.id}</div>
            <div>Era: {eraName($state.eras[m.eraId])}</div>
            <div>Rarity: <b>{m.rarity}</b></div>
            <div>Ends: {new Date(m.endTime).toLocaleString()}</div>
            {#if m.rewardReady}
              <button class="btn primary" on:click={()=>claimHunt(m.id)}>Claim</button>
            {:else}
              <button class="btn muted" disabled>In progress</button>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {:else if showPanel==='research'}
    <section class="panel card">
      <h3>Research</h3>
      <div class="research-grid">
        {#each RESEARCH as n (n.id)}
          <div class="card node">
            <div class="title">{n.name}</div>
            <div class="desc">{n.desc}</div>
            <div class="costs">
              {#if n.cost.ce}<span class="cost">CE: {fmt(n.cost.ce)}</span>{/if}
              {#if n.cost.relics}<span class="cost">Relics: {fmt(n.cost.relics)}</span>{/if}
              {#if n.cost.scrolls}<span class="cost">Scrolls: {fmt(n.cost.scrolls)}</span>{/if}
              {#if n.cost.manuscripts}<span class="cost">Manuscripts: {fmt(n.cost.manuscripts)}</span>{/if}
              {#if n.cost.cogworks}<span class="cost">Cogworks: {fmt(n.cost.cogworks)}</span>{/if}
              {#if n.cost.insight}<span class="cost">Insight: {fmt(n.cost.insight)}</span>{/if}
            </div>
            <button class="btn secondary" on:click={()=>buyResearch(n.id)} disabled={$state.research.nodes[n.id]}>{$state.research.nodes[n.id] ? 'Purchased' : 'Buy'}</button>
          </div>
        {/each}
      </div>
    </section>
  {:else}
    <section class="panel bg-only">
      <div class="timeline-bg">
        <div class="rings"></div>
        <div class="rune a"></div>
        <div class="rune b"></div>
        <div class="rune c"></div>
        <div class="bg-caption muted">Select <b>Hunts</b> or <b>Research</b> to view here.</div>
      </div>
    </section>
  {/if}
</main>
{#if statsOpen}
  <div
    class="overlay"
    role="button"
    tabindex="0"
    aria-label="Close stats overlay"
    on:click={() => (statsOpen = false)}
    on:keydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        statsOpen = false;
      }
    }}
  >
    <div
      class="stats-modal card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-title"
      on:click|stopPropagation
    >
      <header><h3 id="stats-title">Game Stats</h3></header>

      <section class="grid two">
        <div class="statline"><span>Total CE generated</span><b>{fmt($state?.totalEarned || 0)}</b></div>
        <div class="statline"><span>Current CE</span><b>{fmt($state?.ce || 0)}</b></div>
        <div class="statline"><span>Insights</span><b>{fmt($state?.insights || 0)}</b></div>
        <div class="statline"><span>Prestiges</span><b>—</b></div>
      </section>

      <section>
        <h4>Era Resources</h4>
        <div class="grid two">
          {#each $state?.eras as e}
            <div class="statline"><span>{e.name}</span><b>{fmt(e.resource)}</b></div>
          {/each}
        </div>
      </section>

      <section class="grid two">
        <div class="statline"><span>Total Agents Hired</span><b>{$state?.eras?.reduce((a,e)=>a+(e.agentsOwned||0),0)}</b></div>
        <div class="statline"><span>Upgrades Purchased</span><b>{$state?.eras?.reduce((a,e)=>a+(e.upgrades?.filter(u=>u.purchased).length||0),0)}</b></div>
      </section>

      <footer class="actions">
        <button class="btn primary" on:click={() => (statsOpen = false)}>Close</button>
      </footer>
    </div>
  </div>
{/if}


<!-- Bottom scrollable era cards -->
<section class="era-row-wrap">
  <div class="era-row">
    {#each $state.eras as e (e.id)}
      <article class="era-card card">
        <header class="era-head">
          <div class="era-title">{eraName(e)}</div>
          <div class="pill">{fmt(e.resource)}</div>
        </header>

        <div class="era-body">{#if e.unlocked}
          <div class="stat">Agents: <b>{e.agentsOwned}</b></div>
          <div class="substat muted">+{fmt(resPerSec(e))}/sec</div>
          <div class="agent-label">{e.agentName ? `Buy ${e.agentName}` : "Hire Agent"}</div>
          <button class="btn primary buy" on:click={()=>buyAgent(e.id)} disabled={!e.unlocked}>{fmt(agentCost(e.agentBaseCost, e.agentsOwned))} CE</button>
        {:else}
          <button class="btn primary unlock-full" on:click={()=>unlockEra(e.id)}>Unlock ({fmt(e.unlockCost)} CE)</button>
        {/if}

        {#if e.upgrades?.length}
        <div class="era-upgrades">
          <div class="upg-title">Upgrades</div>
          {#each e.upgrades as u (u.id)}
            <div class="upg-row">
  <div class="upg-text">
    <div class="upg-title">{(u.name.split('(')[0] || u.name).trim()}</div>
    {#if u.name.includes('(')}
      <div class="upg-desc">({u.name.slice(u.name.indexOf('(')+1, -1)})</div>
    {/if}
  </div>
  <div class="upg-costs">
    {#if u.cost.ce}<span class="cost">CE: {fmt(u.cost.ce)}</span>{/if}
    {#if u.cost.resource}<span class="cost">Res: {fmt(u.cost.resource)}</span>{/if}
  </div>
  <button class="btn secondary" on:click={()=>buyUpgrade(e.id, u.id)} disabled={u.purchased || !e.unlocked}>{u.purchased ? 'Owned' : 'Buy'}</button>
</div>
          {/each}
        </div>
        {/if}
      </article>
    {/each}
  </div>
</section>



<style>
  .tva-topbar{
    position:sticky; top:0; z-index:5;
    display:flex; align-items:center; justify-content:space-between;
    padding:12px 18px; background:var(--tva-tan);
    border-bottom:2px solid var(--line);
  }
  .topbar-left{ display:flex; gap:10px; align-items:center }
  .topbar-right{ display:flex; align-items:center; gap:10px }
  .pill{ border-radius:999px; padding:8px 12px; border:2px solid var(--line); background:#fff5 }
  .pill-primary{ background:var(--tva-orange); color:#fff; border-color:#a95f1b }
  .pill-secondary{ background:var(--tva-teal); color:#fff; border-color:#345b57 }

  .dropdown{ position:relative }
  .dropdown .menu{
    position:absolute; right:0; top:110%; width:360px;
    background:#fff; border:2px solid var(--line); border-radius:12px;
    padding:8px; display:none; box-shadow:0 8px 24px rgba(0,0,0,.15);
  }
  .dropdown:hover .menu{ display:block }
  .menu-row{ display:flex; justify-content:space-between; padding:8px 10px; border-radius:8px }
  .menu-row:hover{ background:#f1e8d7 }
  .tag{ font-weight:600 }
  .mono{ font-variant-numeric: tabular-nums }

  .tva-togglebar{
    display:flex; gap:10px; padding:10px 18px; border-bottom:1px solid rgba(0,0,0,.15);
    background: linear-gradient(#efe5d3cc, #efe5d300);
    position:sticky; top:56px; z-index:4;
  }
  .btn{
    cursor:pointer; border-radius:12px; padding:10px 14px; border:2px solid var(--line); background:#fff;
    transition: filter .15s ease, transform .05s ease;
  }
  .btn:hover{ filter:brightness(1.03) }
  .btn:active{ transform: translateY(1px) }
  .btn.primary{ background:var(--tva-orange); color:#fff; border-color:#a95f1b }
  .btn.secondary{ background:var(--tva-olive); color:#fff; border-color:#4e5a3e }
  .btn.muted{ background:#d7c8b2; color:#756858; border-color:#b5a289 }
  .unlock-full{ width:100%; padding:14px 16px; }

  .tva-main{ padding:16px 18px; min-height:42vh }
  .panel{ padding:16px 18px; border:2px solid var(--line); border-radius:18px; background:#f8f3ea; box-shadow: inset 0 0 0 1px rgba(255,255,255,.35) }
  .panel.bg-only{ display:flex; align-items:center; justify-content:center; color:#6b5b4e }
  .muted{ color:#6b5b4e }

  .hunt-list{ display:flex; flex-direction:column; gap:10px }
  .hunt-row{ display:grid; grid-template-columns: auto 1fr auto auto auto; gap:12px; align-items:center; padding:12px; border:1px solid var(--line); border-radius:12px; background:#f8f3ea }

  .research-grid{ display:grid; grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); gap:14px }
  .node{ padding:14px }
  .node .title{ font-weight:700; margin-bottom:2px }
  .node .desc{ color:#6b5b4e; margin-bottom:8px }
  .costs{ display:flex; flex-wrap:wrap; gap:8px; margin-bottom:8px }
  .cost{ background:#efe5d3; border:1px solid var(--line); border-radius:999px; padding:2px 8px; font-size:12px }

  .era-row-wrap{ padding:14px 12px; border-top:2px solid var(--line); background: linear-gradient(#efe5d300, #efe5d3aa) }
  .era-row{ display:flex; gap:14px; overflow-x:auto; padding-bottom:12px; scroll-snap-type: x proximity; }
  .card{ background:#f8f3ea; border:2px solid var(--line); border-radius:18px; box-shadow: inset 0 0 0 1px rgba(255,255,255,.35) }
  .era-card{ min-width:280px; max-width:300px; scroll-snap-align:start; padding:14px 14px 12px 14px }
  .era-head{ display:flex; justify-content:space-between; align-items:center; margin-bottom:10px }
  .era-title{ font-weight:800 }
  .era-body{ display:flex; flex-direction:column; gap:10px }
  .era-upgrades{ margin-top:12px; border-top:1px dashed var(--line); padding-top:10px; display:flex; flex-direction:column; gap:10px }
  .upg-title{ font-weight:700 }
  .upg-desc{ color:#6b5b4e; font-size:13px }
  .upg-row{ display:grid; grid-template-columns: 1fr auto auto; gap:10px; align-items:center }
  .upg-text{ display:flex; flex-direction:column }
  .upg-costs{ display:flex; gap:8px; flex-wrap:wrap }


  /* Togglebar layout tweak */
  .tva-togglebar{ display:flex; align-items:center; justify-content:space-between }
  .tva-togglebar .left{ display:flex; gap:10px }
  .tva-togglebar .left-end{ margin-left:auto }

  /* Dropdown panels */
  .main-menu{ position:relative }
  .dropdown-panel{
    position:absolute; right:0; top:110%; min-width:280px; background:#fff;
    border:2px solid var(--line); border-radius:12px; padding:10px; box-shadow:0 8px 24px rgba(0,0,0,.15); z-index:10;
  }
  .dropdown-panel.narrow{ min-width:260px }
  .row{ display:flex; align-items:center; gap:8px; padding:4px 2px }
  .row.between{ justify-content:space-between }
  .section{ font-weight:700; color:#5a4d44; margin:6px 0 4px }
  .small{ font-size:12px }
  .btn.small{ padding:6px 10px }

  .inline-dropdown{ position:relative; display:inline-block }
  .inline-dropdown .dropdown-panel{ left:0; right:auto; top:110% }

  .file{ position:absolute; opacity:0; width:0; height:0 }

  /* Overlay Stats Modal */
  .overlay{ position:fixed; inset:0; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; z-index:20 }
  .stats-modal{ width:680px; max-width:90vw; padding:16px 18px; }
  .stats-modal header{ margin-bottom:8px }
  .grid.two{ display:grid; grid-template-columns: 1fr 1fr; gap:10px }
  .statline{ display:flex; align-items:center; justify-content:space-between; background:#efe5d3; border:1px solid var(--line); border-radius:10px; padding:8px 10px }
  .actions{ display:flex; justify-content:flex-end; margin-top:12px }


  .brand{ font-weight:800; letter-spacing:.5px; margin-right:12px }
  .stat{ margin-bottom:2px }
  .substat{ font-size:13px; margin-bottom:8px }
  .agent-label{ text-align:center; font-weight:700; margin-top:2px }
  .btn.buy{ width:100%; justify-content:center }

  .dropdown-panel{
    position:absolute; right:0; top:110%; min-width:280px; background:#fff;
    border:2px solid var(--line); border-radius:12px; padding:10px; box-shadow:0 8px 24px rgba(0,0,0,.15); z-index:10;
  }
  .dropdown-panel.narrow{ min-width:260px }
  .row{ display:flex; align-items:center; gap:8px; padding:4px 2px }
  .row.between{ justify-content:space-between }
  .mono{ font-variant-numeric: tabular-nums }
  .small{ font-size:12px }

  .overlay{ position:fixed; inset:0; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; z-index:20 }
  .stats-modal{ width:680px; max-width:90vw; padding:16px 18px; }
  .grid.two{ display:grid; grid-template-columns: 1fr 1fr; gap:10px }
  .statline{ display:flex; align-items:center; justify-content:space-between; background:#efe5d3; border:1px solid var(--line); border-radius:10px; padding:8px 10px }
  .actions{ display:flex; justify-content:flex-end; margin-top:12px }

  /* Timeline-style background */
  .panel.bg-only{ position:relative; overflow:hidden; min-height:38vh }
  .timeline-bg{ position:relative; height:100%; display:flex; align-items:center; justify-content:center }
  .rings::before, .rings::after{ content:''; position:absolute; width:70vmin; height:70vmin; border-radius:50%; border:2px solid rgba(93,79,68,.6); box-shadow: 0 0 0 2px rgba(255,255,255,.2) inset }
  .rings::after{ width:52vmin; height:52vmin; border-color: rgba(93,79,68,.4) }
  .rune{ position:absolute; width:10vmin; height:10vmin; border:2px solid rgba(93,79,68,.5); border-radius:8px; transform: rotate(12deg) }
  .rune.a{ top:18%; left:22% } .rune.b{ bottom:22%; right:24%; transform: rotate(-8deg) } .rune.c{ top:26%; right:36% }
  .bg-caption{ position:absolute; bottom:12px; text-align:center; width:100% }

  /* Card symmetry */
  .era-card{ min-width:300px; max-width:300px }
  .era-head .pill{ min-width:150px; text-align:center; justify-content:center }
</style>

