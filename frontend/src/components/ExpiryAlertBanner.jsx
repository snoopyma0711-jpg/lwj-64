import { useState, useEffect } from 'react';
import { Alert, Space, Tag, Typography, Badge } from 'antd';
import { WarningOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getFridgeAlerts } from '../api/budget';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const ExpiryAlertBanner = () => {
  const [alerts, setAlerts] = useState([]);
  const [visible, setVisible] = useState(true);
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    try {
      const response = await getFridgeAlerts();
      setAlerts(response.data);
    } catch (error) {
      console.error('获取临期提醒失败');
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    navigate('/fridge');
  };

  if (alerts.length === 0 || !visible) {
    return null;
  }

  const expiredCount = alerts.filter(a => a.expiryStatus?.status === 'expired').length;
  const warningCount = alerts.filter(a => a.expiryStatus?.status === 'warning').length;

  const getDaysText = (item) => {
    const daysLeft = item.expiryStatus?.daysLeft;
    if (daysLeft === null || daysLeft === undefined) return '';
    if (daysLeft < 0) return `已过期 ${Math.abs(daysLeft)} 天`;
    if (daysLeft === 0) return '今天过期';
    return `还剩 ${daysLeft} 天`;
  };

  const alertType = expiredCount > 0 ? 'error' : 'warning';

  return (
    <Alert
      type={alertType}
      showIcon
      closable
      onClose={() => setVisible(false)}
      style={{ marginBottom: 16, cursor: 'pointer' }}
      onClick={handleClick}
      icon={
        <Space>
          {expiredCount > 0 && <Badge count={expiredCount} color="#ff4d4f" offset={[0, -5]} />}
          <WarningOutlined style={{ color: alertType === 'error' ? '#ff4d4f' : '#faad14', fontSize: 20 }} />
        </Space>
      }
      message={
        <Space size={8} wrap>
          <Text strong style={{ fontSize: 15 }}>
            {expiredCount > 0 ? '⚠️ 食材临期预警！' : '⏰ 食材即将过期'}
          </Text>
          {alerts.slice(0, 5).map((item, index) => (
            <Tag
              key={item.id}
              color={item.expiryStatus?.status === 'expired' ? 'red' : 'orange'}
              icon={item.expiryStatus?.status === 'expired' ? <CloseCircleOutlined /> : <ClockCircleOutlined />}
              style={{ margin: 0 }}
            >
              <Text strong>{item.ingredientName}</Text>
              <Text type="secondary" style={{ marginLeft: 4 }}>
                ({getDaysText(item)})
              </Text>
            </Tag>
          ))}
          {alerts.length > 5 && (
            <Tag color="default">+{alerts.length - 5} 更多</Tag>
          )}
          <Text type="primary" style={{ marginLeft: 8 }}>点击查看详情 →</Text>
        </Space>
      }
      description={
        <Space>
          {expiredCount > 0 && (
            <Tag color="red">{expiredCount} 种已过期</Tag>
          )}
          {warningCount > 0 && (
            <Tag color="orange">{warningCount} 种即将过期</Tag>
          )}
          <Text type="secondary">
            建议尽快使用或处理，避免浪费！菜谱搜索已优先推荐消耗这些食材的菜谱。
          </Text>
        </Space>
      }
    />
  );
};

export default ExpiryAlertBanner;
