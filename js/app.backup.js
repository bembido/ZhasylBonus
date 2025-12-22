// ===== СОСТОЯНИЕ ПРИЛОЖЕНИЯ =====
const appState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    reports: JSON.parse(localStorage.getItem('reports')) || [],
    users: JSON.parse(localStorage.getItem('users')) || [],
    currentFilter: 'all',
    map: null,
    markers: [],
    missions: [
        {
            id: 1,
            title: 'Посади 5 деревьев',
            description: 'Помогите восстановлению лесов, посадив минимум 5 деревьев в вашем районе и задокументировав процесс.',
            difficulty: 'easy',
            reward: 50,
            certificate: 'tree-planter',
            duration: '2 недели',
            participants: 234,
            image: '🌱',
            checklist: ['Подготовить место', 'Купить саженцы', 'Посадить деревья', 'Задокументировать']
        },
        {
            id: 2,
            title: 'Очистка парка',
            description: 'Организуйте или участвуйте в очистке парка от мусора. Соберите минимум 20 кг отходов.',
            difficulty: 'medium',
            reward: 100,
            certificate: 'eco-cleaner',
            duration: '1 неделя',
            participants: 456,
            image: '🧹',
            checklist: ['Собрать команду', 'Собрать мусор', 'Правильно утилизировать', 'Сфотографировать результат']
        },
        {
            id: 3,
            title: 'Составь экомаршрут',
            description: 'Создайте маршрут для экотуризма в вашем регионе с информацией об экосистемах.',
            difficulty: 'hard',
            reward: 200,
            certificate: 'eco-guide',
            duration: '1 месяц',
            participants: 89,
            image: '🗺️',
            checklist: ['Исследовать местность', 'Определить точки интереса', 'Написать описания', 'Создать маршрут']
        },
        {
            id: 4,
            title: 'Обучи друзей',
            description: 'Проведите мастер-класс или лекцию о экологии для минимум 10 человек.',
            difficulty: 'medium',
            reward: 75,
            certificate: 'eco-educator',
            duration: '2 недели',
            participants: 178,
            image: '👨‍🏫',
            checklist: ['Подготовить материал', 'Пригласить участников', 'Провести занятие', 'Собрать отзывы']
        },
        {
            id: 5,
            title: 'Восстанови реку',
            description: 'Помогите очистить реку или озеро от загрязнений. Работа может быть в группе.',
            difficulty: 'hard',
            reward: 250,
            certificate: 'water-guardian',
            duration: '3 недели',
            participants: 67,
            image: '💧',
            checklist: ['Изучить загрязнение', 'Собрать оборудование', 'Провести очистку', 'Мониторить результаты']
        },
        {
            id: 6,
            title: 'Найди нелегальную свалку',
            description: 'Обнаружьте и задокументируйте нелегальную свалку, отправьте информацию властям.',
            difficulty: 'easy',
            reward: 80,
            certificate: 'waste-inspector',
            duration: '1 неделя',
            participants: 123,
            image: '🚨',
            checklist: ['Найти свалку', 'Задокументировать', 'Сообщить в органы', 'Отследить действия']
        }
    ],
    achievements: [
        { id: 1, name: 'Первый шаг', icon: '👣', desc: 'Завершить первую миссию', condition: m => m >= 1 },
        { id: 2, name: 'Волонтёр', icon: '💚', desc: 'Завершить 5 миссий', condition: m => m >= 5 },
        { id: 3, name: 'Эко-герой', icon: '🦸', desc: 'Завершить 10 миссий', condition: m => m >= 10 },
        { id: 4, name: 'Легенда', icon: '⭐', desc: 'Завершить 25 миссий', condition: m => m >= 25 },
        { id: 5, name: 'Командный игрок', icon: '👥', desc: 'Привлечь 5 волонтёров', condition: r => r >= 5 },
        { id: 6, name: 'Эколог', icon: '🌍', desc: 'Заработать 1000 баллов', condition: b => b >= 1000 }
    ],
    organizations: {
        'green-planet': { name: 'Зелёная планета', balance: 6500, target: 10000 },
        'clean-water': { name: 'Чистая вода', balance: 4500, target: 10000 },
        'climate': { name: 'Борьба с глобальным потеплением', balance: 8000, target: 10000 },
        'wildlife': { name: 'Защита дикой природы', balance: 5500, target: 10000 },
        'ecosystem': { name: 'Спасение экосистем', balance: 3500, target: 10000 },
        'young-eco': { name: 'Молодые экологи', balance: 7000, target: 10000 }
    }
};

const sb = window.supabase?.db;

// Проверка корректности Supabase
function checkSupabaseConnection() {
    if (!window.supabase || !window.supabase.db) {
        console.error('❌ Supabase не инициализирован! Проверьте подключение SDK.');
        return false;
    }
    return true;
}

// ============= АУТЕНТИФИКАЦИЯ =============

