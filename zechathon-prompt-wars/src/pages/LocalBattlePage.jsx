import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const MODEL_MAPPING = {
  "DeepSeek R1": "deepseek/deepseek-r1-0528:free",
  "Google Gemma 3": "google/gemma-3-27b-it:free",
  "Mistral AI": "mistralai/mistral-small-3.1-24b-instruct:free",
  "Meta Llama 3.3": "meta-llama/llama-3.3-70b-instruct:free"
};
  const API_KEY = "REPLACE_WITH_YOUR_OPENROUTER_KEY";
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
  const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Utility to clean unwanted symbols from responses
const cleanResponse = (text) => {
  return text.replace(/[*#$_`~>\-\[\]]/g, '').replace(/\s{2,}/g, ' ').trim();
};

// Normalize scoring keys to handle both "Prompt Clarity" and "PromptClarity"
const normalizeScores = (result) => ({
  PromptClarity: result.PromptClarity ?? result["Prompt Clarity"] ?? 0,
  ResponseClarity: result.ResponseClarity ?? result["Response Clarity"] ?? 0,
  Usefulness: result.Usefulness ?? result["Usefulness"] ?? 0,
  PromptDepth: result.PromptDepth ?? result["Prompt Depth"] ?? 0,
  explanation: result.explanation ?? ""
});

// Scoring function with 429 handling and symbol-free output
const getScoreAndExplanation = async (promptText, responseText) => {
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
Do not use any markdown, bullet points, asterisks (*), hashtags (#), dollar signs ($), or any other special formatting symbols in your explanation or output. Output should be plain text only.

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
      const resetTimestamp = response.headers.get('X-RateLimit-Reset');
      let resetMessage = "You have exceeded your free daily limit for model scoring. ";
      if (resetTimestamp) {
        const resetDate = new Date(Number(resetTimestamp));
        resetMessage += `Your quota will reset at ${resetDate.toLocaleString()}. `;
      }
      resetMessage += "Add $10 credits to unlock 1000 free requests per day.";
      return {
        PromptClarity: 0,
        ResponseClarity: 0,
        Usefulness: 0,
        PromptDepth: 0,
        explanation: resetMessage
      };
    }

    if (!response.ok) {
      throw new Error(`Judge model HTTP error! status: ${response.status} - ${text}`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Judge model returned invalid JSON');
    }

    let result;
    try {
      result = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      result = {
        PromptClarity: 20,
        ResponseClarity: 20,
        Usefulness: 20,
        PromptDepth: 20,
        explanation: "Could not parse judge model output."
      };
    }
    return normalizeScores(result);
  } catch (error) {
    console.error("Error in getScoreAndExplanation:", error);
    return {
      PromptClarity: 0,
      ResponseClarity: 0,
      Usefulness: 0,
      PromptDepth: 0,
      explanation: "No score due to error."
    };
  }
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
      const payload = {
        model: MODEL_MAPPING[modelName] || MODEL_MAPPING["Mistral AI"],
        messages: [
          { role: "system", content: "You are a Professional Financial consultant and mainly focus on Financial domain. Never include internal reasoning steps, thoughts, or planning in your responses (e.g., 'Let me think', 'First I will do X'). Do not output any tags like <think>. Your responses should be crisp, clear and easy to understand because the users are people who trying to gain knowledge about the financial domain. The responses should be professional with no bin texts/words. EVERY RESPONSE SHOULD BE STRICTLY RELATED TO FINANCIAL DOMAIN ONLY. Do not use any markdown, bullet points, asterisks (*), hashtags (#), dollar signs ($), or any other special formatting symbols. Output should be plain text only." },
          { role: "user", content: initialPrompt }
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${text}`);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Model returned invalid JSON');
      }

      const responseText = data.choices?.[0]?.message?.content || "No response generated";
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