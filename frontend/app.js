// C Parser Visualizer — Phase 4: sample buttons, analyze(), token table, AST tree, semantic analysis, symbol table, ICG (TAC + Quadruples), error highlighting, parser trace, pipeline animation

"use strict";

// Config
const API_BASE = 'http://localhost:5000';

// Sample code snippets
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

  semantic: `int a = 10;
int a = 20;
b = 5;
int x = 3.14;
{
    int y = 1;
}
y = 2;`,
};

// DOM refs
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

// Semantic panel
const symtableWrap = document.getElementById('symtable-wrap');
const symtableTbody = document.getElementById('symtable-tbody');
const semanticErrorBox = document.getElementById('semantic-error-box');
const semanticSuccess = document.getElementById('semantic-success');
const semanticSuccessMsg = document.getElementById('semantic-success-msg');
const semanticEmpty = document.getElementById('semantic-empty');

// Error line indicator
const errLineIndicator = document.getElementById('error-line-indicator');
const errLineText = document.getElementById('err-line-text');

// ICG panel
const tacSection = document.getElementById('tac-section');
const tacCode = document.getElementById('tac-code');
const quadSection = document.getElementById('quad-section');
const quadTbody = document.getElementById('quad-tbody');
const icgStats = document.getElementById('icg-stats');
const icgEmpty = document.getElementById('icg-empty');
const copyTacBtn = document.getElementById('copy-tac-btn');

// Pipeline steps
const pipSource = document.getElementById('pip-source');
const pipLex = document.getElementById('pip-lex');
const pipParse = document.getElementById('pip-parse');
const pipAst = document.getElementById('pip-ast');
const pipSemantic = document.getElementById('pip-semantic');
const pipIcg = document.getElementById('pip-icg');

// State
let currentTokens = [];

// AST CSS class registry
const TYPED_NODES = new Set([
  'Program', 'VarDecl', 'Assign', 'PostfixStmt', 'PrefixStmt',
  'If', 'While', 'Printf', 'Scanf', 'Return',
  'BinaryOp', 'UnaryOp', 'Number', 'Identifier', 'String',
  'Condition', 'Then', 'Else', 'Body', 'Format', 'Ref',
  'SyntaxError',
]);

// Token colours for stream
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

// Scope badge colors
const SCOPE_COLORS = {
  global: { bg: 'rgba(99,102,241,0.18)', color: '#a5b4fc', border: 'rgba(99,102,241,0.4)' },
  block:  { bg: 'rgba(20,184,166,0.18)', color: '#5eead4', border: 'rgba(20,184,166,0.4)' },
  if:     { bg: 'rgba(139,92,246,0.18)',  color: '#c4b5fd', border: 'rgba(139,92,246,0.4)' },
  else:   { bg: 'rgba(249,115,22,0.18)',  color: '#fdba74', border: 'rgba(249,115,22,0.4)' },
  while:  { bg: 'rgba(16,185,129,0.18)',  color: '#6ee7b7', border: 'rgba(16,185,129,0.4)' },
};

// Type badge colors
const TYPE_COLORS = {
  int:    { bg: 'rgba(96,165,250,0.18)',  color: '#93c5fd', border: 'rgba(96,165,250,0.4)' },
  float:  { bg: 'rgba(52,211,153,0.18)',  color: '#6ee7b7', border: 'rgba(52,211,153,0.4)' },
  char:   { bg: 'rgba(251,146,60,0.18)',  color: '#fdba74', border: 'rgba(251,146,60,0.4)' },
  double: { bg: 'rgba(236,72,153,0.18)',  color: '#f9a8d4', border: 'rgba(236,72,153,0.4)' },
  long:   { bg: 'rgba(167,139,250,0.18)', color: '#c4b5fd', border: 'rgba(167,139,250,0.4)' },
};

// Helpers
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

function clearSemanticPanel() {
  symtableWrap.style.display = 'none';
  symtableTbody.innerHTML = '';
  semanticErrorBox.style.display = 'none';
  semanticErrorBox.innerHTML = '';
  semanticSuccess.style.display = 'none';
  semanticEmpty.style.display = 'flex';
}

