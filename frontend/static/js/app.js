const PRESS_DELAY = 700;
const MOVE_THRESHOLD = 10;

/* ===================== элементы страницы ===================== */
const notifyBtn = document.getElementById("notifyBtn");
const notifyModal = document.getElementById("notifyModal");
const menuModal = document.getElementById("menuModal");
const menuBtn = document.getElementById("menuBtn");
const closeNotify = document.getElementById("closeNotify");
const closeMenu = document.getElementById("closeMenu");
const sectionsContainer = document.getElementById("sectionsContainer");

const openAddSectionBtn = document.getElementById("openAddSection");
const sectionModal = document.getElementById("sectionModal");
const closeSectionModal = document.getElementById("closeSectionModal");
const addSectionBtn = document.getElementById("addSectionBtn");
const sectionNameInput = document.getElementById("sectionNameInput");

const taskModal = document.getElementById("taskModal");
const closeTaskModal = document.getElementById("closeTaskModal");
const createTaskBtn = document.getElementById("createTaskBtn");

const contextMenu = document.getElementById("sectionContextMenu");
const projectName = document.getElementById("my-name-project");
const folderBtn = document.querySelector(".bottom-bar .fa-folder");
const userBtn = document.querySelector(".bottom-bar .fa-user");
const clockBtn = document.querySelector(".bottom-bar .fa-clock");

/* модалки переименования/удаления */
const renameModal = document.getElementById("renameModal");
const closeRenameModal = document.getElementById("closeRenameModal");
const renameSectionInput = document.getElementById("renameSectionInput");
const renameSectionBtn = document.getElementById("renameSectionBtn");

