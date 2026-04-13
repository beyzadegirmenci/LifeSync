const test = require('node:test');
const assert = require('node:assert/strict');

const ProfileBuilder = require('../src/builders/ProfileBuilder');
const SqlUpdateBuilder = require('../src/builders/SqlUpdateBuilder');

test('ProfileBuilder builds a sanitized profile payload', () => {
    const profile = new ProfileBuilder()
        .withPassword('secret123', 'secret123')
        .withHeight('180')
        .withWeight(75)
        .withAge('29')
        .withGender('male')
        .build();

    assert.deepEqual(profile, {
        password: 'secret123',
        height: 180,
        weight: 75,
        age: 29,
        gender: 'male'
    });
});

test('ProfileBuilder ignores empty password input', () => {
    const profile = new ProfileBuilder()
        .withPassword('', '')
        .withAge(30)
        .build();

    assert.deepEqual(profile, { age: 30 });
});

test('ProfileBuilder converts empty numeric and gender values to null', () => {
    const profile = new ProfileBuilder()
        .withHeight('')
        .withWeight(null)
        .withAge('')
        .withGender('')
        .build();

    assert.deepEqual(profile, {
        height: null,
        weight: null,
        age: null,
        gender: null
    });
});

test('ProfileBuilder rejects short passwords', () => {
    assert.throws(
        () => new ProfileBuilder().withPassword('12345', '12345'),
        /Password must be at least 6 characters/
    );
});

test('ProfileBuilder rejects password confirmation mismatches', () => {
    assert.throws(
        () => new ProfileBuilder().withPassword('secret123', 'secret124'),
        /Password and password confirmation do not match/
    );
});

test('ProfileBuilder rejects out-of-range numbers and invalid genders', () => {
    assert.throws(() => new ProfileBuilder().withHeight(0), /Height must be an integer between 1 and 300/);
    assert.throws(() => new ProfileBuilder().withWeight(501), /Weight must be an integer between 1 and 500/);
    assert.throws(() => new ProfileBuilder().withAge(151), /Age must be an integer between 1 and 150/);
    assert.throws(() => new ProfileBuilder().withGender('other'), /Gender must be male or female/);
});

test('SqlUpdateBuilder accumulates fields and values in order', () => {
    const query = new SqlUpdateBuilder()
        .addField('height', 180)
        .addField('weight', 75)
        .build('id', 42);

    assert.equal(query.setClause, 'height = $1, weight = $2');
    assert.deepEqual(query.values, [180, 75, 42]);
    assert.equal(query.whereParamIndex, 3);
    assert.equal(query.whereColumn, 'id');
});

test('SqlUpdateBuilder reports emptiness correctly', () => {
    const builder = new SqlUpdateBuilder();
    assert.equal(builder.isEmpty(), true);

    builder.addField('age', 25);
    assert.equal(builder.isEmpty(), false);
});

test('SqlUpdateBuilder can build a WHERE clause without update fields', () => {
    const query = new SqlUpdateBuilder().build('user_id', 99);

    assert.equal(query.setClause, '');
    assert.deepEqual(query.values, [99]);
    assert.equal(query.whereParamIndex, 1);
    assert.equal(query.whereColumn, 'user_id');
});
