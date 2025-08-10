/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

// Base URL for API requests. Reads the base API URL from environment
// variable `VITE_API_URL` (set by Vite) and falls back to localhost if
// undefined. Appends `/api` automatically.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_BASE: string = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  // Login user
  login: async (name: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { name, password });
      return response.data;
    } catch (error) {
      if (error.response) {
      throw error.response.data || { message: 'Login failed' };
    } else {
      throw { message: 'Network error' };
    }
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Server error' };
    }
  },

  // Register employee (manager only)
  registerEmployee: async (name: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { name, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Server error' };
    }
  },

  // Get all employees (manager only)

  getEmployees: async (params: { status?: "active" | "archived" } = {}) => {
    const response = await api.get("/auth/employees", { params });
    return response.data;
  },

  unarchiveEmployee: async (id: string) => {
    const res = await api.patch(`/auth/employees/${id}/unarchive`);
    return res.data;
  },

getEmployeeById: async (id: string) => {
  try {
    const response = await api.get(`/auth/employees/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Server error' };
  }
},

deleteEmployee: async (id: string, mode: "hard" | "archive" = "archive") => {
  const res = await api.delete(`/auth/employees/${id}`, { params: { mode } });
  return res.data;
},

};

// Accomplishments API calls
export const accomplishmentsAPI = {
  // Create new accomplishment
  createAccomplishment: async (formData: FormData) => {
    try {
      const response = await api.post('/accomplishments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Server error' };
    }
  },

  // Get all accomplishments (filtered for employee/manager)
  getAccomplishments: async (filters = {}) => {
    try {
      const response = await api.get('/accomplishments', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Server error' };
    }
  },

  // Get single accomplishment
  getAccomplishment: async (id: string) => {
    try {
      const response = await api.get(`/accomplishments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Server error' };
    }
  },

  // Add comment to accomplishment (manager only)
  addComment: async (id: string, text: string, versionIndex) => {
    try {
      const response = await api.post(`/accomplishments/${id}/comments`, { text, versionIndex });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Server error' };
    }
  },

    // Employee reply to manager comment
replyToComment: async (id: string, commentId: string, text: string) => {
  try {
    const response = await api.post(`/accomplishments/${id}/comments/${commentId}/reply`, { text });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Server error' };
  }
},
  // Mark accomplishment as reviewed (manager only)
reviewAccomplishment: async (id: string, status: string) => {
  try {
    const response = await api.put(`/accomplishments/${id}/review`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Server error' };
  }
},


  // Export accomplishments to Excel (manager only)
  exportAccomplishments: async (filters = {}) => {
    try {
      const response = await api.get('/accomplishments/export', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Server error' };
    }
  },

  modifyAccomplishment: async (id: string, formData: FormData) => {
  try {
    const response = await api.put(`/accomplishments/${id}/modify`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Server error" };
  }
},

startAccomplishment: async (id: string, formData: FormData) => {
  const response = await api.put(`/accomplishments/${id}/start`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
},


};

// Task Titles API calls
export const taskTitlesAPI = {
  // جلب جميع العناوين (يستخدمه الموظف والمدير)
  getAll: async () => {
    try {
      const res = await api.get('/task-titles');
      return res.data.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Server error' };
    }
  },
  // إضافة عنوان جديد (للمدير فقط)
  add: async (name: string) => {
    try {
      const res = await api.post('/task-titles', { name });
      return res.data.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Server error' };
    }
  },
  // تعديل عنوان
  edit: async (id: string, name: string) => {
    try {
      const res = await api.put(`/task-titles/${id}`, { name });
      return res.data.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Server error' };
    }
  },
  // حذف عنوان
  remove: async (id: string) => {
    try {
      await api.delete(`/task-titles/${id}`);
      return true;
    } catch (error: any) {
      throw error.response?.data || { message: 'Server error' };
    }
  }
};

export const comparisonsAPI = {
  create: (payload: {
    name?: string;
    employeeIds: string[];
    notes?: string;
    range?: "all"|"week"|"month"|"year"|"custom";
    startDate?: string;
    endDate?: string;
  }) => api.post('/comparisons', payload).then(r => r.data),

  list: () => api.get('/comparisons').then(r => r.data),

  get: (id: string) => api.get(`/comparisons/${id}`).then(r => r.data),

  update: (id: string, payload: Partial<{
    name: string; notes: string; range: string; startDate: string; endDate: string; employeeIds: string[];
  }>) => api.put(`/comparisons/${id}`, payload).then(r => r.data),

  remove: (id: string) => api.delete(`/comparisons/${id}`).then(r => r.data),
};

// Notifications API calls
export const notificationsAPI = {
  // page يبدأ من 1
  get: async (page = 1, limit = 20) => {
    const res = await api.get("/notifications", { params: { page, limit } });
    // شكل الاستجابة من السيرفر: { success, data, totalCount, totalPages, currentPage }
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.post("/notifications/mark-all-read");
    return res.data;
  },
  markRead: async (id: string) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },
};

export default api;