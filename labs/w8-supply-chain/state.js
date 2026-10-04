/* MAN 3504 W8 — persistence (spec §30.1 C7, C8; §25). One versioned key per seed. No student identifiers. */
(function (root) {
  'use strict';
  var PREFIX = 'man3504:w8-supply-chain:v1:';
  var memory = {}; // fallback when storage is blocked (e.g., third-party iframe restrictions)

  function key(seedId) { return PREFIX + seedId; }
  function blank(seedId) {
    return { v: 1, seed: seedId, stage: 'diagnose', diagnosis: null, initialArch: null,
      revisedArch: null, rationale: null, auditChoice: null, evidence: [], completedAt: null };
  }
  function load(seedId) {
    var raw = null;
    try { raw = root.localStorage.getItem(key(seedId)); } catch (e) { raw = memory[key(seedId)] || null; }
    if (!raw) return blank(seedId);
    try {
      var s = JSON.parse(raw);
      if (!s || s.v !== 1 || s.seed !== seedId) return blank(seedId); // never restore another seed's state
      return Object.assign(blank(seedId), s);
    } catch (e) { return blank(seedId); }
  }
  function save(state) {
    var raw = JSON.stringify(state);
    try { root.localStorage.setItem(key(state.seed), raw); } catch (e) { memory[key(state.seed)] = raw; }
  }
  function clear(seedId) {
    try { root.localStorage.removeItem(key(seedId)); } catch (e) { /* ignore */ }
    delete memory[key(seedId)];
    return blank(seedId);
  }
  root.W8State = { load: load, save: save, clear: clear, blank: blank };
})(window);
