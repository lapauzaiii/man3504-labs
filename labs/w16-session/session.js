/* Week 16 Final Review Session — page behavior: reveals, expand/collapse, present mode.
   Present mode follows the Week 12 session. Nothing is stored. */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  $$('.reveal').forEach(b => {
    const label = b.textContent;
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', () => {
      const a = b.nextElementSibling; a.hidden = !a.hidden;
      b.setAttribute('aria-expanded', String(!a.hidden));
      b.textContent = a.hidden ? label : 'Hide';
    });
  });

  $('#btnExpand').addEventListener('click', () => $$('details').forEach(d => { d.open = true; }));
  $('#btnCollapse').addEventListener('click', () => $$('details').forEach(d => { d.open = false; }));

  const slides = $$('.slide');
  let cur = 0;
  function show(i) {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, k) => s.classList.toggle('current', k === cur));
    $('#slideCount').textContent = `${cur + 1} / ${slides.length}`;
    window.scrollTo(0, 0);
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
    if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName) && e.key === ' ') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { show(cur + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { show(cur - 1); e.preventDefault(); }
    else if (e.key === 'Escape') present(false);
  });
  if (/present/.test(location.search)) present(true);
})();
