# 🎨 Patient Case Tracking System — Theme & Design System Specification

> **Document Status**: Official Enterprise Design System & UI Specification  
> **Target Application**: Patient Case Tracking System (`Patient Case Tracking`)  
> **Compliant With**: `Basic Instructions/AGENTS.md` & `Basic Instructions/ANTIGRAVITY.md` (Section 4, Section 9)

---

## 1. 🌟 Design Philosophy & Aesthetic Vision

The **Patient Case Tracking System** UI follows an **Editorial Glassmorphism & High-End Clinical Design System** inspired by Apple, Linear, and Vercel. 

### Core Aesthetic Principles:
1. **Clinical Elegance**: Clean, trustworthy, modern aesthetic with high contrast and legibility tailored for fast-paced healthcare environments (Doctors, Nurses, Receptionists, Admins).
2. **Single Brand Palette Engine**: Built around a primary medical teal/indigo color token (`--primary`) with derived translucent tints, subtle borders, soft ambient glows, and interactive hover states.
3. **Glassmorphism & Depth Layering**: Translucent card panels (`backdrop-filter: blur(20px)`), 1px subtle translucent borders (`rgba(255, 255, 255, 0.08)` dark / `rgba(0, 0, 0, 0.06)` light), and multi-layered elevation shadows.
4. **Prohibited AI Tropes**: Zero generic rainbow gradients, zero floating pill badges with cheesy icons, zero giant bold center heroes with 3D spheres, and zero unstyled Bootstrap controls.
5. **Dual Theme Support**: Full native support for **Dark Mode** (default clinical dark interface) and **Light Mode** (high-contrast clinical light interface).

---

## 2. 🎨 Color Tokens & Palette Architecture

### 2.1 Base & Brand Color System (`:root`)

```css
:root {
  /* -----------------------------------------------------------------
   * 1. BRAND COLORS (Medical Teal / Modern Indigo Accent)
   * ----------------------------------------------------------------- */
  --primary: #0ea5e9;                   /* Medical Ocean Blue Accent */
  --primary-hover: #0284c7;             /* Darker primary hover */
  --primary-active: #0369a1;            /* Active pressed state */
  --primary-light: rgba(14, 165, 233, 0.12); /* Soft primary tint */
  --primary-border: rgba(14, 165, 233, 0.25);/* Translucent primary border */
  --primary-glow: rgba(14, 165, 233, 0.35);  /* Subtle halo glow */
  --primary-gradient: linear-gradient(135deg, #0ea5e9, #38bdf8);

  /* -----------------------------------------------------------------
   * 2. CLINICAL LIFECYCLE STATUS TOKENS
   * ----------------------------------------------------------------- */
  --status-registered-bg: rgba(59, 130, 246, 0.12);   /* Soft Blue */
  --status-registered-text: #3b82f6;
  --status-registered-border: rgba(59, 130, 246, 0.3);

  --status-waiting-bg: rgba(245, 158, 11, 0.12);      /* Soft Amber/Yellow */
  --status-waiting-text: #f59e0b;
  --status-waiting-border: rgba(245, 158, 11, 0.3);

  --status-consultation-bg: rgba(168, 85, 247, 0.12); /* Soft Purple */
  --status-consultation-text: #a855f7;
  --status-consultation-border: rgba(168, 85, 247, 0.3);

  --status-lab-bg: rgba(236, 72, 153, 0.12);          /* Soft Pink/Magenta */
  --status-lab-text: #ec4899;
  --status-lab-border: rgba(236, 72, 153, 0.3);

  --status-completed-bg: rgba(16, 185, 129, 0.12);     /* Soft Emerald */
  --status-completed-text: #10b981;
  --status-completed-border: rgba(16, 185, 129, 0.3);

  --status-critical-bg: rgba(239, 68, 68, 0.15);       /* Soft Red Glow */
  --status-critical-text: #ef4444;
  --status-critical-border: rgba(239, 68, 68, 0.4);

  /* -----------------------------------------------------------------
   * 3. TYPOGRAPHY TOKENS
   * ----------------------------------------------------------------- */
  --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Font Sizes */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */

  /* -----------------------------------------------------------------
   * 4. BORDER RADIUS & ELEVATION SHADOWS
   * ----------------------------------------------------------------- */
  --r-xs: 4px;
  --r-sm: 8px;
  --r-md: 12px;
  --r-lg: 16px;
  --r-xl: 24px;
  --r-full: 9999px;

  /* -----------------------------------------------------------------
   * 5. ANIMATIONS & TRANSITIONS
   * ----------------------------------------------------------------- */
  --transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-smooth: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-bounce: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 3. 🌙 Dark Theme Token Matrix (`[data-theme="dark"]` - Default)

```css
[data-theme="dark"],
:root {
  /* Surface & Background Colors */
  --bg-app: #090d16;                   /* Deep Slate Navy Canvas */
  --bg-sidebar: #0d1322;               /* Slightly lighter sidebar surface */
  --bg-header: rgba(13, 19, 34, 0.75); /* Translucent blurred header */
  
  --surface-card: rgba(18, 26, 43, 0.70);
  --surface-card-hover: rgba(24, 35, 58, 0.85);
  --surface-elevated: #162035;
  --surface-input: rgba(15, 23, 42, 0.60);

  /* Borders & Dividers */
  --border-subtle: rgba(255, 255, 255, 0.07);
  --border-medium: rgba(255, 255, 255, 0.12);
  --border-focus: var(--primary);

  /* Glassmorphism & Backdrop */
  --glass-bg: rgba(13, 19, 34, 0.65);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: blur(20px);

  /* Typography Colors */
  --text-main: #f8fafc;                /* Highest contrast white */
  --text-secondary: #94a3b8;           /* Muted secondary gray */
  --text-muted: #64748b;               /* Subtle tertiary gray */
  --text-inverse: #0f172a;

  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 20px var(--primary-glow);
}
```

---

## 4. ☀️ Light Theme Token Matrix (`[data-theme="light"]`)

```css
[data-theme="light"] {
  /* Surface & Background Colors */
  --bg-app: #f8fafc;                   /* Soft Slate White Canvas */
  --bg-sidebar: #ffffff;               /* Clean white sidebar surface */
  --bg-header: rgba(255, 255, 255, 0.80);/* Translucent blurred header */
  
  --surface-card: rgba(255, 255, 255, 0.90);
  --surface-card-hover: #ffffff;
  --surface-elevated: #ffffff;
  --surface-input: #f1f5f9;

  /* Borders & Dividers */
  --border-subtle: rgba(0, 0, 0, 0.06);
  --border-medium: rgba(0, 0, 0, 0.12);
  --border-focus: var(--primary);

  /* Glassmorphism & Backdrop */
  --glass-bg: rgba(255, 255, 255, 0.75);
  --glass-border: rgba(0, 0, 0, 0.08);
  --glass-blur: blur(20px);

  /* Typography Colors */
  --text-main: #0f172a;                /* Deep slate black */
  --text-secondary: #475569;           /* Medium contrast gray */
  --text-muted: #94a3b8;               /* Light tertiary gray */
  --text-inverse: #ffffff;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.12);
  --shadow-glow: 0 0 16px rgba(14, 165, 233, 0.2);
}
```

---

## 5. 🧩 Atomic Component Styling Guidelines

To comply with non-duplication and design token standards (`Basic Instructions/ANTIGRAVITY.md`), UI controls must adhere to the following token-driven rules:

### 5.1 Base Controls (`src/components/ui/`)
- **Buttons (`Button.jsx`)**:
  - Primary: `background: var(--primary)`, `color: #fff`, `border-radius: var(--r-md)`, `transition: var(--transition-fast)`. Hover applies `var(--primary-hover)` and `box-shadow: var(--shadow-glow)`.
  - Secondary / Ghost: Translucent glass background with `var(--border-subtle)`.
