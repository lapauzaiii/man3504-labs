/**
 * Week 6: MRP & Aggregate Planning Lab
 * Interactive scenarios and calculations
 */

let analytics = new LabAnalytics('w6-mrp');

// ======================
// Aggregate Planning Data
// ======================

const aggregatePlanningData = {
  stable: {
    cowford: 'Medical Supply',
    color: CowfordSubsidiaries.medicalSupply.color,
    monthlyDemand: [500, 510, 495, 505, 515, 490, 500, 510, 495, 505, 515, 500],
    costPerUnit: 50,
    holdingCostPerUnit: 2,
    setupCostPerMonth: 3000,
  },
  seasonal: {
    cowford: 'Brewery',
    color: CowfordSubsidiaries.brewery.color,
    monthlyDemand: [300, 350, 400, 600, 700, 800, 900, 800, 600, 400, 350, 300],
    costPerUnit: 35,
    holdingCostPerUnit: 3,
    setupCostPerMonth: 5000,
  },
  volatile: {
    cowford: 'Green Build',
    color: CowfordSubsidiaries.greenBuild.color,
    monthlyDemand: [200, 150, 500, 300, 400, 200, 600, 100, 450, 350, 280, 320],
    costPerUnit: 60,
    holdingCostPerUnit: 4,
    setupCostPerMonth: 6000,
  },
};

// ======================
// Aggregate Planning Calculation
// ======================

function calculateAggregatePlan(demandPattern, strategy, horizonMonths) {
  const data = aggregatePlanningData[demandPattern];
  const demand = data.monthlyDemand.slice(0, horizonMonths);
  const avgDemand = demand.reduce((a, b) => a + b, 0) / demand.length;

  let production = [];
  let inventory = [0];
  let totalCost = 0;

  if (strategy === 'chase') {
    // Produce exactly what's needed (high setup costs)
    production = [...demand];
    demand.forEach((d) => {
      const producedAmount = d;
      const newInventory = Math.max(0, inventory[inventory.length - 1] + producedAmount - d);
      inventory.push(newInventory);
      totalCost += data.setupCostPerMonth + d * data.holdingCostPerUnit;
    });
  } else if (strategy === 'smooth') {
    // Level production (high holding costs)
    production = Array(horizonMonths).fill(Math.ceil(avgDemand));
    demand.forEach((d, i) => {
      const producedAmount = production[i];
      const newInventory = Math.max(0, inventory[inventory.length - 1] + producedAmount - d);
      inventory.push(newInventory);
      totalCost += data.setupCostPerMonth + newInventory * data.holdingCostPerUnit;
    });
  } else if (strategy === 'hybrid') {
    // Hybrid: level production with 25% flexibility
    const baseProduction = Math.ceil(avgDemand * 0.75);
    production = demand.map((d) => Math.ceil(d * 0.25) + baseProduction);
    demand.forEach((d, i) => {
      const producedAmount = production[i];
      const newInventory = Math.max(0, inventory[inventory.length - 1] + producedAmount - d);
      inventory.push(newInventory);
      totalCost += data.setupCostPerMonth + newInventory * data.holdingCostPerUnit;
    });
  }

  return {
    demand: demand,
    production: production,
    inventory: inventory.slice(1),
    totalCost: totalCost,
    avgCost: totalCost / horizonMonths,
    cowford: data.cowford,
    color: data.color,
  };
}

// ======================
// MRP Calculation
// ======================

const mrpBOM = {
  a: { name: 'Component A', qty: 2, leadTime: 2 },
  b: { name: 'Component B', qty: 1, leadTime: 3 },
  b1: { name: 'Raw Material B1', qty: 3, leadTime: 1, parent: 'b' },
  c: { name: 'Component C', qty: 1, leadTime: 2 },
};

