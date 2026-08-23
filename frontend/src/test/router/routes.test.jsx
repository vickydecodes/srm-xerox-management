import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockUseAuth = vi.fn();

vi.mock("@/core/contexts/auth.context", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/components/global/layout.jsx", () => ({
  default: () => {
    const { Outlet } = require("react-router-dom");
    return (
      <div data-testid="layout">
        <Outlet />
      </div>
    );
  },
}));

vi.mock("@/components/global/app404.jsx", () => ({
  default: () => <div data-testid="insider-404">Insider 404</div>,
}));

vi.mock("@/components/global/notfound.jsx", () => ({
  default: () => <div data-testid="public-404">Public 404</div>,
}));

vi.mock("@/pages/login/login.jsx", () => ({
  default: () => <div data-testid="login">Login</div>,
}));

vi.mock("@/pages/dashboard/dashboard", () => ({
  default: () => <div data-testid="page-dashboard">dashboard</div>,
}));
vi.mock("@/pages/bill-creation/bill-creation", () => ({
  default: () => <div data-testid="page-bill-creation">bill-creation</div>,
}));
vi.mock("@/pages/inventory-product/inventory-product", () => ({
  default: () => (
    <div data-testid="page-inventory-product">inventory-product</div>
  ),
}));
vi.mock("@/pages/product/product", () => ({
  default: () => <div data-testid="page-product">product</div>,
}));
vi.mock("@/pages/department/department", () => ({
  default: () => <div data-testid="page-department">department</div>,
}));
vi.mock("@/pages/service/service", () => ({
  default: () => <div data-testid="page-service">service</div>,
}));
vi.mock("@/pages/bill/bill", () => ({
  default: () => <div data-testid="page-bill">bill</div>,
}));
vi.mock("@/pages/branch/branch", () => ({
  default: () => <div data-testid="page-branch">branch</div>,
}));
vi.mock("@/pages/branch-admin/branch-admin", () => ({
  default: () => <div data-testid="page-branch-admin">branch-admin</div>,
}));
vi.mock("@/pages/shop/shop", () => ({
  default: () => <div data-testid="page-shop">shop</div>,
}));
vi.mock("@/pages/shop-admin/shop-admin", () => ({
  default: () => <div data-testid="page-shop-admin">shop-admin</div>,
}));
vi.mock("@/pages/staff-admin/staff-admin", () => ({
  default: () => <div data-testid="page-staff-admin">staff-admin</div>,
}));
vi.mock("@/pages/department-admin/department-admin", () => ({
  default: () => (
    <div data-testid="page-department-admin">department-admin</div>
  ),
}));
vi.mock("@/pages/order/order", () => ({
  default: () => <div data-testid="page-order">order</div>,
}));
vi.mock("@/pages/credits/credits", () => ({
  default: () => <div data-testid="page-credits">credits</div>,
}));
vi.mock("@/pages/changepassword/changepassword", () => ({
  default: () => <div data-testid="page-changepassword">changepassword</div>,
}));
vi.mock("@/pages/profile/profile", () => ({
  default: () => <div data-testid="page-profile">profile</div>,
}));
vi.mock("@/pages/settings/settings", () => ({
  default: () => <div data-testid="page-settings">settings</div>,
}));

import AppRoutes from "@/core/router/app.routes";
import { adminRoutes } from "@/core/router/admin.routes";
import { branchAdminRoutes } from "@/core/router/branch.routes";
import { departmentAdminRoutes } from "@/core/router/department.routes";
import { shopAdminRoutes } from "@/core/router/shop.routes";
import { staffRoutes } from "@/core/router/staff.routes";

function renderAt(path, auth) {
  mockUseAuth.mockReturnValue(auth);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>
  );
}

describe("Route configs (shape)", () => {
  const groups = [
    adminRoutes,
    branchAdminRoutes,
    departmentAdminRoutes,
    shopAdminRoutes,
    staffRoutes,
  ];

  it.each(groups.map((g) => [g.role, g]))(
    "%s has role, routes array, and logout",
    (_role, group) => {
      expect(group.role).toBeTruthy();
      expect(Array.isArray(group.routes)).toBe(true);
      expect(group.routes.length).toBeGreaterThan(0);
      expect(group.logout).toMatchObject({
        label: expect.any(String),
        path: "/",
      });
    }
  );

  it("every route has path, label, title, element", () => {
    groups.forEach((group) => {
      group.routes.forEach((route) => {
        expect(route.path).toMatch(new RegExp(`^/${group.role}`));
        expect(route.label).toBeTruthy();
        expect(route.title).toBeTruthy();
        expect(route.element).toBeTruthy();
      });
    });
  });

  it("admin routes include expected paths", () => {
    const paths = adminRoutes.routes.map((r) => r.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/super_admin/",
        "/super_admin/bill",
        "/super_admin/product",
        "/super_admin/settings",
        "/super_admin/profile",
      ])
    );
  });
});

describe("AppRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows login on / when unauthenticated", () => {
    renderAt("/", { role: null, loading: false });
    expect(screen.getByTestId("login")).toBeInTheDocument();
  });

  it("redirects authenticated user away from / to role home", () => {
    renderAt("/", { role: "super_admin", loading: false });
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("blocks unauthenticated access to role routes (redirect to login)", () => {
    renderAt("/super_admin/", { role: null, loading: false });
    expect(screen.getByTestId("login")).toBeInTheDocument();
  });

  it("allows super_admin into /super_admin/", () => {
    renderAt("/super_admin/", { role: "super_admin", loading: false });
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("redirects wrong role to their own home", () => {
    renderAt("/super_admin/", { role: "staff", loading: false });
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("shows public 404 for unknown top-level path when unauthenticated", () => {
    renderAt("/no-such-page", { role: null, loading: false });
    expect(screen.getByTestId("public-404")).toBeInTheDocument();
  });

  it("shows insider 404 for unknown path under role", () => {
    renderAt("/super_admin/does-not-exist", {
      role: "super_admin",
      loading: false,
    });
    expect(screen.getByTestId("insider-404")).toBeInTheDocument();
  });

  it("returns nothing while auth is loading", () => {
    const { container } = renderAt("/super_admin/", {
      role: null,
      loading: true,
    });
    expect(container).toBeEmptyDOMElement();
  });
});