import { Router } from 'express';
import { importTransactions, importProducts } from '../controllers/dataImport.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateJWT);

router.post('/transactions', upload.single('file'), importTransactions);
router.post('/products', upload.single('file'), importProducts);

export default router;
