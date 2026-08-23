import { describe, it, expect } from "vitest";
import { safetext } from "@/core/utils/safetext.util";

describe("safetext", () => {
  it("returns default fallback for null/undefined", () => {
    expect(safetext(null)).toBe("Unknown data");
    expect(safetext(undefined)).toBe("Unknown data");
  });

  it("returns '-' for empty string", () => {
    expect(safetext("")).toBe("-");
  });

  it("uses custom string fallback", () => {
    expect(safetext(null, "N/A")).toBe("N/A");
  });

  it("capitalizes plain strings", () => {
    expect(safetext("hello")).toBe("Hello");
    expect(safetext("ACTIVE")).toBe("ACTIVE");
  });

  it("maps booleans via booleanMap", () => {
    expect(safetext(true)).toBe("Active");
    expect(safetext(false)).toBe("Inactive");
  });

  it("allows custom booleanMap via options object as 2nd arg", () => {
    expect(
      safetext(true, { booleanMap: { true: "Yes", false: "No" } })
    ).toBe("Yes");
    expect(
      safetext(false, { booleanMap: { true: "Yes", false: "No" } })
    ).toBe("No");
  });

  it("picks field from object (default pick: name)", () => {
    expect(safetext({ name: "xerox", _id: "1" })).toBe("Xerox");
  });

  it("picks custom field from object", () => {
    expect(safetext({ title: "bill" }, { pick: "title" })).toBe("Bill");
  });

  it("returns fallback when object missing pick field", () => {
    expect(safetext({ _id: "1" })).toBe("Unknown data");
    expect(safetext({ name: null }, "Missing")).toBe("Missing");
  });

  it("joins array of objects by pick field", () => {
    expect(
      safetext([{ name: "a" }, { name: "b" }])
    ).toBe("A, B");
  });

  it("joins array of primitives", () => {
    // when pick is set (default 'name'), primitives yield null → fallback
    // without pick: pass pick: null/undefined via options
    expect(safetext(["alpha", "beta"], { pick: null })).toBe("Alpha, Beta");
  });

  it("returns fallback for empty array", () => {
    expect(safetext([])).toBe("Unknown data");
  });

  it("supports joinWith option", () => {
    expect(
      safetext([{ name: "one" }, { name: "two" }], {
        pick: "name",
        joinWith: " | ",
      })
    ).toBe("One | Two");
  });

  it("merges options from 3rd argument", () => {
    expect(
      safetext({ label: "shop" }, "fallback", { pick: "label" })
    ).toBe("Shop");
  });
});