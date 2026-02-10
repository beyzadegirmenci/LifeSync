const User = require('../models/User');

const dashboardController = {
    async getDashboard(req, res) {
        try {
            const user = await User.findById(req.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            let bmi = null;
            let bmiCategory = null;
            if (user.height && user.weight) {
                const heightInMeters = user.height / 100;
                bmi = parseFloat((user.weight / (heightInMeters * heightInMeters)).toFixed(1));

                if (bmi < 18.5) bmiCategory = 'Underweight';
                else if (bmi < 25) bmiCategory = 'Normal';
                else if (bmi < 30) bmiCategory = 'Overweight';
                else bmiCategory = 'Obese';
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
                },
                health: {
                    bmi,
                    bmiCategory
                }
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).json({ error: 'Failed to load dashboard' });
        }
    }
};

module.exports = dashboardController;