// Регистрация
async function supabaseRegister(email, password, username) {
    if (!checkSupabaseConnection()) {
        showNotification('❌ Ошибка подключения к серверу', 'error');
        return null;
    }
    
    try {
        console.log('📝 Регистрация нового пользователя:', email);
        
        if (password.length < 6) {
            throw new Error('Пароль должен быть минимум 6 символов');
        }
        
        // Регистрация с автоматическим входом (без подтверждения email)
        const { data: authData, error: authError } = await sb.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                }
            }
        });
        
        if (authError) {
            let errorMsg = authError.message;
            if (errorMsg.includes('Invalid API key')) {
                errorMsg = 'Неправильный API ключ Supabase. Проверьте настройки.';
            } else if (errorMsg.includes('User already registered')) {
                errorMsg = 'Пользователь с таким email уже существует';
            }
            throw new Error(errorMsg);
        }
        
        if (!authData.user) {
            throw new Error('Не удалось создать пользователя');
        }
        
        const userId = authData.user.id;
        console.log('✅ Пользователь создан:', userId);
        
        // Сохранить профиль в БД
        const { error: dbError } = await sb
            .from('users')
            .insert([{
                id: userId,
                email: email,
                username: username,
                balance: 100,
                volunteer_rating: 0,
                volunteer_level: 'Новичок'
            }]);
        
        if (dbError) throw new Error(dbError.message || 'Ошибка создания профиля');
        
        appState.user = {
            id: userId,
            email: email,
            username: username,
            balance: 100,
            volunteer_rating: 0,
            volunteer_level: 'Новичок'
        };
        
        localStorage.setItem('currentUserId', userId);
        
        // Автоматический вход после регистрации (если сессия есть)
        if (authData.session) {
            console.log('✅ Автоматический вход выполнен');
            showNotification('✅ Регистрация успешна! Вы вошли в систему.', 'success');
            updateAuthUI(true);
        } else {
            // Если email confirmation включен на сервере
            showNotification('✅ Регистрация успешна! Проверьте email.', 'success');
        }
        
        return userId;
    } catch (error) {
        console.error('❌ Ошибка регистрации:', error.message);
        showNotification('❌ ' + error.message, 'error');
        return null;
    }
}

// Вход
async function supabaseLogin(email, password) {
    if (!checkSupabaseConnection()) {
        showNotification('❌ Ошибка подключения к серверу', 'error');
        return null;
    }
    
    try {
        console.log('🔐 Попытка входа для:', email);
        const { data, error } = await sb.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            // Более понятные сообщения об ошибках
            let errorMsg = error.message;
            if (errorMsg.includes('Invalid API key')) {
                errorMsg = 'Неправильный API ключ Supabase. Проверьте настройки проекта.';
            } else if (errorMsg.includes('Invalid login credentials')) {
                errorMsg = 'Неправильный email или пароль';
            } else if (errorMsg.includes('Email not confirmed')) {
                errorMsg = 'Подтвердите email по ссылке в письме';
            }
            throw new Error(errorMsg);
        }
        
        const userId = data.user.id;
        console.log('✅ Пользователь авторизован:', userId);
        
        // Загрузить профиль из БД
        const { data: userData, error: userError } = await sb
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (userError) {
            console.log('ℹ️ Профиль не найден, создаём новый...');
            // Если профиля нет, создаём его
            const { error: insertError } = await sb
                .from('users')
                .insert([{
                    id: userId,
                    email: email,
                    username: email.split('@')[0],
                    balance: 100,
                    volunteer_rating: 0,
                    volunteer_level: 'Новичок'
                }]);
            
            if (insertError) throw insertError;
            appState.user = {
                id: userId,
                email: email,
                username: email.split('@')[0],
                balance: 100,
                volunteer_rating: 0,
                volunteer_level: 'Новичок'
            };
        } else {
            appState.user = userData;
        }
        
        localStorage.setItem('currentUserId', userId);
        showNotification('✅ Добро пожаловать!', 'success');
        return userId;
    } catch (error) {
        console.error('❌ Ошибка входа:', error.message);
        showNotification('❌ ' + error.message, 'error');
        return null;
    }
}

async function supabaseLogout() {
    try {
        await sb.auth.signOut();
        appState.user = null;
        localStorage.removeItem('currentUserId');
        showNotification('✅ Вы вышли из аккаунта', 'success');
        updateUI();
        // Перенаправить на главную
        window.location.href = '../index.html';
    } catch (error) {
        console.error('❌ Ошибка выхода:', error.message);
        showNotification('❌ Ошибка выхода', 'error');
    }
}

// Загрузить пользователя при запуске
async function loadUserFromSupabase() {
    try {
        const { data: { user } } = await sb.auth.getUser();
        
        if (!user) return;
        
        const { data, error } = await sb
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (error) throw error;
        
        appState.user = data;
        console.log('✅ Пользователь загружен');
        updateUI();
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error.message);
    }
}

// ============= ОТЧЁТЫ =============

// Загрузить все отчёты
async function loadReportsFromSupabase() {
    try {
        const { data, error } = await sb
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        appState.reports = data || [];
        console.log('✅ Отчёты загружены:', appState.reports.length);
        updateMapMarkers();
    } catch (error) {
        console.error('❌ Ошибка загрузки отчётов:', error.message);
    }
}

// Добавить новый отчёт
async function addReportToSupabase(reportData) {
    if (!appState.user) {
        alert('❌ Сначала войдите в аккаунт!');
        return;
    }
    
    try {
        const { data, error } = await sb
            .from('reports')
            .insert([{
                user_id: appState.user.id,
                title: reportData.title,
                description: reportData.description,
                problem_type: reportData.problemType,
                latitude: reportData.latitude,
                longitude: reportData.longitude,
                photo_url: reportData.photoURL,
                severity: reportData.severity
            }])
            .select();
        
        if (error) throw error;
        
        // Бонус за отчёт
        appState.user.balance += 10;
        await updateUserInSupabase();
        
        console.log('✅ Отчёт добавлен');
        alert('✅ Отчёт успешно отправлен! +10 баллов');
    } catch (error) {
        console.error('❌ Ошибка добавления отчёта:', error.message);
        alert('❌ ' + error.message);
    }
}

// ============= ФОТО (Storage) =============

// Загрузить фото в Storage
async function uploadPhotoToSupabase(file) {
    if (!appState.user) return null;
    
    try {
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await sb.storage
            .from('reports')
            .upload(fileName, file);
        
        if (error) throw error;
        
        // Получить публичный URL
        const { data: publicData } = sb.storage
            .from('reports')
            .getPublicUrl(fileName);
        
        console.log('✅ Фото загружено:', publicData.publicUrl);
        return publicData.publicUrl;
    } catch (error) {
        console.error('❌ Ошибка загрузки фото:', error.message);
        return null;
    }
}

