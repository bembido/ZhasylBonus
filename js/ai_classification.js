let imageClassifierModel = null;
let imageClassifierLoading = null;

function getCategoryLabel(category) {
    const labels = {
        waste: 'Несанкционированная свалка',
        water: 'Загрязнение воды',
        deforestation: 'Вырубка лесов',
        pollution: 'Загрязнение воздуха',
        other: 'Другое'
    };
    return labels[category] || labels.other;
}

function scoreByKeywords(predictions, fileName = '') {
    const categoryKeywords = {
        waste: ['trash', 'garbage', 'waste', 'bin', 'landfill', 'dumpster', 'litter', 'plastic bag', 'bottle', 'can'],
        water: ['water', 'river', 'lake', 'sea', 'ocean', 'shore', 'beach', 'stream', 'dam', 'wetland'],
        deforestation: ['forest', 'tree', 'wood', 'lumber', 'stump', 'chain saw', 'saw'],
        pollution: ['smoke', 'smog', 'chimney', 'factory', 'ash', 'fire', 'dust']
    };

    const ruHints = {
        waste: ['мусор', 'свалк', 'отход', 'пластик'],
        water: ['река', 'озер', 'вода', 'водоем'],
        deforestation: ['лес', 'дерев', 'выруб'],
        pollution: ['дым', 'загрязн', 'смог']
    };

    const scores = {
        waste: 0,
        water: 0,
        deforestation: 0,
        pollution: 0,
        other: 0.05
    };

    predictions.forEach(prediction => {
        const className = String(prediction.className || '').toLowerCase();
        const confidence = Number(prediction.probability || 0);

        Object.entries(categoryKeywords).forEach(([category, words]) => {
            if (words.some(word => className.includes(word))) {
                scores[category] += confidence;
            }
        });
    });

    const fileNameLower = String(fileName || '').toLowerCase();
    Object.entries(ruHints).forEach(([category, words]) => {
        if (words.some(word => fileNameLower.includes(word))) {
            scores[category] += 0.35;
        }
    });

    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return {
        category: best?.[0] || 'other',
        confidence: Math.max(0, Math.min(1, Number(best?.[1] || 0)))
    };
}

async function ensureImageClassifier() {
    if (imageClassifierModel) return imageClassifierModel;

    if (imageClassifierLoading) {
        return imageClassifierLoading;
    }

    imageClassifierLoading = (async () => {
        if (!window.tf || !window.mobilenet) {
            throw new Error('AI модель не загружена');
        }

        const model = await window.mobilenet.load({ version: 2, alpha: 1.0 });
        imageClassifierModel = model;
        return imageClassifierModel;
    })();

    try {
        return await imageClassifierLoading;
    } finally {
        imageClassifierLoading = null;
    }
}

function readFileAsImage(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('Файл не найден'));
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        const image = new Image();
        image.crossOrigin = 'anonymous';

        image.onload = () => {
            resolve({ image, objectUrl });
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Не удалось прочитать изображение'));
        };

        image.src = objectUrl;
    });
}

async function classifyReportImage(file) {
    const model = await ensureImageClassifier();
    const { image, objectUrl } = await readFileAsImage(file);

    try {
        const predictions = await model.classify(image, 3);
        const scored = scoreByKeywords(predictions, file?.name);

        const topPrediction = predictions[0] || null;
        const confidence = scored.confidence > 0 ? scored.confidence : Number(topPrediction?.probability || 0);

        const category = confidence >= 0.2 ? scored.category : 'other';

        return {
            category,
            categoryLabel: getCategoryLabel(category),
            confidence,
            raw: predictions
        };
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

window.classifyReportImage = classifyReportImage;
window.getCategoryLabel = window.getCategoryLabel || getCategoryLabel;
