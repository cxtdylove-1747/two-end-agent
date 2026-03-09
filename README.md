# 启明创新创业智能体（学生端 & 教师端）

本项目提供一个可演示的「创新创业智能体」原型，包括：
- **后端（FastAPI）**：对接 DeepSeek Chat 接口，提供学生对话、项目列表、班级概览等 API。
- **前端（React + Vite + Ant Design + ECharts）**：学生端输入想法获取 AI 启发式追问，教师端查看项目列表与常见错误排行榜。

## 快速开始

### 后端
1. 安装依赖
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. 设置环境变量（可选，未设置时使用本地示例回复）
   ```bash
   export DEEPSEEK_API_KEY=your_api_key
   ```
3. 启动服务
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   关键接口：
   - `POST /api/chat`：传入 `{"user_input": "...", "project_id": "可选"}` 返回 AI 回复与雷达得分
   - `GET /api/projects`：教师端项目列表（模拟数据）
   - `GET /api/class_overview`：班级概览与常见错误（模拟数据）

### 前端
1. 安装依赖
   ```bash
   cd frontend
   npm install
   ```
2. 启动开发环境
   ```bash
   npm run dev
   ```
   - 默认通过 Vite 代理将 `/api/*` 请求转发到 `http://localhost:8000`
   - 如需自定义后端地址，可在运行前设置 `VITE_API_BASE_URL`

3. 访问页面
   - 学生端：`http://localhost:5173/student`
   - 教师端：`http://localhost:5173/teacher`

## 目录结构
```
backend/              # FastAPI 应用与模拟数据
frontend/             # React + Vite 前端
```

## 说明
- DeepSeek API 调用在未配置密钥时自动回退到示例回复，便于演示。
- 雷达图与错误排行榜使用 ECharts，具有动画效果；界面基于 Ant Design 设计语言。
