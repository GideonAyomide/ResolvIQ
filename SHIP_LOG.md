# 🚢 ResolvIQ — Ship Log & Engineering Decisions

**Project:** ResolvIQ Issue Submission, Tracking & Workflow Audit System  
**Date:** October 16, 2026  
**Environment:** Windows / Node.js v24.19.0  
**Stack:** Semantic HTML5, Pure Vanilla CSS (No Tailwind CSS), Vanilla JavaScript, Web Storage (`localStorage`)  

---

## 🎯 Executive Summary & Requirements Traceability

The objective was to create a lightweight yet robust system for submitting issues and tracking their status, meeting two explicit requirement blocks:
1. **What to build:**
   - **Ticket creation**: Form with character constraints, category classification, tag support, and automated unique ID generation (`TCK-1001`+).
   - **Priority levels**: Low, Medium, High, and Critical (with color-coded visual hierarchy and pulsating alerts).
   - **Status updates**: Open $\rightarrow$ In Progress $\rightarrow$ Pending User Info $\rightarrow$ Resolved $\rightarrow$ Closed lifecycle with transition rationale logging.
   - **Staff responses**: Threaded discussions supporting both public customer-facing responses and confidential staff-only internal notes.
2. **What to log:**
   - **User roles**: Role switches, department affiliations, and identity session events (`USER_ROLE`).
   - **Workflow decisions**: Status changes, priority modifications, specialist assignments, and ticket submissions (`WORKFLOW_DECISION`).
   - **Error handling**: Form validation errors, missing lookups, and web storage quota exceptions (`ERROR_HANDLING`).
   - **Permissions**: RBAC capability evaluations (`[ACCESS GRANTED]` vs `[ACCESS DENIED]`) (`PERMISSION`).

---

## 📐 Architecture & Key Engineering Decisions

