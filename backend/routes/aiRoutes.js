import express from 'express';
import { upload, analyzeCSV } from '../controllers/aicontroller.js';

const router = express.Router();

router.post('/analyze-csv', upload.single('file'), analyzeCSV);

export default router;
