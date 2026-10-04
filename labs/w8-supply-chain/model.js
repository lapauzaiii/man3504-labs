/* MAN 3504 W8 — consequence model (spec §11, §30.2). Pure functions; no DOM. */
(function (root) {
  'use strict';
  var S = (typeof module !== 'undefined' && module.exports) ? require('./scenarios.js') : root.W8Scenarios;

  // Lower unit cost first (spec §11 fulfillment rule 2, dual reallocation order)
  function byCost(a, b) { return S.SUPPLIERS[a].unitCost - S.SUPPLIERS[b].unitCost; }

  function simulate(archId, seedId) {
    var arch = S.ARCHITECTURES[archId];
    var seed = seedId ? S.SEEDS[seedId] : null;
    if (!arch) throw new Error('Unknown architecture: ' + archId);
    if (seedId && !seed) throw new Error('Unknown seed: ' + seedId);
    var demand = seed ? seed.demand : S.CONSTANTS.baseDemand;
    var ids = Object.keys(S.SUPPLIERS);
    var available = {}, shipped = {}, emergency = {};
    ids.forEach(function (id) {
      var f = seed ? seed.availability[id] : 1;
      // Spec §30.2: round available capacity to whole cases before allocation
      available[id] = Math.round(S.SUPPLIERS[id].capacity * f);
      shipped[id] = 0;
    });
    var contracted = ids.filter(function (id) { return arch.baseline[id] > 0; });

    // Rule 1: fill each contracted supplier up to min(baseline, available)
    contracted.forEach(function (id) { shipped[id] = Math.min(arch.baseline[id], available[id]); });
    var remaining = demand - sumOf(shipped);

    // Rule 2/3: surge (single) or reallocate to lower-cost available contracted supplier first (dual)
    if (remaining > 0) {
      contracted.slice().sort(byCost).forEach(function (id) {
        if (remaining <= 0) return;
        var room = available[id] - shipped[id];
        if (room <= 0) return;
        var add = Math.min(room, remaining);
        shipped[id] += add; remaining -= add;
      });
    }
    var delivered = sumOf(shipped);
    var shortfall = demand - delivered; // Rule 4
    var procurement = 0, surge = 0;
    ids.forEach(function (id) {
      emergency[id] = Math.max(0, shipped[id] - arch.baseline[id]);
      procurement += shipped[id] * S.SUPPLIERS[id].unitCost;
      surge += emergency[id] * S.CONSTANTS.surgePremiumPerCase;
    });
    var premium = arch.dual ? delivered * S.CONSTANTS.multiSourcePremiumPerCase : 0;
    return {
      archId: archId, seedId: seedId || null, demand: demand,
      available: available, shipped: shipped, emergency: emergency,
      delivered: delivered, shortfall: shortfall,
      serviceLevel: delivered / demand, // 0..1
      spend: { procurement: procurement, surge: surge, multiSourcePremium: premium, total: procurement + surge + premium }
    };
  }

  function sumOf(o) { return Object.keys(o).reduce(function (a, k) { return a + o[k]; }, 0); }

  function compareAll(seedId) {
    return S.ARCH_ORDER.map(function (a) { return simulate(a, seedId); });
  }

  // Stage 5b stress test (spec §38.3). Seed-independent.
  function stressTest() {
    return S.ARCH_ORDER.map(function (a) {
      var runs = S.SEED_ORDER.map(function (s) { return simulate(a, s); });
      var services = runs.map(function (r) { return r.serviceLevel; });
      var spends = runs.map(function (r) { return r.spend.total; });
      return {
        archId: a, runs: runs,
        worstService: Math.min.apply(null, services),
        averageService: services.reduce(function (x, y) { return x + y; }, 0) / services.length,
        averageSpend: spends.reduce(function (x, y) { return x + y; }, 0) / spends.length
      };
    });
  }

  function pct(x) { return (Math.round(x * 1000) / 10).toFixed(1) + '%'; }
  function money(x) { return '$' + Math.round(x).toLocaleString('en-US'); }
  function cases(x) { return Math.round(x).toLocaleString('en-US') + ' cases'; }

  var api = { simulate: simulate, compareAll: compareAll, stressTest: stressTest, fmt: { pct: pct, money: money, cases: cases } };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; } else { root.W8Model = api; }
})(typeof window !== 'undefined' ? window : this);
