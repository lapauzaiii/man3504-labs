# MAN3504 Interactive Labs

Interactive learning labs for UNF's **Operations Management (MAN3504)** course, built around the **Cowford Holdings** case universe. All labs are self-contained, hosted on GitHub Pages, and embeddable in Canvas.

**Live URL:** https://lapauzaiii.github.io/man3504-labs/

## Course Overview

MAN3504 is a 14-week operations management course structured around five fictional subsidiaries of Cowford Holdings:
- **Medical Supply** (stable, high-quality contracts)
- **Brewery** (seasonal demand, production smoothing)
- **Green Build** (new market, capacity ramp)
- **Fitness** (membership/capacity distribution)
- **Logistics** (throughput, on-time performance)

## Lab Structure

Each lab follows a **four-phase learning arc**:

1. **Phase 1: Live Session** (30–40 min) — Interactive discovery through manipulation of real scenarios. Students adjust parameters (demand, production strategy, lead times) and see ripple effects through the supply chain.

2. **Phase 2: Reinforcement Lab** (15–20 min) — Embedded quizzes with immediate feedback. Concept-check questions reinforce key ideas from Phase 1.

3. **Phase 3: Guided Diagnostic** (10–15 min) — Step-by-step walkthrough. A structured framework guides students through solving a problem identical in structure to W#.D assignment.

4. **Phase 4: Assignment Readiness** (5–10 min) — Self-check before formal assessments. Checklist confirms students have mastered readiness criteria.

## Current Labs

### Week 6: MRP & Aggregate Planning
**URL:** `https://lapauzaiii.github.io/man3504-labs/labs/w6-mrp/`

- **Phase 1:** Aggregate planning calculator (chase/smooth/hybrid strategies for Brewery, Medical Supply, Green Build) + MRP calculator with BOM explosion
- **Phase 2:** 4 concept-check quizzes (chase costs, level production, BOM definition, lead time offsetting)
- **Phase 3:** 5-step diagnostic (Assess Demand → Determine Constraints → Choose Strategy → Build Schedule/Explode BOM → Document Assumptions)
- **Phase 4:** 8-item readiness checklist

**Cowford Anchor:** Brewery (seasonal), Medical Supply (stable), Green Build (volatile)

---

## Canvas Embedding

Embed any lab in a Canvas page using an `<iframe>`:

```html
<iframe 
  src="https://lapauzaiii.github.io/man3504-labs/labs/w6-mrp/?studentId=STUDENT_ID&courseId=3504" 
  style="width: 100%; height: 1200px; border: none;"
  title="Week 6: MRP & Aggregate Planning Lab"
></iframe>
```

**URL Parameters:**
- `?studentId=USER_ID` — Student identifier for analytics (no grading)
- `?courseId=3504` — Course context
- `?mode=practice` — (Reserved for future interaction modes)

Labs do **not** submit grades to Canvas. They are practice tools only, used to prepare for formal Canvas assessments (W#.C Concept Check, W#.D Application Quiz).

---

## Technology Stack

- **Vanilla JavaScript** (no frameworks or external libraries)
- **HTML5 / CSS3** (responsive, light/dark theme)
- **SVG** (charts and diagrams)
- **GitHub Pages** (static hosting)
- **localStorage** (theme persistence, event tracking)

All labs are self-contained; no backend or API required.

---

## Directory Structure

```
man3504-labs/
├── README.md                          # This file
├── index.html                         # Landing page (coming soon)
├── styles/
│   └── shared.css                     # UNF-branded responsive CSS
├── js/
│   ├── shared.js                      # Utilities, theme, analytics
│   └── components.js                  # Reusable component library
├── labs/
│   ├── w6-mrp/
│   │   ├── index.html                 # W6 lab interface
│   │   └── js/
│   │       └── app.js                 # W6 calculations & quizzes
│   ├── w8-supply-chain/               # (In development)
│   ├── w9-inventory/                  # (In development)
│   └── w12-spc/                       # (In development)
└── docs/
    ├── ARCHITECTURE.md                # Component library patterns
    ├── CANVAS-EMBEDDING.md            # Embedding guide
    └── LAB-TEMPLATE.md                # Template for new labs
```

---

## Building a New Lab

See `docs/LAB-TEMPLATE.md` for step-by-step instructions on creating a new four-phase lab using the reusable component library.

**Key components:**
- `ParameterSlider` — Range input with live display
- `ReadoutPanel` — KPI card display
- `ScenarioCard` — Scenario selector with buttons
- `QuizQuestion` — Multiple-choice with immediate feedback
- `ChartFrame` — Chart container (SVG ready)
- `TabPanel` — Tabbed interface
- `PresetBar` — Quick-scenario button bar

---

## Development Workflow

1. **Local testing:** Open `labs/w6-mrp/index.html` in a browser (all files load relatively)
2. **Push to GitHub:** Commit to `main` branch
3. **GitHub Pages:** Automatically deployed to `https://lapauzaiii.github.io/man3504-labs/`
4. **Test live URL** before embedding in Canvas

---

## Theme & Branding

All labs use **UNF brand colors** and a responsive design system:

- **Navy:** `#0E2841`
- **Orange:** `#E97132`
- **Light theme:** Off-white backgrounds, dark text
- **Dark theme:** Dark backgrounds, light text (auto-detected or user-toggle)

Theme preference persists in localStorage.

---

## Support & Feedback

For questions or issues, contact the course instructor or submit feedback via Canvas.

---

*MAN3504 Interactive Labs — Built for UNF Operations Management Course, Spring 2026*
