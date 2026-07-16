import { Router } from 'express';
import { 
  createField, 
  updateField, 
  getFields, 
  getEntityData, 
  saveEntityData 
} from '../controllers/metadata.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Protect all metadata routes
router.use(authenticateJWT);

// Schema management (Super Admin only)
router.post('/fields', authorizeRole(['Super Admin']), createField);
router.patch('/fields/:id', authorizeRole(['Super Admin']), updateField);

// Schema read (Everyone can read field definitions)
router.get('/fields', getFields);

// Data read/write
router.get('/data/:entityType/:entityId', getEntityData);
router.post('/data/:entityType/:entityId', saveEntityData);

export default router;
