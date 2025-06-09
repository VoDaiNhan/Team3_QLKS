import React, { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Typography,
  Card, Row, Col, Space, message, Tag, Select, Statistic
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, EditOutlined, 
  DeleteOutlined, ReloadOutlined
} from '@ant-design/icons';
import './KhachHang.css';
import { apiFetch } from '../auth';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function KhachHang() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [khachHangs, setKhachHangs] = useState([]);
  const [selectedKhachHang, setSelectedKhachHang] = useState(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
  });

  const fetchKhachHangs = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('https://qlks-0dvh.onrender.com/api/KhachHang?pageNumber=1&pageSize=100');
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : (data.data?.khachHangs || data.khachHangs || data.KhachHangs || []);
        setKhachHangs(list);
        
        // Tính toán thống kê
        setStats({
          total: list.length,
          active: list.filter(kh => kh.isActive !== false).length,
        });
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      message.error('Lỗi khi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKhachHangs();
  }, []);

  const handleAddCustomer = async (values) => {
    try {
      const response = await apiFetch('https://qlks-0dvh.onrender.com/api/KhachHang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (response.ok) {
        message.success('Thêm khách hàng mới thành công!');
        setIsModalVisible(false);
        form.resetFields();
        fetchKhachHangs();
      } else {
        message.error('Thêm khách hàng mới thất bại!');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      message.error('Đã xảy ra lỗi khi thêm khách hàng mới!');
    }
  };

  const handleUpdateCustomer = async (values) => {
    if (!selectedKhachHang) return;
    try {
      const response = await apiFetch(`https://qlks-0dvh.onrender.com/api/KhachHang/${selectedKhachHang.hoTen}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (response.ok) {
        message.success('Cập nhật khách hàng thành công!');
        setIsModalVisible(false);
        form.resetFields();
        fetchKhachHangs();
      } else {
        message.error('Cập nhật khách hàng thất bại!');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      message.error('Đã xảy ra lỗi khi cập nhật khách hàng!');
    }
  };

  const handleDeleteCustomer = async (hoTen) => {
    try {
      const response = await apiFetch(`https://qlks-0dvh.onrender.com/api/KhachHang/${hoTen}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        message.success('Xóa khách hàng thành công!');
        fetchKhachHangs();
      } else {
        message.error('Xóa khách hàng thất bại!');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      message.error('Đã xảy ra lỗi khi xóa khách hàng!');
    }
  };

  const handleSearch = async (values) => {
    try {
      const response = await apiFetch(`https://qlks-0dvh.onrender.com/api/KhachHang/${values.hoTen}`);
      if (response.ok) {
        const data = await response.json();
        setKhachHangs(data.data || []);
        setIsSearchModalVisible(false);
        searchForm.resetFields();
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      message.error('Đã xảy ra lỗi khi tìm kiếm khách hàng!');
    }
  };

  const columns = [
    {
      title: 'Mã khách hàng',
      dataIndex: 'maKh',
      key: 'maKh',
      width: '10%',
      sorter: (a, b) => a.maKh - b.maKh,
    },
    {
      title: 'Họ tên',
      dataIndex: 'hoTen',
      key: 'hoTen',
      width: '15%',
      sorter: (a, b) => a.hoTen.localeCompare(b.hoTen),
    },
    {
      title: 'CCCD/Passport',
      dataIndex: 'cccdPassport',
      key: 'cccdPassport',
      width: '15%',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'soDienThoai',
      key: 'soDienThoai',
      width: '15%',
    },
    {
      title: 'Quốc tịch',
      dataIndex: 'quocTich',
      key: 'quocTich',
      width: '10%',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'ghiChu',
      key: 'ghiChu',
      width: '15%',
      ellipsis: true,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '20%',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedKhachHang(record);
              form.setFieldsValue(record);
              setIsModalVisible(true);
            }}
          >
            Sửa
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCustomer(record.hoTen)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="khachhang-container">
      <Title level={2} className="page-title">Quản lý Khách hàng</Title>

      <Row gutter={16} className="stats-row">
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng số khách hàng"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Action Buttons */}
      <div className="action-buttons">
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedKhachHang(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            Thêm khách hàng mới
          </Button>
          <Button
            icon={<SearchOutlined />}
            onClick={() => setIsSearchModalVisible(true)}
          >
            Tìm kiếm
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchKhachHangs}
          >
            Làm mới
          </Button>
        </Space>
      </div>

      {/* Table Card */}
      <Card className="table-card">
        <Table
          columns={columns}
          dataSource={khachHangs}
          rowKey="maKh"
          loading={loading}
          size="small"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} khách hàng`
          }}
          bordered
          scroll={{ x: true }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={selectedKhachHang ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={selectedKhachHang ? handleUpdateCustomer : handleAddCustomer}
        >
          <Form.Item
            name="hoTen"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="cccdPassport"
            label="CCCD/Passport"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="soDienThoai"
            label="Số điện thoại"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="quocTich"
            label="Quốc tịch"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="ghiChu"
            label="Ghi chú"
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {selectedKhachHang ? 'Cập nhật' : 'Thêm mới'}
              </Button>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Search Modal */}
      <Modal
        title="Tìm kiếm khách hàng"
        open={isSearchModalVisible}
        onCancel={() => {
          setIsSearchModalVisible(false);
          searchForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={searchForm}
          layout="vertical"
          onFinish={handleSearch}
        >
          <Form.Item
            name="hoTen"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên cần tìm!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Tìm kiếm
              </Button>
              <Button onClick={() => {
                setIsSearchModalVisible(false);
                searchForm.resetFields();
              }}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default KhachHang;
