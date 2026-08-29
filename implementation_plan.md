# 🏗️ Setup & Scaffold: Patient Case Tracking System

Set up and scaffold the complete enterprise codebase for the **Patient Case Tracking System** (both `server` and `frontend`), strictly conforming to [Folder_struct.md](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Planner/Folder_struct.md), [Theme.md](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Planner/Theme.md), [Backend.md](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Roles/Backend.md), and [Frontend.md](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Roles/Frontend.md).

---

## User Review Required

> [!IMPORTANT]
> - **Zero Placeholder Policy**: All services, repositories, controllers, models, atomic UI components, and views will be fully functional and production-ready without any mock placeholders or stub code.
> - **Dual Theme Engine**: The frontend will natively support both **Dark Mode** (default clinical deep slate) and **Light Mode** using CSS variables from `tokens.css`.
> - **Decoupled 4-Tier Backend**: The backend strictly follows `Routes ➔ Middleware ➔ Controller ➔ Service ➔ Repository ➔ Database (Mongoose)`.

---

## Proposed Changes

### ⚙️ Backend Layer (`Patient Case Tracking/Server/`)

#### 1. Configuration & Utilities
- [NEW] [src/config/env.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/config/env.js): Validated configuration and environment variables.
- [NEW] [src/config/db.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/config/db.js): MongoDB Mongoose connection with event listeners and retry handling.
- [NEW] [src/constants/roles.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/constants/roles.js): RBAC roles (`ADMIN`, `DOCTOR`, `STAFF`, `NURSE`, `LAB_TECH`).
- [NEW] [src/constants/patientStatus.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/constants/patientStatus.js): Clinical lifecycle states (`REGISTERED`, `WAITING`, `IN_CONSULTATION`, `LAB_PENDING`, `COMPLETED`, `CRITICAL`, `DISCHARGED`).
- [NEW] [src/constants/httpStatus.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/constants/httpStatus.js): Standard HTTP status code constants.
- [NEW] [src/utils/generateToken.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/utils/generateToken.js): JWT token generation with expiration.
- [NEW] [src/utils/logger.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/utils/logger.js): Winston structured logger.
- [NEW] [src/utils/apiResponse.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/utils/apiResponse.js): Standardized JSON response formatting (`success`, `data`, `error`).

#### 2. Models (Mongoose Schemas)
- [NEW] [src/models/User.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/User.js): User profile, role, password hash, status.
- [NEW] [src/models/Patient.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/Patient.js): Patient demographic details, unique patient ID, current lifecycle status, vitals, medical history.
- [NEW] [src/models/PatientIdentity.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/PatientIdentity.js): ABHA, Aadhaar, Local ID references with verification status.
- [NEW] [src/models/PatientConsent.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/PatientConsent.js): Consent management records (`AI_CASE_TAKING`, `DOCUMENT_PROCESSING`, `ABDM_DATA_SHARING`).
- [NEW] [src/models/ClinicalSession.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/ClinicalSession.js): Intake sessions (`STARTED`, `IN_PROGRESS`, `COMPLETED`, `REVIEWED`).
- [NEW] [src/models/CaseMessage.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/CaseMessage.js): Conversational dialogue messages between AI, Patient, and Doctor.
- [NEW] [src/models/ClinicalObservation.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/ClinicalObservation.js): Structured AI-extracted clinical symptoms, medications, allergies, conditions.
- [NEW] [src/models/MedicalDocument.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/MedicalDocument.js): Uploaded prescriptions and lab test documents with OCR status.
- [NEW] [src/models/ClinicalRecord.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/ClinicalRecord.js): Synthesized SOAP records and doctor review actions (`PENDING`, `APPROVED`, `REJECTED`).
- [NEW] [src/models/AuditLog.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/models/AuditLog.js): Security and action audit logging.

#### 3. Repositories (Database Access Layer)
- [NEW] [src/repositories/userRepository.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/repositories/userRepository.js): Direct Mongoose queries for Users.
- [NEW] [src/repositories/patientRepository.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/repositories/patientRepository.js): Direct queries for Patients and Identities.
- [NEW] [src/repositories/sessionRepository.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/repositories/sessionRepository.js): Queries for Clinical Sessions and Case Messages.
- [NEW] [src/repositories/caseRepository.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/repositories/caseRepository.js): Queries for Clinical Records and Consultation Histories.
- [NEW] [src/repositories/observationRepository.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/repositories/observationRepository.js): Queries for Clinical Observations.
- [NEW] [src/repositories/documentRepository.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/repositories/documentRepository.js): Queries for Medical Documents.
- [NEW] [src/repositories/consentRepository.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/repositories/consentRepository.js): Queries for Patient Consents.
- [NEW] [src/repositories/auditRepository.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/repositories/auditRepository.js): Queries for Audit Logs.

