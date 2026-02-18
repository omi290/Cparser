/* ═══════════════════════════════════════════════════════════════════
   C Parser Visualizer — app.js
   Vanilla JS frontend for the Flask /tokenize API
   ═══════════════════════════════════════════════════════════════════ */

const API_BASE = 'http://localhost:5000';

/* ─── DOM refs ──────────────────────────────────────────────────── */
const codeInput      = document.getElementById('code-input');
const visualizeBtn   = document.getElementById('visualize-btn');
const clearBtn       = document.getElementById('clear-btn');
const sampleBtn      = document.getElementById('sample-btn');
const errorBanner    = document.getElementById('error-banner');
const errorMsg       = document.getElementById('error-msg');
const successBanner  = document.getElementById('success-banner');
const successMsg     = document.getElementById('success-msg');
const statsRow       = document.getElementById('stats-row');
const tableWrap      = document.getElementById('table-wrap');
const tokenTbody     = document.getElementById('token-tbody');
const streamBox      = document.getElementById('stream-box');
const streamSection  = document.getElementById('stream-section');
const copyBtn        = document.getElementById('copy-btn');
const charCount      = document.getElementById('char-count');
const lineCount      = document.getElementById('line-count');

/* ─── State ─────────────────────────────────────────────────────── */
let currentTokens = [];

/* ─── Sample C code ─────────────────────────────────────────────── */
const SAMPLE_CODE = `#include <stdio.h>

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    int num = 6;
    float pi = 3.14159;
    int result = factorial(num);
    printf("Factorial of %d = %d\\n", num, result);
    return 0;
}`;

/* ─── Token colour map ──────────────────────────────────────────── */
const TOKEN_COLORS = {
  KEYWORD:    '#60a5fa',
  IDENTIFIER: '#e2e8f0',
  NUMBER:     '#34d399',
  OPERATOR:   '#f87171',
  SEPARATOR:  '#a78bfa',
  STRING:     '#fb923c',
  COMMENT:    '#94a3b8',
  UNKNOWN:    '#fbbf24',
};

/* ─── Helpers ───────────────────────────────────────────────────── */
function setLoading(on) {
  visualizeBtn.disabled = on;
  visualizeBtn.classList.toggle('loading', on);
  visualizeBtn.querySelector('.btn-text').textContent = on ? 'Analyzing…' : 'Visualize Tokens';
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorBanner.classList.add('show');
  successBanner.classList.remove('show');
}

function showSuccess(msg) {
  successMsg.textContent = msg;
  successBanner.classList.add('show');
  errorBanner.classList.remove('show');
}

function hideBanners() {
  errorBanner.classList.remove('show');
  successBanner.classList.remove('show');
}

function updateEditorMeta() {
  const text  = codeInput.value;
  const chars = text.length;
  const lines = text ? text.split('\n').length : 0;
  charCount.textContent = `${chars} char${chars !== 1 ? 's' : ''}`;
  lineCount.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
}

/* ─── Render helpers ────────────────────────────────────────────── */
function buildBadge(type) {
  const span = document.createElement('span');
  span.className = `tok-badge ${type}`;
  span.textContent = type;
  return span;
}

function buildValCell(type, value) {
  const td = document.createElement('td');
  td.className = `tok-val ${type}`;
  td.style.fontFamily = "'JetBrains Mono', monospace";
  td.textContent = value;
  return td;
}

function renderTable(tokens) {
  tokenTbody.innerHTML = '';
  tokens.forEach((tok, i) => {
    const tr = document.createElement('tr');

    const tdNum = document.createElement('td');
    tdNum.className = 'col-num';
    tdNum.textContent = i + 1;

    const tdType = document.createElement('td');
    tdType.appendChild(buildBadge(tok.type));

    const tdVal = buildValCell(tok.type, tok.value);

    const tdLine = document.createElement('td');
    tdLine.className = 'col-line';
    tdLine.textContent = tok.line;

    tr.append(tdNum, tdType, tdVal, tdLine);
    tokenTbody.appendChild(tr);
  });
}

function renderStream(tokens) {
  streamBox.innerHTML = '';
  tokens.forEach(tok => {
    const span = document.createElement('span');
    span.className = `stream-token tok-val ${tok.type}`;
    span.textContent = tok.value;
    span.title = `${tok.type} — Line ${tok.line}`;
    streamBox.appendChild(span);
  });
}

