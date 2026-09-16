/**
 * MAN3504 Week 5: Forecasting Methods Lab
 * Qualitative Forecasting, Regression, and Method Selection
 */

// Analytics tracker
const analytics = new LabAnalytics('W5-Forecasting');

// ============================================
// Phase 1: Regression Calculator
// ============================================

function calculateRegression(months, trendStrength, baseDemand) {
  // Generate synthetic data matching Cowford Coffee cold brew scenario
  const data = [];
  for (let t = 1; t <= months; t++) {
    const noise = (Math.random() - 0.5) * 30; // ±15 unit variation
    const demand = baseDemand + trendStrength * t + noise;
    data.push({ t, demand: Math.round(demand) });
  }

  // Calculate regression statistics
  const n = data.length;
  const sumT = data.reduce((sum, d) => sum + d.t, 0);
  const sumD = data.reduce((sum, d) => sum + d.demand, 0);
  const sumTD = data.reduce((sum, d) => sum + d.t * d.demand, 0);
  const sumT2 = data.reduce((sum, d) => sum + d.t * d.t, 0);

  const tMean = sumT / n;
  const dMean = sumD / n;

  // Slope (b) and intercept (a)
  const b = (n * sumTD - sumT * sumD) / (n * sumT2 - sumT * sumT);
  const a = dMean - b * tMean;

  // R-squared
  const ssRes = data.reduce((sum, d) => {
    const predicted = a + b * d.t;
    return sum + Math.pow(d.demand - predicted, 2);
  }, 0);
  const ssTot = data.reduce((sum, d) => sum + Math.pow(d.demand - dMean, 2), 0);
  const rSquared = 1 - (ssRes / ssTot);

  // Forecast for next period
  const nextT = months + 1;
  const forecast = a + b * nextT;

  // Standard error
  const mse = ssRes / (n - 2);
  const stdError = Math.sqrt(mse);
  const ci95Upper = forecast + 1.96 * stdError;
  const ci95Lower = forecast - 1.96 * stdError;

  return {
    data,
    slope: MathUtils.round(b, 2),
    intercept: MathUtils.round(a, 2),
    rSquared: MathUtils.round(rSquared, 3),
    forecast: Math.round(forecast),
    ci95Upper: Math.round(ci95Upper),
    ci95Lower: Math.round(ci95Lower),
    stdError: MathUtils.round(stdError, 2),
    equation: `ŷ = ${MathUtils.round(a, 1)} + ${MathUtils.round(b, 2)}x`,
  };
}

