# Project Overview
## Project Name & Tagline
Defrost — Discard the Frost.

## Problem Statement
Catching a car covered in overnight frost wastes time and energy. Defrost predicts whether tomorrow’s overnight low will freeze your windshield and emails you earlier so you can budget extra defrost time.

## Target Users
- Early commuters (students or workers) battling cold-morning frosts.
- Parents getting kids to school before dawn.
- Anyone in a temperate/cold climate who hates scraping ice.

# Feature Breakdown
## MVP Features
1. Users submit an email address, which the backend persists, deduplicates, and uses for frost alerts.
2. The frontend asks for geolocation, fetches tomorrow’s low from Pirate Weather, and decides if a frost reminder is needed.
3. When frost is predicted, the backend sends a Resend email reminder (guarded by env vars) and the frontend shows frost-friendly UI cues.
4. Tests run locally or in Docker: Vitest for frontend+backend, integration against the Dockerized DB, and Playwright e2e flows.

## Weather source and testing
- The frontend fetches tomorrow's low from Pirate Weather (use `VITE_PIRATE_WEATHER_KEY` in `.env`).
- **Testing:** `npm run test` (frontend unit + backend unit/integration + Playwright e2e) or `docker compose up --build --wait` executes the same stack. GitHub Actions runs this exact Compose suite on pushes/pull requests to `main`, `dev`, `pipeline-sprint5`, and `refactoring`.
- **Local testing tip:** Start the frontend (`npm run dev -- --host`) before running `npm run test`, or run `docker compose up --build --wait` so Playwright can reach `http://localhost:5173`.

# Data Model Planning
## Core Entities
- **User:** stores email, optional location, and any alert preferences.
- **Notification Log (future):** records when texts were sent, what forecast triggered them.
- **Defrost Preference (future):** temperature threshold and wake-up offset per user.

## Key Relationships
- Each User has zero-or-one Defrost Preference.
- Users may accumulate many Notification Logs as alerts are issued.
- Preferences and logs belong to a single User.

# User Experience
## User Flows
1. User visits the landing page, enters their email, and clicks “Sign up.”
2. The app requests geolocation, the backend saves the email, and the frontend fetches Pirate Weather for tomorrow’s low.
3. If frost is predicted, the UI turns “frost-themed,” and the backend sends a Resend email alert.
4. Users can rerun “Get Location” to refresh the forecast, or click “Send Test Email” once Resend creds exist.

## Getting started locally
1. **Install dependencies:** run `npm install` at the repo root and `npm --prefix backend install` inside the backend folder so both workspaces are bootstrapped.  
2. **Create an `.env` file** (ignore it from Git). At minimum set:
   ```
   DB_HOST=localhost
   DB_USER=defrostuser
   DB_PASSWORD=impreza
   DB_NAME=defrost_app
   VITE_API_BASE_URL=http://localhost:3001
   VITE_PIRATE_WEATHER_KEY=<your Pirate Weather key>
   RESEND_API_KEY=<your Resend key>
   RESEND_FROM_EMAIL=onboarding@resend.dev
   RESEND_TO_EMAIL=<your mailbox>
   RESEND_SUBJECT="Defrost Alert!"
   ENABLE_TEST_EMAIL=true
   ```
   The compose stack uses these values and it’s safe to keep them private.
3. **Run the stack by hand:** `docker compose down -v && docker compose up --build` spins up the DB → API → frontend → test container pipeline. The API will connect to MySQL, create the `defrost_users` table, and expose port 3001 for `API_BASE_URL`.
4. **Frontend development:** if you do `npm run dev -- --host` instead of the containerized frontend, make sure your `.env` variables are loaded and `VITE_API_BASE_URL` points to the live backend (`http://localhost:3001`). The UI will fetch weather, store emails, and call `/send-test-email`.

## Running the Resend flow
1. Sign in at https://resend.com and copy the API key into `RESEND_API_KEY`.  
2. For quick tests, set `RESEND_TO_EMAIL` to the same email tied to that API key (Resend’s sandbox only allows that address unless you verify a domain).  
3. If you need to email arbitrary recipients, verify a domain in Resend and use a matching `RESEND_FROM_EMAIL` (e.g., `alerts@yourdomain.com`).  
4. Enable the feature by keeping `ENABLE_TEST_EMAIL=true`. The API checks that flag before making the Resend call.  
5. When the frontend sends `{ weather: { ... } }` with the POST, the backend now renders that forecast into the email body, so recipients see the low, frost risk, and suggested wake-up offset directly inside the alert.

## CI/CD pipelines
**Tests** `.github/workflows/test.yml` runs on every push/PR to `dev` and splits the suite into backend, frontend, integration, and e2e jobs. Each job installs deps, runs its slice of the stack, and `needs` the previous stage so failures stop the downstream steps.

**Deploy** `.github/workflows/deploy.yml` runs automatically once the Tests workflow succeeds. The deploy job:
1. Installs Tailscale, uses `TS_AUTH_KEY` to join the tailnet with `tag:deploy`, and keeps the connection alive on the runner.
2. SSHs into `root@${DEPLOY_HOST}` (over Tailscale) and pulls the latest code into `/root/w26-sdev372-defrost-sprint5`.
3. Rebuilds the Docker Compose stack there (`docker compose down && docker compose up -d --build`).
4. Requires the repository secrets `TS_AUTH_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`, `SSH_PRIVATE_KEY` (if you want to clone via SSH instead of HTTPS), and the default `GITHUB_TOKEN` so the runner can fetch the right commit.
5. Captures the remote deploy output and uploads it as the `deploy-logs` artifact so you can audit what happened during the CD run.

If you ever have to refresh the Orange Pi, just re-run the workflow—GitHub Actions will bring Tailscale up, connect back to the Pi, and redeploy exactly the code you just pushed.