// Pipeline animation
function resetPipeline() {
  [pipSource, pipLex, pipParse, pipAst, pipSemantic, pipIcg].forEach(el => {
    if (el) el.classList.remove('pip-active', 'pip-done', 'pip-error');
  });
}

function setPipelineStage(stage, status = 'active') {
  const map = { source: pipSource, lex: pipLex, parse: pipParse, ast: pipAst, semantic: pipSemantic, icg: pipIcg };
  const el = map[stage];
  if (!el) return;
  el.classList.remove('pip-active', 'pip-done', 'pip-error');
  el.classList.add(`pip-${status}`);
}

// Error line highlighting
function highlightErrorLine(lineNum) {
  if (!lineNum) {
    clearErrorHighlight();
    return;
  }
  codeInput.classList.add('has-error');

  const lines = codeInput.value.split('\n');
  const before = lines.slice(0, lineNum - 1).join('\n');
  const lineH = codeInput.scrollHeight / (lines.length || 1);
  codeInput.scrollTop = Math.max(0, (lineNum - 2) * lineH);

  errLineText.textContent = `Syntax error at line ${lineNum}`;
  errLineIndicator.style.display = 'flex';
}

function clearErrorHighlight() {
  codeInput.classList.remove('has-error');
  errLineIndicator.style.display = 'none';
}

// Token table
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

// Token stream
function renderStream(tokens) {
  streamBox.innerHTML = tokens.map(tok => {
    const color = TOK_COLORS[tok.type] || 'var(--text-muted)';
    return `<span class="stream-token" style="color:${color}" title="${tok.type}: ${escapeHtml(tok.value)}">${escapeHtml(tok.value)}</span>`;
  }).join(' ');
}

// Stats chips
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

// Parse error display
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

// Parser trace
function renderTrace(traceSteps) {
  if (!traceSteps || traceSteps.length === 0) {
    traceContent.textContent = 'No trace available.';
    return;
  }
  traceContent.textContent = traceSteps.join('\n');
}

// Symbol Table renderer
function renderSymbolTable(symbols) {
  if (!symbols || symbols.length === 0) {
    symtableWrap.style.display = 'none';
    return;
  }

  symtableTbody.innerHTML = symbols.map((sym, i) => {
    const sc = SCOPE_COLORS[sym.scope] || SCOPE_COLORS.block;
    const tc = TYPE_COLORS[sym.type] || TYPE_COLORS.int;
    return `
    <tr>
      <td class="col-num">${i + 1}</td>
      <td class="sym-name">${escapeHtml(sym.name)}</td>
      <td><span class="scope-badge" style="background:${tc.bg};color:${tc.color};border-color:${tc.border}">${escapeHtml(sym.type)}</span></td>
      <td><span class="scope-badge" style="background:${sc.bg};color:${sc.color};border-color:${sc.border}">${escapeHtml(sym.scope)}</span></td>
      <td class="col-line">${sym.line}</td>
    </tr>`;
  }).join('');

  symtableWrap.style.display = 'block';
}

// Semantic Errors renderer
function renderSemanticErrors(errors) {
  if (!errors || errors.length === 0) {
    semanticErrorBox.style.display = 'none';
    semanticErrorBox.innerHTML = '';
    return;
  }

  semanticErrorBox.innerHTML = `
    <div class="sem-err-header">
      <span class="sem-err-icon">🧠</span>
      <strong>${errors.length} Semantic Error${errors.length !== 1 ? 's' : ''} Found</strong>
    </div>
    <div class="sem-err-list">
      ${errors.map((err, i) => `
        <div class="sem-err-item">
          <span class="sem-err-num">${i + 1}</span>
          <div class="sem-err-body">
            <span class="sem-err-msg">${escapeHtml(err.message)}</span>
            ${err.line ? `<span class="sem-err-line">Line ${err.line}</span>` : ''}
          </div>
        </div>
      `).join('')}
    </div>`;

  semanticErrorBox.style.display = 'block';
}

// --- ICG Renderers ---

function clearIcgPanel() {
  tacSection.style.display = 'none';
  tacCode.textContent = '';
  quadSection.style.display = 'none';
  quadTbody.innerHTML = '';
  icgStats.style.display = 'none';
  icgStats.innerHTML = '';
  icgEmpty.style.display = 'flex';
}

