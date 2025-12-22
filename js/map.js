function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.log('Карта не найдена на странице');
        return;
    }
    
    const defaultCoords = [43.238949, 76.945465];
    
    try {
        appState.map = L.map('map').setView(defaultCoords, 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(appState.map);
        
        console.log('Карта инициализирована');
        
        renderReportsOnMap();
    } catch (error) {
        console.error('Ошибка инициализации карты:', error);
    }
}

function renderReportsOnMap() {
    if (!appState.map) return;
    
    appState.markers.forEach(marker => {
        appState.map.removeLayer(marker);
    });
    appState.markers = [];
    
    let reports = appState.reports;
    if (appState.currentFilter !== 'all') {
        reports = reports.filter(r => r.type === appState.currentFilter);
    }
    
    reports.forEach(report => {
        if (!report.latitude || !report.longitude) return;
        
        const marker = L.marker([report.latitude, report.longitude])
            .addTo(appState.map)
            .bindPopup(createPopupContent(report));
        
        appState.markers.push(marker);
    });
    
    console.log(`Показано маркеров: ${appState.markers.length}`);
}

function createPopupContent(report) {
    const title = report.title || getTypeLabel(report.type);
    const desc = (report.description || '').trim();
    const shortDesc = desc ? (desc.length > 140 ? `${desc.slice(0, 140)}…` : desc) : 'Без описания';
    const urgencyKey = report.urgency || report.severity || 'medium';

    return `
        <div class="report-popup">
            <h4>${title}</h4>
            <p>${shortDesc}</p>
            <span class="urgency ${urgencyKey}">${getUrgencyLabel(urgencyKey)}</span>
            ${report.photo_url ? `<img src="${report.photo_url}" alt="фото" style="max-width: 150px; margin-top: 8px; border-radius: 4px;">` : ''}
        </div>
    `;
}

function filterReports(filter) {
    appState.currentFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    renderReportsOnMap();
    updateReportsList();
}

function updateReportsList() {
    const container = document.getElementById('reports-list') || document.getElementById('report-details');
    if (!container) return;
    
    let reports = appState.reports;
    if (appState.currentFilter !== 'all') {
        reports = reports.filter(r => r.type === appState.currentFilter);
    }
    
    if (reports.length === 0) {
        container.innerHTML = '<p class="no-reports">Нет отчётов</p>';
        return;
    }
    
    container.innerHTML = reports.map(report => {
        const title = report.title || '';
        const desc = (report.description || '').trim();
        const shortDesc = desc ? (desc.length > 120 ? `${desc.slice(0, 120)}…` : desc) : 'Без описания';
        const urgencyKey = report.urgency || report.severity || 'medium';
        const created = report.created_at ? new Date(report.created_at) : null;
        const createdText = created && !isNaN(created.getTime()) ? created.toLocaleDateString('ru') : '';
        const coordsText = (report.latitude && report.longitude)
            ? `${Number(report.latitude).toFixed(5)}, ${Number(report.longitude).toFixed(5)}`
            : '';

        return `
            <div class="report-card" data-id="${report.id}">
                <div class="report-header">
                    <span class="report-type">${getTypeLabel(report.type)}</span>
                    <span class="report-urgency ${urgencyKey}">${getUrgencyLabel(urgencyKey)}</span>
                </div>
                ${title ? `<div class="report-type" style="font-weight:900; margin-bottom:0.35rem;">${title}</div>` : ''}
                <p class="report-desc">${shortDesc}</p>
                <div class="report-meta">
                    ${coordsText ? `<span>Координаты: ${coordsText}</span>` : ''}
                    ${createdText ? `<span>Дата: ${createdText}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');


    container.onclick = (e) => {
        const card = e.target?.closest?.('.report-card');
        if (!card) return;
        const reportId = card.getAttribute('data-id');
        if (reportId) centerOnReport(reportId);
    };
}

function centerOnReport(reportId) {
    const report = appState.reports.find(r => r.id === reportId);
    if (report && appState.map && report.latitude && report.longitude) {
        appState.map.setView([report.latitude, report.longitude], 15);
        
        const marker = appState.markers.find(m => 
            m.getLatLng().lat === report.latitude && 
            m.getLatLng().lng === report.longitude
        );
        if (marker) marker.openPopup();
    }
}

console.log('Map загружен');
