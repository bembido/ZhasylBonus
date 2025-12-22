// ============= ZHAYLBONUS - ГЛАВНЫЙ ФАЙЛ =============
// Все модули: config.js, auth.js, api.js, ui.js, map.js, missions.js

// Инициализация приложения
async function initApp() {
    console.log('Загрузка ZhaylBonus...');
    
    // 1. Инициализировать Supabase
    if (!initSupabase()) {
        console.error('Не удалось подключиться к Supabase');
    }
    
    // 2. Загрузить пользователя если авторизован
    await loadCurrentUser();
    
    // 3. Загрузить отчёты
    await loadReports();
    
    // 4. Инициализировать карту
    initMap();
    
    // 5. Установить обработчики событий
    setupEventHandlers();
    
    // 6. Обновить UI
    updatePageUI();
    
    console.log('ZhaylBonus готов!');
}

// Память о незавершённом отчёте (если просим войти)
let pendingReportData = null;

// Установить обработчики событий
function setupEventHandlers() {
    // Кнопки входа
    const authButtons = document.querySelectorAll('#auth-btn, #login-toggle, .login-btn');
    authButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Если это кнопка профиль/вход в шапке и пользователь авторизован
            if (btn.id === 'login-toggle' && appState.user) {
                const isInPages = window.location.pathname.includes('/pages/');
                window.location.href = isInPages ? 'account.html' : 'pages/account.html';
                return;
            }

            openAuthModal();
        });
    });
    
    // Кнопка выхода (ВАЖНО!)
    setupLogoutHandler();

    // Мобильное меню
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('main-nav');
    if (navToggle && navMenu) {
        // Ensure mobile menu starts closed
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');

        navToggle.addEventListener('click', () => {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');
        });

        // Close menu after selecting a link (mobile)
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.matchMedia('(max-width: 960px)').matches) {
                    navMenu.classList.remove('active');
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }
    
    // Табы авторизации
    const authTabs = document.querySelectorAll('.tab-btn');
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
    });
    
    // Формы авторизации
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    if (loginForm) loginForm.onsubmit = handleLoginForm;
    if (registerForm) registerForm.onsubmit = handleRegisterForm;
    
    // Закрыть модальное окно
    const authModal = document.getElementById('auth-modal');
    const closeBtn = document.querySelector('#auth-modal .close');
    if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) closeAuthModal();
        });
    }
    
    // Фильтры карты
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => filterReports(btn.dataset.filter));
    });
    
    // Фильтры миссий (volunteers page uses .filter-pill)
    document.querySelectorAll('.mission-filter, .filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof filterMissions === 'function') {
                filterMissions(btn.dataset.difficulty || 'all');
            }
        });
    });
    
    // Модальное окно миссии
    const missionModal = document.getElementById('mission-modal');
    const missionClose = document.querySelector('.mission-close');
    if (missionClose) missionClose.addEventListener('click', closeMissionModal);
    if (missionModal) {
        missionModal.addEventListener('click', (e) => {
            if (e.target === missionModal) closeMissionModal();
        });
    }
    
    // Форма отчёта
    const reportForm = document.getElementById('report-form');
    if (reportForm) {
        reportForm.onsubmit = handleReportSubmit;
    }
    
    // Превью фото
    const photoInput = document.getElementById('report-photo');
    if (photoInput) {
        photoInput.addEventListener('change', (e) => previewPhoto(e.target));
    }
    
    // Кнопка геолокации
    const locationBtn = document.getElementById('use-location-btn');
    if (locationBtn) {
        locationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            useCurrentLocation();
        });
    }
    
    console.log('Обработчики событий установлены');
}

// Обновить UI страницы
function updatePageUI() {
    const page = document.body.dataset.page || 'home';
    
    switch (page) {
        case 'map':
            renderReportsOnMap();
            updateReportsList();
            break;
        case 'volunteers':
            updateVolunteersPage();
            break;
        case 'account':
            updateAccountPage();
            break;
        case 'report':
            // Форма отчёта
            break;
        case 'donate':
            renderOrganizations();
            break;
    }
}

// Отправка отчёта
async function handleReportSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const reportData = collectReportFormData(form);

    if (!reportData) {
        showNotification('Заполните обязательные поля', 'error');
        return;
    }
    
    // Если пользователь не авторизован, создаем временного гостя
    if (!appState.user) {
        console.log('Создание гостевого пользователя для отправки отчёта');
        appState.user = {
            id: 'guest-' + Date.now(),
            username: 'Гость',
            email: 'guest@example.com',
            balance: 0,
            volunteer_rating: 0,
            volunteer_level: 'Гость',
            is_guest: true
        };
        // Обновляем UI чтобы показать что мы "вошли" как гость
        updateAuthUI(true);
        showNotification('Отправка от имени гостя', 'info');
    }

    await submitReportData(reportData, form);
}

