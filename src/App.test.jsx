import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import App from "./App";

describe("App component", () => {
  test("Testing rendering of the main title", () => {
    render(<App />);
    expect(screen.getByText("[Defrost]")).toBeInTheDocument();
  });

  test("renders phone number input", () => {
    const input = screen.getByLabelText(/enter a phone number/i);
    expect(input).toBeInTheDocument();
  });

  test("updates input when user types", async () => {
    const input = screen.getByLabelText(/enter a phone number/i);
    await userEvent.type(input, "2065551234");
    expect(input.value).toBe("2065551234");
  });
});