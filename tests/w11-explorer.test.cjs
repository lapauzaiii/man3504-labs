const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const M = require('../labs/w11-explorer/model.js');
const dir = path.join(root, 'labs/w11-explorer');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'explorer.js'), 'utf8');
const model = fs.readFileSync(path.join(dir, 'model.js'), 'utf8');
const all = html + js + model;
const r1 = x => Math.round(x * 10) / 10;
const r2 = x => Math.round(x * 100) / 100;

test('statistics helpers match the W11.A sigma table', () => {
  assert.ok(Math.abs(M.phi(0) - 0.5) < 1e-7);
  assert.ok(Math.abs(M.phi(1.96) - 0.975) < 1e-4);
  assert.ok(Math.abs(M.invPhi(0.975) - 1.96) < 1e-3);
  // 3σ, 4σ, 5σ, 6σ with the 1.5σ shift.
  assert.deepEqual([66807, 6210, 233, 3.4].map(v => r2(M.sigmaFromDpmo(v))), [3, 4, 5, 6]);
});

test('stop 1: fixing the shared system beats retraining one picker', () => {
  const base = M.pickerErrors({});
  assert.equal(base.total, 78);
  assert.equal(base.systemShare, 60 / 78);
  assert.equal(M.PICKERS[base.worst].name, 'Picker E');
  assert.equal(M.pickerErrors({ retrain: true }).total, 75);
  assert.equal(M.pickerErrors({ fixBins: true }).total, 30);
  assert.equal(M.pickerErrors({ retrain: true, fixBins: true }).total, 27);
  assert.equal(Math.round(M.pickerErrors({ retrain: true }).cut * 100), 4);
  assert.equal(Math.round(M.pickerErrors({ fixBins: true }).cut * 100), 62);
  assert.equal(M.DIMENSIONS.map(d => d.best).join(), 'Conformance,Performance,Perceived');
});

test('stop 2: defects get more expensive the later they are caught', () => {
  const costs = M.ESCALATION.map(s => s.cost);
  for (let i = 1; i < costs.length; i++) assert.ok(costs[i] > costs[i - 1]);
  assert.equal(Math.round(M.escalation('customer').multipleOfPick), 63);
  assert.equal(M.ESCALATION[3].kind, 'External failure');
});

test('stop 2: cost of quality figures quoted in Lola\'s take', () => {
  const today = M.coq(15000, false);
  assert.equal(Math.round(today.total), 183480);
  assert.equal(today.errors, 2400);
  const more = M.coq(45000, false);
  assert.ok(more.total < today.total, 'tripling prevention lowers the total');
  assert.equal(Math.round(more.total / 100) * 100, 167700);
  assert.deepEqual(M.bestPrevention(false, 5000, 150000, 5000).prevention, 45000);
  const scaled = M.bestPrevention(true, 5000, 150000, 5000);
  assert.equal(scaled.prevention, 60000);
  assert.equal(Math.round(scaled.total / 100) * 100, 148300);
  assert.ok(M.coq(150000, false).total > 200000 && M.coq(150000, true).total > 200000);
  // Category totals always add up.
  for (const p of [5000, 45000, 150000]) for (const s of [false, true]) {
    const c = M.coq(p, s);
    assert.ok(Math.abs(c.prevention + c.appraisal + c.internal + c.external - c.total) < 1e-6);
  }
});

test('stop 3: Pareto order and coverage', () => {
  const p = M.pareto();
  assert.equal(p.total, 600);
  assert.equal(p.rows[0].cause, 'Wrong item (look-alike SKU)');
  assert.equal(r1(p.rows[1].cumulative), 69.5);
  assert.equal(p.rows[0].count + p.rows[1].count, 417);
  assert.equal(r1(p.rows[p.rows.length - 1].cumulative), 100);
  assert.equal(M.coverage(['Wrong item (look-alike SKU)', 'Wrong quantity']).count, 417);
  assert.equal(Math.round(M.coverage(['Damaged in transit']).share), 13);
  // Quarter errors match the 2% baseline rate on 30,000 orders.
  assert.equal(p.total, M.DPMO_DATA.defects);
  assert.equal(M.DPMO_DATA.orders * M.errorRate(15000), 600);
});