#### 4. Services (Core Business Logic Layer)
- [NEW] [src/services/authService.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/services/authService.js): User registration, password verification, token generation, seed initialization.
- [NEW] [src/services/patientService.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/services/patientService.js): Registration, search, status transitions, identity attachment.
- [NEW] [src/services/doctorService.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/services/doctorService.js): Active doctor queue, consultation notes, SOAP record generation, approval/rejection.
- [NEW] [src/services/labService.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/services/labService.js): Lab report upload, document processing, test management.
- [NEW] [src/services/userService.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/services/userService.js): Staff listing, role assignment, account status updates.
- [NEW] [src/services/sessionService.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/services/sessionService.js): Intake session lifecycles, dialogue turns recording, consent validation.

#### 5. Controllers (Thin HTTP Request/Response Mappers)
- [NEW] [src/controllers/authController.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/controllers/authController.js)
- [NEW] [src/controllers/patientController.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/controllers/patientController.js)
- [NEW] [src/controllers/doctorController.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/controllers/doctorController.js)
- [NEW] [src/controllers/labController.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/controllers/labController.js)
- [NEW] [src/controllers/userController.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/controllers/userController.js)
- [NEW] [src/controllers/sessionController.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/controllers/sessionController.js)
- [NEW] [src/controllers/recordController.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/controllers/recordController.js)

#### 6. Middleware & Routing
- [NEW] [src/middleware/authMiddleware.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/middleware/authMiddleware.js): JWT token parsing and user validation.
- [NEW] [src/middleware/rbacMiddleware.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/middleware/rbacMiddleware.js): Role authorization guard.
- [NEW] [src/middleware/validateMiddleware.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/middleware/validateMiddleware.js): Zod request schema validator.
- [NEW] [src/middleware/errorMiddleware.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/middleware/errorMiddleware.js): Centralized error handling and formatting.
- [NEW] [src/routes/index.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/routes/index.js): Main route aggregator.
- [NEW] [src/routes/authRoutes.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/routes/authRoutes.js)
- [NEW] [src/routes/userRoutes.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/routes/userRoutes.js)
- [NEW] [src/routes/patientRoutes.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/routes/patientRoutes.js)
- [NEW] [src/routes/sessionRoutes.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/routes/sessionRoutes.js)
- [NEW] [src/routes/doctorRoutes.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/routes/doctorRoutes.js)
- [NEW] [src/routes/labRoutes.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/routes/labRoutes.js)
- [NEW] [src/routes/recordRoutes.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/routes/recordRoutes.js)
- [MODIFY] [src/app.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/src/app.js): Wire up all middleware, API routes, and error handlers.
- [NEW] [server.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/server.js): HTTP listener, DB connection trigger, graceful shutdown.
- [MODIFY] [package.json](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Server/package.json): Ensure `"type": "module"` and proper npm scripts.

---

### 💻 Frontend Layer (`Patient Case Tracking/Frontend/`)

#### 1. Core Systems & Theme Engine (`src/core/`)
- [NEW] [src/core/theme/tokens.css](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/core/theme/tokens.css): The complete design token system from `Theme.md` (colors, clinical statuses, font sizes, glassmorphism tokens, light/dark themes).
- [NEW] [src/core/api/apiClient.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/core/api/apiClient.js): Axios instance with JWT interceptor and error formatting.
- [NEW] [src/core/api/apiEndpoints.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/core/api/apiEndpoints.js): Centralized API URI dictionary.
- [NEW] [src/core/auth/AuthContext.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/core/auth/AuthContext.jsx): Complete authentication state, login, register, logout, and token persistence.
- [NEW] [src/core/auth/useAuth.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/core/auth/useAuth.js): Custom hook to consume AuthContext.
- [NEW] [src/core/auth/ProtectedRoute.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/core/auth/ProtectedRoute.jsx): RBAC route guard component.
- [NEW] [src/core/config/env.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/core/config/env.js): Environment variables.
- [NEW] [src/core/config/roles.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/core/config/roles.js): Role constants.
- [NEW] [src/core/errors/ErrorBoundary.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/core/errors/ErrorBoundary.jsx): Glassmorphic error boundary with recovery actions.
- [NEW] [src/core/state/globalStore.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/core/state/globalStore.js): App-wide context for active patient, theme toggle, and notifications.

