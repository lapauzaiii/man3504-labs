const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const M = require('../labs/w13-explorer/model.js');
const dir = path.join(root, 'labs/w13-explorer');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'explorer.js'), 'utf8');
const model = fs.readFileSync(path.join(dir, 'model.js'), 'utf8');
const all = html + js + model;
const r2 = x => Math.round(x * 100) / 100;

test('stop 1: two aligned moves and two trade-offs', () => {
  assert.equal(M.ALIGN.filter(a => a.best === 'Aligned').length, 2);
  assert.equal(M.TBL.map(t => t.best).join(), 'People,Planet,Profit,People');
});

test('stop 2: visibility and audit cost by tier', () => {
  assert.deepEqual(M.visibility([1, 0, 0]), { share: 0.15, cost: 4000, hidden: 0.85 });
  assert.deepEqual(M.visibility([1, 1, 0]), { share: 0.5, cost: 16000, hidden: 0.5 });
  assert.deepEqual(M.visibility([1, 1, 1]), { share: 1, cost: 46000, hidden: 0 });
  assert.equal(M.TIERS.reduce((s, t) => s + t.risk, 0), 1);
});

test('stop 3: TCO figures quoted in Lola\'s take', () => {
  const c = M.compare();
  const [V, Mx, G] = c.rows;
  assert.equal(r2(V.total), 385.35);
  assert.equal(r2(Mx.total), 379.94);
  assert.equal(r2(G.total), 392.86);
  assert.equal(c.best, 'M');
  assert.equal(c.cheapestInvoice, 'V');
  assert.equal(r2(V.parts.defect), 10.85);
  assert.equal(r2(V.parts.safety), 5.25);
  assert.equal(r2(V.parts.disruption), 11.25);
  assert.equal(V.ssWeeks, 4); assert.equal(Mx.ssWeeks, 2); assert.equal(G.ssWeeks, 2);
  assert.equal(Math.round((V.annual - Mx.annual) / 100) * 100, 21600);
  assert.equal(Math.round((G.annual - Mx.annual) / 100) * 100, 51700);
  assert.equal(r2(M.vietnamBreakEvenDisruptions()), 0.78);
  assert.equal(M.compare({ disrV: 0.75 }).best, 'V');
  assert.equal(M.compare({ disrV: 0.8 }).best, 'M');
  assert.equal(Math.round(M.compare({ tariff: 0.10 }).rows[0].total), 418);
  for (const r of c.rows) assert.ok(Math.abs(Object.values(r.parts).reduce((a, b) => a + b, 0) - r.total) < 1e-9);
});

test('stop 4: carbon and revenue at risk', () => {
  assert.equal(M.annualCO2('V'), 380000);
  assert.equal(M.annualCO2('M'), 160000);
  assert.equal(M.annualCO2('G'), 88000);
  assert.equal(Math.round(M.revenueAtRisk(0.35, 0.06)), 201600);
  const v = M.fullPicture('V', {}, 0.35, 0.06);
  assert.equal(Math.round(v.atRisk), 201600);
  assert.equal(M.fullPicture('M', {}, 0.35, 0.06).atRisk, 0);
  const gap = v.annualTco - M.fullPicture('M', {}, 0.35, 0.06).annualTco;
  assert.equal(Math.round(v.atRisk / gap), 9);
  const perKg = (M.fullPicture('G', {}, 0, 0).annualTco - M.fullPicture('M', {}, 0, 0).annualTco) / (160000 - 88000);
  assert.equal(r2(perKg), 0.72);
});

test('stop 5: WBS check enforces the 100% Rule', () => {
  const perfect = Object.fromEntries(M.WBS_ITEMS.map(i => [i.id, i.phase]));
  const ok = M.checkWbs(perfect);
  assert.equal(ok.right, ok.total); assert.ok(ok.hundredPercent);
  const exitOut = Object.assign({}, perfect, { w4: M.OUT });
  assert.equal(M.checkWbs(exitOut).missing, 1);
  const creep = Object.assign({}, perfect, { w9: 'Contract and legal' });
  assert.equal(M.checkWbs(creep).creep, 1);
  assert.equal(M.WBS_ITEMS.find(i => i.id === 'w4').phase, 'Contract and legal');
  for (const p of M.PHASES) assert.ok(M.WBS_ITEMS.filter(i => i.phase === p).length >= 2);
});

test('page: stores nothing, leaks no graded content, keeps Lola and the reading links', () => {
  assert.doesNotMatch(all, /localStorage|sessionStorage|indexedDB|document\.cookie/);
  // Graded W13.D case data must not appear here.
  assert.doesNotMatch(all, /Finca Los Pinos|Global Bean Brokers|Alicia Kwon|Devon Flores|\$4\.80|\$3\.60|36,000/);
  assert.match(html, /lola\.svg/);
  assert.match(html, /W13\.A/);
  for (const id of ['start', 's1', 's2', 's3', 's4', 's5', 'wrap']) assert.match(html, new RegExp(`id="${id}"`));
  assert.equal((html.match(/class="predict"/g) || []).length, 5);
  assert.equal((html.match(/data-take="s\d"/g) || []).length, 5);
});
