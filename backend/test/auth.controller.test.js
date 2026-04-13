const test = require('node:test');
const assert = require('node:assert/strict');

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

function loadAuthController(userStub) {
	const controllerPath = require.resolve('../src/controllers/authController');
	const userPath = require.resolve('../src/models/User');

	delete require.cache[controllerPath];
	require.cache[userPath] = {
		id: userPath,
		filename: userPath,
		loaded: true,
		exports: userStub
	};

	const controller = require('../src/controllers/authController');

	return {
		controller,
		restore() {
			delete require.cache[controllerPath];
			delete require.cache[userPath];
		}
	};
}

test.beforeEach(() => {
	tokenBlacklist.clear();
});

test('register returns 400 when required fields are missing', async () => {
	const { controller, restore } = loadAuthController({
		findByEmail: async () => null,
		create: async () => {
			throw new Error('create should not be called');
		}
	});

	const req = { body: { email: '', firstName: '', lastName: '', password: '' } };
	const res = createResponse();

	try {
		await controller.register(req, res);
		assert.equal(res.statusCode, 400);
		assert.match(res.body.error, /required/i);
	} finally {
		restore();
	}
});

test('register returns 409 when email is already registered', async () => {
	const { controller, restore } = loadAuthController({
		findByEmail: async () => ({ user_id: 'existing-user' }),
		create: async () => {
			throw new Error('create should not be called');
		}
	});

	const req = {
		body: {
			email: 'existing@example.com',
			firstName: 'Existing',
			lastName: 'User',
			password: 'secret123'
		}
	};
	const res = createResponse();

	try {
		await controller.register(req, res);
		assert.equal(res.statusCode, 409);
		assert.match(res.body.error, /already registered/i);
	} finally {
		restore();
	}
});

test('login returns 401 when password check fails', async () => {
	const { controller, restore } = loadAuthController({
		findByEmail: async () => ({
			user_id: 'user-7',
			email: 'user@example.com',
			password: 'hashed-password'
		}),
		comparePassword: async () => false
	});

	const req = { body: { email: 'user@example.com', password: 'wrong-pass' } };
	const res = createResponse();

	try {
		await controller.login(req, res);
		assert.equal(res.statusCode, 401);
		assert.match(res.body.error, /Invalid email or password/i);
	} finally {
		restore();
	}
});

test('logout blacklists the bearer token', async () => {
	const { controller, restore } = loadAuthController({});
	const token = 'sample-token';
	const req = { headers: { authorization: `Bearer ${token}` } };
	const res = createResponse();

	try {
		await controller.logout(req, res);
		assert.equal(res.statusCode, 200);
		assert.equal(tokenBlacklist.has(token), true);
		assert.match(res.body.message, /Logged out successfully/i);
	} finally {
		restore();
	}
});

test('me returns 404 when user cannot be found', async () => {
	const { controller, restore } = loadAuthController({
		findById: async () => null
	});

	const req = { userId: 'missing-user' };
	const res = createResponse();

	try {
		await controller.me(req, res);
		assert.equal(res.statusCode, 404);
		assert.match(res.body.error, /User not found/i);
	} finally {
		restore();
	}
});
