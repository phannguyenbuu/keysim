const API_BASE = window.location.origin;
let currentTaskId = null;
let statusCheckInterval = null;
let hasDownloaded = false;
let isDownloading = false;
let isRestoringTask = false;
function log(message, level = "INFO") {
}
document.addEventListener('DOMContentLoaded', function () {
    setupForm();
    setupGoogleButtons();
    fetchCurrentUser();
    fetchUserCount();
    restoreTaskFromStorage();
    setupManualDownload();
    if (!currentTaskId) {
        resetFormState();
    }
});
function setupGoogleButtons() {
    const loginBtn = document.getElementById('googleLoginBtn');
    const logoutBtn = document.getElementById('googleLogoutBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function () {
            window.location.href = '/auth/google/login';
        });
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function () {
            try {
                await fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (e) {
                console.error('Logout failed', e);
            }
            const loginSection = document.getElementById('loginSection');
            const loggedInSection = document.getElementById('loggedInSection');
            if (loginSection) loginSection.style.display = 'block';
            if (loggedInSection) loggedInSection.style.display = 'none';
            fetchCurrentUser();
        });
    }
}
async function fetchCurrentUser() {
    try {
        const resp = await fetch(`${API_BASE}/auth/me`, {
            credentials: 'include'
        });
        if (!resp.ok) {
            return;
        }
        const response = await resp.json();
        if (!response.data || !response.signature) {
            console.error('Invalid response format');
            return;
        }
        const data = response.data;
        const email = data.email;
        const isAuthenticated = data.is_authenticated;
        const isAdmin = data.is_admin || false;
        const emailLabel = document.getElementById('loggedInEmail');
        const loginSection = document.getElementById('loginSection');
        const loggedInSection = document.getElementById('loggedInSection');
        const loginBtn = document.getElementById('googleLoginBtn');
        const logoutBtn = document.getElementById('googleLogoutBtn');
        const inviteCodeRow = document.getElementById('inviteCodeRow');

        if (inviteCodeRow) {
            inviteCodeRow.style.display = isAdmin ? 'grid' : 'none';
        }

        if (isAuthenticated && email) {
            if (loginSection) loginSection.style.display = 'none';
            if (loggedInSection) loggedInSection.style.display = 'block';
            if (emailLabel) {
                emailLabel.textContent = email;
            }
            const adminLinkSection = document.getElementById('adminLinkSection');
            if (adminLinkSection) {
                adminLinkSection.style.display = isAdmin ? 'block' : 'none';
            }
        } else {
            if (loginSection) loginSection.style.display = 'block';
            if (loggedInSection) loggedInSection.style.display = 'none';
            if (inviteCodeRow) {
                inviteCodeRow.style.display = 'none';
            }
        }
    } catch (e) {
        console.error('Auth error', e);
    }
}
function setupForm() {
    const form = document.getElementById('taskForm');
    const generationMode = document.getElementById('generationMode');
    const imageUploadGroup = document.getElementById('imageUploadGroup');
    const promptRow = document.getElementById('promptRow');
    if (!form) {
        return;
    }
    generationMode.addEventListener('change', function () {
        if (this.value === 'image_to_model') {
            imageUploadGroup.style.display = 'grid';
            if (promptRow) promptRow.style.display = 'none';
        } else {
            imageUploadGroup.style.display = 'none';
            if (promptRow) promptRow.style.display = 'grid';
        }
    });
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const prompt = document.getElementById('prompt').value.trim();
        const genMode = document.getElementById('generationMode').value;
        const imageFile = document.getElementById('imageFile');
        if (genMode === 'text_to_model' && !prompt) {
            alert('Vui lòng nhập prompt cho Text to Model mode!');
            return;
        }
        if (genMode === 'image_to_model') {
            if (!imageFile || !imageFile.files || imageFile.files.length === 0) {
                alert('Vui lòng chọn ảnh cho Image to Model mode!');
                return;
            }
        }
        await createTask();
    });
}
async function createTask() {
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) {
        return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'RUNNING...';
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }
    hasDownloaded = false;
    isDownloading = false;
    lastProgressUpdate = null;
    lastProgressValue = null;
    lastLogCount = 0;
    const statusElement = document.getElementById('taskStatus');
    const progressElement = document.getElementById('taskProgress');
    const messageElement = document.getElementById('taskMessage');
    const progressBar = document.getElementById('progressBarFill');
    const resultDiv = document.getElementById('taskResult');
    const errorDiv = document.getElementById('taskError');

    if (statusElement) {
        statusElement.textContent = 'PENDING';
        statusElement.className = 'status-pending';
    }
    if (progressElement) progressElement.textContent = '0';
    if (progressBar) progressBar.style.width = '0%';
    if (messageElement) messageElement.textContent = 'Đang khởi tạo task...';
    if (resultDiv) resultDiv.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';

    try {
        const inviteCode = document.getElementById('inviteCode').value.trim() || null;
        const prompt = document.getElementById('prompt').value.trim() || null;
        const genMode = document.getElementById('generationMode').value;
        const customZipName = document.getElementById('customZipName').value.trim() || null;
        const imageFile = document.getElementById('imageFile');
        const formData = new FormData();
        if (inviteCode) formData.append('invite_code', inviteCode);
        if (prompt) formData.append('prompt', prompt);
        formData.append('generation_mode', genMode);
        if (customZipName) formData.append('custom_zip_name', customZipName);
        if (genMode === 'image_to_model' && imageFile && imageFile.files && imageFile.files.length > 0) {
            formData.append('image_file', imageFile.files[0]);
        }
        const response = await fetch(`${API_BASE}/api/v1/tasks`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const responseText = await response.text();
        if (!response.ok) {
            let errorText = 'Failed to create task';
            try {
                const error = JSON.parse(responseText);
                errorText = error.detail || error.message || errorText;
            } catch (e) {
                errorText = responseText || `HTTP ${response.status}`;
            }
            throw new Error(errorText);
        }
        const result = JSON.parse(responseText);
        const newTaskId = result.task_id;
        if (!newTaskId) {
            throw new Error('Task ID not received');
        }
        currentTaskId = newTaskId;
        localStorage.setItem('currentTaskId', newTaskId);
        const mainSection = document.getElementById('mainSection');
        const statusSection = document.getElementById('taskStatusSection');
        if (!mainSection || !statusSection) {
            throw new Error('UI elements missing');
        }
        mainSection.style.display = 'none';
        statusSection.style.display = 'block';
        document.getElementById('taskId').textContent = newTaskId;
        startStatusPolling();
        setTimeout(() => checkTaskStatus(), 50);
    } catch (error) {
        alert('Lỗi: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'START AUTOMATION';
    }
}
function startStatusPolling() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
    checkTaskStatus();
    statusCheckInterval = setInterval(checkTaskStatus, 5000);
}
let lastLogCount = 0;
let lastProgressUpdate = null;
let lastProgressValue = null;
async function checkTaskStatus() {
    if (!currentTaskId) {
        return;
    }
    const taskIdToCheck = currentTaskId;
    try {
        const response = await fetch(`${API_BASE}/api/v1/tasks/${taskIdToCheck}?t=${Date.now()}`, {
            cache: 'no-cache',
            credentials: 'include'
        });
        if (!response.ok) {
            if (response.status === 404) {
                if (currentTaskId === taskIdToCheck) {
                    resetFormState();
                }
                return;
            }
            return;
        }
        const task = await response.json();
        if (currentTaskId !== taskIdToCheck) {
            return;
        }
        if (task.status === 'running') {
            const currentProgress = task.progress || 0;
            const now = Date.now();
            if (lastProgressValue !== null && lastProgressUpdate !== null) {
                const timeSinceUpdate = now - lastProgressUpdate;
                if (timeSinceUpdate > 5 * 60 * 1000 && currentProgress === lastProgressValue) {
                    resetFormState();
                    return;
                }
            }
            if (currentProgress !== lastProgressValue) {
                lastProgressValue = currentProgress;
                lastProgressUpdate = now;
            } else if (lastProgressUpdate === null) {
                lastProgressUpdate = now;
                lastProgressValue = currentProgress;
            }
        } else {
            lastProgressUpdate = null;
            lastProgressValue = null;
        }
        if (task.status !== 'pending' && task.status !== 'running') {
            if (statusCheckInterval) {
                clearInterval(statusCheckInterval);
                statusCheckInterval = null;
            }
            updateTaskStatus(task);
            if (task.status === 'completed' && task.file_ready && !hasDownloaded) {
                hasDownloaded = true;
                setTimeout(() => {
                    downloadResult();
                }, 500);
            }
            return;
        }
        const previousStatus = document.getElementById('taskStatus')?.textContent?.toLowerCase();
        const currentStatus = task.status?.toLowerCase();
        updateTaskStatus(task);
        if (previousStatus !== currentStatus) {
            setTimeout(() => checkTaskStatus(), 300);
        }
    } catch (error) {
    }
}
function updateTaskStatus(task) {
    const statusElement = document.getElementById('taskStatus');
    const progressElement = document.getElementById('taskProgress');
    const messageElement = document.getElementById('taskMessage');
    const progressBar = document.getElementById('progressBarFill');
    if (statusElement) {
        statusElement.textContent = task.status.toUpperCase();
        statusElement.className = `status-${task.status}`;
    }
    const progress = task.progress || 0;
    if (progressElement) {
        progressElement.textContent = progress;
    }
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
    if (task.status === 'completed') {
        const resultDiv = document.getElementById('taskResult');
        const errorDiv = document.getElementById('taskError');
        if (resultDiv) resultDiv.style.display = 'block';
        if (errorDiv) errorDiv.style.display = 'none';
        // Download button removed from UI
    } else if (task.status === 'failed') {
        const resultDiv = document.getElementById('taskResult');
        const errorDiv = document.getElementById('taskError');
        if (resultDiv) resultDiv.style.display = 'none';
        if (errorDiv) errorDiv.style.display = 'block';
        const errorMsg = document.getElementById('errorMessage');
        if (errorMsg) {
            errorMsg.textContent = task.error || task.message || 'Unknown error';
        }
    } else {
        const resultDiv = document.getElementById('taskResult');
        const errorDiv = document.getElementById('taskError');
        if (resultDiv) resultDiv.style.display = 'none';
        if (errorDiv) errorDiv.style.display = 'none';
    }
}
function setupManualDownload() {
    const manualBtn = document.getElementById('manualDownloadBtn');
    if (manualBtn) {
        manualBtn.addEventListener('click', function () {
            downloadResult();
        });
    }
}
async function downloadResult() {
    if (!currentTaskId) return;
    if (isDownloading) {
        return;
    }
    // Check status if needed, but usually called when file_ready is true
    isDownloading = true;
    // Status update logic removed
    try {
        const maxRetries = 3;
        let response = null;
        let lastError = null;
        let timeoutId = null;
        for (let retry = 0; retry < maxRetries; retry++) {
            try {
                const controller = new AbortController();
                timeoutId = setTimeout(() => controller.abort(), 300000);
                response = await fetch(`${API_BASE}/api/v1/tasks/${currentTaskId}/download`, {
                    signal: controller.signal
                });
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = null;
                if (response.ok) {
                    break;
                } else {
                    const errorText = await response.text();
                    let errorMsg = 'Failed to download file';
                    try {
                        const error = JSON.parse(errorText);
                        errorMsg = error.detail || error.message || errorMsg;
                    } catch (e) {
                        errorMsg = errorText || errorMsg;
                    }
                    lastError = new Error(errorMsg);
                    if (response.status >= 400 && response.status < 500) {
                        throw lastError;
                    }
                    if (retry < maxRetries - 1) {
                        await new Promise(resolve => setTimeout(resolve, 2000 * (retry + 1)));
                    }
                }
            } catch (error) {
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = null;
                lastError = error;
                if (error.name === 'AbortError') {
                    throw new Error('Download timeout');
                }
                if (retry < maxRetries - 1 && error.name !== 'AbortError') {
                    await new Promise(resolve => setTimeout(resolve, 2000 * (retry + 1)));
                } else {
                    throw error;
                }
            }
        }
        if (!response || !response.ok) {
            throw lastError || new Error('Failed to download file');
        }
        const blob = await response.blob();
        if (blob.size === 0) {
            throw new Error('File is empty');
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = null;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '');
                try {
                    filename = decodeURIComponent(filename);
                } catch (e) { }
            }
        }
        if (!filename) {
            try {
                const statusResponse = await fetch(`${API_BASE}/api/v1/tasks/${currentTaskId}`);
                if (statusResponse.ok) {
                    const task = await statusResponse.json();
                    if (task.download_path) {
                        const pathParts = task.download_path.split('/');
                        filename = pathParts[pathParts.length - 1];
                    }
                }
            } catch (e) { }
        }
        if (!filename) {
            filename = `xinchao3d-model-${currentTaskId}.zip`;
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        // Download button removed
    } finally {
        isDownloading = false;
    }
}
async function restoreTaskFromStorage() {
    if (isRestoringTask) {
        return;
    }
    let savedTaskId = localStorage.getItem('currentTaskId');
    if (!savedTaskId) {
        try {
            const resp = await fetch(`${API_BASE}/api/v1/my-tasks`, {
                credentials: 'include'
            });
            if (resp.ok) {
                const data = await resp.json();
                const tasks = data.tasks || [];
                const activeTask = tasks.find(t => t.status === 'pending' || t.status === 'running');
                if (activeTask) {
                    savedTaskId = activeTask.task_id;
                    localStorage.setItem('currentTaskId', savedTaskId);
                }
            }
        } catch (e) { }
    }
    if (!savedTaskId) {
        return;
    }
    isRestoringTask = true;
    try {
        let response = null;
        for (let retry = 0; retry < 3; retry++) {
            try {
                if (retry > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retry - 1)));
                }
                response = await fetch(`${API_BASE}/api/v1/tasks/${savedTaskId}`, {
                    cache: 'no-cache',
                    credentials: 'include'
                });
                if (response.ok) {
                    break;
                }
                if (response.status === 404) {
                    localStorage.removeItem('currentTaskId');
                    return;
                }
            } catch (error) { }
        }
        if (!response || !response.ok) {
            return;
        }
        const task = await response.json();
        if (task.status !== 'pending' && task.status !== 'running') {
            localStorage.removeItem('currentTaskId');
            return;
        }
        currentTaskId = savedTaskId;
        lastLogCount = 0;
        hasDownloaded = false;
        const mainSection = document.getElementById('mainSection');
        const statusSection = document.getElementById('taskStatusSection');
        if (mainSection && statusSection) {
            mainSection.style.display = 'none';
            statusSection.style.display = 'block';
            document.getElementById('taskId').textContent = currentTaskId;
            updateTaskStatus(task);
            startStatusPolling();
        }
    } catch (error) { } finally {
        isRestoringTask = false;
    }
}
function resetFormState() {
    currentTaskId = null;
    lastProgressUpdate = null;
    lastProgressValue = null;
    lastLogCount = 0;
    hasDownloaded = false;
    isDownloading = false;
    localStorage.removeItem('currentTaskId');
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }
    const form = document.getElementById('taskForm');
    const statusSection = document.getElementById('taskStatusSection');
    const mainSection = document.getElementById('mainSection');
    const submitBtn = document.getElementById('submitBtn');
    if (form) form.reset();
    if (statusSection) statusSection.style.display = 'none';
    if (mainSection) mainSection.style.display = 'block';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'START AUTOMATION';
    }
    const imageUploadGroup = document.getElementById('imageUploadGroup');
    const promptRow = document.getElementById('promptRow');
    if (imageUploadGroup) imageUploadGroup.style.display = 'none';
    if (promptRow) promptRow.style.display = 'grid';
    // Download button removed
}
function resetForm() {
    resetFormState();
}
async function fetchUserCount() {
    try {
        const resp = await fetch(`${API_BASE}/api/v1/user-count`, {
            credentials: 'include'
        });
        if (resp.ok) {
            const data = await resp.json();
            const userCountElement = document.getElementById('userCount');
            if (userCountElement) {
                userCountElement.textContent = data.user_count || 0;
            }
        } else {
            const userCountElement = document.getElementById('userCount');
            if (userCountElement) {
                userCountElement.textContent = '0';
            }
        }
    } catch (e) {
        const userCountElement = document.getElementById('userCount');
        if (userCountElement) {
            userCountElement.textContent = '0';
        }
    }
}