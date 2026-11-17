import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSend, FiUsers, FiCpu, FiCheck } from 'react-icons/fi';
import { InviteContext } from '../context/InviteContext';
import { generateResponse, scoreResponse } from '../lib/modelClient';

// --- Utility: Clean response formatting ---
function cleanResponse(text) {
  if (!text) return '';
  return text
    .replace(/```/g, '')
    .replace(/^\s*[\r\n]/gm, '')
    .trim();
}

// --- Challenge Prompts ---
const challengePrompts = [
  "Create a comprehensive guide for beginners learning to code in Python, including best practices and common pitfalls to avoid.",
  "Design a marketing strategy for a new eco-friendly product that appeals to both environmentally conscious consumers and mainstream audiences.",
  "Write a detailed analysis of the impact of artificial intelligence on modern healthcare, including both benefits and potential risks.",
  "Develop a step-by-step plan for organizing a successful virtual team-building event that fosters collaboration and engagement.",
  "Create a persuasive argument for implementing renewable energy solutions in urban areas, considering economic, environmental, and social factors.",
  "Design an innovative educational program that uses gamification to teach complex scientific concepts to high school students.",
  "Write a comprehensive guide for small business owners on how to leverage social media marketing to increase their customer base.",
  "Develop a strategic plan for reducing food waste in restaurants while maintaining quality and profitability.",
  "Create an engaging content strategy for a fitness brand that motivates people to adopt healthier lifestyles.",
  "Design a user experience framework for mobile apps that prioritizes accessibility for users with disabilities."
];

// --- AI calls (shared client; see src/lib/modelClient.js) ---
async function generateAIResponse(prompt, selectedModel) {
  try {
    return await generateResponse(prompt, selectedModel, { maxTokens: 1000 });
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'Error generating response. Please try again.';
  }
}

const getScoreAndExplanation = scoreResponse;

// --- Main Component ---
const TeamBattleArenaPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    selectedModel = { name: 'AI Model', image: 'https://cdn-icons-png.flaticon.com/512/10883/10883782.png' },
    selectedLayer = { name: 'Battle Layer', image: 'https://img.freepik.com/free-vector/background-with-night-city-neon-lights_1441-2597.jpg' },
    difficulty = 'Medium',
    battleFocus = 'Creative',
    scenarioType = 'N/A',
    // NEW: Team battle properties
    battleId = null,
    battleType = 'team-vs-ai',
    battleConfig = null,
    teammateId = null,
    teammateName = 'Teammate',
    isInviteBattle = false
  } = location.state || {};

  const [challengePrompt, setChallengePrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [teammatePrompt, setTeammatePrompt] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [userLLMResponse, setUserLLMResponse] = useState('');
  const [teammateLLMResponse, setTeammateLLMResponse] = useState('');
  const [aiLLMResponse, setAiLLMResponse] = useState('');
  const [playerMetrics, setPlayerMetrics] = useState(null);
  const [teammateMetrics, setTeammateMetrics] = useState(null);
  const [aiMetrics, setAiMetrics] = useState(null);
  const [isScoring, setIsScoring] = useState(false);
  const [scoreError, setScoreError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [winner, setWinner] = useState('');
  const [timer, setTimer] = useState(300);

  // NEW: Team battle state
  const [teammateSubmitted, setTeammateSubmitted] = useState(false);
  const [battleStatus, setBattleStatus] = useState('waiting');
  const [waitingForTeammate, setWaitingForTeammate] = useState(false);
  const [teamScore, setTeamScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);

  // Get InviteContext for battle coordination
  const { 
    activeBattle, 
    submitBattleResponse, 
    completeBattle, 
    getBattle 
  } = useContext(InviteContext);

  // Determine if this is a team battle
  const isTeamBattle = battleType === 'team-vs-ai' && battleId && isInviteBattle;

  // Check for battle state in sessionStorage (for inviter navigation)
  useEffect(() => {
    const battleState = sessionStorage.getItem('battleState');
    if (battleState && !battleId) {
      try {
        const state = JSON.parse(battleState);
        // Clear the stored state and reload page
        sessionStorage.removeItem('battleState');
        window.location.reload();
      } catch (error) {
        console.error('Error parsing battle state:', error);
      }
    }
  }, [battleId]);

  // Load battle configuration from invite if it's a team battle
  useEffect(() => {
    if (isTeamBattle && battleConfig) {
      // Use the battle configuration from the invite
      if (battleConfig.selectedModel) {
        Object.assign(selectedModel, battleConfig.selectedModel);
      }
      if (battleConfig.selectedLayer) {
        Object.assign(selectedLayer, battleConfig.selectedLayer);
      }
    }
  }, [isTeamBattle, battleConfig]);

  // Subscribe to battle updates for team battles
  useEffect(() => {
    if (!isTeamBattle || !battleId) return;

    const checkBattleStatus = async () => {
      const { success, data } = await getBattle(battleId);
      if (success && data) {
        setBattleStatus(data.status);
        
        // Check if teammate has submitted their response
        if (data.player1_response && data.player2_response) {
          setTeammatePrompt(data.player1_response || data.player2_response);
          setTeammateSubmitted(true);
          
          // If both team members have submitted, proceed to scoring
          if (data.status === 'active') {
            handleTeamResponsesSubmitted(data);
          }
        }
      }
    };

    // Check initial status
    checkBattleStatus();

    // Set up polling for battle updates (every 2 seconds)
    const interval = setInterval(checkBattleStatus, 2000);

    return () => clearInterval(interval);
  }, [battleId, isTeamBattle]);

  // Handle when both team members have submitted responses
  const handleTeamResponsesSubmitted = async (battleData) => {
    setIsScoring(true);
    setScoreError('');

    try {
      // Get both team responses
      const player1Response = battleData.player1_response;
      const player2Response = battleData.player2_response;

      // Generate AI response for comparison
      const aiResponse = await generateAIResponse(challengePrompt, selectedModel.name);
      setAiLLMResponse(aiResponse);

      // Score all responses against the challenge prompt
      const [player1Score, player2Score, aiScoreResult] = await Promise.all([
        getScoreAndExplanation(challengePrompt, player1Response),
        getScoreAndExplanation(challengePrompt, player2Response),
        getScoreAndExplanation(challengePrompt, aiResponse)
      ]);

      // Calculate totals
      const player1Total = (player1Score.PromptClarity || 0) + (player1Score.ResponseClarity || 0) + (player1Score.Usefulness || 0) + (player1Score.PromptDepth || 0);
      const player2Total = (player2Score.PromptClarity || 0) + (player2Score.ResponseClarity || 0) + (player2Score.Usefulness || 0) + (player2Score.PromptDepth || 0);
      const aiTotal = (aiScoreResult.PromptClarity || 0) + (aiScoreResult.ResponseClarity || 0) + (aiScoreResult.Usefulness || 0) + (aiScoreResult.PromptDepth || 0);

      // Calculate team score (average of both players)
      const teamTotal = Math.round((player1Total + player2Total) / 2);

      // Complete the battle
      const scores = {
        player1_id: battleData.player1_id,
        player2_id: battleData.player2_id,
        player1_score: teamTotal,
        player2_score: aiTotal
      };

      const completeResult = await completeBattle(battleId, scores);
      
      if (completeResult.success) {
        // Determine winner
        if (teamTotal > aiTotal) {
          setWinner('Team Wins!');
        } else if (aiTotal > teamTotal) {
          setWinner('AI Wins!');
        } else {
          setWinner("It's a Tie!");
        }

        setPlayerMetrics(player1Score);
        setTeammateMetrics(player2Score);
        setAiMetrics(aiScoreResult);
        setTeamScore(teamTotal);
        setAiScore(aiTotal);
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
    if (isTeamBattle) return; // Skip for team battles

    async function getAIPrompt() {
      if (challengePrompt && selectedModel?.name) {
        const metaPrompt = `You are an expert prompt engineer. Write the single best prompt you can that would get an LLM to generate the best possible response to the following challenge:\n\n${challengePrompt}\n\nOnly output your prompt.`;
        const aiPromptResult = await generateAIResponse(metaPrompt, selectedModel.name);
        setAiPrompt(aiPromptResult);
      }
    }
    getAIPrompt();
    // eslint-disable-next-line
  }, [challengePrompt, selectedModel, isTeamBattle]);

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
    if (isTeamBattle) {
      // Handle team battle submission
      handleTeamBattleSubmit();
    } else {
      // Handle AI battle submission (existing logic)
      handleAIBattleSubmit();
    }
  };

  // Handle team battle submission
  const handleTeamBattleSubmit = async () => {
    if (!userPrompt.trim()) return;

    setIsScoring(true);
    setScoreError('');
    setWaitingForTeammate(true);

    try {
      // Submit response to battle
      const result = await submitBattleResponse(battleId, userPrompt);
      
      if (result.success) {
        setIsSubmitted(true);
        setBattleStatus('active');
        
        // Wait for teammate response
        setWaitingForTeammate(true);
      } else {
        throw new Error('Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting team battle response:', error);
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
          isTeamBattle: isTeamBattle,
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
      <div className="absolute inset-0 bg-[url('/src/pages/battle-arena-image.png')] bg-cover bg-center opacity-20"></div>
      <div className="relative container mx-auto">

        {/* Header */}
        <motion.div variants={itemVariants} className="flex justify-between items-center mb-4 bg-black/30 p-3 rounded-lg">
          <h1 className="text-xl font-bold font-orbitron">
            {isTeamBattle ? `Team Battle: ${teammateName}` : 'Team Battle Arena'}
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <span>Model: {selectedModel.name}</span>
            <span>Layer: {selectedLayer.name}</span>
            <span>Difficulty: {difficulty}</span>
            {isTeamBattle && (
              <span className="text-green-400">
                {waitingForTeammate ? 'Waiting for teammate...' : 'Team Battle'}
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
                disabled={isScoring || isSubmitted || waitingForTeammate}
                value={userPrompt}
                onChange={e => setUserPrompt(e.target.value)}
              ></textarea>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSubmit}
                  className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md text-sm bg-green-500/80 hover:bg-green-400 disabled:bg-gray-700 disabled:cursor-not-allowed"
                  disabled={isSubmitted || isScoring || !userPrompt || waitingForTeammate}
                >
                  <FiSend /> {isScoring ? "Submitting..." : waitingForTeammate ? "Submitted" : "Submit"}
                </button>
                {!isTeamBattle && (
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
                {!isTeamBattle && (
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
                <h2 className="text-lg font-bold font-orbitron text-glow-purple">Team Battle Status</h2>
                <div className="text-2xl font-bold font-orbitron text-red-400">
                  {formatTime(timer)}
                </div>
              </div>
              
              {isTeamBattle && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Battle Type:</span>
                    <span className="text-green-400 font-semibold">Team vs AI</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Teammate:</span>
                    <span className="text-blue-400 font-semibold">{teammateName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Status:</span>
                    <span className={`font-semibold ${
                      battleStatus === 'waiting' ? 'text-yellow-400' :
                      battleStatus === 'active' ? 'text-green-400' :
                      battleStatus === 'completed' ? 'text-purple-400' : 'text-gray-400'
                    }`}>
                      {battleStatus === 'waiting' ? 'Waiting for team' :
                       battleStatus === 'active' ? 'Battle in progress' :
                       battleStatus === 'completed' ? 'Battle completed' : battleStatus}
                    </span>
                  </div>
                  {waitingForTeammate && (
                    <div className="text-center py-2 bg-yellow-500/20 rounded border border-yellow-500/30">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                        Waiting for teammate to submit their response...
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {!isTeamBattle && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Battle Type:</span>
                    <span className="text-blue-400 font-semibold">Team vs AI</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>AI Model:</span>
                    <span className="text-purple-400 font-semibold">{selectedModel.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Teammate Response (for team battles) */}
            {isTeamBattle && teammateSubmitted && (
              <div className="bg-green-900/30 p-4 rounded-lg border border-green-500/50">
                <h3 className="font-bold mb-2 text-green-300">Teammate's Response</h3>
                <div className="bg-black/40 p-2 rounded mb-2 text-green-100">{teammatePrompt}</div>
              </div>
            )}

            {/* AI Response (for AI battles) */}
            {!isTeamBattle && isSubmitted && (
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
                    {isTeamBattle ? 'Waiting for teammate...' : 'Scoring responses...'}
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
                    <h3 className="font-semibold text-blue-300">Team Score</h3>
                    <div className="text-2xl font-bold text-blue-400">
                      {teamScore || 'N/A'}
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-red-300">AI Score</h3>
                    <div className="text-2xl font-bold text-red-400">
                      {aiScore || 'N/A'}
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

            {/* Teammate Metrics */}
            {teammateMetrics && (
              <div className="bg-green-900/30 p-4 rounded-lg border border-green-500/50">
                <h3 className="font-bold mb-3 text-green-300">Teammate Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Prompt Clarity:</span>
                    <span className="font-semibold text-green-400">{teammateMetrics.PromptClarity || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Response Clarity:</span>
                    <span className="font-semibold text-green-400">{teammateMetrics.ResponseClarity || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Usefulness:</span>
                    <span className="font-semibold text-green-400">{teammateMetrics.Usefulness || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Prompt Depth:</span>
                    <span className="font-semibold text-green-400">{teammateMetrics.PromptDepth || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Metrics */}
            {aiMetrics && (
              <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/50">
                <h3 className="font-bold mb-3 text-red-300">AI Metrics</h3>
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

export default TeamBattleArenaPage;
