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
let editTaskImportant = document.getElementById("editTaskImportant");
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
    }
    .important-flag {
        color: orange;
        font-size: 16px;
    }
    .switch {
        position: relative;
        display: inline-block;
        width: 42px;
        height: 22px;
    }
    .switch input {
        display: none;
    }
    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: 0.4s;
        border-radius: 22px;
    }
    .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.4s;
        border-radius: 50%;
    }
    input:checked + .slider {
        background-color: orange;
    }
    input:checked + .slider:before {
        transform: translateX(20px);
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

/* ===================== Утилиты для работы с API ===================== */
/* ===================== Утилиты для работы с API ===================== */
function saveToBackend() {
    // ✅ ПРЕЖДЕ ЧЕМ СОХРАНЯТЬ - УБЕДИТЕСЬ, ЧТО ДАННЫЕ АКТУАЛЬНЫЕ
    saveCurrentProjectState();

    const dataToSave = {
        projects: projects,
        currentProject: currentProject,
    };

    console.log("🔄 Saving to backend:", {
        project: currentProject,
        sections: projects[currentProject]?.sections?.length || 0,
        totalTasks:
            projects[currentProject]?.sections?.reduce(
                (sum, sec) => sum + sec.tasks.length,
                0
            ) || 0,
    });

    fetch("/api/save", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.text();
        })
        .then((data) => {
            console.log("✅ Data saved successfully to backend");
        })
        .catch((error) => {
            console.error("❌ Error saving data:", error);
        });
}

function loadFromBackend() {
    fetch("/api/load")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then((text) => {
            console.log("Raw response:", text);
            try {
                const data = JSON.parse(text);
                console.log("✅ Data parsed successfully:", data);

                projects = data.projects || {};
                currentProject = data.currentProject || null;

                console.log("📊 Loaded projects:", projects);
                console.log("📁 Current project:", currentProject);

                if (currentProject && projects[currentProject]) {
                    console.log("🔄 Switching to project:", currentProject);
                    projectName.textContent = currentProject;

                    // ✅ ПЕРЕДАЕМ ФЛАГ, ЧТО ЭТО ЗАГРУЗКА
                    switchProject(currentProject, true); // true = initial load
                    showSection(projectSection);
                } else {
                    console.log("📋 Showing projects list");
                    renderProjectsList();
                    showSection(projectsSection);
                }
            } catch (parseError) {
                console.error("❌ JSON parse error:", parseError);
                console.error("Problematic text:", text);
                projects = {};
                currentProject = null;
                renderProjectsList();
                showSection(projectsSection);
            }
        })
        .catch((error) => {
            console.error("❌ Network error:", error);
            projects = {};
            currentProject = null;
            renderProjectsList();
            showSection(projectsSection);
        });
}

/* ===================== Функция сохранения раздела ===================== */
function saveSectionToBackend(sectionName) {
    if (!currentProject) {
        console.error("No current project selected");
        return;
    }

    // Обновляем локальные данные
    if (!projects[currentProject]) {
        projects[currentProject] = { sections: [] };
    }

    // Проверяем, существует ли уже такой раздел
    const existingSection = projects[currentProject].sections.find(
        (section) => section.name === sectionName
    );

    if (!existingSection) {
        // Добавляем новый раздел
        projects[currentProject].sections.push({
            name: sectionName,
            tasks: [],
        });
        console.log("Section added to data:", sectionName);
    } else {
        console.log("Section already exists:", sectionName);
    }
}

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
                <strong style="opacity:0.7;">Текущий пользователь</strong>
                <small style="opacity:0.7; margin-right: 10px;">${dateStr} ${timeStr}</small>
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
                saveToBackend();
                console.log(1);
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
    openAddSectionBtn.addEventListener("click", () => {
        // ✅ ОЧИЩАЕМ ФОРМУ ПЕРЕД ОТКРЫТИЕМ
        clearTaskForm();
        openModal(sectionModal);
    });
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
        saveToBackend();
        console.log(2);
    });

/* создание задачи */
closeTaskModal &&
    closeTaskModal.addEventListener("click", () => {
        // ✅ ОЧИСТКА ПОЛЕЙ ПРИ ЗАКРЫТИИ МОДАЛА
        clearTaskForm();
        taskModal.classList.remove("active");
    });
