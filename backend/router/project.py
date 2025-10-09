import os
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi import APIRouter, Request
from auth.telegram_auth import get_verified_user

router = APIRouter(
    prefix="",
    tags=["Project"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATES_DIR = os.path.join(BASE_DIR, "frontend", "templates")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

@router.get("/project/{project_name}", response_class=HTMLResponse)
async def get_project(request: Request, project_name: str):
    print(project_name)
    context = {
        "request": request,
        "project_name": project_name
    }
    return templates.TemplateResponse("project.html", context)