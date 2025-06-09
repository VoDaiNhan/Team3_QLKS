import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  Space,
  Popconfirm,
  message,
  Typography,
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { apiFetch } from '../auth';
import './PhuThu.css';

const { Title } = Typography;
const { Option } = Select;

const PhuThu = () => {
  const [phuThus, setPhuThus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPhuThu, setEditingPhuThu] = useState(null);
  const [loaiPhongs, setLoaiPhongs] = useState([]);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchLoaiPhongs = async () => {
    try {
      const res = await apiFetch('https://qlks-0dvh.onrender.com/api/LoaiPhong?pageNumber=1&pageSize=100');
      const data = await res.json();
      if (data && data.data) {
        setLoaiPhongs(data.data.loaiPhongs || []);
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách loại phòng.');
    }
  };
  
  const fetchPhuThus = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await apiFetch(`https://qlks-0dvh.onrender.com/api/PhuThu?pageNumber=${page}&pageSize=${pageSize}`);
      const data = await res.json();
      if (data && data.success) {
        setPhuThus(data.data.phuThus || []);
        setPagination({
          current: data.data.currentPage,
          pageSize: data.data.pageSize,
          total: data.data.totalItems,
        });
      } else {
        setPhuThus([]);
        message.error(data.message || 'Không thể tải dữ liệu phụ thu.');
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách phụ thu.');
      setPhuThus([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhuThus(pagination.current, pagination.pageSize);
    fetchLoaiPhongs();
  }, []);

  const handleTableChange = (newPagination) => {
    fetchPhuThus(newPagination.current, newPagination.pageSize);
  };

  const showModal = (record = null) => {
    setEditingPhuThu(record);
    if (record) {
      form.setFieldsValue({
        maLoaiPhong: record.maLoaiPhong,
        giaPhuThuTheoNgay: record.giaPhuThuTheoNgay,
        giaPhuThuTheoGio: record.giaPhuThuTheoGio
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingPhuThu(null);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Kiểm tra ít nhất một loại giá phụ thu được nhập
      if (!values.giaPhuThuTheoNgay && !values.giaPhuThuTheoGio) {
        message.error('Vui lòng nhập ít nhất một loại giá phụ thu!');
        return;
      }

      let url = 'https://qlks-0dvh.onrender.com/api/PhuThu';
      let method = 'POST';

      if (editingPhuThu) {
        url = `https://qlks-0dvh.onrender.com/api/PhuThu/${editingPhuThu.maPhuThu}`;
        method = 'PUT';
      }

      const response = await apiFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        message.success(data.message);
        handleCancel();
        fetchPhuThus(pagination.current, pagination.pageSize);
      } else {
        message.error(data.message || 'Thao tác thất bại.');
      }
    } catch (error) {
      message.error('Đã xảy ra lỗi. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (maPhuThu) => {
    try {
      const response = await apiFetch(`https://qlks-0dvh.onrender.com/api/PhuThu/${maPhuThu}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        message.success(data.message);
        fetchPhuThus(pagination.current, pagination.pageSize);
      } else {
        message.error(data.message || 'Xóa thất bại!');
      }
    } catch (error) {
      message.error('Đã xảy ra lỗi khi xóa.');
    }
  };

  const columns = [
    {
      title: 'Loại Phòng',
      dataIndex: 'maLoaiPhong',
      key: 'maLoaiPhong',
      render: (maLoaiPhong) => {
        const loaiPhong = loaiPhongs.find(lp => lp.maLoaiPhong === maLoaiPhong);
        return loaiPhong ? loaiPhong.tenLoaiPhong : 'Không xác định';
      }
    },
    {
      title: 'Giá Theo Ngày',
      dataIndex: 'giaPhuThuTheoNgay',
      key: 'giaPhuThuTheoNgay',
      render: (gia) => gia ? `${gia.toLocaleString('vi-VN')} VNĐ` : 'Không có',
    },
    {
      title: 'Giá Theo Giờ',
      dataIndex: 'giaPhuThuTheoGio',
      key: 'giaPhuThuTheoGio',
      render: (gia) => gia ? `${gia.toLocaleString('vi-VN')} VNĐ` : 'Không có',
    },
    {
      title: 'Thao Tác',
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
            title={
              <div>
                <div style={{ marginBottom: '16px' }}>Bạn có chắc chắn muốn xóa?</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button onClick={(e) => { e.stopPropagation(); }}>
                    Hủy
                  </Button>
                  <Button danger onClick={(e) => { e.stopPropagation(); handleDelete(record.maPhuThu); }}>
                    Xóa
                  </Button>
                </div>
              </div>
            }
            okButtonProps={{ style: { display: 'none' } }}
            cancelButtonProps={{ style: { display: 'none' } }}
            icon={<DeleteOutlined style={{ color: 'red' }} />}
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Quản lý Phụ Thu</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => showModal()}
        >
          Thêm Phụ Thu
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={phuThus}
        rowKey={(record) => record.maLoaiPhong}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        bordered
      />

      <Modal
        title={editingPhuThu ? 'Sửa Phụ Thu' : 'Thêm Phụ Thu'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        destroyOnClose
        footer={null}
      >
        <Form form={form} layout="vertical" name="phuThuForm">
          <Form.Item
            name="maLoaiPhong"
            label="Loại Phòng"
            rules={[{ required: true, message: 'Vui lòng chọn loại phòng!' }]}
          >
            <Select 
              placeholder="Chọn loại phòng" 
              disabled={!!editingPhuThu}
              showSearch
              optionFilterProp="children"
            >
              {loaiPhongs.map(lp => (
                <Option key={lp.maLoaiPhong} value={lp.maLoaiPhong}>
                  {lp.tenLoaiPhong}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="giaPhuThuTheoNgay"
            label="Giá Phụ Thu Theo Ngày"
            rules={[
              {
                validator: (_, value) => {
                  const gioValue = form.getFieldValue('giaPhuThuTheoGio');
                  if (!value && !gioValue) {
                    return Promise.reject('Vui lòng nhập ít nhất một loại giá phụ thu!');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Nhập giá phụ thu theo ngày"
            />
          </Form.Item>

          <Form.Item
            name="giaPhuThuTheoGio"
            label="Giá Phụ Thu Theo Giờ"
            rules={[
              {
                validator: (_, value) => {
                  const ngayValue = form.getFieldValue('giaPhuThuTheoNgay');
                  if (!value && !ngayValue) {
                    return Promise.reject('Vui lòng nhập ít nhất một loại giá phụ thu!');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Nhập giá phụ thu theo giờ"
            />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
            <Button onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="primary" onClick={handleOk}>
              OK
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PhuThu;