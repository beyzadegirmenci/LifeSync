const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'lifesync-dev-secret';
const JWT_EXPIRES_IN = '7d';

const authController = {
    
    async register(req, res) {
        try {
            const { email, firstName, lastName, password, height, weight, age, gender } = req.body;

            
            if (!email || !firstName || !lastName || !password) {
                return res.status(400).json({ error: 'Email, first name, last name and password are required' });
            }

            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }

            
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({ error: 'Email already registered' });
            }

            
            const user = await User.create({ email, firstName, lastName, password, height, weight, age, gender });

            
            const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    userId: user.user_id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    height: user.height,
                    weight: user.weight,
                    age: user.age,
                    gender: user.gender
                }
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    },

    
    async login(req, res) {
        try {
            const { email, password } = req.body;

            
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            
            const isMatch = await User.comparePassword(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            
            const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            res.json({
                message: 'Login successful',
                token,
                user: {
                    userId: user.user_id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    height: user.height,
                    weight: user.weight,
                    age: user.age,
                    gender: user.gender
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    },

    
    async logout(req, res) {
        
        
        
        res.json({ message: 'Logged out successfully' });
    },

    
    async me(req, res) {
        try {
            const user = await User.findById(req.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                user: {
                    userId: user.user_id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    height: user.height,
                    weight: user.weight,
                    age: user.age,
                    gender: user.gender
                }
            });
        } catch (error) {
            console.error('Me error:', error);
            res.status(500).json({ error: 'Failed to get user info' });
        }
    }
};

module.exports = authController;
