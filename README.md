# MAN3504 Interactive Labs — Fall 2026

UNF Operations Management resources built around fictional **Cowford Holdings**. [Open the lab directory](https://lapauzaiii.github.io/man3504-labs/).

## Course Structure

The Fall 2026 planner spans Week 0 through Week 16 and Finals Week. Week 7 is the midterm; Week 15 is Thanksgiving break. This repository hosts labs and practice review, rather than the complete course.

The eight subsidiaries are Bakery, Coffee, Fitness, Brewery, Medical Supply, Logistics, Green Build and Tech Services.

## Resource Inventory

| Week | Resource | Path | Format |
| --- | --- | --- | --- |
| 1–3 | Foundations, Process Design, Capacity | No lab yet | Directory placeholders |
| 4 | Cowford Coffee Quantitative Forecasting | `labs/w4-forecasting/` | Classroom forecasting workspace |
| 4 | Netflix Excel Assignment | `labs/w4-netflix/` | Assignment support; Starbucks template retained |
| 5 | Qualitative and Regression Forecasting | `labs/w5-forecasting/` | Explorers and practice |
| 6 | Operations Planning | `labs/w6-mrp/` | Aggregate planning, sequencing, MRP and CPM/PERT |
| 7 | Midterm Preparation | `labs/midterm-prep/` | Separate practice review, in week order |
| 8 | Supply Chain Disruption | `labs/w8-supply-chain/?seed=3504-W8-04` | Medical Supply simulator |
| 9 | Inventory Management | `labs/w9-inventory/` | Logistics EOQ, safety stock, ROP and criticality |
| 10 | Lean Systems and Vendor Relationships | `labs/w10-lean/` | Coffee flow and countermeasure planning |
| 10 | Lean Explorer (self-paced, in lieu of lecture) | `labs/w10-explorer/` | Brewery walk with Lola June; pairs with W10.A; stores nothing |
| 11 | Quality and Performance Management | `labs/w11-quality/` | Medical Supply quality costs and DMAIC |
| 11 | Quality Explorer (self-paced, in lieu of lecture) | `labs/w11-explorer/` | Logistics walk with Lola June; pairs with W11.A; stores nothing |
| 12 | Statistical Process Control | `labs/w12-spc/` | Bakery subgroup statistics and trial limits |
| 12 | In-Class Session (slides, live activity, recap) | `labs/w12-session/` | Present mode or read mode; ten-second challenge builds X-bar/R charts; timing data stays in the browser |
| 13 | Ethics, Sustainability and Global Operations | `labs/w13-sourcing/` | Brewery TCO and due diligence |
| 14 | Performance Measurement and Continuous Improvement | `labs/w14-performance/` | Tech Services scorecard and PDCA |

Classroom labs and midterm review are ungraded. The Netflix page retains assignment instructions and its past Fall 2026 deadline. Canvas is authoritative for submissions, grades and current deadlines. Both Week 4 resources remain available; Notion records a next-semester review of their overlap.

## Student and Instructor Materials

New workspaces use independent illustrative data from the Notion instructor labs, rather than graded application datasets. Students record calculations and decisions, download data, export/import work and print a work record. Responses save in the current browser when storage is available. Nothing is submitted to Canvas automatically.

Instructor solutions and spoken talk tracks remain in instructor Notion pages. Do not put keys, instructor notes, graded item banks or instructor Notion links in this public repository or its history. An unlisted URL or noindex directive is not access control.

Formats vary by topic. A four-phase format is not required for every resource. New workspaces provide no keyed correctness feedback; the instructor leads the debrief.

## Maintenance

- `index.html`: week-ordered directory.
- `styles/shared.css`: existing course palette and styles.
- `styles/classroom.css`: classroom workspace styles.
- `js/classroom-cases.js`: student datasets and prompts only.
- `js/classroom.js`: saving, data/work export, import, printing and charts.
- `labs/`: resource entry points and existing lab logic.
- `docs/CANVAS-EMBEDDING.md`: complete URL list and embedding guidance.

The existing palette is navy `#0E2841` and orange `#E97132`. Preserve course identity, professional language, legible contrast and responsive layouts. These are course design conventions, not a claim of current official university brand-standard compliance.

## Validation and Deployment

Run `node --test labs/w8-supply-chain/tests/model.test.js tests/classroom.test.cjs tests/w10-explorer.test.cjs tests/w11-explorer.test.cjs tests/w12-session.test.cjs`. Browser QA covers desktop/mobile, charts, persistence, export/import, reset and dark mode. Preview through a local HTTP server, commit verified changes to main, and check deployed Pages URLs before embedding.

GitHub Pages serves public student files. Canvas module publication and assessment deployment require separate checks in Canvas.
