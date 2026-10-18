/* Week 10 Lean Explorer — pure calculation model (no DOM, no storage).
   Loaded by the page and by tests/w10-explorer.test.cjs. Illustrative
   Cowford Brewery data only; independent of the W10.D graded case. */
(function (root) {
  'use strict';

  /* ---------- Station 1: lowering the water ---------- */
  const ROCKS = [
    { id: 'washer', depth: 11, title: 'Keg washer breakdowns',
      problem: 'The keg washer fails about once a month. A large cold-room buffer meant nobody noticed the lost day.',
      fix: 'Preventive maintenance schedule and a spare-parts kit', shortage: 2 },
    { id: 'malt', depth: 8, title: 'Late malt deliveries',
      problem: 'One malt delivery in five arrives a day or more late. Extra finished beer had been covering the gap.',
      fix: 'Delivery agreement with the malt supplier, plus a qualified backup', shortage: 3 },
    { id: 'seams', depth: 5, title: 'Can seam failures',
      problem: 'Seam checks fail often enough that whole canning runs are dumped and re-run.',
      fix: 'Stop the seamer at the first failed check and fix the cause (jidoka)', shortage: 4 },
    { id: 'tanks', depth: 3, title: 'Fermenter double-booking',
      problem: 'Two brewers sometimes plan the same fermenter, so a brew day slips.',
      fix: 'A visual tank board everyone updates (visual management)', shortage: 2 }
  ];
  const CASH_PER_BUFFER_DAY = 2100; // $ of finished beer per day of cover

  function waterState(bufferDays, fixedIds) {
    const fixed = new Set(fixedIds || []);
    const exposed = ROCKS.filter(r => bufferDays <= r.depth);
    const unfixed = exposed.filter(r => !fixed.has(r.id));
    return {
      exposed: exposed.map(r => r.id),
      unfixed: unfixed.map(r => r.id),
      shortageDays: unfixed.reduce((s, r) => s + r.shortage, 0),
      cashTiedUp: bufferDays * CASH_PER_BUFFER_DAY
    };
  }

  /* ---------- Station 3: push vs. pull ---------- */
  const DEMAND = [42, 38, 55, 61, 40, 36, 70, 44, 39, 58]; // cases of canned IPA per day
  const START_ON_HAND = 60;

  // Push: package a fixed forecast quantity every day, available the next day.
  function simulatePush(forecast, demand, start) {
    demand = demand || DEMAND;
    let onHand = start == null ? START_ON_HAND : start;
    const days = [];
    for (const d of demand) {
      const sold = Math.min(onHand, d);
      const lost = d - sold;
      days.push({ open: onHand, demand: d, sold, lost });
      onHand = onHand - sold + forecast;
    }
    return summarize(days, onHand);
  }

  // Pull: a fixed number of cases is authorized (kanban). Each day's sales
  // send a signal at closing; packaging refills them the next day, so they
  // are back on the shelf the morning after that (a one-day refill gap).
  function simulatePull(kanban, demand) {
    demand = demand || DEMAND;
    let onHand = kanban;
    let pipeline = 0;                // cases being packaged today
    const days = [];
    for (const d of demand) {
      const sold = Math.min(onHand, d);
      const lost = d - sold;
      days.push({ open: onHand, demand: d, sold, lost });
      onHand = onHand - sold + pipeline; // today's packaging lands tonight
      pipeline = sold;                    // today's sales are refilled tomorrow
    }
    return summarize(days, onHand + pipeline);
  }

  function summarize(days, ending) {
    const lost = days.reduce((s, x) => s + x.lost, 0);
    const avgOnHand = days.reduce((s, x) => s + x.open, 0) / days.length;
    return { days, lost, avgOnHand, ending };
  }

  /* ---------- Station 4: takt and heijunka ---------- */
  const LINE = [
    { name: 'Depalletizer', sec: 18 }, { name: 'Rinser', sec: 30 },
    { name: 'Filler', sec: 44 }, { name: 'Seamer', sec: 40 },
    { name: 'Labeler', sec: 36 }, { name: 'Case packer', sec: 28 }
  ];
  function taktSeconds(availableMinutes, casesDemanded) {
    return (availableMinutes * 60) / casesDemanded;
  }
  function overTakt(takt) { return LINE.filter(s => s.sec > takt).map(s => s.name); }

  const WEEKLY = { IPA: 1500, Lager: 900, Seasonal: 600 }; // cases per 5-day week
  const DAILY_CAPACITY = 600;
  function schedule(mode) {
    const days = [[], [], [], [], []];
    if (mode === 'level') {
      for (const day of days) for (const [beer, wk] of Object.entries(WEEKLY)) day.push([beer, wk / 5]);
      return days;
    }
    let d = 0, room = DAILY_CAPACITY;
    for (const [beer, wk] of Object.entries(WEEKLY)) {
      let left = wk;
      while (left > 0) {
        const qty = Math.min(left, room);
        days[d].push([beer, qty]);
        left -= qty; room -= qty;
        if (room === 0) { d += 1; room = DAILY_CAPACITY; }
      }
    }
    return days;
  }
  function heijunkaMetrics(mode, setupMinutes) {
    const days = schedule(mode);
    const seq = days.flat().map(x => x[0]);
    let changeovers = 0;
    for (let i = 1; i < seq.length; i++) if (seq[i] !== seq[i - 1]) changeovers++;
    // Average finished cases waiting: each beer sells evenly each day (weekly/5).
    // Simulate one steady-state week starting from the stock left at the end of the prior week.
    const avgWaiting = {};
    for (const [beer, wk] of Object.entries(WEEKLY)) {
      const sell = wk / 5;
      const made = days.map(day => day.filter(x => x[0] === beer).reduce((s, x) => s + x[1], 0));
      // Steady-state stock at the start of the week: choose minimum so stock never goes negative.
      let stock = 0, min = 0;
      for (let i = 0; i < 5; i++) { stock += made[i] - sell; min = Math.min(min, stock); }
      let level = -min, total = 0;
      for (let i = 0; i < 5; i++) { level += made[i] - sell; total += level; }
      avgWaiting[beer] = total / 5;
    }
    const daysMade = {};
    for (const beer of Object.keys(WEEKLY)) daysMade[beer] = days.filter(day => day.some(x => x[0] === beer)).length;
    return { days, changeovers, setupLost: changeovers * setupMinutes, avgWaiting,
      totalWaiting: Object.values(avgWaiting).reduce((a, b) => a + b, 0), daysMade };
  }

  /* ---------- Station 6: value stream and PCE ---------- */
  const STREAM = [
    { id: 'silo', name: 'Malt waits in silo', hours: 72, kind: 'wait', improved: 24 },
    { id: 'mash', name: 'Milling and mashing', hours: 3, kind: 'va' },
    { id: 'boil', name: 'Boil and whirlpool', hours: 2.5, kind: 'va' },
    { id: 'clean', name: 'Wait for fermenter cleaning', hours: 18, kind: 'wait', improved: 4 },
    { id: 'ferment', name: 'Fermentation (14 days)', hours: 336, kind: 'choice' },
    { id: 'lager', name: 'Lagering, cold conditioning (28 days)', hours: 672, kind: 'choice' },
    { id: 'slot', name: 'Wait for a packaging slot', hours: 60, kind: 'wait', improved: 12 },
    { id: 'pack', name: 'Packaging', hours: 1.5, kind: 'va' },
    { id: 'hold', name: 'Cold-room hold before pickup', hours: 96, kind: 'wait', improved: 48 }
  ];
  const LINE_IDLE_HOURS = 3; // canning line idle waiting for tank release: resource idle time

  function pce(opts) {
    opts = opts || {};
    const vaChoices = new Set(opts.valueAdding || []);
    let va = 0, lead = 0, wait = 0;
    for (const s of STREAM) {
      const h = opts.improved && s.improved != null ? s.improved : s.hours;
      lead += h;
      if (s.kind === 'va' || (s.kind === 'choice' && vaChoices.has(s.id))) va += h;
      if (s.kind === 'wait') wait += h;
    }
    if (opts.countIdle) lead += LINE_IDLE_HOURS;
    return { va, lead, wait, pce: (va / lead) * 100 };
  }

  /* ---------- Station 7: kanban and vendors ---------- */
  const MALT = { d: 12, r: 0.5, c: 4 }; // sacks/day, days, sacks per pallet
  const VENDORS = {
    weekly: { label: 'Weekly orders from three distributors', v: 3 },
    partner: { label: 'One preferred supplier, three deliveries a week', v: 1 },
    jit2: { label: 'JIT II: supplier planner on site', v: 0.25 }
  };
  function kanban(v, a) {
    const raw = (MALT.d * (v + MALT.r) * (1 + a)) / MALT.c;
    const k = Math.ceil(raw - 1e-9);
    const coverDays = (k * MALT.c) / MALT.d;
    const spare = coverDays - (v + MALT.r);
    return { raw, k, sacks: k * MALT.c, coverDays, spare };
  }
  function disruption(v, a, delayDays, backup) {
    const kb = kanban(v, a);
    let lost = Math.max(0, delayDays - kb.spare);
    if (backup) lost = Math.min(lost, 0.5);
    return Object.assign({}, kb, { lost });
  }

  const api = { ROCKS, CASH_PER_BUFFER_DAY, waterState, DEMAND, START_ON_HAND, simulatePush,
    simulatePull, LINE, taktSeconds, overTakt, WEEKLY, schedule, heijunkaMetrics, STREAM,
    LINE_IDLE_HOURS, pce, MALT, VENDORS, kanban, disruption };
  root.LeanModel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
