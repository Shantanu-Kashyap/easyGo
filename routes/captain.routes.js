const express = require('express');
const { body } = require('express-validator');
const captainController = require('../controllers/captain.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be >= 6 chars'),
    body('firstname').notEmpty().withMessage('Firstname required')
  ],
  captainController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password required')
  ],
  captainController.login
);

// Protected routes
router.get('/profile', authMiddleware.authCaptain, captainController.getProfile);
router.get('/captain-stats', authMiddleware.authCaptain, captainController.getCaptainStats);
router.get('/status', authMiddleware.authCaptain, captainController.getCaptainStatus);
router.patch('/status', authMiddleware.authCaptain, captainController.updateStatus);

module.exports = router;