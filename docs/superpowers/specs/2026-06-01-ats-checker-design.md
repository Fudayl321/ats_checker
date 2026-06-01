# ATS Score Checker — Design Spec

**Date:** 2026-06-01  
**Status:** Approved

---

## Overview

A standalone website where users upload their resume, enter a job title and job requirements, and instantly receive an ATS (Applicant Tracking System) compatibility score with keyword analysis and improvement suggestions.

No backend, no API key, no cost. Everything runs in the browser.

---

## Goals

- Let users check how well their resume matches a specific job posting
- Show exactly which keywords are matched and which are missing
- Give actionable suggestions to improve the resume
- Work for free, forever — no server, no account, no cost

---

## Non-Goals

- No user accounts or saved history
- No AI/LLM-based analysis
- No old `.doc` format support (impractical to parse in browser)
- No email or PDF export of results

---

## Architecture

**Single file:** `ats-checker/index.html`  
All HTML, CSS, and JavaScript are inline in one file. No build step, no npm, no server required. Can be opened locally or deployed to any static host (GitHub Pages, Netlify free tier).

**CDN libraries (no install):**
- `pdf.js` (Mozilla) — extracts text from PDF files in the browser
- `mammoth.js` — extracts text from DOCX files in the browser
- Native `FileReader` API for TXT files

**Data flow:**
1. User uploads resume file → browser reads it → library extracts plain text
2. User enters job title + job requirements text
3. User clicks "Analyze Resume"
4. JS tokenizes requirements → extracts keywords → scans resume text → calculates score
5. Results rendered in right panel immediately (no network call)

---

## Scoring Algorithm

### Keyword Extraction (from job requirements)

1. Split requirements text into words
2. Remove stop words (`the`, `and`, `a`, `to`, `in`, `of`, `for`, `with`, `is`, `are`, `that`, `this`, etc.)
3. Deduplicate and lowercase
4. Also extract 2-word phrases (bigrams) for compound terms like "project management" or "machine learning"

### Matching (against resume text)

- Case-insensitive exact match against full resume text
- Plural/singular normalisation: strip trailing `s` before comparing
- Bigrams checked as a unit first; unmatched bigrams fall back to individual word checks

### Score Calculation

```
ATS Score = (matched keywords / total keywords) × 100
```

Capped at 100%. Color-coded:
- **0–49%** → red ring — "Low Match"
- **50–74%** → yellow ring — "Partial Match"  
- **75–100%** → green ring — "Good Match"

### Suggestions

- Each missing keyword generates one suggestion: *"Consider adding '[keyword]' — it appears in the job requirements"*
- Top 5 missing keywords shown, sorted by frequency in the job requirements (most frequent = highest priority)

---

## UI Layout

### Split Panel (side by side, stacks on mobile)

**Left panel — Inputs:**
- Drag-and-drop upload zone (click or drop) accepting `.pdf`, `.docx`, `.txt`
- Uploaded filename shown with a clear/remove (×) button
- Job Title text input
- Job Requirements textarea (~6 rows)
- "Analyze Resume" button — disabled until both file and job requirements are filled

**Right panel — Results (3 states):**

| State | Content |
|-------|---------|
| Empty | Subtle placeholder: "Your results will appear here" |
| Loading | Spinner while file is parsed |
| Results | Score ring + keyword lists + suggestions |

**Results breakdown:**
1. **ATS Score** — large circular ring gauge with percentage and label
2. **Matched Keywords** — green pills, one per matched keyword
3. **Missing Keywords** — red/orange pills, one per missing keyword
4. **Suggestions** — numbered list of up to 5 tips

### Styling

- Dark theme: `#0f172a` background, `#1e293b` panels
- Accent color: indigo `#6366f1`
- Clean sans-serif font (system font stack)
- Fully responsive — single column on mobile

---

## Supported File Formats

| Format | Library | Notes |
|--------|---------|-------|
| `.pdf` | `pdf.js` (CDN) | Extracts all text layers |
| `.docx` | `mammoth.js` (CDN) | Extracts body text, ignores formatting |
| `.txt` | Native `FileReader` | Read as plain text |

---

## Error Handling

- Unsupported file type → show inline error: "Please upload a PDF, DOCX, or TXT file"
- File parse failure → show inline error: "Could not read this file. Try saving as a different format."
- Empty job requirements → "Analyze" button stays disabled
- Empty resume text after parse → show inline error: "No text found in this file. Try a different format."

---

## Deployment

The finished `index.html` can be:
- Opened directly in any browser (double-click)
- Pushed to GitHub and hosted on GitHub Pages (free)
- Dropped into Netlify drag-and-drop deploy (free)

No environment variables, no server config, no build step.

---

## File Structure

```
ats-checker/
└── index.html   ← the entire app
```
