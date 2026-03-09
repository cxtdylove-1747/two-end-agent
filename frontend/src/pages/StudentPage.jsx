import { useMemo, useState } from 'react';
import {
  Card,
  Typography,
  Input,
  Button,
  List,
  Tag,
  Space,
  Row,
  Col,
  Divider,
  message,
} from 'antd';
import ReactECharts from 'echarts-for-react';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { chatWithCoach } from '../services/api';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const defaultRadar = [
  { dimension: '痛点发现', score: 7.5 },
  { dimension: '方案策划', score: 7.0 },
  { dimension: '商业建模', score: 7.2 },
  { dimension: '资源杠杆', score: 6.8 },
  { dimension: '逻辑表达', score: 7.4 },
];

const shortcutPrompts = [
  '我想做一个面向留学生的二手课本交易平台',
  '我们的想法是低碳出行助手，主打校园场景',
  '想做一个 AI 导师帮助写商业计划书',
];

function buildDiagnosis(radar) {
  if (!radar?.length) return '当前主要瓶颈：盈利逻辑尚未闭环';
  const weakest = radar.reduce((prev, curr) => (curr.score < prev.score ? curr : prev), radar[0]);
  return `当前主要瓶颈：${weakest.dimension} 需要加强，建议进一步验证假设。`;
}

function StudentPage() {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: '你好，我是创新创业教练“启明”。简要描述你的想法，我会用 1-2 个追问帮你识别关键风险。',
    },
  ]);
  const [radarData, setRadarData] = useState(defaultRadar);
  const [diagnosis, setDiagnosis] = useState(buildDiagnosis(defaultRadar));
  const [loading, setLoading] = useState(false);

  const radarOption = useMemo(
    () => ({
      tooltip: {},
      radar: {
        indicator: radarData.map((item) => ({
          name: item.dimension,
          max: 10,
        })),
        radius: '70%',
      },
      series: [
        {
          type: 'radar',
          areaStyle: { color: 'rgba(22, 119, 255, 0.15)' },
          lineStyle: { color: '#1677ff' },
          symbol: 'circle',
          symbolSize: 6,
          data: [
            {
              value: radarData.map((item) => item.score),
              name: '能力得分',
            },
          ],
        },
      ],
    }),
    [radarData],
  );

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    const newMessages = [
      ...messages,
      { role: 'user', content: userInput.trim() },
    ];
    setMessages(newMessages);
    setLoading(true);
    try {
      const data = await chatWithCoach({
        user_input: userInput.trim(),
      });
      setMessages([
        ...newMessages,
        { role: 'ai', content: data.ai_response },
      ]);
      setRadarData(data.radar_data || defaultRadar);
      setDiagnosis(buildDiagnosis(data.radar_data || defaultRadar));
      setUserInput('');
    } catch (error) {
      console.error(error);
      message.error('获取 AI 回复失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Title level={3}>学生端 · AI 教练</Title>
          <Paragraph type="secondary">
            输入你的项目想法，启明将通过启发式追问帮助你打磨逻辑并更新能力雷达。
          </Paragraph>
        </div>
        <Space>
          {shortcutPrompts.map((item) => (
            <Tag
              key={item}
              color="blue"
              onClick={() => setUserInput(item)}
              className="clickable-tag"
            >
              {item}
            </Tag>
          ))}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="项目输入与 AI 教练"
            extra={
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={loading}
                onClick={sendMessage}
              >
                发送
              </Button>
            }
          >
            <TextArea
              rows={4}
              placeholder="描述你的项目想法或当前瓶颈..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
            <Divider dashed />
            <List
              className="chat-list"
              dataSource={messages}
              renderItem={(item) => (
                <List.Item className={item.role === 'ai' ? 'ai-message' : 'user-message'}>
                  <List.Item.Meta
                    avatar={item.role === 'ai' ? <RobotOutlined /> : <UserOutlined />}
                    title={
                      <Space>
                        <Text strong>{item.role === 'ai' ? 'AI 教练' : '学生'}</Text>
                        <Tag color={item.role === 'ai' ? 'geekblue' : 'green'}>
                          {item.role === 'ai' ? '启发式追问' : '输入'}
                        </Tag>
                      </Space>
                    }
                    description={<Text>{item.content}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="能力雷达图">
            <ReactECharts option={radarOption} style={{ height: 320 }} />
            <Paragraph type="secondary" style={{ marginTop: 8 }}>
              根据对话内容动态调整五大维度评分，突出当前优势与薄弱点。
            </Paragraph>
          </Card>
          <Card title="项目诊断报告" style={{ marginTop: 16 }}>
            <Paragraph>
              <Text strong>{diagnosis}</Text>
            </Paragraph>
            <Paragraph type="secondary">
              建议结合用户访谈与竞品分析，验证核心假设，补充商业模型与渠道成本测算。
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default StudentPage;
