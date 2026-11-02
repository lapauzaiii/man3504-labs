const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const M = require('../labs/final-review/explorer/model.js');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const guide = read('labs/final-review/index.html');
const rev = read('labs/final-review/explorer/index.html') + read('labs/final-review/explorer/review.js') + read('labs/final-review/explorer/model.js');
const sess = read('labs/w16-session/index.html') + read('labs/w16-session/session.js');
const P = Object.fromEntries(M.STOPS.flatMap(s => s.problems).map(p => [p.id, p]));
const near = (a, b, t) => Math.abs(a - b) <= t;

test('review answers match the worked solutions', () => {
  assert.equal(P.p1.answer, 2460); assert.equal(P.p2.answer, -6);
  assert.equal(P.p3.answer, 900); assert.ok(near(P.p4.answer, 81, 1e-9)); assert.ok(near(P.p5.answer, 90, 1e-9));
  assert.equal(P.p6.answer, 24000); assert.equal(Math.round(P.p7.answer), 808); assert.equal(Math.round(P.p8.answer), 10408);
  assert.equal(P.p9.answer, 3); assert.equal(P.p10.answer, 5); assert.equal(P.p11.answer, 3);
  assert.ok(near(P.p12.answer, 12.196, 0.0005)); assert.ok(near(P.p13.answer, 0.456, 0.0005));
  assert.ok(near(P.p14.answer, 1.25, 1e-9)); assert.ok(near(P.p15.answer, 1.04, 0.005)); assert.ok(near(P.p16.answer, 0.0497, 0.00005));
  assert.ok(near(P.p17.answer, 0.1261, 1e-9)); assert.ok(near(P.p18.answer, 0.14175, 1e-9)); assert.ok(near(P.p19.answer, 93.3, 0.1));
  assert.equal(Object.keys(P).length, 19);
});

test('checker accepts answers within tolerance and formatted input', () => {
  assert.equal(M.check(P.p6, '24,000').status, 'right');
  assert.equal(M.check(P.p7, '808').status, 'right');
  assert.equal(M.check(P.p7, '1617').status, 'wrong');
  assert.equal(M.check(P.p4, '81%').status, 'right');
  assert.equal(M.check(P.p17, '$0.1261').status, 'right');
  assert.equal(M.check(P.p11, '2.16').status, 'wrong', 'kanban must be rounded up');
  assert.equal(M.check(P.p1, '').status, 'empty');
  assert.equal(M.check(P.p1, 'abc').status, 'invalid');
  for (const s of M.STOPS) assert.ok(s.think.best >= 0 && s.think.best < s.think.options.length);
});

test('study guide blueprint adds to 60 questions and 150 points', () => {
  const qs = [12, 6, 8, 7, 7, 8, 6, 6];
  assert.equal(qs.reduce((a, b) => a + b), 60);
  assert.equal(qs.reduce((a, b) => a + b) * 2.5, 150);
  for (const [q, p] of [[12, 30], [6, 15], [8, 20], [7, 17.5]]) assert.match(guide, new RegExp(`>${q}</td><td class="n">${p}<`));
});

test('final prep pages store nothing and make no unconfirmed promises', () => {
  for (const s of [guide, rev, sess]) {
    assert.doesNotMatch(s, /localStorage|sessionStorage|indexedDB|document\.cookie/);
    assert.doesNotMatch(s, /calculator is allowed|calculator is permitted/i);
  }
  assert.match(sess, /class="slide"/);
  assert.equal((sess.match(/class="slide"/g) || []).length, 11);
});
