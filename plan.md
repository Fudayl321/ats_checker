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
