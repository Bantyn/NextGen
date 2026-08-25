# MediKiosk Database Design Plan

## 1. Overview

MediKiosk needs a database that supports the complete patient journey:

```text
Patient Identification
        ↓
Patient Profile
        ↓
Consent
        ↓
Clinical Session
        ↓
AI Case Taking
        ↓
AI Extracted Medical Data
        ↓
Medical Documents
        ↓
Doctor Review
        ↓
Final Clinical Record
        ↓
Future ABDM / ABHA Linking
```

> **Important:** ABHA is not treated as a normal database where MediKiosk directly stores records. The clinical record is first maintained in the MediKiosk/provider system. Future ABDM integration can link or share the record through an authorized, consent-based workflow.

---

# 2. Core Database Modules

The database is divided into the following modules:

1. Users & Roles
2. Patient Identity
3. Patient Profile
4. Consent Management
5. Clinical Sessions
6. AI Case Taking
7. AI Extracted Medical Data
8. Medical Documents
9. Final Clinical Records

---

# 3. Users & Roles

This module manages doctors, administrators, and staff.

## Table: `users`

| Field | Purpose |
|---|---|
| `id` | Primary identifier |
| `name` | User name |
| `email` | Login email |
| `phone` | Contact number |
| `password_hash` | Secure password hash |
| `role` | ADMIN / DOCTOR / STAFF |
| `is_active` | Account status |
| `created_at` | Creation timestamp |
| `updated_at` | Last update timestamp |

```text
users
├── id
├── name
├── email
├── phone
├── password_hash
├── role
├── is_active
├── created_at
└── updated_at
```

---

# 4. Patient Identity

Sensitive identity information should remain separate from general clinical data.

## Table: `patient_identities`

```text
patient_identities
├── id
├── patient_id
├── identity_type
│   ├── ABHA
│   ├── AADHAAR
│   └── LOCAL
├── identity_reference
├── verification_status
├── verified_at
└── created_at
```

Example:

```json
{
  "patient_id": "PAT001",
  "identity_type": "ABHA",
  "identity_reference": "91-XXXX-XXXX-1234",
  "verification_status": "VERIFIED"
}
```

### Security Rule

Do not store the raw Aadhaar number unnecessarily. The clinical workflow should use an internal `patient_id`.

---

# 5. Patient Profile

## Table: `patients`

```text
patients
├── id
├── first_name
├── last_name
├── date_of_birth
├── gender
├── phone
├── address
├── emergency_contact
├── created_at
└── updated_at
```

The `patient_id` becomes the main reference used across the system.

```text
PATIENT
   ↓
patient_id
   ↓
All clinical data connects through this ID
```

---

# 6. Consent Management

The patient must provide consent before AI processing, document processing, or future ABDM data-sharing workflows.

## Table: `patient_consents`

```text
patient_consents
├── id
├── patient_id
├── consent_type
│   ├── AI_CASE_TAKING
│   ├── DOCUMENT_PROCESSING
│   └── ABDM_DATA_SHARING
├── status
│   ├── GRANTED
│   └── REVOKED
├── granted_at
├── revoked_at
└── session_id
```

---

# 7. Clinical Sessions

Every patient interaction with MediKiosk creates a new clinical session.

## Table: `clinical_sessions`

```text
clinical_sessions
├── id
├── patient_id
├── status
│   ├── STARTED
│   ├── IN_PROGRESS
│   ├── COMPLETED
│   └── REVIEWED
├── started_at
├── completed_at
├── language
└── created_at
```

Example:

```text
Patient PAT001

Visit 1 → SESSION001
Visit 2 → SESSION002
Visit 3 → SESSION003
```

This makes patient history and previous visits easier to track.

---

# 8. AI Case Taking

This is the main conversation layer between the patient and the AI workflow.

## Table: `case_messages`

```text
case_messages
├── id
├── session_id
├── sender
│   ├── AI
│   ├── PATIENT
│   └── DOCTOR
├── message
├── message_type
│   ├── TEXT
│   └── VOICE
├── created_at
└── metadata
```

Example:

```text
AI:
"Pain kab se ho raha hai?"

PATIENT:
"3 din se"

AI:
"Pain kis jagah ho raha hai?"
```

The AI workflow, such as n8n + Ollama, can use this conversation history to understand context and generate the next question.

---

# 9. AI Extracted Medical Data

Conversation history and structured medical information should not be treated as the same thing.

The raw conversation is stored in `case_messages`, while structured information extracted by AI is stored separately.

## Table: `clinical_observations`

