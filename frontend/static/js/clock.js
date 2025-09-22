const folderBtn = document.querySelector(".bottom-bar .fa-folder");
const userBtn = document.querySelector(".bottom-bar .fa-user");
const clockBtn = document.querySelector(".bottom-bar .fa-clock");

const notifyModal = document.getElementById("notifyModal");
const closeNotify = document.getElementById("closeNotify");

const allModals = [notifyModal].filter(Boolean);

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
