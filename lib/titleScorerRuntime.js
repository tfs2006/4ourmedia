// Viral Title Scorer engine. 100% deterministic, zero network calls, no AI.
// Shared by the browser client and the Vercel serverless API.
// Scoring is grounded in classic direct-response headline principles:
// Caples (numbers and headline testing), Schwab (headline must offer a reward),
// Collier (curiosity gap), Ogilvy (clarity and research).

const WEIGHTS = {
  length: 10,
  number: 12,
  curiosity: 20,
  powerWords: 15,
  bracket: 5,
  benefit: 15,
  specificity: 13,
  craft: 10,
};

const POWER_WORDS = [
  'free', 'new', 'secret', 'secrets', 'proven', 'shocking', 'ultimate',
  'easy', 'fast', 'hidden', 'insane', 'truth', 'mistake', 'mistakes',
  'hack', 'hacks', 'exact', 'formula', 'blueprint', 'guaranteed',
  'instantly', 'powerful', 'never', 'warning', 'exposed', 'revealed',
  'insider', 'elite', 'dominate', 'skyrocket', 'effortless', 'painless',
];

const STRONG_LOOPS = [
  'what happened next', "you won't believe", 'you wont believe',
  'wait until', 'watch till the end', 'watch until the end',
  'the real reason', 'nobody talks about', 'gone wrong',
];

const MEDIUM_LOOPS = [
  'here is', "here's", 'the truth about', 'what nobody tells you',
  'nobody tells you', 'what i learned', 'i tried', 'i tested',
  'i studied', 'for 30 days', 'in 30 days',
];

const OUTCOME_WORDS = [
  'get', 'make', 'grow', 'build', 'learn', 'earn', 'save', 'stop',
  'start', 'master', 'double', 'triple', 'boost', 'increase', 'formula',
  'blueprint', 'system', 'method', 'guide', 'plan', 'checklist',
  'framework', 'strategy',
];

const FILLER_WORDS = new Set([
  'video', 'videos', 'vlog', 'vlogs', 'things', 'stuff', 'amazing',
  'awesome', 'cool', 'nice', 'update', 'random', 'episode', 'part',
]);

const STOPWORDS = new Set([
  'i', 'me', 'my', 'a', 'an', 'the', 'and', 'or', 'to', 'of', 'in',
  'on', 'for', 'is', 'are', 'was', 'were', 'it', 'this', 'that',
  'with', 'here', 'how', 'what', 'why', 'you', 'your', 'youre',
  'do', 'does', 'did', 'they', 'he', 'she', 'we', 'at', 'by',
  'from', 'as', 'be', 'so', 'if', 'then', 'than', 'too', 'very',
  'just', 'about', 'into', 'out', 'up', 'my',
]);

const CLICKBAIT_PHRASES = [
  "you won't believe", 'you wont believe', 'gone wrong', 'gone wild',
  'shocking ending', 'must watch',
];

function countEmojis(text) {
  const matches = text.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu);
  return matches ? matches.length : 0;
}

