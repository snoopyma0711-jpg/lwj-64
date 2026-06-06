import { useState, useEffect } from 'react';
import { Input, Select, Card, Row, Col, Button, Space, Empty, message, Tag, Typography, Divider } from 'antd';
import { SearchOutlined, PlusOutlined, ClockCircleOutlined, UserOutlined, StarOutlined, StarFilled, AppstoreOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../api/request';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const CollectionList = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('time');
  const navigate = useNavigate();

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchText) params.search = searchText;
      if (sortBy === 'favorites') params.sortBy = 'favorites';

      const response = await request.get('/collections', { params });
      setCollections(response.data);
    } catch (error) {
      message.error('获取合集列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [searchText, sortBy]);

  const handleFavorite = async (collection, e) => {
    e.stopPropagation();
    try {
      if (collection.isFavorited) {
        await request.delete(`/collections/${collection.id}/favorite`);
        message.success('已取消收藏');
      } else {
        await request.post(`/collections/${collection.id}/favorite`);
        message.success('收藏成功');
      }
      fetchCollections();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const addToWeeklyPlan = async (collectionId, e) => {
    e.stopPropagation();
    try {
      const response = await request.post(`/collections/${collectionId}/add-to-weekly-plan`);
      message.success(response.data.message);
    } catch (error) {
      message.error(error.response?.data?.error || '添加失败');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>📚 菜谱合集</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/collections/create')} style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>
            创建合集
          </Button>
        </div>
        
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={12} md={10} style={{ marginBottom: 16 }}>
              <Search
                placeholder="搜索合集名称..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={(value) => setSearchText(value)}
                onChange={(e) => !e.target.value && setSearchText('')}
              />
            </Col>
            <Col xs={24} sm={12} md={8} style={{ marginBottom: 16 }}>
              <Select
                value={sortBy}
                onChange={setSortBy}
                size="large"
                style={{ width: '100%' }}
              >
                <Option value="time">最新发布</Option>
                <Option value="favorites">收藏最多</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {collections.length === 0 && !loading ? (
          <Empty description="暂无合集，快来创建第一个吧！">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/collections/create')}>
              创建合集
            </Button>
          </Empty>
        ) : (
          <Row gutter={[16, 16]}>
            {collections.map((collection) => (
              <Col xs={24} sm={12} lg={8} key={collection.id}>
                <Card
                  className="recipe-card"
                  hoverable
                  onClick={() => navigate(`/collections/${collection.id}`)}
                  actions={[
                    <Button
                      type="text"
                      icon={collection.isFavorited ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                      onClick={(e) => handleFavorite(collection, e)}
                    >
                      {collection.favoriteCount}
                    </Button>,
                    <Button
                      type="text"
                      icon={<ShoppingCartOutlined />}
                      onClick={(e) => addToWeeklyPlan(collection.id, e)}
                    >
                      一键加入周计划
                    </Button>
                  ]}
                >
                  <div style={{ marginBottom: 12 }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Title level={4} style={{ margin: 0, fontSize: 18 }}>{collection.name}</Title>
                      <Text type="secondary" ellipsis={{ rows: 2 }} style={{ minHeight: 44 }}>
                        {collection.description}
                      </Text>
                    </Space>
                  </div>

                  <Divider style={{ margin: '12px 0' }} />

                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Tag icon={<AppstoreOutlined />} color="orange">
                          {collection.recipeCount} 道菜谱
                        </Tag>
                        <Tag icon={<ClockCircleOutlined />} color="blue">
                          共 {collection.totalTime} 分钟
                        </Tag>
                      </Space>
                      <Space>
                        <StarOutlined style={{ color: '#faad14' }} />
                        <Text type="secondary">{collection.favoriteCount}</Text>
                      </Space>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <UserOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
                      <Text type="secondary">{collection.creator?.username}</Text>
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

export default CollectionList;
