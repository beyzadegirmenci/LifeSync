const User = require('../models/User');
const ProfileBuilder = require('../builders/ProfileBuilder');
const PlanEventEmitter = require('../observers/PlanEventEmitter');
const UserNotificationObserver = require('../observers/UserNotificationObserver');
const { dispatchNotification } = require('../observers/notificationDispatcher');

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
            const profileData = new ProfileBuilder()
                .withPassword(req.body.password, req.body.passwordAgain)
                .withHeight(req.body.height)
                .withWeight(req.body.weight)
                .withAge(req.body.age)
                .withGender(req.body.gender)
                .build();

            const updatedUser = await User.updateProfile(req.userId, profileData);

            if (!updatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            try {
                const eventEmitter = new PlanEventEmitter();
                const observer = new UserNotificationObserver(req.userId);
                await dispatchNotification(
                    eventEmitter,
                    observer,
                    () => eventEmitter.emitProfileUpdated(req.userId)
                );
            } catch (notificationError) {
                console.error('Profile notification error:', notificationError.message);
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
            if (error.message && (
                error.message.includes('Password') ||
                error.message.includes('Gender') ||
                error.message.includes('Height') ||
                error.message.includes('Weight') ||
                error.message.includes('Age')
            )) {
                return res.status(400).json({ error: error.message });
            }

            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }
};

module.exports = profileController;
