import os
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi import APIRouter, Request
from auth.telegram_auth import get_verified_user
from router.model import UserId

router = APIRouter(
    prefix="",
    tags=["Basic"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATES_DIR = os.path.join(BASE_DIR, "frontend", "templates")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

@router.get("/", response_class=HTMLResponse)
async def get_basic(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})