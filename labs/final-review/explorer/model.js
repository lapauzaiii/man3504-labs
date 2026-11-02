/* Final Review Explorer: data and checking model (no DOM, no storage).
   One connected, illustrative Cowford Brewery scenario (a new canning line)
   that touches every quantitative topic on the final. Numbers are original
   and independent of the final exam and every graded quiz.
   Loaded by the page and by tests/final-review.test.cjs. */
(function (root) {
  'use strict';
  const r = (x, d) => Math.round(x * Math.pow(10, d)) / Math.pow(10, d);

  // Every answer is computed here, so the tests and the page share one source of truth.
  const eoq = Math.sqrt(2 * 480000 * 90 / 0.15);
  const ss = 1.65 * 200 * Math.sqrt(6);
  const sp = Math.sqrt(0.02 * 0.98 / 200);
  const tcoA = 0.11 + 0.01 + 0.01 * 0.11 + 1 * 12000 / 2400000;
  const tcoB = 0.10 + 0.02 + 0.03 * 0.10 + 3 * 15000 / 2400000;
  function phi(z) {
    const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
    return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
  }

  const STOPS = [
    { id: 's1', title: 'Forecast the demand', weeks: 'Weeks 4–5',
      lola: 'Cowford Brewery is adding a canning line for its flagship lager. Everything downstream depends on the forecast, so let\'s start there.',
      setup: 'Last month the forecast was 2,400 cases and actual demand was 2,600. The brewery uses exponential smoothing with α = 0.3. Over the past six months, the cumulative forecast error (actual − forecast) is −360 cases and the MAD is 60 cases.',
      problems: [
        { id: 'p1', prompt: 'This month\'s exponential smoothing forecast (cases)', answer: 2400 + 0.3 * (2600 - 2400), tol: 0.5, dp: 0,
          hint: 'New forecast = old forecast + α × (actual − old forecast).', solution: '2,400 + 0.3 × (2,600 − 2,400) = 2,400 + 60 = 2,460 cases.' },
        { id: 'p2', prompt: 'Tracking signal', answer: -360 / 60, tol: 0.05, dp: 1,
          hint: 'Tracking signal = CFE ÷ MAD. Keep the sign.', solution: '−360 ÷ 60 = −6. Beyond ±4, and negative: actuals keep coming in below the forecast, so it runs high and should be reviewed.' }
      ],
      think: { q: 'The tracking signal is −6. What should the planner conclude?', options: ['The forecast is biased high and the method needs review', 'The forecast is biased low', 'The forecast is fine; only the magnitude of TS matters below 10'], best: 0,
        why: 'A negative CFE means demand keeps falling short of the forecast. Outside ±4 is the course\'s review threshold.' } },
    { id: 's2', title: 'Find the bottleneck', weeks: 'Weeks 2–3',
      lola: 'The line has three machines. One of them sets the pace for all three, and it isn\'t always the one people complain about.',
      setup: 'Each can passes through a filler (3.0 seconds), a seamer (4.0 seconds) and a labeler (2.5 seconds), one machine each. Separately, the line\'s design capacity is 8,000 cans per shift, its effective capacity is 7,200, and last shift it produced 6,480.',
      problems: [
        { id: 'p3', prompt: 'Maximum output of the line (cans per hour)', answer: 3600 / 4, tol: 0.5, dp: 0,
          hint: 'The slowest step limits the whole line.', solution: 'The seamer is the bottleneck at 4.0 seconds per can: 3,600 ÷ 4 = 900 cans per hour.' },
        { id: 'p4', prompt: 'Utilization (%)', answer: 6480 / 8000 * 100, tol: 0.05, dp: 1,
          hint: 'Utilization compares actual output with design capacity.', solution: '6,480 ÷ 8,000 = 81.0%.' },
        { id: 'p5', prompt: 'Efficiency (%)', answer: 6480 / 7200 * 100, tol: 0.05, dp: 1,
          hint: 'Efficiency compares actual output with effective capacity.', solution: '6,480 ÷ 7,200 = 90.0%.' }
      ],
      think: { q: 'Before buying a second seamer, the Theory of Constraints says to first…', options: ['Exploit the seamer: keep it running through breaks and changeovers', 'Speed up the filler and labeler', 'Elevate immediately, since the constraint is known'], best: 0,
        why: 'Identify, exploit, subordinate, then elevate. Spending money comes after getting the most from the current constraint.' } },
    { id: 's3', title: 'Stock the lids', weeks: 'Week 9',
      lola: 'No lids, no cans. Let\'s decide how many to order and when.',
      setup: 'The line uses 480,000 lids a year (1,600 a day over 300 operating days). Each order costs $90 to place, and holding one lid for a year costs $0.15. Lead time is a constant 6 days, daily demand has a standard deviation of 200 lids, and the target service level uses z = 1.65.',
      problems: [
        { id: 'p6', prompt: 'Economic order quantity (lids)', answer: eoq, tol: 1, dp: 0,
          hint: 'EOQ = √(2DS ÷ H).', solution: '√(2 × 480,000 × 90 ÷ 0.15) = √576,000,000 = 24,000 lids.' },
        { id: 'p7', prompt: 'Safety stock (lids)', answer: ss, tol: 1.5, dp: 0,
          hint: 'SS = z × σd × √L, with L in days.', solution: '1.65 × 200 × √6 = 1.65 × 200 × 2.449 ≈ 808 lids.' },
        { id: 'p8', prompt: 'Reorder point (lids)', answer: 1600 * 6 + ss, tol: 1.5, dp: 0,
          hint: 'ROP = average demand during lead time + safety stock.', solution: '1,600 × 6 + 808 ≈ 10,408 lids.' }
      ],
      think: { q: 'If the brewery switched to reviewing lid stock only every two weeks (a P system), safety stock would…', options: ['Rise, because it must cover the review period plus the lead time', 'Fall, because reviews are scheduled', 'Stay the same'], best: 0,
        why: 'A periodic system is exposed to demand uncertainty for longer, so it needs more protection.' } },
    { id: 's4', title: 'Run it lean', weeks: 'Week 10',
      lola: 'Customers want 8,400 cans a shift. Can the line keep the beat?',
      setup: 'A shift has 420 available minutes and demand is 8,400 cans per shift. A pallet spends 300 minutes from filling to shipping, of which 15 minutes is value-added work. Lids move to the seamer in kanban containers of 500; the seamer uses 1,200 lids an hour, container lead time is 0.75 hour, and the safety factor is 20%.',
      problems: [
        { id: 'p9', prompt: 'Takt time (seconds per can)', answer: 420 * 60 / 8400, tol: 0.05, dp: 1,
          hint: 'Takt = available time ÷ demand. Convert minutes to seconds.', solution: '25,200 seconds ÷ 8,400 cans = 3.0 seconds per can. The seamer takes 4.0, so the line cannot keep pace without more seaming capacity.' },
        { id: 'p10', prompt: 'Process cycle efficiency (%)', answer: 15 / 300 * 100, tol: 0.05, dp: 1,
          hint: 'PCE = value-added time ÷ total lead time.', solution: '15 ÷ 300 = 5.0%. Most of the pallet\'s time is waiting.' },
        { id: 'p11', prompt: 'Number of kanban containers', answer: Math.ceil(1200 * 0.75 * 1.2 / 500), tol: 0, dp: 0,
          hint: 'k = d(w + p)(1 + α) ÷ c, then round up.', solution: '1,200 × 0.75 × 1.2 ÷ 500 = 2.16, rounded up to 3 containers.' }
      ],
      think: { q: 'Takt is 3.0 seconds and the seamer needs 4.0. Which statement is right?', options: ['The line cannot meet demand until seaming capacity rises or demand is smoothed', 'The line meets demand because the other two machines are faster than takt', 'Takt time should be raised to 4.0 seconds to match the seamer'], best: 0,
        why: 'Every step must run at or below takt. Changing takt means changing customer demand or available time, not redefining it.' } },
    { id: 's5', title: 'Control the fill', weeks: 'Weeks 11–12',
      lola: 'Every can should hold 12 ounces. Let\'s check whether the filler is stable, and whether it\'s good enough.',
      setup: 'Samples of 4 cans: grand mean 12.05 oz, average range 0.20 oz (A₂ = 0.729, D₃ = 0, D₄ = 2.282). Specifications are 11.7 to 12.3 oz, and the process standard deviation is 0.08 oz. Separately, about 2% of cans are dented; inspectors check 200 cans per shift.',
      problems: [
        { id: 'p12', prompt: 'X-bar chart UCL (oz)', answer: 12.05 + 0.729 * 0.20, tol: 0.002, dp: 3,
          hint: 'UCL = X̄̄ + A₂R̄.', solution: '12.05 + 0.729 × 0.20 = 12.196 oz. The LCL is 11.904 oz.' },
        { id: 'p13', prompt: 'R chart UCL (oz)', answer: 2.282 * 0.20, tol: 0.002, dp: 3,
          hint: 'UCL = D₄R̄.', solution: '2.282 × 0.20 = 0.456 oz; LCL = 0.' },
        { id: 'p14', prompt: 'Cp', answer: 0.6 / 0.48, tol: 0.005, dp: 2,
          hint: 'Cp = (USL − LSL) ÷ 6σ.', solution: '0.6 ÷ 0.48 = 1.25.' },
        { id: 'p15', prompt: 'Cpk', answer: Math.min(0.35 / 0.24, 0.25 / 0.24), tol: 0.005, dp: 2,
          hint: 'Cpk = the smaller of (mean − LSL) ÷ 3σ and (USL − mean) ÷ 3σ.', solution: 'min((12.05 − 11.7) ÷ 0.24, (12.3 − 12.05) ÷ 0.24) = min(1.46, 1.04) = 1.04. The mean sits closer to the upper limit.' },
        { id: 'p16', prompt: 'p-chart UCL for dented cans', answer: 0.02 + 3 * sp, tol: 0.0005, dp: 4,
          hint: 'σp = √(p̄(1 − p̄) ÷ n); UCL = p̄ + 3σp.', solution: 'σp = √(0.02 × 0.98 ÷ 200) = 0.0099. UCL = 0.02 + 0.0297 = 0.0497. The LCL computes negative, so it is 0.' }
      ],
      think: { q: 'With Cp = 1.25 and Cpk = 1.04 against a 1.33 standard, the brewery should…', options: ['Reduce variation; even perfectly centered, the spread is too wide', 'Only recenter the mean', 'Do nothing, because the chart shows no signals'], best: 0,
        why: 'Cp fails, so no set point can pass. Recentering helps Cpk a little, but the real fix is a narrower spread.' } },
    { id: 's6', title: 'Source and improve', weeks: 'Weeks 13–14',
      lola: 'Last stop. Where should the cans come from, and how sure are we that the line will be finished on time?',
      setup: 'The line will use 2.4 million cans a year. Supplier A: $0.11 per can, $0.01 freight, 1% defects, 1 disruption a year costing $12,000. Supplier B: $0.10 per can, $0.02 freight, 3% defects, 3 disruptions a year costing $15,000 each. The installation project\'s critical path has an expected length of 18 weeks and a variance of 4; the target is 21 weeks.',
      problems: [
        { id: 'p17', prompt: 'Supplier A total cost per can ($)', answer: tcoA, tol: 0.00005, dp: 4,
          hint: 'Price + freight + defect rate × price + (disruptions × cost) ÷ annual volume.', solution: '0.11 + 0.01 + 0.0011 + 0.0050 = $0.1261 per can.' },
        { id: 'p18', prompt: 'Supplier B total cost per can ($)', answer: tcoB, tol: 0.00005, dp: 4,
          hint: 'Same components as Supplier A.', solution: '0.10 + 0.02 + 0.0030 + 0.01875 = $0.1418 per can. B\'s cheaper price costs about $37,600 a year more in total.' },
        { id: 'p19', prompt: 'Probability of finishing within 21 weeks (%)', answer: phi((21 - 18) / Math.sqrt(4)) * 100, tol: 0.5, dp: 1,
          hint: 'z = (target − expected) ÷ √variance, then use the normal table.', solution: 'z = 3 ÷ 2 = 1.5, about 93.3%.' }
      ],
      think: { q: 'Six weeks after the line starts, defects jump on three days in a row, all inside the control limits. The supervisor wants to change the filler settings each time. What should happen?', options: ['Leave it alone unless a run rule or limit is broken; adjusting stable noise adds variation', 'Adjust after each high day to pull defects back down', 'Switch to Supplier B to fix it'], best: 0,
        why: 'This is the funnel lesson. Act on special-cause signals; improve stable processes with PDCA, not reactions.' } }
  ];

  function check(problem, value) {
    if (value === '' || value === null || value === undefined) return { status: 'empty' };
    const v = Number(String(value).replace(/[,$%\s]/g, ''));
    if (!isFinite(v)) return { status: 'invalid' };
    const ok = Math.abs(v - problem.answer) <= problem.tol + 1e-9;
    return { status: ok ? 'right' : 'wrong', value: v };
  }

  const api = { STOPS, check, phi, r };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ReviewModel = api;
})(typeof window !== 'undefined' ? window : this);
