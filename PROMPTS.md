# PROMPTS.md

Key AI prompts used while planning and building the **Sports Catchup** app (Cloudflare Workers backend + Cloudflare Pages with Vue frontend).

This file includes _planning_, _design_, _setup_ _debugging_ prompts along others.

_Note: Not all prompts are listed- some were minor and/or got lost. Also, I tried to organize by order/logic, but not all of them are in direct chronological order top to bottom_

## 1. Project Planning & Requirements

- **High-level idea**

  > I want to build a small AI project on Cloudflare Workers + Workers AI using the `@cf/meta/llama-3.3-70b-instruct-fp8-fast` model. The app should answer: “How did _{team}_ do today/yesterday?” for NFL, NCAAF, and NBA, and potentially handle follow ups like leading scorer or shooting stats. Is this a good scope to learn Workers + Workers AI?

- **Functional scope**

  > Help me design a minimal, iterative plan based on: Step 1: extract `{sport, team, when}` from free text. Step 2: fetch real game data from API-SPORTS (free tier). Step 3: generate a concise summary. Keep the implementation lean and expandable.

- **User flow**
  > From the user’s perspective, what is the E2E flow? Where is the entry point, how do requests move through extraction -> stats -> summarization, and where should code for tools/endpoints live?

---

## 2. Architecture & Project Structure

- **Backend-first approach**

  > I’ll focus on the backend first. My repo is `sports-worker-js` with `src/` and `test/`. Recommend a simple file and folder structure for a Worker with: routing, extraction, stats, and summarization modules.

- **API surface choice**
  > Is it better to have the frontend call multiple endpoints (`/api/extract`, `/api/stats`, `/api/answer`) or a single `/api/answer` that orchestrates everything server-side? Recommend what fits Workers best and explain why.

---

## 3. Data Extraction (Workers AI)

- **Extraction prompt design**

  > Create a system + user prompt pairing to extract `{sport, team, when}` as strict JSON. Allowed sports: `{nba, nfl, ncaaf}`; map “college football” ->`ncaaf`, “basketball -> `nba`. Limit `when` to `today|yesterday`. If unsure, pick the most likely team and still return valid JSON.

---

## 4. External Data (API-SPORTS)

- **API plan (free tier)**

  > Outline the minimum viable set of API-SPORTS endpoints for NFL/NCAAF/NBA to answer “how did they do today/yesterday?” Include parameters we must track (date, league, team ID/name). Account for the free plan api limits.

- **Season/year logic**

  > Provide a small helper spec to compute the season year for NFL/NCAAF (season year switches in August) and NBA (season year switches in October), considering `America/Chicago`.

- **Team name normalization**

  > Propose a strategy to normalize user-input team names to official names/IDs via `/teams?search=`, including exact match -> partial match -> fallback behavior.

- **Date handling**
  > Specify a simple approach to resolve `today|yesterday` in `America/Chicago` and return `YYYY-MM-DD`.

---

## 5. Data Shape & Output

- **Response design**

  > Define the response shape for `/api/answer`. I want a concise `summary` plus raw `scores` and `stats`, and the extracted `entities` for transparency.

- **Merging**
  > Keep it simple: I don’t want to munge fields together. Return `{ scores: {...}, stats: {...} }` alongside the `summary` and `entities`.

---

## 6. Orchestration & Routing

- **Single endpoint orchestration**

  > Design `/api/answer (POST)` to: extract entities -> fetch the correct game -> get team/game stats -> summarize with the LLM. No streaming yet. Return structured JSON.

- **Dev endpoints**
  > I want `/api/extract` and `/api/stats` for debugging only. Show how to gate them behind an env flag so they’re disabled in production.

---

## 7. CORS, Environments, and Config

- **CORS policy**

  > Provide a minimal, consistent CORS approach for separate origins (Pages UI -> Worker API). Include handling for `OPTIONS` preflight and ensure all responses (success/error) return CORS headers.

- **Origin selection**

  > Clarify that `Access-Control-Allow-Origin` must be set to the **frontend origin** (Pages URL in prod, `http://localhost:5173` in dev), not the Worker URL. Suggest reading it from `env.FRONTEND_ORIGIN`.

- **Wrangler environments**
  > Show how to structure `wrangler.json[c]` with `dev` and `production` envs, including `FRONTEND_ORIGIN` and a flag for `ENABLE_DEV_ENDPOINTS`. Explain where to store secrets (`APISPORTS_KEY`) and how to set them with `wrangler secret put`.

---

## 8. Frontend (Vue + Vite on Pages)

- **Frontend scaffolding**

  > Provide a minimal Vue 3 + Vite setup for a single chat page. No router/state libs. Keep UI simple (input, messages list, small error area). Use a `.env.local` with `VITE_API_BASE` for local dev.

- **Dev proxy (optional)**
  > Suggest using a Vite dev proxy to avoid CORS in local dev (map `/api` -> `http://localhost:8787`), and discuss tradeoffs vs keeping explicit CORS.

---

## 9. Testing & Debugging

- **Local curl (dev)**

  > Give curl examples for `/api/answer`, `/api/extract`, and `/api/stats` against `http://localhost:8787`, including typical payloads like:
  >
  > - `{"message":"How did the Seattle Seahawks do yesterday?"}`
  > - `{"sport":"nfl","team":"seahawks","when":"yesterday"}`

---

## 10. Deployment

- **Worker deployment (prod)**

  > Confirm the exact steps/commands for Wrangle to deploy the Worker to `--env production` and set secrets. Clarify that `wrangler deploy` ships **local** code and not from GitHub main.
