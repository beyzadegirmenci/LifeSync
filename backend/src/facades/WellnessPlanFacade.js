class WellnessPlanFacade {
    constructor(deps) {
        this.defaultModel = deps.defaultModel;
        this.generateRecommendation = deps.generateRecommendation;
        this.buildDietPlanPrompt = deps.buildDietPlanPrompt;
        this.generateDietPlan = deps.generateDietPlan;
        this.getDefaultDietPlan = deps.getDefaultDietPlan;
        this.buildExercisePlanPrompt = deps.buildExercisePlanPrompt;
        this.generateExercisePlan = deps.generateExercisePlan;
        this.getDefaultExercisePlan = deps.getDefaultExercisePlan;
    }

    async generateSurveyRecommendation(profile, classification) {
        return this.generateRecommendation(profile, classification, this.defaultModel);
    }

    async generateDietPlanResult(profile, classification, duration) {
        if (!duration || !['daily', 'weekly', 'monthly'].includes(duration)) {
            return { error: 'Geçersiz zaman aralığı', statusCode: 400 };
        }

        const durationLabel = duration === 'daily' ? 'günlük' : duration === 'weekly' ? 'haftalık' : 'aylık';
        const prompt = this.buildDietPlanPrompt(profile, classification, durationLabel, duration);

        try {
            const dietPlan = await this.generateDietPlan(prompt, this.defaultModel, duration);
            return { data: { diet_plan: dietPlan }, statusCode: 200 };
        } catch (error) {
            return {
                error: 'AI beslenme planı şu anda üretilemedi. Lütfen Ollama bağlantısını kontrol edip tekrar deneyin.',
                statusCode: 503
            };
        }
    }

    async generateExercisePlanResult(profile, classification, duration) {
        if (!duration || !['daily', 'weekly', 'monthly'].includes(duration)) {
            return { error: 'Geçersiz zaman aralığı', statusCode: 400 };
        }

        const durationLabel = duration === 'daily' ? 'günlük' : duration === 'weekly' ? 'haftalık' : 'aylık';
        const prompt = this.buildExercisePlanPrompt(profile, classification, durationLabel, duration);

        try {
            const exercisePlan = await this.generateExercisePlan(prompt, this.defaultModel, classification?.level || 'Beginner', duration);
            return { data: { exercise_plan: exercisePlan }, statusCode: 200 };
        } catch (error) {
            return {
                error: 'AI egzersiz planı şu anda üretilemedi. Lütfen Ollama bağlantısını kontrol edip tekrar deneyin.',
                statusCode: 503
            };
        }
    }
}

module.exports = WellnessPlanFacade;
