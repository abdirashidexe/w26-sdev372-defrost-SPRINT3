import request from "supertest";
import { describe, test, expect } from "vitest";
const server = "http://localhost:3000";

describe("POST /users", () => {

  test("creates a user with valid phone number", async () => {
    const res = await request(server)
      .post("/users")
      .send({ phoneNumber: "7065758534" })
      .expect(201);

    expect(res.body.phoneNumber).toBe("7065758534");
    expect(res.body.id).toBeDefined();
  });

  test("rejects invalid phone numbers", async () => {
    const res = await request(server)
      .post("/users")
      .send({ phoneNumber: "abc" })
      .expect(400);

    expect(res.body.error).toBe(
      "Provide a numeric phoneNumber with at least 10 digits"
    );
  });

  test("rejects duplicate phone numbers", async () => {

    await request(server)
      .post("/users")
      .send({ phoneNumber: "2065551234" });

    const res = await request(server)
      .post("/users")
      .send({ phoneNumber: "2065551234" })
      .expect(409);

    expect(res.body.error).toBe("Phone number already registered");
  });

});