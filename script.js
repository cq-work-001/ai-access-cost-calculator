const TOOLS = [
  { id: 'chatgpt-plus',    name: 'ChatGPT Plus',          gbp: 20 },
  { id: 'claude-pro',      name: 'Claude Pro',             gbp: 20 },
  { id: 'github-copilot',  name: 'GitHub Copilot',         gbp: 10 },
  { id: 'gemini-advanced', name: 'Gemini Advanced',        gbp: 19 },
  { id: 'midjourney',      name: 'Midjourney',             gbp: 10 },
  { id: 'perplexity-pro',  name: 'Perplexity Pro',         gbp: 17 },
  { id: 'ms-copilot-pro',  name: 'Microsoft Copilot Pro',  gbp: 19 },
  { id: 'cursor-pro',      name: 'Cursor Pro',             gbp: 16 },
];

const RATES    = { GBP: 1,     USD: 1.27,  EUR: 1.17  };
const SYMBOLS  = { GBP: '\u00a3', USD: '$', EUR: '\u20ac' };
const MIN_WAGE = { GBP: 12.21, USD: 7.25,  EUR: 13.00 };

// ─── STATE ─────────────────────────────────────────────────────

let currency = 'GBP';

const state = TOOLS.map(tool => ({
  ...tool,
  checked: false,
  customPrice: null, // null = use default converted price
}));

// ─── LOCALE DETECTION ──────────────────────────────────────────

function detectCurrency() {
  const lang = (navigator.language || 'en-GB').toLowerCase();
  if (lang === 'en-gb' || lang.startsWith('en-gb-')) return 'GBP';
  if (lang === 'en-us' || lang.startsWith('en-us-')) return 'USD';
  const euPrefixes = [
    'de', 'fr', 'it', 'es', 'pt', 'nl', 'pl', 'sv', 'da', 'fi',
    'nb', 'nn', 'el', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl',
    'et', 'lv', 'lt', 'mt', 'ga', 'eu', 'ca', 'lb',
  ];
  const prefix = lang.split('-')[0];
  if (euPrefixes.includes(prefix)) return 'EUR';
  return 'GBP';
}

// ─── PRICE HELPERS ─────────────────────────────────────────────

function defaultPrice(tool) {
  return Math.round(tool.gbp * RATES[currency]);
}

function getPrice(tool) {
  return tool.customPrice !== null ? tool.customPrice : defaultPrice(tool);
}

function fmt(amount) {
  return `${SYMBOLS[currency]}${amount}`;
}

// ─── RENDER TOOL LIST ──────────────────────────────────────────

function renderTools() {
  const form = document.getElementById('tool-form');
  form.innerHTML = '';

  state.forEach((tool, index) => {
    const price = getPrice(tool);
    const div = document.createElement('div');
    div.className = 'tool-option' + (tool.checked ? ' tool-option--checked' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'tool-check';
    checkbox.id = `tool-${tool.id}`;
    checkbox.checked = tool.checked;
    checkbox.addEventListener('change', () => {
      state[index].checked = checkbox.checked;
      div.classList.toggle('tool-option--checked', checkbox.checked);
      updateResults();
    });

    const nameLabel = document.createElement('label');
    nameLabel.className = 'tool-name';
    nameLabel.setAttribute('for', `tool-${tool.id}`);
    nameLabel.textContent = tool.name;

    const priceSpan = document.createElement('span');
    priceSpan.className = 'tool-price';
    priceSpan.textContent = `${fmt(price)}/month`;
    priceSpan.setAttribute('title', 'Click to edit price');
    priceSpan.setAttribute('role', 'button');
    priceSpan.setAttribute('tabindex', '0');
    priceSpan.setAttribute('aria-label', `Edit price for ${tool.name}: ${fmt(price)} per month`);
    priceSpan.addEventListener('click', () => startEdit(index, priceSpan));
    priceSpan.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startEdit(index, priceSpan);
      }
    });

    div.appendChild(checkbox);
    div.appendChild(nameLabel);
    div.appendChild(priceSpan);
    form.appendChild(div);
  });
}

// ─── INLINE PRICE EDITING ──────────────────────────────────────

function startEdit(index, priceSpan) {
  const tool = state[index];
  const currentPrice = getPrice(tool);

  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'tool-price-input';
  input.value = currentPrice;
  input.min = '0';
  input.step = '1';
  input.setAttribute('aria-label', `Price for ${tool.name} per month`);

  let committed = false;

  function commit() {
    if (committed) return;
    committed = true;
    const raw = parseFloat(input.value);
    const val = (isNaN(raw) || raw < 0) ? currentPrice : Math.round(raw);
    state[index].customPrice = val;
    priceSpan.textContent = `${fmt(val)}/month`;
    priceSpan.setAttribute('aria-label', `Edit price for ${tool.name}: ${fmt(val)} per month`);
    input.replaceWith(priceSpan);
    updateResults();
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    }
    if (e.key === 'Escape') {
      committed = true;
      input.replaceWith(priceSpan);
    }
  });

  priceSpan.replaceWith(input);
  input.focus();
  input.select();
}

// ─── UPDATE RESULTS ────────────────────────────────────────────

function updateResults() {
  const monthlyTotal = state.reduce((sum, tool) => {
    return tool.checked ? sum + getPrice(tool) : sum;
  }, 0);
  const yearlyTotal = monthlyTotal * 12;

  document.getElementById('monthly-cost').textContent = fmt(monthlyTotal);
  document.getElementById('yearly-cost').textContent = fmt(yearlyTotal);

  const equivEl = document.getElementById('equivalence');
  if (yearlyTotal === 0) {
    equivEl.hidden = true;
  } else {
    const hours = Math.round(yearlyTotal / MIN_WAGE[currency]);
    equivEl.textContent = `That\u2019s approximately ${hours} hour${hours !== 1 ? 's' : ''} at minimum wage to stay in the room.`;
    equivEl.hidden = false;
  }
}

// ─── CURRENCY PILLS ────────────────────────────────────────────

function updatePills() {
  document.querySelectorAll('.pill').forEach(btn => {
    const active = btn.dataset.currency === currency;
    btn.classList.toggle('pill--active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}

document.querySelectorAll('.pill').forEach(btn => {
  btn.addEventListener('click', () => {
    currency = btn.dataset.currency;
    state.forEach(tool => { tool.customPrice = null; });
    updatePills();
    renderTools();
    updateResults();
  });
});

// ─── INIT ──────────────────────────────────────────────────────

document.getElementById('copyright-year').textContent = new Date().getFullYear();
updatePills();
renderTools();
updateResults();
