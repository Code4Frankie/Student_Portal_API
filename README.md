# Student Portal API

A REST API for students to create and manage their own accounts, including
an optional profile picture. Built with **Node.js**, **Express**, and
**MongoDB Atlas** (via **Mongoose**), with **JWT-based auth** ensuring a
student can only ever read, update, or delete their own record. Profile
pictures are uploaded via **Multer** and stored on **Cloudinary**.

## Features

- Create a student account (name, registration number, email, optional profile picture)
- Retrieve a student's own details by ID
- Update a student's profile — **only `name` and the profile picture are
  editable**; `regNo` and `email` are immutable
- Permanently delete a student's own account
- Ownership enforcement: every write/read on `/api/students/:id` requires a
  bearer token, and that token must belong to the student with that `:id`
- A simple browser GUI (`public/index.html`) for manually exercising the API
  without needing Postman

## Tech stack

| Layer            | Choice                          |
|-------------------|----------------------------------|
| Runtime           | Node.js (ES Modules)             |
| Framework         | Express                          |
| Database          | MongoDB Atlas (via Mongoose)     |
| Auth              | JSON Web Tokens (`jsonwebtoken`) |
| File upload       | Multer (temp local storage)      |
| Image storage     | Cloudinary                       |
| Logging           | `morgan`                         |

The codebase uses native **ES Modules** (`import`/`export`) — `package.json`
sets `"type": "module"`.

## Project structure

```
student-portal-api/
├── index.js                       # Entry point — env checks, DB connection, starts the HTTP server
├── app.js                         # Express app (middleware, static GUI, routes, error handling)
├── config/
│   ├── cloudinary.js              # Cloudinary SDK configuration
│   └── multer.js                  # Multer disk-storage config (writes into /uploads)
├── uploads/                       # Temp local storage for incoming files before they go to Cloudinary
├── public/
│   └── index.html                 # Simple browser GUI for testing the API
├── models/
│   └── studentModel.js            # Mongoose schema + data-access functions
├── controllers/
│   └── studentController.js       # Request handling, validation, business rules
├── middleware/
│   └── auth.js                    # JWT issuing + requireAuth / requireSelf guards
├── routes/
│   └── students.js                # /api/students route definitions
├── utils/
│   ├── asyncHandler.js            # Forwards async controller errors to Express
│   └── uploadImage.js             # Uploads a local temp file to Cloudinary, then deletes it
├── test/
│   └── students.test.js           # Automated tests (Node's built-in test runner)
├── postman/
│   ├── Student-Portal-API.postman_collection.json
│   ├── Student-Portal-API.local.postman_environment.json
│   └── Student-Portal-API.render.postman_environment.json
├── render.yaml                    # Render Blueprint for one-click deployment
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Everything lives at the project root — no `src/` folder. The database
connection is inlined directly into `index.js` rather than its own file,
since it's only ever used in one place at startup.

### Why `uploads/` *and* Cloudinary?

Multer can only write incoming files to local disk (or hold them in memory) —
it doesn't talk to Cloudinary directly. So the flow for a profile picture is:

1. Multer receives the multipart upload and writes it to `uploads/` with a
   unique filename.
2. `utils/uploadImage.js` immediately uploads that file to Cloudinary and
   gets back a permanent `secure_url`.
3. The local temp file in `uploads/` is deleted — Cloudinary is the actual
   long-term storage, so the API doesn't keep a duplicate copy on disk.
4. The Cloudinary URL is saved on the student's `profilePicture` field.

`uploads/` is tracked in git (via `.gitkeep`) so the folder exists on a
fresh clone, but its contents are gitignored since they're only ever
temporary.

## Getting started

### Prerequisites
- Node.js 18+ and npm
- A MongoDB Atlas cluster (the free M0 tier works fine)
- A Cloudinary account (the free tier works fine)

### Set up MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Under **Database Access**, create a database user with a username/password.
3. Under **Network Access**, add your current IP (or `0.0.0.0/0` for testing/grading convenience).
4. Under **Database > Connect > Drivers**, copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority
   ```
5. Add a database name to the path, e.g. `.../student_portal?retryWrites=true&w=majority`.

