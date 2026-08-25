# Patient Case Tracking System
> **Built by Team NextGen** 🚀

## Our Philosophy: Impact & Learning Over Trophies
*"We don't just want to win; we want to build. Our primary objective as **Team NextGen** is to gain hands-on, real-world industry experience. We are treating this project not as a competition entry, but as a live startup product. We focus on writing clean code, designing scalable architectures, and solving genuine healthcare problems that affect real people every day."*

---

## About the Project
In Indian hospitals, one of the biggest bottlenecks isn't the lack of medical care, but the **loss of patient data and status tracking**. Patients lose their physical files, hospital management struggles to track patient flow (OPD -> Lab -> Pharmacy), and doctors waste critical time hunting for case histories. 

Our **Patient Case Tracking System** bridges this gap by creating a seamless, digital lifecycle for every patient from check-in to discharge.

## Key Problems We Are Solving
1. **Lost Medical History:** Eliminating physical paper trails that delay critical treatments.
2. **Queue & Status Blindness:** Giving hospital administration real-time visibility into a patient's current location (e.g., waiting for lab results vs. in consultation).
3. **Doctor's Time Wastage:** Providing doctors with a one-click dashboard to view past histories, current symptoms, and lab reports so they can focus strictly on diagnosis.

---

## Core Features
- **Digital Patient Journey:** Real-time status tracking (`Checked-In` ➡️ `Vitals Taken` ➡️ `In Consultation` ➡️ `Lab Tests Pending` ➡️ `Discharged`).
- **Clinical Dashboard (Doctor's View):** A clean interface for doctors to instantly access patient history, past prescriptions, and uploaded documents.
- **Role-Based Access Control (RBAC):** Industry-standard security ensuring Receptionists, Nurses, and Doctors only see data relevant to their specific roles.
- **Optimized UI/UX:** A clutter-free, responsive design built for the fast-paced hospital environment to increase staff efficiency.
---

## Tech Stack & Industry Practices
Because our goal is **Real-World Industry Experience**, we are building this using industry-standard tools and practices:

- **Frontend:** React.js / Tailwind CSS (Optimized for UI Leadership)
- **Backend:** Node.js / Express.js (Scalable API Architecture)
- **Database:** MongoDB (Flexible schema for dynamic medical records)
- **Practices:** Agile methodology, Git Version Control, Boundary Value Analysis, and System Flow Testing.

---

## Getting Started (Local Setup)

To run this project locally, follow these steps:

### Prerequisites
- Node.js (v16 or higher)
- MongoDB installed locally or a MongoDB Atlas URI


### Project Flow
                    ┌─────────────────┐
                    │     Patient     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ React Frontend  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Backend API   │
                    │ Auth + Logic    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌────────────┐ ┌────────────┐ ┌─────────────┐
       │  MongoDB   │ │  n8n + AI  │ │  Documents  │
       │            │ │   Ollama   │ │   / OCR     │
       └────────────┘ └────────────┘ └─────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Doctor Dashboard│
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Future HIS/ABDM │
                    └─────────────────┘

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Bantyn/NextGen.git
   cd NextGen
   ```

2. **Switch to Your Branch:**
   ```bash
   # Check available branches
   git branch -a

   # Switch to your feature branch
   git switch feature-branch-name
   ```

3. **Get the Latest Code from `test`:**
   ```bash
   # Before starting a new task, fetch and merge latest changes from origin/test
   git fetch origin
   git merge origin/test
   ```

4. **Complete Your Assigned Task & Check Status:**
   ```bash
   # Check your modified files
   git status
   ```

5. **Add and Commit Your Changes:**
   ```bash
   # Stage your changes
   git add .

   # Create a descriptive commit message
   git commit -m "feat: add patient registration module"
   ```

6. **Push Your Changes:**
   ```bash
   # Push your branch to remote (first push)
   git push -u origin feature-branch-name

   # Subsequent pushes
   git push
   ```

