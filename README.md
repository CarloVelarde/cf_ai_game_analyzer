# Sports Catchup (Cloudflare Worker)

By Carlo Velarde

This project is a Cloudflare worker that gives the latest insights on your favorite football or basketball team (ncaaf, nfl, and nba supported). It is a great way for getting a quick summary of your team's latest game!

The flow of the worker is as follows:

- extracts `{sport, team, when}` from a user prompt (uses workers ai: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`)
- fetches game data from API-SPORTS (NFL, NCAAF, NBA)
- returns a short summary plus raw scores/stats

Visit demo: https://cf-ai-game-analyzer.pages.dev  
Access Backend (Worker): `POST /api/answer`

---

## Quick Start (Local)

### Requirements

- Node 18+
- Cloudflare account (`npx wrangler login`)
- API-SPORTS key (free tier works: access here https://dashboard.api-football.com/register)

### Setup Backend

#### Clone Repo

```bash
git clone https://github.com/CarloVelarde/cf_ai_game_analyzer.git
```

#### Move into root

```bash
cd cf_ai_game_analyzer
```

#### Install packages

```bash
npm install
```

#### Authenticate Wrangler

```bash
npx wrangler login
```

> Follow CLI steps

#### Set environment variables

```bash
npx wrangler secret put APISPORTS_KEY --env dev
```

> api key from https://dashboard.api-football.com

#### Run Worker (locally)

```bash
npx wrangler dev --env dev
```

> starts at `http://localhost:8787` by default

#### Test worker

```bash
curl -s http://localhost:8787/api/answer \
  -H "content-type: application/json" \
  -d '{"message":"How did the Seattle Seahawks do yesterday?"}'

```

### Setup Frontend

#### Move into frontend

```bash
cd frontend
```

#### Install packages

```bash
npm install
```

#### Point Frontend to Local Worker

Create `.env.local` file inside `frontend/` dir

Add `VITE_API_BASE=http://localhost:8787` to file

#### Startup the Frontend

```bash
npm run dev
```

> Will serve files at `http://localhost:5173`

#### Test Frontend

Questions to ask:

- How did the Longhorns do last night?
- How was the Chiefs game today?
- Did the Seahawks win yesterday?

## Important Notes

- Worker only gives insights on games under 'today' and 'yesterday'.
  - Worth to note: the worker relies on the free tier of api-sports-io api. That is why we are limited to 'today' and 'yesterday'
    - _Note: there have been instances where even 'yesterday' is not available for free tier. Seems to vary by hour_
- In order for the best/most accurate response, the user must give the _team name_ and the _day_ of the game in question.
  - If no day is given, the worker will default to games under 'today'
- The worker currently only supports teams under NCAAF, NFL, and NBA
- If the live demo at `https://cf-ai-game-analyzer.pages.dev` or your local environment is not working as expected, that could be due to reaching the daily api call limit for **api-sports-io**
