import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, ok } from '../utils/api.js';
import { saveBuffer } from '../config/localStorage.js';
import { isAllowedImageBuffer } from '../middleware/validate.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, callback) => callback(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) });
router.post('/', authenticate, authorize('admin', 'management', 'librarian', 'stock_manager', 'equipment_manager'), upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file || !isAllowedImageBuffer(req.file.buffer, req.file.mimetype)) return res.status(422).json({ success: false, message: 'The uploaded file is not a valid supported image', errors: [] });
  return ok(res, saveBuffer(req.file.buffer, req.file.mimetype, req.body.folder || 'rambura-garcons'), 'Image uploaded', 201);
}));
export default router;
