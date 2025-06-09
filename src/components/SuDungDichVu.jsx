import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Popconfirm,
  message,
  DatePicker,
  Select,
  Typography,
  Card,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { apiFetch } from '../auth';
import dayjs from 'dayjs';
import './SuDungDichVu.css';

const { Title } = Typography;
const { Option } = Select;

const API_BASE_URL = 'https://qlks-0dvh.onrender.com/api';

function SuDungDichVu() {
  const [suDungDichVus, setSuDungDichVus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [datPhongs, setDatPhongs] = useState([]);
  const [dichVus, setDichVus] = useState([]);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Fetch service usage records
  const fetchSuDungDichVus = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/SuDungDichVu?pageNumber=${page}&pageSize=${pageSize}`);
      const data = await response.json();
      
      // Handle different response structures
      let suDungDichVuList = [];
      if (Array.isArray(data)) {
        suDungDichVuList = data;
      } else if (data.data?.suDungDichVus) {
        suDungDichVuList = data.data.suDungDichVus;
      } else if (data.suDungDichVus) {
        suDungDichVuList = data.suDungDichVus;
      } else if (data.data) {
        suDungDichVuList = Array.isArray(data.data) ? data.data : [];
      }

      // Ensure each record has a unique key
      const processedList = suDungDichVuList.map(item => ({
        ...item,
        key: item.maSuDung // Add key property for Table
      }));

      setSuDungDichVus(processedList);
      setPagination({
        ...pagination,
        current: page,
        total: data.totalItems || processedList.length,
      });

      if (processedList.length === 0) {
        message.info('Không có dữ liệu sử dụng dịch vụ.');
      }
    } catch (error) {
      console.error('Error fetching service usage records:', error);
      message.error('Không thể tải danh sách sử dụng dịch vụ');
      setSuDungDichVus([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch booking records
  const fetchDatPhongs = async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/DatPhong`);
      const data = await response.json();
      
      // Handle different response structures
      let datPhongList = [];
      if (Array.isArray(data)) {
        datPhongList = data;
      } else if (data.data?.datPhongs) {
        datPhongList = data.data.datPhongs;
      } else if (data.datPhongs) {
        datPhongList = data.datPhongs;
      } else if (data.data) {
        datPhongList = Array.isArray(data.data) ? data.data : [];
      }

      // Filter only active bookings (not cancelled and not checked out)
      const activeBookings = datPhongList.filter(dp => 
        dp.trangThai !== 'Đã hủy' && 
        dp.trangThai !== 'Đã trả phòng'
      );

      console.log('Active bookings:', activeBookings);
      setDatPhongs(activeBookings);
    } catch (error) {
      console.error('Error fetching booking records:', error);
      message.error('Không thể tải danh sách đặt phòng');
      setDatPhongs([]);
    }
  };

  // Fetch services
  const fetchDichVus = async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/DichVu`);
      const data = await response.json();
      
      // Handle different response structures
      let dichVuList = [];
      if (Array.isArray(data)) {
        dichVuList = data;
      } else if (data.data?.dichVus) {
        dichVuList = data.data.dichVus;
      } else if (data.dichVus) {
        dichVuList = data.dichVus;
      } else if (data.data) {
        dichVuList = Array.isArray(data.data) ? data.data : [];
      }
      
      setDichVus(dichVuList);
    } catch (error) {
      console.error('Error fetching services:', error);
      message.error('Không thể tải danh sách dịch vụ');
      setDichVus([]);
    }
  };

  useEffect(() => {
    fetchSuDungDichVus();
    fetchDatPhongs();
    fetchDichVus();
  }, []);

  const handleTableChange = (newPagination) => {
    fetchSuDungDichVus(newPagination.current, newPagination.pageSize);
  };

  const showModal = (record = null) => {
    setEditingRecord(record);
    if (record) {
      form.setFieldsValue({
        ...record,
        ngaySuDung: record.ngaySuDung ? dayjs(record.ngaySuDung) : null,
        ngayKetThuc: record.ngayKetThuc ? dayjs(record.ngayKetThuc) : null,
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingRecord(null);
  };

  const handleSubmit = async (values) => {
    try {
      const url = editingRecord
        ? `${API_BASE_URL}/SuDungDichVu/${editingRecord.maSuDung}`
        : `${API_BASE_URL}/SuDungDichVu`;
      
      const method = editingRecord ? 'PUT' : 'POST';
      
      const formattedValues = {
        ...values,
        ngaySuDung: values.ngaySuDung?.format('YYYY-MM-DD'),
        ngayKetThuc: values.ngayKetThuc?.format('YYYY-MM-DD'),
      };

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });

      if (response.ok) {
        message.success(
          editingRecord
            ? 'Cập nhật sử dụng dịch vụ thành công!'
            : 'Thêm sử dụng dịch vụ mới thành công!'
        );
        handleCancel();
        fetchSuDungDichVus(pagination.current, pagination.pageSize);
      } else {
        throw new Error('Failed to save service usage');
      }
    } catch (error) {
      console.error('Error saving service usage:', error);
      message.error('Không thể lưu thông tin sử dụng dịch vụ');
    }
  };

  const handleDelete = async (maSuDung) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/SuDungDichVu/${maSuDung}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Xóa sử dụng dịch vụ thành công!');
        fetchSuDungDichVus(pagination.current, pagination.pageSize);
      } else {
        throw new Error('Failed to delete service usage');
      }
    } catch (error) {
      console.error('Error deleting service usage:', error);
      message.error('Không thể xóa sử dụng dịch vụ');
    }
  };

  const columns = [
    {
      title: 'Mã sử dụng',
      dataIndex: 'maSuDung',
      key: 'maSuDung',
      sorter: (a, b) => a.maSuDung - b.maSuDung,
    },
    {
      title: 'Mã đặt phòng',
      dataIndex: 'maDatPhong',
      key: 'maDatPhong',
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'tenDichVu',
      key: 'tenDichVu',
    },
    {
      title: 'Số lượng',
      dataIndex: 'soLuong',
      key: 'soLuong',
      render: (text) => text?.toLocaleString('vi-VN'),
    },
    {
      title: 'Ngày sử dụng',
      dataIndex: 'ngaySuDung',
      key: 'ngaySuDung',
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '',
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'ngayKetThuc',
      key: 'ngayKetThuc',
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '',
    },
    {
      title: 'Thành tiền',
      dataIndex: 'thanhTien',
      key: 'thanhTien',
      render: (text) => text ? `${text.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.maSuDung)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Quản lý Sử dụng Dịch vụ</Title>
      
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              Thêm mới
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchSuDungDichVus(pagination.current, pagination.pageSize)}
            >
              Làm mới
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={suDungDichVus}
          rowKey="maSuDung"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          locale={{
            emptyText: 'Không có dữ liệu'
          }}
        />
      </Card>

      <Modal
        title={editingRecord ? "Sửa thông tin sử dụng dịch vụ" : "Thêm sử dụng dịch vụ mới"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="maDatPhong"
            label="Mã đặt phòng"
            rules={[{ required: true, message: 'Vui lòng chọn mã đặt phòng!' }]}
          >
            <Select 
              placeholder="Chọn mã đặt phòng"
              loading={loading}
              notFoundContent={loading ? 'Đang tải...' : 'Không có dữ liệu'}
            >
              {Array.isArray(datPhongs) && datPhongs.map(dp => (
                <Option key={dp.maDatPhong} value={dp.maDatPhong}>
                  {`${dp.maDatPhong} - Phòng: ${dp.maPhong} - Khách: ${dp.tenKhachHang}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="maDichVu"
            label="Dịch vụ"
            rules={[{ required: true, message: 'Vui lòng chọn dịch vụ!' }]}
          >
            <Select 
              placeholder="Chọn dịch vụ"
              loading={loading}
              notFoundContent={loading ? 'Đang tải...' : 'Không có dữ liệu'}
            >
              {Array.isArray(dichVus) && dichVus.map(dv => (
                <Option key={dv.maDichVu} value={dv.maDichVu}>
                  {`${dv.tenDichVu} - ${dv.donGia?.toLocaleString('vi-VN')} VNĐ`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="soLuong"
            label="Số lượng"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="Nhập số lượng"
            />
          </Form.Item>

          <Form.Item
            name="ngaySuDung"
            label="Ngày sử dụng"
            rules={[{ required: true, message: 'Vui lòng chọn ngày sử dụng!' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
            />
          </Form.Item>

          <Form.Item
            name="ngayKetThuc"
            label="Ngày kết thúc"
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRecord ? 'Cập nhật' : 'Thêm mới'}
              </Button>
              <Button onClick={handleCancel}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default SuDungDichVu; 