import json
import os
from pathlib import Path
from typing import List, Optional

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

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


class RadarItem(BaseModel):
    dimension: str
    score: float


class ChatRequest(BaseModel):
    user_input: str = Field(..., min_length=1, description="学生输入的项目想法或回复")
    project_id: Optional[str] = Field(default=None, description="项目 ID，可选")


class ChatResponse(BaseModel):
    ai_response: str
    radar_data: List[RadarItem]


app = FastAPI(title="Innovation Coach API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_json(filepath: Path):
    with filepath.open(encoding="utf-8") as f:
        return json.load(f)


PROJECTS = load_json(DATA_DIR / "projects.json")
CLASS_OVERVIEW = load_json(DATA_DIR / "class_overview.json")


def keyword_adjustment(user_input: str) -> List[RadarItem]:
    base_scores = {
        "痛点发现": 7.5,
        "方案策划": 7.0,
        "商业建模": 7.2,
        "资源杠杆": 6.8,
        "逻辑表达": 7.4,
    }

    lower_text = user_input.lower()

    if "没有对手" in user_input or "无竞争对手" in user_input or "no competitor" in lower_text:
        base_scores["商业建模"] -= 1.2
    if "盈利" in user_input or "变现" in user_input:
        base_scores["商业建模"] += 0.5
    if "市场" in user_input:
        base_scores["痛点发现"] += 0.3
    if "渠道" in user_input or "获客" in user_input:
        base_scores["资源杠杆"] += 0.6
    if "用户画像" in user_input or "persona" in lower_text:
        base_scores["方案策划"] += 0.5
    if "ppt" in lower_text or "表达" in user_input:
        base_scores["逻辑表达"] += 0.4

    adjusted = [
        RadarItem(dimension=key, score=round(max(0.0, min(10.0, value)), 2))
        for key, value in base_scores.items()
    ]
    return adjusted


def call_deepseek_api(user_input: str) -> str:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        return mock_ai_response(user_input)

    url = "https://api.deepseek.com/chat/completions"
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_input},
        ],
        "temperature": 0.7,
        "stream": False,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception as exc:  # pragma: no cover - network failure fallback
        return mock_ai_response(user_input, error=str(exc))


def mock_ai_response(user_input: str, error: Optional[str] = None) -> str:
    suffix = "（已使用本地示例回复）" if error or not os.getenv("DEEPSEEK_API_KEY") else ""
    tips = [
        "如果不花钱也能解决这个问题，为什么用户还会选择你？",
        "假如巨头下周上线同样功能，你的护城河在哪里？",
    ]
    prompt_hint = tips[len(user_input) % len(tips)]
    return f"{prompt_hint} {suffix}"


@app.post("/api/chat", response_model=ChatResponse)
def chat_with_coach(request: ChatRequest):
    if not request.user_input.strip():
        raise HTTPException(status_code=400, detail="user_input 不能为空")

    ai_reply = call_deepseek_api(request.user_input.strip())
    radar = keyword_adjustment(request.user_input)

    return ChatResponse(ai_response=ai_reply, radar_data=radar)


@app.get("/api/projects")
def get_projects():
    return {"projects": PROJECTS}


@app.get("/api/class_overview")
def get_class_overview():
    return CLASS_OVERVIEW


@app.get("/")
def root():
    return {"message": "Innovation Coach API is running"}
