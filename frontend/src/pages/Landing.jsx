import { Card, Col, Row, Typography, Tag, Space } from 'antd';
import {
  BulbOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const highlights = [
  {
    title: 'AI 启发式追问',
    icon: <BulbOutlined />,
    desc: '聚焦 1-2 个关键问题，帮学生识别创业盲区。',
    action: '前往学生端',
    path: '/student',
  },
  {
    title: '班级全景视图',
    icon: <BarChartOutlined />,
    desc: '实时掌握项目分布与风险，智能生成教学建议。',
    action: '查看教师端',
    path: '/teacher',
  },
  {
    title: '能力雷达与诊断',
    icon: <ThunderboltOutlined />,
    desc: '根据对话动态更新五维度得分，输出诊断卡片。',
    action: '立即体验',
    path: '/student',
  },
];

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="hero">
        <Title level={2}>打造“启明”创新创业智能体</Title>
        <Paragraph type="secondary">
          面向高校的 AI 教练与教学助手，帮学生完善创业构想，也为教师提供班级学情洞察。
        </Paragraph>
        <Space size="middle">
          <Tag color="processing">DeepSeek 驱动</Tag>
          <Tag color="success">能力雷达</Tag>
          <Tag color="geekblue">常见错误排行榜</Tag>
        </Space>
      </div>
      <Row gutter={[16, 16]}>
        {highlights.map((item) => (
          <Col xs={24} md={8} key={item.title}>
            <Card
              hoverable
              className="feature-card"
              onClick={() => navigate(item.path)}
              title={
                <Space>
                  <span className="feature-icon">{item.icon}</span>
                  {item.title}
                </Space>
              }
              extra={<a onClick={() => navigate(item.path)}>{item.action}</a>}
            >
              <Paragraph>{item.desc}</Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default Landing;
