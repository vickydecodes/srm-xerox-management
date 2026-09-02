import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ---------- mocks (must be before importing AuthProvider) ----------

const mockNavigate = vi.fn();
const mockLocation = { pathname: "/" };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

const mockCrud = {
  me: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  changePassword: vi.fn(),
  adminResetPassword: vi.fn(),
};

vi.mock("@/core/factory/entity.crud", () => ({
  createCrud: () => mockCrud,
}));

vi.mock("@/core/api/api.service", () => ({
  setupInterceptors: vi.fn(),
}));

vi.mock("@/core/bridge/ui.ref", () => ({
  uiRef: {
    clearModals: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/core/errors/error.handler", () => ({
  default: vi.fn(),
}));

vi.mock("@/components/global/loader", () => ({
  default: () => <div data-testid="app-loader">Loading...</div>,
}));

// import after mocks
import { AuthProvider, useAuth } from "@/core/contexts/auth.context";
import { setupInterceptors } from "@/core/api/api.service";
import { uiRef } from "@/core/bridge/ui.ref";
import { toast } from "sonner";
import handleApiError from "@/core/errors/error.handler";

// ---------- helpers ----------

function wrapper({ children }) {
  return (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
}

const fakeUser = {
  _id: "user-1",
  name: "Test User",
  email: "test@example.com",
  role: "super_admin",
  unifiedPermissions: { bills: ["read"] },
};

// ---------- tests ----------

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCrud.me.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws when useAuth is called outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("AuthContext must be used inside <AuthProvider>");
  });

  it("shows AppLoader while hydrating", async () => {
    mockCrud.me.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <AuthProvider>
          <div data-testid="child">child</div>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("app-loader")).toBeInTheDocument();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("renders children after hydrate finishes (no user)", async () => {
    mockCrud.me.mockResolvedValue(null);

    render(
      <MemoryRouter>
        <AuthProvider>
          <div data-testid="child">child</div>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("app-loader")).not.toBeInTheDocument();
  });

  it("hydrates user and role from crud.me()", async () => {
    mockCrud.me.mockResolvedValue(fakeUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.role).toBe("super_admin");
    expect(result.current.userId).toBe("user-1");
    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.permissions).toEqual({ bills: ["read"] });
  });

  it("sets user/role to null when hydrate fails", async () => {
    mockCrud.me.mockRejectedValue(new Error("unauthorized"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.isSuperAdmin).toBe(false);
  });

  it("exposes the expected API shape", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current).toMatchObject({
      user: null,
      userId: null,
      isSuperAdmin: false,
      role: null,
      permissions: {},
      loading: false,
      loggingIn: false,
    });

    expect(typeof result.current.login).toBe("function");
    expect(typeof result.current.logout).toBe("function");
    expect(typeof result.current.changePassword).toBe("function");
    expect(typeof result.current.adminResetPassword).toBe("function");
    expect(typeof result.current.setUser).toBe("function");
    expect(typeof result.current.setLoading).toBe("function");
  });

  it("login success: sets user, role, navigates, toasts", async () => {
    mockCrud.me
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(fakeUser);
    mockCrud.login.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login({
        email: "test@example.com",
        password: "secret",
      });
    });

    expect(mockCrud.login).toHaveBeenCalledWith(
      { email: "test@example.com", password: "secret" },
      { __options: { toast: false } }
    );
    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.role).toBe("super_admin");
    expect(result.current.loggingIn).toBe(false);
    expect(toast.success).toHaveBeenCalledWith("Login successful");
    expect(mockNavigate).toHaveBeenCalledWith("/super_admin/");
  });

  it("login failure: returns error and does not navigate", async () => {
    const err = new Error("Invalid credentials");
    mockCrud.login.mockRejectedValue(err);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    let returned;
    await act(async () => {
      returned = await result.current.login({
        email: "bad@example.com",
        password: "wrong",
      });
    });

    expect(returned).toBe(err);
    expect(result.current.user).toBeNull();
    expect(result.current.loggingIn).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalledWith(
      expect.stringMatching(/super_admin/)
    );
  });

  it("logout: clears user, navigates home, toasts", async () => {
    mockCrud.me.mockResolvedValue(fakeUser);
    mockCrud.logout.mockResolvedValue({});

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).toEqual(fakeUser));

    await act(async () => {
      await result.current.logout();
    });

    expect(mockCrud.logout).toHaveBeenCalled();
    expect(uiRef.clearModals).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/");
    expect(toast.success).toHaveBeenCalledWith("Logged out");
  });

  it("logout still clears state when crud.logout fails", async () => {
    mockCrud.me.mockResolvedValue(fakeUser);
    mockCrud.logout.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).toEqual(fakeUser));

    await act(async () => {
      await result.current.logout();
    });

    expect(toast.error).toHaveBeenCalledWith("Error during logout");
    expect(result.current.user).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("changePassword success: toasts and schedules logout", async () => {
    mockCrud.me.mockResolvedValue(fakeUser);
    mockCrud.changePassword.mockResolvedValue({ ok: true });
    mockCrud.logout.mockResolvedValue({});

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).toEqual(fakeUser));

    vi.useFakeTimers();

    await act(async () => {
      await result.current.changePassword("old", "new");
    });

    expect(mockCrud.changePassword).toHaveBeenCalledWith({
      userId: "user-1",
      role: "super_admin",
      currentPassword: "old",
      newPassword: "new",
    });
    expect(toast.success).toHaveBeenCalledWith("Password updated successfully");

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockCrud.logout).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("changePassword failure: calls handleApiError", async () => {
    mockCrud.me.mockResolvedValue(fakeUser);
    const err = new Error("bad password");
    mockCrud.changePassword.mockRejectedValue(err);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).toEqual(fakeUser));

    await act(async () => {
      await result.current.changePassword("old", "new");
    });

    expect(handleApiError).toHaveBeenCalledWith(err);
  });

  it("adminResetPassword success", async () => {
    mockCrud.me.mockResolvedValue(fakeUser);
    mockCrud.adminResetPassword.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).toEqual(fakeUser));

    await act(async () => {
      await result.current.adminResetPassword("target-1", "staff", "newpass");
    });

    expect(mockCrud.adminResetPassword).toHaveBeenCalledWith({
      adminId: "user-1",
      adminRole: "super_admin",
      targetId: "target-1",
      targetRole: "staff",
      newPassword: "newpass",
    });
    expect(toast.success).toHaveBeenCalledWith("Password reset successfully");
  });

  it("registers unauthorized interceptor on mount", async () => {
    mockCrud.me.mockResolvedValue(null);

    render(
      <MemoryRouter>
        <AuthProvider>
          <div data-testid="child">child</div>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    expect(setupInterceptors).toHaveBeenCalled();

    const onUnauthorized = setupInterceptors.mock.calls[0][0];
    act(() => {
      onUnauthorized("Session expired");
    });

    expect(uiRef.clearModals).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/");
    expect(toast.error).toHaveBeenCalledWith("Session expired");
  });
});