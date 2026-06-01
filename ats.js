const STOP_WORDS = new Set([
  // Articles, conjunctions, prepositions
  'the','and','a','an','to','in','of','for','with','is','are','that','this',
  'it','be','as','at','by','we','you','or','on','not','but','from','have',
  'has','will','can','your','our','their','its','was','were','been','being',
  'do','does','did','about','into','they','he','she','who','which','what',
  'when','where','how','all','any','both','each','more','most','other','some',
  'such','than','then','these','those','up','out','no','only','same','so',
  'over','also','well','just','should','must','may','might','would','could',
  'per','via','yet','still','even','among','across','within','through','upon',
  'whether','while','although','since','until','unless','however','therefore',

  // Quantity / degree words
  'very','much','many','several','various','every','few','lot','lots','enough',
  'quite','rather','almost','nearly','highly','fully','truly','really','simply',
  'easily','quickly','efficiently','effectively','directly','actively',

  // Common filler adjectives (not skills)
  'good','great','nice','big','small','new','old','own','real','true',
  'full','whole','main','key','top','best','high','low','right','left',
  'strong','ideal','perfect','excellent','outstanding','exceptional','dynamic',
  'exciting','innovative','fast','growing','leading','established','motivated',
  'passionate','dedicated','talented','skilled','experienced','qualified',

  // JD-specific filler verbs
  'looking','seeking','ensure','please','start','make','join','help','need',
  'use','using','provide','support','apply','come','take','bring','put','set',
  'try','keep','let','give','get','got','want','like','love','know','see',
  'say','tell','ask','show','include','require','offer','drive','able','go',

  // JD context nouns (not skills)
  'role','team','company','opportunity','position','candidate','applicant',
  'employer','employee','business','organization','department','environment',
  'culture','mission','vision','value','values','goal','goals','responsibility',
  'responsibilities','benefit','benefits','package','salary','compensation',

  // Tense / status markers
  'now','today','soon','current','currently','recent','recently','previously',
  'ongoing','immediate','immediately','asap',

  // Soft filler often appearing in JDs
  'etc','eg','ie','plus','bonus','preferred','required','desired','optional',

  // Generic action verbs (not technical skills)
  'identify','perform','become','participate','communicate','contribute','attend',
  'resolve','adhere','adapt','abreast','prepare','present','report','assist',
  'coordinate','maintain','handle','process','complete','update','schedule',

  // Generic descriptors and adverbs
  'oriented','focused','driven','based','related','overall','written','verbal',
  'oral','clearly','accurately','properly','consistently','proactively','thoroughly',
  'proficient','successful','encouraged','paced','cross','self','detailed',
  'appropriate','appropriately','potential','internal','external','general',

  // Generic JD nouns (not skills)
  'information','activities','tasks','satisfaction','commitment','willingness',
  'passion','career','trend','year','individuals','members','ability','summary',
  'resolution','templates','solutions','deliverables','requirements','specifications',
]);

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
    'psql': 'postgresql',
    'postgres': 'postgresql', 'mongo': 'mongodb',
    'k8s': 'kubernetes',
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

function getSynonymsForKeyword(kw, synonymMap) {
  const variants = new Set([kw]);
  if (synonymMap[kw]) variants.add(synonymMap[kw]);
  for (const [alias, canonical] of Object.entries(synonymMap)) {
    if (canonical === kw) variants.add(alias);
  }
  return [...variants];
}

function extractKeywords(text) {
  if (!text || !text.trim()) return [];
  const words = text.toLowerCase().split(/[\s\-–—\/]+/); // split on whitespace, hyphens, dashes, slashes
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

function isVariantInText(variant, text) {
  if (variant.length <= 3 && !variant.includes(' ')) {
    return new RegExp('\\b' + variant + '\\b').test(text);
  }
  return text.includes(variant);
}

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
      if (isVariantInText(variant, resumeLower) || isVariantInText(normVariant, resumeNormWords)) {
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

function generateSuggestions(missingKeywords, requirementsText) {
  if (!missingKeywords.length) return [];
  const reqLower = requirementsText.toLowerCase();
  const freq = kw => (reqLower.match(new RegExp(kw.split(' ')[0], 'g')) || []).length;
  return [...missingKeywords]
    .sort((a, b) => freq(b) - freq(a))
    .slice(0, 5)
    .map(kw => `Consider adding "${kw}" — it appears in the job requirements`);
}

function detectSections(resumeText) {
  const text = resumeText.toLowerCase();
  const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l);

  const checks = {
    hasExperience: /experience|work history|employment/i.test(text),
    hasEducation: /education|academic|qualification/i.test(text),
    hasSkills: /skills|technical|competenc/i.test(text),
    hasDates: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december|20\d\d|19\d\d)\b/i.test(text),
    hasBullets: lines.some(l => /^[•\-\*]/.test(l)),
    hasJobTitles: lines.some(l => {
      const words = l.split(/\s+/);
      return words.length >= 2 && words.length <= 6 && /^[A-Z]/.test(l);
    }),
    noGarbling: (() => {
      const allTokens = text.split(/\s+/).filter(t => t.length > 0);
      const wordLike = allTokens.filter(t => /[a-z]/.test(t));
      if (wordLike.length === 0) return false;
      const realWords = wordLike.filter(t => /^[a-z]{2,}$/.test(t));
      return (realWords.length / wordLike.length) > 0.70;
    })(),
  };

  const found = Object.entries(checks).filter(([, v]) => v).map(([k]) => k);
  return { count: found.length, found };
}

