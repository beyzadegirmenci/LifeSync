const { getLevelLabelTr } = require('../constants/fitnessLevels');

class BaseStrategy {
    /** @param {'beginner'|'intermediate'|'advanced'} levelKey */
    constructor(levelKey = 'beginner') {
        this.levelKey = levelKey;
    }

    getLevelKey() {
        return this.levelKey;
    }

    /** Türkçe kısa etiket (UI / PDF) */
    getLevelLabel() {
        return getLevelLabelTr(this.levelKey);
    }

    getLevelSpecificInstruction() {
        return '';
    }

    applyToPrompt(prompt, profile, classification) {
        const instruction = this.getLevelSpecificInstruction();
        return instruction ? `${prompt}\n\n${instruction}`.trim() : prompt;
    }

    getDefaultRecommendation() {
        return 'AI önerisi şu anda üretilemedi. Lütfen daha sonra tekrar deneyin.';
    }
}

module.exports = BaseStrategy;
