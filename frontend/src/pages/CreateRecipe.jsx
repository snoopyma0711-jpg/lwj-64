import { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, Select, Button, Space, List, Typography, message, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import request from '../api/request';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CreateRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '' }]);
  const [loading, setLoading] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      fetchRecipe();
    }
  }, [id]);

  const fetchRecipe = async () => {
    try {
      const response = await request.get(`/recipes/${id}`);
      const recipe = response.data;
      form.setFieldsValue({
        name: recipe.name,
        steps: recipe.steps,
        estimatedTime: recipe.estimatedTime,
        difficulty: recipe.difficulty
      });
      setIngredients(recipe.ingredients);
    } catch (error) {
      message.error('获取菜谱信息失败');
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '' }]);
  };

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      setIngredients(newIngredients);
    }
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const onFinish = async (values) => {
    const validIngredients = ingredients.filter(ing => ing.name.trim() && ing.quantity.trim());
    
    if (validIngredients.length === 0) {
      message.error('请至少添加一种食材');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...values,
        ingredients: validIngredients
      };

      if (isEdit) {
        await request.put(`/recipes/${id}`, data);
        message.success('更新成功！');
      } else {
        await request.post('/recipes', data);
        message.success('创建成功！');
      }
      
      navigate('/recipes');
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <Title level={3} style={{ marginBottom: 24 }}>
          {isEdit ? '✏️ 编辑菜谱' : '➕ 创建新菜谱'}
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            difficulty: '中等',
            estimatedTime: 30
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item
                name="name"
                label="菜名"
                rules={[{ required: true, message: '请输入菜名' }]}
              >
                <Input placeholder="例如：番茄炒蛋" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="difficulty"
                label="难度"
                rules={[{ required: true, message: '请选择难度' }]}
              >
                <Select size="large">
                  <Option value="简单">简单</Option>
                  <Option value="中等">中等</Option>
                  <Option value="困难">困难</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="estimatedTime"
            label="预计耗时（分钟）"
            rules={[{ required: true, message: '请输入预计耗时' }]}
          >
            <InputNumber min={1} max={600} style={{ width: '100%' }} size="large" placeholder="预计烹饪时间" />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Title level={5} style={{ marginBottom: 12 }}>🥬 食材清单</Title>
            <List
              dataSource={ingredients}
              renderItem={(ing, index) => (
                <List.Item key={index}>
                  <Row gutter={8} style={{ width: '100%' }}>
                    <Col xs={10} sm={11}>
                      <Input
                        placeholder="食材名称"
                        value={ing.name}
                        onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      />
                    </Col>
                    <Col xs={10} sm={11}>
                      <Input
                        placeholder="用量（如：2个、300g）"
                        value={ing.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                      />
                    </Col>
                    <Col xs={4} sm={2} style={{ textAlign: 'right' }}>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeIngredient(index)}
                        disabled={ingredients.length === 1}
                      />
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
            <Button
              type="dashed"
              onClick={addIngredient}
              icon={<PlusOutlined />}
              style={{ width: '100%', marginTop: 12 }}
            >
              添加食材
            </Button>
          </div>

          <Form.Item
            name="steps"
            label="👨‍🍳 烹饪步骤"
            rules={[{ required: true, message: '请输入烹饪步骤' }]}
          >
            <TextArea
              rows={8}
              placeholder="详细描述烹饪步骤，建议每一步用数字编号..."
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button size="large" onClick={() => navigate('/recipes')}>
                取消
              </Button>
              <Button type="primary" size="large" htmlType="submit" loading={loading} style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>
                {isEdit ? '更新菜谱' : '发布菜谱'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateRecipe;