createTaskBtn &&
    createTaskBtn.addEventListener("click", () => {
        console.log("🎯 Create task button clicked");

        const title = document.getElementById("taskTitleInput").value.trim();
        const desc = document.getElementById("taskDescInput").value.trim();
        const assigneeSelect = document.getElementById("taskAssigneeInput");
        const assignee = assigneeSelect ? assigneeSelect.value : "";
        const statusSelect = document.getElementById("taskStatusInput");
        const status = statusSelect ? statusSelect.value : "Сегодня";
        const importantCheckbox = document.getElementById("taskImportant");
        const important = importantCheckbox ? importantCheckbox.checked : false;

        console.log("📝 Form data:", {
            title,
            desc,
            assignee,
            status,
            important,
        });

        if (!title) {
            console.log("❌ Title is required");
            return;
        }

        // Получаем аватарку выбранного пользователя
        const selectedOption = assigneeSelect
            ? assigneeSelect.options[assigneeSelect.selectedIndex]
            : null;
        const avatar = selectedOption
            ? selectedOption.getAttribute("data-avatar") || "👤"
            : "👤";

        console.log("👤 Selected avatar:", avatar);

        addTask(currentSection, {
            title,
            desc,
            assignee,
            status,
            avatar,
            important,
        });

        // ✅ ОЧИСТКА ПОЛЕЙ ПОСЛЕ СОЗДАНИЯ ЗАДАЧИ
        clearTaskForm();

        taskModal.classList.remove("active");
        saveToBackend();
        console.log(3, "Task created successfully");
    });

/* ===================== Функция очистки формы задачи ===================== */
function clearTaskForm() {
    console.log("🧹 Clearing task form...");

    const titleInput = document.getElementById("taskTitleInput");
    const descInput = document.getElementById("taskDescInput");
    const assigneeSelect = document.getElementById("taskAssigneeInput");
    const statusSelect = document.getElementById("taskStatusInput");
    const importantCheckbox = document.getElementById("taskImportant");

    if (titleInput) titleInput.value = "";
    if (descInput) descInput.value = "";

    // ✅ ПРАВИЛЬНАЯ ОЧИСТКА SELECT'ОВ
    if (assigneeSelect) {
        assigneeSelect.value = ""; // Очищаем выбор исполнителя
        updateCustomSelectDisplay(assigneeSelect, "assignee");
        console.log("✅ Assignee select cleared");
    }

    if (statusSelect) {
        statusSelect.value = "Когда выполнить"; // Устанавливаем значение по умолчанию
        updateCustomSelectDisplay(statusSelect, "status");
        console.log("✅ Status select set to default");
    }

    if (importantCheckbox) importantCheckbox.checked = false;

    console.log("✅ Form cleared successfully");
}

/* контекстное меню */
contextMenu &&
    contextMenu.addEventListener("click", (e) => {
        if (!e.target.classList.contains("context-item")) return;
        const action = e.target.dataset.action;

        if (action === "task") {
            currentSection = contextTarget.querySelector(".tasks");
            // ✅ ОЧИЩАЕМ ФОРМУ ПЕРЕД ОТКРЫТИЕМ
            clearTaskForm();
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
            const oldName = sectionToRename.querySelector("h3").innerText;
            sectionToRename.querySelector("h3").innerText = newName;

            // ✅ ОБНОВЛЯЕМ НАЗВАНИЕ РАЗДЕЛА В ДАННЫХ
            if (currentProject && projects[currentProject]) {
                const sectionIndex = projects[
                    currentProject
                ].sections.findIndex((section) => section.name === oldName);
                if (sectionIndex !== -1) {
                    projects[currentProject].sections[sectionIndex].name =
                        newName;
                    console.log(
                        "✅ Section renamed in data:",
                        oldName,
                        "→",
                        newName
                    );
                }
            }
        }
        renameModal.classList.remove("active");
        renameSectionInput.value = "";

        // ✅ СОХРАНЯЕМ ОБНОВЛЕННЫЕ ДАННЫЕ
        saveToBackend();
        console.log(4, "Section renamed and data saved");
    });