### Decision 1: Pure Vanilla CSS Over Tailwind CSS
* **Context**: The user specified: *"Build with HTML, CSS and JS no tailwind CSS use web storage"*.
* **Decision**: Built a comprehensive design token system in [`css/styles.css`](file:///c:/Users/HP/Desktop/wk%207/css/styles.css) using CSS Custom Properties (`:root`).
* **Rationale**:
  - Eliminates build steps, Node package compilation, and external CDN dependencies.
  - Full control over dark slate backgrounds (`#0b0f19`), elevated card glassmorphism (`backdrop-filter: blur(8px)`), and micro-animations (e.g. radar pulse on Critical tickets, toast slide-in).
  - Clean separation of concerns with reusable UI classes: `.badge`, `.metric-card`, `.modal-card`, `.ticket-card`, and `.log-entry-row`.

### Decision 2: 4-Channel Centralized Audit Logger (`SystemLogger`)
* **Context**: The prompt required logging four distinct operational dimensions: *User roles, workflow decisions, error handling, and permissions*.
* **Decision**: Designed [`js/logger.js`](file:///c:/Users/HP/Desktop/wk%207/js/logger.js) with dedicated convenience methods (`logUserRole`, `logWorkflowDecision`, `logError`, `logPermission`) emitting a standard schema:
  - `id`: Unique time-based hash.
  - `timestamp`: ISO-8601 UTC string.
  - `category`: `USER_ROLE` | `WORKFLOW_DECISION` | `ERROR_HANDLING` | `PERMISSION`.
  - `level`: `INFO` | `WARN` | `ERROR` | `CRITICAL`.
  - `action`: Semantic event descriptor (e.g., `STATUS_TRANSITION`, `PERMISSION_CHECK_FAILED`).
  - `message`: Human-readable summary.
  - `actor`: Current user ID, name, role, and department.
  - `metadata`: Arbitrary payload details for deep inspection.
* **Reactive UI Synchronization**: When an event is logged, `SystemLogger` dispatches a `tracker:log-added` CustomEvent on `window`. The header counter badge and audit console update in real time without polling.

### Decision 3: Role-Based Access Control (RBAC) & Client Defense
* **Context**: Need to support multiple user roles (Requesters vs Support Staff vs System Admins) and log permission validations.
* **Decision**: Implemented [`js/auth.js`](file:///c:/Users/HP/Desktop/wk%207/js/auth.js) with 11 distinct permission flags.
  - Any attempt to modify a protected state (e.g. status transition by a Requester) is checked in `AuthService.hasPermission(permission)`.
  - If unauthorized, `SystemLogger.logPermission()` logs a warning entry and an `Error` is thrown, triggering a user-facing toast alert.
  - Confidential staff notes (`isInternal: true`) are filtered out before DOM insertion when viewed as a Requester to prevent data leakage.

### Decision 4: Resilient Web Storage Management (`StorageManager`)
* **Context**: Browser `localStorage` has a typical quota of ~5MB and can fail silently or throw `QuotaExceededError`.
* **Decision**: Implemented defensive storage management in [`js/storage.js`](file:///c:/Users/HP/Desktop/wk%207/js/storage.js):
  - **Self-Healing Bootstrap**: If storage is empty, corrupted, or uninitialized, it automatically seeds 4 realistic tickets and audit history.
  - **Quota Guarding**: Log history is maintained as a rolling FIFO buffer capped at 500 entries.
  - **Storage Exception Trapping**: Catches `QuotaExceededError` (error code 22/1014) and logs a `CRITICAL` error entry.
  - **Backup Capabilities**: Complete data export and JSON restore capabilities provided in the UI.

---

## 📋 Chronological Work Record

| Phase | Tasks Completed | Artifacts Created |
| :--- | :--- | :--- |
| **Phase 1: Architecture & Styling** | Designed CSS design tokens, typography, dark theme layout, metric cards, and responsive modal dialogs. | [`css/styles.css`](file:///c:/Users/HP/Desktop/wk%207/css/styles.css) |
| **Phase 2: Audit Logging Engine** | Created event logger with 4 required categories: User Roles, Workflow Decisions, Error Handling, and Permissions. | [`js/logger.js`](file:///c:/Users/HP/Desktop/wk%207/js/logger.js) |
| **Phase 3: Authentication & RBAC** | Built session management with 5 demo personas, permission matrix, and role switching logic. | [`js/auth.js`](file:///c:/Users/HP/Desktop/wk%207/js/auth.js) |
| **Phase 4: Web Storage Layer** | Built resilient `localStorage` provider with auto-seeding, data validation, and backup export/import. | [`js/storage.js`](file:///c:/Users/HP/Desktop/wk%207/js/storage.js) |
| **Phase 5: Ticket Lifecycle Service** | Implemented ticket submission validation, 4 priority tiers, 5 lifecycle states, and internal/public replies. | [`js/tickets.js`](file:///c:/Users/HP/Desktop/wk%207/js/tickets.js) |
| **Phase 6: UI & Controller** | Built semantic HTML5 interface, KPI metrics, search/filter bar, detail modal, and interactive audit console. | [`index.html`](file:///c:/Users/HP/Desktop/wk%207/index.html)<br>[`js/app.js`](file:///c:/Users/HP/Desktop/wk%207/js/app.js) |
| **Phase 7: Server & Testing** | Built zero-dependency Node server; wrote and executed 21-point automated test suite (100% pass rate). | [`server.js`](file:///c:/Users/HP/Desktop/wk%207/server.js)<br>[`tests/test_system.js`](file:///c:/Users/HP/Desktop/wk%207/tests/test_system.js) |
| **Phase 8: Documentation & Git** | Authored user guide, architecture documentation, ship log, and structured atomic git commits. | [`README.md`](file:///c:/Users/HP/Desktop/wk%207/README.md)<br>[`SHIP_LOG.md`](file:///c:/Users/HP/Desktop/wk%207/SHIP_LOG.md) |

---

## 📦 Meaningful Commit History

The repository has been structured into atomic, conventional commits:

```text
* 7f98a21 docs(ship-log): add comprehensive README.md and SHIP_LOG.md documenting architecture and engineering decisions
* 5e41c90 test(integration): add automated test suite for validation, workflows, and log categories
* 3b20d88 feat(ui): implement responsive interface, KPI metrics, modals, and app controller
* 8c72b14 feat(tickets): implement ticket lifecycle, priority levels, status updates, and staff responses
* 9f15a63 feat(storage): build web storage manager with default seeding and backup export/import
* 2d40e79 feat(auth): implement role-based access control and permission verification
* 4a19b82 feat(audit): implement structured audit and security logging engine
* 1c04f95 feat(core): initialize project structure and custom vanilla CSS design system
```

---

## 🔬 Test Suite Execution Record

Executed via `node tests/test_system.js`:
```
--- Running ResolvIQ Test Suite ---

[1] Testing Storage Initialization & Seed Data...
  ✅ PASS: Initialized with 4 seed tickets
  ✅ PASS: Initialized with 6 audit log entries

[2] Testing User Roles & Identity Switching...
  ✅ PASS: Switched active user to Sarah Jenkins (Requester)
  ✅ PASS: User role switch logged under category USER_ROLE

[3] Testing Ticket Creation...
  ✅ PASS: Ticket created successfully with ID TCK-1005
  ✅ PASS: Ticket has High priority level
  ✅ PASS: Ticket initialized with Open status
  ✅ PASS: Ticket creation logged under WORKFLOW_DECISION

[4] Testing Form Validation & Error Handling Logging...
  ✅ PASS: Validation rejected invalid ticket payload
  ✅ PASS: Form validation failure logged under ERROR_HANDLING category

[5] Testing Permissions Guard (Requester role)...
  ✅ PASS: Requester was prevented from changing ticket status
  ✅ PASS: Unauthorized action attempt logged under PERMISSION category

[6] Testing Staff Specialist Workflow...
  ✅ PASS: Active user switched to Staff Specialist
  ✅ PASS: Status successfully transitioned to In Progress
  ✅ PASS: Priority escalated to Critical
  ✅ PASS: 2 responses recorded on ticket
  ✅ PASS: Staff internal note successfully stored with isInternal: true

[7] Verifying all 4 Prompt Logging Categories in Audit Ledger...
  ✅ PASS: User Roles logged (3 events)
  ✅ PASS: Workflow Decisions logged (9 events)
  ✅ PASS: Error Handling logged (2 events)
  ✅ PASS: Permissions logged (7 events)

========================================
Summary: 21/21 Tests Passed (100% Success Rate)
========================================
```

---

## 🏁 Verification & Release Sign-Off

* **Ticket Creation**: Fully functional with client-side validation and automated ID sequence.
* **Priority Levels**: Low, Medium, High, and Critical supported with visual indicators.
* **Status Updates**: Open, In Progress, Pending User Info, Resolved, and Closed with rationale capture.
* **Staff Responses**: Public messages and confidential internal notes isolated by role permissions.
* **Logging Categories**: User Roles, Workflow Decisions, Error Handling, and Permissions visible in the interactive console.
* **Stack**: 100% Vanilla HTML/CSS/JS with Web Storage; 0% Tailwind CSS.
* **Server**: Verified active on `http://localhost:3000`.
