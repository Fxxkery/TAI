<script>
  import './app.css';
  import { onMount } from 'svelte';
  import {
    state, rate, startTicker, buyUpgrade, advanceEra, hardReset,
    // v6 systems:
    startHunt, claimHunt,
    buyResearch, chooseEraFocus, RESEARCH_V6,
    previewInsightGain, doPrestige
  } from './lib/stores';

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

  // UI state
  let showResources = true;
  let showMenu = false;
  let showHunts = false;
  let showResearch = false;
  let showPrestige = false;

  const toggleResources = () => (showResources = !showResources);
  const toggleMenu = () => (showMenu = !showMenu);
  const toggleHunts = () => { showHunts = !showHunts; showResearch = false; showMenu = false; };
  const toggleResearch = () => { showResearch = !showResearch; showHunts = false; showMenu = false; };
  const togglePrestige = () => { showPrestige = !showPrestige; showHunts = false; showResearch = false; showMenu = false; };
  
  // v6 handlers
  const handleStartHunt   = (eraId) => startHunt(eraId);
  const handleClaimHunt   = (id)    => claimHunt(id);
  const handleBuyResearch = (id)    => buyResearch(id);
  const handleChooseFocus = (id)    => chooseEraFocus(id);
  const handleDoPrestige  = ()      => doPrestige();


  const closeAllPopovers = () => { showMenu=false; showHunts=false; showResearch=false; };
</script>

<!-- Banner -->
<section class="banner" on:keydown={(e)=> e.key==='Escape' && closeAllPopovers()}>
  <div class="banner-inner">
    <h1 class="brand">TEMPORAL REPAIR AGENCY</h1>

    <div class="top-pills">
      <div class="stat-pill tva">+{$rate.totalPerSec.toFixed(2)}/s</div>
      <div class="stat-pill">Insights: {$state.insights}</div>
      <div class="stat-pill">Unlocked: {$state.eras.filter(e=>e.unlocked).length}</div>
    </div>

    <!-- Era Resources moved LEFT of Hunts/Research -->
    <div class="top-actions">
      <button class="btn olive-pill" on:click={toggleResources}>
        Era Resources {showResources ? '›' : '‹'}
      </button>
      <button class="btn olive-pill" on:click={toggleHunts}>Hunts</button>
      <button class="btn olive-pill" on:click={toggleResearch}>Research</button>
      <button class="btn olive-pill" on:click={togglePrestige}>Prestige</button>
    </div>

    <!-- Right side: Menu pill -->
    <div class="banner-right">
      <button class="btn menu-pill" on:click={toggleMenu}>Menu</button>
    </div>
  </div>
</section>

<div class="wrap">
  {#if showResources}
    <!-- Resource chips strip (aligned) -->
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

<!-- Popovers -->
{#if showMenu}
  <div class="backdrop" on:click={closeAllPopovers}></div>
  <div class="popover pop-menu">
    <div class="pop-title">Menu</div>
    <button class="btn ghost" on:click={() => showResources = !showResources}>
      Toggle Era Resources
    </button>
    <button class="btn ghost" on:click={hardReset}>Hard Reset</button>
    <div class="muted" style="margin-top:8px;">(Save/Load coming soon)</div>
  </div>
{/if}

{#if showHunts}
  <div class="backdrop" on:click={closeAllPopovers}></div>
  <div class="popover pop-hunts">
    <div class="pop-title">Hunts</div>
    <p class="muted">Start a timed hunt in an unlocked era. When it finishes, claim it to gain a permanent artifact bonus.</p>

    <div class="row wrap gap">
      {#each $state.eras.filter(e => e.unlocked) as e}
        <button class="btn" on:click={() => handleStartHunt(e.id)}>Start in {e.name}</button>
      {/each}
    </div>

    <div class="section-title">Active Hunts</div>
    {#if $state.hunts.missions.length === 0}
      <div class="muted">No hunts in progress.</div>
    {:else}
      <ul class="list">
        {#each $state.hunts.missions as m}
          <li class="row between">
            <div>
              #{m.id} • {m.rarity} • ends at {new Date(m.endTime).toLocaleTimeString()}
              {#if m.rewardReady}<span class="badge success">Ready</span>{/if}
            </div>
            <button class="btn" disabled={!m.rewardReady} on:click={() => handleClaimHunt(m.id)}>
              {m.rewardReady ? 'Claim' : 'Pending'}
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    <div class="hint">Artifact bonus: {($state.artifactBonus * 100).toFixed(2)}%</div>
  </div>
{/if}

{#if showResearch}
  <div class="backdrop" on:click={closeAllPopovers}></div>
  <div class="popover pop-research">
    <div class="pop-title">Research</div>

    <ul class="list">
      {#each RESEARCH_V6 as r}
        <li>
          <div class="row between">
            <div>
              <strong>{r.name}</strong>
              <div class="muted">{r.desc}</div>
              <div class="costs">
                {#each r.cost as c}
                  <span class="chip">{c.amount} {c.resource}</span>
                {/each}
              </div>
            </div>
            <button class="btn"
                    disabled={$state.research.nodes[r.id]}
                    on:click={() => handleBuyResearch(r.id)}>
              {$state.research.nodes[r.id] ? 'Purchased' : 'Buy'}
            </button>
          </div>
        </li>
      {/each}
    </ul>

    <div class="section-title">Era Focus (+20%)</div>
    <div class="row">
      <select on:change={(e) => handleChooseFocus(e.target.value)}>
        <option value=''>— none —</option>
        {#each $state.eras.filter(e => e.unlocked) as e}
          <option value={e.id} selected={$state.research.chosenEra === e.id}>{e.name}</option>
        {/each}
      </select>
    </div>
  </div>
{/if}

{#if showPrestige}
  <div class="backdrop" on:click={closeAllPopovers}></div>
  <div class="popover pop-prestige">
    <div class="pop-title">Prestige</div>
    <p>Convert progress into <strong>Insights</strong> that permanently boost all production by +5% each.</p>
    <div class="row between">
      <div>Projected Insights: {previewInsightGain()}</div>
      <button class="btn danger" on:click={handleDoPrestige}>Prestige Now</button>
    </div>
    <div class="hint">Current Insights: {$state.insights}</div>
  </div>
{/if}