// ============= ВОЛОНТЁРСКИЕ МИССИИ =============

// Завершить миссию
async function completeMissionInSupabase(missionId) {
    if (!appState.user) return;
    
    try {
        // Добавить в завершённые миссии
        const { error: missionError } = await sb
            .from('completed_missions')
            .insert([{
                user_id: appState.user.id,
                mission_id: missionId
            }]);
        
        if (missionError) throw missionError;
        
        // Добавить сертификат
        const mission = appState.missions.find(m => m.id === missionId);
        const { error: certError } = await sb
            .from('certificates')
            .insert([{
                user_id: appState.user.id,
                mission_title: mission.title,
                certificate_type: mission.certificate
            }]);
        
        if (certError) throw certError;
        
        // Обновить баланс и рейтинг
        appState.user.balance += mission.reward;
        appState.user.volunteer_rating += 10;
        
        await updateUserInSupabase();
        
        console.log('✅ Миссия завершена');
        alert(`✅ Миссия выполнена! +${mission.reward} баллов`);
    } catch (error) {
        console.error('❌ Ошибка завершения миссии:', error.message);
        alert('❌ ' + error.message);
    }
}

// ============= ОБЩИЕ ФУНКЦИИ =============

// Обновить данные пользователя
async function updateUserInSupabase() {
    if (!appState.user) return;
    
    try {
        const { error } = await sb
            .from('users')
            .update({
                balance: appState.user.balance,
                volunteer_rating: appState.user.volunteer_rating,
                volunteer_level: appState.user.volunteer_level
            })
            .eq('id', appState.user.id);
        
        if (error) throw error;
        console.log('✅ Данные обновлены в Supabase');
    } catch (error) {
        console.error('❌ Ошибка обновления:', error.message);
    }
}

// Real-time слушатель отчётов
function setupReportsListener() {
    sb.from('reports')
        .on('*', payload => {
            console.log('🔄 Новый отчёт:', payload);
            loadReportsFromSupabase();
        })
        .subscribe();
}

// Проверить сессию при загрузке
(async () => {
    await loadUserFromSupabase();
    setupReportsListener();
})();

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    updateUI();
});

function initializeApp() {
    // Инициализация карты если на странице есть элемент map
    initMap();
}

// Инициализация карты Leaflet
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return; // Если карты нет на странице - выходим
    
    if (!appState.map) {
        try {
            appState.map = L.map('map').setView([48.0196, 66.9237], 5); // Центр Казахстана
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(appState.map);
            
            // Добавляем стилизованный tile layer
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(appState.map);
            
            console.log('✅ Карта инициализирована');
        } catch (e) {
            console.error('❌ Ошибка инициализации карты:', e);
        }
    }
}

// Обновление маркеров на карте
function updateMapMarkers() {
    if (!appState.map) return;
    
    // Очищаем старые маркеры
    appState.markers.forEach(marker => {
        appState.map.removeLayer(marker);
    });
    appState.markers = [];
    
    // Добавляем новые
    appState.reports.forEach(report => {
        if (report.latitude && report.longitude) {
            const marker = L.marker([report.latitude, report.longitude])
                .addTo(appState.map)
                .bindPopup(`
                    <div style="min-width: 200px;">
                        <h4 style="margin: 0 0 8px 0; color: #10b981;">${report.title}</h4>
                        <p style="margin: 4px 0; color: #666;">${report.description || ''}</p>
                        <small style="color: #999;">${new Date(report.created_at).toLocaleDateString('ru-RU')}</small>
                    </div>
                `);
            appState.markers.push(marker);
        }
    });
}

function setupEventListeners() {
    // Навигация
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => navigateTo(e.target.dataset.page));
    });

    // Mobile nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const mainNav = document.getElementById('main-nav');
    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            const expanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', (!expanded).toString());
            mainNav.classList.toggle('open');
        });

        // Close nav on link click (mobile)
        mainNav.querySelectorAll('.nav-btn').forEach(link => {
            link.addEventListener('click', () => {
                if (mainNav.classList.contains('open')) {
                    mainNav.classList.remove('open');
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    // Кнопки на главной
    document.getElementById('start-report-btn').addEventListener('click', () => navigateTo('report'));
    document.getElementById('view-map-btn').addEventListener('click', () => navigateTo('map'));

    // Авторизация
    document.getElementById('login-toggle').addEventListener('click', openAuthModal);
    document.querySelector('.close').addEventListener('click', closeAuthModal);
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchAuthTab);
    });
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);

    // Форма отчёта
    document.getElementById('report-form').addEventListener('submit', submitReport);
    document.getElementById('report-photo').addEventListener('change', previewPhoto);
    document.getElementById('use-location-btn').addEventListener('click', useCurrentLocation);

    // Фильтры карты
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => filterReports(e.target.dataset.filter));
    });

    // Боксы с наградами
    document.querySelectorAll('.reward-btn').forEach(btn => {
        btn.addEventListener('click', claimReward);
    });

    // Пожертвования
    document.querySelectorAll('.donate-org-btn').forEach(btn => {
        btn.addEventListener('click', donateToOrg);
    });

    // Волонтёры
    document.querySelectorAll('.mission-filter').forEach(btn => {
        btn.addEventListener('click', (e) => filterMissions(e.target.dataset.difficulty));
    });

    // Модальное окно миссии
    const missionModal = document.getElementById('mission-modal');
    const missionClose = missionModal.querySelector('.close');
    missionClose.addEventListener('click', closeMissionModal);
    missionModal.addEventListener('click', (e) => {
        if (e.target === missionModal) closeMissionModal();
    });

    // Выход
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', supabaseLogout);
    }

    // Загрузка фото
    const fileUpload = document.querySelector('.file-upload');
    if (fileUpload) {
        fileUpload.addEventListener('click', () => {
            const photoInput = document.getElementById('report-photo');
            if (photoInput) photoInput.click();
        });
    }
}

