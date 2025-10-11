import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from auth.telegram_auth import get_verified_user
from router.model import UserId

router = APIRouter(
    prefix="",
    tags=["Auth"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATES_DIR = os.path.join(BASE_DIR, "frontend", "templates")
templates = Jinja2Templates(directory=TEMPLATES_DIR)


@router.post("/api/auth")
async def post_auth(request: UserId, user_data: dict = Depends(get_verified_user)):
    """
    Авторизация через Telegram WebApp.
    Проверяет подпись initData и сравнивает user_id из тела с верифицированным пользователем.
    """
    try:
        # user_data — результат функции get_verified_user (InitData.parse(...))
        verified_user = user_data.user  # в объекте InitData есть .user

        if not verified_user:
            raise HTTPException(status_code=401, detail="Invalid Telegram data")

        if verified_user.id != request.user_id:
            raise HTTPException(status_code=401, detail="User ID mismatch")

        # Возвращаем подтверждение
        return JSONResponse({
            "status": "success",
            "user": {
                "id": verified_user.id,
                "first_name": verified_user.first_name,
                "username": verified_user.username,
            },
            "message": "User verified successfully"
        })

    except HTTPException as e:
        raise e
    except Exception as e:
        print("Auth error:", e)
        raise HTTPException(status_code=500, detail="Internal server error")
