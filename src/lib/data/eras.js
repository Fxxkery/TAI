// src/lib/data/eras.js
// Master progression table (Phase 6). JS-only, ready for Svelte stores.
// Effects are declarative so your engine can apply them consistently.

export const ERAS = [
  {
    id: "prehistoric",
    name: "Prehistoric Age",
    order: 0,
    unlockAt: null, // starting era
    resources: {
      primary: ["food", "tools"],
      secondary: [], // keep onboarding simple
    },
    upgrades: [
      {
        id: "improved-hunting-tools",
        name: "Improved Hunting Tools",
        effects: [
          { type: "mult", target: "resource/sec", resource: "food", amount: 0.5 },
        ],
      },
      {
        id: "fire-mastery",
        name: "Fire Mastery",
        effects: [{ type: "mult", target: "all/sec", amount: 0.15 }],
      },
      {
        id: "tribal-cooperation",
        name: "Tribal Cooperation",
        effects: [
          { type: "per-era", target: "all/sec", amount: 0.10, retroactive: true },
        ],
      },
    ],
  },

  {
    id: "ancient",
    name: "Ancient Age",
    order: 1,
    unlockAt: { era: "prehistoric", condition: "core-complete" },
    resources: {
      primary: ["grain"],
      secondary: ["stone"],
    },
    upgrades: [
      {
        id: "irrigation-systems",
        name: "Irrigation Systems",
        effects: [
          { type: "mult", target: "resource/sec", resource: "grain", amount: 0.5 },
        ],
      },
      {
        id: "bronze-craftsmanship",
        name: "Bronze Craftsmanship",
        effects: [
          { type: "mult", target: "resource/sec", resource: "stone", amount: 0.75 },
        ],
      },
      {
        id: "trade-routes",
        name: "Trade Routes",
        effects: [{ type: "mult", target: "secondary/all/sec", amount: 0.10 }],
      },
      {
        id: "mathematics",
        name: "Mathematics",
        effects: [{ type: "mult", target: "research/speed", amount: 0.10 }],
      },
    ],
  },

  {
    id: "medieval",
    name: "Medieval Age",
    order: 2,
    unlockAt: { era: "ancient", condition: "core-complete" },
    resources: {
      primary: ["grain", "gold"],
      secondary: ["iron"],
    },
    upgrades: [
      {
        id: "steel-forging",
        name: "Steel Forging",
        effects: [
          { type: "mult", target: "resource/sec", resource: "iron", amount: 1.0 },
        ],
      },
      {
        id: "guild-systems",
        name: "Guild Systems",
        effects: [{ type: "mult", target: "secondary→primary/synergy", amount: 0.20 }],
      },
      {
        id: "siege-engineering",
        name: "Siege Engineering",
        effects: [{ type: "mult", target: "primary/all/sec", amount: 0.15 }],
      },
      {
        id: "maritime-trade",
        name: "Maritime Trade",
        effects: [{ type: "mult", target: "secondary/all/sec", amount: 0.10 }],
      },
    ],
  },

  {
    id: "renaissance",
    name: "Renaissance",
    order: 3,
    unlockAt: { era: "medieval", condition: "core-complete" },
    resources: {
      primary: ["gold"],
      secondary: ["paper"],
    },
    upgrades: [
      {
        id: "printing-press",
        name: "Printing Press",
        effects: [
          { type: "mult", target: "resource/sec", resource: "paper", amount: 1.0 },
        ],
      },
      {
        id: "scientific-method",
        name: "Scientific Method",
        effects: [{ type: "mult", target: "research/speed", amount: 0.20 }],
      },
      {
        id: "global-navigation",
        name: "Global Navigation",
        effects: [{ type: "mult", target: "all/sec", amount: 0.15 }],
      },
      {
        id: "merchant-banking",
        name: "Merchant Banking",
        effects: [{ type: "mult", target: "secondary/all/sec", amount: 0.10 }],
      },
    ],
  },

  {
    id: "industrial",
    name: "Industrial Age",
    order: 4,
    unlockAt: { era: "renaissance", condition: "core-complete" },
    resources: {
      primary: ["manufactured-goods"],
      secondary: ["coal"],
    },
    upgrades: [
      {
        id: "steam-power",
        name: "Steam Power",
        effects: [
          { type: "mult", target: "resource/sec", resource: "coal", amount: 1.0 },
        ],
      },
      {
        id: "mass-production",
        name: "Mass Production",
        effects: [{ type: "mult", target: "primary/all/sec", amount: 0.20 }],
      },
      {
        id: "railway-networks",
        name: "Railway Networks",
        effects: [{ type: "mult", target: "secondary/all/sec", amount: 0.15 }],
      },
      {
        id: "telegraph-systems",
        name: "Telegraph Systems",
        effects: [
          { type: "mult", target: "research/speed", amount: 0.10 },
          { type: "mult", target: "primary/all/sec", amount: 0.05 },
        ],
      },
    ],
  },

  // Phase 6 new eras
  {
    id: "modern",
    name: "Modern Age",
    order: 5,
    unlockAt: { era: "industrial", condition: "core-complete" },
    resources: {
      primary: ["consumer-goods"],
      secondary: ["oil", "electricity"],
    },
    upgrades: [
      {
        id: "assembly-line-expansion",
        name: "Assembly Line Expansion",
        effects: [{ type: "mult", target: "base/all/sec", amount: 0.5 }],
      },
      {
        id: "oil-refinement",
        name: "Oil Refinement",
        effects: [
          { type: "mult", target: "resource/sec", resource: "oil", amount: 0.75 },
        ],
      },
      {
        id: "grid-expansion",
        name: "Grid Expansion",
        effects: [
          { type: "mult", target: "resource/sec", resource: "electricity", amount: 0.25 },
          { type: "mult", target: "resource/sec", resource: "oil", amount: 0.10 },
        ],
      },
      {
        id: "automated-factories",
        name: "Automated Factories",
        effects: [{ type: "offline", target: "secondary/all", amount: 0.10 }], // small offline trickle
      },
      {
        id: "global-logistics",
        name: "Global Logistics",
        effects: [{ type: "trickle", target: "next-era/secondary", amount: 0.02 }], // 2% of current secondary as trickle to next era
      },
    ],
  },

  {
    id: "digital",
    name: "Digital Age",
    order: 6,
    unlockAt: { era: "modern", condition: "core-complete" },
    resources: {
      primary: ["services"],
      secondary: ["data", "renewables"],
    },
    upgrades: [
      {
        id: "server-farms",
        name: "Server Farms",
        effects: [{ type: "mult", target: "resource/sec", resource: "data", amount: 1.0 }],
      },
      {
        id: "green-data-centers",
        name: "Green Data Centers",
        effects: [
          { type: "mult", target: "resource/sec", resource: "renewables", amount: 0.20 },
        ],
      },
      {
        id: "automation-protocols",
        name: "Automation Protocols",
        effects: [{ type: "mult", target: "primary/all/sec", amount: 0.15 }],
      },
      {
        id: "quantum-networking",
        name: "Quantum Networking",
        effects: [{ type: "mult", target: "secondary/all/sec", amount: 0.15 }],
      },
      {
        id: "algorithmic-trade",
        name: "Algorithmic Trade",
        effects: [{ type: "mult", target: "research/speed", amount: 0.10 }],
      },
    ],
  },

  {
    id: "near-future",
    name: "Near Future",
    order: 7,
    unlockAt: { era: "digital", condition: "core-complete" },
    resources: {
      primary: ["advanced-goods"],
      secondary: ["energy-credits", "synthetic-materials"],
    },
    upgrades: [
      {
        id: "fusion-reactors",
        name: "Fusion Reactors",
        effects: [
          { type: "mult", target: "resource/sec", resource: "energy-credits", amount: 2.0 },
        ],
      },
      {
        id: "nanofabrication-plants",
        name: "Nanofabrication Plants",
        effects: [
          {
            type: "mult",
            target: "resource/sec",
            resource: "synthetic-materials",
            amount: 1.5,
          },
        ],
      },
      {
        id: "global-smart-grid",
        name: "Global Smart Grid",
        effects: [{ type: "mult", target: "energy-based/all/sec", amount: 0.20 }],
      },
      {
        id: "self-replicating-factories",
        name: "Self-Replicating Factories",
        effects: [{ type: "mult", target: "all-upgrade-effects", amount: 0.10 }],
      },
      {
        id: "planetary-defense-systems",
        name: "Planetary Defense Systems",
        effects: [{ type: "meta", target: "prestige-prep", amount: 1 }], // enables prestige hook later
      },
    ],
  },

  {
    id: "interstellar",
    name: "Interstellar Age",
    order: 8,
    unlockAt: { era: "near-future", condition: "core-complete" },
    resources: {
      primary: ["stellar-industry"],
      secondary: ["stellar-energy", "exotic-matter"],
    },
    upgrades: [
      {
        id: "dyson-spheres",
        name: "Dyson Spheres",
        effects: [
          { type: "mult", target: "resource/sec", resource: "stellar-energy", amount: 2.5 },
        ],
      },
      {
        id: "exotic-matter-harvesters",
        name: "Exotic Matter Harvesters",
        effects: [
          { type: "mult", target: "resource/sec", resource: "exotic-matter", amount: 2.0 },
        ],
      },
      {
        id: "wormhole-gates",
        name: "Wormhole Gates",
        effects: [{ type: "mult", target: "secondary/all/sec", amount: 0.20 }],
      },
      {
        id: "galactic-trade-networks",
        name: "Galactic Trade Networks",
        effects: [{ type: "mult", target: "earlier-eras/all/sec", amount: 0.15 }],
      },
      {
        id: "temporal-core",
        name: "Temporal Core",
        effects: [{ type: "meta", target: "prestige-currency", currency: "temporal-shards" }],
      },
    ],
  },
];

