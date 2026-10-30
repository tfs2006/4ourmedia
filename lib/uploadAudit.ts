// Pre-Publish Upload Auditor: deterministic checks for title, description, tags.
// Pure logic, no AI, no network. Mirrored in uploadAuditRuntime.js for the API.
import { scoreTitle } from './titleScorer';

export type AuditStatus = 'pass' | 'warn' | 'fail' | 'info';

export interface AuditCheck {
  id: string;
  label: string;
  status: AuditStatus;
  detail: string;
}

export interface AuditInput {
  title: string;
  description: string;
  tags: string;
  pinned: boolean;
  chapters: boolean;
  endScreen: boolean;
  cards: boolean;
}

export interface AuditResult {
  verdict: 'ready' | 'fix';
  titleScore: number | null;
  checks: AuditCheck[];
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'your', 'you',
  'this', 'that', 'these', 'those', 'how', 'what', 'why', 'when',
  'here', 'there', 'from', 'into', 'video', 'new',
]);

function primaryKeyword(title: string): string | null {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  if (!words.length) return null;
  let best = words[0];
  for (const w of words) if (w.length > best.length) best = w;
  return best;
}

function countHashtags(text: string): number {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu);
  return matches ? matches.length : 0;
}

export function auditUpload(input: AuditInput): AuditResult {
  const checks: AuditCheck[] = [];
  const title = (input.title || '').trim();
  const description = (input.description || '').trim();

  let titleScore: number | null = null;
  if (!title) {
    checks.push({ id: 'title-present', label: 'Title present', status: 'fail', detail: 'Add a title before publishing. Nothing else matters until this exists.' });
  } else {
    const scored = scoreTitle(title);
    titleScore = scored.score;
    checks.push({
      id: 'title-score',
      label: `Title score: ${scored.score}/100`,
      status: scored.score >= 70 ? 'pass' : scored.score >= 40 ? 'warn' : 'fail',
      detail:
        scored.score >= 70
          ? 'Strong title. It follows proven headline rules.'
          : scored.score >= 40
            ? 'Decent title, but it is leaving clicks on the table. Try the Viral Title Scorer for rewrites.'
            : 'Weak title. Rewrite it before publishing. The Viral Title Scorer can help.',
    });
  }

  if (description.length < 200) {
    checks.push({
      id: 'desc-length', label: 'Description length', status: 'warn',
      detail: `Only ${description.length} characters. Write at least 200 so YouTube understands what the video is about.`,
    });
  } else {
    checks.push({
      id: 'desc-length', label: 'Description length', status: 'pass',
      detail: `${description.length} characters. Long enough for YouTube to rank it well.`,
    });
  }

  const keyword = title ? primaryKeyword(title) : null;
  if (keyword) {
    const head = description.slice(0, 200).toLowerCase();
    checks.push({
      id: 'desc-keyword', label: 'Keyword in first 2 lines',
      status: head.includes(keyword) ? 'pass' : 'fail',
      detail: head.includes(keyword)
        ? `Your main keyword "${keyword}" appears in the opening lines. Good.`
        : `Your main keyword "${keyword}" is missing from the first 200 characters. Put it in the opening lines.`,
    });
  }

  checks.push({
    id: 'desc-link', label: 'Link in description',
    status: /https?:\/\//i.test(description) ? 'pass' : 'warn',
    detail: /https?:\/\//i.test(description)
      ? 'Contains at least one link. Your call to action has somewhere to go.'
      : 'No link found. Add one call to action link (product, subscribe, playlist).',
  });

  const tagCount = countHashtags(description);
  checks.push({
    id: 'desc-hashtags', label: 'Hashtags',
    status: tagCount === 0 ? 'info' : tagCount <= 3 ? 'pass' : tagCount <= 15 ? 'warn' : 'fail',
    detail:
      tagCount === 0
        ? 'No hashtags. Optional, but 1 to 3 relevant ones can help discovery.'
        : tagCount <= 3
          ? `${tagCount} hashtag${tagCount > 1 ? 's' : ''}. Right in the sweet spot.`
          : tagCount <= 15
            ? `${tagCount} hashtags. YouTube starts ignoring the extras past a few. Trim to your best 3.`
            : `${tagCount} hashtags. YouTube ignores everything past 15. Cut this down to 3.`,
  });

  const rawTags = (input.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const totalTagChars = rawTags.join(',').length;
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const t of rawTags) {
    const k = t.toLowerCase();
    if (seen.has(k)) dupes.add(t);
    seen.add(k);
  }
  if (!rawTags.length) {
    checks.push({ id: 'tags', label: 'Tags', status: 'warn', detail: 'No tags. Add 5 to 10 specific tags so YouTube can categorize the video.' });
  } else if (dupes.size > 0) {
    checks.push({ id: 'tags', label: 'Tags', status: 'fail', detail: `Duplicate tags found: ${[...dupes].join(', ')}. Remove the repeats.` });
  } else if (totalTagChars > 500) {
    checks.push({ id: 'tags', label: 'Tags', status: 'fail', detail: `Tags total ${totalTagChars} characters. YouTube caps tags at 500. Trim them.` });
  } else {
    checks.push({ id: 'tags', label: 'Tags', status: 'pass', detail: `${rawTags.length} tags, ${totalTagChars}/500 characters. Clean.` });
  }

  const boxes: [string, string, boolean][] = [
    ['pinned', 'Pinned comment planned', input.pinned],
    ['chapters', 'Chapters added', input.chapters],
    ['endscreen', 'End screen added', input.endScreen],
    ['cards', 'Cards added', input.cards],
  ];
  for (const [id, label, ticked] of boxes) {
    checks.push({
      id: `box-${id}`, label, status: ticked ? 'pass' : 'warn',
      detail: ticked ? 'Done. This lifts watch time.' : 'Not ticked. It is optional, but each one adds retention or clicks.',
    });
  }

  const order: Record<AuditStatus, number> = { fail: 0, warn: 1, pass: 2, info: 3 };
  checks.sort((a, b) => order[a.status] - order[b.status]);
  const verdict = checks.some((c) => c.status === 'fail') ? 'fix' : 'ready';
  return { verdict, titleScore, checks };
}