function calculateMRP(masterSchedule, leadTimes, safetyStock) {
  const periods = 8; // 8-period planning horizon
  const schedule = { demand: masterSchedule, ...leadTimes };

  const levels = {
    finished: {
      name: 'Finished Product',
      leadTime: 0,
      grossReqs: Array(periods).fill(0),
      scheduledReceipts: Array(periods).fill(0),
      availableInventory: [0],
      netReqs: [],
      plannedOrders: [],
    },
    a: {
      name: 'Component A (qty 2)',
      leadTime: schedule.a || 2,
      grossReqs: Array(periods).fill(0),
      scheduledReceipts: Array(periods).fill(0),
      availableInventory: [0],
      netReqs: [],
      plannedOrders: [],
    },
    b: {
      name: 'Component B (qty 1)',
      leadTime: schedule.b || 3,
      grossReqs: Array(periods).fill(0),
      scheduledReceipts: Array(periods).fill(0),
      availableInventory: [0],
      netReqs: [],
      plannedOrders: [],
    },
    c: {
      name: 'Component C (qty 1)',
      leadTime: schedule.c || 2,
      grossReqs: Array(periods).fill(0),
      scheduledReceipts: Array(periods).fill(0),
      availableInventory: [0],
      netReqs: [],
      plannedOrders: [],
    },
  };

  // Master Schedule (finished product demand)
  levels.finished.grossReqs[0] = masterSchedule;

  // Explode finished product into component demands
  for (let i = 0; i < periods; i++) {
    if (levels.finished.plannedOrders[i]) {
      levels.a.grossReqs[i] += levels.finished.plannedOrders[i] * mrpBOM.a.qty;
      levels.b.grossReqs[i] += levels.finished.plannedOrders[i] * mrpBOM.b.qty;
      levels.c.grossReqs[i] += levels.finished.plannedOrders[i] * mrpBOM.c.qty;
    }
  }

  // Calculate net requirements and planned orders for each level
  const calculateLevel = (level, safetyStock) => {
    for (let i = 0; i < periods; i++) {
      const available = level.availableInventory[level.availableInventory.length - 1];
      const netReq = Math.max(0, level.grossReqs[i] + safetyStock - available);
      level.netReqs[i] = netReq;

      if (netReq > 0) {
        level.plannedOrders[i] = netReq;
        level.availableInventory.push(0);
      } else {
        level.plannedOrders[i] = 0;
        level.availableInventory.push(available - level.grossReqs[i]);
      }
    }
  };

  calculateLevel(levels.finished, safetyStock);
  calculateLevel(levels.a, safetyStock);
  calculateLevel(levels.b, safetyStock);
  calculateLevel(levels.c, safetyStock);

  return levels;
}

// ======================
// UI Rendering
// ======================

document.addEventListener('DOMContentLoaded', () => {
  // Aggregate Planning Button Click Handler
  document.getElementById('ap-buttons').innerHTML = `
    <button class="btn btn-primary" id="ap-btn">Calculate Aggregate Plan</button>
  `;

  document.getElementById('ap-btn').addEventListener('click', () => {
    const pattern = document.getElementById('ap-demand').value;
    const strategy = document.getElementById('ap-strategy').value;
    const months = parseInt(document.getElementById('ap-months').value);

    const result = calculateAggregatePlan(pattern, strategy, months);
    displayAggregatePlanResults(result);

    analytics.track('ap_calculated', {
      pattern: pattern,
      strategy: strategy,
      months: months,
      totalCost: result.totalCost,
    });
  });

  // MRP Calculate Button
  document.getElementById('mrp-calculate').addEventListener('click', () => {
    const demand = parseInt(document.getElementById('mrp-demand-week').value);
    const leadTimes = {
      a: parseInt(document.getElementById('mrp-lead-a').value),
      b: parseInt(document.getElementById('mrp-lead-b').value),
      c: 2, // Fixed
    };
    const ss = parseInt(document.getElementById('mrp-ss').value);

    const result = calculateMRP(demand, leadTimes, ss);
    displayMRPResults(result);

    analytics.track('mrp_calculated', {
      demand: demand,
      leadTimes: leadTimes,
      safetyStock: ss,
    });
  });

  // Initialize Quizzes
  initializeQuizzes();

  // Initialize Diagnostic Walkthrough
  initializeDiagnostic();

  // Readiness Checklist
  const checkboxes = document.querySelectorAll('#readiness-checklist input[type="checkbox"]');
  checkboxes.forEach((cb) => {
    cb.addEventListener('change', () => {
      const checked = Array.from(checkboxes).filter((c) => c.checked).length;
      const result = document.getElementById('readiness-result');

      if (checked === checkboxes.length) {
        result.innerHTML = `
          <div class="alert alert-success">
            ✓ You're ready! Proceed to W6.C (Concept Check) and W6.D (Application Quiz).
          </div>
        `;
      } else if (checked >= 6) {
        result.innerHTML = `
          <div class="alert alert-warning">
            You've completed ${checked}/${checkboxes.length} items. Review the unchecked items before proceeding.
          </div>
        `;
      }
    });
  });
});

