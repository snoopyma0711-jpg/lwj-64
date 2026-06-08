import { useState, useEffect } from 'react';
import { Card, List, Button, Form, Input, InputNumber, DatePicker, Space, Typography, Tag, Popconfirm, message, Row, Col, Empty, Modal, Divider, Select, Checkbox } from 'antd';
import { DeleteOutlined, PlusOutlined, InboxOutlined, EditOutlined, WarningOutlined, CheckCircleOutlined, ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getFridgeIngredients, addFridgeIngredient, updateFridgeIngredient, deleteFridgeIngredient, deleteFridgeIngredients } from '../api/budget';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const FridgeManager = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const navigate = useNavigate();

  const fetchIngredients = async (status = 'all') => {
    setLoading(true);
    try {
      const params = status === 'all' ? undefined : status;
      const response = await getFridgeIngredients(params);
      setIngredients(response.data);
    } catch (error) {
      message.error('获取冰箱食材失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients(filterStatus);
  }, [filterStatus]);

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : null
      };
      await addFridgeIngredient(data);
      message.success('食材添加成功');
      form.resetFields();
      fetchIngredients(filterStatus);
    } catch (error) {
      message.error(error.response?.data?.error || '添加失败');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    editForm.setFieldsValue({
      ingredientName: item.ingredientName,
      quantity: item.quantity,
      expiryDate: item.expiryDate ? item.expiryDate : null,
      notes: item.notes || ''
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values) => {
    if (!editingItem) return;
    
    try {
      const data = {
        ...values,
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : null
      };
      await updateFridgeIngredient(editingItem.id, data);
      message.success('更新成功');
      setEditModalVisible(false);
      setEditingItem(null);
      fetchIngredients(filterStatus);
    } catch (error) {
      message.error(error.response?.data?.error || '更新失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteFridgeIngredient(id);
      message.success('删除成功');
      fetchIngredients(filterStatus);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的食材');
      return;
    }
    try {
      await deleteFridgeIngredients(selectedRowKeys);
      message.success(`已删除 ${selectedRowKeys.length} 项食材`);
      setSelectedRowKeys([]);
      fetchIngredients(filterStatus);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const getStatusTag = (item) => {
    const status = item.expiryStatus;
    if (!status || status.daysLeft === null) {
      return <Tag color="default">未设置过期日期</Tag>;
    }
    
    if (status.status === 'expired') {
      return (
        <Tag color="red" icon={<WarningOutlined />}>
          已过期 {Math.abs(status.daysLeft)} 天
        </Tag>
      );
    } else if (status.status === 'warning') {
      return (
        <Tag color="orange" icon={<ClockCircleOutlined />}>
          还剩 {status.daysLeft} 天
        </Tag>
      );
    } else {
      return (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          还剩 {status.daysLeft} 天
        </Tag>
      );
    }
  };

  const getStatusColor = (item) => {
    const status = item.expiryStatus;
    if (!status || status.daysLeft === null) return '#8c8c8c';
    return status.color;
  };

  const stats = {
    total: ingredients.length,
    normal: ingredients.filter(i => i.expiryStatus?.status === 'normal').length,
    warning: ingredients.filter(i => i.expiryStatus?.status === 'warning').length,
    expired: ingredients.filter(i => i.expiryStatus?.status === 'expired').length
  };

  const filteredIngredients = ingredients;

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>🧊 冰箱食材管理</Title>
        <Text type="secondary">录入冰箱食材，设置过期日期，自动提醒临期食材</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title={
            <Space>
              <PlusOutlined style={{ color: '#fa8c16' }} />
              <span>添加食材</span>
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
                <Input placeholder="例如：番茄、鸡蛋、牛奶" />
              </Form.Item>
              <Form.Item
                name="quantity"
                label="数量"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <Input placeholder="例如：2个、500克、1盒" />
              </Form.Item>
              <Form.Item
                name="expiryDate"
                label="过期日期"
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  placeholder="选择过期日期（选填）"
                  size="large"
                />
              </Form.Item>
              <Form.Item
                name="notes"
                label="备注"
              >
                <TextArea rows={2} placeholder="备注信息（选填）" />
              </Form.Item>
              
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" style={{ width: '100%', background: '#fa8c16', borderColor: '#fa8c16' }}>
                  <Space>
                    <PlusOutlined />
                    <span>添加到冰箱</span>
                  </Space>
                </Button>
              </Form.Item>
            </Form>
            <div style={{ padding: 12, background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f', marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 提示：过期前3天会显示黄色临期提醒，过期后显示红色警告。<br/>
                菜谱搜索时会优先推荐能消耗临期食材的菜谱。
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <InboxOutlined style={{ color: '#fa8c16' }} />
                  <span>冰箱食材列表</span>
                  <Tag color="orange">{ingredients.length} 种</Tag>
                </Space>
                <Space>
                  {selectedRowKeys.length > 0 && (
                    <Popconfirm
                      title={`确定要删除选中的 ${selectedRowKeys.length} 项食材吗？`}
                      onConfirm={handleBatchDelete}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button danger size="small" icon={<DeleteOutlined />}>
                        批量删除
                      </Button>
                    </Popconfirm>
                  )}
                  <Select
                    value={filterStatus}
                    onChange={setFilterStatus}
                    size="small"
                    style={{ width: 120 }}
                  >
                    <Option value="all">全部</Option>
                    <Option value="normal">正常</Option>
                    <Option value="warning">临期</Option>
                    <Option value="expired">已过期</Option>
                  </Select>
                </Space>
              </Space>
            }
            loading={loading}
            extra={
              <Space size={8}>
                <Tag color="green">正常 {stats.normal}</Tag>
                <Tag color="orange">临期 {stats.warning}</Tag>
                <Tag color="red">过期 {stats.expired}</Tag>
              </Space>
            }
          >
            {ingredients.length === 0 ? (
              <Empty
                description="还没有添加任何食材"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                  录入冰箱食材，开启保质期管理
                </Text>
                <Button type="primary" onClick={() => navigate('/recipes')} style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>
                  去看看菜谱
                </Button>
              </Empty>
            ) : (
              <List
                rowSelection={rowSelection}
                dataSource={filteredIngredients}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    style={{ 
                      borderLeft: `4px solid ${getStatusColor(item)}`,
                      paddingLeft: 12,
                      marginBottom: 8,
                      background: item.expiryStatus?.status === 'expired' ? '#fff1f0' : 
                                  item.expiryStatus?.status === 'warning' ? '#fffbe6' : '#fff'
                    }}
                    actions={[
                      <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        size="small"
                        onClick={() => handleEdit(item)}
                      >
                        编辑
                      </Button>,
                      <Popconfirm
                        title="确定要删除这个食材吗？"
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
                          <Text strong style={{ fontSize: 16 }}>{item.ingredientName}</Text>
                          {getStatusTag(item)}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                          <Space>
                            <Text type="secondary">数量：</Text>
                            <Text strong>{item.quantity}</Text>
                            {item.expiryDate && (
                              <>
                                <Divider type="vertical" />
                                <Text type="secondary">过期日期：</Text>
                                <Text strong>{new Date(item.expiryDate).toLocaleDateString('zh-CN')}</Text>
                              </>
                            )}
                          </Space>
                          {item.notes && (
                            <div style={{ marginTop: 4 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <InfoCircleOutlined /> {item.notes}
                              </Text>
                            </div>
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
            <EditOutlined style={{ color: '#fa8c16' }} />
            <span>编辑食材 - {editingItem?.ingredientName}</span>
          </Space>
        }
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingItem(null);
        }}
        footer={null}
        destroyOnClose
        width={420}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Form.Item
            name="ingredientName"
            label="食材名称"
            rules={[{ required: true, message: '请输入食材名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="expiryDate"
            label="过期日期"
          >
            <DatePicker 
              style={{ width: '100%' }} 
              placeholder="选择过期日期（选填）"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={2} placeholder="备注信息（选填）" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setEditModalVisible(false);
                setEditingItem(null);
              }}>取消</Button>
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

export default FridgeManager;
