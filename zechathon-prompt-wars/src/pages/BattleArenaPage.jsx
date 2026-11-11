import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSend, FiUser, FiCpu } from 'react-icons/fi';
import { InviteContext } from '../context/InviteContext';

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
  // ... (add the rest of your prompts)
];

// --- API Setup ---
  const API_KEY_N = "REPLACE_WITH_YOUR_OPENROUTER_KEY";
  const API_KEY_S2 = "REPLACE_WITH_YOUR_OPENROUTER_KEY";
  const API_KEY_B2 = "REPLACE_WITH_YOUR_OPENROUTER_KEY";
  const API_KEY_B3 = "REPLACE_WITH_YOUR_OPENROUTER_KEY";
  const API_KEY_B4 = "REPLACE_WITH_YOUR_OPENROUTER_KEY";
  const API_KEY_B5 = "REPLACE_WITH_YOUR_OPENROUTER_KEY";
  const API_KEY_B6 = "REPLACE_WITH_YOUR_OPENROUTER_KEY";
  const API_KEY_B = "REPLACE_WITH_YOUR_OPENROUTER_KEY";
  const API_KEY_S = "REPLACE_WITH_YOUR_OPENROUTER_KEY";
  const API_KEY_V = "REPLACE_WITH_YOUR_OPENROUTER_KEY";
  const API_KEY = API_KEY_B2;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_MAPPING = {
  "DeepSeek R1": "deepseek/deepseek-r1-0528:free",
  "Google Gemma 3": "google/gemma-3-27b-it:free",
  "Mistral AI": "mistralai/mistral-small-3.1-24b-instruct:free",
  "Meta Llama 3.3": "meta-llama/llama-3.3-70b-instruct:free"
};

// --- Scoring Function ---
async function getScoreAndExplanation(promptText, responseText) {
  const judgePrompt = `
You are an expert AI evaluator. Score the following AI response to a user prompt on these four criteria, each out of 25:
- PromptClarity (0-25): How clear and well-structured is the prompt?
- ResponseClarity (0-25): How clear and well-structured is the AI's response?
- Usefulness (0-25): How useful is the response to the user's likely intent?
- PromptDepth (0-25): How thoroughly does the response address the prompt's depth and complexity?

Return your evaluation as a valid JSON object in this format:
{
  "PromptClarity": number,
  "ResponseClarity": number,
  "Usefulness": number,
  "PromptDepth": number,
  "explanation": "short explanation"
}

Prompt: """${promptText}"""
Response: """${responseText}"""
`;

  const payload = {
    model: MODEL_MAPPING["Mistral AI"],
    messages: [{ role: "user", content: judgePrompt }],
    temperature: 0.2,
    max_tokens: 300,
    response_format: { type: "json_object" }
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();

    if (response.status === 429) {
      return {
        PromptClarity: 0, ResponseClarity: 0, Usefulness: 0, PromptDepth: 0,
        explanation: "Rate limit exceeded. Try again later."
      };
    }

    if (!response.ok) throw new Error(`Judge model HTTP error! status: ${response.status} - ${text}`);

    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error('Judge model returned invalid JSON'); }

    let result;
    try { result = JSON.parse(data.choices[0].message.content); }
    catch {
      result = {
        PromptClarity: 20, ResponseClarity: 20, Usefulness: 20, PromptDepth: 20,
        explanation: "Could not parse judge model output."
      };
    }
    return result;
  } catch (error) {
    return {
      PromptClarity: 0, ResponseClarity: 0, Usefulness: 0, PromptDepth: 0,
      explanation: "No score due to error."
    };
  }
}

