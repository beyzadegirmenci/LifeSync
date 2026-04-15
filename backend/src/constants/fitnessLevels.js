/** DB CHECK + StrategyFactory ile uyumlu kanonik fitness seviyesi anahtarları */
const LEVEL_KEYS = Object.freeze(['beginner', 'intermediate', 'advanced']);

const LEVEL_LABEL_TR = Object.freeze({
    beginner: 'Başlangıç',
    intermediate: 'Orta',
    advanced: 'İleri'
});

function normalizeFitnessLevel(raw) {
    if (typeof raw !== 'string') {
        return 'beginner';
    }
    const s = raw.trim().toLowerCase();
    if (LEVEL_KEYS.includes(s)) {
        return s;
    }
    const pascal = raw.trim();
    const map = { Beginner: 'beginner', Intermediate: 'intermediate', Advanced: 'advanced' };
    if (map[pascal]) {
        return map[pascal];
    }
    return 'beginner';
}

function getLevelLabelTr(levelKey) {
    const key = normalizeFitnessLevel(levelKey);
    return LEVEL_LABEL_TR[key] || LEVEL_LABEL_TR.beginner;
}

module.exports = {
    LEVEL_KEYS,
    LEVEL_LABEL_TR,
    normalizeFitnessLevel,
    getLevelLabelTr
};
