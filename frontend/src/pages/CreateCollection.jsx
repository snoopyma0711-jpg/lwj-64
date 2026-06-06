import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Space, List, Typography, message, Row, Col, Checkbox, Tag, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, HolderOutlined, SearchOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import request from '../api/request';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CreateCollection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [allRecipes, setAllRecipes] = useState([]);
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const isEdit = !!id;

  useEffect(() => {
    fetchAllRecipes();
    if (isEdit) {
      fetchCollection();
    }
  }, [id]);

  const fetchAllRecipes = async () => {
    try {
      const response = await request.get('/recipes');
      setAllRecipes(response.data);
    } catch (error) {
      message.error('获取菜谱列表失败');
    }
  };

  const fetchCollection = async () => {
    try {
      const response = await request.get(`/collections/${id}`);
      const collection = response.data;
      form.setFieldsValue({
        name: collection.name,
        description: collection.description
      });
      setSelectedRecipes(collection.recipes || []);
    } catch (error) {
      message.error('获取合集信息失败');
    }
  };

  const filteredRecipes = allRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const isRecipeSelected = (recipeId) => {
    return selectedRecipes.some(r => r.id === recipeId);
  };

  const toggleRecipe = (recipe) => {
    if (isRecipeSelected(recipe.id)) {
      setSelectedRecipes(selectedRecipes.filter(r => r.id !== recipe.id));
    } else {
      setSelectedRecipes([...selectedRecipes, recipe]);
    }
  };

  const addAllFiltered = () => {
    const newRecipes = filteredRecipes.filter(
      r => !isRecipeSelected(r.id)
    );
    setSelectedRecipes([...selectedRecipes, ...newRecipes]);
  };

  const removeRecipe = (index) => {
    const newRecipes = selectedRecipes.filter((_, i) => i !== index);
    setSelectedRecipes(newRecipes);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === index) return;

    const newRecipes = [...selectedRecipes];
    const draggedRecipe = newRecipes[draggedIndex];
    newRecipes.splice(draggedIndex, 1);
    newRecipes.splice(index, 0, draggedRecipe);
    setSelectedRecipes(newRecipes);
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
    if (!isEdit) return;
    
    setLoading(true);
    try {
      const recipeIds = selectedRecipes.map(r => r.id);
      await request.put(`/collections/${id}/reorder`, { recipeIds });
      message.success('排序已保存');
    } catch (error) {
      message.error(error.response?.data?.error || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    if (selectedRecipes.length === 0) {
      message.error('请至少选择一个菜谱');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...values,
        recipeIds: selectedRecipes.map(r => r.id)
      };

      if (isEdit) {
        await request.put(`/collections/${id}`, data);
        message.success('更新成功！');
      } else {
        await request.post('/collections', data);
        message.success('创建成功！');
      }
      
      navigate('/collections');
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const totalTime = selectedRecipes.reduce((sum, r) => sum + r.estimatedTime, 0);

  return (
    <div>
      <Card>
        <Title level={3} style={{ marginBottom: 24 }}>
          {isEdit ? '✏️ 编辑菜谱合集' : '📚 创建菜谱合集'}
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="name"
            label="合集名称"
            rules={[{ required: true, message: '请输入合集名称' }]}
          >
            <Input placeholder="例如：减脂餐一周搭配、家常快手菜Top10" size="large" maxLength={50} showCount />
          </Form.Item>

          <Form.Item
            name="description"
            label="合集简介"
            rules={[{ required: true, message: '请输入合集简介' }]}
          >
            <TextArea
              rows={4}
              placeholder="介绍一下这个合集的主题和特点..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Title level={5} style={{ margin: 0 }}>🍽️ 可选菜谱</Title>
                  <Button size="small" type="primary" onClick={addAllFiltered} disabled={filteredRecipes.length === 0} style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>
                    <PlusOutlined /> 全部添加
                  </Button>
                </div>
                
                <Input
                  placeholder="搜索菜谱..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ marginBottom: 12 }}
                  allowClear
                />

                <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: 8, padding: 8 }}>
                  {filteredRecipes.length === 0 ? (
                    <Empty description="没有找到菜谱" style={{ padding: 40 }} />
                  ) : (
                    <List
                      dataSource={filteredRecipes}
                      renderItem={(recipe) => (
                        <List.Item
                          key={recipe.id}
                          style={{
                            padding: '8px 12px',
                            marginBottom: 4,
                            borderRadius: 6,
                            cursor: 'pointer',
                            backgroundColor: isRecipeSelected(recipe.id) ? '#fff2e8' : 'transparent',
                            border: isRecipeSelected(recipe.id) ? '1px solid #ffd591' : '1px solid transparent'
                          }}
                          onClick={() => toggleRecipe(recipe)}
                        >
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Space>
                              <Checkbox checked={isRecipeSelected(recipe.id)} />
                              <Text strong>{recipe.name}</Text>
                            </Space>
                            <Tag icon={<ClockCircleOutlined />} color="blue">
                              {recipe.estimatedTime}分钟
                            </Tag>
                          </Space>
                        </List.Item>
                      )}
                    />
                  )}
                </div>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Title level={5} style={{ margin: 0 }}>
                    📋 已选菜谱 ({selectedRecipes.length})
                  </Title>
                  <Space>
                    <Tag color="orange">共 {totalTime} 分钟</Tag>
                    {isEdit && (
                      <Button size="small" type="primary" onClick={saveOrder} loading={loading} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                        保存排序
                      </Button>
                    )}
                  </Space>
                </div>
                
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                  <HolderOutlined style={{ marginRight: 4 }} />
                  拖拽左侧图标调整顺序
                </Text>

                <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: 8, padding: 8 }}>
                  {selectedRecipes.length === 0 ? (
                    <Empty description="点击左侧菜谱添加到合集" style={{ padding: 40 }} />
                  ) : (
                    <List
                      dataSource={selectedRecipes}
                      renderItem={(recipe, index) => (
                        <List.Item
                          key={recipe.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          onDrop={handleDrop}
                          style={{
                            padding: '8px 12px',
                            marginBottom: 4,
                            borderRadius: 6,
                            cursor: 'move',
                            backgroundColor: draggedIndex === index ? '#e6f7ff' : '#fafafa',
                            border: draggedIndex === index ? '1px solid #91d5ff' : '1px solid #f0f0f0'
                          }}
                        >
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Space>
                              <HolderOutlined style={{ color: '#bfbfbf', cursor: 'grab' }} />
                              <Tag color="orange">{index + 1}</Tag>
                              <Text strong>{recipe.name}</Text>
                            </Space>
                            <Space>
                              <Tag icon={<ClockCircleOutlined />} color="blue">
                                {recipe.estimatedTime}分钟
                              </Tag>
                              <Button
                                danger
                                type="text"
                                icon={<DeleteOutlined />}
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRecipe(index);
                                }}
                              />
                            </Space>
                          </Space>
                        </List.Item>
                      )}
                    />
                  )}
                </div>
              </div>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button size="large" onClick={() => navigate('/collections')}>
                取消
              </Button>
              <Button type="primary" size="large" htmlType="submit" loading={loading} style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>
                {isEdit ? '更新合集' : '发布合集'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateCollection;
