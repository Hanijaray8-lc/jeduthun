import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://jeduthun.onrender.com/api',
  timeout: 30000,
});

export const productAPI = {
  getAll: (search = '') => API.get(`/products${search ? `?search=${search}` : ''}`),
  create: (data) => API.post('/products', data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
};

export const invoiceAPI = {
  getAll: (params = {}) => API.get('/invoices', { params }),
  getOne: (id) => API.get(`/invoices/${id}`),
  getNextNumber: () => API.get('/invoices/meta/next-number'),
  create: (data) => API.post('/invoices', data),
  update: (id, data) => API.put(`/invoices/${id}`, data),
  delete: (id) => API.delete(`/invoices/${id}`),
};

export const shopAPI = {
  get: () => API.get('/shop'),
  update: (data) => API.put('/shop', data),
};

export const pdfAPI = {
  // Returns HTML string for print-window approach
  generate: (invoiceId, type) => API.post('/pdf/generate', { invoiceId, type }),

  generateFromData: (invoiceData, type) =>
    API.post('/pdf/html', { invoiceData, type }),

  // Returns actual PDF blob — use for download & WhatsApp share
 downloadPDF: (invoiceId, type) =>
  API.post('/pdf/download', { invoiceId, type }),

  downloadPDFFromData: (invoiceData, type) =>
    API.post(
      '/pdf/download-from-data',
      { invoiceData, type },
      { responseType: 'blob', timeout: 60000 }
    ),

  // ✅ ADD THIS
  getShareLink: (invoiceId, type) =>
    API.post('/pdf/create-share-link', { invoiceId, type }),
};
export default API;