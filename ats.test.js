const assert = require('assert');
const { buildSynonymMap, extractKeywords, matchKeywords, generateSuggestions, detectSections, calculateExperienceFit, calculateWeightedScore } = require('./ats.js');

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

test('filters out JD filler words', () => {
  const kws = extractKeywords('We are looking for a great candidate to join our team and please ensure you apply now');
  const fillers = ['looking','great','candidate','join','team','please','ensure','apply','now'];
  fillers.forEach(w => assert.ok(!kws.includes(w), `"${w}" should be filtered out`));
});

test('splits hyphenated words and filters filler halves', () => {
  const kws = extractKeywords('detail-oriented self-motivated fast-paced on-the-job');
  const noise = ['detailoriented','selfmotivated','fastpaced','onthejob','oriented','self','paced','motivated'];
  noise.forEach(w => assert.ok(!kws.includes(w), `"${w}" should not appear`));
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

test('short alias does not match as substring of unrelated word', () => {
  const { matched } = matchKeywords(['angular'], 'training engineers with interesting backgrounds');
  assert.deepStrictEqual(matched, [], `'ng' should not match inside "training"/"interesting", got ${JSON.stringify(matched)}`);
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

test('detects job titles (short capitalised line)', () => {
  const { found } = detectSections('Software Engineer\nBuilt APIs and led projects.');
  assert.ok(found.includes('hasJobTitles'), `expected hasJobTitles, got ${JSON.stringify(found)}`);
});

test('passes noGarbling check for clean text', () => {
  const { found } = detectSections('I am a software engineer with experience in building web applications and services');
  assert.ok(found.includes('noGarbling'), `expected noGarbling, got ${JSON.stringify(found)}`);
});

test('fails noGarbling check for garbled text', () => {
  const { found } = detectSections('₁₂₃ ╗ ⌂ ╬ ║ ║ ╦ ╔ ≈ √ ≤ ≥ ≠ ∞ ∑ ∏ ∂');
  assert.ok(!found.includes('noGarbling'), `expected noGarbling to fail on garbled text, got ${JSON.stringify(found)}`);
});

// --- calculateExperienceFit ---
console.log('\ncalculateExperienceFit');

test('education check passes when resume has matching degree keyword', () => {
  const { passed } = calculateExperienceFit(
    'Bachelor of Science in Computer Science',
    'Required: bachelor degree in relevant field',
    'Software Engineer'
  );
  assert.ok(passed.includes('education'), `expected education in passed, got ${JSON.stringify(passed)}`);
});

test('education check passes when JD has no degree requirement', () => {
  const { passed } = calculateExperienceFit(
    'I worked as a developer for 5 years',
    'Looking for an experienced developer',
    'Developer'
  );
  assert.ok(passed.includes('education'), `expected education to pass when JD has no degree req`);
});

test('years check passes when resume meets JD requirement', () => {
  const { passed } = calculateExperienceFit(
    'I have 7 years of experience in software development',
    'Minimum 5 years of experience required',
    'Engineer'
  );
  assert.ok(passed.includes('years'), `expected years in passed, got ${JSON.stringify(passed)}`);
});

test('years check fails when resume years fall short', () => {
  const { passed } = calculateExperienceFit(
    'I have 2 years of experience',
    'Minimum 5 years of experience required',
    'Engineer'
  );
  assert.ok(!passed.includes('years'), `expected years to fail, got ${JSON.stringify(passed)}`);
});

test('years check passes by default when JD has no year requirement', () => {
  const { passed } = calculateExperienceFit(
    'I have been working in tech',
    'Looking for a skilled developer',
    'Developer'
  );
  assert.ok(passed.includes('years'), `expected years to pass by default`);
});

test('title check passes when job title word appears in resume', () => {
  const { passed } = calculateExperienceFit(
    'Senior Software Engineer at Acme Corp',
    'We need an engineer with React skills',
    'Software Engineer'
  );
  assert.ok(passed.includes('title'), `expected title in passed, got ${JSON.stringify(passed)}`);
});

test('score is 0 to 100', () => {
  const { score } = calculateExperienceFit('no relevant content at all xyz', 'phd required 10 years machine learning kubernetes', 'Quantum Physicist');
  assert.ok(score >= 0 && score <= 100, `expected 0–100, got ${score}`);
});

test('education check fails when JD requires degree and resume has none', () => {
  const { passed } = calculateExperienceFit(
    'I have 5 years of experience building software applications',
    'Bachelor degree required for this position',
    'Engineer'
  );
  assert.ok(!passed.includes('education'), `expected education to fail, got ${JSON.stringify(passed)}`);
});

test('tools check passes when resume has 30%+ keyword overlap with JD', () => {
  const { passed } = calculateExperienceFit(
    'I have JavaScript, React, Node.js, developer experience building web applications',
    'Looking for JavaScript React developer with Node.js experience',
    'Developer'
  );
  assert.ok(passed.includes('tools'), `expected tools in passed, got ${JSON.stringify(passed)}`);
});

test('industry check passes when at least one JD industry noun appears in resume', () => {
  const { passed } = calculateExperienceFit(
    'Experienced in healthcare data systems and patient management',
    'Looking for developer with healthcare experience in clinical systems',
    'Developer'
  );
  assert.ok(passed.includes('industry'), `expected industry in passed, got ${JSON.stringify(passed)}`);
});

// --- calculateWeightedScore ---
console.log('\ncalculateWeightedScore');

test('returns total between 0 and 100', () => {
  const result = calculateWeightedScore({
    keywords: ['javascript', 'react'],
    resumeText: 'I know JavaScript and React. Experience section. Education section. Skills section.',
    jobTitle: 'Frontend Developer',
    jobRequirements: 'Looking for javascript react developer with 2 years experience'
  });
  assert.ok(result.total >= 0 && result.total <= 100, `expected 0–100, got ${result.total}`);
});

test('returns k, s, e sub-scores', () => {
  const result = calculateWeightedScore({
    keywords: ['javascript'],
    resumeText: 'JavaScript developer',
    jobTitle: 'Developer',
    jobRequirements: 'javascript developer'
  });
  assert.ok('k' in result, 'missing k');
  assert.ok('s' in result, 'missing s');
  assert.ok('e' in result, 'missing e');
  assert.ok('total' in result, 'missing total');
});

test('perfect resume scores at most 96 (buffer applied)', () => {
  const resume = 'Experience\nEducation\nSkills\nJan 2020\n• bullet\nSoftware Engineer role\nI know javascript react python docker kubernetes and more real words here to pass garbling check with many dictionary words present throughout the document content section';
  const result = calculateWeightedScore({
    keywords: ['javascript', 'react', 'python'],
    resumeText: resume,
    jobTitle: 'Software Engineer',
    jobRequirements: 'javascript react python software engineer experience required'
  });
  assert.ok(result.total <= 96, `expected ≤96 due to 0.96 buffer, got ${result.total}`);
});

test('all-zero inputs score 0', () => {
  const result = calculateWeightedScore({
    keywords: [],
    resumeText: '',
    jobTitle: '',
    jobRequirements: ''
  });
  assert.strictEqual(result.total, 0);
});

test('applies formula: total ≈ ((k*0.60 + s*0.20 + e*0.20) * 0.96)', () => {
  const result = calculateWeightedScore({
    keywords: ['javascript'],
    resumeText: 'Experience\nEducation\nSkills\nJan 2020 - Dec 2022\n• bullet point here\nSoftware Engineer role\nI have javascript skills and many more real dictionary words present in this document',
    jobTitle: 'Engineer',
    jobRequirements: 'javascript engineer experience needed'
  });
  const expected = Math.min(100, Math.round(((result.k * 0.60) + (result.s * 0.20) + (result.e * 0.20)) * 0.96));
  assert.strictEqual(result.total, expected, `formula mismatch: got ${result.total}, expected ${expected}`);
});

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

// --- Summary ---
console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
