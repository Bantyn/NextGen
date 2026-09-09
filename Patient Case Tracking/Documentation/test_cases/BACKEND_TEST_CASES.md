# 🧪 MediKiosk AI Clinical Platform — Backend API Test Cases Manual

> **Document Status**: Official Manual Postman QA Test Specification  
> **Target Version**: MediKiosk Backend v1.0.0 (Node.js + Express 5 + MongoDB)  
> **Base URL Format**: `{{BASE_URL}}` (Default: `http://localhost:5000/api/v1`)  
> **Architecture Standard**: Decoupled 4-Tier Backend (`Routes ➔ Middleware ➔ Controller ➔ Service ➔ Repository ➔ Database`)  
> **Standard Response Envelope**:
> - Success: `{ "success": true, "message": "...", "data": {}, "meta": {} }`
> - Error: `{ "success": false, "message": "...", "error": { "code": "...", "details": null } }`

---

## 1. Master Progress Table & Execution Checklist

| ID | Module | Endpoint | Method | Auth Scope | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HLTH-001** | Health | `/api/v1/health` | `GET` | Public | ⬜ |
| **AUTH-001** | Auth | `/api/v1/auth/register` (Admin) | `POST` | Public | ⬜ |
| **AUTH-002** | Auth | `/api/v1/auth/register` (Doctor) | `POST` | Public | ⬜ |
| **AUTH-003** | Auth | `/api/v1/auth/register` (Duplicate Email) | `POST` | Public | ⬜ |
| **AUTH-004** | Auth | `/api/v1/auth/register` (Short Password) | `POST` | Public | ⬜ |
| **AUTH-005** | Auth | `/api/v1/auth/login` (Valid) | `POST` | Public | ⬜ |
| **AUTH-006** | Auth | `/api/v1/auth/login` (Invalid Password) | `POST` | Public | ⬜ |
| **AUTH-007** | Auth | `/api/v1/auth/login` (Non-existent Email) | `POST` | Public | ⬜ |
| **AUTH-008** | Auth | `/api/v1/auth/me` (Valid Token) | `GET` | Authenticated | ⬜ |
| **AUTH-009** | Auth | `/api/v1/auth/me` (Missing Token) | `GET` | None | ⬜ |
| **AUTH-010** | Auth | `/api/v1/auth/me` (Malformed/Expired Token) | `GET` | Invalid Bearer | ⬜ |
| **USER-001** | Users | `/api/v1/users` (Admin View) | `GET` | `ADMIN` Role | ⬜ |
| **USER-002** | Users | `/api/v1/users` (Forbidden Doctor View) | `GET` | `DOCTOR` Role | ⬜ |
| **USER-003** | Users | `/api/v1/users/:id/role` (Promote Staff) | `PUT` | `ADMIN` Role | ⬜ |
| **USER-004** | Users | `/api/v1/users/:id/role` (Invalid Role Enum) | `PUT` | `ADMIN` Role | ⬜ |
| **PAT-001** | Patient | `/api/v1/patients` (Register New) | `POST` | Public / Kiosk | ⬜ |
| **PAT-002** | Patient | `/api/v1/patients` (Missing Required Fields) | `POST` | Public / Kiosk | ⬜ |
| **PAT-003** | Patient | `/api/v1/patients` (Search by Phone) | `GET` | Public / Staff | ⬜ |
| **PAT-004** | Patient | `/api/v1/patients` (Search No Match) | `GET` | Public / Staff | ⬜ |
| **PAT-005** | Patient | `/api/v1/patients/:id` (Get Profile) | `GET` | Public / Staff | ⬜ |
| **PAT-006** | Patient | `/api/v1/patients/:id` (Non-existent Patient) | `GET` | Public / Staff | ⬜ |
| **PAT-007** | Patient | `/api/v1/patients/:id/identities` (Attach ABHA) | `POST` | Public / Staff | ⬜ |
| **CONS-001** | Consent | `/api/v1/consents` (Grant Consent) | `POST` | Public / Kiosk | ⬜ |
| **CONS-002** | Consent | `/api/v1/consents` (Non-existent Patient) | `POST` | Public / Kiosk | ⬜ |
| **CONS-003** | Consent | `/api/v1/consents/:patientId` (Get Consents) | `GET` | Public / Staff | ⬜ |
| **SESS-001** | Session | `/api/v1/sessions` (Init Kiosk Session) | `POST` | Public / Kiosk | ⬜ |
| **SESS-002** | Session | `/api/v1/sessions` (Missing Patient ID) | `POST` | Public / Kiosk | ⬜ |
| **SESS-003** | Session | `/api/v1/sessions/active` (Get Active Queue) | `GET` | Public / Doctor | ⬜ |
| **SESS-004** | Session | `/api/v1/sessions/:id` (Get Session Details) | `GET` | Public / Doctor | ⬜ |
| **SESS-005** | Session | `/api/v1/sessions/:id/status` (Update Status) | `PUT` | Authenticated | ⬜ |
| **MSG-001** | Dialogue | `/api/v1/case-messages` (Post Turn) | `POST` | Public / Kiosk | ⬜ |
| **MSG-002** | Dialogue | `/api/v1/case-messages` (Missing Fields) | `POST` | Public / Kiosk | ⬜ |
| **MSG-003** | Dialogue | `/api/v1/case-messages/:sessionId` (Get History) | `GET` | Public / Doctor | ⬜ |
| **OBS-001** | Observation | `/api/v1/observations` (Store Observation) | `POST` | Public / Kiosk | ⬜ |
| **OBS-002** | Observation | `/api/v1/observations` (Invalid Category Enum) | `POST` | Public / Kiosk | ⬜ |
| **OBS-003** | Observation | `/api/v1/observations/:sessionId` (Get Grouped) | `GET` | Public / Doctor | ⬜ |
| **DOC-001** | Document | `/api/v1/documents/upload` (Multipart File) | `POST` | Public / Kiosk | ⬜ |
| **DOC-002** | Document | `/api/v1/documents/process-base64` (Base64 OCR) | `POST` | Public / Kiosk | ⬜ |
| **REC-001** | Record | `/api/v1/records/generate` (Synthesize SOAP) | `POST` | Authenticated | ⬜ |
| **REC-002** | Record | `/api/v1/records/:id` (Get Record by ID) | `GET` | Authenticated | ⬜ |
| **REC-003** | Record | `/api/v1/records/:id/review` (Doctor Approve) | `PUT` | `DOCTOR` Role | ⬜ |
| **REC-004** | Record | `/api/v1/records/:id/review` (Invalid Status Enum) | `PUT` | `DOCTOR` Role | ⬜ |
| **REC-005** | Record | `/api/v1/records/patient/:patientId` (History) | `GET` | Authenticated | ⬜ |
| **ASST-001** | Assistant | `/api/v1/assistant/quick-actions` | `GET` | Public | ⬜ |
| **ASST-002** | Assistant | `/api/v1/assistant/chat` (Medicine Query) | `POST` | Public | ⬜ |
| **ASST-003** | Assistant | `/api/v1/assistant/chat` (AYUSH Symptom Query) | `POST` | Public | ⬜ |
| **INTK-001** | Intake | `/api/v1/intake/chat` (Multi-turn Triage) | `POST` | Public / Kiosk | ⬜ |
| **SEC-001** | Security | `/api/v1/non-existent-route` (404 Handling) | `GET` | Public | ⬜ |

