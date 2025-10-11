from aiogram import Router, html
from aiogram.filters import CommandStart
from aiogram.types import Message
from bot.handler.tg_name import telegram_name_users
from bot.keyboard.inline import markup_start
from bot.handler.text import START_TEXT
from zoneinfo import ZoneInfo

router = Router()
MOSCOW_TZ = ZoneInfo("Europe/Moscow")

@router.message(CommandStart())
async def start_bot(message: Message):

    user_data = await telegram_name_users(message)
    user_fname = user_data['fname']
    await message.answer(
        text=f"Привет! {html.bold(user_fname)} 👋\n" + START_TEXT,
        reply_markup=markup_start
    )
    