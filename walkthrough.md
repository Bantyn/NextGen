# 🏥 Walkthrough: Patient Case Tracking System Setup

Scaffolded and implemented the complete enterprise architecture for the **Patient Case Tracking System** across both `Server` (Node.js + Express) and `Frontend` (React + Vite), strictly compliant with [Folder_struct.md](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Planner/Folder_struct.md), [Theme.md](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Planner/Theme.md), [Backend.md](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Roles/Backend.md), and [Frontend.md](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Roles/Frontend.md).

---

## 🏗️ Architecture & Completed Systems

### 1. ⚙️ Decoupled 4-Tier Backend (`Patient Case Tracking/Server/`)

```
Routes ➔ Middleware ➔ Controller ➔ Service ➔ Repository ➔ Database (Mongoose)
```

| Layer | Files Implemented | Architectural Responsibility |
| :--- | :--- | :--- |
| **Config & Constants** | [env.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/config/env.js), [db.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/config/db.js), [roles.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/constants/roles.js), [patientStatus.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/constants/patientStatus.js), [httpStatus.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/constants/httpStatus.js) | Centralized environment variables, Mongoose connection, and RBAC / lifecycle status constants. |
| **Models (Mongoose)** | [User.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/User.js), [Patient.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/Patient.js), [PatientIdentity.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/PatientIdentity.js), [PatientConsent.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/PatientConsent.js), [ClinicalSession.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/ClinicalSession.js), [CaseMessage.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/CaseMessage.js), [ClinicalObservation.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/ClinicalObservation.js), [MedicalDocument.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/MedicalDocument.js), [ClinicalRecord.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/ClinicalRecord.js), [AuditLog.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/AuditLog.js) | Schemas for patients, vitals, ABHA identities, consents, dialogue transcripts, SOAP records, and audit logs. |
| **Repositories** | `userRepository.js`, `patientRepository.js`, `sessionRepository.js`, `caseRepository.js`, `observationRepository.js`, `documentRepository.js`, `consentRepository.js`, `auditRepository.js` | Direct database query isolation layer (zero business logic or HTTP code). |
| **Services** | `authService.js`, `patientService.js`, `doctorService.js`, `labService.js`, `userService.js`, `sessionService.js` | Core business logic layer (pure JS functions, lifecycle state machines, SOAP synthesis, password hashing, JWT generation). |
| **Controllers** | `authController.js`, `patientController.js`, `doctorController.js`, `labController.js`, `userController.js`, `sessionController.js`, `recordController.js` | Thin request extractors and JSON response builders (< 20 lines/function). |
| **Middleware & Routes** | `authMiddleware.js`, `rbacMiddleware.js`, `validateMiddleware.js`, `errorMiddleware.js`, `routes/index.js` | JWT verification, RBAC authorization, Zod schema validation, and structured error handling. |

---

### 2. 💻 Feature-Based Modular Frontend (`Patient Case Tracking/Frontend/`)

| Module / System | Components & Views | Key Capabilities |
| :--- | :--- | :--- |
| **Design Tokens & Theme** | [tokens.css](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/core/theme/tokens.css) | Single brand color engine, native **Dark Mode** & **Light Mode** matrices, glassmorphism blur tokens, clinical status palette. |
| **Core Infrastructure** | `apiClient.js`, `apiEndpoints.js`, `AuthContext.jsx`, `ProtectedRoute.jsx`, `globalStore.jsx`, `ErrorBoundary.jsx` | Centralized Axios client with JWT interceptor, RBAC route guard wrapper, theme toggle state, and crash boundary. |
| **Atomic UI Library** | `Button.jsx`, `Input.jsx`, `Badge.jsx`, `Toggle.jsx`, `Modal.jsx`, `Toast.jsx`, `Skeleton.jsx`, `Sidebar.jsx`, `Header.jsx`, `Layout.jsx` | Reusable controls with zero duplication, clinical status indicators, shimmer loaders, and responsive glass header/sidebar. |
| **Auth Module** | [LoginForm.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/modules/auth/components/LoginForm.jsx), [RegisterForm.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/modules/auth/components/RegisterForm.jsx), [LoginView.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/modules/auth/views/LoginView.jsx) | Authentication with fast demo login credentials (`doctor@medikiosk.ai`, `admin@medikiosk.ai`), validation, and JWT persistence. |
| **Patient Module** | [PatientDirectoryView.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/modules/patient/views/PatientDirectoryView.jsx), [PatientDetailView.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/modules/patient/views/PatientDetailView.jsx), [StatusTimeline.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/modules/patient/components/StatusTimeline.jsx) | Directory search, status filters, live metric counters, 5-stage clinical journey timeline, vitals modal, ABHA link modal. |
| **Doctor Module** | [DoctorDashboardView.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/modules/doctor/views/DoctorDashboardView.jsx), [PatientConsultationView.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/modules/doctor/views/PatientConsultationView.jsx), [SOAPEditor.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/modules/doctor/components/SOAPEditor.jsx), [PrescriptionForm.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/modules/doctor/components/PrescriptionForm.jsx) | Live OPD triage queue, split-screen consultation workstation, AI-synthesized SOAP editor, prescription generator, and lab ordering. |
| **Lab & OCR Module** | [LabDashboardView.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/modules/lab/views/LabDashboardView.jsx), [TestOrderCard.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/modules/lab/components/TestOrderCard.jsx), [OCRResultViewer.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/modules/lab/components/OCRResultViewer.jsx) | Multer document uploads, automated OCR text extraction triggering, and structured laboratory report inspection. |
| **Admin Module** | [StaffManagementView.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/modules/admin/views/StaffManagementView.jsx), [StaffTable.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/modules/admin/components/StaffTable.jsx), [AuditLogViewer.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/modules/admin/components/AuditLogViewer.jsx) | Staff accounts management, RBAC clearance level updates, account toggles, and security audit trails. |

---

## 🧪 Verification Results

1. **Frontend Production Build**:
   ```bash
   npm run build
   ✓ 1932 modules transformed.
   ✓ built in 450ms
   dist/index.html                   0.47 kB
   dist/assets/index-C11yoIqO.css    4.18 kB
   dist/assets/index-83vJJ6Oj.js   406.75 kB
   ```
2. **Backend Syntax & Module Parsing**:
   - `node -c server.js src/app.js src/routes/index.js` returned code `0` (clean ES modules validation).
3. **API Documentation**:
   - [Documentation/api_doc.md](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Documentation/api_doc.md) updated with complete request bodies, headers, role authorizations, and 200/400/500 JSON schema responses.

---

## 🚀 How to Run the Applications

### 1. Start the Backend Server:
```bash
cd "Patient Case Tracking/Server"
npm run dev
# Server listening at http://localhost:5000/api/v1
```

### 2. Start the Frontend Dev Server:
```bash
cd "Patient Case Tracking/Frontend"
npm run dev
# Client running at http://localhost:5173
```