> **Status Legend**: ⬜ Not Tested | 🟢 Pass | 🔴 Fail | 🟡 Blocked | 🟠 Partially Implemented

---

## 2. Postman Environment Variable Strategy

Create a new Postman Environment named **`MediKiosk Local`** and define the following variables:

| Variable Name | Initial Value | Current Value / Scope | Set By Test Case |
| :--- | :--- | :--- | :--- |
| `BASE_URL` | `http://localhost:5000/api/v1` | Server base address | Manual Setup |
| `ADMIN_TOKEN` | *empty* | Bearer JWT for Administrator | `AUTH-001` or `AUTH-005` |
| `DOCTOR_TOKEN` | *empty* | Bearer JWT for Physician | `AUTH-002` |
| `STAFF_TOKEN` | *empty* | Bearer JWT for Frontdesk Staff | Auto or Manual |
| `ADMIN_USER_ID` | *empty* | MongoDB `_id` of Admin | `AUTH-001` |
| `STAFF_USER_ID` | *empty* | MongoDB `_id` of Staff | `USER-001` |
| `PATIENT_ID` | *empty* | Unique ID (e.g., `PAT-AD16808B`) | `PAT-001` |
| `SESSION_ID` | *empty* | Intake Session (e.g., `SES-3DB65058`) | `SESS-001` |
| `RECORD_ID` | *empty* | SOAP Record (e.g., `REC-948E3B33`) | `REC-001` |

### Recommended Postman Collection Pre-request / Tests Snippet
Add this to Postman **Tests** tab to automatically capture tokens and identifiers:
```javascript
const res = pm.response.json();

if (res.success && res.data) {
    if (res.data.token && pm.info.requestName.includes("Admin")) {
        pm.environment.set("ADMIN_TOKEN", res.data.token);
    }
    if (res.data.token && pm.info.requestName.includes("Doctor")) {
        pm.environment.set("DOCTOR_TOKEN", res.data.token);
    }
    if (res.data.patient_id) {
        pm.environment.set("PATIENT_ID", res.data.patient_id);
    }
    if (res.data.session_id) {
        pm.environment.set("SESSION_ID", res.data.session_id);
    }
    if (res.data.record_id) {
        pm.environment.set("RECORD_ID", res.data.record_id);
    }
}
```

---

## 3. Safe Test Data Dictionary

Use only synthetic dummy data for testing:

* **Admin User**: `admin.qa@medikiosk.ai` / `AdminSecret@2026`
* **Doctor User**: `dr.priya.qa@medikiosk.ai` / `DoctorSecret@2026` (Name: "Dr. Priya Sharma")
* **Staff User**: `nurse.ananya.qa@medikiosk.ai` / `StaffSecret@2026`
* **Dummy Patient**: `Rajesh Patel`, DOB: `1985-04-12`, Phone: `9876543210`, Gender: `MALE`, Address: `OPD Kiosk Block A, Ahmedabad`
* **ABHA Sandbox Reference**: `91-1234-5678-9012`
* **Complaint**: `CHEST_PAIN` / `FEVER`

---

# 4. Detailed Manual API Test Cases

---

### Module 01: Health & Diagnostics

---

#### Test Case ID: HLTH-001
- **Test Name**: Server Health & Database Uptime Check
- **API**: `GET {{BASE_URL}}/health`
- **Purpose**: Verify that the Express server is listening and connected to the local MongoDB database.
- **Authentication**: Public (No auth required)
- **Preconditions**:
  1. Node server is running (`npm start` or `npm run dev` on port 5000).
  2. MongoDB service is active.
- **Headers**:
  ```text
  Accept: application/json
  ```
- **Request Body**: None
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "status": "success",
    "message": "MediKiosk Patient Tracking Server is running on network",
    "timestamp": "2026-09-04T12:53:28.695Z",
    "database": {
      "status": "connected",
      "name": "medikiosk_patient_tracking"
    }
  }
  ```
- **Expected Behavior**: Server responds immediately with uptime timestamp and `database.status == "connected"`.
- **Postman Test**:
  ```javascript
  pm.test("Status code is 200", () => pm.response.to.have.status(200));
  pm.test("DB is connected", () => {
      const res = pm.response.json();
      pm.expect(res.database.status).to.eql("connected");
  });
  ```
- **Pass Criteria**: Status 200, `database.status` is "connected".
- **Fail Criteria**: Connection timeout, status 500, or `database.status` is "disconnected".
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

### Module 02: Authentication & Staff Management

---

#### Test Case ID: AUTH-001
- **Test Name**: Register New Administrator Account
- **API**: `POST {{BASE_URL}}/auth/register`
- **Purpose**: Create the initial system administrator user and issue a valid JWT token.
- **Authentication**: Public
- **Preconditions**: Server and MongoDB running.
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "name": "System Administrator",
    "email": "admin.qa@medikiosk.ai",
    "phone": "+919999900001",
    "password": "AdminSecret@2026",
    "role": "ADMIN"
  }
  ```
- **Expected Status Code**: `201 Created`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "token": "<JWT_STRING>",
      "user": {
        "id": "<MONGO_OBJECT_ID>",
        "name": "System Administrator",
        "email": "admin.qa@medikiosk.ai",
        "phone": "+919999900001",
        "role": "ADMIN"
      }
    }
  }
  ```
- **Database Verification**:
  1. Inspect `users` collection: Document exists with `email: "admin.qa@medikiosk.ai"`.
  2. `password_hash` is a 60-character bcrypt hash (never plaintext).
  3. `password_hash` is NOT returned in the API response JSON.
  4. Inspect `audit_logs`: A log entry for action `USER_REGISTERED` exists.
- **Postman Test**:
  ```javascript
  pm.test("Status is 201 Created", () => pm.response.to.have.status(201));
  pm.test("Token returned", () => {
      const res = pm.response.json();
      pm.expect(res.data.token).to.be.a("string");
      pm.environment.set("ADMIN_TOKEN", res.data.token);
      pm.environment.set("ADMIN_USER_ID", res.data.user.id);
  });
  ```
- **Pass Criteria**: Status 201, JWT returned, user object returned without password hash.
- **Fail Criteria**: Status 400/500, token missing, password hash exposed.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: AUTH-002
- **Test Name**: Register New Physician (Doctor) Account
- **API**: `POST {{BASE_URL}}/auth/register`
- **Purpose**: Register an OPD physician account with role `DOCTOR`.
- **Authentication**: Public
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "name": "Dr. Priya Sharma",
    "email": "dr.priya.qa@medikiosk.ai",
    "phone": "+919876543211",
    "password": "DoctorSecret@2026",
    "role": "DOCTOR"
  }
  ```
