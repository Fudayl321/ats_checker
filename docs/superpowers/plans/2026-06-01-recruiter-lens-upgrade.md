# Recruiter Lens Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade ATS checker accuracy with synonym matching, required/preferred keyword split, hard filter simulation, and quantification scoring — all browser-only JS.

**Architecture:** 4 new functions and 2 updated functions in `ats.js`; results panel restructured in `index.html`; `ats.test.js` gains ~30 tests and has 9 updated tests. No new dependencies.

**Tech Stack:** Vanilla JS (browser + Node.js), Node `assert` module. Run tests: `node ats.test.js`.

---

### Task 1: buildSynonymMap

**Files:**
- Modify: `ats.js`
- Modify: `ats.test.js`

- [ ] **Step 1: Add failing tests — append before `// --- Summary ---` in `ats.test.js`**

Update the `require` line at the top:
```js
const { buildSynonymMap, extractKeywords, matchKeywords, generateSuggestions, detectSections, calculateExperienceFit, calculateWeightedScore } = require('./ats.js');
```

Append before `// --- Summary ---`:
```js
// --- buildSynonymMap ---
console.log('\nbuildSynonymMap');

test('js maps to javascript', () => {
  const map = buildSynonymMap();
  assert.strictEqual(map['js'], 'javascript');
});

test('ml maps to machine learning', () => {
  const map = buildSynonymMap();
  assert.strictEqual(map['ml'], 'machine learning');
});

test('k8s maps to kubernetes', () => {
  const map = buildSynonymMap();
  assert.strictEqual(map['k8s'], 'kubernetes');
});

test('returns at least 30 pairs', () => {
  const map = buildSynonymMap();
  assert.ok(Object.keys(map).length >= 30, `expected ≥30 pairs, got ${Object.keys(map).length}`);
});
```

- [ ] **Step 2: Run — verify 4 new tests fail**
```
node ats.test.js
```
Expected: `❌ js maps to javascript: buildSynonymMap is not a function`

- [ ] **Step 3: Add `buildSynonymMap` to `ats.js` — insert after the `STOP_WORDS` block, before `extractKeywords`**

```js
function buildSynonymMap() {
  return {
    'js': 'javascript', 'ts': 'typescript',
    'html5': 'html', 'css3': 'css',
    'ml': 'machine learning', 'ai': 'artificial intelligence',
    'nlp': 'natural language processing', 'cv': 'computer vision',
    'dl': 'deep learning', 'genai': 'generative ai',
    'llm': 'large language model',
    'aws': 'amazon web services', 'gcp': 'google cloud platform',
    'reactjs': 'react', 'vuejs': 'vue', 'nextjs': 'next',
    'ng': 'angular', 'angularjs': 'angular',
    'nodejs': 'node', 'expressjs': 'express',
    'psql': 'postgresql', 'pg': 'postgresql',
    'postgres': 'postgresql', 'mongo': 'mongodb',
    'k8s': 'kubernetes', 'tf': 'terraform',
    'gh': 'github', 'golang': 'go',
    'springboot': 'spring boot', 'cicd': 'continuous integration',
    'ux': 'user experience', 'ui': 'user interface',
    'oop': 'object oriented programming',
    'api': 'application programming interface',
    'sdk': 'software development kit',
    'swe': 'software engineer', 'sre': 'site reliability engineer',
    'qa': 'quality assurance', 'bi': 'business intelligence',
    'vcs': 'version control',
  };
}
```

Update `module.exports` at the bottom of `ats.js`:
```js
if (typeof module !== 'undefined') {
  module.exports = { buildSynonymMap, extractKeywords, matchKeywords, generateSuggestions, detectSections, calculateExperienceFit, calculateWeightedScore };
}
```

- [ ] **Step 4: Run — verify all pass**
```
node ats.test.js
```
Expected: all previous + 4 new pass, 0 failed

- [ ] **Step 5: Commit**
```
git add ats.js ats.test.js
git commit -m "feat: add buildSynonymMap with 38 tech alias pairs"
```

---

### Task 2: Update matchKeywords with synonym support

**Files:**
- Modify: `ats.js` (add `getSynonymsForKeyword` helper, update `matchKeywords`)
- Modify: `ats.test.js` (add 5 synonym tests after existing matchKeywords tests)

- [ ] **Step 1: Add failing tests — append into the matchKeywords section in `ats.test.js` (after the existing 4 matchKeywords tests, before `generateSuggestions`)**

