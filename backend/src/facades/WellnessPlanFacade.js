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
            const dietPlan = await this.generateDietPlan(prompt, this.defaultModel);
            return { data: { diet_plan: dietPlan }, statusCode: 200 };
        } catch (error) {
            return {
                data: {
                    diet_plan: {
                        raw_text: this.getDefaultDietPlan(),
                        metadata: {
                            model: 'default',
                            done: true,
                            source: 'fallback',
                            error: 'Ollama bağlantısı kurulamadı. Varsayılan plan gösterilmektedir.'
                        }
                    }
                },
                statusCode: 200
            };
        }
    }

    async generateExercisePlanResult(profile, classification, duration) {
        if (!duration || !['daily', 'weekly', 'monthly'].includes(duration)) {
            return { error: 'Geçersiz zaman aralığı', statusCode: 400 };
        }

        const durationLabel = duration === 'daily' ? 'günlük' : duration === 'weekly' ? 'haftalık' : 'aylık';
        const prompt = this.buildExercisePlanPrompt(profile, classification, durationLabel);

        try {
            const exercisePlan = await this.generateExercisePlan(prompt, this.defaultModel, classification?.level || 'Beginner');
            return { data: { exercise_plan: exercisePlan }, statusCode: 200 };
        } catch (error) {
            return {
                data: {
                    exercise_plan: {
                        raw_text: this.getDefaultExercisePlan(classification?.level || 'Beginner'),
                        metadata: {
                            model: 'default',
                            done: true,
                            source: 'fallback',
                            error: 'Ollama bağlantısı kurulamadı. Varsayılan plan gösterilmektedir.'
                        }
                    }
                },
                statusCode: 200
            };
        }
    }
}

module.exports = WellnessPlanFacade;
