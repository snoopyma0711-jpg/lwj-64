import { useState, useEffect } from 'react';
import { Card, List, Button, Checkbox, Space, Typography, Tag, Popconfirm, message, Row, Col, Divider, Empty, Badge, Tooltip, Modal, Form, InputNumber, Progress, Statistic, Drawer } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, ClearOutlined, CheckCircleOutlined, ClockCircleOutlined, DollarOutlined, InfoCircleOutlined, QuestionCircleOutlined, FireOutlined, SwapOutlined, SettingOutlined, ArrowDownOutlined, ExclamationCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import request from '../api/request';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReplacementSuggestions, replaceRecipe, updateCalorieGoal } from '../api/budget';

const { Title, Text } = Typography;

const getDifficultyClass = (difficulty) => {
  switch (difficulty) {
    case '简单': return 'difficulty-easy';
    case '中等': return 'difficulty-medium';
    case '困难': return 'difficulty-hard';
    default: return '';
  }
};

const MACRO_COLORS = {
  protein: '#1890ff',
  carbs: '#52c41a',
  fat: '#fa8c16'
};

const WeeklyPlan = () => {
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalForm] = Form.useForm();
  const [replacementDrawerVisible, setReplacementDrawerVisible] = useState(false);
  const [replacingRecipe, setReplacingRecipe] = useState(null);
  const [replacementSuggestions, setReplacementSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [recipeNutritionMap, setRecipeNutritionMap] = useState({});

  const fetchWeeklyPlan = async () => {
    setLoading(true);
    try {
      const response = await request.get('/weekly-plans/current');
      setWeeklyPlan(response.data);
      
      const nutritionMap = {};
      if (response.data.nutrition?.recipeNutrition) {
        response.data.nutrition.recipeNutrition.forEach(nut => {
          nutritionMap[nut.recipeId] = nut;
        });
      }
      setRecipeNutritionMap(nutritionMap);
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

  const handleGoalSubmit = async (values) => {
    try {
      const response = await updateCalorieGoal(values.dailyCalorieGoal);
      updateUser({ dailyCalorieGoal: response.data.user.dailyCalorieGoal });
      message.success('热量目标已更新');
      setGoalModalVisible(false);
      fetchWeeklyPlan();
    } catch (error) {
      message.error(error.response?.data?.error || '更新失败');
    }
  };

  const getCalorieWarning = () => {
    const nutrition = weeklyPlan?.nutrition;
    const goal = weeklyPlan?.user?.dailyCalorieGoal || user?.dailyCalorieGoal || 2000;
    
    if (!nutrition || nutrition.dailyAverageCalories === 0) {
      return null;
    }
    
    const dailyAvg = nutrition.dailyAverageCalories;
    const eightyPercent = goal * 0.8;
    
    if (dailyAvg > goal) {
      return {
        type: 'error',
        color: '#ff4d4f',
        bgColor: '#fff1f0',
        borderColor: '#ffa39e',
        message: `⚠️ 日均热量 ${dailyAvg} 千卡，超过目标 ${goal} 千卡 ${(dailyAvg - goal)} 千卡！`,
        description: '建议替换高热量菜谱或减少食材用量',
        showReplacement: true
      };
    } else if (dailyAvg < eightyPercent) {
      return {
        type: 'warning',
        color: '#faad14',
        bgColor: '#fffbe6',
        borderColor: '#ffe58f',
        message: `💡 日均热量 ${dailyAvg} 千卡，低于目标的80%（${Math.round(eightyPercent)} 千卡）`,
        description: '摄入不足，建议适当增加营养丰富的食材',
        showReplacement: false
      };
    }
    
    return {
      type: 'success',
      color: '#52c41a',
      bgColor: '#f6ffed',
      borderColor: '#b7eb8f',
      message: `✅ 日均热量 ${dailyAvg} 千卡，控制在目标 ${goal} 千卡范围内`,
      description: '继续保持均衡饮食！',
      showReplacement: false
    };
  };

  const handleGetReplacements = async (recipe) => {
    setReplacingRecipe(recipe);
    setSuggestionsLoading(true);
    try {
      const response = await getReplacementSuggestions(recipe.id);
      setReplacementSuggestions(response.data);
      setReplacementDrawerVisible(true);
    } catch (error) {
      message.error('获取替换建议失败');
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleReplaceRecipe = async (newRecipe) => {
    if (!replacingRecipe) return;
    
    try {
      const response = await replaceRecipe(replacingRecipe.id, newRecipe.id);
      setWeeklyPlan(response.data);
      setReplacementDrawerVisible(false);
      setReplacingRecipe(null);
      message.success(`已将「${replacingRecipe.name}」替换为「${newRecipe.name}」`);
      
      const nutritionMap = {};
      if (response.data.nutrition?.recipeNutrition) {
        response.data.nutrition.recipeNutrition.forEach(nut => {
          nutritionMap[nut.recipeId] = nut;
        });
      }
      setRecipeNutritionMap(nutritionMap);
    } catch (error) {
      message.error(error.response?.data?.error || '替换失败');
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
  const nutrition = weeklyPlan?.nutrition;
  const dailyCalorieGoal = weeklyPlan?.user?.dailyCalorieGoal || user?.dailyCalorieGoal || 2000;
  const calorieWarning = getCalorieWarning();

  const purchasedPrice = shoppingItems
    .filter(item => item.purchased && item.isPriced)
    .reduce((sum, item) => sum + item.estimatedPrice, 0);

  const macroPieData = nutrition ? [
    { name: '蛋白质', value: nutrition.macroRatios.protein, color: MACRO_COLORS.protein },
    { name: '碳水', value: nutrition.macroRatios.carbs, color: MACRO_COLORS.carbs },
    { name: '脂肪', value: nutrition.macroRatios.fat, color: MACRO_COLORS.fat }
  ].filter(d => d.value > 0) : [];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Title level={3} style={{ margin: 0 }}>📅 本周计划 & 购物清单</Title>
        <Space>
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
        </Space>
      </div>

      {nutrition && recipes.length > 0 && (
        <Card 
          title={
            <Space>
              <ThunderboltOutlined style={{ color: '#fa8c16' }} />
              <span>📊 本周营养概览</span>
              <Button 
                type="text" 
                icon={<SettingOutlined />} 
                size="small"
                onClick={() => {
                  goalForm.setFieldsValue({ dailyCalorieGoal });
                  setGoalModalVisible(true);
                }}
                style={{ marginLeft: 8 }}
              >
                设置目标
              </Button>
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Statistic 
                title={<><FireOutlined style={{ color: '#fa8c16' }} /> 本周总热量</>}
                value={nutrition.totalWeeklyCalories}
                suffix="千卡"
                valueStyle={{ color: '#fa8c16', fontSize: 24 }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic 
                title="日均热量"
                value={nutrition.dailyAverageCalories}
                suffix="千卡"
                valueStyle={{ fontSize: 24, color: calorieWarning?.color }}
              />
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  目标: {dailyCalorieGoal} 千卡
                </Text>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 13 }}>三大营养素占比</Text>
                <div style={{ height: 100, marginTop: 4 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroPieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={35}
                        innerRadius={15}
                        dataKey="value"
                        label={({ value }) => `${value}%`}
                        labelLine={false}
                      >
                        {macroPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <div style={{ width: 10, height: 10, background: MACRO_COLORS.protein, borderRadius: 2 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>蛋白质</Text>
                  </Space>
                  <Text strong style={{ fontSize: 12 }}>
                    {nutrition.macroRatios.protein}%
                  </Text>
                </Space>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <div style={{ width: 10, height: 10, background: MACRO_COLORS.carbs, borderRadius: 2 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>碳水</Text>
                  </Space>
                  <Text strong style={{ fontSize: 12 }}>
                    {nutrition.macroRatios.carbs}%
                  </Text>
                </Space>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <div style={{ width: 10, height: 10, background: MACRO_COLORS.fat, borderRadius: 2 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>脂肪</Text>
                  </Space>
                  <Text strong style={{ fontSize: 12 }}>
                    {nutrition.macroRatios.fat}%
                  </Text>
                </Space>
              </Space>
              <Divider style={{ margin: '8px 0' }} />
              <Row gutter={4}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 10 }}>蛋白质</Text>
                    <div style={{ fontSize: 12, fontWeight: 'bold', color: MACRO_COLORS.protein }}>
                      {nutrition.dailyAverageProtein}g
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 10 }}>碳水</Text>
                    <div style={{ fontSize: 12, fontWeight: 'bold', color: MACRO_COLORS.carbs }}>
                      {nutrition.dailyAverageCarbs}g
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 10 }}>脂肪</Text>
                    <div style={{ fontSize: 12, fontWeight: 'bold', color: MACRO_COLORS.fat }}>
                      {nutrition.dailyAverageFat}g
                    </div>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>

          {calorieWarning && (
            <div 
              style={{ 
                marginTop: 16, 
                padding: 16, 
                background: calorieWarning.bgColor, 
                border: `1px solid ${calorieWarning.borderColor}`,
                borderRadius: 8 
              }}
            >
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space>
                  {calorieWarning.type === 'error' && <ExclamationCircleOutlined style={{ color: calorieWarning.color, fontSize: 20 }} />}
                  {calorieWarning.type === 'warning' && <InfoCircleOutlined style={{ color: calorieWarning.color, fontSize: 20 }} />}
                  {calorieWarning.type === 'success' && <CheckCircleOutlined style={{ color: calorieWarning.color, fontSize: 20 }} />}
                  <Text strong style={{ color: calorieWarning.color, fontSize: 15 }}>
                    {calorieWarning.message}
                  </Text>
                </Space>
                <Row align="middle" justify="space-between">
                  <Col>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {calorieWarning.description}
                    </Text>
                  </Col>
                  <Col>
                    {calorieWarning.showReplacement && (
                      <Button 
                        type="primary" 
                        danger
                        icon={<SwapOutlined />}
                        size="small"
                        onClick={() => {
                          if (recipes.length > 0) {
                            const highestCalorieRecipe = [...recipes].sort((a, b) => {
                              const nutA = recipeNutritionMap[a.id]?.totalCalories || 0;
                              const nutB = recipeNutritionMap[b.id]?.totalCalories || 0;
                              return nutB - nutA;
                            })[0];
                            handleGetReplacements(highestCalorieRecipe);
                          }
                        }}
                      >
                        获取替换建议
                      </Button>
                    )}
                  </Col>
                </Row>
              </Space>
            </div>
          )}
        </Card>
      )}

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
                renderItem={(recipe) => {
                  const recipeNutrition = recipeNutritionMap[recipe.id];
                  return (
                    <List.Item
                      key={recipe.id}
                      actions={[
                        <Tooltip title="获取低热量替换建议">
                          <Button 
                            type="text" 
                            icon={<SwapOutlined />} 
                            size="small"
                            onClick={() => handleGetReplacements(recipe)}
                          >
                            替换
                          </Button>
                        </Tooltip>,
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
                          <Space direction="vertical" size={0} style={{ width: '100%' }}>
                            <Space>
                              <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                              <Text type="secondary">{recipe.estimatedTime}分钟</Text>
                              {recipeNutrition && (
                                <>
                                  <Divider type="vertical" />
                                  <FireOutlined style={{ color: '#fa8c16' }} />
                                  <Text type="secondary">
                                    约 <Text strong style={{ color: '#fa8c16' }}>{recipeNutrition.totalCalories}</Text> 千卡
                                  </Text>
                                  <Tag color="blue" style={{ margin: 0 }}>
                                    每份 {recipeNutrition.caloriesPerServing} 千卡
                                  </Tag>
                                </>
                              )}
                            </Space>
                            {recipeNutrition && (
                              <Space size={[12, 0]} style={{ marginTop: 4 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  蛋白: <Text strong style={{ color: MACRO_COLORS.protein }}>{recipeNutrition.totalProtein}g</Text>
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  碳水: <Text strong style={{ color: MACRO_COLORS.carbs }}>{recipeNutrition.totalCarbs}g</Text>
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  脂肪: <Text strong style={{ color: MACRO_COLORS.fat }}>{recipeNutrition.totalFat}g</Text>
                                </Text>
                              </Space>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  );
                }}
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

      <Modal
        title={
          <Space>
            <SettingOutlined style={{ color: '#fa8c16' }} />
            <span>设置每日热量目标</span>
          </Space>
        }
        open={goalModalVisible}
        onCancel={() => setGoalModalVisible(false)}
        footer={null}
        destroyOnClose
        width={420}
      >
        <Form
          form={goalForm}
          layout="vertical"
          onFinish={handleGoalSubmit}
        >
          <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 8, border: '1px solid #91d5ff' }}>
            <Space direction="vertical" size={0} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 成年人每日热量参考：
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                • 轻体力活动女性：1800-2000 千卡
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                • 轻体力活动男性：2200-2400 千卡
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                • 减脂期：减少300-500 千卡/天
              </Text>
            </Space>
          </div>

          <Form.Item
            name="dailyCalorieGoal"
            label="🔥 每日热量目标（千卡）"
            rules={[
              { required: true, message: '请输入热量目标' },
              { type: 'number', min: 500, max: 10000, message: '请输入500-10000之间的数值' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={500}
              max={10000}
              step={50}
              placeholder="例如：2000"
              size="large"
              addonAfter="千卡"
            />
          </Form.Item>

          <Row gutter={8}>
            <Col span={6}>
              <Button block onClick={() => goalForm.setFieldsValue({ dailyCalorieGoal: 1500 })} size="small">
                1500
              </Button>
            </Col>
            <Col span={6}>
              <Button block onClick={() => goalForm.setFieldsValue({ dailyCalorieGoal: 1800 })} size="small">
                1800
              </Button>
            </Col>
            <Col span={6}>
              <Button block onClick={() => goalForm.setFieldsValue({ dailyCalorieGoal: 2000 })} size="small">
                2000
              </Button>
            </Col>
            <Col span={6}>
              <Button block onClick={() => goalForm.setFieldsValue({ dailyCalorieGoal: 2500 })} size="small">
                2500
              </Button>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setGoalModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          <Space direction="vertical" size={0}>
            <Space>
              <SwapOutlined style={{ color: '#fa8c16' }} />
              <Text strong>替换建议</Text>
            </Space>
            {replacingRecipe && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                为「{replacingRecipe.name}」寻找更低热量的替代菜谱
              </Text>
            )}
          </Space>
        }
        placement="right"
        width={480}
        onClose={() => {
          setReplacementDrawerVisible(false);
          setReplacingRecipe(null);
          setReplacementSuggestions([]);
        }}
        open={replacementDrawerVisible}
        loading={suggestionsLoading}
      >
        {replacingRecipe && recipeNutritionMap[replacingRecipe.id] && (
          <Card 
            size="small" 
            style={{ marginBottom: 16, background: '#fff1f0', border: '1px solid #ffa39e' }}
          >
            <Row align="middle" justify="space-between">
              <Col>
                <Text strong>当前菜谱</Text>
              </Col>
              <Col>
                <Tag color="red">
                  <FireOutlined /> {recipeNutritionMap[replacingRecipe.id].totalCalories} 千卡
                </Tag>
              </Col>
            </Row>
          </Card>
        )}

        {replacementSuggestions.length === 0 && !suggestionsLoading ? (
          <Empty
            description="暂无合适的替换建议"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              系统没有找到食材有交集且热量更低的菜谱
            </Text>
            <Button type="primary" onClick={() => navigate('/recipes')} style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>
              去浏览所有菜谱
            </Button>
          </Empty>
        ) : (
          <List
            dataSource={replacementSuggestions}
            renderItem={(suggestion) => (
              <List.Item
                style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                actions={[
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<SwapOutlined />}
                    onClick={() => handleReplaceRecipe(suggestion.recipe)}
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  >
                    一键替换
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong style={{ cursor: 'pointer' }} onClick={() => navigate(`/recipes/${suggestion.recipe.id}`)}>
                        {suggestion.recipe.name}
                      </Text>
                      <span className={`difficulty-tag ${getDifficultyClass(suggestion.recipe.difficulty)}`}>
                        {suggestion.recipe.difficulty}
                      </span>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Space>
                        <Tag color="green">
                          <FireOutlined /> {suggestion.nutrition.totalCalories} 千卡
                        </Tag>
                        <Tag color="success">
                          <ArrowDownOutlined /> 减少 {suggestion.calorieDifference} 千卡
                        </Tag>
                        <Tag color="blue">
                          每份 {suggestion.nutrition.caloriesPerServing} 千卡
                        </Tag>
                      </Space>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          共同食材: 
                          {suggestion.commonIngredients.map((ing, idx) => (
                            <Tag key={idx} color="orange" style={{ marginLeft: 4, marginRight: 0 }}>
                              {ing}
                            </Tag>
                          ))}
                        </Text>
                      </div>
                      <Space size={[12, 0]}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          蛋白: <Text strong style={{ color: MACRO_COLORS.protein }}>{suggestion.nutrition.totalProtein}g</Text>
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          碳水: <Text strong style={{ color: MACRO_COLORS.carbs }}>{suggestion.nutrition.totalCarbs}g</Text>
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          脂肪: <Text strong style={{ color: MACRO_COLORS.fat }}>{suggestion.nutrition.totalFat}g</Text>
                        </Text>
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>
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