// ===== НАВИГАЦИЯ =====
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(page + '-page').classList.add('active');
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    if (page === 'map') {
        setTimeout(() => appState.map.invalidateSize(), 100);
        renderReportsOnMap();
    } else if (page === 'volunteers') {
        if (!appState.user) {
            openAuthModal();
            return;
        }
        updateVolunteersPage();
    } else if (page === 'account') {
        if (!appState.user) {
            openAuthModal();
            return;
        }
        updateAccountPage();
    }
}

// ===== АВТОРИЗАЦИЯ =====
function openAuthModal() {
    document.getElementById('auth-modal').classList.remove('hidden');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.add('hidden');
}

function switchAuthTab(e) {
    const tab = e.target.dataset.tab;
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
    e.target.classList.add('active');
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const user = appState.users.find(u => u.email === email && u.password === password);
    
    if (user) {
        appState.user = user;
        localStorage.setItem('user', JSON.stringify(user));
        closeAuthModal();
        updateUI();
        showNotification('Успешный вход!', 'success');
        e.target.reset();
    } else {
        showNotification('Неправильный email или пароль', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    if (appState.users.find(u => u.email === email)) {
        showNotification('Пользователь с таким email уже существует', 'error');
        return;
    }

    const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        balance: 100, // Стартовый бонус
        reports: 0,
        earned: 100,
        donated: 0,
        rewards: [],
        transactions: [
            { date: new Date().toLocaleString('ru-RU'), desc: 'Регистрация', amount: 100, type: 'positive' }
        ],
        // Волонтёрская информация
        completedMissions: [],
        activeMissions: [],
        certificates: [],
        achievements: [],
        volunteerRating: 0,
        volunteerLevel: 'Новичок'
    };

    appState.users.push(newUser);
    localStorage.setItem('users', JSON.stringify(appState.users));
    
    appState.user = newUser;
    localStorage.setItem('user', JSON.stringify(newUser));
    
    closeAuthModal();
    updateUI();
    showNotification('Регистрация успешна! Вам начислено 100 стартовых баллов', 'success');
    e.target.reset();
}

function logout() {
    appState.user = null;
    localStorage.removeItem('user');
    updateUI();
    navigateTo('home');
    showNotification('Вы вышли из аккаунта', 'success');
}

// ===== ОТЧЁТЫ =====
function previewPhoto(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = document.getElementById('photo-preview');
            preview.innerHTML = `<img src="${event.target.result}" alt="preview">`;
        };
        reader.readAsDataURL(file);
    }
}

function useCurrentLocation(e) {
    e.preventDefault();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            document.getElementById('report-location').value = `${latitude}, ${longitude}`;
            
            // Показываем карту с локацией
            const locMap = document.getElementById('location-map');
            locMap.classList.add('active');
            
            if (!window.locMapInstance) {
                window.locMapInstance = L.map('location-map').setView([latitude, longitude], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.locMapInstance);
            } else {
                window.locMapInstance.setView([latitude, longitude], 15);
            }
            
            L.circleMarker([latitude, longitude], { color: 'red', radius: 10 }).addTo(window.locMapInstance);
            showNotification('Локация установлена!', 'success');
        });
    } else {
        showNotification('Геолокация не поддерживается вашим браузером', 'error');
    }
}

function submitReport(e) {
    e.preventDefault();

    if (!appState.user) {
        openAuthModal();
        return;
    }

    const report = {
        id: Date.now(),
        userId: appState.user.id,
        username: appState.user.name,
        title: document.getElementById('report-title').value,
        type: document.getElementById('report-type').value,
        description: document.getElementById('report-description').value,
        location: document.getElementById('report-location').value,
        photo: document.getElementById('photo-preview').querySelector('img')?.src || null,
        urgency: document.getElementById('report-urgency').value,
        date: new Date().toLocaleString('ru-RU'),
        timestamp: Date.now(),
        likes: 0,
        liked: false
    };

    // Парсим координаты
    const coords = report.location.split(',').map(c => parseFloat(c.trim()));
    if (coords.length === 2) {
        report.lat = coords[0];
        report.lng = coords[1];
    }

    appState.reports.push(report);
    localStorage.setItem('reports', JSON.stringify(appState.reports));

    // Начисляем баллы
    const reward = getRewardPoints(report.urgency);
    appState.user.balance += reward;
    appState.user.earned += reward;
    appState.user.reports += 1;
    appState.user.transactions.push({
        date: new Date().toLocaleString('ru-RU'),
        desc: `Отчёт: ${report.title}`,
        amount: reward,
        type: 'positive'
    });

    localStorage.setItem('user', JSON.stringify(appState.user));
    localStorage.setItem('reports', JSON.stringify(appState.reports));

    showNotification(`Отчёт отправлен! Вы заработали ${reward} эко-баллов!`, 'success');
    e.target.reset();
    document.getElementById('photo-preview').innerHTML = '';
    navigateTo('home');
    updateUI();
}

function getRewardPoints(urgency) {
    const rewards = {
        'low': 10,
        'medium': 20,
        'high': 50,
        'critical': 100
    };
    return rewards[urgency] || 20;
}

