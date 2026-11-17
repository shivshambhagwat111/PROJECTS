// Single place for every LLM call in the app: response generation and
// LLM-as-judge scoring. Pages import from here instead of calling `fetch`
// themselves, so models, endpoints, keys, rate-limit handling and the scoring
// rubric are defined once.
//
// NOTE: calls still run in the browser, so the keys are visible to users.
// For anything beyond a demo, put these two functions behind a server proxy.

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const COHERE_URL = 'https://api.cohere.ai/v1/chat';

// Display name -> provider model id. Add a model here and every battle mode
// can use it.
export const MODEL_MAPPING = {
  'DeepSeek R1': 'deepseek/deepseek-r1-0528:free',
  'Google Gemma 3': 'google/gemma-3-27b-it:free',
  'Mistral AI': 'mistralai/mistral-small-3.1-24b-instruct:free',
  'Meta Llama 3.3': 'meta-llama/llama-3.3-70b-instruct:free',
  'Cohere AI': 'command-r-plus',
};

const DEFAULT_MODEL = 'Mistral AI';
const JUDGE_MODEL = 'Mistral AI';

const DEFAULT_SYSTEM_PROMPT =
  'You are participating in an AI battle arena. Provide a helpful, accurate, and clearly formatted response. Do not use markdown symbols, emojis, or decorative text. Use plain language, clear headings, and bullet points only if needed.';

export const SCORE_KEYS = ['PromptClarity', 'ResponseClarity', 'Usefulness', 'PromptDepth'];
const MAX_PER_CRITERION = 25;

const MAX_RETRIES = 2; // retries after the first attempt, on HTTP 429 only
const BASE_BACKOFF_MS = 1500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class RateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RateLimitError';
  }
}

function providerFor(modelName) {
  if (modelName === 'Cohere AI') {
    return { url: COHERE_URL, key: import.meta.env.VITE_COHERE_API_KEY, name: 'VITE_COHERE_API_KEY', cohere: true };
  }
  return { url: OPENROUTER_URL, key: import.meta.env.VITE_OPENROUTER_API_KEY, name: 'VITE_OPENROUTER_API_KEY', cohere: false };
}

// POST with exponential backoff on 429. Returns parsed JSON.
async function postJson(provider, body) {
  if (!provider.key) {
    throw new Error(`Missing ${provider.name}. Add it to your .env file (see .env.example).`);
  }

  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(provider.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_BACKOFF_MS * 2 ** attempt);
        continue;
      }
      throw new RateLimitError('Free-tier rate limit reached. Please try again in a moment.');
    }

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Model API error ${response.status}: ${text.slice(0, 200)}`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Model API returned invalid JSON');
    }
  }
}

/**
 * Generate a model response.
 * @param {string} prompt
 * @param {string} modelName  key of MODEL_MAPPING (unknown names fall back to the default model)
 * @param {{system?: string, temperature?: number, maxTokens?: number}} [options]
 * @returns {Promise<string>}
 */
export async function generateResponse(prompt, modelName, options = {}) {
  const { system = DEFAULT_SYSTEM_PROMPT, temperature = 0.7, maxTokens = 400 } = options;
  const resolvedName = MODEL_MAPPING[modelName] ? modelName : DEFAULT_MODEL;
  const provider = providerFor(resolvedName);
  const model = MODEL_MAPPING[resolvedName];

  const body = provider.cohere
    ? { model, message: prompt, preamble: system, temperature, max_tokens: maxTokens }
    : {
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
      };

  const data = await postJson(provider, body);
  const content = provider.cohere ? data.text : data.choices?.[0]?.message?.content;
  return content || 'No response generated';
}

const JUDGE_PROMPT = (promptText, responseText) => `
You are an expert AI evaluator. Score the following AI response to a user prompt on these four criteria, each out of ${MAX_PER_CRITERION}:
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
Use plain text only in the explanation, with no markdown or special formatting symbols.

Prompt: """${promptText}"""
Response: """${responseText}"""
`;

/** An all-zero result that is explicitly marked as not judged. */
export function unscored(explanation) {
  return { PromptClarity: 0, ResponseClarity: 0, Usefulness: 0, PromptDepth: 0, explanation, judged: false };
}

export const totalScore = (scores) => SCORE_KEYS.reduce((sum, key) => sum + (Number(scores?.[key]) || 0), 0);

// Accepts "PromptClarity" or "Prompt Clarity"; returns null unless all four
// criteria are present and numeric. Values are clamped to 0-25.
function normalizeScores(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  for (const key of SCORE_KEYS) {
    const spaced = key.replace(/([a-z])([A-Z])/g, '$1 $2');
    const value = Number(raw[key] ?? raw[spaced]);
    if (!Number.isFinite(value)) return null;
    out[key] = Math.min(MAX_PER_CRITERION, Math.max(0, value));
  }
  out.explanation = typeof raw.explanation === 'string' ? raw.explanation : '';
  return out;
}

function parseJudgeOutput(content) {
  if (!content) return null;
  const match = String(content).match(/\{[\s\S]*\}/); // tolerate ```json fences or extra prose
  if (!match) return null;
  try {
    return normalizeScores(JSON.parse(match[0]));
  } catch {
    return null;
  }
}

/**
 * LLM-as-judge: scores a response on four criteria worth 25 points each
 * (100 total). Never throws. If the judge is rate limited, errors, or returns
 * unusable output, the result is all zeros with `judged: false` and an
 * explanation saying why, so a failed judgement is never mistaken for a real
 * score.
 */
export async function scoreResponse(promptText, responseText) {
  const provider = providerFor(JUDGE_MODEL);
  const body = {
    model: MODEL_MAPPING[JUDGE_MODEL],
    messages: [{ role: 'user', content: JUDGE_PROMPT(promptText, responseText) }],
    temperature: 0.2,
    max_tokens: 300,
    response_format: { type: 'json_object' },
  };

  try {
    const data = await postJson(provider, body);
    const scores = parseJudgeOutput(data.choices?.[0]?.message?.content);
    if (!scores) return unscored('The judge returned an unreadable score, so this response was not scored.');
    return { ...scores, judged: true };
  } catch (error) {
    if (error instanceof RateLimitError) return unscored(error.message);
    console.error('Judge error:', error);
    return unscored('Scoring failed, so this response was not scored.');
  }
}
