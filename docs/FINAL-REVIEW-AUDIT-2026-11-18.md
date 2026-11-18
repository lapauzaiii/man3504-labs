# November 18 final review and sitewide audit

## Verified changes
### labs/w16-session/index.html
- Retitled page, metadata, header and opening slide for the November 18 final in-person class while retaining the URL.
- Added a second slide with the November 20 opening, November 29 assignment deadline, November 30 to December 4 review week, suggested December 7 target and December 11 closing.
- Included a missed-class recap with the timeline.
- Updated the exam-window instructions to defer unconfirmed time limit, attempts and allowed materials to Canvas.
- Updated the exit ticket to request the planned final date, first topic to review and a question to email.
- Removed unsupported exact per-week question allocations, retaining the confirmed approximate 20%/80% coverage.
### index.html
- Retitled the final review session card to November 18 and clarified that it is the last in-person class.

## Audit findings requiring follow-up
- **Source visibility:** The November 18 deck has hidden answer elements in its HTML. They are concealed in the rendered page until Reveal is pressed, but static HTML answers remain inspectable through View Source. Fully preventing source inspection is incompatible with a static client-only answer checker. Do not describe the answers as secret.
- **Final Review Explorer:** Its JavaScript uses `p.answer` to check entered values. Checked practice problems necessarily expose expected values to anyone inspecting client code. This is acceptable only for ungraded practice, not secure assessments.
- **Quiz identifiers:** `labs/w14-explorer/index.html` contains the student-facing labels W14.C and W14.D as assignment references. These are assignment names, not verified item IDs. Decide whether those references should be suppressed.
- **Existing tests:** `tests/final-review.test.cjs` expects exactly 11 slides. The newly added timeline produces 12 slides, so that test requires updating before CI can pass.
- **Deming funnel:** The Week 14 explorer presents Rule 2. Rules 3 and 4 have not been fully cross-checked across every teaching page. No teaching content was rewritten.
- **Repository-wide verification incomplete:** GitHub code searches were run for dates, exam window, calculator, attempts, funnel, quiz labels and answer keys. Search excerpts do not establish exhaustive coverage. Every internal link, external redirect, image path, mobile viewport, WCAG contrast ratio, browser console and weekly checked-math tolerance still require a complete file crawl and runtime test.
- **Testing:** The present/read mode and keyboard/reveal handlers were inspected in `labs/w16-session/session.js`; interactive browser testing has not been performed. The reveal buttons are native buttons and have click handlers. The new slide uses the existing slide markup and navigation system.

## Confirmed course facts
Last in-person class November 18; final opens November 20 and closes December 11; W14.C and W14.D due November 29 at 11:59 PM; Thanksgiving week has no class; November 30 to December 4 is review only with no meetings; 60 questions, 150 points, approximately 20% Weeks 1 to 6 and 80% Weeks 8 to 14; Honorlock in Canvas. Exam time limit, attempts and calculator policy are unconfirmed.
