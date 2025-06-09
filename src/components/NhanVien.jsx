import React, { useEffect, useState } from 'react';
import './NhanVien.css';

const NhanVien = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('https://qlks-0dvh.onrender.com/api/Account/get-all', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(res => {
        // Nếu response là object có property 'result' thì lấy result, nếu không lấy luôn mảng
        if (Array.isArray(res)) setData(res);
        else if (res.result) setData(res.result);
        else setData([]);
      })
      .catch(console.error);
  }, []);
  return (
    <div>
      <h2>Danh sách Nhân viên</h2>
      <table className="table-nhanvien">
        <thead>
          <tr>
            <th>Họ tên</th>
            <th>Vai trò</th>
            <th>SĐT</th>
            <th>Email</th>
            <th>Giới tính</th>
            <th>Địa chỉ</th>
            <th>Ngày sinh</th>
          </tr>
        </thead>
        <tbody>
          {data.map((nv, idx) => (
            <tr key={idx}>
              <td>{nv.HoTen}</td>
              <td>{nv.MaVaiTro}</td>
              <td>{nv.SoDienThoai}</td>
              <td>{nv.Email}</td>
              <td>{nv.GioiTinh}</td>
              <td>{nv.DiaChi}</td>
              <td>{nv.NgaySinh ? new Date(nv.NgaySinh).toLocaleDateString() : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NhanVien;
