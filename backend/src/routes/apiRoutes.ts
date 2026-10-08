import { Router } from 'express';
import authRoutes from './authRoutes.js';
import healthRoutes from './healthRoutes.js';
import requestRoutes from './requestRoutes.js';
import aiRoutes from './aiRoutes.js';
import workflowRoutes from './workflowRoutes.js';
import { getAutomations } from '../controllers/automationController.js';

const router = Router();

// Authentication resource under /api/auth
router.use('/auth', authRoutes);

// Health check under /api/health
router.use('/health', healthRoutes);

// Requests resource under /api/requests (Protected)
router.use('/requests', requestRoutes);

// AI Decision Engine under /api/ai
router.use('/ai', aiRoutes);

// Workflow Execution Engine under /api/workflows
router.use('/workflows', workflowRoutes);

// Automations route under /api/automations
router.get('/automations', getAutomations);

export default router;

