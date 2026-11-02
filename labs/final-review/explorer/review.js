/* Final Review Explorer: page behavior. Builds the six stops from
   window.ReviewModel, then wires navigation and checking. No storage. */
(function () {
  'use strict';
  const M = window.ReviewModel;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const fmt = (n, d) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- Build stops ---------- */
  const wrap = $('#wrap');
  const results = {};
  M.STOPS.forEach((s, i) => {
    const sec = document.createElement('section');
    sec.className = 'stop'; sec.id = s.id; sec.dataset.label = String(i + 1); sec.hidden = true;
    sec.setAttribute('aria-labelledby', 'h-' + s.id);
    sec.innerHTML = `<p class="stop-tag">Stop ${i + 1} of ${M.STOPS.length} · ${s.weeks}</p>
      <h2 id="h-${s.id}">${esc(s.title)}</h2>
      <div class="lola"><img src="lola.svg" alt="" class="lola-img" width="96" height="125">
        <div class="bubble"><p class="bubble-name">Lola June</p><p>${esc(s.lola)}</p></div></div>
      <div class="setup"><strong>Setup.</strong> ${esc(s.setup)}</div>
      ${s.problems.map(p => `<div class="prob" id="box-${p.id}">
        <label for="in-${p.id}">${esc(p.prompt)}</label>
        <div class="prob-row"><input id="in-${p.id}" inputmode="decimal" autocomplete="off">
          <button type="button" class="btn" data-check="${p.id}">Check</button>
          <button type="button" class="btn ghost" data-hint="${p.id}" aria-expanded="false">Hint</button>
          <button type="button" class="btn ghost" data-sol="${p.id}" aria-expanded="false">Show solution</button></div>
        <p class="fb" id="fb-${p.id}" aria-live="polite"></p>
        <p class="sol" id="hint-${p.id}" hidden><strong>Hint:</strong> ${esc(p.hint)}</p>
        <p class="sol" id="sol-${p.id}" hidden><strong>Solution:</strong> ${esc(p.solution)}</p></div>`).join('')}
      <fieldset class="think"><legend><strong>Think it through:</strong> ${esc(s.think.q)}</legend>
        ${s.think.options.map((o, k) => `<label><input type="radio" name="t-${s.id}" value="${k}"> ${esc(o)}</label>`).join('')}
        <p class="fb" id="tfb-${s.id}" aria-live="polite"></p></fieldset>`;
    wrap.parentNode.insertBefore(sec, wrap);
  });
  const all = M.STOPS.flatMap(s => s.problems);
  const byId = Object.fromEntries(all.map(p => [p.id, p]));

  function doCheck(id) {
    const p = byId[id], res = M.check(p, $('#in-' + id).value), fb = $('#fb-' + id), box = $('#box-' + id);
    box.classList.remove('right', 'wrong'); fb.className = 'fb';
    if (res.status === 'empty') { fb.textContent = 'Type a number first.'; return; }
    if (res.status === 'invalid') { fb.textContent = 'That doesn\'t look like a number. Leave out units.'; return; }
    results[id] = res.status === 'right';
    box.classList.add(res.status); fb.classList.add(res.status);
    fb.textContent = res.status === 'right' ? `Correct: ${fmt(p.answer, p.dp)}.` : 'Not quite. Try again, or open the hint.';
  }
  $$('[data-check]').forEach(b => b.addEventListener('click', () => doCheck(b.dataset.check)));
  $$('.prob input').forEach(inp => inp.addEventListener('keydown', e => { if (e.key === 'Enter') doCheck(inp.id.slice(3)); }));
  const toggler = (attr, prefix, label) => $$(`[data-${attr}]`).forEach(b => b.addEventListener('click', () => {
    const t = $('#' + prefix + b.dataset[attr]); t.hidden = !t.hidden;
    b.setAttribute('aria-expanded', String(!t.hidden)); b.textContent = t.hidden ? label : 'Hide ' + label.toLowerCase();
  }));
  toggler('hint', 'hint-', 'Hint'); toggler('sol', 'sol-', 'Show solution');
  M.STOPS.forEach(s => $$(`input[name="t-${s.id}"]`).forEach(r => r.addEventListener('change', () => {
    const ok = Number(r.value) === s.think.best, fb = $('#tfb-' + s.id);
    fb.className = 'fb ' + (ok ? 'right' : 'wrong');
    fb.textContent = (ok ? 'Yes. ' : 'Not this one. ') + s.think.why;
  })));

  /* ---------- Navigation ---------- */
  const stops = $$('.stop');
  const nav = $('#stopNav');
  let current = 0;
  stops.forEach((s, i) => {
    const li = document.createElement('li'); const b = document.createElement('button');
    b.type = 'button'; const label = s.dataset.label;
    b.textContent = /^\d$/.test(label) ? 'Stop ' + label : label;
    b.setAttribute('aria-label', /^\d$/.test(label) ? 'Stop ' + label + ': ' + $('h2', s).textContent : label);
    b.addEventListener('click', () => go(i, true));
    li.appendChild(b); nav.appendChild(li);
  });
  const navBtns = $$('button', nav);
  function go(i, focus) {
    current = Math.max(0, Math.min(stops.length - 1, i));
    stops.forEach((s, j) => { s.hidden = j !== current; });
    navBtns.forEach((b, j) => { if (j === current) { b.setAttribute('aria-current', 'step'); b.classList.add('visited'); } else b.removeAttribute('aria-current'); });
    $('#progressFill').style.width = (current / (stops.length - 1)) * 100 + '%';
    $('#prevBtn').disabled = current === 0;
    $('#nextBtn').hidden = current === stops.length - 1;
    $('#nextBtn').innerHTML = current === 0 ? 'Start the review &rarr;' : (current === stops.length - 2 ? 'See my results &rarr;' : 'Next stop &rarr;');
    $('#pagerLabel').textContent = current === 0 ? 'About 60–75 minutes in all' : (current === stops.length - 1 ? 'Review complete' : `Stop ${current} of ${stops.length - 2}`);
    if (location.hash !== '#' + stops[current].id) history.replaceState(null, '', '#' + stops[current].id);
    if (stops[current].id === 'wrap') summarize();
    if (focus) { window.scrollTo({ top: 0, behavior: 'auto' }); const h = $('h2', stops[current]); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
  }
  function summarize() {
    const right = all.filter(p => results[p.id]).length;
    const tried = all.filter(p => p.id in results).length;
    $('#wrapScore').textContent = `You got ${right} of ${all.length} calculations right (${tried} attempted).`;
    const missed = M.STOPS.flatMap(s => s.problems.filter(p => !results[p.id]).map(p => `<li>${esc(s.title)} (${s.weeks}): ${esc(p.prompt)}</li>`));
    $('#wrapMissed').innerHTML = missed.length ? missed.join('') : '<li>Nothing left to review here. Nice work.</li>';
  }
  $('#prevBtn').addEventListener('click', () => go(current - 1, true));
  $('#nextBtn').addEventListener('click', () => go(current + 1, true));
  $('#restart').addEventListener('click', () => { location.hash = '#start'; location.reload(); });
  window.addEventListener('hashchange', () => { const i = stops.findIndex(s => '#' + s.id === location.hash); if (i >= 0 && i !== current) go(i, true); });
  const start = stops.findIndex(s => '#' + s.id === location.hash);
  go(start >= 0 ? start : 0, false);
})();
