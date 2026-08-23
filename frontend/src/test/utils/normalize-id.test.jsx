import { describe, it, expect } from "vitest";
import { safeId } from "@/core/utils/normalize-id";

describe("safeId", () => {
  it("returns empty string for null/undefined/falsy", () => {
    expect(safeId(null)).toBe("");
    expect(safeId(undefined)).toBe("");
    expect(safeId("")).toBe("");
    expect(safeId(0)).toBe("");
  });

  it("returns string id from object with _id", () => {
    expect(safeId({ _id: "abc123" })).toBe("abc123");
    expect(safeId({ _id: 99 })).toBe("99");
  });

  it("returns empty string for object without usable _id", () => {
    expect(safeId({})).toBe("");
    expect(safeId({ _id: null })).toBe("");
  });

  it("stringifies primitive ids", () => {
    expect(safeId("user-1")).toBe("user-1");
    expect(safeId(42)).toBe("42");
  });
});