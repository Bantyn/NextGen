# ⚙️ Backend Developer Guidelines & Operating Instructions

> **Role Target**: Backend Developer (Vanshika / Backend Lead)  
> **Scope**: `Patient Case Tracking/server` & `Documentation/api_doc.md`  
> **Governing Standards**: `Basic Instructions/AGENTS.md` & `Basic Instructions/ANTIGRAVITY.md`

---

## 1. 🛑 CRITICAL BOUNDARIES & STRICT RULES

1. **NO FRONTEND CODE MODIFICATIONS**:
   - Do **NOT** modify, edit, or create files inside the `frontend/` directory under any circumstances.
   - Leave frontend component integration and UI rendering to the Frontend team.
2. **MANDATORY API DOCUMENTATION SYNCHRONIZATION (`api_doc.md`)**:
   - Whenever you create a new API endpoint, modify an existing route, add parameters, or change JSON response schemas, **YOU MUST IMMEDIATELY UPDATE `Documentation/api_doc.md`**.
   - If an API changes in `server/`, the documentation **MUST** reflect the change in real time. (e.g., documenting `GET /api/v1/users` -> *"Get all registered system users with pagination and role filtering"*).
3. **STRICT DECOUPLED 4-TIER ARCHITECTURE**:
   - Always follow the strict backend execution chain:  
     `Routes` ➔ `Middleware` ➔ `Controller` ➔ `Service` ➔ `Repository` ➔ `Database`.
   - ⚠️ **Zero Business Logic in Controllers**: Controllers must strictly handle HTTP request extraction and response formatting. All business logic, calculations, and state transitions **MUST** reside in `services/`.
   - ⚠️ **Zero Database Queries in Controllers or Services**: All Mongoose/MongoDB queries must be centralized in `repositories/`.
4. **SECURITY & DATA VALIDATION**:
   - Never trust client input. Sanitize and validate all incoming request bodies (`req.body`), params (`req.params`), and query strings (`req.query`) using validation middleware before processing.
   - Enforce Role-Based Access Control (`rbacMiddleware.js`) on all protected routes.
   - Never expose system secrets, JWT keys, or database credentials in source code.

---

## 2. 📁 FOLDER STRUCTURE COMPLIANCE

All backend code must follow the **Decoupled 4-Tier Backend Architecture** defined in `Planner/Folder_struct.md`.

```
server/src/
├── config/                  # Database connections (db.js) & Env configs (env.js)
├── constants/               # System Enums (roles.js, patientStatus.js, httpStatus.js)
├── controllers/             # Thin HTTP Request & Response Handlers (NO Business Logic)
├── middleware/              # Authentication, RBAC, Request Validation & Error Handling
├── models/                  # Mongoose Schemas (User.js, Patient.js, CaseHistory.js, etc.)
├── repositories/            # Database Access Layer (Mongoose CRUD & Queries)
├── routes/                  # API Endpoint Specifications & Express Routers
├── services/                # CORE BUSINESS LOGIC LAYER (State Transitions & Rules)
└── utils/                   # JWT tokens, Winston loggers, API Response Wrappers
```

---

## 3. 🛠️ WORKFLOW FOR CREATING & MODIFYING BACKEND APIs

When assigned a backend feature task, follow this step-by-step implementation order:

```
Step 1: Define Mongoose Schema / Model (src/models/)
   │
   ▼
Step 2: Implement Database Queries in Repository Layer (src/repositories/)
   │
   ▼
Step 3: Implement Business Logic & Rules in Service Layer (src/services/)
   │
   ▼
Step 4: Create Thin Request Controller (src/controllers/)
   │
   ▼
Step 5: Define Express Route & Attach Middleware (src/routes/)
   │
   ▼
Step 6: MANDATORY UPDATE to API Documentation (Documentation/api_doc.md)
```

---

## 4. 📝 MANDATORY `api_doc.md` UPDATE REQUIREMENT

Every API endpoint created or modified must be documented in `Documentation/api_doc.md` using the following standardized schema template:

### Standardized API Endpoint Template for `api_doc.md`:

```markdown
### [HTTP METHOD] /api/v1/[endpoint-path]

- **Description**: Concise explanation of what the API endpoint does (e.g., "Get all registered system users with role filtering").
- **Access Control**: [Public / Authenticated / Role-Based (e.g., ADMIN only)]
- **Headers**:
  - `Authorization`: `Bearer <token>`

#### Request Parameters / Body:
```json
{
  "role": "DOCTOR",
  "page": 1,
  "limit": 10
}
```

#### Success Response (200 OK / 201 Created):
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Dr. Smith",
      "email": "smith@hospital.com",
      "role": "DOCTOR"
    }
  ]
}
```

#### Error Response (400 / 401 / 403 / 500):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_ACCESS",
    "message": "Invalid or expired token"
  }
}
```
```

---

## 5. 🧱 LAYER RESPONSIBILITIES BREAKDOWN

### 5.1 Repository Layer (`src/repositories/`)
- **Duty**: Direct interaction with MongoDB/Mongoose.
- **Rules**: Contains `findOne`, `create`, `aggregate`, `updateOne` queries. No HTTP code or business logic allowed here.

### 5.2 Service Layer (`src/services/`)
- **Duty**: Encapsulates all business rules, calculations, patient status transitions, password hashing, and token generation.
- **Rules**: Pure JavaScript/Node.js logic. Never accepts `req` or `res` objects.

### 5.3 Controller Layer (`src/controllers/`)
- **Duty**: Extracts data from `req.body` / `req.params`, invokes Service methods, and formats standardized HTTP responses (`res.status(200).json(...)`).
- **Rules**: Must be thin. Maximum 15-20 lines per controller function.

### 5.4 Routes & Middleware (`src/routes/` & `src/middleware/`)
- **Duty**: Maps HTTP URLs to controllers and runs `authMiddleware`, `rbacMiddleware`, and input validation.

---

## 6. ✅ DEFINITION OF DONE FOR BACKEND TASKS

Before opening a PR or marking a backend task as complete:

- [ ] **No Frontend Modifications**: Verified zero changes in `frontend/` directory.
- [ ] **`api_doc.md` Updated**: Added/Updated documentation in `Documentation/api_doc.md` with complete request/response examples.
- [ ] **4-Tier Architecture Enforced**: Logic divided strictly across `models` ➔ `repositories` ➔ `services` ➔ `controllers` ➔ `routes`.
- [ ] **Zero Logic in Controllers**: Controllers contain no business logic or database queries.
- [ ] **Input Validation & Security**: Routes protected with JWT auth and RBAC middleware.
- [ ] **Error Handling**: Uses central error handling middleware without unhandled promise rejections.
- [ ] **Tested Endpoint**: Tested locally using Postman / cURL with 200 OK and error scenarios verified.
