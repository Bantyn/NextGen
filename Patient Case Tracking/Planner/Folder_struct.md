# 📁 Patient Case Tracking System — Folder Structure Specification

> **Document Status**: Official Architecture & Directory Standard  
> **Target Application**: Patient Case Tracking System (`Patient Case Tracking`)  
> **Compliant With**: `Basic Instructions/AGENTS.md` & `Basic Instructions/ANTIGRAVITY.md` (Feature-Based Modular Architecture & Decoupled Backend Pattern)

---

## 1. 🏗️ High-Level System Architecture

The Patient Case Tracking application strictly enforces a **Feature-Based Modular Frontend Architecture** and a **Decoupled 4-Tier Backend Architecture (Repository → Service → Controller → Routes/Middleware)**.

```
Patient Case Tracking/
├── frontend/               # React + Tailwind CSS (Feature-Based Modular Architecture)
└── server/                 # Node.js + Express + MongoDB (Decoupled 4-Tier Architecture)
```

---

## 2. 💻 Frontend Folder Structure (`frontend/`)

The frontend application follows the **Feature-Based Modular Architecture** defined in `Basic Instructions/ANTIGRAVITY.md` and `Basic Instructions/AGENTS.md`.

```
frontend/
├── public/                      # Static assets (favicons, logos, public icons)
├── src/
│   ├── assets/                  # Images, SVGs, static media files
│   ├── core/                    # Global Infrastructure & Universal Systems
│   │   ├── api/                 # Centralized HTTP/Axios Client & Interceptors
│   │   │   ├── apiClient.js     # Axios instance configuration & base URL
│   │   │   └── apiEndpoints.js  # Centralized API URI constants
│   │   ├── auth/                # Authentication Context, Guards & Session Logic
│   │   │   ├── AuthContext.jsx   # Auth provider & state
│   │   │   ├── ProtectedRoute.jsx# RBAC Route Guard wrapper
│   │   │   └── useAuth.js       # Auth hook
│   │   ├── config/              # Global Environment Config & Constants
│   │   │   ├── env.js           # Env variables export
│   │   │   └── roles.js         # Role constants (DOCTOR, RECEPTIONIST, NURSE, ADMIN)
│   │   ├── errors/              # Global Error Boundaries & Toast Handlers
│   │   │   └── ErrorBoundary.jsx# React Error Boundary
│   │   ├── state/               # Global Application Store (State Management)
│   │   │   └── globalStore.js   # Central state store
│   │   └── theme/               # Design Tokens & Styling Tokens
│   │       └── tokens.css       # CSS Root variables & design tokens
│   ├── components/              # Shared Atomic UI Component Library
│   │   ├── ui/                  # Base Atomic Controls
│   │   │   ├── Button.jsx       # Reusable Primary/Secondary/Ghost Buttons
│   │   │   ├── Input.jsx        # Reusable Text/Select Inputs with error handling
│   │   │   ├── Badge.jsx        # Status Badges (Checked-In, In Consultation, etc.)
│   │   │   └── Toggle.jsx       # Switch/Toggle controls
│   │   ├── feedback/            # User Feedback Overlays
│   │   │   ├── Modal.jsx        # Reusable Modal dialog
│   │   │   ├── Toast.jsx        # Notification Toast component
│   │   │   └── Skeleton.jsx     # Loading skeleton screens
│   │   └── layout/              # Universal Page Structures
│   │       ├── Navbar.jsx       # Top navigation bar
│   │       ├── Sidebar.jsx      # Dynamic RBAC Sidebar
│   │       └── Header.jsx       # Global header bar
│   ├── modules/                 # Feature-Based Domain Modules
│   │   ├── auth/                # Login, Register & Password Recovery
│   │   │   ├── components/      # LoginForm.jsx, RegisterForm.jsx
│   │   │   ├── services/        # authService.js
│   │   │   └── views/           # LoginView.jsx
│   │   ├── patient/             # Patient Registration & Lifecycle Tracking Module
│   │   │   ├── components/      # PatientCard.jsx, StatusTimeline.jsx, RegisterPatientForm.jsx
│   │   │   ├── services/        # patientService.js
│   │   │   ├── state/           # patientStore.js
│   │   │   └── views/           # PatientDirectoryView.jsx, PatientDetailView.jsx
│   │   ├── doctor/              # Clinical Dashboard & Medical Case History Module
│   │   │   ├── components/      # HistoryTimeline.jsx, PrescriptionForm.jsx, VitalsCard.jsx
│   │   │   ├── services/        # doctorService.js
│   │   │   └── views/           # DoctorDashboardView.jsx, PatientConsultationView.jsx
│   │   ├── lab/                 # Lab Tests & Report Upload Module
│   │   │   ├── components/      # TestOrderCard.jsx, UploadReportModal.jsx
│   │   │   ├── services/        # labService.js
│   │   │   └── views/           # LabDashboardView.jsx
│   │   └── admin/               # Hospital Staff & Role Management Module
│   │       ├── components/      # StaffTable.jsx, UserRoleModal.jsx
│   │       ├── services/        # adminService.js
│   │       └── views/           # StaffManagementView.jsx
│   ├── routes/                  # Central Routing Config
│   │   └── AppRoutes.jsx        # React Router routes mapping
│   ├── utils/                   # Shared Pure Utilities & Math Helpers
│   │   ├── formatDate.js        # Date formatting helpers
│   │   ├── formatName.js        # Name formatting helpers
│   │   └── validators.js        # Input validation helpers
│   ├── App.jsx                  # Root Application Component
│   ├── index.css                # Global styles & CSS token imports
│   └── main.jsx                 # Application entry point
├── .env.example                 # Sample frontend environment variables
├── package.json                 # Frontend dependencies & scripts
├── tailwind.config.js           # Tailwind CSS configuration
└── vite.config.js               # Vite bundler configuration
```