// ======================
// Display Functions
// ======================

function displayAggregatePlanResults(result) {
  const container = document.getElementById('ap-results');
  let tableHTML = `
    <div class="alert alert-info">
      <strong>${result.cowford} — ${result.demand[0]} units avg demand</strong>
    </div>
    <table class="mrp-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Demand</th>
          <th>Production</th>
          <th>Inventory</th>
        </tr>
      </thead>
      <tbody>
  `;

  result.demand.forEach((d, i) => {
    tableHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${d}</td>
        <td>${result.production[i]}</td>
        <td>${result.inventory[i]}</td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
    <div class="calculation-box">
      Total Planning Cost: <strong>${MathUtils.formatCurrency(result.totalCost)}</strong><br>
      Average Monthly Cost: <strong>${MathUtils.formatCurrency(result.avgCost)}</strong>
    </div>
  `;

  container.innerHTML = tableHTML;
}

function displayMRPResults(levels) {
  const container = document.getElementById('mrp-results');
  let html = '<div class="alert alert-info">MRP Planned Order Schedule</div>';

  Object.entries(levels).forEach(([key, level]) => {
    html += `
      <div class="card" style="border-top-color: var(--unf-navy);">
        <h4 style="margin-top: 0;">${level.name}</h4>
        <table class="mrp-table" style="font-size: 12px;">
          <thead>
            <tr>
              <th>Period</th>
              <th>Gross Req.</th>
              <th>Avail. Inv.</th>
              <th>Net Req.</th>
              <th>Planned Order</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (let i = 0; i < 8; i++) {
      html += `
        <tr>
          <td>${i + 1}</td>
          <td>${level.grossReqs[i]}</td>
          <td>${level.availableInventory[i] || 0}</td>
          <td>${level.netReqs[i] || 0}</td>
          <td><strong>${level.plannedOrders[i] || 0}</strong></td>
        </tr>
      `;
    }

    html += '</tbody></table></div>';
  });

  container.innerHTML = html;
}

// ======================
// Quiz Initialization
// ======================

function initializeQuizzes() {
  const quizzes = [
    {
      id: 'q1',
      question: 'In a <strong>chase production strategy</strong>, what typically increases?',
      type: 'multiple-choice',
      options: [
        'Holding costs (inventory)',
        'Setup costs (production runs)',
        'Lead time',
        'Demand variability',
      ],
      correctAnswer: 1,
      explanation:
        'Chase strategy follows demand closely, requiring frequent production changeovers and increasing setup costs.',
    },
    {
      id: 'q2',
      question: 'A level production strategy works best when:',
      type: 'multiple-choice',
      options: [
        'Demand is stable and predictable',
        'Holding costs are very high',
        'Demand is highly seasonal',
        'Setup costs are zero',
      ],
      correctAnswer: 0,
      explanation:
        'Level production spreads output evenly; it works best with stable demand to avoid excessive inventory.',
    },
    {
      id: 'q3',
      question: 'The <strong>Bill of Materials (BOM)</strong> tells you:',
      type: 'multiple-choice',
      options: [
        'The cost of each component',
        'How many of each component are needed per finished product',
        'The lead time for delivery',
        'The supplier for each part',
      ],
      correctAnswer: 1,
      explanation:
        'A BOM is a structured list showing component quantities needed per unit of finished product. Costs, lead times, and suppliers are separate.',
    },
    {
      id: 'q4',
      question: 'If Component A has a 2-week lead time and we need it in Week 4, when should we place the order?',
      type: 'multiple-choice',
      options: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      correctAnswer: 1,
      explanation:
        'Lead time offsetting: If lead time = 2 weeks and need date = Week 4, order should be released in Week 4 − 2 = Week 2.',
    },
  ];

  const container = document.getElementById('quiz-container');

  quizzes.forEach((q) => {
    const quiz = new QuizQuestion({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      onAnswer: (data) => {
        analytics.track('quiz_answered', data);
      },
    });
    container.appendChild(quiz.getElement());
  });
}

// ======================
// Diagnostic Walkthrough
// ======================

