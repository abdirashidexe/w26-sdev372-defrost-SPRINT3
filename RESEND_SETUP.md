# Resend Email Setup

This project now sends frost alerts via Resend emails instead of SMS.

## 1. Create a Resend account
Visit https://resend.com/ and create an account (or log in) to send emails. After signing in, go to the **API keys** section and create a new key with a descriptive name (e.g., `defrost-backend`).

## 2. Store credentials in `.env`
Add the following variables to your `.env` file so the backend can send test emails:

```
RESEND_API_KEY=your_real_resend_api_key_here
RESEND_FROM_EMAIL=onboarding@defrost.app
RESEND_TO_EMAIL=alerts@example.com
RESEND_SUBJECT=Defrost Alert!
```

Replace `your_real_resend_api_key_here` with the key you copied. You can swap the recipient or subject to fit your use case.

## 3. Verify the sender identity
Resend may require that the `from` address is verified or that you use a domain you control. Follow Resend's verification steps in the dashboard if the email bounces.

## 4. Send a manual test email
Run the backend (`npm --prefix backend run dev`), then hit the `/send-test-email` endpoint (e.g., via Postman or curl). If the request succeeds the console will log the Resend response and your configured recipient should see the test email.

## 5. Local testing checklist
1. Start the MySQL container: `docker compose up -d db`.
2. Seed the database if needed: `npm --prefix backend run db:init`.
3. Run backend tests (the root `npm run test:backend` alias runs Vitest inside `backend` with access to the shared tests).
4. Run frontend tests: `npm run test:frontend`.

## Docker (optional)
1. `docker compose build`
2. `docker compose up`
3. `docker compose down`

The Docker stack wires the backend API to the `db` service and exposes the frontend on `http://localhost:5173` so Playwright can run the end-to-end suite.
