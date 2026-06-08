import { useState, useEffect } from 'react';
import { Input, Select, Card, Row, Col, Rate, Tag, Button, Space, Empty, message, Badge, Typography, Divider } from 'antd';
import { SearchOutlined, PlusOutlined, ClockCircleOutlined, UserOutlined, FireOutlined, ShoppingOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../api/request';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const getDifficultyClass = (difficulty) => {
  switch (difficulty) {
    case '简单': return 'difficulty-easy';
    case '中等': return 'difficulty-medium';
    case '困难': return 'difficulty-hard';
    default: return '';
  }
};

const RecipeList = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('time');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [ingredientInput, setIngredientInput] = useState('');
  const navigate = useNavigate();

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchText) params.search = searchText;
      if (sortBy === 'rating') params.sortBy = 'rating';
      if (ingredientSearch) params.ingredients = ingredientSearch;

      const response = await request.get('/recipes', { params });
      setRecipes(response.data);
    } catch (error) {
      message.error('获取菜谱列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [searchText, sortBy, ingredientSearch]);

  const handleIngredientSearch = () => {
    if (!ingredientInput.trim()) {
      setIngredientSearch('');
      return;
    }
    setIngredientSearch(ingredientInput);
  };

  const clearIngredientSearch = () => {
    setIngredientInput('');
    setIngredientSearch('');
  };

  const addToWeeklyPlan = async (recipeId, e) => {
    e.stopPropagation();
    try {
      await request.post('/weekly-plans/add-recipe', { recipeId });
      message.success('已添加到本周计划！');
    } catch (error) {
      message.error(error.response?.data?.error || '添加失败');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 16 }}>🍽️ 菜谱库</Title>
        
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={12} md={8} style={{ marginBottom: 16 }}>
              <Search
                placeholder="搜索菜名..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={(value) => setSearchText(value)}
                onChange={(e) => !e.target.value && setSearchText('')}
              />
            </Col>
            <Col xs={24} sm={12} md={6} style={{ marginBottom: 16 }}>
              <Select
                value={sortBy}
                onChange={setSortBy}
                size="large"
                style={{ width: '100%' }}
              >
                <Option value="time">最新发布</Option>
                <Option value="rating">评分最高</Option>
              </Select>
            </Col>
            <Col xs={24} md={10} style={{ marginBottom: 16 }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="食材反查: 输入食材，用逗号分隔（如：鸡蛋,番茄）"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  size="large"
                  onPressEnter={handleIngredientSearch}
                />
                <Button type="primary" size="large" onClick={handleIngredientSearch} style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>
                  <SearchOutlined /> 搜索
                </Button>
                {ingredientSearch && (
                  <Button size="large" onClick={clearIngredientSearch}>
                    清除
                  </Button>
                )}
              </Space.Compact>
            </Col>
          </Row>
          {ingredientSearch && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                当前搜索食材: <Tag color="orange">{ingredientSearch}</Tag>
                <Text type="primary"> 优先推荐消耗临期食材的菜谱</Text>
              </Text>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  排序规则：先按能消耗的临期食材数量从多到少排，临期食材数量相同的再按缺少食材数从少到多排
                </Text>
              </div>
            </div>
          )}
        </Card>

        {recipes.length === 0 && !loading ? (
          <Empty description="暂无菜谱，快来创建第一个吧！">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/create')}>
              创建菜谱
            </Button>
          </Empty>
        ) : (
          <Row gutter={[16, 16]}>
            {recipes.map((recipe) => (
              <Col xs={24} sm={12} lg={8} key={recipe.id}>
                <Card
                  className="recipe-card"
                  hoverable
                  onClick={() => navigate(`/recipes/${recipe.id}`)}
                  actions={[
                    <Button 
                      type="text" 
                      icon={<ShoppingOutlined />} 
                      onClick={(e) => addToWeeklyPlan(recipe.id, e)}
                    >
                      加入周计划
                    </Button>
                  ]}
                >
                  <div style={{ marginBottom: 12 }}>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                            <Title level={4} style={{ margin: 0, fontSize: 18 }}>{recipe.name}</Title>
                            <Space size={4}>
                              {recipe.expiringUsedCount !== undefined && recipe.expiringUsedCount > 0 && (
                                <Badge 
                                  count={`消${recipe.expiringUsedCount}种临期`} 
                                  style={{ backgroundColor: '#fff2e8', color: '#fa8c16', border: '1px solid #ffd591', fontWeight: 'bold' }}
                                />
                              )}
                              {recipe.missingCount !== undefined && (
                                <Badge 
                                  count={`缺${recipe.missingCount}种`} 
                                  style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c', border: '1px solid #d9d9d9' }}
                                />
                              )}
                            </Space>
                          </div>
                      <Space>
                        <span className={`difficulty-tag ${getDifficultyClass(recipe.difficulty)}`}>
                          {recipe.difficulty}
                        </span>
                        <Tag icon={<ClockCircleOutlined />} color="blue">
                          {recipe.estimatedTime}分钟
                        </Tag>
                      </Space>
                      {recipe.usedExpiringIngredients && recipe.usedExpiringIngredients.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <WarningOutlined style={{ color: '#faad14', marginRight: 4 }} />
                            可消耗临期食材：
                            {recipe.usedExpiringIngredients.map((ing, idx) => (
                              <Tag 
                                key={idx} 
                                color={ing.status === 'expired' ? 'red' : 'orange'} 
                                style={{ marginLeft: 4, marginRight: 0 }}
                              >
                                {ing.name}
                                {ing.daysLeft !== null && ing.daysLeft !== undefined && (
                                  <span style={{ marginLeft: 2, fontSize: 11 }}>
                                    ({ing.daysLeft < 0 ? `过期${Math.abs(ing.daysLeft)}天` : `剩${ing.daysLeft}天`})
                                  </span>
                                )}
                              </Tag>
                            ))}
                          </Text>
                        </div>
                      )}
                    </Space>
                  </div>

                  <Divider style={{ margin: '12px 0' }} />

                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Rate disabled value={recipe.averageRating} allowHalf style={{ fontSize: 14 }} />
                        <Text strong style={{ color: '#faad14' }}>{recipe.averageRating > 0 ? recipe.averageRating : '暂无'}</Text>
                      </Space>
                      <Space>
                        <FireOutlined style={{ color: '#f5222d' }} />
                        <Text type="secondary">{recipe.madeCount}人做过</Text>
                      </Space>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <UserOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
                      <Text type="secondary">{recipe.creator?.username}</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};

export default RecipeList;
