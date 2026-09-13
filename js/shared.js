/**
 * MAN3504 Interactive Labs — Shared Utilities
 * Reusable functions for all labs
 */

// ======================
// Theme Management
// ======================

class ThemeManager {
  constructor() {
    this.prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.loadTheme();
  }

  loadTheme() {
    const stored = localStorage.getItem('man3504-theme');
    if (stored) {
      document.documentElement.setAttribute('data-theme', stored);
    } else if (this.prefersDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  toggle() {
    const current = document.documentElement.getAttribute('data-theme') ||
                    (this.prefersDark ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('man3504-theme', next);
  }

  getCurrent() {
    return document.documentElement.getAttribute('data-theme') ||
           (this.prefersDark ? 'dark' : 'light');
  }
}

// ======================
// Query Parameter Handling
// ======================

class QueryParams {
  static get(key, defaultValue = null) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key) || defaultValue;
  }

  static getAll() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (let [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  }

  static set(key, value) {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  }
}

// ======================
// Math & Calculation Utilities
// ======================

const MathUtils = {
  // Round to specified decimal places
  round: (value, decimals = 2) => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },

  // Format as currency
  formatCurrency: (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  },

  // Format as percentage
  formatPercent: (value, decimals = 2) => {
    return `${MathUtils.round(value * 100, decimals)}%`;
  },

  // Format with commas (e.g., 1,000)
  formatNumber: (value, decimals = 0) => {
    return MathUtils.round(value, decimals).toLocaleString('en-US');
  },

  // Linear regression
  linearRegression: (xValues, yValues) => {
    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  },

  // Standard deviation
  stdDev: (values) => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  },
};

// ======================
// DOM Utilities
// ======================

const DOMUtils = {
  // Create element with class and optional content
  create: (tag, className = '', content = '') => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content) el.innerHTML = content;
    return el;
  },

  // Set multiple attributes
  setAttrs: (el, attrs) => {
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });
    return el;
  },

  // Show/hide element
  show: (el) => { el.classList.remove('hidden'); },
  hide: (el) => { el.classList.add('hidden'); },
  toggle: (el) => { el.classList.toggle('hidden'); },

  // Add event listener with auto-removal
  on: (el, event, handler) => {
    el.addEventListener(event, handler);
    return () => el.removeEventListener(event, handler);
  },

  // Query helpers
  query: (selector) => document.querySelector(selector),
  queryAll: (selector) => Array.from(document.querySelectorAll(selector)),
};

// ======================
// Cowford Holdings Data
// ======================

const CowfordSubsidiaries = {
  medicalSupply: {
    name: 'Medical Supply',
    industry: 'Healthcare',
    color: '#4A90E2',
    description: 'Stable contracts, predictable demand, high quality requirements',
  },
  brewery: {
    name: 'Brewery',
    industry: 'Beverage Manufacturing',
    color: '#F5A623',
    description: 'Seasonal demand, production smoothing, ingredient sourcing',
  },
  greenBuild: {
    name: 'Green Build',
    industry: 'Sustainable Construction',
    color: '#7ED321',
    description: 'New market, 3-year ramp, capacity under uncertainty',
  },
  fitness: {
    name: 'Fitness',
    industry: 'Health & Wellness',
    color: '#BD10E0',
    description: 'Capacity distribution, demand shifting by season/program',
  },
  logistics: {
    name: 'Logistics',
    industry: 'Transportation',
    color: '#50E3C2',
    description: 'Scheduling, throughput constraints, on-time performance',
  },
};

// ======================
// Storage Utilities
// ======================

const StorageUtils = {
  set: (key, value) => {
    try {
      localStorage.setItem(`man3504-${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage unavailable:', e);
    }
  },

  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(`man3504-${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('localStorage read error:', e);
      return defaultValue;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(`man3504-${key}`);
    } catch (e) {
      console.warn('localStorage remove error:', e);
    }
  },

  clear: () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('man3504-'))
        .forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('localStorage clear error:', e);
    }
  },
};

// ======================
// Logging & Analytics (Optional)
// ======================

class LabAnalytics {
  constructor(labName) {
    this.labName = labName;
    this.events = [];
    this.startTime = Date.now();
  }

  track(eventName, data = {}) {
    const event = {
      name: eventName,
      timestamp: Date.now(),
      data: data,
      timeElapsed: Date.now() - this.startTime,
    };
    this.events.push(event);
    // Optionally send to server here
    // console.log('Event tracked:', event);
  }

  getSession() {
    return {
      lab: this.labName,
      studentId: QueryParams.get('studentId', 'anonymous'),
      duration: Date.now() - this.startTime,
      events: this.events,
    };
  }
}

// ======================
// Initialize on Page Load
// ======================

let themeManager;

document.addEventListener('DOMContentLoaded', () => {
  themeManager = new ThemeManager();

  // Add theme toggle button if it doesn't exist
  if (!document.querySelector('.theme-toggle')) {
    const toggle = DOMUtils.create('button', 'theme-toggle btn btn-secondary');
    toggle.innerHTML = '🌙';
    toggle.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      padding: 8px 12px;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    toggle.addEventListener('click', () => {
      themeManager.toggle();
      toggle.innerHTML = themeManager.getCurrent() === 'dark' ? '☀️' : '🌙';
    });
    document.body.appendChild(toggle);
  }
});

// Export for use in modules (if using ES6)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ThemeManager,
    QueryParams,
    MathUtils,
    DOMUtils,
    CowfordSubsidiaries,
    StorageUtils,
    LabAnalytics,
  };
}