```text
clinical_observations
├── id
├── session_id
├── category
│   ├── SYMPTOM
│   ├── MEDICATION
│   ├── ALLERGY
│   ├── CONDITION
│   └── LAB_RESULT
├── name
├── value
├── unit
├── confidence
├── source
└── created_at
```

Example:

```text
SYMPTOM
Name: Chest Pain
Duration: 3 Days

CONDITION
Name: Diabetes

MEDICATION
Name: Metformin
Dose: 500 mg
```

---

# 10. Medical Documents

Patients may upload prescriptions, lab reports, or other medical documents.

## Table: `medical_documents`

```text
medical_documents
├── id
├── patient_id
├── session_id
├── document_type
│   ├── PRESCRIPTION
│   ├── LAB_REPORT
│   └── OTHER
├── file_url
├── extracted_text
├── processing_status
├── uploaded_at
└── created_at
```

The document-processing workflow can be:

```text
Upload Document
       ↓
OCR / Vision Model
       ↓
Extract Text
       ↓
AI Structured Extraction
       ↓
Store Results
```

---

# 11. Final Clinical Record

After AI case taking and doctor review, a final clinical record is created.

## Table: `clinical_records`

```text
clinical_records
├── id
├── patient_id
├── session_id
├── chief_complaint
├── structured_history
├── ai_summary
├── doctor_notes
├── review_status
│   ├── PENDING
│   ├── APPROVED
│   └── REJECTED
├── reviewed_by
├── reviewed_at
├── created_at
└── updated_at
```

---

# 12. Complete Database Relationship

```text
                    USERS
                      │
                   DOCTOR
                      │
                      ▼

PATIENT ───────► CLINICAL SESSION
   │                    │
   │                    ├────────► CASE MESSAGES
   │                    │
   │                    ├────────► CLINICAL OBSERVATIONS
   │                    │
   │                    ├────────► MEDICAL DOCUMENTS
   │                    │
   │                    ▼
   │              CLINICAL RECORD
   │                    │
   ▼                    ▼
IDENTITIES           DOCTOR REVIEW

PATIENT
   │
   └──────────────► CONSENTS
```

---

# 13. Recommended MVP Scope

Do not implement every table at the beginning.

## Phase 1 — Core MVP

Start with:

```text
1. users
2. patients
3. patient_consents
4. clinical_sessions
5. case_messages
6. clinical_records
```

Core workflow:

```text
Patient
   ↓
Consent
   ↓
Clinical Session
   ↓
AI Case Taking
   ↓
Store Messages
   ↓
Generate Summary
   ↓
Doctor Review
   ↓
Final Record
```

## Phase 2 — Intelligence & Documents

Add:

```text
7. patient_identities
8. clinical_observations
9. medical_documents
```

This phase adds:

- ABHA / identity references
- AI-extracted symptoms
- Medications
- Allergies
- Conditions
- Lab results
- Prescription and report processing

## Phase 3 — ABDM / ABHA Integration

Future architecture:

```text
Final Clinical Record
        ↓
Doctor Approval
        ↓
Patient Consent
        ↓
FHIR / Interoperable Mapping
        ↓
Authorized ABDM Integration
        ↓
Record Linking / Consent-Based Sharing
```

---

# 14. Recommended Overall Architecture

```text
React Frontend
      │
      ▼
Node.js / Express Backend
      │
      ├── Authentication
      ├── Patient Management
      ├── Consent Management
      ├── Database
      ├── Doctor APIs
      └── Future ABDM Integration
      │
      ▼
n8n AI Workflow Layer
      │
      ├── AI Case Taking
      ├── Adaptive Questions
      ├── OCR Processing
      ├── Medical Data Extraction
      └── AI Summary
      │
      ▼
Ollama / AI Models
```

## Design Principle

```text
n8n = AI Workflow Orchestration

Backend = Business Logic + Security + Database + Integrations

Database = Source of Truth
```

Do not make n8n the complete backend.

---

# 15. Next Planning Steps

The next database design step should be:

1. Finalize database choice: PostgreSQL or MongoDB.
2. Define exact SQL data types.
3. Define Primary Keys and Foreign Keys.
4. Create the ER Diagram.
5. Create the SQL schema.
6. Plan backend APIs around the database.
7. Connect the AI/n8n workflow to `clinical_sessions` and `case_messages`.

---

## Current MVP Data Flow

```text
Patient Identification
        ↓
Create / Find Patient
        ↓
Create Consent
        ↓
Create Clinical Session
        ↓
AI Conversation
        ↓
Store Messages
        ↓
Extract Medical Information
        ↓
Generate AI Summary
        ↓
Doctor Review
        ↓
Final Clinical Record
```
