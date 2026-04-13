const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const authMiddleware = require('../src/middleware/auth');
const tokenBlacklist = require('../src/utils/tokenBlacklist');

function createResponse() {
	return {
		statusCode: 200,
		body: null,
		status(code) {
			this.statusCode = code;
			return this;
		},
		json(payload) {
			this.body = payload;
			return this;
		}
	};
}

test.beforeEach(() => {
	tokenBlacklist.clear();
});

test('auth middleware rejects requests without bearer token', () => {
	const req = { headers: {} };
	const res = createResponse();
	let nextCalled = false;

	authMiddleware(req, res, () => {
		nextCalled = true;
	});

	assert.equal(nextCalled, false);
	assert.equal(res.statusCode, 401);
	assert.deepEqual(res.body, { error: 'Access denied. No token provided.' });
});

test('auth middleware rejects blacklisted tokens', () => {
	const token = jwt.sign({ userId: 'user-1' }, process.env.JWT_SECRET || 'lifesync-dev-secret');
	tokenBlacklist.add(token);

	const req = { headers: { authorization: `Bearer ${token}` } };
	const res = createResponse();

	authMiddleware(req, res, () => {
		throw new Error('next should not be called');
	});

	assert.equal(res.statusCode, 401);
	assert.match(res.body.error, /Oturum/i);
});

test('auth middleware rejects malformed tokens', () => {
	const req = { headers: { authorization: 'Bearer definitely-not-a-jwt' } };
	const res = createResponse();

	authMiddleware(req, res, () => {
		throw new Error('next should not be called');
	});

	assert.equal(res.statusCode, 401);
	assert.deepEqual(res.body, { error: 'Invalid or expired token' });
});

test('auth middleware attaches userId for valid tokens', () => {
	const token = jwt.sign({ userId: 'user-42' }, process.env.JWT_SECRET || 'lifesync-dev-secret');
	const req = { headers: { authorization: `Bearer ${token}` } };
	const res = createResponse();
	let nextCalled = false;

	authMiddleware(req, res, () => {
		nextCalled = true;
	});

	assert.equal(nextCalled, true);
	assert.equal(req.userId, 'user-42');
	assert.equal(res.body, null);
});
