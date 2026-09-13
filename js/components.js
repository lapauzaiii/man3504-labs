/**
 * MAN3504 Interactive Labs — Reusable Component Library
 */

// ======================
// Parameter Slider Component
// ======================

class ParameterSlider {
  constructor(options = {}) {
    this.id = options.id || 'slider-' + Math.random().toString(36).substr(2, 9);
    this.label = options.label || 'Parameter';
    this.min = options.min || 0;
    this.max = options.max || 100;
    this.step = options.step || 1;
    this.value = options.value !== undefined ? options.value : this.min;
    this.unit = options.unit || '';
    this.onChange = options.onChange || (() => {});
    this.format = options.format || ((v) => v);

    this.render();
  }

  render() {
    this.container = DOMUtils.create('div', 'form-group');

    const label = DOMUtils.create('label', '');
    label.setAttribute('for', this.id);
    label.textContent = this.label;

    const controls = DOMUtils.create('div', 'd-flex flex-between mb-md');

    this.input = DOMUtils.create('input', '');
    this.input.setAttribute('type', 'range');
    this.input.setAttribute('id', this.id);
    this.input.setAttribute('min', this.min);
    this.input.setAttribute('max', this.max);
    this.input.setAttribute('step', this.step);
    this.input.value = this.value;
    this.input.style.cssText = 'flex: 1; margin-right: 12px;';

    this.display = DOMUtils.create('div', '');
    this.display.style.cssText = 'font-weight: 600; min-width: 80px; text-align: right;';
    this.updateDisplay();

    this.input.addEventListener('input', (e) => {
      this.value = parseFloat(e.target.value);
      this.updateDisplay();
      this.onChange(this.value);
    });

    controls.appendChild(this.input);
    controls.appendChild(this.display);

    this.container.appendChild(label);
    this.container.appendChild(controls);
  }

  updateDisplay() {
    const formatted = this.format(this.value);
    this.display.textContent = `${formatted}${this.unit ? ' ' + this.unit : ''}`;
  }

  getValue() {
    return this.value;
  }

  setValue(value) {
    this.value = value;
    this.input.value = value;
    this.updateDisplay();
  }

  getElement() {
    return this.container;
  }
}

// ======================
// Readout Panel Component
// ======================

class ReadoutPanel {
  constructor(options = {}) {
    this.title = options.title || 'Metrics';
    this.items = options.items || [];
    this.color = options.color || 'var(--unf-navy)';

    this.render();
  }

  render() {
    this.container = DOMUtils.create('div', 'card');
    this.container.style.borderTop = `4px solid ${this.color}`;

    const header = DOMUtils.create('h3', 'card-header mb-0');
    header.textContent = this.title;

    this.content = DOMUtils.create('div', '');

    this.container.appendChild(header);
    this.container.appendChild(this.content);

    this.updateItems();
  }

  updateItems() {
    this.content.innerHTML = '';
    this.items.forEach((item) => {
      const row = DOMUtils.create('div', 'd-flex flex-between mb-md');

      const label = DOMUtils.create('div', 'text-muted');
      label.textContent = item.label;

      const value = DOMUtils.create('div', '');
      value.style.cssText = 'font-weight: 600; font-size: 18px; color: ' + (item.color || 'var(--text-primary)');
      value.textContent = item.value;

      row.appendChild(label);
      row.appendChild(value);
      this.content.appendChild(row);
    });
  }

  setItems(items) {
    this.items = items;
    this.updateItems();
  }

  getElement() {
    return this.container;
  }
}

// ======================
// Scenario Card Component
// ======================

class ScenarioCard {
  constructor(options = {}) {
    this.title = options.title || 'Scenario';
    this.description = options.description || '';
    this.cowfordName = options.cowfordName || '';
    this.color = options.color || '#ccc';
    this.buttons = options.buttons || [];
    this.onSelect = options.onSelect || (() => {});

    this.render();
  }