```js
test('matches via synonym: JD has "javascript", resume has "JS"', () => {
  const { matched, synonymHits } = matchKeywords(['javascript'], 'I work with JS daily');
  assert.ok(matched.includes('javascript'), `expected javascript matched via JS, got ${JSON.stringify(matched)}`);
  assert.ok(synonymHits.some(h => h.keyword === 'javascript' && h.matchedAs === 'js'), `expected synonymHit, got ${JSON.stringify(synonymHits)}`);
});

test('matches via synonym: JD has "kubernetes", resume has "k8s"', () => {
  const { matched } = matchKeywords(['kubernetes'], 'experience with k8s cluster management');
  assert.ok(matched.includes('kubernetes'), `expected kubernetes matched via k8s`);
});

test('matches via synonym: JD has "machine learning", resume has "ML"', () => {
  const { matched } = matchKeywords(['machine learning'], 'Built ML pipelines for production');
  assert.ok(matched.includes('machine learning'), `expected match via ML`);
});

test('synonymHits is empty when no alias used', () => {
  const { synonymHits } = matchKeywords(['python'], 'I know Python well');
  assert.deepStrictEqual(synonymHits, []);
});

test('synonymHits field present on empty keyword input', () => {
  const result = matchKeywords([], 'any text');
  assert.ok('synonymHits' in result, 'expected synonymHits field');
  assert.deepStrictEqual(result.synonymHits, []);
});
```

- [ ] **Step 2: Run — verify 5 new tests fail**
```
node ats.test.js
```
Expected: `❌ matches via synonym: ... synonymHits is not defined`

- [ ] **Step 3: Add helper and update `matchKeywords` in `ats.js`**

Add `getSynonymsForKeyword` immediately after `buildSynonymMap`:
```js
function getSynonymsForKeyword(kw, synonymMap) {
  const variants = new Set([kw]);
  if (synonymMap[kw]) variants.add(synonymMap[kw]);
  for (const [alias, canonical] of Object.entries(synonymMap)) {
    if (canonical === kw) variants.add(alias);
  }
  return [...variants];
}
```

Replace the entire `matchKeywords` function:
```js
function matchKeywords(keywords, resumeText) {
  if (!keywords.length) return { matched: [], missing: [], synonymHits: [] };
  const synonymMap = buildSynonymMap();
  const resumeLower = resumeText.toLowerCase();
  const resumeNormWords = resumeText.toLowerCase().split(/\s+/).map(normalize).join(' ');
  const matched = [];
  const missing = [];
  const synonymHits = [];

  for (const kw of keywords) {
    const variants = getSynonymsForKeyword(kw, synonymMap);
    let found = false;
    let matchedAlias = null;

    for (const variant of variants) {
      const normVariant = variant.split(' ').map(normalize).join(' ');
      if (resumeLower.includes(variant) || resumeNormWords.includes(normVariant)) {
        found = true;
        if (variant !== kw) matchedAlias = variant;
        break;
      }
    }

    if (found) {
      matched.push(kw);
      if (matchedAlias) synonymHits.push({ keyword: kw, matchedAs: matchedAlias });
    } else {
      missing.push(kw);
    }
  }
  return { matched, missing, synonymHits };
}
```

- [ ] **Step 4: Run — verify all pass**
```
node ats.test.js
```
Expected: all previous + 5 new pass, 0 failed

- [ ] **Step 5: Commit**
```
git add ats.js ats.test.js
git commit -m "feat: synonym-aware matchKeywords (JS→javascript, k8s→kubernetes, etc.)"
```

---

### Task 3: splitRequiredPreferred

**Files:**
- Modify: `ats.js`
- Modify: `ats.test.js`

- [ ] **Step 1: Add failing tests — append before `// --- Summary ---` in `ats.test.js`**

Update `require` line:
```js
const { buildSynonymMap, extractKeywords, matchKeywords, generateSuggestions, detectSections, calculateExperienceFit, calculateWeightedScore, splitRequiredPreferred } = require('./ats.js');
```

Append before `// --- Summary ---`:
```js
// --- splitRequiredPreferred ---
console.log('\nsplitRequiredPreferred');

test('all keywords go to required when no section markers found', () => {
  const { required, preferred } = splitRequiredPreferred('Python JavaScript Docker experience');
  assert.ok(required.includes('python'), `expected python in required`);
  assert.deepStrictEqual(preferred, [], `expected empty preferred`);
});

test('splits on "Required:" and "Preferred:" headers', () => {
  const jd = 'Required:\nPython Docker\nPreferred:\nKubernetes Terraform';
  const { required, preferred } = splitRequiredPreferred(jd);
  assert.ok(required.includes('python'), `expected python in required`);
  assert.ok(preferred.includes('kubernetes'), `expected kubernetes in preferred`);
  assert.ok(!required.includes('kubernetes'), `kubernetes should not be in required`);
});

test('splits on "Must Have" and "Nice to Have"', () => {
  const jd = 'Must Have\nReact TypeScript\nNice to Have\nGraphQL Redis';
  const { required, preferred } = splitRequiredPreferred(jd);
  assert.ok(required.includes('react'), `expected react in required`);
  assert.ok(preferred.includes('graphql'), `expected graphql in preferred`);
});

test('returns arrays for empty input', () => {
  const { required, preferred } = splitRequiredPreferred('');
  assert.ok(Array.isArray(required));
  assert.ok(Array.isArray(preferred));
});
```

