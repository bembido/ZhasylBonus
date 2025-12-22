
async function loadReports() {
    if (!checkSupabaseConnection()) return [];
    
    try {
        const { data, error } = await sb
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        appState.reports = normalizeReports(data || []);
        console.log('Загружено отчётов:', appState.reports.length);
        return appState.reports;
    } catch (error) {
        console.error('Ошибка загрузки отчётов:', error.message);
        return [];
    }
}

async function addReport(reportData) {
    if (reportData.user_id && (String(reportData.user_id).startsWith('guest-') || String(reportData.user_id).startsWith('demo-'))) {
        console.log('Добавление локального отчёта (гость/демо)');
        const mockReport = {
            id: 'local-' + Date.now(),
            created_at: new Date().toISOString(),
            user_id: reportData.user_id,
            title: reportData.title,
            description: reportData.description,
            problem_type: reportData.problem_type || reportData.type,
            severity: reportData.severity || reportData.urgency,
            latitude: reportData.latitude,
            longitude: reportData.longitude,
            photo_url: reportData.photo_url,
            status: 'pending',
            votes: 0
        };
        
        const normalized = normalizeReport ? normalizeReport(mockReport) : mockReport;
        appState.reports.unshift(normalized);
        return normalized;
    }

    if (!checkSupabaseConnection()) {
        showNotification('Нет подключения к серверу', 'error');
        return null;
    }
    
    try {
        const payload = {
            user_id: reportData.user_id,
            title: reportData.title,
            description: reportData.description,
            problem_type: reportData.problem_type || reportData.type,
            severity: reportData.severity || reportData.urgency,
            latitude: reportData.latitude,
            longitude: reportData.longitude,
            photo_url: reportData.photo_url
        };
        
        const { data, error } = await sb
            .from('reports')
            .insert([payload])
            .select()
            .single();
        
        if (error) throw error;
        
        appState.reports.unshift(normalizeReport(data));
        console.log('Отчёт добавлен:', data.id);
        return data;
    } catch (error) {
        console.error('Ошибка добавления отчёта:', error);
        const msg = error?.message || 'Ошибка отправки отчёта';
        showNotification(msg, 'error');
        return null;
    }
}

async function uploadPhoto(file) {
    if (!checkSupabaseConnection()) return null;
    
    try {
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `uploads/${fileName}`;
        const { data, error } = await sb.storage
            .from('reports')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type || 'application/octet-stream'
            });
        
        if (error) throw error;
        
        const { data: urlData } = sb.storage
            .from('reports')
            .getPublicUrl(filePath);
        
        console.log('Фото загружено', { path: data?.path, publicUrl: urlData?.publicUrl });
        return urlData?.publicUrl || null;
    } catch (error) {
        console.error('Ошибка загрузки фото:', error);
        const msg = error?.message || 'Не удалось загрузить фото. Проверьте bucket reports в Supabase.';
        showNotification(msg, 'error');
        return null;
    }
}

async function updateUserProfile(updates) {
    if (!appState.user) return false;

    if (appState.user.is_guest || appState.user.is_local || String(appState.user.id).startsWith('guest-') || String(appState.user.id).startsWith('demo-')) {
        Object.assign(appState.user, updates);
        console.log('Профиль обновлён локально (гость/демо)');
        if (typeof updateAccountPage === 'function') updateAccountPage();
        return true;
    }

    if (!checkSupabaseConnection()) return false;
    
    try {
        const { error } = await sb
            .from('users')
            .update(updates)
            .eq('id', appState.user.id);
        
        if (error) throw error;
        
        Object.assign(appState.user, updates);
        console.log('Профиль обновлён');
        return true;
    } catch (error) {
        console.error('Ошибка обновления профиля:', error.message);
        return false;
    }
}

async function completeMission(missionId) {
    if (!checkSupabaseConnection() || !appState.user) return false;
    
    try {
        const mission = appState.missions.find(m => m.id === missionId);
        if (!mission) throw new Error('Миссия не найдена');
        
        const newBalance = (appState.user.balance || 0) + mission.reward;
        const newRating = (appState.user.volunteer_rating || 0) + 1;
        
        const { error } = await sb
            .from('users')
            .update({
                balance: newBalance,
                volunteer_rating: newRating
            })
            .eq('id', appState.user.id);
        
        if (error) throw error;
        
        appState.user.balance = newBalance;
        appState.user.volunteer_rating = newRating;
        
        console.log('Миссия завершена, +' + mission.reward + ' баллов');
        return true;
    } catch (error) {
        console.error('Ошибка завершения миссии:', error.message);
        return false;
    }
}

function subscribeToReports(callback) {
    if (!checkSupabaseConnection()) return;
    
    sb.channel('reports')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'reports' },
            (payload) => {
                console.log('Изменение в отчётах:', payload.eventType);
                if (callback) callback(payload);
            }
        )
        .subscribe();
}

function normalizeReport(r) {
    if (!r) return r;

    const normalizeType = (raw) => {
        const value = String(raw || '').trim().toLowerCase();
        if (!value) return 'other';

        const v = value.replace(/\s+/g, '-').replace(/_/g, '-');

        const waste = new Set(['waste', 'garbage', 'trash', 'dump', 'illegal-dump', 'illegal-dumps', 'illegal', 'litter']);
        const pollution = new Set(['pollution', 'air', 'air-pollution', 'smog']);
        const deforestation = new Set(['deforestation', 'forest', 'logging', 'tree-cutting']);
        const water = new Set(['water', 'water-pollution', 'water-contamination']);

        if (waste.has(v)) return 'waste';
        if (pollution.has(v)) return 'pollution';
        if (deforestation.has(v)) return 'deforestation';
        if (water.has(v)) return 'water';

        if (['pollution', 'deforestation', 'water', 'waste', 'other'].includes(v)) return v;

        return 'other';
    };

    return {
        ...r,
        type: normalizeType(r.type || r.problem_type || r.category),
        urgency: r.urgency || r.severity || 'medium'
    };
}

function normalizeReports(list) {
    return list.map(normalizeReport);
}

console.log('API загружен');