// ===== КАРТА =====
function renderReportsOnMap() {
    // Очищаем старые маркеры
    appState.markers.forEach(marker => appState.map.removeLayer(marker));
    appState.markers = [];

    const filteredReports = appState.currentFilter === 'all' 
        ? appState.reports 
        : appState.reports.filter(r => r.type === appState.currentFilter);

    filteredReports.forEach(report => {
        if (report.lat && report.lng) {
            const icons = {
                'pollution': '💨',
                'deforestation': '🌳',
                'water': '💧',
                'waste': '🗑️',
                'other': '❓'
            };

            const marker = L.marker([report.lat, report.lng], {
                icon: L.divIcon({
                    html: `<div style="font-size: 2rem; cursor: pointer;">${icons[report.type] || '📍'}</div>`,
                    iconSize: [40, 40]
                })
            }).addTo(appState.map);

            marker.bindPopup(`
                <div style="width: 250px;">
                    <h4>${report.title}</h4>
                    <p><strong>Тип:</strong> ${getTypeLabel(report.type)}</p>
                    <p><strong>Срочность:</strong> ${getUrgencyLabel(report.urgency)}</p>
                    <p><strong>Автор:</strong> ${report.username}</p>
                    <p><strong>Дата:</strong> ${report.date}</p>
                    ${report.photo ? `<img src="${report.photo}" style="width: 100%; margin: 10px 0; border-radius: 5px;">` : ''}
                    <p>${report.description}</p>
                </div>
            `);

            appState.markers.push(marker);
        }
    });

    updateReportDetails(filteredReports);
}

function filterReports(filter) {
    appState.currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    renderReportsOnMap();
}

function updateReportDetails(reports) {
    const container = document.getElementById('report-details');
    container.innerHTML = reports.length === 0 
        ? '<p style="text-align: center; color: #999;">Отчётов не найдено</p>'
        : reports.map(r => `
            <div class="report-item" onclick="appState.map.setView([${r.lat}, ${r.lng}], 16)">
                <div>
                    <strong>${r.title}</strong>
                    <div style="font-size: 0.9rem; color: #666;">${getUrgencyLabel(r.urgency)}</div>
                </div>
            </div>
        `).join('');
}

function getTypeLabel(type) {
    const labels = {
        'pollution': 'Загрязнение воздуха',
        'deforestation': 'Вырубка лесов',
        'water': 'Загрязнение воды',
        'waste': 'Отходы',
        'other': 'Другое'
    };
    return labels[type] || type;
}

function getUrgencyLabel(urgency) {
    const labels = {
        'low': 'Низкая',
        'medium': 'Средняя',
        'high': 'Высокая',
        'critical': '🔴 Критичная'
    };
    return labels[urgency] || urgency;
}

// ===== НАГРАДЫ И БОНУСЫ =====
function claimReward(e) {
    if (!appState.user) {
        openAuthModal();
        return;
    }

    const btn = e.target;
    const reward = btn.dataset.reward;
    const cost = parseInt(btn.dataset.cost);

    if (appState.user.balance < cost) {
        showNotification('Недостаточно баллов для получения награды', 'error');
        return;
    }

    appState.user.balance -= cost;
    appState.user.donated += cost;
    appState.user.rewards.push(reward);
    appState.user.transactions.push({
        date: new Date().toLocaleString('ru-RU'),
        desc: `Награда: ${btn.closest('.reward-card').querySelector('h4').textContent}`,
        amount: -cost,
        type: 'negative'
    });

    localStorage.setItem('user', JSON.stringify(appState.user));
    updateUI();
    showNotification('Награда получена! 🎉', 'success');
}

// ===== ПОЖЕРТВОВАНИЯ =====
function donateToOrg(e) {
    if (!appState.user) {
        openAuthModal();
        return;
    }

    const btn = e.target;
    const org = btn.dataset.org;
    const amount = parseInt(btn.closest('.donation-buttons').querySelector('.donation-input').value);

    if (!amount || amount <= 0) {
        showNotification('Введите количество баллов', 'error');
        return;
    }

    if (appState.user.balance < amount) {
        showNotification('Недостаточно баллов', 'error');
        return;
    }

    appState.user.balance -= amount;
    appState.user.donated += amount;
    appState.organizations[org].balance += amount;
    appState.user.transactions.push({
        date: new Date().toLocaleString('ru-RU'),
        desc: `Пожертвование: ${appState.organizations[org].name}`,
        amount: -amount,
        type: 'negative'
    });

    localStorage.setItem('user', JSON.stringify(appState.user));
    updateUI();
    
    // Обновляем прогресс на странице
    const orgCard = btn.closest('.org-card');
    const progressBar = orgCard.querySelector('.progress-fill');
    const orgBalance = appState.organizations[org].balance;
    const target = appState.organizations[org].target;
    const percentage = (orgBalance / target) * 100;
    progressBar.style.width = percentage + '%';
    orgCard.querySelector('.progress-text').textContent = `${orgBalance} / ${target} баллов`;

    showNotification(`Спасибо! Вы пожертвовали ${amount} баллов организации "${appState.organizations[org].name}"`, 'success');
    btn.closest('.donation-buttons').querySelector('.donation-input').value = '';
}

// ===== СТРАНИЦА СЧЁТА =====
function updateAccountPage() {
    if (!appState.user) return;

    document.getElementById('balance-display').textContent = appState.user.balance.toLocaleString('ru-RU');
    document.getElementById('user-reports').textContent = appState.user.reports;
    document.getElementById('user-earned').textContent = appState.user.earned;
    document.getElementById('user-donated').textContent = appState.user.donated;

    const transactionsList = document.getElementById('transactions-list');
    transactionsList.innerHTML = appState.user.transactions.length === 0
        ? '<p style="text-align: center; color: #999;">История транзакций пуста</p>'
        : appState.user.transactions.map(t => `
            <div class="transaction-item ${t.type}">
                <div>
                    <div class="transaction-desc">${t.desc}</div>
                    <div class="transaction-time">${t.date}</div>
                </div>
                <div class="transaction-amount">${t.type === 'positive' ? '+' : ''}${t.amount}</div>
            </div>
        `).join('');
}