- [ ] **Step 2: Run — verify 4 fail**
```
node ats.test.js
```

- [ ] **Step 3: Add `splitRequiredPreferred` to `ats.js` — insert after `getSynonymsForKeyword`**

```js
function splitRequiredPreferred(jdText) {
  const requiredTriggers = /required|must have|minimum qualifications|you must|mandatory|essential/i;
  const preferredTriggers = /preferred|nice to have|bonus|plus if|desired|ideally|advantageous/i;
  const lines = jdText.split('\n');
  let currentSection = 'required';
  const requiredLines = [];
  const preferredLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const isHeading = trimmed.length <= 80 && !/^[•\-\*]/.test(trimmed);
    if (isHeading && requiredTriggers.test(trimmed)) currentSection = 'required';
    else if (isHeading && preferredTriggers.test(trimmed)) currentSection = 'preferred';
    if (currentSection === 'required') requiredLines.push(line);
    else preferredLines.push(line);
  }

  return {
    required: extractKeywords(requiredLines.join('\n')),
    preferred: extractKeywords(preferredLines.join('\n')),
  };
}
```

Update `module.exports`:
```js
if (typeof module !== 'undefined') {
  module.exports = { buildSynonymMap, extractKeywords, matchKeywords, generateSuggestions, detectSections, calculateExperienceFit, calculateWeightedScore, splitRequiredPreferred };
}
```

- [ ] **Step 4: Run — verify all pass**
```
node ats.test.js
```

- [ ] **Step 5: Commit**
```
git add ats.js ats.test.js
git commit -m "feat: add splitRequiredPreferred for JD section parsing"
```

---

### Task 4: detectHardFilters

**Files:**
- Modify: `ats.js`
- Modify: `ats.test.js`

- [ ] **Step 1: Add failing tests — append before `// --- Summary ---`**

Update `require` line:
```js
const { buildSynonymMap, extractKeywords, matchKeywords, generateSuggestions, detectSections, calculateExperienceFit, calculateWeightedScore, splitRequiredPreferred, detectHardFilters } = require('./ats.js');
```

Append before `// --- Summary ---`:
```js
// --- detectHardFilters ---
console.log('\ndetectHardFilters');

test('pass for years when resume meets requirement', () => {
  const filters = detectHardFilters('Minimum 3+ years experience required', 'I have 5 years of experience');
  const f = filters.find(f => f.label.includes('years'));
  assert.ok(f, 'expected a years filter');
  assert.strictEqual(f.status, 'pass');
});

test('fail for years when resume falls short', () => {
  const filters = detectHardFilters('Minimum 5+ years required', 'I have 2 years of experience');
  const f = filters.find(f => f.label.includes('years'));
  assert.ok(f, 'expected a years filter');
  assert.strictEqual(f.status, 'fail');
});

test('no years filter when JD has no year requirement', () => {
  const filters = detectHardFilters('Looking for a great developer', 'I have 5 years');
  assert.ok(!filters.find(f => f.label.includes('years')), 'expected no years filter');
});

test('pass for degree when resume has required degree', () => {
  const filters = detectHardFilters('Bachelor degree required', 'Bachelor of Science Computer Science');
  const f = filters.find(f => f.label.toLowerCase().includes('degree'));
  assert.ok(f, 'expected a degree filter');
  assert.strictEqual(f.status, 'pass');
});

test('fail for degree when resume lacks it', () => {
  const filters = detectHardFilters('Bachelor degree required', '5 years of hands-on experience');
  const f = filters.find(f => f.label.toLowerCase().includes('degree'));
  assert.ok(f, 'expected a degree filter');
  assert.strictEqual(f.status, 'fail');
});

test('no degree filter when JD has no degree requirement', () => {
  const filters = detectHardFilters('We value experience over credentials', 'some resume');
  assert.ok(!filters.find(f => f.label.toLowerCase().includes('degree')), 'expected no degree filter');
});

test('check status for work authorization mention', () => {
  const filters = detectHardFilters('Must be authorized to work in the US', 'Experienced developer');
  const f = filters.find(f => f.label.toLowerCase().includes('work auth'));
  assert.ok(f, 'expected work auth filter');
  assert.strictEqual(f.status, 'check');
});

test('empty array when JD has no hard requirements', () => {
  const filters = detectHardFilters('Great company culture, flexible hours', 'Experienced developer');
  assert.deepStrictEqual(filters, []);
});
```

- [ ] **Step 2: Run — verify 8 fail**
```
node ats.test.js
```

- [ ] **Step 3: Add `detectHardFilters` to `ats.js` — insert after `splitRequiredPreferred`**