- **Expected Status Code**: `201 Created`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "token": "<JWT_STRING>",
      "user": {
        "id": "<MONGO_OBJECT_ID>",
        "name": "Dr. Priya Sharma",
        "email": "dr.priya.qa@medikiosk.ai",
        "phone": "+919876543211",
        "role": "DOCTOR"
      }
    }
  }
  ```
- **Postman Test**:
  ```javascript
  pm.test("Doctor registered with 201", () => pm.response.to.have.status(201));
  const res = pm.response.json();
  pm.environment.set("DOCTOR_TOKEN", res.data.token);
  ```
- **Pass Criteria**: Status 201, user.role is `DOCTOR`, token captured into `DOCTOR_TOKEN`.
- **Fail Criteria**: Status not 201, role not DOCTOR.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: AUTH-003
- **Test Name**: Negative: Register with Duplicate Email
- **API**: `POST {{BASE_URL}}/auth/register`
- **Purpose**: Verify that duplicate registrations with the same email are rejected with HTTP 409 Conflict.
- **Authentication**: Public
- **Preconditions**: `AUTH-001` executed.
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "name": "Duplicate Admin",
    "email": "admin.qa@medikiosk.ai",
    "password": "AnyPassword123!",
    "role": "ADMIN"
  }
  ```
- **Expected Status Code**: `409 Conflict`
- **Expected Response**:
  ```json
  {
    "success": false,
    "message": "A user account with email 'admin.qa@medikiosk.ai' already exists.",
    "error": {
      "code": "EMAIL_EXISTS",
      "details": null
    }
  }
  ```
- **Pass Criteria**: Status 409, error code `EMAIL_EXISTS`.
- **Fail Criteria**: Status 201 or unhandled 500 error.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: AUTH-004
- **Test Name**: Negative: Registration with Short Password (< 6 chars)
- **API**: `POST {{BASE_URL}}/auth/register`
- **Purpose**: Verify Zod input validation catches passwords under 6 characters.
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "name": "Weak Pass User",
    "email": "weak@medikiosk.ai",
    "password": "123"
  }
  ```
- **Expected Status Code**: `422 Unprocessable Entity`
- **Expected Response**:
  ```json
  {
    "success": false,
    "message": "Validation failed on request body",
    "error": {
      "code": "VALIDATION_ERROR",
      "details": [
        {
          "field": "password",
          "message": "Password must be at least 6 characters long"
        }
      ]
    }
  }
  ```
- **Pass Criteria**: Status 422, detailed error highlights `password`.
- **Fail Criteria**: Status 201 or 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: AUTH-005
- **Test Name**: Login with Valid Credentials
- **API**: `POST {{BASE_URL}}/auth/login`
- **Purpose**: Authenticate user and receive fresh JWT token.
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "email": "dr.priya.qa@medikiosk.ai",
    "password": "DoctorSecret@2026"
  }
  ```
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "<JWT_STRING>",
      "user": {
        "id": "<MONGO_OBJECT_ID>",
        "name": "Dr. Priya Sharma",
        "email": "dr.priya.qa@medikiosk.ai",
        "phone": "+919876543211",
        "role": "DOCTOR"
      }
    }
  }
  ```
- **Database Verification**: `audit_logs` record created with action `USER_LOGIN`.
- **Pass Criteria**: Status 200, valid JWT returned.
- **Fail Criteria**: Status 401/500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: AUTH-006
- **Test Name**: Negative: Login with Incorrect Password
- **API**: `POST {{BASE_URL}}/auth/login`
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "email": "dr.priya.qa@medikiosk.ai",
    "password": "WrongPassword999!"
  }
  ```
- **Expected Status Code**: `401 Unauthorized`
- **Expected Response**:
  ```json
  {
    "success": false,
    "message": "Invalid email address or password.",
    "error": {
      "code": "INVALID_CREDENTIALS",
      "details": null
    }
  }
  ```
- **Pass Criteria**: Status 401, error code `INVALID_CREDENTIALS`.
- **Fail Criteria**: Status 200 or 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: AUTH-007
- **Test Name**: Negative: Login with Non-existent Email
- **API**: `POST {{BASE_URL}}/auth/login`
- **Request Body**:
  ```json
  {
    "email": "ghost.user@medikiosk.ai",
    "password": "SomePassword123!"
  }
  ```
