import dotenv from "dotenv";
import pool, { isTestEnvironment } from "./db/config.js";
import express from "express";
import cors from "cors";
import { Resend } from "resend";
import {
  insertUser,
  DuplicateEmailError,
  listUsers,
  countUsers,
} from "./services/users.mjs";

const app = express();
const PORT = process.env.PORT || 3000;

dotenv.config({ path: new URL("../.env", import.meta.url) });

const resendApiKey = process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;
const resendFrom = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const resendTo = process.env.RESEND_TO_EMAIL || "alerts@example.com";
const resendSubject = process.env.RESEND_SUBJECT || "Defrost Alert!";
const allowTestEmail = process.env.ENABLE_TEST_EMAIL === "true";

(function enableCors() {
  app.use(cors());
})();

async function ensureUsersTable() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS defrost_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(320) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.execute(createTableSql);
}

async function bootstrap() {
  try {
    await pool.query("SELECT 1");
    console.log("DB connected");
    if (!isTestEnvironment) {
      await ensureUsersTable();
    }
  } catch (err) {
    console.error("DB connection failed", err);
    process.exitCode = 1;
    process.exit(1);
  }

  if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  }
}

bootstrap();

app.use(express.json());

app.post("/users", async (req, res) => {
  const email = validateEmail(req.body?.email);

  if (!email) {
    return res.status(400).json({ error: "Provide a valid email address" });
  }

  try {
    const insertId = await insertUser(email);
    console.log(`Inserted email ${email} (id ${insertId ?? "unknown"})`);
    return res.status(201).json({ id: insertId, email });
  } catch (err) {
    if (err instanceof DuplicateEmailError) {
      return res.status(409).json({ error: "Email address already registered" });
    }
    console.error("saving user failed", err);
    return res.status(500).json({ error: "Unable to save user" });
  }
});

app.post("/send-test-email", async (req, res) => {
  if (!allowTestEmail) {
    return res.status(404).json({ error: "Not available" });
  }
  if (!resendClient) {
    return res.status(500).json({ error: "Mailer is not configured" });
  }

  try {
    const weather = req.body?.weather;
    const forecastSummary = weather
      ? `Tomorrow${weather.tomorrowDate ? ` (${weather.tomorrowDate})` : ""} has a low of ${Math.round(
          weather.tomorrowLow ?? 0
        )}°F. Frost is ${weather.frostRisk ? "expected" : "not expected"} and the suggested wakeup offset is ${
          weather.suggestedWakeupOffset ?? 0
        } minutes.`
      : "Weather data is missing—check your location before sending alerts.";

    const html = `
      <h1>Defrost Alert!</h1>
      <p>${forecastSummary}</p>
    `;

    const data = await resendClient.emails.send({
      from: resendFrom,
      to: resendTo,
      subject: resendSubject,
      html,
    });

    console.log(data);
    return res.status(200).json({ messageId: data.id, status: data.status });
  } catch (err) {
    console.error("send test email failed", err);
    return res.status(500).json({ error: "Unable to send test email" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await listUsers();
    return res.json({ users });
  } catch (err) {
    console.error("listing users failed", err);
    return res.status(500).json({ error: "Unable to list users" });
  }
});

app.get("/users/count", async (req, res) => {
  try {
    const total = await countUsers();
    return res.json({ total });
  } catch (err) {
    console.error("counting users failed", err);
    return res.status(500).json({ error: "Unable to count users" });
  }
});

export function validateEmail(input) {
  if (typeof input !== "string") return null;
  const candidate = input.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(candidate) ? candidate : null;
}

export default app;
