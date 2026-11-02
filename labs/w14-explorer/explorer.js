/* Week 14 Improvement Explorer: page behavior. No storage: all state lives in
   memory and is discarded on refresh. Navigation and the predict → explore →
   take pattern follow the earlier explorers. */
(function () {
  'use strict';
  const M = window.ImprovementModel;
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
      $('.locked-msg', fs).textContent = 'Prediction locked: "' + chosen.parentElement.textContent.trim() + '." Now explore, and see whether the data agrees.';
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


  /* ================= Stop 1: scorecard lag ================= */
  const LINES = [['lg', '--lg', 'Learning & Growth'], ['p', '--pr', 'Internal Process'], ['c', '--cu', 'Customer'], ['f', '--fi', 'Financial']];
  function buildS1() { $('#cut').addEventListener('input', drawS1); $('#restore').addEventListener('change', drawS1); }
  function drawS1() {
    const cut = Number($('#cut').value), restore = $('#restore').checked;
    $('#cutOut').textContent = cut + '%';
    const s = M.scorecard(cut, restore ? 3 : null);
    const el = $('#bscChart'); clear(el);
    const W = 640, L = 44, R = 16, T = 14, B = 210, lo = 40;
    const x = t => L + t * (W - L - R) / (M.QUARTERS - 1);
    const y = v => T + (100 - v) / (100 - lo) * (B - T);
    for (const v of [40, 60, 80, 100]) {
      el.appendChild(svg('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: css('--border-color') }));
      el.appendChild(svg('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 11, fill: css('--text-secondary') }, String(v)));
    }
    for (let t = 0; t < M.QUARTERS; t++) el.appendChild(svg('text', { x: x(t), y: B + 18, 'text-anchor': 'middle', 'font-size': 11, fill: css('--text-secondary') }, 'Q' + t));
    LINES.forEach(([k, col], i) => {
      const pts = s[k].map((v, t) => `${x(t)},${y(v) + (i - 1.5) * 1.5}`).join(' ');
      el.appendChild(svg('polyline', { points: pts, fill: 'none', stroke: css(col), 'stroke-width': 3, 'stroke-linejoin': 'round' }));
      s[k].forEach((v, t) => el.appendChild(svg('circle', { cx: x(t), cy: y(v) + (i - 1.5) * 1.5, r: 3, fill: css(col) })));
    });
    const q = v => (v == null ? 'never' : 'Q' + v);
    const months = s.first.f == null ? null : (s.first.f - 1) * 3;
    $('#bscM').innerHTML =
      metric('Learning & Growth first falls', q(s.first.lg)) + metric('Internal Process first falls', q(s.first.p)) +
      metric('Customer first falls', q(s.first.c)) + metric('Revenue first falls', q(s.first.f), s.first.f != null ? 'warn' : '') +
      metric('Months from cut to revenue drop', months == null ? 'n/a' : String(months));
  }

  /* ================= Stop 2: benchmarking ================= */
  let bench = 'internal';
  function buildS2() {
    const seg = $('#benchSeg');
    M.BENCHMARKS.forEach(b => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'seg-btn'; btn.dataset.bench = b.id;
      btn.setAttribute('aria-pressed', String(b.id === bench));
      btn.textContent = `${b.type}: ${b.who}`;
      btn.addEventListener('click', () => { bench = b.id; $$('[data-bench]').forEach(x => x.setAttribute('aria-pressed', String(x === btn))); drawS2(); });
      seg.appendChild(btn);
    });
    buildCards($('#benchCards'), M.BENCH_CARDS, ['Internal', 'Competitive', 'Functional', 'Reverse'], 'bc', () => {});
  }
  function drawS2() {
    const b = M.BENCHMARKS.find(x => x.id === bench);
    $('#benchM').innerHTML = metric('Westside order-to-ship', fmt(M.CURRENT_CYCLE, 1) + ' days') +
      metric(`${b.type} benchmark`, fmt(b.value, 1) + ' days') +
      metric('Gap to close', fmt(M.gap(bench), 1) + ' days', 'warn') +
      metric('Reduction needed', fmt(M.gap(bench) / M.CURRENT_CYCLE * 100) + '%');
    $('#benchMsg').textContent = b.note;
  }

  /* ================= Stop 3: PDCA ================= */
  const pdcaDone = new Set();
  function buildS3() {
    buildCards($('#pdcaCards'), M.PDCA_CARDS, ['Plan', 'Do', 'Check', 'Act'], 'pd', i => {
      pdcaDone.add(i);
      if (pdcaDone.size === M.PDCA_CARDS.length) $('#pdcaMsg').innerHTML = '<strong>All six sorted.</strong> By my read: two Plan, one Do, one Check, and two Act (one for each Act outcome).';
    });
  }

  /* ================= Stop 4: funnel ================= */
  let rule = 1, seed = 3504;
  function buildS4() {
    const seg = $('#ruleSeg');
    M.FUNNEL_RULES.forEach(r => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'seg-btn'; b.dataset.rule = r.rule;
      b.setAttribute('aria-pressed', String(r.rule === rule));
      b.innerHTML = `<strong>${r.name}.</strong> ${r.note}`;
      b.addEventListener('click', () => { rule = r.rule; $$('[data-rule]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); drawS4(); });
      seg.appendChild(b);
    });
    $('#redrop').addEventListener('click', () => { seed = (seed * 48271 + 11) % 2147483647; drawS4(); });
  }
  function drawS4() {
    const n = 50;
    const drops = M.funnel(rule, seed, n);
    const base = M.funnel(1, seed, n);
    const el = $('#funnelChart'); clear(el);
    const W = 640, L = 40, R = 12, T = 12, B = 210;
    const lim = Math.max(4, Math.ceil(Math.max(...drops.map(Math.abs))));
    const x = k => L + k * (W - L - R) / (n - 1);
    const y = v => T + (lim - v) / (2 * lim) * (B - T);
    for (const v of [-lim, -lim / 2, 0, lim / 2, lim]) {
      el.appendChild(svg('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: v === 0 ? css('--text-secondary') : css('--border-color'), 'stroke-dasharray': v === 0 ? '4 3' : '' }));
      el.appendChild(svg('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 11, fill: css('--text-secondary') }, fmt(v, Math.abs(v) % 1 ? 1 : 0)));
    }
    el.appendChild(svg('text', { x: W - R, y: y(0) - 6, 'text-anchor': 'end', 'font-size': 11, fill: css('--text-secondary') }, 'target'));
    el.appendChild(svg('polyline', { points: drops.map((v, k) => `${x(k)},${y(v)}`).join(' '), fill: 'none', stroke: css('--border-color'), 'stroke-width': 1 }));
    drops.forEach((v, k) => el.appendChild(svg('circle', { cx: x(k), cy: y(v), r: 4, fill: rule === 1 ? css('--teal') : css('--unf-orange') })));
    el.appendChild(svg('text', { x: L + 4, y: B + 20, 'font-size': 11, fill: css('--text-secondary') }, 'Drop 1 → 50 (vertical: distance from target)'));
    const rms = M.rmsFromTarget(drops), rms1 = M.rmsFromTarget(base);
    $('#funnelM').innerHTML = metric('Typical miss (RMS distance from target)', fmt(rms, 2), rule === 1 ? 'good' : (rms > rms1 * 1.2 ? 'warn' : '')) +
      metric('Same marbles under Rule 1', fmt(rms1, 2)) +
      metric('Spread compared with leaving it alone', '×' + fmt(rms / rms1, 2), rule === 1 ? '' : 'warn');
    $('#funnelMsg').textContent = rule === 1 ? 'This is the process\'s own common-cause noise. Nothing you can do drop by drop will make it smaller.'
      : `Same 50 random nudges as Rule 1, but the adjustments made the typical miss ${fmt(rms / rms1, 1)} times as large.`;
  }

  /* ================= Stop 5: CPM / PERT ================= */
  function buildS5() { $('#target').addEventListener('input', drawS5); $('#fastC').addEventListener('change', drawS5); }
  function drawS5() {
    const T = Number($('#target').value), fast = $('#fastC').checked;
    $('#targetOut').textContent = fmt(T, T % 1 ? 1 : 0);
    const p = M.project(fast), o = M.onTime(T, fast);
    const f2 = v => fmt(v, 2);
    $('#cpmTable').innerHTML = '<caption class="fine" style="text-align:left">Times in weeks. Critical activities (zero slack) are highlighted.</caption>' +
      '<thead><tr><th scope="col">Act.</th><th scope="col">Description</th><th scope="col">Pred.</th><th scope="col">a / m / b</th><th scope="col">te</th><th scope="col">σ²</th><th scope="col">ES</th><th scope="col">EF</th><th scope="col">LS</th><th scope="col">LF</th><th scope="col">Slack</th></tr></thead><tbody>' +
      p.acts.map(a => `<tr class="${Math.abs(a.slack) < 1e-9 ? 'crit' : ''}"><td>${a.id}</td><td>${a.name}</td><td>${a.pre.join(', ') || 'n/a'}</td><td>${a.a} / ${a.m} / ${a.b}</td><td>${f2(a.te)}</td><td>${fmt(a.v, 3)}</td><td>${f2(a.es)}</td><td>${f2(a.ef)}</td><td>${f2(a.ls)}</td><td>${f2(a.lf)}</td><td>${f2(a.slack)}</td></tr>`).join('') + '</tbody>';
    $('#pertFormula').textContent = `z = (${fmt(T, T % 1 ? 1 : 0)} − ${f2(p.duration)}) ÷ √${fmt(p.variance, 3)} = ${f2(o.z)}`;
    $('#pertM').innerHTML = metric('Critical path', p.critical.split('').join(' → ')) + metric('Expected length', f2(p.duration) + ' weeks') +
      metric('Std. deviation', f2(p.sd) + ' weeks') + metric('Chance of finishing by target', fmt(o.prob * 100, 1) + '%', o.prob >= 0.9 ? 'good' : (o.prob < 0.6 ? 'warn' : ''));
  }

  /* ================= Init ================= */
  function redrawAll() { drawS1(); drawS2(); drawS4(); drawS5(); }
  buildS1(); buildS2(); buildS3(); buildS4(); buildS5();
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(redrawAll);
  }
  const start = stops.findIndex(s => '#' + s.id === location.hash);
  go(start >= 0 ? start : 0, false);
})();
