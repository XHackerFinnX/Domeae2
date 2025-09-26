// Логика фильтров
const FILTERS_KEY = "profileFilters";
const notifyModal = document.getElementById("notifyModal");
const closeNotify = document.getElementById("closeNotify");

const folderBtn = document.querySelector(".bottom-bar .fa-folder");
const userBtn = document.querySelector(".bottom-bar .fa-user");
const clockBtn = document.querySelector(".bottom-bar .fa-clock");

const allModals = [notifyModal].filter(Boolean);

let selectedFilters = new Set();

notifyBtn && notifyBtn.addEventListener("click", () => openModal(notifyModal));
closeNotify &&
    closeNotify.addEventListener("click", () =>
        notifyModal.classList.remove("active")
    );

function closeAllModals() {
    allModals.forEach((modal) => modal.classList.remove("active"));
}

function openModal(modal) {
    closeAllModals();
    modal.classList.add("active");
}

// Обновление счётчика активных фильтров
function updateFilterCounter() {
    const counter = document.getElementById("filterCounter");
    if (!counter) return;
    const count = selectedFilters.size;
    counter.textContent = count > 0 ? `(${count})` : "";
}

// Сохранение фильтров
// function saveFilters() {
//     localStorage.setItem(
//         FILTERS_KEY,
//         JSON.stringify(Array.from(selectedFilters))
//     );
// }

// // Загрузка фильтров
// function loadFilters() {
//     const saved = localStorage.getItem(FILTERS_KEY);
//     if (saved) {
//         try {
//             selectedFilters = new Set(JSON.parse(saved));
//         } catch {
//             selectedFilters = new Set();
//         }
//     }

//     // Восстановление состояния чекбоксов
//     document.querySelectorAll(".filter-checkbox").forEach((checkbox) => {
//         checkbox.checked = selectedFilters.has(checkbox.value);
//     });

//     updateFilterCounter();
// }

/* обработка клика по иконке */
folderBtn &&
    folderBtn.addEventListener("click", () => {
        window.location.href = "/frontend/templates/index.html";
    });

userBtn &&
    userBtn.addEventListener("click", () => {
        window.location.href = "/frontend/templates/profile.html";
    });

clockBtn &&
    clockBtn.addEventListener("click", () => {
        window.location.href = "/frontend/templates/clock.html";
    });

document.querySelectorAll(".filter-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
            selectedFilters.add(checkbox.value);
        } else {
            selectedFilters.delete(checkbox.value);
        }
        // saveFilters();
        updateFilterCounter();
        console.log("Активные фильтры:", Array.from(selectedFilters));
        // Здесь можно вызывать функцию для применения фильтрации
    });
});

document.addEventListener("DOMContentLoaded", () => {
    // Загрузка сохранённых фильтров
    // loadFilters();
});

// === Модалка статистики ===
const statsModal = document.getElementById("statsModal");
const openStatsBtn = document.getElementById("openStatsBtn");
const closeStats = document.getElementById("closeStats");

openStatsBtn.addEventListener("click", () =>
    statsModal.classList.add("active")
);
closeStats.addEventListener("click", () =>
    statsModal.classList.remove("active")
);

// === Chart.js ===
const ctx = document.getElementById("statsChart").getContext("2d");
let statsChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: generateDates(7), // по умолчанию 7 дней
        datasets: [
            {
                label: "Закрытые задачи",
                data: generateRandomData(7),
                borderColor: "#ffffffff",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                fill: true,
                tension: 0.3,
            },
        ],
    },
    options: {
        responsive: true,
        plugins: { legend: { display: false } },
    },
});

// Генерация массива дат в формате ДД.ММ
function formatDateShort(date) {
    return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
    });
}

// Генерация по дням
function generateDates(days) {
    const dates = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dates.push(formatDateShort(d)); // только день.месяц
    }
    return dates;
}

// Генерация по часам
function generateHours(hours) {
    const times = [];
    const now = new Date();
    for (let i = hours - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        times.push(
            d.toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
            })
        );
    }
    return times;
}