- **Expected Status Code**: `401 Unauthorized`
- **Expected Response Code**: `INVALID_CREDENTIALS` (does not leak whether email exists).
- **Pass Criteria**: Status 401.
- **Fail Criteria**: Status 200 or 404 (revealing user enumeration).
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: AUTH-008
- **Test Name**: Get Current User Profile (`/auth/me`)
- **API**: `GET {{BASE_URL}}/auth/me`
- **Authentication**: Authenticated
- **Headers**:
  ```text
  Authorization: Bearer {{DOCTOR_TOKEN}}
  ```
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Profile retrieved successfully",
    "data": {
      "id": "<MONGO_OBJECT_ID>",
      "name": "Dr. Priya Sharma",
      "email": "dr.priya.qa@medikiosk.ai",
      "phone": "+919876543211",
      "role": "DOCTOR",
      "is_active": true,
      "created_at": "<ISO_TIMESTAMP>"
    }
  }
  ```
- **Pass Criteria**: Status 200, returns user details matching token.
- **Fail Criteria**: Status 401/403.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: AUTH-009
- **Test Name**: Negative: `/auth/me` Without Authorization Header
- **API**: `GET {{BASE_URL}}/auth/me`
- **Headers**: None
- **Expected Status Code**: `401 Unauthorized`
- **Expected Response**:
  ```json
  {
    "success": false,
    "message": "Authentication required. Missing or malformed Bearer token.",
    "error": {
      "code": "TOKEN_MISSING",
      "details": null
    }
  }
  ```
- **Pass Criteria**: Status 401, error code `TOKEN_MISSING`.
- **Fail Criteria**: Status 200 or 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: AUTH-010
- **Test Name**: Negative: `/auth/me` with Corrupted / Invalid Token
- **API**: `GET {{BASE_URL}}/auth/me`
- **Headers**:
  ```text
  Authorization: Bearer invalid.jwt.signature12345
  ```
- **Expected Status Code**: `401 Unauthorized`
- **Expected Response**:
  ```json
  {
    "success": false,
    "message": "Invalid authentication token signature.",
    "error": {
      "code": "TOKEN_INVALID",
      "details": null
    }
  }
  ```
- **Pass Criteria**: Status 401, code `TOKEN_INVALID`.
- **Fail Criteria**: Status 200 or 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

### Module 03: User & Staff Administration (RBAC)

---

#### Test Case ID: USER-001
- **Test Name**: List System Users as Administrator
- **API**: `GET {{BASE_URL}}/users?page=1&limit=10`
- **Purpose**: Verify admin can paginate and inspect registered hospital staff.
- **Authentication**: `ADMIN` Role Required
- **Headers**:
  ```text
  Authorization: Bearer {{ADMIN_TOKEN}}
  ```
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Users retrieved successfully",
    "data": [
      {
        "_id": "<ID>",
        "name": "System Administrator",
        "email": "admin.qa@medikiosk.ai",
        "role": "ADMIN",
        "is_active": true
      },
      {
        "_id": "<ID>",
        "name": "Dr. Priya Sharma",
        "email": "dr.priya.qa@medikiosk.ai",
        "role": "DOCTOR",
        "is_active": true
      }
    ],
    "meta": {
      "current_page": 1,
      "page_size": 10,
      "total_records": 2,
      "total_pages": 1,
      "has_next": false,
      "has_prev": false
    }
  }
  ```
- **Postman Test**:
  ```javascript
  pm.test("Status is 200", () => pm.response.to.have.status(200));
  const res = pm.response.json();
  pm.expect(res.data).to.be.an("array");
  pm.expect(res.meta.total_records).to.be.at.least(1);
  ```
- **Pass Criteria**: Status 200, returns users array and pagination metadata.
- **Fail Criteria**: Status 401/403/500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: USER-002
- **Test Name**: Negative: Non-Admin (Doctor) Attempting to Access `/users`
- **API**: `GET {{BASE_URL}}/users`
- **Purpose**: Verify Role-Based Access Control blocks DOCTOR from admin endpoints.
- **Authentication**: `DOCTOR` Role
- **Headers**:
  ```text
  Authorization: Bearer {{DOCTOR_TOKEN}}
  ```
- **Expected Status Code**: `403 Forbidden`
- **Expected Response**:
  ```json
  {
    "success": false,
    "message": "Forbidden: Role 'DOCTOR' is not authorized to access this resource. Required: [ADMIN]",
    "error": {
      "code": "FORBIDDEN_ROLE",
      "details": null
    }
  }
  ```
- **Pass Criteria**: Status 403, error code `FORBIDDEN_ROLE`.
- **Fail Criteria**: Status 200 (Privilege escalation vulnerability).
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: USER-003
- **Test Name**: Update User Role (`/users/:id/role`)
- **API**: `PUT {{BASE_URL}}/users/{{ADMIN_USER_ID}}/role`
- **Purpose**: Admin updates role of a user.
- **Authentication**: `ADMIN` Role
- **Headers**:
  ```text
  Authorization: Bearer {{ADMIN_TOKEN}}
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "role": "STAFF"
  }
  ```
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "User role updated successfully",
    "data": {
      "_id": "{{ADMIN_USER_ID}}",
      "role": "STAFF"
    }
  }
  ```
- **Database Verification**: `audit_logs` record created with action `USER_ROLE_UPDATED`.
- **Postman Pre-request Clean-up**: Make sure to revert admin back to `ADMIN` afterwards.
- **Pass Criteria**: Status 200, user.role is updated.
- **Fail Criteria**: Status 403/500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: USER-004
- **Test Name**: Negative: Update Role with Invalid Enum String
- **API**: `PUT {{BASE_URL}}/users/{{ADMIN_USER_ID}}/role`
- **Headers**:
  ```text
  Authorization: Bearer {{ADMIN_TOKEN}}
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "role": "SUPER_HACKER_ROLE"
  }
  ```
- **Expected Status Code**: `422 Unprocessable Entity`
- **Expected Response Code**: `VALIDATION_ERROR`
- **Pass Criteria**: Status 422.
- **Fail Criteria**: Status 200 or 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

### Module 04: Patient Identity & Profile

---

#### Test Case ID: PAT-001
- **Test Name**: Register New Patient Profile
- **API**: `POST {{BASE_URL}}/patients`
- **Purpose**: Register a walk-in patient at the OPD kiosk and generate a system-wide `patient_id`.
- **Authentication**: Public / Kiosk
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "first_name": "Rajesh",
    "last_name": "Patel",
    "phone": "+919876543210",
    "gender": "MALE",
    "date_of_birth": "1985-04-12",
    "address": "Ahmedabad, Gujarat",
    "emergency_contact": {
      "name": "Sunita Patel",
      "phone": "+919876543219",
      "relationship": "Spouse"
    }
  }
  ```
- **Expected Status Code**: `201 Created`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Patient created successfully",
    "data": {
      "patient_id": "PAT-XXXXXXXX",
      "first_name": "Rajesh",
      "last_name": "Patel",
      "phone": "+919876543210",
      "gender": "MALE",
      "current_status": "CHECKED_IN"
    }
  }
  ```
- **Database Verification**:
  1. Inspect `patients` collection: Document created with uppercase `patient_id` starting with `PAT-`.
  2. `current_status` defaults to `CHECKED_IN`.
- **Postman Test**:
  ```javascript
  pm.test("Status 201 Created", () => pm.response.to.have.status(201));
  const res = pm.response.json();
  pm.expect(res.data.patient_id).to.match(/^PAT-[A-F0-9]{8}$/);
  pm.environment.set("PATIENT_ID", res.data.patient_id);
  ```
- **Pass Criteria**: Status 201, `patient_id` matches format `PAT-XXXXXXXX`.
- **Fail Criteria**: Status 400/500, `patient_id` missing.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: PAT-002
- **Test Name**: Negative: Patient Registration Missing First Name
- **API**: `POST {{BASE_URL}}/patients`
- **Request Body**:
  ```json
  {
    "last_name": "Patel",
    "phone": "+919876543210"
  }
  ```
- **Expected Status Code**: `422 Unprocessable Entity`
- **Expected Response**:
  ```json
  {
    "success": false,
    "message": "Validation failed on request body",
    "error": {
      "code": "VALIDATION_ERROR",
      "details": [
        {
          "field": "first_name",
          "message": "First name is required"
        }
      ]
    }
  }
  ```
- **Pass Criteria**: Status 422, detailed error identifies `first_name`.
- **Fail Criteria**: Status 201.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: PAT-003
- **Test Name**: Search Patient by Phone Number
- **API**: `GET {{BASE_URL}}/patients?search=9876543210`
- **Purpose**: Search for existing patient at OPD registration desk.
- **Preconditions**: `PAT-001` executed.
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Patients retrieved successfully",
    "data": [
      {
        "patient_id": "{{PATIENT_ID}}",
        "first_name": "Rajesh",
        "last_name": "Patel",
        "phone": "+919876543210"
      }
    ],
    "meta": {
      "current_page": 1,
      "page_size": 20,
      "total_records": 1
    }
  }
  ```
