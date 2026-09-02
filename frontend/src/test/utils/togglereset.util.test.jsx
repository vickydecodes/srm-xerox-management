import { describe, it, expect, vi } from "vitest";
import { togglereset } from "@/core/utils/togglereset.util";

describe("togglereset", () => {
  it("calls resetFn then resets selected filters", () => {
    const resetFn = vi.fn();
    const setSelected = vi.fn();

    togglereset(resetFn, setSelected);

    expect(resetFn).toHaveBeenCalledTimes(1);
    expect(setSelected).toHaveBeenCalledWith({
      branch: null,
      board: null,
      standard: null,
      batch: null,
    });
  });

  it("calls resetFn before setSelected", () => {
    const order = [];
    const resetFn = vi.fn(() => order.push("reset"));
    const setSelected = vi.fn(() => order.push("selected"));

    togglereset(resetFn, setSelected);

    expect(order).toEqual(["reset", "selected"]);
  });
});