const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { pool, connectDB } = require('../src/config/database');
const UserNotificationObserver = require('../src/observers/UserNotificationObserver');

let testUserId;

test.before(async () => {
    await connectDB();

    testUserId = uuidv4();
    const testEmail = `integration.${Date.now()}@lifesync.test`;

    await pool.query(
        `INSERT INTO users (user_id, email, first_name, last_name, password)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId, testEmail, 'Integration', 'Tester', 'dummy_hash']
    );
});

test.after(async () => {
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE user_id = $1', [testUserId]);
    await pool.end();
});

test('DB connection executes queries', async () => {
    const result = await pool.query('SELECT 1 AS ok');
    assert.equal(result.rows[0].ok, 1);
});

test('UserNotificationObserver writes notification to DB', async () => {
    const observer = new UserNotificationObserver(testUserId);

    const event = {
        type: 'PlanCreated',
        title: 'Test Plan Created',
        message: 'Integration test notification',
        referenceId: null
    };

    const inserted = await observer.update(event);

    assert.ok(inserted.notification_id);
    assert.equal(inserted.user_id, testUserId);
    assert.equal(inserted.type, event.type);
    assert.equal(inserted.title, event.title);
    assert.equal(inserted.message, event.message);

    const fetched = await pool.query(
        'SELECT * FROM notifications WHERE notification_id = $1',
        [inserted.notification_id]
    );

    assert.equal(fetched.rows.length, 1);
    assert.equal(fetched.rows[0].user_id, testUserId);
    assert.equal(fetched.rows[0].type, 'PlanCreated');
});
