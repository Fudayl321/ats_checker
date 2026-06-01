const assert = require('assert');
const { extractKeywords, matchKeywords, calculateScore, generateSuggestions, detectSections } = require('./ats.js');

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

// --- detectSections ---
console.log('\ndetectSections');

test('detects experience section', () => {
  const { found } = detectSections('Work Experience\nSoftware Engineer at Acme 2020-2023');
  assert.ok(found.includes('hasExperience'), `expected hasExperience, got ${JSON.stringify(found)}`);
});

test('detects education section', () => {
  const { found } = detectSections('Education\nBachelor of Science, Computer Science');
  assert.ok(found.includes('hasEducation'), `expected hasEducation, got ${JSON.stringify(found)}`);
});

test('detects skills section', () => {
  const { found } = detectSections('Skills\nJavaScript, React, Node.js');
  assert.ok(found.includes('hasSkills'), `expected hasSkills, got ${JSON.stringify(found)}`);
});

test('detects dates', () => {
  const { found } = detectSections('Software Engineer, Jan 2020 - Dec 2023');
  assert.ok(found.includes('hasDates'), `expected hasDates, got ${JSON.stringify(found)}`);
});

test('detects bullet points', () => {
  const { found } = detectSections('• Built microservices\n• Led team of 5');
  assert.ok(found.includes('hasBullets'), `expected hasBullets, got ${JSON.stringify(found)}`);
});

test('returns count matching found array length', () => {
  const { count, found } = detectSections('Experience\nEducation\nSkills');
  assert.strictEqual(count, found.length, `count ${count} should equal found.length ${found.length}`);
});

// --- Summary ---
console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
