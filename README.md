# Project Overview
## Project Name & Tagline
Defrost — Discard the Frost.

## Problem Statement
Catching a car covered in overnight frost wastes time and energy. Defrost predicts whether tomorrow’s overnight low will freeze your windshield and texts you earlier so you can budget extra defrost time.

## Target Users
- Early commuters (students or workers) battling cold-morning frosts.
- Parents getting kids to school before dawn.
- Anyone in a temperate/cold climate who hates scraping ice.

# Feature Breakdown
## MVP Features
1. Users submit a phone number, which the backend persists and deduplicates via validations + mocked DB tests.
2. The frontend asks for geolocation, fetches tomorrow’s low from Pirate Weather, and decides if a frost reminder is needed.
3. When frost is predicted, the backend can send a Twilio SMS reminder (guarded by env vars) and the frontend shows frost-friendly UI cues.
4. Tests run locally or in Docker: Vitest for frontend+backend, integration against the Dockerized DB, and Playwright e2e flows.

## Weather source and testing
- The frontend fetches tomorrow's low from Pirate Weather (use `VITE_PIRATE_WEATHER_KEY` in `.env`).
- **Testing:** `npm run test` (frontend unit + backend unit/integration + Playwright e2e) or `docker compose up --build --wait` executes the same stack. GitHub Actions runs this exact Compose suite on pushes/pull requests to `main`, `dev`, `pipeline-sprint5`, and `refactoring`.
- **Local testing tip:** Start the frontend (`npm run dev -- --host`) before running `npm run test`, or run `docker compose up --build --wait` so Playwright can reach `http://localhost:5173`.

# Data Model Planning
## Core Entities
- **User:** stores phone number, optional location, and any alert preferences.
- **Notification Log (future):** records when texts were sent, what forecast triggered them.
- **Defrost Preference (future):** temperature threshold and wake-up offset per user.

## Key Relationships
- Each User has zero-or-one Defrost Preference.
- Users may accumulate many Notification Logs as alerts are issued.
- Preferences and logs belong to a single User.

# User Experience
## User Flows
1. User visits the landing page, enters their phone number, and clicks “Sign up.”
2. The app requests geolocation, the backend saves the user, and the frontend fetches Pirate Weather for tomorrow’s low.
3. If frost is predicted, the UI turns “frost-themed,” and the backend can optionally send a Twilio text alert.
4. Users can rerun “Get Location” to refresh the forecast, or click “Send Test Message” once Twilio creds exist.
