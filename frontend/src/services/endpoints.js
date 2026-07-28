import api from "./api";

export const adminApi = {
  login: (d) => api.post("/auth/admin/login", d),
  pending: () => api.get("/admin/merchants/pending"),
  merchants: () => api.get("/admin/merchants"),
  approve: (id) => api.patch(`/admin/merchants/${id}/approve`),
  reject: (id) => api.patch(`/admin/merchants/${id}/reject`),
  stats: () => api.get("/admin/stats"),
  revenue: () => api.get("/admin/revenue"),
  topup: (id, d) => api.post(`/admin/merchants/${id}/topup`, d),
};

export const customerApi = {
  register: (d) => api.post("/auth/customer/register", d),
  login: (d) => api.post("/auth/customer/login", d),
  profile: () => api.get("/points/profile"),
  updateProfile: (d) => api.patch("/points/profile", d),
  transactions: () => api.get("/points/transactions"),
  balanceByEmail: (email) => api.get(`/points/balance/${encodeURIComponent(email)}`),
};

export const merchantApi = {
  register: (d) => api.post("/auth/merchant/register", d, { headers: { "Content-Type": "multipart/form-data" } }),
  login: (d) => api.post("/auth/merchant/login", d),
  status: () => api.get("/merchant/status"),
  award: (d) => api.post("/merchant/award", d),
  customers: () => api.get("/merchant/customers"),
  topup: (d) => api.post("/merchant/topup", d),
  createCheckoutSession: (d) => api.post("/merchant/create-checkout-session", d),
  checkoutSuccess: (d) => api.post("/merchant/checkout-success", d),
  refreshToken: () => api.post("/merchant/refresh-token"),
  transactions: () => api.get("/transactions"),
};

export const transactionsApi = {
  list: (params) => api.get("/transactions", { params }),
  all: (params) => api.get("/transactions/all", { params }),
};

export const points = {
  balanceByEmail: (email) => api.get(`/points/balance/${encodeURIComponent(email)}`),
  me: () => api.get("/points/me"),
  redeem: (d) => api.post("/points/redeem", d),
};

export const merchantProductsApi = {
  list: () => api.get("/merchant/products"),
  create: (d) => api.post("/merchant/products", d),
  update: (id, d) => api.put(`/merchant/products/${id}`, d),
  delete: (id) => api.delete(`/merchant/products/${id}`),
};

export const publicMerchantApi = {
  list: () => api.get("/merchants/public"),
  products: (merchantId) => api.get(`/merchants/public/${merchantId}/products`),
};