function displayRegressionResults(result) {
  const container = DOMUtils.query('#regression-results');
  container.innerHTML = '';

  // Regression equation and fit
  const eqBox = DOMUtils.create('div', 'calculation-result');
  eqBox.innerHTML = `
    <strong>Regression Equation:</strong><br>
    ${result.equation}<br>
    <br>
    <strong>Regression Fit (R²):</strong> ${result.rSquared}<br>
    <strong>Interpretation:</strong> ${(result.rSquared * 100).toFixed(1)}% of the variation in cold brew demand is explained by the linear trend.
  `;
  container.appendChild(eqBox);

  // Forecast
  const forecastBox = DOMUtils.create('div', 'calculation-result');
  forecastBox.innerHTML = `
    <strong>Forecast for Month ${result.data.length + 1}:</strong> ${result.forecast} units<br>
    <strong>95% Confidence Interval:</strong> [${result.ci95Lower}, ${result.ci95Upper}] units<br>
    <br>
    <strong>Interpretation:</strong> Plan inventory for the range, not a single point. If actual demand falls outside this range, the underlying trend may have changed.
  `;
  container.appendChild(forecastBox);

  analytics.track('regression_calculated', {
    months: result.data.length,
    rSquared: result.rSquared,
    forecast: result.forecast,
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const calcBtn = DOMUtils.query('#calc-regression');
  if (calcBtn) {
    calcBtn.addEventListener('click', () => {
      const months = parseInt(DOMUtils.query('#months-input').value);
      const trend = parseInt(DOMUtils.query('#trend-strength').value);
      const base = parseInt(DOMUtils.query('#base-demand').value);
      const result = calculateRegression(months, trend, base);
      displayRegressionResults(result);
    });
  }
});

// ============================================
// Phase 1: Method Selection Scenarios
// ============================================

const scenarios = [
  {
    id: 'coffee-new-flavor',
    cowford: 'Coffee',
    question: 'Cowford Coffee is launching a new seasonal cold brew flavor with NO prior sales history. Which approach is most appropriate?',
    options: [
      'A. 3-month moving average of similar products',
      'B. Market survey of likely customers or sales force composite estimate',
      'C. Exponential smoothing of competitor data',
      'D. Trend projection from past 12 months',
    ],
    correct: 1,
    explanation:
      'With no sales history, quantitative time-series methods cannot work. Qualitative methods (market survey, sales force composite) are necessary to estimate initial demand from judgment and customer research.',
    concept: 'Qualitative vs. Quantitative',
  },
  {
    id: 'green-build-3year',
    cowford: 'Green Build',
    question:
      'Green Build needs a 3-year forecast for prefabricated modular housing demand—a long horizon with high technological and regulatory uncertainty. Only a small pool of in-house experts exists. Best method?',
    options: [
      'A. Delphi method with the small expert panel',
      'B. 12-month moving average of prototype sales',
      'C. Regression with regional construction growth',
      'D. Naive forecast (assume this year = next year)',
    ],
    correct: 0,
    explanation:
      'Delphi is ideal for long-horizon, highly uncertain forecasts using a small, geographically dispersed expert panel. It does not require in-person meetings and reduces groupthink through anonymity and iteration.',
    concept: 'Delphi Method',
  },
  {
    id: 'logistics-regression',
    cowford: 'Logistics',
    question:
      'Logistics runs a regression of monthly parcel volume against regional e-commerce growth rate and finds R² = 0.79. What does this mean?',
    options: [
      'A. The forecast is accurate 79% of the time',
      'B. About 79% of the variation in parcel volume is explained by e-commerce growth',
      'C. The regression proves that e-commerce growth CAUSES parcel volume increases',
      'D. The model will always outperform exponential smoothing',
    ],
    correct: 1,
    explanation:
      'R² = 0.79 means 79% of the observed variation in parcel volume is explained by the fitted model (e-commerce growth). It does NOT prove causation, and a high R² does not guarantee predictive accuracy in new contexts.',
    concept: 'Interpreting R²',
  },
  {
    id: 'medical-supply-contract',
    cowford: 'Medical Supply',
    question:
      'Medical Supply is forecasting demand for a contract renewal cycle—demand is largely set by contract terms, but account managers see real variation in how customers use products. Where should the forecasting focus?',
    options: [
      'A. Time-series moving average of historical invoices',
      'B. Sales force composite from account managers aware of customer usage patterns',
      'C. Naive method (last period = next period)',
      'D. Exponential smoothing of competitor pricing',
    ],
    correct: 1,
    explanation:
      'Sales force composite works best here. Account managers are closest to customers and see usage variation that contract terms alone do not capture. Their input captures the nuance quantitative methods miss.',
    concept: 'Sales Force Composite',
  },
  {
    id: 'bullwhip-effect',
    cowford: 'Brewery',
    question:
      'Brewery runs a weekend promotion offering deep discounts on craft beer. Suppliers see the spike and interpret it as permanent growth, doubling their orders. Which action would BEST limit the bullwhip effect?',
    options: [
      'A. Place even larger orders to protect inventory at every tier',
      'B. Share promotion plans and point-of-sale demand data across the supply chain',
      'C. Lengthen ordering cycles to reduce order frequency',
      'D. Hide true inventory levels from suppliers',
    ],
    correct: 1,
    explanation:
      'Transparency and data sharing are the antidote to the bullwhip effect. When suppliers see actual customer demand (not inflated order signals), they forecast accurately and avoid overproduction. This is the foundation of collaborative forecasting and VMI.',
    concept: 'Demand Management & Bullwhip Effect',
  },
];

function displayScenarios() {
  const container = DOMUtils.query('#scenario-container');
  if (!container) return;

  scenarios.forEach((s, idx) => {
    const card = DOMUtils.create('div', 'card');
    card.style.marginBottom = 'var(--spacing-lg)';

    const title = DOMUtils.create('h4', 'card-header mb-md');
    title.textContent = `Scenario ${idx + 1}: ${s.cowford}`;
    card.appendChild(title);

    const q = DOMUtils.create('p', 'mb-md');
    q.textContent = s.question;
    card.appendChild(q);

    const optList = DOMUtils.create('ul', 'answer-choice-list');
    s.options.forEach((opt) => {
      const item = DOMUtils.create('li', '');
      item.textContent = opt;
      optList.appendChild(item);
    });
    card.appendChild(optList);

    const answerBox = DOMUtils.create('div', 'calculation-result');
    answerBox.classList.add('reveal-panel');
    answerBox.setAttribute('id', `${s.id}-answer`);
    answerBox.innerHTML = `
      <strong>Best Answer:</strong> ${s.options[s.correct]}<br>
      <strong>Why:</strong> ${s.explanation}<br>
      <strong>Concept:</strong> ${s.concept}
    `;

    const revealBtn = DOMUtils.create('button', 'btn btn-secondary');
    revealBtn.setAttribute('type', 'button');
    revealBtn.setAttribute('aria-expanded', 'false');
    revealBtn.setAttribute('aria-controls', `${s.id}-answer`);
    revealBtn.textContent = 'Reveal Best Answer';
    revealBtn.addEventListener('click', () => {
      const isVisible = answerBox.classList.toggle('visible');
      revealBtn.setAttribute('aria-expanded', String(isVisible));
      revealBtn.textContent = isVisible ? 'Hide Best Answer' : 'Reveal Best Answer';
      analytics.track('scenario_answer_toggled', {
        scenario: s.id,
        visible: isVisible,
      });
    });

    card.appendChild(revealBtn);
    card.appendChild(answerBox);

    container.appendChild(card);
  });
}

// ============================================
// Phase 2: Quiz Questions (Exact from W5.C)
// ============================================

const quizzes = [
  {
    id: 'q1',
    question: 'Which method uses repeated anonymous questionnaires to move a panel of experts toward a forecast?',
    type: 'multiple-choice',
    options: ['Delphi method', 'Sales force composite', 'Market survey', 'Moving average'],
    correctAnswer: 0,
    explanation: 'Delphi is the structured, iterative expert method that uses anonymity to reduce groupthink.',
  },
  {
    id: 'q2',
    question: 'A sales force composite is built primarily from:',
    type: 'multiple-choice',
    options: ['External economists', 'Estimates from salespeople closest to customers', 'Anonymous consumer panels', 'Time-series smoothing'],
    correctAnswer: 1,
    explanation: 'Sales force composite leverages the frontline input of salespeople who know customers best.',
  },
  {
    id: 'q3',
    question: 'Which qualitative method directly asks potential customers about purchasing intentions?',
    type: 'multiple-choice',
    options: ['Jury of executive opinion', 'Delphi method', 'Market survey', 'Trend projection'],
    correctAnswer: 2,
    explanation: 'Market survey gathers direct customer input on purchase intent—ideal for new products.',
  },
  {
    id: 'q4',
    question: 'In the regression equation y = a + bx, the slope b represents:',
    type: 'multiple-choice',
    options: [
      'The forecast when x equals zero',
      'The expected change in y for a one-unit increase in x',
      'The unexplained proportion of variation',
      'The average forecast error',
    ],
    correctAnswer: 1,
    explanation: 'The slope b quantifies the rate of change—how much y changes per unit change in x.',
  },
  {
    id: 'q5',
    question: 'An R-squared value of 0.85 means:',
    type: 'multiple-choice',
    options: [
      'The forecast is accurate 85% of the time',
      '85% of the variation in the dependent variable is explained by the model',
      'The slope equals 0.85',
      'The model proves causation',
    ],
    correctAnswer: 1,
    explanation: 'R² measures the proportion of variance explained—not forecast accuracy or causation.',
  },
];

function initializeQuizzes() {
  const container = DOMUtils.query('#quiz-container');
  if (!container) return;

  let currentIndex = 0;

  const renderQuizCard = () => {
    const q = quizzes[currentIndex];
    container.innerHTML = '';

    const card = DOMUtils.create('div', 'quiz-flip-card');
    const inner = DOMUtils.create('div', 'quiz-flip-inner');

    const front = DOMUtils.create('div', 'quiz-card-face quiz-card-front');
    front.setAttribute('aria-hidden', 'false');
    front.hidden = false;
    const frontLabel = DOMUtils.create('div', 'quiz-card-label');
    frontLabel.textContent = `Question ${currentIndex + 1} of ${quizzes.length}`;

    const question = DOMUtils.create('h3', 'mb-lg');
    question.textContent = q.question;

    const choices = DOMUtils.create('ul', 'answer-choice-list');
    q.options.forEach((option) => {
      const item = DOMUtils.create('li', '');
      item.textContent = option;
      choices.appendChild(item);
    });

    const revealBtn = DOMUtils.create('button', 'btn btn-primary');
    revealBtn.setAttribute('type', 'button');
    revealBtn.textContent = 'Flip to Answer';
    revealBtn.addEventListener('click', () => {
      card.classList.add('is-flipped');
      front.setAttribute('aria-hidden', 'true');
      front.hidden = true;
      back.setAttribute('aria-hidden', 'false');
      back.hidden = false;
      analytics.track('quiz_answer_revealed', {
        question: q.id,
      });
    });

    front.appendChild(frontLabel);
    front.appendChild(question);
    front.appendChild(choices);
    front.appendChild(revealBtn);

    const back = DOMUtils.create('div', 'quiz-card-face quiz-card-back');
    back.setAttribute('aria-hidden', 'true');
    back.hidden = true;
    const backLabel = DOMUtils.create('div', 'quiz-card-label');
    backLabel.textContent = 'Correct Answer';

    const answer = DOMUtils.create('h3', 'mb-md');
    answer.textContent = q.options[q.correctAnswer];

    const explanation = DOMUtils.create('p', 'mb-lg');
    explanation.textContent = q.explanation;

    const reviewBtn = DOMUtils.create('button', 'btn btn-secondary');
    reviewBtn.setAttribute('type', 'button');
    reviewBtn.textContent = 'Review Question';
    reviewBtn.addEventListener('click', () => {
      card.classList.remove('is-flipped');
      front.setAttribute('aria-hidden', 'false');
      front.hidden = false;
      back.setAttribute('aria-hidden', 'true');
      back.hidden = true;
    });

    back.appendChild(backLabel);
    back.appendChild(answer);
    back.appendChild(explanation);
    back.appendChild(reviewBtn);

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    container.appendChild(card);

    const nav = DOMUtils.create('div', 'quiz-nav');
    const prevBtn = DOMUtils.create('button', 'btn btn-secondary');
    prevBtn.setAttribute('type', 'button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = currentIndex === 0;
    prevBtn.addEventListener('click', () => {
      currentIndex = Math.max(0, currentIndex - 1);
      renderQuizCard();
    });

    const progress = DOMUtils.create('div', 'quiz-progress');
    progress.textContent = `${currentIndex + 1} / ${quizzes.length}`;

    const nextBtn = DOMUtils.create('button', 'btn btn-secondary');
    nextBtn.setAttribute('type', 'button');
    nextBtn.textContent = currentIndex === quizzes.length - 1 ? 'Start Over' : 'Next';
    nextBtn.addEventListener('click', () => {
      currentIndex = currentIndex === quizzes.length - 1 ? 0 : currentIndex + 1;
      renderQuizCard();
    });

    nav.appendChild(prevBtn);
    nav.appendChild(progress);
    nav.appendChild(nextBtn);
    container.appendChild(nav);
  };

  renderQuizCard();
}

// ============================================
// Phase 3: Guided Diagnostic
// ============================================

const diagnosticSteps = [
  {
    step: 1,
    title: 'Assess the Forecast Context',
    description: 'Ask: Is this a new product, long horizon, or high uncertainty? Or is there good historical data?',
    example:
      'Cowford Coffee launching a new seasonal flavor = new product = no historical data = qualitative method required.',
  },
  {
    step: 2,
    title: 'Identify Available Data & Expertise',
    description: 'Do we have time-series history? Do we have subject-matter experts? Can we reach customers?',
    example:
      'Green Build (3-year strategic forecast): no long history, small expert panel available → Delphi is perfect.',
  },
  {
    step: 3,
    title: 'Check the Drivers of Demand',
    description: 'Is demand driven by an external variable (time, price, market size)? Can we measure it?',
    example:
      'Logistics (parcel volume vs. e-commerce growth): strong relationship + measurable driver → regression works well.',
  },
  {
    step: 4,
    title: 'Select the Method & Justify',
    description: 'Choose qualitative, time-series, or causal. Explain why it fits the context best.',
    example:
      'Medical Supply (contract renewal): account managers know customer usage patterns → sales force composite captures nuance moving averages would miss.',
  },
];

function initializeDiagnostic() {
  const container = DOMUtils.query('#diagnostic-container');
  if (!container) return;

  diagnosticSteps.forEach((s) => {
    const card = DOMUtils.create('div', 'card');
    card.style.marginBottom = 'var(--spacing-lg)';

    const header = DOMUtils.create('h4', 'card-header mb-md');
    header.innerHTML = `<span style="color: var(--unf-orange); font-weight: 600;">Step ${s.step}:</span> ${s.title}`;
    card.appendChild(header);

    const desc = DOMUtils.create('p', 'mb-md');
    desc.textContent = s.description;
    card.appendChild(desc);

    const exBox = DOMUtils.create('div', 'calculation-result');
    exBox.innerHTML = `<strong>Example:</strong> ${s.example}`;
    card.appendChild(exBox);

    container.appendChild(card);
  });
}

// ============================================
// Phase 4: Readiness Checklist
// ============================================

function initializeReadinessChecklist() {
  const checkboxes = Array.from(DOMUtils.queryAll('#readiness-checklist input[type="checkbox"]'));
  const resultDiv = DOMUtils.query('#readiness-result');

  const updateReadiness = () => {
    const checked = checkboxes.filter((c) => c.checked).length;
    const total = checkboxes.length;

    resultDiv.innerHTML = '';

    if (checked === total) {
      const alert = DOMUtils.create('div', 'alert alert-success');
      alert.innerHTML = `
        <strong>✓ Ready for W5.C & W5.D!</strong><br>
        You've mastered all readiness criteria. You are well-prepared for the concept check quiz and Cowford application assignment.
      `;
      resultDiv.appendChild(alert);
    } else if (checked >= 6) {
      const alert = DOMUtils.create('div', 'alert alert-warning');
      alert.innerHTML = `
        <strong>Almost there!</strong><br>
        You've checked ${checked}/${total} readiness items. Review the unchecked items before taking W5.C.
      `;
      resultDiv.appendChild(alert);
    } else if (checked >= 3) {
      const alert = DOMUtils.create('div', 'alert alert-info');
      alert.innerHTML = `
        <strong>Keep Going</strong><br>
        You've checked ${checked}/${total}. Revisit phases 1–3 to strengthen weaker areas, then check more boxes.
      `;
      resultDiv.appendChild(alert);
    }
  };

  checkboxes.forEach((c) => c.addEventListener('change', updateReadiness));
}

// ============================================
// Initialization on Page Load
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  displayScenarios();
  initializeQuizzes();
  initializeDiagnostic();
  initializeReadinessChecklist();

  // Auto-run first regression
  const months = parseInt(DOMUtils.query('#months-input').value);
  const trend = parseInt(DOMUtils.query('#trend-strength').value);
  const base = parseInt(DOMUtils.query('#base-demand').value);
  const result = calculateRegression(months, trend, base);
  displayRegressionResults(result);

  analytics.track('lab_loaded', { week: 5 });
});
