const base_url = import.meta.env.VITE_BASE_URL;

const apiurls = {
  auth: {
    login: { method: "post", url: () => `${base_url}/auths/login` },
    me: { method: "get", url: () => `${base_url}/auths/me` },
    logout: { method: "post", url: () => `${base_url}/auths/logout` },
    changePassword: {
      method: "post",
      url: () => `${base_url}/auths/change-password`,
    },
    adminResetPassword: {
      method: "post",
      url: () => `${base_url}/auths/admin/reset-password`,
    },
  },
  users: {
    create: { method: "post", url: () => `${base_url}/users` },
    getAll: { method: "get", url: () => `${base_url}/users` },
    getOne: { method: "get", url: (id) => `${base_url}/users/${id}` },
    edit: { method: "put", url: (id) => `${base_url}/users/${id}` },
    delete: { method: "delete", url: (id) => `${base_url}/users/${id}` },
    setActiveStatus: {
      method: "patch",
      url: (id) => `${base_url}/users/${id}/active-status`,
    },
    retrieve: {
      method: "put",
      url: (id) => `${base_url}/users/${id}/retrieve`,
    },
    erase: { method: "delete", url: (id) => `${base_url}/users/${id}/erase` },
  },

  services: {
    create: { method: "post", url: () => `${base_url}/services` },
    getAll: { method: "get", url: () => `${base_url}/services` },
    getOne: { method: "get", url: (id) => `${base_url}/services/${id}` },
    edit: { method: "put", url: (id) => `${base_url}/services/${id}` },
    delete: { method: "delete", url: (id) => `${base_url}/services/${id}` },
    setActiveStatus: {
      method: "patch",
      url: (id) => `${base_url}/services/${id}/active-status`,
    },
    retrieve: {
      method: "put",
      url: (id) => `${base_url}/services/${id}/retrieve`,
    },
    erase: {
      method: "delete",
      url: (id) => `${base_url}/services/${id}/erase`,
    },
  },

  products: {
    create: { method: "post", url: () => `${base_url}/products` },
    getAll: { method: "get", url: () => `${base_url}/products` },
    getOne: { method: "get", url: (id) => `${base_url}/products/${id}` },
    edit: { method: "put", url: (id) => `${base_url}/products/${id}` },
    delete: { method: "delete", url: (id) => `${base_url}/products/${id}` },
    setActiveStatus: {
      method: "patch",
      url: (id) => `${base_url}/products/${id}/active-status`,
    },
    retrieve: {
      method: "put",
      url: (id) => `${base_url}/products/${id}/retrieve`,
    },
    erase: {
      method: "delete",
      url: (id) => `${base_url}/products/${id}/erase`,
    },
  },

  inventoryProducts: {
    create: { method: "post", url: () => `${base_url}/inventory-products` },
    getAll: { method: "get", url: () => `${base_url}/inventory-products` },
    getOne: {
      method: "get",
      url: (id) => `${base_url}/inventory-products/${id}`,
    },
    edit: {
      method: "put",
      url: (id) => `${base_url}/inventory-products/${id}`,
    },
    delete: {
      method: "delete",
      url: (id) => `${base_url}/inventory-products/${id}`,
    },
    setActiveStatus: {
      method: "patch",
      url: (id) => `${base_url}/inventory-products/${id}/active-status`,
    },
    retrieve: {
      method: "put",
      url: (id) => `${base_url}/inventory-products/${id}/retrieve`,
    },
    erase: {
      method: "delete",
      url: (id) => `${base_url}/inventory-products/${id}/erase`,
    },
  },

  bills: {
    create: { method: "post", url: () => `${base_url}/bills` },
    getAll: { method: "get", url: () => `${base_url}/bills` },
    getOne: { method: "get", url: (id) => `${base_url}/bills/${id}` },
    edit: { method: "put", url: (id) => `${base_url}/bills/${id}` },
    delete: { method: "delete", url: (id) => `${base_url}/bills/${id}` },
    setActiveStatus: {
      method: "patch",
      url: (id) => `${base_url}/bills/${id}/active-status`,
    },
    retrieve: {
      method: "put",
      url: (id) => `${base_url}/bills/${id}/retrieve`,
    },
    erase: { method: "delete", url: (id) => `${base_url}/bills/${id}/erase` },
  },
  branches: {
    create: { method: "post", url: () => `${base_url}/branches` },
    getAll: { method: "get", url: () => `${base_url}/branches` },
    getOne: { method: "get", url: (id) => `${base_url}/branches/${id}` },
    edit: { method: "put", url: (id) => `${base_url}/branches/${id}` },
    delete: { method: "delete", url: (id) => `${base_url}/branches/${id}` },
    setActiveStatus: {
      method: "patch",
      url: (id) => `${base_url}/branches/${id}/active-status`,
    },
    retrieve: {
      method: "put",
      url: (id) => `${base_url}/branches/${id}/retrieve`,
    },
    erase: {
      method: "delete",
      url: (id) => `${base_url}/branches/${id}/erase`,
    },
  },
  departments: {
    create: { method: "post", url: () => `${base_url}/departments` },
    getAll: { method: "get", url: () => `${base_url}/departments` },
    getOne: { method: "get", url: (id) => `${base_url}/departments/${id}` },
    edit: { method: "put", url: (id) => `${base_url}/departments/${id}` },
    delete: { method: "delete", url: (id) => `${base_url}/departments/${id}` },
    setActiveStatus: {
      method: "patch",
      url: (id) => `${base_url}/departments/${id}/active-status`,
    },
    retrieve: {
      method: "put",
      url: (id) => `${base_url}/departments/${id}/retrieve`,
    },
    erase: {
      method: "delete",
      url: (id) => `${base_url}/departments/${id}/erase`,
    },
  },
};

export { apiurls };