// TAC op type classification for syntax highlighting
const TAC_OP_CLASSES = {
  label:    'tac-label',
  goto:     'tac-jump',
  ifFalse:  'tac-jump',
  call:     'tac-call',
  return:   'tac-return',
  '=':      'tac-assign',
};

function renderTacCode(tacLines) {
  if (!tacLines || !tacLines.length) {
    tacSection.style.display = 'none';
    return;
  }

  // Build syntax-highlighted TAC
  const html = tacLines.map((line, i) => {
    const num = `<span class="tac-line-num">${String(i + 1).padStart(3)}</span>`;
    const highlighted = highlightTacLine(line);
    return `${num}  ${highlighted}`;
  }).join('\n');

  tacCode.innerHTML = html;
  tacSection.style.display = 'block';
}

function highlightTacLine(line) {
  // Label lines
  if (line.match(/^L\d+:$/)) {
    return `<span class="tac-label">${escapeHtml(line)}</span>`;
  }
  // Jump instructions
  if (line.startsWith('ifFalse')) {
    const parts = line.match(/^(ifFalse)\s+(\S+)\s+(goto)\s+(\S+)$/);
    if (parts) {
      return `<span class="tac-jump">${parts[1]}</span> <span class="tac-var">${escapeHtml(parts[2])}</span> <span class="tac-jump">${parts[3]}</span> <span class="tac-label">${parts[4]}</span>`;
    }
  }
  if (line.startsWith('goto ')) {
    const parts = line.match(/^(goto)\s+(\S+)$/);
    if (parts) {
      return `<span class="tac-jump">${parts[1]}</span> <span class="tac-label">${parts[2]}</span>`;
    }
  }
  // Return
  if (line.startsWith('return')) {
    return `<span class="tac-return">${escapeHtml(line)}</span>`;
  }
  // Function calls
  if (line.startsWith('call ')) {
    return `<span class="tac-call">${escapeHtml(line)}</span>`;
  }
  // Assignments: result = arg1 op arg2  or  result = arg1
  const assignMatch = line.match(/^(\S+)\s*=\s*(.+)$/);
  if (assignMatch) {
    const lhs = assignMatch[1];
    const rhs = assignMatch[2];
    // Check if RHS is a binary operation
    const binMatch = rhs.match(/^(\S+)\s+([+\-*/==!=<><=>=]+)\s+(\S+)$/);
    if (binMatch) {
      return `<span class="tac-var">${escapeHtml(lhs)}</span> <span class="tac-op">=</span> <span class="tac-var">${escapeHtml(binMatch[1])}</span> <span class="tac-op">${escapeHtml(binMatch[2])}</span> <span class="tac-var">${escapeHtml(binMatch[3])}</span>`;
    }
    // Unary minus
    if (rhs.startsWith('uminus ')) {
      const operand = rhs.replace('uminus ', '');
      return `<span class="tac-var">${escapeHtml(lhs)}</span> <span class="tac-op">=</span> <span class="tac-op">uminus</span> <span class="tac-var">${escapeHtml(operand)}</span>`;
    }
    // Simple assignment
    return `<span class="tac-var">${escapeHtml(lhs)}</span> <span class="tac-op">=</span> <span class="tac-var">${escapeHtml(rhs)}</span>`;
  }

  return escapeHtml(line);
}

