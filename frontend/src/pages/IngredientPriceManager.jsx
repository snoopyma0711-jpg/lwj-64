import { useState, useEffect } from 'react';
import { Card, List, Button, Form, Input, Select, InputNumber, Space, Typography, Tag, Popconfirm, message, Row, Col, Empty } from 'antd';
import { DeleteOutlined, PlusOutlined, TagOutlined } from '@ant-design/icons';
import { getIngredientPrices, getPriceUnits, addIngredientPrice, deleteIngredientPrice } from '../api/budget';

const { Title, Text } = Typography;
const { Option } = Select;

const IngredientPriceManager = () => {
  const [prices, setPrices] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const fetchPrices = async (search = '') => {
    setLoading(true);
    try {
      const response = await getIngredientPrices(search);
      setPrices(response.data);
    } catch (error) {
      message.error('获取价格列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await getPriceUnits();
      setUnits(response.data.units);
    } catch (error) {
      message.error('获取单位列表失败');
    }
  };

  useEffect(() => {
    fetchPrices();
    fetchUnits();
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
    fetchPrices(value);
  };

  const handleSubmit = async (values) => {
    try {
      await addIngredientPrice(values);
      message.success('价格录入成功');
      form.resetFields();
      fetchPrices(searchText);
    } catch (error) {
      message.error(error.response?.data?.error || '录入失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteIngredientPrice(id);
      message.success('删除成功');
      fetchPrices(searchText);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const getUnitColor = (unit) => {
    const colors = {
      '元/斤': 'orange',
      '元/个': 'blue',
      '元/克': 'green',
      '元/毫升': 'purple'
    };
    return colors[unit] || 'default';
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>💰 食材价格库</Title>
        <Text type="secondary">录入常见食材单价，自动计算购物清单预算</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title={
            <Space>
              <PlusOutlined style={{ color: '#fa8c16' }} />
              <span>录入食材价格</span>
            </Space>
          }>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                name="ingredientName"
                label="食材名称"
                rules={[{ required: true, message: '请输入食材名称' }]}
              >
                <Input placeholder="例如：番茄、鸡蛋" />
              </Form.Item>
              <Form.Item
                name="price"
                label="单价"
                rules={[{ required: true, message: '请输入单价' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                  placeholder="请输入价格"
                />
              </Form.Item>
              <Form.Item
                name="unit"
                label="计价单位"
                rules={[{ required: true, message: '请选择计价单位' }]}
              >
                <Select placeholder="请选择计价单位">
                  {units.map(unit => (
                    <Option key={unit} value={unit}>{unit}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" style={{ width: '100%', background: '#fa8c16', borderColor: '#fa8c16' }}>
                  <Space>
                    <PlusOutlined />
                    <span>录入价格</span>
                  </Space>
                </Button>
              </Form.Item>
            </Form>
            <div style={{ padding: 12, background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 提示：同一食材重复录入会自动覆盖更新原有价格
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <TagOutlined style={{ color: '#fa8c16' }} />
                  <span>已录入的价格</span>
                  <Tag color="orange">{prices.length} 种</Tag>
                </Space>
                <Input.Search
                  placeholder="搜索食材名称"
                  allowClear
                  style={{ width: 200 }}
                  onSearch={handleSearch}
                />
              </Space>
            }
            loading={loading}
          >
            {prices.length === 0 ? (
              <Empty
                description="还没有录入任何食材价格"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={prices}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    actions={[
                      <Popconfirm
                        title="确定要删除这条价格记录吗？"
                        onConfirm={() => handleDelete(item.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button type="text" danger icon={<DeleteOutlined />} size="small">
                          删除
                        </Button>
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{item.ingredientName}</Text>
                          <Tag color={getUnitColor(item.unit)}>{item.unit}</Tag>
                        </Space>
                      }
                      description={
                        <Space>
                          <Text type="secondary">单价：</Text>
                          <Text strong style={{ color: '#fa8c16', fontSize: 18 }}>
                            ¥{parseFloat(item.price).toFixed(2)}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            （更新于 {new Date(item.updatedAt).toLocaleDateString('zh-CN')}）
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default IngredientPriceManager;
