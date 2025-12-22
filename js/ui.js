function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        return;
    }
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 4000);
}

function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('active');
    }
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('active');
    }
}

function switchAuthTab(tab) {
    const loginTab = document.getElementById('login-tab') || document.querySelector('.auth-tab[data-tab="login"]');
    const registerTab = document.getElementById('register-tab') || document.querySelector('.auth-tab[data-tab="register"]');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    if (tab === 'login') {
        loginTab?.classList.add('active');
        registerTab?.classList.remove('active');
        loginForm?.classList.remove('hidden');
        registerForm?.classList.add('hidden');
    } else {
        loginTab?.classList.remove('active');
        registerTab?.classList.add('active');
        loginForm?.classList.add('hidden');
        registerForm?.classList.remove('hidden');
    }
    tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
}

function updateAccountPage() {
    if (!appState.user) return;
    
    const elements = {
        username: document.getElementById('account-username') || document.getElementById('username-display'),
        email: document.getElementById('account-email'),
        balance: document.getElementById('account-balance') || document.getElementById('balance-display'),
        rating: document.getElementById('account-rating'),
        level: document.getElementById('account-level'),
        reports: document.getElementById('user-reports'),
        earned: document.getElementById('user-earned'),
        donated: document.getElementById('user-donated')
    };
    
    if (elements.username) elements.username.textContent = appState.user.username || 'Пользователь';
    if (elements.email) elements.email.textContent = appState.user.email || '';
    if (elements.balance) elements.balance.textContent = appState.user.balance || 0;
    if (elements.rating) elements.rating.textContent = appState.user.volunteer_rating || 0;
    if (elements.level) elements.level.textContent = appState.user.volunteer_level || 'Новичок';
    if (elements.reports) elements.reports.textContent = appState.user.reports_count || 0;
    if (elements.earned) elements.earned.textContent = appState.user.earned || appState.user.balance || 0;
    if (elements.donated) elements.donated.textContent = appState.user.donated || 0;
}

function previewPhoto(input) {
    const file = input.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('photo-preview');
        if (preview) {
            preview.innerHTML = `<img src="${e.target.result}" alt="preview">`;
        }
    };
    reader.readAsDataURL(file);
}

function useCurrentLocation(callback) {
    if (!navigator.geolocation) {
        showNotification('Геолокация не поддерживается', 'error');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const locationInput = document.getElementById('report-location');
            const latInput = document.getElementById('report-lat');
            const lngInput = document.getElementById('report-lng');
            
            if (locationInput) {
                locationInput.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            }
            if (latInput) latInput.value = latitude;
            if (lngInput) lngInput.value = longitude;
            
            showNotification('Локация определена', 'success');
            if (callback) callback(latitude, longitude);
        },
        (error) => {
            console.error('Ошибка геолокации:', error);
            showNotification('Не удалось определить локацию', 'error');
        }
    );
}

function getTypeLabel(type) {
    const types = {
        'garbage': 'Мусор',
        'illegal-dump': 'Свалка',
        'pollution': 'Загрязнение',
        'fire-hazard': 'Пожарная опасность',
        'deforestation': 'Вырубка',
        'water': 'Загрязнение воды',
        'waste': 'Отходы',
        'other': 'Другое'
    };
    return types[type] || types[type?.toLowerCase?.()] || type || 'Неизвестно';
}

function getUrgencyLabel(urgency) {
    const levels = {
        'low': 'Низкая',
        'medium': 'Средняя',
        'high': 'Высокая',
        'critical': 'Критичная'
    };
    return levels[urgency] || urgency;
}

function getDifficultyLabel(difficulty) {
    const levels = {
        'easy': 'Лёгкая',
        'medium': 'Средняя',
        'hard': 'Сложная'
    };
    return levels[difficulty] || difficulty;
}

function getRewardPoints(urgency) {
    const rewards = { 'low': 10, 'medium': 25, 'high': 50, 'critical': 75 };
    return rewards[urgency] || 10;
}

function getVolunteerLevel(completedCount) {
    if (completedCount >= 25) return 'Легенда';
    if (completedCount >= 10) return 'Эко-герой';
    if (completedCount >= 5) return 'Волонтёр';
    if (completedCount >= 1) return 'Начинающий';
    return 'Новичок';
}

console.log('UI загружен');
