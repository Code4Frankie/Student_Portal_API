import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

// These tests need a real MongoDB instance (Atlas or local) to run against.
// Point MONGODB_URI at a *test* database before running `npm test` — e.g.:
//   MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/student_portal_test" npm test
const MONGODB_URI = process.env.MONGODB_URI;

let app;
let server;
let baseUrl;

test.before(async () => {
  if (!MONGODB_URI) {
    console.warn(
      '\nSkipping integration tests: MONGODB_URI is not set.\n' +
        'Set it to a test database connection string to run these tests, e.g.\n' +
        '  MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/student_portal_test" npm test\n'
    );
    return;
  }

  await mongoose.connect(MONGODB_URI);
  // Start from a clean collection so tests are repeatable.
  await mongoose.connection.collection('students').deleteMany({});

  ({ default: app } = await import('../app.js'));
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (!MONGODB_URI) return;
  await mongoose.connection.collection('students').deleteMany({});
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});

async function post(path, body) {
  const res = await fetch(baseUrl + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function get(path, token) {
  const res = await fetch(baseUrl + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: res.status, body: await res.json() };
}

async function put(path, body, token) {
  const res = await fetch(baseUrl + path, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function del(path, token) {
  const res = await fetch(baseUrl + path, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: res.status, body: await res.json() };
}

test('create → get → update → delete happy path', { skip: !MONGODB_URI }, async () => {
  const created = await post('/api/students', {
    name: 'Ada Lovelace',
    regNo: 'REG-TEST-001',
    email: 'ada.test@example.com',
  });
  assert.equal(created.status, 201);
  const { id } = created.body.student;
  const { token } = created.body;

  const fetched = await get(`/api/students/${id}`, token);
  assert.equal(fetched.status, 200);
  assert.equal(fetched.body.student.email, 'ada.test@example.com');

  const updated = await put(`/api/students/${id}`, { name: 'Ada King' }, token);
  assert.equal(updated.status, 200);
  assert.equal(updated.body.student.name, 'Ada King');

  const removed = await del(`/api/students/${id}`, token);
  assert.equal(removed.status, 200);

  const afterDelete = await get(`/api/students/${id}`, token);
  assert.equal(afterDelete.status, 404);
});

test('rejects attempts to change regNo or email', { skip: !MONGODB_URI }, async () => {
  const created = await post('/api/students', {
    name: 'Grace Hopper',
    regNo: 'REG-TEST-002',
    email: 'grace.test@example.com',
  });
  const { id } = created.body.student;
  const { token } = created.body;

  const badRegNo = await put(`/api/students/${id}`, { name: 'Grace H', regNo: 'HACKED' }, token);
  assert.equal(badRegNo.status, 400);

  const badEmail = await put(`/api/students/${id}`, { name: 'Grace H', email: 'hacked@example.com' }, token);
  assert.equal(badEmail.status, 400);
});

test("a student cannot access another student's record", { skip: !MONGODB_URI }, async () => {
  const a = await post('/api/students', {
    name: 'Student A',
    regNo: 'REG-TEST-003',
    email: 'a.test@example.com',
  });
  const b = await post('/api/students', {
    name: 'Student B',
    regNo: 'REG-TEST-004',
    email: 'b.test@example.com',
  });

  const idA = a.body.student.id;
  const tokenB = b.body.token;

  const res = await get(`/api/students/${idA}`, tokenB);
  assert.equal(res.status, 403);
});

test('requests without a token are rejected', { skip: !MONGODB_URI }, async () => {
  const created = await post('/api/students', {
    name: 'No Token',
    regNo: 'REG-TEST-005',
    email: 'notoken.test@example.com',
  });
  const { id } = created.body.student;

  const res = await get(`/api/students/${id}`);
  assert.equal(res.status, 401);
});

test('duplicate regNo/email are rejected on creation', { skip: !MONGODB_URI }, async () => {
  await post('/api/students', {
    name: 'Original',
    regNo: 'REG-TEST-006',
    email: 'dup.test@example.com',
  });
  const dup = await post('/api/students', {
    name: 'Duplicate',
    regNo: 'REG-TEST-006',
    email: 'different@example.com',
  });
  assert.equal(dup.status, 409);
});
