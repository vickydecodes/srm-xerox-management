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
    getByDepartment: {
      method: "get",
      url: (id) => `${base_url}/bills/department/${id}`,
    },
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
    approveCredit: {
      method: "patch",
      url: (id) => `${base_url}/bills/${id}/approve-credit`,
    },
    rejectCredit: {
      method: "patch",
      url: (id) => `${base_url}/bills/${id}/reject-credit`,
    },
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
    clearCredit: {
      method: "post",
      url: (id) => `${base_url}/departments/${id}/clear-credit`,
    },
  },
  credits: {
    getAll: { method: "get", url: () => `${base_url}/credits` },
  },
  orders: {
    create: { method: "post", url: () => `${base_url}/orders` },
    getAll: { method: "get", url: () => `${base_url}/orders` },
    getOne: { method: "get", url: (id) => `${base_url}/orders/${id}` },
    edit: { method: "put", url: (id) => `${base_url}/orders/${id}` },
    delete: { method: "delete", url: (id) => `${base_url}/orders/${id}` },
    setActiveStatus: {
      method: "patch",
      url: (id) => `${base_url}/orders/${id}/active-status`,
    },
    retrieve: {
      method: "put",
      url: (id) => `${base_url}/orders/${id}/retrieve`,
    },
    erase: {
      method: "delete",
      url: (id) => `${base_url}/orders/${id}/erase`,
    },
    submit: {
      method: "patch",
      url: (id) => `${base_url}/orders/${id}/submit`,
    },
    branchApprove: {
      method: "patch",
      url: (id) => `${base_url}/orders/${id}/branch-approve`,
    },
    superAdminApprove: {
      method: "patch",
      url: (id) => `${base_url}/orders/${id}/super-admin-approve`,
    },
  },
  settings: {
    get: { method: "get", url: () => `${base_url}/settings` },
    update: { method: "put", url: () => `${base_url}/settings` },
  },
  search: {
    products: { method: "get", url: () => `${base_url}/search/products` },
  },
  dashboard: {
    superAdmin: {
      method: "get",
      url: () => `${base_url}/dashboard/super-admin`,
    },
    branchAdmin: {
      method: "get",
      url: () => `${base_url}/dashboard/branch-admin`,
    },
    departmentAdmin: {
      method: "get",
      url: () => `${base_url}/dashboard/department-admin`,
    },
    shopAdmin: { method: "get", url: () => `${base_url}/dashboard/shop-admin` },
    staff: { method: "get", url: () => `${base_url}/dashboard/staff` },
  },
};

export { apiurls };
