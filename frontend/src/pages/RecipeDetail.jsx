import { useState, useEffect } from 'react';
import { Card, Typography, Tag, Rate, Button, Space, List, Avatar, Modal, Form, Input, message, Divider, Popconfirm, Row, Col } from 'antd';
import { ClockCircleOutlined, UserOutlined, FireOutlined, EditOutlined, DeleteOutlined, ShoppingOutlined, StarOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import request from '../api/request';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const getDifficultyClass = (difficulty) => {
  switch (difficulty) {
    case '简单': return 'difficulty-easy';
    case '中等': return 'difficulty-medium';
    case '困难': return 'difficulty-hard';
    default: return '';
  }
};

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [form] = Form.useForm();

  const fetchRecipe = async () => {
    setLoading(true);
    try {
      const response = await request.get(`/recipes/${id}`);
      setRecipe(response.data);
    } catch (error) {
      message.error('获取菜谱详情失败');
    } finally {
      setLoading(false);
    }
  };

  const checkRating = async () => {
    try {
      const response = await request.get(`/ratings/${id}/check`);
      setHasRated(response.data.hasRated);
      setUserRating(response.data.rating);
    } catch (error) {
      console.error('检查评分状态失败');
    }
  };

  useEffect(() => {
    fetchRecipe();
    checkRating();
  }, [id]);

  const handleDelete = async () => {
    try {
      await request.delete(`/recipes/${id}`);
      message.success('删除成功');
      navigate('/recipes');
    } catch (error) {
      message.error(error.response?.data?.error || '删除失败');
    }
  };

  const handleRating = async (values) => {
    try {
      await request.post(`/ratings/${id}`, values);
      message.success('标记成功！感谢您的评价');
      setRatingModalVisible(false);
      form.resetFields();
      fetchRecipe();
      checkRating();
    } catch (error) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  const addToWeeklyPlan = async () => {
    try {
      await request.post('/weekly-plans/add-recipe', { recipeId: id });
      message.success('已添加到本周计划！');
    } catch (error) {
      message.error(error.response?.data?.error || '添加失败');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 48 }}>加载中...</div>;
  }

  if (!recipe) {
    return <div style={{ textAlign: 'center', padding: 48 }}>菜谱不存在</div>;
  }

  const isCreator = user?.id === recipe.creatorId;

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Title level={2} style={{ margin: 0, marginBottom: 12 }}>{recipe.name}</Title>
              <Space wrap>
                <span className={`difficulty-tag ${getDifficultyClass(recipe.difficulty)}`}>
                  {recipe.difficulty}
                </span>
                <Tag icon={<ClockCircleOutlined />} color="blue">
                  {recipe.estimatedTime} 分钟
                </Tag>
                <Space>
                  <Rate disabled value={recipe.averageRating} allowHalf />
                  <Text strong style={{ color: '#faad14', fontSize: 16 }}>
                    {recipe.averageRating > 0 ? recipe.averageRating : '暂无评分'}
                  </Text>
                </Space>
                <Space>
                  <FireOutlined style={{ color: '#f5222d' }} />
                  <Text>{recipe.madeCount} 人做过</Text>
                </Space>
              </Space>
            </Col>
            <Col>
              <Space>
                {isCreator && (
                  <>
                    <Button icon={<EditOutlined />} onClick={() => navigate(`/edit/${id}`)}>
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定要删除这个菜谱吗？"
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
                {hasRated ? (
                  <Button disabled icon={<StarOutlined />}>
                    已标记做过
                  </Button>
                ) : (
                  <Button type="primary" icon={<StarOutlined />} onClick={() => setRatingModalVisible(true)} style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>
                    标记做过
                  </Button>
                )}
                <Button icon={<ShoppingOutlined />} onClick={addToWeeklyPlan}>
                  加入周计划
                </Button>
              </Space>
            </Col>
          </Row>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
            <Avatar icon={<UserOutlined />} style={{ marginRight: 8, backgroundColor: '#fa8c16' }} />
            <Text type="secondary">由 {recipe.creator?.username} 创建</Text>
          </div>
        </div>

        <Divider />

        <Row gutter={[24, 24]}>
          <Col xs={24} md={10}>
            <Card title="🥬 所需食材" size="small">
              <List
                dataSource={recipe.ingredients}
                renderItem={(ing, index) => (
                  <List.Item key={index}>
                    <Space>
                      <Text strong>{ing.name}</Text>
                      <Text type="secondary">{ing.quantity}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} md={14}>
            <Card title="👨‍🍳 烹饪步骤" size="small">
              <Paragraph style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                {recipe.steps}
              </Paragraph>
            </Card>
          </Col>
        </Row>

        {hasRated && userRating && (
          <Card title="⭐ 我的评价" style={{ marginTop: 24 }} type="inner">
            <Space>
              <Rate disabled value={userRating.rating} />
              {userRating.comment && <Text>{userRating.comment}</Text>}
            </Space>
          </Card>
        )}

        <Divider />

        <Card title={`💬 大家的评价 (${recipe.ratings?.length || 0})`} style={{ marginTop: 24 }}>
          {recipe.ratings?.length === 0 ? (
            <Text type="secondary">还没有评价，快来第一个评价吧！</Text>
          ) : (
            <List
              dataSource={recipe.ratings}
              renderItem={(rating) => (
                <List.Item key={rating.id}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#fa8c16' }} />}
                    title={
                      <Space>
                        <Text strong>{rating.user?.username}</Text>
                        <Rate disabled value={rating.rating} style={{ fontSize: 14 }} />
                      </Space>
                    }
                    description={
                      <div>
                        {rating.comment && <Text>{rating.comment}</Text>}
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(rating.createdAt).format('YYYY-MM-DD HH:mm')}
                          </Text>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </Card>

      <Modal
        title="标记做过并评分"
        open={ratingModalVisible}
        onCancel={() => setRatingModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} onFinish={handleRating} layout="vertical">
          <Form.Item
            name="rating"
            label="评分"
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <Rate style={{ fontSize: 32 }} />
          </Form.Item>
          <Form.Item
            name="comment"
            label="短评（选填）"
          >
            <TextArea rows={3} placeholder="分享一下你的烹饪心得..." maxLength={200} showCount />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setRatingModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>
                提交评价
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RecipeDetail;