function wordsOf(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function ruleLength(title) {
  const len = title.trim().length;
  let score = 0;
  let tip;
  if (len === 0) {
    score = 0;
    tip = 'Add a title first. Empty titles score nothing.';
  } else if (len >= 40 && len <= 60) {
    score = 100;
    tip = `${len} characters sits right in the 40 to 60 sweet spot. Nothing gets truncated.`;
  } else if ((len >= 30 && len < 40) || (len > 60 && len <= 70)) {
    score = 70;
    tip = `${len} characters is close to ideal. Aim for 40 to 60 for maximum impact.`;
  } else if ((len >= 20 && len < 30) || (len > 70 && len <= 85)) {
    score = 40;
    tip = len < 30
      ? `${len} characters is short. Longer titles carry more hooks and keywords.`
      : `${len} characters risks truncation on mobile. Tighten it toward 60.`;
  } else {
    score = 15;
    tip = len < 20
      ? `${len} characters is too short to promise anything specific.`
      : `${len} characters will get cut off in search and feeds. Cut it down.`;
  }
  return { score, tip };
}

function ruleNumber(title) {
  const match = title.match(/\d[\d.,]*/);
  if (!match) {
    return { score: 0, tip: 'No number. Caples proved numbers pull attention, odd and specific ones most of all.' };
  }
  const raw = match[0];
  const specific = raw.length > 1 || raw.includes('.') || raw.includes(',');
  return {
    score: specific ? 100 : 60,
    tip: specific
      ? `"${raw}" is specific, and specific numbers beat round ones.`
      : 'A number helps, but a specific one (7, 30, 1.1M) pulls harder than a round one.',
  };
}

function ruleCuriosity(title) {
  const lower = title.toLowerCase();
  const hasQuestion = title.includes('?');
  const strong = STRONG_LOOPS.find((p) => lower.includes(p));
  const medium = MEDIUM_LOOPS.find((p) => lower.includes(p));
  if (strong) {
    return { score: 100, tip: `"${strong}" opens a loop the viewer has to close by clicking.` };
  }
  if (medium) {
    return { score: 85, tip: `"${medium}" creates a curiosity gap. Pair it with a specific promise for full marks.` };
  }
  if (hasQuestion) {
    return { score: 70, tip: 'A question engages the reader, but an open loop with a promised payoff scores higher.' };
  }
  return { score: 0, tip: 'No curiosity gap. Ask a question or open a loop the viewer needs to close.' };
}

function rulePowerWords(title) {
  const words = new Set(wordsOf(title));
  const hits = POWER_WORDS.filter((w) => words.has(w));
  if (hits.length === 0) {
    return { score: 0, tip: 'No power words. Words like secret, proven, exact, or ultimate add emotional pull.' };
  }
  if (hits.length === 1) {
    return { score: 50, tip: `"${hits[0]}" adds pull. One more power word would strengthen this.` };
  }
  if (hits.length === 2) {
    return { score: 85, tip: `"${hits[0]}" and "${hits[1]}" give this title real emotional charge.` };
  }
  return { score: 100, tip: `Stacked power words (${hits.slice(0, 3).join(', ')}) give this strong emotional pull.` };
}

function ruleBracket(title) {
  const hit = /\[.*?\]|\(.*?\)/.test(title);
  return hit
    ? { score: 100, tip: 'The bracketed hook adds a second headline that catches scanners.' }
    : { score: 0, tip: 'No bracket hook. A [New] or (2026) style tag can lift click-through.' };
}

function ruleBenefit(title) {
  const lower = title.toLowerCase();
  if (lower.includes('how to')) {
    return { score: 100, tip: '"How to" is the clearest benefit promise in headlines.' };
  }
  if (/\byou\b|\byour\b|\byou're\b/.test(lower)) {
    return { score: 70, tip: 'Speaking directly to "you" makes the benefit personal.' };
  }
  const outcome = OUTCOME_WORDS.find((w) => new RegExp(`\\b${w}\\b`).test(lower));
  if (outcome) {
    return { score: 65, tip: `"${outcome}" implies a concrete outcome. Make the payoff even more explicit.` };
  }
  return { score: 20, tip: 'The benefit is unclear. Tell the viewer what they get: how to, you, or a concrete outcome.' };
}

function ruleSpecificity(title) {
  const words = wordsOf(title);
  const fillers = words.filter((w) => FILLER_WORDS.has(w));
  let score = 75;
  if (fillers.length > 0) {
    score = Math.max(0, score - 25 * fillers.length);
  }
  const longWords = words.filter((w) => w.length >= 6 && !FILLER_WORDS.has(w)).length;
  if (longWords >= 2 && fillers.length === 0) score = Math.min(100, score + 25);
  let tip;
  if (fillers.length > 0) {
    tip = `"${[...new Set(fillers)].join('", "')}" ${fillers.length === 1 ? 'is' : 'are'} vague filler. Swap in specific nouns.`;
  } else if (score >= 90) {
    tip = 'Concrete and specific. Named details beat generic hype every time.';
  } else {
    tip = 'Fairly specific. Named numbers, niches, or timeframes would sharpen it.';
  }
  return { score, tip };
}

function ruleCraft(title) {
  const issues = [];
  let score = 100;
  const capsLong = (title.match(/\b[A-Z]{5,}\b/g) || []).length;
  const capsShort = (title.match(/\b[A-Z]{3,}\b/g) || []).length;
  if (capsLong >= 1 || capsShort >= 2) {
    score -= 25;
    issues.push('ALL CAPS words read as shouting');
  }
  const bangs = (title.match(/!/g) || []).length;
  if (bangs > 1) {
    score -= 15;
    issues.push('more than one exclamation mark looks desperate');
  }
  const emojis = countEmojis(title);
  if (emojis > 2) {
    score -= 15;
    issues.push('more than two emojis clutters the title');
  }
  const lower = title.toLowerCase();
  const clickbait = CLICKBAIT_PHRASES.find((p) => lower.includes(p));
  if (clickbait && title.trim().length < 30) {
    score -= 20;
    issues.push(`"${clickbait}" with no substance reads as empty clickbait`);
  }
  score = Math.max(0, score);
  return {
    score,
    tip: issues.length === 0
      ? 'Clean craft. No shouting, no clutter, no empty clickbait.'
      : `Craft issues: ${issues.join('; ')}.`,
  };
}

const RULES = [
  { id: 'length', label: 'Length', fn: ruleLength },
  { id: 'number', label: 'Number Hook', fn: ruleNumber },
  { id: 'curiosity', label: 'Curiosity Gap', fn: ruleCuriosity },
  { id: 'powerWords', label: 'Power Words', fn: rulePowerWords },
  { id: 'bracket', label: 'Bracket Hook', fn: ruleBracket },
  { id: 'benefit', label: 'Benefit Clarity', fn: ruleBenefit },
  { id: 'specificity', label: 'Specificity', fn: ruleSpecificity },
  { id: 'craft', label: 'Craft', fn: ruleCraft },
];

function scoreTitleOnly(title) {
  const clean = (title || '').trim();
  const breakdown = RULES.map(({ id, label, fn }) => {
    const { score, tip } = fn(clean);
    const weight = WEIGHTS[id];
    return {
      id,
      label,
      score,
      weight,
      points: Math.round((score / 100) * weight),
      tip,
    };
  });
  const score = breakdown.reduce((sum, r) => sum + r.points, 0);
  return { score: Math.max(0, Math.min(100, score)), breakdown };
}

function extractKeywords(title) {
  const seen = new Set();
  const out = [];
  for (const w of wordsOf(title)) {
    if (w.length < 4 && !/\d/.test(w)) continue;
    if (STOPWORDS.has(w)) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  // Prefer real words over bare numbers, then longest first. Deterministic.
  out.sort((a, b) => {
    const aNum = /\d/.test(a) ? 1 : 0;
    const bNum = /\d/.test(b) ? 1 : 0;
    if (aNum !== bNum) return aNum - bNum;
    return b.length - a.length || (a < b ? -1 : 1);
  });
  return out.slice(0, 4);
}

// Best topic phrase: the longest adjacent pair of non-stopword terms in
// title order. "exact formula" beats two unrelated long words.
function extractTopic(title, keywords) {
  const words = wordsOf(title).filter((w) => !STOPWORDS.has(w) && (w.length >= 3 || /\d/.test(w)));
  let best = null;
  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i];
    const b = words[i + 1];
    const combined = a.length + b.length;
    if (!best || combined > best.combined || (combined === best.combined && i > best.index)) {
      best = { combined, index: i, phrase: `${cap(a)} ${cap(b)}` };
    }
  }
  if (best) return best.phrase;
  return cap(keywords[0] || 'Your Niche');
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function buildCandidates(title, keywords, topic) {
  const fallback = cap(keywords[1] || keywords[0] || 'Your Niche');
  const contrast = fallback.toLowerCase() === topic.toLowerCase() ? 'Doing Nothing' : fallback;
  const list = [
    `How to ${topic} Without the Guesswork`,
    `7 ${topic} Tricks That Double Your Views`,
    `I Tried ${topic} for 30 Days. Here Is What Happened`,
    `The Uncomfortable Truth About ${topic}`,
    `Why Most ${topic} Advice Is Wrong`,
    `${topic} vs ${contrast}: Which One Wins?`,
    `Stop Doing ${topic}. Do This Instead`,
    `What Nobody Tells You About ${topic}`,
    `5 ${topic} Mistakes That Kill Your Growth`,
    `The ${topic} System I Use Every Day`,
  ];
  // Bracket booster: keep their title, add the hook scanners love.
  if (!/\[.*?\]|\(.*?\)/.test(title)) {
    list.push(`${title.trim()} [Full Breakdown]`);
  }
  return list;
}

function suggestTitles(title, count = 3) {
  const keywords = extractKeywords(title);
  const topic = extractTopic(title, keywords);
  const candidates = buildCandidates(title, keywords, topic);
  const scored = candidates.map((candidate, index) => ({
    title: candidate,
    score: scoreTitleOnly(candidate).score,
    index,
  }));
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.slice(0, count).map(({ title: t, score }) => ({ title: t, score }));
}

export function scoreTitle(title) {
  const clean = (title || '').trim();
  if (!clean) {
    return { score: 0, breakdown: [], suggestions: [] };
  }
  const { score, breakdown } = scoreTitleOnly(clean);
  const suggestions = suggestTitles(clean, 3);
  return { score, breakdown, suggestions };
}

export const TITLE_SCORER_WEIGHTS = WEIGHTS;
