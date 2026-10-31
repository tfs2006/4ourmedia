// Viral Script Builder engine. 100% deterministic, zero network calls, no AI.
// Shared by the browser client and the Vercel serverless API.
// Hook in, full short-form script out: hook, setup, 3 escalating beats,
// payoff, CTA, plus a suggested title and hashtags.
// Structure follows proven short-form pacing: the hook lands in the first
// 3 seconds, beats escalate in threes, the payoff closes the open loop.

const STOPWORDS = new Set([
  'i', 'me', 'my', 'a', 'an', 'the', 'and', 'or', 'to', 'of', 'in',
  'on', 'for', 'is', 'are', 'was', 'were', 'it', 'this', 'that',
  'with', 'here', 'how', 'what', 'why', 'you', 'your', 'youre',
  'do', 'does', 'did', 'they', 'he', 'she', 'we', 'at', 'by',
  'from', 'as', 'be', 'so', 'if', 'then', 'than', 'too', 'very',
  'just', 'about', 'into', 'out', 'up', 'my', 'video', 'videos',
  'vlog', 'things', 'stuff', 'guide', 'tutorial',
]);

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick(arr, seed, salt) {
  return arr[(seed + salt * 7919) % arr.length];
}

function cap(s) {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function extractKeywords(topic) {
  const seen = new Set();
  const out = [];
  const words = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  for (const w of words) {
    if (!seen.has(w)) {
      seen.add(w);
      out.push(w);
    }
    if (out.length >= 5) break;
  }
  return out;
}

function fill(template, kws) {
  return template
    .replace(/\{kw1\}/g, kws[0] || 'this')
    .replace(/\{kw2\}/g, kws[1] || kws[0] || 'this')
    .replace(/\{kw3\}/g, kws[2] || kws[1] || kws[0] || 'this')
    .replace(/\{Kw1\}/g, cap(kws[0] || 'this'));
}

const SETUP_TEMPLATES = {
  funny: [
    'Here is the {kw1} crash course nobody asked for but everybody needs.',
    'Strap in. This is {kw1}, minus the boring parts.',
    'Everything that matters about {kw1}, served fast and slightly unhinged.',
  ],
  direct: [
    'Here is the {kw1} breakdown, step by step.',
    'Everything that matters about {kw1}, no fluff.',
    'This is the short version of {kw1} that actually works.',
  ],
  curiosity: [
    'What I am about to show you changes how {kw1} works. Watch closely.',
    'There is a side to {kw1} nobody talks about. Here it is.',
    'By the end of this, you will see {kw1} completely differently.',
  ],
};

const BEAT1_TEMPLATES = {
  funny: [
    'First, the painful truth: most people do {kw1} completely backwards.',
    'Step one is admitting your {kw1} game is a mess. We have all been there.',
    'It starts the way all bad decisions start: with {kw1} and high hopes.',
  ],
  direct: [
    'First, get the foundation right: {kw1} only works when the basics are solid.',
    'Start here. Most people skip this {kw1} step and pay for it later.',
    'The first move in {kw1} is the one everyone rushes. Do not rush it.',
  ],
  curiosity: [
    'It started with a simple {kw1} question nobody could answer.',
    'The first clue was hiding in plain sight inside {kw1}.',
    'Nobody expected {kw1} to work like this. Then someone tried it.',
  ],
};

const BEAT2_TEMPLATES = {
  funny: [
    'Then it gets worse, which is somehow also when it gets better.',
    'Plot twist: the {kw2} part is where everyone faceplants.',
    'This is the part where {kw1} humbles you. Enjoy the ride.',
  ],
  direct: [
    'Next, layer in {kw2}. This is where the real results come from.',
    'Then comes {kw2}: the step that separates beginners from everyone else.',
    'Now add {kw2}. Small change, outsized payoff in {kw1}.',
  ],
  curiosity: [
    'But then {kw2} changed everything we thought we knew.',
    'The second discovery was stranger: {kw2} should not work, but it does.',
    'That is when {kw2} entered the picture, and nothing was the same.',
  ],
};

const BEAT3_TEMPLATES = {
  funny: [
    'And the finale: {kw3} swoops in like it owns the place. Because it does.',
    'Finally, {kw3}. The hero {kw1} deserves, delivered fashionably late.',
    'Last step: unleash {kw3} and try to act like you planned it all along.',
  ],
  direct: [
    'Finally, lock it in with {kw3}. This is what makes {kw1} stick.',
    'The last piece is {kw3}. Skip it and the rest falls apart.',
    'Finish with {kw3}. That is the difference between trying and winning at {kw1}.',
  ],
  curiosity: [
    'And the final piece, {kw3}, is the one nobody saw coming.',
    'Then came {kw3}. The missing link the whole {kw1} story needed.',
    'One last reveal: {kw3} ties the entire {kw1} puzzle together.',
  ],
};

const PAYOFF_TEMPLATES = {
  funny: [
    'And just like that, {kw1} is handled. Take a bow.',
    'That is the whole {kw1} playbook. Frame it.',
    '{Kw1}: conquered. Your move, internet.',
  ],
  direct: [
    'That is the full {kw1} system. Simple, repeatable, done.',
    '{Kw1} is simple once you see the pattern. Now you have seen it.',
    'Three steps, one {kw1} result. Go run it.',
  ],
  curiosity: [
    'And that is the {kw1} answer hiding in front of everyone.',
    'The loop is closed. {Kw1} will never look the same.',
    'Mystery solved. That is the real story behind {kw1}.',
  ],
};

const CTA_TEMPLATES = {
  funny: [
    'Follow for more {kw1} chaos. You know you want to.',
    'Follow, or the algorithm wins. Your call.',
  ],
  direct: [
    'Follow for the next {kw1} breakdown.',
    'Follow if you want more {kw1} with zero fluff.',
  ],
  curiosity: [
    'Follow, because part two answers the question I just left open.',
    'Follow. The next {kw1} reveal is even bigger.',
  ],
};

const TITLE_TEMPLATES = [
  'I Tested {Kw1} for 30 Days. Here Is What Happened.',
  'The {Kw1} Mistake Almost Everyone Makes',
  '{Kw1}, Explained in {secs} Seconds',
  'Stop Doing {Kw1} Like This',
  'What Nobody Tells You About {Kw1}',
  '{Kw1}: The 3 Steps That Actually Work',
];

const TIMING_30 = [
  { label: 'HOOK', range: '0:00 - 0:03' },
  { label: 'SETUP', range: '0:03 - 0:08' },
  { label: 'BEAT 1', range: '0:08 - 0:14' },
  { label: 'BEAT 2', range: '0:14 - 0:20' },
  { label: 'BEAT 3', range: '0:20 - 0:25' },
  { label: 'PAYOFF', range: '0:25 - 0:28' },
  { label: 'CTA', range: '0:28 - 0:30' },
];

const TIMING_60 = [
  { label: 'HOOK', range: '0:00 - 0:03' },
  { label: 'SETUP', range: '0:03 - 0:10' },
  { label: 'BEAT 1', range: '0:10 - 0:22' },
  { label: 'BEAT 2', range: '0:22 - 0:36' },
  { label: 'BEAT 3', range: '0:36 - 0:48' },
  { label: 'PAYOFF', range: '0:48 - 0:55' },
  { label: 'CTA', range: '0:55 - 1:00' },
];

export function buildScript(input) {
  const raw = input || {};
  const topic = String(raw.topic || '').trim().slice(0, 120);
  const hook = String(raw.hook || '').trim().slice(0, 200);
  const lengthSec = raw.lengthSec === 60 ? 60 : 30;
  const tone = raw.tone === 'funny' || raw.tone === 'curiosity' ? raw.tone : 'direct';
  if (!topic) throw new Error('A topic is required.');
  if (!hook) throw new Error('Pick a hook or write your own.');

  const kws = extractKeywords(topic);
  const seed = hashStr(topic + '|' + hook + '|' + tone + '|' + lengthSec);

  const setup = fill(pick(SETUP_TEMPLATES[tone], seed, 1), kws);
  const beats = [
    fill(pick(BEAT1_TEMPLATES[tone], seed, 2), kws),
    fill(pick(BEAT2_TEMPLATES[tone], seed, 3), kws),
    fill(pick(BEAT3_TEMPLATES[tone], seed, 4), kws),
  ];
  const payoff = fill(pick(PAYOFF_TEMPLATES[tone], seed, 5), kws);
  const cta = fill(pick(CTA_TEMPLATES[tone], seed, 6), kws);
  const title = fill(pick(TITLE_TEMPLATES, seed, 7), kws).replace(/\{secs\}/g, String(lengthSec));

  const hashtags = [];
  for (const kw of kws.slice(0, 3)) {
    const tag = kw.replace(/[^a-z0-9]/g, '');
    if (tag.length > 2) hashtags.push('#' + tag);
  }
  hashtags.push('#shorts');
  if (tone === 'funny' && !hashtags.includes('#funny')) hashtags.push('#funny');

  const timing = lengthSec === 60 ? TIMING_60 : TIMING_30;
  const sections = [
    { label: 'HOOK', text: hook, note: 'Say this verbatim in the first 3 seconds.' },
    { label: 'SETUP', text: setup, note: 'One line that frames what is coming.' },
    { label: 'BEAT 1', text: beats[0], note: 'The relatable problem.' },
    { label: 'BEAT 2', text: beats[1], note: 'The twist that raises the stakes.' },
    { label: 'BEAT 3', text: beats[2], note: 'The final escalation.' },
    { label: 'PAYOFF', text: payoff, note: 'Close the loop the hook opened.' },
    { label: 'CTA', text: cta, note: 'One clear ask, then end the video.' },
  ];

  return {
    topic,
    hook,
    lengthSec,
    tone,
    sections,
    timing,
    title,
    hashtags: hashtags.slice(0, 5),
  };
}

export const SCRIPT_BUILD_TONES = [
  { id: 'direct', label: 'Direct' },
  { id: 'funny', label: 'Funny' },
  { id: 'curiosity', label: 'Curiosity' },
];

export const SCRIPT_BUILD_LENGTHS = [30, 60];
