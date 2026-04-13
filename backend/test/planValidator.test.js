const test = require('node:test');
const assert = require('node:assert/strict');

const {
    extractJSON,
    validatePlanResponse,
    parseAndValidatePlan
} = require('../src/utils/planValidator');
const {
    DIET_ROW_TITLES,
    EXERCISE_ROW_TITLES
} = require('../src/utils/planPromptBuilder');

test('extractJSON parses raw JSON markdown fences and surrounding text', () => {
    assert.deepEqual(extractJSON('{"rows":[]}'), { rows: [] });
    assert.deepEqual(extractJSON('```json\n{"rows":[1]}\n```'), { rows: [1] });
    assert.deepEqual(extractJSON('prefix {"rows":["x"]} suffix'), { rows: ['x'] });
    assert.equal(extractJSON('not json at all'), null);
});

test('validatePlanResponse normalizes row titles and trims extra rows/items', () => {
    const result = validatePlanResponse(
        {
            rows: [
                { title: 'Wrong', items: ['Menemen', 'Corba', 'Extra'] },
                { title: 'Wrong2', items: ['Elma', 'Armut', 'Fazla'] },
                { title: 'Wrong3', items: ['Pilav', 'Tavuk', 'Fazla'] },
                { title: 'Wrong4', items: ['Yogurt', 'Findik', 'Fazla'] },
                { title: 'Wrong5', items: ['Balik', 'Sebze', 'Fazla'] },
                { title: 'Extra row', items: ['Silinmeli'] }
            ]
        },
        'daily',
        ['Bugün'],
        'diet'
    );

    assert.equal(result.valid, true);
    assert.deepEqual(result.data.periods, ['Bugün']);
    assert.deepEqual(result.data.rows.map(row => row.title), DIET_ROW_TITLES);
    assert.equal(result.data.rows.length, DIET_ROW_TITLES.length);
    for (const row of result.data.rows) {
        assert.equal(row.items.length, 1);
    }
});

test('validatePlanResponse pads missing rows and cycles existing items to fill periods', () => {
    const result = validatePlanResponse(
        {
            rows: [
                { title: 'Kahvaltı', items: ['Yulaf', 'Omlet'] },
                { title: 'Ara Öğün 1', items: ['Muz'] },
                { title: 'Öğle Yemeği', items: ['Çorba'] },
                { title: 'Ara Öğün 2', items: ['Yoğurt'] }
            ]
        },
        'weekly',
        ['Pzt', 'Sal', 'Çar', 'Per'],
        'diet'
    );

    assert.equal(result.valid, true);
    assert.equal(result.data.rows.length, DIET_ROW_TITLES.length);
    assert.deepEqual(result.data.rows[0].items, ['Yulaf', 'Omlet', 'Yulaf', 'Omlet']);
    assert.deepEqual(result.data.rows[1].items, ['Muz', 'Muz', 'Muz', 'Muz']);
    assert.deepEqual(result.data.rows[2].items, ['Çorba', 'Çorba', 'Çorba', 'Çorba']);
    assert.deepEqual(result.data.rows[4].items, ['', '', '', '']);
});

test('validatePlanResponse sanitizes leaked personal information', () => {
    const result = validatePlanResponse(
        {
            rows: [
                { title: 'Isınma', items: ['yaş: 29', '5 dk yürüyüş'] },
                { title: 'Ana Antrenman', items: ['70 kg deadlift', '3x12 squat'] },
                { title: 'Soğuma', items: ['boy: 180 cm', 'nefes egzersizi'] },
                { title: 'Esneklik/Mobilite', items: ['Hedef: kas kazanımı', 'kalça mobilitesi'] }
            ]
        },
        'daily',
        ['Bugün', 'Yarın'],
        'exercise'
    );

    assert.equal(result.valid, true);
    assert.deepEqual(result.data.rows.map(row => row.title), EXERCISE_ROW_TITLES);
    assert.equal(result.data.rows[0].items[0], '');
    assert.equal(result.data.rows[1].items[0], '');
    assert.equal(result.data.rows[2].items[0], '');
    assert.equal(result.data.rows[3].items[0], '');
    assert.equal(result.data.rows[0].items[1], '5 dk yürüyüş');
});

test('validatePlanResponse rejects payloads with too many empty cells', () => {
    const result = validatePlanResponse(
        {
            rows: [
                { title: 'Kahvaltı', items: ['', '-'] },
                { title: 'Ara Öğün 1', items: ['—', ''] },
                { title: 'Öğle Yemeği', items: ['', 'Pilav'] },
                { title: 'Ara Öğün 2', items: ['', ''] },
                { title: 'Akşam Yemeği', items: ['', ''] }
            ]
        },
        'weekly',
        ['Pzt', 'Sal'],
        'diet'
    );

    assert.equal(result.valid, false);
    assert.match(result.error, /boş/i);
});

test('validatePlanResponse rejects non-object or missing rows payloads', () => {
    assert.equal(validatePlanResponse(null, 'daily', ['Bugün']).valid, false);
    assert.equal(validatePlanResponse({}, 'daily', ['Bugün']).valid, false);
});

test('parseAndValidatePlan runs extraction and normalization together', () => {
    const raw = [
        'Some model chatter',
        '```json',
        JSON.stringify({
            periodType: 'wrong',
            periods: ['wrong'],
            rows: [
                { title: 'x', items: ['Menemen'] },
                { title: 'y', items: ['Badem'] },
                { title: 'z', items: ['Çorba'] },
                { title: 'a', items: ['Yoğurt'] },
                { title: 'b', items: ['Balık'] }
            ]
        }),
        '```'
    ].join('\n');

    const result = parseAndValidatePlan(raw, 'daily', ['Bugün'], 'diet');

    assert.equal(result.valid, true);
    assert.equal(result.data.periodType, 'daily');
    assert.deepEqual(result.data.periods, ['Bugün']);
    assert.deepEqual(result.data.rows.map(row => row.title), DIET_ROW_TITLES);
});

test('parseAndValidatePlan returns a parse error for invalid JSON text', () => {
    const result = parseAndValidatePlan('model failed badly', 'daily', ['Bugün'], 'diet');
    assert.equal(result.valid, false);
    assert.match(result.error, /JSON/i);
});
