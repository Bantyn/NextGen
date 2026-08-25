# 👥 Team Roles & Responsibilities

This document defines the roles, responsibilities, and development guidelines for each member of **Team NextGen**.

Each team member should focus primarily on their assigned role and follow the project workflow, repository rules, coding standards, and instructions related to that role.

---

# ⚠️ General Team Instructions

All team members must:

- Work on their assigned Git branch.
- Do not directly push personal work to `main` or `test`.
- Follow the Git workflow defined in the project `README.md`.
- Pull the latest changes from the `test` branch before starting a new task.
- Keep changes limited to the assigned task whenever possible.
- Test the implementation before pushing.
- Use meaningful commit messages.
- Create a Pull Request from their branch to `test` after completing a task.
- Do not modify another member's module without informing the team.
- Follow the project architecture and documentation.
- Read relevant files inside the `docs/` directory before implementing a feature.
- Update documentation when a significant technical decision or implementation changes.

---

# 🧩 MCP Usage Guidelines

MCP servers should be used **based on the member's assigned role and task requirements**.

Do not install or use every available MCP server unnecessarily.

Each member should:

1. Use the MCP servers relevant to their role.
2. Follow the instructions and limitations of the MCP server.
3. Verify generated or modified code before committing it.
4. Never blindly trust AI-generated output.
5. Avoid exposing API keys, tokens, passwords, or other secrets in:
   - Source code
   - Git commits
   - Documentation
   - Screenshots
   - Public repositories

> MCP tools are development assistants. The developer remains responsible for reviewing, testing, and integrating the final implementation.

---

# 1. 👨‍💻 Banty — Team Leader

## Primary Responsibilities

- Project planning
- System architecture
- Module planning
- Team coordination
- Task distribution
- Integration between frontend, backend, AI, and database modules
- AI workflow planning
- Technical decision review
- Final testing coordination
- Hackathon presentation and demonstration

## Recommended MCP Usage

- `21st`
- `StitchMCP`
- `asset-filesystem`
- `threejs-devtools` when required
- `blender-workflow` when required

## Instructions

The Team Leader is responsible for ensuring that all modules work together correctly.

Major architecture changes should be reviewed before implementation.

The Team Leader should not become a bottleneck for every small change. Members should independently complete tasks within their assigned modules.

---

# 2. 🎨 Kruti — Frontend Developer

## Primary Responsibilities

- Patient-facing UI
- React components
- Forms and input interfaces
- Voice and touch interaction UI
- Responsive design
- Frontend API integration
- User experience implementation

## Recommended MCP Usage

- `21st`
- `StitchMCP`
- `asset-filesystem`

### Optional

- `threejs-devtools` only if a Three.js or 3D feature is assigned.

## Instructions

- Follow the existing UI structure and component architecture.
- Do not implement backend business logic inside the frontend.
- Use backend APIs instead of directly accessing the database.
- Handle loading, error, and empty states.
- Ensure responsive behavior.
- Test all frontend interactions before creating a Pull Request.

---

# 3. 💻 Vanshika — Fullstack Developer

## Primary Responsibilities

- Frontend development
- Backend development
- API integration
- Database integration
- Module-level end-to-end implementation
- Supporting integration between frontend and backend

## Recommended MCP Usage

- `21st`
- `StitchMCP`
- `asset-filesystem`

### Optional

- `threejs-devtools`
- `blender-workflow`

Use optional MCP servers only when the assigned feature requires them.

## Instructions

- Maintain a clear separation between frontend and backend.
- Do not bypass backend validation.
- Ensure API requests and responses follow the defined contract.
- Test features end-to-end.
- Coordinate with dedicated frontend and backend developers before changing shared interfaces.

---

# 4. 🧪 Harshit — UI & QA Tester

## Primary Responsibilities

- UI review
- User flow testing
- Functional testing
- Cross-module testing
- Bug identification
- UI consistency checks
- Regression testing
- Reporting reproducible issues

## Recommended MCP Usage

- `21st`
- `StitchMCP`
- `asset-filesystem`

## Testing Instructions

Every bug report should include:

```text
Feature:
Environment:
Steps to Reproduce:
Expected Result:
Actual Result:
Severity:
Screenshot / Recording: