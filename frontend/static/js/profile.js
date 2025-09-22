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
function saveFilters() {
    localStorage.setItem(
        FILTERS_KEY,
        JSON.stringify(Array.from(selectedFilters))
    );
}

// Загрузка фильтров
function loadFilters() {
    const saved = localStorage.getItem(FILTERS_KEY);
    if (saved) {
        try {
            selectedFilters = new Set(JSON.parse(saved));
        } catch {
            selectedFilters = new Set();
        }
    }

    // Восстановление состояния чекбоксов
    document.querySelectorAll(".filter-checkbox").forEach((checkbox) => {
        checkbox.checked = selectedFilters.has(checkbox.value);
    });

    updateFilterCounter();
}

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
        saveFilters();
        updateFilterCounter();
        console.log("Активные фильтры:", Array.from(selectedFilters));
        // Здесь можно вызывать функцию для применения фильтрации
    });
});

document.addEventListener("DOMContentLoaded", () => {
    // Загрузка сохранённых фильтров
    loadFilters();
});