// Quadruples op badge colors
const QUAD_OP_COLORS = {
  '+':       { bg: 'rgba(52,211,153,0.18)',  color: '#6ee7b7', border: 'rgba(52,211,153,0.4)' },
  '-':       { bg: 'rgba(248,113,113,0.18)', color: '#fca5a5', border: 'rgba(248,113,113,0.4)' },
  '*':       { bg: 'rgba(167,139,250,0.18)', color: '#c4b5fd', border: 'rgba(167,139,250,0.4)' },
  '/':       { bg: 'rgba(251,146,60,0.18)',  color: '#fdba74', border: 'rgba(251,146,60,0.4)' },
  '=':       { bg: 'rgba(96,165,250,0.18)',  color: '#93c5fd', border: 'rgba(96,165,250,0.4)' },
  '==':      { bg: 'rgba(14,165,233,0.18)',  color: '#7dd3fc', border: 'rgba(14,165,233,0.4)' },
  '!=':      { bg: 'rgba(244,63,94,0.18)',   color: '#fda4af', border: 'rgba(244,63,94,0.4)' },
  '<':       { bg: 'rgba(6,182,212,0.18)',   color: '#67e8f9', border: 'rgba(6,182,212,0.4)' },
  '>':       { bg: 'rgba(6,182,212,0.18)',   color: '#67e8f9', border: 'rgba(6,182,212,0.4)' },
  '<=':      { bg: 'rgba(6,182,212,0.18)',   color: '#67e8f9', border: 'rgba(6,182,212,0.4)' },
  '>=':      { bg: 'rgba(6,182,212,0.18)',   color: '#67e8f9', border: 'rgba(6,182,212,0.4)' },
  'ifFalse': { bg: 'rgba(245,158,11,0.18)',  color: '#fcd34d', border: 'rgba(245,158,11,0.4)' },
  'goto':    { bg: 'rgba(245,158,11,0.18)',  color: '#fcd34d', border: 'rgba(245,158,11,0.4)' },
  'label':   { bg: 'rgba(139,92,246,0.18)',  color: '#c4b5fd', border: 'rgba(139,92,246,0.4)' },
  'call':    { bg: 'rgba(236,72,153,0.18)',  color: '#f9a8d4', border: 'rgba(236,72,153,0.4)' },
  'return':  { bg: 'rgba(132,204,22,0.18)',  color: '#bef264', border: 'rgba(132,204,22,0.4)' },
  'uminus':  { bg: 'rgba(248,113,113,0.18)', color: '#fca5a5', border: 'rgba(248,113,113,0.4)' },
};
const QUAD_OP_DEFAULT = { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: 'rgba(99,102,241,0.3)' };

function renderQuadruples(quads) {
  if (!quads || !quads.length) {
    quadSection.style.display = 'none';
    return;
  }

  quadTbody.innerHTML = quads.map((q, i) => {
    const oc = QUAD_OP_COLORS[q.op] || QUAD_OP_DEFAULT;
    return `
    <tr>
      <td class="col-num">${i + 1}</td>
      <td><span class="scope-badge" style="background:${oc.bg};color:${oc.color};border-color:${oc.border}">${escapeHtml(q.op || '—')}</span></td>
      <td class="quad-cell">${escapeHtml(q.arg1 || '—')}</td>
      <td class="quad-cell">${escapeHtml(q.arg2 || '—')}</td>
      <td class="quad-cell quad-result">${escapeHtml(q.result || '—')}</td>
    </tr>`;
  }).join('');

  quadSection.style.display = 'block';
}

function renderIcgStats(tacLines, quads) {
  if (!tacLines || !tacLines.length) {
    icgStats.style.display = 'none';
    return;
  }

  // Count instruction types
  const counts = { assignments: 0, labels: 0, jumps: 0, calls: 0, returns: 0, operations: 0 };
  (quads || []).forEach(q => {
    if (q.op === 'label') counts.labels++;
    else if (q.op === 'goto' || q.op === 'ifFalse') counts.jumps++;
    else if (q.op === 'call') counts.calls++;
    else if (q.op === 'return') counts.returns++;
    else if (q.op === '=') counts.assignments++;
    else counts.operations++;
  });

  const chips = [
    { label: 'Instructions', value: tacLines.length, color: '#a5b4fc' },
    { label: 'Operations',   value: counts.operations, color: '#6ee7b7' },
    { label: 'Assignments',  value: counts.assignments, color: '#93c5fd' },
    { label: 'Jumps',        value: counts.jumps,       color: '#fcd34d' },
    { label: 'Labels',       value: counts.labels,      color: '#c4b5fd' },
    { label: 'Calls',        value: counts.calls,       color: '#f9a8d4' },
  ].filter(c => c.value > 0);

  icgStats.innerHTML = chips.map(c => `
    <div class="stat-chip" style="background:${c.color}15;border-color:${c.color}40;color:${c.color};">
      <span class="dot" style="background:${c.color}"></span>
      ${c.label}&nbsp;<strong>${c.value}</strong>
    </div>
  `).join('');

  icgStats.style.display = 'flex';
}