/* Удаление */
closeDeleteModal &&
    closeDeleteModal.addEventListener("click", () =>
        deleteModal.classList.remove("active")
    );
confirmDeleteBtn &&
    confirmDeleteBtn.addEventListener("click", () => {
        if (sectionToDelete) {
            const sectionName = sectionToDelete.querySelector("h3")?.innerText;
            console.log("🗑️ Deleting section:", sectionName);

            // ✅ УДАЛЯЕМ РАЗДЕЛ ИЗ ДАННЫХ ПРОЕКТА
            if (currentProject && projects[currentProject]) {
                projects[currentProject].sections = projects[
                    currentProject
                ].sections.filter((section) => section.name !== sectionName);
                console.log("✅ Section removed from project data");
            }

            sectionToDelete.classList.add("fade-out");
            setTimeout(() => {
                sectionToDelete.remove();
                console.log("✅ Section removed from DOM");

                // ✅ СОХРАНЯЕМ ОБНОВЛЕННЫЕ ДАННЫЕ ПОСЛЕ УДАЛЕНИЯ
                saveCurrentProjectState();
                saveToBackend();
                console.log(5, "Section deleted and data saved");
            }, 400);
        }
        deleteModal.classList.remove("active");
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
        saveToBackend();
        console.log(6);
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

    // ✅ СОХРАНЕНИЕ РАЗДЕЛА В ДАННЫХ И БЕКЕНД
    saveSectionToBackend(name);

    // ✅ ДОПОЛНИТЕЛЬНО: Сохраняем полное состояние проекта
    saveCurrentProjectState();
    saveToBackend();
}

function addTask(container, taskData) {
    if (!container) {
        console.error("❌ No container provided for task");
        return;
    }

    console.log("📦 Adding task to container:", container);
    addTaskToContainer(container, taskData);

    // ✅ УБЕДИТЕСЬ, ЧТО ДАННЫЕ ОБНОВЛЯЮТСЯ ПЕРЕД СОХРАНЕНИЕМ
    saveCurrentProjectState();
    saveToBackend();
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
        saveCurrentProjectState();
        saveToBackend();
        console.log(7);
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
    console.log("🔧 Enhancing custom selects...");

    // Селект исполнителя
    const assigneeSelect = document.getElementById("taskAssigneeInput");
    if (assigneeSelect && !assigneeSelect.dataset.enhanced) {
        createCustomSelect(assigneeSelect, "assignee");
    } else if (assigneeSelect) {
        updateCustomSelectDisplay(assigneeSelect, "assignee");
    }

    // Селект статуса
    const statusSelect = document.getElementById("taskStatusInput");
    if (statusSelect && !statusSelect.dataset.enhanced) {
        createCustomSelect(statusSelect, "status");
    } else if (statusSelect) {
        updateCustomSelectDisplay(statusSelect, "status");
    }

    // Селекты для редактирования
    const editAssigneeSelect = document.getElementById("editTaskAssignee");
    if (editAssigneeSelect && !editAssigneeSelect.dataset.enhanced) {
        createCustomSelect(editAssigneeSelect, "assignee");
    } else if (editAssigneeSelect) {
        updateCustomSelectDisplay(editAssigneeSelect, "assignee");
    }

    const editStatusSelect = document.getElementById("editTaskStatus");
    if (editStatusSelect && !editStatusSelect.dataset.enhanced) {
        createCustomSelect(editStatusSelect, "status");
    } else if (editStatusSelect) {
        updateCustomSelectDisplay(editStatusSelect, "status");
    }
}

/* ===================== Создание кастомного селекта ===================== */
function createCustomSelect(originalSelect, type) {
    console.log(`🛠️ Creating custom ${type} select:`, originalSelect.id);

    // Создаем уникальный ID для обертки
    const wrapperId = `custom-${originalSelect.id}-wrapper`;

    // Проверяем, не создали ли уже обертку
    if (document.getElementById(wrapperId)) {
        console.log(`✅ Custom select already exists: ${wrapperId}`);
        return;
    }

    // Обёртка
    const customSelectWrapper = document.createElement("div");
    customSelectWrapper.id = wrapperId;
    customSelectWrapper.className = "custom-select-wrapper";
    customSelectWrapper.dataset.selectType = type;

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

    // Добавляем аватар только для assignee селектов
    if (type === "assignee") {
        const avatarSpan = document.createElement("span");
        avatarSpan.className = "avatar-circle";
        avatarSpan.textContent = "👤";
        customDisplay.appendChild(avatarSpan);
    }

    const textSpan = document.createElement("span");
    const selectedOption = originalSelect.options[originalSelect.selectedIndex];
    textSpan.textContent = selectedOption
        ? selectedOption.textContent
        : type === "assignee"
        ? "Кому назначить"
        : "Когда выполнить";

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
        const customOption = document.createElement("div");
        customOption.className = "custom-option";
        customOption.dataset.value = option.value;

        if (type === "assignee") {
            const optionAvatar = document.createElement("span");
            optionAvatar.className = "avatar-circle";
            optionAvatar.textContent =
                option.getAttribute("data-avatar") || "👤";
            customOption.appendChild(optionAvatar);
        }

        const optionText = document.createElement("span");
        optionText.textContent = option.textContent;
        customOption.appendChild(optionText);

        customOption.addEventListener("click", () => {
            originalSelect.value = option.value;

            // Обновляем отображение
            updateCustomSelectDisplay(originalSelect, type);

            customDropdown.classList.remove("open");
            originalSelect.dispatchEvent(
                new Event("change", { bubbles: true })
            );

            console.log(`✅ ${type} select changed to:`, option.value);
        });

        customDropdown.appendChild(customOption);
    });

    // Открытие/закрытие dropdown
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

    // Обновление при изменении оригинального select
    originalSelect.addEventListener("change", function () {
        updateCustomSelectDisplay(this, type);
    });

    // пометка что улучшили
    originalSelect.dataset.enhanced = "1";
    console.log(`✅ Custom ${type} select created:`, originalSelect.id);
}