```js
function detectHardFilters(jdText, resumeText) {
  const jdLower = jdText.toLowerCase();
  const resumeLower = resumeText.toLowerCase();
  const filters = [];

  const yearsMatch = jdLower.match(/(\d+)\+?\s*years?/);
  if (yearsMatch) {
    const required = parseInt(yearsMatch[1], 10);
    const resumeMatches = resumeLower.match(/(\d+)\+?\s*years?/g) || [];
    const maxFound = resumeMatches.reduce((max, m) => Math.max(max, parseInt(m, 10)), 0);
    filters.push({ label: `${required}+ years experience`, status: maxFound >= required ? 'pass' : 'fail' });
  }

  const degreeKws = ['bachelor', 'master', 'mba', 'phd', 'doctorate', 'diploma', 'degree'];
  if (degreeKws.some(d => jdLower.includes(d))) {
    filters.push({
      label: 'Degree requirement',
      status: degreeKws.some(d => resumeLower.includes(d)) ? 'pass' : 'fail',
    });
  }

  const authPhrases = ['authorized to work', 'visa sponsorship not provided', 'must be eligible', 'right to work'];
  if (authPhrases.some(p => jdLower.includes(p))) {
    filters.push({ label: 'Work authorization', status: 'check' });
  }

  return filters;
}
```

Update `module.exports`:
```js
if (typeof module !== 'undefined') {
  module.exports = { buildSynonymMap, extractKeywords, matchKeywords, generateSuggestions, detectSections, calculateExperienceFit, calculateWeightedScore, splitRequiredPreferred, detectHardFilters };
}
```

- [ ] **Step 4: Run — verify all pass**
```
node ats.test.js
```

- [ ] **Step 5: Commit**
```
git add ats.js ats.test.js
git commit -m "feat: add detectHardFilters (years, degree, work auth)"
```

---

### Task 5: detectQuantification

**Files:**
- Modify: `ats.js`
- Modify: `ats.test.js`

- [ ] **Step 1: Add failing tests — append before `// --- Summary ---`**

Update `require` line:
```js
const { buildSynonymMap, extractKeywords, matchKeywords, generateSuggestions, detectSections, calculateExperienceFit, calculateWeightedScore, splitRequiredPreferred, detectHardFilters, detectQuantification } = require('./ats.js');
```

Append before `// --- Summary ---`:
```js
// --- detectQuantification ---
console.log('\ndetectQuantification');

test('score 0 and count 0 for no metrics', () => {
  const { score, count } = detectQuantification('Experienced software engineer with skills in development');
  assert.strictEqual(count, 0);
  assert.strictEqual(score, 0);
});

test('detects percentage metrics', () => {
  const { count } = detectQuantification('Improved performance by 40% and reduced errors by 15%');
  assert.ok(count >= 2, `expected ≥2, got ${count}`);
});

test('detects dollar amounts', () => {
  const { count } = detectQuantification('Generated $500,000 in new revenue');
  assert.ok(count >= 1, `expected ≥1, got ${count}`);
});

test('detects headcount metrics', () => {
  const { count } = detectQuantification('Managed a team of 8 engineers across 3 projects');
  assert.ok(count >= 1, `expected ≥1, got ${count}`);
});

test('score caps at 100 for 5+ metrics', () => {
  const { score } = detectQuantification('Grew revenue 30%, reduced costs 20%, managed 10 engineers, saved $50,000, improved uptime 15%, led 4 projects');
  assert.strictEqual(score, 100);
});

test('returns score and count fields', () => {
  const result = detectQuantification('Any text');
  assert.ok('score' in result && 'count' in result);
});
```

- [ ] **Step 2: Run — verify 6 fail**
```
node ats.test.js
```

- [ ] **Step 3: Add `detectQuantification` to `ats.js` — insert after `detectHardFilters`**

```js
function detectQuantification(resumeText) {
  const patterns = [
    /\d+%/g,
    /\$[\d,]+/g,
    /\d+x\b/g,
    /\d+\s*(people|reports|engineers|clients|users|months|countries|stores|markets|products|projects|teams)/gi,
    /(increased|reduced|improved|grew|saved|generated)\s[^.]*\d+/gi,
  ];
  let count = 0;
  for (const pattern of patterns) {
    const hits = resumeText.match(pattern);
    if (hits) count += hits.length;
  }
  return { score: Math.min(100, count * 20), count };
}
```

Update `module.exports`:
```js
if (typeof module !== 'undefined') {
  module.exports = { buildSynonymMap, extractKeywords, matchKeywords, generateSuggestions, detectSections, calculateExperienceFit, calculateWeightedScore, splitRequiredPreferred, detectHardFilters, detectQuantification };
}
```

- [ ] **Step 4: Run — verify all pass**
```
node ats.test.js
```

- [ ] **Step 5: Commit**
```
git add ats.js ats.test.js
git commit -m "feat: add detectQuantification for resume metrics scoring"
```

---

### Task 6: Update generateSuggestions + its tests

