import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function signStudentToken(studentId) {
  return jwt.sign({ sub: studentId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies the Bearer token on the request and attaches the decoded
 * student id to req.auth. Does NOT check the token against a specific
 * :id param -- that's done separately by requireSelf, so this middleware
 * can be reused on routes that don't have an :id param.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: 'Missing or malformed Authorization header. Expected: Bearer <token>',
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = { studentId: payload.sub };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Ensures the authenticated student matches the :id route param, i.e.
 * a student can only ever act on their own record. Student ids are
 * MongoDB ObjectId strings, so this is a plain string comparison.
 */
export function requireSelf(req, res, next) {
  const routeId = req.params.id;
  if (req.auth.studentId !== routeId) {
    return res.status(403).json({
      error: 'Forbidden: you may only access or modify your own student record.',
    });
  }
  return next();
}
