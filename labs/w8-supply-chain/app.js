/* MAN 3504 W8 — Cowford Medical Supply Network Disruption Simulator
   Diagnose -> Choose -> Experience consequence -> Revise -> Stress test -> Audit AI -> Receipt.
   No backend, no external calls, no student identifiers, never navigates the parent frame. */
(function () {
  'use strict';
  var S = window.W8Scenarios, M = window.W8Model, ST = window.W8State, R = window.W8Receipt;
  var F = M.fmt;
  var STAGES = ['diagnose', 'choose', 'consequence', 'revise', 'stress', 'audit', 'complete'];

  var LABELS = {
    diagnosis: {
      efficiency: 'Pure efficiency',
      hedging: 'Risk-hedging capability (already-qualified redundant supply)',
      inventory: 'Maximum inventory',
      price: 'Lowest invoice price'
    },
    rationale: {
      cost: 'It had the lowest procurement spend in the disruption week.',
      service: 'It delivered the highest service this week, whatever it costs.',
      network: 'It keeps a qualified, independent path to supply if one source fails, and I accept its recurring cost.',
      always: 'This architecture is always the right choice for medical supplies.'
    },
    audit: {
      complete: 'The recommendation is complete because normal-week procurement spend is an objective metric.',
      incomplete: 'The recommendation is incomplete because it optimizes normal-week procurement spend without incorporating disruption service, supplier concentration, and shared upstream dependency evidence.',
      dualAlways: 'The recommendation is wrong because dual sourcing is always the correct supply-chain design.',
      scoreAlways: 'The recommendation is wrong because the supplier with the highest weighted score must always be the sole source.'
    },
    evidence: {
      frequency: 'Disruption frequency by supplier or shipping lane',
      severity: 'Cost and severity of a hospital service failure',
      qualify: 'Time required to qualify an alternate supplier',
      tier2: 'Shared Tier-2 dependencies between suppliers',
      volatility: 'Future demand volatility',
      contract: 'Contractual service requirements with hospitals'
    }
  };

  var DIAG_FEEDBACK = {
    hedging: 'Risk-hedging capability fits. Demand is stable, but supply is concentrated and a hospital stockout is a patient-safety event. Stable demand plus unstable supply is Lee\u2019s risk-hedging quadrant: keep already-qualified redundant supply even though demand itself is calm.',
    efficiency: 'Stable demand does support efficiency. The missing factor is the consequence of a supply failure. Reconsider whether the lowest-cost network can tolerate interruption.',
    inventory: 'Inventory can buffer a disruption, but maximizing it ignores carrying cost and does nothing about where supply comes from. Week 9 sizes inventory protection; this week\u2019s decision is the sourcing network itself.',
    price: 'Invoice price is one input to total cost, not a design posture. It says nothing about what happens when a source fails.'
  };

  var RATIONALE_FEEDBACK = {
    cost: 'This rationale rests on procurement spend alone. In a disruption, spend can fall simply because fewer cases arrived. Check delivered cases and service before relying on it.',
    service: 'Service matters most here, but this rationale ignores what the protection costs in every normal week. A defensible choice weighs the recurring premium against the exposure it removes.',
    network: 'This rationale connects your choice to observed capacity, concentration, or upstream dependency, and it acknowledges the recurring cost. That is the evidence a sourcing decision needs.',
    always: 'The revision may be reasonable, but this explanation does not connect the choice to observed service, cost, capacity, or concentration risk. No architecture is right for every situation.'
  };

  var app = document.getElementById('app');
  var live = document.getElementById('live');
  var params = new URLSearchParams(window.location.search);
  var seedId = params.get('seed');
  var preview = window.W8_PREVIEW === true;
  if (preview && !S.SEEDS[seedId]) { seedId = S.SEED_ORDER[3]; }
  var state = S.SEEDS[seedId] ? ST.load(seedId) : null;
  var pendingFocus = null;
  var confirmingReset = false;

  // ---------- tiny DOM helper (textContent only; no innerHTML from data) ----------
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }
  function stageIndex(s) { return STAGES.indexOf(s); }
  function reached(s) { return stageIndex(state.stage) >= stageIndex(s); }
  function commit(next, focusId) {
    Object.assign(state, next);
    ST.save(state);
    pendingFocus = focusId || null;
    render();
  }
  function announce(msg) { live.textContent = ''; window.setTimeout(function () { live.textContent = msg; }, 50); }

  function section(id, step, title, kids) {
    return h('section', { class: 'stage', id: id, 'aria-labelledby': id + '-h' }, [
      h('h2', { id: id + '-h', tabindex: '-1' }, [h('span', { class: 'step', 'aria-hidden': 'true', text: String(step) }), h('span', { class: 'visually-hidden', text: 'Step ' + step + ': ' }), title])
    ].concat(kids));
  }

  function radioGroup(name, legend, options, selected, disabled) {
    return h('fieldset', { class: 'choices' }, [h('legend', { text: legend })].concat(options.map(function (o) {
      var id = name + '-' + o.value;
      return h('div', { class: 'choice' }, [
        h('input', { type: 'radio', name: name, id: id, value: o.value, checked: selected === o.value, disabled: disabled }),
        h('label', { for: id }, [h('span', { class: 'choice-title', text: o.title }), o.detail ? h('span', { class: 'choice-detail', text: o.detail }) : null])
      ]);
    })));
  }
  function checkboxGroup(name, legend, options, selected, disabled) {
    return h('fieldset', { class: 'choices' }, [h('legend', { text: legend })].concat(options.map(function (o) {
      var id = name + '-' + o.value;
      return h('div', { class: 'choice' }, [
        h('input', { type: 'checkbox', name: name, id: id, value: o.value, checked: selected.indexOf(o.value) > -1, disabled: disabled }),
        h('label', { for: id }, [h('span', { class: 'choice-title', text: o.title })])
      ]);
    })));
  }
  function picked(name) { var el = app.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : null; }
  function pickedAll(name) { return Array.prototype.map.call(app.querySelectorAll('input[name="' + name + '"]:checked'), function (e) { return e.value; }); }
  function errorNote(id) { return h('p', { class: 'error', id: id, role: 'alert', hidden: true }); }
  function showError(id, msg) { var e = document.getElementById(id); e.textContent = msg; e.hidden = false; }

  function slip(id, heading, value, note) {
    return h('div', { class: 'slip', id: id, tabindex: '-1' }, [
      h('div', { class: 'slip-body' }, [h('p', { class: 'slip-heading', text: heading }), h('p', { class: 'slip-value', text: value }), note ? h('p', { class: 'slip-note', text: note }) : null]),
      h('span', { class: 'stamp', 'aria-hidden': 'true', text: 'Locked' })
    ]);
  }

  // ---------- data tables (convert to stacked cards at narrow widths via CSS + data-label) ----------
  function table(caption, head, rows, rowClass) {
    return h('div', { class: 'table-wrap' }, [h('table', { class: 'data' }, [
      h('caption', { text: caption }),
      h('thead', null, [h('tr', null, head.map(function (c) { return h('th', { scope: 'col', text: c }); }))]),
      h('tbody', null, rows.map(function (r, i) {
        return h('tr', { class: rowClass ? rowClass(i) : null }, r.map(function (c, j) {
          var content = typeof c === 'string' ? [c] : c;
          return j === 0 ? h('th', { scope: 'row', 'data-label': head[0] }, content) : h('td', { 'data-label': head[j] }, content);
        }));
      }))
    ])]);
  }
  function marker(text) { return h('span', { class: 'marker', text: text }); }

  // ---------- brief ----------
  function brief() {
    var sup = Object.keys(S.SUPPLIERS).map(function (k) { return S.SUPPLIERS[k]; });
    return h('section', { class: 'brief', 'aria-labelledby': 'brief-h' }, [
      h('h2', { id: 'brief-h', text: 'The sourcing decision' }),
      h('p', { text: 'Cowford Medical Supply buys a critical PPE input for hospital clients. Demand is stable at 2,000 cases per week, but failing to supply a hospital is a patient-safety event. Procurement has already scored the suppliers; both below have passed minimum qualification. You will choose a sourcing architecture before you know what disruption the week will bring.' }),
      table('Qualified suppliers', ['Supplier', 'Weighted score', 'Unit cost', 'Qualified weekly capacity', 'Normal lead time'],
        sup.map(function (s) { return [s.name, s.score.toFixed(2), F.money(s.unitCost) + ' per case', F.cases(s.capacity), s.leadTimeDays + ' days']; })),
      table('Sourcing architectures in a normal week', ['Architecture', 'Weekly allocation', 'Normal weekly spend'],
        S.ARCH_ORDER.map(function (a) {
          var A = S.ARCHITECTURES[a], r = M.simulate(a, null);
          var alloc = A.dual ? '1,200 MedServ + 800 GlobalMed' : (a === 'medserv' ? '2,000 MedServ' : '2,000 GlobalMed');
          return [A.label + ' (' + A.posture + ')', alloc, F.money(r.spend.total)];
        })),
      h('p', { class: 'fine', text: 'Dual sourcing carries a multi-source execution premium of $4 per delivered case, covering duplicated quality coordination, split-order handling, and ongoing dual-source administration. All three architectures meet 100% of normal weekly demand.' })
    ]);
  }

  // ---------- stage 1: diagnose ----------
  function stageDiagnose() {
    var locked = !!state.diagnosis;
    var kids = [
      h('p', { text: 'Cowford Medical Supply has relatively stable demand, but a supply failure can interrupt hospital service. Which design posture should management prioritize before choosing a supplier architecture?' }),
      radioGroup('diagnosis', 'Design posture', Object.keys(LABELS.diagnosis).map(function (k) { return { value: k, title: LABELS.diagnosis[k] }; }), state.diagnosis, locked)
    ];
    if (!locked) {
      kids.push(errorNote('diag-err'));
      kids.push(h('button', { type: 'button', class: 'primary', text: 'Lock my diagnosis', onclick: function () {
        var v = picked('diagnosis'); if (!v) return showError('diag-err', 'Select a design posture to continue.');
        commit({ diagnosis: v, stage: 'choose' }, 'diag-feedback');
      } }));
    } else {
      kids.push(h('div', { class: 'feedback', id: 'diag-feedback', tabindex: '-1' }, [h('p', { class: 'feedback-title', text: 'Feedback on your diagnosis' }), h('p', { text: DIAG_FEEDBACK[state.diagnosis] }), h('p', { class: 'fine', text: 'Your diagnosis does not limit what you can choose next.' })]));
    }
    return section('s-diagnose', 1, 'Diagnose the design posture', kids);
  }

  // ---------- stage 2: choose ----------
  function archOptions() {
    return S.ARCH_ORDER.map(function (a) {
      var A = S.ARCHITECTURES[a];
      return { value: a, title: A.label, detail: A.summary + ' Normal weekly spend: ' + F.money(M.simulate(a, null).spend.total) + '.' };
    });
  }
  function stageChoose() {
    var locked = !!state.initialArch;
    var kids = [h('p', { text: 'Choose one sourcing architecture. The disruption is revealed only after you lock this decision, and the locked choice stays on record.' })];
    if (!locked) {
      kids.push(radioGroup('initial', 'Initial sourcing architecture', archOptions(), null, false));
      kids.push(errorNote('init-err'));
      kids.push(h('button', { type: 'button', class: 'primary', text: 'Lock my sourcing decision', onclick: function () {
        var v = picked('initial'); if (!v) return showError('init-err', 'Select a sourcing architecture to continue.');
        var r = M.simulate(v, state.seed), seed = S.SEEDS[state.seed];
        commit({ initialArch: v, stage: 'consequence' }, 'slip-initial');
        announce('Disruption revealed: ' + seed.title + '. Your architecture, ' + S.ARCHITECTURES[v].label + ', delivered ' + F.cases(r.delivered) + ' of ' + F.cases(r.demand) + ', a service level of ' + F.pct(r.serviceLevel) + ', with procurement spend of ' + F.money(r.spend.total) + '.');
      } }));
    } else {
      kids.push(slip('slip-initial', 'Your original choice', S.ARCHITECTURES[state.initialArch].label, S.ARCHITECTURES[state.initialArch].summary));
    }
    return section('s-choose', 2, 'Choose your sourcing architecture', kids);
  }

  // ---------- stage 3: consequence ----------
  function whyLines(r, seed) {
    var lines = [];
    Object.keys(S.SUPPLIERS).forEach(function (id) {
      var sname = S.SUPPLIERS[id].name, f = seed.availability[id];
      var contracted = S.ARCHITECTURES[r.archId].baseline[id] > 0;
      var avail = f === 1 ? 'fully available (' + F.cases(r.available[id]) + ')' : (f === 0 ? 'unavailable (0 cases)' : 'limited to ' + Math.round(f * 100) + '% of normal capacity (' + F.cases(r.available[id]) + ')');
      lines.push(sname + ' was ' + avail + ' this week' + (contracted ? '.' : ', but your architecture had no contract or qualification with it, and no unqualified supplier can be added during a disruption week.'));
    });
    if (seed.demand !== S.CONSTANTS.baseDemand) lines.push('Observed demand rose to ' + F.cases(seed.demand) + ' against a normal week of ' + F.cases(S.CONSTANTS.baseDemand) + '.');
    if (seed.correlated) lines.push('Both suppliers depend on the same upstream sterile-film supplier, so the shortage reached both at the same time.');
    if (r.shortfall > 0) lines.push(F.cases(r.shortfall) + ' could not be supplied from any qualified source with available capacity.');
    else lines.push('Every case was supplied from qualified capacity under contract.');
    var e = Object.keys(r.emergency).filter(function (k) { return r.emergency[k] > 0; });
    if (e.length) lines.push(e.map(function (k) { return F.cases(r.emergency[k]) + ' above baseline from ' + S.SUPPLIERS[k].name; }).join('; ') + ', each carrying the $6 surge premium.');
    return lines;
  }
  function metric(label, value) { return h('div', { class: 'metric' }, [h('p', { class: 'metric-label', text: label }), h('p', { class: 'metric-value', text: value })]); }
  function stageConsequence() {
    var seed = S.SEEDS[state.seed], r = M.simulate(state.initialArch, state.seed), all = M.compareAll(state.seed);
    var kids = [
      h('div', { class: 'event', role: 'group', 'aria-label': 'Disruption' }, [h('p', { class: 'event-title', text: seed.title }), h('p', { text: seed.description })]),
      h('h3', { text: 'Your original choice: ' + S.ARCHITECTURES[state.initialArch].label }),
      h('div', { class: 'metrics' }, [metric('Delivered', F.cases(r.delivered) + ' of ' + F.cases(r.demand)), metric('Service level', F.pct(r.serviceLevel)), metric('Shortfall', F.cases(r.shortfall)), metric('Procurement spend', F.money(r.spend.total))]),
      table('Supplier status under your architecture', ['Supplier', 'Availability this week', 'Available capacity', 'Allocated (baseline)', 'Delivered'],
        Object.keys(S.SUPPLIERS).map(function (id) {
          var f = seed.availability[id];
          return [S.SUPPLIERS[id].name, f === 1 ? 'Available' : (f === 0 ? 'Unavailable' : Math.round(f * 100) + '% of normal'), F.cases(r.available[id]), F.cases(S.ARCHITECTURES[state.initialArch].baseline[id]), F.cases(r.shipped[id])];
        })),
      h('h3', { text: 'Why this happened' }),
      h('ul', { class: 'why' }, whyLines(r, seed).map(function (l) { return h('li', { text: l }); })),
      h('h3', { text: 'All three architectures under this disruption' }),
      table('Outcome comparison for the observed disruption', ['Architecture', 'Delivered', 'Service level', 'Shortfall', 'Procurement spend'],
        all.map(function (x) {
          return [[S.ARCHITECTURES[x.archId].label, x.archId === state.initialArch ? marker('Your original choice') : null], F.cases(x.delivered), F.pct(x.serviceLevel), F.cases(x.shortfall), F.money(x.spend.total)];
        }), function (i) { return all[i].archId === state.initialArch ? 'mine' : null; }),
      h('details', { class: 'trace' }, [h('summary', { text: 'Show the calculation trace' }),
        h('ul', null, all.map(function (x) {
          var parts = Object.keys(S.SUPPLIERS).filter(function (k) { return x.shipped[k] > 0; }).map(function (k) { return F.cases(x.shipped[k]).replace(' cases', '') + ' \u00d7 ' + F.money(S.SUPPLIERS[k].unitCost); });
          return h('li', { text: S.ARCHITECTURES[x.archId].label + ': procurement ' + (parts.join(' + ') || '0') + ' = ' + F.money(x.spend.procurement) + '; surge premium ' + F.money(x.spend.surge) + '; multi-source premium ' + F.money(x.spend.multiSourcePremium) + '; total ' + F.money(x.spend.total) + '. Service = ' + x.delivered.toLocaleString('en-US') + ' \u00f7 ' + x.demand.toLocaleString('en-US') + ' = ' + F.pct(x.serviceLevel) + '.' });
        })),
        h('p', { class: 'fine', text: 'Available capacity = qualified weekly capacity \u00d7 availability, rounded to whole cases before allocation. This one-week consequence model uses qualified weekly capacity and availability; normal lead time informs the sourcing posture but is not recalculated inside the disruption week. Procurement spend is not total business cost: a design that receives fewer cases also spends less.' })
      ])
    ];
    if (state.stage === 'consequence') kids.push(h('button', { type: 'button', class: 'primary', text: 'Continue to revision', onclick: function () { commit({ stage: 'revise' }, 's-revise-h'); } }));
    return section('s-consequence', 3, 'See what happened', kids);
  }

  // ---------- stage 4: revise ----------
  function stageRevise() {
    var locked = !!state.revisedArch;
    var kids = [h('p', { text: 'Keep your architecture or switch to another. Your original choice stays on record either way, and this decision is yours to make.' })];
    if (!locked) {
      kids.push(radioGroup('revised', 'Revised sourcing architecture', archOptions().map(function (o) { if (o.value === state.initialArch) o.title += ' (your original choice)'; return o; }), null, false));
      kids.push(radioGroup('rationale', 'Which statement best supports your decision?', Object.keys(LABELS.rationale).map(function (k) { return { value: k, title: LABELS.rationale[k] }; }), null, false));
      kids.push(errorNote('rev-err'));
      kids.push(h('button', { type: 'button', class: 'primary', text: 'Lock my revised decision', onclick: function () {
        var a = picked('revised'), w = picked('rationale');
        if (!a || !w) return showError('rev-err', 'Select an architecture and the statement that supports it.');
        commit({ revisedArch: a, rationale: w, stage: 'stress' }, 'slip-revised');
        announce('Revised decision locked: ' + S.ARCHITECTURES[a].label + '. The four-event stress test is now available.');
      } }));
    } else {
      kids.push(slip('slip-revised', state.revisedArch === state.initialArch ? 'You kept your original choice' : 'You changed your decision', S.ARCHITECTURES[state.revisedArch].label, 'Original choice: ' + S.ARCHITECTURES[state.initialArch].label));
      kids.push(h('div', { class: 'feedback' }, [h('p', { class: 'feedback-title', text: 'About your reasoning' }), h('p', { text: LABELS.rationale[state.rationale] }), h('p', { text: RATIONALE_FEEDBACK[state.rationale] })]));
    }
    return section('s-revise', 4, 'Revise your decision', kids);
  }

  // ---------- stage 5: stress test ----------
  function stageStress() {
    var st = M.stressTest();
    var head = ['Architecture'].concat(S.SEED_ORDER.map(function (s) { return S.SEEDS[s].title; })).concat(['Worst-case service', 'Average service', 'Average spend']);
    var rows = st.map(function (x) {
      var marks = [];
      if (x.archId === state.initialArch) marks.push(marker('Your original choice'));
      if (x.archId === state.revisedArch) marks.push(marker('Your revised choice'));
      return [[S.ARCHITECTURES[x.archId].label].concat(marks)].concat(x.runs.map(function (r) { return F.pct(r.serviceLevel) + ' service, ' + F.money(r.spend.total); })).concat([F.pct(x.worstService), F.pct(x.averageService), F.money(x.averageSpend)]);
    });
    var kids = [
      h('p', { text: 'Management will not know which disruption comes next. This panel shows how each architecture performs across all four events this exercise can produce, including the one you observed.' }),
      table('Stress test across the four disruption events', head, rows, function (i) { return st[i].archId === state.revisedArch ? 'mine' : null; }),
      h('p', { class: 'fine', text: 'Averages treat the four events as equally likely for illustration only. A worst-case comparison requires no probability assumption. Average spend is lower for designs that failed to receive product, so read it alongside service.' })
    ];
    if (state.stage === 'stress') kids.push(h('button', { type: 'button', class: 'primary', text: 'Continue to the AI audit', onclick: function () { commit({ stage: 'audit' }, 's-audit-h'); } }));
    return section('s-stress', 5, 'Stress-test the design', kids);
  }

  // ---------- stage 6: audit ----------
  function stageAudit() {
    var locked = !!state.auditChoice;
    var kids = [
      h('blockquote', { class: 'ai' }, [h('p', { class: 'ai-who', text: 'AI analyst recommendation' }), h('p', { text: '\u201cMaintain GlobalMed as the sole supplier. Normal weekly procurement spend is $92,000, $8,000 below MedServ and $12,800 below dual sourcing. The cost data still support an efficient single-source design.\u201d' })]),
      radioGroup('audit', 'Which critique of this recommendation is strongest?', Object.keys(LABELS.audit).map(function (k) { return { value: k, title: LABELS.audit[k] }; }), state.auditChoice, locked),
      checkboxGroup('evidence', 'What additional evidence would management need before treating this as a decision rather than a cost comparison? Select any that apply.', Object.keys(LABELS.evidence).map(function (k) { return { value: k, title: LABELS.evidence[k] }; }), state.evidence || [], locked)
    ];
    if (!locked) {
      kids.push(errorNote('audit-err'));
      kids.push(h('button', { type: 'button', class: 'primary', text: 'Record my audit', onclick: function () {
        var a = picked('audit'); if (!a) return showError('audit-err', 'Select the critique you find strongest.');
        commit({ auditChoice: a, evidence: pickedAll('evidence'), stage: 'complete', completedAt: new Date().toISOString() }, 'audit-recorded');
        announce('Audit recorded. Your decision receipt is ready.');
      } }));
    } else {
      kids.push(h('p', { class: 'recorded', id: 'audit-recorded', tabindex: '-1', text: 'Audit recorded. Answer the matching questions in Canvas; this simulator does not grade your audit.' }));
    }
    return section('s-audit', 6, 'Audit the AI recommendation', kids);
  }

  // ---------- stage 7: receipt ----------
  function stageReceipt() {
    var rc = R.build(state, LABELS);
    var status = h('p', { class: 'fine', id: 'copy-status', role: 'status' });
    var dl = h('dl', { class: 'receipt-list' }, []);
    rc.rows.forEach(function (row) { dl.appendChild(h('dt', { text: row[0] })); dl.appendChild(h('dd', { text: row[1] })); });
    return section('s-receipt', 7, 'Your decision receipt', [
      h('p', { text: 'This receipt records your path through the exercise. You do not need to upload it for Week 8; keep it for later weeks.' }),
      h('div', { class: 'receipt', id: 'receipt' }, [dl]),
      h('div', { class: 'actions' }, [
        h('button', { type: 'button', text: 'Copy receipt text', onclick: function () {
          var done = function () { status.textContent = 'Receipt copied.'; };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(rc.text).then(done, function () { status.textContent = 'Copy is blocked here. Select the receipt text above and copy it manually.'; });
          else status.textContent = 'Copy is blocked here. Select the receipt text above and copy it manually.';
        } }),
        h('button', { type: 'button', text: 'Print receipt', onclick: function () { window.print(); } })
      ]),
      status
    ]);
  }

  // ---------- reset ----------
  function resetBlock() {
    if (!confirmingReset) return h('div', { class: 'reset' }, [h('button', { type: 'button', class: 'quiet', text: 'Start this exercise over', onclick: function () { confirmingReset = true; pendingFocus = 'reset-confirm'; render(); } })]);
    return h('div', { class: 'reset confirm', role: 'group', 'aria-label': 'Confirm reset' }, [
      h('p', { id: 'reset-confirm', tabindex: '-1', text: 'Start over? This clears your diagnosis, both decisions, your audit, and your receipt for this scenario.' }),
      h('button', { type: 'button', class: 'danger', text: 'Clear and start over', onclick: function () { state = ST.clear(state.seed); confirmingReset = false; pendingFocus = 's-diagnose-h'; render(); announce('Exercise cleared.'); } }),
      h('button', { type: 'button', text: 'Keep my progress', onclick: function () { confirmingReset = false; render(); } })
    ]);
  }

  function previewBar() {
    var sel = h('select', { id: 'pv-seed', onchange: function (e) { seedId = e.target.value; state = ST.load(seedId); confirmingReset = false; render(); } },
      S.SEED_ORDER.map(function (s) { return h('option', { value: s, selected: s === seedId, text: s + ' (' + S.SEEDS[s].title + ')' }); }));
    return h('div', { class: 'preview-bar', role: 'region', 'aria-label': 'Instructor preview controls' }, [
      h('label', { for: 'pv-seed', text: 'Instructor preview: scenario seed' }), sel,
      h('span', { class: 'fine', text: 'Students never see this bar; Canvas sets the seed in the link.' })
    ]);
  }

  function render() {
    app.textContent = '';
    if (preview) app.appendChild(previewBar());
    app.appendChild(h('header', { class: 'masthead' }, [
      h('p', { class: 'org', text: 'Cowford Medical Supply' }),
      h('h1', { text: 'Network disruption simulator' }),
      h('p', { class: 'lede', text: 'Choose a sourcing network, live with one disrupted week, then decide what you would keep.' })
    ]));
    if (!state) {
      app.appendChild(h('section', { class: 'stage notice' }, [h('h2', { text: 'Open this simulator from Canvas' }), h('p', { text: 'This link is missing its scenario. Return to the W8.D quiz in Canvas and open the simulator from Question 6.' })]));
      return;
    }
    app.appendChild(brief());
    app.appendChild(stageDiagnose());
    if (reached('choose')) app.appendChild(stageChoose());
    if (reached('consequence')) app.appendChild(stageConsequence());
    if (reached('revise')) app.appendChild(stageRevise());
    if (reached('stress')) app.appendChild(stageStress());
    if (reached('audit')) app.appendChild(stageAudit());
    if (reached('complete')) app.appendChild(stageReceipt());
    app.appendChild(resetBlock());
    if (pendingFocus) { var f = document.getElementById(pendingFocus); if (f) f.focus({ preventScroll: false }); pendingFocus = null; }
  }

  render();
})();
