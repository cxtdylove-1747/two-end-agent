import os
import random
from typing import Dict, List, Optional

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="创新创业智能体 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """
你是一位资深的创新创业教练（Senior Innovation Coach），名叫“启明”。你的任务是引导学生完善创业构想，通过启发式提问帮助他们发现逻辑漏洞，而不是直接给答案。
你的风格：专业、敏锐、带一点冷幽默。
每次回复只聚焦 1-2 个核心问题，避免信息过载。
当学生描述项目时，请结合常见的创业误区（如无竞争对手、市场大小幻觉、盈利模式不清）进行追问。
示例追问：
- “如果用户不花钱也能解决这个问题，你的产品意义在哪？”
- “如果某行业巨头下周推出同样的免费功能，你的护城河在哪里？”
- “这 1% 的用户散落在哪里？你打算花多少钱找到第一个 1%？”
请用中文回复，语气要像一位有耐心的导师。
""".strip()

RADAR_DIMENSIONS = ["痛点发现", "方案策划", "商业建模", "资源杠杆", "逻辑表达"]

PROJECTS = [
    {"project_name": "AI 二手课本平台", "student_name": "李然", "stage": "需求验证", "risk_level": "中"},
    {"project_name": "校园健康饮食推荐", "student_name": "王晨", "stage": "MVP 开发", "risk_level": "低"},
    {"project_name": "留学生法律互助助手", "student_name": "陈溪", "stage": "商业模型设计", "risk_level": "高"},
    {"project_name": "AI 竞赛组队平台", "student_name": "赵可", "stage": "路演打磨", "risk_level": "中"},
]

CLASS_OVERVIEW = {
    "project_total": 24,
    "high_risk_total": 6,
    "average_score": 72.6,
    "common_errors": [
        {"name": "无竞争对手论", "count": 12},
        {"name": "1%市场幻觉", "count": 9},
        {"name": "盈利模式不清", "count": 8},
        {"name": "渠道触达错配", "count": 7},
        {"name": "LTV < CAC", "count": 5},
    ],
    "teaching_suggestion": "建议下周重点讲解护城河理论，并用反例拆解“无竞争对手”的常见误区。",
}


class ChatRequest(BaseModel):
    user_input: str
    project_id: Optional[str] = None


class RadarItem(BaseModel):
    dimension: str
    score: float


class ChatResponse(BaseModel):
    ai_response: str
    radar_data: List[RadarItem]


def generate_radar() -> Dict[str, float]:
    return {dimension: round(random.uniform(6.0, 8.5), 1) for dimension in RADAR_DIMENSIONS}


def apply_keyword_rules(user_input: str, radar_map: Dict[str, float]) -> Dict[str, float]:
    lower_text = user_input.lower()
    if "没有对手" in user_input or "无竞争" in user_input:
        radar_map["商业建模"] = max(3.5, round(radar_map["商业建模"] - 1.3, 1))
    if "1%" in user_input or "市场很大" in user_input or "tam" in lower_text:
        radar_map["痛点发现"] = max(3.5, round(radar_map["痛点发现"] - 0.8, 1))
        radar_map["逻辑表达"] = max(3.5, round(radar_map["逻辑表达"] - 0.6, 1))
    if "免费" in user_input or "不赚钱" in user_input:
        radar_map["商业建模"] = max(3.0, round(radar_map["商业建模"] - 1.0, 1))
    return radar_map


async def call_deepseek(user_input: str) -> str:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        return "我先抛个关键问题：如果你的目标用户今天不付费也能解决这个问题，你的方案为什么依然值得选择？"

    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_input},
        ],
        "temperature": 0.7,
    }

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                "https://api.deepseek.com/chat/completions", json=payload, headers=headers
            )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except (httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"DeepSeek 调用失败，请稍后重试：{exc}") from exc


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    ai_response = await call_deepseek(request.user_input)
    radar_map = apply_keyword_rules(request.user_input, generate_radar())
    radar_data = [RadarItem(dimension=key, score=value) for key, value in radar_map.items()]
    return ChatResponse(ai_response=ai_response, radar_data=radar_data)


@app.get("/api/projects")
async def get_projects():
    return {"projects": PROJECTS}


@app.get("/api/class_overview")
async def get_class_overview():
    return CLASS_OVERVIEW