// AST Visual Tree (D3.js) — Node colour palette per AST node type
const NODE_FILL = {
  Program:    '#6366f1', VarDecl:    '#3b82f6', Assign:     '#ef4444',
  If:         '#8b5cf6', While:      '#10b981', Condition:  '#06b6d4',
  Body:       '#14b8a6', Then:       '#10b981', Else:       '#f97316',
  BinaryOp:   '#ec4899', UnaryOp:    '#e11d48', Number:     '#22c55e',
  Identifier: '#64748b', Printf:     '#f59e0b', Scanf:      '#d946ef',
  String:     '#fb923c', Format:     '#78716c', Ref:        '#0ea5e9',
  Return:     '#84cc16', PostfixStmt:'#ef4444', PrefixStmt: '#ef4444',
  SyntaxError:'#dc2626',
};
const NODE_FILL_DEFAULT = '#6366f1';

// Short display label for each node type
function getNodeShortLabel(data) {
  switch (data.type) {
    case 'Program':    return 'Program';
    case 'VarDecl':    return data.name ? `${data.varType || 'var'} ${data.name}` : (data.label || 'VarDecl');
    case 'Assign':     return data.name ? `${data.name} =` : '=';
    case 'If':         return 'if';
    case 'While':      return 'while';
    case 'Condition':  return 'condition';
    case 'Body':       return 'body';
    case 'Then':       return 'then';
    case 'Else':       return 'else';
    case 'BinaryOp':   return data.op || 'op';
    case 'UnaryOp':    return data.op || 'op';
    case 'Number':     return data.value !== undefined ? String(data.value) : '';
    case 'Identifier': return data.name || 'id';
    case 'Printf':    return 'printf()';
    case 'Scanf':     return 'scanf()';
    case 'String':    return data.value ? `"${data.value}"` : 'str';
    case 'Format':    return data.label ? data.label.replace('Format: ', '') : 'fmt';
    case 'Ref':       return data.label || '&ref';
    case 'Return':    return 'return';
    default:          return data.label || data.type;
  }
}

// Measure approx text width for node sizing
let _measureCanvas = null;
function estimateTextWidth(text, fontSize = 13) {
  if (!_measureCanvas) {
    _measureCanvas = document.createElement('canvas').getContext('2d');
  }
  _measureCanvas.font = `600 ${fontSize}px 'Inter', sans-serif`;
  return _measureCanvas.measureText(text).width;
}

// Shared zoom behaviour
let _treeZoom = null;
let _treeSvg  = null;