// Optional: central list of resource metadata (icons, display order, grouping).
export const RESOURCE_META = {
  // Early game
  food: { label: "Food", group: "primary", icon: "🍖" },
  tools: { label: "Tools", group: "primary", icon: "🪓" },
  grain: { label: "Grain", group: "primary", icon: "🌾" },
  stone: { label: "Stone", group: "secondary", icon: "🪨" },
  iron: { label: "Iron", group: "secondary", icon: "⛓️" },
  paper: { label: "Paper", group: "secondary", icon: "📜" },
  gold: { label: "Gold", group: "primary", icon: "🪙" },

  // Industrial
  "manufactured-goods": { label: "Manufactured Goods", group: "primary", icon: "🏭" },
  coal: { label: "Coal", group: "secondary", icon: "🪵" },

  // Modern
  "consumer-goods": { label: "Consumer Goods", group: "primary", icon: "🛍️" },
  oil: { label: "Oil", group: "secondary", icon: "🛢️" },
  electricity: { label: "Electricity", group: "secondary", icon: "⚡" },

  // Digital
  services: { label: "Services", group: "primary", icon: "🧩" },
  data: { label: "Data", group: "secondary", icon: "🧠" },
  renewables: { label: "Renewables", group: "secondary", icon: "♻️" },

  // Near Future
  "advanced-goods": { label: "Advanced Goods", group: "primary", icon: "🧪" },
  "energy-credits": { label: "Energy Credits", group: "secondary", icon: "🔋" },
  "synthetic-materials": { label: "Synthetic Materials", group: "secondary", icon: "🧬" },

  // Interstellar
  "stellar-industry": { label: "Stellar Industry", group: "primary", icon: "🛰️" },
  "stellar-energy": { label: "Stellar Energy", group: "secondary", icon: "☀️" },
  "exotic-matter": { label: "Exotic Matter", group: "secondary", icon: "🌀" },
};
