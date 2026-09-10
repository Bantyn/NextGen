# MediKiosk — Production API Documentation & Specification

> **Document Status**: Official Production Specification  
> **Server Engine**: Node.js v20+ (ES Modules) + Express 5 + MongoDB (Mongoose)  
> **Architecture Pattern**: Decoupled 4-Tier Backend (`Routes` ➔ `Middleware` ➔ `Controller` ➔ `Service` ➔ `Repository` ➔ `Database`)  
> **Base URL Format**: `http://<SERVER_HOST>:<PORT>/api/v1`  
> **Default Local Base URL**: `http://localhost:5000/api/v1`  
> **Default Network Base URL**: `http://<SERVER_IP>:5000/api/v1`  

---

## 1. 🌐 Architectural Standards & Envelope Contract

All responses conform to the enterprise JSON envelope contract:

### Standard Success Envelope (`200 OK` / `201 Created`):
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {},
  "meta": {
    "current_page": 1,
    "page_size": 20,
    "total_records": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

### Standard Error Envelope (`400`, `401`, `403`, `404`, `409`, `422`, `500`):
```json
{
  "success": false,
  "message": "Human-readable explanation of error condition",
  "error": {
    "code": "ERROR_CODE_IDENTIFIER",
    "details": null
  }
}
```

---

## 2. 🏥 Health & Diagnostics

### `GET /api/v1/health`
- **Description**: Verify server uptime, network status, and active MongoDB database connection.
- **Access Control**: Public
- **Headers**: None
- **Response `200 OK`**:
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

---

## 3. 🔐 Authentication & Staff Management

### `POST /api/v1/auth/register`
- **Description**: Register a new healthcare staff member, doctor, or administrator.
- **Access Control**: Public
- **Request Body**:
```json
{
  "name": "Dr. Priya Sharma",
  "email": "doctor@medikiosk.ai",
  "phone": "+919876543211",
  "password": "SecureDoctorPassword123!",
  "role": "DOCTOR"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "66d859b0f1b2c81234567890",
      "name": "Dr. Priya Sharma",
      "email": "doctor@medikiosk.ai",
      "phone": "+919876543211",
      "role": "DOCTOR"
    }
  }
}
```

### `POST /api/v1/auth/login`
- **Description**: Authenticate registered healthcare staff or administrator.
- **Access Control**: Public
- **Request Body**:
```json
{
  "email": "doctor@medikiosk.ai",
  "password": "SecureDoctorPassword123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "66d859b0f1b2c81234567890",
      "name": "Dr. Priya Sharma",
      "email": "doctor@medikiosk.ai",
      "phone": "+919876543211",
      "role": "DOCTOR"
    }
  }
}
```

### `GET /api/v1/auth/me`
- **Description**: Retrieve currently logged-in user profile from Bearer JWT.
- **Access Control**: Authenticated (Any Role)
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "66d859b0f1b2c81234567890",
    "name": "Dr. Priya Sharma",
    "email": "doctor@medikiosk.ai",
    "phone": "+919876543211",
    "role": "DOCTOR",
    "is_active": true,
    "created_at": "2026-09-04T12:53:28.000Z"
  }
}
```

### `GET /api/v1/users`
- **Description**: List all hospital staff and physicians with optional role filtering and pagination.
- **Access Control**: `ADMIN` Role Only
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Query Params**: `?role=DOCTOR&page=1&limit=20`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "_id": "66d859b0f1b2c81234567890",
      "name": "Dr. Priya Sharma",
      "email": "doctor@medikiosk.ai",
      "role": "DOCTOR",
      "is_active": true
    }
  ],
  "meta": {
    "current_page": 1,
    "page_size": 20,
    "total_records": 1,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

### `PUT /api/v1/users/:id/role`
- **Description**: Promote or change a staff member's role (`ADMIN`, `DOCTOR`, `STAFF`).
- **Access Control**: `ADMIN` Role Only
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Request Body**:
```json
{
  "role": "DOCTOR"
}
```

---

## 4. 👤 Patient Identity & Profile

### `POST /api/v1/patients`
- **Description**: Create/register a new patient profile. Auto-generates unique `PAT-XXXXXXXX` ID.
- **Access Control**: Public / Kiosk / Authenticated Staff
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
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Patient created successfully",
  "data": {
    "patient_id": "PAT-AD16808B",
    "first_name": "Rajesh",
    "last_name": "Patel",
    "phone": "+919876543210",
    "gender": "MALE",
    "current_status": "CHECKED_IN"
  }
}
```

### `GET /api/v1/patients`
- **Description**: Search patients across phone number, patient ID, first name, or last name.
- **Query Params**: `?search=9876543210&page=1&limit=20`

### `GET /api/v1/patients/:id`
- **Description**: Retrieve complete patient profile including linked identities (ABHA) and consent history.

