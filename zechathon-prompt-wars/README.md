# Zechathon Prompt Wars

A gamified AI-prompting platform where users compete by writing prompts for different LLMs to solve finance and technical challenges. Built with ZeTheta Algorithms.

## Features
- Battle modes: solo, vs-AI, team and local
- LLM-as-judge scoring on four criteria (prompt clarity, response clarity, usefulness, depth), 25 points each
- Free-tier models through OpenRouter (DeepSeek R1, Gemma 3, Mistral Small 3.1, Llama 3.3 70B); Cohere optional in vs-AI mode
- Supabase auth, Postgres tables, realtime presence and friend invites
- Leaderboard ranking players by vs-AI wins and average judge score

## Architecture
All model calls go through one module, `src/lib/modelClient.js`:
- `MODEL_MAPPING`: display name to provider model id. Adding a model is a one-line change.
- `generateResponse(prompt, model, options)`: one entry point for every battle mode.
- `scoreResponse(prompt, response)`: the shared judge and rubric (4 criteria x 25 = 100).
- Rate limits (HTTP 429) are retried with exponential backoff. If the judge still fails, is rate limited, or returns unreadable output, the result is zeros flagged `judged: false` with an explanation, so a failed judgement is never mistaken for a real score.

## Run locally
```bash
npm install
cp .env.example .env   # add your Supabase and OpenRouter values
npm run dev
```

## Configuration
Keys are read from environment variables (`VITE_OPENROUTER_API_KEY`, optionally `VITE_COHERE_API_KEY`) and are not stored in this repo.

## Known limitations
- Model calls are made from the browser, so any key you add is visible to users. Move `src/lib/modelClient.js` behind a small server proxy to fix this.
- Free-tier models are rate limited; the app retries, then shows a message.
- The leaderboard (`/leaderboard`) ranks players on vs-AI battles only, because that is the only mode that saves results (the `vsai` table). Solo, team and local scores are not persisted yet. Ranking is computed in the browser over the latest 1,000 battles; at larger scale it should move to a SQL view.
- Reading the leaderboard needs a Supabase select policy on `vsai` (and optionally `profiles`) for the signed-in user.
- Judge scores come from a single free-tier model and can vary between runs.
