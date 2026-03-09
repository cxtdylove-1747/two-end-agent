import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import ReactECharts from 'echarts-for-react'
import {
  Alert,
  Button,
  Card,
  Col,
  ConfigProvider,
  Input,
  Layout,
  Menu,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'

const { Header, Content } = Layout
const { TextArea } = Input
const { Paragraph, Title, Text } = Typography

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const riskColorMap = { 高: 'red', 中: 'orange', 低: 'green' }

function StudentPage() {
  const [ideaInput, setIdeaInput] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [radarData, setRadarData] = useState([
    { dimension: '痛点发现', score: 7.1 },
    { dimension: '方案策划', score: 7.3 },
    { dimension: '商业建模', score: 6.8 },
    { dimension: '资源杠杆', score: 6.9 },
    { dimension: '逻辑表达', score: 7.0 },
  ])
  const [diagnosis, setDiagnosis] = useState('当前主要瓶颈：盈利逻辑尚未闭环。')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const radarOption = useMemo(
    () => ({
      animationDuration: 800,
      tooltip: {},
      radar: {
        indicator: radarData.map((item) => ({ name: item.dimension, max: 10 })),
        radius: '65%',
      },
      series: [
        {
          type: 'radar',
          areaStyle: { opacity: 0.3 },
          data: [{ value: radarData.map((item) => item.score), name: '能力评分' }],
        },
      ],
    }),
    [radarData],
  )

  const submitIdea = async () => {
    const trimmedInput = ideaInput.trim()
    if (!trimmedInput) return
    setLoading(true)
    setErrorMessage('')
    setChatHistory((prev) => [...prev, { role: '学生', content: trimmedInput }])
    setIdeaInput('')
    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat`, { user_input: trimmedInput })
      const { ai_response: aiResponse, radar_data: nextRadarData } = response.data
      setChatHistory((prev) => [...prev, { role: 'AI 教练', content: aiResponse }])
      setRadarData(nextRadarData)
      if (nextRadarData.some((item) => item.dimension === '商业建模' && item.score < 5.5)) {
        setDiagnosis('当前主要瓶颈：商业建模风险较高，请优先验证盈利逻辑。')
      } else {
        setDiagnosis('当前主要瓶颈：市场验证证据不足，建议补充用户访谈。')
      }
    } catch (error) {
      const detail = error?.response?.data?.detail || '请求失败，请检查后端服务是否已启动。'
      setErrorMessage(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={14}>
        <Card title="项目输入区" className="glass-card">
          <Space orientation="vertical" style={{ width: '100%' }}>
            <TextArea
              rows={4}
              value={ideaInput}
              placeholder="例如：我想做一个基于 AI 的二手课本交易平台，针对北京留学生。"
              onChange={(event) => setIdeaInput(event.target.value)}
            />
            <Button type="primary" onClick={submitIdea} loading={loading}>
              获取 AI 教练追问
            </Button>
            {errorMessage && <Alert type="error" showIcon message={errorMessage} />}
          </Space>
        </Card>
        <Card title="对话历史区" className="glass-card" style={{ marginTop: 16 }}>
          {chatHistory.length === 0 && <Text type="secondary">先输入你的项目想法，AI 教练会开始追问。</Text>}
          {chatHistory.map((item, index) => (
            <div className="chat-item" key={`${item.role}-${index}`}>
              <Text strong>{item.role}</Text>
              <Paragraph style={{ marginBottom: 0, marginTop: 6 }}>{item.content}</Paragraph>
            </div>
          ))}
        </Card>
      </Col>
      <Col xs={24} xl={10}>
        <Card title="能力雷达图" className="glass-card">
          <ReactECharts option={radarOption} style={{ height: 320 }} />
        </Card>
        <Card title="项目诊断报告（预览）" className="glass-card" style={{ marginTop: 16 }}>
          <Paragraph>{diagnosis}</Paragraph>
        </Card>
      </Col>
    </Row>
  )
}

function TeacherPage() {
  const [projects, setProjects] = useState([])
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const [projectRes, overviewRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/projects`),
          axios.get(`${API_BASE_URL}/api/class_overview`),
        ])
        setProjects(projectRes.data.projects || [])
        setOverview(overviewRes.data)
      } catch (error) {
        const detail = error?.response?.data?.detail || '数据加载失败，请检查后端服务。'
        setErrorMessage(detail)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const chartOption = useMemo(() => {
    const commonErrors = overview?.common_errors || []
    return {
      animationDuration: 900,
      tooltip: {},
      xAxis: { type: 'category', data: commonErrors.map((item) => item.name), axisLabel: { interval: 0, rotate: 20 } },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: commonErrors.map((item) => item.count), itemStyle: { color: '#2f54eb' } }],
    }
  }, [overview])

  const columns = [
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name' },
    { title: '学生姓名', dataIndex: 'student_name', key: 'student_name' },
    { title: '当前阶段', dataIndex: 'stage', key: 'stage' },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (value) => <Tag color={riskColorMap[value]}>{value}</Tag>,
    },
  ]

  if (loading) {
    return (
      <div className="loading-wrap">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      {errorMessage && <Alert type="error" showIcon message={errorMessage} />}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="glass-card">
            <Statistic title="项目总数" value={overview?.project_total || 0} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="glass-card">
            <Statistic
              title="高风险项目数"
              value={overview?.high_risk_total || 0}
              styles={{ content: { color: '#cf1322' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="glass-card">
            <Statistic title="平均能力得分" value={overview?.average_score || 0} precision={1} suffix="分" />
          </Card>
        </Col>
      </Row>
      <Card title="项目列表" className="glass-card">
        <Table rowKey="project_name" columns={columns} dataSource={projects} pagination={false} />
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="常见错误排行榜" className="glass-card">
            <ReactECharts option={chartOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="教学建议" className="glass-card">
            <Paragraph>{overview?.teaching_suggestion}</Paragraph>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

function AppLayout() {
  const location = useLocation()
  const selectedKey = location.pathname.startsWith('/teacher') ? '/teacher' : '/student'

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1677ff', borderRadius: 10 } }}>
      <Layout className="main-layout">
        <Header className="top-header">
          <div className="logo-title">创新创业智能体 Demo</div>
          <Menu
            mode="horizontal"
            theme="dark"
            selectedKeys={[selectedKey]}
            items={[
              { key: '/student', label: <Link to="/student">学生端</Link> },
              { key: '/teacher', label: <Link to="/teacher">教师端</Link> },
            ]}
          />
        </Header>
        <Content className="content-wrap">
          <Title level={3}>创新创业智能体（第一次迭代）</Title>
          <Routes>
            <Route path="/student" element={<StudentPage />} />
            <Route path="/teacher" element={<TeacherPage />} />
            <Route path="*" element={<Navigate to="/student" replace />} />
          </Routes>
        </Content>
      </Layout>
    </ConfigProvider>
  )
}

function App() {
  return <AppLayout />
}

export default App