function calculateExperienceFit(resumeText, jobRequirements, jobTitle) {
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jobRequirements.toLowerCase();
  const passed = [];

  // Check 1: Education level
  const degreeKws = ['bachelor', 'master', 'mba', 'phd', 'doctorate', 'diploma', 'degree'];
  const jdHasDegree = degreeKws.some(d => jdLower.includes(d));
  if (!jdHasDegree || degreeKws.some(d => resumeLower.includes(d))) passed.push('education');

  // Check 2: Years of experience
  const yearsMatch = jdLower.match(/(\d+)\+?\s*years?/);
  if (!yearsMatch) {
    passed.push('years');
  } else {
    const required = parseInt(yearsMatch[1], 10);
    const resumeYearMatches = resumeLower.match(/(\d+)\+?\s*years?/g) || [];
    const maxFound = resumeYearMatches.reduce((max, m) => {
      const n = parseInt(m, 10);
      return n > max ? n : max;
    }, 0);
    if (maxFound >= required) passed.push('years');
  }

  // Check 3: Overlapping tools (≥30% keyword overlap)
  const jdKeywords = extractKeywords(jobRequirements);
  if (jdKeywords.length === 0) {
    passed.push('tools');
  } else {
    const { matched } = matchKeywords(jdKeywords, resumeText);
    if (matched.length / jdKeywords.length >= 0.30) passed.push('tools');
  }

  // Check 4: Relevant job title
  const titleWords = (jobTitle || '').toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/[^a-z]/g, ''))
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w));
  if (titleWords.length === 0 || titleWords.some(w => resumeLower.includes(w))) passed.push('title');

  // Check 5: Industry background (≥1 industry noun from JD in resume)
  const industryNouns = jdKeywords.filter(kw => !kw.includes(' ') && kw.length >= 4);
  if (industryNouns.length === 0) {
    passed.push('industry');
  } else {
    const { matched: indMatched } = matchKeywords(industryNouns, resumeText);
    if (indMatched.length >= 1) passed.push('industry');
  }

  return { score: Math.round((passed.length / 5) * 100), passed };
}

function calculateWeightedScore({ keywords, resumeText, jobTitle, jobRequirements }) {
  if (!resumeText || !jobRequirements) return { total: 0, k: 0, s: 0, e: 0 };

  const { matched } = matchKeywords(keywords, resumeText);
  const k = keywords.length === 0 ? 0 : Math.round((matched.length / keywords.length) * 100);

  const { count: sCount } = detectSections(resumeText);
  const s = Math.round((sCount / 7) * 100);

  const { score: e } = calculateExperienceFit(resumeText, jobRequirements, jobTitle);

  const total = Math.min(100, Math.round(((k * 0.60) + (s * 0.20) + (e * 0.20)) * 0.96));

  return { total, k, s, e };
}

function splitRequiredPreferred(jdText) {
  const requiredTriggers = /required|must have|minimum qualifications|you must|mandatory|essential/i;
  const preferredTriggers = /preferred|nice to have|bonus|plus if|desired|ideally|advantageous/i;
  const headingMatch = /^(required|must have|minimum qualifications|you must|mandatory|essential|preferred|nice to have|bonus|plus if|desired|ideally|advantageous)[:\s]*$/i;
  const lines = jdText.split('\n');
  let currentSection = 'required';
  const requiredLines = [];
  const preferredLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (headingMatch.test(trimmed)) {
      if (requiredTriggers.test(trimmed)) currentSection = 'required';
      else if (preferredTriggers.test(trimmed)) currentSection = 'preferred';
    }
    if (currentSection === 'required') requiredLines.push(line);
    else preferredLines.push(line);
  }

  return {
    required: extractKeywords(requiredLines.join('\n')),
    preferred: extractKeywords(preferredLines.join('\n')),
  };
}

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

if (typeof module !== 'undefined') {
  module.exports = { buildSynonymMap, extractKeywords, matchKeywords, generateSuggestions, detectSections, calculateExperienceFit, calculateWeightedScore, splitRequiredPreferred, detectHardFilters, detectQuantification };
}