const deleteModal = document.getElementById("deleteModal");
const closeDeleteModal = document.getElementById("closeDeleteModal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

const projectsList = document.getElementById("projectsList");
const modalProjectsList = document.getElementById("modalProjectsList");
const openAddProjectBtn = document.getElementById("openAddProjectBtn");
const addProjectModal = document.getElementById("addProjectModal");
const closeAddProjectModal = document.getElementById("closeAddProjectModal");
const addProjectBtn = document.getElementById("addProjectBtn");
const projectNameInput = document.getElementById("projectNameInput");

/* ===================== редактирование задачи (элементы, могут отсутствовать) ===================== */
let editTaskModal = document.getElementById("editTaskModal");
let closeEditTaskModal = document.getElementById("closeEditTaskModal");
let editTaskTitle = document.getElementById("editTaskTitle");
let editTaskDesc = document.getElementById("editTaskDesc");
let editTaskAssignee = document.getElementById("editTaskAssignee");
let editTaskStatus = document.getElementById("editTaskStatus");
let commentsList = document.getElementById("commentsList");
let newCommentInput = document.getElementById("newCommentInput");
let addCommentBtn = document.getElementById("addCommentBtn");
/* =========================================================================================== */

/* ===================== переключение экранов ===================== */
const projectsSection = document.getElementById("projectsSection");
const projectSection = document.getElementById("projectSection");

let sectionToRename = null;
let sectionToDelete = null;
let contextTarget = null;
let currentSection = null;
let projects = {};
let currentProject = null;
let selectedFilters = [];

/* активная задача (при редактировании) */
let activeTask = null;

/* ===================== универсальная логика модалок ===================== */
const allModals = [
    notifyModal,
    menuModal,
    sectionModal,
    taskModal,
    renameModal,
    deleteModal,
    addProjectModal,
    editTaskModal,
].filter(Boolean);

function closeAllModals() {
    allModals.forEach((modal) => modal.classList.remove("active"));
}

function openModal(modal) {
    closeAllModals();
    modal.classList.add("active");
}

/* ===================== динамические стили (вставляем в head) ===================== */
(function injectStyles() {
    const css = `
  .ghost {
    position: fixed;
    z-index: 9999;
    pointer-events: none;
    box-shadow: 0 12px 30px rgba(0,0,0,0.6);
    transform: translateZ(0);
    border-radius: 10px;
    transition: left 180ms ease, top 180ms ease, transform 120ms ease, opacity 200ms ease;
    will-change: left, top, transform;
    background: inherit;
  }
  .tasks {
    min-height: 0;
    transition: min-height 0.2s ease;
    min-height: 60px;
  }
  .tasks.highlight {
    box-shadow: inset 0 0 0 2px rgba(255,255,255,0.06);
    border-radius: 8px;
  }
  .tasks.expand {
    min-height: 60px;
  }
  .moved-outline {
    animation: movedOutline 900ms ease forwards;
  }
  @keyframes movedOutline {
    0% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
    40% { box-shadow: 0 0 0 6px rgba(255,255,255,0.18); }
    100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
  }`;
    const s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
})();

/* ===================== Утилиты для работы с LocalStorage ===================== */
// function saveToLocalStorage() {
//     const dataToSave = {
//         projects: projects,
//         currentProject: currentProject,
//     };
//     localStorage.setItem("taskManagerData", JSON.stringify(dataToSave));
// }

// function loadFromLocalStorage() {
//     const savedData = localStorage.getItem("taskManagerData");
//     console.log(savedData);
//     if (savedData) {
//         const parsedData = JSON.parse(savedData);
//         projects = parsedData.projects || {};
//         currentProject = parsedData.currentProject || null;

//         renderProjectsList();
//     }
// }

/* ===================== Модификация функций для работы с комментариями ===================== */
function createCommentElement(text, dateTime, isNew = true) {
    const comment = document.createElement("div");
    comment.className = "comment";

    const now = new Date();
    const dateStr = isNew
        ? now.toLocaleDateString("ru-RU", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
          })
        : dateTime.split(" ")[0];
    const timeStr = isNew
        ? now.toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
          })
        : dateTime.split(" ")[1];

    comment.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <span class="avatar-circle">👤</span>
                <strong>Текущий пользователь</strong>
                <small style="opacity:0.7;">${dateStr} ${timeStr}</small>
            </div>
            <i class="fas fa-trash delete-comment" style="cursor:pointer; opacity:0.7;"></i>
        </div>
        <div>${escapeHtml(text)}</div>
    `;

    // Добавляем обработчик удаления комментария
    const deleteBtn = comment.querySelector(".delete-comment");
    deleteBtn.addEventListener("click", () => {
        if (activeTask && activeTask._comments) {
            const commentIndex = activeTask._comments.findIndex(
                (c) => c.element === comment || c.text === text
            );

            if (commentIndex > -1) {
                activeTask._comments.splice(commentIndex, 1);
                comment.remove();
                // saveToLocalStorage();
            }
        }
    });

    return {
        element: comment,
        text: text,
        dateTime: isNew ? `${dateStr} ${timeStr}` : dateTime,
    };
}

/* ===================== базовая логика модалок / секций / задач ===================== */
notifyBtn && notifyBtn.addEventListener("click", () => openModal(notifyModal));
closeNotify &&
    closeNotify.addEventListener("click", () =>
        notifyModal.classList.remove("active")
    );
menuBtn &&
    menuBtn.addEventListener("click", () => {
        renderProjectsList(); // Добавьте эту строку
        openModal(menuModal);
    });
closeMenu &&
    closeMenu.addEventListener("click", () =>
        menuModal.classList.remove("active")
    );

/* создание раздела */
openAddSectionBtn &&
    openAddSectionBtn.addEventListener("click", () => openModal(sectionModal));
closeSectionModal &&
    closeSectionModal.addEventListener("click", () =>
        sectionModal.classList.remove("active")
    );
addSectionBtn &&
    addSectionBtn.addEventListener("click", () => {
        const name = sectionNameInput.value.trim();
        if (!name) return;
        addSection(name);
        sectionNameInput.value = "";
        sectionModal.classList.remove("active");
        // saveToLocalStorage();
    });

/* создание задачи */
closeTaskModal &&
    closeTaskModal.addEventListener("click", () =>
        taskModal.classList.remove("active")
    );
createTaskBtn &&
    createTaskBtn.addEventListener("click", () => {
        const title = document.getElementById("taskTitleInput").value.trim();
        const desc = document.getElementById("taskDescInput").value.trim();
        const assigneeSelect = document.getElementById("taskAssigneeInput");
        const assignee = assigneeSelect ? assigneeSelect.value : "";
        const status = document.getElementById("taskStatusInput").value;

        if (!title) return;

        // Получаем аватарку выбранного пользователя
        const selectedOption = assigneeSelect
            ? assigneeSelect.options[assigneeSelect.selectedIndex]
            : null;
        const avatar = selectedOption
            ? selectedOption.getAttribute("data-avatar") || "👤"
            : "👤";

        addTask(currentSection, {
            title,
            desc,
            assignee,
            status,
            avatar, // Добавляем аватарку в данные задачи
        });

        // Очищаем форму
        document.getElementById("taskTitleInput").value = "";
        document.getElementById("taskDescInput").value = "";
        if (assigneeSelect) assigneeSelect.value = "";
        const statusSelect = document.getElementById("taskStatusInput");
        if (statusSelect) statusSelect.value = "Сегодня";

        taskModal.classList.remove("active");
        // saveToLocalStorage();
    });

/* контекстное меню */
contextMenu &&
    contextMenu.addEventListener("click", (e) => {
        if (!e.target.classList.contains("context-item")) return;
        const action = e.target.dataset.action;

        if (action === "task") {
            currentSection = contextTarget.querySelector(".tasks");
            openModal(taskModal);
        } else if (action === "rename") {
            sectionToRename = contextTarget;
            renameSectionInput.value =
                contextTarget.querySelector("h3").innerText;
            openModal(renameModal);
        } else if (action === "delete") {
            sectionToDelete = contextTarget;
            openModal(deleteModal);
        }

        contextMenu.style.display = "none";
    });

document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("section-menu")) {
        contextMenu.style.display = "none";
    }
});

/* Переименование */
closeRenameModal &&
    closeRenameModal.addEventListener("click", () =>
        renameModal.classList.remove("active")
    );
renameSectionBtn &&
    renameSectionBtn.addEventListener("click", () => {
        const newName = renameSectionInput.value.trim();
        if (newName && sectionToRename) {
            sectionToRename.querySelector("h3").innerText = newName;
        }
        renameModal.classList.remove("active");
        renameSectionInput.value = "";
        // saveToLocalStorage();
    });

/* Удаление */
closeDeleteModal &&
    closeDeleteModal.addEventListener("click", () =>
        deleteModal.classList.remove("active")
    );
confirmDeleteBtn &&
    confirmDeleteBtn.addEventListener("click", () => {
        if (sectionToDelete) {
            sectionToDelete.classList.add("fade-out");
            setTimeout(() => sectionToDelete.remove(), 400);
        }
        deleteModal.classList.remove("active");
        // saveToLocalStorage();
    });

// открыть окно добавления проекта
openAddProjectBtn &&
    openAddProjectBtn.addEventListener("click", () => {
        menuModal.classList.remove("active");
        openModal(addProjectModal);
    });
closeAddProjectModal &&
    closeAddProjectModal.addEventListener("click", () =>
        addProjectModal.classList.remove("active")
    );

// добавить проект
addProjectBtn &&
    addProjectBtn.addEventListener("click", () => {
        const name = projectNameInput.value.trim();
        if (!name) return;

        projects[name] = { sections: [] };
        projectNameInput.value = "";
        addProjectModal.classList.remove("active");

        // Убрать старый код добавления проекта в список
        // и оставить только вызов switchProject
        switchProject(name);
        // saveToLocalStorage();
    });

/* ===================== добавление разделов / задач ===================== */
function addSection(name) {
    const section = document.createElement("div");
    section.classList.add("section");
    section.innerHTML = `
    <div class="section-header">
      <h3>${escapeHtml(name)}</h3>
      <i class="fas fa-ellipsis-v section-menu"></i>
    </div>
    <div class="tasks"></div>
  `;
    sectionsContainer.appendChild(section);

    requestAnimationFrame(() => {
        setTimeout(() => section.classList.add("show"), 20);
    });

    const menuIcon = section.querySelector(".section-menu");
    menuIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        contextTarget = section;
        contextMenu.style.display = "flex";
        const x = Math.max(
            8,
            Math.min(window.innerWidth - 170, e.clientX - 10)
        );
        const y = Math.max(60, Math.min(window.innerHeight - 120, e.clientY));
        contextMenu.style.top = `${y}px`;
        contextMenu.style.left = `${x}px`;
    });
}

function addTask(
    container,
    { title, desc, assignee, status, avatar, comments = [] }
) {
    if (!container) {
        console.warn("addTask: target container is null");
        return;
    }
    const task = document.createElement("div");
    task.classList.add("task");

    // сохраняем данные в dataset
    task.dataset.title = title || "";
    task.dataset.desc = desc || "";
    task.dataset.assignee = assignee || "";
    task.dataset.status = status || "";

    // инициализируем комментарии
    task._comments = comments.map((commentData) => {
        const commentElement = createCommentElement(
            commentData.text,
            commentData.dateTime,
            false
        );
        return {
            text: commentData.text,
            dateTime: commentData.dateTime,
            element: commentElement.element,
        };
    });

    task.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span class="avatar-circle" style="width: 24px; height: 24px; font-size: 14px;">${
                avatar || "👤"
            }</span>
            <strong>${escapeHtml(title)}</strong>
        </div>
        <small>${escapeHtml(desc)}</small><br>
        <em>${escapeHtml(assignee)}</em> — <span>${escapeHtml(status)}</span>
    `;

    container.appendChild(task);

    requestAnimationFrame(() => {
        setTimeout(() => task.classList.add("show"), 20);
    });

    setupPressDrag(task);
}

