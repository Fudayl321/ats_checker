const STOP_WORDS = new Set([
  'the','and','a','an','to','in','of','for','with','is','are','that','this',
  'it','be','as','at','by','we','you','or','on','not','but','from','have',
  'has','will','can','your','our','their','its','was','were','been','being',
  'do','does','did','about','into','they','he','she','who','which','what',
  'when','where','how','all','any','both','each','more','most','other','some',
  'such','than','then','these','those','up','out','no','only','same','so',
  'over','also','well','just','should','must','may','might','would','could',
]);

function extractKeywords(text) {
  if (!text || !text.trim()) return [];
  const words = text.toLowerCase().split(/\s+/);
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

function matchKeywords(keywords, resumeText) {
  if (!keywords.length) return { matched: [], missing: [] };
  const resumeLower = resumeText.toLowerCase();
  const resumeNormWords = resumeText.toLowerCase().split(/\s+/).map(normalize).join(' ');
  const matched = [];
  const missing = [];

  for (const kw of keywords) {
    const normKw = kw.split(' ').map(normalize).join(' ');
    if (resumeLower.includes(kw) || resumeNormWords.includes(normKw)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }
  return { matched, missing };
}

function calculateScore(matchedCount, totalCount) {
  if (totalCount === 0) return 0;
  return Math.round((matchedCount / totalCount) * 100);
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

if (typeof module !== 'undefined') {
  module.exports = { extractKeywords, matchKeywords, calculateScore, generateSuggestions, detectSections };
}
