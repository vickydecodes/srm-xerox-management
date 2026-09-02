import { describe, it, expect, vi, beforeEach } from "vitest";
import { createEntityQueryActions } from "@/core/utils/entity.util";

describe("createEntityQueryActions", () => {
  let crud;
  let query;
  let getQuery;
  let setQuery;
  let actions;

  beforeEach(() => {
    query = {
      page: 1,
      limit: 10,
      search: "old",
      branch: "b1",
    };

    getQuery = vi.fn(() => ({ ...query }));
    setQuery = vi.fn((next) => {
      query = next;
    });

    crud = {
      getAll: vi.fn((q) => Promise.resolve({ data: [], query: q })),
      exportCsv: vi.fn(),
      exportXlsx: vi.fn(() => Promise.resolve("file.xlsx")),
      exportPdf: vi.fn(),
      exportMarksheetCsv: vi.fn(),
      exportMarksheetXlsx: vi.fn(),
      exportMarksheetPdf: vi.fn(),
    };

    actions = createEntityQueryActions({ crud, getQuery, setQuery });
  });

  describe("fetch", () => {
    it("merges incoming with current query and calls crud.getAll", () => {
      actions.fetch({ page: 2, search: "new" });

      expect(setQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
          search: "new",
          branch: "b1",
        })
      );
      expect(crud.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, search: "new" })
      );
    });

    it("removes null and empty-string params", () => {
      actions.fetch({ search: "", branch: null, status: "active" });

      const next = setQuery.mock.calls[0][0];
      expect(next).not.toHaveProperty("search");
      expect(next).not.toHaveProperty("branch");
      expect(next.status).toBe("active");
    });
  });

  describe("reset", () => {
    it("resets to defaults and calls getAll", () => {
      actions.reset();

      const next = setQuery.mock.calls[0][0];
      expect(next.page).toBe(1);
      expect(next.limit).toBe(10);
      expect(next.sortBy).toBeNull();
      expect(next.order).toBeNull();
      expect(next.search).toBeUndefined();
      expect(next.branch).toBeUndefined();
      expect(crud.getAll).toHaveBeenCalledWith(next);
    });

    it("merges extras into default query", () => {
      actions.reset({ custom: "x" });
      expect(setQuery.mock.calls[0][0].custom).toBe("x");
    });
  });

  describe("sortByColumn", () => {
    it("sets page 1, sortBy, order, limit and fetches", () => {
      actions.sortByColumn("name", "asc", 25);

      expect(setQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 25,
          sortBy: "name",
          order: "asc",
        })
      );
      expect(crud.getAll).toHaveBeenCalled();
    });

    it("defaults limit to 10", () => {
      actions.sortByColumn("createdAt", "desc");
      expect(setQuery.mock.calls[0][0].limit).toBe(10);
    });
  });

  describe("presets", () => {
    it("latest sorts by createdAt desc", () => {
      actions.presets.latest();
      expect(setQuery.mock.calls[0][0]).toMatchObject({
        sortBy: "createdAt",
        order: "desc",
        page: 1,
      });
    });

    it("oldest sorts by createdAt asc", () => {
      actions.presets.oldest();
      expect(setQuery.mock.calls[0][0]).toMatchObject({
        sortBy: "createdAt",
        order: "asc",
        page: 1,
      });
    });

    it("ascending uses given field", () => {
      actions.presets.ascending("title");
      expect(setQuery.mock.calls[0][0]).toMatchObject({
        sortBy: "title",
        order: "asc",
      });
    });

    it("descending uses given field", () => {
      actions.presets.descending("price");
      expect(setQuery.mock.calls[0][0]).toMatchObject({
        sortBy: "price",
        order: "desc",
      });
    });

    it("search sets term and page 1", () => {
      actions.presets.search("xerox");
      expect(setQuery.mock.calls[0][0]).toMatchObject({
        search: "xerox",
        page: 1,
      });
    });

    it("filterByBranch", () => {
      actions.presets.filterByBranch("br-1");
      expect(setQuery.mock.calls[0][0]).toMatchObject({
        branch: "br-1",
        page: 1,
      });
    });

    it("filterByStatus", () => {
      actions.presets.filterByStatus("active");
      expect(setQuery.mock.calls[0][0]).toMatchObject({
        status: "active",
        page: 1,
      });
    });

    it("filterByField / where", () => {
      actions.presets.filterByField("type", "credit");
      expect(setQuery.mock.calls[0][0].type).toBe("credit");

      actions.presets.where("role", "staff");
      expect(setQuery.mock.calls[1][0].role).toBe("staff");
    });

    it("filterByPaymentMethodId uses dotted key", () => {
      actions.presets.filterByPaymentMethodId("pm-9");
      expect(setQuery.mock.calls[0][0]["paymentHistory.paymentMethodId"]).toBe(
        "pm-9"
      );
    });
  });

  describe("exports", () => {
    it("csv merges query + extras", () => {
      actions.csv({ foo: 1 });
      expect(crud.exportCsv).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
          search: "old",
          branch: "b1",
          foo: 1,
        })
      );
    });

    it("csv ignores non-object extras", () => {
      actions.csv("bad");
      expect(crud.exportCsv).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 })
      );
      expect(crud.exportCsv.mock.calls[0][0]).not.toHaveProperty("0");
    });

    it("xlsx returns crud result", async () => {
      const result = await actions.xlsx({ bar: 2 });
      expect(crud.exportXlsx).toHaveBeenCalledWith(
        expect.objectContaining({ bar: 2 })
      );
      expect(result).toBe("file.xlsx");
    });

    it("pdf merges query + extras", () => {
      actions.pdf({ x: true });
      expect(crud.exportPdf).toHaveBeenCalledWith(
        expect.objectContaining({ x: true })
      );
    });

    it("marksheet helpers pass batch id", () => {
      actions.marksheetCsv("batch-1");
      actions.marksheetXlsx("batch-2");
      actions.marksheetPdf("batch-3");

      expect(crud.exportMarksheetCsv).toHaveBeenCalledWith({
        batch: "batch-1",
      });
      expect(crud.exportMarksheetXlsx).toHaveBeenCalledWith({
        batch: "batch-2",
      });
      expect(crud.exportMarksheetPdf).toHaveBeenCalledWith({
        batch: "batch-3",
      });
    });
  });

  it("exposes getQuery", () => {
    expect(actions.getQuery()).toEqual(query);
  });
});