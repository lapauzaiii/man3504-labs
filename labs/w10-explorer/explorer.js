/* Week 10 Lean Explorer — page behavior. No storage: all state lives in
   memory and is discarded on refresh. */
(function () {
  'use strict';
  const M = window.LeanModel;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const SVGNS = 'http://www.w3.org/2000/svg';
  const fmt = (n, d) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
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
      $('.locked-msg', fs).textContent = 'Prediction locked: "' + chosen.parentElement.textContent.trim() + '." Now explore, and see whether the brewery agrees.';
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

  /* ================= Stop 1: lower the water ================= */
  const s1 = { fixed: new Set() };
  const rockX = [110, 250, 390, 530];
  const surfaceY = b => 200 - b * 12;
  function drawS1() {
    const b = Number($('#buffer').value);
    $('#bufferOut').textContent = b;
    const st = M.waterState(b, [...s1.fixed]);
    const river = $('#river');
    $$('g.dyn', river).forEach(g => g.remove());
    const g = svg('g', { class: 'dyn' });
    g.appendChild(svg('rect', { x: 0, y: 200, width: 640, height: 20, fill: '#7a5a3a' }));
    M.ROCKS.forEach((r, i) => {
      const top = surfaceY(r.depth), x = rockX[i];
      const exposed = st.exposed.includes(r.id), fixed = s1.fixed.has(r.id);
      const fill = !exposed ? '#6b7280' : (fixed ? '#1f7a3a' : '#b42318');
      g.appendChild(svg('path', { d: `M${x - 52} 200 L${x - 18} ${top + 6} Q${x} ${top - 6} ${x + 18} ${top + 4} L${x + 52} 200 Z`, fill, stroke: '#2b2b2b', 'stroke-width': 1.5 }));
      if (exposed) {
        const label = svg('text', { x, y: top - 12, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: css('--text-primary') }, (fixed ? '✓ ' : '! ') + r.title);
        g.appendChild(label);
      }
    });
    const y = surfaceY(b);
    g.appendChild(svg('rect', { x: 0, y, width: 640, height: 200 - y, fill: css('--water') || '#3b82c4', opacity: 0.72 }));
    g.appendChild(svg('path', { d: `M0 ${y} q20 -5 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0`, fill: 'none', stroke: '#cfe6f7', 'stroke-width': 2 }));
    // boat
    const bx = 590;
    g.appendChild(svg('path', { d: `M${bx - 30} ${y - 10} h60 l-10 12 h-40 z`, fill: '#E97132', stroke: '#7a3a12', 'stroke-width': 1.5 }));
    g.appendChild(svg('text', { x: bx, y: y - 15, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: css('--text-primary') }, 'Customers'));
    g.appendChild(svg('text', { x: 10, y: 16, 'font-size': 12, fill: css('--text-secondary') }, `Water level = ${b} days of finished beer`));
    river.appendChild(g);

    $('#m1cash').textContent = '$' + fmt(st.cashTiedUp);
    $('#m1vis').textContent = `${st.exposed.length} of ${M.ROCKS.length}`;
    $('#m1short').textContent = st.shortageDays;
    $('#m1short').parentElement.classList.toggle('warn', st.shortageDays > 0);
    $('#m1short').parentElement.classList.toggle('good', st.exposed.length > 0 && st.shortageDays === 0);

    const list = $('#rocks');
    clear(list);
    if (!st.exposed.length) {
      list.innerHTML = '<p class="fine">No problems visible yet. The water is deep enough to hide them. Keep lowering it.</p>';
    }
    M.ROCKS.filter(r => st.exposed.includes(r.id)).forEach(r => {
      const fixed = s1.fixed.has(r.id);
      const div = document.createElement('div');
      div.className = 'rock' + (fixed ? ' fixed' : '');
      div.innerHTML = `<h4>${r.title}</h4><p>${r.problem}</p>` +
        (fixed ? `<p class="done">Fixed: ${r.fix}</p>` :
          `<p><strong>Causing about ${r.shortage} shortage day${r.shortage > 1 ? 's' : ''} a month.</strong></p><button type="button" class="btn" data-fix="${r.id}">Fix it: ${r.fix}</button>`);
      list.appendChild(div);
    });
  }
  $('#buffer').addEventListener('input', drawS1);
  $('#rocks').addEventListener('click', e => {
    const id = e.target.closest('[data-fix]') && e.target.closest('[data-fix]').dataset.fix;
    if (!id) return;
    s1.fixed.add(id); drawS1();
    const next = $('#rocks .btn'); if (next) next.focus(); else $('#buffer').focus();
  });

  /* ================= Stop 2: waste walk ================= */
  const WASTES = ['Defects', 'Overproduction', 'Waiting', 'Non-utilized talent', 'Transportation', 'Inventory', 'Motion', 'Extra processing', 'Not waste'];
  const OBS = [
    { zone: 'Brewhouse', x: 70, y: 70, text: 'The head brewer keeps a notebook of recipe tweaks she spots during each batch. There is no process to review or test them.',
      best: 'Non-utilized talent', read: 'The knowledge exists, but the system never uses it. A short kaizen review after each brew would capture it.' },
    { zone: 'Fermentation cellar', x: 270, y: 70, text: 'A fermenter sits empty for two days because cleaning runs every Friday, whether or not a tank has just been emptied.',
      best: 'Waiting', read: 'The tank and the next batch wait on a calendar, not on a need. Cleaning triggered by an event (tank emptied) removes most of it.' },
    { zone: 'Cold room', x: 330, y: 175, text: 'Forty kegs of last fall\'s pumpkin ale are still in the cold room. It was brewed to last year\'s forecast.',
      best: 'Overproduction', also: ['Inventory'], read: 'Making more than customers pulled. It shows up as inventory now, but inventory is the symptom and overproduction is the cause.' },
    { zone: 'Warehouse', x: 575, y: 70, text: 'Two months of printed labels and empty cans for the current seasonal are stacked by the dock, though recipes rotate every 4–6 weeks.',
      best: 'Inventory', read: 'Materials bought far ahead of need tie up cash and space, and they become scrap if the seasonal rotates out early.' },
    { zone: 'Packaging', x: 120, y: 175, text: 'End-of-run seam checks find bad cans, so the whole pallet is pulled and dumped.',
      best: 'Defects', read: 'Defects, made worse by catching them at the end. Stopping the seamer at the first bad check (jidoka) would save the rest of the pallet.' },
    { zone: 'Plant floor', x: 230, y: 175, text: 'A forklift carries each keg pallet from packaging across the building to the cold room, then back across to the dock for pickup.',
      best: 'Transportation', read: 'Material moves that add no value and risk damage. Stop 5 shows how layout shortens the trip.' },
    { zone: 'Brewhouse', x: 140, y: 70, text: 'On brew day, the brewer walks to a supply closet at the far end of the building four or five times for gaskets, clamps, and hoses.',
      best: 'Motion', read: 'People moving, not material. 5S "set in order" puts a point-of-use kit at the brewhouse.' },
    { zone: 'Quality lab', x: 485, y: 70, text: 'Every batch of the flagship IPA gets a full 12-test lab panel, though three years of results show only 3 tests ever vary.',
      best: 'Extra processing', read: 'More work than quality requires. Careful, though: trim to the tests that carry information, and keep the full panel for new recipes.' },
    { zone: 'Fermentation cellar', x: 350, y: 70, text: 'The house lager conditions in a cold tank for four weeks before packaging.',
      best: 'Not waste', read: 'Lagering is how the beer gets its character, so the product is being transformed even though nothing moves. Treating it as waste leads to an impossible future state. Stop 6 comes back to this.' }
  ];
  const s2done = new Set();
  function buildS2() {
    const map = $('#floorMap');
    const zones = [
      ['Brewhouse', 20, 20, 170, 100], ['Fermentation cellar', 205, 20, 220, 100], ['Quality lab', 440, 20, 90, 100], ['Warehouse', 545, 20, 75, 100],
      ['Packaging', 20, 135, 170, 80], ['Plant floor', 205, 135, 80, 80], ['Cold room', 300, 135, 125, 80], ['Dock', 440, 135, 180, 80]
    ];
    zones.forEach(([n, x, y, w, h]) => {
      map.appendChild(svg('rect', { x, y, width: w, height: h, rx: 6, fill: 'none', stroke: css('--text-secondary'), 'stroke-width': 1.2 }));
      map.appendChild(svg('text', { x: x + 6, y: y + 15, 'font-size': 11, fill: css('--text-secondary') }, n));
    });
    OBS.forEach((o, i) => {
      const g = svg('g', { class: 'pin', 'data-pin': i, tabindex: 0, role: 'button', 'aria-label': `Observation ${i + 1}: ${o.zone}`, style: 'cursor:pointer' });
      g.appendChild(svg('circle', { cx: o.x, cy: o.y, r: 13, fill: '#E97132', stroke: '#fff', 'stroke-width': 2 }));
      g.appendChild(svg('text', { x: o.x, y: o.y + 4.5, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: '#fff' }, String(i + 1)));
      const jump = () => { const sel = $('#w' + i); sel.scrollIntoView({ block: 'center' }); sel.focus(); };
      g.addEventListener('click', jump);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(); } });
      map.appendChild(g);
    });
    const wrap = $('#wasteCards');
    OBS.forEach((o, i) => {
      const card = document.createElement('div');
      card.className = 'wcard';
      card.innerHTML = `<div><span class="num">${i + 1}</span><span class="zone">${o.zone}</span></div><p>${o.text}</p>
        <label for="w${i}" class="fine">Which waste is this?</label>
        <select id="w${i}"><option value="">Choose…</option>${WASTES.map(w => `<option>${w}</option>`).join('')}</select>
        <div class="read" hidden aria-live="polite"></div>`;
      wrap.appendChild(card);
      $('select', card).addEventListener('change', e => {
        const v = e.target.value; const read = $('.read', card);
        if (!v) { read.hidden = true; return; }
        let lead;
        if (v === o.best) lead = `<strong>My read: ${o.best}.</strong> We agree.`;
        else if (o.also && o.also.includes(v)) lead = `<strong>My read: ${o.best}.</strong> ${v} is defensible too.`;
        else lead = `<strong>My read: ${o.best}.</strong> You chose ${v}; here's my reasoning.`;
        read.innerHTML = `${lead} ${o.read}`;
        read.hidden = false;
        card.classList.add('done');
        s2done.add(i);
        $(`[data-pin="${i}"] circle`).setAttribute('fill', '#067c86');
        $('#wasteCount').textContent = `Classified ${s2done.size} of ${OBS.length}` + (s2done.size === OBS.length ? '. Nice work! Open Lola\'s take below.' : '');
      });
    });
  }

  /* ================= Stop 3: push vs pull ================= */
  function drawRun(el, run) {
    clear(el);
    const W = 300, H = 170, L = 30, B = 145, T = 12, R = 8;
    const maxV = Math.max(80, ...run.days.map(d => Math.max(d.open, d.demand)));
    const top = Math.ceil(maxV / 40) * 40;
    const y = v => B - (v / top) * (B - T);
    const bw = (W - L - R) / run.days.length;
    for (const t of [0, top / 2, top]) {
      el.appendChild(svg('line', { x1: L, x2: W - R, y1: y(t), y2: y(t), stroke: css('--border-color') }));
      el.appendChild(svg('text', { x: L - 4, y: y(t) + 4, 'text-anchor': 'end', 'font-size': 10, fill: css('--text-secondary') }, fmt(t)));
    }
    const pts = [];
    run.days.forEach((d, i) => {
      const x = L + i * bw + bw * 0.18, w = bw * 0.64;
      el.appendChild(svg('rect', { x, y: y(d.demand), width: w, height: B - y(d.demand), fill: css('--border-color'), stroke: css('--text-secondary'), 'stroke-width': .6 }));
      if (d.lost > 0) el.appendChild(svg('rect', { x, y: y(d.demand), width: w, height: y(d.sold) - y(d.demand), fill: css('--red') }));
      el.appendChild(svg('text', { x: x + w / 2, y: B + 13, 'text-anchor': 'middle', 'font-size': 10, fill: css('--text-secondary') }, String(i + 1)));
      pts.push(`${x + w / 2},${y(d.open)}`);
    });
    el.appendChild(svg('polyline', { points: pts.join(' '), fill: 'none', stroke: css('--teal'), 'stroke-width': 2.5 }));
    pts.forEach(p => { const [cx, cy] = p.split(','); el.appendChild(svg('circle', { cx, cy, r: 3, fill: css('--teal') })); });
    el.appendChild(svg('text', { x: W - R, y: H - 2, 'text-anchor': 'end', 'font-size': 10, fill: css('--text-secondary') }, 'Day'));
  }
  function runMetrics(run) {
    return metric('Sales lost (cases)', fmt(run.lost), run.lost > 0 ? 'warn' : 'good') +
      metric('Avg. on shelf at opening', fmt(run.avgOnHand, 1)) +
      metric('On hand after day 10', fmt(run.ending));
  }
  function drawS3() {
    const push = M.simulatePush(Number($('#pushF').value));
    const pull = M.simulatePull(Number($('#pullK').value));
    drawRun($('#pushChart'), push); drawRun($('#pullChart'), pull);
    $('#pushM').innerHTML = runMetrics(push);
    $('#pullM').innerHTML = runMetrics(pull);
  }
  function buildS3() {
    $('#demandRow').innerHTML = '<th scope="row">Day</th>' + M.DEMAND.map((d, i) => `<td><span class="fine">${i + 1}</span><br><strong>${d}</strong></td>`).join('');
    $('#pushF').addEventListener('change', drawS3);
    $('#pullK').addEventListener('change', drawS3);
  }

  /* ================= Stop 4: takt + heijunka ================= */
  function drawTakt() {
    const avail = Number($('#avail').value), cases = Number($('#cases').value);
    $('#availOut').textContent = avail; $('#casesOut').textContent = cases;
    const takt = M.taktSeconds(avail, cases);
    $('#taktOut').textContent = fmt(takt, 1) + ' seconds per case';
    const el = $('#taktChart'); clear(el);
    const W = 640, L = 40, B = 190, T = 16, top = 70;
    const y = v => B - (Math.min(v, top) / top) * (B - T);
    const bw = (W - L - 10) / M.LINE.length;
    for (const t of [0, 20, 40, 60]) {
      el.appendChild(svg('line', { x1: L, x2: W - 10, y1: y(t), y2: y(t), stroke: css('--border-color') }));
      el.appendChild(svg('text', { x: L - 6, y: y(t) + 4, 'text-anchor': 'end', 'font-size': 11, fill: css('--text-secondary') }, t + 's'));
    }
    M.LINE.forEach((s, i) => {
      const over = s.sec > takt;
      const x = L + i * bw + bw * .2, w = bw * .6;
      el.appendChild(svg('rect', { x, y: y(s.sec), width: w, height: B - y(s.sec), rx: 3, fill: over ? css('--red') : css('--teal') }));
      el.appendChild(svg('text', { x: x + w / 2, y: y(s.sec) - 6, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: css('--text-primary') }, s.sec + 's' + (over ? ' ▲' : '')));
      el.appendChild(svg('text', { x: x + w / 2, y: B + 16, 'text-anchor': 'middle', 'font-size': 12, fill: css('--text-primary') }, s.name));
    });
    const ty = y(takt);
    el.appendChild(svg('line', { x1: L, x2: W - 10, y1: ty, y2: ty, stroke: '#E97132', 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }));
    el.appendChild(svg('text', { x: W - 12, y: ty - 6, 'text-anchor': 'end', 'font-size': 12, 'font-weight': 700, fill: '#E97132' }, takt > top ? `Takt ${fmt(takt, 1)}s (off scale)` : `Takt ${fmt(takt, 1)}s`));
    const over = M.overTakt(takt);
    $('#taktMsg').innerHTML = over.length
      ? `<strong style="color:var(--red)">Can't keep the beat:</strong> ${over.join(' and ')} ${over.length > 1 ? 'take' : 'takes'} longer than takt (marked ▲). The line will fall behind every shift.`
      : `<strong style="color:var(--green)">Every station keeps the beat.</strong> The slowest station, the filler at 44 s, has ${fmt(takt - 44, 1)} s of slack per case.`;
  }
  let hjMode = 'batch';
  function drawHeijunka() {
    const setup = Number($('#setup').value);
    $('#setupOut').textContent = setup;
    const h = M.heijunkaMetrics(hjMode, setup);
    const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    $('#weekGrid').innerHTML = h.days.map((day, i) =>
      `<div class="day"><b>${names[i]}</b>${day.map(([beer, q]) => `<div class="blk b-${beer}" title="${beer} ${q} cases">${beer} ${fmt(q)}</div>`).join('')}</div>`).join('');
    const share = h.setupLost / (5 * 450) * 100;
    $('#hjM').innerHTML =
      metric('Changeovers per week', h.changeovers) +
      metric('Minutes lost to changeovers', `${fmt(h.setupLost)} <small>(${fmt(share, 0)}% of the week)</small>`, share > 20 ? 'warn' : '') +
      metric('Finished cases waiting, avg.', fmt(h.totalWaiting), h.totalWaiting > 0 ? '' : 'good') +
      metric('Days each beer is canned', `IPA ${h.daysMade.IPA} · Lager ${h.daysMade.Lager} · Seasonal ${h.daysMade.Seasonal}`);
  }
  function buildS4() {
    $('#avail').addEventListener('input', drawTakt);
    $('#cases').addEventListener('input', drawTakt);
    $('#setup').addEventListener('input', drawHeijunka);
    $$('#s4 [data-mode]').forEach(b => b.addEventListener('click', () => {
      hjMode = b.dataset.mode;
      $$('#s4 [data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      drawHeijunka();
    }));
  }

  /* ================= Stop 5: layout ================= */
  const LAYOUTS = {
    functional: {
      boxes: [['Fillers', 60, 20, 130, 60], ['Keg filling', 240, 20, 120, 60], ['Seamers', 470, 20, 130, 60],
        ['Labelers', 60, 175, 130, 60], ['Palletizing', 270, 175, 130, 60], ['QC bench', 470, 175, 90, 60]],
      route: [[20, 130], [125, 80], [535, 80], [535, 120], [125, 140], [125, 175], [515, 175], [515, 150], [335, 150], [335, 175], [620, 130]],
      queues: [[330, 80], [330, 140], [320, 175], [430, 150]],
      metrics: { feet: 640, handoffs: 6, queues: 4 }
    },
    cell: {
      boxes: [['Fillers', 170, 40, 90, 55], ['Seamer', 270, 40, 90, 55], ['Labeler', 370, 40, 90, 55],
        ['Keg filling', 170, 160, 90, 55], ['Palletizing', 270, 160, 90, 55], ['QC', 370, 160, 90, 55]],
      route: [[20, 130], [170, 68], [270, 68], [370, 68], [460, 68], [460, 187], [360, 187], [460, 187], [620, 130]],
      queues: [[460, 128]],
      metrics: { feet: 140, handoffs: 2, queues: 1 }
    }
  };
  let layoutMode = 'functional';
  function drawLayout() {
    const el = $('#layout'); clear(el);
    const L = LAYOUTS[layoutMode];
    const defs = svg('defs');
    const mk = svg('marker', { id: 'arrow', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
    mk.appendChild(svg('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#E97132' }));
    defs.appendChild(mk); el.appendChild(defs);
    if (layoutMode === 'cell') el.appendChild(svg('rect', { x: 150, y: 25, width: 330, height: 205, rx: 14, fill: 'none', stroke: css('--teal'), 'stroke-width': 2, 'stroke-dasharray': '6 4' }));
    if (layoutMode === 'cell') el.appendChild(svg('text', { x: 315, y: 132, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: css('--teal') }, 'IPA family cell'));
    L.boxes.forEach(([n, x, y, w, h]) => {
      el.appendChild(svg('rect', { x, y, width: w, height: h, rx: 6, fill: css('--bg-primary'), stroke: css('--text-secondary'), 'stroke-width': 1.3 }));
      el.appendChild(svg('text', { x: x + w / 2, y: y + h / 2 + 4, 'text-anchor': 'middle', 'font-size': 12, fill: css('--text-primary') }, n));
    });
    el.appendChild(svg('polyline', { points: L.route.map(p => p.join(',')).join(' '), fill: 'none', stroke: '#E97132', 'stroke-width': 3, 'stroke-linejoin': 'round', 'marker-end': 'url(#arrow)', class: 'route' }));
    L.queues.forEach(([x, y]) => {
      el.appendChild(svg('rect', { x: x - 9, y: y - 9, width: 18, height: 18, rx: 3, fill: css('--red') }));
      el.appendChild(svg('text', { x, y: y + 4, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#fff' }, 'Q'));
    });
    el.appendChild(svg('text', { x: 8, y: 118, 'font-size': 11, fill: css('--text-secondary') }, 'Bright tank'));
    el.appendChild(svg('text', { x: 632, y: 118, 'text-anchor': 'end', 'font-size': 11, fill: css('--text-secondary') }, 'Dock'));
    el.appendChild(svg('text', { x: 8, y: 254, 'font-size': 11, fill: css('--text-secondary') }, 'Orange line = route of one IPA batch · red Q = a place where beer waits in a queue'));
    const m = L.metrics;
    $('#layoutM').innerHTML = metric('Feet traveled per batch', fmt(m.feet)) + metric('Handoffs between areas', m.handoffs) + metric('Places beer waits in a queue', m.queues);
  }
  const FIT = {
    f1: { best: 'owmm', yes: 'Yes, OWMM. One worker, one product (crowlers), and machines that run on their own while she moves to the next one.', no: 'I\'d call this OWMM: one worker tending several automatic machines for a single product. GT cells serve a product family with several workers.' },
    f2: { best: 'gt', yes: 'Yes, a GT cell. Dissimilar machines grouped around a family of similar products that share steps, with several people.', no: 'I\'d call this a GT cell: a family of similar products (cans and kegs of the IPA family) sharing steps, staffed by three people. OWMM is one worker, one product.' }
  };
  function buildS5() {
    $$('#s5 [data-layout]').forEach(b => b.addEventListener('click', () => {
      layoutMode = b.dataset.layout;
      $$('#s5 [data-layout]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      drawLayout();
    }));
    $$('.fit').forEach(f => $$('input', f).forEach(r => r.addEventListener('change', () => {
      const k = FIT[f.dataset.fit]; const p = $('.fit-read', f);
      p.innerHTML = `<strong>Lola:</strong> ${r.value === k.best ? k.yes : k.no}`; p.hidden = false;
    })));
  }

  /* ================= Stop 6: VSM / PCE ================= */
  const s6 = { va: new Set() };
  function drawS6() {
    const improved = $('#improve').checked, idle = $('#idle').checked;
    const res = M.pce({ valueAdding: [...s6.va], improved, countIdle: idle });
    const bar = $('#vsmBar'); clear(bar);
    M.STREAM.forEach(st => {
      const h = improved && st.improved != null ? st.improved : st.hours;
      const isVA = st.kind === 'va' || (st.kind === 'choice' && s6.va.has(st.id));
      const d = document.createElement('div');
      d.className = isVA ? 'va' : 'wait';
      if (st.kind === 'choice') d.style.backgroundImage = 'repeating-linear-gradient(45deg, rgba(255,255,255,.28) 0 4px, transparent 4px 9px)';
      d.style.flexGrow = h; d.title = `${st.name}: ${h} h`;
      bar.appendChild(d);
    });
    if (idle) { const d = document.createElement('div'); d.className = 'wait'; d.style.flexGrow = M.LINE_IDLE_HOURS; d.style.background = css('--red'); bar.appendChild(d); }
    $$('#vsmBody tr').forEach(tr => {
      const st = M.STREAM.find(s => s.id === tr.dataset.id);
      $('td.hrs', tr).innerHTML = improved && st.improved != null ? `<span class="strike">${fmt(st.hours)}</span>${fmt(st.improved)}` : fmt(st.hours, st.hours % 1 ? 1 : 0);
    });
    $('#pceM').innerHTML =
      metric('Value-adding hours', fmt(res.va, 1)) +
      metric('Product lead time (hours)', fmt(res.lead, 1)) +
      metric('Pure waiting hours', fmt(res.wait)) +
      metric('Process Cycle Efficiency', fmt(res.pce, res.pce < 10 ? 2 : 1) + '%');
    $('#idleNote').innerHTML = idle
      ? '<strong style="color:var(--red)">Careful:</strong> those 3 hours are <em>resource idle time</em>. The canning line was ready and waiting, but the beer wasn\'t. Adding them to product lead time mixes two different measures. Track them separately.'
      : '';
  }
  function buildS6() {
    const body = $('#vsmBody');
    M.STREAM.forEach(st => {
      const tr = document.createElement('tr'); tr.dataset.id = st.id;
      let cls;
      if (st.kind === 'va') cls = '<span class="tag tag-va">Value-adding</span>';
      else if (st.kind === 'wait') cls = '<span class="tag tag-wait">Waiting</span>';
      else cls = `<span class="toggle2" role="group" aria-label="Classify ${st.name}"><button type="button" data-cls="va" aria-pressed="false">Value-adding</button><button type="button" data-cls="wait" aria-pressed="true">Waiting</button></span>`;
      tr.innerHTML = `<th scope="row">${st.name}</th><td class="hrs"></td><td>${cls}</td>`;
      body.appendChild(tr);
      if (st.kind === 'choice') $$('button', tr).forEach(b => b.addEventListener('click', () => {
        if (b.dataset.cls === 'va') s6.va.add(st.id); else s6.va.delete(st.id);
        $$('button', tr).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        drawS6();
      }));
    });
    $('#improve').addEventListener('change', drawS6);
    $('#idle').addEventListener('change', drawS6);
  }

  /* ================= Stop 7: kanban + vendors ================= */
  let vendor = 'weekly';
  function drawS7() {
    const a = Number($('#policyA').value), delay = Number($('#delay').value), backup = $('#backup').checked;
    $('#policyOut').textContent = a.toFixed(2);
    $('#delayOut').textContent = delay.toFixed(1);
    const v = M.VENDORS[vendor].v;
    const r = M.disruption(v, a, delay, backup);
    $('#formula').textContent = `k = d(v + r)(1 + a) / c = 12 × (${v} + 0.5) × (1 + ${a.toFixed(2)}) / 4 = ${fmt(r.raw, 2)} → ${r.k} pallets`;
    $('#pallets').innerHTML = Array.from({ length: r.k }, () => '<span class="pallet"></span>').join('');
    $('#kbM').innerHTML =
      metric('Pallets authorized', r.k) +
      metric('Most malt on hand (sacks)', r.sacks) +
      metric('Days of malt cover', fmt(r.coverDays, 2)) +
      metric('Spare cover beyond normal refill (days)', fmt(r.spare, 2), r.spare < 0.3 ? 'warn' : '');
    $('#lostOut').textContent = fmt(r.lost, 2) + (r.lost > 0 ? '' : ' (brewing continues)');
    $('#lostOut').style.color = r.lost > 0 ? 'var(--red)' : 'var(--green)';
  }
  function buildS7() {
    const seg = $('#vendorSeg');
    Object.entries(M.VENDORS).forEach(([k, o]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'seg-btn'; b.dataset.vendor = k;
      b.setAttribute('aria-pressed', String(k === vendor));
      b.innerHTML = `${o.label} <span class="fine">(v = ${o.v} day${o.v === 1 ? '' : 's'})</span>`;
      b.addEventListener('click', () => {
        vendor = k; $$('[data-vendor]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); drawS7();
      });
      seg.appendChild(b);
    });
    ['#policyA', '#delay'].forEach(id => $(id).addEventListener('input', drawS7));
    $('#backup').addEventListener('change', drawS7);
  }

  /* ================= Init ================= */
  function redrawAll() { drawS1(); drawS3(); drawTakt(); drawHeijunka(); drawLayout(); drawS6(); drawS7(); }
  buildS2(); buildS3(); buildS4(); buildS5(); buildS6(); buildS7();
  redrawAll();
  // Redraw SVG colors when the system theme changes.
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(redrawAll);
  }
  const start = stops.findIndex(s => '#' + s.id === location.hash);
  go(start >= 0 ? start : 0, false);
})();