function renderStats(tokens) {
  const counts = {};
  tokens.forEach(t => { counts[t.type] = (counts[t.type] || 0) + 1; });

  const colorMap = {
    KEYWORD:    { dot: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)',  text: '#93c5fd' },
    IDENTIFIER: { dot: '#e2e8f0', bg: 'rgba(226,232,240,0.08)', border: 'rgba(226,232,240,0.2)', text: '#cbd5e1' },
    NUMBER:     { dot: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  text: '#6ee7b7' },
    OPERATOR:   { dot: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', text: '#fca5a5' },
    SEPARATOR:  { dot: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', text: '#c4b5fd' },
    STRING:     { dot: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)',  text: '#fdba74' },
    COMMENT:    { dot: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.25)', text: '#94a3b8' },
    UNKNOWN:    { dot: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  text: '#fde68a' },
  };

  statsRow.innerHTML = '';
  Object.entries(counts).forEach(([type, count]) => {
    const c = colorMap[type] || colorMap.UNKNOWN;
    const chip = document.createElement('div');
    chip.className = 'stat-chip';
    chip.style.cssText = `background:${c.bg};border-color:${c.border};color:${c.text}`;
    chip.innerHTML = `<span class="dot" style="background:${c.dot}"></span>${type}: ${count}`;
    statsRow.appendChild(chip);
  });
}

/* ─── Main tokenize action ──────────────────────────────────────── */
async function visualize() {
  const code = codeInput.value.trim();
  if (!code) {
    showError('Please enter some C code first.');
    return;
  }

  setLoading(true);
  hideBanners();

  try {
    const res = await fetch(`${API_BASE}/tokenize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    const tokens = await res.json();
    currentTokens = tokens;

    if (!tokens.length) {
      showError('No tokens found. Make sure your C code is valid.');
      clearResults();
      return;
    }

    renderTable(tokens);
    renderStream(tokens);
    renderStats(tokens);

    tableWrap.style.display    = 'block';
    streamSection.style.display = 'block';
    statsRow.style.display     = 'flex';

    showSuccess(`✓ Tokenized ${tokens.length} token${tokens.length !== 1 ? 's' : ''} successfully`);

  } catch (err) {
    console.error(err);
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      showError('Cannot reach the backend. Make sure Flask is running on http://localhost:5000');
    } else {
      showError(err.message);
    }
    clearResults();
  } finally {
    setLoading(false);
  }
}

function clearResults() {
  tokenTbody.innerHTML = '';
  streamBox.innerHTML  = '';
  statsRow.innerHTML   = '';
  tableWrap.style.display     = 'none';
  streamSection.style.display = 'none';
  statsRow.style.display      = 'none';
}

/* ─── Tab switching ─────────────────────────────────────────────── */
function initTabs() {
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const target = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`panel-${target}`).classList.add('active');
    });
  });
}

/* ─── Copy to clipboard ─────────────────────────────────────────── */
function copyTokens() {
  if (!currentTokens.length) return;
  const text = currentTokens
    .map(t => `${String(t.type).padEnd(12)} | ${String(t.value).padEnd(20)} | Line ${t.line}`)
    .join('\n');

  navigator.clipboard.writeText(text).then(() => {
    copyBtn.classList.add('copied');
    copyBtn.querySelector('.copy-text').textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.querySelector('.copy-text').textContent = 'Copy';
    }, 2000);
  }).catch(() => {
    /* fallback for non-https */
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copyBtn.querySelector('.copy-text').textContent = 'Copied!';
    setTimeout(() => { copyBtn.querySelector('.copy-text').textContent = 'Copy'; }, 2000);
  });
}

/* ─── Init ──────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  clearResults();

  /* editor meta */
  codeInput.addEventListener('input', updateEditorMeta);
  updateEditorMeta();

  /* buttons */
  visualizeBtn.addEventListener('click', visualize);

  clearBtn.addEventListener('click', () => {
    codeInput.value = '';
    updateEditorMeta();
    hideBanners();
    clearResults();
    currentTokens = [];
  });

  sampleBtn.addEventListener('click', () => {
    codeInput.value = SAMPLE_CODE;
    updateEditorMeta();
    hideBanners();
  });

  copyBtn.addEventListener('click', copyTokens);

  /* Ctrl+Enter shortcut */
  codeInput.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      visualize();
    }
  });
});
