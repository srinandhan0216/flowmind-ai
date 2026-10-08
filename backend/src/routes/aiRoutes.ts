import { Router } from 'express';
import { AIController } from '../controllers/aiController.js';

const router = Router();

// POST /api/ai/analyze-request
router.post('/analyze-request', AIController.analyzeRequest);

// POST /api/ai/generate-workflow
router.post('/generate-workflow', AIController.generateWorkflow);

export default router;
