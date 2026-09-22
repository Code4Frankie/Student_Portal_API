import * as studentModel from '../models/studentModel.js';
import { signStudentToken } from '../middleware/auth.js';
import uploadImage from '../utils/uploadImage.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * POST /api/students
 * Create a new student account. Public endpoint (no auth required to sign up).
 * multipart/form-data fields: name, regNo, email, and an optional
 * `profilePicture` file.
 * Returns the created student plus an auth token to use for future requests.
 */
export async function createStudent(req, res) {
  const { name, regNo, email } = req.body || {};

  const errors = [];
  if (!isNonEmptyString(name)) errors.push('name is required.');
  if (!isNonEmptyString(regNo)) errors.push('regNo is required.');
  if (!isNonEmptyString(email)) errors.push('email is required.');
  if (isNonEmptyString(email) && !EMAIL_RE.test(email.trim())) {
    errors.push('email must be a valid email address.');
  }
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  if (await studentModel.findByRegNo(regNo.trim())) {
    return res.status(409).json({ error: 'A student with this registration number already exists.' });
  }
  if (await studentModel.findByEmail(email.trim().toLowerCase())) {
    return res.status(409).json({ error: 'A student with this email already exists.' });
  }

  // req.file is populated by the multer middleware on the route, if a
  // profilePicture field was included in the multipart form.
  const profilePicture = req.file ? await uploadImage(req.file.path) : null;

  const student = await studentModel.create({
    name: name.trim(),
    regNo: regNo.trim(),
    email: email.trim().toLowerCase(),
    profilePicture,
  });

  const token = signStudentToken(student.id);

  return res.status(201).json({
    message: 'Student account created successfully.',
    student,
    token,
  });
}

/**
 * GET /api/students/:id
 * Retrieve a student's own details. Requires requireAuth + requireSelf.
 */
export async function getStudent(req, res) {
  const id = req.params.id;
  const student = await studentModel.findById(id);

  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  return res.status(200).json({ student });
}

/**
 * PUT /api/students/:id
 * Update a student's profile. `name` is required; regNo and email are
 * immutable and any attempt to change them is rejected. A new
 * `profilePicture` file may optionally be sent (multipart/form-data) to
 * replace the existing one — if omitted, the existing picture is kept.
 * Requires requireAuth + requireSelf.
 */
export async function updateStudent(req, res) {
  const id = req.params.id;
  const existing = await studentModel.findById(id);

  if (!existing) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const body = req.body || {};

  if (Object.prototype.hasOwnProperty.call(body, 'regNo') && body.regNo !== existing.regNo) {
    return res.status(400).json({ error: 'Registration number cannot be changed.' });
  }
  if (Object.prototype.hasOwnProperty.call(body, 'email') && body.email !== existing.email) {
    return res.status(400).json({ error: 'Email address cannot be changed.' });
  }
  if (!isNonEmptyString(body.name)) {
    return res.status(400).json({ error: 'name is required and must be a non-empty string.' });
  }

  const update = { name: body.name.trim() };
  if (req.file) {
    update.profilePicture = await uploadImage(req.file.path);
  }

  const updated = await studentModel.updateProfile(id, update);
  return res.status(200).json({
    message: 'Student profile updated successfully.',
    student: updated,
  });
}

/**
 * DELETE /api/students/:id
 * Permanently delete a student's own account.
 * Requires requireAuth + requireSelf.
 */
export async function deleteStudent(req, res) {
  const id = req.params.id;
  const existing = await studentModel.findById(id);

  if (!existing) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  await studentModel.remove(id);
  return res.status(200).json({ message: 'Student account deleted successfully.' });
}
