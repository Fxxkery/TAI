import { writable, derived } from 'svelte/store'

const SAVE_KEY = 'tra_idle_save_v5_js'

export const initialState = {
  version: 5,
  ce: 0,
  totalEarned: 0,
  lastTimestamp: Date.now(),
  insights: 0,
  unlockedCount: 1,
  boost: 1,
  artifactBonus: 0,
  formatShort: true,
  offlineCapHours: 24,
  ui: { showDevPanel: false },
  eras: [
    { id:0, name:'Time Hub', unlocked:true, unlockCost:0,
      agentName:'Rift Technician', agentBaseCost:10, agentBaseOutput:1, agentsOwned:1,
      resourceName:'—', resource:0, resourceRatePerAgent:0,
      upgrades:[ { id:'chrono-calibrator', name:'Chrono Calibrator (+50% Time Hub output)', cost:{ ce:50 }, purchased:false } ]
    },
    { id:1, name:'Stone Age', unlocked:false, unlockCost:100,
      agentName:'Cave Scout', agentBaseCost:30, agentBaseOutput:4, agentsOwned:0,
      resourceName:'Primitive Relics', resource:0, resourceRatePerAgent:0.008,
      upgrades:[ { id:'fire-mastery', name:'Fire Mastery (+20% Stone Age output)', cost:{ ce:250, resource:60 }, purchased:false } ]
    },
    { id:2, name:'Ancient Civilizations', unlocked:false, unlockCost:3000,
      agentName:'Scholar', agentBaseCost:180, agentBaseOutput:35, agentsOwned:0,
      resourceName:'Bronze Scrolls', resource:0, resourceRatePerAgent:0.006,
      upgrades:[ { id:'library-alexandria', name:'Library of Alexandria (+10% all previous eras)', cost:{ ce:12000, resource:80 }, purchased:false } ]
    },
    { id:3, name:'Medieval Era', unlocked:false, unlockCost:60000,
      agentName:'Royal Archivist', agentBaseCost:1400, agentBaseOutput:300, agentsOwned:0,
      resourceName:'Illuminated Manuscripts', resource:0, resourceRatePerAgent:0.0045,
      upgrades:[ { id:'royal-patronage', name:'Royal Patronage (+25% Ancient & Medieval output)', cost:{ ce:45000, resource:60 }, purchased:false } ]
    },
    { id:4, name:'Industrial Age', unlocked:false, unlockCost:1200000,
      agentName:'Steam Engineer', agentBaseCost:9000, agentBaseOutput:2500, agentsOwned:0,
      resourceName:'Cogworks', resource:0, resourceRatePerAgent:0.003,
      upgrades:[ { id:'assembly-optimization', name:'Assembly Line Optimization (+15% all era output)', cost:{ ce:350000, resource:50 }, purchased:false } ]
    }
  ],
  hunts: { slots: 1, missions: [], nextId: 1, log: [] },
  research: { nodes: {}, chosenEra: null },
  transient: { offlineReport: null }
}

export const RESEARCH = [
  { id:'r_stability',   name:'Rift Stabilization',  desc:'+5% output',           cost:{ce:2000, relics:50} },
  { id:'r_excavation',  name:'Enhanced Excavation', desc:'+10% artifact rewards',cost:{ce:8000, relics:120, scrolls:80} },
  { id:'r_efficiency',  name:'Temporal Efficiency', desc:'+10% global',          cost:{ce:30000, manuscripts:60}, req:['r_stability'] },
  { id:'r_multihunt',   name:'Multi-Hunt Protocol', desc:'+1 hunt slot',         cost:{ce:45000, cogworks:40} },
  { id:'r_focus',       name:'Era Focus',           desc:'+20% chosen era',      cost:{ce:15000, scrolls:100} },
  { id:'r_fast_hunts',  name:'Accelerated Hunts',   desc:'-20% hunt duration',   cost:{ce:22000, manuscripts:80} },
]

function ensureStructure(st){
  if(!st.hunts) st.hunts = { slots: 1, missions: [], nextId: 1, log: [] }
  if(!st.research) st.research = { nodes: {}, chosenEra: null }
  if(!st.ui) st.ui = { showDevPanel: false }
  if(!st.transient) st.transient = { offlineReport: null }
  if(!st.unlockedCount) st.unlockedCount = st.eras?.filter(e=>e.unlocked).length || 1
}

export function migrate(raw){
  if(!raw) return structuredClone(initialState)
  try{
    const s = JSON.parse(raw)
    if(!s.version || s.version < 5){
      s.version = 5
      s.offlineCapHours = 24
      if(s.eras && s.eras[0]) s.eras[0].agentsOwned = Math.max(1, s.eras[0].agentsOwned||0)
      if(s.ui?.showDevPanel === undefined) s.ui = { showDevPanel: false }
    }
    ensureStructure(s)
    return s
  }catch{ return structuredClone(initialState) }
}

