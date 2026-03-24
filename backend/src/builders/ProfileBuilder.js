// Builder Pattern: Profil guncelleme payload'ini adim adim olusturur,
// her alanin validasyon/sanitization kurallarini tek noktada toplar.
class ProfileBuilder {
    constructor() {
        this.profile = {};
    }

    withPassword(password, passwordAgain) {
        if (password === undefined || password === null || password === '') {
            return this;
        }

        if (typeof password !== 'string') {
            throw new Error('Password must be a string');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        if (passwordAgain !== undefined && password !== passwordAgain) {
            throw new Error('Password and password confirmation do not match');
        }

        this.profile.password = password;
        return this;
    }

    withHeight(height) {
        return this.#withNumberField('height', height, 1, 300, 'Height');
    }

    withWeight(weight) {
        return this.#withNumberField('weight', weight, 1, 500, 'Weight');
    }

    withAge(age) {
        return this.#withNumberField('age', age, 1, 150, 'Age');
    }

    withGender(gender) {
        if (gender === undefined) {
            return this;
        }

        if (gender === null || gender === '') {
            this.profile.gender = null;
            return this;
        }

        if (!['male', 'female'].includes(gender)) {
            throw new Error('Gender must be male or female');
        }

        this.profile.gender = gender;
        return this;
    }

    #withNumberField(fieldName, value, min, max, label) {
        if (value === undefined) {
            return this;
        }

        if (value === null || value === '') {
            this.profile[fieldName] = null;
            return this;
        }

        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
            throw new Error(`${label} must be an integer between ${min} and ${max}`);
        }

        this.profile[fieldName] = parsed;
        return this;
    }

    build() {
        return { ...this.profile };
    }
}

module.exports = ProfileBuilder;
