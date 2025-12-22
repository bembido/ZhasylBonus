const SUPABASE_URL = 'https://yicktwthqqtahlgswhqd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cNFZEfKY8Oeb0YFtG_waZQ_8zdVFrxJ';

let sb = null;

function initSupabase() {
    try {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('Supabase инициализирован');
            return true;
        }
    } catch (e) {
        console.error('Ошибка инициализации Supabase:', e);
    }
    return false;
}

function checkSupabaseConnection() {
    if (!sb) {
        console.error('Supabase не инициализирован!');
        return false;
    }
    return true;
}

const appState = {
    user: null,
    reports: [],
    currentFilter: 'all',
    map: null,
    markers: [],
    missions: [
        {
            id: 1,
            title: 'Посади 5 деревьев',
            description: 'Помогите восстановлению лесов, посадив минимум 5 деревьев в вашем районе.',
            difficulty: 'easy',
            reward: 50,
            certificate: 'tree-planter',
            duration: '2 недели',
            participants: 234,
            image: 'TR',
            checklist: ['Подготовить место', 'Купить саженцы', 'Посадить деревья', 'Задокументировать']
        },
        {
            id: 2,
            title: 'Очистка парка',
            description: 'Организуйте очистку парка от мусора. Соберите минимум 20 кг отходов.',
            difficulty: 'medium',
            reward: 100,
            certificate: 'eco-cleaner',
            duration: '1 неделя',
            participants: 456,
            image: 'CL',
            checklist: ['Собрать команду', 'Собрать мусор', 'Утилизировать', 'Сфотографировать']
        },
        {
            id: 3,
            title: 'Составь экомаршрут',
            description: 'Создайте маршрут для экотуризма с информацией об экосистемах.',
            difficulty: 'hard',
            reward: 200,
            certificate: 'eco-guide',
            duration: '1 месяц',
            participants: 89,
            image: 'RT',
            checklist: ['Исследовать местность', 'Определить точки', 'Написать описания', 'Создать маршрут']
        },
        {
            id: 4,
            title: 'Обучи друзей',
            description: 'Проведите лекцию о экологии для минимум 10 человек.',
            difficulty: 'medium',
            reward: 75,
            certificate: 'eco-educator',
            duration: '2 недели',
            participants: 178,
            image: 'ED',
            checklist: ['Подготовить материал', 'Пригласить участников', 'Провести занятие', 'Собрать отзывы']
        },
        {
            id: 5,
            title: 'Восстанови реку',
            description: 'Помогите очистить реку или озеро от загрязнений.',
            difficulty: 'hard',
            reward: 250,
            certificate: 'water-guardian',
            duration: '3 недели',
            participants: 67,
            image: 'WR',
            checklist: ['Изучить загрязнение', 'Собрать оборудование', 'Провести очистку', 'Мониторить']
        },
        {
            id: 6,
            title: 'Найди нелегальную свалку',
            description: 'Обнаружьте и задокументируйте нелегальную свалку.',
            difficulty: 'easy',
            reward: 80,
            certificate: 'waste-inspector',
            duration: '1 неделя',
            participants: 123,
            image: 'AL',
            checklist: ['Найти свалку', 'Задокументировать', 'Сообщить в органы', 'Отследить']
        }
    ],
    achievements: [
        { id: 1, name: 'Первый шаг', icon: '1', desc: 'Завершить первую миссию', condition: m => m >= 1 },
        { id: 2, name: 'Волонтёр', icon: '5', desc: 'Завершить 5 миссий', condition: m => m >= 5 },
        { id: 3, name: 'Эко-герой', icon: '10', desc: 'Завершить 10 миссий', condition: m => m >= 10 },
        { id: 4, name: 'Легенда', icon: '25', desc: 'Завершить 25 миссий', condition: m => m >= 25 },
        { id: 5, name: 'Командный игрок', icon: 'T', desc: 'Привлечь 5 волонтёров', condition: r => r >= 5 },
        { id: 6, name: 'Эколог', icon: '1K', desc: 'Заработать 1000 баллов', condition: b => b >= 1000 }
    ],
    organizations: {
        'green-planet': { name: 'Зелёная планета', balance: 6500, target: 10000 },
        'clean-water': { name: 'Чистая вода', balance: 4500, target: 10000 },
        'climate': { name: 'Борьба с потеплением', balance: 8000, target: 10000 },
        'wildlife': { name: 'Защита дикой природы', balance: 5500, target: 10000 },
        'ecosystem': { name: 'Спасение экосистем', balance: 3500, target: 10000 },
        'young-eco': { name: 'Молодые экологи', balance: 7000, target: 10000 }
    }
};

console.log('Config загружен');