/* ===================== press-to-drag ===================== */
function setupPressDrag(task) {
    let pressTimer = null;
    let startX = 0,
        startY = 0;
    let moved = false;
    let isDragging = false;

    let ghost = null;
    let originalParent = null;
    let offsetX = 0,
        offsetY = 0;
    let currentTarget = null;

    let ghostX = 0,
        ghostY = 0;
    let animFrame = null;

    function getClient(e) {
        if (e.touches && e.touches[0])
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        return { x: e.clientX, y: e.clientY };
    }

    function startPress(e) {
        const c = getClient(e);
        startX = c.x;
        startY = c.y;
        moved = false;
        clearPress();

        function preMove(ev) {
            const cc = getClient(ev);
            if (
                Math.abs(cc.x - startX) > MOVE_THRESHOLD ||
                Math.abs(cc.y - startY) > MOVE_THRESHOLD
            ) {
                moved = true;
                clearPress();
            }
        }
        function preEnd() {
            clearPress();
        }

        document.addEventListener("mousemove", preMove);
        document.addEventListener("touchmove", preMove, { passive: true });
        document.addEventListener("mouseup", preEnd);
        document.addEventListener("touchend", preEnd);

        pressTimer = setTimeout(() => {
            if (!moved) {
                beginDrag(e);
            }
            document.removeEventListener("mousemove", preMove);
            document.removeEventListener("touchmove", preMove);
            document.removeEventListener("mouseup", preEnd);
            document.removeEventListener("touchend", preEnd);
        }, PRESS_DELAY);
    }

    function clearPress() {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    }

    function autoScroll(cc) {
        const SCROLL_SPEED = 15; // Увеличим скорость скролла
        const EDGE_THRESHOLD = 80; // Область у края, где начинается скролл
        const content = document.querySelector(".content");
        const rect = content.getBoundingClientRect();

        const relativeY = cc.y - rect.top;
        const contentHeight = rect.height;

        // Определяем, насколько близко к краю находится курсор
        const distanceToTop = relativeY;
        const distanceToBottom = contentHeight - relativeY;

        // Плавный скролл вниз (когда курсор близко к нижнему краю)
        if (distanceToBottom < EDGE_THRESHOLD) {
            // Чем ближе к краю, тем быстрее скролл
            const speedFactor = 1 - distanceToBottom / EDGE_THRESHOLD;
            const scrollAmount = Math.max(2, SCROLL_SPEED * speedFactor);

            content.scrollBy({
                top: scrollAmount,
                behavior: "auto", // Используем 'auto' вместо 'smooth' для большей плавности при драгге
            });
        }
        // Плавный скролл вверх (когда курсор близко к верхнему краю)
        else if (distanceToTop < EDGE_THRESHOLD) {
            const speedFactor = 1 - distanceToTop / EDGE_THRESHOLD;
            const scrollAmount = Math.max(2, SCROLL_SPEED * speedFactor);

            content.scrollBy({
                top: -scrollAmount,
                behavior: "auto",
            });
        }

        // Дополнительно: автоматический скролл при достижении самых краев
        const EXTREME_EDGE_THRESHOLD = 30;
        if (distanceToBottom < EXTREME_EDGE_THRESHOLD) {
            content.scrollBy({
                top: SCROLL_SPEED * 1.5,
                behavior: "smooth",
            });
        } else if (distanceToTop < EXTREME_EDGE_THRESHOLD) {
            content.scrollBy({
                top: -SCROLL_SPEED * 1.5,
                behavior: "smooth",
            });
        }
    }

    function beginDrag(e) {
        isDragging = true;
        const c = getClient(e);
        originalParent = task.parentElement;
        const rect = task.getBoundingClientRect();
        offsetX = c.x - rect.left;
        offsetY = c.y - rect.top;

        ghost = task.cloneNode(true);
        ghost.classList.add("ghost");
        ghost.style.width = `${rect.width}px`;
        ghost.style.height = `${rect.height}px`;
        ghostX = rect.left;
        ghostY = rect.top;
        ghost.style.left = `${ghostX}px`;
        ghost.style.top = `${ghostY}px`;
        document.body.appendChild(ghost);

        task.style.visibility = "hidden";
        document.body.style.overflow = "hidden";

        function animate() {
            ghost.style.left = `${ghostX}px`;
            ghost.style.top = `${ghostY}px`;
            animFrame = requestAnimationFrame(animate);
        }
        animFrame = requestAnimationFrame(animate);

        function move(ev) {
            if (ev.cancelable) ev.preventDefault();
            const cc = getClient(ev);
            ghostX = cc.x - offsetX;
            ghostY = cc.y - offsetY;

            autoScroll(cc);

            const elem = document.elementFromPoint(cc.x, cc.y);
            const candidate = elem ? elem.closest(".tasks") : null;
            if (candidate !== currentTarget) {
                if (currentTarget) {
                    currentTarget.classList.remove("highlight");
                    currentTarget.classList.remove("expand");
                }
                currentTarget = candidate;
                if (currentTarget != null) {
                    currentTarget.classList.add("highlight");
                    if (currentTarget.children.length === 0) {
                        currentTarget.classList.add("expand");
                    }
                }
            }
        }

        function end() {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("touchmove", move);
            document.removeEventListener("mouseup", end);
            document.removeEventListener("touchend", end);
            finalizeDrop();
        }

        document.addEventListener("mousemove", move);
        document.addEventListener("touchmove", move, { passive: false });
        document.addEventListener("mouseup", end);
        document.addEventListener("touchend", end);
    }

    function finalizeDrop() {
        clearPress();
        cancelAnimationFrame(animFrame);

        if (!ghost) {
            task.style.visibility = "";
            return;
        }

        if (currentTarget) {
            currentTarget.classList.remove("highlight");
            currentTarget.classList.remove("expand");
        }

        if (currentTarget && currentTarget !== originalParent) {
            currentTarget.appendChild(task);
            task.style.visibility = "";
            task.classList.add("moved-outline");
            setTimeout(() => task.classList.remove("moved-outline"), 800);

            const tTitle =
                task.querySelector("strong")?.innerText || "[без названия]";
            const sectionName =
                currentTarget.closest(".section")?.querySelector("h3")
                    ?.innerText || "[без раздела]";
            console.log(`Task "${tTitle}" moved to section "${sectionName}"`);
        } else {
            originalParent.appendChild(task);
            task.style.visibility = "";
        }

        ghost.remove();
        ghost = null;
        document.body.style.overflow = "";
        isDragging = false;
        currentTarget = null;
        // saveToLocalStorage();
    }

    task.addEventListener("mousedown", startPress);
    task.addEventListener("touchstart", startPress, { passive: true });

    const mo = new MutationObserver(() => {
        if (!document.body.contains(task)) {
            task.removeEventListener("mousedown", startPress);
            task.removeEventListener("touchstart", startPress);
            mo.disconnect();
        }
    });
    mo.observe(document.body, { childList: true, subtree: true });
}