Signature changes from `(missingKeywords, requirementsText)` to `({ requiredMissing, preferredMissing, qScore, hardFilters })`. Replace the 4 existing generateSuggestions tests with 6 new ones.

**Files:**
- Modify: `ats.js`
- Modify: `ats.test.js`

- [ ] **Step 1: Replace the entire `generateSuggestions` test block in `ats.test.js`**

Find and replace the block from `// --- generateSuggestions ---` through the last generateSuggestions test with:
```js
// --- generateSuggestions ---
console.log('\ngenerateSuggestions');

test('returns at most 5 suggestions', () => {
  const s = generateSuggestions({ requiredMissing: ['java','kubernetes','docker','terraform','python','golang'], preferredMissing: ['rust'], qScore: 100, hardFilters: [] });
  assert.ok(s.length <= 5, `expected ≤5, got ${s.length}`);
});

test('suggestion text contains the missing required keyword', () => {
  const s = generateSuggestions({ requiredMissing: ['kubernetes'], preferredMissing: [], qScore: 100, hardFilters: [] });
  assert.ok(s[0].toLowerCase().includes('kubernetes'), `got: ${s[0]}`);
});

test('returns empty array when nothing missing and qScore high', () => {
  assert.deepStrictEqual(generateSuggestions({ requiredMissing: [], preferredMissing: [], qScore: 100, hardFilters: [] }), []);
});

test('surfaces hard filter fail as first suggestion', () => {
  const s = generateSuggestions({ requiredMissing: [], preferredMissing: [], qScore: 100, hardFilters: [{ label: '5+ years experience', status: 'fail' }] });
  assert.ok(s[0].toLowerCase().includes('5+ years experience'), `got: ${s[0]}`);
});

test('includes quantification suggestion when qScore < 40', () => {
  const s = generateSuggestions({ requiredMissing: [], preferredMissing: [], qScore: 20, hardFilters: [] });
  assert.ok(s.some(x => x.toLowerCase().includes('measurable')), `got: ${JSON.stringify(s)}`);
});

test('labels preferred missing keywords differently from required', () => {
  const s = generateSuggestions({ requiredMissing: [], preferredMissing: ['graphql'], qScore: 100, hardFilters: [] });
  assert.ok(s.some(x => x.toLowerCase().includes('preferred')), `got: ${JSON.stringify(s)}`);
});
```

- [ ] **Step 2: Run — verify ~4 fail (old signature)**
```
node ats.test.js
```

- [ ] **Step 3: Replace `generateSuggestions` in `ats.js`**

