import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Space, message, Select, Tag, Row, Col, Card, Typography } from 'antd';
import { apiFetch } from '../auth';
import './Account.css';
import { useTheme } from '../contexts/ThemeContext';
import { EditOutlined, UserAddOutlined, PlusOutlined, SearchOutlined, ReloadOutlined, KeyOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Title } = Typography;

function Account() {
  const [accounts, setAccounts] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateAccountModalVisible, setIsCreateAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();
  const [createAccountForm] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    total: 0,
    active: 0
  });
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [changePasswordForm] = Form.useForm();

  const fetchAllAccounts = async () => {
    try {
      const res = await apiFetch('https://qlks-0dvh.onrender.com/api/Account/all');
      const data = await res.json();
      if (data && data.data) {
        setAllAccounts(data.data);
        setStats({
          total: data.data.length,
          active: data.data.length
        });
      }
    } catch (error) {
      console.error('Error fetching all accounts:', error);
    }
  };

  const fetchAccounts = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      let url = search
        ? `https://qlks-0dvh.onrender.com/api/Account/by-name?hoTen=${encodeURIComponent(search)}`
        : `https://qlks-0dvh.onrender.com/api/Account?pageNumber=${page}&pageSize=${pageSize}`;
        
      const res = await apiFetch(url);
      const data = await res.json();
      
      if (data && data.data) {
        let accountsList = [];
        if (search) {
          accountsList = data.data;
          setPagination(prev => ({ ...prev, total: data.data.length, current: 1 }));
        } else {
          accountsList = data.data.accounts || [];
          setPagination({
            current: data.data.currentPage,
            pageSize: data.data.pageSize,
            total: data.data.totalItems,
          });
        }
        setAccounts(accountsList);
        setStats({
          total: data.data.totalItems || accountsList.length,
          active: data.data.totalItems || accountsList.length
        });
      } else {
        setAccounts([]);
        message.error('Không tìm thấy dữ liệu.');
      }
    } catch (e) {
      setAccounts([]);
      message.error('Lỗi khi tải dữ liệu tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts(pagination.current, pagination.pageSize);
    fetchAllAccounts();
  }, [search]);
  
  const handleTableChange = (newPagination) => {
    fetchAccounts(newPagination.current, newPagination.pageSize);
  };

  const showCreateAccountModal = (record) => {
    setSelectedAccount(record);
    createAccountForm.setFieldsValue({ email: record.email });
    setIsCreateAccountModalVisible(true);
  };

  const handleCreateAccount = async (values) => {
    try {
      const res = await apiFetch('https://qlks-0dvh.onrender.com/api/Auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          matKhau: values.password
        })
      });

      if (!res.ok) {
        throw new Error('Lỗi khi cấp tài khoản');
      }

      message.success('Cấp tài khoản thành công!');
      setIsCreateAccountModalVisible(false);
      createAccountForm.resetFields();
      setSelectedAccount(null);
      fetchAccounts(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.message || 'Lỗi khi cấp tài khoản');
    }
  };

  const showEditModal = (record) => {
    setEditingAccount(record);
    const formattedRecord = {
      ...record,
      ngaySinh: record.ngaySinh ? new Date(record.ngaySinh).toISOString().split('T')[0] : undefined
    };
    form.setFieldsValue(formattedRecord);
    setIsModalVisible(true);
  };

  const showAddModal = () => {
    setEditingAccount(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleOk = async (values) => {
    try {
      const formattedDate = values.ngaySinh ? values.ngaySinh.split('T')[0] : null;

      const formData = {
        email: values.email,
        hoTen: values.hoTen,
        maVaiTro: Number(values.maVaiTro),
        soDienThoai: values.soDienThoai || null,
        gioiTinh: values.gioiTinh || null,
        diaChi: values.diaChi || null,
        ngaySinh: formattedDate
      };

      if (editingAccount) {
        const res = await apiFetch(`https://qlks-0dvh.onrender.com/api/Account/${encodeURIComponent(editingAccount.email)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Lỗi khi cập nhật tài khoản');
        }

        message.success('Cập nhật tài khoản thành công!');
      } else {
        const res = await apiFetch('https://qlks-0dvh.onrender.com/api/Account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Lỗi khi thêm tài khoản');
        }

        message.success('Thêm tài khoản thành công!');
      }

      setIsModalVisible(false);
      form.resetFields();
      setEditingAccount(null);
      await fetchAccounts(pagination.current, pagination.pageSize);
      await fetchAllAccounts();

    } catch (error) {
      message.error(error.message);
    }
  };

  const showChangePasswordModal = (record) => {
    setSelectedAccount(record);
    changePasswordForm.setFieldsValue({ email: record.email });
    setIsChangePasswordModalVisible(true);
  };

  const handleChangePassword = async (values) => {
    try {
      const res = await apiFetch('https://qlks-0dvh.onrender.com/api/Auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          newPassword: values.newPassword
        })
      });

      if (!res.ok) {
        throw new Error('Lỗi khi đổi mật khẩu');
      }

      message.success('Đổi mật khẩu thành công!');
      setIsChangePasswordModalVisible(false);
      changePasswordForm.resetFields();
      setSelectedAccount(null);
    } catch (error) {
      message.error(error.message || 'Lỗi khi đổi mật khẩu');
    }
  };

  const columns = [
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Tên nhân viên', dataIndex: 'hoTen', key: 'hoTen' },
    { title: 'Vai trò', key: 'vaiTro', render: (_, record) => {
      const ma = record.maVaiTro ?? record.MaVaiTro;
      if (ma === 1) return 'Nhân viên';
      if (ma === 2) return 'Quản lý';
      return '';
    } },
    { title: 'Số điện thoại', dataIndex: 'soDienThoai', key: 'soDienThoai' },
    { title: 'Giới tính', dataIndex: 'gioiTinh', key: 'gioiTinh' },
    { title: 'Địa chỉ', dataIndex: 'diaChi', key: 'diaChi' },
    { title: 'Ngày sinh', dataIndex: 'ngaySinh', key: 'ngaySinh', render: (ngaySinh) => ngaySinh ? new Date(ngaySinh).toLocaleDateString() : '' },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.hasPassword ? "green" : "orange"}>
          {record.hasPassword ? "Đã cấp tài khoản" : "Chưa cấp tài khoản"}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" ghost onClick={() => showEditModal(record)}>
            <EditOutlined /> Sửa
          </Button>
          {record.hasPassword ? (
            <Button type="default" onClick={() => showChangePasswordModal(record)}>
              <KeyOutlined /> Đổi mật khẩu
            </Button>
          ) : (
            <Button type="default" onClick={() => showCreateAccountModal(record)}>
              <UserAddOutlined /> Cấp tài khoản
            </Button>
          )}
        </Space>
      ),
    }
  ];

  return (
    <div className="account-container">
      <div className="header-section">
        <Title level={2}>Quản lý tài khoản</Title>
        <div className="action-buttons">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showAddModal}
          >
            Thêm tài khoản mới
          </Button>
          <Input.Search 
            placeholder="Tìm kiếm theo tên nhân viên" 
            onSearch={value => {
              setSearch(value);
              setPagination(prev => ({ ...prev, current: 1 })); 
            }} 
            style={{ width: 300 }}
            allowClear
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearch('');
              fetchAccounts(1, pagination.pageSize);
            }}
          >
            Làm mới
          </Button>
        </div>
      </div>

      <Table 
        columns={columns} 
        dataSource={accounts} 
        rowKey="email" 
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} tài khoản`,
          pageSize: 10
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={editingAccount ? 'Sửa tài khoản' : 'Thêm tài khoản'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingAccount(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleOk}
          initialValues={{
            ...editingAccount,
            ngaySinh: editingAccount?.ngaySinh ? new Date(editingAccount.ngaySinh).toISOString().split('T')[0] : undefined
          }}
        >
          <Form.Item 
            label="Email" 
            name="email" 
            rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ!' }]}
          >
            <Input disabled={!!editingAccount} />
          </Form.Item>
          <Form.Item 
            label="Tên nhân viên" 
            name="hoTen" 
            rules={[{ required: true, message: 'Nhập tên nhân viên!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item 
            label="Vai trò" 
            name="maVaiTro" 
            rules={[{ required: true, message: 'Chọn vai trò!' }]}
          >
            <Select placeholder="Chọn vai trò">
              <Option value={1}>Nhân viên</Option>
              <Option value={2}>Quản lý</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Số điện thoại" name="soDienThoai">
            <Input />
          </Form.Item>
          <Form.Item label="Giới tính" name="gioiTinh">
            <Select placeholder="Chọn giới tính">
              <Option value="Nam">Nam</Option>
              <Option value="Nữ">Nữ</Option>
              <Option value="Khác">Khác</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Địa chỉ" name="diaChi">
            <Input />
          </Form.Item>
          <Form.Item label="Ngày sinh" name="ngaySinh">
            <Input type="date" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingAccount ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Cấp tài khoản"
        open={isCreateAccountModalVisible}
        onCancel={() => {
          setIsCreateAccountModalVisible(false);
          createAccountForm.resetFields();
          setSelectedAccount(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={createAccountForm}
          layout="vertical"
          onFinish={handleCreateAccount}
        >
          <Form.Item 
            label="Email" 
            name="email"
          >
            <Input disabled />
          </Form.Item>
          <Form.Item 
            label="Mật khẩu" 
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Cấp tài khoản
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Đổi mật khẩu"
        open={isChangePasswordModalVisible}
        onCancel={() => {
          setIsChangePasswordModalVisible(false);
          changePasswordForm.resetFields();
          setSelectedAccount(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={changePasswordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item 
            label="Email" 
            name="email"
          >
            <Input disabled />
          </Form.Item>
          <Form.Item 
            label="Mật khẩu mới" 
            name="newPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item 
            label="Xác nhận mật khẩu mới" 
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Đổi mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Account;
