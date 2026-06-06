import { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Typography, Empty, Tag, Space } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getExpenseTrend } from '../api/budget';
import { RiseOutlined, FallOutlined, ShoppingOutlined, DollarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ExpenseTrend = () => {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTrend = async () => {
    setLoading(true);
    try {
      const response = await getExpenseTrend(8);
      setTrendData(response.data);
    } catch (error) {
      console.error('获取趋势数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrend();
  }, []);

  const chartData = trendData.map(item => ({
    name: `第${item.weekNumber}周`,
    fullName: item.weekLabel,
    金额: parseFloat(item.totalAmount),
    食材数: parseInt(item.itemCount)
  }));

  const totalAmount = trendData.reduce((sum, item) => sum + parseFloat(item.totalAmount), 0);
  const avgAmount = trendData.length > 0 ? (totalAmount / trendData.length).toFixed(2) : 0;
  const maxAmount = trendData.length > 0 ? Math.max(...trendData.map(item => parseFloat(item.totalAmount))).toFixed(2) : 0;
  const minAmount = trendData.length > 0 ? Math.min(...trendData.map(item => parseFloat(item.totalAmount))).toFixed(2) : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: '#fff', padding: 12, border: '1px solid #f0f0f0', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <Text strong>{data.fullName}</Text>
          <br />
          <Text type="secondary">支出金额：</Text>
          <Text strong style={{ color: '#fa8c16' }}>¥{data.金额.toFixed(2)}</Text>
          <br />
          <Text type="secondary">已购食材：</Text>
          <Text strong>{data.食材数} 项</Text>
        </div>
      );
    }
    return null;
  };

  const getTrendIndicator = () => {
    if (trendData.length < 2) return null;
    const lastTwo = trendData.slice(-2);
    const diff = parseFloat(lastTwo[1].totalAmount) - parseFloat(lastTwo[0].totalAmount);
    if (diff > 0) {
      return (
        <Tag color="red" icon={<RiseOutlined />}>
          较上周增加 ¥{diff.toFixed(2)}
        </Tag>
      );
    } else if (diff < 0) {
      return (
        <Tag color="green" icon={<FallOutlined />}>
          较上周减少 ¥{Math.abs(diff).toFixed(2)}
        </Tag>
      );
    }
    return <Tag color="blue">与上周持平</Tag>;
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>📊 周花销趋势</Title>
          <Text type="secondary">查看最近8周的买菜花销变化</Text>
        </div>
        {getTrendIndicator()}
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="最近8周总支出"
              value={totalAmount}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#fa8c16' }} />}
              suffix="元"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="周均支出"
              value={avgAmount}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
              suffix="元"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="最高单周支出"
              value={maxAmount}
              precision={2}
              prefix={<RiseOutlined style={{ color: '#f5222d' }} />}
              suffix="元"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="最低单周支出"
              value={minAmount}
              precision={2}
              prefix={<FallOutlined style={{ color: '#52c41a' }} />}
              suffix="元"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <ShoppingOutlined style={{ color: '#fa8c16' }} />
            <span>花销趋势图</span>
            <Tag color="orange">最近 {trendData.length} 周</Tag>
          </Space>
        }
        loading={loading}
      >
        {trendData.length === 0 ? (
          <Empty
            description={
              <div>
                <Text>还没有花销记录</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  清空周计划时会自动记录已购食材的花销
                </Text>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            <div style={{ height: 400, width: '100%', minWidth: 600, minHeight: 300 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={600} minHeight={300}>
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#8c8c8c', fontSize: 12 }}
                    axisLine={{ stroke: '#d9d9d9' }}
                  />
                  <YAxis 
                    tick={{ fill: '#8c8c8c', fontSize: 12 }}
                    axisLine={{ stroke: '#d9d9d9' }}
                    tickFormatter={(value) => `¥${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="金额"
                    stroke="#fa8c16"
                    strokeWidth={4}
                    dot={{ fill: '#fa8c16', stroke: '#fff', strokeWidth: 2, r: 7 }}
                    activeDot={{ r: 10, fill: '#fa8c16', stroke: '#fff', strokeWidth: 2 }}
                    name="支出金额 (元)"
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 说明：每周清空计划时，系统会自动统计所有已勾选"已购买"食材的预估花费并保存为历史记录。未定价的食材不参与统计。
              </Text>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ExpenseTrend;