### Set up Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier is enough).
2. On your [Cloudinary console dashboard](https://console.cloudinary.com), copy your
   **Cloud name**, **API Key**, and **API Secret**.

### Setup

```bash
git clone <your-repo-url>
cd student-portal-api
npm install
cp .env.example .env
```

Open `.env` and set:
- `JWT_SECRET` — a long random string, e.g.:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `MONGODB_URI` — your Atlas connection string from the step above.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — from your Cloudinary dashboard.

### Run

```bash
npm start        # production
npm run dev       # auto-restart on file changes (Node's built-in --watch)
```

The API listens on `http://localhost:3000` by default (`PORT` in `.env`).
A health check is available at `GET /health`.

## Try it in the browser (no Postman needed)

Once the server is running, open **http://localhost:3000** in a browser.
It serves `public/index.html`, a small test console where you can:

1. Create an account with a name, reg. no., email, and an optional profile
   picture — the returned ID and token are automatically filled into the
   panel on the right.
2. Get, update (name and/or picture), or delete that account.

This is purely a manual testing aid — the actual API contract is the same
whether you call it from this page, Postman, or curl.

## Testing with Postman

A ready-to-import collection lives in `postman/`:

- `Student-Portal-API.postman_collection.json` — all five requests (health
  check, create, get, update, update-rejected, delete)
- `Student-Portal-API.local.postman_environment.json` — points `baseUrl` at
  `http://localhost:3000`
- `Student-Portal-API.render.postman_environment.json` — points `baseUrl` at
  your Render URL (edit it to match your actual deployed URL once you have one)

**To use it:**
1. In Postman: **File > Import**, and drop in all three JSON files.
2. Select the **Student Portal API - Local** (or **- Render**) environment
   from the environment dropdown, top-right.
3. Run **Create Student** first. Its "Tests" script automatically saves the
   returned `id` and `token` into collection variables — every request below
   it (`Get`, `Update`, `Delete`) already uses those variables in its URL and
   Bearer auth, so you don't have to copy/paste anything by hand.
4. Run **Get / Update / Delete** in any order after that.

The **Create Student** and **Update Student** requests use a `form-data`
body with a disabled `profilePicture` file field — check that field's
checkbox in Postman and choose a file when you want to test the upload.

## Testing against the same database from multiple places

Postman, `public/index.html`, curl, and your deployed Render instance are
all just different **clients** hitting the API — none of them decide which
database gets used. That's entirely controlled by the `MONGODB_URI` the
*server* was started with. So:

- Run locally with `MONGODB_URI` pointing at your Atlas cluster → your local
  server and Postman (pointed at `http://localhost:3000`) both read/write
  that same cluster.
- Deploy to Render with the **same** `MONGODB_URI` value set in Render's
  environment variables → your Render deployment reads/writes that same
  cluster too.

In other words: a student created via curl locally will show up if you
`GET` it from Postman hitting your Render URL, as long as both point at the
same `MONGODB_URI`. If you want local testing and production to stay
separate, use two different databases (e.g. add `_dev` and add a database
name to the URI) and set the matching `MONGODB_URI` in each environment.

## Authentication model

There's no separate login endpoint — a student receives a signed **auth
token** in the response the moment they create their account:

```json
{
  "message": "Student account created successfully.",
  "student": {
    "id": "...",
    "name": "...",
    "regNo": "...",
    "email": "...",
    "profilePicture": "https://res.cloudinary.com/.../profile-pictures/xyz.jpg"
  },
  "token": "eyJhbGciOi..."
}
```

That token must be sent as `Authorization: Bearer <token>` on every
subsequent request that reads or modifies a student record. The token
encodes the student's `id`; the API compares it against the `:id` in the
URL on every request, so:

- Requests **without** a token → `401 Unauthorized`
- Requests **with a token belonging to a different student** → `403 Forbidden`
- Requests for a student `id` that doesn't exist → `404 Not Found`

This is what guarantees "students can only access their own information."

## API Reference

Base URL: `/api/students`

### Create a student account
```
POST /api/students
Content-Type: multipart/form-data

name: Ada Lovelace
regNo: REG-2026-001
email: ada@example.com
profilePicture: <file, optional>
```
**201 Created** → returns the new student record and an auth token.
**400** if a field is missing/invalid, or the uploaded file isn't a supported
image type / exceeds 5 MB. **409** if `regNo` or `email` is already taken.

> A plain `application/json` body (no file) also works if you don't need a
> picture — `{ "name": "...", "regNo": "...", "email": "..." }`.

### Get own details
```
GET /api/students/:id
Authorization: Bearer <token>
```
**200 OK** → the student's own record.
**401** no/invalid token · **403** token belongs to a different student · **404** not found.

### Update profile (name and/or profile picture)
```
PUT /api/students/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data

name: Ada King
profilePicture: <file, optional — omit to keep the existing picture>
```
**200 OK** → the updated record.
**400** if `regNo` or `email` are included and don't match the existing values
(they cannot be changed), if `name` is missing/empty, or if the uploaded
file isn't a supported image type / exceeds 5 MB.

### Delete account
```
DELETE /api/students/:id
Authorization: Bearer <token>
```
**200 OK** → confirmation message. The record is permanently removed.

## Manual test walkthrough (curl)

Student ids are MongoDB ObjectIds (e.g. `507f1f77bcf86cd799439011`), returned
in the response when you create an account.

```bash
# 1. Create an account with a profile picture
curl -X POST http://localhost:3000/api/students \
  -F "name=Ada Lovelace" \
  -F "regNo=REG-2026-001" \
  -F "email=ada@example.com" \
  -F "profilePicture=@/path/to/photo.jpg"
# → save the "id" and "token" from the response

# 2. Get your own details
curl http://localhost:3000/api/students/<id> \
  -H "Authorization: Bearer <token>"

# 3. Update your name (and optionally your picture)
curl -X PUT http://localhost:3000/api/students/<id> \
  -H "Authorization: Bearer <token>" \
  -F "name=Ada King" \
  -F "profilePicture=@/path/to/new-photo.jpg"

# 4. Try changing your email (rejected)
curl -X PUT http://localhost:3000/api/students/<id> \
  -H "Authorization: Bearer <token>" \
  -F "name=Ada King" \
  -F "email=someone-else@example.com"

# 5. Delete your account
curl -X DELETE http://localhost:3000/api/students/<id> \
  -H "Authorization: Bearer <token>"
```

## Automated tests

The suite in `test/students.test.js` runs against a real MongoDB database
(it exercises the full HTTP + Mongoose stack). Point it at a **test**
database — never your production Atlas cluster — before running it:

```bash
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/student_portal_test" npm test
```

If `MONGODB_URI` isn't set, the tests are skipped rather than failing, so
`npm test` is always safe to run. (The existing tests use JSON bodies with
no file upload — Cloudinary credentials aren't required to run them.)

## Design notes / good-practice choices

- **Layered structure** — routes → controllers → models keeps HTTP concerns,
  business rules, and database access each in their own place, without
  needing a `src/` wrapper.
- **Ownership enforcement at the middleware level** (`requireAuth` +
  `requireSelf`) rather than scattered in each controller, so it can't be
  accidentally skipped on a new route.
- **Immutable fields enforced server-side** — the update endpoint rejects
  any request body that tries to change `regNo` or `email`, rather than
  silently ignoring them, so clients get clear feedback.
- **Unique indexes on `regNo` and `email`** at the schema level, plus an
  application-level pre-check, so duplicates are rejected with a clear `409`
  even under race conditions.
- **Upload validation before any DB write** — Multer rejects oversized or
  non-image files with a clear `400` before the request ever reaches the
  database or Cloudinary.
- **No orphaned temp files** — `utils/uploadImage.js` always deletes the
  local file in `uploads/` after attempting the Cloudinary upload, success
  or failure.
- **Centralized error handling** in `app.js` catches malformed JSON, Multer
  errors, Mongoose validation/duplicate-key errors, and unexpected errors
  without leaking stack traces to the client.
- **`.env` for configuration/secrets**, excluded from version control via
  `.gitignore`.

## Pushing this to GitHub

```bash
cd student-portal-api
git init
git add .
git commit -m "Student Portal API: CRUD with profile pictures and ownership-restricted access"
git branch -M main
git remote add origin https://github.com/<your-username>/student-portal-api.git
git push -u origin main
```

## Deploying to Render

This is a standard Node/Express app, so Render's Web Service works out of
the box — `index.js` already reads `process.env.PORT`, which Render sets
automatically.

### Option A — Blueprint (`render.yaml`)

This repo includes a `render.yaml`. In the Render dashboard:
1. **New > Blueprint**, connect this GitHub repo.
2. Render reads `render.yaml` and creates the service automatically.
3. It'll prompt you to fill in the environment variables it left blank
   (`JWT_SECRET`, `MONGODB_URI`, `CLOUDINARY_CLOUD_NAME`,
   `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) — use the same values from
   your local `.env`.

### Option B — Manual Web Service

1. **New > Web Service**, connect this GitHub repo.
2. Runtime: **Node**. Build command: `npm install`. Start command: `npm start`.
3. Under **Environment**, add the same five variables as above.
4. Deploy. Render gives you a URL like `https://student-portal-api.onrender.com`.

### Two things to double-check after deploying

- **MongoDB Atlas Network Access**: Render's free tier doesn't use a fixed
  outbound IP, so Atlas needs to allow it. Under **Network Access** in Atlas,
  add `0.0.0.0/0` (allow from anywhere) — fine for coursework/grading; for a
  real production app you'd want Render's static-IP add-on instead.
- **`uploads/` is not persistent storage on Render** — its filesystem resets
  on every deploy/restart. This isn't a problem here: a file only ever sits
  in `uploads/` for the few hundred milliseconds between Multer writing it
  and `utils/uploadImage.js` pushing it to Cloudinary and deleting it. Just
  don't repurpose `uploads/` to store anything you need to keep — that's
  what Cloudinary is for.

Once deployed, update the `baseUrl` in your
`Student-Portal-API.render.postman_environment.json` (or just edit it
directly in Postman) to your actual Render URL, and everything in the
Postman collection works against the live deployment exactly like it does
locally.

## Possible extensions
- Add password-based login instead of (or alongside) the issue-token-on-signup
  flow, if the assignment later requires re-authentication
- Add a "remove profile picture" option (set it back to `null` and delete
  the Cloudinary asset)
