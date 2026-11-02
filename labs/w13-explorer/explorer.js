/* Week 13 Sourcing Explorer: page behavior. No storage: all state lives in
   memory and is discarded on refresh. Navigation and the predict → explore →
   take pattern follow the Week 10 and Week 11 explorers. */
(function () {
  'use strict';
  const M = window.SourcingModel;
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
      $('.locked-msg', fs).textContent = 'Prediction locked: "' + chosen.parentElement.textContent.trim() + '." Now explore, and see whether the numbers agree.';
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


  /* ================= Stop 1: Triple Bottom Line ================= */
  const alignDone = new Set();
  function buildS1() {
    buildCards($('#tblCards'), M.TBL, ['People', 'Planet', 'Profit'], 'tbl', () => {});
    buildCards($('#alignCards'), M.ALIGN, ['Aligned', 'Trade-off'], 'aln', i => {
      alignDone.add(i);
      if (alignDone.size === M.ALIGN.length) {
        const n = M.ALIGN.filter(a => a.best === 'Aligned').length;
        $('#alignMsg').innerHTML = `<strong>All four sorted.</strong> By my read, ${n} of ${M.ALIGN.length} are aligned and ${M.ALIGN.length - n} are trade-offs.`;
      }
    });
  }

  /* ================= Stop 2: tier visibility ================= */
  function buildS2() {
    const wrap = $('#tiers');
    M.TIERS.forEach((t, i) => {
      const d = document.createElement('div');
      d.className = 'tier';
      d.innerHTML = `<span class="tnum" aria-hidden="true">T${t.tier}</span>
        <p><strong>Tier ${t.tier}: ${t.name}</strong><br><span class="fine">${Math.round(t.risk * 100)}% of identified risk · audit cost ${money(t.audit)} a year${t.tier === 1 ? ' · Green Build holds this contract' : ' · no direct contract'}</span></p>
        <label><input type="checkbox" data-tier="${i}"> Audit this tier</label>`;
      wrap.appendChild(d);
    });
    $$('input[data-tier]').forEach(c => c.addEventListener('change', drawS2));
  }
  function drawS2() {
    const on = $$('input[data-tier]').map(c => c.checked);
    $$('.tier').forEach((d, i) => d.classList.toggle('seen', on[i]));
    const v = M.visibility(on);
    const fog = $('#fog'); clear(fog);
    const a = document.createElement('div'); a.className = 'seen'; a.style.width = (v.share * 100) + '%';
    const b = document.createElement('div'); b.className = 'dark'; b.style.width = (v.hidden * 100) + '%';
    fog.append(a, b);
    fog.setAttribute('aria-label', `${fmt(v.share * 100)}% of risk visible, ${fmt(v.hidden * 100)}% hidden`);
    $('#visM').innerHTML =
      metric('Risk Green Build can see', fmt(v.share * 100) + '%', v.share >= 0.999 ? 'good' : (v.share < 0.2 ? 'warn' : '')) +
      metric('Risk still invisible', fmt(v.hidden * 100) + '%', v.hidden > 0.5 ? 'warn' : '') +
      metric('Yearly audit cost', money(v.cost));
  }

  /* ================= Stop 3: TCO ================= */
  const PARTS = [['price', '--p-price', 'Price'], ['freight', '--p-freight', 'Freight and duty'], ['insp', '--p-insp', 'Inspection'],
    ['defect', '--p-defect', 'Defects'], ['safety', '--p-safety', 'Safety stock carrying'], ['disruption', '--p-dis', 'Expected disruption']];
  function opts() {
    return { tariff: Number($('#tariff').value) / 100, disrV: Number($('#disrV').value), carry: Number($('#carry').value) / 100 };
  }
  function buildS3() { ['#tariff', '#disrV', '#carry'].forEach(id => $(id).addEventListener('input', () => { drawS3(); drawS4(); })); }
  function drawS3() {
    const o = opts();
    $('#tariffOut').textContent = fmt(o.tariff * 100) + '%';
    $('#disrVOut').textContent = fmt(o.disrV, 2);
    $('#carryOut').textContent = fmt(o.carry * 100) + '%';
    const c = M.compare(o);
    const el = $('#tcoChart'); clear(el);
    const W = 640, L = 150, R = 70, top = 480;
    const x = v => L + (v / top) * (W - L - R);
    for (const t of [0, 100, 200, 300, 400]) {
      el.appendChild(svg('line', { x1: x(t), x2: x(t), y1: 10, y2: 200, stroke: css('--border-color') }));
      el.appendChild(svg('text', { x: x(t), y: 218, 'text-anchor': 'middle', 'font-size': 11, fill: css('--text-secondary') }, '$' + t));
    }
    c.rows.forEach((r, i) => {
      const yy = 22 + i * 60;
      el.appendChild(svg('text', { x: L - 8, y: yy + 14, 'text-anchor': 'end', 'font-size': 12, 'font-weight': 700, fill: css('--text-primary') }, r.name));
      el.appendChild(svg('text', { x: L - 8, y: yy + 30, 'text-anchor': 'end', 'font-size': 11, fill: css('--text-secondary') }, r.kind));
      let acc = 0;
      PARTS.forEach(([k, col, lab]) => {
        const v = r.parts[k];
        const rect = svg('rect', { x: x(acc), y: yy, width: Math.max(0.5, x(acc + v) - x(acc)), height: 34, fill: css(col) });
        rect.appendChild(svg('title', {}, `${lab}: $${fmt(v, 2)}`));
        el.appendChild(rect); acc += v;
      });
      el.appendChild(svg('text', { x: x(acc) + 6, y: yy + 22, 'font-size': 12, 'font-weight': 700, fill: r.id === c.best ? css('--green') : css('--text-primary') }, '$' + fmt(r.total, 2)));
    });
    const head = '<thead><tr><th scope="col">Per window</th>' + c.rows.map(r => `<th scope="col">${r.name.split(',')[0]}</th>`).join('') + '</tr></thead>';
    const body = PARTS.map(([k, , lab]) => `<tr><td>${lab}</td>` + c.rows.map(r => `<td>$${fmt(r.parts[k], 2)}</td>`).join('') + '</tr>').join('') +
      `<tr><td>Safety stock policy</td>${c.rows.map(r => `<td>${r.ssWeeks} weeks</td>`).join('')}</tr>` +
      `<tr class="total"><td>Total cost of ownership</td>${c.rows.map(r => `<td class="${r.id === c.best ? 'best' : ''}">$${fmt(r.total, 2)}</td>`).join('')}</tr>` +
      `<tr><td>Annual TCO (4,000 windows)</td>${c.rows.map(r => `<td>${money(r.annual)}</td>`).join('')}</tr>`;
    $('#tcoTable').innerHTML = `<caption class="fine" style="text-align:left">TCO per window at the current settings</caption>${head}<tbody>${body}</tbody>`;
    const best = c.rows.find(r => r.id === c.best), inv = c.rows.find(r => r.id === c.cheapestInvoice);
    const be = M.vietnamBreakEvenDisruptions(o);
    $('#tcoMsg').innerHTML = (best.id === inv.id
      ? `<strong>${best.name}</strong> has both the lowest invoice and the lowest TCO at these settings.`
      : `<strong>${best.name}</strong> has the lowest TCO, even though <strong>${inv.name}</strong> has the lowest invoice. The gap is ${money(inv.annual - best.annual)} a year.`) +
      (be === null ? ' At these settings Vietnam can\'t win even with zero disruptions.' : ` Vietnam would have the lowest TCO only below about ${fmt(be, 2)} disruptions a year.`);
  }

  /* ================= Stop 4: full picture ================= */
  function buildS4() { ['#share', '#prem'].forEach(id => $(id).addEventListener('input', drawS4)); }
  function drawS4() {
    const share = Number($('#share').value) / 100, prem = Number($('#prem').value) / 100;
    $('#shareOut').textContent = fmt(share * 100) + '%';
    $('#premOut').textContent = fmt(prem * 100, prem * 100 % 1 ? 1 : 0) + '%';
    const o = opts();
    const rows = M.SUPPLIERS.map(s => Object.assign({ name: s.name, id: s.id }, M.fullPicture(s.id, o, share, prem)));
    $('#fullTable').innerHTML = '<thead><tr><th scope="col">Per year</th>' + rows.map(r => `<th scope="col">${r.name.split(',')[0]}</th>`).join('') + '</tr></thead><tbody>' +
      `<tr><td>Annual TCO (Profit, cost side)</td>${rows.map(r => `<td>${money(r.annualTco)}</td>`).join('')}</tr>` +
      `<tr><td>Sourcing verifiable by third-party audit?</td>${rows.map(r => `<td>${r.verified ? 'Yes' : 'No'}</td>`).join('')}</tr>` +
      `<tr><td>Revenue at risk (Profit, revenue side)</td>${rows.map(r => `<td>${money(r.atRisk)}</td>`).join('')}</tr>` +
      `<tr><td>Annual CO₂ (Planet)</td>${rows.map(r => `<td>${fmt(r.co2)} kg</td>`).join('')}</tr></tbody>`;
    const V = rows[0], Mx = rows[1], G = rows[2];
    const gap = V.annualTco - Mx.annualTco;
    const ratio = gap > 0 ? V.atRisk / gap : null;
    $('#fullMsg').innerHTML = `Choosing Vietnam puts <strong>${money(V.atRisk)}</strong> of revenue at risk` +
      (ratio ? `, about ${fmt(ratio, 1)} times its TCO gap of ${money(gap)}.` : '.') +
      ` Georgia avoids ${fmt(Mx.co2 - G.co2)} kg of CO₂ a year compared with Monterrey, at ${money(G.annualTco - Mx.annualTco)} more in TCO.`;
  }

  /* ================= Stop 5: WBS ================= */
  function buildS5() {
    const grid = $('#wbsGrid');
    const choices = M.PHASES.concat([M.OUT]);
    M.WBS_ITEMS.forEach((it, i) => {
      const row = document.createElement('div');
      row.className = 'wbs-row'; row.dataset.id = it.id;
      row.innerHTML = `<p>${it.text}</p><label class="sr" for="wbs${i}" style="position:absolute;left:-9999px">Phase for: ${it.text}</label>
        <select id="wbs${i}" data-id="${it.id}"><option value="">Choose a phase…</option>${choices.map(c => `<option>${c}</option>`).join('')}</select>`;
      grid.appendChild(row);
    });
    $('#wbsCheck').addEventListener('click', drawS5);
  }
  function drawS5() {
    const assign = {};
    $$('#wbsGrid select').forEach(s => { if (s.value) assign[s.dataset.id] = s.value; });
    const r = M.checkWbs(assign);
    if (r.placed === 0) { $('#wbsM').innerHTML = ''; $('#wbsTree').hidden = true; $$('.wbs-row').forEach(x => x.classList.remove('ok', 'no')); return; }
    r.rows.forEach(x => {
      const row = $(`.wbs-row[data-id="${x.id}"]`);
      row.classList.toggle('ok', !!x.chosen && x.ok); row.classList.toggle('no', !!x.chosen && !x.ok);
    });
    $('#wbsM').innerHTML =
      metric('Placed where I would', `${r.right} <small>of ${r.total}</small>`, r.right === r.total ? 'good' : '') +
      metric('In-scope work missing', String(r.missing), r.missing ? 'warn' : 'good') +
      metric('Scope creep', String(r.creep), r.creep ? 'warn' : 'good') +
      metric('100% Rule', r.hundredPercent ? 'Met' : 'Not yet', r.hundredPercent ? 'good' : 'warn');
    const tree = $('#wbsTree');
    if (r.right === r.total) {
      tree.innerHTML = '<p><strong>Level 0:</strong> Transition Green Build\'s window supply to a verified nearshore supplier</p><ul>' +
        M.PHASES.map(p => `<li><strong>Level 1: ${p}</strong><ul>${M.WBS_ITEMS.filter(i => i.phase === p).map(i => `<li>${i.text}</li>`).join('')}</ul></li>`).join('') + '</ul>';
      tree.hidden = false;
    } else tree.hidden = true;
  }

  /* ================= Init ================= */
  function redrawAll() { drawS2(); drawS3(); drawS4(); }
  buildS1(); buildS2(); buildS3(); buildS4(); buildS5();
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(redrawAll);
  }
  const start = stops.findIndex(s => '#' + s.id === location.hash);
  go(start >= 0 ? start : 0, false);
})();