- **Pass Criteria**: Status 200, array contains patient with matching phone.
- **Fail Criteria**: Array is empty or status 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: PAT-004
- **Test Name**: Search Patient with Non-Matching Query
- **API**: `GET {{BASE_URL}}/patients?search=NON_EXISTENT_PHONE_0000`
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Patients retrieved successfully",
    "data": [],
    "meta": {
      "total_records": 0
    }
  }
  ```
- **Pass Criteria**: Status 200, `data` is empty array `[]`.
- **Fail Criteria**: Status 404 or 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: PAT-005
- **Test Name**: Retrieve Patient Profile with Identities & Consents
- **API**: `GET {{BASE_URL}}/patients/{{PATIENT_ID}}`
- **Purpose**: Fetch full patient profile including linked ABHA identity and active consents.
- **Preconditions**: `PAT-001` executed.
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Patient retrieved successfully",
    "data": {
      "patient_id": "{{PATIENT_ID}}",
      "first_name": "Rajesh",
      "last_name": "Patel",
      "identities": [],
      "consents": []
    }
  }
  ```
- **Pass Criteria**: Status 200, returns patient object with `identities` and `consents` arrays.
- **Fail Criteria**: Status 404/500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: PAT-006
- **Test Name**: Negative: Retrieve Non-existent Patient ID
- **API**: `GET {{BASE_URL}}/patients/PAT-FFFFFFFF`
- **Expected Status Code**: `404 Not Found`
- **Expected Response**:
  ```json
  {
    "success": false,
    "message": "Patient with identifier 'PAT-FFFFFFFF' was not found.",
    "error": {
      "code": "PATIENT_NOT_FOUND",
      "details": null
    }
  }
  ```
- **Pass Criteria**: Status 404, code `PATIENT_NOT_FOUND`.
- **Fail Criteria**: Status 200 or 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: PAT-007
- **Test Name**: Attach ABHA Identity Reference to Patient
- **API**: `POST {{BASE_URL}}/patients/{{PATIENT_ID}}/identities`
- **Purpose**: Link external ABHA sandbox token to patient profile.
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "identity_type": "ABHA",
    "identity_reference": "91-1234-5678-9012",
    "verification_status": "VERIFIED"
  }
  ```
- **Expected Status Code**: `201 Created`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Patient identity linked successfully",
    "data": {
      "patient_id": "{{PATIENT_ID}}",
      "identity_type": "ABHA",
      "identity_reference": "91-1234-5678-9012",
      "verification_status": "VERIFIED"
    }
  }
  ```
- **Database Verification**: Document created in `patient_identities` collection.
- **Pass Criteria**: Status 201, identity attached.
- **Fail Criteria**: Status 400/500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

### Module 05: Consent Management (DPDP Act 2023)

---

#### Test Case ID: CONS-001
- **Test Name**: Grant Explicit Patient Consent Prior to AI Interview
- **API**: `POST {{BASE_URL}}/consents`
- **Purpose**: Record legally compliant consent for AI case taking.
- **Preconditions**: `PATIENT_ID` exists.
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "patient_id": "{{PATIENT_ID}}",
    "consent_type": "AI_CASE_TAKING",
    "status": "GRANTED"
  }
  ```
- **Expected Status Code**: `201 Created`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Consent granted successfully",
    "data": {
      "patient_id": "{{PATIENT_ID}}",
      "consent_type": "AI_CASE_TAKING",
      "status": "GRANTED"
    }
  }
  ```
- **Database Verification**: Document added to `patient_consents` collection with `granted_at` timestamp.
- **Pass Criteria**: Status 201, status is `GRANTED`.
- **Fail Criteria**: Status 400/500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: CONS-002
- **Test Name**: Negative: Grant Consent for Non-Existent Patient
- **API**: `POST {{BASE_URL}}/consents`
- **Request Body**:
  ```json
  {
    "patient_id": "PAT-NONEXISTENT",
    "consent_type": "AI_CASE_TAKING",
    "status": "GRANTED"
  }
  ```
- **Expected Status Code**: `404 Not Found`
- **Expected Response Code**: `PATIENT_NOT_FOUND`
- **Pass Criteria**: Status 404.
- **Fail Criteria**: Status 201 (Orphan record creation).
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: CONS-003
- **Test Name**: Get Patient Consent Records
- **API**: `GET {{BASE_URL}}/consents/{{PATIENT_ID}}`
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Consents retrieved successfully",
    "data": [
      {
        "patient_id": "{{PATIENT_ID}}",
        "consent_type": "AI_CASE_TAKING",
        "status": "GRANTED"
      }
    ]
  }
  ```
- **Pass Criteria**: Status 200, array includes `AI_CASE_TAKING`.
- **Fail Criteria**: Status 404/500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

### Module 06: Clinical Sessions

---

#### Test Case ID: SESS-001
- **Test Name**: Initialize Kiosk Intake Clinical Session
- **API**: `POST {{BASE_URL}}/sessions`
- **Purpose**: Start an OPD consultation intake session for a checked-in patient.
- **Preconditions**: `PATIENT_ID` exists.
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "patient_id": "{{PATIENT_ID}}",
    "language": "gu-IN",
    "consultation_type": "AYUSH_AYURVEDA",
    "chief_complaint_category": "CHEST_PAIN"
  }
  ```
