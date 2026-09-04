# MediKiosk — API Documentation & Specification

> **Document Status**: Official API Specification  
> **Server Engine**: Node.js + Express  
> **Base URL Format**: `http://<SERVER_HOST>:<PORT>/api/v1`  
> **Default Local Base URL**: `http://localhost:5000/api/v1`  
> **Network Base URL**: `http://<YOUR_LOCAL_IP>:5000/api/v1`  

---

## 1. 🌐 System Overview & Base URLs

All API endpoints are prefixed with `/api/v1`. The server is configured with CORS enabled (`CORS_ORIGIN=*`) and binds to `0.0.0.0` to allow cross-network calls from client kiosks, tablets, and web apps.

| Environment | Base URL |
| :--- | :--- |
| **Local Environment** | `http://localhost:5000/api/v1` |
| **Network (OPD / Kiosk)** | `http://<SERVER_IP>:5000/api/v1` |

---

## 2. 🏥 Health & Diagnostics API

### `GET /api/v1/health`
- **Description**: Verify server uptime, network status, and database connectivity.
- **Headers**: None
- **Response `200 OK`**:
```json
{
  "status": "success",
  "message": "MediKiosk Patient Tracking Server is running on network",
  "timestamp": "2026-08-26T09:22:38.000Z"
}
```

---

## 3. 🔐 Authentication & Staff Management APIs

### `POST /api/v1/auth/login`
- **Description**: Authenticate healthcare staff, doctors, and administrators.
- **Request Body**:
```json
{
  "email": "doctor@medikiosk.ai",
  "password": "SecurePassword123"
}
```
- **Response `200 OK`**:
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "60d5ec49f1b2c81234567890",
      "name": "Dr. Aarav Sharma",
      "email": "doctor@medikiosk.ai",
      "role": "DOCTOR"
    }
  }
}
```

### `POST /api/v1/auth/register`
- **Description**: Register a new staff or physician account.
- **Request Body**:
```json
{
  "name": "Nurse Ananya",
  "email": "ananya@medikiosk.ai",
  "phone": "+919876543210",
  "password": "SecurePassword123",
  "role": "STAFF"
}
```

### `GET /api/v1/auth/me`
- **Description**: Fetch profile of currently logged-in user.
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`

### `GET /api/v1/users`
- **Description**: List all hospital staff and users (Admin scope).
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`

### `PUT /api/v1/users/:id/role`
- **Description**: Update user access role (`ADMIN`, `DOCTOR`, `STAFF`).
- **Request Body**: `{ "role": "DOCTOR" }`

---

## 4. 👤 Patient Identity & Profile APIs

### `POST /api/v1/patients`
- **Description**: Create/register a new patient record.
- **Request Body**:
```json
{
  "first_name": "Rajesh",
  "last_name": "Kumar",
  "date_of_birth": "1985-04-12",
  "gender": "MALE",
  "phone": "+919876543210",
  "address": "New Delhi, India"
}
```

### `GET /api/v1/patients`
- **Description**: Search patients by phone number, name, or patient ID.
- **Query Params**: `?search=9876543210`

### `GET /api/v1/patients/:id`
- **Description**: Retrieve patient profile details by `patient_id`.

### `POST /api/v1/patients/:id/identities`
- **Description**: Attach identity reference (ABHA Sandbox / Local ID).
- **Request Body**:
```json
{
  "identity_type": "ABHA",
  "identity_reference": "91-1234-5678-9012",
  "verification_status": "VERIFIED"
}
```

---

## 5. 📜 Consent Management APIs

### `POST /api/v1/consents`
- **Description**: Record explicit patient consent prior to AI interview launch.
- **Request Body**:
```json
{
  "patient_id": "PAT60d5ec49f1",
  "session_id": "SES60d5ec49f2",
  "consent_type": "AI_CASE_TAKING",
  "status": "GRANTED"
}
```

### `GET /api/v1/consents/:patientId`
- **Description**: Get active consent history for a patient.

---

## 6. ⏱️ Clinical Session APIs

### `POST /api/v1/sessions`
- **Description**: Initialize a new kiosk intake session (`STARTED`).
- **Request Body**:
```json
{
  "patient_id": "PAT60d5ec49f1",
  "language": "HINDI"
}
```

### `GET /api/v1/sessions/:id`
- **Description**: Retrieve session state and timestamps.

### `PUT /api/v1/sessions/:id/status`
- **Description**: Transition session status (`IN_PROGRESS`, `COMPLETED`, `REVIEWED`).
- **Request Body**: `{ "status": "COMPLETED" }`

### `GET /api/v1/sessions/active`
- **Description**: List all active/pending OPD kiosk sessions for doctor/staff view.

---

## 7. 💬 AI Case Taking & Dialogue APIs

### `POST /api/v1/case-messages`
- **Description**: Post dialogue turn between AI, Patient, or Doctor.
- **Request Body**:
```json
{
  "session_id": "SES60d5ec49f2",
  "sender": "PATIENT",
  "message": "Mujhe 3 din se seene mein dard aur saans lene mein takleef hai.",
  "message_type": "TEXT"
}
```

### `GET /api/v1/case-messages/:sessionId`
- **Description**: Fetch full conversational dialogue turn log for a session.

---

## 8. 🔍 Clinical Observations APIs

### `POST /api/v1/observations`
- **Description**: Store structured medical observations extracted by AI workflows.
- **Request Body**:
```json
{
  "session_id": "SES60d5ec49f2",
  "category": "SYMPTOM",
  "name": "Chest Pain",
  "value": "Severe radiating",
  "unit": "3 Days",
  "confidence": 0.95,
  "source": "AI_DIALOGUE"
}
```

### `GET /api/v1/observations/:sessionId`
- **Description**: Retrieve structured observations list (`SYMPTOM`, `MEDICATION`, `ALLERGY`, `CONDITION`, `LAB_RESULT`).

---

## 9. 📄 Medical Documents & OCR APIs

### `POST /api/v1/documents/upload`
- **Description**: Upload prescription image or lab report scan (Multer multipart form).
- **Headers**: `Content-Type: multipart/form-data`
- **Form Data**:
  - `file`: `[File Attachment]`
  - `patient_id`: `"PAT60d5ec49f1"`
  - `session_id`: `"SES60d5ec49f2"`
  - `document_type`: `"PRESCRIPTION"`

### `GET /api/v1/documents/:sessionId`
- **Description**: List all documents attached to a session.

### `POST /api/v1/documents/:id/ocr`
- **Description**: Trigger OCR and LLM text extraction on uploaded document.

---

## 10. 🩺 Clinical Records & Doctor Review APIs

### `POST /api/v1/records/generate`
- **Description**: Synthesize draft SOAP record from AI session history and observations.
- **Request Body**:
```json
{
  "patient_id": "PAT60d5ec49f1",
  "session_id": "SES60d5ec49f2"
}
```

### `GET /api/v1/records/:id`
- **Description**: Retrieve full draft/approved clinical record.

### `PUT /api/v1/records/:id/review`
- **Description**: Physician review action (`APPROVE`, `REJECT`, `EDIT`).
- **Request Body**:
```json
{
  "review_status": "APPROVED",
  "doctor_notes": "Patient advised ECG & Trop-I test immediately. Referred to Cardiology.",
  "reviewed_by": "60d5ec49f1b2c81234567890"
}
```

### `GET /api/v1/records/patient/:patientId`
- **Description**: Retrieve complete historical approved clinical records for a patient.