export function load(){ return migrate(localStorage.getItem(SAVE_KEY)) }
export function save(st){ localStorage.setItem(SAVE_KEY, JSON.stringify(st)) }
export function agentCost(base, owned){ return Math.floor(base * (1.20 ** owned)) }

function computeMultipliers(state){
  let globalMult = (1 + state.insights * 0.05 + Math.max(0, state.unlockedCount - 1) * 0.02 + state.artifactBonus)
  const perEraMult = {}; for(const era of state.eras) perEraMult[era.id] = 1
  if (state.eras[0].upgrades[0].purchased) perEraMult[0] *= 1.5
  if (state.eras[1].upgrades[0].purchased) perEraMult[1] *= 1.2
  if (state.eras[2].upgrades[0].purchased) { perEraMult[0] *= 1.10; perEraMult[1] *= 1.10 }
  if (state.eras[3].upgrades[0].purchased) { perEraMult[2] *= 1.25; perEraMult[3] *= 1.25 }
  if (state.eras[4].upgrades[0].purchased) { for(const k in perEraMult) perEraMult[k] *= 1.15 }
  const synergies = [
    { id:'stone-ancient',   name:'Stone + Ancient',   eras:[1,2], mult:{1:1.10,2:1.10} },
    { id:'ancient-medieval',name:'Ancient + Medieval',eras:[2,3], mult:{2:1.10,3:1.10} },
    { id:'stone-industrial',name:'Stone + Industrial',eras:[1,4], mult:{1:1.10,4:1.10} },
  ]
  const active = []
  for(const s of synergies){ if(state.eras[s.eras[0]].unlocked && state.eras[s.eras[1]].unlocked){ active.push(s.id); for(const k in s.mult) perEraMult[k] *= s.mult[k] } }
  const r = state.research?.nodes || {}
  if (r['r_stability'])  globalMult *= 1.05
  if (r['r_efficiency']) globalMult *= 1.10
  if (state.research?.chosenEra != null) perEraMult[state.research.chosenEra] *= 1.20
  return { globalMult, perEraMult, synergies, active }
}

function productionPerEra(era, perEraMult){ return era.agentBaseOutput * era.agentsOwned * (perEraMult[era.id] || 1) }
function resourceGainPerEra(era){ return era.resourceRatePerAgent * era.agentsOwned }

export const state = writable(load())
export const synergyView = derived(state, ($s) => { const info = computeMultipliers($s); return { active: info.active, list: info.synergies } })
export const rate = derived(state, ($s) => { const { globalMult, perEraMult } = computeMultipliers($s); let sum=0; for(const era of $s.eras){ if(era.unlocked) sum += productionPerEra(era, perEraMult) } return sum * globalMult * ($s.boost || 1) })

let tickHandle = null
const tickMs = 500, bgTickMs = 10000
function applyEarnings(st, ratePerSec, now){
  const capMs = (st.offlineCapHours||24)*3600*1000
  const rawDtMs = Math.max(0, now - st.lastTimestamp)
  const dtMs = Math.min(rawDtMs, capMs)
  const dt = dtMs / 1000
  const boost = st.boost || 1
  const ceBefore = st.ce; const resBefore = st.eras.map(e=>e.resource)
  st.ce += ratePerSec * dt
  st.totalEarned += ratePerSec * dt
  for (const era of st.eras){ if(era.unlocked) era.resource += resourceGainPerEra(era) * dt * boost }
  for (const m of st.hunts.missions){ if(!m.rewardReady && now >= m.endTime) m.rewardReady = true }
  if (rawDtMs > 60000) {
    const ceAfter = st.ce; const resAfter = st.eras.map(e=>e.resource)
    const gains = { seconds: Math.floor(dt), ce: ceAfter - ceBefore, res: resAfter.map((v,i)=> v - resBefore[i]) }
    st.transient.offlineReport = gains
  } else { st.transient.offlineReport = null }
  st.lastTimestamp = now
}
export function startTicker(){ stopTicker(); const tick=()=>{ let snap; state.update(s=>(snap=s,s)); let current=0; const u=rate.subscribe(v=>current=v); u(); const now=Date.now(); applyEarnings(snap,current,now); state.set(snap); save(snap); tickHandle=setTimeout(tick,document.visibilityState==='visible'?tickMs:bgTickMs)}; tick() }
export function stopTicker(){ if(tickHandle!==null) clearTimeout(tickHandle); tickHandle=null }

export function unlockEra(id){ state.update(s=>{ const era=s.eras.find(e=>e.id===id); if(!era.unlocked && s.ce>=era.unlockCost){ s.ce-=era.unlockCost; era.unlocked=true; s.unlockedCount=s.eras.filter(e=>e.unlocked).length } return s }) }
export function buyAgent(id){ state.update(s=>{ const e=s.eras.find(x=>x.id===id); if(!e.unlocked) return s; const c=Math.floor(e.agentBaseCost*(1.20**e.agentsOwned)); if(s.ce>=c){ s.ce-=c; e.agentsOwned++ } return s }) }
export function buyUpgrade(eraId, upgId){ state.update(s=>{ const e=s.eras.find(x=>x.id===eraId); const u=e.upgrades.find(u=>u.id===upgId); if(u.purchased) return s; const rc=u.cost.resource||0; if(s.ce>=u.cost.ce && e.resource>=rc){ s.ce-=u.cost.ce; e.resource-=rc; u.purchased=true } return s }) }