- **Expected Status Code**: `201 Created`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Clinical session initialized",
    "data": {
      "session_id": "SES-XXXXXXXX",
      "patient_id": "{{PATIENT_ID}}",
      "language": "gu-IN",
      "consultation_type": "AYUSH_AYURVEDA",
      "status": "STARTED"
    }
  }
  ```
- **Database Verification**:
  1. `clinical_sessions` collection: Document created with unique `session_id` starting with `SES-`.
  2. Patient record in `patients` collection: `current_status` updated to `IN_SESSION`.
- **Postman Test**:
  ```javascript
  pm.test("Status 201 Created", () => pm.response.to.have.status(201));
  const res = pm.response.json();
  pm.expect(res.data.session_id).to.match(/^SES-[A-F0-9]{8}$/);
  pm.environment.set("SESSION_ID", res.data.session_id);
  ```
- **Pass Criteria**: Status 201, `session_id` generated, status is `STARTED`.
- **Fail Criteria**: Status 400/500, `session_id` missing.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: SESS-002
- **Test Name**: Negative: Initialize Session Without Patient ID
- **API**: `POST {{BASE_URL}}/sessions`
- **Request Body**:
  ```json
  {
    "language": "hi-IN"
  }
  ```
- **Expected Status Code**: `422 Unprocessable Entity`
- **Expected Response Code**: `VALIDATION_ERROR` (identifying `patient_id` is required).
- **Pass Criteria**: Status 422.
- **Fail Criteria**: Status 201 or 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: SESS-003
- **Test Name**: List Active OPD Kiosk Intake Sessions
- **API**: `GET {{BASE_URL}}/sessions/active`
- **Purpose**: Doctor or triage nurse dashboard view listing waiting patients.
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Active sessions retrieved successfully",
    "data": [
      {
        "session_id": "{{SESSION_ID}}",
        "patient_id": "{{PATIENT_ID}}",
        "status": "STARTED"
      }
    ],
    "meta": {
      "total_records": 1
    }
  }
  ```
- **Pass Criteria**: Status 200, active sessions include `SESSION_ID`.
- **Fail Criteria**: Status 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: SESS-004
- **Test Name**: Retrieve Clinical Session Details
- **API**: `GET {{BASE_URL}}/sessions/{{SESSION_ID}}`
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Session retrieved successfully",
    "data": {
      "session_id": "{{SESSION_ID}}",
      "patient_id": "{{PATIENT_ID}}",
      "language": "gu-IN",
      "status": "STARTED"
    }
  }
  ```
- **Pass Criteria**: Status 200, matching session details.
- **Fail Criteria**: Status 404/500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: SESS-005
- **Test Name**: Update Session Lifecycle Status
- **API**: `PUT {{BASE_URL}}/sessions/{{SESSION_ID}}/status`
- **Purpose**: Advance session status to `READY_FOR_DOCTOR`.
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "status": "READY_FOR_DOCTOR"
  }
  ```
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Session status updated",
    "data": {
      "session_id": "{{SESSION_ID}}",
      "status": "READY_FOR_DOCTOR"
    }
  }
  ```
- **Pass Criteria**: Status 200, session status is `READY_FOR_DOCTOR`.
- **Fail Criteria**: Status 400/500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

### Module 07: AI Case Dialogue & Transcripts

---

#### Test Case ID: MSG-001
- **Test Name**: Post Dialogue Turn Between Patient and AI
- **API**: `POST {{BASE_URL}}/case-messages`
- **Purpose**: Record raw voice or text dialogue statement from patient.
- **Preconditions**: `SESSION_ID` exists.
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "session_id": "{{SESSION_ID}}",
    "sender": "PATIENT",
    "message": "Mane chhati ma dukhavo thay chhe 3 divas thi.",
    "message_type": "TEXT"
  }
  ```
- **Expected Status Code**: `201 Created`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Message posted successfully",
    "data": {
      "session_id": "{{SESSION_ID}}",
      "sender": "PATIENT",
      "message": "Mane chhati ma dukhavo thay chhe 3 divas thi.",
      "message_type": "TEXT"
    }
  }
  ```
- **Database Verification**: Document created in `case_messages` collection.
- **Pass Criteria**: Status 201, message stored.
- **Fail Criteria**: Status 400/500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: MSG-002
- **Test Name**: Negative: Post Dialogue Turn with Missing Session ID
- **API**: `POST {{BASE_URL}}/case-messages`
- **Request Body**:
  ```json
  {
    "sender": "PATIENT",
    "message": "Some message"
  }
  ```
- **Expected Status Code**: `422 Unprocessable Entity`
- **Expected Response Code**: `VALIDATION_ERROR`
- **Pass Criteria**: Status 422.
- **Fail Criteria**: Status 201 or 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: MSG-003
- **Test Name**: Retrieve Chronological Dialogue Transcript for Session
- **API**: `GET {{BASE_URL}}/case-messages/{{SESSION_ID}}`
- **Purpose**: Allow doctor to read the raw conversation if needed.
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Session dialogue messages retrieved",
    "data": [
      {
        "session_id": "{{SESSION_ID}}",
        "sender": "PATIENT",
        "message": "Mane chhati ma dukhavo thay chhe 3 divas thi."
      }
    ]
  }
  ```
- **Pass Criteria**: Status 200, array sorted in chronological order.
- **Fail Criteria**: Status 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

### Module 08: Structured Clinical Observations

---

#### Test Case ID: OBS-001
- **Test Name**: Store AI-Extracted Clinical Observation
- **API**: `POST {{BASE_URL}}/observations`
- **Purpose**: Persist a discrete medical fact (symptom, medication, allergy) extracted by AI.
- **Preconditions**: `SESSION_ID` exists.
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "session_id": "{{SESSION_ID}}",
    "category": "SYMPTOM",
    "name": "Chest Pain",
    "value": "Moderate retrosternal radiating",
    "unit": "3 Days",
    "confidence": 0.95,
    "source": "AI_DIALOGUE"
  }
  ```
- **Expected Status Code**: `201 Created`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Observation stored successfully",
    "data": {
      "session_id": "{{SESSION_ID}}",
      "category": "SYMPTOM",
      "name": "Chest Pain",
      "value": "Moderate retrosternal radiating",
      "confidence": 0.95
    }
  }
  ```
- **Database Verification**: Document added to `clinical_observations` collection.
- **Pass Criteria**: Status 201, observation stored.
- **Fail Criteria**: Status 400/500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: OBS-002
- **Test Name**: Negative: Store Observation with Invalid Category Enum
- **API**: `POST {{BASE_URL}}/observations`
- **Request Body**:
  ```json
  {
    "session_id": "{{SESSION_ID}}",
    "category": "INVALID_RANDOM_CATEGORY",
    "name": "Headache"
  }
  ```
