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
<!-- tiny nop change to trigger CI rerun -->
**Tests** `.github/workflows/test.yml` runs on every push/PR to `dev` and splits the suite into backend, frontend, integration, and e2e jobs. Each job installs deps, runs its slice of the stack, and `needs` the previous stage so failures stop the downstream steps.

## Automated Deployment

Deployment is handled through a GitHub Actions workflow located at `.github/workflows/deploy.yml`.

### When Deployment Runs
The deployment workflow runs automatically when:
- Code is successfully merged into the `main` branch
- All tests in the testing pipeline have passed

### Deployment Process
The workflow performs the following steps:

1. **Connect to VM via Tailscale**
   - Installs Tailscale on the GitHub Actions runner
   - Uses the `TS_AUTH_KEY` secret to authenticate and join the tailnet
   - Establishes a secure connection to the deployment VM

2. **SSH into the VM**
   - Connects to the server using:
     ```
     root@${DEPLOY_HOST}
     ```
   - Uses configured GitHub secrets for authentication

3. **Pull Latest Code**
   - Navigates to the project directory:
     ```
     /root/w26-sdev372-defrost-sprint5
     ```
   - Pulls the latest changes from the repository

4. **Rebuild and Restart Application**
   - Runs:
     ```
     docker compose down
     docker compose up -d --build
     ```
   - This ensures the app is rebuilt and running with the latest code

5. **Verify and Log Deployment**
   - Captures output from the deployment process
   - Uploads logs as a `deploy-logs` artifact in GitHub Actions

### Required Secrets
The following GitHub repository secrets must be configured:

- `TS_AUTH_KEY` – Tailscale authentication key
- `DEPLOY_HOST` – VM hostname or IP (via Tailscale)
- `DEPLOY_USER` – SSH user (e.g., root)
- `SSH_PRIVATE_KEY` – (optional) for SSH-based repo access
- `GITHUB_TOKEN` – automatically provided by GitHub

### Manual Redeployment
If the server needs to be refreshed (e.g., VM reset or failure):
- Re-run the `deploy.yml` workflow from the GitHub Actions tab
- The workflow will reconnect to the VM and redeploy the latest version


