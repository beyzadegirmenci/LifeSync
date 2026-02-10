const User = require('../models/User');

const profileController = {
    
    async getProfile(req, res) {
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
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Failed to get profile' });
        }
    },

    
    async updateProfile(req, res) {
        try {
            const { password, height, weight, age, gender } = req.body;

            
            if (password && password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }

            
            if (gender && !['male', 'female'].includes(gender)) {
                return res.status(400).json({ error: 'Gender must be male or female' });
            }

            const updatedUser = await User.updateProfile(req.userId, {
                password,
                height,
                weight,
                age,
                gender
            });

            if (!updatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                message: 'Profile updated successfully',
                user: {
                    userId: updatedUser.user_id,
                    email: updatedUser.email,
                    firstName: updatedUser.first_name,
                    lastName: updatedUser.last_name,
                    height: updatedUser.height,
                    weight: updatedUser.weight,
                    age: updatedUser.age,
                    gender: updatedUser.gender
                }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }
};

module.exports = profileController;
