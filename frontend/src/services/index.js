import api from "./api";

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  },

  register: async (userData) => {
    const { data } = await api.post("/auth/register", userData);
    return data;
  },

  getMe: async () => {
    const { data } = await api.get("/auth/me");
    return data;
  },

  changePassword: async (oldPassword, newPassword) => {
    const { data } = await api.post("/auth/change-password", {
      oldPassword,
      newPassword,
    });
    return data;
  },
};

export const dashboardService = {
  getStats: async (tahun) => {
    const { data } = await api.get("/dashboard/stats", { params: { tahun } });
    return data;
  },

  getChartData: async (tahun) => {
    const { data } = await api.get("/dashboard/chart", { params: { tahun } });
    return data;
  },

  getRecentUpdates: async (limit = 10) => {
    const { data } = await api.get("/dashboard/recent", { params: { limit } });
    return data;
  },
};

export const paketService = {
  getAll: async (params) => {
    const { data } = await api.get("/paket", { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/paket/${id}`);
    return data;
  },

  create: async (paketData) => {
    const { data } = await api.post("/paket", paketData);
    return data;
  },

  update: async (id, paketData) => {
    const { data } = await api.put(`/paket/${id}`, paketData);
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/paket/${id}`);
    return data;
  },

  updateProgress: async (id, progressData) => {
    const { data } = await api.post(`/paket/${id}/progress`, progressData);
    return data;
  },

  updateStatus: async (id, status) => {
    const { data } = await api.patch(`/paket/${id}/status`, { status });
    return data;
  },

  exportExcel: async (params) => {
    const response = await api.get("/paket/export", {
      params,
      responseType: "blob",
    });
    return response;
  },

  downloadTemplate: async () => {
    const response = await api.get("/paket/export", {
      params: { template: "true" },
      responseType: "blob",
    });
    return response;
  },

  importExcel: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/paket/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  uploadDocuments: async (id, formData) => {
    const { data } = await api.post(`/paket/${id}/documents`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  deleteDocument: async (id, documentId) => {
    const { data } = await api.delete(`/paket/${id}/documents/${documentId}`);
    return data;
  },
};

export const opdService = {
  getAll: async (params) => {
    const { data } = await api.get("/opd", { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/opd/${id}`);
    return data;
  },

  create: async (opdData) => {
    const { data } = await api.post("/opd", opdData);
    return data;
  },

  update: async (id, opdData) => {
    const { data } = await api.put(`/opd/${id}`, opdData);
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/opd/${id}`);
    return data;
  },

  toggleStatus: async (id) => {
    const { data } = await api.patch(`/opd/${id}/toggle-status`);
    return data;
  },
};

export const userService = {
  getAll: async (params) => {
    const { data } = await api.get("/users", { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  create: async (userData) => {
    const { data } = await api.post("/users", userData);
    return data;
  },

  update: async (id, userData) => {
    const { data } = await api.put(`/users/${id}`, userData);
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },

  toggleStatus: async (id) => {
    const { data } = await api.patch(`/users/${id}/toggle-status`);
    return data;
  },
};
