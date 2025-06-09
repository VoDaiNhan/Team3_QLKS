import React, { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber,
  Typography, Card, Row, Col, Space, message, Tag, Statistic
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, EditOutlined, 
  DeleteOutlined, ReloadOutlined 
} from '@ant-design/icons';
import './DichVu.css';
import { apiFetch } from '../auth';

const { Title } = Typography;
const { TextArea } = Input;

function DichVu() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [dichVus, setDichVus] = useState([]);
  const [selectedDichVu, setSelectedDichVu] = useState(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0
  });

  const fetchDichVus = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('https://qlks-0dvh.onrender.com/api/DichVu?pageNumber=1&pageSize=100');
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : (data.data?.dichVus || data.dichVus || data.DichVus || []);
        setDichVus(list);
        
        // Tính toán thống kê
        setStats({
          total: list.length,
          active: list.filter(dv => dv.isActive !== false).length
        });
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      message.error('Lỗi khi tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDichVus();
  }, []);

  const handleAddService = async (values) => {
    try {
      const response = await apiFetch('https://qlks-0dvh.onrender.com/api/DichVu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (response.ok) {
        message.success('Thêm dịch vụ mới thành công!');
        setIsModalVisible(false);
        form.resetFields();
        fetchDichVus();
      } else {
        message.error('Thêm dịch vụ mới thất bại!');
      }
    } catch (error) {
      console.error('Error adding service:', error);
      message.error('Đã xảy ra lỗi khi thêm dịch vụ mới!');
    }
  };

  const handleUpdateService = async (values) => {
    if (!selectedDichVu) return;
    try {
      const response = await apiFetch(`https://qlks-0dvh.onrender.com/api/DichVu/${encodeURIComponent(selectedDichVu.tenDichVu)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (response.ok) {
        message.success('Cập nhật dịch vụ thành công!');
        setIsModalVisible(false);
        form.resetFields();
        fetchDichVus();
      } else {
        const errorData = await response.json().catch(() => ({}));
        message.error(errorData.message || 'Cập nhật dịch vụ thất bại!');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      message.error('Đã xảy ra lỗi khi cập nhật dịch vụ!');
    }
  };

  const handleDeleteService = async (tenDichVu) => {
    try {
      const response = await apiFetch(`https://qlks-0dvh.onrender.com/api/DichVu/${encodeURIComponent(tenDichVu)}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        message.success('Xóa dịch vụ thành công!');
        fetchDichVus();
      } else {
        const errorData = await response.json().catch(() => ({}));
        message.error(errorData.message || 'Xóa dịch vụ thất bại!');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      message.error('Đã xảy ra lỗi khi xóa dịch vụ!');
    }
  };

  const handleSearch = async (values) => {
    try {
      const response = await apiFetch(`https://qlks-0dvh.onrender.com/api/DichVu/search?tenDichVu=${values.tenDichVu}`);
      if (response.ok) {
        const data = await response.json();
        setDichVus(data.data || []);
        setIsSearchModalVisible(false);
        searchForm.resetFields();
      }
    } catch (error) {
      console.error('Error searching services:', error);
      message.error('Đã xảy ra lỗi khi tìm kiếm dịch vụ!');
    }
  };

  const columns = [
    {
      title: 'Mã dịch vụ',
      dataIndex: 'maDichVu',
      key: 'maDichVu',
      sorter: (a, b) => a.maDichVu - b.maDichVu,
    },
    {
      title: 'Tên dịch vụ',
      dataIndex: 'tenDichVu',
      key: 'tenDichVu',
      sorter: (a, b) => a.tenDichVu.localeCompare(b.tenDichVu),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'donGia',
      key: 'donGia',
      render: (text) => `${text.toLocaleString()} VNĐ`,
      sorter: (a, b) => a.donGia - b.donGia,
    },
    {
      title: 'Mô tả',
      dataIndex: 'moTa',
      key: 'moTa',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive !== false ? 'green' : 'red'}>
          {isActive !== false ? 'Đang hoạt động' : 'Ngừng hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedDichVu(record);
              form.setFieldsValue(record);
              setIsModalVisible(true);
            }}
          >
            Sửa
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteService(record.tenDichVu)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="dichvu-container">
      <Title level={2} className="page-title">Quản lý Dịch vụ</Title>

      {/* Stats Section */}
      <Row gutter={16} className="stats-row">
        <Col span={12}>
          <Card>
            <Statistic
              title="Tổng số dịch vụ"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={12}>
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
              setSelectedDichVu(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            Thêm dịch vụ mới
          </Button>
          <Button
            icon={<SearchOutlined />}
            onClick={() => setIsSearchModalVisible(true)}
          >
            Tìm kiếm
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchDichVus}
          >
            Làm mới
          </Button>
        </Space>
      </div>

      {/* Services Table */}
      <Card className="table-card">
        <Table
          columns={columns}
          dataSource={dichVus}
          rowKey="maDichVu"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} dịch vụ`
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={selectedDichVu ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}
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
          onFinish={selectedDichVu ? handleUpdateService : handleAddService}
        >
          <Form.Item
            name="tenDichVu"
            label="Tên dịch vụ"
            rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="donGia"
            label="Đơn giá"
            rules={[{ required: true, message: 'Vui lòng nhập đơn giá!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              min={0}
            />
          </Form.Item>
          <Form.Item
            name="moTa"
            label="Mô tả"
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {selectedDichVu ? 'Cập nhật' : 'Thêm mới'}
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
        title="Tìm kiếm dịch vụ"
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
            name="tenDichVu"
            label="Tên dịch vụ"
            rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ cần tìm!' }]}
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

export default DichVu;
