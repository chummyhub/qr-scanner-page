# Claude App (React + Claude API)

A React (Vite) frontend with a small Express backend that talks to Claude.

```
Browser (React, src/)  ──POST /api/chat──▶  Express server (server/index.js)  ──▶  Claude API
                       ◀── streamed text ──                                     (API key lives here)
```

The API key stays on the server. Never put it in React code, because anything in the frontend can be read by anyone who opens the page.

## 1. Get an API key

A **Claude Pro subscription does not include API access.** The API is a separate product with pay-as-you-go billing:

1. Go to https://console.anthropic.com and sign in.
2. Add credits under **Billing**.
3. Create a key under **Settings → API Keys**.

## 2. Configure

```bash
cp .env.example .env
```

Edit `.env` and paste your key into `ANTHROPIC_API_KEY=`.

## 3. Run

```bash
npm install
npm run dev
```

Open http://localhost:5173. This starts both the React dev server (port 5173) and the API server (port 3001).

## Where to change things

| What | File |
|---|---|
| UI / components | `src/App.jsx`, `src/App.css` |
| System prompt, model, Claude settings | `server/index.js` |
| Dev proxy (`/api` → backend) | `vite.config.js` |
