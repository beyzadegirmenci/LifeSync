const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');


router.get('/', authMiddleware, dashboardController.getDashboard);
router.post('/survey', authMiddleware, (req, res) => dashboardController.survey(req, res));
router.post('/diet-plan', authMiddleware, (req, res) => dashboardController.dietPlan(req, res));
router.post('/exercise-plan', authMiddleware, (req, res) => dashboardController.exercisePlan(req, res));

module.exports = router;