// Main tree render
function renderTree(astData, container) {
  container.innerHTML = '';
  if (!astData) return;

  const root = d3.hierarchy(astData, d => d.children && d.children.length ? d.children : null);

  const nodeHGap = 28;
  const nodeVGap = 80;
  const nodeH    = 48;

  root.descendants().forEach(d => {
    const label = getNodeShortLabel(d.data);
    d._label = label;
    d._w = Math.max(60, estimateTextWidth(label, 13) + 36);
  });

  const treeLayout = d3.tree()
    .nodeSize([1, nodeVGap])
    .separation((a, b) => {
      return ((a._w || 80) + (b._w || 80)) / 2 / 50 + 0.5;
    });

  treeLayout(root);

  const xScale = 50;
  root.descendants().forEach(d => {
    d.x = d.x * xScale;
  });

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  root.descendants().forEach(d => {
    const hw = (d._w || 80) / 2;
    if (d.x - hw < minX) minX = d.x - hw;
    if (d.x + hw > maxX) maxX = d.x + hw;
    if (d.y < minY) minY = d.y;
    if (d.y + nodeH > maxY) maxY = d.y + nodeH;
  });

  const treePad = 40;
  const treeW = (maxX - minX) + treePad * 2;
  const treeH = (maxY - minY) + treePad * 2;

  const containerRect = container.getBoundingClientRect();
  const svgW = Math.max(containerRect.width, 300);
  const svgH = Math.max(containerRect.height, 400);

  const svg = d3.select(container)
    .append('svg')
    .attr('width', svgW)
    .attr('height', svgH)
    .attr('class', 'ast-svg');

  const g = svg.append('g')
    .attr('class', 'ast-zoom-group');

  const zoom = d3.zoom()
    .scaleExtent([0.15, 3])
    .on('zoom', event => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);
  _treeZoom = zoom;
  _treeSvg  = svg;

  // Draw links (curved)
  g.selectAll('.tree-link')
    .data(root.links())
    .join('path')
    .attr('class', 'tree-link')
    .attr('d', d => {
      const sx = d.source.x;
      const sy = d.source.y + nodeH / 2;
      const tx = d.target.x;
      const ty = d.target.y - nodeH / 2;
      const midY = (sy + ty) / 2;
      return `M${sx},${sy} C${sx},${midY} ${tx},${midY} ${tx},${ty}`;
    });

  // Draw nodes
  const nodes = g.selectAll('.tree-node')
    .data(root.descendants())
    .join('g')
    .attr('class', 'tree-node')
    .attr('transform', d => `translate(${d.x},${d.y})`);

  nodes.append('rect')
    .attr('class', 'tree-node-bg')
    .attr('x', d => -(d._w || 80) / 2)
    .attr('y', -nodeH / 2)
    .attr('width', d => d._w || 80)
    .attr('height', nodeH)
    .attr('rx', nodeH / 2)
    .attr('ry', nodeH / 2)
    .attr('fill', d => NODE_FILL[d.data.type] || NODE_FILL_DEFAULT)
    .attr('stroke', d => {
      const c = NODE_FILL[d.data.type] || NODE_FILL_DEFAULT;
      return d3.color(c).brighter(0.6);
    })
    .attr('stroke-width', 2);

  nodes.append('text')
    .attr('class', 'tree-type-label')
    .attr('y', -5)
    .attr('text-anchor', 'middle')
    .text(d => d.data.type.toUpperCase());

  nodes.append('text')
    .attr('class', 'tree-value-label')
    .attr('y', 13)
    .attr('text-anchor', 'middle')
    .text(d => d._label);

  // Initial fit
  requestAnimationFrame(() => {
    _resizeSvg();
    fitTree();
  });
}

// Resize SVG to match current container size
function _resizeSvg() {
  if (!_treeSvg) return;
  const container = _treeSvg.node().parentElement;
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const w = Math.max(rect.width, 300);
  const h = Math.max(rect.height, 400);
  _treeSvg.attr('width', w).attr('height', h);
}

// Fit tree to container
function fitTree() {
  if (!_treeSvg || !_treeZoom) return;
  const svgEl = _treeSvg.node();
  const gEl   = svgEl.querySelector('.ast-zoom-group');
  if (!gEl) return;

  _resizeSvg();

  const bbox = gEl.getBBox();
  const rect = svgEl.getBoundingClientRect();
  const cW   = rect.width;
  const cH   = rect.height;
  if (cW === 0 || cH === 0) return;

  const pad    = 30;
  const scaleX = (cW - pad * 2) / (bbox.width  || 1);
  const scaleY = (cH - pad * 2) / (bbox.height || 1);
  const scale  = Math.min(scaleX, scaleY);
  const tx     = cW / 2 - (bbox.x + bbox.width  / 2) * scale;
  const ty     = cH / 2 - (bbox.y + bbox.height / 2) * scale;

  _treeSvg.transition().duration(450).call(
    _treeZoom.transform,
    d3.zoomIdentity.translate(tx, ty).scale(scale)
  );
}

// Zoom controls
document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
  if (_treeSvg && _treeZoom) _treeSvg.transition().duration(300).call(_treeZoom.scaleBy, 1.4);
});
document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
  if (_treeSvg && _treeZoom) _treeSvg.transition().duration(300).call(_treeZoom.scaleBy, 0.7);
});
document.getElementById('zoom-fit-btn')?.addEventListener('click', fitTree);

