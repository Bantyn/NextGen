# MediKiosk — Product Requirements Document (PRD)

## 1. Document Information

- **Product Name**: MediKiosk — AI-Powered Patient-Facing Clinical History-Taking Platform
- **Team Name**: NextGen
- **Organization**: Ministry of Ayush
- **Department**: All India Institute of Ayurveda (AIIA)
- **Category**: Software (MedTech / BioTech / HealthTech)
- **Theme**: AI-Driven Clinical Workflow Automation & History-Taking Optimization
- **Project Stage**: Hackathon Prototype / MVP Validation
- **Document Version**: 1.0.0
- **Document Status**: Official Repository Specification

---

## 2. Product Overview

**MediKiosk** is an intelligent, patient-facing clinical history-taking software platform designed to eliminate the diagnostic history bottleneck in busy Indian hospitals and AYUSH clinical institutions.

By engaging patients in an autonomous, multilingual, voice-and-touch-guided interview prior to their doctor consultation, MediKiosk transforms raw patient symptoms and uploaded medical documents (prescriptions, lab reports, discharge summaries) into a structured, physician-ready clinical summary.

The system acts purely as a **decision-support and information-structuring assistant**. It never provides autonomous medical diagnoses, prescribes treatment, or replaces the physician. Final clinical authority and record validation remain strictly with qualified healthcare professionals.

---

## 3. Background and Problem Statement

### 3.1 Clinical History-Taking Bottleneck
In Indian OPDs and AYUSH hospitals, doctors face extreme time constraints—often spending under 3 to 5 minutes per patient consultation. A significant portion of this limited time is consumed by repetitive basic history-taking rather than clinical examination and personalized diagnostic reasoning.

### 3.2 Fragmented and Unstructured Medical Records
Patients frequently bring multiple paper-based physical files, handwritten prescriptions, lab reports from varied diagnostic centers, and discharge summaries. These records are often scattered, multilingual, difficult to read quickly, and prone to oversight during brief consultations.

### 3.3 Specialized AYUSH Intake Needs
AYUSH institutions (such as the All India Institute of Ayurveda) require specialized holistic patient evaluation parameters (such as *Dashavidha Pariksha* and *Ahara-Vihara* lifestyle patterns) alongside conventional clinical history. Collecting these details manually creates significant queue delays.

---

## 4. Problem Statement

How might we enable patients entering crowded hospital OPDs to autonomously provide their medical complaints, preferred language, voice/touch history, and previous documents before meeting the physician—so that the doctor receives an instant, structured, AI-extracted clinical summary while ensuring absolute patient consent, data privacy, and physician control?

---

## 5. Proposed Solution

**MediKiosk** provides an intuitive kiosk/mobile interface that:
1. Identifies or registers the patient (with local demo ID or ABHA reference).
2. Obtains explicit, granular consent for AI processing and data storage.
3. Conducts a conversational, adaptive voice and touch-based clinical interview in the patient's preferred language.
4. Processes scanned prescriptions and lab reports via OCR and AI extraction.
5. Identifies red-flag emergency symptoms to trigger immediate priority triage alerts.
6. Synthesizes a structured draft summary (`DRAFT` status) for the doctor's review dashboard.
7. Enables the doctor to edit, approve, or reject the clinical record with one click.

---

## 6. Product Goals

1. **Reduce History-Taking Overhead**: Cut down physician manual data entry time by at least 60% per patient consultation.
2. **Improve Record Structuring**: Convert 100% of captured conversational and document input into a standardized clinical history format aligned with `database.md`.
3. **Enhance Patient Accessibility**: Support voice and touch interactions across multiple regional languages to cater to low-literacy and elderly patients.
4. **Safety & Triage Alerting**: Detect 100% of high-risk red-flag keywords (e.g., severe chest pain, acute dyspnea) to trigger instant visual alerts for hospital triage staff.

---

## 7. Non-Goals

The following boundaries strictly define what the MediKiosk Hackathon MVP will **NOT** do:

- ❌ **Autonomous Medical Diagnosis**: MediKiosk will NOT output diagnostic conclusions, disease probability scores, or treatment recommendations to the patient.
- ❌ **Doctor Replacement**: MediKiosk does NOT replace physician judgment, physical examination, or clinical signoff.
- ❌ **Live Production ABDM / Aadhaar Authorization**: The MVP will NOT perform live government API authentication against real Aadhaar/ABDM production servers. All identity flows utilize local demo tokens and sandbox reference IDs.
- ❌ **E-Prescription Execution**: MediKiosk does NOT issue legal digital prescriptions or fulfill pharmacy orders directly.

