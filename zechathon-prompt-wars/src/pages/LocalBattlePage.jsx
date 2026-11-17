import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { generateResponse as callModel, scoreResponse as getScoreAndExplanation } from '../lib/modelClient';

const FINANCE_SYSTEM_PROMPT = "You are a Professional Financial consultant and mainly focus on Financial domain. Never include internal reasoning steps, thoughts, or planning in your responses (e.g., 'Let me think', 'First I will do X'). Do not output any tags like <think>. Your responses should be crisp, clear and easy to understand because the users are people who trying to gain knowledge about the financial domain. The responses should be professional with no bin texts/words. EVERY RESPONSE SHOULD BE STRICTLY RELATED TO FINANCIAL DOMAIN ONLY. Do not use any markdown, bullet points, asterisks (*), hashtags (#), dollar signs ($), or any other special formatting symbols. Output should be plain text only.";

// Utility to clean unwanted symbols from responses
const cleanResponse = (text) => {
  return text.replace(/[*#$_`~>\-\[\]]/g, '').replace(/\s{2,}/g, ' ').trim();
};


const LocalBattlePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [timer, setTimer] = useState(116);
  const [paused, setPaused] = useState(false);
  const [responses, setResponses] = useState({});
  const [scores, setScores] = useState({});
  const [metrics, setMetrics] = useState({});
  const [isGenerating, setIsGenerating] = useState({});
  const [battleStarted, setBattleStarted] = useState(false);

  const battleData = location.state || {};
  const { modelA = "DeepSeek R1", modelB = "Google Gemma 3", prompt = "" } = battleData;
  const initialPrompt = prompt || "Type your prompt here...";

  // Timer effect
  useEffect(() => {
    if (paused || timer === 0) return;
    const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, paused]);

  // Start battle on mount
  useEffect(() => {
    if (!battleStarted) startBattle();
    // eslint-disable-next-line
  }, []);

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // Generate response and score for a model
  const generateResponse = async (modelName) => {
    setIsGenerating(prev => ({ ...prev, [modelName]: true }));
    try {
      const responseText = await callModel(initialPrompt, modelName, { system: FINANCE_SYSTEM_PROMPT });
      const cleanedText = cleanResponse(responseText);
      setResponses(prev => ({ ...prev, [modelName]: cleanedText }));

      // Score the response
      const scoresObj = await getScoreAndExplanation(initialPrompt, cleanedText);
      setMetrics(prev => ({ ...prev, [modelName]: scoresObj }));
      setScores(prev => ({
        ...prev,
        [modelName]:
          (scoresObj.PromptClarity || 0) +
          (scoresObj.ResponseClarity || 0) +
          (scoresObj.Usefulness || 0) +
          (scoresObj.PromptDepth || 0)
      }));
    } catch (error) {
      setResponses(prev => ({ ...prev, [modelName]: `Error: ${error.message}` }));
      setMetrics(prev => ({
        ...prev,
        [modelName]: {
          PromptClarity: 0,
          ResponseClarity: 0,
          Usefulness: 0,
          PromptDepth: 0,
          explanation: "No score due to error."
        }
      }));
      setScores(prev => ({ ...prev, [modelName]: 0 }));
      console.error("Error in generateResponse:", error);
    } finally {
      setIsGenerating(prev => ({ ...prev, [modelName]: false }));
    }
  };

  // Start battle
  const startBattle = async () => {
    setBattleStarted(true);
    await Promise.all([
      generateResponse(modelA),
      generateResponse(modelB)
    ]);
  };

  const getModelData = (modelName) => {
    return {
      name: modelName,
      response: responses[modelName] || (isGenerating[modelName] ? "Generating response..." : "No response yet"),
      ...metrics[modelName],
      score: scores[modelName] || 0,
      isLoading: isGenerating[modelName] || false
    };
  };

  const modelAData = getModelData(modelA);
  const modelBData = getModelData(modelB);

  return (
    <div className="min-h-screen bg-[#181c23] text-white font-sans px-8 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold tracking-wide">Local Battle</h1>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-[#23272f] px-4 py-2 rounded-lg">
            <span className="text-lg font-mono">{formatTime(timer)}</span>
            <span className="text-sm font-bold">|</span>
            <span className="text-sm font-semibold">Round 1/5</span>
          </div>
          <button
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-5 py-2 rounded-lg transition"
            onClick={() => setPaused(!paused)}
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-[#23272f] rounded-full mb-6">
        <div
          className="h-2 bg-yellow-500 rounded-full transition-all"
          style={{ width: `${((116 - timer) / 116) * 100}%` }}
        />
      </div>

      {/* Prompt */}
      <div className="bg-[#23272f] rounded-xl p-5 mb-6">
        <div className="text-sm text-gray-400 mb-1">Your Command</div>
        <div className="text-lg font-medium">{initialPrompt}</div>
      </div>

      {/* Model Responses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Model A */}
        <div className="border-2 border-cyan-400 rounded-xl p-5 flex flex-col gap-2">
          <div className="font-bold text-cyan-300 text-lg">{modelAData.name}</div>
          <div className="text-sm max-h-64 overflow-y-auto whitespace-pre-line">
            <span className="font-bold text-gray-300">Response: </span>
            <span className="text-gray-200">{modelAData.response}</span>
          </div>
        </div>
        {/* Model B */}
        <div className="border-2 border-purple-400 rounded-xl p-5 flex flex-col gap-2">
          <div className="font-bold text-purple-300 text-lg">{modelBData.name}</div>
          <div className="text-sm max-h-64 overflow-y-auto whitespace-pre-line">
            <span className="font-bold text-gray-300">Response: </span>
            <span className="text-gray-200">{modelBData.response}</span>
          </div>
        </div>
      </div>

      {/* Live Scoreboard */}
      <div className="bg-[#23272f] rounded-xl p-5 mb-6">
        <div className="font-bold mb-3 text-lg flex items-center gap-2">
          <span className="text-yellow-400">⚡</span> Live Scoreboard
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center mb-1">
              <div className="font-semibold text-cyan-300">{modelAData.name}</div>
              <div className="font-bold text-2xl text-cyan-100">{modelAData.score}</div>
            </div>
            <div className="h-3 bg-[#181c23] rounded-full">
              <div
                className="h-3 bg-cyan-400 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (modelAData.score))}%` }}
              />
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center mb-1">
              <div className="font-semibold text-purple-300">{modelBData.name}</div>
              <div className="font-bold text-2xl text-purple-100">{modelBData.score}</div>
            </div>
            <div className="h-3 bg-[#181c23] rounded-full">
              <div
                className="h-3 bg-purple-400 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (modelBData.score))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-[#23272f] rounded-xl p-5">
        <div className="font-bold mb-3 text-lg">Performance Metrics</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Model A Metrics */}
          <div>
            <div className="font-semibold text-cyan-300 mb-2">{modelAData.name}</div>
            {metrics[modelA] ? (
              <>
                <div className="mb-2 flex justify-between"><span>PromptClarity</span><span>{metrics[modelA].PromptClarity}/25</span></div>
                <div className="mb-2 flex justify-between"><span>ResponseClarity</span><span>{metrics[modelA].ResponseClarity}/25</span></div>
                <div className="mb-2 flex justify-between"><span>Usefulness</span><span>{metrics[modelA].Usefulness}/25</span></div>
                <div className="mb-2 flex justify-between"><span>PromptDepth</span><span>{metrics[modelA].PromptDepth}/25</span></div>
                <div className="mt-2 font-bold text-cyan-200">Total: {modelAData.score}/100</div>
                <div className="mt-2 text-xs text-gray-400">{metrics[modelA].explanation}</div>
              </>
            ) : (
              <div className="text-gray-500">Not scored yet</div>
            )}
          </div>
          {/* Model B Metrics */}
          <div>
            <div className="font-semibold text-purple-300 mb-2">{modelBData.name}</div>
            {metrics[modelB] ? (
              <>
                <div className="mb-2 flex justify-between"><span>PromptClarity</span><span>{metrics[modelB].PromptClarity}/25</span></div>
                <div className="mb-2 flex justify-between"><span>ResponseClarity</span><span>{metrics[modelB].ResponseClarity}/25</span></div>
                <div className="mb-2 flex justify-between"><span>Usefulness</span><span>{metrics[modelB].Usefulness}/25</span></div>
                <div className="mb-2 flex justify-between"><span>PromptDepth</span><span>{metrics[modelB].PromptDepth}/25</span></div>
                <div className="mt-2 font-bold text-purple-200">Total: {modelBData.score}/100</div>
                <div className="mt-2 text-xs text-gray-400">{metrics[modelB].explanation}</div>
              </>
            ) : (
              <div className="text-gray-500">Not scored yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalBattlePage