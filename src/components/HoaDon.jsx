import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Space,
  Popconfirm,
  message,
  Select,
  InputNumber,
  Descriptions,
  Typography,
  Divider,
  AutoComplete,
  Tag,
} from 'antd';
import { apiFetch } from '../auth';
import './HoaDon.css';
import moment from 'moment';
import { EyeOutlined, PrinterOutlined, DownloadOutlined, MailOutlined } from '@ant-design/icons';

const API_BASE_URL = 'https://qlks-0dvh.onrender.com';

// Utility function to format currency
const formatCurrency = (value) => {
  if (!value) return '0 VNĐ';
  return `${value.toLocaleString('vi-VN')} VNĐ`;
};

function HoaDon() {
  const [hoaDons, setHoaDons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isPhuThuModalVisible, setIsPhuThuModalVisible] = useState(false);
  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
  const [emailForm] = Form.useForm();
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState(null);
  const [selectedHoaDon, setSelectedHoaDon] = useState(null);
  const [isPhuThuFormVisible, setIsPhuThuFormVisible] = useState(false);
  const [selectedMaHoaDon, setSelectedMaHoaDon] = useState(null);
  const [searchName, setSearchName] = useState('');
  const [searchStatus, setSearchStatus] = useState(null);
  const [khachHangList, setKhachHangList] = useState([]);
  const [filteredKhachHang, setFilteredKhachHang] = useState([]);
  const [datPhongList, setDatPhongList] = useState([]);
  const [search, setSearch] = useState('');
  const [phuThuList, setPhuThuList] = useState([]);
  const [editingPhuThu, setEditingPhuThu] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    const userStr = localStorage.getItem('user');
    let user = null;
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error('Error parsing user info:', e);
    }
    return {
      hoTen: user?.hoTen || '',
      email: user?.email || ''
    };
  });

  const nhanVienId = localStorage.getItem('nhanVienId');

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Fetch invoices
  const fetchHoaDons = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      // Lấy danh sách hóa đơn theo trang
      const url = `${API_BASE_URL}/api/HoaDon?pageNumber=${page}&pageSize=${pageSize}&orderBy=ngayLap desc`;
      
      console.log('Fetching URL:', url);
      
      const res = await apiFetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Lỗi khi tải danh sách hóa đơn: ${res.status}`);
      }

      const responseData = await res.json();
      console.log('API Response:', responseData);

      let hoaDonArray = [];
      
      if (responseData && responseData.data) {
        hoaDonArray = responseData.data.hoaDons || [];
        // Cập nhật pagination state với dữ liệu từ API
        setPagination({
          current: responseData.data.currentPage,
          pageSize: responseData.data.pageSize,
          total: responseData.data.totalItems
        });
      }

      // Convert any "Chua thanh toán" to "Chưa thanh toán"
      const updatedList = Array.isArray(hoaDonArray) ? hoaDonArray.map(hoaDon => ({
        ...hoaDon,
        key: hoaDon.maHoaDon,
        trangThai: hoaDon.trangThai === "Chua thanh toán" ? "Chưa thanh toán" : hoaDon.trangThai
      })) : [];

      // Lọc theo trạng thái và tên nếu có
      let filteredList = updatedList;

      // Lọc theo trạng thái
      if (searchStatus) {
        filteredList = filteredList.filter(hoaDon => {
          switch (searchStatus) {
            case "0":
              return hoaDon.trangThai === "Chưa thanh toán";
            case "1":
              return hoaDon.trangThai === "Đã thanh toán";
            case "2":
              return hoaDon.trangThai === "Đã thanh toán trước";
            default:
              return true;
          }
        });
      }

      // Lọc theo tên khách hàng
      if (searchName) {
        const searchLower = searchName.toLowerCase();
        filteredList = filteredList.filter(hoaDon => 
          hoaDon.tenKhachHang?.toLowerCase().includes(searchLower)
        );
      }
      
      setHoaDons(filteredList);
      
      if (filteredList.length === 0) {
        message.info('Không có hóa đơn nào.');
      }
    } catch (e) {
      console.error('Error fetching invoices:', e);
      setHoaDons([]);
      message.error(e.message || 'Không thể tải danh sách hóa đơn!');
    } finally {
      setLoading(false);
    }
  };

  // Fetch surcharges for a specific invoice
  const fetchPhuThu = async (maHoaDon) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/HoaDon/${maHoaDon}/phu-thu`);
      const data = await res.json();
      const phuThuData = data.chiTietHoaDons?.map((cthd, index) => ({
        key: `${maHoaDon}-${index}`,
        maDatPhong: cthd.maDatPhong,
        phuThu: cthd.phuThu || 0,
        lyDo: cthd.lyDo || 'N/A',
      })) || [];
      setPhuThuList(phuThuData);
    } catch (e) {
      message.error('Không thể tải danh sách phụ thu!');
      setPhuThuList([]);
    }
  };

  // Fetch all customers
  const fetchKhachHang = async () => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/KhachHang`);
      if (!res.ok) {
        throw new Error('Không thể tải danh sách khách hàng');
      }
      const data = await res.json();
      const list = data.data?.khachHangs || [];
      setKhachHangList(list.filter(kh => kh.trangThai !== 'Vô hiệu hóa'));
    } catch (error) {
      console.error('Error fetching customers:', error);
      message.error('Không thể tải danh sách khách hàng');
    }
  };

  // Fetch active bookings
  const fetchDatPhong = async () => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/DatPhong`);
      if (!res.ok) {
        throw new Error('Không thể tải danh sách đặt phòng');
      }
      const data = await res.json();
      const list = data.data?.datPhongs || [];
      // Lọc các đặt phòng còn hiệu lực (chưa có hóa đơn)
      setDatPhongList(list.filter(dp => dp.trangThai !== 'Đã hủy' && !dp.maHoaDon));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      message.error('Không thể tải danh sách đặt phòng');
    }
  };

  useEffect(() => {
    fetchHoaDons(pagination.current, pagination.pageSize);
    fetchKhachHang();
    fetchDatPhong();
  }, []);

  const handleDelete = async (maHoaDon) => {
    try {
      await apiFetch(`${API_BASE_URL}/api/HoaDon/${maHoaDon}`, { method: 'DELETE' });
      message.success('Xóa hóa đơn thành công!');
      fetchHoaDons();
    } catch (e) {
      message.error('Xóa hóa đơn thất bại!');
    }
  };

  const showAddModal = () => {
    setIsAddModalVisible(true);
  };

  const handleOk = async (values) => {
    try {
      const formattedData = {
        hoTenKhachHang: values.hoTenKhachHang,
        hoTenNhanVien: values.hoTenNhanVien,
        ngayLap: values.ngayLap?.format('YYYY-MM-DD'),
        phuongThucThanhToan: values.phuongThucThanhToan,
        trangThai: values.trangThai,
        maDatPhongs: values.maDatPhongs?.map(Number) || []
      };

      console.log('Sending new invoice data:', formattedData);

      const response = await apiFetch(`${API_BASE_URL}/api/HoaDon`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || `Lỗi khi thêm hóa đơn: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Create response:', responseData);

      message.success('Thêm hóa đơn thành công!');
      setIsAddModalVisible(false);
      fetchHoaDons();
    } catch (error) {
      console.error('Error saving invoice:', error);
      message.error(error.message || 'Lưu hóa đơn thất bại!');
    }
  };

  const handleUpdateStatus = async (values) => {
    if (!selectedHoaDon) return;
    try {
      const url = `${API_BASE_URL}/api/HoaDon/${selectedHoaDon.maHoaDon}/trang-thai${selectedHoaDon.tenKhachHang ? `?tenKhachHang=${encodeURIComponent(selectedHoaDon.tenKhachHang)}` : ''}`;
      
      // Convert status if needed
      let trangThai = values.trangThai;
      if (trangThai === "Chua thanh toán") {
        trangThai = "Chưa thanh toán";
      }
      
      const response = await apiFetch(url, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        body: JSON.stringify({ trangThai }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Cập nhật trạng thái thất bại!');
      }

      const data = await response.json();
      message.success(data.message || 'Cập nhật trạng thái hóa đơn thành công!');
      setIsStatusModalVisible(false);
      fetchHoaDons();
    } catch (e) {
      console.error('Error updating status:', e);
      message.error(e.message || 'Cập nhật trạng thái thất bại!');
    }
  };

  const handleUpdatePayment = async (values) => {
    if (!selectedHoaDon) return;
    try {
      await apiFetch(`${API_BASE_URL}/api/HoaDon/${selectedHoaDon.maHoaDon}/phuong-thuc-thanh-toan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phuongThucThanhToan: values.phuongThucThanhToan }),
      });
      message.success('Cập nhật phương thức thanh toán thành công!');
      setIsPaymentModalVisible(false);
      fetchHoaDons();
    } catch (e) {
      message.error('Cập nhật phương thức thanh toán thất bại!');
    }
  };

  const handleExportPDF = async (record) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/HoaDon/${record.maHoaDon}/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf'
        },
        body: JSON.stringify({ maHoaDon: record.maHoaDon })
      });

      if (!response.ok) {
        throw new Error('Không thể tạo file PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HoaDon_${record.maHoaDon}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      message.success('Đã tải xuống file PDF thành công');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Không thể xuất file PDF: ' + error.message);
    }
  };

  const showEmailModal = (record) => {
    setSelectedInvoiceForEmail(record);
    setIsEmailModalVisible(true);
    emailForm.resetFields();
  };

  const handleEmailPDF = async (values) => {
    if (!selectedInvoiceForEmail) return;
    
    try {
      // Hiển thị loading message
      message.loading({ 
        content: 'Đang gửi email...', 
        key: 'sendEmail',
        duration: 0.5 // Thêm duration để message tự động đóng sau 0.5s
      });
      
      const response = await apiFetch(`${API_BASE_URL}/api/HoaDon/${selectedInvoiceForEmail.maHoaDon}/export-pdf/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          maHoaDon: selectedInvoiceForEmail.maHoaDon,
          email: values.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể gửi email');
      }

      // Đóng modal
      setIsEmailModalVisible(false);
      emailForm.resetFields();
      setSelectedInvoiceForEmail(null);

      // Đợi một chút để loading message biến mất
      setTimeout(() => {
        // Hiển thị thông báo thành công
        message.success({
          content: 'Đã gửi hóa đơn qua email thành công',
          duration: 3,
          style: {
            marginTop: '20vh',
          },
        });
      }, 600); // Đợi 600ms sau khi loading message biến mất

    } catch (error) {
      console.error('Email error:', error);
      // Hiển thị thông báo lỗi
      message.error({
        content: error.message || 'Không thể gửi email',
        duration: 3,
        style: {
          marginTop: '20vh',
        },
      });
    }
  };

  const showPhuThuModal = (record) => {
    setSelectedMaHoaDon(record.maHoaDon);
    fetchPhuThu(record.maHoaDon);
    setIsPhuThuModalVisible(true);
  };

  const handleAddPhuThu = () => {
    setEditingPhuThu(null);
    setIsPhuThuFormVisible(true);
  };

  const handleEditPhuThu = (record) => {
    setEditingPhuThu(record);
    setIsPhuThuFormVisible(true);
  };

  const handleDeletePhuThu = async (key) => {
    try {
      const [maHoaDon, index] = key.split('-');
      await apiFetch(`${API_BASE_URL}/api/HoaDon/${maHoaDon}/phu-thu/${index}`, {
        method: 'DELETE'
      });
      message.success('Xóa phụ thu thành công!');
      fetchPhuThu(maHoaDon);
    } catch (e) {
      message.error('Xóa phụ thu thất bại!');
    }
  };

  const handleStatusChange = async (newStatus, record) => {
    try {
      const url = `${API_BASE_URL}/api/HoaDon/${record.maHoaDon}/trang-thai${record.tenKhachHang ? `?tenKhachHang=${encodeURIComponent(record.tenKhachHang)}` : ''}`;
      
      const response = await apiFetch(url, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        body: JSON.stringify({ trangThai: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Cập nhật trạng thái thất bại!');
      }

      message.success('Cập nhật trạng thái thành công!');
      fetchHoaDons(); // Refresh the table data
    } catch (error) {
      console.error('Error updating status:', error);
      message.error(error.message || 'Cập nhật trạng thái thất bại!');
    }
  };

  const handleNameSearch = (value) => {
    setSearchName(value);
    // Gọi fetchHoaDons để lọc lại dữ liệu
    fetchHoaDons();
  };

  // Thêm useEffect để theo dõi thay đổi của searchStatus và searchName
  useEffect(() => {
    fetchHoaDons();
  }, [searchStatus, searchName]);

  // Add this function to handle search
  const handleCustomerSearch = (searchText) => {
    if (!searchText) {
      setFilteredKhachHang([]);
      return;
    }
    
    const filtered = khachHangList
      .filter(customer => 
        customer.hoTen?.toLowerCase().includes(searchText.toLowerCase())
      )
      .map(customer => ({
        value: customer.hoTen,
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{customer.hoTen}</span>
            <span style={{ color: '#888' }}>{customer.soCmnd}</span>
          </div>
        )
      }));
    
    setFilteredKhachHang(filtered);
  };

  const showDetailModal = (record) => {
    setSelectedHoaDon(record);
    setIsDetailModalVisible(true);
  };

  const handlePrint = async (record) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/HoaDon/${record.maHoaDon}/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf'
        },
        body: JSON.stringify({ maHoaDon: record.maHoaDon })
      });

      if (!response.ok) {
        throw new Error('Không thể tạo bản in hóa đơn');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Open PDF in new window
      window.open(url, '_blank');
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      message.success('Đã mở bản in hóa đơn');
    } catch (error) {
      console.error('Print error:', error);
      message.error('Không thể in hóa đơn: ' + error.message);
    }
  };

  // Add this new component for invoice details modal
  const InvoiceDetailsModal = ({ visible, onCancel, invoice }) => {
    if (!invoice) return null;

    return (
      <Modal
        title="Chi tiết hóa đơn"
        open={visible}
        onCancel={onCancel}
        footer={[
          <Button key="close" onClick={onCancel}>
            Đóng
          </Button>
        ]}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Descriptions bordered column={1} size="small" labelStyle={{ width: '140px' }}>
            <Descriptions.Item label="Mã hóa đơn">{invoice.maHoaDon}</Descriptions.Item>
            <Descriptions.Item label="Khách hàng">{invoice.tenKhachHang}</Descriptions.Item>
            <Descriptions.Item label="Nhân viên">{invoice.tenNhanVien}</Descriptions.Item>
            <Descriptions.Item label="Ngày lập">
              {moment(invoice.ngayLap).format('DD/MM/YYYY HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>

          <Descriptions bordered column={1} size="small" labelStyle={{ width: '140px' }}>
            <Descriptions.Item label="Trạng thái">
              <Tag color={invoice.trangThai === 'Đã thanh toán' ? 'green' : 'red'}>
                {invoice.trangThai}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức TT">{invoice.phuongThucThanhToan}</Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">{formatCurrency(invoice.tongTien)}</Descriptions.Item>
            <Descriptions.Item label="Phụ thu">{formatCurrency(invoice.phuThu || 0)}</Descriptions.Item>
          </Descriptions>
        </div>

        {invoice.chiTietHoaDons && invoice.chiTietHoaDons.length > 0 && (
          <>
            <Divider orientation="left">Chi tiết đặt phòng</Divider>
            <Table
              dataSource={invoice.chiTietHoaDons}
              columns={[
                {
                  title: 'Phòng',
                  dataIndex: 'maPhong',
                  key: 'maPhong',
                },
                {
                  title: 'Ngày nhận',
                  dataIndex: 'ngayNhan',
                  key: 'ngayNhan',
                  render: (text) => moment(text).format('DD/MM/YYYY'),
                },
                {
                  title: 'Ngày trả',
                  dataIndex: 'ngayTra',
                  key: 'ngayTra',
                  render: (text) => moment(text).format('DD/MM/YYYY'),
                },
                {
                  title: 'Thành tiền',
                  dataIndex: 'thanhTien',
                  key: 'thanhTien',
                  render: (text) => formatCurrency(text),
                },
                {
                  title: 'Dịch vụ đã sử dụng',
                  dataIndex: 'chiTietDichVus',
                  key: 'dichVu',
                  render: (dichVus) => {
                    if (!dichVus || dichVus.length === 0) return 'Không có';
                    return (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {dichVus.map((dv, index) => (
                          <li key={index}>
                            {dv.tenDichVu} (SL: {dv.soLuong}) - {formatCurrency(dv.thanhTien)}
                          </li>
                        ))}
                      </ul>
                    );
                  }
                }
              ]}
              pagination={false}
              rowKey="maDatPhong"
            />
          </>
        )}

        {invoice.chiTietDichVus && invoice.chiTietDichVus.length > 0 && (
          <>
            <Divider orientation="left">Tổng hợp dịch vụ</Divider>
            <Table
              dataSource={invoice.chiTietDichVus}
              columns={[
                {
                  title: 'Tên dịch vụ',
                  dataIndex: 'tenDichVu',
                  key: 'tenDichVu',
                },
                {
                  title: 'Số lượng',
                  dataIndex: 'soLuong',
                  key: 'soLuong',
                },
                {
                  title: 'Đơn giá',
                  dataIndex: 'donGia',
                  key: 'donGia',
                  render: (text) => formatCurrency(text),
                },
                {
                  title: 'Thành tiền',
                  dataIndex: 'thanhTien',
                  key: 'thanhTien',
                  render: (text) => formatCurrency(text),
                },
              ]}
              pagination={false}
              rowKey="maDichVu"
              summary={(pageData) => {
                const totalAmount = pageData.reduce((sum, record) => sum + (record.thanhTien || 0), 0);
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      Tổng tiền dịch vụ:
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} style={{ fontWeight: 'bold' }}>
                      {formatCurrency(totalAmount)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </>
        )}
      </Modal>
    );
  };

  const handlePhuThuOk = async (values) => {
    if (!selectedMaHoaDon) return;
    try {
      const data = {
        maDatPhong: values.maDatPhong,
        phuThu: values.phuThu,
        lyDo: values.lyDo
      };

      if (editingPhuThu) {
        await apiFetch(`${API_BASE_URL}/api/HoaDon/${selectedMaHoaDon}/phu-thu/${editingPhuThu.key.split('-')[1]}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        message.success('Cập nhật phụ thu thành công!');
      } else {
        await apiFetch(`${API_BASE_URL}/api/HoaDon/${selectedMaHoaDon}/phu-thu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        message.success('Thêm phụ thu thành công!');
      }
      setIsPhuThuFormVisible(false);
      fetchPhuThu(selectedMaHoaDon);
    } catch (e) {
      message.error(editingPhuThu ? 'Cập nhật phụ thu thất bại!' : 'Thêm phụ thu thất bại!');
    }
  };

  const handleFilterStatusChange = (value) => {
    setSearchStatus(value);
    fetchHoaDons();
  };

  // Handle table change (pagination, filters, sorter)
  const handleTableChange = (newPagination, filters, sorter) => {
    console.log('Table change:', newPagination);
    fetchHoaDons(newPagination.current, newPagination.pageSize);
  };

  const columns = [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'maHoaDon',
      key: 'maHoaDon',
      width: '10%',
    },
    {
      title: 'Tên khách hàng',
      dataIndex: 'tenKhachHang',
      key: 'tenKhachHang',
      width: '20%',
    },
    {
      title: 'Ngày lập',
      dataIndex: 'ngayLap',
      key: 'ngayLap',
      width: '15%',
      render: (text) => moment(text).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'tongTien',
      key: 'tongTien',
      width: '15%',
      render: (text) => formatCurrency(text),
    },
    {
      title: 'Phương thức thanh toán',
      dataIndex: 'phuongThucThanhToan',
      key: 'phuongThucThanhToan',
      width: '20%',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      width: '15%',
      render: (text, record) => {
        const getStatusColor = (status) => {
          switch (status) {
            case 'Đã thanh toán':
              return 'green';
            case 'Đã thanh toán trước':
              return 'blue';
            case 'Chưa thanh toán':
              return 'red';
            default:
              return 'default';
          }
        };

        return (
          <Select
            value={text}
            style={{
              width: '100%'
            }}
            className="status-select"
            bordered={false}
            dropdownMatchSelectWidth={false}
            onChange={(value) => handleStatusChange(value, record)}
          >
            <Select.Option value="Chưa thanh toán">
              <Tag color="red" style={{ margin: 0, width: '100%', textAlign: 'center' }}>
                Chưa thanh toán
              </Tag>
            </Select.Option>
            <Select.Option value="Đã thanh toán">
              <Tag color="green" style={{ margin: 0, width: '100%', textAlign: 'center' }}>
                Đã thanh toán
              </Tag>
            </Select.Option>
            <Select.Option value="Đã thanh toán trước">
              <Tag color="blue" style={{ margin: 0, width: '100%', textAlign: 'center' }}>
                Đã thanh toán trước
              </Tag>
            </Select.Option>
          </Select>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '20%',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => showDetailModal(record)}
            title="Xem chi tiết"
          >
            Chi tiết
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleExportPDF(record)}
            title="Tải PDF"
          >
            PDF
          </Button>
          <Button
            type="primary"
            icon={<MailOutlined />}
            onClick={() => showEmailModal(record)}
            title="Gửi qua email"
          >
            Email
          </Button>
        </Space>
      ),
    },
  ];

  // Update the status modal content
  const StatusModal = ({ visible, onCancel }) => {
    const [form] = Form.useForm();

    useEffect(() => {
      if (visible && selectedHoaDon) {
        form.setFieldsValue({
          trangThai: selectedHoaDon.trangThai
        });
      }
    }, [visible, selectedHoaDon, form]);

    return (
      <Modal
        title="Cập nhật trạng thái"
        visible={visible}
        onCancel={onCancel}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleUpdateStatus}
          layout="vertical"
        >
          <Form.Item
            name="trangThai"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select>
              <Select.Option value="Chưa Thanh Toán">Chưa thanh toán</Select.Option>
              <Select.Option value="Đã Thanh Toán">Đã thanh toán</Select.Option>
              <Select.Option value="Đã Hủy">Đã hủy</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Cập nhật
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  return (
    <div className="hoa-don-container">
      <div className="hoa-don-header">
        <h2>Quản lý hóa đơn</h2>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Input.Search
            placeholder="Tìm kiếm theo tên khách hàng"
            value={searchName}
            onChange={(e) => handleNameSearch(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            placeholder="Lọc theo trạng thái"
            style={{ width: 200 }}
            onChange={handleFilterStatusChange}
            value={searchStatus}
            allowClear
          >
            <Select.Option value="0">Chưa thanh toán</Select.Option>
            <Select.Option value="1">Đã thanh toán</Select.Option>
            <Select.Option value="2">Đã hủy</Select.Option>
          </Select>
          <Button type="primary" onClick={showAddModal}>
            Thêm hóa đơn
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={hoaDons}
        rowKey={(record) => record.maHoaDon}
        loading={loading}
        pagination={{
          ...pagination,
          showTotal: (total) => `Tổng số ${total} hóa đơn`,
          style: { textAlign: 'center' }
        }}
        onChange={handleTableChange}
        locale={{
          emptyText: 'Không có dữ liệu'
        }}
      />

      {/* Add Invoice Modal */}
      <Modal
        title="Thêm hóa đơn"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          layout="vertical"
          onFinish={handleOk}
          initialValues={{
            hoTenNhanVien: currentUser.hoTen,
            ngayLap: moment(),
            phuongThucThanhToan: 'Tiền mặt',
            trangThai: 'Chưa thanh toán'
          }}
        >
          <Form.Item
            label="Tên khách hàng"
            name="hoTenKhachHang"
            rules={[{ required: true, message: 'Vui lòng chọn khách hàng!' }]}
          >
            <Select
              showSearch
              placeholder="Chọn khách hàng"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={khachHangList.map(kh => ({
                value: kh.hoTen,
                label: kh.hoTen,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Tên nhân viên"
            name="hoTenNhanVien"
          >
            <Input 
              defaultValue={currentUser.hoTen}
              disabled 
              style={{ backgroundColor: '#f5f5f5', color: '#000' }}
            />
          </Form.Item>

          <Form.Item
            label="Mã đặt phòng"
            name="maDatPhongs"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một mã đặt phòng!' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn mã đặt phòng"
              style={{ width: '100%' }}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={datPhongList.map(dp => ({
                value: dp.maDatPhong,
                label: `Mã DP: ${dp.maDatPhong} - Phòng: ${dp.maPhong} - KH: ${dp.tenKhachHang}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Ngày lập"
            name="ngayLap"
            rules={[{ required: true, message: 'Vui lòng chọn ngày lập!' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              disabledDate={(current) => current && current > moment().endOf('day')}
            />
          </Form.Item>

          <Form.Item
            label="Phương thức thanh toán"
            name="phuongThucThanhToan"
            rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán!' }]}
          >
            <Select>
              <Select.Option value="Tiền mặt">Tiền mặt</Select.Option>
              <Select.Option value="Chuyển khoản">Chuyển khoản</Select.Option>
              <Select.Option value="Thẻ tín dụng">Thẻ tín dụng</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="trangThai"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select>
              <Select.Option value="Chưa thanh toán">Chưa thanh toán</Select.Option>
              <Select.Option value="Đã thanh toán">Đã thanh toán</Select.Option>
              <Select.Option value="Đã hủy">Đã hủy</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
            <Button type="primary" htmlType="submit">
              Thêm mới
            </Button>
              <Button onClick={() => setIsAddModalVisible(false)}>
                Hủy
            </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Payment Method Update Modal */}
      <Modal
        title="Cập nhật phương thức thanh toán"
        open={isPaymentModalVisible}
        onCancel={() => setIsPaymentModalVisible(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={handleUpdatePayment}
          initialValues={{ phuongThucThanhToan: selectedHoaDon?.phuongThucThanhToan }}
        >
          <Form.Item
            label="Phương thức thanh toán"
            name="phuongThucThanhToan"
            rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán!' }]}
          >
            <Select>
              <Select.Option value="Tiền mặt">Tiền mặt</Select.Option>
              <Select.Option value="Chuyển khoản">Chuyển khoản</Select.Option>
              <Select.Option value="Thẻ tín dụng">Thẻ tín dụng</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Cập nhật
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Surcharge Modal */}
      <Modal
        title="Quản lý phụ thu"
        open={isPhuThuModalVisible}
        onCancel={() => setIsPhuThuModalVisible(false)}
        footer={null}
        width={800}
      >
        <Button type="primary" onClick={handleAddPhuThu} style={{ marginBottom: 16 }}>
          Thêm phụ thu
        </Button>
        <Table
          columns={[
            {
              title: 'Mã đặt phòng',
              dataIndex: 'maDatPhong',
              key: 'maDatPhong',
            },
            {
              title: 'Phụ thu',
              dataIndex: 'phuThu',
              key: 'phuThu',
              render: (value) => `${value.toLocaleString('vi-VN')} đ`,
            },
            {
              title: 'Lý do',
              dataIndex: 'lyDo',
              key: 'lyDo',
            },
            {
              title: 'Thao tác',
              key: 'action',
              render: (_, record) => (
                <Space>
                  <Button onClick={() => handleEditPhuThu(record)}>Sửa</Button>
                  <Popconfirm
                    title="Bạn có chắc muốn xóa phụ thu này?"
                    onConfirm={() => handleDeletePhuThu(record.key)}
                    okText="Có"
                    cancelText="Không"
                  >
                    <Button danger>Xóa</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          dataSource={phuThuList}
          rowKey="key"
        />
      </Modal>

      {/* Surcharge Form Modal */}
      <Modal
        title={editingPhuThu ? 'Sửa phụ thu' : 'Thêm phụ thu'}
        open={isPhuThuFormVisible}
        onCancel={() => setIsPhuThuFormVisible(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={handlePhuThuOk}
          initialValues={editingPhuThu}
        >
          <Form.Item
            label="Mã đặt phòng"
            name="maDatPhong"
            rules={[{ required: true, message: 'Vui lòng nhập mã đặt phòng!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Phụ thu"
            name="phuThu"
            rules={[{ required: true, message: 'Vui lòng nhập phụ thu!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item
            label="Lý do"
            name="lyDo"
            rules={[{ required: true, message: 'Vui lòng nhập lý do!' }]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingPhuThu ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Status Update Modal */}
      <StatusModal
        visible={isStatusModalVisible}
        onCancel={() => setIsStatusModalVisible(false)}
      />

      {/* Email Modal */}
      <Modal
        title="Gửi hóa đơn qua Email"
        open={isEmailModalVisible}
        onCancel={() => {
          setIsEmailModalVisible(false);
          emailForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={emailForm}
          layout="vertical"
          onFinish={handleEmailPDF}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input placeholder="Nhập địa chỉ email" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Gửi
              </Button>
              <Button onClick={() => {
                setIsEmailModalVisible(false);
                emailForm.resetFields();
              }}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        visible={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        invoice={selectedHoaDon}
      />
    </div>
  );
}

export default HoaDon;
