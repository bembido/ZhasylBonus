function formatSupabaseError(err) {
    if (!err) return 'Неизвестная ошибка';
    if (err.message) return err.message;
    if (typeof err === 'string') return err;
    try {
        return JSON.stringify(err);
    } catch (e) {
        return 'Неизвестная ошибка';
    }
}

let isRegisterSubmitting = false;

async function supabaseRegister(email, password, username) {
    if (!checkSupabaseConnection()) {
        showNotification('Ошибка подключения к серверу', 'error');
        return null;
    }
    
    try {
        console.log('Регистрация:', email);
        
        if (password.length < 6) {
            throw new Error('Пароль должен быть минимум 6 символов');
        }
        
        const { data: authData, error: authError } = await sb.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { username: username }
            }
        });
        
        if (authError) {
            let errorMsg = formatSupabaseError(authError);
            
            if (errorMsg.includes('User already registered') || errorMsg.includes('already registered')) {
                console.log('Пользователь существует, пробуем войти...');
                const { data: loginData, error: loginError } = await sb.auth.signInWithPassword({ email, password });
                
                if (loginError) {
                    throw new Error('Пользователь уже существует, но пароль не подходит');
                }
                
                if (loginData?.user) {
                    console.log('Успешный вход (пользователь уже был)');
                    const { data: existingUser } = await sb
                        .from('users')
                        .select('*')
                        .eq('id', loginData.user.id)
                        .single();
                        
                    appState.user = existingUser || {
                        id: loginData.user.id,
                        email: email,
                        username: username || email.split('@')[0],
                        balance: 100,
                        volunteer_rating: 0,
                        volunteer_level: 'Новичок'
                    };
                    
                    updateAuthUI(true);
                    closeAuthModal();
                    showNotification('Вы успешно вошли!', 'success');
                    return appState.user;
                }
            }

            if (errorMsg.includes('Invalid API key')) {
                errorMsg = 'Неправильный API ключ Supabase';
            } else if (authError.status === 429) {
                errorMsg = 'Слишком много попыток, подождите минуту';
            } else if (errorMsg.toLowerCase().includes('signups not allowed')) {
                errorMsg = 'Регистрация отключена в настройках проекта Supabase';
            }
            
            console.warn('Ошибка регистрации Supabase, активирован демо-режим:', errorMsg);
            
            const demoUser = {
                id: 'demo-' + Date.now(),
                email: email,
                username: username,
                balance: 100,
                volunteer_rating: 0,
                volunteer_level: 'Новичок',
                is_local: true
            };
            
            appState.user = demoUser;
            updateAuthUI(true);
            closeAuthModal();
            showNotification('Вход выполнен (Демо-режим)', 'success');
            return demoUser;
        }
        
        if (!authData.user) {
            throw new Error('Не удалось создать пользователя');
        }
        
        const userId = authData.user.id;
        console.log('Пользователь создан:', userId);
        
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
        
        if (dbError && !dbError.message.includes('duplicate')) {
            console.warn('Ошибка создания профиля:', dbError.message);
        }
        
        if (!authData.session) {
            const { data: loginData, error: loginError } = await sb.auth.signInWithPassword({ email, password });
            if (loginData?.session) {
                authData.session = loginData.session;
            } else {
                console.warn('Требуется подтверждение почты или ошибка входа:', loginError?.message);
            }
        }

        const { data: userData } = await sb
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        appState.user = userData || {
            id: userId,
            email: email,
            username: username,
            balance: 100,
            volunteer_rating: 0,
            volunteer_level: 'Новичок'
        };
        
        localStorage.setItem('currentUserId', userId);
        showNotification('Регистрация успешна!', 'success');
        updateAuthUI(true);
        
        return userId;
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        const message = (error?.message || 'Ошибка регистрации');
        showNotification(message, 'error');
        alert(message);
        return null;
    }
}

async function supabaseLogin(email, password) {
    if (!checkSupabaseConnection()) {
        showNotification('Ошибка подключения к серверу', 'error');
        return null;
    }
    
    try {
        console.log('Вход:', email);
        const { data, error } = await sb.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            let errorMsg = formatSupabaseError(error);
            if (errorMsg.includes('Invalid login credentials')) {
                errorMsg = 'Неверный email или пароль';
            } else if (errorMsg.includes('Email not confirmed')) {
                errorMsg = 'Подтвердите email';
            }
            throw new Error(errorMsg);
        }
        
        if (!data.user) {
            throw new Error('Пользователь не найден');
        }
        
        const userId = data.user.id;
        console.log('Вход выполнен:', userId);
        
        const { data: userData, error: userError } = await sb
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (userError) {
            const newUser = {
                id: userId,
                email: email,
                username: email.split('@')[0],
                balance: 100,
                volunteer_rating: 0,
                volunteer_level: 'Новичок'
            };
            
            await sb.from('users').insert([newUser]);
            appState.user = newUser;
        } else {
            appState.user = userData;
        }
        
        localStorage.setItem('currentUserId', userId);
        showNotification('Добро пожаловать!', 'success');
        updateAuthUI(true);
        if (typeof resumePendingReport === 'function') {
            resumePendingReport();
        }
        
        return userId;
    } catch (error) {
        console.error('Ошибка входа:', error);
        const message = (error?.message || 'Ошибка входа');
        showNotification(message, 'error');
        alert(message);
        return null;
    }
}

