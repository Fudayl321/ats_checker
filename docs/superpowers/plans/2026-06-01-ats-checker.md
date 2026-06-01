# ATS Score Checker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-only ATS score checker that parses uploaded resumes (PDF/DOCX/TXT), matches keywords from job requirements, and renders a score ring with matched/missing keywords and suggestions.

**Architecture:** `ats-checker/ats.js` holds pure scoring functions (testable with Node). `ats-checker/index.html` holds all markup, CSS, and UI wiring and includes `ats.js` via `<script src>`. No build step. `ats.test.js` is dev-only and not deployed.

**Tech Stack:** Plain HTML/CSS/JS, pdf.js 3.11.174 (CDN), mammoth.js 1.6.0 (CDN), Node.js (unit testing only).

---

## File Map

| File | Purpose |
|------|---------|
| `ats-checker/index.html` | Markup, CSS, UI event wiring |
| `ats-checker/ats.js` | Pure functions: `extractKeywords`, `matchKeywords`, `calculateScore`, `generateSuggestions` |
| `ats-checker/ats.test.js` | Node.js unit tests (dev only — not deployed) |

---

### Task 1: Scaffold — HTML skeleton and stub JS

**Files:**
- Create: `ats-checker/index.html`
- Create: `ats-checker/ats.js`

- [ ] **Step 1: Create the directory**

```powershell
mkdir ats-checker
```

- [ ] **Step 2: Create `ats-checker/ats.js` with stub functions**

```js
const STOP_WORDS = new Set([]);

function extractKeywords(text) { return []; }
function matchKeywords(keywords, resumeText) { return { matched: [], missing: [] }; }
function calculateScore(matchedCount, totalCount) { return 0; }
function generateSuggestions(missingKeywords, requirementsText) { return []; }

if (typeof module !== 'undefined') {
  module.exports = { extractKeywords, matchKeywords, calculateScore, generateSuggestions };
}
```

- [ ] **Step 3: Create `ats-checker/index.html` with split panel skeleton**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ATS Score Checker</title>
  <style>
    /* filled in Task 3 */
  </style>
</head>
<body>
  <div id="app">
    <header>
      <span class="logo">ATS Checker</span>
    </header>
    <main class="split">

      <!-- Left panel: inputs -->
      <section class="panel panel-left">
        <h2>Your Resume</h2>
        <div id="upload-zone" class="upload-zone">
          <span class="upload-icon">📄</span>
          <p>Drop your resume here or <button id="browse-btn" type="button">browse</button></p>
          <p class="hint">PDF, DOCX, or TXT</p>
          <input type="file" id="file-input" accept=".pdf,.docx,.txt" hidden>
        </div>
        <div id="file-info" class="file-info hidden">
          <span id="file-name"></span>
          <button id="clear-file" type="button">×</button>
        </div>
        <label for="job-title">Job Title</label>
        <input type="text" id="job-title" placeholder="e.g. Senior Software Engineer">
        <label for="job-requirements">Job Requirements</label>
        <textarea id="job-requirements" rows="6" placeholder="Paste the full job description here..."></textarea>
        <button id="analyze-btn" type="button" disabled>Analyze Resume</button>
      </section>

      <!-- Right panel: results -->
      <section class="panel panel-right">
        <div id="results-empty" class="results-state">
          <p class="results-placeholder">Your results will appear here</p>
        </div>
        <div id="results-loading" class="results-state hidden">
          <div class="spinner"></div>
          <p>Analyzing...</p>
        </div>
        <div id="results-content" class="results-state hidden">
          <div class="score-section">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" stroke-width="10"/>
              <circle id="score-ring" cx="60" cy="60" r="50" fill="none" stroke="#22c55e"
                stroke-width="10" stroke-linecap="round"
                stroke-dasharray="314" stroke-dashoffset="314"
                transform="rotate(-90 60 60)"/>
            </svg>
            <div class="score-number"><span id="score-pct">0</span>%</div>
            <div id="score-label" class="score-label">—</div>
          </div>
          <div class="keywords-section">
            <h3>Matched Keywords</h3>
            <div id="matched-keywords" class="pills pills-green"></div>
            <h3>Missing Keywords</h3>
            <div id="missing-keywords" class="pills pills-red"></div>
          </div>
          <div class="suggestions-section">
            <h3>Suggestions</h3>
            <ol id="suggestions-list"></ol>
          </div>
        </div>
      </section>

    </main>
    <div id="error-banner" class="error-banner hidden"></div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"></script>
  <script src="ats.js"></script>
  <script>
    /* UI wiring — filled in Task 5 */
  </script>
