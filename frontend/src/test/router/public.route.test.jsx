import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockUseAuth = vi.fn();

vi.mock("@/core/contexts/auth.context", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/pages/login/login", () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}));

import PublicRoute from "@/core/router/public.route.jsx";

function renderPublic(auth, { route = "/", withChildren = true } = {}) {
  mockUseAuth.mockReturnValue(auth);

  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/"
          element={
            withChildren ? (
              <PublicRoute>
                <div data-testid="public-child">Public Child</div>
              </PublicRoute>
            ) : (
              <PublicRoute />
            )
          }
        />
        <Route
          path="/super_admin/"
          element={<div data-testid="sa-dash">SA Dashboard</div>}
        />
        <Route
          path="/staff/"
          element={<div data-testid="staff-dash">Staff Dashboard</div>}
        />
        <Route
          path="/branch_admin/"
          element={<div data-testid="ba-dash">BA Dashboard</div>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("PublicRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is a valid component (sanity)", () => {
    expect(PublicRoute).toBeTypeOf("function");
  });

  it("returns null while loading", () => {
    const { container } = renderPublic({ role: null, loading: true });
    expect(screen.queryByTestId("public-child")).not.toBeInTheDocument();
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
    expect(container.querySelector("[data-testid]")).toBeNull();
  });

  it("renders children when not authenticated", () => {
    renderPublic({ role: null, loading: false });
    expect(screen.getByTestId("public-child")).toBeInTheDocument();
  });

  it("redirects to /{role}/ when authenticated (super_admin)", () => {
    renderPublic({ role: "super_admin", loading: false });
    expect(screen.getByTestId("sa-dash")).toBeInTheDocument();
    expect(screen.queryByTestId("public-child")).not.toBeInTheDocument();
  });

  it("redirects to /{role}/ when authenticated (staff)", () => {
    renderPublic({ role: "staff", loading: false });
    expect(screen.getByTestId("staff-dash")).toBeInTheDocument();
    expect(screen.queryByTestId("public-child")).not.toBeInTheDocument();
  });

  it("redirects to /{role}/ when authenticated (branch_admin)", () => {
    renderPublic({ role: "branch_admin", loading: false });
    expect(screen.getByTestId("ba-dash")).toBeInTheDocument();
    expect(screen.queryByTestId("public-child")).not.toBeInTheDocument();
  });

  it("falls back to Login when no children and not authenticated", () => {
    renderPublic({ role: null, loading: false }, { withChildren: false });
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });
});