// Global variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let entries = [];
let currentPage = 1;
let totalPages = 1;

// API Base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    document.getElementById('date').valueAsDate = new Date();
    
    // Check authentication status
    if (authToken) {
        checkAuthStatus();
    } else {
        showAuthModal();
    }
    
    // Set up event listeners
    setupEventListeners();
});

// Authentication Functions
function showAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

function hideAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
}

function switchTab(tab, clickedButton) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    
    // Show/hide forms
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
}

async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.data.user;
            hideAuthModal();
            updateUserInfo();
            loadDashboard();
        } else {
            localStorage.removeItem('authToken');
            authToken = null;
            showAuthModal();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showAuthModal();
    }
}

async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.data.token;
            currentUser = data.data.user;
            localStorage.setItem('authToken', authToken);
            hideAuthModal();
            updateUserInfo();
            loadDashboard();
            clearAuthForms();
        } else {
            errorDiv.textContent = data.message || 'Login failed';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Network error. Please try again.';
    }
}

async function register(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const firstName = document.getElementById('registerFirstName').value;
    const lastName = document.getElementById('registerLastName').value;
    const errorDiv = document.getElementById('registerError');
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, firstName, lastName })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.data.token;
            currentUser = data.data.user;
            localStorage.setItem('authToken', authToken);
            hideAuthModal();
            updateUserInfo();
            loadDashboard();
            clearAuthForms();
        } else {
            errorDiv.textContent = data.message || 'Registration failed';
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorDiv.textContent = 'Network error. Please try again.';
    }
}

function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    entries = [];
    showAuthModal();
    clearAuthForms();
}

function clearAuthForms() {
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    document.getElementById('loginError').textContent = '';
    document.getElementById('registerError').textContent = '';
}

function updateUserInfo() {
    const userNameElement = document.getElementById('userName');
    if (currentUser) {
        const displayName = currentUser.profile?.firstName || currentUser.username;
        userNameElement.textContent = `Welcome, ${displayName}`;
    }
}

