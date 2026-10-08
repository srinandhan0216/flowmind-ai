import { Router } from 'express';
import { WorkflowController } from '../controllers/workflowController.js';

const router = Router();

// GET /api/workflows - List all workflows from Supabase
router.get('/', WorkflowController.getWorkflows);

// POST /api/workflows - Save a new workflow to Supabase
router.post('/', WorkflowController.createWorkflow);

// POST /api/workflows/execute/:requestId - Execute workflow engine
router.post('/execute/:requestId', WorkflowController.executeWorkflow);

// GET /api/workflows/logs/:requestId - Retrieve workflow audit logs
router.get('/logs/:requestId', WorkflowController.getWorkflowLogs);

export default router;
