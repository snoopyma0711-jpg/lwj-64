import { useState, useEffect } from 'react';
import { Card, List, Button, Checkbox, Space, Typography, Tag, Popconfirm, message, Row, Col, Divider, Empty, Badge } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, ClearOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import request from '../api/request';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const getDifficultyClass = (difficulty) => {
  switch (difficulty) {
    case '简单': return 'difficulty-easy';
    case '中等': return 'difficulty-medium';
    case '困难': return 'difficulty-hard';
    default: return '';
  }
};

const WeeklyPlan = () => {
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchWeeklyPlan = async () => {
    setLoading(true);
    try {
      const response = await request.get('/weekly-plans/current');
      setWeeklyPlan(response.data);
    } catch (error) {
      message.error('获取周计划失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyPlan();
  }, []);

  const handleRemoveRecipe = async (recipeId) => {
    try {
      await request.post('/weekly-plans/remove-recipe', { recipeId });
      message.success('已从周计划中移除');
      fetchWeeklyPlan();
    } catch (error) {
      message.error('移除失败');
    }
  };

  const handleTogglePurchased = async (item) => {
    try {
      await request.put(`/weekly-plans/shopping-item/${item.id}`, {
        purchased: !item.purchased
      });
      fetchWeeklyPlan();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleClearPlan = async () => {
    try {
      await request.delete('/weekly-plans/clear');
      message.success('已清空本周计划');
      fetchWeeklyPlan();
    } catch (error) {
      message.error('清空失败');
    }
  };

  if (loading && !weeklyPlan) {
    return <div style={{ textAlign: 'center', padding: 48 }}>加载中...</div>;
  }

  const recipes = weeklyPlan?.recipes || [];
  const shoppingItems = weeklyPlan?.shoppingItems || [];
  const purchasedCount = shoppingItems.filter(item => item.purchased).length;

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>📅 本周计划 & 购物清单</Title>
        {recipes.length > 0 && (
          <Popconfirm
            title="确定要清空本周计划吗？购物清单也会同步清空。"
            onConfirm={handleClearPlan}
            okText="确定"
            cancelText="取消"
          >
            <Button danger icon={<ClearOutlined />}>
              清空本周计划
            </Button>
          </Popconfirm>
        )}
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <span>🍽️ 本周菜谱</span>
                <Badge count={recipes.length} style={{ backgroundColor: '#fa8c16' }} />
              </Space>
            }
          >
            {recipes.length === 0 ? (
              <Empty
                description="还没有添加菜谱"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={() => navigate('/recipes')} style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>
                  去添加菜谱
                </Button>
              </Empty>
            ) : (
              <List
                dataSource={recipes}
                renderItem={(recipe) => (
                  <List.Item
                    key={recipe.id}
                    actions={[
                      <Popconfirm
                        title="确定要移除这个菜谱吗？"
                        onConfirm={() => handleRemoveRecipe(recipe.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button type="text" danger icon={<DeleteOutlined />} size="small">
                          移除
                        </Button>
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong style={{ cursor: 'pointer' }} onClick={() => navigate(`/recipes/${recipe.id}`)}>
                            {recipe.name}
                          </Text>
                          <span className={`difficulty-tag ${getDifficultyClass(recipe.difficulty)}`}>
                            {recipe.difficulty}
                          </span>
                        </Space>
                      }
                      description={
                        <Space>
                          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                          <Text type="secondary">{recipe.estimatedTime}分钟</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <ShoppingCartOutlined style={{ color: '#fa8c16' }} />
                <span>购物清单</span>
                {shoppingItems.length > 0 && (
                  <Tag color={purchasedCount === shoppingItems.length ? 'success' : 'processing'}>
                    {purchasedCount}/{shoppingItems.length} 已买
                  </Tag>
                )}
              </Space>
            }
          >
            {shoppingItems.length === 0 ? (
              <Empty
                description="添加菜谱后自动生成购物清单"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <ProgressBar 
                    percent={shoppingItems.length > 0 ? Math.round((purchasedCount / shoppingItems.length) * 100) : 0} 
                  />
                </div>
                <List
                  dataSource={shoppingItems}
                  renderItem={(item) => (
                    <List.Item key={item.id}>
                      <Space style={{ width: '100%' }} onClick={() => handleTogglePurchased(item)}>
                        <Checkbox checked={item.purchased} />
                        <Text 
                          strong 
                          className={item.purchased ? 'shopping-item-purchased' : ''}
                        >
                          {item.ingredientName}
                        </Text>
                        <Text 
                          type="secondary"
                          className={item.purchased ? 'shopping-item-purchased' : ''}
                        >
                          {item.quantity}
                        </Text>
                        {item.purchased && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                      </Space>
                    </List.Item>
                  )}
                />
                {purchasedCount === shoppingItems.length && shoppingItems.length > 0 && (
                  <div style={{ marginTop: 16, textAlign: 'center', padding: 16, background: '#f6ffed', borderRadius: 8 }}>
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                      <Text strong style={{ color: '#52c41a' }}>太棒了！所有食材都已购买完成！</Text>
                    </Space>
                  </div>
                )}
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const ProgressBar = ({ percent }) => {
  return (
    <div style={{ 
      width: '100%', 
      height: 8, 
      background: '#f0f0f0', 
      borderRadius: 4,
      overflow: 'hidden'
    }}>
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          background: percent === 100 ? '#52c41a' : '#fa8c16',
          transition: 'width 0.3s ease'
        }}
      />
    </div>
  );
};

export default WeeklyPlan;
