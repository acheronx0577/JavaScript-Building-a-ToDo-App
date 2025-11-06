const taskForm = document.getElementById("add-or-update-task-btn");
const clearFormBtn = document.getElementById("clear-form-btn");
const tasksContainer = document.getElementById("tasks-container");
const titleInput = document.getElementById("title-input");
const dateInput = document.getElementById("date-input");
const descriptionInput = document.getElementById("description-input");
const taskCount = document.getElementById("task-count");
const status = document.getElementById("status");
const globalStatus = document.getElementById("global-status");
const tasksTotal = document.getElementById("tasks-total");
const tasksActive = document.getElementById("tasks-active");
const statsTotal = document.getElementById("stats-total");
const statsLastUpdate = document.getElementById("stats-last-update");
const confirmDialog = document.getElementById("confirm-dialog");
const dialogMessage = document.getElementById("dialog-message");
const dialogCancel = document.getElementById("dialog-cancel");
const dialogConfirm = document.getElementById("dialog-confirm");

const taskData = JSON.parse(localStorage.getItem("data")) || [];
let currentTask = {};

const sanitizeInput = (val) => {
    if (!val) return '';
    return val.trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
};

const formatDate = (dateString) => {
    if (!dateString) return 'NO_DATE';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
};

const updateLastUpdate = () => {
    statsLastUpdate.textContent = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

const addOrUpdateTask = () => {
    if (!titleInput.value.trim()) {
        status.textContent = "ERROR: NO_TITLE";
        globalStatus.textContent = "ERROR";
        return;
    }

    const dataArrIndex = taskData.findIndex((item) => item.id === currentTask.id);
    const taskObj = {
        id: currentTask.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: sanitizeInput(titleInput.value),
        date: sanitizeInput(dateInput.value),
        description: sanitizeInput(descriptionInput.value),
        completed: false,
        createdAt: currentTask.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (dataArrIndex === -1) {
        taskData.unshift(taskObj);
        status.textContent = "TASK_ADDED";
        globalStatus.textContent = "ADDED";
    } else {
        taskData[dataArrIndex] = taskObj;
        status.textContent = "TASK_UPDATED";
        globalStatus.textContent = "UPDATED";
    }

    localStorage.setItem("data", JSON.stringify(taskData));
    updateTaskContainer();
    resetForm();
    updateLastUpdate();
};

const updateTaskContainer = () => {
    tasksContainer.innerHTML = "";

    if (taskData.length === 0) {
        tasksContainer.innerHTML = '<div class="placeholder">NO_TASKS_ADDED</div>';
        taskCount.textContent = "0";
        tasksTotal.textContent = "0";
        tasksActive.textContent = "0";
        statsTotal.textContent = "0";
        return;
    }

    taskData.forEach(({ id, title, date, description }) => {
        const taskElement = document.createElement("div");
        taskElement.className = "task-item";
        taskElement.innerHTML = `
            <div class="task-header">
                <div class="task-title">${title}</div>
                <div class="task-date">${formatDate(date)}</div>
            </div>
            <div class="task-description">${description || 'No description provided.'}</div>
            <div class="task-actions">
                <button onclick="editTask('${id}')" class="terminal-btn secondary">EDIT</button>
                <button onclick="deleteTask('${id}')" class="terminal-btn warning">DELETE</button>
            </div>
        `;
        tasksContainer.appendChild(taskElement);
    });

    taskCount.textContent = taskData.length;
    tasksTotal.textContent = taskData.length;
    tasksActive.textContent = taskData.length;
    statsTotal.textContent = taskData.length;
    status.textContent = "TASKS_LOADED";
    globalStatus.textContent = "READY";
};

const deleteTask = (taskId) => {
    showConfirmDialog(
        "DELETE_TASK?",
        "This action cannot be undone.",
        () => {
            const dataArrIndex = taskData.findIndex((item) => item.id === taskId);
            if (dataArrIndex !== -1) {
                taskData.splice(dataArrIndex, 1);
                localStorage.setItem("data", JSON.stringify(taskData));
                updateTaskContainer();
                status.textContent = "TASK_DELETED";
                globalStatus.textContent = "DELETED";
                updateLastUpdate();
            }
        }
    );
};

const editTask = (taskId) => {
    const dataArrIndex = taskData.findIndex((item) => item.id === taskId);
    
    if (dataArrIndex !== -1) {
        currentTask = taskData[dataArrIndex];

        titleInput.value = currentTask.title;
        dateInput.value = currentTask.date;
        descriptionInput.value = currentTask.description;

        taskForm.textContent = "[UPDATE_TASK]";
        taskForm.classList.add("warning");
        
        status.textContent = "EDITING_TASK";
        globalStatus.textContent = "EDITING";
        
        // Scroll to form
        titleInput.focus();
    }
};

const resetForm = () => {
    taskForm.textContent = "[ADD_TASK]";
    taskForm.classList.remove("warning");
    titleInput.value = "";
    dateInput.value = "";
    descriptionInput.value = "";
    currentTask = {};
    status.textContent = "READY";
    globalStatus.textContent = "READY";
};

const showConfirmDialog = (title, message, confirmCallback) => {
    dialogMessage.textContent = message;
    confirmDialog.showModal();

    const handleConfirm = () => {
        confirmCallback();
        confirmDialog.close();
        cleanupEvents();
    };

    const handleCancel = () => {
        confirmDialog.close();
        status.textContent = "CANCELLED";
        globalStatus.textContent = "READY";
        cleanupEvents();
    };

    const cleanupEvents = () => {
        dialogConfirm.removeEventListener("click", handleConfirm);
        dialogCancel.removeEventListener("click", handleCancel);
    };

    dialogConfirm.addEventListener("click", handleConfirm);
    dialogCancel.addEventListener("click", handleCancel);
};

// Initialize
if (taskData.length) {
    updateTaskContainer();
}

updateLastUpdate();

// Event Listeners
taskForm.addEventListener("click", (e) => {
    e.preventDefault();
    addOrUpdateTask();
});

clearFormBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (titleInput.value || dateInput.value || descriptionInput.value) {
        showConfirmDialog(
            "CLEAR_FORM?",
            "All unsaved changes will be lost.",
            resetForm
        );
    } else {
        resetForm();
    }
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") {
        taskForm.click();
    }
    if (e.ctrlKey && e.key === "l") {
        clearFormBtn.click();
    }
    if (e.key === "Escape") {
        resetForm();
    }
});

// Initialize status
status.textContent = "READY";
globalStatus.textContent = "READY";
