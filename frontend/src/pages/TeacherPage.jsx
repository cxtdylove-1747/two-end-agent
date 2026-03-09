import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  message,
} from 'antd';
import ReactECharts from 'echarts-for-react';
import { getProjects, getClassOverview } from '../services/api';

const { Title, Paragraph } = Typography;

function TeacherPage() {
  const [projects, setProjects] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [projectRes, overviewRes] = await Promise.all([
          getProjects(),
          getClassOverview(),
        ]);
        setProjects(projectRes.projects || []);
        setOverview(overviewRes);
      } catch (err) {
        console.error(err);
        message.error('获取教师端数据失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = [
    { title: '项目名称', dataIndex: 'name', key: 'name' },
    { title: '学生', dataIndex: 'student', key: 'student' },
    { title: '当前阶段', dataIndex: 'stage', key: 'stage' },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (value) => {
        const color = value === '高' ? 'red' : value === '中' ? 'orange' : 'green';
        return <Tag color={color}>{value}</Tag>;
      },
    },
  ];

  const errorChartOption = useMemo(() => {
    if (!overview?.common_errors) return {};
    return {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: overview.common_errors.map((item) => item.name),
        axisLabel: { rotate: 20 },
      },
      yAxis: { type: 'value' },
      series: [
        {
          data: overview.common_errors.map((item) => item.count),
          type: 'bar',
          itemStyle: {
            color: '#52c41a',
          },
          animationDuration: 800,
        },
      ],
    };
  }, [overview]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Title level={3}>教师端 · 班级概览</Title>
          <Paragraph type="secondary">
            查看项目列表、风险分布与常见错误，生成教学建议，辅助课堂决策。
          </Paragraph>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card loading={loading}>
            <Statistic title="项目总数" value={overview?.total_projects ?? '--'} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={loading}>
            <Statistic title="高风险项目" value={overview?.high_risk ?? '--'} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={loading}>
            <Statistic title="平均能力得分" value={overview?.average_score ?? '--'} suffix="/ 10" precision={1} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="项目列表" loading={loading}>
            <Table
              columns={columns}
              dataSource={projects}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="常见错误排行榜" loading={loading}>
            <ReactECharts option={errorChartOption} style={{ height: 260 }} />
          </Card>
          <Card title="教学建议" style={{ marginTop: 16 }} loading={loading}>
            <Space direction="vertical">
              <Paragraph>{overview?.teaching_tip || '聚焦护城河与盈利模型，结合案例讲解。'}</Paragraph>
              <Tag color="blue">护城河</Tag>
              <Tag color="purple">渠道成本</Tag>
              <Tag color="green">用户验证</Tag>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default TeacherPage;
