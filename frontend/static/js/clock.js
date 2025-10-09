const folderBtn = document.querySelector(".bottom-bar .fa-folder");
const userBtn = document.querySelector(".bottom-bar .fa-user");
const clockBtn = document.querySelector(".bottom-bar .fa-clock");

const notifyModal = document.getElementById("notifyModal");
const closeNotify = document.getElementById("closeNotify");

const allModals = [notifyModal].filter(Boolean);

const tasksSection = document.getElementById("tasksSection");
const taskList = document.getElementById("taskList");
const closeFilters = document.getElementById("closeFilters");
const openFilters = document.getElementById("openFilters");
const taskFilter = document.getElementById("taskFilter");

let currentTasks = [];

// Пример данных
const mockTasks = {
    project1: [
        { title: "Сделать отчёт", date: "2025-09-20", mine: true },
        { title: "Созвон с командой", date: "2025-09-21", mine: false },
        { title: "Обновить документацию", date: "2025-09-24", mine: true },
    ],
    project2: [
        { title: "Исправить баг", date: "2025-09-18", mine: true },
        { title: "Тестирование", date: "2025-09-23", mine: false },
    ],
    project3: [
        { title: "Дизайн макета1", date: "2025-09-19", mine: false },
        { title: "Обновить сайт2", date: "2025-09-24", mine: true },
        { title: "Дизайн макета3", date: "2025-09-19", mine: false },
    ],
};

// ================= DROPDOWN =================
function initDropdown(id, multiple = false) {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;

    const toggle = dropdown.querySelector(".dropdown-toggle");
    const menu = dropdown.querySelector(".search-dropdown");

    toggle.addEventListener("click", () => {
        dropdown.classList.toggle("open");
    });

    if (!multiple) {
        // Для проектов
        menu.querySelectorAll(".search-item").forEach((item) => {
            item.addEventListener("click", () => {
                toggle.textContent = item.textContent;
                toggle.dataset.value = item.dataset.value;
                dropdown.classList.remove("open");

                const project = item.dataset.value;
                if (project && mockTasks[project]) {
                    currentTasks = mockTasks[project];
                    renderTasks(currentTasks);
                    tasksSection.classList.remove("hidden");
                }
            });
        });
    }

    if (multiple) {
        // Для фильтров
        menu.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
            checkbox.addEventListener("change", () => {
                const selectedFilters = Array.from(
                    menu.querySelectorAll("input:checked")
                ).map((c) => c.value);

                console.log(selectedFilters);

                toggle.textContent = selectedFilters.length
                    ? "Фильтры: " + selectedFilters.join(", ")
                    : "Выберите фильтры";

                applyFilters(selectedFilters);
            });
        });
    }

    // Клик вне — закрываем
    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target)) dropdown.classList.remove("open");
    });
}

initDropdown("projectDropdown", false);
initDropdown("taskFilter", true);

// ================= TASKS =================
function renderTasks(tasks) {
    taskList.innerHTML = "";
    tasks.forEach((task) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${task.title}</span>
            <small>${formatDate(task.date)}</small>
        `;
        taskList.appendChild(li);
    });
}

function applyFilters(filters) {
    let filtered = [...currentTasks];
    const today = new Date().toISOString().split("T")[0];

    if (filters.includes("Дата с начала")) {
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    if (filters.includes("Дата с конца")) {
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    if (filters.includes("Сегодня")) {
        filtered = filtered.filter((t) => t.date === today);
    }
    if (filters.includes("Мои задачи")) {
        filtered = filtered.filter((t) => t.mine);
    }

    renderTasks(filtered);
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

// ================= MODALS =================
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

// ================= NAV =================
folderBtn &&
    folderBtn.addEventListener("click", () => {
        window.location.href = "/";
    });
userBtn &&
    userBtn.addEventListener("click", () => {
        window.location.href = "/profile";
    });
clockBtn &&
    clockBtn.addEventListener("click", () => {
        window.location.href = "/clock";
    });

openFilters.style.display = "none";

// Скрытие фильтра и переключение иконок
closeFilters.addEventListener("click", () => {
    taskFilter.classList.add("hidden"); // Скрываем фильтры
    openFilters.style.display = "inline-block"; // Показываем стрелку вниз
    closeFilters.style.display = "none"; // Скрываем крестик

    // Поднимаем контент
    tasksSection.style.marginTop = "15px";
});

// Показ фильтра и переключение иконок
openFilters.addEventListener("click", () => {
    taskFilter.classList.remove("hidden"); // Показываем фильтры
    closeFilters.style.display = "inline-block"; // Показываем крестик
    openFilters.style.display = "none"; // Скрываем стрелку вниз

    // Опускаем контент
    tasksSection.style.marginTop = "15px";
});
