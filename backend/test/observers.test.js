const test = require('node:test');
const assert = require('node:assert/strict');

const Subject = require('../src/observers/Subject');
const Observer = require('../src/observers/Observer');
const PlanEventEmitter = require('../src/observers/PlanEventEmitter');

test('Observer base class requires update to be implemented', () => {
    const observer = new Observer();
    assert.throws(() => observer.update({}), /update\(\) must be implemented by subclass/);
});

test('Subject attach avoids duplicates and detach removes observers', async () => {
    const subject = new Subject();
    const calls = [];
    const observer = {
        update: async payload => {
            calls.push(payload);
        }
    };

    subject.attach(observer);
    subject.attach(observer);
    assert.equal(subject.observers.length, 1);

    await subject.notify({ type: 'Test' });
    assert.equal(calls.length, 1);

    subject.detach(observer);
    assert.equal(subject.observers.length, 0);
});

test('Subject getState must be implemented by subclasses', () => {
    const subject = new Subject();
    assert.throws(() => subject.getState(), /getState\(\) must be implemented by subclass/);
});

test('PlanEventEmitter emits plan created event to attached observers', async () => {
    const emitter = new PlanEventEmitter();
    let received = null;

    emitter.attach({
        update: async event => {
            received = event;
        }
    });

    await emitter.emitPlanCreated(7, 'diet', 'weekly', 99);

    assert.ok(received);
    assert.equal(received.type, 'PlanCreated');
    assert.equal(received.title, 'Diet Plan Weekly');
    assert.equal(received.referenceId, 99);
    assert.equal(received.userId, 7);
    assert.equal(received.planType, 'diet');
    assert.equal(received.duration, 'weekly');
    assert.ok(received.createdAt instanceof Date);
    assert.equal(emitter.getState(), received);
});

test('PlanEventEmitter emits update and profile related notifications', async () => {
    const emitter = new PlanEventEmitter();
    const events = [];

    emitter.attach({
        update: async event => {
            events.push(event);
        }
    });

    await emitter.emitPlanUpdated(2, 'exercise');
    await emitter.emitProfileUpdated(2);
    await emitter.emitSurveyCompleted(2);
    await emitter.emitGoalMissed(2, 'adim');

    assert.deepEqual(events.map(event => event.type), [
        'PlanUpdated',
        'ProfileUpdated',
        'SurveyCompleted',
        'GoalMissed'
    ]);
    assert.match(events[0].message, /güncellendi/i);
    assert.match(events[1].title, /Profil/i);
    assert.match(events[2].message, /anket/i);
    assert.match(events[3].message, /adim/i);
});

test('PlanEventEmitter capitalize handles mixed casing', () => {
    const emitter = new PlanEventEmitter();
    assert.equal(emitter.capitalize('dIeT'), 'Diet');
    assert.equal(emitter.capitalize('weekly'), 'Weekly');
});
