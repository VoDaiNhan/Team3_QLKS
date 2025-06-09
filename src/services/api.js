import { apiFetch } from '../auth';

export async function getPhongs() {
  const res = await apiFetch('https://qlks-0dvh.onrender.com/api/Phong');
  return res.json();
}

export async function getLoaiPhongs() {
  const res = await apiFetch('https://qlks-0dvh.onrender.com/api/LoaiPhong');
  return res.json();
}

export async function getDichVus() {
  const res = await apiFetch('https://qlks-0dvh.onrender.com/api/DichVu');
  return res.json();
}

export async function getKhachHangs() {
  const res = await fetch('https://qlks-0dvh.onrender.com/api/KhachHang');
  return res.json();
}

export async function getAccounts() {
  const res = await fetch('https://qlks-0dvh.onrender.com/api/Account');
  return res.json();
}

export async function getDatPhongs() {
  const res = await apiFetch('https://qlks-0dvh.onrender.com/api/DatPhong');
  return res.json();
}

export async function getHoaDons() {
  const res = await apiFetch('https://qlks-0dvh.onrender.com/api/HoaDon');
  return res.json();
}