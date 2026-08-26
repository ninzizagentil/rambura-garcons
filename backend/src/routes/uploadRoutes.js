import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, ok } from '../utils/api.js';
import { uploadBuffer } from '../config/cloudinary.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, callback) => callback(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) });
router.post('/', authenticate, authorize('admin', 'librarian', 'stock_manager'), upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(422).json({ success: false, message: 'A valid image file is required', errors: [] });
  return ok(res, await uploadBuffer(req.file.buffer, req.body.folder || 'rambura-garcons'), 'Image uploaded', 201);
}));
export default router;