---

## 8. Target Users

1. **Patients**: OPD visitors, including elderly individuals and low-literacy patients who benefit from voice guidance in regional languages.
2. **Doctors / Healthcare Professionals**: Ayurvedic practitioners, OPD physicians, and clinical residents who require fast, structured history digests.
3. **Hospital Staff / Nurses / Triage Teams**: Receptionists and triage nurses who manage session check-ins and monitor red-flag alerts.

---

## 9. User Roles & Permissions

| Role | System Scope & Permissions |
| :--- | :--- |
| **Patient** | Can register/identify, select language, grant/revoke consent, complete AI voice/touch intake, upload medical documents, and view session confirmation. |
| **Doctor** | Can view active clinical sessions, inspect AI-extracted observations, review uploaded documents, edit generated summaries, and set record status to `APPROVED` or `REJECTED`. |
| **Staff / Admin** | Can create patient profiles, manage kiosk sessions, monitor triage red-flag alerts, and manage user accounts (`ADMIN / DOCTOR / STAFF`). |

---

## 10. End-to-End User Journey

```
┌───────────────────────────┐
│   Patient Identification  │  (Demo ID / Phone / Local Search)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│     Language Selection    │  (Hindi / English / Regional)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│     Consent Management    │  (AI Intake & Document Processing Consent)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│  Conversational Intake    │  (Voice & Touch Adaptive Questions)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│     Document Processing   │  (OCR + AI Data Extraction)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│   AI Draft Summary &      │  (Creates DRAFT Clinical Record &
│   Red-Flag Triage Alert   │   Observation Entities in DB)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│      Doctor Review        │  (Physician View, Edit, Approve/Reject)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│   Final Clinical Record   │  (Saved with APPROVED status)
└───────────────────────────┘
```

---

## 11. Core Product Modules

### Module A — Patient Identification and Session Management

- **Feature Name**: Patient Registration & Kiosk Session Initialization
- **Purpose**: Identify returning patients or register new ones and create an active `clinical_session`.
- **User**: Patient / Hospital Staff
- **Input**: Phone number, Name, Date of Birth, Gender, Preferred Language.
- **Processing**: Searches `patients` entity in database; if not found, creates a new `patients` record. Creates a new record in `clinical_sessions` with status `STARTED`.
- **Output**: Unique `session_id` and active kiosk session.
- **Success Criteria**: Session created and linked to `patient_id` within < 1 second.

> **Hackathon MVP Note**: Identity verification utilizes `LOCAL` and sandbox `ABHA` reference IDs (`patient_identities` table). Real ABDM production gateway integration is reserved for Future Scope.

---

### Module B — Consent Management

- **Feature Name**: Consent Engine
- **Purpose**: Record explicit patient consent prior to AI conversation and document scanning.
- **User**: Patient
- **Input**: Touch toggle / Voice affirmative (`AI_CASE_TAKING`, `DOCUMENT_PROCESSING`).
- **Processing**: Saves consent entry into `patient_consents` table with timestamp (`granted_at`), `consent_type`, and `status = GRANTED`.
- **Output**: Audit-compliant consent record linked to `patient_id` and `session_id`.
- **Success Criteria**: AI interview cannot launch unless `status = GRANTED` is stored in `patient_consents`.

---

### Module C — Conversational Multimodal History Engine

- **Feature Name**: AI Adaptive Clinical Intake Engine
- **Purpose**: Guide patient through a structured clinical history interview using voice or touch.
- **User**: Patient
- **Input**: Voice audio / Touch selection (Chief Complaint, Duration, Severity, Past Medical History, Current Medications, Allergies).
- **Processing**: Communicates via Backend API with n8n AI workflow orchestrator (Ollama/LLM). Stores raw dialogue turns in `case_messages`. Extracts structured symptoms and entities into `clinical_observations`.
- **Output**: Adaptive follow-up questions rendered on screen and played as voice prompts.
- **Success Criteria**: Adaptive follow-up question generated within < 2.5 seconds per turn.

> **AYUSH Extension Scope**: Supports basic lifestyle questionnaire (*Ahara-Vihara*, diet, sleep) as an optional module path for AIIA clinical workflows.

---

