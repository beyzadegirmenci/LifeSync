async function dispatchNotification(eventEmitter, observer, emitFn) {
    eventEmitter.attach(observer);

    try {
        return await emitFn();
    } finally {
        eventEmitter.detach(observer);
    }
}

module.exports = {
    dispatchNotification
};