- **Inputs (`Input.jsx`)**:
  - Background `var(--surface-input)`, border `1px solid var(--border-subtle)`. Focus transition applies `border-color: var(--primary)` and `box-shadow: 0 0 0 3px var(--primary-light)`.
- **Status Badges (`Badge.jsx`)**:
  - Encapsulates patient lifecycle states (Registered, In Queue, Consultation, Lab Pending, Discharged, Critical).
  - Uses corresponding `--status-[state]-bg`, `--status-[state]-text`, and `--status-[state]-border` tokens.

### 5.2 Layout & Navigation (`src/components/layout/`)
- **Sidebar (`Sidebar.jsx`)**:
  - Role-driven navigation (Doctor, Receptionist, Nurse, Admin).
  - Fixed background `var(--bg-sidebar)`, subtle right border `var(--border-subtle)`. Active items feature a left accent indicator pill and `var(--primary-light)` background background.
- **Header (`Header.jsx`)**:
  - Sticky glass bar using `backdrop-filter: var(--glass-blur)`, `background: var(--bg-header)`, displaying current page path, search bar, role badge, and theme switcher.

---

## 6. 📱 Responsive Breakpoints

The design system is fully responsive across standard devices:

| Breakpoint | Width | Target Device / Layout |
| :--- | :--- | :--- |
| **Mobile (`sm`)** | `< 640px` | Single-column stack, collapsible drawer sidebar, touch-optimized targets (min 44px). |
| **Tablet (`md`)** | `640px - 1024px` | 2-column grid, compact sidebar view. |
| **Desktop (`lg`)** | `1024px - 1280px` | Full multi-column dashboard, fixed sidebar layout. |
| **Wide Desktop (`xl`)**| `> 1280px` | Extended clinical timeline and multi-panel consultation splits. |

---

## 7. 🏷️ Summary of Enforced Design Rules

1. **Zero Hardcoded CSS Values**: All colors, radii, spacing, transitions, and text colors MUST use CSS variable tokens defined in `tokens.css`.
2. **Zero Code Duplication**: Base components (`Button`, `Input`, `Badge`, `Modal`) in `src/components/ui/` handle all visual states across the application.
3. **Theme Consistency**: Both light and dark modes toggle seamlessly via the `data-theme` attribute on the root element.
4. **Editorial Standard**: High legibility typography, elegant spacing, subtle glassmorphism, and clear clinical state cues.
