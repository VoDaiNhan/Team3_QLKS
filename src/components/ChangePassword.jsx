import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { apiFetch } from '../auth';
import { useTheme } from '../contexts/ThemeContext';
import './ChangePassword.css';

const { Title } = Typography;

const ChangePassword = () => {
  const [loading, setLoading] = useState(false);
    const { isDarkMode } = useTheme();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

  const onFinish = async (values) => {
    setLoading(true);
        if (values.newPassword !== values.confirmPassword) {
            message.error("Mật khẩu mới và mật khẩu xác nhận không khớp!");
            setLoading(false);
            return;
        }

        try {
            const payload = {
                email: user.Email,
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
            };
            
            const res = await apiFetch('https://qlks-0dvh.onrender.com/api/auth/password', {
        method: 'POST',
                body: JSON.stringify(payload)
      });

            const data = await res.json();

      if (res.ok) {
        message.success('Đổi mật khẩu thành công!');
      } else {
                message.error(data.message || 'Đã có lỗi xảy ra.');
      }
        } catch (error) {
            message.error('Lỗi kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
        <div className={`change-password-container ${isDarkMode ? 'dark' : ''}`}>
            <Card className="change-password-card">
                <Title level={2} className="change-password-title">Đổi mật khẩu</Title>
                <Form
                    name="change_password"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        name="oldPassword"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu cũ" />
                    </Form.Item>

                    <Form.Item
                        name="newPassword"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu mới" />
                    </Form.Item>

                    <Form.Item
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
                        <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu mới" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Cập nhật mật khẩu
                        </Button>
                    </Form.Item>
      </Form>
            </Card>
    </div>
  );
};

export default ChangePassword;
