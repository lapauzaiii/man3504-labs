const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const M = require('../labs/w10-explorer/model.js');
const html = fs.readFileSync(path.join(root, 'labs/w10-explorer/index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'labs/w10-explorer/explorer.js'), 'utf8');

test('stop 1: rocks surface as the buffer falls and fixing them clears shortages', () => {
  assert.deepEqual(M.waterState(14, []).exposed, []);
  assert.equal(M.waterState(2, []).exposed.length, 4);
  assert.equal(M.waterState(2, []).shortageDays, 11);
  assert.equal(M.waterState(2, ['washer', 'malt', 'seams', 'tanks']).shortageDays, 0);
  assert.equal(M.waterState(14, []).cashTiedUp, 29400);
});

test("stop 3: push and pull figures quoted in Lola's take", () => {
  assert.equal(M.simulatePush(60).ending, 177);
  assert.equal(M.simulatePush(48).lost, 0);
  assert.equal(M.simulatePush(38).lost, 81);
  assert.equal(M.simulatePull(80).lost, 87);
  assert.ok(M.simulatePull(80).lost > M.simulatePush(38).lost);
  assert.equal(M.simulatePull(140).lost, 0);
});

test('stop 4: takt and heijunka figures', () => {
  assert.equal(M.taktSeconds(450, 600), 45);
  assert.deepEqual(M.overTakt(M.taktSeconds(450, 700)), ['Filler', 'Seamer']);
  assert.equal(M.taktSeconds(450, 700).toFixed(1), '38.6');
  const batch = M.heijunkaMetrics('batch', 45), level = M.heijunkaMetrics('level', 45);
  assert.equal(batch.changeovers, 2);
  assert.equal(level.changeovers, 14);
  assert.equal(level.setupLost, 630);
  assert.equal(M.heijunkaMetrics('level', 8).setupLost, 112);
  assert.ok(batch.totalWaiting > level.totalWaiting);
  for (const mode of ['batch', 'level']) {
    const made = M.schedule(mode).flat().reduce((s, [, q]) => s + q, 0);
    assert.equal(made, 3000);
  }
});

test('stop 6: PCE swings with classification; idle time is excluded unless forced', () => {
  assert.equal(M.pce({}).lead, 1261);
  assert.equal(M.pce({}).wait, 246);
  assert.ok(M.pce({}).pce < 1);
  assert.equal(M.pce({ valueAdding: ['ferment', 'lager'] }).pce.toFixed(1), '80.5');
  assert.equal(M.pce({}).lead - M.pce({ improved: true }).lead, 158);
  assert.equal(M.pce({ countIdle: true }).lead, 1264);
});

test('stop 7: kanban pallets and late-delivery exposure', () => {
  assert.equal(M.kanban(M.VENDORS.weekly.v, 0.1).k, 12);
  assert.equal(M.kanban(M.VENDORS.partner.v, 0.1).k, 5);
  const weekly = M.disruption(3, 0.1, 1, false), partner = M.disruption(1, 0.1, 1, false);
  assert.ok(partner.lost > weekly.lost);
  assert.ok(M.disruption(1, 0.1, 3, true).lost <= 0.5);
});

test('page stays ungraded, storage-free and separate from graded W10.D data', () => {
  assert.ok(!/localStorage|sessionStorage|indexedDB|document\.cookie/.test(js));
  assert.ok(!/notion\.(so|com)/i.test(html + js));
  assert.ok(!/answer key|\[answer:/i.test(html + js));
  // W10.D Bakery case values must not appear as explorer inputs.
  for (const v of ['390 minutes', '780 units', '236', '294', '329']) assert.ok(!html.includes(v), v);
  for (const id of ['start', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 'wrap']) assert.ok(html.includes(`id="${id}"`), id);
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(home.includes('labs/w10-explorer/'));
});
