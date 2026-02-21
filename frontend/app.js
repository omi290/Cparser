/**
 * C Parser Visualizer — Phase 2
 * Handles: sample buttons, analyze(), token table, AST tree,
 *          error line highlighting, parser trace, pipeline animation.
 */

"use strict";

/* ─── Config ─────────────────────────────────────────────────────── */
const API_BASE = 'http://localhost:5000';

/* ─── Sample code snippets ───────────────────────────────────────── */
const SAMPLES = {
  valid: `int a = 10;
int b = 20;
int sum = a + b;
int product = a * b;`,

  ifelse: `int x = 5;
int y = 0;
if (x > 3) {
    y = x + 1;
} else {
    y = x - 1;
}`,

  while: `int i = 0;
int total = 0;
while (i < 10) {
    total = total + i;
    i = i + 1;
}`,

  printf: `int n = 42;
int result = n * 2;
printf("%d", result);
scanf("%d", &n);`,

  error: `int a = 10;
int b = ;
int c = a + b;`,
};

/* ─── DOM refs ───────────────────────────────────────────────────── */
const codeInput = document.getElementById('code-input');
const analyzeBtn = document.getElementById('analyze-btn');
const clearBtn = document.getElementById('clear-btn');
const copyBtn = document.getElementById('copy-btn');
const errorBanner = document.getElementById('error-banner');
const errorMsg = document.getElementById('error-msg');
const successBanner = document.getElementById('success-banner');
const successMsg = document.getElementById('success-msg');
const charCount = document.getElementById('char-count');
const lineCount = document.getElementById('line-count');

// Lexical panel
const tableWrap = document.getElementById('table-wrap');
const tokenTbody = document.getElementById('token-tbody');
const statsRow = document.getElementById('stats-row');
const streamSection = document.getElementById('stream-section');
const streamBox = document.getElementById('stream-box');
const emptyState = document.getElementById('empty-state');

// Syntax panel
const astTree = document.getElementById('ast-tree');
const astContainer = document.getElementById('ast-container');
const astEmpty = document.getElementById('ast-empty');
const parseErrBox = document.getElementById('parse-error-box');
const traceContent = document.getElementById('trace-content');

// Error line indicator
const errLineIndicator = document.getElementById('error-line-indicator');
const errLineText = document.getElementById('err-line-text');

// Pipeline steps
const pipSource = document.getElementById('pip-source');
const pipLex = document.getElementById('pip-lex');
const pipParse = document.getElementById('pip-parse');
const pipAst = document.getElementById('pip-ast');

/* ─── State ──────────────────────────────────────────────────────── */
let currentTokens = [];

/* ─── AST CSS class registry (colors live in style.css) ─────────── */
const TYPED_NODES = new Set([
  'Program', 'VarDecl', 'Assign', 'PostfixStmt', 'PrefixStmt',
  'If', 'While', 'Printf', 'Scanf', 'Return',
  'BinaryOp', 'UnaryOp', 'Number', 'Identifier', 'String',
  'Condition', 'Then', 'Else', 'Body', 'Format', 'Ref',
  'SyntaxError',
]);

/* ─── Token colours (for stream) ─────────────────────────────────── */
const TOK_COLORS = {
  KEYWORD: 'var(--tok-keyword)',
  IDENTIFIER: 'var(--tok-identifier)',
  NUMBER: 'var(--tok-number)',
  OPERATOR: 'var(--tok-operator)',
  SEPARATOR: 'var(--tok-separator)',
  STRING: 'var(--tok-string)',
  COMMENT: 'var(--text-muted)',
  UNKNOWN: 'var(--tok-unknown)',
};

/* ─── Helpers ────────────────────────────────────────────────────── */
function setLoading(on) {
  analyzeBtn.disabled = on;
  analyzeBtn.classList.toggle('loading', on);
}