### `POST /api/v1/patients/:id/identities`
- **Description**: Link an identity reference (ABHA Sandbox / Local ID).
- **Request Body**:
```json
{
  "identity_type": "ABHA",
  "identity_reference": "91-1234-5678-9012",
  "verification_status": "VERIFIED"
}
```

---

## 5. 📜 Consent Management (DPDP Act 2023)

### `POST /api/v1/consents`
- **Description**: Record explicit patient consent before clinical history intake or document scan.
- **Request Body**:
```json
{
  "patient_id": "PAT-AD16808B",
  "session_id": "SES-3DB65058",
  "consent_type": "AI_CASE_TAKING",
  "status": "GRANTED"
}
```

### `GET /api/v1/consents/:patientId`
- **Description**: Retrieve active and historical consents granted by a patient.

---

## 6. ⏱️ Clinical Sessions

### `POST /api/v1/sessions`
- **Description**: Initialize a new OPD kiosk intake session (`STARTED`).
- **Request Body**:
```json
{
  "patient_id": "PAT-AD16808B",
  "language": "gu-IN",
  "consultation_type": "AYUSH_AYURVEDA",
  "chief_complaint_category": "CHEST_PAIN"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Clinical session initialized",
  "data": {
    "session_id": "SES-3DB65058",
    "patient_id": "PAT-AD16808B",
    "language": "gu-IN",
    "consultation_type": "AYUSH_AYURVEDA",
    "status": "STARTED"
  }
}
```

### `GET /api/v1/sessions/active`
- **Description**: Retrieve list of all currently active/waiting OPD intake sessions.
- **Access Control**: Public / Doctor / Staff

### `GET /api/v1/sessions/:id`
- **Description**: Retrieve full clinical session state, answered questions, and red-flag triage status.

### `PUT /api/v1/sessions/:id/status`
- **Description**: Transition session lifecycle status (`IN_PROGRESS`, `READY_FOR_DOCTOR`, `DOCTOR_REVIEW`, `COMPLETED`).
- **Request Body**:
```json
{
  "status": "READY_FOR_DOCTOR"
}
```

---

## 7. 💬 AI Case Dialogue & Transcripts

### `POST /api/v1/case-messages`
- **Description**: Log a conversational dialogue turn between Patient, AI, or Doctor.
- **Request Body**:
```json
{
  "session_id": "SES-3DB65058",
  "sender": "PATIENT",
  "message": "Mane chhati ma dukhavo thay chhe 3 divas thi.",
  "message_type": "TEXT"
}
```

### `GET /api/v1/case-messages/:sessionId`
- **Description**: Retrieve chronological dialogue transcript for a clinical intake session.

---

## 8. 🔍 Structured Clinical Observations

### `POST /api/v1/observations`
- **Description**: Store structured medical observations extracted by AI from patient voice or documents.
- **Request Body**:
```json
{
  "session_id": "SES-3DB65058",
  "category": "SYMPTOM",
  "name": "Chest Pain",
  "value": "Moderate retrosternal radiating",
  "unit": "3 Days",
  "confidence": 0.95,
  "source": "AI_DIALOGUE"
}
```

### `GET /api/v1/observations/:sessionId`
- **Description**: Retrieve structured observations for a session, both as a flat list and grouped by category (`SYMPTOM`, `MEDICATION`, `ALLERGY`, `CONDITION`, `LAB_RESULT`).

---

## 9. 📄 Medical Documents & OCR

### `POST /api/v1/documents/upload`
- **Description**: Upload prescription image or lab report scan (Multer multipart form).
- **Headers**: `Content-Type: multipart/form-data`
- **Form Data**:
  - `file`: `[File Attachment]`
  - `patient_id`: `"PAT-AD16808B"`
  - `session_id`: `"SES-3DB65058"`
  - `document_type`: `"PRESCRIPTION"`

### `POST /api/v1/documents/process-base64`
- **Description**: Submit base64 encoded document image for instant OCR processing.

---

## 10. 🩺 Clinical Records & Physician Review

### `POST /api/v1/records/generate`
- **Description**: Synthesize draft SOAP clinical record from session dialogue, observations, and AYUSH profile.
- **Request Body**:
```json
{
  "patient_id": "PAT-AD16808B",
  "session_id": "SES-3DB65058"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Draft SOAP clinical record synthesized",
  "data": {
    "record_id": "REC-948E3B33",
    "patient_id": "PAT-AD16808B",
    "session_id": "SES-3DB65058",
    "review_status": "PENDING"
  }
}
```

### `GET /api/v1/records/:id`
- **Description**: Retrieve complete clinical record details by `record_id`.

