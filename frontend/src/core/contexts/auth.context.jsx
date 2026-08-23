import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiurls } from "../api/api.urls";
import { createCrud } from "../factory/entity.crud";
import { setupInterceptors } from "../api/api.service";
import { flushSync } from "react-dom";
import { uiRef } from "../bridge/ui.ref";
import { toast } from "sonner";
import handleApiError from "../errors/error.handler";
import AppLoader from "@/components/global/loader";

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext must be used inside <AuthProvider>");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateRef = useRef(navigate);
  const locationRef = useRef(location);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loading, setLoading] = useState(true);


  const crud = useMemo(
    () => createCrud({ entity: "Auth", urls: apiurls.auth, store: null }),
    [],
  );

  useEffect(() => {
    setupInterceptors((message) => {
      uiRef.clearModals();
      flushSync(() => {
        setUser(null);
        setRole(null);
      });

      navigateRef.current("/");
      toast.error(message);
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    const hydrateUser = async () => {
      try {
        setLoading(true);
        const res = await crud.me();

        if (!mounted) return;

        if (res) {
          setUser(res);
          setRole(res.role);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch {
        if (mounted) {
          setUser(null);
          setRole(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    hydrateUser();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (data) => {
    try {
      setLoggingIn(true);

      const res = await crud.login(data, { __options: { toast: false } });
      if (!res) return;

      const me = await crud.me({ __options: { toast: false } });

      flushSync(() => {
        setUser(me);
        setRole(me.role);
      });

      toast.success("Login successful");
      navigate(`/${me.role}/`);
    } catch (err) {
      return err;
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await crud.logout();
    } catch {
      toast.error("Error during logout");
    }

    uiRef.clearModals();
    flushSync(() => {
      setUser(null);
      setRole(null);
    });

    navigate("/");
    toast.success("Logged out");
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await crud.changePassword({
        userId: user?._id,
        role: user?.role,
        currentPassword,
        newPassword,
      });
      toast.success("Password updated successfully");
      setTimeout(() => {
        logout();
      }, 2000);
      return res;
    } catch (err) {
      handleApiError(err);
    }
  };

  const adminResetPassword = async (targetId, targetRole, newPassword) => {
    try {
      const res = await crud.adminResetPassword({
        adminId: user?._id,
        adminRole: user?.role,
        targetId,
        targetRole,
        newPassword,
      });
      toast.success("Password reset successfully");
      return res;
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId: user?._id || null,
        isSuperAdmin: user?.role === "super_admin",
        role,
        permissions: user?.unifiedPermissions || {},
        loading,
        loggingIn,
        setLoading,
        login,
        changePassword,
        adminResetPassword,
        logout,
        setUser,
      }}
    >
      {loading ? <AppLoader /> : children}
    </AuthContext.Provider>
  );
};