test('stop 4: DMAIC order, DPMO definition, and SERVQUAL gaps', () => {
  assert.deepEqual(M.DMAIC.map(s => s.phase), M.PHASES);
  const one = M.dpmo(30000, 1, 600), four = M.dpmo(30000, 4, 600);
  assert.equal(one.value, 20000);
  assert.equal(four.value, 5000);
  assert.equal(r2(one.sigma), 3.55);
  assert.equal(r2(four.sigma), 4.08);
  assert.equal(one.perThousandOrders, 20);
  assert.equal(four.perThousandOrders, 20);
  const gaps = M.servqualGaps();
  const worst = gaps.reduce((a, b) => (b.gap < a.gap ? b : a));
  assert.equal(worst.dim, 'Reliability');
  assert.equal(worst.gap, -1.4);
  assert.equal(gaps.find(g => g.dim === 'Tangibles').gap, 0.4);
});

test('stop 5: capability test follows the textbook (Cpk first, Cp to diagnose)', () => {
  const now = M.capability(5.9, 0.7);
  assert.equal(r2(now.cp), 1.43);
  assert.equal(r2(now.cpk), 1);
  assert.equal(now.nearest, 'upper');
  assert.equal(Math.round(now.ppm / 10) * 10, 1350);
  assert.equal(M.verdict(now.cp, now.cpk, 1.33), 'recenter');
  const centered = M.capability(5.0, 0.7);
  assert.equal(r2(centered.cpk), 1.43);
  assert.equal(Math.round(centered.ppm), 18);
  assert.equal(M.verdict(centered.cp, centered.cpk, 1.33), 'capable');
  for (let m = 3; m <= 7; m += 0.1) {
    const c = M.capability(m, 1.0);
    assert.ok(c.cpk <= c.cp + 1e-12);
    assert.equal(M.verdict(c.cp, c.cpk, 1.33), 'reduce-variability');
  }
});

test("Lola's takes quote the model's own figures", () => {
  for (const s of ['from 78 mis-picks to 75', 'to 30, about 62% fewer', '60 of the 78 errors (77%)', '$1.50', '63 times',
    'about $183,500', 'about $167,700', 'about $60,000', 'near $148,300', '417 of 600', '20,000 DPMO', '3.55 sigma',
    '5,000 DPMO', '4.08 sigma', '20 bad orders in every 1,000', '−1.4', 'Cp is 1.43', 'Cpk is only 1.00', '1,350', '18 per million']) {
    assert.ok(html.includes(s), s);
  }
});

test('explorer contains no W11.D (or W11.C) values', () => {
  // W11.D Cowford Brewery case: Table 1 costs, category totals, and key answers.
  const dollars = [162000, 28500, 14200, 31000, 47800, 63400, 89000, 112000, 24500, 18700, 22000, 19300,
    54900, 221500, 111200, 244800, 632400, 356000, 225500, 442680, 189720];
  for (const n of dollars) {
    const variants = [String(n), n.toLocaleString('en-US')];
    for (const v of variants) assert.ok(!new RegExp('(^|[^0-9.,])' + v.replace(/,/g, ',') + '(?![0-9])').test(all), `W11.D value ${v} found`);
  }
  // W11.D Table 2 carbonation data and key decimals, as standalone numbers
  // (digits inside longer constants, such as statistical coefficients, are not values).
  const standalone = v => new RegExp('(^|[^0-9.])' + v.replace(/\./g, '\\.') + '(?![0-9])');
  for (const v of ['2.40', '2.80', '2.66', '56.3', '0.93', '4.1']) assert.ok(!standalone(v).test(all), `W11.D value ${v} found`);
  for (const s of ['4.2%', 'St. Johns', 'Brewery', 'carbonation', 'CO₂', 'allergen']) {
    assert.ok(!all.includes(s), `W11.D marker "${s}" found`);
  }
  // W11.C Item 13 data.
  for (const v of ['9.4', '10.6']) assert.ok(!standalone(v).test(all), `W11.C value ${v} found`);
});

test('page stays ungraded, storage-free, and wired to the directory', () => {
  assert.ok(!/localStorage|sessionStorage|indexedDB|document\.cookie/.test(js + model));
  assert.ok(!/notion\.(so|com)/i.test(all));
  assert.ok(!/answer key|\[answer:/i.test(all));
  for (const id of ['start', 's1', 's2', 's3', 's4', 's5', 'wrap']) assert.ok(html.includes(`id="${id}"`), id);
  assert.equal((html.match(/class="predict"/g) || []).length, 5);
  assert.equal((html.match(/class="take" id="take-s\d"/g) || []).length, 5);
  assert.ok(fs.existsSync(path.join(dir, 'lola.svg')) && fs.existsSync(path.join(dir, 'lola-june.png')));
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(home.includes('labs/w11-explorer/'));
});
