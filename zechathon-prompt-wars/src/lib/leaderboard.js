// Leaderboard ranking, kept free of React/Supabase so it is easy to test.
//
// Input rows come from the `vsai` table (one row per vs-AI battle):
//   { email, score_a, score_b, win_lose }, where score_a is the player's total
//   out of 100 (4 judge criteria x 25) and score_b is the AI's.
//
// Ranking: most wins first, then higher average score, then more battles.

/** True when the judge actually scored the round (an unjudged round is 0-0). */
const wasJudged = (row) => (Number(row.score_a) || 0) + (Number(row.score_b) || 0) > 0;

/**
 * @param {Array<{email?: string, score_a?: number, score_b?: number, win_lose?: string}>} rows
 * @returns {Array<{email: string, battles: number, wins: number, losses: number, draws: number,
 *                  winRate: number, avgScore: number, bestScore: number, rank: number}>}
 */
export function buildLeaderboard(rows) {
  const byPlayer = new Map();

  for (const row of rows || []) {
    const email = (row.email || '').trim().toLowerCase();
    if (!email || !wasJudged(row)) continue;

    const entry = byPlayer.get(email) || { email, battles: 0, wins: 0, losses: 0, draws: 0, total: 0, bestScore: 0 };
    const score = Number(row.score_a) || 0;

    entry.battles += 1;
    entry.total += score;
    entry.bestScore = Math.max(entry.bestScore, score);
    if (row.win_lose === 'win') entry.wins += 1;
    else if (row.win_lose === 'lose') entry.losses += 1;
    else entry.draws += 1;

    byPlayer.set(email, entry);
  }

  return [...byPlayer.values()]
    .map(({ total, ...p }) => ({
      ...p,
      winRate: Math.round((p.wins / p.battles) * 100),
      avgScore: Math.round((total / p.battles) * 10) / 10,
    }))
    .sort((a, b) => b.wins - a.wins || b.avgScore - a.avgScore || b.battles - a.battles || a.email.localeCompare(b.email))
    .map((p, i) => ({ ...p, rank: i + 1 }));
}