// Собрать данные формы отчёта
function collectReportFormData(form) {
    if (!form) return null;
    const title = form.querySelector('#report-title')?.value;
    const type = form.querySelector('#report-type')?.value;
    const urgency = form.querySelector('#report-urgency')?.value || 'medium';
    const description = form.querySelector('#report-description')?.value;
    const location = form.querySelector('#report-location')?.value;
    const photoFile = form.querySelector('#report-photo')?.files?.[0];
    
    // Получаем координаты из скрытых полей или парсим строку
    let latitude = form.querySelector('#report-lat')?.value;
    let longitude = form.querySelector('#report-lng')?.value;

    if (!latitude && location) {
        const coords = location.split(',').map(c => parseFloat(c.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            latitude = coords[0];
            longitude = coords[1];
        }
    }
    
    if (!type || !description) return null;
    
    return { title, type, urgency, description, location, photoFile, latitude, longitude };
}

// Реальная отправка отчёта в Supabase
async function submitReportData(data, formRef) {
    if (!appState.user) {
        showNotification('Войдите в аккаунт', 'error');
        return;
    }

    showNotification('Отправка отчёта...', 'info');

    let photoUrl = null;
    if (data.photoFile) {
        photoUrl = await uploadPhoto(data.photoFile);
    }

    const payload = {
        user_id: appState.user.id,
        title: data.title || data.description?.slice(0, 80) || 'Отчёт',
        type: data.type,
        urgency: data.urgency,
        description: data.description,
        location: data.location,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        photo_url: photoUrl,
        status: 'pending'
    };

    const result = await addReport(payload);

    if (result) {
        const reward = getRewardPoints(data.urgency);
        await updateUserProfile({
            balance: (appState.user.balance || 0) + reward
        });
        showNotification(`Отчёт отправлен! +${reward} баллов`, 'success');
        if (formRef) formRef.reset();
        const preview = document.getElementById('photo-preview');
        if (preview) preview.innerHTML = '';
        pendingReportData = null;
        
        // Перенаправление на карту через 1.5 секунды
        setTimeout(() => {
            window.location.href = 'map.html';
        }, 1500);
    }
}

// Отрисовать организации для донатов
function renderOrganizations() {
    const container = document.getElementById('organizations-list');
    if (!container) return;
    
    const orgs = Object.entries(appState.organizations);
    
    container.innerHTML = orgs.map(([id, org]) => {
        const progress = Math.round((org.balance / org.target) * 100);
        return `
            <div class="org-card" data-org="${id}">
                <h3>${org.name}</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <p class="progress-text">${org.balance} / ${org.target} баллов</p>
                <div class="donate-buttons">
                    <button class="btn-donate" onclick="donateToOrg('${id}', 10)">10 баллов</button>
                    <button class="btn-donate" onclick="donateToOrg('${id}', 50)">50 баллов</button>
                    <button class="btn-donate" onclick="donateToOrg('${id}', 100)">100 баллов</button>
                </div>
            </div>
        `;
    }).join('');
}

// Пожертвовать организации
async function donateToOrg(orgId, amount) {
    if (!appState.user) {
        showNotification('Войдите в аккаунт', 'error');
        openAuthModal();
        return;
    }
    
    if (appState.user.balance < amount) {
        showNotification('Недостаточно баллов', 'error');
        return;
    }
    
    const org = appState.organizations[orgId];
    if (!org) return;
    
    // Обновить баланс пользователя
    const success = await updateUserProfile({
        balance: appState.user.balance - amount
    });
    
    if (success) {
        org.balance += amount;
        showNotification(`Вы пожертвовали ${amount} баллов организации ${org.name}`, 'success');
        renderOrganizations();
        updateAuthUI(true);
    }
}

// Запуск при загрузке страницы (с резервом, если DOM уже готов)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Обработчики для инлайновых атрибутов в HTML
function handleSupabaseLogin(event) {
    return handleLoginForm(event);
}

function handleSupabaseRegister(event) {
    return handleRegisterForm(event);
}

function submitReport(event) {
    return handleReportSubmit(event);
}

// После успешного логина — если есть незавершённый отчёт, отправляем
function resumePendingReport() {
    if (pendingReportData) {
        const form = document.getElementById('report-form');
        submitReportData(pendingReportData, form);
    }
}