</body>
</html>
```

- [ ] **Step 4: Open `ats-checker/index.html` in a browser**

Expected: two unstyled panels side by side, upload zone and form fields visible, no JS errors in the console.

- [ ] **Step 5: Commit**

```bash
git add ats-checker/
git commit -m "feat: scaffold ATS checker HTML skeleton and stub JS"
```

---

### Task 2: Core scoring functions (TDD)

**Files:**
- Create: `ats-checker/ats.test.js`
- Modify: `ats-checker/ats.js` (replace stubs with real implementations)

- [ ] **Step 1: Create `ats-checker/ats.test.js` with all tests**

```js
const assert = require('assert');
const { extractKeywords, matchKeywords, calculateScore, generateSuggestions } = require('./ats.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

// --- extractKeywords ---
console.log('\nextractKeywords');

test('extracts single words and removes stop words', () => {
  const kws = extractKeywords('experience with JavaScript and React');
  assert.ok(kws.includes('javascript'), `expected "javascript", got ${JSON.stringify(kws)}`);
  assert.ok(kws.includes('react'), `expected "react", got ${JSON.stringify(kws)}`);
  assert.ok(!kws.includes('and'), 'should exclude stop word "and"');
  assert.ok(!kws.includes('with'), 'should exclude stop word "with"');
});

test('extracts bigrams from consecutive non-stop words', () => {
  const kws = extractKeywords('project management skills');
  assert.ok(kws.includes('project management'), `expected bigram "project management", got ${JSON.stringify(kws)}`);
});

test('deduplicates keywords', () => {
  const kws = extractKeywords('javascript javascript javascript');
  const count = kws.filter(k => k === 'javascript').length;
  assert.strictEqual(count, 1, `expected 1 occurrence, got ${count}`);
});

test('returns empty array for empty string', () => {
  assert.deepStrictEqual(extractKeywords(''), []);
});

test('returns empty array for whitespace-only string', () => {
  assert.deepStrictEqual(extractKeywords('   '), []);
});

// --- matchKeywords ---
console.log('\nmatchKeywords');

test('matches present keywords (case-insensitive)', () => {
  const { matched, missing } = matchKeywords(['javascript', 'python'], 'I know JavaScript and Python well');
  assert.ok(matched.includes('javascript'), 'should match "javascript"');
  assert.ok(matched.includes('python'), 'should match "python"');
  assert.strictEqual(missing.length, 0, `expected no missing, got ${JSON.stringify(missing)}`);
});

test('flags absent keywords as missing', () => {
  const { matched, missing } = matchKeywords(['kubernetes', 'terraform'], 'I know JavaScript');
  assert.strictEqual(matched.length, 0, `expected no matched, got ${JSON.stringify(matched)}`);
  assert.ok(missing.includes('kubernetes'), 'should flag "kubernetes" as missing');
  assert.ok(missing.includes('terraform'), 'should flag "terraform" as missing');
});

test('matches plural form via singular normalisation', () => {
  const { matched } = matchKeywords(['skill'], 'I have many skills and abilities');
  assert.ok(matched.includes('skill'), 'should match plural "skills" against keyword "skill"');
});

test('returns empty matched and missing for empty keywords array', () => {
  const { matched, missing } = matchKeywords([], 'any resume text');
  assert.deepStrictEqual(matched, []);
  assert.deepStrictEqual(missing, []);
});

// --- calculateScore ---
console.log('\ncalculateScore');

test('returns 100 when all keywords matched', () => {
  assert.strictEqual(calculateScore(10, 10), 100);
});

test('returns 0 when no keywords matched', () => {
  assert.strictEqual(calculateScore(0, 10), 0);
});

test('returns 0 when total is 0 (no division by zero)', () => {
  assert.strictEqual(calculateScore(0, 0), 0);
});

test('rounds to nearest integer', () => {
  assert.strictEqual(calculateScore(1, 3), 33);
});

test('returns 50 for half matched', () => {
  assert.strictEqual(calculateScore(5, 10), 50);
});

// --- generateSuggestions ---
console.log('\ngenerateSuggestions');

test('returns at most 5 suggestions', () => {
  const missing = ['java', 'kubernetes', 'docker', 'terraform', 'python', 'golang', 'rust'];
  const suggestions = generateSuggestions(missing, 'java kubernetes docker terraform python golang rust');
  assert.ok(suggestions.length <= 5, `expected ≤5, got ${suggestions.length}`);
});

test('suggestion text contains the missing keyword', () => {
  const suggestions = generateSuggestions(['kubernetes'], 'kubernetes cluster deployment');
  assert.ok(suggestions[0].toLowerCase().includes('kubernetes'), `expected keyword in suggestion text, got: ${suggestions[0]}`);
});

test('returns empty array when no keywords are missing', () => {
  assert.deepStrictEqual(generateSuggestions([], 'any requirements'), []);
});

test('sorts by keyword frequency in requirements (most frequent first)', () => {
  const missing = ['rare', 'common'];
  const suggestions = generateSuggestions(missing, 'common common common rare');
  assert.ok(suggestions[0].includes('common'), `expected "common" first, got: ${suggestions[0]}`);
});

// --- Summary ---
console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Run tests — verify all fail**

```bash
node ats-checker/ats.test.js
```

Expected: every test fails with errors like "expected 'javascript', got []"

- [ ] **Step 3: Replace `ats-checker/ats.js` with full implementation**

```js
const STOP_WORDS = new Set([
  'the','and','a','an','to','in','of','for','with','is','are','that','this',
  'it','be','as','at','by','we','you','or','on','not','but','from','have',
  'has','will','can','your','our','their','its','was','were','been','being',
  'do','does','did','about','into','they','he','she','who','which','what',
  'when','where','how','all','any','both','each','more','most','other','some',
  'such','than','then','these','those','up','out','no','only','same','so',
  'over','also','well','just','should','must','may','might','would','could',
]);

function extractKeywords(text) {
  if (!text || !text.trim()) return [];
  const words = text.toLowerCase().split(/\s+/);
  const clean = w => w.replace(/[^a-z0-9]/g, '');
  const usable = w => w.length > 2 && !STOP_WORDS.has(w);

  const bigrams = [];
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = clean(words[i]);
    const w2 = clean(words[i + 1]);
    if (usable(w1) && usable(w2)) bigrams.push(w1 + ' ' + w2);
  }

  const singles = words.map(clean).filter(usable);
  return [...new Set([...bigrams, ...singles])];
}

function normalize(word) {
  const w = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  return w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w;
}

function matchKeywords(keywords, resumeText) {
  if (!keywords.length) return { matched: [], missing: [] };
  const resumeLower = resumeText.toLowerCase();
  const resumeNormWords = resumeText.toLowerCase().split(/\s+/).map(normalize).join(' ');
  const matched = [];
  const missing = [];

  for (const kw of keywords) {
    const normKw = kw.split(' ').map(normalize).join(' ');
    if (resumeLower.includes(kw) || resumeNormWords.includes(normKw)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }
  return { matched, missing };
}

function calculateScore(matchedCount, totalCount) {
  if (totalCount === 0) return 0;
  return Math.round((matchedCount / totalCount) * 100);
}

function generateSuggestions(missingKeywords, requirementsText) {
  if (!missingKeywords.length) return [];
  const reqLower = requirementsText.toLowerCase();
  const freq = kw => (reqLower.match(new RegExp(kw.split(' ')[0], 'g')) || []).length;
  return [...missingKeywords]
    .sort((a, b) => freq(b) - freq(a))
    .slice(0, 5)
    .map(kw => `Consider adding "${kw}" — it appears in the job requirements`);
}

if (typeof module !== 'undefined') {
  module.exports = { extractKeywords, matchKeywords, calculateScore, generateSuggestions };
}
```

- [ ] **Step 4: Run tests — all should pass**

```bash
node ats-checker/ats.test.js
```

Expected output:
```
extractKeywords
  ✅ extracts single words and removes stop words
  ✅ extracts bigrams from consecutive non-stop words
  ✅ deduplicates keywords
  ✅ returns empty array for empty string
  ✅ returns empty array for whitespace-only string

matchKeywords
  ✅ matches present keywords (case-insensitive)
  ✅ flags absent keywords as missing
  ✅ matches plural form via singular normalisation
  ✅ returns empty matched and missing for empty keywords array

calculateScore
  ✅ returns 100 when all keywords matched
  ✅ returns 0 when no keywords matched
  ✅ returns 0 when total is 0 (no division by zero)
  ✅ rounds to nearest integer
  ✅ returns 50 for half matched

generateSuggestions
  ✅ returns at most 5 suggestions
  ✅ suggestion text contains the missing keyword
  ✅ returns empty array when no keywords are missing
  ✅ sorts by keyword frequency in requirements (most frequent first)

18 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add ats-checker/ats.js ats-checker/ats.test.js
git commit -m "feat: implement and test ATS scoring functions"
```

---

### Task 3: CSS styling

**Files:**
- Modify: `ats-checker/index.html` (replace `/* filled in Task 3 */` in the `<style>` block)

- [ ] **Step 1: Replace the `/* filled in Task 3 */` comment inside `<style>` with the full CSS**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0f172a;
  color: #e2e8f0;
  min-height: 100vh;
}

