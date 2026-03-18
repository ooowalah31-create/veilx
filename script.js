// Veilx — Built by Claude
// Storage: localStorage, URL: ?id=PASTEID

var STORAGE_KEY = 'veilx_pastes_v1';

// ─────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────
function getAllPastes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch(e) { return {}; }
}

function savePasteToStorage(paste) {
  try {
    var all = getAllPastes();
    all[paste.id] = paste;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return true;
  } catch(e) { return false; }
}

function getPasteFromStorage(id) {
  try {
    var all = getAllPastes();
    return all[id] || null;
  } catch(e) { return null; }
}

// ─────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────
function genId() {
  var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var id = '';
  for (var i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function hashPw(pw) {
  var h = 5381;
  for (var i = 0; i < pw.length; i++) { h = ((h << 5) + h) ^ pw.charCodeAt(i); h = h >>> 0; }
  return h.toString(16);
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function getBaseUrl() {
  return window.location.href.split('?')[0];
}

function getPasteUrl(id) {
  return getBaseUrl() + '?id=' + id;
}

function detectLang(code) {
  if (/^\s*<(!DOCTYPE|html|head|body)/i.test(code)) return 'html';
  if (/^\s*<\?php/.test(code)) return 'php';
  try { if (/^\s*[\[{]/.test(code)) { JSON.parse(code); return 'json'; } } catch(e){}
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE)\s/im.test(code)) return 'sql';
  if (/\bdef |import |print\(|elif /.test(code)) return 'python';
  if (/\{[^}]*:[^}]*\}/.test(code) && /[.#][a-z][^{]*\{/.test(code)) return 'css';
  if (/\b(function|const|let|var|=>|require|module\.exports)\b/.test(code)) return 'js';
  return 'plain';
}

// ─────────────────────────────────────────
// SYNTAX HIGHLIGHT
// ─────────────────────────────────────────
var PATTERNS = {
  js: [
    [/(\/\/[^\n]*)/g, 'cm'],
    [/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g, 'cs'],
    [/\b(function|var|let|const|return|if|else|for|while|class|import|export|from|async|await|new|this|typeof|null|undefined|true|false|try|catch|throw|delete|in|of|do|switch|case|break|continue)\b/g, 'ck'],
    [/\b(\d+\.?\d*)\b/g, 'cn'],
  ],
  html: [
    [/(<!--[\s\S]*?-->)/g, 'cm'],
    [/(&lt;\/?[a-zA-Z][a-zA-Z0-9]*)/g, 'ct'],
    [/\b([a-zA-Z-]+=)/g, 'ca'],
    [/("(?:[^"\\])*")/g, 'cs'],
  ],
  css: [
    [/(\/\*[\s\S]*?\*\/)/g, 'cm'],
    [/([.#]?[a-zA-Z][a-zA-Z0-9_-]*\s*\{)/g, 'ct'],
    [/([a-zA-Z-]+:)/g, 'ca'],
    [/("(?:[^"\\])*"|'(?:[^'\\])*')/g, 'cs'],
    [/(#[0-9a-fA-F]{3,8}|\b\d+(?:px|em|rem|%|vh|vw)\b)/g, 'cn'],
  ],
  python: [
    [/(#[^\n]*)/g, 'cm'],
    [/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, 'cs'],
    [/\b(def|class|return|if|elif|else|for|while|import|from|as|with|try|except|lambda|pass|None|True|False|and|or|not|in|is)\b/g, 'ck'],
    [/\b(\d+\.?\d*)\b/g, 'cn'],
  ],
  json: [
    [/("(?:\\.|[^"\\])*"\s*:)/g, 'ca'],
    [/:\s*("(?:\\.|[^"\\])*")/g, 'cs'],
    [/\b(true|false|null)\b/g, 'ck'],
    [/\b(\d+\.?\d*)\b/g, 'cn'],
  ],
  php: [
    [/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, 'cm'],
    [/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, 'cs'],
    [/\b(function|class|return|if|else|foreach|for|while|echo|new|public|private|static|null|true|false)\b/g, 'ck'],
    [/(\$[a-zA-Z_][a-zA-Z0-9_]*)/g, 'ca'],
    [/\b(\d+\.?\d*)\b/g, 'cn'],
  ],
  sql: [
    [/(--[^\n]*)/g, 'cm'],
    [/("(?:[^"\\])*"|'(?:[^'\\])*')/g, 'cs'],
    [/\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|JOIN|LEFT|RIGHT|ON|AS|AND|OR|NOT|NULL|IS|IN|LIKE|ORDER|BY|GROUP|LIMIT|COUNT|SUM|AVG|MAX|MIN)\b/gi, 'ck'],
    [/\b(\d+\.?\d*)\b/g, 'cn'],
  ],
};

function highlight(code, lang) {
  if (!lang || lang === 'plain' || lang === 'auto') return escHtml(code);
  var ps = PATTERNS[lang];
  if (!ps) return escHtml(code);
  var out = escHtml(code);
  ps.forEach(function(p) {
    out = out.replace(p[0], function(m) { return '<span class="' + p[1] + '">' + m + '</span>'; });
  });
  return out;
}

// ─────────────────────────────────────────
// VIEWS
// ─────────────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  var el = document.getElementById('view-' + name);
  if (el) el.classList.add('active');
}

function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(function() { t.classList.remove('show'); }, 2400);
}

// ─────────────────────────────────────────
// CREATE PASTE — langsung redirect ke ?id=
// ─────────────────────────────────────────
function doCreate() {
  var content = document.getElementById('inp-content').value;
  var title   = document.getElementById('inp-title').value.trim();
  var langSel = document.getElementById('inp-lang').value;
  var pw      = document.getElementById('inp-pw').value;
  var errEl   = document.getElementById('create-err');
  var btn     = document.getElementById('btn-create');

  errEl.textContent = '';
  if (!content.trim()) { errEl.textContent = '⚠ Konten tidak boleh kosong'; return; }

  var id   = genId();
  var lang = langSel === 'auto' ? detectLang(content) : langSel;
  var paste = {
    id:        id,
    title:     title || 'Untitled',
    content:   content,
    lang:      lang,
    pwHash:    pw ? hashPw(pw) : null,
    createdAt: Date.now(),
  };

  btn.textContent = 'Creating...'; btn.disabled = true;
  var ok = savePasteToStorage(paste);
  btn.textContent = 'Create & Share →'; btn.disabled = false;

  if (!ok) { errEl.textContent = '⚠ Gagal menyimpan. Coba lagi.'; return; }

  // LANGSUNG REDIRECT ke ?id=ID — no modal, no button, just go
  window.location.href = getPasteUrl(id);
}

// ─────────────────────────────────────────
// VIEW PASTE
// ─────────────────────────────────────────
var _currentPaste = null;
var _isRaw = false;

function renderPasteView(paste) {
  _currentPaste = paste;

  document.getElementById('view-title').textContent = paste.title;
  document.getElementById('view-lang').textContent = paste.lang.toUpperCase();
  document.getElementById('view-lines').textContent = paste.content.split('\n').length + ' baris';
  document.getElementById('view-chars').textContent = paste.content.length.toLocaleString() + ' chars';
  document.getElementById('view-date').textContent = new Date(paste.createdAt).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'});
  document.getElementById('view-pw-badge').style.display = paste.pwHash ? 'inline-flex' : 'none';

  // Line nums
  var lines = paste.content.split('\n');
  var lnHtml = '';
  for (var i = 1; i <= lines.length; i++) lnHtml += '<span>' + i + '</span>';
  document.getElementById('line-nums').innerHTML = lnHtml;

  // Code
  document.getElementById('code-block').innerHTML = highlight(paste.content, paste.lang);
  document.getElementById('raw-block').textContent = paste.content;

  _isRaw = false;
  document.getElementById('code-wrap').style.display = '';
  document.getElementById('raw-wrap').style.display = 'none';
  document.getElementById('btn-raw').classList.remove('active');

  showView('paste');
}

function toggleRaw() {
  // Open raw as full-page in new tab — like pastefy.com
  if (!_currentPaste) return;
  var rawUrl = getBaseUrl() + '?id=' + _currentPaste.id + '&raw=1';
  window.open(rawUrl, '_blank');
}

function doCopy() {
  if (!_currentPaste) return;
  navigator.clipboard.writeText(_currentPaste.content)
    .then(function() { showToast('Disalin! 📋'); })
    .catch(function() {
      var ta = document.createElement('textarea');
      ta.value = _currentPaste.content;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); showToast('Disalin! 📋');
    });
}

function doDownload() {
  if (!_currentPaste) return;
  var extMap = {js:'js',html:'html',css:'css',python:'py',json:'json',php:'php',sql:'sql',plain:'txt'};
  var ext = extMap[_currentPaste.lang] || 'txt';
  var blob = new Blob([_currentPaste.content], {type:'text/plain'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (_currentPaste.title || 'paste') + '.' + ext;
  a.click(); URL.revokeObjectURL(a.href);
  showToast('Diunduh! 💾');
}

function goNew() {
  window.location.href = getBaseUrl();
}

// ─────────────────────────────────────────
// LOCK VIEW (password protected)
// ─────────────────────────────────────────
var _lockedPaste = null;

function showLockView(paste) {
  _lockedPaste = paste;
  document.getElementById('lock-title').textContent = paste.title;
  document.getElementById('lock-err').textContent = '';
  document.getElementById('lock-pw-input').value = '';
  showView('lock');
  setTimeout(function() { document.getElementById('lock-pw-input').focus(); }, 100);
}

function doUnlock() {
  var pw = document.getElementById('lock-pw-input').value;
  var errEl = document.getElementById('lock-err');
  if (!pw) return;
  if (hashPw(pw) === _lockedPaste.pwHash) {
    renderPasteView(_lockedPaste);
  } else {
    errEl.textContent = '✗ Password salah';
    document.getElementById('lock-pw-input').value = '';
    document.getElementById('lock-pw-input').focus();
  }
}

// ─────────────────────────────────────────
// OPEN VIEW (manual open by ID/link)
// ─────────────────────────────────────────
function doOpen() {
  var val = document.getElementById('open-input').value.trim();
  if (!val) { showToast('Masukkan ID atau link'); return; }

  // Extract ID from URL or plain ID
  var id = val;
  if (val.includes('?id=')) {
    id = val.split('?id=').pop().split('&')[0];
  } else if (val.includes('?')) {
    id = val.split('?').pop().split('&')[0];
  }
  id = id.trim();

  var paste = getPasteFromStorage(id);
  if (!paste) {
    showToast('Paste tidak ditemukan 💀', 'err');
    return;
  }

  // Navigate to paste URL
  window.location.href = getPasteUrl(id);
}

// ─────────────────────────────────────────
// LINE NUMBERS SYNC
// ─────────────────────────────────────────
function updateLineNums() {
  var ta = document.getElementById('inp-content');
  var ln = document.getElementById('create-line-nums');
  if (!ta || !ln) return;
  var count = ta.value.split('\n').length;
  var html = '';
  for (var i = 1; i <= count; i++) html += '<span>' + i + '</span>';
  ln.innerHTML = html;
  ln.scrollTop = ta.scrollTop;
}

// ─────────────────────────────────────────
// LOAD CONFIG
// ─────────────────────────────────────────
async function loadConfig() {
  try {
    var res = await fetch('config.json');
    var cfg = await res.json();
    if (cfg.langs) {
      var sel = document.getElementById('inp-lang');
      sel.innerHTML = '';
      cfg.langs.forEach(function(l) {
        var o = document.createElement('option');
        o.value = l.id; o.textContent = l.label;
        sel.appendChild(o);
      });
    }
  } catch(e) {}
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  loadConfig();

  // Check URL params
  var params = new URLSearchParams(window.location.search);
  var pasteId = params.get('id');
  var isRawPage = params.get('raw') === '1';

  if (pasteId && isRawPage) {
    // RAW MODE — full page plain text, no UI at all
    var rawPaste = getPasteFromStorage(pasteId);
    if (rawPaste && !rawPaste.pwHash) {
      // Replace entire document with plain text
      document.open();
      document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#0a0a0a;color:#d0d0d0;font-family:"JetBrains Mono",monospace;font-size:13px;line-height:1.7;padding:16px;white-space:pre-wrap;word-break:break-word;}</style></head><body>' + escHtml(rawPaste.content) + '</body></html>');
      document.close();
      return;
    } else if (rawPaste && rawPaste.pwHash) {
      // Protected — show message
      document.open();
      document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{background:#0a0a0a;color:#ff5252;font-family:monospace;font-size:13px;padding:16px;}</style></head><body>🔒 Paste ini diproteksi password. Buka link tanpa &raw=1 untuk unlock.</body></html>');
      document.close();
      return;
    } else {
      document.open();
      document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{background:#0a0a0a;color:#ff5252;font-family:monospace;font-size:13px;padding:16px;}</style></head><body>Paste tidak ditemukan.</body></html>');
      document.close();
      return;
    }
  } else if (pasteId) {
    // Normal paste view
    var paste = getPasteFromStorage(pasteId);
    if (!paste) {
      showView('notfound');
    } else if (paste.pwHash) {
      showLockView(paste);
    } else {
      renderPasteView(paste);
    }
  } else {
    showView('create');
  }

  // ── Create view ──
  document.getElementById('btn-create').addEventListener('click', doCreate);
  document.getElementById('inp-content').addEventListener('input', function() {
    updateLineNums();
    var n = this.value.length, l = this.value.split('\n').length;
    document.getElementById('create-stats').textContent = n.toLocaleString() + ' chars · ' + l + ' baris';
  });
  document.getElementById('inp-content').addEventListener('scroll', function() {
    document.getElementById('create-line-nums').scrollTop = this.scrollTop;
  });
  document.getElementById('inp-content').addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      var s = this.selectionStart, en = this.selectionEnd;
      this.value = this.value.slice(0,s) + '  ' + this.value.slice(en);
      this.selectionStart = this.selectionEnd = s + 2;
      updateLineNums();
    }
    if (e.ctrlKey && e.key === 'Enter') doCreate();
  });
  document.getElementById('btn-new-top').addEventListener('click', goNew);
  document.getElementById('btn-open-top').addEventListener('click', function() { showView('open'); });

  // ── Paste view ──
  document.getElementById('btn-copy').addEventListener('click', doCopy);
  document.getElementById('btn-download').addEventListener('click', doDownload);
  document.getElementById('btn-raw').addEventListener('click', toggleRaw);
  document.getElementById('btn-new-from-paste').addEventListener('click', goNew);

  // ── Lock view ──
  document.getElementById('btn-unlock').addEventListener('click', doUnlock);
  document.getElementById('lock-pw-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doUnlock();
  });
  document.getElementById('btn-lock-back').addEventListener('click', goNew);

  // ── Open view ──
  document.getElementById('btn-do-open').addEventListener('click', doOpen);
  document.getElementById('open-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doOpen();
  });
  document.getElementById('btn-open-back').addEventListener('click', goNew);

  // ── Not found ──
  document.getElementById('btn-notfound-back').addEventListener('click', goNew);

  updateLineNums();
});
