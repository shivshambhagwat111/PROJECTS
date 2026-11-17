import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSend, FiLock, FiUnlock, FiUser, FiCpu } from 'react-icons/fi';
import supabase from '../supabaseClient';
import { generateResponse as generateAIResponse, scoreResponse as getScoreAndExplanation } from '../lib/modelClient';

// --- Utility: Clean response formatting ---
function cleanResponse(text) {
  if (!text) return '';
  let cleaned = text
    .replace(/[*_~`>#]/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[\u{1F600}-\u{1F6FF}]/gu, '')
    .replace(/^[ \t]*\n/gm, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return cleaned;
}

const challengePrompts = [
  "Explain UPI to a 10-year-old using a bedtime story.",
  "Craft a rap about how demonetization changed India.",
  "Create a slogan and jingle for a fictional digital bank in rural Bihar.",
  "Write a dialogue between an ATM and a villager who just got his first bank card.",
  "Generate a social media post promoting financial literacy among Indian youth.",
  "Explain how SIP (Systematic Investment Plan) works using cricket analogies.",
  "Write a funny conversation between a kirana store owner and Paytm.",
  "Describe how GST affects a street food vendor in Delhi.",
  "Compare credit cards vs debit cards as if they were political rivals in a debate.",
  "Create a WhatsApp chat between a father and son about investing in mutual funds.",
  "Explain inflation using examples from a pani puri seller’s daily life.",
  "Describe how a chaiwala became a crypto investor and what went wrong.",
  "Write a Bollywood-style script promoting digital payments in small towns.",
  "Pitch a new mobile app that helps farmers access government subsidies.",
  "Create a customer complaint email about hidden bank charges—make it sarcastic.",
  "Craft a fantasy tale where RBI is the wise king and banks are battling knights.",
  "Summarize India’s financial inclusion drive using emojis and Gen Z slang.",
  "Write a LinkedIn post by a college student who just started a SIP in a mutual fund.",
  "Imagine a stand-up comedy routine on India’s tax filing experience.",
  "Design a fictional newspaper headline on the next big fintech breakthrough in India.",
  "Explain how a microloan helped a woman in a rural SHG start her own business.",
  "Translate a stock market crash explanation into an IPL commentary style.",
  "Create a meme caption about fuel price hikes and its impact on middle-class wallets.",
  "Tell the story of a ₹500 note’s journey across India in a single day.",
  "Describe the rise of Buy Now Pay Later (BNPL) culture through a student’s perspective."
];


const saveVsAIBattleToSupabase = async ({
  email,
  prompt,
  modelA,
  modelB,
  scoreA,
  scoreB
}) => {
  let win_lose = "draw";
  if (scoreA > scoreB) win_lose = "win";
  else if (scoreA < scoreB) win_lose = "lose";

  const { error } = await supabase
    .from('vsai')
    .insert([{
      email,
      prompt,
      model_a: modelA,
      model_b: modelB,
      score_a: scoreA,
      score_b: scoreB,
      win_lose
    }]);
  if (error) {
    console.error('Failed to save vs AI battle:', error.message);
  }
};


// --- Main Component ---
const VSAIBattleArenaPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const {
    selectedModel = { name: 'AI Model', image: 'https://cdn-icons-png.flaticon.com/512/10883/10883782.png' },
    selectedLayer = { name: 'Battle Layer', image: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fneurosciencenews.com%2Ffiles%2F2023%2F07%2Fchatgpt-reasoning-ai-neurosicence.jpg&f=1&nofb=1&ipt=27811803b5f701fa285773c6cd0fabde294109365682f32dbcf0bd7a61453c8a' },
    difficulty = 'Medium',
    battleFocus = 'Creative',
    scenarioType = 'N/A',
  } = location.state || {};

  const [playerMetrics, setPlayerMetrics] = useState(null);
  const [aiMetrics, setAiMetrics] = useState(null);
  const [isScoring, setIsScoring] = useState(false);
  const [scoreError, setScoreError] = useState('');
  const [isLocked, setIsLocked] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [winner, setWinner] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [userLLMResponse, setUserLLMResponse] = useState('');
  const [aiLLMResponse, setAiLLMResponse] = useState('');


  // --- Set timer to 5 minutes (300 seconds) ---
  const [timer, setTimer] = useState(300);
  useEffect(() => {
  if (timer > 0) {
    const countdown = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(countdown);
  } else {
    // Call async function in useEffect
    (async () => { await finishBattle(); })();
  }
  // eslint-disable-next-line
}, [timer]);


  const [challengePrompt, setChallengePrompt] = useState('');
  useEffect(() => {
  setChallengePrompt(
    challengePrompts[Math.floor(Math.random() * challengePrompts.length)]
  );
}, []);


  const finishBattle = async () => {
  const playerTotal = playerMetrics
    ? (playerMetrics.PromptClarity || 0) + (playerMetrics.ResponseClarity || 0) + (playerMetrics.Usefulness || 0) + (playerMetrics.PromptDepth || 0)
    : 0;
  const aiTotal = aiMetrics
    ? (aiMetrics.PromptClarity || 0) + (aiMetrics.ResponseClarity || 0) + (aiMetrics.Usefulness || 0) + (aiMetrics.PromptDepth || 0)
    : 0;

  // --- Save to Supabase ---
  await saveVsAIBattleToSupabase({
    email,
    prompt: challengePrompt,
    modelA: "PLAYER ALPHA", // Change if you want a dynamic player name
    modelB: selectedModel.name,
    scoreA: playerTotal,
    scoreB: aiTotal
  });

  if (aiTotal > playerTotal) {
    navigate('/defeat', {
      state: {
        winner: { name: 'AI Wins!' },
        scores: { user: playerTotal, ai: aiTotal },
        isLocalBattle: false
      }
    });
  } else {
    navigate('/victory', {
      state: {
        winner: { name: playerTotal > aiTotal ? 'User Wins!' : "It's a Tie!" },
        scores: { user: playerTotal, ai: aiTotal },
        isLocalBattle: false
      }
    });
  }
};



  // --- Handle submit: generate AI response and score both sides ---
  const handleSubmit = async () => {
    setIsScoring(true);
    setScoreError('');
    setIsSubmitted(true);
    try {
      // 1. User's prompt to LLM
    const userLLMRes = await generateAIResponse(userPrompt, selectedModel.name);
    setUserLLMResponse(userLLMRes);

    // 2. AI's prompt to LLM
    const aiLLMRes = await generateAIResponse(aiPrompt, selectedModel.name);
    setAiLLMResponse(aiLLMRes);

    // 3. Score both LLM responses (against the challenge prompt)
    const [userScore, aiScore] = await Promise.all([
      getScoreAndExplanation(challengePrompt, userLLMRes),
      getScoreAndExplanation(challengePrompt, aiLLMRes)
    ]);
    setPlayerMetrics(userScore);
    setAiMetrics(aiScore);

    // 4. Decide winner
    const userTotal = (userScore.PromptClarity || 0) + (userScore.ResponseClarity || 0) + (userScore.Usefulness || 0) + (userScore.PromptDepth || 0);
    const aiTotal = (aiScore.PromptClarity || 0) + (aiScore.ResponseClarity || 0) + (aiScore.Usefulness || 0) + (aiScore.PromptDepth || 0);

    if (userTotal > aiTotal) setWinner('User Wins!');
    else if (aiTotal > userTotal) setWinner('AI Wins!');
    else setWinner("It's a Tie!");
  } catch (err) {
    setScoreError('Scoring failed. Try again.');
  } finally {
    setIsScoring(false);
  }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  async function generateAIPromptForChallenge(challengePrompt, selectedModel) {
    const metaPrompt = `You are an expert prompt engineer. Write the single best prompt you can that would get an LLM to generate the best possible response to the following challenge:\n\n${challengePrompt}\n\nOnly output your prompt.`;
    return await generateAIResponse(metaPrompt, selectedModel);
  }

  useEffect(() => {
  if (challengePrompt && selectedModel?.name) {
    generateAIPromptForChallenge(challengePrompt, selectedModel.name)
      .then(setAiPrompt);
  }
  // eslint-disable-next-line
}, [challengePrompt, selectedModel]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen bg-brand-dark text-white font-sans p-4"
      style={{
        background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)'
      }}
    >
      <div className="absolute inset-0 bg-[url('https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fneurosciencenews.com%2Ffiles%2F2023%2F07%2Fchatgpt-reasoning-ai-neurosicence.jpg&f=1&nofb=1&ipt=27811803b5f701fa285773c6cd0fabde294109365682f32dbcf0bd7a61453c8a')] bg-cover bg-center opacity-20"></div>
      <div className="relative container mx-auto">

        {/* Header */}
        <motion.div variants={itemVariants} className="flex justify-between items-center mb-4 bg-black/30 p-3 rounded-lg">
          <h1 className="text-xl font-bold font-orbitron">Prompt Wars</h1>
          <div className="flex items-center gap-4 text-sm">
            <span>Model: {selectedModel.name}</span>
            <span>Layer: {selectedLayer.name}</span>
            <span>Difficulty: {difficulty}</span>
            <button className="hover:text-brand-cyan">Profile</button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Panel: Command Center */}
          <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4">
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/50">
              <h2 className="text-lg font-bold font-orbitron mb-2 text-glow-blue">Challenge Prompt</h2>
              <div className="w-full bg-black/30 p-3 rounded-md mb-2 text-blue-200 text-sm font-semibold text-center min-h-[60px]">
                {challengePrompt}
              </div>
              <label className="block font-semibold mb-1">Your Prompt for the LLM:</label>
              <textarea
                placeholder="Write your best prompt for the LLM to solve the challenge..."
                className="w-full h-40 bg-black/30 p-2 rounded-md resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 custom-scrollbar"
                disabled={isScoring || isSubmitted}
                value={userPrompt}
                onChange={e => setUserPrompt(e.target.value)}
              ></textarea>
              <div className="flex gap-2 mt-2">
                 <button
        onClick={handleSubmit}
        className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md text-sm bg-green-500/80 hover:bg-green-400 disabled:bg-gray-700 disabled:cursor-not-allowed"
        disabled={isSubmitted || isScoring || !userPrompt}
      >
        <FiSend /> {isScoring ? "Scoring..." : "Submit"}
      </button>
      <button
        onClick={async () => { await finishBattle(); }}
        className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md text-sm bg-red-500/80 hover:bg-red-400 disabled:bg-gray-700 disabled:cursor-not-allowed"
        disabled={isScoring}
      >
        Early Finish
      </button>
    </div>
  </div>

  {/* Results: User Prompt, LLM Response, and Score */}
  {isSubmitted && (
    <>
      <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/50 mt-4">
        <h3 className="font-bold mb-2">Your Prompt</h3>
        <div className="bg-black/40 p-2 rounded mb-2 text-blue-100">{userPrompt}</div>
        <h4 className="font-semibold mb-1">LLM Response</h4>
        <div className="bg-slate-900/80 p-2 rounded mb-2 text-blue-100 min-h-[60px] max-h-[400px] overflow-y-auto"
  style={{
    whiteSpace: 'pre-line',
    wordBreak: 'break-word',
  }}>{cleanResponse(userLLMResponse)}</div>
      </div>
      <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/50">
        <h3 className="text-md font-bold font-orbitron mb-2">Your Performance</h3>
        {playerMetrics ? (
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span>Prompt Clarity</span><span>{playerMetrics.PromptClarity}/25</span></div>
            <div className="flex justify-between"><span>Response Clarity</span><span>{playerMetrics.ResponseClarity}/25</span></div>
            <div className="flex justify-between"><span>Usefulness</span><span>{playerMetrics.Usefulness}/25</span></div>
            <div className="flex justify-between"><span>Prompt Depth</span><span>{playerMetrics.PromptDepth}/25</span></div>
            <div className="mt-2 text-xs text-gray-400">{playerMetrics.explanation}</div>
            <div className="mt-2 font-bold text-cyan-200">
              Total: {(playerMetrics.PromptClarity || 0) + (playerMetrics.ResponseClarity || 0) + (playerMetrics.Usefulness || 0) + (playerMetrics.PromptDepth || 0)}/100
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Not scored yet</div>
        )}
        {scoreError && <div className="text-red-400 mt-2">{scoreError}</div>}
      </div>
    </>
  )}
</motion.div>

          {/* Center Panel: VS Screen */}
          <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col items-center justify-center bg-black/30 p-4 rounded-lg border border-gray-700">
            <div className="w-full flex justify-between items-center px-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/30 border-2 border-blue-400 flex items-center justify-center">
                  <FiUser className="text-3xl text-blue-300" />
                </div>
                <p className="font-bold mt-2">PLAYER ALPHA</p>
                <p className="text-2xl font-orbitron text-blue-300">{playerMetrics ? (playerMetrics.PromptClarity + playerMetrics.ResponseClarity + playerMetrics.Usefulness + playerMetrics.PromptDepth) : 0}</p>
              </div>
              <div className="text-5xl font-orbitron text-gray-500">VS</div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-500/30 border-2 border-red-400 flex items-center justify-center">
                  <FiCpu className="text-3xl text-red-300" />
                </div>
                <p className="font-bold mt-2">{selectedModel.name}</p>
                <p className="text-2xl font-orbitron text-red-300">{aiMetrics ? (aiMetrics.PromptClarity + aiMetrics.ResponseClarity + aiMetrics.Usefulness + aiMetrics.PromptDepth) : 0}</p>
              </div>
            </div>
            <div className="my-4 text-center">
              {winner && (
                <div className={`text-2xl font-bold px-4 py-2 rounded-full 
                  ${winner === 'User Wins!' ? 'bg-green-600 text-white' : 
                    winner === 'AI Wins!' ? 'bg-red-600 text-white' : 
                    'bg-yellow-500 text-black'}`}>
                  {winner}
                </div>
              )}
            </div>
            <div className="my-6 text-center">
              <div className="text-5xl font-orbitron text-yellow-400 text-glow-yellow">{formatTime(timer)}</div>
              <div className="bg-yellow-500/80 text-black text-xs font-bold px-3 py-1 rounded-full mt-2 animate-pulse">
                {isScoring
                  ? "Scoring..."
                    : isSubmitted
                  ? "Battle Complete!"
                    : "Waiting for your prompt..."}
              </div>
            </div>
            <div className="w-full px-4">
              <h3 className="text-center text-sm font-orbitron mb-2">Battle Intensity Timeline</h3>
              <div className="grid grid-cols-10 gap-1 h-16">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className={`rounded-sm ${['bg-green-500', 'bg-yellow-500', 'bg-red-500'][Math.floor(Math.random() * 3)]}`}></div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4">
            {/* AI Prompt and LLM Response */}
            <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/50">
              <h2 className="text-lg font-bold font-orbitron mb-2 text-glow-red">AI's Prompt</h2>
              <div className="w-full bg-gray-800 text-white p-2 rounded min-h-[60px] mb-2">{aiPrompt || "Generating..."}</div>
              <h4 className="font-semibold mb-1">LLM Response</h4>
              <div className="bg-slate-900/80 p-2 rounded mb-2 text-red-100 min-h-[60px] max-h-[400px] overflow-y-auto"
  style={{
    whiteSpace: 'pre-line',
    wordBreak: 'break-word',
  }}
>{cleanResponse(aiLLMResponse)}</div>
            </div>

            {/* AI Info Card */}
            <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/50 text-center">
              <h3 className="text-md font-bold font-orbitron mb-2">{selectedModel.name}</h3>
              <img src={selectedModel.image} alt={selectedModel.name} className="w-32 h-32 mx-auto rounded-lg object-cover border-2 border-red-400 mb-2" />
            </div>

            {/* AI Performance Score */}
            <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/50">
              <h3 className="text-md font-bold font-orbitron mb-2">AI Performance</h3>
              {aiMetrics ? (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span>Prompt Clarity</span><span>{aiMetrics.PromptClarity}/25</span></div>
                  <div className="flex justify-between"><span>Response Clarity</span><span>{aiMetrics.ResponseClarity}/25</span></div>
                  <div className="flex justify-between"><span>Usefulness</span><span>{aiMetrics.Usefulness}/25</span></div>
                  <div className="flex justify-between"><span>Prompt Depth</span><span>{aiMetrics.PromptDepth}/25</span></div>
                  <div className="mt-2 text-xs text-gray-400">{aiMetrics.explanation}</div>
                  <div className="mt-2 font-bold text-red-200">
                    Total: {(aiMetrics.PromptClarity || 0) + (aiMetrics.ResponseClarity || 0) + (aiMetrics.Usefulness || 0) + (aiMetrics.PromptDepth || 0)}/100
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Not scored yet</div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default VSAIBattleArenaPage;