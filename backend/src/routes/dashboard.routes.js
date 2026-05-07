const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');

router.use(authenticate);

router.get('/', dashboardController.getDashboard);

module.exports = router;
