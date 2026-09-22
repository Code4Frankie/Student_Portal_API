import express from 'express';
import {
  createStudent,
  getStudent,
  updateStudent,
  deleteStudent,
} from '../controllers/studentController.js';
import { requireAuth, requireSelf } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import upload from '../config/multer.js';

const router = express.Router();

// Create account — public, no token needed yet (one is issued in the response).
// multipart/form-data: name, regNo, email, optional profilePicture file.
router.post('/', upload.single('profilePicture'), asyncHandler(createStudent));

// All routes below act on a specific student and require:
//   1. A valid Bearer token (requireAuth)
//   2. That token's owner to match the :id in the URL (requireSelf)
router.get('/:id', requireAuth, requireSelf, asyncHandler(getStudent));
router.put('/:id', requireAuth, requireSelf, upload.single('profilePicture'), asyncHandler(updateStudent));
router.delete('/:id', requireAuth, requireSelf, asyncHandler(deleteStudent));

export default router;
