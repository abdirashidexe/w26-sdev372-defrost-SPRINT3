import { describe, test, expect, vi } from "vitest";
import { insertUser, DuplicateEmailError } from "../../../backend/services/users.mjs";

describe("insertUser", () => {
  test("inserts an email and returns the insertId", async () => {
    const fakePool = {
      execute: vi.fn().mockResolvedValue([{ insertId: 123 }]),
    };

    const insertId = await insertUser("  User@Example.COM  ", fakePool);

    expect(insertId).toBe(123);
    expect(fakePool.execute).toHaveBeenCalledWith(
      "INSERT INTO defrost_users (email) VALUES (?)",
      ["user@example.com"]
    );
  });

  test("wraps duplicate entry errors with DuplicateEmailError", async () => {
    const err = new Error("duplicate");
    err.code = "ER_DUP_ENTRY";
    const fakePool = {
      execute: vi.fn().mockRejectedValue(err),
    };

    await expect(insertUser("user@example.com", fakePool)).rejects.toBeInstanceOf(
      DuplicateEmailError
    );
  });

  test("propagates other database errors", async () => {
    const fakePool = {
      execute: vi.fn().mockRejectedValue(new Error("boom")),
    };

    await expect(insertUser("user@example.com", fakePool)).rejects.toThrow("boom");
  });
});