### Module D — Red-Flag and Priority Detection

- **Feature Name**: Clinical Triage & Red-Flag Alert Engine
- **Purpose**: Detect high-risk emergency symptoms during intake to warn hospital staff immediately.
- **User**: System / Triage Staff / Doctor
- **Input**: Patient responses (e.g., "radiating chest pain", "sudden loss of speech", "severe breathlessness").
- **Processing**: AI workflow analyzes incoming `case_messages` against emergency keyword patterns. If detected, flags session status and creates a high-priority entry.
- **Output**: Visual warning badge on Doctor Dashboard and Kiosk alert notification.
- **Success Criteria**: Red-flag symptoms trigger alert flag within < 500ms of message processing.

> **Safety Warning**: This feature is strictly a **decision-support triage alert**. It does not perform clinical diagnosis.

---

### Module E — Medical Document Processing

- **Feature Name**: OCR & Medical Document Data Extractor
- **Purpose**: Extract clinical entities from uploaded prescriptions, lab reports, and summaries.
- **User**: Patient / Staff
- **Input**: Image upload or camera scan of medical document.
- **Processing**: Uploads file to backend, stores metadata in `medical_documents`. Triggers OCR extraction pipeline. Extracted text is parsed by LLM into structured `clinical_observations` (Category: `MEDICATION`, `LAB_RESULT`, `CONDITION`).
- **Output**: Extracted medicines, dosages, and diagnoses stored in `clinical_observations` linked to `session_id`.
- **Success Criteria**: Document processed and structured data previewed within < 5 seconds.

---

### Module F — Structured Clinical Summary

- **Feature Name**: Physician Summary Generator
- **Purpose**: Synthesize all conversation history and document observations into a draft clinical summary.
- **User**: System / Doctor
- **Input**: `case_messages`, `clinical_observations`, and `medical_documents` linked to `session_id`.
- **Processing**: AI workflow formats unstructured input into standardized SOAP format (Chief Complaint, HPI, Past History, Medications, Allergies, System Review). Creates record in `clinical_records` with `review_status = PENDING`.
- **Output**: Formatted summary stored in `clinical_records`.
- **Success Criteria**: Complete draft summary created automatically upon session completion (`completed_at`).

---

### Module G — Doctor Review Dashboard

- **Feature Name**: Physician Verification & Approval Interface
- **Purpose**: Allow doctors to review, edit, approve, or reject AI-generated clinical records.
- **User**: Doctor
- **Input**: Doctor edits, clinical notes, approval/rejection button clicks.
- **Processing**: Updates `clinical_records` fields (`doctor_notes`, `review_status = APPROVED / REJECTED`, `reviewed_by`, `reviewed_at`). Updates `clinical_sessions` status to `REVIEWED`.
- **Output**: Permanently approved clinical record saved as the official session record.
- **Success Criteria**: Doctor can approve or edit record in under 30 seconds.

---

### Module H — Future Integration Layer

- **Feature Name**: Interoperability Readiness Gateway (Future Scope)
- **Purpose**: Prepare clinical records for export to external hospital systems via FHIR / ABDM standard schemas.
- **User**: System / Admin
- **Input**: Approved `clinical_records` and `patient_identities`.
- **Processing**: Maps database records to FHIR payload standards for future ABDM health data repository sharing.
- **Output**: FHIR-compliant JSON payload wrapper (Mock/Sandbox ready).
- **Success Criteria**: Data schema compatibility verified against ABDM FHIR specs.

---

## 12. Functional Requirements

| Req ID | Module | Requirement Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-001** | Patient Identity | System shall allow searching existing patients by phone or creating a new patient record in `patients`. | **P0** |
| **FR-002** | Patient Identity | System shall store demo identity references (`LOCAL`, `ABHA`) in `patient_identities`. | **P1** |
| **FR-003** | Consent | System shall mandate explicit consent recording in `patient_consents` before starting AI interview. | **P0** |
| **FR-004** | Session | System shall initialize a `clinical_sessions` record with status `STARTED` for each intake session. | **P0** |
| **FR-005** | Case Taking | System shall record all dialogue turns (sender: `AI`, `PATIENT`, `DOCTOR`) inside `case_messages`. | **P0** |
| **FR-006** | Case Taking | System shall support voice-to-text and touch input for chief complaint and symptom duration. | **P0** |
| **FR-007** | Red-Flag | System shall analyze patient input for emergency keywords and display high-priority triage alerts. | **P0** |
| **FR-008** | Documents | System shall store uploaded files in `medical_documents` and run OCR text extraction. | **P0** |
| **FR-009** | Data Structuring | System shall populate `clinical_observations` with categories: `SYMPTOM`, `MEDICATION`, `ALLERGY`, `CONDITION`, `LAB_RESULT`. | **P1** |
| **FR-010** | Clinical Summary | System shall automatically generate a SOAP clinical summary and store it in `clinical_records` with `review_status = PENDING`. | **P0** |
| **FR-011** | Doctor Dashboard | System shall provide a doctor interface to view, edit, approve, or reject draft clinical records. | **P0** |
| **FR-012** | AYUSH Intake | System shall provide optional questionnaire modules for Ayurvedic parameters (*Dashavidha Pariksha*). | **P2** |