// ===== ОБНОВЛЕНИЕ UI =====
function updateUI() {
    const usernameDisplay = document.getElementById('username-display');
    const loginBtn = document.getElementById('login-toggle');

    if (appState.user) {
        const displayName = appState.user.username || appState.user.email.split('@')[0];
        usernameDisplay.textContent = displayName;
        loginBtn.textContent = '👤 Профиль';
        loginBtn.onclick = () => window.location.href = 'pages/account.html';
    } else {
        usernameDisplay.textContent = '';
        loginBtn.textContent = 'Вход';
        loginBtn.onclick = openAuthModal;
    }

    // Обновляем статистику
    const reportsCount = document.getElementById('reports-count');
    const usersCount = document.getElementById('users-count');
    const donatedAmount = document.getElementById('donated-amount');
    
    if (reportsCount) reportsCount.textContent = appState.reports.length || 0;
    if (usersCount) usersCount.textContent = appState.users.length || 0;
    if (donatedAmount) {
        let totalDonated = 0;
        appState.users.forEach(u => {
            totalDonated += u.donated || 0;
        });
        donatedAmount.textContent = totalDonated.toLocaleString('ru-RU');
    }

    // Обновляем баланс
    const balanceDisplay = document.getElementById('balance-display');
    if (balanceDisplay && appState.user) {
        balanceDisplay.textContent = (appState.user.balance || 0).toLocaleString('ru-RU');
    }
}

// ===== МОДАЛЬНОЕ ОКНО =====
function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
}

// Обработка загруженного модального окна
(function() {
    const modal = document.getElementById('auth-modal');
    const closeBtn = modal ? modal.querySelector('.close') : null;
    const tabBtns = modal ? modal.querySelectorAll('.tab-btn') : [];
    const authTabs = modal ? modal.querySelectorAll('.auth-tab') : [];
    
    // Закрытие модала
    if (closeBtn) {
        closeBtn.onclick = closeAuthModal;
    }
    
    // Переключение табов
    tabBtns.forEach(btn => {
        btn.onclick = () => {
            const tab = btn.getAttribute('data-tab');
            
            // Убрать активные
            tabBtns.forEach(b => b.classList.remove('active'));
            authTabs.forEach(t => t.classList.remove('active'));
            
            // Новые активные
            btn.classList.add('active');
            const activeTab = modal.querySelector(`[data-tab="${tab}"]`);
            if (activeTab) activeTab.classList.add('active');
        };
    });
    
    // Закрытие при клике за модалью
    window.onclick = (event) => {
        const modal = document.getElementById('auth-modal');
        if (event.target === modal) {
            modal.classList.add('hidden');
        }
    };
})();

// ===== УВЕДОМЛЕНИЯ =====
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ===== ВОЛОНТЁРЫ =====
function updateVolunteersPage() {
    if (!appState.user) return;

    // Обновляем статистику
    document.getElementById('completed-missions').textContent = appState.user.completedMissions?.length || 0;
    
    const level = getVolunteerLevel(appState.user.completedMissions?.length || 0);
    document.getElementById('volunteer-level').textContent = level;
    document.getElementById('volunteer-rating').textContent = (appState.user.volunteerRating || 0);

    // Отрисовываем миссии
    renderMissions('all');
    
    // Отрисовываем достижения
    renderAchievements();
    
    // Отрисовываем сертификаты
    renderCertificates();
    
    // Отрисовываем рейтинг
    renderLeaderboard();
}

function getVolunteerLevel(completedCount) {
    if (completedCount >= 25) return '🏆 Легенда';
    if (completedCount >= 10) return '⭐ Эко-герой';
    if (completedCount >= 5) return '💚 Волонтёр';
    if (completedCount >= 1) return '👣 Активист';
    return '👤 Новичок';
}

function renderMissions(difficulty) {
    const grid = document.getElementById('missions-grid');
    const completedIds = appState.user.completedMissions || [];
    
    let missions = difficulty === 'all' 
        ? appState.missions 
        : appState.missions.filter(m => m.difficulty === difficulty);

    grid.innerHTML = missions.map(mission => {
        const isCompleted = completedIds.includes(mission.id);
        const isActive = (appState.user.activeMissions || []).includes(mission.id);

        return `
            <div class="mission-card ${isCompleted ? 'completed' : ''}" onclick="openMissionModal(${mission.id})">
                <div class="mission-header">
                    <h3 class="mission-title">${mission.image} ${mission.title}</h3>
                    <span class="mission-difficulty ${mission.difficulty}">${getDifficultyLabel(mission.difficulty)}</span>
                </div>
                <p class="mission-description">${mission.description}</p>
                <div class="mission-details">
                    <div class="mission-detail-item">
                        <span class="mission-detail-icon">⏱️</span>
                        <span class="mission-detail-text">Длительность: <span class="mission-detail-value">${mission.duration}</span></span>
                    </div>
                    <div class="mission-detail-item">
                        <span class="mission-detail-icon">👥</span>
                        <span class="mission-detail-text">Участников: <span class="mission-detail-value">${mission.participants}</span></span>
                    </div>
                    <div class="mission-detail-item">
                        <span class="mission-detail-icon">💰</span>
                        <span class="mission-detail-text">Награда: <span class="mission-detail-value">${mission.reward} баллов</span></span>
                    </div>
                    <div class="mission-detail-item">
                        <span class="mission-detail-icon">📜</span>
                        <span class="mission-detail-text">Сертификат включён</span>
                    </div>
                </div>
                <div class="mission-actions">
                    <button class="mission-btn mission-btn-info" onclick="event.stopPropagation(); openMissionModal(${mission.id})">Подробнее</button>
                    ${!isCompleted ? `
                        <button class="mission-btn ${isActive ? 'mission-btn-complete' : 'mission-btn-accept'}" 
                                onclick="event.stopPropagation(); ${isActive ? `completeMission(${mission.id})` : `acceptMission(${mission.id})`}">
                            ${isActive ? '✓ Завершить' : 'Принять'}
                        </button>
                    ` : `<span class="mission-badge">✓ Завершено</span>`}
                </div>
            </div>
        `;
    }).join('');
}

