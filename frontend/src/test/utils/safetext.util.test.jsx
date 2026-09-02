import { describe, it, expect, vi, beforeEach } from "vitest";
import sorter from "@/core/utils/sorter.util";

describe("sorter", () => {
  let module;

  beforeEach(() => {
    module = {
      sortByColumn: vi.fn(),
      fetch: vi.fn(),
    };
  });

  it("calls sortByColumn when __replace is true", () => {
    sorter(module, {
      __replace: true,
      sortBy: "name",
      order: "asc",
      limit: 25,
    });

    expect(module.sortByColumn).toHaveBeenCalledWith("name", "asc", 25);
    expect(module.fetch).not.toHaveBeenCalled();
  });

  it("calls fetch when __replace is not set", () => {
    const params = { sortBy: "createdAt", order: "desc" };
    sorter(module, params);
    expect(module.fetch).toHaveBeenCalledWith(params);
    expect(module.sortByColumn).not.toHaveBeenCalled();
  });

  it("does not throw when module is null/undefined", () => {
    expect(() =>
      sorter(null, { __replace: true, sortBy: "a", order: "asc" })
    ).not.toThrow();
    expect(() => sorter(undefined, { page: 1 })).not.toThrow();
  });
});