// --- AI Response Generator ---
async function generateAIResponse(prompt, selectedModel) {
  const systemPrompt = "You are participating in an AI battle arena. Provide a helpful, accurate, and clearly formatted response. Do not use markdown symbols, emojis, or decorative text. Use plain language, clear headings, and bullet points only if needed.";
  const payload = {
    model: MODEL_MAPPING[selectedModel] || MODEL_MAPPING["Mistral AI"],
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 400
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  const data = JSON.parse(text);
  return data.choices?.[0]?.message?.content || "No response generated";
}

// --- Meta-Prompt for AI Prompt Engineering ---
async function generateAIPromptForChallenge(challengePrompt, selectedModel) {
  const metaPrompt = `You are an expert prompt engineer. Write the single best prompt you can that would get an LLM to generate the best possible response to the following challenge:\n\n${challengePrompt}\n\nOnly output your prompt.`;
  return await generateAIResponse(metaPrompt, selectedModel);
}

// --- Main Component ---
const BattleArenaPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    selectedModel = { name: 'AI Model', image: 'https://cdn-icons-png.flaticon.com/512/10883/10883782.png' },
    selectedLayer = { name: 'Battle Layer', image: 'https://img.freepik.com/free-vector/background-with-night-city-neon-lights_1441-2597.jpg' },
    difficulty = 'Medium',
    battleFocus = 'Creative',
    scenarioType = 'N/A',
    // NEW: User battle properties
    battleId = null,
    battleType = 'ai-vs-user',
    battleConfig = null,
    opponentId = null,
    opponentName = 'AI Opponent',
    isInviteBattle = false
  } = location.state || {};

  const [challengePrompt, setChallengePrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [userLLMResponse, setUserLLMResponse] = useState('');
  const [aiLLMResponse, setAiLLMResponse] = useState('');
  const [playerMetrics, setPlayerMetrics] = useState(null);
  const [aiMetrics, setAiMetrics] = useState(null);
  const [isScoring, setIsScoring] = useState(false);
  const [scoreError, setScoreError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [winner, setWinner] = useState('');
  const [timer, setTimer] = useState(300);

  // NEW: User battle state
  const [opponentResponse, setOpponentResponse] = useState('');
  const [opponentSubmitted, setOpponentSubmitted] = useState(false);
  const [battleStatus, setBattleStatus] = useState('waiting');
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

  // Get InviteContext for battle coordination
  const { 
    activeBattle, 
    submitBattleResponse, 
    completeBattle, 
    getBattle 
  } = useContext(InviteContext);

  // Determine if this is a user-vs-user battle
  const isUserBattle = battleType === 'user-vs-user' && battleId && isInviteBattle;

  // Check for battle state in sessionStorage (for inviter navigation)
  useEffect(() => {
    const battleState = sessionStorage.getItem('battleState');
    if (battleState && !battleId) {
      try {
        const state = JSON.parse(battleState);
        // Set the battle state properly instead of just reloading
        sessionStorage.removeItem('battleState');
        
        // Update the location state with the battle information
        const newState = {
          ...location.state,
          battleId: state.battleId,
          battleType: state.battleType,
          isInviteBattle: state.isInviteBattle,
          battleConfig: state.battleConfig,
          opponentId: state.opponentId,
          inviteId: state.inviteId
        };
        
        // Navigate to the same page with the new state
        navigate('/battle-arena', { state: newState, replace: true });
      } catch (error) {
        console.error('Error parsing battle state:', error);
      }
    }
  }, [battleId, navigate, location.state]);

  // Load battle configuration from invite if it's a user battle
  useEffect(() => {
    if (isUserBattle && battleConfig) {
      // Use the battle configuration from the invite
      if (battleConfig.selectedModel) {
        // Update the selected model from the invite
        Object.assign(selectedModel, battleConfig.selectedModel);
      }
      if (battleConfig.selectedLayer) {
        Object.assign(selectedLayer, battleConfig.selectedLayer);
      }
      // Other config can be used as needed
    }
  }, [isUserBattle, battleConfig]);

  // Subscribe to battle updates for user battles
  useEffect(() => {
    if (!isUserBattle || !battleId) return;

    const checkBattleStatus = async () => {
      const { success, data } = await getBattle(battleId);
      if (success && data) {
        setBattleStatus(data.status);
        
        // Check if opponent has submitted their response
        if (data.player1_response && data.player2_response) {
          setOpponentResponse(data.player1_response || data.player2_response);
          setOpponentSubmitted(true);
          
          // If both players have submitted, proceed to scoring
          if (data.status === 'active') {
            handleBothResponsesSubmitted(data);
          }
        }
      }
    };

    // Check initial status
    checkBattleStatus();

    // Set up polling for battle updates (every 2 seconds)
    const interval = setInterval(checkBattleStatus, 2000);

    return () => clearInterval(interval);
  }, [battleId, isUserBattle]);

  // Handle when both players have submitted responses
  const handleBothResponsesSubmitted = async (battleData) => {
    setIsScoring(true);
    setScoreError('');

    try {
      // Get both responses
      const player1Response = battleData.player1_response;
      const player2Response = battleData.player2_response;

      // Score both responses against the challenge prompt
      const [player1Score, player2Score] = await Promise.all([
        getScoreAndExplanation(challengePrompt, player1Response),
        getScoreAndExplanation(challengePrompt, player2Response)
      ]);

      // Calculate totals
      const player1Total = (player1Score.PromptClarity || 0) + (player1Score.ResponseClarity || 0) + (player1Score.Usefulness || 0) + (player1Score.PromptDepth || 0);
      const player2Total = (player2Score.PromptClarity || 0) + (player2Score.ResponseClarity || 0) + (player2Score.Usefulness || 0) + (player2Score.PromptDepth || 0);

      // Complete the battle
      const scores = {
        player1_id: battleData.player1_id,
        player2_id: battleData.player2_id,
        player1_score: player1Total,
        player2_score: player2Total
      };

      const completeResult = await completeBattle(battleId, scores);
      
      if (completeResult.success) {
        // Determine winner
        if (player1Total > player2Total) {
          setWinner('Player 1 Wins!');
        } else if (player2Total > player1Total) {
          setWinner('Player 2 Wins!');
        } else {
          setWinner("It's a Tie!");
        }

        setPlayerMetrics(player1Score);
        setAiMetrics(player2Score);
        setIsSubmitted(true);
      }
    } catch (err) {
      setScoreError('Scoring failed. Try again.');
    } finally {
      setIsScoring(false);
    }
  };

  // Pick a random challenge prompt on mount
  useEffect(() => {
    setChallengePrompt(
      challengePrompts[Math.floor(Math.random() * challengePrompts.length)]
    );
  }, []);

  // Generate AI prompt when challenge prompt or model changes (only for AI battles)
  useEffect(() => {
    if (isUserBattle) return; // Skip for user battles

    async function getAIPrompt() {
      if (challengePrompt && selectedModel?.name) {
        const metaPrompt = `You are an expert prompt engineer. Write the single best prompt you can that would get an LLM to generate the best possible response to the following challenge:\n\n${challengePrompt}\n\nOnly output your prompt.`;
        const aiPromptResult = await generateAIResponse(metaPrompt, selectedModel.name);
        setAiPrompt(aiPromptResult);
      }
    }
    getAIPrompt();
    // eslint-disable-next-line
  }, [challengePrompt, selectedModel, isUserBattle]);

  // Timer logic
  useEffect(() => {
    if (timer > 0 && !isSubmitted) {
      const countdown = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(countdown);
    } else if (timer === 0 && !isSubmitted) {
      handleEarlyFinish();
    }
    // eslint-disable-next-line
  }, [timer, isSubmitted]);

  // Submission logic
  const handleSubmit = async () => {
    if (isUserBattle) {
      // Handle user-vs-user battle submission
      handleUserBattleSubmit();
    } else {
      // Handle AI battle submission (existing logic)
      handleAIBattleSubmit();
    }
  };

  // Handle user battle submission
  const handleUserBattleSubmit = async () => {
    if (!userPrompt.trim()) return;

    setIsScoring(true);
    setScoreError('');
    setWaitingForOpponent(true);

    try {
      // Submit response to battle
      const result = await submitBattleResponse(battleId, userPrompt);
      
      if (result.success) {
        setIsSubmitted(true);
        setBattleStatus('active');
        
        // Wait for opponent response
        setWaitingForOpponent(true);
      } else {
        throw new Error('Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting user battle response:', error);
      setScoreError('Failed to submit response. Try again.');
    } finally {
      setIsScoring(false);
    }
  };

  // Handle AI battle submission (existing logic)
  const handleAIBattleSubmit = async () => {
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

  // Early finish logic: acts as submit if not scored, acts as continue if winner is decided
  const handleEarlyFinish = async () => {
    if (!isSubmitted && !isScoring && userPrompt) {
      await handleSubmit();
    } else if (winner) {
      // Navigate to next page (victory/defeat/summary) based on winner
      const userTotal = playerMetrics
        ? (playerMetrics.PromptClarity || 0) + (playerMetrics.ResponseClarity || 0) + (playerMetrics.Usefulness || 0) + (playerMetrics.PromptDepth || 0)
        : 0;
      const aiTotal = aiMetrics
        ? (aiMetrics.PromptClarity || 0) + (aiMetrics.ResponseClarity || 0) + (aiMetrics.Usefulness || 0) + (aiMetrics.PromptDepth || 0)
        : 0;

      const page = aiTotal > userTotal ? '/defeat' : '/victory';
      navigate(page, {
        state: {
          winner: { name: winner },
          scores: { user: userTotal, ai: aiTotal },
          isLocalBattle: false,
          isUserBattle: isUserBattle,
          battleId: battleId
        }
      });
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  };

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
      <div className="absolute inset-0 bg-[url('/src/pages/solo-batte-img.png')] bg-cover bg-center opacity-20"></div>
      <div className="relative container mx-auto">

        {/* Header */}
        <motion.div variants={itemVariants} className="flex justify-between items-center mb-4 bg-black/30 p-3 rounded-lg">
          <h1 className="text-xl font-bold font-orbitron">
            {isUserBattle ? `Prompt Wars: ${opponentName}` : 'Prompt Wars: Battle Arena'}
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <span>Model: {selectedModel.name}</span>
            <span>Layer: {selectedLayer.name}</span>
            <span>Difficulty: {difficulty}</span>
            {isUserBattle && (
              <span className="text-green-400">
                {waitingForOpponent ? 'Waiting for opponent...' : 'Live Battle'}
              </span>
            )}
            <button className="hover:text-brand-cyan">Profile</button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Panel: User Prompt */}
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
                disabled={isScoring || isSubmitted || waitingForOpponent}
                value={userPrompt}
                onChange={e => setUserPrompt(e.target.value)}
              ></textarea>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSubmit}
                  className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md text-sm bg-green-500/80 hover:bg-green-400 disabled:bg-gray-700 disabled:cursor-not-allowed"
                  disabled={isSubmitted || isScoring || !userPrompt || waitingForOpponent}
                >
                  <FiSend /> {isScoring ? "Submitting..." : waitingForOpponent ? "Submitted" : "Submit"}
                </button>
                {!isUserBattle && (
                  <button
                    onClick={handleEarlyFinish}
                    className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md text-sm bg-red-500/80 hover:bg-red-400 disabled:bg-gray-700 disabled:cursor-not-allowed"
                    disabled={isScoring || (!winner && (!userPrompt || isSubmitted))}
                  >
                    {winner ? "Continue" : "Early Finish"}
                  </button>
                )}
              </div>
            </div>
            {isSubmitted && (
              <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/50 mt-4">
                <h3 className="font-bold mb-2">Your Prompt</h3>
                <div className="bg-black/40 p-2 rounded mb-2 text-blue-100">{userPrompt}</div>
                {!isUserBattle && (
                  <>
                    <h4 className="font-semibold mb-1">LLM Response</h4>
                    <div className="bg-slate-900/80 p-2 rounded mb-2 text-blue-100 min-h-[60px] max-h-[400px] overflow-y-auto"
                      style={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                        border: '1px solid #3b82f6'
                      }}>
                      {userLLMResponse || 'Generating response...'}
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>

          {/* Center Panel: Battle Status */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            {/* Timer and Status */}
            <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-500/50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold font-orbitron text-glow-purple">Battle Status</h2>
                <div className="text-2xl font-bold font-orbitron text-red-400">
                  {formatTime(timer)}
                </div>
              </div>
              
              {isUserBattle && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Battle Type:</span>
                    <span className="text-green-400 font-semibold">User vs User</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Opponent:</span>
                    <span className="text-blue-400 font-semibold">{opponentName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Status:</span>
                    <span className={`font-semibold ${
                      battleStatus === 'waiting' ? 'text-yellow-400' :
                      battleStatus === 'active' ? 'text-green-400' :
                      battleStatus === 'completed' ? 'text-purple-400' : 'text-gray-400'
                    }`}>
                      {battleStatus === 'waiting' ? 'Waiting for players' :
                       battleStatus === 'active' ? 'Battle in progress' :
                       battleStatus === 'completed' ? 'Battle completed' : battleStatus}
                    </span>
                  </div>
                  {waitingForOpponent && (
                    <div className="text-center py-2 bg-yellow-500/20 rounded border border-yellow-500/30">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                        Waiting for opponent to submit their response...
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {!isUserBattle && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Battle Type:</span>
                    <span className="text-blue-400 font-semibold">User vs AI</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>AI Model:</span>
                    <span className="text-purple-400 font-semibold">{selectedModel.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Opponent Response (for user battles) */}
            {isUserBattle && opponentSubmitted && (
              <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/50">
                <h3 className="font-bold mb-2 text-red-300">Opponent's Response</h3>
                <div className="bg-black/40 p-2 rounded mb-2 text-red-100">{opponentResponse}</div>
              </div>
            )}

            {/* AI Response (for AI battles) */}
            {!isUserBattle && isSubmitted && (
              <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/50">
                <h3 className="font-bold mb-2 text-red-300">AI's Prompt</h3>
                <div className="bg-black/40 p-2 rounded mb-2 text-red-100">{aiPrompt}</div>
                <h4 className="font-semibold mb-1">AI's LLM Response</h4>
                <div className="bg-slate-900/80 p-2 rounded mb-2 text-red-100 min-h-[60px] max-h-[400px] overflow-y-auto"
                  style={{
                    background: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)',
                    border: '1px solid #ea580c'
                  }}>
                  {aiLLMResponse || 'Generating AI response...'}
                </div>
              </div>
            )}

            {/* Scoring Results */}
            {isScoring && (
              <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-500/50">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-yellow-300 font-semibold">
                    {isUserBattle ? 'Waiting for opponent...' : 'Scoring responses...'}
                  </span>
                </div>
              </div>
            )}

            {/* Winner Announcement */}
            {winner && (
              <div className="bg-green-900/30 p-4 rounded-lg border border-green-500/50">
                <h2 className="text-xl font-bold text-center text-glow-green mb-2">{winner}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <h3 className="font-semibold text-blue-300">Your Score</h3>
                    <div className="text-2xl font-bold text-blue-400">
                      {playerMetrics ? 
                        (playerMetrics.PromptClarity || 0) + (playerMetrics.ResponseClarity || 0) + (playerMetrics.Usefulness || 0) + (playerMetrics.PromptDepth || 0) 
                        : 'N/A'
                      }
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-red-300">
                      {isUserBattle ? 'Opponent Score' : 'AI Score'}
                    </h3>
                    <div className="text-2xl font-bold text-red-400">
                      {aiMetrics ? 
                        (aiMetrics.PromptClarity || 0) + (aiMetrics.ResponseClarity || 0) + (aiMetrics.Usefulness || 0) + (aiMetrics.PromptDepth || 0) 
                        : 'N/A'
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {scoreError && (
              <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/50">
                <p className="text-red-300">{scoreError}</p>
              </div>
            )}
          </motion.div>

          {/* Right Panel: Metrics */}
          <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4">
            {/* Your Metrics */}
            {playerMetrics && (
              <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/50">
                <h3 className="font-bold mb-3 text-blue-300">Your Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Prompt Clarity:</span>
                    <span className="font-semibold text-blue-400">{playerMetrics.PromptClarity || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Response Clarity:</span>
                    <span className="font-semibold text-blue-400">{playerMetrics.ResponseClarity || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Usefulness:</span>
                    <span className="font-semibold text-blue-400">{playerMetrics.Usefulness || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Prompt Depth:</span>
                    <span className="font-semibold text-blue-400">{playerMetrics.PromptDepth || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Opponent/AI Metrics */}
            {aiMetrics && (
              <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/50">
                <h3 className="font-bold mb-3 text-red-300">
                  {isUserBattle ? 'Opponent Metrics' : 'AI Metrics'}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Prompt Clarity:</span>
                    <span className="font-semibold text-red-400">{aiMetrics.PromptClarity || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Response Clarity:</span>
                    <span className="font-semibold text-red-400">{aiMetrics.ResponseClarity || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Usefulness:</span>
                    <span className="font-semibold text-red-400">{aiMetrics.Usefulness || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Prompt Depth:</span>
                    <span className="font-semibold text-red-400">{aiMetrics.PromptDepth || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default BattleArenaPage;
