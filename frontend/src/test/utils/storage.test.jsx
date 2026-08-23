import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import storage from "@/core/utils/storage";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("set / get", () => {
    it("stores and retrieves an object", () => {
      storage.set("user", { id: 1, name: "Ada" });
      expect(storage.get("user")).toEqual({ id: 1, name: "Ada" });
    });

    it("stores and retrieves primitives", () => {
      storage.set("count", 42);
      expect(storage.get("count")).toBe(42);

      storage.set("flag", true);
      expect(storage.get("flag")).toBe(true);

      storage.set("label", "hello");
      expect(storage.get("label")).toBe("hello");
    });

    it("returns null for missing key", () => {
      expect(storage.get("missing")).toBeNull();
    });
  });

  describe("remove", () => {
    it("removes a key", () => {
      storage.set("temp", { a: 1 });
      storage.remove("temp");
      expect(storage.get("temp")).toBeNull();
    });
  });

  describe("clear", () => {
    it("clears all keys", () => {
      storage.set("a", 1);
      storage.set("b", 2);
      storage.clear();
      expect(storage.get("a")).toBeNull();
      expect(storage.get("b")).toBeNull();
    });
  });

  describe("error handling", () => {
    it("get returns null and logs on invalid JSON", () => {
      localStorage.setItem("bad", "{not-json");
      expect(storage.get("bad")).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it("set swallows stringify/storage errors", () => {
      const circular = {};
      circular.self = circular;
      expect(() => storage.set("circ", circular)).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });
});