function hideBanners() {
  errorBanner.classList.remove('show');
  successBanner.classList.remove('show');
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function clearTokenResults() {
  tableWrap.style.display = 'none';
  streamSection.style.display = 'none';
  statsRow.style.display = 'none';
  emptyState.style.display = 'flex';
  tokenTbody.innerHTML = '';
  streamBox.innerHTML = '';
  statsRow.innerHTML = '';
}

function clearAstPanel() {
  astContainer.style.display = 'none';
  astEmpty.style.display = 'flex';
  astTree.innerHTML = '';
  parseErrBox.style.display = 'none';
  parseErrBox.innerHTML = '';
}

/* ─── Pipeline animation ─────────────────────────────────────────── */
function resetPipeline() {
  [pipSource, pipLex, pipParse, pipAst].forEach(el => {
    el.classList.remove('pip-active', 'pip-done', 'pip-error');
  });
}

function setPipelineStage(stage, status = 'active') {
  const map = { source: pipSource, lex: pipLex, parse: pipParse, ast: pipAst };
  const el = map[stage];
  if (!el) return;
  el.classList.remove('pip-active', 'pip-done', 'pip-error');
  el.classList.add(`pip-${status}`);
}

/* ─── Error line highlighting ────────────────────────────────────── */
function highlightErrorLine(lineNum) {
  if (!lineNum) {
    clearErrorHighlight();
    return;
  }
  codeInput.classList.add('has-error');

  // Scroll the textarea to that line
  const lines = codeInput.value.split('\n');
  const before = lines.slice(0, lineNum - 1).join('\n');
  const lineH = codeInput.scrollHeight / (lines.length || 1);
  codeInput.scrollTop = Math.max(0, (lineNum - 2) * lineH);

  // Show indicator pill
  errLineText.textContent = `Syntax error at line ${lineNum}`;
  errLineIndicator.style.display = 'flex';
}

function clearErrorHighlight() {
  codeInput.classList.remove('has-error');
  errLineIndicator.style.display = 'none';
}

/* ─── Token table ────────────────────────────────────────────────── */
function renderTable(tokens) {
  tokenTbody.innerHTML = tokens.map((tok, i) => `
    <tr>
      <td class="col-num">${i + 1}</td>
      <td><span class="tok-badge ${tok.type}">${tok.type}</span></td>
      <td class="tok-val ${tok.type}">${escapeHtml(tok.value)}</td>
      <td class="col-line">${tok.line}</td>
    </tr>`
  ).join('');
}

/* ─── Token stream ───────────────────────────────────────────────── */
function renderStream(tokens) {
  streamBox.innerHTML = tokens.map(tok => {
    const color = TOK_COLORS[tok.type] || 'var(--text-muted)';
    return `<span class="stream-token" style="color:${color}" title="${tok.type}: ${escapeHtml(tok.value)}">${escapeHtml(tok.value)}</span>`;
  }).join(' ');
}

/* ─── Stats chips ────────────────────────────────────────────────── */
function renderStats(tokens) {
  const counts = {};
  tokens.forEach(t => { counts[t.type] = (counts[t.type] || 0) + 1; });

  const chipStyle = {
    KEYWORD: { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.4)', color: 'var(--tok-keyword)' },
    IDENTIFIER: { bg: 'rgba(226,232,240,0.1)', border: 'rgba(226,232,240,0.25)', color: 'var(--tok-identifier)' },
    NUMBER: { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.4)', color: 'var(--tok-number)' },
    OPERATOR: { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.4)', color: 'var(--tok-operator)' },
    SEPARATOR: { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.4)', color: 'var(--tok-separator)' },
    STRING: { bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.4)', color: 'var(--tok-string)' },
    UNKNOWN: { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)', color: 'var(--tok-unknown)' },
  };

  statsRow.innerHTML = Object.entries(counts).map(([type, n]) => {
    const s = chipStyle[type] || { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', color: 'var(--accent)' };
    return `<div class="stat-chip" style="background:${s.bg};border-color:${s.border};color:${s.color};">
      <span class="dot" style="background:${s.color}"></span>
      ${type}&nbsp;<strong>${n}</strong>
    </div>`;
  }).join('');
}

/* ─── Parse error display ────────────────────────────────────────── */
function renderParseErrors(parseError) {
  if (!parseError) {
    parseErrBox.style.display = 'none';
    parseErrBox.innerHTML = '';
    return;
  }

  const line = parseError.line ? `<strong>Line ${parseError.line}</strong>` : '';
  const expected = parseError.expected ? `<br><span class="err-detail">Expected: <code>${escapeHtml(parseError.expected)}</code></span>` : '';
  const got = parseError.got ? `<span class="err-detail"> · Got: <code>${escapeHtml(parseError.got)}</code></span>` : '';

  parseErrBox.innerHTML = `
    <div class="err-header">
      <span class="parse-err-icon">❌</span>
      <strong>Syntax Error</strong>
      ${line ? '—' : ''} ${line}
    </div>
    <p class="err-message">${escapeHtml(parseError.message)}</p>
    <div class="err-details">${expected}${got}</div>`;

  parseErrBox.style.display = 'block';
}

/* ─── Parser trace ───────────────────────────────────────────────── */
function renderTrace(traceSteps) {
  if (!traceSteps || traceSteps.length === 0) {
    traceContent.textContent = 'No trace available.';
    return;
  }
  traceContent.textContent = traceSteps.join('\n');
}

/* ─── AST Tree renderer ──────────────────────────────────────────── */
function renderTree(node, container, depth = 0) {
  if (!node) return;

  const nodeEl = document.createElement('div');
  nodeEl.className = 'ast-node';

  const hasChildren = node.children && node.children.length > 0;

  const typeClass = node.isError
    ? 'ast-label-SyntaxError'
    : (TYPED_NODES.has(node.type) ? `ast-label-${node.type}` : 'ast-label-default');

  const labelEl = document.createElement('div');
  labelEl.className = `ast-node-label ${typeClass}`;

  const toggle = hasChildren ? `<span class="ast-toggle">▼</span>` : `<span class="ast-leaf-dot"></span>`;
  const lineTag = node.line ? `<span class="ast-line-tag">L${node.line}</span>` : '';

  labelEl.innerHTML = `
    ${toggle}
    <span class="ast-type-tag">${escapeHtml(node.type)}</span>
    <span class="ast-label-text">${escapeHtml(node.label || node.type)}</span>
    ${lineTag}`;

  if (hasChildren) {
    labelEl.classList.add('collapsible');
  }

  nodeEl.appendChild(labelEl);

  if (hasChildren) {
    const childrenEl = document.createElement('div');
    childrenEl.className = 'ast-node-children';
    node.children.forEach(child => renderTree(child, childrenEl, depth + 1));
    nodeEl.appendChild(childrenEl);

    labelEl.addEventListener('click', () => {
      const collapsed = nodeEl.classList.toggle('collapsed');
      labelEl.querySelector('.ast-toggle').textContent = collapsed ? '▶' : '▼';
    });
  }

  container.appendChild(nodeEl);
}

/* ─── Main analyze ───────────────────────────────────────────────── */
async function analyze() {
  const code = codeInput.value.trim();
  if (!code) { showError('Please enter some C code first.'); return; }

  setLoading(true);
  hideBanners();
  clearErrorHighlight();
  resetPipeline();
  setPipelineStage('source', 'done');

  try {
    setPipelineStage('lex', 'active');

    const res = await fetch(`${API_BASE}/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    const data = await res.json();
    const tokens = data.tokens || [];
    const ast = data.ast;
    const parseError = data.parseError || null;  // structured {message, line, expected, got}
    const trace = data.trace || [];

    currentTokens = tokens;

    // ── Pipeline progress ────────────────────────────────────────
    setPipelineStage('lex', tokens.length ? 'done' : 'error');
    setPipelineStage('parse', 'active');

    // ── Render token panel ────────────────────────────────────────
    if (tokens.length) {
      renderTable(tokens);
      renderStream(tokens);
      renderStats(tokens);
      tableWrap.style.display = 'block';
      streamSection.style.display = 'block';
      statsRow.style.display = 'flex';
      emptyState.style.display = 'none';
    } else {
      clearTokenResults();
    }

    // ── Render syntax panel ───────────────────────────────────────
    renderParseErrors(parseError);
    renderTrace(trace);
    astTree.innerHTML = '';

    if (ast) {
      renderTree(ast, astTree, 0);
      astContainer.style.display = 'block';
      astEmpty.style.display = 'none';
    } else {
      astContainer.style.display = 'none';
      astEmpty.style.display = 'flex';
    }

    // ── Pipeline finish ───────────────────────────────────────────
    if (parseError) {
      setPipelineStage('parse', 'error');
      setPipelineStage('ast', 'error');
      highlightErrorLine(parseError.line);
      showError(`Syntax Error${parseError.line ? ` at line ${parseError.line}` : ''}: ${parseError.message}`);
    } else {
      setPipelineStage('parse', 'done');
      setPipelineStage('ast', 'done');
      showSuccess(
        `✓ ${tokens.length} token${tokens.length !== 1 ? 's' : ''} · AST built — ${ast?.children?.length || 0} top-level statement(s)`
      );
    }

  } catch (err) {
    console.error(err);
    resetPipeline();
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      showError('Cannot reach backend. Make sure Flask is running on http://localhost:5000');
    } else {
      showError(err.message);
    }
    clearTokenResults();
    clearAstPanel();
  } finally {
    setLoading(false);
  }
}

/* ─── Sample code buttons ────────────────────────────────────────── */
document.querySelectorAll('.sample-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.sample;
    if (SAMPLES[key]) {
      codeInput.value = SAMPLES[key];
      codeInput.dispatchEvent(new Event('input'));
      clearErrorHighlight();
      hideBanners();
    }
  });
});

/* ─── Clear button ───────────────────────────────────────────────── */
clearBtn.addEventListener('click', () => {
  codeInput.value = '';
  codeInput.dispatchEvent(new Event('input'));
  clearTokenResults();
  clearAstPanel();
  hideBanners();
  clearErrorHighlight();
  resetPipeline();
  traceContent.textContent = 'Run an analysis to see parser steps…';
});

/* ─── Analyze button / keyboard shortcut ─────────────────────────── */
analyzeBtn.addEventListener('click', analyze);
codeInput.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); analyze(); }
});

/* ─── Editor char / line counter ─────────────────────────────────── */
codeInput.addEventListener('input', () => {
  const v = codeInput.value;
  charCount.textContent = `${v.length} chars`;
  lineCount.textContent = `${v.split('\n').length} lines`;
});

/* ─── Tab switching ──────────────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    const panel = document.getElementById(`panel-${btn.dataset.tab}`);
    if (panel) panel.classList.add('active');

    // Copy button only on tokens tab
    copyBtn.style.display = btn.dataset.tab === 'tokens' ? 'inline-flex' : 'none';
  });
});

/* ─── Copy button ────────────────────────────────────────────────── */
copyBtn.addEventListener('click', () => {
  if (!currentTokens.length) return;
  const text = currentTokens.map(t => `${t.type.padEnd(12)} ${t.value}`).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.classList.add('copied');
    copyBtn.querySelector('.copy-text').textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.querySelector('.copy-text').textContent = 'Copy';
    }, 2000);
  });
});

/* ─── Init ───────────────────────────────────────────────────────── */
// Update counters for initial empty state
codeInput.dispatchEvent(new Event('input'));
