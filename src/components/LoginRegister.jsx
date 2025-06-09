import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { saveAuthTokens } from '../auth';
import './LoginRegister.css';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const LoginRegister = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const payload = { Email: email, MatKhau: password };

    try {
      const response = await fetch('https://qlks-0dvh.onrender.com/api/Auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = data.data || data;
        if (!userData.token || !userData.refreshToken) {
          throw new Error('Thông tin xác thực không đầy đủ.');
        }
        await saveAuthTokens(userData.token, userData.refreshToken);
        localStorage.setItem('user', JSON.stringify({
          email: userData.email || userData.Email,
          hoTen: userData.hoTen || userData.HoTen,
          vaiTro: userData.vaiTro || userData.VaiTro,
          idNhanVien: userData.idNhanVien || userData.MaNv
        }));
        setMessage('Đăng nhập thành công!');
        navigate('/dashboard');
      } else {
        setMessage(data.Message || 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.');
      }
    } catch (error) {
      setMessage('Không thể kết nối tới hệ thống. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-container ${isDarkMode ? 'dark' : 'light'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-box"
      >
        <Typography variant="h4" component="h2" sx={{ color: '#4f46e5', fontWeight: 700, textAlign: 'center', mb: 3 }}>
          Đăng Nhập
        </Typography>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              variant="outlined"
            />
          </div>
          <div className="form-group">
            <TextField
              label="Mật Khẩu"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              variant="outlined"
            />
          </div>
          {message && <div className="auth-message">{message}</div>}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            sx={{ fontWeight: 700, width: '100%', height: 54 }}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginRegister;