  render() {
    this.container = DOMUtils.create('div', 'card');
    this.container.style.borderLeft = `4px solid ${this.color}`;
    this.container.style.cursor = 'pointer';

    const titleEl = DOMUtils.create('h3', 'card-header mb-md');
    titleEl.textContent = this.title;
    if (this.cowfordName) {
      const badge = DOMUtils.create('span', '');
      badge.style.cssText = `
        display: inline-block;
        background-color: ${this.color};
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        margin-left: 8px;
        font-weight: 400;
      `;
      badge.textContent = this.cowfordName;
      titleEl.appendChild(badge);
    }

    if (this.description) {
      const desc = DOMUtils.create('p', 'text-muted mb-md');
      desc.textContent = this.description;
      this.container.appendChild(titleEl);
      this.container.appendChild(desc);
    } else {
      this.container.appendChild(titleEl);
    }

    if (this.buttons && this.buttons.length > 0) {
      const buttonGroup = DOMUtils.create('div', 'd-flex');
      buttonGroup.style.gap = 'var(--spacing-sm)';
      buttonGroup.style.marginTop = 'var(--spacing-md)';

      this.buttons.forEach((btn) => {
        const button = DOMUtils.create('button', `btn btn-${btn.variant || 'primary'}`);
        button.textContent = btn.label;
        button.style.flex = '1';
        button.addEventListener('click', () => {
          this.onSelect(btn.value);
          if (btn.onClick) btn.onClick();
        });
        buttonGroup.appendChild(button);
      });

      this.container.appendChild(buttonGroup);
    }
  }

  getElement() {
    return this.container;
  }
}

// ======================
// Quiz Question Component
// ======================

class QuizQuestion {
  constructor(options = {}) {
    this.id = options.id || 'q-' + Math.random().toString(36).substr(2, 9);
    this.question = options.question || '';
    this.type = options.type || 'multiple-choice'; // 'multiple-choice' or 'true-false'
    this.options = options.options || [];
    this.correctAnswer = options.correctAnswer;
    this.explanation = options.explanation || '';
    this.onAnswer = options.onAnswer || (() => {});

    this.answered = false;
    this.selectedAnswer = null;

    this.render();
  }

  render() {
    this.container = DOMUtils.create('div', 'card');

    const questionEl = DOMUtils.create('h4', 'card-header mb-lg');
    questionEl.innerHTML = `Q: ${this.question}`;

    this.container.appendChild(questionEl);

    this.optionsContainer = DOMUtils.create('div', '');

    this.options.forEach((option, index) => {
      const wrapper = DOMUtils.create('div', 'mb-md');

      const radio = DOMUtils.create('input', '');
      radio.setAttribute('type', 'radio');
      radio.setAttribute('id', `${this.id}-${index}`);
      radio.setAttribute('name', this.id);
      radio.setAttribute('value', index);
      radio.style.marginRight = '8px';

      const label = DOMUtils.create('label', '');
      label.setAttribute('for', `${this.id}-${index}`);
      label.style.cssText = 'display: inline; font-weight: 400; margin: 0;';
      label.textContent = option;

      radio.addEventListener('change', () => {
        this.selectedAnswer = index;
      });

      wrapper.appendChild(radio);
      wrapper.appendChild(label);
      this.optionsContainer.appendChild(wrapper);
    });

    this.container.appendChild(this.optionsContainer);

    const buttonRow = DOMUtils.create('div', 'd-flex mt-lg');
    buttonRow.style.gap = 'var(--spacing-md)';

    this.submitBtn = DOMUtils.create('button', 'btn btn-primary');
    this.submitBtn.textContent = 'Submit Answer';
    this.submitBtn.addEventListener('click', () => this.check());

    buttonRow.appendChild(this.submitBtn);
    this.container.appendChild(buttonRow);

    this.feedbackContainer = DOMUtils.create('div', 'mt-lg');
    this.container.appendChild(this.feedbackContainer);
  }

  check() {
    if (this.selectedAnswer === null) {
      this.showFeedback('Please select an answer.', 'warning');
      return;
    }

    this.answered = true;
    const isCorrect = this.selectedAnswer === this.correctAnswer;

    if (isCorrect) {
      this.showFeedback('✓ Correct!', 'success');
      this.submitBtn.disabled = true;
    } else {
      this.showFeedback(
        `✗ Incorrect. The correct answer is: ${this.options[this.correctAnswer]}.${this.explanation ? ' ' + this.explanation : ''}`,
        'danger'
      );
    }

    this.onAnswer({
      question: this.question,
      selected: this.options[this.selectedAnswer],
      correct: isCorrect,
    });
  }

