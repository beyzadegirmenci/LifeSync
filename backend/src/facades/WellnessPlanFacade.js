const { buildStructuredDietPrompt, buildStructuredExercisePrompt, getPeriods } = require('../utils/planPromptBuilder');
const { parseAndValidatePlan } = require('../utils/planValidator');

class WellnessPlanFacade {
    constructor(deps) {
        this.defaultModel = deps.defaultModel;
        this.planModel = deps.planModel || 'llama3.1:8b';
        this.generateRecommendation = deps.generateRecommendation;
        this.callOllama = deps.callOllama;
    }

    async generateSurveyRecommendation(profile, classification) {
        return this.generateRecommendation(profile, classification, this.defaultModel);
    }

    async generateStructuredPlan(profile, classification, duration, planType = 'diet') {
        if (!duration || !['daily', 'weekly', 'monthly'].includes(duration)) {
            return { error: 'Geçersiz zaman aralığı', statusCode: 400 };
        }

        const prompt = planType === 'diet'
            ? buildStructuredDietPrompt(profile, classification, duration)
            : buildStructuredExercisePrompt(profile, classification, duration);

        const expectedPeriods = getPeriods(duration);
        const numPredict = duration === 'monthly' ? 10000 : duration === 'weekly' ? 6000 : 3000;
        const maxAttempts = 2;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const finalPrompt = attempt === 1
                    ? prompt
                    : `${prompt}\n\nKRİTİK UYARI: Önceki yanıtın BOŞTU veya geçersizdi. Her hücreye GERÇEK yemek/egzersiz yaz. BOŞ string ("") yasak. SADECE geçerli JSON döndür.`;

                const rawText = await this.callOllama(finalPrompt, this.planModel, numPredict);
                const result = parseAndValidatePlan(rawText, duration, expectedPeriods, planType);

                if (result.valid) {
                    const key = planType === 'diet' ? 'diet_plan' : 'exercise_plan';
                    return {
                        data: {
                            [key]: result.data,
                            metadata: { model: this.planModel, attempt, source: 'ollama' }
                        },
                        statusCode: 200
                    };
                }

                console.warn(`Plan attempt ${attempt} validation failed: ${result.error}`);
            } catch (error) {
                console.error(`Plan attempt ${attempt} error: ${error.message}`);
            }
        }

        const label = planType === 'diet' ? 'beslenme' : 'egzersiz';
        return {
            error: `AI ${label} planı şu anda üretilemedi. Lütfen tekrar deneyin.`,
            statusCode: 503
        };
    }

    async generateDietPlanResult(profile, classification, duration) {
        return this.generateStructuredPlan(profile, classification, duration, 'diet');
    }

    async generateExercisePlanResult(profile, classification, duration) {
        return this.generateStructuredPlan(profile, classification, duration, 'exercise');
    }
}

module.exports = WellnessPlanFacade;