function initializeDiagnostic() {
  const container = document.getElementById('diagnostic-container');

  const steps = [
    {
      title: 'Step 1: Assess Your Demand',
      content: `
        <p>Is your demand stable, seasonal, or volatile?</p>
        <ul>
          <li><strong>Stable:</strong> Use level production or simple forecasting</li>
          <li><strong>Seasonal:</strong> Consider hybrid strategy or safety stock</li>
          <li><strong>Volatile:</strong> May need higher safety stock or flexible capacity</li>
        </ul>
        <div class="calculation-box">
          Example: Brewery demand ranges from 300–900 units/month → Seasonal<br>
          Decision: Level production + safety stock buffers
        </div>
      `,
    },
    {
      title: 'Step 2: Determine Your Constraints',
      content: `
        <p>What are your resource and cost constraints?</p>
        <ul>
          <li>What is your production capacity per month?</li>
          <li>What is your holding cost per unit (storage, spoilage, obsolescence)?</li>
          <li>What is your setup cost per production run?</li>
          <li>What is your lead time from suppliers?</li>
        </ul>
        <div class="calculation-box">
          Example: Brewery setup cost = $5,000/month; holding cost = $3/unit<br>
          Implication: Balance frequent runs (high setup) vs. large runs (high holding)
        </div>
      `,
    },
    {
      title: 'Step 3: Choose Your Aggregate Planning Strategy',
      content: `
        <p>Based on demand pattern and constraints, select:</p>
        <table class="mrp-table">
          <tr>
            <th>Strategy</th>
            <th>Best For</th>
            <th>Cost Driver</th>
          </tr>
          <tr>
            <td>Chase (produce-to-demand)</td>
            <td>Volatile demand, low holding cost</td>
            <td>Setup costs ↑</td>
          </tr>
          <tr>
            <td>Level (smooth production)</td>
            <td>Stable/seasonal demand, high holding cost</td>
            <td>Holding costs ↑</td>
          </tr>
          <tr>
            <td>Hybrid</td>
            <td>Moderate seasonal demand</td>
            <td>Balanced</td>
          </tr>
        </table>
      `,
    },
    {
      title: 'Step 4: Build Your Master Schedule & Explode BOM',
      content: `
        <p>If using MRP:</p>
        <ol>
          <li>Start with the <strong>Master Production Schedule (MPS)</strong> — what finished products do we need?</li>
          <li>Fetch the <strong>Bill of Materials</strong> — how many components per product?</li>
          <li><strong>Explode</strong> gross requirements: MPS qty × BOM qty</li>
          <li>Account for <strong>lead time offsetting</strong>: order = need date − lead time</li>
          <li>Calculate <strong>planned order releases</strong> (gross req. − available inv. + safety stock)</li>
        </ol>
        <div class="calculation-box">
          Example: Need 100 finished products Week 4<br>
          Each product needs Component A (qty 2, lead time 2 weeks)<br>
          Gross req. for A = 100 × 2 = 200 units<br>
          → Order release for A: Week 4 − 2 = Week 2
        </div>
      `,
    },
    {
      title: 'Step 5: Document Your Assumptions & Decisions',
      content: `
        <p>For your W6.D response, clearly state:</p>
        <ul>
          <li>What demand pattern did you observe?</li>
          <li>Why did you select your strategy?</li>
          <li>What are the total costs (setup + holding)?</li>
          <li>What would happen if [lead time, demand, capacity] changed?</li>
          <li>How does this compare to alternative strategies?</li>
        </ul>
        <div class="alert alert-info">
          Template: "For [Cowford subsidiary], I chose [strategy] because [reason].
          This reduces costs from $X to $Y and improves [flexibility/stability/service level]."
        </div>
      `,
    },
  ];

  let stepsHTML = '<div class="accordion">';
  steps.forEach((step, i) => {
    stepsHTML += `
      <details style="margin-bottom: var(--spacing-lg);">
        <summary style="cursor: pointer; font-weight: 600; padding: var(--spacing-md); background-color: var(--bg-secondary); border-radius: var(--border-radius); user-select: none;">
          ${step.title}
        </summary>
        <div style="padding: var(--spacing-lg); border: 1px solid var(--border-color); border-top: none; background-color: var(--bg-primary);">
          ${step.content}
        </div>
      </details>
    `;
  });
  stepsHTML += '</div>';

  container.innerHTML = stepsHTML;
}
