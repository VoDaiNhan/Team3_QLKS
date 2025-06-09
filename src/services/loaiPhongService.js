import axios from 'axios';
import { getToken } from '../auth'; // Import getToken

const API_URL = 'https://qlks-0dvh.onrender.com/api/LoaiPhong';

// Only add the interceptor once
if (!window._loaiPhongInterceptorAdded) {
  axios.interceptors.request.use(
    async (config) => { // Make the interceptor async
      const tokens = await getToken(); // Get tokens from IndexedDB
      if (tokens && tokens.token) {
        config.headers.Authorization = `Bearer ${tokens.token}`;
        // Debug log for Authorization header
        console.log('Authorization header set from loaiPhongService:', config.headers.Authorization);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  window._loaiPhongInterceptorAdded = true;
}

export const loaiPhongService = {
  getAll: async (page = 1, pageSize = 10) => {
    const response = await axios.get(`${API_URL}?pageNumber=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  getById: async (maLoaiPhong) => {
    const response = await axios.get(`${API_URL}/${maLoaiPhong}`);
    return response.data;
  },

  create: async (loaiPhongData) => {
    const response = await axios.post(`${API_URL}`, loaiPhongData);
    return response.data;
  },

  update: async (maLoaiPhong, loaiPhongData) => {
    const response = await axios.put(`${API_URL}/${maLoaiPhong}`, loaiPhongData);
    return response.data;
  },

  delete: async (maLoaiPhong) => {
    const response = await axios.delete(`${API_URL}/${maLoaiPhong}`);
    return response.data;
  },
}; 