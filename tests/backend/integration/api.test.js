import request from "supertest";
import { describe, test, expect, beforeEach, afterEach, afterAll } from "vitest";
import app from "../../../backend/index.js";
import pool from "../../../backend/db/config.js";

const uniqueEmail = () => {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `user${suffix}@example.com`;
};

const client = request(app);

describe("API endpoints", () => {
  beforeEach(async () => {
    await pool.execute("DELETE FROM defrost_users");
  });
  afterEach(async () => {
    await pool.execute("DELETE FROM defrost_users");
  });
  afterAll(async () => {
    await pool.end();
  });
  test("creates a user with valid email", async () => {
    const email = uniqueEmail();
    const res = await client.post("/users").send({ email }).expect(201);

    expect(res.body.email).toBe(email);
    expect(res.body.id).toBeDefined();
  });

  test("rejects invalid email", async () => {
    const res = await client.post("/users").send({ email: "not-an-email" }).expect(400);

    expect(res.body.error).toBe("Provide a valid email address");
  });

  test("rejects duplicate email", async () => {
    const email = uniqueEmail();

    await client.post("/users").send({ email }).expect(201);
    const res = await client.post("/users").send({ email }).expect(409);

    expect(res.body.error).toBe("Email address already registered");
  });

  test("GET /users returns created entries", async () => {
    const emails = [uniqueEmail(), uniqueEmail()];
    for (const email of emails) {
      await client.post("/users").send({ email });
    }

    const res = await client.get("/users").expect(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    const returned = res.body.users.map((user) => user.email);
    expect(returned).toEqual(expect.arrayContaining(emails));
  });

  test("GET /users/count reports total rows", async () => {
    const emails = [uniqueEmail(), uniqueEmail(), uniqueEmail()];
    for (const email of emails) {
      await client.post("/users").send({ email });
    }

    const res = await client.get("/users/count").expect(200);
    expect(res.body.total).toBe(emails.length);
  });
});