---

## 13. Non-Functional Requirements

### 13.1 Security & Privacy
- **Data Encrypt**: All stored passwords hashed via bcrypt. Patient identity data decoupled from general clinical session data.
- **Role-Based Access Control (RBAC)**: Enforced via `users` table roles (`ADMIN`, `DOCTOR`, `STAFF`).
- **No Unsanitized Data**: All inputs validated via backend middleware before DB execution.

### 13.2 Performance
- **Kiosk Interface Latency**: Touch responses render in < 100ms.
- **AI Turnaround Time**: Local LLM/Ollama response generation within < 3 seconds per turn.
- **API Response Time**: Standard REST API responses delivered within < 200ms.

### 13.3 Accessibility & Multilingual Support
- **Multilingual UI**: UI text and voice prompts configurable in Hindi and English (with extensible support for regional languages).
- **High Contrast & Touch Target**: Minimum 48px touch targets for kiosk screens to accommodate elderly patients.

### 13.4 Reliability & Error Handling
- **Graceful AI Fallback**: If LLM workflow is unavailable, kiosk reverts to guided touch-based structured form intake without crashing.

---

## 14. AI Requirements and Safety Boundaries

1. **Strict Assistive Scope**: AI is strictly authorized to gather, transcribe, translate, and format patient information.
2. **Prohibited Actions**: AI is **STRICTLY PROHIBITED** from outputting diagnostic statements (e.g., "You have Tuberculosis"), prescribing drugs, or giving medical advice to the patient.
3. **Mandatory Human Validation**: All AI-generated outputs are saved with `review_status = PENDING` or `DRAFT`. No summary is finalized until a verified doctor reviews and clicks "Approve".
4. **Triage Alert Limitations**: Red-flag alerts are decision-support warnings for hospital staff and do not replace physical triage assessment.

---

## 15. Data and Database Considerations

The MediKiosk PRD maps directly to the schema specified in `database.md`. No conflicting entities or status fields are introduced.

### Conceptual Mapping Matrix:

```
[Patient Intake Kiosk]
       │
       ├── Patients & Identity  ────────► `patients`, `patient_identities`
       ├── Explicit Consent     ────────► `patient_consents` (GRANTS / REVOKES)
       ├── Session Tracking     ────────► `clinical_sessions` (STARTED -> COMPLETED -> REVIEWED)
       ├── Dialogue History     ────────► `case_messages` (AI / PATIENT turns)
       ├── Extracted Data       ────────► `clinical_observations` (SYMPTOM, MEDICATION, etc.)
       ├── Document Scans       ────────► `medical_documents` (PRESCRIPTION, LAB_REPORT)
       └── Final Summary        ────────► `clinical_records` (PENDING -> APPROVED / REJECTED)
```

---

## 16. System Architecture & Workflow

