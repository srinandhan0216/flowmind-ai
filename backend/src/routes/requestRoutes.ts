import { Router } from 'express';
import { RequestController } from '../controllers/requestController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// Protect all request routes with JWT Authentication
router.use(authenticate);

// GET /api/requests - List requests permitted by user role
router.get('/', RequestController.getRequests);

// POST /api/requests - Create new request bound to authenticated user
router.post('/', RequestController.createRequest);

// GET /api/requests/:id - Retrieve request by UUID with role permission check
router.get('/:id', RequestController.getRequestById);

// PATCH /api/requests/:id - Update existing request with role permission check
router.patch('/:id', RequestController.updateRequest);

export default router;

