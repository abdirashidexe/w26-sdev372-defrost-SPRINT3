import request from "supertest";
import { describe, test, expect, beforeEach } from "vitest";
import app from "../../../backend/index.js";
import pool from "../../../backend/db/config.js";

const uniquePhoneNumber = () => {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `206555${suffix}`;
};

const agent = request(app);

describe("API endpoints", () => {
  beforeEach(async () => {
    await pool.execute("DELETE FROM defrost_users");
  });
  test("creates a user with valid phone number", async () => {
    const phoneNumber = uniquePhoneNumber();
    const res = await agent
      .post("/users")
      .send({ phoneNumber })
      .expect(201);

    expect(res.body.phoneNumber).toBe(phoneNumber);
    expect(res.body.id).toBeDefined();
  });

  test("rejects invalid phone numbers", async () => {
    const res = await agent
      .post("/users")
      .send({ phoneNumber: "abc" })
      .expect(400);

    expect(res.body.error).toBe(
      "Provide a numeric phoneNumber with at least 10 digits"
    );
  });

  test("rejects duplicate phone numbers", async () => {
    const phoneNumber = uniquePhoneNumber();

    await agent
      .post("/users")
      .send({ phoneNumber });
    const res = await agent
      .post("/users")
      .send({ phoneNumber })
      .expect(409);

    expect(res.body.error).toBe("Phone number already registered");
  });
  test("GET /users returns created entries", async () => {
    const phones = [uniquePhoneNumber(), uniquePhoneNumber()];
    for (const phone of phones) {
      await agent.post("/users").send({ phoneNumber: phone });
    }

    const res = await agent.get("/users").expect(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    const returned = res.body.users.map((user) => user.phoneNumber);
    expect(returned).toEqual(expect.arrayContaining(phones));
  });

  test("GET /users/count reports total rows", async () => {
    const phones = [uniquePhoneNumber(), uniquePhoneNumber(), uniquePhoneNumber()];
    for (const phone of phones) {
      await agent.post("/users").send({ phoneNumber: phone });
    }

    const res = await agent.get("/users/count").expect(200);
    expect(res.body.total).toBe(phones.length);
  });
});