```js
function generateSuggestions({ requiredMissing = [], preferredMissing = [], qScore = 100, hardFilters = [] } = {}) {
  const suggestions = [];

  for (const filter of hardFilters) {
    if (filter.status === 'fail') {
      suggestions.push(`Address first: you may not meet the "${filter.label}" requirement`);
    }
  }

  for (const kw of requiredMissing.slice(0, 3)) {
    if (suggestions.length >= 5) break;
    suggestions.push(`Add "${kw}" — it's in the required section of this JD`);
  }

  if (qScore < 40 && suggestions.length < 5) {
    suggestions.push('Add measurable achievements (e.g. "reduced load time by 30%") — recruiters expect metrics');
  }

  for (const kw of preferredMissing.slice(0, 2)) {
    if (suggestions.length >= 5) break;
    suggestions.push(`Consider adding "${kw}" — it's a preferred qualification`);
  }

  return suggestions.slice(0, 5);
}
```

- [ ] **Step 4: Run — verify all pass**
```
node ats.test.js
```

- [ ] **Step 5: Commit**
```
git add ats.js ats.test.js
git commit -m "feat: update generateSuggestions with recruiter-framed output"
```

---

### Task 7: Update calculateWeightedScore

New formula: `((K*0.50) + (S*0.15) + (E*0.20) + (Q*0.15)) * 0.96`. New signature uses `requiredKeywords`/`preferredKeywords`. Replace the 5 existing calculateWeightedScore tests with 6 new ones.

**Files:**
- Modify: `ats.js`
- Modify: `ats.test.js`

- [ ] **Step 1: Replace the entire `calculateWeightedScore` test block in `ats.test.js`**

Find and replace the block from `// --- calculateWeightedScore ---` through the last calculateWeightedScore test with:
```js
// --- calculateWeightedScore ---
console.log('\ncalculateWeightedScore');

test('returns total between 0 and 100', () => {
  const result = calculateWeightedScore({
    requiredKeywords: ['javascript', 'react'], preferredKeywords: [],
    resumeText: 'I know JavaScript and React. Experience section. Education section. Skills section.',
    jobTitle: 'Frontend Developer',
    jobRequirements: 'javascript react developer 2 years experience',
  });
  assert.ok(result.total >= 0 && result.total <= 100, `got ${result.total}`);
});

test('returns k, s, e, q sub-scores', () => {
  const result = calculateWeightedScore({
    requiredKeywords: ['javascript'], preferredKeywords: [],
    resumeText: 'JavaScript developer', jobTitle: 'Developer',
    jobRequirements: 'javascript developer',
  });
  ['k','s','e','q','total'].forEach(key => assert.ok(key in result, `missing ${key}`));
});

test('returns requiredMatched, requiredMissing, preferredMatched, preferredMissing', () => {
  const result = calculateWeightedScore({
    requiredKeywords: ['javascript'], preferredKeywords: ['docker'],
    resumeText: 'JavaScript developer', jobTitle: 'Developer',
    jobRequirements: 'javascript docker developer',
  });
  assert.ok(result.requiredMatched.includes('javascript'));
  assert.ok(result.preferredMissing.includes('docker'));
});

test('perfect resume scores at most 96', () => {
  const resume = 'Experience\nEducation\nSkills\nJan 2020\n• Built systems\nSoftware Engineer\njavascript react python many real words to pass garbling check. Increased revenue 30%, reduced costs 20%, managed 5 engineers, saved $50,000.';
  const result = calculateWeightedScore({
    requiredKeywords: ['javascript', 'react', 'python'], preferredKeywords: [],
    resumeText: resume, jobTitle: 'Software Engineer',
    jobRequirements: 'javascript react python software engineer experience required',
  });
  assert.ok(result.total <= 96, `expected ≤96, got ${result.total}`);
});

test('all-zero inputs score 0', () => {
  const result = calculateWeightedScore({ requiredKeywords: [], preferredKeywords: [], resumeText: '', jobTitle: '', jobRequirements: '' });
  assert.strictEqual(result.total, 0);
});

test('applies formula: total = ((k*0.50 + s*0.15 + e*0.20 + q*0.15) * 0.96)', () => {
  const result = calculateWeightedScore({
    requiredKeywords: ['javascript'], preferredKeywords: [],
    resumeText: 'Experience\nEducation\nSkills\nJan 2020 - Dec 2022\n• bullet point here\nSoftware Engineer role\nI have javascript skills and many real dictionary words present in this document',
    jobTitle: 'Engineer', jobRequirements: 'javascript engineer experience needed',
  });
  const expected = Math.min(100, Math.round(((result.k * 0.50) + (result.s * 0.15) + (result.e * 0.20) + (result.q * 0.15)) * 0.96));
  assert.strictEqual(result.total, expected, `formula mismatch: got ${result.total}, expected ${expected}`);
});
```

- [ ] **Step 2: Run — verify ~5 fail**
```
node ats.test.js
```

- [ ] **Step 3: Replace `calculateWeightedScore` in `ats.js`**

```js
function calculateWeightedScore({ requiredKeywords = [], preferredKeywords = [], resumeText, jobTitle, jobRequirements }) {
  if (!resumeText || !jobRequirements) {
    return { total: 0, k: 0, s: 0, e: 0, q: 0, requiredMatched: [], requiredMissing: [], preferredMatched: [], preferredMissing: [], synonymHits: [] };
  }

  const { matched: requiredMatched, missing: requiredMissing, synonymHits: reqHits } = matchKeywords(requiredKeywords, resumeText);
  const { matched: preferredMatched, missing: preferredMissing, synonymHits: prefHits } = matchKeywords(preferredKeywords, resumeText);
  const synonymHits = [...reqHits, ...prefHits];

  const rk = requiredKeywords.length === 0 ? 100 : Math.round((requiredMatched.length / requiredKeywords.length) * 100);
  const pk = preferredKeywords.length === 0 ? 100 : Math.round((preferredMatched.length / preferredKeywords.length) * 100);
  const k = Math.round(rk * 0.70 + pk * 0.30);

  const { count: sCount } = detectSections(resumeText);
  const s = Math.round((sCount / 7) * 100);

  const { score: e } = calculateExperienceFit(resumeText, jobRequirements, jobTitle);
  const { score: q } = detectQuantification(resumeText);

  const total = Math.min(100, Math.round(((k * 0.50) + (s * 0.15) + (e * 0.20) + (q * 0.15)) * 0.96));

  return { total, k, s, e, q, requiredMatched, requiredMissing, preferredMatched, preferredMissing, synonymHits };
}
```

Update `module.exports` (final):
```js
if (typeof module !== 'undefined') {
  module.exports = { buildSynonymMap, extractKeywords, matchKeywords, generateSuggestions, detectSections, calculateExperienceFit, calculateWeightedScore, splitRequiredPreferred, detectHardFilters, detectQuantification };
}
```

- [ ] **Step 4: Run — verify all pass**
```
node ats.test.js
```

- [ ] **Step 5: Commit**
```
git add ats.js ats.test.js
git commit -m "feat: update calculateWeightedScore — required/preferred split, Q sub-score, new formula"
```

---

### Task 8: Update index.html — results panel