  showFeedback(message, type) {
    this.feedbackContainer.innerHTML = '';
    const alert = DOMUtils.create('div', `alert alert-${type}`);
    alert.textContent = message;
    this.feedbackContainer.appendChild(alert);
  }

  getElement() {
    return this.container;
  }

  isCorrect() {
    return this.answered && this.selectedAnswer === this.correctAnswer;
  }
}

// ======================
// Chart Frame Component (Placeholder for SVG/Canvas)
// ======================

class ChartFrame {
  constructor(options = {}) {
    this.title = options.title || 'Chart';
    this.width = options.width || 600;
    this.height = options.height || 400;
    this.data = options.data || [];

    this.render();
  }

  render() {
    this.container = DOMUtils.create('div', 'card');

    const header = DOMUtils.create('h3', 'card-header');
    header.textContent = this.title;

    this.chartArea = DOMUtils.create('div', '');
    this.chartArea.style.cssText = `
      width: 100%;
      height: ${this.height}px;
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
    `;
    this.chartArea.textContent = 'Chart will render here';

    this.container.appendChild(header);
    this.container.appendChild(this.chartArea);
  }

  setChartHTML(html) {
    this.chartArea.innerHTML = html;
  }

  setSVG(svgElement) {
    this.chartArea.innerHTML = '';
    this.chartArea.appendChild(svgElement);
  }

  getElement() {
    return this.container;
  }
}

// ======================
// Tab Panel Component
// ======================

class TabPanel {
  constructor(options = {}) {
    this.tabs = options.tabs || []; // [{ label, content }]

    this.render();
  }

  render() {
    this.container = DOMUtils.create('div', '');

    const tabButtons = DOMUtils.create('div', 'tabs');
    this.tabContents = DOMUtils.create('div', '');

    this.tabs.forEach((tab, index) => {
      const btn = DOMUtils.create('button', `tab-btn ${index === 0 ? 'active' : ''}`);
      btn.textContent = tab.label;
      btn.addEventListener('click', () => this.setActive(index));

      const content = DOMUtils.create('div', `tab-content ${index === 0 ? 'active' : ''}`);
      content.innerHTML = tab.content;

      tabButtons.appendChild(btn);
      this.tabContents.appendChild(content);
    });

    this.container.appendChild(tabButtons);
    this.container.appendChild(this.tabContents);

    this.tabButtons = Array.from(this.tabButtons.querySelectorAll('.tab-btn'));
    this.tabContents = Array.from(this.tabContents.querySelectorAll('.tab-content'));
  }

  setActive(index) {
    this.tabs.forEach((_, i) => {
      const btn = this.container.querySelectorAll('.tab-btn')[i];
      const content = this.container.querySelectorAll('.tab-content')[i];
      if (i === index) {
        btn.classList.add('active');
        content.classList.add('active');
      } else {
        btn.classList.remove('active');
        content.classList.remove('active');
      }
    });
  }

  getElement() {
    return this.container;
  }
}

// ======================
// Preset Bar Component (Quick Scenario Buttons)
// ======================

class PresetBar {
  constructor(options = {}) {
    this.label = options.label || 'Quick Scenarios:';
    this.presets = options.presets || []; // [{ label, value }]
    this.onSelect = options.onSelect || (() => {});

    this.render();
  }

  render() {
    this.container = DOMUtils.create('div', 'mb-lg');

    const label = DOMUtils.create('span', 'text-muted');
    label.textContent = this.label;
    label.style.marginRight = '12px';

    const buttonGroup = DOMUtils.create('div', 'd-flex');
    buttonGroup.style.gap = 'var(--spacing-sm)';
    buttonGroup.style.flexWrap = 'wrap';

    this.presets.forEach((preset) => {
      const btn = DOMUtils.create('button', 'btn btn-secondary btn-sm');
      btn.textContent = preset.label;
      btn.style.fontSize = '12px';
      btn.addEventListener('click', () => {
        this.onSelect(preset.value);
      });
      buttonGroup.appendChild(btn);
    });

    this.container.appendChild(label);
    this.container.appendChild(buttonGroup);
  }

  getElement() {
    return this.container;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ParameterSlider,
    ReadoutPanel,
    ScenarioCard,
    QuizQuestion,
    ChartFrame,
    TabPanel,
    PresetBar,
  };
}