/* ===================== Функция обновления отображения кастомного селекта ===================== */
function updateCustomSelectDisplay(originalSelect, type) {
    const wrapperId = `custom-${originalSelect.id}-wrapper`;
    const wrapper = document.getElementById(wrapperId);

    if (!wrapper) {
        console.log("❌ Custom select wrapper not found:", wrapperId);
        return;
    }

    const display = wrapper.querySelector(".custom-select-display");
    const textSpan = display.querySelector("span:last-child");
    const avatarSpan = display.querySelector(".avatar-circle");

    const selectedOption = originalSelect.options[originalSelect.selectedIndex];

    console.log(`🔄 Updating ${type} select display:`, {
        selectId: originalSelect.id,
        selectedValue: originalSelect.value,
        selectedText: selectedOption ? selectedOption.textContent : "none",
    });

    if (selectedOption && selectedOption.value !== "") {
        textSpan.textContent = selectedOption.textContent;
        if (type === "assignee" && avatarSpan) {
            const avatar = selectedOption.getAttribute("data-avatar") || "👤";
            avatarSpan.textContent = avatar;
            console.log(
                `✅ ${type} select: ${selectedOption.textContent} (${avatar})`
            );
        } else {
            console.log(`✅ ${type} select: ${selectedOption.textContent}`);
        }
    } else {
        // Если ничего не выбрано
        const defaultText =
            type === "assignee" ? "Кому назначить" : "Когда выполнить";
        textSpan.textContent = defaultText;
        if (type === "assignee" && avatarSpan) {
            avatarSpan.textContent = "👤";
        }
        console.log(`✅ ${type} select reset to default: ${defaultText}`);
    }
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
        window.location.href = "/profile";
    });

clockBtn &&
    clockBtn.addEventListener("click", () => {
        window.location.href = "/clock";
    });