async function supabaseLogout() {
    try {
        console.log('Выход из аккаунта...');
        
        if (sb) {
            await sb.auth.signOut();
        }
        
        appState.user = null;
        localStorage.removeItem('currentUserId');
        
        showNotification('Вы вышли из аккаунта', 'success');
        updateAuthUI(false);
        
        const isSubPage = window.location.pathname.includes('/pages/');
        if (isSubPage) {
            window.location.href = '../index.html';
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Ошибка выхода:', error.message);
        showNotification('Ошибка выхода', 'error');
    }
}

async function loadCurrentUser() {
    if (!checkSupabaseConnection()) return null;
    
    try {
        const { data: { user } } = await sb.auth.getUser();
        
        if (!user) {
            console.log('Пользователь не авторизован');
            return null;
        }
        
        const { data, error } = await sb
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (error) throw error;
        
        appState.user = data;
        console.log('Пользователь загружен:', data.username);
        updateAuthUI(true);
        return data;
    } catch (error) {
        console.error('Ошибка загрузки пользователя:', error.message);
        return null;
    }
}

function updateAuthUI(isLoggedIn) {
    const authBtn = document.getElementById('auth-btn');
    const logoutBtns = document.querySelectorAll('#logout-btn, [data-action="logout"], .logout-btn');
    const userInfo = document.getElementById('user-info');
    const userBalance = document.getElementById('user-balance');
    const userName = document.getElementById('user-name');
    const usernameDisplay = document.getElementById('username-display');
    const loginToggle = document.getElementById('login-toggle');
    
    if (isLoggedIn && appState.user) {
        if (authBtn) authBtn.style.display = 'none';
        logoutBtns.forEach(btn => { btn.style.display = 'inline-flex'; });
        if (userInfo) userInfo.style.display = 'flex';
        if (userBalance) userBalance.textContent = appState.user.balance || 0;
        if (userName) userName.textContent = appState.user.username || 'Пользователь';
        if (usernameDisplay) usernameDisplay.textContent = appState.user.username || '';
        if (loginToggle) loginToggle.textContent = 'Профиль';
        
        if (typeof updateAccountPage === 'function') {
            updateAccountPage();
        }
    } else {
        if (authBtn) authBtn.style.display = 'block';
        logoutBtns.forEach(btn => { btn.style.display = 'none'; });
        if (userInfo) userInfo.style.display = 'none';
        if (usernameDisplay) usernameDisplay.textContent = '';
        if (loginToggle) loginToggle.textContent = 'Вход';
    }
}

async function handleLoginForm(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    
    if (!email || !password) {
        showNotification('Заполните все поля', 'error');
        return;
    }
    
    const result = await supabaseLogin(email, password);
    
    if (result) {
        closeAuthModal();
        event.target.reset();
    }
}

async function handleRegisterForm(event) {
    event.preventDefault();
    if (isRegisterSubmitting) return;
    isRegisterSubmitting = true;
    console.log('submit register form');
    
    const username = document.getElementById('register-username')?.value || 
        document.getElementById('register-name')?.value;
    const email = document.getElementById('register-email')?.value;
    const password = document.getElementById('register-password')?.value;
    
    if (!username || !email || !password) {
        showNotification('Заполните все поля', 'error');
        return;
    }
    
    const result = await supabaseRegister(email, password, username);
    
    if (result) {
        closeAuthModal();
        event.target.reset();
    }
    isRegisterSubmitting = false;
}

function setupLogoutHandler() {
    const logoutBtns = document.querySelectorAll('#logout-btn, [data-action="logout"], .logout-btn');
    if (!logoutBtns.length) return;

    logoutBtns.forEach((btn) => {
        if (btn.dataset.logoutBound === '1') return;
        btn.dataset.logoutBound = '1';

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            supabaseLogout();
        });
    });

    console.log('Обработчики выхода установлены');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLogoutHandler);
} else {
    setupLogoutHandler();
}

console.log('Auth загружен');
