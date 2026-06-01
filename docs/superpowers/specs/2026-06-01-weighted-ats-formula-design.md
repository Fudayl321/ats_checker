# Weighted ATS Formula — Design Spec

**Date:** 2026-06-01  
**Status:** Approved

---

## Overview

Replace the current simple keyword-ratio score with the Weighted ATS Match Formula:

```
ATS Score = ((K × 0.60) + (S × 0.20) + (E × 0.20)) × 0.96
```

The `× 0.96` is a conservative buffer for ATS platform variance.

---

## Goals

- Score resumes across three dimensions: keyword match, structure quality, and experience fit
- Show users the sub-score breakdown so they know exactly what to improve
- Keep everything in plain JS — no backend, no API

---

## Formula Components

### K — Keyword Match Score (60%)

```
K = (keywords found in resume / total keywords in JD) × 100
```

Unchanged from the current implementation. Uses `extractKeywords` + `matchKeywords`.

---

### S — Structure Score (20%)

```
S = (passed structure checks / 7) × 100
```

Seven checks run against the resume text:

| # | Check | Detection method |
|---|-------|-----------------|
| 1 | Has Experience / Work History section | Case-insensitive search for `experience` or `work history` |
| 2 | Has Education section | Search for `education` or `academic` |
| 3 | Has Skills section | Search for `skills` or `technical` |
| 4 | Has consistent date formatting | Regex: month names or 4-digit years (`\b(jan\|feb\|...\|20\d\d\|19\d\d)\b`) |
| 5 | Has bullet points | Lines starting with `•`, `-`, or `*` |
| 6 | Has clear job titles | Short lines (≤ 6 words) that are capitalised or ALL CAPS |
| 7 | No broken formatting | Ratio of dictionary-like words (letters only, 2+ chars) to total tokens > 0.70 |

---

### E — Experience Fit Score (20%)

```
E = (passed fit checks / 5) × 100
```

Five checks run against both the resume text and job description:

| # | Check | Detection method |
|---|-------|-----------------|
| 1 | Education level match | Degree keywords (`bachelor`, `master`, `mba`, `phd`, `doctorate`, `diploma`, `degree`) present in both JD and resume |
| 2 | Years of experience | Regex `\d+\+?\s*years?` in JD extracts required years; resume must contain a number ≥ that value |
| 3 | Overlapping tools / technologies | Top non-stop keywords from JD found in resume (reuses `matchKeywords`) — passes if ≥ 30% overlap |
| 4 | Relevant job title / role | Each word from the job title input (3+ chars, non-stop) found in resume text |
| 5 | Industry background | Industry nouns from JD (4+ char non-stop words not in a common-tools exclusion list) found in resume — passes if ≥ 1 match |

---

## Final Score Calculation

```js
total = Math.round(((K * 0.60) + (S * 0.20) + (E * 0.20)) * 0.96)
```

Capped at 100.

---

## Score Bands

| Score | Result |
|-------|--------|
| 85 – 100 | ✅ Excellent — strong pass |
| 70 – 84 | 🟡 Good — likely to pass |
| 50 – 69 | 🟠 Average — needs work |
| Below 50 | 🔴 Poor — major rework needed |

---

## Architecture

### `ats.js` changes

**New functions:**
- `detectSections(resumeText)` → `{ count, found[] }` — runs the 7 structure checks, returns count of passed and array of check names that passed
- `calculateExperienceFit(resumeText, jobRequirements, jobTitle)` → `{ score, passed[] }` — runs the 5 experience fit checks
- `calculateWeightedScore({ keywords, resumeText, jobTitle, jobRequirements })` → `{ total, k, s, e }` — assembles all three sub-scores and applies the weighted formula

**Removed:**
- `calculateScore(matchedCount, totalCount)` — replaced by `calculateWeightedScore`

**Unchanged:**
- `extractKeywords(text)`
- `matchKeywords(keywords, resumeText)`
- `generateSuggestions(missingKeywords, requirementsText)`
- `module.exports` updated to export new functions, remove old one

### `index.html` changes

**Script block:**
- `analyzeBtn` click handler calls `calculateWeightedScore({ keywords, resumeText, jobTitle, jobRequirements })` instead of `calculateScore`
- `renderResults(score, matched, missing, suggestions)` gains `k`, `s`, `e` parameters
- Sub-score cards rendered in a new `.subscores` div between the score ring and keyword pills

**CSS:**
- `.subscores` — flex row, three equal cards
- `.subscore-card` — label, value (bold), weight hint (small muted text)
- Benchmark label colour follows score band: green / yellow / orange / red

### `ats.test.js` changes

- Remove tests for `calculateScore`
- Add tests for `detectSections`, `calculateExperienceFit`, `calculateWeightedScore`

---

## Error Handling

- If `jobTitle` is empty: `Jm`-equivalent check in E (check 4) automatically scores 0 for that check — no crash
- If resume has no parseable text: all checks score 0 — already caught upstream by `handleFile`
- If JD has no year-of-experience mention: years check (E check 2) passes by default (can't penalise what isn't stated)

---

## Non-Goals

- No semantic understanding — all checks are pattern/regex based
- No storing or comparing scores across sessions
- No per-check explanations in the UI (just the three sub-scores)
