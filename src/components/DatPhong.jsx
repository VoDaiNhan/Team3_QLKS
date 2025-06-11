import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, DatePicker, Space, Popconfirm, message, Select, InputNumber, Spin, Descriptions, List, Tag, Tooltip, Dropdown } from 'antd';
import { apiFetch, getToken } from '../auth';
import dayjs from 'dayjs';
import './DatPhong.css';
import { DownOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { Modal as AntdModal } from 'antd';

function DatPhong() {
  const [datPhongs, setDatPhongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDatPhong, setEditingDatPhong] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [chiTietDatPhong, setChiTietDatPhong] = useState(null);
  const [phongs, setPhongs] = useState([]);
  const [khachHangs, setKhachHangs] = useState([]);
  const [loadingPhong, setLoadingPhong] = useState(false);
  const [loadingKhachHang, setLoadingKhachHang] = useState(false);
  const [form] = Form.useForm();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedMaKh, setSelectedMaKh] = useState(null);
  const [bookingErrorModal, setBookingErrorModal] = useState({ visible: false, message: '' });

  // Lấy danh sách đặt phòng
  const fetchDatPhongs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('https://qlks-0dvh.onrender.com/api/DatPhong?pageNumber=1&pageSize=20');
      const data = await res.json();
      console.log('API Response (fetchDatPhongs):', JSON.stringify(data, null, 2));
      let list = [];
      if (data && data.data && Array.isArray(data.data.datPhongs)) {
        list = data.data.datPhongs;
      } else if (data && Array.isArray(data.datPhongs)) {
        list = data.datPhongs;
      } else if (data && Array.isArray(data.DatPhongs)) {
        list = data.DatPhongs;
      } else if (Array.isArray(data)) {
        list = data;
      }

      // Nếu API không trả về danhSachKhachHang, gọi API chi tiết cho từng đặt phòng
      const detailedList = await Promise.all(
        list.map(async (dp) => {
          if (!dp.danhSachKhachHang || dp.danhSachKhachHang.length === 0) {
            const detailRes = await apiFetch(`https://qlks-0dvh.onrender.com/api/DatPhong/${dp.maDatPhong}`);
            const detailData = await detailRes.json();
            return {
              ...dp,
              danhSachKhachHang: detailData.danhSachKhachHang || [], // Đảm bảo có danhSachKhachHang
            };
          }
          return dp;
        })
      );

      setDatPhongs(detailedList);
      if (detailedList.length === 0) message.warning('Không có dữ liệu đặt phòng!');
    } catch (e) {
      console.error('Error fetching datPhongs:', e);
      setDatPhongs([]);
      message.error('Không thể lấy dữ liệu đặt phòng!');
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách phòng
  const fetchPhongs = async () => {
    setLoadingPhong(true);
    try {
      const res = await apiFetch('https://qlks-0dvh.onrender.com/api/Phong?pageNumber=1&pageSize=100');
      const data = await res.json();
      console.log('API Response (fetchPhongs):', JSON.stringify(data, null, 2));
      let list = [];
      if (data && data.data && Array.isArray(data.data.phongs)) {
        list = data.data.phongs;
      } else if (data && Array.isArray(data.phongs)) {
        list = data.phongs;
      } else if (data && Array.isArray(data.Phongs)) {
        list = data.Phongs;
      } else if (Array.isArray(data)) {
        list = data;
      }
      setPhongs(list);
      if (list.length === 0) message.warning('Không có phòng nào trong hệ thống!');
    } catch (e) {
      console.error('Error fetching phongs:', e);
      setPhongs([]);
      message.error('Không thể lấy dữ liệu phòng!');
    } finally {
      setLoadingPhong(false);
    }
  };

  // Lấy danh sách khách hàng
  const fetchKhachHangs = async () => {
    setLoadingKhachHang(true);
    try {
      const res = await apiFetch('https://qlks-0dvh.onrender.com/api/KhachHang?pageNumber=1&pageSize=100');
      const data = await res.json();
      console.log('API Response (fetchKhachHangs):', JSON.stringify(data, null, 2));
      let list = [];
      if (data && data.data && Array.isArray(data.data.khachHangs)) {
        list = data.data.khachHangs;
      } else if (data && Array.isArray(data.khachHangs)) {
        list = data.khachHangs;
      } else if (data && Array.isArray(data.KhachHangs)) {
        list = data.KhachHangs;
      } else if (Array.isArray(data)) {
        list = data;
      }
      const filtered = list.filter(kh => !kh.trangThai || kh.trangThai.toLowerCase() !== 'vô hiệu hóa');
      setKhachHangs(filtered);
      if (filtered.length === 0) message.warning('Không có khách hàng nào trong hệ thống!');
    } catch (e) {
      console.error('Error fetching khachHangs:', e);
      setKhachHangs([]);
      message.error('Không thể lấy dữ liệu khách hàng!');
    } finally {
      setLoadingKhachHang(false);
    }
  };

  useEffect(() => {
    fetchDatPhongs();
    fetchPhongs();
    fetchKhachHangs();
  }, []);

  // Đồng bộ dữ liệu sau khi thực hiện thao tác
  const syncData = async () => {
    await Promise.all([fetchDatPhongs(), fetchPhongs(), fetchKhachHangs()]);
  };


  // Xử lý xóa đặt phòng
  const handleDelete = async (maDatPhong) => {
    try {
      const res = await apiFetch(`https://qlks-0dvh.onrender.com/api/DatPhong/${maDatPhong}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 403) {
          throw new Error('Bạn không có quyền xóa đặt phòng này. Vui lòng kiểm tra quyền truy cập.');
        }
        throw new Error(errorData.message || `Xóa đặt phòng ${maDatPhong} thất bại! Mã lỗi: ${res.status}`);
      }
      message.success(`Xóa đặt phòng ${maDatPhong} thành công!`);
      setDatPhongs(prev => prev.filter(item => item.maDatPhong !== maDatPhong));
      await syncData();
    } catch (e) {
      console.error('Error deleting datPhong:', e);
      message.error(`Lỗi: ${e.message}`);
    }
  };

  // Hiển thị modal thêm/sửa
  const showModal = async (record = null) => {
    if (record && record.maDatPhong) {
      setLoading(true);
      try {
        const res = await apiFetch(`https://qlks-0dvh.onrender.com/api/DatPhong/${record.maDatPhong}`);
        const data = await res.json();
        const detail = data.data || data;
        setEditingDatPhong(detail);
        setIsModalVisible(true);
        setTimeout(() => {
          // Tìm mã khách hàng của những khách hàng phụ (không phải khách đại diện)
          const additionalCustomers = detail.danhSachKhachHang
            ? detail.danhSachKhachHang
                .filter(kh => kh.hoTen !== detail.tenKhachHang)
                .map(kh => {
                  // Tìm maKh từ danh sách khachHangs dựa trên hoTen
                  const customer = khachHangs.find(k => k.hoTen === kh.hoTen);
                  return customer ? customer.maKh : null;
                })
                .filter(maKh => maKh !== null) // Loại bỏ những trường hợp không tìm thấy maKh
            : [];

          form.setFieldsValue({
            ...detail,
            ngayNhanPhong: detail.ngayNhanPhong ? dayjs(detail.ngayNhanPhong) : null,
            ngayTraPhong: detail.ngayTraPhong ? dayjs(detail.ngayTraPhong) : null,
            maKhList: additionalCustomers,
            soNguoiO: detail.soNguoiO || 1,
          });
        }, 0);
      } catch (e) {
        message.error('Không thể tải chi tiết đặt phòng!');
      } finally {
        setLoading(false);
      }
    } else {
      setEditingDatPhong(null);
      setIsModalVisible(true);
      setTimeout(() => {
        form.resetFields();
        form.setFieldsValue({ soNguoiO: 1 });
      }, 0);
    }
  };

  const showDetailModal = async (maDatPhong) => {
    setLoading(true);
    try {
      const res = await apiFetch(`https://qlks-0dvh.onrender.com/api/DatPhong/${maDatPhong}`);
      const data = await res.json();
      if (data.data) {
        setChiTietDatPhong(data.data);
        setIsDetailModalVisible(true);
      } else {
        message.error('Không thể tải chi tiết đặt phòng!');
      }
    } catch (error) {
      message.error('Lỗi khi tải chi tiết đặt phòng!');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thêm/sửa đặt phòng
  const handleOk = async (values) => {
    const isEdit = !!editingDatPhong;
    try {
      if (!values.maPhong) throw new Error('Vui lòng chọn phòng!');
      if (!values.maKh) throw new Error('Vui lòng chọn khách hàng đại diện!');
      if (!values.ngayNhanPhong || !values.ngayTraPhong) throw new Error('Vui lòng chọn đầy đủ ngày nhận và ngày trả phòng!');
      if (dayjs(values.ngayNhanPhong).isAfter(dayjs(values.ngayTraPhong), 'minute')) {
        throw new Error('Ngày nhận phòng phải trước hoặc bằng ngày trả phòng!');
      }
      if (!values.soNguoiO || values.soNguoiO < 1) throw new Error('Số người ở phải lớn hơn 0!');

      let maKhList = values.maKhList || [];
      if (!maKhList.includes(values.maKh)) {
        maKhList = [values.maKh, ...maKhList];
      }

      if (maKhList.length > values.soNguoiO) {
        message.warning(`Số lượng khách hàng (${maKhList.length}) vượt quá số người ở (${values.soNguoiO}). Vui lòng điều chỉnh!`);
        return;
      }

      const updatedValues = {
        ...values,
        maKhList: maKhList,
      };

      let newMaDatPhong = null;
      if (isEdit) {
        // Lấy maNv từ token
        let maNvFromToken = null;
        try {
          const tokens = await getToken();
          if (tokens && tokens.token) {
            const decoded = jwtDecode(tokens.token);
            maNvFromToken = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
              ? Number(decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'])
              : (decoded.MaNv ? Number(decoded.MaNv) : null);
          }
        } catch (e) {
          maNvFromToken = null;
        }
        // Tạo payload đúng mẫu yêu cầu
        const payload = {
          maNv: maNvFromToken,
          maKh: updatedValues.maKh ? Number(updatedValues.maKh) : 0,
          maPhong: updatedValues.maPhong ? String(updatedValues.maPhong) : '',
          ngayDat: editingDatPhong.ngayDat
            ? dayjs(editingDatPhong.ngayDat).format('YYYY-MM-DD')
            : dayjs().format('YYYY-MM-DD'),
          ngayNhanPhong: dayjs(updatedValues.ngayNhanPhong).format('YYYY-MM-DDTHH:mm:ss') + '.000Z',
          ngayTraPhong: dayjs(updatedValues.ngayTraPhong).format('YYYY-MM-DDTHH:mm:ss') + '.000Z',
          soNguoiO: updatedValues.soNguoiO ? Number(updatedValues.soNguoiO) : 0,
          trangThai: editingDatPhong.trangThai || 'Đã đặt',
          maKhList: updatedValues.maKhList.map(Number)
        };

        const res = await apiFetch(`https://qlks-0dvh.onrender.com/api/DatPhong/${editingDatPhong.maDatPhong}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setBookingErrorModal({
            visible: true,
            message: (err && typeof err.message === 'string' && err.message.trim())
              ? err.message
              : 'Không thể cập nhật đặt phòng. Vui lòng kiểm tra lại thông tin!'
          });
          return;
        }
        message.success('Cập nhật thành công!');
      } else {
        // Lấy maNv từ token cho thêm mới (nếu cần)
        let maNvFromToken = null;
        try {
          const tokens = await getToken();
          if (tokens && tokens.token) {
            const decoded = jwtDecode(tokens.token);
            maNvFromToken = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
              ? Number(decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'])
              : (decoded.MaNv ? Number(decoded.MaNv) : null);
          }
        } catch (e) {
          maNvFromToken = null;
        }
        const payload = {
          datPhong: {
            MaNv: maNvFromToken,
            MaKh: updatedValues.maKh ? Number(updatedValues.maKh) : null,
            MaPhong: updatedValues.maPhong ? String(updatedValues.maPhong) : null,
            NgayDat: dayjs().format('YYYY-MM-DD'),
            NgayNhanPhong: dayjs(updatedValues.ngayNhanPhong).format('YYYY-MM-DDTHH:mm:ss') + '.000Z',
            NgayTraPhong: dayjs(updatedValues.ngayTraPhong).format('YYYY-MM-DDTHH:mm:ss') + '.000Z',
            SoNguoiO: updatedValues.soNguoiO ? Number(updatedValues.soNguoiO) : 1,
            TrangThai: updatedValues.trangThai || 'Đã đặt'
          },
          maKhList: maKhList.map(Number),
          DatPhongVMs: [{
            MaKh: updatedValues.maKh ? Number(updatedValues.maKh) : null,
            MaPhong: updatedValues.maPhong ? String(updatedValues.maPhong) : null,
            NgayNhanPhong: dayjs(updatedValues.ngayNhanPhong).format('YYYY-MM-DDTHH:mm:ss') + '.000Z',
            NgayTraPhong: dayjs(updatedValues.ngayTraPhong).format('YYYY-MM-DDTHH:mm:ss') + '.000Z',
            SoNguoiO: updatedValues.soNguoiO ? Number(updatedValues.soNguoiO) : 1,
            TrangThai: updatedValues.trangThai || 'Đã đặt'
          }]
        };

        console.log('Payload gửi đi:', JSON.stringify(payload, null, 2));

        const res = await apiFetch('https://qlks-0dvh.onrender.com/api/DatPhong', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          setBookingErrorModal({
            visible: true,
            message: (errorData && typeof errorData.message === 'string' && errorData.message.trim())
              ? errorData.message
              : 'Không thể thêm đặt phòng. Vui lòng kiểm tra lại thông tin!'
          });
          return;
        }

        const responseData = await res.json();
        newMaDatPhong = responseData.maDatPhong;
        message.success('Thêm mới thành công!');
      }

      setIsModalVisible(false);
      setEditingDatPhong(null);
      form.resetFields();

      // Sau khi thêm mới, lấy thông tin chi tiết của đặt phòng vừa tạo
      if (newMaDatPhong) {
        const detailRes = await apiFetch(`https://qlks-0dvh.onrender.com/api/DatPhong/${newMaDatPhong}`);
        const newDatPhong = await detailRes.json();
        setDatPhongs(prev => [newDatPhong, ...prev.filter(dp => dp.maDatPhong !== newMaDatPhong)]);
      }

      await syncData();
    } catch (e) {
      const isEdit = !!editingDatPhong;
      setBookingErrorModal({
        visible: true,
        message: (e && typeof e.message === 'string' && e.message.trim() && !e.message.startsWith('HTTP error!'))
          ? e.message
          : (isEdit
              ? 'Không thể cập nhật đặt phòng. Vui lòng kiểm tra lại thông tin!'
              : 'Không thể thêm đặt phòng. Vui lòng kiểm tra lại thông tin!')
      });
    }
  };

  const handleStatusUpdate = async (maDatPhong, newStatus) => {
    try {
      const response = await apiFetch(`https://qlks-0dvh.onrender.com/api/DatPhong/bookings/${maDatPhong}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStatus)
      });

      if (!response.ok) {
        throw new Error('Cập nhật trạng thái thất bại');
      }

      message.success('Cập nhật trạng thái thành công');
      fetchDatPhongs(); // Refresh data
    } catch (error) {
      message.error('Lỗi khi cập nhật trạng thái: ' + error.message);
    }
  };

  const columns = [
    { title: 'Mã đặt phòng', dataIndex: 'maDatPhong', key: 'maDatPhong' },
    {
      title: 'Khách hàng',
      key: 'khachHang',
      render: (_, record) => {
        // Kiểm tra nếu danhSachKhachHang tồn tại và là mảng
        if (record.danhSachKhachHang && Array.isArray(record.danhSachKhachHang) && record.danhSachKhachHang.length > 0) {
          return record.danhSachKhachHang.map(kh => kh.hoTen || 'Không có tên').join(', ');
        }
        // Nếu không có danhSachKhachHang, hiển thị khách hàng đại diện (MaKh)
        if (record.maKh) {
          const khachHang = khachHangs.find(kh => kh.maKh === record.maKh);
          return khachHang ? khachHang.hoTen : 'Không xác định';
        }
        return 'Không có khách hàng';
      },
    },
    { title: 'Phòng', dataIndex: 'maPhong', key: 'maPhong' },
    {
      title: 'Ngày nhận',
      dataIndex: 'ngayNhanPhong',
      key: 'ngayNhanPhong',
      render: (value) => value ? dayjs(value).format('DD/MM/YYYY HH:mm') : ''
    },
    {
      title: 'Ngày trả',
      dataIndex: 'ngayTraPhong',
      key: 'ngayTraPhong',
      render: (value) => value ? dayjs(value).format('DD/MM/YYYY HH:mm') : ''
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (text, record) => {
        const items = [
          'Đang sử dụng',
          'Hủy',
          'Hoàn thành',
          'Đã đặt'
        ]
        .filter(status => status !== text)
        .map(status => ({
          key: status,
          label: status,
          onClick: () => handleStatusUpdate(record.maDatPhong, status)
        }));

        return (
          <Dropdown
            menu={{ items }}
            trigger={['click']}
          >
            <Tag 
              color={
                text === 'Đã đặt' ? 'blue' : 
                text === 'Đang sử dụng' ? 'green' :
                text === 'Hoàn thành' ? 'purple' :
                text === 'Hủy' ? 'red' : 'default'
              }
              style={{ cursor: 'pointer' }}
            >
              {text} <DownOutlined style={{ fontSize: '12px' }} />
            </Tag>
          </Dropdown>
        );
      },
    },
    { title: 'Phụ thu', dataIndex: 'phuThu', key: 'phuThu', render: (value) => (value != null ? value : 0) },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button onClick={() => showDetailModal(record.maDatPhong)}>Xem chi tiết</Button>
          <Button type="primary" onClick={() => showModal(record)}>Sửa</Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa?"
            onConfirm={() => handleDelete(record.maDatPhong)}
            okText="Có"
            cancelText="Không"
          >
            <Button danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Quản lý đặt phòng</h2>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => showModal(null)}>
          Thêm đặt phòng
        </Button>
        <Button onClick={fetchDatPhongs}>Làm mới</Button>
      </Space>
      <Table columns={columns} dataSource={datPhongs} rowKey="maDatPhong" loading={loading} />
      <Modal
        title={editingDatPhong ? 'Sửa đặt phòng' : 'Thêm đặt phòng'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnHidden
        width={900}
      >
        <Spin spinning={loadingPhong || loadingKhachHang}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleOk}
            onFinishFailed={({ errorFields }) => {
              if (errorFields && errorFields.length > 0) {
                message.error(errorFields[0].errors[0] || 'Vui lòng điền đầy đủ thông tin!');
              }
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
            <Form.Item label="Mã phòng" name="maPhong" rules={[{ required: true, message: 'Chọn phòng!' }]}>
              <Select
                placeholder={phongs.length === 0 ? 'Không có phòng' : 'Chọn phòng'}
                loading={loadingPhong}
                showSearch
                optionFilterProp="children"
                allowClear
              >
                {phongs.map((phong) => (
                  <Select.Option key={phong.maPhong} value={phong.maPhong}>
                    {phong.tenPhong} ({phong.maPhong})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Khách hàng đại diện"
              name="maKh"
              rules={[{ required: true, message: 'Chọn khách hàng!' }]}
            >
              <Select
                placeholder="Chọn khách hàng"
                loading={loadingKhachHang}
                showSearch
                optionFilterProp="children"
                allowClear
                onChange={value => setSelectedMaKh(value)}
              >
                {khachHangs.map((kh) => (
                  <Select.Option key={kh.maKh} value={kh.maKh}>
                    {kh.hoTen}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Ngày nhận phòng"
              name="ngayNhanPhong"
              rules={[{ required: true, message: 'Chọn ngày nhận!' }]}
            >
              <DatePicker style={{ width: '100%' }} showTime format="YYYY-MM-DD HH:mm" />
            </Form.Item>
              </div>

              <div>
            <Form.Item
              label="Số người ở"
              name="soNguoiO"
              rules={[{ required: true, type: 'number', min: 1, message: 'Nhập số người ở (>=1)!' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} onChange={() => form.validateFields(['maKhList'])} />
            </Form.Item>

            <Form.Item
              label="Khách hàng (nhiều)"
              name="maKhList"
              extra="Chọn thêm khách hàng nếu có. Khách hàng đại diện sẽ tự động được thêm vào danh sách."
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const soNguoiO = getFieldValue('soNguoiO') || 1;
                    const maKh = getFieldValue('maKh');
                    const totalKhachHang = (value || []).length + (maKh ? 1 : 0);
                    if (totalKhachHang > soNguoiO) {
                      return Promise.reject(new Error(`Số lượng khách hàng không được vượt quá ${soNguoiO} người!`));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Select
                mode="multiple"
                placeholder="Chọn thêm khách hàng (nếu có)"
                loading={loadingKhachHang}
                optionFilterProp="children"
                showSearch
                allowClear
                disabled={form.getFieldValue('soNguoiO') <= 1}
              >
                {khachHangs
                  .filter((kh) => kh.maKh !== (selectedMaKh ?? form.getFieldValue('maKh')))
                  .map((kh) => (
                    <Select.Option key={kh.maKh} value={kh.maKh}>
                      {kh.hoTen}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>

                <Form.Item
                  label="Ngày trả phòng"
                  name="ngayTraPhong"
                  rules={[{ required: true, message: 'Chọn ngày trả!' }]}
                >
                  <DatePicker style={{ width: '100%' }} showTime format="YYYY-MM-DD HH:mm" />
            </Form.Item>
              </div>
            </div>

            <Form.Item style={{ marginTop: '20px', textAlign: 'right' }}>
              <Space>
                <Button onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit">
                {editingDatPhong ? 'Lưu' : 'Thêm đặt phòng'}
              </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
      <Modal
        title="Chi tiết Đặt phòng"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={800}
        bodyStyle={{ 
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px',
          '&::-webkit-scrollbar': {
            width: '0px'
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {chiTietDatPhong && (
          <div>
            <Descriptions 
              bordered 
              column={1}
              labelStyle={{ width: '200px', fontWeight: '500' }}
              contentStyle={{ background: '#fff' }}
            >
              <Descriptions.Item label="Tiền phòng">
                {((chiTietDatPhong.tongTienPhong || 0) - (chiTietDatPhong.phuThu || 0))?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) || '0 VND'}
              </Descriptions.Item>
              <Descriptions.Item label="Phụ thu">
                {chiTietDatPhong.phuThu?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) || '0 VND'}
              </Descriptions.Item>
            </Descriptions>
            
            {chiTietDatPhong.danhSachKhachHang && chiTietDatPhong.danhSachKhachHang.length > 0 && (
              <>
            <h4 style={{marginTop: 20, marginBottom: 16}}>Danh sách khách ở</h4>
            <List
              bordered
              dataSource={[
                { hoTen: chiTietDatPhong.tenKhachHang, isRepresentative: true },
                ...(chiTietDatPhong.danhSachKhachHang || []).filter(kh => kh.hoTen !== chiTietDatPhong.tenKhachHang)
              ]}
              renderItem={item => (
                <List.Item>
                      {item.hoTen} {item.isRepresentative && <Tag color="blue">Đại diện</Tag>}
                </List.Item>
              )}
            />
              </>
            )}

            {chiTietDatPhong.danhSachDichVu && chiTietDatPhong.danhSachDichVu.length > 0 && (
              <>
                <h4 style={{marginTop: 20, marginBottom: 16}}>Dịch vụ đã sử dụng ({chiTietDatPhong.soLuongDichVuSuDung} dịch vụ)</h4>
                <Table
                  bordered
                  size="small"
                  pagination={false}
                  dataSource={chiTietDatPhong.danhSachDichVu}
                  columns={[
                    {
                      title: 'Tên dịch vụ',
                      dataIndex: 'tenDichVu',
                      key: 'tenDichVu'
                    },
                    {
                      title: 'Số lượng',
                      dataIndex: 'soLuong',
                      key: 'soLuong'
                    },
                    {
                      title: 'Thành tiền',
                      dataIndex: 'thanhTien',
                      key: 'thanhTien',
                      render: (value) => value?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) || '0 VND'
                    }
                  ]}
                />
              </>
            )}

            <div style={{ 
              marginTop: 20, 
              padding: '16px', 
              border: '1px solid #f0f0f0', 
              borderRadius: '8px', 
              backgroundColor: '#fafafa' 
            }}>
              <div style={{ fontSize: 15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Tiền phòng:</span>
                  <span>{((chiTietDatPhong.tongTienPhong || 0) - (chiTietDatPhong.phuThu || 0))?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) || '0 VND'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Phụ thu:</span>
                  <span>{chiTietDatPhong.phuThu?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) || '0 VND'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Tổng tiền dịch vụ:</span>
                  <span>
                    {(chiTietDatPhong.danhSachDichVu?.reduce((sum, item) => sum + (item.thanhTien || 0), 0) || 0)
                      .toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginTop: 12, 
                  paddingTop: 12, 
                  borderTop: '1px solid #d9d9d9', 
                  fontWeight: 'bold', 
                  fontSize: 16 
                }}>
                  <span>Tổng cộng:</span>
                  <span>{(
                    (chiTietDatPhong.tongTienPhong || 0) + 
                    (chiTietDatPhong.danhSachDichVu?.reduce((sum, item) => sum + (item.thanhTien || 0), 0) || 0)
                  ).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <AntdModal
        open={bookingErrorModal.visible}
        onCancel={() => setBookingErrorModal({ ...bookingErrorModal, visible: false })}
        footer={[
          <Button key="ok" type="primary" onClick={() => setBookingErrorModal({ ...bookingErrorModal, visible: false })}>
            OK
          </Button>
        ]}
        centered
        zIndex={2000}
      >
        <div style={{textAlign: 'center', fontWeight: 'bold', fontSize: 16, color: '#e53e3e'}}>
          {bookingErrorModal.message}
        </div>
      </AntdModal>
    </div>
  );
}

export default DatPhong;