```
┌────────────────────────────────────────────────────────────────────────┐
│                          React Kiosk Frontend                          │
│              (Voice / Touch Interface + Language Picker)               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼  REST APIs / JSON
┌────────────────────────────────────────────────────────────────────────┐
│                        Node.js / Express Backend                       │
│    (Auth, Session State, Input Validation, Security, DB Controller)   │
└─────────┬─────────────────────────┬──────────────────────────┬─────────┘
          │                         │                          │
          ▼                         ▼                          ▼
┌───────────────────┐     ┌───────────────────┐      ┌───────────────────┐
│ Database (MongoDB)│     │ n8n AI Orchestrator│      │ Document Engine   │
│ Source of Truth   │     │ (Case Taking, LLM)│      │ (OCR Extraction)  │
└───────────────────┘     └─────────┬─────────┘      └───────────────────┘
                                    │
                                    ▼
                          ┌───────────────────┐
                          │   Ollama / LLM    │
                          └───────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Doctor Review Dashboard                          │
│               (Edit, Approve / Reject Clinical Record)                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 17. MVP Scope (Hackathon Priority Strategy)

### P0 — Must Have for Hackathon MVP
- Demo patient search / local registration (`patients` table).
- Granular consent recording (`patient_consents` table).
- Multilingual selection (Hindi / English).
- Conversational touch and basic voice input (`case_messages`).
- Automatic creation of `clinical_sessions`.
- Basic prescription/report image upload (`medical_documents`).
- AI SOAP clinical summary generation (`clinical_records` with `PENDING` status).
- Basic Red-flag emergency keyword alert banner.
- Doctor dashboard to review, edit, approve (`APPROVED`), or reject (`REJECTED`) summary.

### P1 — Important Improvements
- Complete OCR parsing of uploaded document text into `clinical_observations`.
- Fine-tuned speech-to-text integration for noisy OPD environments.
- Detailed visual timeline of past medical records.
- Sandbox `ABHA` reference identity creation (`patient_identities`).

### P2 — Future Scope
- Live production ABDM gateway integration and FHIR record linking.
- Full AYUSH *Dashavidha Pariksha* & *Ahara-Vihara* expanded clinical module.
- Multi-kiosk hardware integration (physical printer, thermal barcode scanner).

---

## 18. Acceptance Criteria

The Hackathon MVP is considered **COMPLETE** when:
1. A new or returning patient can start a kiosk session and select their language.
2. Consent is explicitly recorded in `patient_consents` before case taking starts.
3. The patient completes an interactive intake session with audio/touch dialogue saved in `case_messages`.
4. Uploaded document photos are saved in `medical_documents` and linked to the session.
5. The AI workflow synthesizes a SOAP draft clinical summary stored in `clinical_records` with status `PENDING`.
6. High-risk symptoms trigger a red-flag warning tag on the session.
7. A doctor can log into the Doctor Dashboard, inspect the session summary, edit clinical notes, and switch record status to `APPROVED`.

---

## 19. Risks and Limitations

1. **AI Hallucination & Accuracy**: LLMs may misinterpret colloquial Hindi/English medical phrases. *Mitigation*: Doctor review mandatory before saving final record.
2. **OCR Parsing Quality**: Handwritten doctor prescriptions may yield poor OCR text extraction. *Mitigation*: OCR text tagged with confidence score and editable by doctor.
3. **OPD Ambient Noise**: High background noise in hospital waiting rooms can interfere with voice input. *Mitigation*: Fallback to touch-based multi-choice inputs.
4. **Network & LLM Latency**: Large local models might slow down kiosk turnaround times. *Mitigation*: Use lightweight quantized Ollama models (e.g., Llama3 8B / Qwen 2.5).

---

## 20. Assumptions and Open Questions

### Assumptions:
- Kiosks will run on touch-enabled hardware with active network access to local/cloud backend services.
- Hospital doctors will access the dashboard via standard tablet or desktop Web browsers.

### Open Questions / Proposed Database Enhancements:
- *Question*: Should `patient_consents` include an explicit `ip_address` or `device_id` field for physical kiosk hardware auditing?
- *Proposed Enhancement*: Consider adding an optional `triage_priority` (`NORMAL` vs `RED_FLAG`) field directly to `clinical_sessions` in future database updates.

---

## 21. Future Scope

- **Official ABDM & ABHA Gateway Integration**: Full compliance with National Health Authority (NHA) health repository standards.
- **AYUSH Diagnostic Knowledge Integration**: Deeper Ayurvedic disease classification (*Nidana*) and prakriti assessment modules.
- **Smart Queue Management**: Integration with hospital OPD token calling systems based on triage priority.

---

## 22. Disclaimer

> **IMPORTANT NOTICE**:  
> **MediKiosk** is designed exclusively as an administrative and clinical decision-support information structuring tool. **It does NOT perform autonomous medical diagnosis, provide clinical advice, or prescribe medications.**  
> All AI-generated clinical summaries are temporary drafts (`PENDING`) that must be reviewed, verified, edited, and approved by a licensed healthcare professional. Final clinical responsibility remains entirely with qualified medical doctors.
