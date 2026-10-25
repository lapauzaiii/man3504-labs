/* Week 12 In-Class Session — pure calculation model (no DOM, no storage).
   Loaded by the page and by tests/w12-session.test.cjs. Uses class-generated
   timing data and illustrative values only; independent of the W12.D graded
   Cowford Coffee case, the W12.C concept check, and the Bakery classroom lab. */
(function (root) {
  'use strict';

  // Control chart constants (Krajewski Table 3.1, as printed in W12.A).
  const CONSTANTS = {
    2: { A2: 1.880, D3: 0, D4: 3.267, d2: 1.128 },
    3: { A2: 1.023, D3: 0, D4: 2.574, d2: 1.693 },
    4: { A2: 0.729, D3: 0, D4: 2.282, d2: 2.059 },
    5: { A2: 0.577, D3: 0, D4: 2.114, d2: 2.326 }
  };

  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };

  /* ---------- Subgroup statistics and trial limits ---------- */
  function subgroupStats(groups) {
    return groups.map(g => ({ mean: mean(g), range: Math.max(...g) - Math.min(...g) }));
  }

  function trialLimits(groups, n) {
    const c = CONSTANTS[n];
    if (!c) throw new Error('Subgroup size must be 2 to 5');
    const st = subgroupStats(groups);
    const grand = mean(st.map(s => s.mean));
    const rbar = mean(st.map(s => s.range));
    const spread = c.A2 * rbar;
    return {
      n, grand, rbar,
      xUCL: grand + spread, xLCL: grand - spread,
      rUCL: c.D4 * rbar, rLCL: c.D3 * rbar,
      sigmaXbar: spread / 3,          // one sigma of the subgroup mean
      sigma: rbar / c.d2              // estimated process sigma (individuals)
    };
  }

  /* ---------- Western Electric rules on the X-bar chart ---------- */
  // Returns, for each point, the list of rules (1–4) that point completes.
  function westernElectric(means, lim) {
    const s = lim.sigmaXbar, cl = lim.grand;
    const hits = means.map(() => []);
    means.forEach((m, i) => {
      if (m > lim.xUCL || m < lim.xLCL) hits[i].push(1);
      if (i >= 7) {
        const run = means.slice(i - 7, i + 1);
        if (run.every(v => v > cl) || run.every(v => v < cl)) hits[i].push(2);
      }
      if (i >= 5) {
        const run = means.slice(i - 5, i + 1);
        let up = true, down = true;
        for (let k = 1; k < run.length; k++) { if (!(run[k] > run[k - 1])) up = false; if (!(run[k] < run[k - 1])) down = false; }
        if (up || down) hits[i].push(3);
      }
      if (i >= 2) {
        const run = means.slice(i - 2, i + 1);
        const hi = run.filter(v => v > cl + 2 * s).length, lo = run.filter(v => v < cl - 2 * s).length;
        if ((hi >= 2 && m > cl + 2 * s) || (lo >= 2 && m < cl - 2 * s)) hits[i].push(4);
      }
    });
    return hits;
  }

  /* ---------- Seeded randomness ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function normal(r) {
    let u = 0, v = 0;
    while (u === 0) u = r();
    while (v === 0) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* ---------- Tampering (Deming's funnel, rule 2) ---------- */
  // 'leave': the setting never moves.  'adjust': after every loaf the operator
  // moves the setting by the full deviation from target (compensating).
  function tamper(policy, opts) {
    const o = Object.assign({ seed: 12, count: 60, sigma: 2, target: 800 }, opts);
    const r = rng(o.seed);
    let setting = o.target;
    const out = [];
    for (let i = 0; i < o.count; i++) {
      const w = setting + o.sigma * normal(r);
      out.push(w);
      if (policy === 'adjust') setting -= (w - o.target);
    }
    const dev = out.map(w => Math.abs(w - o.target));
    return { weights: out, sd: sd(out), mean: mean(out), worst: Math.max(...dev) };
  }

  /* ---------- Capability against specifications ---------- */
  function phi(z) {
    const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
    return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
  }
  function capability(mu, sigma, lsl, usl) {
    const cp = (usl - lsl) / (6 * sigma);
    const cpk = Math.min(usl - mu, mu - lsl) / (3 * sigma);
    const below = phi((lsl - mu) / sigma), above = 1 - phi((usl - mu) / sigma);
    return { cp, cpk, below, above, outside: below + above, ppm: (below + above) * 1e6 };
  }

  /* ---------- Example timing data (for a dry run or a solo learner) ---------- */
  // Round 1: people estimating ten seconds tend to stop a little early.
  // Round 2: the same people counting backward by sevens while they estimate.
  function exampleTiming(seed, n, k1, k2) {
    const r = rng(seed || 3504);
    const make = (k, mu, s) => Array.from({ length: k }, () =>
      Array.from({ length: n }, () => Math.round((mu + s * normal(r)) * 100) / 100));
    return { round1: make(k1 || 8, 9.6, 0.9), round2: make(k2 || 5, 12.2, 1.4) };
  }

  const api = { CONSTANTS, mean, sd, subgroupStats, trialLimits, westernElectric, rng, normal, tamper, phi, capability, exampleTiming };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.W12 = api;
})(typeof window !== 'undefined' ? window : this);
