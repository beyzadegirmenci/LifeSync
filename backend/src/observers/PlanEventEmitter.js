const Subject = require('./Subject');

class PlanEventEmitter extends Subject {
    constructor() {
        super();
        this.currentEvent = null;
    }

    async emitPlanCreated(userId, planType, duration, routineId = null) {
        this.currentEvent = {
            type: 'PlanCreated',
            title: `${this.capitalize(planType)} Plan ${this.capitalize(duration)}`,
            message: `Yeni ${this.capitalize(planType)} planınız ${this.capitalize(duration)} süresi için oluşturuldu.`,
            referenceId: routineId,
            createdAt: new Date(),
            userId: userId,
            planType: planType,
            duration: duration
        };

        console.log(`[PlanEventEmitter] Plan created event for user: ${userId}`);
        await this.notify(this.currentEvent);
    }

    async emitPlanUpdated(userId, planType) {
        this.currentEvent = {
            type: 'PlanUpdated',
            title: `${this.capitalize(planType)} Plan Güncellendi`,
            message: `${this.capitalize(planType)} planınız başarıyla güncellendi.`,
            createdAt: new Date(),
            userId: userId,
            planType: planType
        };

        console.log(`[PlanEventEmitter] Plan updated event for user: ${userId}`);
        await this.notify(this.currentEvent);
    }

    async emitProfileUpdated(userId) {
        this.currentEvent = {
            type: 'ProfileUpdated',
            title: 'Profil Güncellendi',
            message: 'Profiliniz başarıyla güncellendi.',
            createdAt: new Date(),
            userId: userId
        };

        console.log(`[PlanEventEmitter] Profile updated event for user: ${userId}`);
        await this.notify(this.currentEvent);
    }

    async emitSurveyCompleted(userId) {
        this.currentEvent = {
            type: 'SurveyCompleted',
            title: 'Anket Sonucu Hazır',
            message: 'Onboarding anketiniz tamamlandı ve sonuçlarınız oluşturuldu.',
            createdAt: new Date(),
            userId: userId
        };

        console.log(`[PlanEventEmitter] Survey completed event for user: ${userId}`);
        await this.notify(this.currentEvent);
    }

    async emitGoalMissed(userId, goalType) {
        this.currentEvent = {
            type: 'GoalMissed',
            title: 'Hedef Kaçırıldı',
            message: `${goalType} hedefini kaçırdınız. Lütfen planınızı kontrol edin.`,
            createdAt: new Date(),
            userId: userId,
            goalType: goalType
        };

        console.log(`[PlanEventEmitter] Goal missed event for user: ${userId}`);
        await this.notify(this.currentEvent);
    }

    getState() {
        return this.currentEvent;
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
}

module.exports = PlanEventEmitter;
