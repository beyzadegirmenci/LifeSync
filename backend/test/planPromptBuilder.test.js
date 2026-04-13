const test = require('node:test');
const assert = require('node:assert/strict');

const {
	DIET_ROW_TITLES,
	EXERCISE_ROW_TITLES,
	getPeriods,
	buildStructuredDietPrompt,
	buildStructuredExercisePrompt
} = require('../src/utils/planPromptBuilder');

const profile = {
	age: 28,
	gender: 'female',
	height_cm: 170,
	weight_kg: 64,
	goal: 'lose_weight',
	diet_preference: 'vegetarian',
	allergy_or_restriction: 'gluten',
	activity_level: 'medium',
	exercise_days_per_week: 4,
	sleep_hours: 7
};

const classification = {
	bmi: 22.1,
	level: 'intermediate'
};

test('getPeriods returns expected labels for daily weekly and monthly durations', () => {
	assert.deepEqual(getPeriods('daily'), ['Bugün']);
	assert.deepEqual(getPeriods('weekly'), ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']);
	assert.equal(getPeriods('monthly').length, 30);
	assert.deepEqual(getPeriods('monthly').slice(0, 3), ['1', '2', '3']);
	assert.equal(getPeriods('monthly')[29], '30');
});

test('diet prompt includes periods titles and restriction guidance', () => {
	const prompt = buildStructuredDietPrompt(profile, classification, 'weekly');

	assert.match(prompt, /periodType: "weekly"/);
	assert.match(prompt, /"Pazartesi"/);
	assert.match(prompt, /"Pazar"/);
	assert.match(prompt, /KISIT: "gluten"/);

	for (const title of DIET_ROW_TITLES) {
		assert.match(prompt, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
	}
});

test('diet prompt omits restriction rule when allergy info is absent', () => {
	const prompt = buildStructuredDietPrompt(
		{ ...profile, allergy_or_restriction: '' },
		classification,
		'daily'
	);

	assert.doesNotMatch(prompt, /KISIT:/);
	assert.match(prompt, /"Bugün"/);
});

test('exercise prompt includes exercise rows and serialized user context', () => {
	const prompt = buildStructuredExercisePrompt(profile, classification, 'daily');

	assert.match(prompt, /Sen bir egzersiz plani motorusun/);
	assert.match(prompt, /"Bugün"/);
	assert.match(prompt, /"bmi":22\.1/);
	assert.match(prompt, /"level":"intermediate"/);

	for (const title of EXERCISE_ROW_TITLES) {
		assert.match(prompt, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
	}
});
