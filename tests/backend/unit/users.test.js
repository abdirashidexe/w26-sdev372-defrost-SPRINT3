import { describe, test, expect, vi } from "vitest";
import { insertUser, DuplicatePhoneError } from "../../../backend/services/users.mjs";

describe("insertUser", () => {
  test("inserts a phone number and returns the insertId", async () => {
    const fakePool = {
      execute: vi.fn().mockResolvedValue([{ insertId: 123 }]),
    };

    const insertId = await insertUser("2065551212", fakePool);

    expect(insertId).toBe(123);
    expect(fakePool.execute).toHaveBeenCalledWith(
      "INSERT INTO defrost_users (phone_number) VALUES (?)",
      ["2065551212"]
    );
  });

  test("wraps duplicate entry errors with DuplicatePhoneError", async () => {
    const err = new Error("duplicate");
    err.code = "ER_DUP_ENTRY";
    const fakePool = {
      execute: vi.fn().mockRejectedValue(err),
    };

    await expect(insertUser("2065551212", fakePool)).rejects.toBeInstanceOf(
      DuplicatePhoneError
    );
  });

  test("propagates other database errors", async () => {
    const fakePool = {
      execute: vi.fn().mockRejectedValue(new Error("boom")),
    };

    await expect(insertUser("2065551212", fakePool)).rejects.toThrow("boom");
  });
});
