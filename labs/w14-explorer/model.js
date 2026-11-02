/* Week 14 Improvement Explorer: pure calculation model (no DOM, no storage).
   Loaded by the page and by tests/w14-explorer.test.cjs. Illustrative
   Cowford Medical Supply data only; independent of the W14.D graded case
   (Cowford Fitness), the W14.C concept check, and the Week 14 Tech Services
   classroom lab. */
(function (root) {
  'use strict';

  /* ---------- Stop 1: the scorecard's causal chain ---------- */
  // Index values (100 = healthy). Each perspective follows the one below it with a lag,
  // passing on 80% of the shortfall: L&G -> Process (1 quarter) -> Customer (2) -> Financial (2).
  const QUARTERS = 9; // Q0..Q8
  const PASS = 0.8;
  function scorecard(cutPct, restoreAt) {
    const lg = [], p = [], c = [], f = [];
    for (let t = 0; t < QUARTERS; t++) {
      const cut = t >= 1 && (restoreAt == null || t < restoreAt) ? cutPct : 0;
      lg.push(100 - cut);
      p.push(t >= 1 ? 100 - PASS * (100 - lg[t - 1]) : 100);
      c.push(t >= 2 ? 100 - PASS * (100 - p[t - 2]) : 100);
      f.push(t >= 2 ? 100 - PASS * (100 - c[t - 2]) : 100);
    }
    const firstDrop = arr => { const i = arr.findIndex(v => v < 99.95); return i < 0 ? null : i; };
    return { lg, p, c, f, first: { lg: firstDrop(lg), p: firstDrop(p), c: firstDrop(c), f: firstDrop(f) } };
  }

  /* ---------- Stop 2: benchmarking ---------- */
  const CURRENT_CYCLE = 2.4; // order-to-ship days, Westside DC
  const BENCHMARKS = [
    { id: 'internal', type: 'Internal', who: 'Cowford\'s own Orange Park DC', value: 1.6, note: 'Same systems and suppliers, so its practices transfer most directly.' },
    { id: 'competitive', type: 'Competitive', who: 'The leading regional medical distributor', value: 1.2, note: 'A direct rival; data usually comes from industry surveys or customers.' },
    { id: 'functional', type: 'Functional', who: 'A national e-commerce fulfillment leader', value: 0.4, note: 'A different industry known for this one function; the widest gap and the newest ideas.' }
  ];
  function gap(id) { const b = BENCHMARKS.find(x => x.id === id); return Math.round((CURRENT_CYCLE - b.value) * 10) / 10; }
  const BENCH_CARDS = [
    { id: 'b1', text: 'Compare Westside\'s order-to-ship time with Cowford\'s Orange Park distribution center.', best: 'Internal', read: 'Same company, comparable unit. The easiest data to get and the most transferable practices.' },
    { id: 'b2', text: 'Compare fill rates with the largest medical distributor competing for the same hospital contracts.', best: 'Competitive', read: 'A direct rival in the same market. The hard part is getting their data.' },
    { id: 'b3', text: 'Study how an online retailer picks and ships same-day orders, even though it sells no medical products.', best: 'Functional', read: 'Different industry, same function. Crossing industry lines widens the solution space.' },
    { id: 'b4', text: 'Ask the five hospitals that have bought from Cowford for ten years what they would miss most if they switched.', best: 'Reverse', read: 'This looks inward at what loyal customers value. The answer (here, an on-call clinical product specialist) may be a strength to protect rather than a cost to cut.' }
  ];

  /* ---------- Stop 3: PDCA ---------- */
  const PDCA_CARDS = [
    { id: 'p1', text: 'Pull six months of mis-pick data and confirm that most errors occur on look-alike catheter SKUs.', best: 'Plan', read: 'Diagnosis with data, before any change. Plan also sets the success criterion in advance.' },
    { id: 'p2', text: 'Decide in advance that the pilot succeeds only if mis-picks fall below 0.5% for four straight weeks.', best: 'Plan', read: 'Success criteria belong in Plan. Set them after the results arrive and you will move the goalposts.' },
    { id: 'p3', text: 'Add scan-to-confirm on one picking aisle for six weeks.', best: 'Do', read: 'A small, controlled pilot: the minimum scope that produces valid learning.' },
    { id: 'p4', text: 'Plot the pilot aisle\'s weekly mis-pick rate on the existing control chart and compare it with the baseline.', best: 'Check', read: 'Check uses data and signal rules, not the opinion of the person who ran the pilot.' },
    { id: 'p5', text: 'Write the new scanning step into the SOP and roll it out to every aisle.', best: 'Act', read: 'Standardize a verified change. The new performance becomes the next baseline.' },
    { id: 'p6', text: 'The pilot showed no change, so the team returns to the data to test a labeling hypothesis instead.', best: 'Act', read: 'Act has two valid outcomes. Returning to Plan after a failed pilot is still a successful learning cycle.' }
  ];

  /* ---------- Stop 4: Deming's funnel ---------- */
  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function noise(seed, n) {
    const r = rng(seed), out = [];
    while (out.length < n) {
      const u = Math.max(r(), 1e-12), v = r();
      const m = Math.sqrt(-2 * Math.log(u));
      out.push(m * Math.cos(2 * Math.PI * v)); if (out.length < n) out.push(m * Math.sin(2 * Math.PI * v));
    }
    return out;
  }
  // One-dimensional funnel aimed at target 0. z = inherent noise per drop.
  function funnel(rule, seed, n) {
    const z = noise(seed, n); const drops = [];
    let f = 0;
    for (let k = 0; k < n; k++) {
      const x = f + z[k];
      drops.push(x);
      if (rule === 2) f = f - x;        // compensate from the current funnel position
      else if (rule === 3) f = -x;      // compensate from the target
      else if (rule === 4) f = x;       // aim at the last landing spot
    }
    return drops;
  }
  function rmsFromTarget(xs) { return Math.sqrt(xs.reduce((s, x) => s + x * x, 0) / xs.length); }
  const FUNNEL_RULES = [
    { rule: 1, name: 'Rule 1: Leave it alone', note: 'The funnel stays over the target. Only the process\'s own noise remains.' },
    { rule: 2, name: 'Rule 2: Compensate for the last error', note: 'Move the funnel the same distance as the last miss, in the opposite direction.' },
    { rule: 3, name: 'Rule 3: Aim opposite the last landing', note: 'Set the funnel the same distance from the target as the last miss, on the other side.' },
    { rule: 4, name: 'Rule 4: Aim at the last landing', note: 'Put the funnel over wherever the last drop landed.' }
  ];

  /* ---------- Stop 5: CPM and PERT ---------- */
  function project(fastC) {
    const A = [
      { id: 'A', name: 'Select scanner vendor', pre: [], a: 1, m: 2, b: 3 },
      { id: 'B', name: 'Write the new picking SOP', pre: [], a: 2, m: 3, b: 4 },
      { id: 'C', name: 'Configure WMS integration', pre: ['A'], a: fastC ? 2 : 3, m: fastC ? 3 : 4, b: fastC ? 5 : 8 },
      { id: 'D', name: 'Pilot at Westside DC', pre: ['B', 'C'], a: 2, m: 3, b: 7 },
      { id: 'E', name: 'Train staff at the other DCs', pre: ['B'], a: 1, m: 2, b: 3 },
      { id: 'F', name: 'Roll out to the other DCs', pre: ['D', 'E'], a: 2, m: 3, b: 4 },
      { id: 'G', name: 'Verify results on control charts', pre: ['F'], a: 1, m: 2, b: 3 }
    ];
    A.forEach(x => { x.te = (x.a + 4 * x.m + x.b) / 6; x.v = Math.pow((x.b - x.a) / 6, 2); });
    const by = Object.fromEntries(A.map(x => [x.id, x]));
    A.forEach(x => { x.es = Math.max(0, ...x.pre.map(p => by[p].ef)); x.ef = x.es + x.te; });
    const end = Math.max(...A.map(x => x.ef));
    for (const x of A.slice().reverse()) {
      const succ = A.filter(s => s.pre.includes(x.id));
      x.lf = succ.length ? Math.min(...succ.map(s => s.ls)) : end; x.ls = x.lf - x.te; x.slack = x.ls - x.es;
    }
    const crit = A.filter(x => Math.abs(x.slack) < 1e-9);
    const variance = crit.reduce((s, x) => s + x.v, 0);
    return { acts: A, duration: end, critical: crit.map(x => x.id).join(''), variance, sd: Math.sqrt(variance) };
  }
  function phi(z) {
    const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
    return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
  }
  function onTime(target, fastC) { const p = project(fastC); const z = (target - p.duration) / p.sd; return { z, prob: phi(z), duration: p.duration, sd: p.sd }; }

  const api = { QUARTERS, scorecard, CURRENT_CYCLE, BENCHMARKS, gap, BENCH_CARDS, PDCA_CARDS, noise, funnel, rmsFromTarget, FUNNEL_RULES, project, phi, onTime };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ImprovementModel = api;
})(typeof window !== 'undefined' ? window : this);
