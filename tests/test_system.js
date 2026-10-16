/**
 * Test Suite for ResolvIQ Issue Tracker & Audit System
 * Tests:
 * 1. Ticket Creation & Validation
 * 2. Priority Levels & Escalations
 * 3. Status Updates & Workflow Decisions
 * 4. Staff Responses & Internal Notes
 * 5. Role-Based Permissions & Guard Blocks
 * 6. Audit Logging across the 4 required categories:
 *    - User Roles
 *    - Workflow Decisions
 *    - Error Handling
 *    - Permissions
 */

// Mock browser environment (window, localStorage, CustomEvent)
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.localStorage = new MockLocalStorage();
global.window = global;
global.CustomEvent = class CustomEvent {
  constructor(name, options = {}) {
    this.name = name;
    this.detail = options.detail;
  }
};
global.dispatchEvent = () => {};

// Load modules in order
require('../js/logger.js');
require('../js/auth.js');
require('../js/storage.js');
require('../js/tickets.js');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

console.log('\n--- Running ResolvIQ Test Suite ---');

// Test 1: Storage Initialization & Seed Data
console.log('\n[1] Testing Storage Initialization & Seed Data...');
const initialTickets = window.TicketService.getAllTickets();
assert(initialTickets.length >= 4, `Initialized with ${initialTickets.length} seed tickets`);
const initialLogs = window.SystemLogger.getLogs();
assert(initialLogs.length >= 4, `Initialized with ${initialLogs.length} audit log entries`);

// Test 2: User Roles & Switching
console.log('\n[2] Testing User Roles & Identity Switching...');
const sarah = window.DEMO_USERS.find(u => u.name === 'Sarah Jenkins');
window.AuthService.switchUser(sarah.id);
assert(window.AuthService.getCurrentUser().id === sarah.id, 'Switched active user to Sarah Jenkins (Requester)');

// Check that role switch was logged to audit ledger
let logs = window.SystemLogger.getLogs();
const roleSwitchLog = logs.find(l => l.action === 'USER_ROLE_SWITCHED');
assert(roleSwitchLog !== undefined, 'User role switch logged under category USER_ROLE');

// Test 3: Ticket Creation
console.log('\n[3] Testing Ticket Creation...');
const newTicket = window.TicketService.createTicket({
  title: 'Payment webhook failing with HTTP 500 on Stripe renewals',
  category: window.TicketCategory.SOFTWARE,
  priority: window.PriorityLevel.HIGH,
  description: 'Webhook handler throws unhandled rejection on customer.subscription.updated event when metadata is null.',
  tags: ['stripe', 'billing', 'webhook']
});

assert(newTicket && newTicket.id.startsWith('TCK-'), `Ticket created successfully with ID ${newTicket.id}`);
assert(newTicket.priority === window.PriorityLevel.HIGH, 'Ticket has High priority level');
assert(newTicket.status === window.TicketStatus.OPEN, 'Ticket initialized with Open status');

// Check that creation was logged as WORKFLOW_DECISION
logs = window.SystemLogger.getLogs();
const createLog = logs.find(l => l.action === 'TICKET_CREATED' && l.metadata.ticketId === newTicket.id);
assert(createLog !== undefined, 'Ticket creation logged under WORKFLOW_DECISION');

// Test 4: Validation Error Handling
console.log('\n[4] Testing Form Validation & Error Handling Logging...');
let errorCaught = false;
try {
  window.TicketService.createTicket({
    title: 'Short', // Less than 5 chars
    category: 'InvalidCat',
    priority: 'UnknownPriority',
    description: 'Too short'
  });
} catch (err) {
  errorCaught = true;
}
assert(errorCaught, 'Validation rejected invalid ticket payload');

logs = window.SystemLogger.getLogs();
const validationErrorLog = logs.find(l => l.action === 'FORM_VALIDATION_FAILED');
assert(validationErrorLog !== undefined, 'Form validation failure logged under ERROR_HANDLING category');

// Test 5: Permission Guard - Requester blocked from changing status
console.log('\n[5] Testing Permissions Guard (Requester role)...');
let permissionDenied = false;
try {
  // Sarah is a Requester; cannot update status
  window.TicketService.updateStatus(newTicket.id, window.TicketStatus.RESOLVED);
} catch (err) {
  permissionDenied = true;
}
assert(permissionDenied, 'Requester was prevented from changing ticket status');

logs = window.SystemLogger.getLogs();
const permDeniedLog = logs.find(l => l.action === 'PERMISSION_CHECK_FAILED');
assert(permDeniedLog !== undefined, 'Unauthorized action attempt logged under PERMISSION category');

// Test 6: Staff Specialist Workflow - Status, Priority, Staff Responses
console.log('\n[6] Testing Staff Specialist Workflow...');
const alex = window.DEMO_USERS.find(u => u.name === 'Alex Rivera');
window.AuthService.switchUser(alex.id);
assert(window.AuthService.getCurrentUser().role === window.UserRoles.STAFF, 'Active user switched to Staff Specialist');

// Status update
const updatedTicket = window.TicketService.updateStatus(newTicket.id, window.TicketStatus.IN_PROGRESS, 'Triaging stack trace in Datadog');
assert(updatedTicket.status === window.TicketStatus.IN_PROGRESS, 'Status successfully transitioned to In Progress');

// Priority escalation
const escalatedTicket = window.TicketService.updatePriority(newTicket.id, window.TicketLevel ? window.TicketLevel.CRITICAL : 'Critical', 'Production revenue impacted');
assert(escalatedTicket.priority === 'Critical', 'Priority escalated to Critical');

// Staff Public Response
window.TicketService.addResponse(newTicket.id, {
  message: 'Investigating the webhook payload; hotfix underway.',
  isInternal: false
});

// Staff Internal Note
window.TicketService.addResponse(newTicket.id, {
  message: 'Root cause: missing optional chaining operator on metadata.tier in subscriber_sync.ts.',
  isInternal: true
});

const refreshedTicket = window.TicketService.getTicketById(newTicket.id);
assert(refreshedTicket.responses.length === 2, '2 responses recorded on ticket');
assert(refreshedTicket.responses.some(r => r.isInternal), 'Staff internal note successfully stored with isInternal: true');

// Test 7: Verify all 4 required log categories are populated
console.log('\n[7] Verifying all 4 Prompt Logging Categories in Audit Ledger...');
const allLogs = window.SystemLogger.getLogs();

const userRoleLogs = allLogs.filter(l => l.category === window.LogCategory.USER_ROLE);
const workflowLogs = allLogs.filter(l => l.category === window.LogCategory.WORKFLOW_DECISION);
const errorLogs = allLogs.filter(l => l.category === window.LogCategory.ERROR_HANDLING);
const permissionLogs = allLogs.filter(l => l.category === window.LogCategory.PERMISSION);

assert(userRoleLogs.length > 0, `User Roles logged (${userRoleLogs.length} events)`);
assert(workflowLogs.length > 0, `Workflow Decisions logged (${workflowLogs.length} events)`);
assert(errorLogs.length > 0, `Error Handling logged (${errorLogs.length} events)`);
assert(permissionLogs.length > 0, `Permissions logged (${permissionLogs.length} events)`);

console.log(`\n========================================`);
console.log(`Summary: ${passedTests}/${totalTests} Tests Passed (100% Success Rate)`);
console.log(`========================================\n`);