// Обновление отображения активных фильтров
function renderActiveFilters() {
    const container = document.querySelector(".filter-active");
    if (!container) return;

    if (selectedFilters.length === 0) {
        container.textContent = "Фильтры: Нет";
    } else {
        const activeList = selectedFilters.join(", ");
        container.textContent = `Фильтры: ${activeList}`;
    }
}

/* ===================== утилиты ===================== */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function showSection(section) {
    [projectsSection, projectSection].forEach((s) =>
        s.classList.remove("active")
    );
    section.classList.add("active");
}

/* ===================== кастомного отображения select ===================== */
function enhanceCustomSelects() {
    const selects = document.querySelectorAll("select.assignee-select");

    selects.forEach((originalSelect) => {
        if (!originalSelect) return;

        // защита: если уже улучшали — пропускаем
        if (originalSelect.dataset.enhanced === "1") return;

        // Определяем, является ли этот селект "статусом" — по id (включая editTaskStatus)
        const id = (originalSelect.id || "").toLowerCase();
        const isStatusSelect = id.includes("status");

        // Обёртка
        const customSelectWrapper = document.createElement("div");
        customSelectWrapper.className = "custom-select-wrapper";

        const customSelect = document.createElement("div");
        customSelect.className = "custom-select";

        const customDisplay = document.createElement("div");
        customDisplay.className = "custom-select-display";
        customDisplay.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
        `;

        let avatarSpan = null;
        if (!isStatusSelect) {
            avatarSpan = document.createElement("span");
            avatarSpan.className = "avatar-circle";
            customDisplay.appendChild(avatarSpan);
        }

        const textSpan = document.createElement("span");
        textSpan.textContent =
            originalSelect.options[originalSelect.selectedIndex]?.textContent ||
            "Выбрать";

        const arrowSpan = document.createElement("span");
        arrowSpan.innerHTML = "▼";
        arrowSpan.style.fontSize = "12px";
        arrowSpan.style.opacity = "0.7";

        customDisplay.appendChild(textSpan);
        customSelect.appendChild(customDisplay);
        customSelect.appendChild(arrowSpan);

        const customDropdown = document.createElement("div");
        customDropdown.className = "custom-select-dropdown";

        // Опции
        Array.from(originalSelect.options).forEach((option) => {
            if (option.value === "") return; // placeholder пропускаем

            const customOption = document.createElement("div");
            customOption.className = "custom-option";
            customOption.dataset.value = option.value;

            if (!isStatusSelect && option.getAttribute("data-avatar")) {
                const optionAvatar = document.createElement("span");
                optionAvatar.className = "avatar-circle";
                optionAvatar.textContent = option.getAttribute("data-avatar");
                customOption.appendChild(optionAvatar);
            }

            const optionText = document.createElement("span");
            optionText.textContent = option.textContent;
            customOption.appendChild(optionText);

            customOption.addEventListener("click", () => {
                originalSelect.value = option.value;
                textSpan.textContent = option.textContent;
                if (!isStatusSelect && avatarSpan) {
                    avatarSpan.textContent =
                        option.getAttribute("data-avatar") || "👤";
                }
                customDropdown.classList.remove("open");
                // уведомляем оригинальный select о смене — чтобы внешние слушатели сработали
                originalSelect.dispatchEvent(
                    new Event("change", { bubbles: true })
                );
            });

            customDropdown.appendChild(customOption);
        });

        // Авто-направление вверх/вниз
        customSelect.addEventListener("click", (e) => {
            e.stopPropagation();
            const rect = customSelect.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            if (spaceAbove > spaceBelow) {
                customDropdown.style.bottom = "100%";
                customDropdown.style.top = "auto";
                customDropdown.style.marginBottom = "4px";
                customDropdown.style.marginTop = "0";
            } else {
                customDropdown.style.top = "100%";
                customDropdown.style.bottom = "auto";
                customDropdown.style.marginTop = "4px";
                customDropdown.style.marginBottom = "0";
            }

            customDropdown.classList.toggle("open");
        });

        // Закрытие при клике вне элемента
        document.addEventListener("click", (e) => {
            if (!customSelect.contains(e.target)) {
                customDropdown.classList.remove("open");
            }
        });

        customSelectWrapper.appendChild(customSelect);
        customSelectWrapper.appendChild(customDropdown);

        // Скрываем оригинальный select и вставляем обёртку
        originalSelect.style.display = "none";
        originalSelect.parentNode.insertBefore(
            customSelectWrapper,
            originalSelect.nextSibling
        );

        // Обновление текста при изменении оригинального select
        originalSelect.addEventListener("change", function () {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption) {
                textSpan.textContent = selectedOption.textContent;
                if (!isStatusSelect && avatarSpan) {
                    avatarSpan.textContent =
                        selectedOption.getAttribute("data-avatar") || "👤";
                }
            }
        });

        // пометка что улучшили
        originalSelect.dataset.enhanced = "1";
    });
}

/* ===================== логика проектов ===================== */
function renderProjectsList() {
    projectsList.innerHTML = "";
    modalProjectsList.innerHTML = "";

    if (Object.keys(projects).length === 0) {
        const empty = document.createElement("p");
        empty.style.opacity = "0.7";
        projectsList.appendChild(empty);
        modalProjectsList.appendChild(empty.cloneNode(true));
        return;
    }

    Object.keys(projects).forEach((name) => {
        // Считаем общее количество задач в проекте
        const taskCount = projects[name].sections.reduce((total, section) => {
            return total + (section.tasks ? section.tasks.length : 0);
        }, 0);

        // Для основного списка (на главной странице)
        const mainDiv = document.createElement("div");
        mainDiv.classList.add("project-item");
        mainDiv.innerHTML = `
            <div class="project-info">
                <span class="project-name">${escapeHtml(name)}</span>
                <span class="project-task-count">${taskCount}</span>
            </div>
        `;
        mainDiv.addEventListener("click", () => {
            switchProject(name);
        });
        projectsList.appendChild(mainDiv);

        // Для модального списка
        const modalDiv = mainDiv.cloneNode(true);
        modalDiv.addEventListener("click", () => {
            window.location.href = `/project/${encodeURIComponent(name)}`;
        });
        modalProjectsList.appendChild(modalDiv);
    });
}

/* обработка клика по иконке папки */
folderBtn &&
    folderBtn.addEventListener("click", () => {
        projectName.textContent = "Мои проекты";
        closeAllModals();
        renderProjectsList();
        showSection(projectsSection);
    });

userBtn &&
    userBtn.addEventListener("click", () => {
        window.location.href = "/frontend/templates/profile.html";
    });

clockBtn &&
    clockBtn.addEventListener("click", () => {
        window.location.href = "/frontend/templates/clock.html";
    });

function switchProject(name) {
    projectName.textContent = name;
    menuModal.classList.remove("active");
    if (currentProject) {
        if (!projects[currentProject])
            projects[currentProject] = { sections: [] };
        const sectionsData = [];
        document
            .querySelectorAll("#sectionsContainer .section")
            .forEach((sec) => {
                const tasksData = [];
                sec.querySelectorAll(".task").forEach((t) => {
                    // Получаем аватарку из задачи
                    const avatarElem = t.querySelector(".avatar-circle");
                    const avatar = avatarElem ? avatarElem.textContent : "👤";

                    tasksData.push({
                        title: t.querySelector("strong")?.innerText || "",
                        desc: t.querySelector("small")?.innerText || "",
                        assignee: t.querySelector("em")?.innerText || "",
                        status: t.querySelector("span")?.innerText || "",
                        avatar: avatar,
                        comments: t._comments
                            ? t._comments.map((c) => ({
                                  text: c.text,
                                  dateTime: c.dateTime,
                              }))
                            : [],
                    });
                });
                sectionsData.push({
                    name: sec.querySelector("h3")?.innerText || "",
                    tasks: tasksData,
                });
            });
        projects[currentProject].sections = sectionsData;
    }

    sectionsContainer.innerHTML = "";
    if (!projects[name]) projects[name] = { sections: [] };
    currentProject = name;
    const data = projects[name];

    data.sections.forEach((sec) => {
        addSection(sec.name);
        const container =
            sectionsContainer.lastElementChild.querySelector(".tasks");
        sec.tasks.forEach((t) => addTask(container, t));
    });

    showSection(projectSection);
    menuModal.classList.remove("active");

    document.querySelector(".content").scrollTo(0, 0);
    // saveToLocalStorage();
}

/* ===================== редактирование задачи (открытие, сохранение, комментарии) ===================== */
// Открытие модала редактирования при клике на задачу (делегирование)
sectionsContainer.addEventListener("click", (e) => {
    const task = e.target.closest(".task");
    if (!task) return;

    // отмечаем текущую активную задачу
    document
        .querySelectorAll(".task")
        .forEach((t) => t.classList.remove("active-task"));
    task.classList.add("active-task");
    activeTask = task;

    // если модал и поля существуют — обновим ссылки (на случай динамики)
    editTaskModal = document.getElementById("editTaskModal") || editTaskModal;
    closeEditTaskModal =
        document.getElementById("closeEditTaskModal") || closeEditTaskModal;
    editTaskTitle = document.getElementById("editTaskTitle") || editTaskTitle;
    editTaskDesc = document.getElementById("editTaskDesc") || editTaskDesc;
    editTaskAssignee =
        document.getElementById("editTaskAssignee") || editTaskAssignee;
    editTaskStatus =
        document.getElementById("editTaskStatus") || editTaskStatus;
    commentsList = document.getElementById("commentsList") || commentsList;
    newCommentInput =
        document.getElementById("newCommentInput") || newCommentInput;
    addCommentBtn = document.getElementById("addCommentBtn") || addCommentBtn;

    // Заполняем данные в модале (если поля есть)
    if (editTaskTitle) editTaskTitle.value = task.dataset.title || "";
    if (editTaskDesc) editTaskDesc.value = task.dataset.desc || "";
    if (editTaskAssignee) {
        editTaskAssignee.value = task.dataset.assignee || "";
        // уведомляем change чтобы кастомный селект обновил отображение
        editTaskAssignee.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (editTaskStatus) {
        editTaskStatus.value = task.dataset.status || "";
        editTaskStatus.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // рендерим комментарии
    if (commentsList) {
        commentsList.innerHTML = "";
        if (task._comments && task._comments.length) {
            task._comments.forEach((c) => {
                const commentElement = createCommentElement(
                    c.text,
                    c.dateTime,
                    false
                );
                commentsList.appendChild(commentElement.element);
                // Обновляем ссылку на элемент
                c.element = commentElement.element;
            });
        }
    }

    // покажем модал (если он есть)
    if (editTaskModal) openModal(editTaskModal);
});

// Закрытие модала редактирования (крестик)
if (closeEditTaskModal) {
    closeEditTaskModal.addEventListener("click", () => {
        editTaskModal.classList.remove("active");
        if (activeTask) activeTask.classList.remove("active-task");
        activeTask = null;
    });
}

// Функция сохранения изменений в DOM
function saveTaskChanges() {
    if (!activeTask) return;

    // читаем значения (если поля есть)
    const title =
        (editTaskTitle && editTaskTitle.value.trim()) ||
        activeTask.dataset.title ||
        "";
    const desc =
        (editTaskDesc && editTaskDesc.value.trim()) ||
        activeTask.dataset.desc ||
        "";
    const assignee =
        (editTaskAssignee && editTaskAssignee.value) ||
        activeTask.dataset.assignee ||
        "";
    const status =
        (editTaskStatus && editTaskStatus.value) ||
        activeTask.dataset.status ||
        "";

    activeTask.dataset.title = title;
    activeTask.dataset.desc = desc;
    activeTask.dataset.assignee = assignee;
    activeTask.dataset.status = status;

    // получаем аватар из выбранного assignee (если есть)
    let avatar = "👤";
    if (editTaskAssignee) {
        const opt = editTaskAssignee.options[editTaskAssignee.selectedIndex];
        avatar = opt ? opt.getAttribute("data-avatar") || "👤" : avatar;
    } else {
        // fallback: попробовать взять из DOM
        const avatarEl = activeTask.querySelector(".avatar-circle");
        avatar = avatarEl ? avatarEl.textContent : avatar;
    }

    // сохраняем комментарии (не трогаем их — они хранятся в activeTask._comments)
    const prevComments = activeTask._comments || [];

    // Перерисовываем задачу
    activeTask.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span class="avatar-circle" style="width: 24px; height: 24px; font-size: 14px;">${avatar}</span>
            <strong>${escapeHtml(title)}</strong>
        </div>
        <small>${escapeHtml(desc)}</small><br>
        <em>${escapeHtml(assignee)}</em> — <span>${escapeHtml(status)}</span>
    `;

    // восстановим комментарии в свойство _comments (они не отображаются в карточке, но храним)
    activeTask._comments = prevComments;
    // снова навесим drag/press
    setupPressDrag(activeTask);
    // saveToLocalStorage();
}

// подписываем поля на авто-сохранение (если они есть)
if (editTaskTitle || editTaskDesc || editTaskAssignee || editTaskStatus) {
    // используем делегирование и таймаут — но проще: если поле есть — слушаем
    editTaskTitle && editTaskTitle.addEventListener("input", saveTaskChanges);
    editTaskDesc && editTaskDesc.addEventListener("input", saveTaskChanges);
    editTaskAssignee &&
        editTaskAssignee.addEventListener("change", saveTaskChanges);
    editTaskStatus &&
        editTaskStatus.addEventListener("change", saveTaskChanges);
}

// Добавление комментария (делегировано, чтобы работало даже если кнопка добавлена динамически)
document.addEventListener("click", (e) => {
    const addBtn = e.target.closest("#addCommentBtn");
    if (!addBtn) return;

    // убедимся, что есть активная задача
    if (!activeTask) return;
    // получим элементы (вдруг динамически)
    commentsList = document.getElementById("commentsList") || commentsList;
    newCommentInput =
        document.getElementById("newCommentInput") || newCommentInput;

    const text = (newCommentInput && newCommentInput.value.trim()) || "";
    if (!text) return;

    const commentData = createCommentElement(text, "", true);

    if (commentsList) commentsList.appendChild(commentData.element);

    // Инициализируем массив комментариев, если его нет
    activeTask._comments = activeTask._comments || [];

    // Сохраняем данные комментария
    activeTask._comments.push({
        text: text,
        dateTime: commentData.dateTime,
        element: commentData.element,
    });

    if (newCommentInput) newCommentInput.value = "";
    // saveToLocalStorage();
});

// Закрытие задачи (делегированный обработчик) — работает даже если кнопка появилась позже
document.addEventListener("click", (e) => {
    const closeBtn = e.target.closest("#closeTaskBtn");
    if (!closeBtn) return;

    const taskToClose =
        document.querySelector(".task.active-task") || activeTask;
    if (taskToClose) {
        taskToClose.classList.add("fade-out");
        setTimeout(() => {
            // удаляем задачу и чистим ссылку
            taskToClose.remove();
        }, 400);
    }
    // скрываем модал
    editTaskModal = document.getElementById("editTaskModal") || editTaskModal;
    if (editTaskModal) editTaskModal.classList.remove("active");
    activeTask = null;
    // saveToLocalStorage();
});

/* ===================== инициализация кастомных селектов ===================== */
document.addEventListener("DOMContentLoaded", function () {
    // Загружаем данные из localStorage
    // loadFromLocalStorage();

    // Если нет данных в localStorage, отображаем список проектов
    if (Object.keys(projects).length === 0) {
        renderProjectsList();
    }
    renderActiveFilters();
    enhanceCustomSelects();

    // если редактирование было добавлено динамически в HTML и нужны элементы — обновляем ссылки и подписки
    editTaskModal = document.getElementById("editTaskModal") || editTaskModal;
    closeEditTaskModal =
        document.getElementById("closeEditTaskModal") || closeEditTaskModal;
    editTaskTitle = document.getElementById("editTaskTitle") || editTaskTitle;
    editTaskDesc = document.getElementById("editTaskDesc") || editTaskDesc;
    editTaskAssignee =
        document.getElementById("editTaskAssignee") || editTaskAssignee;
    editTaskStatus =
        document.getElementById("editTaskStatus") || editTaskStatus;
    commentsList = document.getElementById("commentsList") || commentsList;
    newCommentInput =
        document.getElementById("newCommentInput") || newCommentInput;
    addCommentBtn = document.getElementById("addCommentBtn") || addCommentBtn;

    // если поля присутствуют — подпишем их (на случай, если HTML добавлен заранее)
    if (editTaskTitle || editTaskDesc || editTaskAssignee || editTaskStatus) {
        editTaskTitle &&
            editTaskTitle.addEventListener("input", saveTaskChanges);
        editTaskDesc && editTaskDesc.addEventListener("input", saveTaskChanges);
        editTaskAssignee &&
            editTaskAssignee.addEventListener("change", saveTaskChanges);
        editTaskStatus &&
            editTaskStatus.addEventListener("change", saveTaskChanges);
    }
});
