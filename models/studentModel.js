import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    regNo: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    profilePicture: { type: String, default: null }, // Cloudinary secure_url, or null
  },
  { timestamps: true } // adds createdAt / updatedAt automatically
);

const Student = mongoose.model('Student', studentSchema);

function toPublic(doc) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    name: doc.name,
    regNo: doc.regNo,
    email: doc.email,
    profilePicture: doc.profilePicture,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/** True if the given string is a syntactically valid Mongo ObjectId. */
export function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function create({ name, regNo, email, profilePicture = null }) {
  const doc = await Student.create({ name, regNo, email, profilePicture });
  return toPublic(doc);
}

export async function findById(id) {
  if (!isValidId(id)) return null;
  const doc = await Student.findById(id);
  return toPublic(doc);
}

export async function findByRegNo(regNo) {
  const doc = await Student.findOne({ regNo });
  return toPublic(doc);
}

export async function findByEmail(email) {
  const doc = await Student.findOne({ email });
  return toPublic(doc);
}

/**
 * Updates a student's editable fields. `name` is always required.
 * `profilePicture` is only included in the update when explicitly passed
 * (a new picture was uploaded) — omitting it leaves the existing one intact.
 */
export async function updateProfile(id, { name, profilePicture }) {
  const update = { name };
  if (profilePicture !== undefined) {
    update.profilePicture = profilePicture;
  }
  const doc = await Student.findByIdAndUpdate(id, update, { new: true });
  return toPublic(doc);
}

export async function remove(id) {
  if (!isValidId(id)) return false;
  const result = await Student.findByIdAndDelete(id);
  return Boolean(result);
}
