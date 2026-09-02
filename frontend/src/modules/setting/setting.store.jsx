import { create } from 'zustand';
import { apiRequest } from '@/core/api/api.request';
import { apiurls } from '@/core/api/api.urls';
import { toast } from 'sonner';
import handleApiError from '@/core/errors/error.handler';

export const useSettingStore = create((set) => ({
  config: null,
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const res = await apiRequest('get', apiurls.settings.get.url());
      set({ config: res.data, loading: false });
      return res.data;
    } catch (err) {
      handleApiError(err, 'Failed to fetch settings', { toast: true });
      set({ config: null, loading: false });
    }
  },

  updateSettings: async (payload) => {
    set({ loading: true });
    try {
      const res = await apiRequest('put', apiurls.settings.update.url(), { data: payload });
      set({ config: res.data, loading: false });
      toast.success('Settings updated successfully');
      return res.data;
    } catch (err) {
      handleApiError(err, 'Failed to update settings', { toast: true });
      set({ loading: false });
      throw err;
    }
  },
}));
