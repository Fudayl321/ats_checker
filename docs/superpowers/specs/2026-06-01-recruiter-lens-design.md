# Recruiter Lens Upgrade — Design Spec

**Date:** 2026-06-01  
**Status:** Approved

## Overview

Upgrade the ATS checker from a single-score tool into a recruiter-lens simulator. The job hunter sees the same checklist a recruiter runs: hard filters (pass/fail), required vs preferred keyword split, synonym-aware matching, and a quantification score. All browser-only, no API key.

## Goals

1. Fix synonym blindness — "JS" must match "JavaScript"
2. Split JD keywords into required vs preferred, weighted differently
3. Simulate hard-filter knockout criteria (years, degree, work auth)
4. Add quantification scoring — recruiters expect metrics on resumes

## Non-Goals

- No backend, no API key, no persistence
- No batch/multi-resume mode
- No candidate pipeline or dashboard

## Architecture

Two files change: `ats.js` (logic) and `index.html` (results panel). Input panel is untouched.

### New functions in `ats.js`

#### `buildSynonymMap()`
Returns a static lookup object mapping aliases to canonical terms. Used during keyword matching.

Key pairs (~50 total):
- Tech: `js → javascript`, `ts → typescript`, `css3 → css`, `html5 → html`
- AI/ML: `ml → machine learning`, `ai → artificial intelligence`, `nlp → natural language processing`, `cv → computer vision`, `dl → deep learning`
- Cloud: `aws → amazon web services`, `gcp → google cloud platform`, `az → azure`
- Frameworks: `react → reactjs`, `ng → angular`, `vue → vuejs`, `next → nextjs`
- Databases: `psql → postgresql`, `pg → postgresql`, `mongo → mongodb`
- DevOps: `k8s → kubernetes`, `tf → terraform`, `ci → continuous integration`, `cd → continuous deployment`
- Other: `ux → user experience`, `ui → user interface`, `api → application programming interface`, `sdk → software development kit`, `oop → object oriented programming`, `swe → software engineer`, `pm → product manager`, `ba → business analyst`

Matching logic: normalize both JD keyword and resume text through the synonym map before comparison. A hit on either the alias or canonical counts as matched. The map is bidirectional — if the JD says "JavaScript" and the resume says "JS", or vice versa, it's a hit.

#### `splitRequiredPreferred(jdText)`
Parses JD text to return `{ required: string[], preferred: string[] }` keyword arrays.

Detection strategy:
- Split JD into lines
- Track current section: default = "required"
- Required section triggers: lines containing "required", "must have", "minimum qualifications", "you must", "mandatory", "essential"
- Preferred section triggers: lines containing "preferred", "nice to have", "bonus", "plus if", "desired", "ideally", "advantageous"
- Apply `extractKeywords()` to each section's text independently
- If no section markers found: all keywords go to required (safe default — treats everything as critical)

#### `detectHardFilters(jdText, resumeText)`
Returns `Array<{ label: string, status: 'pass' | 'fail' | 'check' }>` — 3 checks:

1. **Years of experience**
   - Extract `(\d+)\+?\s*years?` from JD
   - Extract all year mentions from resume, take maximum
   - Pass if resume max ≥ required, fail if not. If JD has no year requirement, omit this check from the returned array entirely.

2. **Degree requirement**
   - Detect degree keywords in JD: `bachelor`, `master`, `mba`, `phd`, `doctorate`, `diploma`, `degree`
   - Check resume for same keywords
   - Pass if resume has a matching or higher degree, fail if not. If JD has no degree requirement, omit from the returned array entirely.

3. **Work authorization**
   - Detect phrases in JD: `authorized to work`, `visa sponsorship not provided`, `must be eligible`, `right to work`
   - If found: always return `status: 'check'` with label "Work Auth — verify manually"
   - If not found: omit from the returned array entirely. Hard Filters block is hidden when the returned array is empty.

#### `detectQuantification(resumeText)`
Returns `{ score: number, count: number }`.

Regex patterns to match:
- `\d+%` — percentages
- `\$[\d,]+` — dollar amounts
- `\d+x` — multipliers
- `\d+\s*(people|reports|engineers|clients|users|months|countries|stores|markets|products|projects|teams)` — headcount/scope
- `(increased|reduced|improved|grew|saved|generated)\s.*\d+` — achievement verbs with numbers

