const users = [
    {
        id: 1,
        username: "ivan_petrov",
        name: "Иван Петров",
        avatar: "👨‍💼",
    },
    {
        id: 2,
        username: "maria",
        name: "Мария Сидорова",
        avatar: "👩‍💻",
    },
    {
        id: 3,
        username: "alex_ivanov",
        name: "Алексей Иванов",
        avatar: "👨‍🔧",
    },
    {
        id: 4,
        username: "kate",
        name: "Екатерина Смирнова",
        avatar: "👩‍🎨",
    },
    {
        id: 5,
        username: "sergey",
        name: "Сергей Ковалев",
        avatar: "👨‍🔬",
    },
    {
        id: 6,
        username: "olga",
        name: "Ольга Лещенко",
        avatar: "👩‍⚕️",
    },
];

// Состояние проекта: участники и их права
const projectState = {
    members: [], // {id, username, name, avatar}
    rights: new Map(), // id -> boolean (true = имеет доступ)
};

// DOM
const userSearch = document.getElementById("userSearch");
const searchDropdown = document.getElementById("searchDropdown");
const addByUsernameBtn = document.getElementById("addByUsernameBtn");
const participantsContainer = document.getElementById("participants");
const rightsList = document.getElementById("rightsList");

const confirmRemoveMemberModal = document.getElementById(
    "confirmRemoveMemberModal"
);
const removeMemberText = document.getElementById("removeMemberText");
const confirmRemoveMemberBtn = document.getElementById(
    "confirmRemoveMemberBtn"
);
const closeRemoveMemberModal = document.getElementById(
    "closeRemoveMemberModal"
);

const confirmDeleteProjectModal = document.getElementById(
    "confirmDeleteProjectModal"
);
const deleteProjectBtn = document.getElementById("deleteProjectBtn");
const confirmDeleteProjectBtn = document.getElementById(
    "confirmDeleteProjectBtn"
);
const closeDeleteProjectModal = document.getElementById(
    "closeDeleteProjectModal"
);

const projectNameInput = document.getElementById("projectNameInput");

// Текущий выбранный для удаления участник
let memberToRemoveId = null;

// Показать/скрыть dropdown
function openDropdown() {
    searchDropdown.style.display = "block";
    searchDropdown.setAttribute("aria-hidden", "false");
}
function closeDropdown() {
    searchDropdown.style.display = "none";
    searchDropdown.setAttribute("aria-hidden", "true");
}

// Поиск: поддержка ввода "@username" или просто "имя"
function searchUsers(query) {
    if (!query) return [];
    query = query.trim().toLowerCase();
    const isAt = query.startsWith("@");
    const q = isAt ? query.slice(1) : query;

    // Получаем id всех участников проекта
    const memberIds = projectState.members.map((m) => m.id);

    return users.filter((u) => {
        const matches =
            u.username.toLowerCase().includes(q) ||
            u.name.toLowerCase().includes(q);

        // Исключаем уже добавленных участников
        return matches && !memberIds.includes(u.id);
    });
}

function renderDropdown(matches) {
    searchDropdown.innerHTML = "";
    if (!matches.length) {
        const el = document.createElement("div");
        el.className = "search-item";
        el.textContent = "Пользователей не найдено";
        el.style.opacity = "0.7";
        el.style.pointerEvents = "none";
        searchDropdown.appendChild(el);
        openDropdown();
        return;
    }
    matches.forEach((u) => {
        const item = document.createElement("div");
        item.className = "search-item";
        item.dataset.userId = u.id;

        const left = document.createElement("div");
        left.style.display = "flex";
        left.style.alignItems = "center";
        left.style.gap = "10px";

        const avatar = document.createElement("div");
        avatar.className = "avatar-small";
        avatar.textContent = u.avatar;

        const nameBlock = document.createElement("div");
        const nameEl = document.createElement("div");
        nameEl.textContent = u.name;
        nameEl.style.fontWeight = "600";
        const usernameEl = document.createElement("div");
        usernameEl.textContent = "@" + u.username;
        usernameEl.style.fontSize = "13px";
        usernameEl.style.opacity = "0.8";

        nameBlock.appendChild(nameEl);
        nameBlock.appendChild(usernameEl);

        left.appendChild(avatar);
        left.appendChild(nameBlock);

        item.appendChild(left);

        item.addEventListener("click", () => {
            addMemberById(u.id);
            closeDropdown();
            userSearch.value = "";
        });

        searchDropdown.appendChild(item);
    });
    openDropdown();
}

