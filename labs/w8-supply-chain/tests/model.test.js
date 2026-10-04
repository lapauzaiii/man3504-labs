// Run: node --test labs/w8-supply-chain/tests/
// Every expected value below is copied from the W8 Supply Chain Pilot Specification (§12, §13, §30.2, §38.3).
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../model.js');

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: got ${a}, expected ${b}`);

test('§12 baseline outcomes (no disruption)', () => {
  const exp = { globalmed: 92000, medserv: 100000, dual: 104800 };
  for (const [a, spend] of Object.entries(exp)) {
    const r = M.simulate(a, null);
    assert.equal(r.delivered, 2000, a);
    assert.equal(r.serviceLevel, 1, a);
    assert.equal(r.spend.total, spend, a);
  }
});

const matrix = [
  ['3504-W8-01', 'globalmed', 0, 0, 2000, 0.0, 0],
  ['3504-W8-01', 'medserv', 2000, 0, 0, 100, 100000],
  ['3504-W8-01', 'dual', 2000, 0, 0, 100, 112800],
  ['3504-W8-02', 'globalmed', 0, 2000, 0, 100, 92000],
  ['3504-W8-02', 'medserv', 0, 0, 2000, 0, 0],
  ['3504-W8-02', 'dual', 0, 2000, 0, 100, 107200],
  ['3504-W8-03', 'globalmed', 0, 2400, 100, 96.0, 112800],
  ['3504-W8-03', 'medserv', 2500, 0, 0, 100, 128000],
  ['3504-W8-03', 'dual', 1200, 1300, 0, 100, 132800],
  ['3504-W8-04', 'globalmed', 0, 840, 1160, 42.0, 38640],
  ['3504-W8-04', 'medserv', 910, 0, 1090, 45.5, 45500],
  ['3504-W8-04', 'dual', 910, 840, 250, 87.5, 91380]
];
for (const [seed, arch, med, glob, short, svc, spend] of matrix) {
  test(`§13 ${seed} × ${arch}`, () => {
    const r = M.simulate(arch, seed);
    assert.equal(r.shipped.medserv, med, 'MedServ cases');
    assert.equal(r.shipped.globalmed, glob, 'GlobalMed cases');
    assert.equal(r.shortfall, short, 'shortfall');
    close(r.serviceLevel * 100, svc, 1e-9, 'service %');
    assert.equal(r.spend.total, spend, 'spend');
  });
}

test('§30.2 Seed 04 capacity rounding: 910 and 840', () => {
  const r = M.simulate('dual', '3504-W8-04');
  assert.equal(r.available.medserv, 910);
  assert.equal(r.available.globalmed, 840);
});

test('§38.3 stress-test fixtures', () => {
  const st = M.stressTest();
  const by = Object.fromEntries(st.map(x => [x.archId, x]));
  assert.equal(by.globalmed.worstService, 0);
  assert.equal(by.medserv.worstService, 0);
  close(by.dual.worstService * 100, 87.5, 1e-9, 'dual worst');
  close(by.globalmed.averageService * 100, 59.5, 1e-9, 'gm avg');
  close(by.medserv.averageService * 100, 61.375, 1e-9, 'ms avg');
  close(by.dual.averageService * 100, 96.875, 1e-9, 'dual avg');
  assert.equal(by.globalmed.averageSpend, 60860);
  assert.equal(by.medserv.averageSpend, 68375);
  assert.equal(by.dual.averageSpend, 111045);
  assert.equal(M.fmt.pct(by.medserv.averageService), '61.4%');
  assert.equal(M.fmt.pct(by.dual.averageService), '96.9%');
});

test('Canvas keys: Q6 seed keys and Q9 common key', () => {
  close(M.simulate('globalmed', '3504-W8-01').serviceLevel * 100, 0.0, 1e-9, 'Q6 s01');
  close(M.simulate('medserv', '3504-W8-02').serviceLevel * 100, 0.0, 1e-9, 'Q6 s02');
  close(M.simulate('globalmed', '3504-W8-03').serviceLevel * 100, 96.0, 1e-9, 'Q6 s03');
  close(M.simulate('dual', '3504-W8-04').serviceLevel * 100, 87.5, 1e-9, 'Q6 s04');
  const st = M.stressTest();
  const best = st.slice().sort((a, b) => b.worstService - a.worstService || a.averageSpend - b.averageSpend)[0];
  assert.equal(best.archId, 'dual', 'Q9 robustness rule selects dual');
});
