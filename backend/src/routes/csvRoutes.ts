import express from 'express';
import multer from 'multer';
import { uploadCSV, processCSV } from '../controllers/csvController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), uploadCSV);
router.post('/process', processCSV);

export default router;