// Добавление участника в проект (если уже есть — не добавляем)
function addMemberById(id) {
    const u = users.find((x) => x.id === Number(id));
    if (!u) return;
    if (projectState.members.some((m) => m.id === u.id)) {
        // можно подсветить сообщение, но пока просто возвращаем
        flashNotice("Пользователь уже в проекте");
        return;
    }
    projectState.members.push({ ...u });
    projectState.rights.set(u.id, false); // по умолчанию без доступа
    renderParticipants();
    renderRights();
}

// Удаление участника
function removeMemberById(id) {
    projectState.members = projectState.members.filter((m) => m.id !== id);
    projectState.rights.delete(id);
    renderParticipants();
    renderRights();
}

// Перерисовать список участников
function renderParticipants() {
    participantsContainer.innerHTML = "";
    if (!projectState.members.length) {
        const empty = document.createElement("div");
        empty.style.opacity = "0.8";
        empty.textContent = "Нет участников";
        participantsContainer.appendChild(empty);
        return;
    }
    projectState.members.forEach((m) => {
        const item = document.createElement("div");
        item.className = "participant";

        const left = document.createElement("div");
        left.className = "participant-left";
        const avatar = document.createElement("div");
        avatar.className = "avatar-small";
        avatar.textContent = m.avatar;

        const nameWrap = document.createElement("div");
        const name = document.createElement("div");
        name.className = "participant-name";
        name.textContent = m.name;
        const username = document.createElement("div");
        username.style.fontSize = "13px";
        username.style.opacity = "0.8";
        username.textContent = "@" + m.username;

        nameWrap.appendChild(name);
        nameWrap.appendChild(username);

        left.appendChild(avatar);
        left.appendChild(nameWrap);

        const right = document.createElement("div");
        right.style.display = "flex";
        right.style.gap = "8px";
        right.style.alignItems = "center";

        // Крестик — открыть модал подтверждения удаления
        const delBtn = document.createElement("button");
        delBtn.className = "icon-btn delete-comment";
        delBtn.title = "Удалить из проекта";
        delBtn.innerHTML = '<i class="fas fa-times"></i>';
        delBtn.addEventListener("click", () => {
            openRemoveMemberModal(m);
        });

        right.appendChild(delBtn);
        item.appendChild(left);
        item.appendChild(right);
        participantsContainer.appendChild(item);
    });
}

// Перерисовать список прав
function renderRights() {
    rightsList.innerHTML = "";
    if (!projectState.members.length) {
        const empty = document.createElement("div");
        empty.style.opacity = "0.8";
        empty.textContent = "Нет участников";
        rightsList.appendChild(empty);
        return;
    }
    projectState.members.forEach((m) => {
        const item = document.createElement("div");
        item.className = "rights-item";

        const left = document.createElement("div");
        left.style.display = "flex";
        left.style.alignItems = "center";
        left.style.gap = "10px";

        const av = document.createElement("div");
        av.className = "avatar-small";
        av.textContent = m.avatar;

        const nameBlock = document.createElement("div");
        const nameEl = document.createElement("div");
        nameEl.textContent = m.name;
        nameEl.style.fontWeight = "600";
        const userEl = document.createElement("div");
        userEl.textContent = "@" + m.username;
        userEl.style.fontSize = "13px";
        userEl.style.opacity = "0.8";

        nameBlock.appendChild(nameEl);
        nameBlock.appendChild(userEl);
        left.appendChild(av);
        left.appendChild(nameBlock);

        const right = document.createElement("div");

        const hasAccess = !!projectState.rights.get(m.id);
        const accessBtn = document.createElement("button");
        accessBtn.className = "icon-btn";
        accessBtn.title = hasAccess ? "Забрать доступ" : "Дать доступ";
        accessBtn.innerHTML = hasAccess
            ? '<i class="fas fa-lock-open"></i>'
            : '<i class="fas fa-lock"></i>';
        accessBtn.addEventListener("click", () => {
            projectState.rights.set(m.id, !hasAccess);
            renderRights();
        });

        right.appendChild(accessBtn);
        item.appendChild(left);
        item.appendChild(right);
        rightsList.appendChild(item);
    });
}

