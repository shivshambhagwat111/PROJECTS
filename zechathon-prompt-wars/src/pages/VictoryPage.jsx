import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBarChart2, FiHome } from 'react-icons/fi';

const VictoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get winner and scores from navigation state, fallback for legacy/local
  const {
    winner = { name: 'Player Alpha' },
    scores = { user: 0, ai: 0, modelA: 0, modelB: 0 },
    isLocalBattle = false
  } = location.state || {};

  // Use user/ai if present, else fallback to modelA/modelB
  const userScore = scores.user ?? scores.modelA ?? 0;
  const aiScore = scores.ai ?? scores.modelB ?? 0;

  // Winner message logic
  let winnerMessage = '';
  if (typeof winner === 'string') {
    winnerMessage = winner;
  } else if (winner?.name) {
    winnerMessage = winner.name;
  } else {
    winnerMessage = userScore > aiScore
      ? 'User Wins!'
      : aiScore > userScore
        ? 'AI Wins!'
        : "It's a Tie!";
  }

  // Confetti animation setup
  const confetti = [...Array(50)].map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 100,
    initialRotate: Math.random() * 360,
    color: ['#00ffff', '#ff00ff', '#ffffff'][Math.floor(Math.random() * 3)],
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 2,
  }));

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at bottom, #0f172a 0%, #000000 100%)'
      }}
    >
      {/* Confetti animation */}
      {confetti.map(c => (
        <motion.div
          key={c.id}
          className="absolute w-2 h-4"
          style={{
            left: `${c.x}vw`,
            backgroundColor: c.color,
            boxShadow: `0 0 10px ${c.color}`,
          }}
          initial={{
            y: `${c.y}vh`,
            rotate: c.initialRotate,
          }}
          animate={{
            y: '120vh',
            rotate: c.initialRotate + 180 + Math.random() * 180,
          }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'loop',
          }}
        />
      ))}

      <div className="text-center z-10 p-4">
        <motion.h1
          className="text-6xl md:text-7xl font-bold font-orbitron text-white tracking-widest"
          style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.7)' }}
        >
          VICTORY
        </motion.h1>
        
        <div>
          <h2 className="text-2xl text-cyan-400 mt-4">{winnerMessage}</h2>
          {/* Always show the final scores for AI-vs-user battles */}
          {!isLocalBattle && (
            <div className="text-xl text-white mt-2">
              <span className="font-semibold">Final Score:</span>
              <span className="ml-2 text-cyan-300">User</span> {userScore}
              <span className="mx-2 text-gray-400">vs</span>
              <span className="text-red-300">AI</span> {aiScore}
            </div>
          )}
          {/* Local battle fallback */}
          {isLocalBattle && (
            <div className="text-xl text-white mt-2">
              Final Score: {scores.modelA} vs {scores.modelB}
            </div>
          )}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          {!isLocalBattle && (
            <button
              onClick={() => navigate('/battle-analytics')}
              className="bg-black/20 backdrop-blur-md border border-cyan-400/50 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-3 hover:bg-cyan-400/20 transition-colors shadow-lg shadow-cyan-500/10"
            >
              <FiBarChart2 /> View Battle Analytics
            </button>
          )}
          <button
            onClick={() => navigate('/battle-mode')}
            className="bg-black/20 backdrop-blur-md border border-purple-400/50 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-3 hover:bg-purple-400/20 transition-colors shadow-lg shadow-purple-500/10"
          >
            <FiHome /> Return to Battle Selection
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default VictoryPage;
