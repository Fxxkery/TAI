// src/lib/data/eras.js
// Phase 6 progression data — Chrono-driven unlocks.
// Rule: each era (except the first unlock after Time Hub) requires Chrono + previous era's secondary[0].
// Prehistoric is Chrono-only (no prior secondary).

export const ERAS = [
  // ---- Core 0: Time Hub ----
  {
    id: "time-hub",
    name: "Time Hub",
    order: 0,
    unlockAt: null,                 // starts unlocked
    unlockCost: [],                 // no cost
    resources: {
      primary: ["chrono"],          // generates Chrono only
      secondary: []                 // none
    },
    upgrades: [
      {
        id: "calibrator",
        name: "Chrono Calibrator",
        cost: [{ resource: "chrono", amount: 20 }],
        effects: [{ type: "mult", target: "resource/sec", resource: "chrono", amount: 0.5 }]
      },
      {
        id: "stability-loop",
        name: "Stability Loop",
        cost: [{ resource: "chrono", amount: 60 }],
        effects: [{ type: "mult", target: "base/all/sec", amount: 0.10 }]
      }
    ]
  },

  // ---- 1: Prehistoric ----
  {
    id: "prehistoric",
    name: "Prehistoric Age",
    order: 1,
    unlockAt: { era: "time-hub", condition: "core-complete" },
    unlockCost: [
      { resource: "chrono", amount: 25 } // Chrono-only for first unlock
    ],
    resources: {
      // Make Tools the gate (secondary) so Ancient will require Tools
      primary: ["food"],
      secondary: ["tools"]
    },
    upgrades: [
      {
        id: "improved-hunting-tools",
        name: "Improved Hunting Tools",
        cost: [{ resource: "food", amount: 50 }],
        effects: [{ type: "mult", target: "resource/sec", resource: "food", amount: 0.5 }]
      },
      {
        id: "fire-mastery",
        name: "Fire Mastery",
        cost: [{ resource: "tools", amount: 20 }],
        effects: [{ type: "mult", target: "all/sec", amount: 0.15 }]
      },
      {
        id: "tribal-cooperation",
        name: "Tribal Cooperation",
        cost: [{ resource: "food", amount: 120 }],
        effects: [{ type: "per-era", target: "all/sec", amount: 0.10, retroactive: true }]
      }
    ]
  },

  // ---- 2: Ancient ----
  {
    id: "ancient",
    name: "Ancient Age",
    order: 2,
    unlockAt: { era: "prehistoric", condition: "core-complete" },
    unlockCost: [
      { resource: "chrono", amount: 150 },
      { resource: "tools", amount: 150 } // previous era's secondary[0]
    ],
    resources: {
      primary: ["grain"],
      secondary: ["stone"]
    },
    upgrades: [
      {
        id: "irrigation-systems",
        name: "Irrigation Systems",
        cost: [{ resource: "grain", amount: 400 }],
        effects: [{ type: "mult", target: "resource/sec", resource: "grain", amount: 0.5 }]
      },
      {
        id: "bronze-craftsmanship",
        name: "Bronze Craftsmanship",
        cost: [{ resource: "stone", amount: 250 }],
        effects: [{ type: "mult", target: "resource/sec", resource: "stone", amount: 0.75 }]
      },
      {
        id: "trade-routes",
        name: "Trade Routes",
        cost: [
          { resource: "grain", amount: 600 },
          { resource: "stone", amount: 200 }
        ],
        effects: [{ type: "mult", target: "secondary/all/sec", amount: 0.10 }]
      },
      {
        id: "mathematics",
        name: "Mathematics",
        cost: [{ resource: "grain", amount: 800 }],
        effects: [{ type: "mult", target: "research/speed", amount: 0.10 }]
      }
    ]
  },

  // ---- 3: Medieval ----
  {
    id: "medieval",
    name: "Medieval Age",
    order: 3,
    unlockAt: { era: "ancient", condition: "core-complete" },
    unlockCost: [
      { resource: "chrono", amount: 750 },
      { resource: "stone", amount: 600 } // previous era's secondary[0]
    ],
    resources: {
      primary: ["gold"],
      secondary: ["iron"]
    },
    upgrades: [
      {
        id: "steel-forging",
        name: "Steel Forging",
        cost: [{ resource: "iron", amount: 700 }],
        effects: [{ type: "mult", target: "resource/sec", resource: "iron", amount: 1.0 }]
      },
      {
        id: "guild-systems",
        name: "Guild Systems",
        cost: [{ resource: "gold", amount: 1800 }],
        effects: [{ type: "mult", target: "secondary→primary/synergy", amount: 0.20 }]
      },
      {
        id: "siege-engineering",
        name: "Siege Engineering",
        cost: [{ resource: "gold", amount: 2200 }],
        effects: [{ type: "mult", target: "primary/all/sec", amount: 0.15 }]
      },
      {
        id: "maritime-trade",
        name: "Maritime Trade",
        cost: [
          { resource: "gold", amount: 2000 },
          { resource: "iron", amount: 400 }
        ],
        effects: [{ type: "mult", target: "secondary/all/sec", amount: 0.10 }]
      }
    ]
  },

  // ---- 4: Renaissance ----
  {
    id: "renaissance",
    name: "Renaissance",
    order: 4,
    unlockAt: { era: "medieval", condition: "core-complete" },
    unlockCost: [
      { resource: "chrono", amount: 3000 },
      { resource: "iron", amount: 1200 } // previous era's secondary[0]
    ],
    resources: {
      primary: ["gold"],
      secondary: ["paper"]
    },
    upgrades: [
      {
        id: "printing-press",
        name: "Printing Press",
        cost: [{ resource: "paper", amount: 800 }],
        effects: [{ type: "mult", target: "resource/sec", resource: "paper", amount: 1.0 }]
      },
      {
        id: "scientific-method",
        name: "Scientific Method",
        cost: [
          { resource: "gold", amount: 5200 },
          { resource: "paper", amount: 500 }
        ],
        effects: [{ type: "mult", target: "research/speed", amount: 0.20 }]
      },
      {
        id: "global-navigation",
        name: "Global Navigation",
        cost: [{ resource: "gold", amount: 6000 }],
        effects: [{ type: "mult", target: "all/sec", amount: 0.15 }]
      },
      {
        id: "merchant-banking",
        name: "Merchant Banking",
        cost: [
          { resource: "gold", amount: 5800 },
          { resource: "paper", amount: 400 }
        ],
        effects: [{ type: "mult", target: "secondary/all/sec", amount: 0.10 }]
      }
    ]
  },

  // ---- 5: Industrial ----
  {
    id: "industrial",
    name: "Industrial Age",
    order: 5,
    unlockAt: { era: "renaissance", condition: "core-complete" },
    unlockCost: [
      { resource: "chrono", amount: 12000 },
      { resource: "paper", amount: 1500 } // previous era's secondary[0]
    ],
    resources: {
      primary: ["manufactured-goods"],
      secondary: ["coal"]
    },
    upgrades: [
      {
        id: "steam-power",
        name: "Steam Power",
        cost: [{ resource: "coal", amount: 2500 }],
        effects: [{ type: "mult", target: "resource/sec", resource: "coal", amount: 1.0 }]
      },
      {
        id: "mass-production",
        name: "Mass Production",
        cost: [{ resource: "manufactured-goods", amount: 9000 }],
        effects: [{ type: "mult", target: "primary/all/sec", amount: 0.20 }]
      },
      {
        id: "railway-networks",
        name: "Railway Networks",
        cost: [
          { resource: "manufactured-goods", amount: 10000 },
          { resource: "coal", amount: 1600 }
        ],
        effects: [{ type: "mult", target: "secondary/all/sec", amount: 0.15 }]
      },
      {
        id: "telegraph-systems",
        name: "Telegraph Systems",
        cost: [{ resource: "manufactured-goods", amount: 8000 }],
        effects: [
          { type: "mult", target: "research/speed", amount: 0.10 },
          { type: "mult", target: "primary/all/sec", amount: 0.05 }
        ]
      }
    ]
  },

  // ---- 6: Modern ----
  {
    id: "modern",
    name: "Modern Age",
    order: 6,
    unlockAt: { era: "industrial", condition: "core-complete" },
    unlockCost: [
      { resource: "chrono", amount: 45000 },
      { resource: "coal", amount: 6000 } // previous era's secondary[0]
    ],
    resources: {
      primary: ["consumer-goods"],
      secondary: ["oil", "electricity"]
    },
    upgrades: [
      {
        id: "assembly-line-expansion",
        name: "Assembly Line Expansion",
        cost: [{ resource: "consumer-goods", amount: 25000 }],
        effects: [{ type: "mult", target: "base/all/sec", amount: 0.5 }]
      },
      {
        id: "oil-refinement",
        name: "Oil Refinement",
        cost: [{ resource: "oil", amount: 8000 }],
        effects: [{ type: "mult", target: "resource/sec", resource: "oil", amount: 0.75 }]
      },
      {
        id: "grid-expansion",
        name: "Grid Expansion",
        cost: [
          { resource: "consumer-goods", amount: 18000 },
          { resource: "electricity", amount: 5000 }
        ],
        effects: [
          { type: "mult", target: "resource/sec", resource: "electricity", amount: 0.25 },
          { type: "mult", target: "resource/sec", resource: "oil", amount: 0.10 }
        ]
      },
      {
        id: "automated-factories",
        name: "Automated Factories",
        cost: [{ resource: "consumer-goods", amount: 22000 }],
        effects: [{ type: "offline", target: "secondary/all", amount: 0.10 }]
      },
      {
        id: "global-logistics",
        name: "Global Logistics",
        cost: [
          { resource: "consumer-goods", amount: 26000 },
          { resource: "oil", amount: 4000 }
        ],
        effects: [{ type: "trickle", target: "next-era/secondary", amount: 0.02 }]
      }
    ]
  },

  // ---- 7: Digital ----
  {
    id: "digital",
    name: "Digital Age",
    order: 7,
    unlockAt: { era: "modern", condition: "core-complete" },
    unlockCost: [
      { resource: "chrono", amount: 150000 },
      { resource: "electricity", amount: 15000 } // previous era's secondary[0]
    ],
    resources: {
      primary: ["services"],
      secondary: ["data", "renewables"]
    },
    upgrades: [
      {
        id: "server-farms",
        name: "Server Farms",
        cost: [{ resource: "data", amount: 20000 }],
        effects: [{ type: "mult", target: "resource/sec", resource: "data", amount: 1.0 }]
      },
      {
        id: "green-data-centers",
        name: "Green Data Centers",
        cost: [
          { resource: "services", amount: 70000 },
          { resource: "renewables", amount: 12000 }
        ],
        effects: [{ type: "mult", target: "resource/sec", resource: "renewables", amount: 0.20 }]
      },
      {
        id: "automation-protocols",
        name: "Automation Protocols",
        cost: [{ resource: "services", amount: 60000 }],
        effects: [{ type: "mult", target: "primary/all/sec", amount: 0.15 }]
      },
      {
        id: "quantum-networking",
        name: "Quantum Networking",
        cost: [
          { resource: "services", amount: 65000 },
          { resource: "data", amount: 15000 }
        ],
        effects: [{ type: "mult", target: "secondary/all/sec", amount: 0.15 }]
      },
      {
        id: "algorithmic-trade",
        name: "Algorithmic Trade",
        cost: [{ resource: "services", amount: 80000 }],
        effects: [{ type: "mult", target: "research/speed", amount: 0.10 }]
      }
    ]
  },

  // ---- 8: Near Future ----
  {
    id: "near-future",
    name: "Near Future",
    order: 8,
    unlockAt: { era: "digital", condition: "core-complete" },
    unlockCost: [
      { resource: "chrono", amount: 500000 },
      { resource: "data", amount: 50000 } // previous era's secondary[0]
    ],
    resources: {
      primary: ["advanced-goods"],
      secondary: ["energy-credits", "synthetic-materials"]
    },
    upgrades: [
      {
        id: "fusion-reactors",
        name: "Fusion Reactors",
        cost: [{ resource: "energy-credits", amount: 90000 }],
        effects: [{ type: "mult", target: "resource/sec", resource: "energy-credits", amount: 2.0 }]
      },
      {
        id: "nanofabrication-plants",
        name: "Nanofabrication Plants",
        cost: [{ resource: "synthetic-materials", amount: 70000 }],
        effects: [{ type: "mult", target: "resource/sec", resource: "synthetic-materials", amount: 1.5 }]
      },
      {
        id: "global-smart-grid",
        name: "Global Smart Grid",
        cost: [
          { resource: "advanced-goods", amount: 160000 },
          { resource: "energy-credits", amount: 40000 }
        ],
        effects: [{ type: "mult", target: "energy-based/all/sec", amount: 0.20 }]
      },
      {
        id: "self-replicating-factories",
        name: "Self-Replicating Factories",
        cost: [{ resource: "advanced-goods", amount: 200000 }],
        effects: [{ type: "mult", target: "all-upgrade-effects", amount: 0.10 }]
      },
      {
        id: "planetary-defense-systems",
        name: "Planetary Defense Systems",
        cost: [
          { resource: "advanced-goods", amount: 220000 },
          { resource: "synthetic-materials", amount: 50000 }
        ],
        effects: [{ type: "meta", target: "prestige-prep", amount: 1 }]
      }
    ]
  },

  // ---- 9: Interstellar ----
  {
    id: "interstellar",
    name: "Interstellar Age",
    order: 9,
    unlockAt: { era: "near-future", condition: "core-complete" },
    unlockCost: [
      { resource: "chrono", amount: 1600000 },
      { resource: "energy-credits", amount: 120000 } // previous era's secondary[0]
    ],
    resources: {
      primary: ["stellar-industry"],
      secondary: ["stellar-energy", "exotic-matter"]
    },
    upgrades: [
      {
        id: "dyson-spheres",
        name: "Dyson Spheres",
        cost: [{ resource: "stellar-energy", amount: 220000 }],
        effects: [{ type: "mult", target: "resource/sec", resource: "stellar-energy", amount: 2.5 }]
      },
      {
        id: "exotic-matter-harvesters",
        name: "Exotic Matter Harvesters",
        cost: [{ resource: "exotic-matter", amount: 180000 }],
        effects: [{ type: "mult", target: "resource/sec", resource: "exotic-matter", amount: 2.0 }]
      },
      {
        id: "wormhole-gates",
        name: "Wormhole Gates",
        cost: [
          { resource: "stellar-industry", amount: 260000 },
          { resource: "exotic-matter", amount: 60000 }
        ],
        effects: [{ type: "mult", target: "secondary/all/sec", amount: 0.20 }]
      },
      {
        id: "galactic-trade-networks",
        name: "Galactic Trade Networks",
        cost: [{ resource: "stellar-industry", amount: 300000 }],
        effects: [{ type: "mult", target: "earlier-eras/all/sec", amount: 0.15 }]
      },
      {
        id: "temporal-core",
        name: "Temporal Core",
        cost: [
          { resource: "stellar-industry", amount: 350000 },
          { resource: "stellar-energy", amount: 80000 }
        ],
        effects: [{ type: "meta", target: "prestige-currency", currency: "temporal-shards" }]
      }
    ]
  }
];

// Resource metadata (Chrono is primary).
export const RESOURCE_META = {
  chrono: { label: "Chrono", group: "primary", icon: "⏳" },

  // Early game
  food: { label: "Food", group: "primary", icon: "🍖" },
  tools: { label: "Tools", group: "secondary", icon: "🪓" }, // gate in Prehistoric
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
  "exotic-matter": { label: "Exotic Matter", group: "secondary", icon: "🌀" }
};