### `PUT /api/v1/records/:id/review`
- **Description**: Physician review, edits, prescription addition, and sign-off (`APPROVED` / `REJECTED`).
- **Headers**: `Authorization: Bearer <DOCTOR_TOKEN>`
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

### `GET /api/v1/records/patient/:patientId`
- **Description**: Fetch all historical approved clinical records for a patient across visits.

---

## 11. 🤖 Smart Assistant Subsystem

### `POST /api/v1/assistant/chat`
- **Description**: Multilingual clinical assistant answering questions about AYUSH and allopathic medicines, symptom precautions, and clinic navigation.
- **Request Body**:
```json
{
  "message": "What is the dosage for Paracetamol?",
  "language": "en"
}
```

### `GET /api/v1/assistant/quick-actions`
- **Description**: Fetch dynamic category quick-help shortcuts for kiosk home screen.

---

### `POST /api/v1/intake/chat`
- **Description**: Multi-turn adaptive conversational clinical history intake with contextual red-flag detection, patient intent understanding, and structured clinical state tracking.
- **Access Control**: Public / Kiosk / Attending Staff
- **Request Body**:
```json
{
  "session_id": "SES-3DB65058",
  "patient_id": "PAT-AD16808B",
  "patient_answer": "My right knee has been hurting for 2 years.",
  "language": "English",
  "opd_mode": "GENERAL",
  "current_clinical_state": {}
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "assistant_message": "Did this discomfort begin suddenly or did it develop gradually over time?",
  "intent": "medical-history response",
  "risk_state": "ASSESSING",
  "next_question": "Did this discomfort begin suddenly or did it develop gradually over time?",
  "quick_chips": [
    "Started suddenly",
    "Developed gradually",
    "After physical strain"
  ],
  "extracted_entities": {
    "chief_complaint": "Right Knee Pain",
    "symptoms": ["Right Knee Pain"],
    "duration": "2 years",
    "severity": null,
    "onset": null,
    "location": "Right Knee",
    "associated_symptoms": [],
    "negated_symptoms": []
  },
  "clinical_state": {
    "chief_complaint": "Right Knee Pain",
    "symptoms": ["Right Knee Pain"],
    "body_site": "Right Knee",
    "onset": "",
    "duration": "2 years",
    "severity": null,
    "course": "",
    "associated_symptoms": [],
    "negative_findings": [],
    "relevant_history": [],
    "medications": [],
    "allergies": [],
    "family_history": [],
    "lifestyle": {},
    "red_flags": [],
    "risk_level": "LOW",
    "patient_intent": "medical-history response",
    "confidence": 0.85,
    "missing_high_priority_information": ["onset", "severity", "associated_symptoms"],
    "next_question": "Did this discomfort begin suddenly or did it develop gradually over time?"
  },
  "red_flag": {
    "detected": false,
    "priority": "LOW",
    "triage_level": "LOW",
    "category": "ROUTINE_OUTPATIENT",
    "reason": "Routine outpatient presentation."
  },
  "infermedica_assessment": {
    "source": "local_clinical_knowledge_base",
    "assessment": {
      "possible_conditions": [
        {
          "id": "ckb_cond_primary",
          "name": "Right Knee Pain Assessment",
          "common_name": "Right Knee Pain Assessment",
          "probability": 0.5,
          "requires_doctor_confirmation": true
        }
      ],
      "triage": {
        "level": "LOW",
        "reason": "Evaluated deterministically via local clinical knowledge base."
      }
    }
  },
  "history_complete": false,
  "doctor_review_required": false,
  "session_status": "IN_PROGRESS"
}
```

---

## 13. 🛡️ Clinical Intelligence & Triage Specifications

### Triage Levels:
| Triage Level | Criteria | Kiosk Behavior |
| :--- | :--- | :--- |
| `LOW` / `ROUTINE` | Chronic pain, mild symptoms, long-standing joint aches (> 1 month) | Standard adaptive intake, no alarms. |
| `MODERATE` | Uncomplicated chest discomfort, persistent symptoms (1-2 weeks), subacute pain | Targeted risk assessment questions (pressure, radiation, dyspnea). |
| `HIGH PRIORITY` | Significant respiratory distress, severe acute pain (8-9/10), acute high fever | Prioritized in OPD queue; rapid summary synthesis. |
| `EMERGENCY` | Crushing chest pain + diaphoresis/dyspnea, acute stroke signs, hematemesis, syncope | Immediate intake halt, audible kiosk guidance, immediate emergency physician alert. |

### Patient Intent Recognition:
- `doctor-consult question`: Answers the patient's advice concern empathetically first, then resumes intake.
- `medicine information question`: Clarifies factual medicine details via MongoDB/openFDA, advises physician confirmation.
- `emergency concern`: Provides immediate clinical reassurance and risk triage.
- `general help` / `repeat/rephrase` / `language change`: Responds naturally.