// Простое уведомление (временное)
function flashNotice(text) {
    const el = document.createElement("div");
    el.textContent = text;
    el.style.position = "fixed";
    el.style.left = "50%";
    el.style.transform = "translateX(-50%)";
    el.style.bottom = "90px";
    el.style.background = "rgba(0,0,0,0.6)";
    el.style.padding = "8px 12px";
    el.style.borderRadius = "8px";
    el.style.zIndex = "1200";
    el.style.width = "auto";
    el.style.textAlign = "center";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
}

// Открыть модал подтверждения удаления участника
function openRemoveMemberModal(member) {
    memberToRemoveId = member.id;
    removeMemberText.textContent = `Вы уверены, что хотите удалить ${member.name} (@${member.username}) из проекта?`;
    confirmRemoveMemberModal.classList.add("active");
}

// Закрыть модал
function closeModal(modal) {
    modal.classList.remove("active");
}

// Слушатели
userSearch.addEventListener("input", (e) => {
    const q = e.target.value;
    if (!q) {
        closeDropdown();
        return;
    }
    const matches = searchUsers(q);
    renderDropdown(matches);
});

// Нажатие Enter в инпуте добавляет первого найденного пользователя
userSearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        const q = userSearch.value.trim();
        if (!q) return;
        const matches = searchUsers(q);
        if (matches.length) {
            addMemberById(matches[0].id);
            userSearch.value = "";
            closeDropdown();
        } else {
            flashNotice("Никто не найден");
        }
    } else if (e.key === "Escape") {
        closeDropdown();
    }
});

addByUsernameBtn.addEventListener("click", () => {
    const q = userSearch.value.trim();
    if (!q) {
        flashNotice("Введите имя или @username");
        return;
    }
    const matches = searchUsers(q);
    if (matches.length) {
        addMemberById(matches[0].id);
        userSearch.value = "";
        closeDropdown();
    } else {
        flashNotice("Никто не найден");
    }
});

// Клики вне dropdown закрывают его
document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrapper")) {
        closeDropdown();
    }
});

// Модал удалить участника
confirmRemoveMemberBtn.addEventListener("click", () => {
    if (memberToRemoveId != null) {
        removeMemberById(memberToRemoveId);
        memberToRemoveId = null;
    }
    closeModal(confirmRemoveMemberModal);
});
closeRemoveMemberModal.addEventListener("click", () =>
    closeModal(confirmRemoveMemberModal)
);

// Модал удалить проект
deleteProjectBtn.addEventListener("click", () => {
    confirmDeleteProjectModal.classList.add("active");
});
closeDeleteProjectModal.addEventListener("click", () =>
    closeModal(confirmDeleteProjectModal)
);
confirmDeleteProjectBtn.addEventListener("click", () => {
    window.location.href = "/";
});

document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "/";
});

// Начальная отрисовка
renderParticipants();
renderRights();

// Обработать изменение названия проекта (можно сохранить в бекенд при событии)
projectNameInput.addEventListener("change", () => {
    flashNotice("Название проекта изменено");
});
