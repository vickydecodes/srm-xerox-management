import { describe, it, expect } from "vitest";
import formatdate from "@/core/utils/formatdate.util";

describe("formatdate", () => {
  it("formats a valid ISO date string (en-IN style)", () => {
    const result = formatdate("2024-01-15T10:30:00.000Z");
    // en-IN: day 2-digit, month short, year numeric — e.g. "15 Jan 2024"
    expect(result).toMatch(/15/);
    expect(result).toMatch(/Jan/i);
    expect(result).toMatch(/2024/);
  });

  it("formats a Date instance", () => {
    const result = formatdate(new Date("2023-06-01T00:00:00.000Z"));
    expect(result).toMatch(/2023/);
    expect(result).toMatch(/Jun/i);
  });

  it("returns default fallback '-' for null", () => {
    expect(formatdate(null)).toBe("-");
  });

  it("returns default fallback '-' for undefined", () => {
    expect(formatdate(undefined)).toBe("-");
  });

  it("returns default fallback '-' for empty string", () => {
    expect(formatdate("")).toBe("-");
  });

  it("returns custom fallback when date is falsy", () => {
    expect(formatdate(null, "N/A")).toBe("N/A");
    expect(formatdate(undefined, "—")).toBe("—");
  });

  it("ignores custom fallback when date is truthy", () => {
    const result = formatdate("2020-12-25T00:00:00.000Z", "N/A");
    expect(result).not.toBe("N/A");
    expect(result).toMatch(/2020/);
  });
});