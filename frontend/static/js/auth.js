(async () => {
    try {
        if (
            !window.Telegram ||
            !Telegram.WebApp ||
            !Telegram.WebApp.initDataUnsafe
        ) {
            console.error("Telegram WebApp не инициализирован");
            window.location.href = "/error";
            return;
        }

        const userId = Telegram.WebApp.initDataUnsafe?.user?.id;

        if (!userId) {
            console.error("Не удалось получить user_id из Telegram WebApp");
            window.location.href = "/error";
            return;
        }

        // Отправляем POST-запрос для авторизации
        const response = await fetch("/api/auth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Telegram-InitData": Telegram.WebApp.initData,
            },
            body: JSON.stringify({ user_id: userId }),
        });

        if (!response.ok) {
            window.location.href = "/error";
            throw new Error(`Auth failed: ${response.status}`);
        }

        const data = await response.json();
        console.log("Auth success:", data);
    } catch (err) {
        console.error("Ошибка при авторизации:", err);
        window.location.href = "/error";
        return;
    }
})();
