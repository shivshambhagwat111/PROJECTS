import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiAward, FiRefreshCw } from 'react-icons/fi';
import supabase from '../supabaseClient';
import { buildLeaderboard } from '../lib/leaderboard';

const MAX_ROWS = 1000; // most recent battles considered; ranking is computed client-side
const TOP_N = 50;

const medal = (rank) => (rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-amber-600' : 'text-gray-500');

const displayName = (profile, rank) => profile?.username || profile?.first_name || `Player ${rank}`;

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const myEmail = (location.state?.email || '').trim().toLowerCase();

  const [rows, setRows] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    const { data, error: battleError } = await supabase
      .from('vsai')
      .select('email, score_a, score_b, win_lose')
      .limit(MAX_ROWS);

    if (battleError) {
      setError('Could not load the leaderboard. Please try again.');
      setLoading(false);
      return;
    }
    setRows(data || []);

    // Names are optional: if profiles can't be read, players show as "Player N".
    const { data: profileRows } = await supabase.from('profiles').select('email, username, first_name');
    const map = {};
    (profileRows || []).forEach((p) => {
      if (p.email) map[p.email.trim().toLowerCase()] = p;
    });
    setProfiles(map);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const leaderboard = useMemo(() => buildLeaderboard(rows), [rows]);
  const top = leaderboard.slice(0, TOP_N);
  const me = leaderboard.find((p) => p.email === myEmail);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen text-white font-sans p-4 sm:p-8"
      style={{ background: 'radial-gradient(circle at top, #1a2035 0%, #0f172a 70%)' }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl md:text-4xl font-bold font-orbitron flex items-center gap-3">
            <FiAward className="text-yellow-400" /> Leaderboard
          </h1>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-600/50 py-2 px-3 rounded-lg transition-colors"
              aria-label="Refresh leaderboard"
            >
              <FiRefreshCw />
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-600/50 py-2 px-4 rounded-lg transition-colors"
            >
              <FiArrowLeft /> Back
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-400 mb-6">
          Ranked by vs-AI battle wins, then average judge score (out of 100). Rounds the judge could not score are excluded.
        </p>

        {me && (
          <div className="mb-4 p-4 rounded-lg bg-brand-cyan/10 border border-brand-cyan/40 text-sm">
            Your rank: <span className="font-bold text-brand-cyan">#{me.rank}</span> of {leaderboard.length}
            {' · '}{me.wins} wins in {me.battles} battles · avg {me.avgScore}
          </div>
        )}

        {loading && <p className="text-gray-400">Loading…</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!loading && !error && top.length === 0 && (
          <p className="text-gray-400">No scored battles yet. Win a vs-AI battle to claim the first spot.</p>
        )}

        {!loading && !error && top.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-800/40">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="p-3 w-14">Rank</th>
                  <th className="p-3">Player</th>
                  <th className="p-3 text-right">Wins</th>
                  <th className="p-3 text-right">Battles</th>
                  <th className="p-3 text-right">Win %</th>
                  <th className="p-3 text-right">Avg</th>
                  <th className="p-3 text-right">Best</th>
                </tr>
              </thead>
              <tbody>
                {top.map((p) => (
                  <tr
                    key={p.email}
                    className={`border-b border-gray-800 ${p.email === myEmail ? 'bg-brand-cyan/10' : ''}`}
                  >
                    <td className={`p-3 font-bold ${medal(p.rank)}`}>#{p.rank}</td>
                    <td className="p-3 font-semibold">
                      {displayName(profiles[p.email], p.rank)}
                      {p.email === myEmail && <span className="ml-2 text-xs text-brand-cyan">(you)</span>}
                    </td>
                    <td className="p-3 text-right">{p.wins}</td>
                    <td className="p-3 text-right">{p.battles}</td>
                    <td className="p-3 text-right">{p.winRate}%</td>
                    <td className="p-3 text-right">{p.avgScore}</td>
                    <td className="p-3 text-right">{p.bestScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LeaderboardPage;
