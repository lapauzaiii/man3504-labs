/* Week 13 Sourcing Explorer — pure calculation model (no DOM, no storage).
   Loaded by the page and by tests/w13-explorer.test.cjs. Illustrative
   Cowford Green Build data only; independent of the W13.D graded case
   (Cowford Coffee), the W13.C concept check, and the Week 13 Brewery
   classroom lab. */
(function (root) {
  'use strict';

  /* ---------- Stop 1: Triple Bottom Line ---------- */
  const TBL = [
    { id: 't1', text: 'Recordable injuries on Green Build job sites fell from 3.1 to 1.4 per 100 workers after a new fall-protection standard.',
      best: 'People', read: 'Worker health and safety is the social dimension. It also saves money, but the measure itself is about people.' },
    { id: 't2', text: 'The share of construction waste diverted from landfill rose from 41% to 72%.',
      best: 'Planet', read: 'Waste diverted from landfill is an environmental measure, one of the Planet metrics beyond carbon.' },
    { id: 't3', text: 'Margin on LEED-certified projects runs four points above margin on conventional projects.',
      best: 'Profit', read: 'This is economic performance. Sustainability can create profit, but the metric is a margin.' },
    { id: 't4', text: 'Every framing subcontractor now passes a third-party check that it pays the prevailing wage.',
      best: 'People', read: 'Labor conditions in the supply chain sit in the People dimension, including for workers Green Build does not employ directly.' }
  ];
  const ALIGN = [
    { id: 'a1', text: 'Switch site lighting and trailers to LED.',
      best: 'Aligned', read: 'Lower energy bills and lower emissions at the same time. When sustainability also cuts cost, the decision is easy.' },
    { id: 'a2', text: 'Specify recycled-content structural steel at an 8% price premium.',
      best: 'Trade-off', read: 'This lowers embodied carbon but costs more. This is where the reading says sustainability gets hard: someone has to decide the premium is worth it.' },
    { id: 'a3', text: 'Consolidate supplier deliveries into full truckloads instead of partial loads.',
      best: 'Aligned', read: 'Higher freight density cuts both freight cost per unit and emissions per unit, the energy-efficiency domain in the textbook.' },
    { id: 'a4', text: 'Pay for audits of the glass and aluminum suppliers behind the window assembler.',
      best: 'Trade-off', read: 'Audits cost real money and do not lower the purchase price. The payoff is risk you can now see and manage.' }
  ];

  /* ---------- Stop 2: who can you see? ---------- */
  // Share of the window supply chain's identified labor and environmental
  // risk located at each tier (illustrative), and the yearly cost to audit it.
  const TIERS = [
    { tier: 1, name: 'Window assembler', risk: 0.15, audit: 4000 },
    { tier: 2, name: 'Glass makers and aluminum extruders', risk: 0.35, audit: 12000 },
    { tier: 3, name: 'Aluminum smelting and silica sand mining', risk: 0.50, audit: 30000 }
  ];
  function visibility(on) {
    on = on || [];
    let share = 0, cost = 0;
    TIERS.forEach((t, i) => { if (on[i]) { share += t.risk; cost += t.audit; } });
    return { share: Math.round(share * 1000) / 1000, cost, hidden: Math.round((1 - share) * 1000) / 1000 };
  }

  /* ---------- Stop 3: total cost of ownership ---------- */
  const UNITS = 4000;                // window units bought per year
  const SUPPLIERS = [
    { id: 'V', name: 'Haiphong, Vietnam', kind: 'Offshore', price: 310, freight: 42, insp: 6, defect: 0.035, lead: 12, disr: 1.5, disrCost: 30000, co2: 95, verified: false },
    { id: 'M', name: 'Monterrey, Mexico', kind: 'Nearshore', price: 345, freight: 18, insp: 4, defect: 0.020, lead: 4, disr: 0.5, disrCost: 25000, co2: 40, verified: true },
    { id: 'G', name: 'Macon, Georgia', kind: 'Domestic (reshore)', price: 372, freight: 9, insp: 3, defect: 0.012, lead: 2, disr: 0.25, disrCost: 20000, co2: 22, verified: true }
  ];
  const BASE = { tariff: 0, disrV: 1.5, carry: 0.22 };
  const ssWeeks = lead => (lead <= 6 ? 2 : 4);

  function tco(s, opt) {
    opt = Object.assign({}, BASE, opt || {});
    const price = s.id === 'V' ? s.price * (1 + opt.tariff) : s.price;
    const disr = s.id === 'V' ? opt.disrV : s.disr;
    const parts = {
      price,
      freight: s.freight,
      insp: s.insp,
      defect: s.defect * price,
      safety: ssWeeks(s.lead) / 52 * price * opt.carry,
      disruption: disr * s.disrCost / UNITS
    };
    const total = Object.values(parts).reduce((a, b) => a + b, 0);
    return { id: s.id, parts, total, invoice: price, annual: total * UNITS, ssWeeks: ssWeeks(s.lead) };
  }
  function compare(opt) {
    const rows = SUPPLIERS.map(s => Object.assign({ name: s.name, kind: s.kind }, tco(s, opt)));
    const best = rows.reduce((b, r) => (r.total < b.total ? r : b));
    const cheapestInvoice = rows.reduce((b, r) => (r.invoice < b.invoice ? r : b));
    return { rows, best: best.id, cheapestInvoice: cheapestInvoice.id };
  }
  // Highest Vietnam disruption frequency at which Vietnam still has the lowest TCO
  // (other settings fixed). Returns null if Vietnam can't win even at zero disruptions.
  function vietnamBreakEvenDisruptions(opt) {
    opt = Object.assign({}, BASE, opt || {});
    const v0 = tco(SUPPLIERS[0], Object.assign({}, opt, { disrV: 0 })).total;
    const others = Math.min(tco(SUPPLIERS[1], opt).total, tco(SUPPLIERS[2], opt).total);
    if (v0 >= others) return null;
    return (others - v0) * UNITS / SUPPLIERS[0].disrCost;
  }

  /* ---------- Stop 4: planet and profit ---------- */
  const REVENUE = 9600000;
  function annualCO2(id) { const s = SUPPLIERS.find(x => x.id === id); return s.co2 * UNITS; }
  function revenueAtRisk(share, premium) { return share * REVENUE * premium; }
  function fullPicture(id, opt, share, premium) {
    const s = SUPPLIERS.find(x => x.id === id);
    const c = compare(opt);
    const mine = c.rows.find(r => r.id === id);
    return {
      annualTco: mine.annual,
      co2: annualCO2(id),
      atRisk: s.verified ? 0 : revenueAtRisk(share, premium),
      verified: s.verified
    };
  }

  /* ---------- Stop 5: building the WBS ---------- */
  const PHASES = ['Supplier qualification', 'Contract and legal', 'Logistics and quality transition', 'Audit and compliance'];
  const OUT = 'Out of scope';
  const WBS_ITEMS = [
    { id: 'w1', text: 'Visit the Monterrey plant and confirm it can handle 4,000 units a year', phase: 'Supplier qualification' },
    { id: 'w2', text: 'Inspect 20 first-article sample windows against Green Build\'s specification', phase: 'Supplier qualification' },
    { id: 'w3', text: 'Draft a 3-year supply agreement with volume and lead-time terms', phase: 'Contract and legal' },
    { id: 'w4', text: 'Give the current Haiphong supplier six months\' written notice', phase: 'Contract and legal' },
    { id: 'w5', text: 'Set up cross-border trucking and a customs broker', phase: 'Logistics and quality transition' },
    { id: 'w6', text: 'Update the incoming inspection checklist for the new supplier', phase: 'Logistics and quality transition' },
    { id: 'w7', text: 'Schedule an annual third-party labor and environmental audit', phase: 'Audit and compliance' },
    { id: 'w8', text: 'Map the Tier 2 glass and aluminum sources behind the Monterrey plant', phase: 'Audit and compliance' },
    { id: 'w9', text: 'Bid on the new Riverside medical office building', phase: OUT },
    { id: 'w10', text: 'Redesign the Cowford Green Build logo', phase: OUT }
  ];
  function checkWbs(assign) {
    assign = assign || {};
    const rows = WBS_ITEMS.map(it => ({ id: it.id, chosen: assign[it.id] || '', correct: it.phase, ok: assign[it.id] === it.phase }));
    const inScope = WBS_ITEMS.filter(it => it.phase !== OUT);
    const missing = inScope.filter(it => !assign[it.id] || assign[it.id] === OUT).length;
    const creep = WBS_ITEMS.filter(it => it.phase === OUT && assign[it.id] && assign[it.id] !== OUT).length;
    const placed = rows.filter(r => r.chosen).length;
    return { rows, right: rows.filter(r => r.ok).length, total: rows.length, placed, missing, creep, hundredPercent: missing === 0 && creep === 0 };
  }

  const api = { TBL, ALIGN, TIERS, visibility, UNITS, SUPPLIERS, BASE, ssWeeks, tco, compare, vietnamBreakEvenDisruptions,
    REVENUE, annualCO2, revenueAtRisk, fullPicture, PHASES, OUT, WBS_ITEMS, checkWbs };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SourcingModel = api;
})(typeof window !== 'undefined' ? window : this);
