import { useSettingStore } from './setting.store';
import { useAuth } from '@/core/contexts/auth.context';

export const useSettingModule = (exported) => {
  const store = useSettingStore();
  const { user } = useAuth();

  const allowEdit = user?.role === 'super_admin';

  return {
    state: store.config,
    config: store.config,
    loading: store.loading,
    fetch: store.fetchSettings,
    update: store.updateSettings,
    allowEdit,
  };
};
