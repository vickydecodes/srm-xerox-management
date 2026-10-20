import { create } from 'zustand';
import { apiRequest } from '@/core/api/api.request';
import { apiurls } from '@/core/api/api.urls';
import handleApiError from '@/core/errors/error.handler';

export const useDashboardStore = create((set) => ({
  data: null,
  loading: false,

  fetchDashboard: async (role, dateRangeOrParams, maybeVariant) => {
    set({ loading: true });
    try {
      let config;
      switch (role) {
        case "super_admin":
          config = apiurls.dashboard.superAdmin;
          break;
        case "branch_admin":
        case "manager":
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

      let dateRange;
      let variant;

      if (typeof dateRangeOrParams === 'string') {
        variant = dateRangeOrParams;
      } else if (dateRangeOrParams && ('variant' in dateRangeOrParams || 'from' in dateRangeOrParams || 'to' in dateRangeOrParams)) {
        if (dateRangeOrParams.variant) variant = dateRangeOrParams.variant;
        dateRange = dateRangeOrParams.dateRange || dateRangeOrParams;
      } else {
        dateRange = dateRangeOrParams;
      }

      if (maybeVariant) {
        variant = maybeVariant;
      }

      let lt = undefined;
      let gt = undefined;
      if (!variant && dateRange?.to) {
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        lt = endDate.toISOString();
      }
      if (!variant && dateRange?.from) {
        const startDate = new Date(dateRange.from);
        startDate.setHours(0, 0, 0, 0);
        gt = startDate.toISOString();
      }

      const url = variant !== undefined
        ? config.url(lt, gt, variant)
        : config.url(lt, gt);
      const res = await apiRequest("get", url);
      set({ data: res.data, loading: false });
      return res.data;
    } catch (err) {
      handleApiError(err, 'Failed to fetch dashboard data', { toast: true });
      set({ data: null, loading: false });
    }
  },
}));
