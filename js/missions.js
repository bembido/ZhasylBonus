let currentMissionId = null;

// Отрисовать миссии
function renderMissions(filter = 'all') {
    const container = document.getElementById('missions-grid') || document.getElementById('missions-list');
    if (!container) return;
    
    let missions = appState.missions;
    if (filter !== 'all') {
        missions = missions.filter(m => m.difficulty === filter);
    }
    
    container.innerHTML = missions.map(mission => {
        const short = (mission.description || '').length > 140
            ? `${mission.description.slice(0, 140)}…`
            : (mission.description || '');

        return `
            <div class="modern-card" onclick="openMissionModal(${mission.id})">
                <div class="card-image-placeholder">
                    <svg class="card-image-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M21 19H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1ZM4 17h16V7H4v10Z" />
                        <path d="M8.5 12.5a1.5 1.5 0 1 0-3 0a1.5 1.5 0 0 0 3 0Z" />
                        <path d="M19 17H6l3.2-4.2a1 1 0 0 1 1.6 0L13 15l1.6-2.1a1 1 0 0 1 1.6 0L19 17Z" />
                    </svg>
                </div>
                <div class="card-body">
                    <span class="card-tag">${getDifficultyLabel(mission.difficulty)}</span>
                    <h4>${mission.title}</h4>
                    <p>${short}</p>
                    <div class="mission-meta-row">
                        <span class="mission-reward">+${mission.reward} баллов</span>
                        <span class="mission-duration">${mission.duration}</span>
                        <span class="mission-participants">${mission.participants} участников</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Фильтровать миссии
function filterMissions(difficulty) {
    document.querySelectorAll('.mission-filter, .filter-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
    });
    renderMissions(difficulty);
}

// Открыть модальное окно миссии
function openMissionModal(missionId) {
    const mission = appState.missions.find(m => m.id === missionId);
    if (!mission) return;
    
    currentMissionId = missionId;
    
    const modal = document.getElementById('mission-modal');
    const content = document.getElementById('mission-details-content');
    if (!modal || !content) return;

    content.innerHTML = `
        <div class="mission-modal-header">
            <div class="mission-icon">${mission.image}</div>
            <div>
                <h3 class="mission-title">${mission.title}</h3>
                <p class="mission-difficulty">${getDifficultyLabel(mission.difficulty)}</p>
            </div>
        </div>
        <p class="mission-description">${mission.description}</p>
        <div class="mission-meta">
            <span class="mission-reward">+${mission.reward} баллов</span>
            <span class="mission-duration">Срок: ${mission.duration}</span>
            <span class="mission-participants">Участников: ${mission.participants}</span>
        </div>
        <ul class="mission-checklist">
            ${(mission.checklist || []).map(item => `<li><label><input type="checkbox"> ${item}</label></li>`).join('')}
        </ul>
        <div class="mission-actions">
            <button class="btn-secondary" id="accept-mission-btn">Принять</button>
            <button class="btn-primary" id="complete-mission-btn">Завершить</button>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('active');

    const acceptBtn = document.getElementById('accept-mission-btn');
    const completeBtn = document.getElementById('complete-mission-btn');
    const closeBtn = modal.querySelector('.close');
    if (acceptBtn) acceptBtn.onclick = () => acceptMission(mission.id);
    if (completeBtn) completeBtn.onclick = () => handleCompleteMission(mission.id);
    if (closeBtn) closeBtn.onclick = closeMissionModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeMissionModal();
    };
}

// Закрыть модальное окно миссии
function closeMissionModal() {
    const modal = document.getElementById('mission-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('active');
    }
    currentMissionId = null;
}

// Принять миссию
async function acceptMission(missionId) {
    if (!appState.user) {
        showNotification('Войдите в аккаунт', 'error');
        openAuthModal();
        return;
    }
    
    const mission = appState.missions.find(m => m.id === missionId);
    if (!mission) return;
    
    showNotification(`Вы приняли миссию: ${mission.title}`, 'success');
    closeMissionModal();
}

// Завершить миссию
async function handleCompleteMission(missionId) {
    if (!appState.user) {
        showNotification('Войдите в аккаунт', 'error');
        return;
    }
    
    const mission = appState.missions.find(m => m.id === missionId);
    if (!mission) return;
    
    // Проверить чеклист
    const checklist = document.querySelectorAll('.mission-checklist input[type="checkbox"]');
    const allChecked = Array.from(checklist).every(cb => cb.checked);
    
    if (!allChecked) {
        showNotification('Выполните все пункты чеклиста', 'error');
        return;
    }
    
    const success = await completeMission(missionId);
    
    if (success) {
        showNotification(`Миссия выполнена! +${mission.reward} баллов`, 'success');
        closeMissionModal();
        updateAuthUI(true);
        updateVolunteersPage();
    } else {
        showNotification('Ошибка выполнения миссии', 'error');
    }
}

// Обновить страницу волонтёров
function updateVolunteersPage() {
    renderMissions();
    renderAchievements();
    renderCertificates();
    renderLeaderboard();
    const completedEl = document.getElementById('completed-missions');
    if (completedEl) completedEl.textContent = appState.user?.volunteer_rating || 0;
    
    // Обновить статистику пользователя
    if (appState.user) {
        const rating = document.getElementById('volunteer-rating');
        const level = document.getElementById('volunteer-level');
        
        if (rating) rating.textContent = appState.user.volunteer_rating || 0;
        if (level) level.textContent = getVolunteerLevel(appState.user.volunteer_rating || 0);
    }
}

// Отрисовать достижения
function renderAchievements() {
    const container = document.getElementById('achievements-grid') || document.getElementById('achievements-list');
    if (!container) return;
    
    const completedCount = appState.user?.volunteer_rating || 0;
    
    container.innerHTML = appState.achievements.map(achievement => {
        const unlocked = achievement.condition(completedCount);
        // UI request: hide achievement "icons" (numbers / letters like "T").
        const displayIcon = '';
        return `
            <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                <span class="achievement-icon" aria-hidden="true">${displayIcon}</span>
                <span class="achievement-name">${achievement.name}</span>
                <span class="achievement-desc">${achievement.desc}</span>
            </div>
        `;
    }).join('');
}

// Отрисовать сертификаты
function renderCertificates() {
    const list = document.getElementById('certificates-list');
    if (!list) return;

    // Если пользователь не вошел — показываем подсказку
    if (!appState.user) {
        list.innerHTML = `
            <div class="certificate-item">
                <div>
                    <div class="title"> Сертификаты</div>
                    <div class="meta">Войдите в аккаунт, чтобы видеть свои сертификаты</div>
                </div>
            </div>
        `;
        return;
    }

    // 1) Если сертификаты уже есть в профиле — используем их
    const existing = Array.isArray(appState.user.certificates) ? appState.user.certificates : [];

    // 2) Иначе синтезируем по количеству завершённых миссий (volunteer_rating)
    const completedCount = Number(appState.user.volunteer_rating || 0);
    const syntheticCount = Math.max(0, Math.min(completedCount, appState.missions?.length || 0));
    const synthetic = existing.length === 0 && syntheticCount > 0
        ? (appState.missions || []).slice(0, syntheticCount).map((mission, index) => ({
            id: mission.id,
            missionTitle: mission.title,
            date: null,
            certificateType: mission.certificate,
            number: index + 1
        }))
        : [];

    const certificates = existing.length > 0 ? existing : synthetic;

    if (certificates.length === 0) {
        list.innerHTML = `
            <div class="certificate-item">
                <div>
                    <div class="title"> Сертификатов пока нет</div>
                    <div class="meta">Завершайте миссии, чтобы получать сертификаты</div>
                </div>
            </div>
        `;
        return;
    }

    list.innerHTML = certificates.map((cert, index) => {
        const number = cert.number || (index + 1);
        const dateText = cert.date || cert.created_at || cert.createdAt || '';
        const metaParts = [`Сертификат №${number}`];
        if (dateText) metaParts.push(String(dateText));

        return `
            <div class="certificate-item">
                <div>
                    <div class="title"> ${cert.missionTitle || 'Сертификат'}</div>
                    <div class="meta">${metaParts.join(' · ')}</div>
                </div>
                <div class="meta">${cert.certificateType ? String(cert.certificateType) : ''}</div>
            </div>
        `;
    }).join('');
}

// Отрисовать таблицу лидеров
function renderLeaderboard() {
    const container = document.getElementById('leaderboard');
    if (!container) return;
    
    // Демо данные лидеров
    const leaders = [
        { username: 'ЭкоГерой', rating: 45, balance: 2500 },
        { username: 'ЗелёныйВоин', rating: 38, balance: 2100 },
        { username: 'Хранитель', rating: 32, balance: 1800 },
        { username: 'Волонтёр2025', rating: 28, balance: 1500 },
        { username: 'ПриродаFan', rating: 25, balance: 1200 }
    ];
    
    // Добавить текущего пользователя если есть
    if (appState.user) {
        const userExists = leaders.some(l => l.username === appState.user.username);
        if (!userExists) {
            leaders.push({
                username: appState.user.username,
                rating: appState.user.volunteer_rating || 0,
                balance: appState.user.balance || 0
            });
        }
    }
    
    // Сортировать по рейтингу
    leaders.sort((a, b) => b.rating - a.rating);
    
    container.innerHTML = leaders.slice(0, 10).map((leader, index) => `
        <div class="leaderboard-item ${appState.user?.username === leader.username ? 'current-user' : ''}">
            <span class="rank">#${index + 1}</span>
            <span class="name">${leader.username}</span>
            <span class="rating">${leader.rating} миссий</span>
            <span class="balance">${leader.balance} баллов</span>
        </div>
    `).join('');
}

console.log('Missions загружен');