function generateRandomData(n) {
    return Array.from({ length: n }, () => Math.floor(Math.random() * 10));
}

// Обновление графика
function updateChart(type, value) {
    if (type === "hours") {
        statsChart.data.labels = generateHours(value);
        statsChart.data.datasets[0].data = generateRandomData(value);
    } else if (type === "days") {
        statsChart.data.labels = generateDates(value);
        statsChart.data.datasets[0].data = generateRandomData(value);
    }
    statsChart.update();
}

// Кнопки интервалов
document.querySelectorAll(".interval-buttons button").forEach((btn) => {
    btn.addEventListener("click", () => {
        const interval = btn.dataset.interval;
        switch (interval) {
            case "1h":
                updateChart("hours", 1);
                break;
            case "3h":
                updateChart("hours", 3);
                break;
            case "6h":
                updateChart("hours", 6);
                break;
            case "12h":
                updateChart("hours", 12);
                break;
            case "1d":
                updateChart("days", 1); // одна дата, один столбец
                break;
            case "3d":
                updateChart("days", 3);
                break;
            case "1w":
                updateChart("days", 7);
                break;
            case "2w":
                updateChart("days", 14);
                break;
            case "1m":
                updateChart("days", 30);
                break;
            default:
                updateChart("days", 7);
        }
    });
});

// === кастомного интервала ===
document.getElementById("applyInterval").addEventListener("click", () => {
    const from = document.getElementById("dateFrom").value;
    const to = document.getElementById("dateTo").value;
    if (!from || !to) return;

    const start = new Date(from);
    const end = new Date(to);

    if (end < start) return;

    const dates = [];
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    for (let i = 0; i < diffDays; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(formatDateShort(d));
    }

    statsChart.data.labels = dates;
    statsChart.data.datasets[0].data = generateRandomData(diffDays);
    statsChart.update();
});

// ====== Кастомный календарь (полная реализация) ======
const calendarModal = document.getElementById("calendarModal");
const calendarGrid = document.getElementById("calendarGrid");
const calendarMonth = document.getElementById("calendarMonth");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const cancelCalendarBtn = document.getElementById("cancelCalendar");
const applyCalendarBtn = document.getElementById("applyCalendar");

let currentDate = new Date(); // месяц, который показываем в гриде
let selectedDate = null; // выбранная дата (в модалке)
let activeInput = null; // <input type="date">, куда писать результат
let activeLabel = null; // label, вызывавший календарь (для показа текста)

// Вспомогательные форматы
function toISO(d) {
    return d.toISOString().split("T")[0];
}
function formatDDMMYYYY(d) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}

// Открыть календарь для конкретного input (передаём id, как в HTML: onclick="openCalendar('dateFrom')")
function openCalendar(inputId) {
    activeInput = document.getElementById(inputId);
    // найти label, который вызвал (в твоём html используется label onclick="openCalendar('dateFrom')")
    activeLabel =
        document.querySelector(`label[onclick="openCalendar('${inputId}')"]`) ||
        null;

    // если в input уже есть дата — установим её как выбранную и покажем соответствующий месяц
    if (activeInput && activeInput.value) {
        const parsed = new Date(activeInput.value + "T00:00:00");
        if (!isNaN(parsed)) {
            selectedDate = parsed;
            currentDate = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
        } else {
            selectedDate = null;
            currentDate = new Date();
        }
    } else {
        selectedDate = null;
        currentDate = new Date();
    }

    renderCalendar(currentDate);
    calendarModal.classList.add("active");
}

// Закрыть календарь (без записи)
function closeCalendar() {
    calendarModal.classList.remove("active");
}