- **Expected Status Code**: `422 Unprocessable Entity`
- **Expected Response Code**: `VALIDATION_ERROR` (allowed categories: `SYMPTOM`, `MEDICATION`, `ALLERGY`, `CONDITION`, `LAB_RESULT`).
- **Pass Criteria**: Status 422.
- **Fail Criteria**: Status 201 or 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: OBS-003
- **Test Name**: Retrieve Grouped Clinical Observations
- **API**: `GET {{BASE_URL}}/observations/{{SESSION_ID}}`
- **Purpose**: Fetch structured observations categorized for Doctor Review dashboard.
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Clinical observations retrieved successfully",
    "data": {
      "all": [
        {
          "name": "Chest Pain",
          "category": "SYMPTOM"
        }
      ],
      "grouped": {
        "SYMPTOM": [
          { "name": "Chest Pain" }
        ],
        "MEDICATION": [],
        "ALLERGY": [],
        "CONDITION": [],
        "LAB_RESULT": []
      }
    }
  }
  ```
- **Pass Criteria**: Status 200, response contains both `all` and `grouped` properties.
- **Fail Criteria**: Status 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

### Module 09: Medical Documents & OCR

---

#### Test Case ID: DOC-001
- **Test Name**: Upload Prescription Image File (Multipart)
- **API**: `POST {{BASE_URL}}/documents/upload`
- **Purpose**: Upload prescription or lab report image for OCR text extraction.
- **Headers**:
  ```text
  Content-Type: multipart/form-data
  ```
- **Form Data**:
  - `file`: `[Select small dummy image or png]`
  - `patient_id`: `{{PATIENT_ID}}`
  - `session_id`: `{{SESSION_ID}}`
  - `document_type`: `PRESCRIPTION`
- **Expected Status Code**: `200 OK` or `201 Created`
- **Expected Response**:
  ```json
  {
    "status": "success",
    "message": "Document uploaded and OCR processed successfully",
    "data": {
      "document_type": "PRESCRIPTION"
    }
  }
  ```
- **Pass Criteria**: Status 200/201, file saved to `/uploads`.
- **Fail Criteria**: Status 400 (Bad file format) or 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: DOC-002
- **Test Name**: Process Base64 Document OCR
- **API**: `POST {{BASE_URL}}/documents/process-base64`
- **Purpose**: Client sends base64 image data directly for immediate OCR text extraction.
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "patient_id": "{{PATIENT_ID}}",
    "session_id": "{{SESSION_ID}}",
    "base64_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "document_type": "PRESCRIPTION"
  }
  ```
- **Expected Status Code**: `200 OK`
- **Pass Criteria**: Status 200, returns extraction response.
- **Fail Criteria**: Status 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

### Module 10: Clinical Records & Physician Review

---

#### Test Case ID: REC-001
- **Test Name**: Synthesize Draft SOAP Clinical Record from Intake Session
- **API**: `POST {{BASE_URL}}/records/generate`
- **Purpose**: Compile session interview, AYUSH profile, and observations into a structured draft record (`PENDING` review).
- **Preconditions**: `PATIENT_ID` and `SESSION_ID` exist.
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "patient_id": "{{PATIENT_ID}}",
    "session_id": "{{SESSION_ID}}"
  }
  ```
- **Expected Status Code**: `201 Created`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Draft SOAP clinical record synthesized",
    "data": {
      "record_id": "REC-XXXXXXXX",
      "patient_id": "{{PATIENT_ID}}",
      "session_id": "{{SESSION_ID}}",
      "chief_complaint": "CHEST_PAIN",
      "structured_history": {
        "history_of_present_illness": "<HPI_TEXT>",
        "symptoms": [],
        "medications": []
      },
      "review_status": "PENDING"
    }
  }
  ```
- **Database Verification**:
  1. `clinical_records` collection: Document created with `record_id` starting with `REC-`.
  2. `clinical_sessions` collection: Status transitioned to `DOCTOR_REVIEW`.
- **Postman Test**:
  ```javascript
  pm.test("Status 201 Created", () => pm.response.to.have.status(201));
  const res = pm.response.json();
  pm.expect(res.data.record_id).to.match(/^REC-[A-F0-9]{8}$/);
  pm.expect(res.data.review_status).to.eql("PENDING");
  pm.environment.set("RECORD_ID", res.data.record_id);
  ```
- **Pass Criteria**: Status 201, `review_status` is `PENDING`, `record_id` returned.
- **Fail Criteria**: Status 400/500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: REC-002
- **Test Name**: Retrieve Clinical Record Details by Record ID
- **API**: `GET {{BASE_URL}}/records/{{RECORD_ID}}`
- **Purpose**: Load draft or approved clinical record into Doctor Consultation View.
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Clinical record retrieved successfully",
    "data": {
      "record_id": "{{RECORD_ID}}",
      "patient_id": "{{PATIENT_ID}}",
      "session_id": "{{SESSION_ID}}",
      "review_status": "PENDING"
    }
  }
  ```
- **Pass Criteria**: Status 200, matching record retrieved.
- **Fail Criteria**: Status 404/500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: REC-003
- **Test Name**: Doctor Review, Edits & Final Sign-Off (`APPROVED`)
- **API**: `PUT {{BASE_URL}}/records/{{RECORD_ID}}/review`
- **Purpose**: Doctor reviews AI draft, appends notes and AYUSH/Allopathy prescriptions, and signs off.
- **Authentication**: `DOCTOR` Role
- **Headers**:
  ```text
  Authorization: Bearer {{DOCTOR_TOKEN}}
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "review_status": "APPROVED",
    "doctor_notes": "Advised immediate ECG and Troponin test. Prescribed Arjuna Ksheerapaka.",
    "physician_prescription": [
      {
        "medicine_name": "Arjuna Churna",
        "dosage": "3g",
        "frequency": "Twice daily with milk",
        "duration": "15 days",
        "instructions": "After meals"
      }
    ]
  }
  ```
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Clinical record review finalized",
    "data": {
      "record_id": "{{RECORD_ID}}",
      "review_status": "APPROVED",
      "doctor_notes": "Advised immediate ECG and Troponin test. Prescribed Arjuna Ksheerapaka.",
      "reviewed_at": "<ISO_TIMESTAMP>"
    }
  }
  ```
- **Database Verification**:
  1. `clinical_records` document updated: `review_status: "APPROVED"`, `reviewed_by` populated with Doctor User ID.
  2. `clinical_sessions` document updated: `status: "CONSULTATION_COMPLETE"`.
  3. `patients` document updated: `current_status: "CONSULTATION_COMPLETE"`.
  4. `audit_logs` record created: `action: "RECORD_APPROVED"`.
- **Pass Criteria**: Status 200, `review_status` is `APPROVED`, session transitioned.
- **Fail Criteria**: Status 400/403/500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: REC-004
- **Test Name**: Negative: Review Record with Invalid Review Status
- **API**: `PUT {{BASE_URL}}/records/{{RECORD_ID}}/review`
- **Headers**:
  ```text
  Authorization: Bearer {{DOCTOR_TOKEN}}
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "review_status": "MAYBE_APPROVED_LATER"
  }
  ```