export function canPrestige(s){ return s.eras[4].unlocked }
export function previewInsightGain(st){ return Math.floor((st?.totalEarned||0)/1_000_000) }
export function doPrestige(){ state.update(s=>{ if(!canPrestige(s)) return s; const g=previewInsightGain(s); if(g<=0) return s; s.insights+=g; s.ce=0; s.totalEarned=0; s.unlockedCount=1; for(const e of s.eras){ e.unlocked=(e.id===0); e.agentsOwned=(e.id===0?1:0); e.resource=0; for(const u of e.upgrades) u.purchased=false } s.hunts.missions=[]; return s }) }

const RARITIES=[{id:'Common',bonus:0.01,hours:1},{id:'Uncommon',bonus:0.02,hours:2},{id:'Rare',bonus:0.03,hours:4},{id:'Epic',bonus:0.05,hours:8},{id:'Legendary',bonus:0.07,hours:12},{id:'Mythic',bonus:0.10,hours:24}]
function pickRarity(){ const bag=[...'CCCCCCUUURREEELM']; const ch=bag[Math.floor(Math.random()*bag.length)]; return RARITIES[['C','U','R','E','L','M'].indexOf(ch)] }
export function startHunt(eraId){ state.update(s=>{ const active=s.hunts.missions.filter(m=>!m.rewardReady).length; const extra=(s.research.nodes['r_multihunt']?1:0); const max=1+extra; if(active>=max) return s; const era=s.eras.find(e=>e.id===eraId); if(!era||!era.unlocked) return s; const rar=pickRarity(); const timeMult=(s.research.nodes['r_fast_hunts']?0.8:1); const end= Date.now() + rar.hours*3600*1000 * timeMult; const id=s.hunts.nextId++; s.hunts.missions.push({id, eraId, rarity:rar.id, bonus:rar.bonus, endTime:end, rewardReady:false}); return s }) }
export function claimHunt(id){ state.update(s=>{ const idx=s.hunts.missions.findIndex(m=>m.id===id && m.rewardReady); if(idx===-1) return s; const m=s.hunts.missions[idx]; const mult=(s.research.nodes['r_excavation']?1.10:1); s.artifactBonus += m.bonus * mult; s.hunts.log.unshift({when:Date.now(), rarity:m.rarity, bonus:m.bonus*mult, eraId:m.eraId}); s.hunts.missions.splice(idx,1); return s }) }

function canAffordResearch(s, node){ const e=s.eras, n=node.cost||{}; if(s.ce<(n.ce||0)) return false; if((e[1].resource||0)<(n.relics||0)) return false; if((e[2].resource||0)<(n.scrolls||0)) return false; if((e[3].resource||0)<(n.manuscripts||0)) return false; if((e[4].resource||0)<(n.cogworks||0)) return false; if((s.insights||0)<(n.insight||0)) return false; if(node.req){ for(const r of node.req){ if(!s.research.nodes[r]) return false } } return true }
export function buyResearch(id){ state.update(s=>{ const n=RESEARCH.find(x=>x.id===id); if(!n||s.research.nodes[id]) return s; const e=canAffordResearch(s,n); if(!e) return s; const need=n.cost||{}; s.ce-=(need.ce||0); s.eras[1].resource-=(need.relics||0); s.eras[2].resource-=(need.scrolls||0); s.eras[3].resource-=(need.manuscripts||0); s.eras[4].resource-=(need.cogworks||0); s.insights-=(need.insight||0); s.research.nodes[id]=true; return s }) }
export function chooseEraFocus(id){ state.update(s=>{ s.research.chosenEra=id; return s }) }

export function setBoost(x){ state.update(s=>(s.boost=x,s)) }
export function addCE(x){ state.update(s=>(s.ce+=x,s)) }
export function addResources(x){ state.update(s=>{ for(const e of s.eras){ if(e.unlocked) e.resource+=x } return s }) }
export function unlockAll(){ state.update(s=>{ for(const e of s.eras){ e.unlocked=true } s.unlockedCount=s.eras.filter(e=>e.unlocked).length; return s }) }
export function fastForward(min){ state.update(s=>{ s.lastTimestamp -= min*60*1000; return s }) }
export function toggleDevPanel(){ state.update(s=>(s.ui.showDevPanel=!s.ui.showDevPanel,s)) }
export function toggleFormat(){ state.update(s=>(s.formatShort=!s.formatShort,s)) }
export function exportSave(){ let v; state.update(s=>(v=s,s)); return JSON.stringify(v,null,2) }
export function importSave(json){ try{ const o=JSON.parse(json); o.version=5; ensureStructure(o); state.set(o); save(o) }catch(e){} }
