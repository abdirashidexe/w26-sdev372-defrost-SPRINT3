# Final Meeting Prep Notes

## Class Context

This class was run in sprints, alternating between:

- 2 weeks on our own project
- 2 weeks on our partner group's project

Each sprint added a new concept from lecture, and the deliverables reflected that progression.

### Sprint Progression

- `sprint1.md`: project planning
  - define the app idea, MVP, data model, target users, and README planning
- `sprint2.md`: VM deployment
  - deploy the app to a VM and submit a live URL
- `sprint3.md`: Dockerized deployment
  - containerize DB + API + SPA with one root `docker-compose.yml`
- `sprint4.md`: automated testing + Orange Pi + Tailscale Funnel
  - backend unit tests
  - frontend unit tests
  - integration tests
  - end-to-end tests
  - deploy to Orange Pi and expose via Funnel
- `sprint5.md`: CI/CD
  - GitHub Actions test workflow
  - GitHub Actions deploy workflow to the deployment target

## What This Project Demonstrates

The project is a full-stack React + Node + MySQL application called `Defrost`.

Core behavior:

- user enters an email
- backend stores it in MySQL
- frontend requests geolocation
- frontend checks tomorrow's low using Pirate Weather
- if frost risk exists, the app can trigger a Resend email

Infrastructure behavior:

- app is containerized with Docker Compose
- deployed to an Orange Pi
- exposed with Tailscale Funnel
- tested with Vitest + Playwright
- CI and CD handled through GitHub Actions

## Current Architecture

### Stack

- frontend: React + Vite
- backend: Node + Express
- database: MySQL 8
- email: Resend
- testing:
  - frontend unit tests with Vitest
  - backend unit/integration tests with Vitest
  - e2e tests with Playwright

### Main Files

- `docker-compose.yml`
  - defines `db`, `api`, `frontend`, and `tests`
- `.github/workflows/test.yml`
  - runs test workflow in GitHub Actions
- `.github/workflows/deploy.yml`
  - deploys to Orange Pi after successful `main` test run
- `backend/index.js`
  - API bootstrapping, DB retry logic, user routes, email route
- `vite.config.js`
  - Vite dev server config, proxy config, Funnel hostname allowlist
- `orangepi-deployment-rca.md`
  - incident write-up for Orange Pi deployment failure and recovery

## What Went Well Technically

- The app was successfully brought up on the Orange Pi after reflashing and recovery.
- Tailscale Funnel worked and exposed a live URL.
- Signup and test email flow worked end-to-end.
- Geolocation and weather flow worked after browser permission was allowed.
- CI test failures exposed a real DB startup race, and that was fixed by adding backend retry logic in `backend/index.js`.
- CD eventually succeeded after SSH and dirty-working-tree issues on the Pi were corrected.

## Strong Talking Points

- We did not just build CRUD; we also handled deployment infrastructure, testing, automation, and incident recovery.
- We hit real environment failures on the Orange Pi and documented them in an RCA rather than hiding them.
- The backend now waits for the DB on startup instead of assuming the DB is immediately available.
- We used Tailscale Funnel to expose the Orange Pi safely instead of opening random public ports directly.
- We kept the repo branch-based and used PRs back into the fork/original flow rather than committing straight to `main`.

## Likely Technical Questions

### 1. Why this app?

Good answer:

- It solves a narrow but concrete problem: knowing ahead of time if morning frost will slow you down.
- The scope fit the class stack well: React UI, Node API, MySQL persistence, and optional notification logic.

### 2. Where is the CRUD?

Good answer:

- Current core CRUD is mainly create/read:
  - create user email
  - read user list/count
- The project is intentionally MVP-scoped around sign-up and alerting, not a full admin dashboard.

### 3. Why use Docker Compose?

Good answer:

- It gives one repeatable definition for DB, API, frontend, and test environment.
- It reduced "works on my machine" problems and made Orange Pi deployment simpler.

### 4. Why did CI fail earlier?

Good answer:

- The API container was starting before MySQL was ready.
- The API exited on `ECONNREFUSED`.
- We fixed that by adding DB retry logic in `backend/index.js`.

### 5. What actually blocked deployment?

Good answer:

- Not the app code.
- The Orange Pi experienced filesystem/storage instability, including read-only remount behavior and ext4/fsck problems.
- We recovered by reflashing and rebuilding the environment.

### 6. What does the deploy workflow do?

Good answer:

- waits for successful test workflow on `main`
- connects runner to tailnet
- installs SSH key
- SSHes into the Orange Pi
- updates repo on the Pi
- runs `docker compose down` and `docker compose up -d --build`

## Areas Your Instructor Could Push On

These are the honest weak spots.

### README drift

The README is partly out of date compared to the current implementation.

Examples:

- README says the test workflow is split into backend/frontend/integration/e2e jobs, but current `.github/workflows/test.yml` is still one Compose job.
- README mentions `TS_AUTH_KEY`, but current deploy workflow uses:
  - `TS_OAUTH_CLIENT_ID`
  - `TS_OAUTH_SECRET`
- README still references an older Funnel URL (`orangepizero3.taile19edd.ts.net`) instead of the newer `orangepizero3-1...` hostname.

If asked, the honest answer is:

- the implementation moved during deployment troubleshooting
- some documentation did not get fully updated to match the final state

### Sprint 5 branch trigger requirement

`sprint5.md` says the test workflow should trigger on pushes and PRs to both `main` and `dev`.

Current `test.yml` now matches that requirement:

- push to `main`
- push to `dev`
- PR to `main`
- PR to `dev`
- manual dispatch

So this is no longer a mismatch with the sprint spec.

### Test visibility in GitHub

The current test workflow runs as a single Compose job, so GitHub shows one large test check instead of clearly separated frontend/backend/e2e checks.

Best answer:

- the tests exist and run
- the workflow presentation could be refactored into multiple jobs for cleaner visibility
- that would be a workflow refactor, not a test-suite rewrite

## Deployment Story to Explain Clearly

Do not oversell. Explain it in this order:

1. An older version of the app was already live on the Orange Pi through Funnel on March 19.
2. While revising the app and setting up CI/CD, the Orange Pi environment became unstable.
3. The root filesystem showed corruption symptoms and eventually required reflash/recovery.
4. After recovery, the app was brought back up and reached a working Funnel state again.
5. The GitHub deploy pipeline was then debugged through:
   - wrong host/IP
   - SSH key auth mismatch after reflash
   - dirty working tree on the Pi (`vite.config.js`)
6. The deployment ultimately succeeded.

This is a stronger explanation than pretending the path was smooth.

## If Asked “What Did You Personally Do?”

Best framing:

- worked through deployment/debugging on the Orange Pi
- investigated Docker, SSH, Tailscale, and Funnel issues
- validated the live deployment
- handled the later troubleshooting and RCA work
- drove the repo toward a working CI/CD path

## Final Honest Assessment

This project fits the class well because it shows all of the major themes:

- planning an MVP
- shipping a full-stack app
- containerizing it
- writing automated tests
- deploying to constrained infrastructure
- exposing it publicly through Funnel
- automating test and deploy steps in GitHub Actions
- troubleshooting a real infrastructure failure

The biggest weakness is not lack of technical work. The biggest weakness is polish consistency:

- some workflow/documentation mismatch
- some deployment roughness caused by the Orange Pi environment

But as a cloud deployment final, it shows real deployment work rather than a fake or purely local demo.
