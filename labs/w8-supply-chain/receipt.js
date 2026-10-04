/* MAN 3504 W8 — decision receipt, regenerated from current state every time it is shown (spec §21, §30.1 C8). */
(function (root) {
  'use strict';
  var S = root.W8Scenarios, M = root.W8Model;

  function hash(str) { // djb2, deterministic receipt ID
    var h = 5381;
    for (var i = 0; i < str.length; i++) { h = ((h << 5) + h + str.charCodeAt(i)) >>> 0; }
    return h.toString(36).toUpperCase().padStart(7, '0').slice(-7);
  }

  function build(state, labels) {
    var seed = S.SEEDS[state.seed];
    var initial = M.simulate(state.initialArch, state.seed);
    var changed = state.revisedArch !== state.initialArch;
    var core = [state.seed, state.diagnosis, state.initialArch, state.revisedArch, state.rationale, state.auditChoice, (state.evidence || []).join('+'), state.completedAt].join('|');
    var id = 'W8-' + state.seed.slice(-2) + '-' + hash(core);
    var ts = state.completedAt ? new Date(state.completedAt).toLocaleString('en-US') : 'Not recorded';
    var rows = [
      ['Course', 'MAN 3504'],
      ['Exercise', 'W8 Supply Chain Disruption'],
      ['Scenario seed', state.seed],
      ['Initial diagnosis', labels.diagnosis[state.diagnosis]],
      ['Initial sourcing architecture', S.ARCHITECTURES[state.initialArch].label],
      ['Disruption revealed', seed.title],
      ['Delivered cases', M.fmt.cases(initial.delivered) + ' of ' + M.fmt.cases(initial.demand)],
      ['Service level', M.fmt.pct(initial.serviceLevel)],
      ['Shortfall', M.fmt.cases(initial.shortfall)],
      ['Procurement spend', M.fmt.money(initial.spend.total)],
      ['Decision changed', changed ? 'Yes' : 'No'],
      ['Revised architecture', S.ARCHITECTURES[state.revisedArch].label],
      ['AI audit finding', labels.audit[state.auditChoice]],
      ['Evidence management would still need', (state.evidence || []).length ? state.evidence.map(function (e) { return labels.evidence[e]; }).join('; ') : 'None selected'],
      ['Final recommendation', S.ARCHITECTURES[state.revisedArch].label + ' \u2014 ' + labels.rationale[state.rationale]],
      ['Receipt ID', id],
      ['Timestamp', ts]
    ];
    var text = rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
    return { id: id, rows: rows, text: text };
  }
  root.W8Receipt = { build: build };
})(window);
