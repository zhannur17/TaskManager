// API Configuration
const API_URL = '/api';
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// DOM Elements
const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const createTaskBtn = document.getElementById('createTaskBtn');
const loading = document.getElementById('loading');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    if (authToken) {
        loadUserProfile();
    } else {
        showAuthSection();
    }
});

// Setup Event Listeners
function setupEventListeners() {
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchAuthTab(tabName);
        });
    });

    // Forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    taskForm.addEventListener('submit', handleTaskSubmit);
    logoutBtn.addEventListener('click', handleLogout);

    // Task controls
    createTaskBtn.addEventListener('click', () => openTaskModal());
    document.getElementById('filterStatus').addEventListener('change', loadTasks);
    document.getElementById('filterPriority').addEventListener('change', loadTasks);
    document.getElementById('sortTasks').addEventListener('change', loadTasks);

    // Modal
    document.querySelector('.close').addEventListener('click', closeTaskModal);
    document.getElementById('cancelTaskBtn').addEventListener('click', closeTaskModal);
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            closeTaskModal();
        }
    });

    // Set minimum date for task due date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('taskDueDate').setAttribute('min', today);
}

// Switch Auth Tab
function switchAuthTab(tabName) {
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Form`).classList.add('active');
}

// Show/Hide Sections
function showAuthSection() {
    authSection.style.display = 'block';
    dashboardSection.style.display = 'none';
    logoutBtn.style.display = 'none';
}

function showDashboardSection() {
    authSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    logoutBtn.style.display = 'block';
}

function showLoading() {
    loading.style.display = 'flex';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.add('show');
    setTimeout(() => {
        errorElement.classList.remove('show');
    }, 5000);
}

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        ...options,
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.errors?.[0] || 'Something went wrong');
    }

    return data;
}

// Authentication Handlers
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showError('loginError', 'Please fill in all fields');
        return;
    }

    showLoading();
    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        authToken = data.data.token;
        localStorage.setItem('authToken', authToken);
        currentUser = data.data;

        loginForm.reset();
        await loadUserProfile();
    } catch (error) {
        showError('loginError', error.message);
    } finally {
        hideLoading();
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    if (!username || !email || !password) {
        showError('registerError', 'Please fill in all fields');
        return;
    }

    if (username.length < 3 || username.length > 30) {
        showError('registerError', 'Username must be 3-30 characters long');
        return;
    }

    if (password.length < 6) {
        showError('registerError', 'Password must be at least 6 characters long');
        return;
    }

    showLoading();
    try {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
        });

        authToken = data.data.token;
        localStorage.setItem('authToken', authToken);
        currentUser = data.data;

        registerForm.reset();
        await loadUserProfile();
    } catch (error) {
        showError('registerError', error.message);
    } finally {
        hideLoading();
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    showAuthSection();
}

// Load User Profile
async function loadUserProfile() {
    showLoading();
    try {
        const data = await apiRequest('/users/profile');
        currentUser = data.data;

        document.getElementById('userName').textContent = currentUser.username;
        document.getElementById('userRole').textContent = currentUser.role;

        showDashboardSection();
        await loadTasks();
    } catch (error) {
        console.error('Error loading profile:', error);
        handleLogout();
    } finally {
        hideLoading();
    }
}

// Load Tasks
async function loadTasks() {
    showLoading();
    try {
        const status = document.getElementById('filterStatus').value;
        const priority = document.getElementById('filterPriority').value;
        const sort = document.getElementById('sortTasks').value;

        let endpoint = '/tasks?';
        if (status) endpoint += `status=${status}&`;
        if (priority) endpoint += `priority=${priority}&`;
        if (sort) endpoint += `sort=${sort}`;

        const data = await apiRequest(endpoint);
        displayTasks(data.data);
        updateStats(data.data);
    } catch (error) {
        console.error('Error loading tasks:', error);
        showError('taskFormError', error.message);
    } finally {
        hideLoading();
    }
}

// Display Tasks
function displayTasks(tasks) {
    const tasksList = document.getElementById('tasksList');

    if (!tasks || tasks.length === 0) {
        tasksList.innerHTML = '<p class="no-tasks">No tasks found. Create your first task!</p>';
        return;
    }

    tasksList.innerHTML = tasks.map(task => `
        <div class="task-card ${task.status ? 'completed' : ''} priority-${task.priority}">
            <div class="task-header">
                <div class="task-title-section">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        <span class="task-badge priority priority-${task.priority}">${task.priority.toUpperCase()}</span>
                        <span class="task-badge ${task.status ? 'status' : 'status-pending'}">
                            ${task.status ? 'Completed' : 'Pending'}
                        </span>
                        <span class="task-badge due-date">📅 ${formatDate(task.dueDate)}</span>
                    </div>
                </div>
            </div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
            <div class="task-actions">
                <button class="btn btn-sm ${task.status ? 'btn-secondary' : 'btn-success'}" onclick="toggleTaskStatus('${task._id}', ${!task.status})">
                    ${task.status ? 'Mark Pending' : 'Mark Complete'}
                </button>
                <button class="btn btn-sm btn-primary" onclick="editTask('${task._id}')">Edit</button>
                <button class="btn btn-sm btn-secondary" onclick="sendTaskReminder('${task._id}')">Send Reminder</button>
                <button class="btn btn-sm btn-danger" onclick="deleteTask('${task._id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Update Stats
function updateStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status).length;
    const pending = total - completed;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
}

