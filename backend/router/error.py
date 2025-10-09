import os
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi import APIRouter, Request

router = APIRouter(
    prefix="",
    tags=["Error"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATES_DIR = os.path.join(BASE_DIR, "frontend", "templates")
templates = Jinja2Templates(directory=TEMPLATES_DIR)


@router.get("/error", response_class=HTMLResponse)
async def get_error(request: Request):
    return templates.TemplateResponse("error.html", {"request": request})