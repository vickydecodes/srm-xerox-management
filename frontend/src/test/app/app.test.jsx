import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ---------- mocks ----------

vi.mock("@/core/contexts/auth.context", () => ({
  AuthProvider: ({ children }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
  useAuth: () => ({
    user: null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/core/contexts/ui.context", () => ({
  UIProvider: ({ children }) => (
    <div data-testid="ui-provider">{children}</div>
  ),
}));

vi.mock("@/core/contexts/api.context", () => ({
  ApiProvider: ({ children }) => (
    <div data-testid="api-provider">{children}</div>
  ),
  useApi: () => ({}),
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }) => (
    <div data-testid="tooltip-provider">{children}</div>
  ),
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

vi.mock("@/core/utils/scrolltotop.util", () => ({
  default: () => <div data-testid="scroll-to-top" />,
}));

vi.mock("@/core/router/app.routes", () => ({
  default: () => <div data-testid="app-routes">App Routes</div>,
}));

// css import is fine; Vite/Vitest usually handles it
// if it errors, add: vi.mock("./app.css", () => ({}));

import App from "@/app/app";
// ---------- tests ----------

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<App />);
    expect(screen.getByTestId("app-routes")).toBeInTheDocument();
  });

  it("wraps the tree with AuthProvider", () => {
    render(<App />);
    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
  });

  it("wraps the tree with UIProvider", () => {
    render(<App />);
    expect(screen.getByTestId("ui-provider")).toBeInTheDocument();
  });

  it("wraps the tree with ApiProvider", () => {
    render(<App />);
    expect(screen.getByTestId("api-provider")).toBeInTheDocument();
  });

  it("wraps the tree with TooltipProvider", () => {
    render(<App />);
    expect(screen.getByTestId("tooltip-provider")).toBeInTheDocument();
  });

  it("renders ScrollToTop", () => {
    render(<App />);
    expect(screen.getByTestId("scroll-to-top")).toBeInTheDocument();
  });

  it("renders Toaster", () => {
    render(<App />);
    expect(screen.getByTestId("toaster")).toBeInTheDocument();
  });

  it("renders AppRoutes", () => {
    render(<App />);
    expect(screen.getByTestId("app-routes")).toHaveTextContent("App Routes");
  });

  it("nests providers in the correct order", () => {
    const { container } = render(<App />);

    const auth = screen.getByTestId("auth-provider");
    const ui = screen.getByTestId("ui-provider");
    const api = screen.getByTestId("api-provider");
    const tooltip = screen.getByTestId("tooltip-provider");
    const routes = screen.getByTestId("app-routes");

    // Auth > UI > Api > Tooltip > routes
    expect(auth.contains(ui)).toBe(true);
    expect(ui.contains(api)).toBe(true);
    expect(api.contains(tooltip)).toBe(true);
    expect(tooltip.contains(routes)).toBe(true);

    // smoke: something rendered under root
    expect(container.firstChild).toBeTruthy();
  });
});