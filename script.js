// Personal Dashboard JavaScript

// Global data cache
let appData = {
    weightData: {},
    calorieData: {},
    diaryData: {},
    lastUpdated: null
};

// Debug function to test both hypotheses
function debugDiaryState(location) {
    console.log(`=== DEBUG ${location} ===`);
    console.log('appData exists:', !!appData);
    console.log('appData.diaryData exists:', !!appData.diaryData);
    console.log('diaryData keys:', Object.keys(appData.diaryData || {}));
    console.log('entries-list element:', document.getElementById('entries-list'));
    console.log('diary-view display:', document.getElementById('diary-view').style.display);
    console.log('diary-view visible:', document.getElementById('diary-view').offsetHeight > 0);
    console.log('========================');
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    updateCurrentDate();
    setTodayDate();
    setupDiaryEventListeners();
    
    // Check OAuth callback first
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code')) {
        await githubAuth.handleCallback();
        return;
    }
    
    // Check if already authenticated
    if (githubAuth.isAuthenticated()) {
        try {
            const isAuthorized = await githubAuth.isAuthorizedUser();
            if (isAuthorized) {
                await showDashboard();
                return;
            }
        } catch (error) {
            console.error('Auth error:', error);
        }
    }
    
    // Show login if not authenticated
    showLogin();
}

function setupDiaryEventListeners() {
    // Add event listeners when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        const contentEditor = document.getElementById('diary-content');
        const titleInput = document.getElementById('diary-title');
        
        if (contentEditor) {
            // Show toolbar when content is focused
            contentEditor.addEventListener('focus', showFormattingToolbar);
            
            // Update word count on input
            contentEditor.addEventListener('input', updateWordCount);
            
            // Auto-save on blur (when user leaves the field)
            contentEditor.addEventListener('blur', function() {
                if (contentEditor.textContent.trim() || titleInput.value.trim()) {
                    saveDiaryEntry();
                }
            });
        }
        
        if (titleInput) {
            // Auto-save on blur for title too
            titleInput.addEventListener('blur', function() {
                if (contentEditor.textContent.trim() || titleInput.value.trim()) {
                    saveDiaryEntry();
                }
            });
        }
    });
}

function showLogin() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('tab-navigation').style.display = 'none';
    document.getElementById('diary-view').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'none';
    document.getElementById('user-info').style.display = 'none';
}

async function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('tab-navigation').style.display = 'block';
    document.getElementById('user-info').style.display = 'block';
    
    // Load user info
    const user = await githubAuth.getCurrentUser();
    if (user) {
        document.getElementById('user-name').textContent = user.login;
    }
    
    // Load data first
    await loadData();
    
    // Then manually show diary view without relying on switchTab
    document.getElementById('diary-view').style.display = 'block';
    document.getElementById('diary-tab').classList.add('active');
    updateDiaryTitle();
    
    debugDiaryState('BEFORE updateDiaryDisplay in showDashboard');
    updateDiaryDisplay();
    loadDiaryEntry();
}