Input panel is untouched. Only the `<style>` block, the results HTML, and the `<script>` block change.

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add new CSS — insert into the `<style>` block before the closing `</style>` tag**

```css
/* Hard filters */
.hard-filters { background: #1e293b; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; }
.hard-filters h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; margin-bottom: 10px; }
.filter-row { display: flex; align-items: center; gap: 8px; font-size: 13px; padding: 4px 0; }
.filter-icon { width: 16px; text-align: center; }
.filter-label { flex: 1; color: #94a3b8; }
.filter-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border-radius: 999px; }
.badge-pass { background: rgba(34,197,94,0.15); color: #4ade80; }
.badge-fail { background: rgba(239,68,68,0.15); color: #f87171; }
.badge-check { background: rgba(245,158,11,0.15); color: #fbbf24; }
.at-risk-banner { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.3); border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; font-size: 12px; color: #fbbf24; }
.pills-grey .pill { background: rgba(100,116,139,0.15); color: #94a3b8; }
.kw-empty { font-size: 12px; color: #475569; }
```

- [ ] **Step 2: Replace the `results-content` div in `index.html`**

Replace from `<div id="results-content"` through its closing `</div>` (before `</section>`) with:
```html
<div id="results-content" class="results-state hidden">
  <div id="at-risk-banner" class="at-risk-banner hidden">
    ⚠ At Risk — you may not pass the recruiter's hard filters
  </div>
  <div id="hard-filters" class="hard-filters hidden">
    <h3>Hard Filters</h3>
    <div id="filter-rows"></div>
  </div>
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
  <div class="subscores">
    <div class="subscore-card">
      <div class="subscore-label">Keyword Match</div>
      <div id="subscore-k" class="subscore-value">—</div>
      <div class="subscore-weight">50% of score</div>
    </div>
    <div class="subscore-card">
      <div class="subscore-label">Structure</div>
      <div id="subscore-s" class="subscore-value">—</div>
      <div class="subscore-weight">15% of score</div>
    </div>
    <div class="subscore-card">
      <div class="subscore-label">Experience Fit</div>
      <div id="subscore-e" class="subscore-value">—</div>
      <div class="subscore-weight">20% of score</div>
    </div>
    <div class="subscore-card">
      <div class="subscore-label">Quantification</div>
      <div id="subscore-q" class="subscore-value">—</div>
      <div class="subscore-weight">15% of score</div>
    </div>
  </div>
  <div class="keywords-section">
    <h3>Required — Matched</h3>
    <div id="required-matched" class="pills pills-green"></div>
    <h3>Required — Missing</h3>
    <div id="required-missing" class="pills pills-red"></div>
    <h3>Preferred — Matched</h3>
    <div id="preferred-matched" class="pills pills-green"></div>
    <h3>Preferred — Missing</h3>
    <div id="preferred-missing" class="pills pills-grey"></div>
  </div>
  <div class="suggestions-section">
    <h3>Suggestions</h3>
    <ol id="suggestions-list"></ol>
  </div>
</div>
```

- [ ] **Step 3: Update DOM refs in the `<script>` block**

Replace the DOM refs block (from `// DOM refs — results` through `const subscoreE`) with:
```js
// DOM refs — results
const resultsEmpty   = document.getElementById('results-empty');
const resultsLoading = document.getElementById('results-loading');
const resultsContent = document.getElementById('results-content');
const scoreRing      = document.getElementById('score-ring');
const scorePct       = document.getElementById('score-pct');
const scoreLabel     = document.getElementById('score-label');
const suggList       = document.getElementById('suggestions-list');
const subscoreK      = document.getElementById('subscore-k');
const subscoreS      = document.getElementById('subscore-s');
const subscoreE      = document.getElementById('subscore-e');
const subscoreQ      = document.getElementById('subscore-q');
const atRiskBanner     = document.getElementById('at-risk-banner');
const hardFiltersEl    = document.getElementById('hard-filters');
const filterRowsEl     = document.getElementById('filter-rows');
const requiredMatchedEl  = document.getElementById('required-matched');
const requiredMissingEl  = document.getElementById('required-missing');
const preferredMatchedEl = document.getElementById('preferred-matched');
const preferredMissingEl = document.getElementById('preferred-missing');
```

- [ ] **Step 4: Replace the `analyzeBtn.addEventListener('click', ...)` handler**

```js
analyzeBtn.addEventListener('click', async () => {
  analyzeBtn.disabled = true;
  showResults('loading');
  await new Promise(r => setTimeout(r, 50));

  const requirements = jobReqs.value;
  const jobTitle = jobTitleInput.value;
  const { required: requiredKeywords, preferred: preferredKeywords } = splitRequiredPreferred(requirements);
  const hardFilters = detectHardFilters(requirements, resumeText);
  const { total, k, s, e, q, requiredMatched, requiredMissing, preferredMatched, preferredMissing, synonymHits } =
    calculateWeightedScore({ requiredKeywords, preferredKeywords, resumeText, jobTitle, jobRequirements: requirements });
  const suggestions = generateSuggestions({ requiredMissing, preferredMissing, qScore: q, hardFilters });

  renderResults({ score: total, k, s, e, q, requiredMatched, requiredMissing, preferredMatched, preferredMissing, synonymHits, suggestions, hardFilters });
  showResults('content');
  analyzeBtn.disabled = false;
});
```

