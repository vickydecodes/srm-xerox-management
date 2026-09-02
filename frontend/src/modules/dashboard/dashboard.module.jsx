import { useDashboardStore } from './dashboard.store';

export const useDashboardModule = (exported) => {
  const store = useDashboardStore();

  return {
    state: store.data,
    data: store.data,
    loading: store.loading,
    fetch: store.fetchDashboard,
  };
};
