# ATS Score Checker — Project Plan

## Task 1: ATS Score Checker — initial build

**Status:** Completed

**Approach:** Single `index.html` + `ats.js` scoring functions + `ats.test.js` tests. Browser-only, no backend, no API key. Split panel layout — inputs left, results right. pdf.js + mammoth.js from CDN for file parsing.

**Files to change:**
- `index.html` — markup, CSS, UI event wiring
- `ats.js` — pure scoring functions (extractKeywords, matchKeywords, calculateScore, generateSuggestions)
- `ats.test.js` — 18 Node.js unit tests (all passing)

**Last session:** 2026-06-01 — full implementation complete; 18/18 tests passing; spec and plan docs in place

**Spec:** `docs/superpowers/specs/2026-06-01-ats-checker-design.md`

---

## Task 2: Weighted ATS Formula upgrade

**Status:** Completed

**Approach:** Replaced `calculateScore()` with `calculateWeightedScore()` using formula `((K×0.60)+(S×0.20)+(E×0.20))×0.96`. Added `detectSections()` (7 structure checks) and `calculateExperienceFit()` (5 fit checks). Updated `index.html` to show K/S/E sub-score cards and 4-band benchmark label. XSS-safe DOM rendering.

**Files to change:**
- `ats.js` — added detectSections, calculateExperienceFit, calculateWeightedScore; removed calculateScore
- `ats.test.js` — 37 tests (removed 5 calculateScore tests, added 18 new)
- `index.html` — sub-score cards CSS+HTML, updated analyzeBtn handler, new renderResults with 85/70/50 bands

**Last session:** 2026-06-01 — full weighted formula implementation; 37/37 tests passing; XSS-safe rendering

**Spec:** `docs/superpowers/specs/2026-06-01-weighted-ats-formula-design.md`

---

## Task 3: Update matchKeywords with synonym support

**Status:** Completed

**Approach:** Add `getSynonymsForKeyword()` helper function that returns all canonical and alias forms of a keyword. Update `matchKeywords()` to check all synonym variants and return a new `synonymHits` field containing keyword/matchedAs pairs when a match occurs via an alias.

**Files to change:**
- `ats.js` — add `getSynonymsForKeyword` helper, update `matchKeywords` to add `synonymHits` field to return object
- `ats.test.js` — add 5 new synonym tests after existing matchKeywords tests

**Last session:** 2026-06-01 — TDD approach: added 5 failing tests, implemented `getSynonymsForKeyword` and updated `matchKeywords`; 48/48 tests passing (original 43 + 5 new synonym tests)

**Spec:** `docs/superpowers/plans/2026-06-01-weighted-ats-formula.md` (synonym support section)

---

## Task 3: splitRequiredPreferred

**Status:** Completed

**Approach:** Implement `splitRequiredPreferred(jdText)` function that parses JD text into required and preferred sections by detecting heading markers (Required/Must Have/Mandatory vs Preferred/Nice to Have/Bonus). Returns object with `required` and `preferred` arrays of extracted keywords.

**Files to change:**
- `ats.js` — add `splitRequiredPreferred` function and export it
- `ats.test.js` — add 4 new tests before "// --- Summary ---"

**Last session:** 2026-06-01 — TDD: added 4 failing tests (no section markers, Required/Preferred split, Must Have/Nice to Have split, empty input), implemented function; 53/53 tests passing

**Spec:** task description in this session

---

## Task 4: detectHardFilters (with correctness fixes)

**Status:** Completed

**Approach:** Implement `detectHardFilters(jdText, resumeText)` function that detects hard requirements (years of experience, degree, work authorization) in JD and checks resume against them. Returns array of filter objects with label and status (pass/fail/check). Fixed two correctness issues: (1) replaced substring matching on degree keywords with word-boundary regex to avoid false positives on "mastered", "master data", etc; (2) removed "must be eligible" from work auth phrases (too generic, matches non-auth contexts like "eligible for promotion").

**Files to change:**
- `ats.js` — add `detectHardFilters` function with regex-based degree detection and tightened auth phrases
- `ats.test.js` — 8 tests for detectHardFilters plus 1 regression test for "mastered" false positive

**Last session:** 2026-06-01 — Fixed "master" substring false positives with word-boundary regex; removed generic "must be eligible" from authPhrases; added regression test; 69/69 tests passing

**Spec:** task description in this session
