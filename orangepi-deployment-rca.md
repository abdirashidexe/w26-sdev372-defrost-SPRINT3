# RCA: Orange Pi Deployment Failure During CI/CD Rollout

## Incident Summary
On March 19, 2026, an earlier version of the Defrost project was already live on the Orange Pi through a working Tailscale Funnel link. After that successful deployment, additional revisions were needed to improve the project and formalize CI/CD. During those later deployment revisions, between March 21, 2026 and March 22, 2026, deployment of the updated Defrost application was blocked by instability on the Orange Pi itself rather than by an application-code defect. During troubleshooting, the device showed repeated failures across Docker, Docker Compose, APT, Tailscale availability, and eventually the root filesystem. The environment was recovered only after reflashing the SD card and rebuilding the Orange Pi from scratch.

## Goal
Take a project that had already been demonstrated live on an Orange Pi, revise it into a cleaner Docker-based deployment, expose it through Tailscale Funnel again, and connect GitHub Actions CI/CD so pushes to `main` could test and deploy automatically.

## Impact
- Delayed completion of the CI/CD portion of the project.
- Prevented stable automated deployment during the initial rollout attempt.
- Forced multiple hours of infrastructure troubleshooting unrelated to core app behavior.
- Required full Orange Pi rebuild before deployment could continue.

## What Was Working
- The application codebase itself was validated locally in Docker.
- Full Docker Compose tests passed in a controlled environment after deployment-safe fixes were added.
- On the recovered Orange Pi, the app eventually ran successfully:
  - frontend loaded
  - signup worked
  - test email worked
  - Tailscale Funnel reached the app
  - geolocation worked after browser permission was allowed

## What Failed
The Orange Pi environment degraded before deployment could be completed reliably. Symptoms included:

- `docker pull` and `docker compose` failures
- `docker buildx` reported as invalid/missing
- `apt update` crashing with signal/illegal-instruction style errors
- `sudo` failing to load shared libraries
- root filesystem remounted read-only
- ext4 filesystem errors on the SD-card-backed root partition
- boot-time `fsck` failures and later a kernel panic during repair
- Tailscale connectivity dropping, leaving GitHub Actions unable to SSH to the device

## Timeline

### March 19, 2026
- An older version of the project was successfully live on the Orange Pi through a working Tailscale Funnel link.
- This confirmed that the deployment target had been functional earlier in the week.
- After that point, additional revisions were made to improve the project and set up a more formal CI/CD pipeline.
- The later failure sequence began during those revision and redeployment efforts, not during the original successful live demo.

### March 21-22, 2026
- Docker-based deployment work resumed for the revised version of the project.
- Local repository review showed the app was close to deployable but still needed CI/CD and deployment-safe cleanup.
- Deployment-safe changes were added:
  - frontend API path moved toward same-origin usage
  - frontend container path improved
  - GitHub Actions test and deploy workflows were added
  - one broken frontend test was corrected
- The full Docker Compose stack passed locally after these adjustments.

### Orange Pi Failure Investigation
- On the Orange Pi, `docker compose up -d --build` failed early.
- `docker compose ps` and other Docker operations crashed or behaved inconsistently.
- `docker buildx` was missing/invalid.
- `docker pull` failed with low-level runtime errors.
- `apt update` produced parsing and signal errors.
- `systemd` and journald showed instability warnings.

### Filesystem Failure Confirmation
- Further investigation on the Orange Pi showed:
  - the root filesystem had been remounted read-only
  - `apt` reported read-only filesystem and unlinking failures
  - ext4 errors appeared for the root partition on the SD card
- After reboot, the Orange Pi dropped into emergency repair / `initramfs`.
- Manual `fsck` reported:
  - filesystem inconsistency
  - invalid inode issues
  - manual repair required
- A later repair attempt ended in a kernel panic.

### Recovery
- The SD card was reflashed.
- The Orange Pi booted again after using a working board image.
- Docker and Tailscale were reinstalled/recovered to a functional state.
- The repo was recloned on the Orange Pi.
- The `.env` file was recreated.
- The stack was started again with Docker Compose.
- API startup initially raced the database and exited early, but manual restart confirmed the stack could run.
- Tailscale Funnel was enabled and the app became reachable over the public Funnel URL.

