import { useState, useEffect } from 'react';
import { Card, List, Button, Form, Input, Select, InputNumber, Space, Typography, Tag, Popconfirm, message, Row, Col, Empty, Modal, Divider, Tooltip } from 'antd';
import { DeleteOutlined, PlusOutlined, TagOutlined, EditOutlined, FireOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getIngredientPrices, getPriceUnits, addIngredientPrice, deleteIngredientPrice, updateIngredientNutrition, getDefaultNutrition, getNutritionSuggestions } from '../api/budget';

const { Title, Text } = Typography;
const { Option } = Select;

const IngredientPriceManager = () => {
  const [prices, setPrices] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [nutritionForm] = Form.useForm();
  const [nutritionModalVisible, setNutritionModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [nutritionSuggestions, setNutritionSuggestions] = useState([]);
  const [autoFillLoading, setAutoFillLoading] = useState(false);

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

  const fetchNutritionSuggestions = async () => {
    try {
      const response = await getNutritionSuggestions();
      setNutritionSuggestions(response.data);
    } catch (error) {
      console.error('获取营养建议失败');
    }
  };

  useEffect(() => {
    fetchPrices();
    fetchUnits();
    fetchNutritionSuggestions();
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

  const handleEditNutrition = (item) => {
    setEditingItem(item);
    nutritionForm.setFieldsValue({
      calories: item.calories ?? '',
      protein: item.protein ?? '',
      carbs: item.carbs ?? '',
      fat: item.fat ?? ''
    });
    setNutritionModalVisible(true);
  };

  const handleAutoFill = async () => {
    if (!editingItem) return;
    
    setAutoFillLoading(true);
    try {
      const response = await getDefaultNutrition(editingItem.ingredientName);
      if (response.data.nutrition) {
        nutritionForm.setFieldsValue({
          calories: response.data.nutrition.calories ?? '',
          protein: response.data.nutrition.protein ?? '',
          carbs: response.data.nutrition.carbs ?? '',
          fat: response.data.nutrition.fat ?? ''
        });
        const source = response.data.nutrition.source === 'user' ? '您之前录入的数据' : '系统默认数据';
        message.success(`已自动填充（来源：${source}）`);
      } else {
        message.info('未找到该食材的营养数据，请手动录入');
      }
    } catch (error) {
      message.error('自动填充失败');
    } finally {
      setAutoFillLoading(false);
    }
  };

  const handleNutritionSubmit = async (values) => {
    if (!editingItem) return;
    
    try {
      await updateIngredientNutrition(editingItem.id, values);
      message.success('营养信息更新成功');
      setNutritionModalVisible(false);
      fetchPrices(searchText);
    } catch (error) {
      message.error(error.response?.data?.error || '更新失败');
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

  const hasNutritionData = (item) => {
    return item.calories !== null && item.calories !== undefined;
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
              
              <Divider style={{ margin: '12px 0' }}>
                <Tag color="orange">
                  <FireOutlined /> 营养信息（选填，千卡/100克）
                </Tag>
              </Divider>
              
              <Row gutter={8}>
                <Col xs={12}>
                  <Form.Item
                    name="calories"
                    label="热量"
                    style={{ marginBottom: 8 }}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={1}
                      placeholder="千卡/100克"
                    />
                  </Form.Item>
                </Col>
                <Col xs={12}>
                  <Form.Item
                    name="protein"
                    label="蛋白质"
                    style={{ marginBottom: 8 }}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.1}
                      placeholder="克/100克"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={8}>
                <Col xs={12}>
                  <Form.Item
                    name="carbs"
                    label="碳水"
                    style={{ marginBottom: 8 }}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.1}
                      placeholder="克/100克"
                    />
                  </Form.Item>
                </Col>
                <Col xs={12}>
                  <Form.Item
                    name="fat"
                    label="脂肪"
                    style={{ marginBottom: 8 }}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.1}
                      placeholder="克/100克"
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" style={{ width: '100%', background: '#fa8c16', borderColor: '#fa8c16' }}>
                  <Space>
                    <PlusOutlined />
                    <span>录入价格和营养</span>
                  </Space>
                </Button>
              </Form.Item>
            </Form>
            <div style={{ padding: 12, background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f', marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 提示：同一食材重复录入会自动覆盖更新原有价格和营养信息。<br/>
                系统内置了100+常见食材的营养数据，编辑时可一键自动填充。
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
                      <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        size="small"
                        onClick={() => handleEditNutrition(item)}
                      >
                        营养
                      </Button>,
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
                          {hasNutritionData(item) ? (
                            <Tag color="green">
                              <FireOutlined /> {item.calories} 千卡/100g
                            </Tag>
                          ) : (
                            <Tooltip title="点击右侧「营养」按钮录入热量数据">
                              <Tag color="default">
                                <InfoCircleOutlined /> 未录入营养
                              </Tag>
                            </Tooltip>
                          )}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                          <Space>
                            <Text type="secondary">单价：</Text>
                            <Text strong style={{ color: '#fa8c16', fontSize: 18 }}>
                              ¥{parseFloat(item.price).toFixed(2)}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              （更新于 {new Date(item.updatedAt).toLocaleDateString('zh-CN')}）
                            </Text>
                          </Space>
                          {hasNutritionData(item) && (
                            <Space size={[16, 0]} style={{ marginTop: 4 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                蛋白质: <Text strong>{item.protein || 0}g</Text>
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                碳水: <Text strong>{item.carbs || 0}g</Text>
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                脂肪: <Text strong>{item.fat || 0}g</Text>
                              </Text>
                            </Space>
                          )}
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

      <Modal
        title={
          <Space>
            <FireOutlined style={{ color: '#fa8c16' }} />
            <span>编辑营养信息 - {editingItem?.ingredientName}</span>
          </Space>
        }
        open={nutritionModalVisible}
        onCancel={() => setNutritionModalVisible(false)}
        footer={null}
        destroyOnClose
        width={500}
      >
        <Form
          form={nutritionForm}
          layout="vertical"
          onFinish={handleNutritionSubmit}
        >
          <div style={{ marginBottom: 16, padding: 12, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
            <Space direction="vertical" size={0} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 营养数据单位说明：
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                • 热量：千卡/100克 &nbsp;&nbsp;
                • 蛋白质：克/100克 &nbsp;&nbsp;
                • 碳水：克/100克 &nbsp;&nbsp;
                • 脂肪：克/100克
              </Text>
            </Space>
          </div>

          <Button 
            type="dashed" 
            block 
            icon={<InfoCircleOutlined />}
            onClick={handleAutoFill}
            loading={autoFillLoading}
            style={{ marginBottom: 16 }}
          >
            一键自动填充（从系统默认数据）
          </Button>

          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                name="calories"
                label="🔥 热量密度（千卡/100克）"
                rules={[{ required: true, message: '请输入热量' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={900}
                  step={1}
                  placeholder="例如：鸡蛋约144千卡/100克"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={8}>
              <Form.Item
                name="protein"
                label="💪 蛋白质"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="克/100克"
                />
              </Form.Item>
            </Col>
            <Col xs={8}>
              <Form.Item
                name="carbs"
                label="🍚 碳水化合物"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="克/100克"
                />
              </Form.Item>
            </Col>
            <Col xs={8}>
              <Form.Item
                name="fat"
                label="🥑 脂肪"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="克/100克"
                />
              </Form.Item>
            </Col>
          </Row>

          {nutritionSuggestions.length > 0 && (
            <>
              <Divider style={{ margin: '8px 0' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>常见食材参考</Text>
              </Divider>
              <div style={{ maxHeight: 120, overflowY: 'auto', padding: '8px 0' }}>
                <Space wrap size={[4, 4]}>
                  {nutritionSuggestions.slice(0, 30).map((item, index) => (
                    <Tag 
                      key={index} 
                      color="blue"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        nutritionForm.setFieldsValue({
                          calories: item.calories ?? '',
                          protein: item.protein ?? '',
                          carbs: item.carbs ?? '',
                          fat: item.fat ?? ''
                        });
                        message.success(`已填充「${item.name}」的营养数据`);
                      }}
                    >
                      {item.name} ({item.calories}千卡)
                    </Tag>
                  ))}
                </Space>
              </div>
            </>
          )}

          <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setNutritionModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IngredientPriceManager;
