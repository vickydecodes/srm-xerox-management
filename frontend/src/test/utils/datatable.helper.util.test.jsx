import { describe, it, expect, vi } from "vitest";
import { fallback, createbtn } from "@/core/utils/datatable.helper.util";

describe("fallback", () => {
  it("builds title, description and empty buttons by default", () => {
    const result = fallback("No data", "Nothing here");
    expect(result).toEqual({
      title: "No data",
      description: "Nothing here",
      buttons: [],
    });
  });

  it("pairs labels with actions by index", () => {
    const action1 = vi.fn();
    const action2 = vi.fn();

    const result = fallback(
      "Empty",
      "Add something",
      ["Create", "Import"],
      [action1, action2]
    );

    expect(result.buttons).toEqual([
      { label: "Create", action: action1 },
      { label: "Import", action: action2 },
    ]);
  });

  it("sets action to undefined when fewer actions than labels", () => {
    const result = fallback("T", "D", ["Only one"], []);
    expect(result.buttons).toEqual([{ label: "Only one", action: undefined }]);
  });
});

describe("createbtn", () => {
  it("returns label, action, permission and provision", () => {
    const action = vi.fn();
    const btn = createbtn("Add", action, "create:product");

    expect(btn).toEqual({
      label: "Add",
      action,
      permission: "create:product",
      provision: "create:product",
    });
  });

  it("works when permission is undefined", () => {
    const btn = createbtn("View", vi.fn(), undefined);
    expect(btn.permission).toBeUndefined();
    expect(btn.provision).toBeUndefined();
  });
});