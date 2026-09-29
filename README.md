# Job Application Portal - Backend REST API

A robust, production-ready RESTful API for the Job Application Portal, built with the **MERN** stack architecture using Node.js, Express.js, and MongoDB. It implements secure JWT authentication, strict bcrypt password hashing, Multer file upload handling for candidate resumes, duplicate application prevention, recruitment pipeline status tracking, and defensive input validation.

---

## Table of Contents

- [Tech Stack & Dependencies](#tech-stack--dependencies)
- [Project Architecture](#project-architecture)
- [Prerequisites](#prerequisites)
- [Environment Configuration (.env)](#environment-configuration-env)
- [Installation & Setup](#installation--setup)
- [Database Seeding](#database-seeding)
- [Running the Server](#running-the-server)
- [Core Features & Business Logic](#core-features--business-logic)
  - [Password Security Rules](#password-security-rules)
  - [Resume Upload & Validation](#resume-upload--validation)
  - [Duplicate Application Prevention](#duplicate-application-prevention)
  - [Application Status Pipeline](#application-status-pipeline)
  - [Job Listing Status (Open / Closed)](#job-listing-status-open--closed)
- [API Documentation & JSON Samples](#api-documentation--json-samples)
  - [1. Authentication Endpoints](#1-authentication-endpoints)
  - [2. User & Resume Endpoints](#2-user--resume-endpoints)
  - [3. Job Endpoints](#3-job-endpoints)
  - [4. Application Endpoints](#4-application-endpoints)
- [Postman Collection Integration](#postman-collection-integration)

---

## Tech Stack & Dependencies

- **Runtime**: [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- **Framework**: [Express.js](https://expressjs.com/) (v4.19.2) - Fast, minimalist web framework
- **Database & ODM**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) (v8.3.1)
- **Authentication**: [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) (v9.0.2) - Signed JWTs stored in client
- **Password Security**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js) (v2.4.3) - Blowfish password hashing (10 salt rounds)
- **File Uploads**: [multer](https://github.com/expressjs/multer) (v1.4.5-lts.1) - Multipart form data disk storage
- **Security & Headers**: [helmet](https://helmetjs.github.io/) (v7.1.0) - HTTP security headers
- **CORS Handling**: [cors](https://github.com/expressjs/cors) (v2.8.5) - Controlled origin resource sharing
- **Logging**: [morgan](https://github.com/expressjs/morgan) (v1.12.1) - HTTP request logger
- **Environment Management**: [dotenv](https://github.com/motdotla/dotenv) (v16.4.5) - Local configuration isolation

---

## Project Architecture

The backend follows a clean, decoupled **MVC (Model-View-Controller)** pattern:

```
backend/
├── config/
│   └── db.js                 # MongoDB connection logic using Mongoose
├── controllers/
│   ├── applicationController.js # Candidate application submissions & status updates
│   ├── authController.js        # Candidate registration, login, and profile fetching
│   ├── jobController.js         # Job listings, detail retrieval, creation, and status
│   └── userController.js        # Resume upload handling & profile synchronization
├── middleware/
│   ├── authMiddleware.js        # Bearer JWT verification & req.user attachment
│   ├── errorMiddleware.js       # Centralized 404 handler and error response formatter
│   └── uploadMiddleware.js      # Multer file filter (PDF/DOC/DOCX, 5 MB limit)
├── models/
│   ├── Application.js           # Application schema with compound unique index { user, job }
│   ├── Job.js                   # Job posting schema with 'Open' | 'Closed' status enum
│   └── User.js                  # Candidate schema with password validation & pre-save hook
├── routes/
│   ├── applicationRoutes.js     # /api/applications endpoints
│   ├── authRoutes.js            # /api/auth endpoints
│   ├── jobRoutes.js             # /api/jobs endpoints
│   └── userRoutes.js            # /api/users endpoints
├── utils/
│   ├── apiResponse.js           # Standardized JSON response envelope (sendSuccess, sendError)
│   └── generateToken.js         # JWT signing utility with expiration configuration
├── uploads/
│   └── resumes/                 # Uploaded candidate documents (served statically)
├── .env                         # Local environment secrets (not committed to VCS)
├── .env.example                 # Sample environment template
├── package.json                 # Project dependencies and operational scripts
├── seed.js                      # Database seeder for sample roles and verification
└── server.js                    # Express app initialization, middleware, routes, and listen
```

---

## Prerequisites

Ensure the following tools are installed on your workstation:

1. **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
2. **npm**: v9.0.0 or higher (bundled with Node.js)
3. **MongoDB**: Local MongoDB Community Server running on `mongodb://127.0.0.1:27017` or a cloud MongoDB Atlas connection string.

---

## Environment Configuration (.env)

Create a `.env` file in the root of the `backend/` folder:

```env
# Server Port
PORT=5000

# MongoDB Database Connection String
MONGO_URI=mongodb://127.0.0.1:27017/job_portal

# JSON Web Token Configuration
JWT_SECRET=super_secret_jwt_key_job_portal_2026
JWT_EXPIRES_IN=7d

# Allowed Frontend Client Origin (for CORS)
CLIENT_URL=http://localhost:5173
```

A companion `.env.example` file is provided in the repository for reference.

---

## Installation & Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Verify the uploads directory**:
   Ensure `backend/uploads/resumes/` exists so uploaded resumes can be stored on disk. (The upload middleware creates this directory automatically if absent).

---

## Database Seeding

To populate MongoDB with verified, realistic engineering job listings across leading technologies (MERN Stack, Node.js Backend, React.js Frontend, Full Stack, DevOps, Python/FastAPI, Cloud Architect), run the seed script:

```bash
npm run seed
```

Output:
```
MongoDB Connected: 127.0.0.1
Clearing existing job listings...
Seeding 7 verified job listings...
[1] Added: MERN Stack Developer at TechWave Solutions
[2] Added: Node.js Backend Developer at Apex Cloud Systems
[3] Added: React.js Developer at PixelCraft Digital
...
Database seeding completed successfully! Inserted 7 jobs.
```

---

## Running the Server

- **Start in standard mode**:
  ```bash
  npm start
  ```
- **Start in development mode**:
  ```bash
  npm run dev
  ```

Once started, the terminal will indicate:
```
Server running in development mode on port 5000
MongoDB Connected: 127.0.0.1
```

The API base URL is: **`http://localhost:5000/api`**

---

## Core Features & Business Logic

### Password Security Rules
Candidate passwords must pass a strict security validator before being hashed with bcrypt:
- Minimum **8 characters** in length
- At least one **uppercase letter** (`A-Z`)
- At least one **lowercase letter** (`a-z`)
- At least one **numeric digit** (`0-9`)
- At least one **special symbol** (`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`)

### Resume Upload & Validation
- **Allowed MIME types**: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.pdf`, `.doc`, `.docx`).
- **File size limit**: Enforced at **5 MB**. Files exceeding this limit return `400 Bad Request`.
- **Storage**: Saved to `backend/uploads/resumes/` with timestamped, sanitized filenames.
- **Static Access**: Resumes are served publicly at `http://localhost:5000/uploads/resumes/<filename>`.

### Duplicate Application Prevention
- The `Application` schema includes a compound unique index on `{ user: 1, job: 1 }`.
- When a candidate attempts to apply for a job they have already applied to, the controller returns **`409 Conflict`**:
  ```json
  {
    "success": false,
    "message": "You have already applied for this job"
  }
  ```

### Application Status Pipeline
Applications advance through 5 distinct pipeline stages:
- `Applied` (Default initial stage)
- `Under Review`
- `Shortlisted`
- `Selected`
- `Rejected`

Updates can be made via `PATCH /api/applications/:id/status`.

### Job Listing Status (Open / Closed)
Jobs include a `status` field (`'Open'` | `'Closed'`, defaults to `'Open'`).
- Updating a job status to `'Closed'` via `PATCH /api/jobs/:id/status` immediately disables application submissions for that role.
- If a candidate attempts to apply for a closed role, the backend rejects it with **`400 Bad Request`**:
  ```json
  {
    "success": false,
    "message": "This job position is currently closed and no longer accepting applications"
  }
  ```

---

## API Documentation & JSON Samples

All API responses follow a uniform JSON structure:
- **Success**: `{ "success": true, "message": "...", "data": { ... } }`
- **Error**: `{ "success": false, "message": "..." }`

---

### 1. Authentication Endpoints

#### `POST /api/auth/register`
Registers a new candidate account and returns a signed JWT.

- **Request Body**:
```json
{
  "name": "Alex Morgan",
  "email": "alex.morgan@example.com",
  "password": "SecurePass2026!"
}
```

- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "_id": "6748f2b7a918a203f1910a11",
      "name": "Alex Morgan",
      "email": "alex.morgan@example.com",
      "resume": null,
      "createdAt": "2026-09-29T14:15:00.000Z",
      "updatedAt": "2026-09-29T14:15:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NDhmMmI3YTkxOGEyMDNmMTkxMGExMSIsImlhdCI6MTc5MDY5MTMwMCwiZXhwIjoxNzkwODIzM30.zK_abcdef123456"
  }
}
```

- **Validation Failure - Password Too Weak (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Password must be at least 8 characters long, include uppercase and lowercase letters, a number, and a special character"
}
```

- **Duplicate Email (409 Conflict)**:
```json
{
  "success": false,
  "message": "Email is already registered. Please log in instead"
}
```

---

#### `POST /api/auth/login`
Authenticates an existing candidate and returns a signed JWT.

- **Request Body**:
```json
{
  "email": "alex.morgan@example.com",
  "password": "SecurePass2026!"
}
```

- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "6748f2b7a918a203f1910a11",
      "name": "Alex Morgan",
      "email": "alex.morgan@example.com",
      "resume": "/uploads/resumes/resume-alex_morgan-1790691052729-279887761.pdf",
      "createdAt": "2026-09-29T14:15:00.000Z",
      "updatedAt": "2026-09-29T14:20:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

- **Invalid Credentials (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

#### `GET /api/auth/profile`
Retrieves current profile information for the authenticated candidate.

- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "6748f2b7a918a203f1910a11",
      "name": "Alex Morgan",
      "email": "alex.morgan@example.com",
      "resume": "/uploads/resumes/resume-alex_morgan-1790691052729-279887761.pdf",
      "createdAt": "2026-09-29T14:15:00.000Z",
      "updatedAt": "2026-09-29T14:20:00.000Z"
    }
  }
}
```

---

### 2. User & Resume Endpoints

#### `POST /api/users/resume`
Uploads or updates candidate resume document.

- **Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: multipart/form-data`
- **Form Data Field**: `resume` (Binary file: `.pdf`, `.doc`, or `.docx`, up to 5 MB)

- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "data": {
    "resume": "/uploads/resumes/resume-alex_morgan-1790691052729-279887761.pdf",
    "filename": "Alex_Morgan_Senior_Resume.pdf",
    "size": 245812
  }
}
```

- **File Exceeds Size Limit (400 Bad Request)**:
```json
{
  "success": false,
  "message": "File too large. Maximum allowed size is 5 MB"
}
```

---

#### `GET /api/users/resume`
Retrieves the candidate's active uploaded resume metadata and relative file URL.

- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Resume retrieved successfully",
  "data": {
    "hasResume": true,
    "resumeUrl": "/uploads/resumes/resume-alex_morgan-1790691052729-279887761.pdf"
  }
}
```

---

### 3. Job Endpoints

#### `GET /api/jobs`
Fetches all job postings, sorted newest first. Public access.

- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Jobs retrieved successfully",
  "data": {
    "jobs": [
      {
        "_id": "6748f102a918a203f1910001",
        "title": "MERN Stack Developer",
        "company": "TechWave Solutions",
        "location": "San Francisco, CA (Hybrid)",
        "description": "We are looking for an experienced MERN Stack Developer...",
        "requirements": [
          "3+ years of experience with MongoDB, Express.js, React, and Node.js",
          "Strong proficiency in JavaScript (ES6+), HTML5, and CSS3",
          "Experience with RESTful APIs and modern frontend workflows"
        ],
        "status": "Open",
        "createdAt": "2026-09-29T14:00:00.000Z",
        "updatedAt": "2026-09-29T14:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

#### `GET /api/jobs/:id`
Retrieves a single job listing by MongoDB ObjectId. Public access.

- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Job retrieved successfully",
  "data": {
    "job": {
      "_id": "6748f102a918a203f1910001",
      "title": "MERN Stack Developer",
      "company": "TechWave Solutions",
      "location": "San Francisco, CA (Hybrid)",
      "description": "We are looking for an experienced MERN Stack Developer...",
      "requirements": [
        "3+ years of experience with MongoDB, Express.js, React, and Node.js",
        "Strong proficiency in JavaScript (ES6+), HTML5, and CSS3"
      ],
      "status": "Open",
      "createdAt": "2026-09-29T14:00:00.000Z",
      "updatedAt": "2026-09-29T14:00:00.000Z"
    }
  }
}
```

- **Not Found (404 Not Found)**:
```json
{
  "success": false,
  "message": "Job not found"
}
```

---

#### `POST /api/jobs`
Creates a new job listing.

- **Request Body**:
```json
{
  "title": "Cloud Solutions Architect",
  "company": "Apex Cloud Systems",
  "location": "Austin, TX (Remote)",
  "description": "Lead cloud architecture and microservices deployment.",
  "requirements": [
    "5+ years cloud architecture experience",
    "Expertise in Node.js, Docker, and Kubernetes"
  ]
}
```

- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "job": {
      "_id": "6748f102a918a203f1910099",
      "title": "Cloud Solutions Architect",
      "company": "Apex Cloud Systems",
      "location": "Austin, TX (Remote)",
      "description": "Lead cloud architecture and microservices deployment.",
      "requirements": [
        "5+ years cloud architecture experience",
        "Expertise in Node.js, Docker, and Kubernetes"
      ],
      "status": "Open",
      "createdAt": "2026-09-29T14:25:00.000Z",
      "updatedAt": "2026-09-29T14:25:00.000Z"
    }
  }
}
```

---

#### `PATCH /api/jobs/:id/status`
Updates job posting status (`Open` or `Closed`). When closed, new applications are blocked.

- **Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`

- **Request Body**:
```json
{
  "status": "Closed"
}
```

- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Job status updated to Closed",
  "data": {
    "job": {
      "_id": "6748f102a918a203f1910001",
      "title": "MERN Stack Developer",
      "company": "TechWave Solutions",
      "location": "San Francisco, CA (Hybrid)",
      "status": "Closed",
      "createdAt": "2026-09-29T14:00:00.000Z",
      "updatedAt": "2026-09-29T14:40:00.000Z"
    }
  }
}
```

---

### 4. Application Endpoints

#### `POST /api/applications`
Submits an application for a specific job. Automatically attaches candidate's profile resume.

- **Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`

- **Request Body**:
```json
{
  "jobId": "6748f102a918a203f1910001",
  "coverLetter": "I have extensive experience building scalable full-stack web applications and am very excited about this role."
}
```

- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "application": {
      "_id": "6748f992a918a203f1910777",
      "user": {
        "_id": "6748f2b7a918a203f1910a11",
        "name": "Alex Morgan",
        "email": "alex.morgan@example.com",
        "resume": "/uploads/resumes/resume-alex_morgan-1790691052729-279887761.pdf"
      },
      "job": {
        "_id": "6748f102a918a203f1910001",
        "title": "MERN Stack Developer",
        "company": "TechWave Solutions",
        "location": "San Francisco, CA (Hybrid)"
      },
      "resume": "/uploads/resumes/resume-alex_morgan-1790691052729-279887761.pdf",
      "coverLetter": "I have extensive experience building scalable full-stack web applications...",
      "status": "Applied",
      "appliedAt": "2026-09-29T14:30:00.000Z",
      "createdAt": "2026-09-29T14:30:00.000Z",
      "updatedAt": "2026-09-29T14:30:00.000Z"
    }
  }
}
```

- **No Resume on Profile (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Please upload your resume in your profile before applying for this job"
}
```

- **Job is Closed (400 Bad Request)**:
```json
{
  "success": false,
  "message": "This job position is currently closed and no longer accepting applications"
}
```

- **Duplicate Application (409 Conflict)**:
```json
{
  "success": false,
  "message": "You have already applied for this job"
}
```

---

#### `GET /api/applications`
Retrieves all applications submitted by the authenticated candidate.

- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": {
    "applications": [
      {
        "_id": "6748f992a918a203f1910777",
        "job": {
          "_id": "6748f102a918a203f1910001",
          "title": "MERN Stack Developer",
          "company": "TechWave Solutions",
          "location": "San Francisco, CA (Hybrid)"
        },
        "resume": "/uploads/resumes/resume-alex_morgan-1790691052729-279887761.pdf",
        "coverLetter": "I have extensive experience...",
        "status": "Applied",
        "appliedAt": "2026-09-29T14:30:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

#### `GET /api/applications/:id`
Retrieves details of a single application. Restricted to the applicant who submitted it.

- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Application retrieved successfully",
  "data": {
    "application": {
      "_id": "6748f992a918a203f1910777",
      "user": {
        "_id": "6748f2b7a918a203f1910a11",
        "name": "Alex Morgan",
        "email": "alex.morgan@example.com"
      },
      "job": {
        "_id": "6748f102a918a203f1910001",
        "title": "MERN Stack Developer",
        "company": "TechWave Solutions",
        "location": "San Francisco, CA (Hybrid)"
      },
      "resume": "/uploads/resumes/resume-alex_morgan-1790691052729-279887761.pdf",
      "coverLetter": "I have extensive experience...",
      "status": "Applied",
      "appliedAt": "2026-09-29T14:30:00.000Z"
    }
  }
}
```

- **Access Forbidden to Non-Owner (403 Forbidden)**:
```json
{
  "success": false,
  "message": "Access denied. You can only view your own application"
}
```

---

#### `PATCH /api/applications/:id/status`
Updates candidate application stage along the hiring pipeline.

- **Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`

- **Request Body**:
```json
{
  "status": "Under Review"
}
```
*Allowed values*: `"Applied"`, `"Under Review"`, `"Shortlisted"`, `"Rejected"`, `"Selected"`

- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Application status updated to \"Under Review\"",
  "data": {
    "application": {
      "_id": "6748f992a918a203f1910777",
      "status": "Under Review",
      "appliedAt": "2026-09-29T14:30:00.000Z",
      "updatedAt": "2026-09-29T14:45:00.000Z"
    }
  }
}
```

- **Invalid Status (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Invalid status. Status must be one of: Applied, Under Review, Shortlisted, Rejected, Selected"
}
```

---

## Postman Collection Integration

A ready-to-import Postman Collection with automated token saving and flow assertions is located in the project root:
[`../Job_Portal_API.postman_collection.json`](../Job_Portal_API.postman_collection.json)

1. Open Postman and click **Import**.
2. Drag-and-drop `Job_Portal_API.postman_collection.json`.
3. Collection variable `baseUrl` is pre-set to `http://localhost:5000/api`.
4. Run **Register Candidate** or **Login Candidate** &rarr; the test script automatically extracts `token` and sets it for subsequent authenticated requests.