function switchProject(name, isInitialLoad = false) {
    projectName.textContent = name;
    menuModal.classList.remove("active");

    // ✅ СОХРАНЯЕМ ТОЛЬКО ЕСЛИ ЭТО НЕ ПЕРВОНАЧАЛЬНАЯ ЗАГРУЗКА
    if (currentProject && !isInitialLoad) {
        saveCurrentProjectState();
    }

    sectionsContainer.innerHTML = "";
    if (!projects[name]) projects[name] = { sections: [] };
    currentProject = name;
    const data = projects[name];

    console.log("🔄 Loading project data:", data);

    // ✅ ПРАВИЛЬНОЕ СОЗДАНИЕ РАЗДЕЛОВ И ЗАДАЧ
    data.sections.forEach((sec) => {
        // Создаем раздел
        const section = document.createElement("div");
        section.classList.add("section");
        section.innerHTML = `
            <div class="section-header">
                <h3>${escapeHtml(sec.name)}</h3>
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
            const y = Math.max(
                60,
                Math.min(window.innerHeight - 120, e.clientY)
            );
            contextMenu.style.top = `${y}px`;
            contextMenu.style.left = `${x}px`;
        });

        // ✅ ДОБАВЛЯЕМ ЗАДАЧИ В РАЗДЕЛ
        const tasksContainer = section.querySelector(".tasks");
        console.log(
            `📝 Loading ${sec.tasks.length} tasks for section: ${sec.name}`
        );
        sec.tasks.forEach((taskData) => {
            addTaskToContainer(tasksContainer, taskData);
        });
    });

    showSection(projectSection);
    menuModal.classList.remove("active");

    document.querySelector(".content").scrollTo(0, 0);

    // ✅ СОХРАНЯЕМ ТОЛЬКО ЕСЛИ ЭТО НЕ ПЕРВОНАЧАЛЬНАЯ ЗАГРУЗКА
    if (!isInitialLoad) {
        saveToBackend();
    }

    console.log("✅ Project loaded successfully");
    console.log(
        "📊 Sections in DOM:",
        document.querySelectorAll(".section").length
    );
    console.log("📋 Tasks in DOM:", document.querySelectorAll(".task").length);
}

/* ===================== Добавление задачи в контейнер (для загрузки) ===================== */
function addTaskToContainer(container, taskData) {
    if (!container) return;

    const task = document.createElement("div");
    task.classList.add("task");

    // Сохраняем данные в dataset
    task.dataset.title = taskData.title || "";
    task.dataset.desc = taskData.desc || "";
    task.dataset.assignee = taskData.assignee || "";
    task.dataset.status = taskData.status || "";
    task.dataset.important = taskData.important ? "1" : "0";

    // Восстанавливаем комментарии
    task._comments = taskData.comments
        ? taskData.comments.map((comment) => {
              const commentElement = createCommentElement(
                  comment.text,
                  comment.dateTime,
                  false
              );
              return {
                  text: comment.text,
                  dateTime: comment.dateTime,
                  element: commentElement.element,
              };
          })
        : [];

    task.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span class="avatar-circle" style="width: 24px; height: 24px; font-size: 14px;">${
                taskData.avatar || "👤"
            }</span>
            <strong>${escapeHtml(taskData.title)}</strong>
            ${
                taskData.important
                    ? '<i class="fas fa-flag important-flag"></i>'
                    : ""
            }
        </div>
        <small>${escapeHtml(taskData.desc)}</small><br>
        <em>${escapeHtml(taskData.assignee)}</em> — <span>${escapeHtml(
        taskData.status
    )}</span>
    `;

    container.appendChild(task);

    requestAnimationFrame(() => {
        setTimeout(() => task.classList.add("show"), 20);
    });

    setupPressDrag(task);
}

/* ===================== Сохранение состояния текущего проекта ===================== */
/* ===================== Сохранение состояния текущего проекта ===================== */
function saveCurrentProjectState() {
    if (!currentProject || !projects[currentProject]) {
        console.log("❌ No current project to save");
        return;
    }

    const sectionsData = [];
    let totalTasks = 0;

    document.querySelectorAll("#sectionsContainer .section").forEach((sec) => {
        const sectionName = sec.querySelector("h3")?.innerText || "";
        const tasksData = [];

        sec.querySelectorAll(".task").forEach((t) => {
            const avatarElem = t.querySelector(".avatar-circle");
            const avatar = avatarElem ? avatarElem.textContent : "👤";

            tasksData.push({
                title: t.dataset.title || "",
                desc: t.dataset.desc || "",
                assignee: t.dataset.assignee || "",
                status: t.dataset.status || "",
                avatar: avatar,
                important: t.dataset.important === "1",
                comments: t._comments
                    ? t._comments.map((c) => ({
                          text: c.text,
                          dateTime: c.dateTime,
                      }))
                    : [],
            });
            totalTasks++;
        });

        sectionsData.push({
            name: sectionName,
            tasks: tasksData,
        });

        console.log(`📋 Section "${sectionName}": ${tasksData.length} tasks`);
    });

    projects[currentProject].sections = sectionsData;
    console.log(
        `💾 Project "${currentProject}" state saved: ${sectionsData.length} sections, ${totalTasks} total tasks`
    );

    // ✅ ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: выводим структуру данных для отладки
    console.log(
        "📊 Current project structure:",
        JSON.parse(JSON.stringify(projects[currentProject]))
    );
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

    console.log("🎯 Opening task for editing:", {
        title: task.dataset.title,
        assignee: task.dataset.assignee,
        status: task.dataset.status,
        important: task.dataset.important,
    });

    // ✅ ОБНОВЛЯЕМ ССЫЛКИ НА ЭЛЕМЕНТЫ ПЕРЕД ЗАПОЛНЕНИЕМ
    editTaskModal = document.getElementById("editTaskModal");
    closeEditTaskModal = document.getElementById("closeEditTaskModal");
    editTaskTitle = document.getElementById("editTaskTitle");
    editTaskDesc = document.getElementById("editTaskDesc");
    editTaskAssignee = document.getElementById("editTaskAssignee");
    editTaskStatus = document.getElementById("editTaskStatus");
    editTaskImportant = document.getElementById("editTaskImportant");
    commentsList = document.getElementById("commentsList");
    newCommentInput = document.getElementById("newCommentInput");
    addCommentBtn = document.getElementById("addCommentBtn");

    // ✅ КОРРЕКТНОЕ ЗАПОЛНЕНИЕ ПОЛЕЙ ПРИ РЕДАКТИРОВАНИИ
    if (editTaskTitle) {
        editTaskTitle.value = task.dataset.title || "";
        console.log("✅ Set title:", editTaskTitle.value);
    }

    if (editTaskDesc) {
        editTaskDesc.value = task.dataset.desc || "";
        console.log("✅ Set description:", editTaskDesc.value);
    }

    // ✅ ВАЖНАЯ ЗАДАЧА
    if (editTaskImportant) {
        editTaskImportant.checked = task.dataset.important === "1";
        console.log("✅ Set important:", editTaskImportant.checked);
    }

    // ✅ СТАТУС (ВРЕМЯ ВЫПОЛНЕНИЯ)
    if (editTaskStatus) {
        // Убедимся, что значение существует в селекте
        const statusValue = task.dataset.status || "Сегодня";
        if (
            Array.from(editTaskStatus.options).some(
                (opt) => opt.value === statusValue
            )
        ) {
            editTaskStatus.value = statusValue;
        } else {
            editTaskStatus.value = "Сегодня"; // fallback
        }
        console.log("✅ Set status:", editTaskStatus.value);

        // Обновляем кастомный селект
        updateCustomSelectDisplay(editTaskStatus, "status");
    }

    // ✅ ИСПОЛНИТЕЛЬ - САМАЯ ВАЖНАЯ ЧАСТЬ
    if (editTaskAssignee) {
        // Полностью сбрасываем селект перед установкой значения
        editTaskAssignee.value = "";

        // Устанавливаем значение исполнителя, если оно есть
        const assigneeValue = task.dataset.assignee || "";
        if (
            assigneeValue &&
            Array.from(editTaskAssignee.options).some(
                (opt) => opt.value === assigneeValue
            )
        ) {
            editTaskAssignee.value = assigneeValue;
            console.log("✅ Set assignee:", editTaskAssignee.value);
        } else {
            console.log("❌ Assignee not found in options:", assigneeValue);
            editTaskAssignee.value = ""; // Очищаем, если значение не найдено
        }

        // ОБЯЗАТЕЛЬНО обновляем кастомный селект
        updateCustomSelectDisplay(editTaskAssignee, "assignee");
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
                c.element = commentElement.element;
            });
        }
    }

    // ✅ ОБНОВЛЯЕМ ВСЕ КАСТОМНЫЕ СЕЛЕКТЫ
    enhanceCustomSelects();

    // покажем модал
    if (editTaskModal) {
        openModal(editTaskModal);
        console.log("✅ Edit modal opened successfully");
    }
});