async function authenticateWithToken() {
    const tokenInput = document.getElementById('token-input') || document.getElementById('token-input-alt');
    const token = tokenInput.value.trim();
    
    // Clear any previous error
    clearError();
    
    if (!token) {
        showError('Please enter a token');
        return;
    }
    
    try {
        await githubAuth.setToken(token);
        await showDashboard();
    } catch (error) {
        showError(error.message || 'Authentication failed');
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function clearError() {
    const errorDiv = document.getElementById('error-message');
    errorDiv.style.display = 'none';
}

function logout() {
    githubAuth.logout();
}

// Tab switching functionality
async function switchTab(tabName) {
    // Hide all views
    document.getElementById('diary-view').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'none';
    
    // Remove active class from all tabs
    document.getElementById('diary-tab').classList.remove('active');
    document.getElementById('dashboard-tab').classList.remove('active');
    
    // Show selected view and mark tab as active
    if (tabName === 'diary') {
        document.getElementById('diary-view').style.display = 'block';
        document.getElementById('diary-tab').classList.add('active');
        updateDiaryTitle();
        
        // Ensure data is loaded before updating diary display
        if (!appData.lastUpdated) {
            await loadData();
        }
        
        updateDiaryDisplay(); // Load diary entries when switching to diary tab
        loadDiaryEntry(); // Load current diary entry
    } else if (tabName === 'dashboard') {
        document.getElementById('dashboard-view').style.display = 'block';
        document.getElementById('dashboard-tab').classList.add('active');
        await loadDashboard();
    }
}

// Update diary title based on selected date
function updateDiaryTitle() {
    const dateInput = document.getElementById('diary-date');
    const titleElement = document.getElementById('diary-entry-title');
    
    if (dateInput.value) {
        const selectedDate = new Date(dateInput.value);
        const today = new Date();
        
        // Check if selected date is today
        if (selectedDate.toDateString() === today.toDateString()) {
            titleElement.textContent = "Today's Entry";
        } else {
            const options = { weekday: 'long', month: 'long', day: 'numeric' };
            titleElement.textContent = selectedDate.toLocaleDateString('en-US', options);
        }
    } else {
        titleElement.textContent = "Today's Entry";
    }
}

// Debug function - delete current gist and start fresh
async function startFresh() {
    if (confirm('Are you sure you want to delete all your data and start fresh? This cannot be undone!')) {
        const deleted = await githubAuth.deleteCurrentGist();
        if (deleted) {
            alert('Gist deleted! Refreshing page to start fresh...');
            window.location.reload();
        } else {
            alert('Failed to delete gist. Check console for errors.');
        }
    }
}

// Date utility functions
function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('diary-date').value = today;
}

function getDateKey(date = new Date()) {
    return date.toISOString().split('T')[0];
}

// Weight Tracking Functions
async function addWeight() {
    const weightInput = document.getElementById('weight-input');
    const weight = parseFloat(weightInput.value);
    
    if (isNaN(weight) || weight <= 0) {
        alert('Please enter a valid weight');
        return;
    }
    
    const today = getDateKey();
    appData.weightData[today] = weight;
    
    await saveData();
    
    weightInput.value = '';
    updateWeightDisplay();
}

function getWeightData() {
    return appData.weightData;
}

function updateWeightDisplay() {
    const weightData = getWeightData();
    const dates = Object.keys(weightData).sort();
    
    if (dates.length === 0) {
        document.getElementById('current-weight').textContent = '--';
        document.getElementById('weight-change').textContent = '--';
        return;
    }
    
    const currentWeight = weightData[dates[dates.length - 1]];
    document.getElementById('current-weight').textContent = currentWeight.toFixed(1);
    
    if (dates.length > 1) {
        const previousWeight = weightData[dates[dates.length - 2]];
        const change = currentWeight - previousWeight;
        const changeText = change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
        document.getElementById('weight-change').textContent = changeText;
        document.getElementById('weight-change').className = change > 0 ? 'positive' : 'negative';
    }
    
    updateWeightHistory(weightData, dates);
}

function updateWeightHistory(weightData, dates) {
    const historyDiv = document.getElementById('weight-history');
    const recentDates = dates.slice(-7).reverse();
    
    historyDiv.innerHTML = recentDates.map(date => {
        const weight = weightData[date];
        const displayDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `<div class="history-item">${displayDate}: ${weight.toFixed(1)}</div>`;
    }).join('');
}

// Calorie Tracking Functions
async function logCalories() {
    const goalInput = document.getElementById('calorie-goal');
    const consumedInput = document.getElementById('calories-consumed');
    
    const goal = parseInt(goalInput.value);
    const consumed = parseInt(consumedInput.value);
    
    if (isNaN(goal) || isNaN(consumed) || goal <= 0 || consumed < 0) {
        alert('Please enter valid calorie values');
        return;
    }
    
    const today = getDateKey();
    appData.calorieData[today] = { goal, consumed };
    
    await saveData();
    
    goalInput.value = '';
    consumedInput.value = '';
    updateCalorieDisplay();
}

function getCalorieData() {
    return appData.calorieData;
}

function updateCalorieDisplay() {
    const calorieData = getCalorieData();
    const today = getDateKey();
    
    if (calorieData[today]) {
        const { goal, consumed } = calorieData[today];
        const deficit = goal - consumed;
        
        document.getElementById('today-calorie-goal').textContent = goal;
        document.getElementById('today-consumed').textContent = consumed;
        document.getElementById('today-deficit').textContent = deficit > 0 ? `+${deficit}` : deficit;
        document.getElementById('today-deficit').className = deficit > 0 ? 'positive' : 'negative';
    }
    
    updateWeeklyAdherence(calorieData);
}

function updateWeeklyAdherence(calorieData) {
    const dates = Object.keys(calorieData).sort();
    const lastWeek = dates.slice(-7);
    
    if (lastWeek.length === 0) {
        document.getElementById('weekly-adherence').textContent = '--';
        return;
    }
    
    const adherentDays = lastWeek.filter(date => {
        const { goal, consumed } = calorieData[date];
        return consumed <= goal;
    }).length;
    
    const adherencePercent = Math.round((adherentDays / lastWeek.length) * 100);
    document.getElementById('weekly-adherence').textContent = `${adherencePercent}%`;
}

// Diary Functions
async function saveDiaryEntry() {
    const dateInput = document.getElementById('diary-date');
    const titleInput = document.getElementById('diary-title');
    const contentInput = document.getElementById('diary-content');
    
    const date = dateInput.value;
    const title = titleInput.value.trim();
    const content = contentInput.textContent.trim();
    
    if (!date || (!title && !content)) {
        alert('Please select a date and enter a title or content');
        return;
    }
    
    // Store both title and content in new format, backward compatible
    appData.diaryData[date] = {
        title: title || '',
        content: content || '',
        timestamp: new Date().toISOString()
    };
    
    await saveData();
    showSaveStatus('Saved!');
    updateDiaryDisplay();
    updateWordCount();
}

function loadDiaryEntry() {
    const dateInput = document.getElementById('diary-date');
    const titleInput = document.getElementById('diary-title');
    const contentInput = document.getElementById('diary-content');
    
    const date = dateInput.value;
    const diaryData = getDiaryData();
    const entry = diaryData[date];
    
    // Handle both old format (string) and new format (object)
    if (entry) {
        if (typeof entry === 'string') {
            // Old format - content only
            titleInput.value = '';
            contentInput.textContent = entry;
        } else {
            // New format - title and content
            titleInput.value = entry.title || '';
            contentInput.textContent = entry.content || '';
        }
    } else {
        titleInput.value = '';
        contentInput.textContent = '';
    }
    
    updateDiaryTitle();
    updateWordCount();
}

function getDiaryData() {
    return appData.diaryData;
}

function updateDiaryDisplay() {
    debugDiaryState('START of updateDiaryDisplay');
    
    const diaryData = getDiaryData();
    const dates = Object.keys(diaryData).sort().reverse();
    const entriesList = document.getElementById('entries-list');
    
    const recentEntries = dates.slice(0, 5);
    entriesList.innerHTML = recentEntries.map(date => {
        const displayDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const entry = diaryData[date];
        
        let title, preview;
        if (typeof entry === 'string') {
            // Old format
            title = '';
            preview = entry.substring(0, 80) + (entry.length > 80 ? '...' : '');
        } else if (entry && typeof entry === 'object') {
            // New format
            title = entry.title || 'Untitled';
            preview = entry.content ? entry.content.substring(0, 60) + (entry.content.length > 60 ? '...' : '') : '';
        } else {
            // Fallback
            title = 'Unknown';
            preview = 'Unable to load entry';
        }
        
        return `<div class="entry-item" onclick="loadSpecificEntry('${date}')">
            <div class="entry-date">${displayDate}</div>
            <div class="entry-title">${title}</div>
            <div class="entry-preview">${preview}</div>
        </div>`;
    }).join('');
}

function loadSpecificEntry(date) {
    document.getElementById('diary-date').value = date;
    loadDiaryEntry();
}

// Modern diary utility functions
function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('diary-content').focus();
}