// Рендер календаря: всегда 6×7 клеток, числа предыдущего/текущего/следующего месяцев.
// Неделя начинается с понедельника.
function renderCalendar(date) {
    calendarGrid.innerHTML = "";

    const year = date.getFullYear();
    const month = date.getMonth();

    // Заголовок месяца
    const monthNames = [
        "Январь",
        "Февраль",
        "Март",
        "Апрель",
        "Май",
        "Июнь",
        "Июль",
        "Август",
        "Сентябрь",
        "Октябрь",
        "Ноябрь",
        "Декабрь",
    ];
    calendarMonth.textContent = `${monthNames[month]} ${year}`;

    // Первый день и количество дней
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0..6 (вс..сб)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Сдвиг: хотим чтобы неделя начиналась с ПН -> convert: Mon=0..Sun=6
    const offset = (firstDayOfMonth + 6) % 7;

    // Дни предыдущего месяца
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Всего ячеек 42 (6 недель)
    const totalCells = 42;

    // 1) предыдущий месяц
    for (let i = 0; i < offset; i++) {
        const dayNum = prevMonthDays - offset + i + 1;
        const cellDate = new Date(year, month - 1, dayNum);
        const cell = createDayCell(cellDate, true);
        calendarGrid.appendChild(cell);
    }

    // 2) текущий месяц
    for (let d = 1; d <= daysInMonth; d++) {
        const cellDate = new Date(year, month, d);
        const cell = createDayCell(cellDate, false);
        calendarGrid.appendChild(cell);
    }

    // 3) следующий месяц (заполняем до 42)
    const filled = offset + daysInMonth;
    const nextDays = totalCells - filled;
    for (let d = 1; d <= nextDays; d++) {
        const cellDate = new Date(year, month + 1, d);
        const cell = createDayCell(cellDate, true);
        calendarGrid.appendChild(cell);
    }

    // Если есть выбранная дата — пометим её (в createDayCell мы уже добавляем класс 'selected' при совпадении)
}

// Создаёт DOM-элемент дня, кликабельный; inactive=true => стиль слабее (пред/след.мес)
function createDayCell(cellDate, inactive) {
    const cell = document.createElement("div");
    cell.textContent = String(cellDate.getDate());
    if (inactive) cell.classList.add("inactive");

    // пометка today
    const today = new Date();
    if (
        cellDate.getDate() === today.getDate() &&
        cellDate.getMonth() === today.getMonth() &&
        cellDate.getFullYear() === today.getFullYear()
    ) {
        cell.classList.add("today");
    }

    // пометка выбранной даты
    if (
        selectedDate &&
        cellDate.toDateString() === selectedDate.toDateString()
    ) {
        cell.classList.add("selected");
    }

    // кликабельность: при клике выбираем дату и визуально отмечаем
    cell.addEventListener("click", () => {
        // обновляем selectedDate
        selectedDate = new Date(
            cellDate.getFullYear(),
            cellDate.getMonth(),
            cellDate.getDate()
        );
        // если кликнули на ячейку из соседнего месяца — переключаем видимый месяц на её месяц
        currentDate = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            1
        );
        // перерисовать календарь, чтобы выделить выбранную
        renderCalendar(currentDate);
    });

    return cell;
}

// Навигация месяцев
prevMonthBtn &&
    prevMonthBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });
nextMonthBtn &&
    nextMonthBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

// Отмена
cancelCalendarBtn && cancelCalendarBtn.addEventListener("click", closeCalendar);

// Применить выбор: записать в activeInput и закрыть
applyCalendarBtn &&
    applyCalendarBtn.addEventListener("click", () => {
        if (selectedDate && activeInput) {
            // записываем в ISO (YYYY-MM-DD) — совместимо с <input type="date">
            activeInput.value = toISO(selectedDate);
            // activeInput.value = formatDDMMYYYY(selectedDate);

            // опционально: показываем выбранную дату рядом с label
            if (activeLabel) {
                let span = activeLabel.querySelector(".date-value");
                if (!span) {
                    span = document.createElement("span");
                    span.className = "date-value";
                    span.style.marginLeft = "8px";
                    span.style.opacity = "0.9";
                    activeLabel.appendChild(span);
                }
            }
        }
        closeCalendar();
    });

// Закрытие при клике вне контента (по затемнению)
calendarModal &&
    calendarModal.addEventListener("click", (e) => {
        if (e.target === calendarModal) closeCalendar();
    });
