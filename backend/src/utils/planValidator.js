/**
 * Validates and extracts structured plan JSON from LLM output.
 * Ensures the response matches the exact expected schema.
 */

const { DIET_ROW_TITLES, EXERCISE_ROW_TITLES } = require('./planPromptBuilder');

/**
 * Extracts JSON from raw LLM text that may contain markdown fences or extra text.
 */
function extractJSON(raw) {
    if (!raw || typeof raw !== 'string') return null;

    // Try direct parse first
    const trimmed = raw.trim();
    try {
        return JSON.parse(trimmed);
    } catch (_) { /* continue */ }

    // Try extracting from markdown code fence
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
        try {
            return JSON.parse(fenceMatch[1].trim());
        } catch (_) { /* continue */ }
    }

    // Try finding first { ... last }
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
            return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
        } catch (_) { /* continue */ }
    }

    return null;
}

/**
 * Validates the parsed plan object against the expected schema.
 * Repairs recoverable issues (missing items padded, extra items trimmed, missing rows added).
 * Returns { valid: true, data } or { valid: false, error }.
 */
function validatePlanResponse(parsed, expectedPeriodType, expectedPeriods, planType = 'diet') {
    if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'Yanıt JSON olarak ayrıştırılamadı.' };
    }

    const expectedTitles = planType === 'diet' ? DIET_ROW_TITLES : EXERCISE_ROW_TITLES;
    const periodsLength = expectedPeriods.length;

    // Validate rows exist as array
    if (!Array.isArray(parsed.rows) || parsed.rows.length === 0) {
        return { valid: false, error: 'rows dizisi boş veya yok.' };
    }

    // Repair rows count: if fewer rows than expected, add empty rows; if more, trim
    while (parsed.rows.length < expectedTitles.length) {
        parsed.rows.push({ title: expectedTitles[parsed.rows.length], items: [] });
    }
    if (parsed.rows.length > expectedTitles.length) {
        parsed.rows = parsed.rows.slice(0, expectedTitles.length);
    }

    for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i];
        if (!row || typeof row !== 'object') {
            parsed.rows[i] = { title: expectedTitles[i], items: [] };
            continue;
        }
        if (!Array.isArray(row.items)) {
            row.items = [];
        }
        // Ensure all items are non-empty strings
        for (let j = 0; j < row.items.length; j++) {
            if (typeof row.items[j] !== 'string' || !row.items[j].trim()) {
                row.items[j] = '';
            } else {
                row.items[j] = row.items[j].trim();
            }
        }

        // Repair items count: pad by cycling existing items, or trim
        if (row.items.length > 0 && row.items.length < periodsLength) {
            const existing = row.items.filter(c => c && c !== '—' && c !== '-');
            if (existing.length > 0) {
                while (row.items.length < periodsLength) {
                    row.items.push(existing[row.items.length % existing.length]);
                }
            } else {
                while (row.items.length < periodsLength) {
                    row.items.push('');
                }
            }
        } else if (row.items.length === 0) {
            row.items = Array(periodsLength).fill('');
        }
        if (row.items.length > periodsLength) {
            row.items = row.items.slice(0, periodsLength);
        }
    }

    // Sanitize: strip any personal info that leaked into cells
    const personalPatterns = [
        /\b(ya[sş]|cinsiyet|boy|kilo|bmi|hedef|aktivite|uyku|su\s*t[üu]ketimi)\s*:/i,
        /\b\d{2,3}\s*(kg|cm)\b/i,
        /\bkullan[ıi]c[ıi]\b/i
    ];

    for (const row of parsed.rows) {
        for (let j = 0; j < row.items.length; j++) {
            const cell = row.items[j];
            for (const pattern of personalPatterns) {
                if (pattern.test(cell)) {
                    row.items[j] = '';
                }
            }
        }
    }

    // Reject only if more than 50% cells are empty (unrecoverable)
    const totalCells = parsed.rows.reduce((sum, row) => sum + row.items.length, 0);
    const emptyCells = parsed.rows.reduce((sum, row) => sum + row.items.filter(c => !c || c === '—' || c === '-').length, 0);
    if (totalCells > 0 && emptyCells / totalCells > 0.5) {
        return { valid: false, error: `Hücrelerin %${Math.round(emptyCells / totalCells * 100)}'i boş. AI yeterli içerik üretmedi.` };
    }

    // Normalize: force correct periodType and periods
    const normalized = {
        periodType: expectedPeriodType,
        periods: expectedPeriods,
        rows: parsed.rows.map((row, idx) => ({
            title: expectedTitles[idx],
            items: row.items
        }))
    };

    return { valid: true, data: normalized };
}

/**
 * Full pipeline: extract JSON from raw text → validate → return clean data.
 */
function parseAndValidatePlan(rawText, expectedPeriodType, expectedPeriods, planType = 'diet') {
    const parsed = extractJSON(rawText);
    if (!parsed) {
        return { valid: false, error: 'AI yanıtından JSON çıkarılamadı.' };
    }
    return validatePlanResponse(parsed, expectedPeriodType, expectedPeriods, planType);
}

module.exports = {
    extractJSON,
    validatePlanResponse,
    parseAndValidatePlan
};