function updateWordCount() {
    const content = document.getElementById('diary-content').textContent || '';
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    document.getElementById('word-count').textContent = `${words} word${words !== 1 ? 's' : ''}`;
}

function showSaveStatus(message) {
    const statusElement = document.getElementById('save-status');
    statusElement.textContent = message;
    statusElement.classList.add('visible');
    
    setTimeout(() => {
        statusElement.classList.remove('visible');
    }, 2000);
}

function showFormattingToolbar() {
    const toolbar = document.getElementById('formatting-toolbar');
    toolbar.style.display = 'flex';
}

function hideFormattingToolbar() {
    const toolbar = document.getElementById('formatting-toolbar');
    toolbar.style.display = 'none';
}

// Dashboard Overview Functions
function updateOverview() {
    const weightData = getWeightData();
    const calorieData = getCalorieData();
    const diaryData = getDiaryData();
    
    // Total weight change
    const weightDates = Object.keys(weightData).sort();
    if (weightDates.length > 1) {
        const totalChange = weightData[weightDates[weightDates.length - 1]] - weightData[weightDates[0]];
        document.getElementById('total-weight-change').textContent = totalChange > 0 ? `+${totalChange.toFixed(1)}` : totalChange.toFixed(1);
    } else {
        document.getElementById('total-weight-change').textContent = '--';
    }
    
    // Average daily deficit
    const calorieDates = Object.keys(calorieData);
    if (calorieDates.length > 0) {
        const totalDeficit = calorieDates.reduce((sum, date) => {
            const { goal, consumed } = calorieData[date];
            return sum + (goal - consumed);
        }, 0);
        const avgDeficit = totalDeficit / calorieDates.length;
        document.getElementById('avg-deficit').textContent = avgDeficit.toFixed(0);
    } else {
        document.getElementById('avg-deficit').textContent = '--';
    }
    
    // Total diary entries
    document.getElementById('total-entries').textContent = Object.keys(diaryData).length;
}

// Data persistence functions
async function loadData() {
    try {
        const data = await githubAuth.loadData();
        
        // Ensure all data structures exist
        appData = {
            weightData: data.weightData || {},
            calorieData: data.calorieData || {},
            diaryData: data.diaryData || {},
            lastUpdated: data.lastUpdated || new Date().toISOString()
        };
        
        debugDiaryState('AFTER loadData()');
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load data from GitHub');
    }
}

async function saveData() {
    try {
        // Update timestamp before saving
        appData.lastUpdated = new Date().toISOString();
        await githubAuth.saveData(appData);
    } catch (error) {
        console.error('Error saving data:', error);
        showError('Failed to save data to GitHub');
    }
}

// Load dashboard data
async function loadDashboard() {
    // Ensure data is loaded before updating dashboard
    if (!appData.lastUpdated) {
        await loadData();
    }
    
    updateWeightDisplay();
    updateCalorieDisplay();
    
    debugDiaryState('BEFORE updateDiaryDisplay in loadDashboard');
    updateDiaryDisplay();
    updateOverview();
    loadDiaryEntry();
}