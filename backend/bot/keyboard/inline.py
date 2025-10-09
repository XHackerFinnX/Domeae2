from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.types import WebAppInfo
from config import config

markup_start = (
    InlineKeyboardBuilder().button(
        text="🎲 Открыть приложение",
        web_app=WebAppInfo(url=config.WEBAPP_URL)
    )
).as_markup()