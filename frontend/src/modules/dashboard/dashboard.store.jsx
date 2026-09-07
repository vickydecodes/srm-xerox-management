import { create } from 'zustand';
import { apiRequest } from '@/core/api/api.request';
import { apiurls } from '@/core/api/api.urls';
import handleApiError from '@/core/errors/error.handler';

export const useDashboardStore = create((set) => ({
  data: null,
  loading: false,

  fetchDashboard: async (role, dateRange) => {
    set({ loading: true });
    try {
      let config;
      switch (role) {
        case "super_admin":
          config = apiurls.dashboard.superAdmin;
          break;
        case "branch_admin":
          config = apiurls.dashboard.branchAdmin;
          break;
        case "department_admin":
          config = apiurls.dashboard.departmentAdmin;
          break;
        case "shop_admin":
          config = apiurls.dashboard.shopAdmin;
          break;
        case "staff":
          config = apiurls.dashboard.staff;
          break;
        default:
          throw new Error("Invalid role for dashboard fetch");
      }

      let lt = undefined;
      let gt = undefined;
      if (dateRange?.to) {
        lt = new Date(dateRange.to).toISOString();
      }
      if (dateRange?.from) {
        gt = new Date(dateRange.from).toISOString();
      }

      const res = await apiRequest("get", config.url(lt, gt));
      set({ data: res.data, loading: false });
      return res.data;
    } catch (err) {
      handleApiError(err, 'Failed to fetch dashboard data', { toast: true });
      set({ data: null, loading: false });
    }
  },
}));
