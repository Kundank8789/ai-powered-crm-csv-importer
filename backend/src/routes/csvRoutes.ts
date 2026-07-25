import express from 'express';
import multer from 'multer';
import { 
  uploadCSV, 
  processCSV,
  suggestMappingsController  // ✅ Import the new controller
} from '../controllers/csvController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Existing routes
router.post('/upload', upload.single('file'), uploadCSV);
router.post('/process', processCSV);

// ✅ New route: Get AI-powered mapping suggestions
router.post('/suggest-mappings', suggestMappingsController);

export default router;