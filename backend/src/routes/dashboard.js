const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');


router.get('/', authMiddleware, dashboardController.getDashboard);
router.post('/survey', authMiddleware, (req, res) => dashboardController.survey(req, res));
router.post('/diet-plan', authMiddleware, (req, res) => dashboardController.dietPlan(req, res));
router.post('/exercise-plan', authMiddleware, (req, res) => dashboardController.exercisePlan(req, res));
router.get('/notifications', authMiddleware, (req, res) => dashboardController.getNotifications(req, res));
router.post('/notifications/:id/read', authMiddleware, (req, res) => dashboardController.markNotificationAsRead(req, res));
router.get('/notifications/unread/count', authMiddleware, (req, res) => dashboardController.getUnreadNotificationCount(req, res));

module.exports = router;
