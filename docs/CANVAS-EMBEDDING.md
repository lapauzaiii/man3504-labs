# Canvas Embedding Guide

This guide explains how to embed MAN3504 labs in Canvas pages.

## Quick Start

Copy this iframe code into a Canvas page's HTML editor:

```html
<iframe 
  src="https://lapauzaiii.github.io/man3504-labs/labs/w6-mrp/?studentId=STUDENT_ID&courseId=3504" 
  style="width: 100%; height: 1200px; border: none;"
  title="Week 6: MRP & Aggregate Planning Lab"
></iframe>
```

Then replace `STUDENT_ID` with a Canvas variable or student ID.

---

## Lab URLs

### Week 6: MRP & Aggregate Planning
```
https://lapauzaiii.github.io/man3504-labs/labs/w6-mrp/
```

### Week 8: Supply Chain (Coming Soon)
```
https://lapauzaiii.github.io/man3504-labs/labs/w8-supply-chain/
```

### Week 9: Inventory (Coming Soon)
```
https://lapauzaiii.github.io/man3504-labs/labs/w9-inventory/
```

### Week 12: SPC (Coming Soon)
```
https://lapauzaiii.github.io/man3504-labs/labs/w12-spc/
```

---

## URL Parameters

All labs support the following query parameters:

| Parameter | Value | Example | Purpose |
|-----------|-------|---------|---------|
| `studentId` | String (any) | `?studentId=12345` | Identifies student for analytics (no grading) |
| `courseId` | String (any) | `?courseId=3504` | Identifies course context |
| `mode` | `practice` (reserved) | `?mode=practice` | Reserved for future interaction modes |

**Examples:**

```
# Basic embed
https://lapauzaiii.github.io/man3504-labs/labs/w6-mrp/

# With student ID (recommended for tracking)
https://lapauzaiii.github.io/man3504-labs/labs/w6-mrp/?studentId=user_123&courseId=3504

# Canvas LTI variable (replace with actual Canvas variable)
https://lapauzaiii.github.io/man3504-labs/labs/w6-mrp/?studentId=$User.id&courseId=$Course.id
```

---

## Embedding in Canvas

### Method 1: iframe in Rich Content Editor (Recommended)

1. In Canvas, open the page where you want to embed the lab
2. Click **Edit**
3. Position your cursor in the content area
4. Click **HTML Editor** (or `<>` icon)
5. Paste the iframe code above
6. Set the height based on the lab (typically 1200–1400px)
7. Save

**Example HTML:**

```html
<p>Complete this interactive lab to prepare for this week's concept check:</p>

<iframe 
  src="https://lapauzaiii.github.io/man3504-labs/labs/w6-mrp/?studentId=$User.id" 
  style="width: 100%; height: 1200px; border: none; margin-top: 20px;"
  title="Week 6: MRP & Aggregate Planning Lab"
></iframe>

<p style="margin-top: 20px;"><strong>Note:</strong> This lab is a practice tool and is not graded. Use it to prepare for W6.C and W6.D assessments.</p>
```

### Method 2: External URL / Link to Lab

If you prefer students to access the lab in a new tab:

1. Add a link in your Canvas page:
   ```
   Visit the Week 6 Lab: https://lapauzaiii.github.io/man3504-labs/labs/w6-mrp/
   ```

2. Students click the link and use the lab in a new browser tab

---

## Height Recommendations

Each lab's height varies based on content:

- **Week 6 (MRP):** 1200–1400px
- **Week 8 (Supply Chain):** 1400–1600px (estimate)
- **Week 9 (Inventory):** 1200–1400px (estimate)
- **Week 12 (SPC):** 1400–1600px (estimate)

If students report being unable to see bottom content, increase the height.

---

## Responsive Design

All labs are fully responsive. They work on:
- **Desktop** (full iframe width)
- **Tablet** (scales down gracefully)
- **Mobile** (single-column layout, full viewport width)

No additional responsive handling is needed in the iframe code.

---

## Student Experience

When a student opens an embedded lab:

1. **Phase 1: Live Session** — They manipulate sliders, dropdowns, and inputs to see real-time calculations
2. **Phase 2: Reinforcement Lab** — They answer embedded quizzes with immediate feedback
3. **Phase 3: Guided Diagnostic** — They work through a step-by-step problem-solving framework
4. **Phase 4: Assignment Readiness** — They complete a checklist to self-assess readiness

**Important:** Labs do NOT submit grades to Canvas. They are practice tools only. Official grades come from Canvas New Quizzes (W#.C and W#.D).

---

## Analytics & Tracking

Labs track student interactions client-side using localStorage:
- Event names (e.g., `ap_calculated`, `mrp_calculated`, `quiz_answered`)
- Timestamps
- Session duration

This data is stored locally on the student's device and is **not** sent to any server or Canvas gradebook.

---

## Troubleshooting

### "Lab doesn't load" or "Blank iframe"
- Check that your Canvas page is published
- Verify the URL is correct (copy from repo's README.md)
- Confirm GitHub Pages is enabled on the man3504-labs repo

### "Content is cut off at the bottom"
- Increase the iframe height (e.g., 1400px → 1600px)

### "Students can't see their changes"
- Confirm JavaScript is enabled in their browser
- Check for browser security warnings (usually not an issue with GitHub Pages)

### "I want to track student usage"
- Labs currently do not report to Canvas. All interactions are client-side only.
- For future server-side tracking, contact the course developer.

---

## Customization

To customize lab appearance or behavior:

1. Clone the `man3504-labs` repository
2. Edit the lab's HTML or JavaScript files
3. Deploy to your own GitHub Pages fork
4. Update the iframe URL to point to your fork

See `LAB-TEMPLATE.md` for technical details.

---

## Questions?

Contact the course instructor via Canvas.
