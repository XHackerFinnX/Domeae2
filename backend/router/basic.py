import os
import json
from fastapi import HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.encoders import jsonable_encoder
from fastapi import APIRouter, Request
from auth.telegram_auth import get_verified_user
from router.model import UserId, SaveDataRequest, SaveResponse
from datetime import datetime

router = APIRouter(
    prefix="",
    tags=["Basic"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATES_DIR = os.path.join(BASE_DIR, "frontend", "templates")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

storage = {
    "data": {},
    "last_saved": None
}

@router.get("/", response_class=HTMLResponse)
async def get_basic(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@router.post("/api/save", response_model=SaveResponse)
async def save_data(data: SaveDataRequest):
    """Сохранение данных задач и проектов"""
    try:
        # Сохраняем данные
        storage["data"] = jsonable_encoder(data)
        storage["last_saved"] = datetime.now().isoformat()
        
        # Выводим данные в консоль
        print("\n" + "="*50)
        print("📥 ПОЛУЧЕНЫ ДАННЫЕ ДЛЯ СОХРАНЕНИЯ")
        print("="*50)
        print(f"🕐 Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📁 Текущий проект: {data.currentProject}")
        print(f"📊 Количество проектов: {len(data.projects)}")
        
        # Детальная информация о проектах
        for project_name, project_data in data.projects.items():
            sections = project_data.get('sections', [])
            total_tasks = sum(len(section.get('tasks', [])) for section in sections)
            print(f"\n🏷️  Проект: {project_name}")
            print(f"   📂 Секций: {len(sections)}")
            print(f"   ✅ Задач: {total_tasks}")
            
            # Информация по секциям
            for i, section in enumerate(sections, 1):
                section_name = section.get('name', 'Без названия')
                tasks = section.get('tasks', [])
                print(f"   {i}. 📋 Секция: {section_name}")
                print(f"      📝 Задач: {len(tasks)}")
                
                # Информация по задачам
                for j, task in enumerate(tasks, 1):
                    important = "🚩" if task.get('important') else "  "
                    assignee = task.get('assignee', 'Не назначен')
                    status = task.get('status', 'Без статуса')
                    comments_count = len(task.get('comments', []))
                    print(f"      {j}. {important} {task.get('title', 'Без названия')}")
                    print(f"         👤 {assignee} | 📊 {status} | 💬 {comments_count} коммент.")
        
        print("\n💾 ДАННЫЕ УСПЕШНО СОХРАНЕНЫ")
        print("="*50 + "\n")
        
        return SaveResponse(
            status="success",
            message="Data saved successfully",
            timestamp=storage["last_saved"]
        )
        
    except Exception as e:
        print(f"❌ ОШИБКА ПРИ СОХРАНЕНИИ: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Save failed: {str(e)}")

@router.get("/api/load")
async def load_data():
    """Загрузка сохраненных данных"""
    try:
        print("\n" + "="*50)
        print("📤 ЗАПРОС ДАННЫХ")
        print("="*50)
        print(f"🕐 Время запроса: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if not storage["data"]:
            print("📭 Нет сохраненных данных")
            return {"projects": {}, "currentProject": None}
        
        last_saved = storage.get("last_saved", "Неизвестно")
        data = storage["data"]
        
        # ✅ ИСПРАВЛЕНИЕ: Используем встроенный encoder FastAPI
        json_compatible_data = jsonable_encoder(data)
        
        print(f"💾 Последнее сохранение: {last_saved}")
        print(f"📁 Текущий проект: {data.get('currentProject')}")
        print(f"📊 Проектов в базе: {len(data.get('projects', {}))}")
        
        print(data)
        
        print("✅ ДАННЫЕ УСПЕШНО ОТПРАВЛЕНЫ")
        print("="*50 + "\n")
        
        return json_compatible_data
        
    except Exception as e:
        print(f"❌ ОШИБКА ПРИ ЗАГРУЗКЕ: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Load failed: {str(e)}")