function filterMissions(difficulty) {
    document.querySelectorAll('.mission-filter').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-difficulty="${difficulty}"]`).classList.add('active');
    renderMissions(difficulty);
}

function openMissionModal(missionId) {
    const mission = appState.missions.find(m => m.id === missionId);
    if (!mission) return;

    const completedIds = appState.user.completedMissions || [];
    const isCompleted = completedIds.includes(mission.id);
    const isActive = (appState.user.activeMissions || []).includes(mission.id);

    const content = document.getElementById('mission-details-content');
    content.innerHTML = `
        <h2>${mission.image} ${mission.title}</h2>
        <span class="mission-modal-difficulty ${mission.difficulty}">${getDifficultyLabel(mission.difficulty)}</span>
        
        <div class="mission-modal-section">
            <h3>Описание</h3>
            <p>${mission.description}</p>
        </div>

        <div class="mission-modal-section">
            <h3>Что нужно сделать</h3>
            <div class="mission-checklist">
                ${mission.checklist.map(item => `
                    <div class="checklist-item">
                        <input type="checkbox" disabled>
                        <span>${item}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="mission-modal-section">
            <h3>Информация о миссии</h3>
            <p><strong>Длительность:</strong> ${mission.duration}</p>
            <p><strong>Участников уже:</strong> ${mission.participants}</p>
        </div>

        <div class="mission-rewards">
            <h3>Ваши награды за выполнение:</h3>
            <div class="reward-item">
                <span>💰</span>
                <strong>${mission.reward} эко-баллов</strong>
            </div>
            <div class="reward-item">
                <span>📜</span>
                <strong>Сертификат "${mission.title}"</strong>
            </div>
            <div class="reward-item">
                <span>⭐</span>
                <strong>Увеличение рейтинга на 10 пунктов</strong>
            </div>
        </div>

        <div class="mission-modal-buttons">
            ${!isCompleted ? `
                ${isActive ? `
                    <button class="mission-modal-buttons" style="flex: 1; padding: 1rem; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;" onclick="completeMission(${mission.id}); closeMissionModal();">Отметить как выполненную</button>
                ` : `
                    <button class="mission-modal-accept" onclick="acceptMission(${mission.id}); closeMissionModal();">Принять миссию</button>
                `}
            ` : `
                <div style="padding: 1rem; background: #2ecc71; color: white; border-radius: 5px; text-align: center; font-weight: bold;">✓ Вы уже завершили эту миссию!</div>
            `}
            <button class="mission-modal-close" onclick="closeMissionModal();">Закрыть</button>
        </div>
    `;

    document.getElementById('mission-modal').classList.remove('hidden');
}

function closeMissionModal() {
    document.getElementById('mission-modal').classList.add('hidden');
}

function acceptMission(missionId) {
    if (!appState.user.activeMissions) {
        appState.user.activeMissions = [];
    }
    if (!appState.user.activeMissions.includes(missionId)) {
        appState.user.activeMissions.push(missionId);
        localStorage.setItem('user', JSON.stringify(appState.user));
        renderMissions('all');
        showNotification('Вы приняли миссию! Удачи в её выполнении! 💪', 'success');
    }
}

function completeMission(missionId) {
    const mission = appState.missions.find(m => m.id === missionId);
    if (!mission) return;

    if (!appState.user.completedMissions) {
        appState.user.completedMissions = [];
    }

    if (!appState.user.completedMissions.includes(missionId)) {
        // Добавляем в завершённые
        appState.user.completedMissions.push(missionId);
        
        // Удаляем из активных
        if (appState.user.activeMissions) {
            appState.user.activeMissions = appState.user.activeMissions.filter(id => id !== missionId);
        }

        // Начисляем награды
        appState.user.balance += mission.reward;
        appState.user.earned += mission.reward;
        appState.user.volunteerRating = (appState.user.volunteerRating || 0) + 10;

        // Добавляем сертификат
        if (!appState.user.certificates) {
            appState.user.certificates = [];
        }
        appState.user.certificates.push({
            id: missionId,
            missionTitle: mission.title,
            date: new Date().toLocaleString('ru-RU'),
            certificateType: mission.certificate
        });

        // Добавляем транзакцию
        appState.user.transactions.push({
            date: new Date().toLocaleString('ru-RU'),
            desc: `Завершена миссия: ${mission.title}`,
            amount: mission.reward,
            type: 'positive'
        });

        localStorage.setItem('user', JSON.stringify(appState.user));
        updateUI();
        renderMissions('all');
        renderCertificates();
        renderAchievements();
        showNotification(`Миссия завершена! Вы получили ${mission.reward} баллов и сертификат! 🎉`, 'success');
    }
}

function renderAchievements() {
    const grid = document.getElementById('achievements-grid');
    const completedCount = appState.user.completedMissions?.length || 0;
    const ratingCount = appState.user.volunteerRating || 0;
    const earningCount = appState.user.earned || 0;

    grid.innerHTML = appState.achievements.map(achievement => {
        const isUnlocked = achievement.condition(
            achievement.id <= 4 ? completedCount : 
            achievement.id === 5 ? 0 :
            earningCount
        );

        return `
            <div class="achievement-card ${!isUnlocked ? 'locked' : ''}" title="${achievement.desc}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
                ${!isUnlocked ? `<div class="achievement-unlock">🔒 Заблокировано</div>` : `<div class="achievement-unlock">✓ Разблокировано</div>`}
            </div>
        `;
    }).join('');
}

function renderCertificates() {
    const list = document.getElementById('certificates-list');
    const certificates = appState.user.certificates || [];

    if (certificates.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Сертификатов пока нет. Завершайте миссии, чтобы получить сертификаты!</p>';
        return;
    }

    list.innerHTML = certificates.map((cert, index) => `
        <div class="certificate-card">
            <div class="certificate-title">📜 ${cert.missionTitle}</div>
            <div class="certificate-number">Сертификат №${index + 1}</div>
            <div class="certificate-date">${cert.date}</div>
            <div class="certificate-actions">
                <button class="cert-btn cert-btn-download" onclick="downloadCertificate(${index})">Скачать</button>
                <button class="cert-btn cert-btn-share" onclick="shareCertificate(${index})">Поделиться</button>
            </div>
        </div>
    `).join('');
}

function renderLeaderboard() {
    const leaderboard = document.getElementById('leaderboard');
    
    // Сортируем пользователей по волонтёрскому рейтингу
    const sortedUsers = [...appState.users]
        .filter(u => u.volunteerRating && u.volunteerRating > 0)
        .sort((a, b) => (b.volunteerRating || 0) - (a.volunteerRating || 0))
        .slice(0, 10);

    if (sortedUsers.length === 0) {
        leaderboard.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">Рейтинг пока пуст. Начните выполнять миссии!</p>';
        return;
    }

    const html = `
        <div class="leaderboard-header">
            <div>Место</div>
            <div>Волонтёр</div>
            <div>Завершённых</div>
            <div>Рейтинг</div>
        </div>
        ${sortedUsers.map((user, index) => {
            let className = '';
            if (index === 0) className = 'top-1';
            else if (index === 1) className = 'top-2';
            else if (index === 2) className = 'top-3';

            const medals = ['🥇', '🥈', '🥉'];
            const medal = medals[index] || (index + 1);

            return `
                <div class="leaderboard-item ${className}">
                    <div class="rank-medal">${medal}</div>
                    <div class="leaderboard-name">${user.name}</div>
                    <div class="leaderboard-stat"><strong>${user.completedMissions?.length || 0}</strong></div>
                    <div class="leaderboard-stat"><strong>${user.volunteerRating || 0}</strong></div>
                </div>
            `;
        }).join('')}
    `;

    leaderboard.innerHTML = html;
}

function downloadCertificate(index) {
    showNotification('Сертификат будет загружен (функция в разработке)', 'success');
}

function shareCertificate(index) {
    const cert = appState.user.certificates[index];
    const text = `🎉 Я только что получил сертификат за миссию "${cert.missionTitle}" в ZhaylBonus! Присоединяйтесь к нам и помогайте окружающей среде! 🌍💚`;
    
    if (navigator.share) {
        navigator.share({
            title: 'ZhaylBonus Сертификат',
            text: text
        });
    } else {
        // Fallback - копируем в буфер обмена
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Текст скопирован в буфер обмена!', 'success');
        });
    }
}

