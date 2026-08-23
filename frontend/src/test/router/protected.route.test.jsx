import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockUseAuth = vi.fn();

vi.mock("@/core/contexts/auth.context", () => ({
  useAuth: () => mockUseAuth(),
}));

// match the real file name used by the app
import ProtectedRoute from "@/core/router/protected.route.jsx";

function renderProtected({
  route = "/protected",
  auth,
  allowedRoles = ["super_admin"],
  useOutlet = false,
} = {}) {
  mockUseAuth.mockReturnValue(auth);

  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/" element={<div data-testid="login">Login</div>} />
        <Route
          path="/super_admin"
          element={<div data-testid="sa-home">SA Home</div>}
        />
        <Route
          path="/branch_admin"
          element={<div data-testid="ba-home">BA Home</div>}
        />

        {useOutlet ? (
          <Route
            path="/protected"
            element={<ProtectedRoute allowedRoles={allowedRoles} />}
          >
            <Route
              index
              element={<div data-testid="outlet-child">Outlet Child</div>}
            />
          </Route>
        ) : (
          <Route
            path="/protected"
            element={
              <ProtectedRoute allowedRoles={allowedRoles}>
                <div data-testid="protected-content">Protected</div>
              </ProtectedRoute>
            }
          />
        )}
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is a valid component (sanity)", () => {
    expect(ProtectedRoute).toBeTypeOf("function");
  });

  it("returns null while loading", () => {
    const { container } = renderProtected({
      auth: { role: null, loading: true },
    });
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("login")).not.toBeInTheDocument();
    // only the router root exists; route element rendered null
    expect(container.querySelector("[data-testid]")).toBeNull();
  });

  it("redirects to / when no role", () => {
    renderProtected({
      auth: { role: null, loading: false },
    });
    expect(screen.getByTestId("login")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("redirects to /{role} when role is not allowed", () => {
    renderProtected({
      auth: { role: "branch_admin", loading: false },
    });
    expect(screen.getByTestId("ba-home")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("renders children when role is allowed", () => {
    renderProtected({
      auth: { role: "super_admin", loading: false },
    });
    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });

  it("renders Outlet when no children and role is allowed", () => {
    renderProtected({
      auth: { role: "super_admin", loading: false },
      useOutlet: true,
    });
    expect(screen.getByTestId("outlet-child")).toBeInTheDocument();
  });
});