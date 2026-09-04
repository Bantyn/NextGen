# 🎨 Frontend Developer Guidelines & Operating Instructions

> **Role Target**: Frontend Developer (Kruti & Fullstack Support)  
> **Scope**: `Patient Case Tracking/frontend`  
> **Governing Standards**: `Basic Instructions/AGENTS.md` & `Basic Instructions/ANTIGRAVITY.md`

---

## 1. 🛑 CRITICAL BOUNDARIES & STRICT RULES

1. **NO BACKEND CODE MODIFICATIONS**:
   - Do **NOT** modify, edit, or create files inside the `server/` directory under any circumstances.
   - Do **NOT** create custom mock backend logic or alter database schemas.
2. **API CONTRACT COMPLIANCE**:
   - Read and strictly adhere to the official API documentation (`Documentation/api_doc.md` or `Documentation/PRD.md`).
   - All API endpoints, request payloads, header requirements, and JSON response structures must strictly follow the API documentation.
   - Never call API endpoints directly inside React components (`fetch`/`axios` inside `useEffect`). All network calls must be routed through centralized services in `src/modules/[feature]/services/` or `src/core/api/`.
3. **ZERO CODE DUPLICATION (DRY PRINCIPLE)**:
   - Before creating any component, check `src/components/ui/`, `src/components/feedback/`, and `src/components/layout/`.
   - Re-use existing Base Controls (`Button`, `Input`, `Badge`, `Modal`, `Toast`, `Skeleton`).
   - Do **NOT** write plain HTML `<button>` or `<input>` elements if a shared atomic component exists.
4. **DESIGN SYSTEM TOKENS ONLY**:
   - Never hardcode color hex codes (e.g., `#10b981`), font sizes, or border radii directly in CSS/JS.
   - Always use CSS tokens defined in `src/core/theme/tokens.css` (e.g., `var(--primary)`, `var(--surface-card)`, `var(--r-md)`).

---

## 2. 📁 FOLDER STRUCTURE COMPLIANCE

All frontend code must follow the **Feature-Based Modular Architecture** defined in `Planner/Folder_struct.md`.

```
frontend/src/
├── core/                        # Global Shared Infrastructure
│   ├── api/                     # Centralized Axios Client (apiClient.js, apiEndpoints.js)
│   ├── auth/                    # Auth Context, useAuth hook, ProtectedRoute
│   ├── config/                  # Global env variables & roles constants
│   ├── errors/                  # Error Boundaries & global handlers
│   └── theme/                   # tokens.css (Design System Tokens)
├── components/                  # Shared Atomic Component Library
│   ├── ui/                      # Base Controls (Button, Input, Badge, Toggle)
│   ├── feedback/                # Feedback Overlays (Modal, Toast, Skeleton)
│   └── layout/                  # Page Layouts (Navbar, Sidebar, Header)
├── modules/                     # Feature-Based Modules (ISOLATED DOMAINS)
│   ├── auth/                    # Login & Authentication Feature
│   ├── patient/                 # Patient Registration & Status Tracking Feature
│   ├── doctor/                  # Clinical Consultation & Doctor Dashboard Feature
│   ├── lab/                     # Lab Test & Report Upload Feature
│   └── admin/                   # Staff & RBAC Management Feature
└── utils/                       # Shared Pure Helpers (formatDate.js, validators.js)
```

---

## 3. 🛠️ WORKFLOW FOR CREATING & MODIFYING COMPONENTS

When assigned a feature task, follow this step-by-step procedure:

```
Step 1: Read API Spec (Documentation/api_doc.md)
   │
   ▼
Step 2: Inspect Shared Component Library (src/components/ui/)
   │
   ▼
Step 3: Determine Location (Shared Component vs Feature Component)
   │
   ▼
Step 4: Create/Update Feature Service (src/modules/[feature]/services/)
   │
   ▼
Step 5: Build Component / View using Shared UI & Design Tokens
   │
   ▼
Step 6: Handle UI States (Loading, Error, Empty & Success States)
```

### 3.1 Where to Place New Components

| Scenario | Destination Folder | Naming Convention | Example |
| :--- | :--- | :--- | :--- |
| **Generic UI Control** (used across 2+ modules, e.g. custom slider, dropdown) | `src/components/ui/` | PascalCase | `src/components/ui/Dropdown.jsx` |
| **Generic Feedback Overlay** (e.g. alert popup, drawer) | `src/components/feedback/` | PascalCase | `src/components/feedback/Drawer.jsx` |
| **Feature-Specific Card / Form** (only used in one feature) | `src/modules/[feature]/components/` | PascalCase | `src/modules/patient/components/PatientCard.jsx` |
| **Full Page View** | `src/modules/[feature]/views/` | PascalCase + `View` | `src/modules/patient/views/PatientDetailView.jsx` |

---

## 4. 🌐 API INTEGRATION GUIDELINES

### 4.1 How to Handle API Calls
1. **Never use direct `axios` or `fetch` inside JSX/Components**:
   ```javascript
   // ❌ BAD PRACTICE (Inside Component)
   useEffect(() => {
     axios.get('/api/v1/patients').then(res => setPatients(res.data));
   }, []);
   ```

2. **Always define API methods in the Module Service**:
   ```javascript
   // ✅ GOOD PRACTICE (src/modules/patient/services/patientService.js)
   import apiClient from '../../../core/api/apiClient';
   import { API_ENDPOINTS } from '../../../core/api/apiEndpoints';

   export const getPatients = async (filters) => {
     const response = await apiClient.get(API_ENDPOINTS.PATIENTS, { params: filters });
     return response.data;
   };
   ```

3. **Call the Service inside Component / Custom Hook**:
   ```javascript
   // ✅ GOOD PRACTICE (src/modules/patient/views/PatientDirectoryView.jsx)
   import { getPatients } from '../services/patientService';

   const fetchPatientData = async () => {
     try {
       setLoading(true);
       const data = await getPatients();
       setPatients(data);
     } catch (error) {
       setError(error.message);
     } finally {
       setLoading(false);
     }
   };
   ```

---

## 5. 🎨 UI & DESIGN SYSTEM RULES

1. **Design Tokens**:
   - Reference `tokens.css` for background colors, surface cards, primary colors, typography, and transitions.
   - Use CSS Variables or Tailwind classes mapped to design tokens.
2. **Handling All Component States**:
   Every data-driven component **MUST** implement 4 visual states:
   - ⏳ **Loading State**: Display `<Skeleton />` loaders (never blank screens).
   - ⚠️ **Error State**: Display a clear user-friendly error message with a retry option.
   - 📭 **Empty State**: Display helpful empty state graphics/text when array data is empty (`[]`).
   - ✅ **Success State**: Smooth transition to full data layout.

---

## 6. ✅ DEFINITION OF DONE FOR FRONTEND TASKS

Before requesting a PR review or marking a frontend task as finished:

- [ ] **No Backend Modifications**: Verified zero changes in `server/` directory.
- [ ] **API Doc Compliant**: Verified request/response payloads match `api_doc.md`.
- [ ] **Folder Structure Followed**: Files placed in correct `core/`, `components/`, `modules/`, or `utils/` paths.
- [ ] **No Component Duplication**: Atomic UI controls from `src/components/ui/` reused.
- [ ] **Responsive Design**: Tested and verified across Mobile, Tablet, and Desktop breakpoints.
- [ ] **UI States Handled**: Loading, Error, Empty, and Success states fully implemented.
- [ ] **Console Clean**: Zero unhandled React warnings, key missing errors, or runtime exceptions in browser console.
