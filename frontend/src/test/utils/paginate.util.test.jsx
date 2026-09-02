import { describe, it, expect, vi, beforeEach } from "vitest";
import paginator from "@/core/utils/paginate.util";

describe("paginator", () => {
  let module;

  beforeEach(() => {
    module = {
      fetch: vi.fn(),
      getQuery: vi.fn(() => ({ page: 1, limit: 10, search: "q" })),
    };
  });

  it("does nothing when module is missing", () => {
    expect(() => paginator(null, { page: 2 })).not.toThrow();
    expect(() => paginator(undefined, { page: 2 })).not.toThrow();
  });

  it("with __replace merges current query and page/limit/search", () => {
    paginator(module, {
      __replace: true,
      page: 3,
      limit: 20,
      search: "new",
    });

    expect(module.fetch).toHaveBeenCalledWith({
      page: 3,
      limit: 20,
      search: "new",
    });
  });

  it("with __replace keeps existing search when search is undefined", () => {
    paginator(module, {
      __replace: true,
      page: 2,
      limit: 10,
    });

    expect(module.fetch).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: "q",
    });
  });

  it("without __replace passes params through to fetch", () => {
    paginator(module, { page: 5, status: "active" });
    expect(module.fetch).toHaveBeenCalledWith({
      page: 5,
      status: "active",
    });
  });

  it("handles module without getQuery on __replace", () => {
    const m = { fetch: vi.fn() };
    paginator(m, { __replace: true, page: 1, limit: 10 });
    expect(m.fetch).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
    });
  });
});