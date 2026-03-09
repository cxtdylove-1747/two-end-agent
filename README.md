# 创新创业智能体（第一次迭代原型）

本仓库提供一个可演示的“双端”原型系统：

- 学生端：`/student`
- 教师端：`/teacher`
- 后端 API：FastAPI（含 DeepSeek 调用）

## 目录结构

```text
two-end-agent/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 后端运行

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DEEPSEEK_API_KEY=你的密钥
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> 若未设置 `DEEPSEEK_API_KEY`，`/api/chat` 会返回内置演示追问，方便本地联调。

## 前端运行

```bash
cd frontend
npm install
npm run dev
```

默认访问：

- `http://localhost:5173/student`
- `http://localhost:5173/teacher`

如需指定后端地址，可在前端环境变量设置：

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

可选跨域配置（后端）：

```bash
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```
