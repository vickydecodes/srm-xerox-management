import { create } from 'zustand';

export const createEntityStore = () => {
  return create((set) => ({
    list: [],
    current: null,

    loading: {
      global: false,
      getAll: false,
      create: false,
      edit: false,
      delete: false,
      retrieve: false,
      exportCsv: false,
      exportXlsx: false,
      exportPdf: false
    },

    startLoading: (key) =>
      set((state) => ({
        loading: {
          ...state.loading,
          [key]: true,
          global: true,
        },
      })),

    stopLoading: (key) =>
      set((state) => {
        const updated = { ...state.loading, [key]: false };
        const stillLoading = Object.entries(updated)
          .filter(([k]) => k !== 'global')
          .some(([, v]) => v === true);

        return { loading: { ...updated, global: stillLoading } };
      }),



    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 1,
      hasNext: false,
      hasPrev: false,
    },

    query: {
      page: 1,
      limit: 10,
      sortBy: null,
      order: null,
    },

    setQuery: (q) =>
      set((state) => ({
        query: {
          ...state.query,
          ...q,
        },
      })),

    replaceQuery: (q) =>
      set({
        query: q,
      }),

    resetQuery: () =>
      set({
        query: {
          page: 1,
          limit: 10,
          sortBy: null,
          order: null,
        },
      }),

    set: (items) => set({ list: items }),

    add: (item) =>
      set((state) => ({
        list: [...state.list, item],
      })),

    update: (id, updated) =>
      set((state) => ({
        list: state.list.map((i) => (i._id === id ? { ...i, ...updated } : i)),
      })),

    remove: (id) =>
      set((state) => ({
        list: state.list.filter((i) => i._id !== id),
      })),

    setPagination: (pagination) =>
      set({
        pagination: {
          page: pagination.page || 1,
          limit: pagination.limit || 10,
          total: pagination.total || 0,
          pages: pagination.pages || 1,
          hasNext: pagination.hasNext || false,
          hasPrev: pagination.hasPrev || false,
        },
      }),

    setCurrent: (entity) => set({ current: entity }),
    clearCurrent: () => set({ current: null }),
  }));
};
