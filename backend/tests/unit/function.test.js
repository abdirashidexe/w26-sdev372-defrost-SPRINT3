import { describe, test, expect } from "vitest";
import { cleanPhoneNumber } from "../../index.js";

describe("cleanPhoneNumber", () => {

  test("removes non-numeric characters", () => {
    expect(cleanPhoneNumber("(206) 555-1234")).toBe("2065551234");
  });

  test("returns null for invalid numbers", () => {
    expect(cleanPhoneNumber("abc")).toBe(null);
  });

});