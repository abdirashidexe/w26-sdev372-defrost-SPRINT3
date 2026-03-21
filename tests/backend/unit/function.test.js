import { describe, test, expect } from "vitest";
import { validateEmail } from "../../../backend/index.js";

describe("validateEmail", () => {

  test("normalizes and accepts a well-formed email", () => {
    expect(validateEmail("  USER@Example.COM ")).toBe("user@example.com");
  });

  test("returns null for malformed input", () => {
    expect(validateEmail("not-an-email")).toBe(null);
  });

});