#### 2. Atomic UI Library & Feedback (`src/components/`)
- [NEW] [src/components/ui/Button.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/components/ui/Button.jsx): High-end token-driven button (Primary, Secondary, Ghost, Danger, Outline) with loading state.
- [NEW] [src/components/ui/Input.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/components/ui/Input.jsx): Modern inputs with icons, validation errors, and search styles.
- [NEW] [src/components/ui/Badge.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/components/ui/Badge.jsx): Status badges for patient lifecycle (`REGISTERED`, `WAITING`, `IN_CONSULTATION`, `LAB_PENDING`, `COMPLETED`, `CRITICAL`) and roles.
- [NEW] [src/components/ui/Toggle.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/components/ui/Toggle.jsx): Accessible switch control.
- [NEW] [src/components/feedback/Modal.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/components/feedback/Modal.jsx): Glassmorphism modal with animated entry/exit and backdrop blur.
- [NEW] [src/components/feedback/Toast.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/components/feedback/Toast.jsx): Floating clinical notification toasts.
- [NEW] [src/components/feedback/Skeleton.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/components/feedback/Skeleton.jsx): Shimmer loading states for cards, tables, text.
- [NEW] [src/components/layout/Navbar.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/components/layout/Navbar.jsx): Mobile navigation bar.
- [NEW] [src/components/layout/Sidebar.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/components/layout/Sidebar.jsx): Dynamic RBAC sidebar with active indicator pills and collapse options.
- [NEW] [src/components/layout/Header.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/components/layout/Header.jsx): Sticky glass header with global search, theme switcher (Dark/Light), role badge, and user dropdown.
- [NEW] [src/components/layout/Layout.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/components/layout/Layout.jsx): Unified layout shell.

#### 3. Feature Modules (`src/modules/`)
- **Authentication Module (`src/modules/auth/`)**:
  - `components/LoginForm.jsx`, `components/RegisterForm.jsx`
  - `services/authService.js`
  - `views/LoginView.jsx`, `views/RegisterView.jsx`
- **Patient Module (`src/modules/patient/`)**:
  - `components/PatientCard.jsx`, `components/StatusTimeline.jsx`, `components/RegisterPatientForm.jsx`, `components/PatientFilterBar.jsx`
  - `services/patientService.js`
  - `state/patientStore.js`
  - `views/PatientDirectoryView.jsx`, `views/PatientDetailView.jsx`
- **Doctor Module (`src/modules/doctor/`)**:
  - `components/HistoryTimeline.jsx`, `components/PrescriptionForm.jsx`, `components/VitalsCard.jsx`, `components/SOAPEditor.jsx`, `components/ActiveQueue.jsx`
  - `services/doctorService.js`
  - `views/DoctorDashboardView.jsx`, `views/PatientConsultationView.jsx`
- **Lab Module (`src/modules/lab/`)**:
  - `components/TestOrderCard.jsx`, `components/UploadReportModal.jsx`, `components/OCRResultViewer.jsx`
  - `services/labService.js`
  - `views/LabDashboardView.jsx`
- **Admin Module (`src/modules/admin/`)**:
  - `components/StaffTable.jsx`, `components/UserRoleModal.jsx`, `components/AuditLogViewer.jsx`, `components/SystemStatsCard.jsx`
  - `services/adminService.js`
  - `views/StaffManagementView.jsx`

#### 4. Shared Utilities & Routing
- [NEW] [src/utils/formatDate.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/utils/formatDate.js)
- [NEW] [src/utils/formatName.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/utils/formatName.js)
- [NEW] [src/utils/validators.js](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/utils/validators.js)
- [NEW] [src/routes/AppRoutes.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/routes/AppRoutes.jsx): Full routing configuration.
- [MODIFY] [src/App.jsx](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/App.jsx): Root app with providers.
- [MODIFY] [src/index.css](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/src/index.css): Clean imports of tokens and glassmorphism styling.
- [MODIFY] [package.json](file:///e:/SIH%20PROJECT/NextGen/Patient%20Case%20Tracking/Frontend/package.json): Install `react-router-dom`, `lucide-react`, `axios`.

---

## Verification Plan

### Automated Build & Syntax Checks
- `npm run build` or Vite compile check in `Frontend/` to verify zero JSX or bundling errors.
- Syntax verification in `Server/` with Node to ensure all modules, imports, schemas, routes, and controllers parse cleanly.

### Manual & Functional Verification
- Verify that both Dark and Light themes render correctly and seamlessly switch.
- Verify that RBAC route guards properly protect views.
- Verify that all API services in the frontend match the backend endpoints.
- Test server startup and health check (`GET /api/v1/health`).
