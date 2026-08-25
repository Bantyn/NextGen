# 🧪 UI & QA Tester Guidelines & Operating Instructions

> **Role Target**: UI & QA Tester (Harshit & Quality Assurance Team)  
> **Scope**: System End-to-End Testing (UI/UX, Backend APIs, Roles/RBAC, Workflows)  
> **Governing Standards**: `Basic Instructions/AGENTS.md` & `Basic Instructions/ANTIGRAVITY.md`

---

## 1. 🛑 CRITICAL BOUNDARIES & STRICT RULES

1. **NO DIRECT SOURCE CODE EDITS**:
   - Do **NOT** modify or commit application code directly in `frontend/` or `server/` when encountering bugs.
   - Your primary duty is to test, reproduce, document, and report bugs to the respective developer (Frontend or Backend lead).
2. **VERIFY AGAINST OFFICIAL SPECIFICATIONS**:
   - Verify UI layouts and user flows against `Documentation/PRD.md` and `Planner/Folder_struct.md`.
   - Verify API functionality and payload formats against `Documentation/api_doc.md`.
3. **MANDATORY BUG REPORT STRUCTURE**:
   - Every identified bug or issue must be documented using the standardized Bug Report template provided in Section 4.
4. **ROLE-BASED ACCESS CONTROL (RBAC) VERIFICATION**:
   - Always test user flows under different roles (`RECEPTIONIST`, `NURSE`, `DOCTOR`, `LAB_TECH`, `ADMIN`).
   - Verify that non-authorized roles cannot access restricted routes, buttons, or backend endpoints.

---

## 2. 🎯 TESTING DOMAINS & RESPONSIBILITIES

### 2.1 🎨 UI / UX & Responsive Testing
- **Visual Design Compliance**: Ensure buttons, cards, typography, and colors match the design system tokens (`src/core/theme/tokens.css`).
- **Responsive Layouts**: Test layouts across Desktop (1920x1080), Laptop (1366x768), Tablet (768x1024), and Mobile (375x667).
- **UI States Verification**:
  - ⏳ **Loading**: Skeleton screens appear properly while fetching data.
  - ⚠️ **Error**: Meaningful error messages are displayed when network/API calls fail.
  - 📭 **Empty**: Clear empty states are shown when list/table data is empty.
  - ✅ **Success**: Clean transition to active data view.

### 2.2 🌐 Functional & End-to-End (E2E) Workflow Testing
- **Patient Lifecycle Flow**:
  - `Checked-In` ➡️ `Vitals Taken` ➡️ `In Consultation` ➡️ `Lab Tests Pending` ➡️ `Discharged`.
- **Doctor Dashboard**:
  - Verify doctor can access past medical history, enter clinical notes, and prescribe medications.
- **Lab Workflow**:
  - Verify lab technician can view pending test orders, upload report documents, and mark tests complete.

### 2.3 ⚙️ Backend API & Security Testing
- Test endpoints directly using Postman, cURL, or Playwright.
- Verify status codes: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Server Error`.
- Ensure invalid inputs return clear error messages instead of server crashes.

---

## 3. 🛠️ QA TESTER WORKFLOW

```
Step 1: Read Feature Spec (Documentation/PRD.md & api_doc.md)
   │
   ▼
Step 2: Pull Latest Code from test branch (git pull origin test)
   │
   ▼
Step 3: Execute Test Scenarios (UI, E2E, Roles, API Endpoints)
   │
   ▼
Step 4: If Bug Found ──► Create Structured Bug Report in Documentation/Bugs/
   │
   ▼
Step 5: Notify Developer (Frontend/Backend Lead) ──► Re-test after Fix
```

---

## 4. 📝 STANDARDIZED BUG REPORT TEMPLATE

When a bug is found, document it in `Documentation/Bugs/` (or issue tracker) using this format:

```markdown
### 🐛 Bug: [Brief Title of the Issue]

- **Feature Area**: [e.g., Patient Registration / Doctor Consultation / Auth]
- **Environment**: [Browser name & version / OS / Resolution]
- **Assigned Developer**: [Frontend Lead / Backend Lead]
- **Severity**: [Critical / Major / Minor / Cosmetic]

#### 1. Steps to Reproduce:
1. Log in as `RECEPTIONIST`.
2. Navigate to `/patients/register`.
3. Fill out patient details and click "Submit Patient".
4. Observe network response or UI behavior.

#### 2. Expected Result:
Patient is successfully registered, status badge displays `Checked-In`, and user is redirected to Patient Directory.

#### 3. Actual Result:
Screen turns blank, console shows `Uncaught TypeError: Cannot read properties of undefined (reading 'id')`.

#### 4. Evidence / Screenshots:
- Screenshot / Video Recording link attached
- Browser Console Log / API Error payload snippet
```

---

## 5. ✅ QA TESTER DEFINITION OF DONE (DoD)

A feature or sprint release is marked as **QA Approved** only when:

- [ ] **All Core User Flows Verified**: Patient registration, doctor consultation, lab tests, and discharge complete smoothly without breaks.
- [ ] **RBAC Security Verified**: Unauthorized roles cannot bypass permissions or access restricted APIs/Pages.
- [ ] **Cross-Device Verified**: Mobile, tablet, and desktop viewports tested cleanly.
- [ ] **API Payload Verified**: Frontend request and backend response payloads strictly match `api_doc.md`.
- [ ] **Zero Critical / Major Bugs**: All critical and major blocking bugs are resolved and re-tested.
- [ ] **Clean Browser Console**: Zero unhandled exceptions or broken React component errors.
