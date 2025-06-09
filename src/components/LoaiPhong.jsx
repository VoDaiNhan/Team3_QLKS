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
  Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiFetch } from '../auth';
import './LoaiPhong.css';

const { Title } = Typography;
const { TextArea } = Input;

const LoaiPhong = () => {
  const [loaiPhongs, setLoaiPhongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingLoaiPhong, setEditingLoaiPhong] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchLoaiPhongs = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await apiFetch(`https://qlks-0dvh.onrender.com/api/LoaiPhong?pageNumber=${page}&pageSize=${pageSize}`);
      const data = await res.json();
      if (data && data.data) {
        setLoaiPhongs(data.data.loaiPhongs || []);
        setPagination({
          current: data.data.currentPage,
          pageSize: data.data.pageSize,
          total: data.data.totalItems,
        });
      } else {
        setLoaiPhongs([]);
        message.error('Không thể tải dữ liệu loại phòng.');
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách loại phòng.');
      setLoaiPhongs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoaiPhongs(pagination.current, pagination.pageSize);
  }, []);

  const handleTableChange = (newPagination) => {
    fetchLoaiPhongs(newPagination.current, newPagination.pageSize);
  };

  const showModal = (record = null) => {
    setEditingLoaiPhong(record);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingLoaiPhong(null);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      let url = 'https://qlks-0dvh.onrender.com/api/LoaiPhong';
      let method = 'POST';

      if (editingLoaiPhong) {
        url = `https://qlks-0dvh.onrender.com/api/LoaiPhong/${editingLoaiPhong.maLoaiPhong}`;
        method = 'PUT';
      }

      const response = await apiFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(editingLoaiPhong ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
        handleCancel();
        fetchLoaiPhongs(pagination.current, pagination.pageSize);
      } else {
        const errorData = await response.json().catch(() => ({}));
        message.error(errorData.message || 'Thao tác thất bại.');
      }
    } catch (error) {
      if (error.errorFields) {
        console.log('Validation failed:', error);
      } else {
        message.error('Đã xảy ra lỗi.');
      }
    }
  };

  const handleDelete = async (maLoaiPhong) => {
    try {
      const response = await apiFetch(`https://qlks-0dvh.onrender.com/api/LoaiPhong/${maLoaiPhong}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        message.success('Xóa loại phòng thành công!');
        fetchLoaiPhongs(pagination.current, pagination.pageSize);
      } else {
        message.error('Xóa thất bại! Có thể loại phòng này đang được sử dụng.');
      }
    } catch (error) {
      message.error('Đã xảy ra lỗi khi xóa.');
    }
  };

  const columns = [
    { title: 'Mã', dataIndex: 'maLoaiPhong', key: 'maLoaiPhong', sorter: (a, b) => a.maLoaiPhong - b.maLoaiPhong },
    { title: 'Tên Loại Phòng', dataIndex: 'tenLoaiPhong', key: 'tenLoaiPhong', sorter: (a, b) => a.tenLoaiPhong.localeCompare(b.tenLoaiPhong) },
    {
      title: 'Giá Cơ Bản',
      dataIndex: 'giaCoBan',
      key: 'giaCoBan',
      render: (gia) => `${gia?.toLocaleString('vi-VN')} VNĐ`,
      sorter: (a, b) => a.giaCoBan - b.giaCoBan,
    },
    { title: 'Số Người Tối Đa', dataIndex: 'soNguoiToiDa', key: 'soNguoiToiDa', sorter: (a, b) => a.soNguoiToiDa - b.soNguoiToiDa },
    { title: 'Mô Tả', dataIndex: 'moTa', key: 'moTa', ellipsis: true },
    {
      title: 'Thao Tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showModal(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.maLoaiPhong)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button icon={<DeleteOutlined />} danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Quản lý Loại Phòng</Title>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => showModal()}
        style={{ marginBottom: 16 }}
      >
        Thêm Loại Phòng
      </Button>
      <Table
        columns={columns}
        dataSource={loaiPhongs}
        rowKey="maLoaiPhong"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        bordered
      />
      <Modal
        title={editingLoaiPhong ? 'Sửa Loại Phòng' : 'Thêm Loại Phòng'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="loaiPhongForm" initialValues={editingLoaiPhong || {}}>
          <Form.Item
            name="tenLoaiPhong"
            label="Tên Loại Phòng"
            rules={[{ required: true, message: 'Vui lòng nhập tên loại phòng!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="giaCoBan"
            label="Giá Cơ Bản"
            rules={[{ required: true, message: 'Vui lòng nhập giá cơ bản!' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
          </Form.Item>
          <Form.Item
            name="soNguoiToiDa"
            label="Số Người Tối Đa"
            rules={[{ required: true, message: 'Vui lòng nhập số người tối đa!' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="moTa" label="Mô Tả">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LoaiPhong;
