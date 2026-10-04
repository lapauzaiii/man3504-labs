/* MAN 3504 W8 — Cowford Medical Supply Disruption Simulator
   Scenario data. Values are validated fixtures from the W8 Supply Chain Pilot Specification.
   Do not change any number without instructional reconciliation (spec §28). */
(function (root) {
  'use strict';

  var CONSTANTS = {
    baseDemand: 2000,
    surgePremiumPerCase: 6,      // emergency reallocation / surge premium (spec §11)
    multiSourcePremiumPerCase: 4 // "multi-source execution premium", per delivered case, dual only (spec §30.1 C6)
  };

  var SUPPLIERS = {
    medserv: { id: 'medserv', name: 'MedServ Pro', unitCost: 50, capacity: 2600, leadTimeDays: 4, score: 84.70 },
    globalmed: { id: 'globalmed', name: 'GlobalMed', unitCost: 46, capacity: 2400, leadTimeDays: 18, score: 79.90 }
  };

  var ARCHITECTURES = {
    globalmed: {
      id: 'globalmed', label: 'GlobalMed only', posture: 'Efficient single source',
      summary: 'Use GlobalMed as the sole source to minimize normal-week procurement spend.',
      baseline: { medserv: 0, globalmed: 2000 }, dual: false
    },
    medserv: {
      id: 'medserv', label: 'MedServ Pro only', posture: 'Responsive single source',
      summary: 'Use MedServ Pro as the sole source to prioritize speed and the highest supplier score.',
      baseline: { medserv: 2000, globalmed: 0 }, dual: false
    },
    dual: {
      id: 'dual', label: 'Dual source', posture: 'MedServ 60% / GlobalMed 40%',
      summary: 'Qualify both suppliers and pay the recurring multi-source execution premium.',
      baseline: { medserv: 1200, globalmed: 800 }, dual: true
    }
  };
  var ARCH_ORDER = ['globalmed', 'medserv', 'dual'];

  var SEEDS = {
    '3504-W8-01': {
      id: '3504-W8-01', title: 'Port closure',
      description: 'A port closure halts every GlobalMed shipment for the decision week. MedServ Pro is unaffected. Hospital demand stays at 2,000 cases.',
      demand: 2000, availability: { medserv: 1.0, globalmed: 0.0 }, correlated: false
    },
    '3504-W8-02': {
      id: '3504-W8-02', title: 'MedServ quality hold',
      description: 'A quality hold stops every MedServ Pro shipment for the decision week. GlobalMed is unaffected. Hospital demand stays at 2,000 cases.',
      demand: 2000, availability: { medserv: 0.0, globalmed: 1.0 }, correlated: false
    },
    '3504-W8-03': {
      id: '3504-W8-03', title: 'Hospital demand spike',
      description: 'Both suppliers remain fully available, but hospital demand rises from 2,000 to 2,500 cases for the decision week.',
      demand: 2500, availability: { medserv: 1.0, globalmed: 1.0 }, correlated: false
    },
    '3504-W8-04': {
      id: '3504-W8-04', title: 'Shared Tier-2 material shortage',
      description: 'A newly mapped upstream supplier provides a critical sterile-film input to both MedServ Pro and GlobalMed. Its shortage cuts each supplier\u2019s qualified capacity to 35% of normal for the decision week. Hospital demand stays at 2,000 cases.',
      demand: 2000, availability: { medserv: 0.35, globalmed: 0.35 }, correlated: true
    }
  };
  var SEED_ORDER = ['3504-W8-01', '3504-W8-02', '3504-W8-03', '3504-W8-04'];

  var api = { CONSTANTS: CONSTANTS, SUPPLIERS: SUPPLIERS, ARCHITECTURES: ARCHITECTURES, ARCH_ORDER: ARCH_ORDER, SEEDS: SEEDS, SEED_ORDER: SEED_ORDER };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; } else { root.W8Scenarios = api; }
})(typeof window !== 'undefined' ? window : this);