// Закрытие модала редактирования (крестик)
if (closeEditTaskModal) {
    closeEditTaskModal.addEventListener("click", () => {
        console.log("🔒 Closing edit modal");

        // ✅ СБРАСЫВАЕМ АКТИВНУЮ ЗАДАЧУ ПЕРЕД ЗАКРЫТИЕМ
        if (activeTask) {
            activeTask.classList.remove("active-task");
            activeTask = null;
        }

        // ✅ СБРАСЫВАЕМ ПОЛЯ РЕДАКТИРОВАНИЯ
        editTaskTitle = document.getElementById("editTaskTitle");
        editTaskDesc = document.getElementById("editTaskDesc");
        editTaskAssignee = document.getElementById("editTaskAssignee");
        editTaskStatus = document.getElementById("editTaskStatus");
        editTaskImportant = document.getElementById("editTaskImportant");

        if (editTaskTitle) editTaskTitle.value = "";
        if (editTaskDesc) editTaskDesc.value = "";
        if (editTaskAssignee) editTaskAssignee.value = "";
        if (editTaskStatus) editTaskStatus.value = "Сегодня";
        if (editTaskImportant) editTaskImportant.checked = false;

        // ✅ ОБНОВЛЯЕМ КАСТОМНЫЕ СЕЛЕКТЫ
        enhanceCustomSelects();

        editTaskModal.classList.remove("active");
        console.log("✅ Edit modal closed and reset");
    });
}

