# W8 — Cowford Medical Supply Network Disruption Simulator

MAN3504 Operations Management, Week 8, Fall 2026. Supply-chain simulation resource used with the independent Canvas application.

Governing specification: *MAN 3504 W8 — Supply Chain Pilot Specification* (Notion, Cowford Interactive Assessment Buildbook), including §38 revisions.

## Use

```
https://lapauzaiii.github.io/man3504-labs/labs/w8-supply-chain/?seed=3504-W8-04
```

Valid seeds: `3504-W8-01`, `3504-W8-02`, `3504-W8-03`, `3504-W8-04`. A missing or unknown seed shows a "return to Canvas" notice. Canvas currently deploys the common fallback seed `3504-W8-04` (spec §35).

## Flow

Diagnose → Choose (locked) → Disruption revealed, all three architectures compared → Revise (locked) → Four-event stress test → AI audit → Decision receipt. Later stages are not rendered into the DOM until they unlock.

## Files

| File | Role |
|---|---|
| `index.html` | Page shell, aria-live region |
| `scenarios.js` | Validated fixtures: suppliers, architectures, seeds, constants |
| `model.js` | Pure consequence model (spec §11, §30.2 rounding) and stress test (§38.3) |
| `state.js` | Per-seed localStorage key `man3504:w8-supply-chain:v1:<seed>`, with in-memory fallback |
| `receipt.js` | Receipt regenerated from state each time it is shown |
| `app.js` | Interface |
| `styles.css` | Styles; tables become stacked cards below 600px |
| `tests/model.test.js` | Simulator fixture tests against spec §12, §13, §30.2 and §38.3; no graded question mappings |

No build step, no dependencies, no backend, no external requests, no student identifiers. Scripts are classic (non-module) for maximum compatibility inside the Canvas iframe.

## Test

```
node --test labs/w8-supply-chain/tests/model.test.js
```

Expected: 15 tests, 15 pass. Do not change numbers in `scenarios.js` without instructional reconciliation (spec §28). Graded question mappings belong only in instructor materials. Simulator outputs remain publicly inspectable; do not treat them as confidential assessment keys.