---

## 14. 📱 WhatsApp Bot & Clinical Access Integration (`/api/v1/whatsapp`)

### `POST /api/v1/whatsapp/auth-check`

- **Description**: Verify patient identity, retrieve active session, and validate DPDP Act 2023 consent state from an incoming WhatsApp message payload.
- **Access Control**: Public / WhatsApp Webhook Gateway
- **Headers**:
  - `Content-Type`: `application/json`

#### Request Parameters / Body:
```json
{
  "phone": "9876543210",
  "chatId": "919876543210@c.us",
  "pushName": "Rajesh Patel"
}
```

#### Success Response (200 OK):
```json
{
  "success": true,
  "message": "Patient authenticated with valid clinical consent.",
  "data": {
    "authenticated": true,
    "patient": {
      "patient_id": "PAT-AD16808B",
      "first_name": "Rajesh",
      "last_name": "Patel",
      "phone": "+919876543210",
      "gender": "MALE",
      "date_of_birth": "1985-04-12T00:00:00.000Z"
    },
    "session": {
      "session_id": "SES-3DB65058",
      "status": "STARTED",
      "language": "gu-IN",
      "triage_level": "LOW"
    },
    "has_consent": true,
    "consent_status": "GRANTED",
    "message": "Patient authenticated with valid clinical consent."
  }
}
```

---

### `POST /api/v1/whatsapp/authorized-records`

- **Description**: Retrieve authorized, sanitized patient medical records (clinical diagnoses, doctor notes, physician prescriptions, observations) strictly gated behind DPDP Act 2023 patient consent.
- **Access Control**: Authenticated Patient / WhatsApp Webhook Gateway
- **Headers**:
  - `Content-Type`: `application/json`

#### Request Parameters / Body:
```json
{
  "patient_id": "PAT-AD16808B",
  "session_id": "SES-3DB65058",
  "phone": "9876543210"
}
```

#### Success Response (200 OK — Consent Granted):
```json
{
  "success": true,
  "message": "Authorized medical records retrieved successfully",
  "data": {
    "authorized": true,
    "patient": {
      "patient_id": "PAT-AD16808B",
      "name": "Rajesh Patel",
      "gender": "MALE"
    },
    "records": {
      "latest_record": {
        "record_id": "REC-948E3B33",
        "chief_complaint": "Chest discomfort and high blood sugar",
        "review_status": "APPROVED",
        "reviewed_at": "2026-09-08T10:30:00.000Z",
        "doctor_notes": "Advised regular morning walk and low glycemic diet.",
        "prescriptions": [
          {
            "medicine_name": "Metformin",
            "dosage": "500mg",
            "frequency": "Once daily after dinner",
            "duration": "30 days",
            "instructions": "Take with water"
          }
        ],
        "lab_investigations": [
          {
            "test_name": "HbA1c",
            "observed_value": "7.2",
            "reference_range": "< 5.7",
            "unit": "%",
            "flag": "HIGH"
          }
        ],
        "triage": {
          "level": "ROUTINE"
        }
      },
      "observations": {
        "symptoms": [{ "name": "Chest Discomfort", "value": "Mild", "unit": "2 Days" }],
        "medications": [{ "name": "Metformin", "value": "500mg" }],
        "allergies": ["Penicillin"],
        "lab_results": [{ "test": "Fasting Blood Sugar", "value": "138", "unit": "mg/dL" }],
        "conditions": ["Type 2 Diabetes Mellitus"]
      },
      "recent_documents": []
    }
  }
}
```

#### Response (200 OK — Consent Missing or Revoked):
```json
{
  "success": false,
  "authorized": false,
  "reason": "CONSENT_REQUIRED",
  "message": "Hu tamaru medical record access kari shaktu nathi atyare, because proper verification/authorization required che.",
  "records": null
}
```

---

### `POST /api/v1/whatsapp/triage-alert`

- **Description**: Log emergency red-flag alert triggered during WhatsApp patient dialogue to escalate priority on hospital triage dashboard.
- **Access Control**: Public / WhatsApp Webhook Gateway
- **Headers**:
  - `Content-Type`: `application/json`

#### Request Parameters / Body:
```json
{
  "patient_id": "PAT-AD16808B",
  "session_id": "SES-3DB65058",
  "reason": "Severe acute chest pain radiating to left arm and breathlessness",
  "phone": "9876543210"
}
```

#### Success Response (200 OK):
```json
{
  "success": true,
  "message": "Emergency triage alert logged",
  "data": {
    "alert_logged": true,
    "timestamp": "2026-09-10T11:16:57.827Z",
    "triage_level": "EMERGENCY",
    "helplines": {
      "ambulance": "108",
      "emergency": "102",
      "hospital_desk": "079-26578900"
    }
  }
}
```