// Функция сохранения изменений в DOM
function saveTaskChanges() {
    if (!activeTask) {
        console.error("❌ No active task to save");
        return;
    }

    console.log("💾 Saving task changes...");

    // ✅ ОБНОВЛЯЕМ ССЫЛКИ ПЕРЕД ЧТЕНИЕМ ЗНАЧЕНИЙ
    editTaskTitle = document.getElementById("editTaskTitle");
    editTaskDesc = document.getElementById("editTaskDesc");
    editTaskAssignee = document.getElementById("editTaskAssignee");
    editTaskStatus = document.getElementById("editTaskStatus");
    editTaskImportant = document.getElementById("editTaskImportant");

    // читаем значения
    const title = (editTaskTitle && editTaskTitle.value.trim()) || "";
    const desc = (editTaskDesc && editTaskDesc.value.trim()) || "";
    const assignee = (editTaskAssignee && editTaskAssignee.value) || "";
    const status = (editTaskStatus && editTaskStatus.value) || "";
    const important = editTaskImportant ? editTaskImportant.checked : false;

    console.log("📝 New task data:", {
        title,
        desc,
        assignee,
        status,
        important,
    });

    // ✅ ВАЖНО: Проверяем, что есть минимальные данные
    if (!title) {
        console.error("❌ Task title cannot be empty");
        return;
    }

    // Обновляем dataset задачи
    activeTask.dataset.title = title;
    activeTask.dataset.desc = desc;
    activeTask.dataset.assignee = assignee;
    activeTask.dataset.status = status;
    activeTask.dataset.important = important ? "1" : "0";

    // получаем аватар из выбранного assignee (если есть)
    let avatar = "👤";
    if (editTaskAssignee && editTaskAssignee.value) {
        const opt = editTaskAssignee.options[editTaskAssignee.selectedIndex];
        avatar = opt ? opt.getAttribute("data-avatar") || "👤" : avatar;
    } else {
        // fallback: попробовать взять из DOM
        const avatarEl = activeTask.querySelector(".avatar-circle");
        avatar = avatarEl ? avatarEl.textContent : avatar;
    }

    console.log("👤 Selected avatar:", avatar);

    // сохраняем комментарии
    const prevComments = activeTask._comments || [];

    // Перерисовываем задачу
    activeTask.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span class="avatar-circle" style="width: 24px; height: 24px; font-size: 14px;">${avatar}</span>
            <strong>${escapeHtml(title)}</strong>
            ${important ? '<i class="fas fa-flag important-flag"></i>' : ""}
        </div>
        <small>${escapeHtml(desc)}</small><br>
        <em>${escapeHtml(assignee)}</em> — <span>${escapeHtml(status)}</span>
    `;

    // ✅ ВАЖНО: Восстанавливаем обработчики и данные
    activeTask._comments = prevComments;

    // снова навесим drag/press
    setupPressDrag(activeTask);

    // ✅ Сохраняем изменения в данных проекта
    saveCurrentProjectState();
    saveToBackend();
    console.log(9, "Task changes saved successfully");
}

// подписываем поля на авто-сохранение (если они есть)
if (
    editTaskTitle ||
    editTaskDesc ||
    editTaskAssignee ||
    editTaskStatus ||
    editTaskImportant
) {
    editTaskTitle && editTaskTitle.addEventListener("input", saveTaskChanges);
    editTaskDesc && editTaskDesc.addEventListener("input", saveTaskChanges);
    editTaskAssignee &&
        editTaskAssignee.addEventListener("change", saveTaskChanges);
    editTaskStatus &&
        editTaskStatus.addEventListener("change", saveTaskChanges);
    editTaskImportant &&
        editTaskImportant.addEventListener("change", saveTaskChanges);
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
    saveToBackend();
    console.log(10);
});

// Закрытие задачи (делегированный обработчик) — работает даже если кнопка появилась позже
document.addEventListener("click", (e) => {
    const closeBtn = e.target.closest("#closeTaskBtn");
    if (!closeBtn) return;

    const taskToClose =
        document.querySelector(".task.active-task") || activeTask;
    if (taskToClose) {
        const taskTitle =
            taskToClose.querySelector("strong")?.innerText || "Unknown task";
        console.log("🗑️ Closing task:", taskTitle);

        taskToClose.classList.add("fade-out");
        setTimeout(() => {
            // удаляем задачу и чистим ссылку
            taskToClose.remove();
            console.log("✅ Task removed from DOM");

            // ✅ СОХРАНЯЕМ ОБНОВЛЕННЫЕ ДАННЫЕ ПОСЛЕ УДАЛЕНИЯ ЗАДАЧИ
            saveCurrentProjectState();
            saveToBackend();
            console.log(11, "Task closed and data saved");
        }, 400);
    }
    // скрываем модал
    editTaskModal = document.getElementById("editTaskModal") || editTaskModal;
    if (editTaskModal) editTaskModal.classList.remove("active");
    activeTask = null;
});

/* ===================== инициализация ===================== */
document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Initializing app...");

    // Загружаем данные из бекенда
    loadFromBackend();

    renderActiveFilters();
    enhanceCustomSelects();

    // ✅ ПРАВИЛЬНАЯ ИНИЦИАЛИЗАЦИЯ РЕДАКТИРОВАНИЯ ЗАДАЧ
    // Обновляем ссылки на элементы редактирования
    editTaskModal = document.getElementById("editTaskModal");
    closeEditTaskModal = document.getElementById("closeEditTaskModal");
    editTaskTitle = document.getElementById("editTaskTitle");
    editTaskDesc = document.getElementById("editTaskDesc");
    editTaskAssignee = document.getElementById("editTaskAssignee");
    editTaskStatus = document.getElementById("editTaskStatus");
    editTaskImportant = document.getElementById("editTaskImportant");
    commentsList = document.getElementById("commentsList");
    newCommentInput = document.getElementById("newCommentInput");
    addCommentBtn = document.getElementById("addCommentBtn");

    // ✅ ПОДПИСЫВАЕМСЯ НА АВТО-СОХРАНЕНИЕ ТОЛЬКО ЕСЛИ ЭЛЕМЕНТЫ СУЩЕСТВУЮТ
    if (editTaskTitle) {
        editTaskTitle.addEventListener("input", saveTaskChanges);
    }
    if (editTaskDesc) {
        editTaskDesc.addEventListener("input", saveTaskChanges);
    }
    if (editTaskAssignee) {
        editTaskAssignee.addEventListener("change", saveTaskChanges);
    }
    if (editTaskStatus) {
        editTaskStatus.addEventListener("change", saveTaskChanges);
    }
    if (editTaskImportant) {
        editTaskImportant.addEventListener("change", saveTaskChanges);
    }

    console.log("✅ App initialized successfully");
});
