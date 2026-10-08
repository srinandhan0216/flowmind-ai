import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// Public Authentication endpoints
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/demo-accounts', AuthController.getDemoAccounts);

// Protected profile endpoint
router.get('/me', authenticate, AuthController.getMe);

export default router;