// Task Modal Functions
function openTaskModal(task = null) {
    const modalTitle = document.getElementById('modalTitle');
    const taskId = document.getElementById('taskId');
    const taskTitle = document.getElementById('taskTitle');
    const taskDescription = document.getElementById('taskDescription');
    const taskDueDate = document.getElementById('taskDueDate');
    const taskPriority = document.getElementById('taskPriority');

    if (task) {
        modalTitle.textContent = 'Edit Task';
        taskId.value = task._id;
        taskTitle.value = task.title;
        taskDescription.value = task.description || '';
        taskDueDate.value = task.dueDate.split('T')[0];
        taskPriority.value = task.priority;
    } else {
        modalTitle.textContent = 'Create New Task';
        taskForm.reset();
        taskId.value = '';
        const today = new Date().toISOString().split('T')[0];
        taskDueDate.value = today;
    }

    taskModal.classList.add('show');
}

function closeTaskModal() {
    taskModal.classList.remove('show');
    taskForm.reset();
    document.getElementById('taskFormError').classList.remove('show');
}

// Task CRUD Operations
async function handleTaskSubmit(e) {
    e.preventDefault();

    const taskId = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;

    if (!title || !dueDate) {
        showError('taskFormError', 'Title and due date are required');
        return;
    }

    const taskData = {
        title,
        description,
        dueDate: new Date(dueDate).toISOString(),
        priority,
    };

    showLoading();
    try {
        if (taskId) {
            // Update existing task
            await apiRequest(`/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify(taskData),
            });
        } else {
            // Create new task
            await apiRequest('/tasks', {
                method: 'POST',
                body: JSON.stringify(taskData),
            });
        }

        closeTaskModal();
        await loadTasks();
    } catch (error) {
        showError('taskFormError', error.message);
    } finally {
        hideLoading();
    }
}

async function editTask(taskId) {
    showLoading();
    try {
        const data = await apiRequest(`/tasks/${taskId}`);
        openTaskModal(data.data);
    } catch (error) {
        alert('Error loading task: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function toggleTaskStatus(taskId, newStatus) {
    showLoading();
    try {
        await apiRequest(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus }),
        });
        await loadTasks();
    } catch (error) {
        alert('Error updating task: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    showLoading();
    try {
        await apiRequest(`/tasks/${taskId}`, {
            method: 'DELETE',
        });
        await loadTasks();
    } catch (error) {
        alert('Error deleting task: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function sendTaskReminder(taskId) {
    showLoading();
    try {
        await apiRequest(`/tasks/${taskId}/remind`, {
            method: 'POST',
        });
        alert('Task reminder email sent successfully!');
    } catch (error) {
        alert('Error sending reminder: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}