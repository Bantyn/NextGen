# ANTIGRAVITY ENTERPRISE SYSTEM GUIDE & ENGINEERING HANDBOOK

> **Document Status**: Official Permanent Operating Standard  
> **Version**: 3.0.0  
> **Scope**: Universal (Frontend, Backend, 3D WebGL, Database, DevOps, Testing)

---

## 1. OBJECTIVE & CORE PHILOSOPHY

This handbook establishes mandatory software engineering standards for all codebase operations. Every solution produced under this specification must meet enterprise-level production standards.

### 1.1 Fundamental Principles
1. **Zero Demo Code**: Never generate placeholders, pseudo-code, dummy fallbacks, or incomplete snippets. Every piece of code must be production-ready and fully functional.
2. **Unified Senior Engineering Mindset**: Function simultaneously as a Senior UI Architect, Senior Full-Stack Engineer, Senior 3D WebGL Engineer, Database Architect, and DevOps Lead.
3. **Strict Non-Duplication (DRY & KISS)**: Centralize logic into reusable services, design systems, and components. Never write duplicate buttons, cards, modals, or query functions.
4. **Architectural Permanence**: Write scalable, modular code that acts like a framework, not a one-time project generator.

---

## 2. MCP USAGE POLICY & DECISION MATRIX

The Model Context Protocol (MCP) toolset must be dynamically evaluated and orchestrated for every incoming task. Combine the optimal set of servers for the specific task domain.

### 2.1 MCP Domain Rules

| MCP Server | Trigger Conditions & Capabilities | Mandatory Usage Policy |
| :--- | :--- | :--- |
| **`Filesystem MCP`** | File inspection, project structure analysis, component lookup. | **Always check** before creating any file to prevent code duplication and preserve directory hierarchy. |
| **`Context7 MCP`** | API syntax verification, latest library documentation, SDK lookup. | **Always consult** before writing code using external libraries (Three.js, GSAP, Supabase, Tailwind, etc.). |
| **`GitHub MCP`** | Reference implementations, official examples, API signature validation. | **Consult** when researching established open-source patterns or auditing complex libraries. |
| **`Playwright MCP`** | UI verification, runtime error detection, visual regression, responsive checks. | **Automatically execute** after completing UI/UX changes. Never mark a UI task as done without verification. |
| **`Three.js DevTools MCP`** | Scene graph inspection, camera controls, light/material tuning, WebGL profiling. | **Execute** whenever working on 3D scenes, shaders, materials, lighting, or frame-rate optimizations. |
| **`GLTF Pipeline MCP`** | GLTF/GLB inspection, Draco mesh compression, KTX2 textures, HDRI maps. | **Execute** when importing, optimizing, or processing 3D asset pipelines. |
| **`Blender Workflow MCP`** | Blender asset pipeline, UV unwrapping, mesh baking, export validation. | **Execute** when automating Blender-to-WebGL asset transformation workflows. |
| **`Supabase MCP`** | PostgreSQL schema, Row Level Security (RLS), Auth, Edge Functions, Realtime. | **Execute** for Supabase auth rules, SQL migrations, storage bucket policies, and database triggers. |
| **`MongoDB MCP`** | Schema design, indexing, aggregation pipelines, transactions, query optimization. | **Execute** for MongoDB schema design, indexes, pipeline optimization, and CRUD operations. |

---

## 3. ARCHITECTURE & FOLDER STRUCTURE STANDARDS

All applications must follow a **Feature-Based Modular Architecture** that strictly decouples UI, logic, and data layers.

```
src/
├── core/                        # Fixed Core System
│   ├── api/                     # Centralized API HTTP Client
│   ├── auth/                    # Auth Context & Token Refresh
│   ├── config/                  # Global System Config
│   ├── errors/                  # Global Error Boundaries
│   ├── state/                   # Global Store
│   └── theme/                   # Design Tokens & CSS System
├── components/                  # Shared Atomic UI Component Library
│   ├── ui/                      # Base Controls (Buttons, Inputs)
│   ├── feedback/                # Modals, Toasts, Skeletons
│   ├── layout/                  # Navbar, Sidebar, Grid
│   └── 3d/                      # Reusable Three.js Canvases
├── modules/                     # Feature-Based Domain Modules
│   └── [feature]/               # Components, Services, Types, Views
└── utils/                       # Shared Pure Utilities & Math Helpers
```

---

## 4. UI & DESIGN SYSTEM STANDARDS

All user interfaces must meet modern, high-end Apple / Linear / Vercel design standards.

### 4.1 Design Aesthetics Rules
1. **Single Brand Color System**: Establish one primary accent color (`--primary`) and derive soft tints, borders, glows, and hover states directly from it.
2. **Glassmorphism Layering**: Utilize translucent panels (`backdrop-filter: blur(20px)`), subtle 1px translucent borders (`rgba(255, 255, 255, 0.08)`), and soft layered shadows.
3. **Dynamic Hover & Micro-Animations**: Interactive elements must feature smooth 0.2s–0.3s cubic-bezier transitions (`all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`).

---

## 5. THREE.JS & 3D WEBGL ENGINEERING STANDARDS

- **Physically Based Rendering (PBR)**: Use `MeshPhysicalMaterial` with transmission, clearcoat, roughness, metalness, and environment map intensity.
- **Procedural HDRI Lighting**: Utilize `PMREMGenerator` and `RoomEnvironment` for optical reflections.
- **Pixel Ratio Capping**: Enforce `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`.
- **Memory Cleanup**: Intercept window `beforeunload` or unmount to explicitly call `dispose()` on geometries, materials, and textures.

---

## 6. PRE-EXECUTION & DEFINITION OF DONE (DoD)

1. ✓ **Build succeeds** without compiler or lint errors.
2. ✓ **No direct code duplication** exists.
3. ✓ **Playwright MCP tests pass** clean without runtime console errors.
4. ✓ **Responsive design** verified across mobile, tablet, and desktop breakpoints.
5. ✓ **Performance benchmark** meets 60 FPS target.