// Navigation Functions
function showSection(sectionId, clickedButton) {
    // Hide all sections
    document.querySelectorAll('.app-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Add active class to clicked button
    clickedButton.classList.add('active');
    
    // Load section-specific data
    switch(sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'history':
            loadHistory();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'achievements':
            loadAchievements();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

// Dashboard Functions
async function loadDashboard() {
    try {
        const [statsResponse, recentResponse] = await Promise.all([
            fetch(`${API_BASE}/entries/stats/summary`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`${API_BASE}/entries?limit=5`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
        ]);
        
        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            updateDashboardStats(statsData.data);
        }
        
        if (recentResponse.ok) {
            const recentData = await recentResponse.json();
            updateRecentActivity(recentData.data.entries);
        }
        
        updateCalendar();
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

function updateDashboardStats(data) {
    document.getElementById('totalDays').textContent = data.uniqueDays || 0;
    document.getElementById('totalHours').textContent = (data.totalHours || 0).toFixed(1);
    document.getElementById('avgHours').textContent = data.uniqueDays > 0 ? (data.totalHours / data.uniqueDays).toFixed(1) : '0.0';
    document.getElementById('streak').textContent = data.currentStreak || 0;
    
    // Update goal progress
    const dailyGoal = currentUser?.preferences?.goalHoursPerDay || 2;
    const todayHours = data.todayHours || 0;
    const progressPercent = Math.min((todayHours / dailyGoal) * 100, 100);
    
    document.getElementById('dailyGoal').textContent = `${dailyGoal}h`;
    document.getElementById('goalProgress').style.width = `${progressPercent}%`;
}

function updateRecentActivity(entries) {
    const recentActivityDiv = document.getElementById('recentActivity');
    
    if (entries.length === 0) {
        recentActivityDiv.innerHTML = '<p>No recent activity. Start logging your sessions!</p>';
        return;
    }
    
    const activityHTML = entries.map(entry => `
        <div class="activity-item">
            <div class="activity-header">
                <span class="activity-type">${entry.activityDisplay}</span>
                <span class="activity-time">${entry.formattedTime}</span>
            </div>
            <div class="activity-date">${new Date(entry.date).toLocaleDateString()}</div>
            ${entry.notes ? `<div class="activity-notes">${entry.notes}</div>` : ''}
        </div>
    `).join('');
    
    recentActivityDiv.innerHTML = activityHTML;
}

// Entry Functions
async function addEntry(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const entryData = {
        date: formData.get('date'),
        activity: formData.get('activity'),
        hours: parseFloat(formData.get('hours')) || 0,
        minutes: parseInt(formData.get('minutes')) || 0,
        notes: formData.get('notes'),
        project: formData.get('project'),
        mood: formData.get('mood'),
        productivity: parseInt(formData.get('productivity')) || 5,
        location: formData.get('location'),
        tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : []
    };
    
    if (!entryData.date || !entryData.activity || (entryData.hours === 0 && entryData.minutes === 0)) {
        alert('Please fill in all required fields!');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/entries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(entryData)
        });
        
        if (response.ok) {
            const data = await response.json();
            alert('Entry added successfully!');
            event.target.reset();
            document.getElementById('date').valueAsDate = new Date();
            loadDashboard();
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Failed to add entry');
        }
    } catch (error) {
        console.error('Add entry error:', error);
        alert('Network error. Please try again.');
    }
}

// History Functions
async function loadHistory(page = 1) {
    try {
        const activityFilter = document.getElementById('activityFilter').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        let url = `${API_BASE}/entries?page=${page}&limit=10`;
        if (activityFilter) url += `&activity=${activityFilter}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            entries = data.data.entries;
            currentPage = data.data.pagination.page;
            totalPages = data.data.pagination.pages;
            
            updateHistoryDisplay();
            updatePagination();
        }
    } catch (error) {
        console.error('History load error:', error);
    }
}

function updateHistoryDisplay() {
    const historyDiv = document.getElementById('history');
    
    if (entries.length === 0) {
        historyDiv.innerHTML = '<p>No entries found. Start logging your sessions!</p>';
        return;
    }
    
    const historyHTML = entries.map(entry => `
        <div class="history-item">
            <div class="history-date">${new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div class="history-details">
                <div class="detail-item">
                    <div class="detail-label">Activity</div>
                    <div class="detail-value">${entry.activityDisplay}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Time</div>
                    <div class="detail-value">${entry.formattedTime}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Productivity</div>
                    <div class="detail-value">${entry.productivity}/10</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Mood</div>
                    <div class="detail-value">${entry.mood}</div>
                </div>
            </div>
            ${entry.notes ? `<div class="history-notes">${entry.notes}</div>` : ''}
            ${entry.project ? `<div class="history-project">Project: ${entry.project}</div>` : ''}
            <button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button>
        </div>
    `).join('');
    
    historyDiv.innerHTML = historyHTML;
}

function updatePagination() {
    const paginationDiv = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button onclick="loadHistory(${currentPage - 1})">Previous</button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="active">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="loadHistory(${i})">${i}</button>`;
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="loadHistory(${currentPage + 1})">Next</button>`;
    }
    
    paginationDiv.innerHTML = paginationHTML;
}

async function deleteEntry(entryId) {
    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/entries/${entryId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            alert('Entry deleted successfully!');
            loadHistory(currentPage);
            loadDashboard();
        } else {
            alert('Failed to delete entry');
        }
    } catch (error) {
        console.error('Delete entry error:', error);
        alert('Network error. Please try again.');
    }
}

function filterHistory() {
    loadHistory(1);
}

// Analytics Functions
async function loadAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/users/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateAnalytics(data.data.stats);
        }
    } catch (error) {
        console.error('Analytics load error:', error);
    }
}

function updateAnalytics(stats) {
    // Activity distribution chart
    const activityChart = document.getElementById('activityChart');
    if (stats.activityDistribution) {
        const activityHTML = Object.entries(stats.activityDistribution)
            .map(([activity, count]) => `
                <div class="chart-item">
                    <span>${activity}</span>
                    <div class="chart-bar">
                        <div class="chart-fill" style="width: ${(count / stats.totalEntries * 100)}%"></div>
                    </div>
                    <span>${count}</span>
                </div>
            `).join('');
        activityChart.innerHTML = activityHTML;
    }
    
    // Mood distribution chart
    const moodChart = document.getElementById('moodChart');
    if (stats.moodDistribution) {
        const moodHTML = Object.entries(stats.moodDistribution)
            .map(([mood, count]) => `
                <div class="chart-item">
                    <span>${mood}</span>
                    <div class="chart-bar">
                        <div class="chart-fill" style="width: ${(count / stats.totalEntries * 100)}%"></div>
                    </div>
                    <span>${count}</span>
                </div>
            `).join('');
        moodChart.innerHTML = moodHTML;
    }
    
    // Productivity chart
    const productivityChart = document.getElementById('productivityChart');
    productivityChart.innerHTML = `<div class="chart-item">
        <span>Average Productivity</span>
        <div class="chart-bar">
            <div class="chart-fill" style="width: ${(stats.averageProductivity / 10 * 100)}%"></div>
        </div>
        <span>${stats.averageProductivity.toFixed(1)}/10</span>
    </div>`;
    
    // Time trends chart
    const timeChart = document.getElementById('timeChart');
    timeChart.innerHTML = `<div class="chart-item">
        <span>Average Hours/Day</span>
        <div class="chart-bar">
            <div class="chart-fill" style="width: ${Math.min((stats.averageHoursPerDay / 8) * 100, 100)}%"></div>
        </div>
        <span>${stats.averageHoursPerDay.toFixed(1)}h</span>
    </div>`;
}

// Achievements Functions
async function loadAchievements() {
    try {
        const response = await fetch(`${API_BASE}/users/achievements`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateAchievements(data.data.achievements);
        }
    } catch (error) {
        console.error('Achievements load error:', error);
    }
}

function updateAchievements(achievements) {
    const achievementsGrid = document.getElementById('achievementsGrid');
    
    if (achievements.length === 0) {
        achievementsGrid.innerHTML = '<p>No achievements yet. Keep working to unlock them!</p>';
        return;
    }
    
    const achievementsHTML = achievements.map(achievement => `
        <div class="achievement-card">
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-title">${achievement.title}</div>
            <div class="achievement-description">${achievement.description}</div>
        </div>
    `).join('');
    
    achievementsGrid.innerHTML = achievementsHTML;
}

// Profile Functions
async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const user = data.data.user;
            
            // Populate profile form
            document.getElementById('profileFirstName').value = user.profile?.firstName || '';
            document.getElementById('profileLastName').value = user.profile?.lastName || '';
            document.getElementById('profileBio').value = user.profile?.bio || '';
            
            // Populate preferences form
            document.getElementById('defaultActivity').value = user.preferences?.defaultActivity || 'coding';
            document.getElementById('goalHoursPerDay').value = user.preferences?.goalHoursPerDay || 2;
            document.getElementById('emailNotifications').checked = user.preferences?.notifications?.email || false;
            document.getElementById('browserNotifications').checked = user.preferences?.notifications?.browser || false;
        }
    } catch (error) {
        console.error('Profile load error:', error);
    }
}

async function updateProfile(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const profileData = {
        firstName: formData.get('profileFirstName'),
        lastName: formData.get('profileLastName'),
        bio: formData.get('profileBio')
    };
    
    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(profileData)
        });
        
        if (response.ok) {
            alert('Profile updated successfully!');
            loadProfile();
        } else {
            alert('Failed to update profile');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        alert('Network error. Please try again.');
    }
}

async function updatePreferences(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const preferencesData = {
        defaultActivity: formData.get('defaultActivity'),
        goalHoursPerDay: parseFloat(formData.get('goalHoursPerDay')),
        notifications: {
            email: formData.get('emailNotifications') === 'on',
            browser: formData.get('browserNotifications') === 'on'
        }
    };
    
    try {
        const response = await fetch(`${API_BASE}/auth/preferences`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(preferencesData)
        });
        
        if (response.ok) {
            alert('Preferences updated successfully!');
            loadProfile();
        } else {
            alert('Failed to update preferences');
        }
    } catch (error) {
        console.error('Preferences update error:', error);
        alert('Network error. Please try again.');
    }
}

// Calendar Functions
function updateCalendar() {
    const calendarDiv = document.getElementById('calendar');
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const daysInMonth = endOfMonth.getDate();
    const firstDayOfWeek = startOfMonth.getDay();
    
    // Get entry dates for the current month
    const entryDates = new Set(entries.map(e => e.date.split('T')[0]));
    
    let calendarHTML = '';
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
        calendarHTML += '<div class="calendar-day"></div>';
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasData = entryDates.has(dateStr);
        calendarHTML += `<div class="calendar-day ${hasData ? 'has-data' : ''}">${day}</div>`;
    }
    
    calendarDiv.innerHTML = calendarHTML;
}

// Event Listeners
function setupEventListeners() {
    // Auth forms
    document.getElementById('loginForm').addEventListener('submit', login);
    document.getElementById('registerForm').addEventListener('submit', register);
    
    // Entry form
    document.getElementById('entryForm').addEventListener('submit', addEntry);
    
    // Profile forms
    document.getElementById('profileForm').addEventListener('submit', updateProfile);
    document.getElementById('preferencesForm').addEventListener('submit', updatePreferences);
    
    // Auth tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab, this);
        });
    });
    
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section, this);
        });
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Chart styles
const chartStyles = `
<style>
.chart-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.chart-bar {
    flex: 1;
    height: 20px;
    background: #e1e8ed;
    border-radius: 10px;
    overflow: hidden;
}

.chart-fill {
    height: 100%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    transition: width 0.3s ease;
}

.activity-item {
    background: white;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
}

.activity-type {
    font-weight: bold;
    color: #667eea;
}

.activity-time {
    color: #666;
    font-size: 0.9em;
}

.activity-date {
    color: #999;
    font-size: 0.8em;
    margin-bottom: 5px;
}

.activity-notes {
    font-style: italic;
    color: #666;
    font-size: 0.9em;
}

.history-project {
    background: #e8f4f8;
    padding: 8px;
    border-radius: 5px;
    margin-top: 10px;
    font-size: 0.9em;
    color: #2c3e50;
}
</style>
`;

// Inject chart styles
document.head.insertAdjacentHTML('beforeend', chartStyles);