const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const M = require('../labs/w14-explorer/model.js');
const dir = path.join(root, 'labs/w14-explorer');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'explorer.js'), 'utf8');
const model = fs.readFileSync(path.join(dir, 'model.js'), 'utf8');
const all = html + js + model;
const r2 = x => Math.round(x * 100) / 100;

test('stop 1: the cut reaches revenue in Q6, about 15 months later', () => {
  const s = M.scorecard(30);
  assert.deepEqual(s.first, { lg: 1, p: 2, c: 4, f: 6 });
  assert.equal(r2(s.f[6]), 84.64);
  assert.ok(s.f.slice(0, 6).every(v => v === 100));
  const r = M.scorecard(30, 3);
  assert.ok(r.f[6] < 100 && r.f[7] < 100 && r.f[8] === 100, 'restoring in Q3 still dips Q6-Q7, recovers Q8');
  assert.deepEqual(M.scorecard(0).first, { lg: null, p: null, c: null, f: null });
});

test('stop 2: benchmark gaps', () => {
  assert.deepEqual(['internal', 'competitive', 'functional'].map(M.gap), [0.8, 1.2, 2.0]);
  assert.equal(M.BENCH_CARDS.map(c => c.best).join(), 'Internal,Competitive,Functional,Reverse');
});

test('stop 3: two Plan, one Do, one Check, two Act', () => {
  const n = k => M.PDCA_CARDS.filter(c => c.best === k).length;
  assert.deepEqual([n('Plan'), n('Do'), n('Check'), n('Act')], [2, 1, 1, 2]);
});

test('stop 4: funnel rules add variation to a stable process', () => {
  const long = [1, 2, 3, 4].map(k => M.rmsFromTarget(M.funnel(k, 1, 20000)));
  assert.ok(Math.abs(long[0] - 1) < 0.03);
  assert.ok(Math.abs(long[1] - Math.SQRT2) < 0.05, 'rule 2 is about sqrt(2) times rule 1');
  assert.ok(long[2] > 3 && long[3] > 3);
  const short = [1, 2, 3, 4].map(k => M.rmsFromTarget(M.funnel(k, 3504, 50)));
  assert.ok(short[0] < short[1] && short[1] < short[2] && short[2] < short[3]);
  assert.deepEqual(M.funnel(2, 9, 10), M.funnel(2, 9, 10), 'seeded and repeatable');
});

test('stop 5: CPM and PERT figures quoted in Lola\'s take', () => {
  const p = M.project(false);
  assert.equal(r2(p.duration), 15);
  assert.equal(p.critical, 'ACDFG');
  assert.equal(r2(p.variance), 1.72);
  assert.equal(r2(p.sd), 1.31);
  const by = Object.fromEntries(p.acts.map(a => [a.id, a]));
  assert.equal(r2(by.B.slack), 3.5); assert.equal(r2(by.E.slack), 5);
  assert.equal(r2(by.C.te), 4.5); assert.equal(r2(by.C.v), 0.69);
  assert.equal(Math.round(M.onTime(16).prob * 100), 78);
  assert.equal(Math.round(M.onTime(15).prob * 100), 50);
  const q = M.project(true);
  assert.equal(r2(q.duration), 13.67);
  assert.equal(r2(Object.fromEntries(q.acts.map(a => [a.id, a])).C.te), 3.17);
  assert.ok(M.onTime(16, true).prob > 0.98);
});

test('page: stores nothing, leaks no graded content, keeps Lola and the reading links', () => {
  assert.doesNotMatch(all, /localStorage|sessionStorage|indexedDB|document\.cookie/);
  assert.doesNotMatch(all, /Priya|Mehta|Planet Fitness|Orangetheory|spin class|\$2,304,000/);
  assert.match(html, /lola\.svg/);
  assert.match(html, /W14\.A/);
  for (const id of ['start', 's1', 's2', 's3', 's4', 's5', 'wrap']) assert.match(html, new RegExp(`id="${id}"`));
  assert.equal((html.match(/class="predict"/g) || []).length, 5);
  assert.equal((html.match(/data-take="s\d"/g) || []).length, 5);
});
