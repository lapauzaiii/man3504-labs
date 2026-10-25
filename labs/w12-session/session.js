/* Week 12 In-Class Session — page behaviour. Calculations live in model.js (window.W12). */
(function () {
  'use strict';
  const M = window.W12;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const SVGNS = 'http://www.w3.org/2000/svg';
  const KEY = 'man3504-w12-session-v1';
  const f = (v, d) => (v === null || v === undefined || isNaN(v)) ? '—' : Number(v).toFixed(d);

  /* ---------- small SVG helpers ---------- */
  function el(name, attrs, text) {
    const e = document.createElementNS(SVGNS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function clear(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }
  function niceTicks(lo, hi, count) {
    const span = hi - lo || 1, raw = span / count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || raw;
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6));
    return out;
  }

  /* Control-chart style line plot.  series: [{vals, line, pt, from}] */
  function plot(svg, o) {
    clear(svg);
    const vb = svg.viewBox.baseVal, W = vb.width, H = vb.height;
    const pad = { l: 52, r: 74, t: 14, b: 26 };
    const all = o.series.flatMap(s => s.vals).concat([o.ucl, o.lcl, o.cl, ...(o.extra || [])]).filter(v => v !== undefined && v !== null && isFinite(v));
    if (!all.length) { svg.appendChild(el('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle' }, o.empty || 'No data yet')); return; }
    let lo = Math.min(...all), hi = Math.max(...all);
    const m = (hi - lo) * 0.12 || 1; lo -= m; hi += m;
    if (o.floor !== undefined) lo = Math.max(lo, o.floor);
    const N = Math.max(o.count || 0, ...o.series.map(s => (s.from || 0) + s.vals.length));
    const x = i => pad.l + (N <= 1 ? (W - pad.l - pad.r) / 2 : i * (W - pad.l - pad.r) / (N - 1));
    const y = v => pad.t + (hi - v) * (H - pad.t - pad.b) / (hi - lo);
    niceTicks(lo, hi, 4).forEach(t => {
      svg.appendChild(el('line', { class: 'grid', x1: pad.l, x2: W - pad.r, y1: y(t), y2: y(t) }));
      svg.appendChild(el('text', { x: pad.l - 8, y: y(t) + 4, 'text-anchor': 'end' }, String(t)));
    });
    const every = Math.ceil(N / 15);
    for (let i = 0; i < N; i += every) svg.appendChild(el('text', { x: x(i), y: H - 6, 'text-anchor': 'middle' }, String(i + 1)));
    if (o.band) svg.appendChild(el('rect', { class: 'band', x: x(o.band[0]) - 4, y: pad.t, width: x(o.band[1]) - x(o.band[0]) + 8, height: H - pad.t - pad.b }));
    const hline = (v, cls, label, lcls) => {
      if (v === undefined || v === null || !isFinite(v)) return;
      svg.appendChild(el('line', { class: cls, x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v) }));
      svg.appendChild(el('text', { class: lcls, x: W - pad.r + 6, y: y(v) + 4 }, label));
    };
    hline(o.ucl, 'lim', (o.uclLabel || 'UCL ') + f(o.ucl, o.dec), 'lbl-r');
    hline(o.cl, 'cl', (o.clLabel || 'CL ') + f(o.cl, o.dec), 'lbl-t');
    hline(o.lcl, 'lim', (o.lclLabel || 'LCL ') + f(o.lcl, o.dec), 'lbl-r');
    o.series.forEach(s => {
      const from = s.from || 0;
      const pts = s.vals.map((v, i) => `${x(from + i)},${y(v)}`).join(' ');
      if (s.vals.length > 1) svg.appendChild(el('polyline', { class: s.line, points: pts }));
      s.vals.forEach((v, i) => {
        const hit = o.hits && o.hits[from + i] && o.hits[from + i].length;
        const c = el('circle', { class: hit ? 'hit' : s.pt, cx: x(from + i), cy: y(v), r: hit ? 6 : 3.6 });
        c.appendChild(el('title', {}, `Subgroup ${from + i + 1}: ${f(v, o.dec)}${hit ? ' (rule ' + o.hits[from + i].join(', ') + ')' : ''}`));
        svg.appendChild(c);
      });
    });
  }

  /* ---------- Poll ---------- */
  const pollNotes = {
    a: 'Noted. Hold that thought: one average cannot tell you whether 6 grams is unusual for this line.',
    b: 'Noted. Hold that thought: "check first" is right only if you know what normal looks like.',
    c: 'Noted. Hold that thought: "noise" is a claim about this process. What would prove it?'
  };
  $$('.poll-opt').forEach(b => b.addEventListener('click', () => {
    $$('.poll-opt').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
    $('#pollNote').textContent = pollNotes[b.dataset.poll];
  }));

  /* ---------- Tampering ---------- */
  let tSeed = 12;
  function runTamper() {
    const leave = M.tamper('leave', { seed: tSeed }), adj = M.tamper('adjust', { seed: tSeed });
    const lo = Math.min(...leave.weights, ...adj.weights), hi = Math.max(...leave.weights, ...adj.weights);
    const opt = (r) => ({ series: [{ vals: r.weights, line: 'line1', pt: 'pt1' }], cl: 800, clLabel: 'Target ', dec: 0, extra: [lo, hi] });
    plot($('#tLeave'), opt(leave));
    plot($('#tAdj'), opt(adj));
    $('#tLeaveStat').textContent = `σ = ${f(leave.sd, 2)} g`;
    $('#tAdjStat').textContent = `σ = ${f(adj.sd, 2)} g`;
    const pct = (adj.sd / leave.sd - 1) * 100;
    $('#tamperTake').textContent = pct > 0
      ? `Same noise, more spread: adjusting after every loaf made the weights ${f(pct, 0)}% more variable today. Worst miss: ${f(leave.worst, 1)} g left alone versus ${f(adj.worst, 1)} g with adjusting.`
      : `Today the adjuster got lucky (${f(-pct, 0)}% less spread). Run a few more days; over time, adjusting adds about 40% more spread.`;
  }
  $('#tamperRun').addEventListener('click', runTamper);
  $('#tamperNew').addEventListener('click', () => { tSeed = Math.floor(Math.random() * 1e6); runTamper(); });

  /* ---------- Timing data state ---------- */
  let state = { n: 4, rows: [] };
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.rows)) state = s; } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } };
  const blankRow = round => ({ round, vals: Array(state.n).fill('') });
  const curRound = () => Number($('#roundSel').value);
  $('#nSel').value = String(state.n);

  function renderEntry() {
    const t = $('#entryTable');
    const head = '<thead><tr><th scope="col">Row</th><th scope="col">Round</th>' +
      Array.from({ length: state.n }, (_, i) => `<th scope="col">Time ${i + 1}</th>`).join('') + '<th scope="col"><span class="sr">Remove</span></th></tr></thead>';
    const body = state.rows.map((r, i) => `<tr class="${r.round === 2 ? 'r2' : ''}"><td>${i + 1}</td><td>${r.round === 2 ? 'Round 2' : 'Round 1'}</td>` +
      r.vals.map((v, j) => `<td><input inputmode="decimal" aria-label="Row ${i + 1} time ${j + 1}" data-r="${i}" data-c="${j}" value="${v}"></td>`).join('') +
      `<td><button type="button" class="del" data-del="${i}" aria-label="Remove row ${i + 1}">✕</button></td></tr>`).join('');
    t.innerHTML = head + '<tbody>' + (body || `<tr><td colspan="${state.n + 3}" class="fine">No rows yet. Press Start, or choose Add a row.</td></tr>`) + '</tbody>';
  }
  $('#entryTable').addEventListener('input', e => {
    const i = e.target.dataset.r, j = e.target.dataset.c;
    if (i === undefined) return;
    state.rows[i].vals[j] = e.target.value.trim(); save(); compute();
  });
  $('#entryTable').addEventListener('click', e => {
    const d = e.target.dataset.del;
    if (d === undefined) return;
    state.rows.splice(Number(d), 1); save(); renderEntry(); compute();
  });
  $('#addRow').addEventListener('click', () => { state.rows.push(blankRow(curRound())); save(); renderEntry(); compute(); });
  $('#nSel').addEventListener('change', e => {
    state.n = Number(e.target.value);
    state.rows.forEach(r => { r.vals = r.vals.slice(0, state.n); while (r.vals.length < state.n) r.vals.push(''); });
    save(); renderEntry(); compute();
  });
  $('#clearData').addEventListener('click', () => {
    if (state.rows.length && !confirm('Clear all timing data on this device?')) return;
    state.rows = []; save(); renderEntry(); compute();
  });
  $('#exampleData').addEventListener('click', () => {
    if (state.rows.length && !confirm('Replace the current rows with example data?')) return;
    const ex = M.exampleTiming(3504, state.n, 8, 5);
    state.rows = ex.round1.map(v => ({ round: 1, vals: v.map(String) })).concat(ex.round2.map(v => ({ round: 2, vals: v.map(String) })));
    save(); renderEntry(); compute();
  });
  $('#downloadCsv').addEventListener('click', () => {
    const lines = [['row', 'round', ...Array.from({ length: state.n }, (_, i) => 'time' + (i + 1))].join(',')]
      .concat(state.rows.map((r, i) => [i + 1, r.round, ...r.vals].join(',')));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    a.download = 'w12-ten-second-challenge.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  /* ---------- Timer ---------- */
  let t0 = null;
  $('#timerBtn').addEventListener('click', () => {
    const read = $('#timerRead'), btn = $('#timerBtn');
    if (t0 === null) {
      t0 = performance.now(); btn.textContent = 'Stop';
      read.textContent = 'Timing… stop at ten seconds'; read.classList.add('running');
      return;
    }
    const secs = Math.round((performance.now() - t0) / 10) / 100; t0 = null;
    btn.textContent = 'Start'; read.classList.remove('running');
    read.textContent = `${secs.toFixed(2)} s`;
    const round = curRound();
    let row = state.rows.find(r => r.round === round && r.vals.some(v => v === ''));
    if (!row) { row = blankRow(round); state.rows.push(row); }
    row.vals[row.vals.indexOf('')] = secs.toFixed(2);
    save(); renderEntry(); compute();
  });

  /* ---------- Charts from the class data ---------- */
  function compute() {
    const done = state.rows.filter(r => r.vals.length === state.n && r.vals.every(v => v !== '' && isFinite(Number(v))))
      .map(r => ({ round: r.round, vals: r.vals.map(Number) }));
    const base = done.filter(r => r.round === 1), later = done.filter(r => r.round === 2);
    const ordered = base.concat(later);
    const stats = M.subgroupStats(ordered.map(r => r.vals));
    const means = stats.map(s => s.mean), ranges = stats.map(s => s.range);
    const kp = $('#kpis');
    if (base.length < 2) {
      kp.innerHTML = `<div class="kpi"><b>${base.length}</b><span>complete Round 1 rows (need at least 2)</span></div>`;
      plot($('#xChart'), { series: [], empty: 'Enter at least two complete Round 1 rows' });
      plot($('#rChart'), { series: [], empty: 'Enter at least two complete Round 1 rows' });
      $('#statTable').innerHTML = ''; $('#mathOut').innerHTML = '<p class="fine">Waiting for data.</p>';
      $('#ruleOut').innerHTML = '<p class="fine">Add Round 1 rows first.</p>';
      return;
    }
    const lim = M.trialLimits(base.map(r => r.vals), state.n);
    const hits = M.westernElectric(means, lim);
    const rHits = ranges.map(r => (r > lim.rUCL || r < lim.rLCL) ? [1] : []);
    const nb = base.length;
    const kpi = (v, label, cls) => `<div class="kpi ${cls || ''}"><b>${v}</b><span>${label}</span></div>`;
    const flagged = hits.filter(h => h.length).length;
    kp.innerHTML = kpi(f(lim.grand, 2) + ' s', 'Grand mean X̄̄ (Round 1)') + kpi(f(lim.rbar, 2) + ' s', 'Average range R̄ (Round 1)') +
      kpi(`${f(lim.xLCL, 2)}–${f(lim.xUCL, 2)}`, 'X-bar control limits') + kpi(`0–${f(lim.rUCL, 2)}`, 'R chart limits') +
      kpi(String(flagged), 'subgroups flagged on X-bar', flagged ? 'alert' : 'ok');
    const series = v => [{ vals: v.slice(0, nb), line: 'line1', pt: 'pt1' }].concat(later.length ? [{ vals: v.slice(nb), line: 'line2', pt: 'pt2', from: nb }] : []);
    const band = later.length ? [nb, nb + later.length - 1] : null;
    plot($('#xChart'), { series: series(means), ucl: lim.xUCL, lcl: lim.xLCL, cl: lim.grand, dec: 2, hits, band });
    plot($('#rChart'), { series: series(ranges), ucl: lim.rUCL, lcl: lim.rLCL, cl: lim.rbar, dec: 2, hits: rHits, floor: 0, band });
    $('#statTable').innerHTML = '<thead><tr><th scope="col">Subgroup</th><th scope="col">Round</th><th scope="col">X̄ (s)</th><th scope="col">R (s)</th><th scope="col">Signal</th></tr></thead><tbody>' +
      ordered.map((r, i) => {
        const sig = [...hits[i].map(h => 'X-bar rule ' + h), ...(rHits[i].length ? ['R beyond limit'] : [])];
        return `<tr class="${sig.length ? 'flag' : ''}"><td>${i + 1}</td><td>${r.round}</td><td>${f(means[i], 3)}</td><td>${f(ranges[i], 2)}</td><td>${sig.join('; ') || '—'}</td></tr>`;
      }).join('') + '</tbody>';
    const c = M.CONSTANTS[state.n];
    $('#mathOut').innerHTML = `<ul class="tight">
      <li>Round 1 subgroups: k = ${nb}, n = ${state.n} (A₂ = ${c.A2}, D₃ = ${c.D3}, D₄ = ${c.D4})</li>
      <li>X̄̄ = ΣX̄ / k = ${f(means.slice(0, nb).reduce((a, b) => a + b, 0), 3)} / ${nb} = <strong>${f(lim.grand, 3)} s</strong></li>
      <li>R̄ = ΣR / k = ${f(ranges.slice(0, nb).reduce((a, b) => a + b, 0), 2)} / ${nb} = <strong>${f(lim.rbar, 3)} s</strong></li>
      <li>X-bar limits = ${f(lim.grand, 3)} ± ${c.A2} × ${f(lim.rbar, 3)} = <strong>${f(lim.xLCL, 3)} to ${f(lim.xUCL, 3)} s</strong></li>
      <li>R limits = ${c.D3} × R̄ to ${c.D4} × ${f(lim.rbar, 3)} = <strong>0 to ${f(lim.rUCL, 3)} s</strong></li></ul>
      <p class="fine">Round 2 rows, if any, are plotted against these Round 1 limits and do not change them.</p>`;
    // Rule summary for slide 8
    const names = { 1: 'Rule 1 (beyond 3σ)', 2: 'Rule 2 (8 on one side)', 3: 'Rule 3 (6 trending)', 4: 'Rule 4 (2 of 3 beyond 2σ)' };
    const lines = [];
    [1, 2, 3, 4].forEach(rn => {
      const at = hits.map((h, i) => h.includes(rn) ? i + 1 : null).filter(Boolean);
      if (at.length) lines.push(`<li><span class="rule-hit">${names[rn]}</span> at subgroup ${at.join(', ')}</li>`);
    });
    const rOut = rHits.map((h, i) => h.length ? i + 1 : null).filter(Boolean);
    if (rOut.length) lines.push(`<li><span class="rule-hit">R chart beyond limit</span> at subgroup ${rOut.join(', ')}</li>`);
    const r1m = M.mean(means.slice(0, nb)), r2m = later.length ? M.mean(means.slice(nb)) : null;
    const r1r = M.mean(ranges.slice(0, nb)), r2r = later.length ? M.mean(ranges.slice(nb)) : null;
    $('#ruleOut').innerHTML = (lines.length ? `<ul class="tight">${lines.join('')}</ul>` : '<p>No rule fires on the current data.</p>') +
      (later.length ? `<p class="fine">Round 1 averaged ${f(r1m, 2)} s (R̄ ${f(r1r, 2)}); Round 2 averaged ${f(r2m, 2)} s (R̄ ${f(r2r, 2)}).</p>` : '<p class="fine">Add Round 2 rows to compare.</p>');
  }

  /* ---------- Capability ---------- */
  const LSL = 790, USL = 810;
  function drawCap() {
    const mu = Number($('#muIn').value), sg = Number($('#sgIn').value);
    $('#muOut').textContent = mu.toFixed(1); $('#sgOut').textContent = sg.toFixed(1);
    const svg = $('#capChart'); clear(svg);
    const W = 900, H = 220, pl = 30, pr = 30, base = H - 30;
    const lo = 775, hi = 825, x = v => pl + (v - lo) * (W - pl - pr) / (hi - lo);
    const pdf = v => Math.exp(-0.5 * ((v - mu) / sg) ** 2) / (sg * Math.sqrt(2 * Math.PI));
    const peak = pdf(mu), y = d => base - d / peak * (H - 70);
    const pts = []; for (let v = lo; v <= hi; v += 0.25) pts.push([v, pdf(v)]);
    const area = (a, b, cls) => {
      const seg = pts.filter(p => p[0] >= a && p[0] <= b);
      if (seg.length < 2) return;
      svg.appendChild(el('path', { class: cls, d: `M${x(seg[0][0])},${base} ` + seg.map(p => `L${x(p[0])},${y(p[1])}`).join(' ') + ` L${x(seg[seg.length - 1][0])},${base} Z` }));
    };
    // control band for subgroup means (n = 4): mu ± 3σ/√4
    const half = 3 * sg / 2;
    svg.appendChild(el('rect', { class: 'band', x: x(mu - half), y: 20, width: x(mu + half) - x(mu - half), height: base - 20 }));
    area(lo, hi, 'curve'); area(lo, LSL, 'tail'); area(USL, hi, 'tail');
    niceTicks(lo, hi, 10).forEach(t => svg.appendChild(el('text', { x: x(t), y: H - 10, 'text-anchor': 'middle' }, String(t))));
    [[LSL, 'LSL 790'], [USL, 'USL 810']].forEach(([v, l]) => {
      svg.appendChild(el('line', { class: 'spec', x1: x(v), x2: x(v), y1: 14, y2: base }));
      svg.appendChild(el('text', { x: x(v), y: 12, 'text-anchor': 'middle' }, l));
    });
    svg.appendChild(el('text', { class: 'lbl-t', x: x(mu), y: 34, 'text-anchor': 'middle' }, 'X-bar control band (n = 4)'));
    const c = M.capability(mu, sg, LSL, USL);
    const k = (v, l, cls) => `<div class="kpi ${cls || ''}"><b>${v}</b><span>${l}</span></div>`;
    $('#capKpis').innerHTML = k(f(c.cp, 2), 'Cp (spread only)', c.cp >= 1.33 ? 'ok' : (c.cp < 1 ? 'alert' : '')) +
      k(f(c.cpk, 2), 'Cpk (spread and centering)', c.cpk >= 1.33 ? 'ok' : (c.cpk < 1 ? 'alert' : '')) +
      k(c.ppm < 1 ? '< 1' : Math.round(c.ppm).toLocaleString(), 'loaves per million out of spec', c.ppm > 2700 ? 'alert' : '');
  }
  $('#muIn').addEventListener('input', drawCap);
  $('#sgIn').addEventListener('input', drawCap);

  /* ---------- Where SPC fits ---------- */
  const FIT = [
    ['Bakery', 'High', 'X-bar and R', 'Repetitive production; loaf weight and moisture are measurable.'],
    ['Brewery', 'High', 'X-bar and R', 'Batch production; carbonation, ABV and fill volume are measurable.'],
    ['Coffee', 'High', 'X-bar and R, or p', 'Shot volume is measurable; the share of wrong orders can be tracked as a proportion.'],
    ['Medical Supply', 'Very high', 'X-bar and R', 'Regulated; dimensional tolerances must be documented.'],
    ['Logistics', 'Moderate', 'p-chart', 'On-time delivery is a pass/fail proportion; route variability complicates the baseline.'],
    ['Fitness', 'Low–moderate', 'p-chart', 'Class cancellation rate is trackable; the service experience itself is hard to measure.'],
    ['Tech Services', 'Low', 'c-chart at most', 'Ticket counts are trackable; the quality of knowledge work is not easily measured.'],
    ['Green Build', 'Low', 'Not applicable', 'Each project is unique, so there is no repeating process to chart.']
  ];
  $('#fitGrid').innerHTML = FIT.map(([n, fit, chart, why]) => {
    const cls = /high/i.test(fit) ? 'fit-high' : /moderate/i.test(fit) ? 'fit-mod' : 'fit-low';
    return `<details><summary>Cowford ${n}</summary><p><span class="fit-pill ${cls}">${fit}</span> · <strong>${chart}</strong></p><p>${why}</p></details>`;
  }).join('');

  /* ---------- Exit ticket ---------- */
  $('#copyTicket').addEventListener('click', () => {
    const qs = $$('.ticket label');
    const text = qs.map(l => l.firstChild.textContent.trim() + '\n' + l.querySelector('textarea').value.trim()).join('\n\n');
    const done = ok => { $('#copyNote').textContent = ok ? 'Copied. Paste it anywhere you keep notes.' : 'Copy was blocked; select the text and copy it manually.'; };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => done(true), () => done(false)); else done(false);
  });

  /* ---------- Expand / collapse ---------- */
  $('#btnExpand').addEventListener('click', () => $$('details').forEach(d => { d.open = true; }));
  $('#btnCollapse').addEventListener('click', () => $$('details').forEach(d => { d.open = false; }));

  /* ---------- Present mode ---------- */
  const slides = $$('.slide');
  let cur = 0;
  function show(i) {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, k) => s.classList.toggle('current', k === cur));
    $('#slideCount').textContent = `${cur + 1} / ${slides.length}`;
    window.scrollTo(0, 0);
    if (slides[cur].id === 's4' && !$('#tLeave').firstChild) runTamper();
  }
  function present(on) {
    document.body.classList.toggle('presenting', on);
    $('#presentNav').hidden = !on;
    if (on) {
      const fromHash = slides.findIndex(s => '#' + s.id === location.hash);
      show(fromHash >= 0 ? fromHash : 0);
      if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    } else {
      slides.forEach(s => s.classList.remove('current'));
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      slides[cur].scrollIntoView();
    }
  }
  $('#btnPresent').addEventListener('click', () => present(true));
  $('#exitPresent').addEventListener('click', () => present(false));
  $('#prevSlide').addEventListener('click', () => show(cur - 1));
  $('#nextSlide').addEventListener('click', () => show(cur + 1));
  document.addEventListener('keydown', e => {
    if (!document.body.classList.contains('presenting')) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { show(cur + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { show(cur - 1); e.preventDefault(); }
    else if (e.key === 'Escape') present(false);
  });
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.body.classList.contains('presenting')) { /* stay in slide mode; Esc exits fullscreen first */ }
  });

  /* ---------- init ---------- */
  renderEntry(); compute(); runTamper(); drawCap();
  if (/present/.test(location.search)) present(true);
})();