// Main analyze function
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

    const res = await fetch(`${API_BASE}/analyze`, {
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
    const parseError = data.parseError || null;
    const trace = data.trace || [];
    const symbolTable = data.symbol_table || [];
    const semanticErrors = data.semantic_errors || [];
    const tacLines = data.tac || [];
    const quadruples = data.quadruples || [];

    currentTokens = tokens;

    setPipelineStage('lex', tokens.length ? 'done' : 'error');
    setPipelineStage('parse', 'active');

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

    renderParseErrors(parseError);
    renderTrace(trace);
    astTree.innerHTML = '';

    if (ast) {
      renderTree(ast, astTree);
      astContainer.style.display = 'block';
      astEmpty.style.display = 'none';
    } else {
      astContainer.style.display = 'none';
      astEmpty.style.display = 'flex';
    }

    if (parseError) {
      setPipelineStage('parse', 'error');
      setPipelineStage('ast', 'error');
      setPipelineStage('semantic', 'error');
      highlightErrorLine(parseError.line);
      showError(`Syntax Error${parseError.line ? ` at line ${parseError.line}` : ''}: ${parseError.message}`);
      clearSemanticPanel();
      clearIcgPanel();
      setPipelineStage('icg', 'error');
    } else {
      setPipelineStage('parse', 'done');
      setPipelineStage('ast', 'done');
      setPipelineStage('semantic', 'active');

      // Render semantic results
      renderSymbolTable(symbolTable);
      renderSemanticErrors(semanticErrors);
      semanticEmpty.style.display = 'none';

      if (semanticErrors.length > 0) {
        setPipelineStage('semantic', 'error');
        semanticSuccess.style.display = 'none';
        showError(
          `✓ ${tokens.length} token${tokens.length !== 1 ? 's' : ''} · AST built · ${semanticErrors.length} semantic error${semanticErrors.length !== 1 ? 's' : ''} found`
        );
      } else {
        setPipelineStage('semantic', 'done');
        semanticSuccess.style.display = 'flex';
        semanticSuccessMsg.textContent = `No semantic errors — ${symbolTable.length} symbol${symbolTable.length !== 1 ? 's' : ''} declared`;
      }

      // Render ICG results
      setPipelineStage('icg', 'active');
      renderTacCode(tacLines);
      renderQuadruples(quadruples);
      renderIcgStats(tacLines, quadruples);
      icgEmpty.style.display = 'none';

      if (tacLines.length > 0) {
        setPipelineStage('icg', 'done');
      }

      // Overall success message
      if (semanticErrors.length > 0) {
        showError(
          `✓ ${tokens.length} token${tokens.length !== 1 ? 's' : ''} · AST built · ${semanticErrors.length} semantic error${semanticErrors.length !== 1 ? 's' : ''} · ${tacLines.length} TAC instructions`
        );
      } else {
        showSuccess(
          `✓ ${tokens.length} token${tokens.length !== 1 ? 's' : ''} · AST built · ${symbolTable.length} symbol${symbolTable.length !== 1 ? 's' : ''} · ${tacLines.length} TAC instructions`
        );
      }
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
    clearSemanticPanel();
    clearIcgPanel();
  } finally {
    setLoading(false);
  }
}

// Sample code buttons
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

// Clear button
clearBtn.addEventListener('click', () => {
  codeInput.value = '';
  codeInput.dispatchEvent(new Event('input'));
  clearTokenResults();
  clearAstPanel();
  clearSemanticPanel();
  clearIcgPanel();
  hideBanners();
  clearErrorHighlight();
  resetPipeline();
  traceContent.textContent = 'Run an analysis to see parser steps…';
});

// Analyze button / keyboard shortcut
analyzeBtn.addEventListener('click', analyze);
codeInput.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); analyze(); }
});

// Editor char / line counter
codeInput.addEventListener('input', () => {
  const v = codeInput.value;
  charCount.textContent = `${v.length} chars`;
  lineCount.textContent = `${v.split('\n').length} lines`;
});

// Tab switching
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

    copyBtn.style.display = btn.dataset.tab === 'tokens' ? 'inline-flex' : 'none';

    if (btn.dataset.tab === 'syntax') {
      setTimeout(fitTree, 80);
    }
  });
});

// Copy button
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

// Copy TAC button
copyTacBtn.addEventListener('click', () => {
  const text = tacCode.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const copyText = copyTacBtn.querySelector('.copy-text');
    copyTacBtn.classList.add('copied');
    copyText.textContent = 'Copied!';
    setTimeout(() => {
      copyTacBtn.classList.remove('copied');
      copyText.textContent = 'Copy TAC';
    }, 2000);
  });
});

// Init — update counters for initial empty state
codeInput.dispatchEvent(new Event('input'));
