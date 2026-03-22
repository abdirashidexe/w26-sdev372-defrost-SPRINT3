import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import App from "./App";

describe("App component", () => {
  test("Testing rendering of the main title", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /defrost/i })).toBeInTheDocument();
  });

  test("renders email input", () => {
    render(<App />);
    const input = screen.getByLabelText(/enter your email/i);
    expect(input).toBeInTheDocument();
  });

  test("updates input when user types", async () => {
    render(<App />);
    const input = screen.getByLabelText(/enter your email/i);
    await userEvent.type(input, "user@example.com");
    expect(input.value).toBe("user@example.com");
  });
});
