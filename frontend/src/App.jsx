import { Layout, Menu, Typography, Button } from 'antd';
import {
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import StudentPage from './pages/StudentPage';
import TeacherPage from './pages/TeacherPage';
import Landing from './pages/Landing';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey = location.pathname.startsWith('/teacher')
    ? 'teacher'
    : location.pathname.startsWith('/student')
      ? 'student'
      : 'home';

  const menuItems = [
    { key: 'home', label: '首页', icon: <HomeOutlined />, path: '/' },
    { key: 'student', label: '学生端', icon: <UserOutlined />, path: '/student' },
    { key: 'teacher', label: '教师端', icon: <TeamOutlined />, path: '/teacher' },
  ];

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="brand" onClick={() => navigate('/')}>
          <div className="brand-icon">
            <RocketOutlined />
          </div>
          <div>
            <Title level={4} className="brand-title">
              启明 · 创新创业智能体
            </Title>
            <div className="brand-subtitle">面向高校的智能教练与决策助手</div>
          </div>
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ flex: 1, minWidth: 240 }}
          onClick={({ key }) => {
            const target = menuItems.find((item) => item.key === key);
            if (target) navigate(target.path);
          }}
        />
        <Button type="primary" className="cta-button" onClick={() => navigate('/student')}>
          立即体验
        </Button>
      </Header>
      <Content className="app-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/student" element={<StudentPage />} />
          <Route path="/teacher" element={<TeacherPage />} />
        </Routes>
      </Content>
      <Footer className="app-footer">©2024 启明创新教练 · DeepSeek 驱动</Footer>
    </Layout>
  );
}

export default App;