Score formula: `Math.min(100, count * 20)` — 5 or more quantified achievements = 100%.

#### Updated `matchKeywords(keywords, resumeText)`
Return type changes from `{ matched: string[], missing: string[] }` to `{ matched: string[], missing: string[], synonymHits: Array<{ keyword: string, matchedAs: string }> }`.

Add synonym expansion:
- For each JD keyword, check if the resume contains the keyword itself OR any known synonym/alias of it
- When a synonym match is found, add to `synonymHits` as `{ keyword: 'javascript', matchedAs: 'js' }` and also add `keyword` to `matched`
- `synonymHits` is used by the UI to render the alias label on matched pills (e.g. "JS → JavaScript")

#### Updated `calculateWeightedScore()`

New signature: `calculateWeightedScore({ requiredKeywords, preferredKeywords, resumeText, jobTitle, jobRequirements })`

Sub-scores:
- **K** (keyword): `requiredMatch * 0.70 + preferredMatch * 0.30` — required keywords weighted 70%
- **S** (structure): unchanged — `detectSections()` / 7 checks
- **E** (experience fit): unchanged — `calculateExperienceFit()`
- **Q** (quantification): `detectQuantification().score`

Formula: `total = Math.min(100, Math.round(((K*0.50) + (S*0.15) + (E*0.20) + (Q*0.15)) * 0.96))`

Returns: `{ total, k, s, e, q, requiredMatched, requiredMissing, preferredMatched, preferredMissing, synonymHits }`

### Updated results panel in `index.html`

#### Hard Filters block (new, top of results)
- Only shown if at least one filter applies
- Each row: icon + label + status badge
  - Pass: green checkmark `✓`
  - Fail: red cross `✗` with red badge "FAIL"
  - Check: amber warning `⚠` with amber badge "CHECK MANUALLY"
- If a FAIL exists, show an amber banner: "At Risk — you may not pass the recruiter's hard filters"

#### Score ring + label
Unchanged layout. Score band labels unchanged (Excellent/Good/Average/Poor).

#### Sub-score cards
4 cards (was 3): Keyword Match (50%), Structure (15%), Experience Fit (20%), Quantification (15%).

#### Keyword sections (split)
- **Required Keywords** — matched shown as green pills, missing shown as red pills
- **Preferred Keywords** — matched shown as green pills, missing shown as grey pills (not red — they are not critical)
- Synonym hits shown with alias label: pill text = "JS → JavaScript"

#### Suggestions
Top 5, reworded for recruiter framing:
- Missing required keyword: `'Add "[kw]" — it's in the required section of this JD'`
- Missing preferred keyword: `'Consider adding "[kw]" — it's a preferred qualification'`
- Low Q score (< 40): `'Add measurable achievements (e.g. "reduced load time by 30%") — recruiters expect metrics'`
- Hard filter fail: `'You may be missing the required [degree/years] — address this first'`

## Scoring Formula Comparison

| Component | Old weight | New weight | Change |
|---|---|---|---|
| Keyword (K) | 60% | 50% | Required 70% / preferred 30% split within K |
| Structure (S) | 20% | 15% | Reduced to make room for Q |
| Experience (E) | 20% | 20% | Unchanged |
| Quantification (Q) | — | 15% | New |

## Testing

`ats.test.js` additions:
- `buildSynonymMap`: verify JS→javascript, ML→machine learning
- `splitRequiredPreferred`: JD with clear sections, JD with no sections (all required)
- `detectHardFilters`: pass/fail/check for each of the 3 checks
- `detectQuantification`: resume with 0, 3, 5+ metrics
- `matchKeywords` synonym: JD has "JavaScript", resume has "JS" → matched
- `calculateWeightedScore`: updated signature, Q included in total

Target: all existing 37 tests still pass + ~20 new tests.

## Files Changed

- `ats.js` — 4 new functions, 2 updated functions
- `index.html` — results panel restructured (hard filters block, 4 sub-score cards, split keyword sections, updated suggestions)
- `ats.test.js` — ~20 new tests