function getDifficultyLabel(difficulty) {
    const labels = {
        'easy': '⭐ Простая',
        'medium': '⭐⭐ Средняя',
        'hard': '⭐⭐⭐ Сложная'
    };
    return labels[difficulty] || difficulty;
}

// ============= ОБРАБОТЧИКИ ФОРМ SUPABASE =============

async function handleSupabaseLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showNotification('❌ Заполните все поля', 'error');
        return;
    }
    
    const result = await supabaseLogin(email, password);
    if (result) {
        // Закрыть модал
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.add('hidden');
        
        // Очистить форму
        document.getElementById('login-form').reset();
        
        // Обновить UI
        updateUI();
    }
}

async function handleSupabaseRegister(event) {
    event.preventDefault();
    const username = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    
    if (!username || !email || !password) {
        showNotification('❌ Заполните все поля', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('❌ Пароль должен быть минимум 6 символов', 'error');
        return;
    }
    
    const result = await supabaseRegister(email, password, username);
    if (result) {
        // Закрыть модал
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.add('hidden');
        
        // Очистить форму
        document.getElementById('register-form').reset();
        
        // Обновить UI
        updateUI();
    }
}

// ============= ОТПРАВКА ОТЧЁТА С SUPABASE =============

async function submitReport(event) {
    event.preventDefault();
    
    if (!appState.user) {
        alert('❌ Сначала войдите в аккаунт!');
        navigateTo('home');
        return;
    }
    
    // Получить данные из формы
    const title = document.getElementById('report-title').value;
    const description = document.getElementById('report-description').value;
    const problemType = document.getElementById('report-type').value;
    const severity = document.getElementById('report-urgency').value;
    const location = document.getElementById('report-location').value;
    const photoFile = document.getElementById('report-photo').files[0];
    
    // Получить координаты (по умолчанию Москва)
    let latitude = 55.75;
    let longitude = 37.62;
    
    // Загрузить фото если выбрано
    let photoURL = null;
    if (photoFile) {
        photoURL = await uploadPhotoToSupabase(photoFile);
    }
    
    // Добавить отчёт в Supabase
    await addReportToSupabase({
        title: title,
        description: description,
        problemType: problemType,
        latitude: latitude,
        longitude: longitude,
        photoURL: photoURL,
        severity: severity
    });
    
    // Очистить форму
    document.getElementById('report-form').reset();
    document.getElementById('photo-preview').innerHTML = '';
    navigateTo('map');
}

// ============= ЗАГРУЗКА ДАННЫХ ПРИ СТАРТЕ =============

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Загрузка ZhaylBonus...');
    
    // Загрузить пользователя если уже авторизован
    await loadUserFromSupabase();
    
    // Загрузить отчёты
    await loadReportsFromSupabase();
    
    // Инициализировать карту
    initMap();
    
    console.log('✅ ZhaylBonus готов!');
});
