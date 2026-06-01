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