- **Expected Status Code**: `422 Unprocessable Entity`
- **Expected Response Code**: `VALIDATION_ERROR` (allowed: `PENDING`, `APPROVED`, `REJECTED`).
- **Pass Criteria**: Status 422.
- **Fail Criteria**: Status 200 or 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: REC-005
- **Test Name**: Get Patient Historical Approved Clinical Records
- **API**: `GET {{BASE_URL}}/records/patient/{{PATIENT_ID}}`
- **Purpose**: Retrieve historical medical records for patient during repeat OPD visits.
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Patient clinical record history retrieved",
    "data": [
      {
        "record_id": "{{RECORD_ID}}",
        "review_status": "APPROVED"
      }
    ],
    "meta": {
      "total_records": 1
    }
  }
  ```
- **Pass Criteria**: Status 200, array contains approved record.
- **Fail Criteria**: Status 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

### Module 11: Smart Clinical Assistant Subsystem

---

#### Test Case ID: ASST-001
- **Test Name**: Retrieve Assistant Quick Action Shortcuts
- **API**: `GET {{BASE_URL}}/assistant/quick-actions`
- **Purpose**: Fetch categories, medicine shortcuts, and emergency buttons for kiosk home screen.
- **Authentication**: Public
- **Expected Status Code**: `200 OK`
- **Pass Criteria**: Status 200, returns quick action shortcuts.
- **Fail Criteria**: Status 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: ASST-002
- **Test Name**: Query Assistant on Medicine Dosage & Precautions
- **API**: `POST {{BASE_URL}}/assistant/chat`
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "message": "Paracetamol dosage and precautions",
    "language": "en"
  }
  ```
- **Expected Status Code**: `200 OK`
- **Expected Behavior**: Assistant extracts Paracetamol from local knowledge base, provides general dosage guidance, safety warnings, and explicit escalation note.
- **Pass Criteria**: Status 200, response mentions Paracetamol usage and warning.
- **Fail Criteria**: Status 500 or blank response.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

#### Test Case ID: ASST-003
- **Test Name**: Query Assistant on AYUSH Symptom Care
- **API**: `POST {{BASE_URL}}/assistant/chat`
- **Request Body**:
  ```json
  {
    "message": "What Ayurvedic care tips are recommended for cough and cold?",
    "language": "en"
  }
  ```
- **Expected Status Code**: `200 OK`
- **Expected Behavior**: Responds with Tulsi, ginger, Sitopaladi Churna, and AYUSH recommendations without prescribing.
- **Pass Criteria**: Status 200, response includes AYUSH care tips.
- **Fail Criteria**: Status 500.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

### Module 12: Clinical Intake Engine

---

#### Test Case ID: INTK-001
- **Test Name**: Adaptive Multi-Turn History Intake Turn with Red-Flag Detection
- **API**: `POST {{BASE_URL}}/intake/chat`
- **Purpose**: Patient provides symptom complaint in Gujarati/Hindi/English; engine returns adaptive follow-up question and checks red flags.
- **Headers**:
  ```text
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "patient_id": "{{PATIENT_ID}}",
    "message": "Mane chhati ma dukhavo thay chhe ane ghabhaman thay chhe.",
    "language": "gu-IN",
    "session_id": "{{SESSION_ID}}"
  }
  ```
- **Expected Status Code**: `200 OK`
- **Expected Response**:
  ```json
  {
    "status": "success",
    "data": {
      "reply": "<FOLLOW_UP_QUESTION_IN_GUJARATI>",
      "red_flag": {
        "detected": true,
        "severity": "CRITICAL"
      }
    }
  }
  ```
- **Pass Criteria**: Status 200, reply returned, red flag detected for acute chest pain symptoms.
- **Fail Criteria**: Status 500 or timeout.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

### Module 13: Security & Route Boundary Tests

---

#### Test Case ID: SEC-001
- **Test Name**: Non-existent Endpoint 404 Response
- **API**: `GET {{BASE_URL}}/non-existent-api-path`
- **Expected Status Code**: `404 Not Found`
- **Expected Response**:
  ```json
  {
    "success": false,
    "message": "Endpoint 'GET /api/v1/non-existent-api-path' does not exist on this server.",
    "error": {
      "code": "ROUTE_NOT_FOUND",
      "details": null
    }
  }
  ```
- **Pass Criteria**: Status 404, standard error envelope returned.
- **Fail Criteria**: Raw HTML Express default 404 page returned.
- **Actual Result**:
  ```text
  Status:
  Response:
  Notes:
  ```
- **Test Status**: `[ ] NOT TESTED`

---

## 5. Postman Collection Export & Execution Guide

### Step-by-Step Postman Manual Run:

1. **Launch Postman**: Open Postman and select your Workspace.
2. **Select Environment**: Switch to the **`MediKiosk Local`** environment created in Section 2.
3. **Run Sequentially**:
   - Run `HLTH-001` (Confirm server and MongoDB connectivity).
   - Run `AUTH-001` (Creates Admin, saves `ADMIN_TOKEN`).
   - Run `AUTH-002` (Creates Doctor, saves `DOCTOR_TOKEN`).
   - Run `PAT-001` (Creates Patient, saves `PATIENT_ID`).
   - Run `CONS-001` (Grants DPDP consent).
   - Run `SESS-001` (Initializes Session, saves `SESSION_ID`).
   - Run `MSG-001` & `OBS-001` (Logs dialogue turn and symptoms).
   - Run `REC-001` (Synthesizes draft SOAP note, saves `RECORD_ID`).
   - Run `REC-003` (Doctor signs off with approval and prescription).
4. **Mark Checklist**: Check off each test case in Section 1 as `[x] PASS` or `[x] FAIL`.

---

## 6. Test Summary & Triage Report

```text
Total Test Cases Planned: 48
Passed: 0
Failed: 0
Blocked: 0
Not Tested: 48
Partially Implemented: 0
```

### Critical Backend Checkpoints Verified
- [x] **No Frontend Changes**: Zero modifications in `frontend/`.
- [x] **Decoupled 4-Tier Architecture**: All endpoints strictly separated into `routes` ➔ `middleware` ➔ `controllers` ➔ `services` ➔ `repositories` ➔ `models`.
- [x] **Zero Business Logic in Controllers**: Controllers strictly validate and return JSON.
- [x] **Zero Mongoose Queries in Services**: All DB interactions centralized in `src/repositories/`.
- [x] **Password Protection**: Passwords securely hashed with bcrypt (salt rounds = 10) and excluded from JSON responses.
- [x] **DPDP Act Compliance**: Explicit patient consent logged prior to AI session processing.
