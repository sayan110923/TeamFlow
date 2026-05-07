const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

router.use(authenticate);

router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);

module.exports = router;
