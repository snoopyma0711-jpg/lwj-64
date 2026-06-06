import { useState, useEffect } from 'react';
import { Card, Typography, Tag, Button, Space, List, Avatar, Popconfirm, Row, Col, message, Divider } from 'antd';
import { ClockCircleOutlined, UserOutlined, StarOutlined, StarFilled, EditOutlined, DeleteOutlined, AppstoreOutlined, ShoppingCartOutlined, HolderOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import request from '../api/request';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const CollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchCollection = async () => {
    setLoading(true);
    try {
      const response = await request.get(`/collections/${id}`);
      setCollection(response.data);
      setRecipes(response.data.recipes || []);
    } catch (error) {
      message.error('获取合集详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, [id]);

  const handleDelete = async () => {
    try {
      await request.delete(`/collections/${id}`);
      message.success('删除成功');
      navigate('/collections');
    } catch (error) {
      message.error(error.response?.data?.error || '删除失败');
    }
  };

  const handleFavorite = async () => {
    try {
      if (collection.isFavorited) {
        await request.delete(`/collections/${id}/favorite`);
        message.success('已取消收藏');
      } else {
        await request.post(`/collections/${id}/favorite`);
        message.success('收藏成功');
      }
      fetchCollection();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const addToWeeklyPlan = async () => {
    try {
      const response = await request.post(`/collections/${id}/add-to-weekly-plan`);
      message.success(response.data.message);
    } catch (error) {
      message.error(error.response?.data?.error || '添加失败');
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === index || !isCreator) return;

    const newRecipes = [...recipes];
    const draggedRecipe = newRecipes[draggedIndex];
    newRecipes.splice(draggedIndex, 1);
    newRecipes.splice(index, 0, draggedRecipe);
    setRecipes(newRecipes);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggedIndex(null);
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const recipeIds = recipes.map(r => r.id);
      await request.put(`/collections/${id}/reorder`, { recipeIds });
      message.success('排序已保存');
      fetchCollection();
    } catch (error) {
      message.error(error.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 48 }}>加载中...</div>;
  }

  if (!collection) {
    return <div style={{ textAlign: 'center', padding: 48 }}>合集不存在</div>;
  }

  const isCreator = user?.id === collection.creatorId;

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Title level={2} style={{ margin: 0, marginBottom: 12 }}>{collection.name}</Title>
              <Space wrap style={{ marginBottom: 12 }}>
                <Tag icon={<AppstoreOutlined />} color="orange">
                  {collection.recipeCount} 道菜谱
                </Tag>
                <Tag icon={<ClockCircleOutlined />} color="blue">
                  共 {collection.totalTime} 分钟
                </Tag>
                <Space>
                  {collection.isFavorited ? (
                    <StarFilled style={{ color: '#faad14', fontSize: 18 }} />
                  ) : (
                    <StarOutlined style={{ color: '#faad14', fontSize: 18 }} />
                  )}
                  <Text strong style={{ color: '#faad14' }}>{collection.favoriteCount} 人收藏</Text>
                </Space>
              </Space>
              <Text type="secondary" style={{ fontSize: 15, lineHeight: 1.8 }}>
                {collection.description}
              </Text>
            </Col>
            <Col>
              <Space wrap>
                {isCreator && (
                  <>
                    <Button icon={<EditOutlined />} onClick={() => navigate(`/collections/edit/${id}`)}>
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定要删除这个合集吗？"
                      onConfirm={handleDelete}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                  </>
                )}
                <Button
                  icon={collection.isFavorited ? <StarFilled /> : <StarOutlined />}
                  onClick={handleFavorite}
                  type={collection.isFavorited ? 'primary' : 'default'}
                  style={collection.isFavorited ? { background: '#faad14', borderColor: '#faad14' } : {}}
                >
                  {collection.isFavorited ? '已收藏' : '收藏'}
                </Button>
                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  onClick={addToWeeklyPlan}
                  style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
                >
                  一键加入周计划
                </Button>
              </Space>
            </Col>
          </Row>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
            <Avatar icon={<UserOutlined />} style={{ marginRight: 8, backgroundColor: '#fa8c16' }} />
            <Space direction="vertical" size={0}>
              <Text strong>{collection.creator?.username}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                创建于 {dayjs(collection.createdAt).format('YYYY-MM-DD HH:mm')}
              </Text>
            </Space>
          </div>
        </div>

        <Divider />

        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📋 菜谱列表</span>
              {isCreator && draggedIndex !== null && (
                <Button
                  size="small"
                  type="primary"
                  onClick={saveOrder}
                  loading={saving}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                >
                  保存排序
                </Button>
              )}
            </div>
          }
          extra={
            isCreator && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                <HolderOutlined style={{ marginRight: 4 }} />
                拖拽调整顺序
              </Text>
            )
          }
        >
          {recipes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Text type="secondary">该合集暂无菜谱</Text>
            </div>
          ) : (
            <List
              dataSource={recipes}
              renderItem={(recipe, index) => (
                <List.Item
                  key={recipe.id}
                  draggable={isCreator}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  style={{
                    padding: '16px',
                    marginBottom: 8,
                    borderRadius: 8,
                    backgroundColor: draggedIndex === index ? '#e6f7ff' : '#fafafa',
                    border: draggedIndex === index ? '1px solid #91d5ff' : '1px solid #f0f0f0',
                    cursor: isCreator ? 'move' : 'pointer'
                  }}
                  onClick={() => navigate(`/recipes/${recipe.id}`)}
                >
                  <List.Item.Meta
                    avatar={
                      <Space>
                        {isCreator && <HolderOutlined style={{ color: '#bfbfbf' }} />}
                        <Tag color="orange" style={{ margin: 0 }}>{index + 1}</Tag>
                      </Space>
                    }
                    title={
                      <Space>
                        <Text strong style={{ fontSize: 16 }}>{recipe.name}</Text>
                      </Space>
                    }
                    description={
                      <Space style={{ marginTop: 8 }}>
                        <Tag icon={<ClockCircleOutlined />} color="blue">
                          {recipe.estimatedTime} 分钟
                        </Tag>
                        <span className={`difficulty-tag difficulty-${recipe.difficulty === '简单' ? 'easy' : recipe.difficulty === '中等' ? 'medium' : 'hard'}`}>
                          {recipe.difficulty}
                        </span>
                      </Space>
                    }
                  />
                  <Button
                    type="primary"
                    size="small"
                    icon={<ShoppingCartOutlined />}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await request.post('/weekly-plans/add-recipe', { recipeId: recipe.id });
                        message.success('已添加到周计划');
                      } catch (err) {
                        message.error(err.response?.data?.error || '添加失败');
                      }
                    }}
                    style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
                  >
                    加入周计划
                  </Button>
                </List.Item>
              )}
            />
          )}
        </Card>
      </Card>
    </div>
  );
};

export default CollectionDetail;