/* Header */
header {
  padding: 14px 24px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}
.logo { font-size: 16px; font-weight: 700; color: #818cf8; letter-spacing: 0.05em; }

/* Layout */
#app { display: flex; flex-direction: column; min-height: 100vh; }
main.split { display: flex; flex: 1; }
.panel { flex: 1; padding: 28px 24px; overflow-y: auto; }
.panel-left { border-right: 1px solid #1e293b; }
.panel-right { background: #0b1120; }

/* Left panel heading */
.panel-left h2 {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 18px;
}

/* Upload zone */
.upload-zone {
  border: 2px dashed #334155; border-radius: 10px; padding: 24px;
  text-align: center; cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  margin-bottom: 16px;
}
.upload-zone:hover, .upload-zone.dragover {
  border-color: #6366f1;
  background: rgba(99,102,241,0.05);
}
.upload-icon { font-size: 28px; display: block; margin-bottom: 8px; }
.upload-zone p { color: #94a3b8; font-size: 13px; }
.upload-zone .hint { font-size: 11px; color: #475569; margin-top: 4px; }
.upload-zone button {
  background: none; border: none; color: #818cf8; cursor: pointer;
  font-size: 13px; text-decoration: underline; padding: 0;
}

/* File info */
.file-info {
  display: flex; align-items: center; justify-content: space-between;
  background: #1e293b; border-radius: 6px; padding: 8px 12px;
  margin-bottom: 16px; font-size: 13px; color: #94a3b8;
}
.file-info button {
  background: none; border: none; color: #64748b;
  cursor: pointer; font-size: 16px; line-height: 1;
}
.file-info button:hover { color: #ef4444; }

/* Form */
label {
  display: block; font-size: 11px; font-weight: 600; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 6px; margin-top: 16px;
}
input[type="text"], textarea {
  width: 100%; background: #1e293b; border: 1px solid #334155;
  border-radius: 6px; color: #e2e8f0; padding: 10px 12px;
  font-size: 14px; font-family: inherit; outline: none;
  transition: border-color 0.2s;
}
input[type="text"]:focus, textarea:focus { border-color: #6366f1; }
textarea { resize: vertical; min-height: 120px; }
input::placeholder, textarea::placeholder { color: #475569; }

/* Analyze button */
#analyze-btn {
  width: 100%; margin-top: 20px; padding: 12px;
  background: #6366f1; color: #fff; border: none; border-radius: 8px;
  font-size: 14px; font-weight: 700; cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}
#analyze-btn:hover:not(:disabled) { background: #4f46e5; }
#analyze-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Results states */
.results-state { width: 100%; }
.hidden { display: none !important; }

.results-placeholder {
  color: #334155; font-size: 14px; text-align: center; margin-top: 80px;
}

/* Loading */
#results-loading {
  display: flex; flex-direction: column; align-items: center;
  gap: 14px; margin-top: 80px; color: #475569; font-size: 14px;
}
.spinner {
  width: 32px; height: 32px;
  border: 3px solid #1e293b; border-top-color: #6366f1;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Score ring */
.score-section {
  display: flex; flex-direction: column; align-items: center;
  padding: 24px 0 8px; position: relative;
}
.score-number {
  font-size: 22px; font-weight: 800; color: #e2e8f0;
  position: absolute; top: 54px; left: 50%; transform: translateX(-50%);
  white-space: nowrap;
}
.score-label {
  margin-top: 8px; font-size: 12px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
}

/* Keywords */
.keywords-section { margin: 12px 0; }
.keywords-section h3, .suggestions-section h3 {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; color: #64748b; margin: 16px 0 8px;
}
.pills { display: flex; flex-wrap: wrap; gap: 6px; }
.pill { padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
.pills-green .pill { background: rgba(34,197,94,0.15); color: #4ade80; }
.pills-red .pill   { background: rgba(239,68,68,0.15); color: #f87171; }

/* Suggestions */
.suggestions-section ol {
  padding-left: 18px; display: flex; flex-direction: column; gap: 8px;
}
.suggestions-section li { font-size: 13px; color: #94a3b8; line-height: 1.5; }

/* Error banner */
.error-banner {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  background: #7f1d1d; color: #fca5a5;
  padding: 10px 20px; border-radius: 8px; font-size: 13px; z-index: 100;
}

/* Responsive */
@media (max-width: 700px) {
  main.split { flex-direction: column; }
  .panel-left { border-right: none; border-bottom: 1px solid #1e293b; }
}
```

- [ ] **Step 2: Open `ats-checker/index.html` in browser**

Expected: dark split panel with indigo accents, upload zone with dashed border, styled form fields, disabled "Analyze Resume" button, empty right panel with dim placeholder text.

- [ ] **Step 3: Commit**

```bash
git add ats-checker/index.html
git commit -m "feat: add dark theme CSS for ATS checker"
```

---

### Task 4: File parsing (pdf.js + mammoth.js)

**Files:**
- Modify: `ats-checker/index.html` (add `parseFile` to the `<script>` block, above `/* UI wiring */`)

- [ ] **Step 1: Replace `/* UI wiring — filled in Task 5 */` with the pdf.js worker config + `parseFile` function**

The full `<script>` block (last `<script>` in `index.html`) should now be:

```html
<script>
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  async function parseFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'txt') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Could not read this file. Try saving as a different format.'));
        reader.readAsText(file);
      });
    }

    if (ext === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }
      return text;
    }

    if (ext === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    throw new Error('Please upload a PDF, DOCX, or TXT file.');
  }

  /* UI wiring — filled in Task 5 */
</script>
```

- [ ] **Step 2: Add a temporary test button after the upload zone in the HTML to verify parsing**

Inside `.panel-left`, directly after the `<div id="file-info">` block, add:

```html
<button id="test-parse" type="button" style="margin:8px 0;font-size:12px;padding:4px 10px;background:#334155;color:#94a3b8;border:none;border-radius:4px;cursor:pointer">Test Parse (dev)</button>
```

And inside the `<script>` block, after the `parseFile` function, add:

```js
document.getElementById('test-parse').addEventListener('click', () => {
  const fi = document.getElementById('file-input');
  fi.click();
  fi.onchange = async () => {
    try {
      const text = await parseFile(fi.files[0]);
      console.log('[parseFile] first 300 chars:', text.substring(0, 300));
      alert('Parsed OK — check console for text preview.');
    } catch (err) {
      alert('Parse error: ' + err.message);
    }
  };
});
```

- [ ] **Step 3: Open `ats-checker/index.html` in browser, test each format**

1. Click "Test Parse (dev)" → upload a `.txt` resume → check console shows readable text
2. Click "Test Parse (dev)" → upload a `.pdf` resume → check console shows readable text
3. Click "Test Parse (dev)" → upload a `.docx` resume → check console shows readable text
4. Click "Test Parse (dev)" → upload a `.jpg` → check alert says "Please upload a PDF, DOCX, or TXT file."

- [ ] **Step 4: Remove the temporary test button and its event listener**

Delete the `<button id="test-parse">` line from the HTML.
Delete the `document.getElementById('test-parse').addEventListener(...)` block from the script.

- [ ] **Step 5: Commit**

```bash
git add ats-checker/index.html
git commit -m "feat: add PDF/DOCX/TXT file parsing in browser"
```

---

### Task 5: UI wiring and results rendering

**Files:**
- Modify: `ats-checker/index.html` (replace `/* UI wiring — filled in Task 5 */` with full UI logic)

- [ ] **Step 1: Replace `/* UI wiring — filled in Task 5 */` in the `<script>` block with the full UI logic**

```js
let resumeText = '';

// DOM refs — inputs
const uploadZone   = document.getElementById('upload-zone');
const fileInput    = document.getElementById('file-input');
const browseBtn    = document.getElementById('browse-btn');
const fileInfo     = document.getElementById('file-info');
const fileNameEl   = document.getElementById('file-name');
const clearFileBtn = document.getElementById('clear-file');
const jobReqs      = document.getElementById('job-requirements');
const analyzeBtn   = document.getElementById('analyze-btn');
const errorBanner  = document.getElementById('error-banner');

// DOM refs — results
const resultsEmpty   = document.getElementById('results-empty');
const resultsLoading = document.getElementById('results-loading');
const resultsContent = document.getElementById('results-content');
const scoreRing      = document.getElementById('score-ring');
const scorePct       = document.getElementById('score-pct');
const scoreLabel     = document.getElementById('score-label');
const matchedKws     = document.getElementById('matched-keywords');
const missingKws     = document.getElementById('missing-keywords');
const suggList       = document.getElementById('suggestions-list');

function checkReady() {
  analyzeBtn.disabled = !(resumeText.trim() && jobReqs.value.trim());
}
jobReqs.addEventListener('input', checkReady);

// Drag and drop
uploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

// Click to browse
uploadZone.addEventListener('click', () => fileInput.click());
browseBtn.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

// Clear file
clearFileBtn.addEventListener('click', () => {
  resumeText = '';
  fileInput.value = '';
  fileInfo.classList.add('hidden');
  uploadZone.classList.remove('hidden');
  checkReady();
});

async function handleFile(file) {
  showError('');
  try {
    resumeText = await parseFile(file);
    if (!resumeText.trim()) {
      showError('No text found in this file. Try a different format.');
      resumeText = '';
      return;
    }
    fileNameEl.textContent = file.name;
    uploadZone.classList.add('hidden');
    fileInfo.classList.remove('hidden');
    checkReady();
  } catch (err) {
    showError(err.message || 'Could not read this file. Try saving as a different format.');
    resumeText = '';
  }
}

analyzeBtn.addEventListener('click', async () => {
  showResults('loading');
  await new Promise(r => setTimeout(r, 50)); // allow spinner to render

  const requirements = jobReqs.value;
  const keywords = extractKeywords(requirements);
  const { matched, missing } = matchKeywords(keywords, resumeText);
  const score = calculateScore(matched.length, keywords.length);
  const suggestions = generateSuggestions(missing, requirements);

  renderResults(score, matched, missing, suggestions);
  showResults('content');
});

function renderResults(score, matched, missing, suggestions) {
  // Score ring: circumference = 2 * π * r = 2 * 3.14159 * 50 ≈ 314
  const circumference = 314;
  scoreRing.style.strokeDashoffset = circumference * (1 - score / 100);
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  scoreRing.style.stroke = color;

  scorePct.textContent = score;
  scoreLabel.textContent = score >= 75 ? 'Good Match' : score >= 50 ? 'Partial Match' : 'Low Match';
  scoreLabel.style.color = color;

  matchedKws.innerHTML = matched.map(kw => `<span class="pill">${kw}</span>`).join('');
  missingKws.innerHTML  = missing.map(kw => `<span class="pill">${kw}</span>`).join('');
  suggList.innerHTML    = suggestions.map(s => `<li>${s}</li>`).join('');
}

function showResults(state) {
  resultsEmpty.classList.toggle('hidden',   state !== 'empty');
  resultsLoading.classList.toggle('hidden', state !== 'loading');
  resultsContent.classList.toggle('hidden', state !== 'content');
}

function showError(msg) {
  if (!msg) { errorBanner.classList.add('hidden'); return; }
  errorBanner.textContent = msg;
  errorBanner.classList.remove('hidden');
  setTimeout(() => errorBanner.classList.add('hidden'), 5000);
}
```

- [ ] **Step 2: Test the full flow in the browser**

1. Open `ats-checker/index.html`
2. Create a file `test-resume.txt` with content:
   ```
   I have 5 years of experience with JavaScript React Node.js project management agile development
   ```
3. Upload `test-resume.txt`
4. Enter Job Title: `Frontend Developer`
5. Enter Job Requirements:
   ```
   Looking for a developer with JavaScript React TypeScript project management skills agile experience kubernetes
   ```
6. Click "Analyze Resume"

Expected:
- Loading spinner appears briefly, then results render
- Score is between 50–80%
- Green pills include: `javascript`, `react`, `project management`, `agile`
- Red pills include: `typescript`, `kubernetes`
- Suggestions list mentions `typescript` and/or `kubernetes`

- [ ] **Step 3: Commit**

```bash
git add ats-checker/index.html
git commit -m "feat: wire up UI and render ATS score results"
```

---

### Task 6: Error handling and final polish

**Files:**
- Modify: `ats-checker/index.html` (verification only — no new code required; errors are handled by `handleFile` and `parseFile`)

- [ ] **Step 1: Test unsupported file type**

Open `index.html`, click the upload zone, select any `.jpg` or `.xlsx` file.
Expected: red error banner appears with "Please upload a PDF, DOCX, or TXT file." Upload zone remains visible.

- [ ] **Step 2: Test empty job requirements keeps button disabled**

Upload a valid TXT file. Leave Job Requirements empty. Expected: "Analyze Resume" button stays disabled (grayed out, not clickable).

- [ ] **Step 3: Test that zero-keyword requirements don't crash**

Upload a valid TXT file. Enter Job Requirements as only stop words: `the and or is with a`.
Click Analyze (button should be enabled since the field is not empty).
Expected: results show 0%, empty matched/missing pill lists, empty suggestions. No JS errors in console.

- [ ] **Step 4: Test mobile layout**

Open `index.html` in browser DevTools. Toggle device toolbar and set width to 375px.
Expected: panels stack vertically (resume inputs on top, results below), no horizontal scroll, all text readable.

- [ ] **Step 5: End-to-end test with a real resume and job description**

1. Upload your own resume PDF
2. Paste a real job description from a job board into the requirements field
3. Click Analyze
4. Verify: score ring animates to the correct percentage, matched keywords are genuinely present in your resume, missing keywords are genuinely absent, suggestions reference real missing terms.

- [ ] **Step 6: Commit**

```bash
git add ats-checker/
git commit -m "feat: complete ATS checker — error handling and e2e verified"
```
