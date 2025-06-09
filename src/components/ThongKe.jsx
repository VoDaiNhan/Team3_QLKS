import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, DatePicker, Space, 
  Typography, Spin, message, Select, Tabs
} from 'antd';
import { Column } from '@ant-design/plots';
import { apiFetch } from '../auth';
import dayjs from 'dayjs';
import './ThongKe.css';
import { UserOutlined, DollarOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const ThongKe = () => {
  const [loading, setLoading] = useState(false);
  const [statsData, setStatsData] = useState({
    thoiGian: [],
    soLuongKhachHang: [],
    tongDoanhThu: []
  });
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedDateRange, setSelectedDateRange] = useState([dayjs(), dayjs()]);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [activeTab, setActiveTab] = useState('1');

  // Khởi tạo dữ liệu mặc định khi component mount
  useEffect(() => {
    fetchDailyStats(selectedDate);
  }, []);

  // Xử lý chuyển tab
  useEffect(() => {
    switch (activeTab) {
      case '1':
        fetchDailyStats(selectedDate);
        break;
      case '2':
        fetchRangeStats(selectedDateRange);
        break;
      case '3':
        fetchMonthlyStats(selectedYear, selectedMonth);
        break;
      case '4':
        fetchYearlyStats(selectedYear);
        break;
      default:
        break;
    }
  }, [activeTab]);

  const processApiResponse = (results) => {
    if (!Array.isArray(results)) {
      console.error('Invalid results format:', results);
      return {
        thoiGian: [],
        soLuongKhachHang: [],
        tongDoanhThu: []
      };
    }
    return results.reduce((acc, result) => {
      if (result && result.data) {
        acc.thoiGian.push(result.data.thoiGian || '');
        acc.soLuongKhachHang.push(result.data.soLuongKhachHang || 0);
        acc.tongDoanhThu.push(result.data.tongDoanhThu || 0);
      }
      return acc;
    }, {
      thoiGian: [],
      soLuongKhachHang: [],
      tongDoanhThu: []
    });
  };

  const fetchDailyStats = async (date) => {
    setLoading(true);
    try {
      const dates = Array.from({ length: 6 }, (_, i) => {
        return dayjs(date).subtract(2, 'day').add(i, 'day').format('YYYY-MM-DD');
      });
      
      const promises = dates.map(d => 
        apiFetch(`https://qlks-0dvh.onrender.com/api/ThongKe/ngay?ngay=${d}`)
          .then(res => res.json())
          .catch(() => ({ data: { soLuongKhachHang: 0, tongDoanhThu: 0, thoiGian: d } }))
      );

      const results = await Promise.all(promises);
      const combinedData = {
        thoiGian: dates.map(d => dayjs(d).format('DD/MM/YYYY')),
        soLuongKhachHang: results.map(r => r.data?.soLuongKhachHang || 0),
        tongDoanhThu: results.map(r => r.data?.tongDoanhThu || 0)
      };
      setStatsData(combinedData);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      message.error('Lỗi khi tải thống kê theo ngày');
      setStatsData({
        thoiGian: [],
        soLuongKhachHang: [],
        tongDoanhThu: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyStats = async (year, month) => {
    setLoading(true);
    try {
      const months = Array.from({ length: 6 }, (_, i) => {
        const m = month - 2 + i;
        const y = year + Math.floor((m - 1) / 12);
        const adjustedMonth = ((m - 1) % 12) + 1;
        return { year: y, month: adjustedMonth };
      });

      const promises = months.map(({ year, month }) => 
        apiFetch(`https://qlks-0dvh.onrender.com/api/ThongKe/thang?nam=${year}&thang=${month}`)
          .then(res => res.json())
          .catch(() => ({ data: { soLuongKhachHang: 0, tongDoanhThu: 0, thoiGian: `${month}/${year}` } }))
      );

      const results = await Promise.all(promises);
      const combinedData = {
        thoiGian: months.map(({ year, month }) => `${month}/${year}`),
        soLuongKhachHang: results.map(r => r.data?.soLuongKhachHang || 0),
        tongDoanhThu: results.map(r => r.data?.tongDoanhThu || 0)
      };
      setStatsData(combinedData);
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      message.error('Lỗi khi tải thống kê theo tháng');
      setStatsData({
        thoiGian: [],
        soLuongKhachHang: [],
        tongDoanhThu: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchYearlyStats = async (year) => {
    setLoading(true);
    try {
      const years = Array.from({ length: 6 }, (_, i) => year - 2 + i);
      
      const promises = years.map(y => 
        apiFetch(`https://qlks-0dvh.onrender.com/api/ThongKe/nam?nam=${y}`)
          .then(res => res.json())
          .catch(() => ({ data: { soLuongKhachHang: 0, tongDoanhThu: 0, thoiGian: y.toString() } }))
      );

      const results = await Promise.all(promises);
      const combinedData = {
        thoiGian: years.map(y => y.toString()),
        soLuongKhachHang: results.map(r => r.data?.soLuongKhachHang || 0),
        tongDoanhThu: results.map(r => r.data?.tongDoanhThu || 0)
      };
      setStatsData(combinedData);
    } catch (error) {
      console.error('Error fetching yearly stats:', error);
      message.error('Lỗi khi tải thống kê theo năm');
      setStatsData({
        thoiGian: [],
        soLuongKhachHang: [],
        tongDoanhThu: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRangeStats = async (dateRange) => {
    if (!dateRange || dateRange.length !== 2) return;
    
    setLoading(true);
    try {
      const startDate = dateRange[0];
      const endDate = dateRange[1];
      const response = await apiFetch(
        `https://qlks-0dvh.onrender.com/api/ThongKe/khoang-thoi-gian?tuNgay=${startDate.format('YYYY-MM-DD')}&denNgay=${endDate.format('YYYY-MM-DD')}`
      );
      const data = await response.json();
      
      setStatsData({
        thoiGian: [data.data.thoiGian],
        soLuongKhachHang: [data.data.soLuongKhachHang],
        tongDoanhThu: [data.data.tongDoanhThu]
      });
    } catch (error) {
      console.error('Error fetching range stats:', error);
      message.error('Lỗi khi tải thống kê theo khoảng thời gian');
      setStatsData({
        thoiGian: [],
        soLuongKhachHang: [],
        tongDoanhThu: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Config cho biểu đồ khách hàng
  const customerConfig = {
    data: statsData.thoiGian.map((time, index) => ({
      type: 'Số lượng khách hàng',
      value: statsData.soLuongKhachHang[index] || 0,
      time: time
    })),
    xField: 'time',
    yField: 'value',
    seriesField: 'type',
    columnStyle: {
      radius: [8, 8, 0, 0],
      fill: '#4096ff',
      shadowColor: 'rgba(0,0,0,0.1)',
      shadowBlur: 10
    },
    maxColumnWidth: 35,
    minColumnWidth: 20,
    xAxis: {
      label: {
        autoRotate: false,
        autoHide: false,
        autoEllipsis: false,
        formatter: (text) => text,
        style: {
          fill: '#595959',
          fontSize: 12
        }
      },
      line: {
        style: {
          stroke: '#E5E5E5'
        }
      },
      tickLine: {
        style: {
          stroke: '#E5E5E5'
        }
      }
    },
    yAxis: {
      min: 0,
      label: null,
      tickInterval: 1,
      grid: {
        line: {
          style: {
            stroke: '#E5E5E5',
            lineDash: [4, 4]
          }
        }
      }
    },
    height: 300,
    autoFit: true,
    padding: [30, 20, 50, 40],
    theme: {
      geometries: {
        interval: {
          rect: {
            active: {
              style: {
                fill: '#1890ff',
              }
            }
          }
        }
      }
    },
    label: {
      position: 'top',
      style: {
        fontSize: 12,
        fontWeight: 500,
        fill: '#595959',
      },
      formatter: (data) => {
        if (data && typeof data.value !== 'undefined' && data.value > 0) {
          return `${data.value}`;
        }
        return '';
      }
    }
  };

  // Config cho biểu đồ doanh thu
  const revenueConfig = {
    data: statsData.thoiGian.map((time, index) => ({
      type: 'Doanh thu',
      value: statsData.tongDoanhThu[index] || 0,
      time: time
    })),
    xField: 'time',
    yField: 'value',
    seriesField: 'type',
    columnStyle: {
      radius: [8, 8, 0, 0],
      fill: '#52c41a',
      shadowColor: 'rgba(0,0,0,0.1)',
      shadowBlur: 10
    },
    maxColumnWidth: 35,
    minColumnWidth: 20,
    xAxis: {
      label: {
        autoRotate: false,
        autoHide: false,
        autoEllipsis: false,
        formatter: (text) => text,
        style: {
          fill: '#595959',
          fontSize: 12
        }
      },
      line: {
        style: {
          stroke: '#E5E5E5'
        }
      },
      tickLine: {
        style: {
          stroke: '#E5E5E5'
        }
      }
    },
    yAxis: {
      min: 0,
      label: null,
      tickInterval: 1,
      grid: {
        line: {
          style: {
            stroke: '#E5E5E5',
            lineDash: [4, 4]
          }
        }
      }
    },
    height: 300,
    autoFit: true,
    padding: [30, 20, 50, 40],
    theme: {
      geometries: {
        interval: {
          rect: {
            active: {
              style: {
                fill: '#389e0d',
              }
            }
          }
        }
      }
    },
    label: {
      position: 'top',
      style: {
        fontSize: 12,
        fontWeight: 500,
        fill: '#595959',
      },
      formatter: (data) => {
        if (data && typeof data.value !== 'undefined' && data.value > 0) {
          return `${data.value.toLocaleString('vi-VN')} VNĐ`;
        }
        return '';
      }
    }
  };

  const renderStatisticCard = (title, value, icon, color, bgColor) => {
    // Lấy giá trị thống kê dựa trên thời gian được chọn
    let displayValue = value;
    if (activeTab === '1' && selectedDate) {
      // Tìm index của ngày được chọn trong mảng thời gian
      const selectedDateStr = dayjs(selectedDate).format('DD/MM/YYYY');
      const index = statsData.thoiGian.findIndex(t => t === selectedDateStr);
      if (index !== -1) {
        displayValue = title.includes('khách') 
          ? statsData.soLuongKhachHang[index]
          : statsData.tongDoanhThu[index];
      }
    } else if (activeTab === '3' && selectedMonth && selectedYear) {
      // Tìm index của tháng được chọn
      const selectedMonthStr = `${selectedMonth}/${selectedYear}`;
      const index = statsData.thoiGian.findIndex(t => t === selectedMonthStr);
      if (index !== -1) {
        displayValue = title.includes('khách')
          ? statsData.soLuongKhachHang[index]
          : statsData.tongDoanhThu[index];
      }
    } else if (activeTab === '4' && selectedYear) {
      // Tìm index của năm được chọn
      const selectedYearStr = selectedYear.toString();
      const index = statsData.thoiGian.findIndex(t => t === selectedYearStr);
      if (index !== -1) {
        displayValue = title.includes('khách')
          ? statsData.soLuongKhachHang[index]
          : statsData.tongDoanhThu[index];
      }
    }

    // Định dạng giá trị hiển thị
    const formattedValue = title.includes('khách')
      ? `${displayValue || 0} khách`
      : `${(displayValue || 0).toLocaleString('vi-VN')} VNĐ`;

    return (
      <Card bodyStyle={{ padding: '20px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <div style={{ fontSize: '14px', color: '#8c8c8c' }}>{title}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>{formattedValue}</div>
          </Col>
          <Col>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '24px', 
              backgroundColor: bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {icon}
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  const items = [
    {
      key: '1',
      label: 'Theo ngày',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <DatePicker 
            value={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              fetchDailyStats(date);
            }}
            format="DD/MM/YYYY"
          />
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  {renderStatisticCard(
                    'Tổng số khách hàng',
                    0, // Giá trị này sẽ được tính toán trong renderStatisticCard
                    <UserOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
                    '#1890ff',
                    '#e6f4ff'
                  )}
                </Col>
                <Col span={24}>
                  <Card 
                    title={
                      <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                        Biểu đồ số lượng khách hàng
                      </div>
                    } 
                    bodyStyle={{ height: '300px', padding: '20px', overflow: 'hidden' }}
                  >
                    <Column {...customerConfig} />
                  </Card>
                </Col>
              </Row>
            </Col>
            <Col span={12}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  {renderStatisticCard(
                    'Tổng doanh thu',
                    0, // Giá trị này sẽ được tính toán trong renderStatisticCard
                    <DollarOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
                    '#52c41a',
                    '#f6ffed'
                  )}
                </Col>
                <Col span={24}>
                  <Card 
                    title={
                      <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                        Biểu đồ doanh thu
                      </div>
                    } 
                    bodyStyle={{ height: '300px', padding: '20px', overflow: 'hidden' }}
                  >
                    <Column {...revenueConfig} />
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      key: '2',
      label: 'Theo khoảng thời gian',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <RangePicker
            value={selectedDateRange}
            onChange={(dates) => {
              setSelectedDateRange(dates);
              fetchRangeStats(dates);
            }}
            format="DD/MM/YYYY"
          />
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  {renderStatisticCard(
                    'Tổng số khách hàng',
                    0, // Giá trị này sẽ được tính toán trong renderStatisticCard
                    <UserOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
                    '#1890ff',
                    '#e6f4ff'
                  )}
                </Col>
                <Col span={24}>
                  <Card 
                    title={
                      <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                        Biểu đồ số lượng khách hàng
                      </div>
                    } 
                    bodyStyle={{ height: '300px', padding: '20px', overflow: 'hidden' }}
                  >
                    <Column {...customerConfig} />
                  </Card>
                </Col>
              </Row>
            </Col>
            <Col span={12}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  {renderStatisticCard(
                    'Tổng doanh thu',
                    0, // Giá trị này sẽ được tính toán trong renderStatisticCard
                    <DollarOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
                    '#52c41a',
                    '#f6ffed'
                  )}
                </Col>
                <Col span={24}>
                  <Card 
                    title={
                      <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                        Biểu đồ doanh thu
                      </div>
                    } 
                    bodyStyle={{ height: '300px', padding: '20px', overflow: 'hidden' }}
                  >
                    <Column {...revenueConfig} />
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      key: '3',
      label: 'Theo tháng',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space>
            <Select
              value={selectedYear}
              onChange={(value) => {
                setSelectedYear(value);
                fetchMonthlyStats(value, selectedMonth);
              }}
              style={{ width: 100 }}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <Select.Option key={dayjs().year() - i} value={dayjs().year() - i}>
                  {dayjs().year() - i}
                </Select.Option>
              ))}
            </Select>
            <Select
              value={selectedMonth}
              onChange={(value) => {
                setSelectedMonth(value);
                fetchMonthlyStats(selectedYear, value);
              }}
              style={{ width: 100 }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <Select.Option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </Select.Option>
              ))}
            </Select>
          </Space>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  {renderStatisticCard(
                    'Tổng số khách hàng',
                    0, // Giá trị này sẽ được tính toán trong renderStatisticCard
                    <UserOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
                    '#1890ff',
                    '#e6f4ff'
                  )}
                </Col>
                <Col span={24}>
                  <Card 
                    title={
                      <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                        Biểu đồ số lượng khách hàng
                      </div>
                    } 
                    bodyStyle={{ height: '300px', padding: '20px', overflow: 'hidden' }}
                  >
                    <Column {...customerConfig} />
                  </Card>
                </Col>
              </Row>
            </Col>
            <Col span={12}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  {renderStatisticCard(
                    'Tổng doanh thu',
                    0, // Giá trị này sẽ được tính toán trong renderStatisticCard
                    <DollarOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
                    '#52c41a',
                    '#f6ffed'
                  )}
                </Col>
                <Col span={24}>
                  <Card 
                    title={
                      <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                        Biểu đồ doanh thu
                      </div>
                    } 
                    bodyStyle={{ height: '300px', padding: '20px', overflow: 'hidden' }}
                  >
                    <Column {...revenueConfig} />
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      key: '4',
      label: 'Theo năm',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Select 
            value={selectedYear}
            onChange={(value) => {
              setSelectedYear(value);
              fetchYearlyStats(value);
            }}
            style={{ width: 100 }}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <Select.Option key={dayjs().year() - i} value={dayjs().year() - i}>
                {dayjs().year() - i}
              </Select.Option>
            ))}
          </Select>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  {renderStatisticCard(
                    'Tổng số khách hàng',
                    0, // Giá trị này sẽ được tính toán trong renderStatisticCard
                    <UserOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
                    '#1890ff',
                    '#e6f4ff'
                  )}
                </Col>
                <Col span={24}>
                  <Card 
                    title={
                      <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                        Biểu đồ số lượng khách hàng
                      </div>
                    } 
                    bodyStyle={{ height: '300px', padding: '20px', overflow: 'hidden' }}
                  >
                    <Column {...customerConfig} />
                  </Card>
                </Col>
              </Row>
            </Col>
            <Col span={12}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  {renderStatisticCard(
                    'Tổng doanh thu',
                    0, // Giá trị này sẽ được tính toán trong renderStatisticCard
                    <DollarOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
                    '#52c41a',
                    '#f6ffed'
                  )}
                </Col>
                <Col span={24}>
                  <Card 
                    title={
                      <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                        Biểu đồ doanh thu
                      </div>
                    } 
                    bodyStyle={{ height: '300px', padding: '20px', overflow: 'hidden' }}
                  >
                    <Column {...revenueConfig} />
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Space>
      ),
    },
  ];

  return (
    <div className="thongke-container">
      <Title level={2}>Thống kê</Title>
      <Spin spinning={loading}>
        <Tabs 
          defaultActiveKey="1" 
          activeKey={activeTab}
          items={items} 
          onChange={(key) => setActiveTab(key)}
        />
      </Spin>
    </div>
  );
};

export default ThongKe;
