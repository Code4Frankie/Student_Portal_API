import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import morgan from 'morgan';
import multer from 'multer';
import studentsRouter from './routes/students.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.json());
app.use(morgan('dev'));

// Simple browser GUI for manually exercising the API (public/index.html).
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/students', studentsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Central error handler (catches JSON parse errors, Multer errors,
// Mongoose errors, unexpected throws, etc.)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON in request body.' });
  }
  // Multer errors: file too large, wrong field name, etc.
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  // Our own fileFilter in config/multer.js throws a plain Error for
  // disallowed file types.
  if (err.message && err.message.includes('are allowed')) {
    return res.status(400).json({ error: err.message });
  }
  // Mongoose duplicate key error (race-condition safety net; the controller
  // already checks for existing regNo/email before writing).
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ error: `A student with this ${field} already exists.` });
  }
  // Mongoose schema validation error.
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error.' });
});

export default app;