- [ ] **Step 5: Replace the `renderResults` function**

```js
function renderResults({ score, k, s, e, q, requiredMatched, requiredMissing, preferredMatched, preferredMissing, synonymHits, suggestions, hardFilters }) {
  const circumference = 314;
  scoreRing.style.strokeDashoffset = circumference * (1 - score / 100);
  const color = score >= 85 ? '#22c55e' : score >= 70 ? '#f59e0b' : score >= 50 ? '#f97316' : '#ef4444';
  scoreRing.style.stroke = color;
  scorePct.textContent = score;
  const band = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Average' : 'Poor';
  scoreLabel.textContent = band;
  scoreLabel.style.color = color;

  subscoreK.textContent = k + '%';
  subscoreS.textContent = s + '%';
  subscoreE.textContent = e + '%';
  subscoreQ.textContent = q + '%';

  const hasFail = hardFilters.some(f => f.status === 'fail');
  atRiskBanner.classList.toggle('hidden', !hasFail);
  if (hardFilters.length > 0) {
    hardFiltersEl.classList.remove('hidden');
    filterRowsEl.innerHTML = '';
    hardFilters.forEach(f => {
      const row = document.createElement('div');
      row.className = 'filter-row';
      const iconEl = document.createElement('span');
      iconEl.className = 'filter-icon';
      iconEl.textContent = f.status === 'pass' ? '✓' : f.status === 'fail' ? '✗' : '⚠';
      const labelEl = document.createElement('span');
      labelEl.className = 'filter-label';
      labelEl.textContent = f.label;
      const badgeEl = document.createElement('span');
      badgeEl.className = `filter-badge badge-${f.status}`;
      badgeEl.textContent = f.status === 'pass' ? 'PASS' : f.status === 'fail' ? 'FAIL' : 'CHECK';
      row.appendChild(iconEl);
      row.appendChild(labelEl);
      row.appendChild(badgeEl);
      filterRowsEl.appendChild(row);
    });
  } else {
    hardFiltersEl.classList.add('hidden');
  }

  const synonymLookup = {};
  synonymHits.forEach(({ keyword, matchedAs }) => { synonymLookup[keyword] = matchedAs; });

  function renderPills(container, keywords, emptyMsg) {
    container.innerHTML = '';
    if (!keywords.length) {
      const span = document.createElement('span');
      span.className = 'kw-empty';
      span.textContent = emptyMsg;
      container.appendChild(span);
      return;
    }
    keywords.forEach(kw => {
      const span = document.createElement('span');
      span.className = 'pill';
      span.textContent = synonymLookup[kw] ? `${synonymLookup[kw]} → ${kw}` : kw;
      container.appendChild(span);
    });
  }

  renderPills(requiredMatchedEl, requiredMatched, 'None matched');
  renderPills(requiredMissingEl, requiredMissing, 'None missing');
  renderPills(preferredMatchedEl, preferredMatched, preferredMatched.length === 0 && preferredMissing.length === 0 ? 'No preferred section detected' : 'None matched');
  renderPills(preferredMissingEl, preferredMissing, 'None missing');

  suggList.innerHTML = '';
  suggestions.forEach(sg => {
    const li = document.createElement('li');
    li.textContent = sg;
    suggList.appendChild(li);
  });
}
```

- [ ] **Step 6: Run all tests — verify no regressions**
```
node ats.test.js
```
Expected: all tests pass, 0 failed

- [ ] **Step 7: Manual test in browser**

Open `index.html` in a browser. Test these cases:
1. **JD with required/preferred sections** — paste a JD containing "Required:" and "Preferred:" sections. Verify keywords split into two groups.
2. **Synonym match** — use a JD mentioning "JavaScript" and a resume with "JS experience". Verify "JS → javascript" appears as a green pill.
3. **Hard filter fail** — JD with "5+ years required", resume with "2 years experience". Verify red FAIL badge and "At Risk" banner appear.
4. **Hard filter pass** — same JD, resume with "6 years experience". Verify green PASS badge.
5. **Work auth** — JD with "must be authorized to work". Verify amber CHECK badge.
6. **Quantification** — resume with no numbers scores low Q (20%), resume with 5+ metrics scores Q=100%.
7. **No preferred section** — JD with no section markers. Preferred keyword sections show "No preferred section detected".

- [ ] **Step 8: Commit**
```
git add index.html
git commit -m "feat: recruiter lens UI — hard filters, 4 sub-scores, required/preferred keyword split, synonym pills"
```
