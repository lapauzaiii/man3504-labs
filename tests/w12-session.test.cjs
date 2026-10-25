const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../labs/w12-session/model.js');
const dir = path.resolve(__dirname, '../labs/w12-session');
const all = ['index.html', 'session.js', 'model.js'].map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const r3 = x => Math.round(x * 1000) / 1000;

test('trial limits reproduce the W12.A worked mini-example', () => {
  const g = [[2.01, 1.99, 2.03, 2.01], [2.05, 2.08, 2.04, 2.07], [1.97, 1.96, 1.99, 1.98], [2.02, 2.00, 2.03, 2.01]];
  const L = M.trialLimits(g, 4);
  assert.equal(r3(L.grand), 2.015);
  assert.equal(r3(L.rbar), 0.035);
  assert.equal(r3(L.xUCL), 2.041);
  assert.equal(r3(L.xLCL), 1.989);
  assert.equal(r3(L.rUCL), 0.080);
  assert.equal(L.rLCL, 0);
  // Subgroup 2 (2.060) is above the UCL and Subgroup 3 (1.975) below the LCL; ranges are in control.
  assert.deepEqual(M.westernElectric(M.subgroupStats(g).map(s => s.mean), L), [[], [1], [1], []]);
  assert.ok(M.subgroupStats(g).every(s => s.range < L.rUCL));
});

test('Western Electric rules fire on the patterns they describe', () => {
  const L = { grand: 10, xUCL: 13, xLCL: 7, sigmaXbar: 1 };
  assert.deepEqual(M.westernElectric([10, 13.5], L)[1], [1]);
  assert.ok(M.westernElectric([10.2, 10.3, 10.1, 10.4, 10.2, 10.3, 10.1, 10.2], L)[7].includes(2));
  assert.ok(M.westernElectric([9, 9.2, 9.4, 9.6, 9.8, 10.0], L)[5].includes(3));
  assert.ok(M.westernElectric([10, 12.2, 12.5], L)[2].includes(4));
  assert.deepEqual(M.westernElectric([10, 12.2, 9, 9.5, 12.5], L)[4], [], 'only one of the last three beyond 2 sigma');
});

test('tampering adds roughly sqrt(2) more spread over a long run', () => {
  const leave = M.tamper('leave', { seed: 7, count: 40000 });
  const adj = M.tamper('adjust', { seed: 7, count: 40000 });
  const ratio = adj.sd / leave.sd;
  assert.ok(Math.abs(ratio - Math.SQRT2) < 0.03, `ratio ${ratio}`);
  assert.ok(Math.abs(leave.sd - 2) < 0.05);
  // The classroom default seed shows the effect on a 60-loaf run.
  assert.ok(M.tamper('adjust', {}).sd > M.tamper('leave', {}).sd);
});

test('capability: Cp ignores centering, Cpk does not', () => {
  const c = M.capability(800, 2, 790, 810);
  assert.equal(r3(c.cp), 1.667); assert.equal(r3(c.cpk), 1.667);
  const off = M.capability(805, 2, 790, 810);
  assert.equal(r3(off.cp), 1.667); assert.equal(r3(off.cpk), 0.833);
  assert.ok(off.ppm > c.ppm);
  assert.ok(Math.abs(M.capability(0, 1, -3, 3).outside - 0.0027) < 1e-4);
});

test('example timing data: Round 2 sits above the Round 1 limits', () => {
  for (const n of [3, 4, 5]) {
    const ex = M.exampleTiming(3504, n, 8, 5);
    const L = M.trialLimits(ex.round1, n);
    const r1 = M.westernElectric(M.subgroupStats(ex.round1).map(s => s.mean), L);
    assert.ok(r1.every(h => !h.includes(1)), `baseline in control for n=${n}`);
    const r2means = M.subgroupStats(ex.round2).map(s => s.mean);
    assert.ok(r2means.filter(m => m > L.xUCL).length >= 3, `round 2 signals for n=${n}`);
  }
});

test('public page keeps graded material out', () => {
  // No W12.D Cowford Coffee case values, keys, or instructor links.
  for (const s of ['2.030', '1.986', '2.008', 'Cpk = 1.31', 'Dana', 'notion.so', 'notion.com', 'Answer:', 'Southside']) {
    assert.ok(!all.includes(s), `found ${s}`);
  }
  // No Bakery classroom-lab solutions (trial limits or grand mean).
  for (const s of ['801.2', '799.45', '802.95', '5.4768', '2.4 g']) assert.ok(!all.includes(s), `found ${s}`);
});
