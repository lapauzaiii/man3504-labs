/* Week 11 Quality Explorer — page behavior. No storage: all state lives in
   memory and is discarded on refresh. Navigation and the predict → explore →
   take pattern follow the Week 10 explorer. */
(function () {
  'use strict';
  const M = window.QualityModel;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const SVGNS = 'http://www.w3.org/2000/svg';
  const fmt = (n, d) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  const money = n => '$' + fmt(Math.round(n));
  function svg(tag, attrs, text) {
    const el = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
    if (text != null) el.textContent = text;
    return el;
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function metric(label, value, cls) {
    return `<div class="metric${cls ? ' ' + cls : ''}"><span>${label}</span><strong>${value}</strong></div>`;
  }
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  /* ================= Navigation ================= */
  const stops = $$('.stop');
  const nav = $('#stopNav');
  let current = 0;
  stops.forEach((s, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    const label = s.dataset.label;
    b.textContent = /^\d$/.test(label) ? 'Stop ' + label : label;
    b.setAttribute('aria-label', /^\d$/.test(label) ? 'Stop ' + label + ': ' + $('h2', s).textContent : label);
    b.addEventListener('click', () => go(i, true));
    li.appendChild(b); nav.appendChild(li);
  });
  const navBtns = $$('button', nav);

  function go(i, focus) {
    current = Math.max(0, Math.min(stops.length - 1, i));
    stops.forEach((s, j) => { s.hidden = j !== current; });
    navBtns.forEach((b, j) => {
      if (j === current) {
        b.setAttribute('aria-current', 'step'); b.classList.add('visited');
        const ol = b.closest('ol');
        ol.scrollLeft = Math.max(0, b.offsetLeft - (ol.clientWidth - b.offsetWidth) / 2);
      }
      else b.removeAttribute('aria-current');
    });
    $('#progressFill').style.width = (current / (stops.length - 1)) * 100 + '%';
    $('#prevBtn').disabled = current === 0;
    $('#nextBtn').hidden = current === stops.length - 1;
    $('#nextBtn').innerHTML = current === 0 ? 'Start the walk &rarr;' : (current === stops.length - 2 ? 'Finish &rarr;' : 'Next stop &rarr;');
    $('#pagerLabel').textContent = current === 0 ? 'About 35–45 minutes in all' : (current === stops.length - 1 ? 'Walk complete' : `Stop ${current} of ${stops.length - 2}`);
    const id = stops[current].id;
    if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    // Charts drawn while a stop was hidden may need a redraw for theme colors.
    redrawAll();
    if (focus) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      const h = $('h2', stops[current]);
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }
  }
  $('#prevBtn').addEventListener('click', () => go(current - 1, true));
  $('#nextBtn').addEventListener('click', () => go(current + 1, true));
  $('#restart').addEventListener('click', () => { location.hash = '#start'; location.reload(); });
  window.addEventListener('hashchange', () => {
    const i = stops.findIndex(s => '#' + s.id === location.hash);
    if (i >= 0 && i !== current) go(i, true);
  });

  /* ================= Predict → explore → take ================= */
  $$('.predict').forEach(fs => {
    const stop = fs.dataset.stop;
    const explore = $(`.explore[data-stop="${stop}"]`);
    const lock = $('.lock', fs);
    const takeBtn = $(`.take-btn[data-take="${stop}"]`);
    explore.inert = true;
    $$('input', fs).forEach(r => r.addEventListener('change', () => { lock.disabled = false; }));
    lock.addEventListener('click', () => {
      const chosen = $('input:checked', fs);
      if (!chosen) return;
      $$('input', fs).forEach(r => { r.disabled = true; });
      fs.classList.add('locked');
      lock.hidden = true;
      $('.locked-msg', fs).textContent = 'Prediction locked: "' + chosen.parentElement.textContent.trim() + '." Now explore, and see whether the warehouse agrees.';
      explore.inert = false;
      takeBtn.disabled = false;
    });
  });
  $$('.take-btn').forEach(b => b.addEventListener('click', () => {
    const t = $('#take-' + b.dataset.take);
    t.hidden = !t.hidden;
    b.textContent = t.hidden ? "Hear Lola's take" : "Hide Lola's take";
    b.setAttribute('aria-expanded', String(!t.hidden));
  }));

  /* Card helper: a statement with a select, revealing Lola's read on change. */
  function buildCards(wrap, items, options, prefix, onDone) {
    items.forEach((o, i) => {
      const card = document.createElement('div');
      card.className = 'wcard';
      card.innerHTML = `<div><span class="num">${i + 1}</span></div><p>${o.text}</p>
        <label for="${prefix}${i}" class="fine">Your call</label>
        <select id="${prefix}${i}"><option value="">Choose…</option>${options.map(w => `<option>${w}</option>`).join('')}</select>
        <div class="read" hidden aria-live="polite"></div>`;
      wrap.appendChild(card);
      $('select', card).addEventListener('change', e => {
        const v = e.target.value; const read = $('.read', card);
        if (!v) { read.hidden = true; return; }
        const lead = v === o.best ? `<strong>My read: ${o.best}.</strong> We agree.` : `<strong>My read: ${o.best}.</strong> You chose ${v}; here's my reasoning.`;
        read.innerHTML = `${lead} ${o.read}`;
        read.hidden = false;
        card.classList.add('done');
        onDone(i);
      });
    });
  }

  /* ================= Stop 1: dimensions + Deming ================= */
  function buildS1() {
    buildCards($('#dimCards'), M.DIMENSIONS, ['Conformance', 'Performance', 'Perceived'], 'dim', () => {});
    ['#retrain', '#fixBins'].forEach(id => $(id).addEventListener('change', drawS1));
  }
  function drawS1() {
    const res = M.pickerErrors({ retrain: $('#retrain').checked, fixBins: $('#fixBins').checked });
    const el = $('#pickChart'); clear(el);
    const W = 640, L = 40, B = 200, T = 16, top = 20;
    const y = v => B - (v / top) * (B - T);
    const bw = (W - L - 10) / res.rows.length;
    for (const t of [0, 5, 10, 15, 20]) {
      el.appendChild(svg('line', { x1: L, x2: W - 10, y1: y(t), y2: y(t), stroke: css('--border-color') }));
      el.appendChild(svg('text', { x: L - 6, y: y(t) + 4, 'text-anchor': 'end', 'font-size': 11, fill: css('--text-secondary') }, String(t)));
    }
    res.rows.forEach((r, i) => {
      const x = L + i * bw + bw * .22, w = bw * .56;
      el.appendChild(svg('rect', { x, y: y(r.system), width: w, height: B - y(r.system), fill: css('--sys') }));
      el.appendChild(svg('rect', { x, y: y(r.total), width: w, height: y(r.system) - y(r.total), fill: css('--own') }));
      el.appendChild(svg('text', { x: x + w / 2, y: y(r.total) - 6, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: css('--text-primary') }, String(r.total)));
      el.appendChild(svg('text', { x: x + w / 2, y: B + 16, 'text-anchor': 'middle', 'font-size': 12, fill: css('--text-primary'), 'font-weight': i === res.worst ? 700 : 400 }, r.name));
    });
    el.appendChild(svg('text', { x: L, y: 12, 'font-size': 11, fill: css('--text-secondary') }, 'Mis-picks last month'));
    const cut = res.cut * 100;
    $('#pickM').innerHTML =
      metric('Shift mis-picks last month', `${res.total} <small>of ${res.base}</small>`, res.total < res.base ? 'good' : '') +
      metric('Reduction', fmt(cut, 0) + '%', cut >= 50 ? 'good' : '') +
      metric('Errors at look-alike bins (before any fix)', fmt(res.systemShare * 100, 0) + '%');
  }

  /* ================= Stop 2: cost of quality ================= */
  let stage = 'pick';
  function buildS2() {
    const seg = $('#stageSeg');
    M.ESCALATION.forEach(s => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'seg-btn'; b.dataset.stage = s.id;
      b.setAttribute('aria-pressed', String(s.id === stage));
      b.textContent = s.where;
      b.addEventListener('click', () => { stage = s.id; $$('[data-stage]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); drawEsc(); });
      seg.appendChild(b);
    });
    $('#prev').addEventListener('input', drawCoq);
    $('#scaleApp').addEventListener('change', drawCoq);
  }
  function drawEsc() {
    const el = $('#escChart'); clear(el);
    const W = 640, L = 150, R = 70, top = 100;
    const x = v => L + (v / top) * (W - L - R);
    const idx = M.ESCALATION.findIndex(s => s.id === stage);
    M.ESCALATION.forEach((s, i) => {
      const yy = 20 + i * 45, active = i <= idx;
      const fill = !active ? css('--border-color') : (s.kind === 'External failure' ? css('--ext') : css('--int'));
      el.appendChild(svg('text', { x: L - 8, y: yy + 19, 'text-anchor': 'end', 'font-size': 12, fill: css('--text-primary'), 'font-weight': i === idx ? 700 : 400 }, s.where.replace(/ \(.*\)/, '')));
      el.appendChild(svg('rect', { x: L, y: yy, width: Math.max(2, x(s.cost) - L), height: 28, rx: 3, fill, opacity: i === idx ? 1 : 0.55 }));
      el.appendChild(svg('text', { x: x(s.cost) + 6, y: yy + 19, 'font-size': 12, 'font-weight': 700, fill: css('--text-primary') }, '$' + fmt(s.cost, s.cost % 1 ? 2 : 0)));
    });
    const r = M.escalation(stage, 1000);
    $('#escMsg').innerHTML = `<strong>Caught ${r.stage.where.toLowerCase()}:</strong> $${fmt(r.perError, r.perError % 1 ? 2 : 0)} per error (${r.stage.kind.toLowerCase()}). ${r.stage.note} Across 1,000 errors a year, that's ${money(r.perYear)}` +
      (idx > 0 ? `, ${fmt(r.multipleOfPick, 0)} times the cost of catching them at the pick face.` : '.');
  }
  function drawCoq() {
    const p = Number($('#prev').value), scale = $('#scaleApp').checked;
    $('#prevOut').textContent = money(p);
    const c = M.coq(p, scale);
    const bar = $('#coqBar'); clear(bar);
    [['c-prev', c.prevention], ['c-app', c.appraisal], ['c-int', c.internal], ['c-ext', c.external]].forEach(([cls, v]) => {
      const d = document.createElement('div'); d.className = cls; d.style.flexGrow = v; d.title = money(v); bar.appendChild(d);
    });
    const base = M.coq(M.COQ.basePrevention, scale);
    const best = M.bestPrevention(scale, 5000, 150000, 5000);
    const diff = c.total - base.total;
    $('#coqM').innerHTML =
      metric('Prevention', money(c.prevention)) + metric('Appraisal', money(c.appraisal)) +
      metric('Internal failure', money(c.internal)) + metric('External failure', money(c.external)) +
      metric('Total cost of quality', money(c.total), p === best.prevention ? 'good' : '') +
      metric('Change from today ($15,000 prevention)', (diff > 0 ? '+' : diff < 0 ? '−' : '') + money(Math.abs(diff)), diff > 0 ? 'warn' : (diff < 0 ? 'good' : '')) +
      metric('Order errors per year', fmt(c.errors)) +
      metric('Failure share of total', fmt(c.failureShare * 100, 1) + '%');
    // Curve of total COQ against prevention.
    const el = $('#coqCurve'); clear(el);
    const W = 640, L = 64, R = 14, T = 18, B = 190, xmin = 5000, xmax = 150000, ymin = 100000, ymax = 260000;
    const xs = v => L + (v - xmin) / (xmax - xmin) * (W - L - R);
    const ys = v => B - (v - ymin) / (ymax - ymin) * (B - T);
    for (let t = ymin; t <= ymax; t += 40000) {
      el.appendChild(svg('line', { x1: L, x2: W - R, y1: ys(t), y2: ys(t), stroke: css('--border-color') }));
      el.appendChild(svg('text', { x: L - 6, y: ys(t) + 4, 'text-anchor': 'end', 'font-size': 11, fill: css('--text-secondary') }, '$' + fmt(t / 1000) + 'k'));
    }
    for (let t = 0; t <= 150000; t += 25000) {
      if (t < xmin) continue;
      el.appendChild(svg('text', { x: xs(t), y: B + 16, 'text-anchor': 'middle', 'font-size': 11, fill: css('--text-secondary') }, '$' + fmt(t / 1000) + 'k'));
    }
    el.appendChild(svg('text', { x: (L + W - R) / 2, y: B + 34, 'text-anchor': 'middle', 'font-size': 11, fill: css('--text-secondary') }, 'Prevention spending per year'));
    const pts = [];
    for (let v = xmin; v <= xmax; v += 2500) pts.push(`${xs(v)},${ys(M.coq(v, scale).total)}`);
    el.appendChild(svg('polyline', { points: pts.join(' '), fill: 'none', stroke: css('--teal'), 'stroke-width': 2.5 }));
    el.appendChild(svg('circle', { cx: xs(best.prevention), cy: ys(best.total), r: 5, fill: 'none', stroke: css('--green'), 'stroke-width': 2 }));
    el.appendChild(svg('text', { x: xs(best.prevention), y: ys(best.total) + 20, 'text-anchor': 'middle', 'font-size': 11, fill: css('--green') }, 'lowest total'));
    el.appendChild(svg('circle', { cx: xs(p), cy: ys(c.total), r: 7, fill: '#E97132', stroke: '#fff', 'stroke-width': 2 }));
    el.appendChild(svg('text', { x: L, y: 12, 'font-size': 11, fill: css('--text-secondary') }, 'Total cost of quality'));
  }

  /* ================= Stop 3: Pareto + TQM ================= */
  let order = 'sheet';
  const picked = new Set();
  function buildS3() {
    $$('#s3 [data-order]').forEach(b => b.addEventListener('click', () => {
      order = b.dataset.order; $$('#s3 [data-order]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); drawS3();
    }));
    const wrap = $('#causeChecks');
    M.pareto().rows.forEach((r, i) => {
      const lab = document.createElement('label');
      lab.innerHTML = `<input type="checkbox" value="${r.cause}" id="cause${i}"> ${r.cause} <span class="fine">(${r.count})</span>`;
      wrap.appendChild(lab);
      $('input', lab).addEventListener('change', e => { if (e.target.checked) picked.add(r.cause); else picked.delete(r.cause); drawCoverage(); });
    });
    // Present the checkboxes in check-sheet order, like the data the team collected.
    const byName = {}; $$('label', wrap).forEach(l => { byName[$('input', l).value] = l; });
    M.CAUSES.forEach(c => wrap.appendChild(byName[c.cause]));
  }
  function drawCoverage() {
    const c = M.coverage([...picked]);
    const p = M.pareto();
    $('#covOut').textContent = `${fmt(c.count)} of ${fmt(p.total)} (${fmt(c.share, 0)}%)` + (picked.size ? ` with ${picked.size} cause${picked.size > 1 ? 's' : ''}` : '');
  }
  function drawS3() {
    const p = M.pareto();
    const rows = order === 'pareto' ? p.rows : M.CAUSES.map(c => p.rows.find(r => r.cause === c.cause));
    const el = $('#paretoChart'); clear(el);
    const W = 640, L = 44, R = 44, T = 16, B = 196, top = 300;
    const y = v => B - (v / top) * (B - T);
    const yp = v => B - (v / 100) * (B - T);
    const bw = (W - L - R) / rows.length;
    for (const t of [0, 100, 200, 300]) {
      el.appendChild(svg('line', { x1: L, x2: W - R, y1: y(t), y2: y(t), stroke: css('--border-color') }));
      el.appendChild(svg('text', { x: L - 6, y: y(t) + 4, 'text-anchor': 'end', 'font-size': 11, fill: css('--text-secondary') }, String(t)));
    }
    const pts = [];
    rows.forEach((r, i) => {
      const x = L + i * bw + bw * .18, w = bw * .64;
      el.appendChild(svg('rect', { x, y: y(r.count), width: w, height: B - y(r.count), rx: 2, fill: css('--sys') }));
      el.appendChild(svg('text', { x: x + w / 2, y: y(r.count) - 5, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: css('--text-primary') }, String(r.count)));
      const words = r.cause.replace(/\(.*\)/, '').trim().split(' ');
      const mid = Math.ceil(words.length / 2);
      [words.slice(0, mid).join(' '), words.slice(mid).join(' ')].forEach((line, k) => {
        if (line) el.appendChild(svg('text', { x: x + w / 2, y: B + 15 + k * 13, 'text-anchor': 'middle', 'font-size': 11, fill: css('--text-primary') }, line));
      });
      pts.push([x + w / 2, yp(r.cumulative), r.cumulative]);
    });
    if (order === 'pareto') {
      for (const t of [0, 50, 100]) el.appendChild(svg('text', { x: W - R + 6, y: yp(t) + 4, 'font-size': 11, fill: '#E97132' }, t + '%'));
      el.appendChild(svg('line', { x1: L, x2: W - R, y1: yp(80), y2: yp(80), stroke: '#E97132', 'stroke-dasharray': '4 4', opacity: .7 }));
      el.appendChild(svg('polyline', { points: pts.map(q => q[0] + ',' + q[1]).join(' '), fill: 'none', stroke: '#E97132', 'stroke-width': 2.5 }));
      pts.forEach(q => {
        el.appendChild(svg('circle', { cx: q[0], cy: q[1], r: 3.5, fill: '#E97132' }));
        el.appendChild(svg('text', { x: q[0] + 6, y: q[1] - 6, 'font-size': 10, fill: '#E97132' }, fmt(q[2], 0) + '%'));
      });
    }
    el.appendChild(svg('text', { x: L, y: 12, 'font-size': 11, fill: css('--text-secondary') }, 'Order errors last quarter'));
  }
  const FIT = {
    f1: { best: 'employee', yes: 'Yes, employee involvement. The people doing the work know where the process fails, and the huddle gives them a standing way to say so.', no: 'I\'d call this employee involvement: the idea came from the pickers, and the huddle makes asking them a habit. Customer focus and fact-based decisions matter too, but they aren\'t what this change is about.' },
    f2: { best: 'process', yes: 'Right, process thinking. Stop 1 showed most mis-picks come from the bins, so warnings punish people for the system\'s design.', no: 'It mostly ignores process thinking: fix the process, not the person. Stop 1 showed most mis-picks happen at look-alike bins every picker uses.' },
    f3: { best: 'reliability', yes: 'Yes. Reliability has the largest negative gap (−1.4), and it is fixed in the process: dispatch, loading, and routing.', no: 'I\'d start with Reliability. Its gap is −1.4, the largest by far. Tangibles already beat expectations (+0.4), and Assurance is only 0.1 short.' }
  };
  function buildFits() {
    $$('.fit').forEach(f => $$('input', f).forEach(r => r.addEventListener('change', () => {
      const k = FIT[f.dataset.fit]; const p = $('.fit-read', f);
      p.innerHTML = `<strong>Lola:</strong> ${r.value === k.best ? k.yes : k.no}`; p.hidden = false;
    })));
  }

  /* ================= Stop 4: DMAIC, DPMO, SERVQUAL ================= */
  const dmaicDone = new Set();
  function buildS4() {
    // Show the steps out of order so the sequence is the student's work.
    const shuffled = ['c', 'e', 'a', 'd', 'b'].map(id => M.DMAIC.find(s => s.id === id));
    const items = shuffled.map(s => ({ text: s.text, best: s.phase, read: DMAIC_READ[s.phase] }));
    buildCards($('#dmaicCards'), items, M.PHASES, 'dm', i => {
      dmaicDone.add(i);
      $('#dmaicCount').textContent = `Assigned ${dmaicDone.size} of 5` + (dmaicDone.size === 5 ? '. In order: Define, Measure, Analyze, Improve, Control.' : '');
    });
    $('#opps').addEventListener('input', drawDpmo);
    const gaps = M.servqualGaps();
    $('#sqBody').innerHTML = M.SERVQUAL.map((s, i) => {
      const g = gaps[i].gap;
      return `<tr><th scope="row">${s.dim}</th><td>${s.example}</td><td>${fmt(s.expect, 1)}</td><td>${fmt(s.perceive, 1)}</td><td class="${g < 0 ? 'neg' : 'pos'}">${g > 0 ? '+' : (g < 0 ? '−' : '')}${fmt(Math.abs(g), 1)}</td></tr>`;
    }).join('');
  }
  const DMAIC_READ = {
    Define: 'A charter sets the problem, scope, owner, and timeline before any data is collected.',
    Measure: 'Measure fixes the definition of a defect and the baseline, so later results have something to beat.',
    Analyze: 'Analyze tests suspected causes with data instead of assuming them.',
    Improve: 'Improve pilots the fix on a small scale before rolling it out.',
    Control: 'Control keeps the gain: a monitoring chart plus a rule for what to do when it drifts.'
  };
  function drawDpmo() {
    const o = Number($('#opps').value);
    $('#oppsOut').textContent = o;
    const d = M.dpmo(M.DPMO_DATA.orders, o, M.DPMO_DATA.defects);
    $('#dpmoFormula').textContent = `DPMO = ${fmt(M.DPMO_DATA.defects)} ÷ (${fmt(M.DPMO_DATA.orders)} × ${o}) × 1,000,000 = ${fmt(d.value)}`;
    $('#dpmoM').innerHTML =
      metric('Defects per million opportunities', fmt(d.value)) +
      metric('Sigma level (with 1.5σ shift)', fmt(d.sigma, 2)) +
      metric('Bad orders customers see, per 1,000', fmt(d.perThousandOrders));
  }

  /* ================= Stop 5: Cp and Cpk ================= */
  let critical = 1.33;
  function buildS5() {
    const seg = $('#critSeg');
    [[1.00, 'Three-sigma: 1.00'], [1.33, 'Four-sigma: 1.33'], [1.67, 'Five-sigma: 1.67'], [2.00, 'Six-sigma: 2.00']].forEach(([v, label]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'seg-btn'; b.dataset.crit = v; b.textContent = label;
      b.setAttribute('aria-pressed', String(v === critical));
      b.addEventListener('click', () => { critical = v; $$('[data-crit]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); drawS5(); });
      seg.appendChild(b);
    });
    ['#mean', '#sd'].forEach(id => $(id).addEventListener('input', drawS5));
  }
  function drawS5() {
    const mean = Number($('#mean').value), sd = Number($('#sd').value);
    const { lsl, usl } = M.CAPABILITY;
    $('#meanOut').textContent = mean.toFixed(1);
    $('#sdOut').textContent = sd.toFixed(2);
    const c = M.capability(mean, sd);
    const el = $('#capChart'); clear(el);
    const W = 640, L = 20, R = 20, B = 196, T = 20, xmin = -1, xmax = 11;
    const xs = v => L + (v - xmin) / (xmax - xmin) * (W - L - R);
    const pdf = v => Math.exp(-0.5 * ((v - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
    const peak = pdf(mean);
    const ys = v => B - (v / peak) * (B - T - 16);
    const curve = [], outL = [], outR = [];
    for (let v = xmin; v <= xmax + 1e-9; v += 0.02) {
      const pt = [xs(v), ys(pdf(v))];
      curve.push(pt);
      if (v <= lsl) outL.push(pt);
      if (v >= usl) outR.push(pt);
    }
    const area = pts => pts.length ? `M${pts[0][0]},${B} ` + pts.map(p => `L${p[0]},${p[1]}`).join(' ') + ` L${pts[pts.length - 1][0]},${B} Z` : '';
    el.appendChild(svg('line', { x1: L, x2: W - R, y1: B, y2: B, stroke: css('--text-secondary') }));
    for (let t = 0; t <= 10; t += 1) {
      el.appendChild(svg('line', { x1: xs(t), x2: xs(t), y1: B, y2: B + 4, stroke: css('--text-secondary') }));
      el.appendChild(svg('text', { x: xs(t), y: B + 17, 'text-anchor': 'middle', 'font-size': 11, fill: css('--text-secondary') }, t + '°'));
    }
    el.appendChild(svg('path', { d: `M${curve[0][0]},${B} ` + curve.map(p => `L${p[0]},${p[1]}`).join(' ') + ` L${curve[curve.length - 1][0]},${B} Z`, fill: css('--teal'), opacity: .25 }));
    el.appendChild(svg('polyline', { points: curve.map(p => p.join(',')).join(' '), fill: 'none', stroke: css('--teal'), 'stroke-width': 2.5 }));
    if (outL.length) el.appendChild(svg('path', { d: area(outL), fill: css('--red'), opacity: .8 }));
    if (outR.length) el.appendChild(svg('path', { d: area(outR), fill: css('--red'), opacity: .8 }));
    [[lsl, 'LSL 2 °C'], [usl, 'USL 8 °C']].forEach(([v, lab]) => {
      el.appendChild(svg('line', { x1: xs(v), x2: xs(v), y1: T, y2: B, stroke: css('--text-primary'), 'stroke-width': 2, 'stroke-dasharray': '6 4' }));
      el.appendChild(svg('text', { x: xs(v), y: T - 6, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: css('--text-primary') }, lab));
    });
    el.appendChild(svg('line', { x1: xs(mean), x2: xs(mean), y1: ys(peak), y2: B, stroke: '#E97132', 'stroke-width': 2 }));
    el.appendChild(svg('text', { x: xs(mean), y: B + 32, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#E97132' }, `mean ${mean.toFixed(1)}°`));
    $('#capFormula').textContent = `Cp = (8 − 2) ÷ (6 × ${sd.toFixed(2)}) = ${fmt(c.cp, 2)}   ·   Cpk = min[(8 − ${mean.toFixed(1)}) ÷ (3 × ${sd.toFixed(2)}), (${mean.toFixed(1)} − 2) ÷ (3 × ${sd.toFixed(2)})] = ${fmt(c.cpk, 2)}`;
    const v = M.verdict(c.cp, c.cpk, critical);
    $('#capM').innerHTML =
      metric('Cp (spread only)', fmt(c.cp, 2), c.cp >= critical - 0.005 ? 'good' : 'warn') +
      metric('Cpk (spread and centering)', fmt(c.cpk, 2), c.cpk >= critical - 0.005 ? 'good' : 'warn') +
      metric('Loads outside 2–8 °C, per million', c.ppm < 1 ? 'under 1' : fmt(c.ppm), c.ppm > 1000 ? 'warn' : '');
    const side = c.nearest === 'upper' ? 'the 8 °C limit (loads run warm)' : (c.nearest === 'lower' ? 'the 2 °C limit (loads risk freezing)' : 'neither limit');
    const msgs = {
      capable: `<strong style="color:var(--green)">Capable at ${critical.toFixed(2)}.</strong> Cpk meets the critical value, so the process is both narrow enough and centered enough.`,
      recenter: `<strong style="color:var(--amber)">Recenter.</strong> Cpk falls short of ${critical.toFixed(2)} but Cp passes, so the spread is fine. The mean sits too close to ${side}.`,
      'reduce-variability': `<strong style="color:var(--red)">Reduce variation.</strong> Cp is below ${critical.toFixed(2)}, so no set point can pass. The temperature spread itself is too wide.`
    };
    $('#capMsg').innerHTML = msgs[v];
  }

  /* ================= Init ================= */
  function redrawAll() { drawS1(); drawEsc(); drawCoq(); drawS3(); drawCoverage(); drawDpmo(); drawS5(); }
  buildS1(); buildS2(); buildS3(); buildFits(); buildS4(); buildS5();
  // Redraw SVG colors when the system theme changes.
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(redrawAll);
  }
  const start = stops.findIndex(s => '#' + s.id === location.hash);
  go(start >= 0 ? start : 0, false);
})();
