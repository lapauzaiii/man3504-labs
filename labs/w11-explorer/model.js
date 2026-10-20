/* Week 11 Quality Explorer — pure calculation model (no DOM, no storage).
   Loaded by the page and by tests/w11-explorer.test.cjs. Illustrative
   Cowford Logistics data only; independent of the W11.D graded case,
   the W11.C concept check, and the Week 11 Medical Supply classroom lab. */
(function (root) {
  'use strict';

  /* ---------- Statistics helpers ---------- */
  // Standard normal CDF (Abramowitz and Stegun 7.1.26; |error| < 1.5e-7).
  function phi(z) {
    const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t *
      Math.exp(-(z * z) / 2);
    return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
  }
  // Inverse standard normal CDF (Acklam's rational approximation).
  function invPhi(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.3577518672690, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const lo = 0.02425, hi = 1 - lo;
    let q, r;
    if (p < lo) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (p > hi) {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  /* ---------- Stop 1: dimensions of quality, and Deming ---------- */
  const DIMENSIONS = [
    { id: 'd1', text: 'A grocery customer\'s order arrives on the promised day with exactly the items and quantities on the packing list.',
      best: 'Conformance', read: 'The order met its specification: right items, right count, promised date. That is conformance, and it is what an operations manager controls most directly.' },
    { id: 'd2', text: 'Cowford\'s refrigerated trailers hold loads within half a degree of the set point, while most competitors hold within two degrees.',
      best: 'Performance', read: 'This is about how well the service does its job compared with alternatives, not whether it met a specification. That is performance quality.' },
    { id: 'd3', text: 'After the trucks were repainted and drivers got new uniforms, customer ratings rose, even though on-time delivery did not change.',
      best: 'Perceived', read: 'Nothing in the operation changed, but customers believe quality went up. That is perceived quality, shaped by appearance and brand.' }
  ];

  // Mis-picks last month by picker. "system" = errors at look-alike bin pairs
  // (the bin layout and labels); "own" = errors not tied to the layout.
  const PICKERS = [
    { name: 'Picker A', system: 11, own: 3 }, { name: 'Picker B', system: 8, own: 3 },
    { name: 'Picker C', system: 10, own: 3 }, { name: 'Picker D', system: 9, own: 3 },
    { name: 'Picker E', system: 12, own: 4 }, { name: 'Picker F', system: 10, own: 2 }
  ];
  const BIN_FIX_KEEP = 0.2;   // relabeling look-alike bins + scan-to-confirm keeps 20% of system errors
  const RETRAIN_OWN = 1;      // retraining one picker leaves 1 personal error
  function pickerErrors(opts) {
    opts = opts || {};
    const worst = PICKERS.reduce((w, p, i) => (p.system + p.own > PICKERS[w].system + PICKERS[w].own ? i : w), 0);
    const rows = PICKERS.map((p, i) => {
      const system = opts.fixBins ? Math.round(p.system * BIN_FIX_KEEP) : p.system;
      const own = opts.retrain && i === worst ? RETRAIN_OWN : p.own;
      return { name: p.name, system, own, total: system + own };
    });
    const total = rows.reduce((s, r) => s + r.total, 0);
    const base = PICKERS.reduce((s, p) => s + p.system + p.own, 0);
    const systemBase = PICKERS.reduce((s, p) => s + p.system, 0);
    return { rows, total, base, worst, systemShare: systemBase / base, cut: (base - total) / base };
  }

  /* ---------- Stop 2: cost of quality ---------- */
  // Cost of one mis-pick depending on where it is caught.
  const ESCALATION = [
    { id: 'pick', where: 'At the pick face (scan mismatch)', cost: 1.5, kind: 'Internal failure', note: 'Put the item back and pick the right one.' },
    { id: 'pack', where: 'At the pack check', cost: 6, kind: 'Internal failure', note: 'Unpack, walk back to the aisle, re-pick, repack.' },
    { id: 'dock', where: 'At the dock audit', cost: 20, kind: 'Internal failure', note: 'Pull the pallet, break it down, rebuild, and possibly miss the truck.' },
    { id: 'customer', where: 'At the customer', cost: 95, kind: 'External failure', note: 'Return freight, a re-ship, a retailer chargeback, and a service call.' }
  ];
  function escalation(stageId, errorsPerYear) {
    const i = ESCALATION.findIndex(s => s.id === stageId);
    const s = ESCALATION[i];
    return { stage: s, perError: s.cost, perYear: s.cost * (errorsPerYear || 1000), multipleOfPick: s.cost / ESCALATION[0].cost };
  }

  // Annual cost of quality for the Westside distribution center.
  const COQ = {
    orders: 120000,        // orders shipped per year
    floorRate: 0.004,      // error rate prevention cannot remove (per order)
    reducibleRate: 0.016,  // error rate at baseline prevention that prevention can remove
    basePrevention: 15000, // $ per year today
    decay: 40000,          // $ of prevention that cuts the reducible rate by about 63%
    caughtShare: 0.6,      // share of errors caught before shipping
    internalCost: 12,      // $ per error caught in the building
    externalCost: 95,      // $ per error that reaches the customer
    baseAppraisal: 60000,  // $ per year of inspection and audits
    minAppraisal: 20000    // appraisal floor if inspection is scaled to the error rate
  };
  function errorRate(prevention) {
    return COQ.floorRate + COQ.reducibleRate * Math.exp(-(prevention - COQ.basePrevention) / COQ.decay);
  }
  function coq(prevention, scaleAppraisal) {
    const rate = errorRate(prevention);
    const errors = COQ.orders * rate;
    const internal = errors * COQ.caughtShare * COQ.internalCost;
    const external = errors * (1 - COQ.caughtShare) * COQ.externalCost;
    const baseRate = errorRate(COQ.basePrevention);
    const appraisal = scaleAppraisal
      ? COQ.minAppraisal + (COQ.baseAppraisal - COQ.minAppraisal) * (rate / baseRate)
      : COQ.baseAppraisal;
    const failure = internal + external;
    const total = prevention + appraisal + failure;
    return { prevention, appraisal, internal, external, failure, total, rate, errors, failureShare: failure / total };
  }
  // Prevention level (in $1,000 steps) with the lowest total cost of quality.
  function bestPrevention(scaleAppraisal, min, max, step) {
    min = min == null ? 5000 : min; max = max == null ? 150000 : max; step = step || 1000;
    let best = min, bestTotal = Infinity;
    for (let p = min; p <= max; p += step) {
      const t = coq(p, scaleAppraisal).total;
      if (t < bestTotal - 1e-9) { bestTotal = t; best = p; }
    }
    return { prevention: best, total: bestTotal };
  }

  /* ---------- Stop 3: TQM tools (Pareto) ---------- */
  // Order errors found anywhere (pick, pack, dock or customer), one quarter.
  const CAUSES = [
    { cause: 'Damaged in transit', count: 78 },
    { cause: 'Wrong item (look-alike SKU)', count: 292 },
    { cause: 'Late carrier pickup', count: 37 },
    { cause: 'Wrong quantity', count: 125 },
    { cause: 'Missing paperwork', count: 19 },
    { cause: 'Wrong address label', count: 49 }
  ];
  function pareto() {
    const total = CAUSES.reduce((s, c) => s + c.count, 0);
    let cum = 0;
    const rows = [...CAUSES].sort((a, b) => b.count - a.count).map(c => {
      cum += c.count;
      return { cause: c.cause, count: c.count, share: c.count / total * 100, cumulative: cum / total * 100 };
    });
    return { total, rows };
  }
  function coverage(selected) {
    const set = new Set(selected || []);
    const p = pareto();
    const hit = p.rows.filter(r => set.has(r.cause)).reduce((s, r) => s + r.count, 0);
    return { count: hit, share: hit / p.total * 100 };
  }

  /* ---------- Stop 4: Six Sigma, DMAIC, SERVQUAL ---------- */
  const DMAIC = [
    { id: 'a', text: 'Write a charter: cut mis-shipped orders at the Westside center, owned by the operations lead, 12-week timeline.', phase: 'Define' },
    { id: 'b', text: 'Define what counts as a mis-shipment and record three months of baseline errors per 1,000 orders.', phase: 'Measure' },
    { id: 'c', text: 'Use the Pareto chart and a fishbone diagram, then test whether look-alike SKUs really drive wrong-item errors.', phase: 'Analyze' },
    { id: 'd', text: 'Pilot color-coded bins and scan-to-confirm in two aisles before rolling it out to the building.', phase: 'Improve' },
    { id: 'e', text: 'Post a weekly mis-ship chart with a response rule, so the error rate cannot creep back unnoticed.', phase: 'Control' }
  ];
  const PHASES = ['Define', 'Measure', 'Analyze', 'Improve', 'Control'];
  const DPMO_DATA = { orders: 30000, defects: 600 }; // one quarter at Westside, errors found anywhere
  function dpmo(orders, opportunities, defects) {
    const value = defects / (orders * opportunities) * 1e6;
    return { value, sigma: invPhi(1 - value / 1e6) + 1.5, perThousandOrders: defects / orders * 1000 };
  }
  function sigmaFromDpmo(value) { return invPhi(1 - value / 1e6) + 1.5; }

  // Delivery customers' SERVQUAL survey, 1–7 scale.
  const SERVQUAL = [
    { dim: 'Reliability', expect: 6.6, perceive: 5.2, example: 'Deliveries arrive in the promised window' },
    { dim: 'Responsiveness', expect: 6.1, perceive: 5.5, example: 'Dispatch answers and reschedules quickly' },
    { dim: 'Assurance', expect: 5.8, perceive: 5.7, example: 'Drivers know the products and handling rules' },
    { dim: 'Empathy', expect: 5.2, perceive: 5.0, example: 'Account reps know each customer\'s dock rules' },
    { dim: 'Tangibles', expect: 4.9, perceive: 5.3, example: 'Clean trucks, uniforms, readable paperwork' }
  ];
  function servqualGaps() {
    return SERVQUAL.map(s => ({ dim: s.dim, gap: Math.round((s.perceive - s.expect) * 10) / 10 }));
  }

  /* ---------- Stop 5: process capability ---------- */
  // Cold-chain trailers: product temperature must stay between 2 and 8 °C.
  const CAPABILITY = { lsl: 2, usl: 8, mean: 5.9, sd: 0.7, unit: '°C' };
  function capability(mean, sd, lsl, usl) {
    lsl = lsl == null ? CAPABILITY.lsl : lsl; usl = usl == null ? CAPABILITY.usl : usl;
    const cp = (usl - lsl) / (6 * sd);
    const upper = (usl - mean) / (3 * sd), lower = (mean - lsl) / (3 * sd);
    const cpk = Math.min(upper, lower);
    const outShare = phi((lsl - mean) / sd) + (1 - phi((usl - mean) / sd));
    return { cp, cpk, upper, lower, outShare, ppm: outShare * 1e6, nearest: upper < lower ? 'upper' : (lower < upper ? 'lower' : 'centered') };
  }
  // Textbook test: judge capability on Cpk; if it fails, Cp says whether variability or centering is the problem.
  function verdict(cp, cpk, critical) {
    const r2 = x => Math.round(x * 100) / 100;
    if (r2(cpk) >= critical) return 'capable';
    if (r2(cp) >= critical) return 'recenter';
    return 'reduce-variability';
  }

  const api = { phi, invPhi, DIMENSIONS, PICKERS, pickerErrors, ESCALATION, escalation, COQ, errorRate, coq,
    bestPrevention, CAUSES, pareto, coverage, DMAIC, PHASES, DPMO_DATA, dpmo, sigmaFromDpmo, SERVQUAL,
    servqualGaps, CAPABILITY, capability, verdict };
  root.QualityModel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
