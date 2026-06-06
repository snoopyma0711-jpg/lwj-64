import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Button, Space } from 'antd';
import { UserOutlined, LogoutOutlined, PlusOutlined, UnorderedListOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import RecipeList from './pages/RecipeList';
import RecipeDetail from './pages/RecipeDetail';
import CreateRecipe from './pages/CreateRecipe';
import WeeklyPlan from './pages/WeeklyPlan';
import { Link, useLocation } from 'react-router-dom';

const { Header, Content, Footer } = Layout;

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/recipes" /> : children;
};

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout
      }
    ]
  };

  const menuItems = [
    {
      key: '/recipes',
      icon: <UnorderedListOutlined />,
      label: <Link to="/recipes">菜谱列表</Link>
    },
    {
      key: '/create',
      icon: <PlusOutlined />,
      label: <Link to="/create">创建菜谱</Link>
    },
    {
      key: '/weekly-plan',
      icon: <CalendarOutlined />,
      label: <Link to="/weekly-plan">周计划 & 购物清单</Link>
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ margin: 0, marginRight: 40, fontSize: 20, fontWeight: 600, color: '#fa8c16' }}>
            🍳 菜谱工坊
          </h1>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ borderBottom: 'none', flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {user && (
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#fa8c16' }} />
                <span>{user.username}</span>
              </Space>
            </Dropdown>
          )}
        </div>
      </Header>
      <Content style={{ padding: '24px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {children}
      </Content>
      <Footer style={{ textAlign: 'center', background: '#fff' }}>
        菜谱工坊 ©{new Date().getFullYear()} - 多人协同美食分享平台
      </Footer>
    </Layout>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/recipes" element={<PrivateRoute><AppLayout><RecipeList /></AppLayout></PrivateRoute>} />
      <Route path="/recipes/:id" element={<PrivateRoute><AppLayout><RecipeDetail /></AppLayout></PrivateRoute>} />
      <Route path="/create" element={<PrivateRoute><AppLayout><CreateRecipe /></AppLayout></PrivateRoute>} />
      <Route path="/edit/:id" element={<PrivateRoute><AppLayout><CreateRecipe /></AppLayout></PrivateRoute>} />
      <Route path="/weekly-plan" element={<PrivateRoute><AppLayout><WeeklyPlan /></AppLayout></PrivateRoute>} />
      <Route path="/" element={<Navigate to="/recipes" />} />
      <Route path="*" element={<Navigate to="/recipes" />} />
    </Routes>
  );
};

export default App;
