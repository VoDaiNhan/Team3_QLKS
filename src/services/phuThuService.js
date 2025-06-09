import { apiFetch } from '../auth';

const API_URL = 'https://qlks-0dvh.onrender.com/api/PhuThu';

export const phuThuService = {
  getAll: async (pageNumber = 1, pageSize = 10) => {
    try {
      console.log('Calling getAll with params:', { pageNumber, pageSize }); // Debug log
      const response = await apiFetch(`${API_URL}?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
        method: 'GET'
      });
      return response.json();
    } catch (error) {
      console.error('Get All Error:', error);
      throw error;
    }
  },

  getByLoaiPhong: async (maLoaiPhong) => {
    try {
      const response = await apiFetch(`${API_URL}/loaiphong/${maLoaiPhong}`, {
        method: 'GET'
      });
      return response.json();
    } catch (error) {
      console.error('Get By Loai Phong Error:', error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const requestData = {
        maPhuThu: 0,
        maLoaiPhong: data.maLoaiPhong ? Number(data.maLoaiPhong) : 0,
        giaPhuThuTheoNgay: data.giaPhuThuTheoNgay ? Number(data.giaPhuThuTheoNgay) : 0,
        giaPhuThuTheoGio: data.giaPhuThuTheoGio ? Number(data.giaPhuThuTheoGio) : 0,
        tenLoaiPhong: data.tenLoaiPhong || "string"
      };
      const response = await apiFetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      return response.json();
    } catch (error) {
      console.error('Create Error:', error);
      throw error;
    }
  },

  update: async (maPhuThu, data) => {
    try {
      const requestData = {
        maPhuThu: Number(maPhuThu),
        maLoaiPhong: data.maLoaiPhong ? Number(data.maLoaiPhong) : 0,
        giaPhuThuTheoNgay: data.giaPhuThuTheoNgay ? Number(data.giaPhuThuTheoNgay) : 0,
        giaPhuThuTheoGio: data.giaPhuThuTheoGio ? Number(data.giaPhuThuTheoGio) : 0,
        tenLoaiPhong: data.tenLoaiPhong || "string"
      };
      const response = await apiFetch(`${API_URL}/${maPhuThu}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      return response.json();
    } catch (error) {
      console.error('Update Error:', error);
      throw error;
    }
  },

  delete: async (maPhuThu) => {
    try {
      const response = await apiFetch(`${API_URL}/${maPhuThu}`, {
        method: 'DELETE'
      });
      return response.json();
    } catch (error) {
      console.error('Delete Error:', error);
      throw error;
    }
  },
}; 