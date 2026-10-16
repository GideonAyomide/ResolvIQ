# ResolvIQ — Issue Submission, Status Tracking & Workflow Audit System

> A production-grade issue tracking and workflow auditing web application built entirely with **HTML5**, **Vanilla CSS** (zero Tailwind CSS or utility frameworks), **Vanilla JavaScript**, and **Web Storage (`localStorage`)**.

---

## 📋 Table of Contents
1. [Overview](#-overview)
2. [What Was Built](#-what-was-built)
   - [1. Ticket Submission & ID Generation](#1-ticket-submission--id-generation)
   - [2. Priority Levels & Escalation Rules](#2-priority-levels--escalation-rules)
   - [3. Status Updates & Lifecycle Progression](#3-status-updates--lifecycle-progression)
   - [4. Staff Responses & Confidential Internal Notes](#4-staff-responses--confidential-internal-notes)
3. [What Is Logged (Audit & Security System)](#-what-is-logged-audit--security-system)
   - [User Roles](#user-roles-user_role)
   - [Workflow Decisions](#workflow-decisions-workflow_decision)
   - [Error Handling](#error-handling-error_handling)
   - [Permissions](#permissions-permission)
4. [Role-Based Access Control (RBAC) Matrix](#-role-based-access-control-rbac-matrix)
5. [Architecture & Design System](#-architecture--design-system)
6. [Quickstart Guide](#-quickstart-guide)
7. [Automated Testing](#-automated-testing)
8. [Web Storage & Data Resilience](#-web-storage--data-resilience)

---

## 🔍 Overview

**ResolvIQ** allows organizations to submit, categorize, prioritize, triage, and track operational issues through their entire resolution lifecycle. It pairs a polished modern SaaS user experience with an enterprise **Audit & Security Logging Console** that transparently tracks every identity switch, permission check, status transition, priority escalation, and error handling event.

---

## 🛠️ What Was Built

### 1. Ticket Submission & ID Generation
* **Validated Form Fields**: Title (min 5 chars), Category, Priority, Detailed Description (min 15 chars), and optional comma-separated Tags.
* **Predictable Unique IDs**: Automatically formats ticket identifiers sequentially (`TCK-1001`, `TCK-1002`, ...).
* **Automatic Submitter Attribution**: Binds the active authenticated user profile, department, and submission timestamp directly to the ticket record.
* **Pre-seeded Demonstration Data**: Bootstraps with 4 realistic corporate issues (Network/VPN, Database Latency, Okta Access, Hardware failures).

### 2. Priority Levels & Escalation Rules
* **Four Granular Priority Tiers**:
  * `Low` (Green) — Minor inconvenience, low urgency.
  * `Medium` (Cyan/Sky) — Standard operational ticket.
  * `High` (Orange) — Significant productivity loss.
  * `Critical` (Rose/Red) — High-impact blocker or production system outage with animated glowing pulse indicator.
* **Escalation Reason Enforcement**: When elevating ticket priorities (e.g., Medium $\rightarrow$ Critical), the system captures a workflow decision rationale note and logs an escalation event.

### 3. Status Updates & Lifecycle Progression
* **Supported Lifecycle States**:
  $$\text{Open} \longrightarrow \text{In Progress} \longrightarrow \text{Pending User Info} \longrightarrow \text{Resolved} \longrightarrow \text{Closed}$$
* **Smart Workflow Automation**:
  * Moving a ticket from `Open` to `In Progress` automatically assigns the claiming staff specialist.
  * When a ticket is in `Pending User Info` and the original requester posts a reply, the system auto-resumes the status to `In Progress` and logs an automated transition.
* **Permission Guards**: Only authenticated `Staff Specialist` and `System Admin` identities can perform status transitions. Requesters see a read-only workflow panel with an interactive guard test button.

### 4. Staff Responses & Confidential Internal Notes
* **Public Responses**: Visible to both the requester and all support staff; forms an organized chronological conversation thread.
* **Staff-Only Internal Notes (`isInternal: true`)**:
  * Displayed with high-visibility amber styling and security badges.
  * **Role-Protected**: Automatically redacted from the timeline when viewed under the `Requester` role.
  * Internal note tab is disabled with padlock indicators for non-staff users.

---

## 🛡️ What Is Logged (Audit & Security System)

The application features a dedicated **Audit & Security Logs Console** accessible directly via the top navigation bar with a live event counter badge (`#btn-open-audit-logs`). Every log record captures a unique ID, UTC timestamp, actor details (ID, name, role, department), severity level, action name, message, and JSON metadata.

### User Roles (`USER_ROLE`)
* **What is captured**: Active user identity switches, role assignments, department bindings, and authentication session initializations.
* **Example Event**:
  ```json
  {
    "category": "USER_ROLE",
    "action": "USER_ROLE_SWITCHED",
    "message": "Active identity switched from 'Sarah Jenkins' (Requester) to 'Alex Rivera' (Staff Specialist)",
    "actor": { "id": "stf_alex_support", "name": "Alex Rivera", "role": "Staff Specialist" },
    "metadata": {
      "previousUser": { "id": "usr_sarah_req", "role": "Requester" },
      "newUser": { "id": "stf_alex_support", "role": "Staff Specialist", "department": "IT Service Desk" }
    }
  }
  ```

### Workflow Decisions (`WORKFLOW_DECISION`)
* **What is captured**: Ticket creation, status transitions, priority escalations, staff reassignments, resolution approvals, auto-resumes, and ticket purges.
* **Example Event**:
  ```json
  {
    "category": "WORKFLOW_DECISION",
    "action": "STATUS_TRANSITION",
    "message": "Ticket TCK-1002 moved from [Open] to [In Progress] by Alex Rivera (Investigating auth gateway keepalive config)",
    "actor": { "id": "stf_alex_support", "name": "Alex Rivera", "role": "Staff Specialist" },
    "metadata": {
      "ticketId": "TCK-1002",
      "oldStatus": "Open",
      "newStatus": "In Progress",
      "reason": "Investigating auth gateway keepalive config"
    }
  }
  ```

### Error Handling (`ERROR_HANDLING`)
* **What is captured**: Client-side form validation rejections, missing required parameters, nonexistent ticket ID lookups, and storage quota exceptions (`QuotaExceededError`).
* **Example Event**:
  ```json
  {
    "category": "ERROR_HANDLING",
    "action": "FORM_VALIDATION_FAILED",
    "message": "Ticket submission validation failed: Title must be at least 5 characters long., Detailed description must be at least 15 characters long.",
    "actor": { "id": "usr_sarah_req", "name": "Sarah Jenkins", "role": "Requester" },
    "metadata": {
      "errors": ["Title must be at least 5 characters long.", "Detailed description must be at least 15 characters long."],
      "submittedPayload": { "title": "Bug", "category": "Software Bug", "priority": "High" }
    }
  }
  ```

### Permissions (`PERMISSION`)
* **What is captured**: Systematic verification of RBAC privileges on sensitive operations (`EDIT_STATUS`, `EDIT_PRIORITY`, `POST_INTERNAL_NOTE`, `VIEW_AUDIT_LOGS`, `DELETE_TICKET`). Denials are flagged as `WARN`/`ERROR` with an `[ACCESS DENIED]` prefix.
* **Example Event**:
  ```json
  {
    "category": "PERMISSION",
    "action": "PERMISSION_CHECK_FAILED",
    "message": "[ACCESS DENIED] User 'Sarah Jenkins' (Requester) was denied access to permission 'EDIT_STATUS'",
    "actor": { "id": "usr_sarah_req", "name": "Sarah Jenkins", "role": "Requester" },
    "metadata": {
      "userId": "usr_sarah_req",
      "role": "Requester",
      "attemptedPermission": "EDIT_STATUS",
      "granted": false
    }
  }
  ```

---

## 👥 Role-Based Access Control (RBAC) Matrix

| Permission Key | Requester | Staff Specialist | System Admin |
| :--- | :---: | :---: | :---: |
| **`CREATE_TICKET`** | ✅ Yes | ✅ Yes | ✅ Yes |
| **`VIEW_ALL_TICKETS`** | ✅ Yes | ✅ Yes | ✅ Yes |
| **`POST_PUBLIC_REPLY`** | ✅ Yes | ✅ Yes | ✅ Yes |
| **`EDIT_STATUS`** | ❌ Blocked | ✅ Yes | ✅ Yes |
| **`EDIT_PRIORITY`** | ❌ Blocked | ✅ Yes | ✅ Yes |
| **`ASSIGN_TICKET`** | ❌ Blocked | ✅ Yes | ✅ Yes |
| **`POST_INTERNAL_NOTE`** | ❌ Blocked | ✅ Yes | ✅ Yes |
| **`VIEW_INTERNAL_NOTES`** | ❌ Redacted | ✅ Yes | ✅ Yes |
| **`VIEW_AUDIT_LOGS`** | ❌ Blocked (Testable) | ✅ Yes | ✅ Yes |
| **`DELETE_TICKET`** | ❌ Blocked | ❌ Blocked | ✅ Yes |
| **`MANAGE_SYSTEM`** | ❌ Blocked | ❌ Blocked | ✅ Yes |

---

## 🎨 Architecture & Design System

```
wk 7/
├── index.html            # Main semantic application view
├── css/
│   └── styles.css        # Pure Vanilla CSS design system (No Tailwind)
├── js/
│   ├── logger.js         # Central SystemLogger for Roles, Workflows, Errors, Permissions
│   ├── auth.js           # RBAC Service, Demo Users, & Permission Verification
│   ├── storage.js        # Web Storage manager with seed data & JSON export/import
│   ├── tickets.js        # Ticket service handling CRUD, transitions, & replies
│   └── app.js            # UI controller, search, filters, modals, & live events
├── server.js             # Zero-dependency local Node.js HTTP server
├── tests/
│   └── test_system.js    # Automated integration test suite
├── README.md             # Complete technical documentation
└── SHIP_LOG.md           # Engineering decisions, changelog, and ship log
```

### Aesthetic Standards Applied
* **Typography**: Clean hierarchy with Google Font **Inter** and monospace fallback for identifiers and logs.
* **Palette**: Deep slate canvas (`#0b0f19`), elevated surfaces (`#111827`, `#1a2236`), with electric indigo (`#6366f1`) and sky blue (`#0ea5e9`) gradients.
* **Dynamic Micro-Interactions**: Hover lifts (`transform: translateY(-2px)`), critical status radar pulse animations, slide-in toasts, and smooth modal transitions.

---

## 🚀 Quickstart Guide

### 1. Start the Local Server
From the project root:
```bash
node server.js
```
The server will start at:
```
http://localhost:3000
```

### 2. Test User Personas in the Browser
Switch identities in the top navigation bar dropdown to explore role behaviors:
1. **Sarah Jenkins (`Requester` - Marketing)**:
   - Click **"+ New Ticket"** and submit an issue.
   - Open a ticket to see that workflow decision controls are safely locked with a read-only banner.
   - Click `[Test Unauthorized Status Override]` to observe the permission denial guard and toast notification.
2. **Alex Rivera (`Staff Specialist` - IT Service Desk)**:
   - Open the ticket.
   - Change status to **In Progress** and enter a transition rationale note.
   - Post a **Staff-Only Internal Note**; notice the amber badge.
   - Escalate priority to **Critical** and verify the real-time card pulse.
3. **Marcus Vance (`System Admin` - IT Administration)**:
   - Full access to purge tickets, view the full audit ledger, and manage system backups.

---

## 🧪 Automated Testing

An automated integration suite validates the entire business logic, storage engine, permissions guard, and logging categories in [tests/test_system.js](file:///c:/Users/HP/Desktop/wk%207/tests/test_system.js).

To execute the test suite:
```bash
node tests/test_system.js
```

### Test Results
```text
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

## 💾 Web Storage & Data Resilience

1. **Auto-Recovery**: If `localStorage` is empty or cleared, `StorageManager` automatically re-seeds standard mock records and bootstrap audit logs.
2. **Storage Quota Protection**: Catches `QuotaExceededError` during high-volume writes, limits log history to the 500 most recent events, and records critical errors in the logger.
3. **Full JSON Backup & Restore**: Click the **⚙️** icon in the header to export the full database (tickets + logs + users) to a downloadable `.json` file, or restore from an existing backup.
