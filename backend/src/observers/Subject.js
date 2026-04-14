class Subject {
    constructor() {
        this.observers = [];
    }

    attach(observer) {
        if (!this.observers.includes(observer)) {
            this.observers.push(observer);
            console.log(`[Subject] Observer attached. Total observers: ${this.observers.length}`);
        }
    }

    detach(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
            console.log(`[Subject] Observer detached. Remaining observers: ${this.observers.length}`);
        }
    }

    async notify(eventData) {
        console.log(`[Subject] Notifying ${this.observers.length} observer(s)...`);
        const failures = [];

        for (const observer of this.observers) {
            try {
                await observer.update(eventData);
            } catch (error) {
                failures.push({ observer, error });
                console.error('[Subject] Observer update failed:', error.message);
            }
        }

        return failures;
    }

    getState() {
        throw new Error('getState() must be implemented by subclass');
    }
}

module.exports = Subject;
