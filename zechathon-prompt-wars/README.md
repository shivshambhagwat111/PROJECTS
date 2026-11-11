# Zechathon Prompt Wars

A gamified AI-prompting platform where users compete by writing prompts for different LLMs to solve finance and technical challenges. Built with ZeTheta Algorithms.

## Features
- Battle modes: solo, vs-AI, team and local
- LLM-as-judge scoring on four criteria (prompt clarity, response clarity, usefulness, depth), 25 points each
- Free-tier models through OpenRouter (DeepSeek R1, Gemma 3, Mistral Small 3.1, Llama 3.3 70B)
- Supabase auth, Postgres tables, realtime presence and friend invites

## Run locally
```bash
npm install
cp .env.example .env   # add your Supabase values
npm run dev
```

## Configuration
API keys are not stored in this repo. Replace the `REPLACE_WITH_YOUR_OPENROUTER_KEY` and
`REPLACE_WITH_YOUR_COHERE_KEY` placeholders in `src/pages/*BattleArenaPage.jsx` and
`src/pages/LocalBattlePage.jsx` with your own keys, or better, move the model calls behind a
small server proxy so keys never reach the browser.

## Known limitations
- Model calls are made from the browser, so any key you add is visible to users. A server proxy is the proper fix.
- Free-tier models are rate limited; the app shows a message on HTTP 429.
