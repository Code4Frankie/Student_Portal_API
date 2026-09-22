import fs from 'node:fs/promises';
import cloudinary from '../config/cloudinary.js';

/**
 * Uploads the image at `localPath` (written by multer into /uploads) to
 * Cloudinary, then deletes the local temp file — Cloudinary is the actual
 * long-term storage, so we don't keep a duplicate copy on disk.
 *
 * Returns the Cloudinary secure_url on success. On failure, still attempts
 * to clean up the local temp file before re-throwing.
 */
export default async function uploadImage(localPath) {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'student-portal/profile-pictures',
    });
    return result.secure_url;
  } finally {
    await fs.unlink(localPath).catch(() => {
      // Best-effort cleanup — a leftover temp file isn't fatal.
    });
  }
}