---

## 3. ⚙️ Backend Folder Structure (`server/`)

The backend application follows the strict **Decoupled 4-Tier Backend Architecture (Repository → Service → Controller → Routes/Middleware)** defined in `Basic Instructions/AGENTS.md` and `Basic Instructions/ANTIGRAVITY.md`.

> ⚠️ **Mandatory Rule**: Business logic MUST NEVER exist inside Controllers or Route handlers. All domain logic resides strictly inside the Service layer.

```
server/
├── src/
│   ├── config/                  # Database Connections & Environment Specs
│   │   ├── db.js                # MongoDB Mongoose connection handler
│   │   └── env.js               # Validated environment configuration
│   ├── constants/               # Global System Constants & Enums
│   │   ├── roles.js             # RBAC Roles (DOCTOR, RECEPTIONIST, NURSE, ADMIN)
│   │   ├── patientStatus.js     # Patient Lifecycle Statuses
│   │   └── httpStatus.js        # HTTP Status Code constants
│   ├── controllers/             # Request Handling & Response Formatting (NO Business Logic)
│   │   ├── authController.js    # Auth request parser & response builder
│   │   ├── patientController.js # Patient API request handlers
│   │   ├── doctorController.js  # Clinical consultation request handlers
│   │   ├── labController.js     # Lab test & report request handlers
│   │   └── userController.js    # Admin staff management request handlers
│   ├── middleware/              # Guards, Validation & Error Handlers
│   │   ├── authMiddleware.js    # JWT token verification middleware
│   │   ├── rbacMiddleware.js    # Role-Based Access Control middleware
│   │   ├── validateMiddleware.js# Input validation middleware (Zod / Joi)
│   │   └── errorMiddleware.js   # Global centralized error handler
│   ├── models/                  # Database Schemas & Models (Mongoose Schemas)
│   │   ├── User.js              # User schema (Credentials, Role, Profile)
│   │   ├── Patient.js           # Patient schema (Demographics, Case ID, Current Status)
│   │   ├── CaseHistory.js       # Clinical Case History & Consultation notes schema
│   │   ├── LabReport.js         # Lab test order & uploaded document schema
│   │   └── AuditLog.js          # System security & action audit logs
│   ├── repositories/            # Direct Database Access Layer (Data Access Queries)
│   │   ├── userRepository.js    # Direct DB queries for Users
│   │   ├── patientRepository.js # Direct DB queries for Patients
│   │   ├── caseRepository.js    # Direct DB queries for Case Histories
│   │   └── labRepository.js     # Direct DB queries for Lab Reports
│   ├── routes/                  # API Endpoint Route Specifications
│   │   ├── index.js             # Router aggregator
│   │   ├── authRoutes.js        # /api/v1/auth endpoints
│   │   ├── patientRoutes.js     # /api/v1/patients endpoints
│   │   ├── doctorRoutes.js      # /api/v1/doctor endpoints
│   │   ├── labRoutes.js         # /api/v1/lab endpoints
│   │   └── userRoutes.js        # /api/v1/users endpoints
│   ├── services/                # CORE BUSINESS LOGIC LAYER
│   │   ├── authService.js       # Auth logic, password hashing, token generation
│   │   ├── patientService.js    # Patient lifecycle state transitions & check-in logic
│   │   ├── doctorService.js     # Clinical diagnosis & prescription business logic
│   │   ├── labService.js        # Lab test dispatch & report processing logic
│   │   └── userService.js       # Staff onboarding & role update logic
│   ├── utils/                   # Shared Utilities & Pure Helpers
│   │   ├── generateToken.js     # JWT token generator
│   │   ├── logger.js            # Structured logger (Winston/Pino)
│   │   └── apiResponse.js       # Standardized JSON response wrapper
│   └── app.js                   # Express app initializations & middleware setup
├── .env.example                 # Environment variables template
├── package.json                 # Backend dependencies & npm scripts
└── server.js                    # Server HTTP entry point & port listener
```

---

## 4. 🔗 Summary of Architectural Enforcements

| Component | Guideline & Standard |
| :--- | :--- |
| **Frontend Layout** | Modular Feature-based (`src/modules/[feature]`) keeping components, services, and views isolated per feature. |
| **Shared UI Controls** | Atomic UI library (`src/components/ui/` and `src/components/feedback/`). Zero duplicate buttons or modals. |
| **Backend Layer Flow** | `Routes` ➔ `Middleware` ➔ `Controller` ➔ `Service` ➔ `Repository` ➔ `Database`. |
| **Business Logic Isolation** | Kept exclusively inside `services/`. Controllers are thin and only map HTTP requests/responses. |
| **Database Queries** | Isolated strictly within `repositories/` to ensure modularity and ease of testing. |
