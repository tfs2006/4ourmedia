import type { VercelRequest, VercelResponse } from '@vercel/node';

type FleetBot = {
  label: string;
  slug: string;
  port: number;
};

type LiveBotSnapshot = {
  label: string;
  slug: string;
  port: number;
  returnPct: number | null;
  positions: number | null;
  confidence: number | null;
  updatedAt: string;
  leaderboardRank: number | null;
  leaderboardReturnPct: number | null;
};

const FLEET: FleetBot[] = [
  { label: 'ANAMNESIS', slug: 'anamnesis', port: 8790 },
  { label: 'VORTEX', slug: 'vortex', port: 8791 },
  { label: 'NIGHTOWL', slug: 'nightowl', port: 8792 },
  { label: 'IRONCLAW', slug: 'ironclaw', port: 8793 },
];

const BRIDGE_BASE = 'http://158.101.2.37:9797/clawstreet/state?port=';
const LEADERBOARD_URL = 'https://www.clawstreet.io/leaderboard';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function safeJsonFetch(url: string, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function safeTextFetch(url: string, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function parseLeaderboard(html: string) {
  const map: Record<string, { rank: number; returnPct: number | null }> = {};
  const pattern = /\|\s*(\d+)\s*\|\s*([^|\n]+?)\s+[A-Z0-9]+\s*\|\s*([+-]?\d+(?:\.\d+)?)%/g;
  let m: RegExpExecArray | null = null;

  while ((m = pattern.exec(html)) !== null) {
    const rank = Number(m[1]);
    const rawName = m[2].trim();
    const returnPct = Number(m[3]);
    const name = rawName.toUpperCase().replace(/\s+/g, ' ').trim();
    map[name] = {
      rank: Number.isFinite(rank) ? rank : null,
      returnPct: Number.isFinite(returnPct) ? returnPct : null,
    } as { rank: number; returnPct: number | null };
  }

  return map;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [snapshots, leaderboardHtml] = await Promise.all([
      Promise.all(
        FLEET.map(async (bot) => {
          const data = await safeJsonFetch(`${BRIDGE_BASE}${bot.port}`);
          return {
            bot,
            data,
          };
        })
      ),
      safeTextFetch(LEADERBOARD_URL),
    ]);

    const leaderboard = leaderboardHtml ? parseLeaderboard(leaderboardHtml) : {};

    const bots: LiveBotSnapshot[] = snapshots.map(({ bot, data }) => {
      const key = bot.label.toUpperCase();
      const rankData = leaderboard[key];
      return {
        label: bot.label,
        slug: bot.slug,
        port: bot.port,
        returnPct: typeof data?.returnPct === 'number' ? data.returnPct : null,
        positions: Array.isArray(data?.positions) ? data.positions.length : null,
        confidence: typeof data?.confidence?.current === 'number' ? data.confidence.current : null,
        updatedAt: new Date().toISOString(),
        leaderboardRank: rankData?.rank ?? null,
        leaderboardReturnPct: rankData?.returnPct ?? null,
      };
    });

    const rankedCount = bots.filter((b) => b.leaderboardRank && b.leaderboardRank <= 10).length;

    return res.status(200).json({
      ok: true,
      source: {
        bridge: '158.101.2.37:9797/clawstreet/state',
        leaderboard: LEADERBOARD_URL,
      },
      summary: {
        fleetSize: bots.length,
        top10Bots: rankedCount,
      },
      bots,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to load live clawstreet proof',
    });
  }
}
