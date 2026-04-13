class Observer {
    update(eventData) {
        throw new Error('update() must be implemented by subclass');
    }
}

module.exports = Observer;
