// Personal Dashboard JavaScript

// Global data cache
let appData = {
    weightData: {},
    calorieData: {},
    diaryData: {},
    lastUpdated: null
};

// Initialize app on load
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    updateCurrentDate();
    setTodayDate();
    
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

function showLogin() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('user-info').style.display = 'none';
}

async function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('user-info').style.display = 'block';
    
    // Load user info
    const user = await githubAuth.getCurrentUser();
    if (user) {
        document.getElementById('user-name').textContent = user.login;
    }
    
    // Load data and dashboard
    await loadData();
    loadDashboard();
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
    const contentInput = document.getElementById('diary-content');
    
    const date = dateInput.value;
    const content = contentInput.value.trim();
    
    if (!date || !content) {
        alert('Please select a date and enter some content');
        return;
    }
    
    appData.diaryData[date] = content;
    
    await saveData();
    
    contentInput.value = '';
    updateDiaryDisplay();
}

function loadDiaryEntry() {
    const dateInput = document.getElementById('diary-date');
    const contentInput = document.getElementById('diary-content');
    
    const date = dateInput.value;
    const diaryData = getDiaryData();
    
    contentInput.value = diaryData[date] || '';
}

function getDiaryData() {
    return appData.diaryData;
}

function updateDiaryDisplay() {
    const diaryData = getDiaryData();
    const dates = Object.keys(diaryData).sort().reverse();
    const entriesList = document.getElementById('entries-list');
    
    const recentEntries = dates.slice(0, 5);
    entriesList.innerHTML = recentEntries.map(date => {
        const displayDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const preview = diaryData[date].substring(0, 100) + (diaryData[date].length > 100 ? '...' : '');
        return `<div class="entry-item" onclick="loadSpecificEntry('${date}')">${displayDate}: ${preview}</div>`;
    }).join('');
}

function loadSpecificEntry(date) {
    document.getElementById('diary-date').value = date;
    loadDiaryEntry();
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
        appData = data;
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load data from GitHub');
    }
}

async function saveData() {
    try {
        await githubAuth.saveData(appData);
    } catch (error) {
        console.error('Error saving data:', error);
        showError('Failed to save data to GitHub');
    }
}

// Load dashboard data
function loadDashboard() {
    updateWeightDisplay();
    updateCalorieDisplay();
    updateDiaryDisplay();
    updateOverview();
    loadDiaryEntry();
}