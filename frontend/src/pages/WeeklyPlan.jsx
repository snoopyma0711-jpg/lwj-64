import { useState, useEffect } from 'react';
import { Card, List, Button, Checkbox, Space, Typography, Tag, Popconfirm, message, Row, Col, Divider, Empty, Badge, Tooltip } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, ClearOutlined, CheckCircleOutlined, ClockCircleOutlined, DollarOutlined, InfoCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
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
      message.success('已清空本周计划，花销已自动记录');
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
  const totalEstimatedPrice = weeklyPlan?.totalEstimatedPrice || 0;
  const pricedItemCount = weeklyPlan?.pricedItemCount || 0;
  const unpricedItemCount = weeklyPlan?.unpricedItemCount || 0;

  const purchasedPrice = shoppingItems
    .filter(item => item.purchased && item.isPriced)
    .reduce((sum, item) => sum + item.estimatedPrice, 0);

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>📅 本周计划 & 购物清单</Title>
        {recipes.length > 0 && (
          <Popconfirm
            title="确定要清空本周计划吗？"
            description={
              <div>
                <p>购物清单也会同步清空。</p>
                {purchasedCount > 0 && (
                  <p style={{ color: '#fa8c16' }}>
                    已勾选"已购买"的 <b>{purchasedCount}</b> 项食材将被记录到周花销中。
                  </p>
                )}
              </div>
            }
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
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <ShoppingCartOutlined style={{ color: '#fa8c16' }} />
                  <span>购物清单</span>
                  {shoppingItems.length > 0 && (
                    <Tag color={purchasedCount === shoppingItems.length ? 'success' : 'processing'}>
                      {purchasedCount}/{shoppingItems.length} 已买
                    </Tag>
                  )}
                </Space>
                {shoppingItems.length > 0 && (
                  <Space>
                    <Tag color="orange">
                      <DollarOutlined /> 已定价 {pricedItemCount} 项
                    </Tag>
                    {unpricedItemCount > 0 && (
                      <Tooltip title="点击下方按钮录入食材价格">
                        <Tag 
                          color="warning" 
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate('/ingredient-prices')}
                        >
                          <QuestionCircleOutlined /> 未定价 {unpricedItemCount} 项
                        </Tag>
                      </Tooltip>
                    )}
                  </Space>
                )}
              </Space>
            }
            extra={
              shoppingItems.length > 0 && (
                <Button 
                  type="link" 
                  size="small" 
                  icon={<DollarOutlined />}
                  onClick={() => navigate('/ingredient-prices')}
                >
                  管理价格
                </Button>
              )
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
                      <Space style={{ width: '100%', justifyContent: 'space-between' }} onClick={() => handleTogglePurchased(item)}>
                        <Space>
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
                        <Space>
                          {item.isPriced ? (
                            <Space>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                ¥{item.unitPrice}/{item.unit.replace('元/', '')}
                              </Text>
                              <Tag color="orange" style={{ margin: 0 }}>
                                ¥{item.estimatedPrice.toFixed(2)}
                              </Tag>
                            </Space>
                          ) : (
                            <Tooltip title="点击去录入该食材价格">
                              <Tag 
                                color="default" 
                                style={{ cursor: 'pointer', margin: 0 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/ingredient-prices');
                                }}
                              >
                                未定价
                              </Tag>
                            </Tooltip>
                          )}
                        </Space>
                      </Space>
                    </List.Item>
                  )}
                />
                
                <Divider style={{ margin: '16px 0' }} />
                
                <Card 
                  size="small" 
                  style={{ background: '#fffbe6', border: '1px solid #ffe58f' }}
                >
                  <Row gutter={16} align="middle">
                    <Col span={12}>
                      <Space>
                        <DollarOutlined style={{ color: '#fa8c16' }} />
                        <Text type="secondary">清单预估总价：</Text>
                        <Text strong style={{ fontSize: 24, color: '#fa8c16' }}>
                          ¥{totalEstimatedPrice.toFixed(2)}
                        </Text>
                      </Space>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                      <Space direction="vertical" size={0} align="end">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          已购买食材：
                          <Text strong style={{ color: '#52c41a', marginLeft: 4 }}>
                            ¥{purchasedPrice.toFixed(2)}
                          </Text>
                        </Text>
                        {unpricedItemCount > 0 && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <InfoCircleOutlined /> {unpricedItemCount} 项未定价，未计入总价
                          </Text>
                        )}
                      </Space>
                    </Col>
                  </Row>
                </Card>

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
