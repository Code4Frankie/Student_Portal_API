# Student Portal API

A REST API for students to create and manage their accounts, built with
Express and Mongoose — following the same project structure as the
supplied `Db_Cohort8` example (`index.js`, `model/`, `controller/`, `routes/`).

## Project structure

```
StudentPortalAPI/
├── index.js
├── package.json
├── model/
│   └── studentModel.js
├── controller/
│   └── studentController.js
└── routes/
    └── studentRoutes.js
```

## Setup

```
npm install
```

Set your MongoDB connection string as an environment variable before starting:

```
MONGO_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=StudentPortal" npm start
```

(Or edit the fallback string directly in `index.js`.)

## Student model

| Field  | Type   | Notes                  |
|--------|--------|-------------------------|
| name   | String | required, editable      |
| regNo  | String | required, unique, **immutable after creation** |
| email  | String | required, unique, **immutable after creation** |

## Endpoints

| Action                  | Method | Route            | Body                              |
|--------------------------|--------|------------------|------------------------------------|
| Create student account   | POST   | `/students`      | `{ "name", "regNo", "email" }`     |
| Get all students         | GET    | `/students`      | —                                   |
| Get one student's details| GET    | `/students/:id`  | —                                   |
| Update profile (name only)| PATCH | `/students/:id`  | `{ "name" }`                        |
| Delete account           | DELETE | `/students/:id`  | —                                   |

### Requirement notes

1. **Create** — `POST /students` takes `name`, `regNo`, and `email`.
2. **Update** — `PATCH /students/:id` only reads `name` from the request
   body. Even if `regNo` or `email` are included in the request, the
   controller ignores them, so those two fields can never change after
   the account is created.
3. **Delete** — `DELETE /students/:id` permanently removes the student
   document from the database.
4. **Get details** — `GET /students/:id` takes the student's `id` as a
   route parameter and returns only that student's record.

## Example requests

Create:
```
POST /students
{
  "name": "Jane Doe",
  "regNo": "REG/2024/001",
  "email": "jane.doe@example.com"
}
```

Update (name only — regNo/email will be ignored even if sent):
```
PATCH /students/<id>
{
  "name": "Jane A. Doe"
}
```

Get one student:
```
GET /students/<id>
```

Delete:
```
DELETE /students/<id>
```