### CI/CD Follow-up
- A GitHub Actions test run failed because the API container tried to connect to MySQL before the DB was fully ready.
- This was fixed by adding database connection retry logic during backend startup.
- A later deploy run failed not because of code, but because GitHub Actions could not SSH to the Orange Pi.
- At the time of failure, Tailscale showed the Orange Pi offline.

## Observed Evidence

### Strong evidence of environment failure
- Docker commands failed before application code could complete startup.
- APT was unstable, including metadata and runtime failures.
- The root filesystem was remounted read-only.
- ext4 filesystem errors were shown on the SD-card-backed root partition.
- Boot-time fsck found filesystem corruption.
- Manual repair ended in a kernel panic.

### Strong evidence that the app itself was not the primary root cause
- The app stack passed full Docker Compose testing outside the Orange Pi.
- After the Orange Pi was reflashed and restored, the app eventually ran.
- Frontend, signup, and test email worked on the recovered device.

## Root Cause
The primary root cause was failure of the Orange Pi deployment environment at the OS/storage layer. The root filesystem on the SD-card-backed installation became corrupted, which destabilized the package manager, Docker tooling, and system services, preventing reliable deployment.

## Likely Contributing Factors
- SD card corruption or SD-card-backed filesystem degradation
- prior history of SD card failure on the same Orange Pi earlier in the quarter
- repeated recovery attempts on an already unstable root filesystem
- Docker and APT becoming unusable after the filesystem entered a damaged/read-only state
- limited time during final-project delivery, increasing the need for pragmatic recovery over deep infrastructure forensics

## Why This Was Not Primarily an App Bug
- The backend/API failures on the Orange Pi were initially environmental, not logical:
  - MySQL readiness race on the recovered board
  - Docker/runtime failures before app startup
- The application behaved correctly once the environment was stable enough to run it.
- The later deployment blocker in GitHub Actions was SSH reachability, not application failure.

## Corrective Actions Taken
- Reviewed and hardened the app for deployment.
- Added CI and deploy workflows.
- Fixed frontend host allowlisting for Funnel hostnames.
- Added backend retry logic so API startup could survive slow MySQL initialization.
- Reflashed the Orange Pi SD card after filesystem failure was confirmed.
- Recreated the runtime environment and redeployed manually.

## Recommended Preventive Actions
- Avoid trusting a previously corrupted SD-card-backed root filesystem for production or grading demos.
- Prefer a fresh image after confirmed ext4 inconsistency on the root filesystem.
- Keep deployment changes in Git rather than only editing files directly on the Orange Pi.
- Add resilience around service startup order, especially API-to-DB dependencies.
- If possible for future work, use better storage media or maintain a spare SD card ready for quick recovery.

## Final Assessment
The main deployment blocker was not the Defrost codebase. A previous version of the project had already been live on March 19, 2026, which shows the application and deployment target were at least initially usable. The blocker emerged later during revision and CI/CD rollout work, when the Orange Pi environment degraded and ultimately showed confirmed filesystem corruption on the SD-card-backed root partition. Once the board was reflashed and rebuilt, the application could run again, which supports the conclusion that the infrastructure failure was primary.

## Mini Update: Latest Status
As of March 22, 2026:

- The reflashed Orange Pi was brought back online.
- The application stack was running successfully on the Orange Pi.
- Tailscale Funnel reached the application.
- A PR from `dev` to `main` passed the test workflow after backend startup retry logic was added.
- The automated deploy workflow then failed because GitHub Actions could not SSH into the Orange Pi.
- At the time of that deploy failure, Tailscale showed the Orange Pi offline, which explains the SSH timeout.

Current conclusion:

The application is in a much healthier state than the deployment target. The remaining blocker at the latest checkpoint is Orange Pi availability/reachability over Tailscale during the automated deploy step, not the core application itself.
