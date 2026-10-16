/**
 * Storage Engine for Tickets, Initial Data Seeding, and Export/Import
 * Implements robust web storage error handling and log instrumentation.
 */

const STORAGE_KEYS = {
  TICKETS: 'issue_tracker_tickets_v1',
  INITIALIZED: 'issue_tracker_initialized_v1',
  LOGS: 'issue_tracker_audit_logs'
};

const PriorityLevel = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

const TicketStatus = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  PENDING_INFO: 'Pending User Info',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed'
};

const TicketCategory = {
  SOFTWARE: 'Software Bug',
  HARDWARE: 'Hardware Failure',
  NETWORK: 'Network & VPN',
  SECURITY: 'Access & Security',
  BILLING: 'Billing & Account',
  GENERAL: 'General Request'
};

const DEFAULT_TICKETS = [
  {
    id: 'TCK-1001',
    title: 'VPN connection terminates every 15 minutes on MacOS Sequoia',
    category: TicketCategory.NETWORK,
    priority: PriorityLevel.HIGH,
    status: TicketStatus.IN_PROGRESS,
    description: 'Since updating to MacOS Sequoia yesterday, the GlobalProtect corporate VPN drops connection abruptly after exactly 15 minutes of inactivity. Requires manual reconnection each time.',
    requester: {
      id: 'usr_sarah_req',
      name: 'Sarah Jenkins',
      email: 'sarah.j@company.org',
      department: 'Marketing'
    },
    assignedTo: {
      id: 'stf_alex_support',
      name: 'Alex Rivera',
      department: 'IT Service Desk'
    },
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    tags: ['vpn', 'macos', 'network'],
    responses: [
      {
        id: 'rsp-1',
        author: {
          id: 'stf_alex_support',
          name: 'Alex Rivera',
          role: 'Staff Specialist'
        },
        isInternal: false,
        message: 'Hi Sarah, thank you for reaching out. We have noticed gateway keep-alive timeouts with Sequoia. Could you verify if DNS caching is enabled in your network settings?',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'rsp-2',
        author: {
          id: 'usr_sarah_req',
          name: 'Sarah Jenkins',
          role: 'Requester'
        },
        isInternal: false,
        message: 'Checked DNS settings - caching was set to default. Attached screenshot of the client crash error code: ERR_SEC_TIMEOUT_9.',
        timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
      },
      {
        id: 'rsp-3',
        author: {
          id: 'stf_alex_support',
          name: 'Alex Rivera',
          role: 'Staff Specialist'
        },
        isInternal: true,
        message: '[Internal Note] Known vendor bug in GlobalProtect v6.1.2. Escalated gateway profile config update with Maya to push patch v6.1.4 via MDM.',
        timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString()
      }
    ],
    timeline: [
      {
        action: 'CREATED',
        summary: 'Ticket created with High priority',
        actor: 'Sarah Jenkins (Requester)',
        timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
      },
      {
        action: 'ASSIGNED',
        summary: 'Assigned to Alex Rivera',
        actor: 'Alex Rivera (Staff Specialist)',
        timestamp: new Date(Date.now() - 28 * 3600 * 1000).toISOString()
      },
      {
        action: 'STATUS_CHANGE',
        summary: 'Status changed from Open to In Progress',
        actor: 'Alex Rivera (Staff Specialist)',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'TCK-1002',
    title: 'Critical Database replica latency spike on AWS us-east-1',
    category: TicketCategory.SOFTWARE,
    priority: PriorityLevel.CRITICAL,
    status: TicketStatus.OPEN,
    description: 'Production read-replica lag exceeded 1,200 seconds during morning batch job. Analytics dashboard is serving stale financial data.',
    requester: {
      id: 'usr_david_req',
      name: 'David Zhao',
      email: 'david.z@company.org',
      department: 'Finance'
    },
    assignedTo: null,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    tags: ['database', 'production', 'replica-lag'],
    responses: [],
    timeline: [
      {
        action: 'CREATED',
        summary: 'Ticket created with Critical priority',
        actor: 'David Zhao (Requester)',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'TCK-1003',
    title: 'Request for Okta SSO authorization for Data Engineering tools',
    category: TicketCategory.SECURITY,
    priority: PriorityLevel.MEDIUM,
    status: TicketStatus.RESOLVED,
    description: 'Need access provisioning for Datadog and BigQuery console for the new quarterly forecasting sprint starting next Monday.',
    requester: {
      id: 'usr_sarah_req',
      name: 'Sarah Jenkins',
      email: 'sarah.j@company.org',
      department: 'Marketing'
    },
    assignedTo: {
      id: 'adm_marcus_admin',
      name: 'Marcus Vance',
      department: 'IT Administration'
    },
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    tags: ['okta', 'sso', 'access-control'],
    responses: [
      {
        id: 'rsp-10',
        author: {
          id: 'adm_marcus_admin',
          name: 'Marcus Vance',
          role: 'System Admin'
        },
        isInternal: true,
        message: '[Internal Note] Verified manager approval from Finance VP. Added to group: okta-data-analysts-ro.',
        timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString()
      },
      {
        id: 'rsp-11',
        author: {
          id: 'adm_marcus_admin',
          name: 'Marcus Vance',
          role: 'System Admin'
        },
        isInternal: false,
        message: 'Your Okta roles have been configured. Please log out and back into the SSO dashboard to see the BigQuery and Datadog tiles.',
        timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      }
    ],
    timeline: [
      {
        action: 'CREATED',
        summary: 'Ticket submitted with Medium priority',
        actor: 'Sarah Jenkins (Requester)',
        timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString()
      },
      {
        action: 'WORKFLOW_DECISION',
        summary: 'Assigned to System Admin Marcus Vance',
        actor: 'Marcus Vance (System Admin)',
        timestamp: new Date(Date.now() - 20 * 3600 * 1000).toISOString()
      },
      {
        action: 'STATUS_CHANGE',
        summary: 'Status marked Resolved after access provisioning',
        actor: 'Marcus Vance (System Admin)',
        timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'TCK-1004',
    title: 'Office printer on 4th floor paper feed jamming continuously',
    category: TicketCategory.HARDWARE,
    priority: PriorityLevel.LOW,
    status: TicketStatus.PENDING_INFO,
    description: 'Tray 2 on Canon imageRUNNER repeatedly feeds multiple sheets causing error code 052. Manual clearing only works for 2-3 pages.',
    requester: {
      id: 'usr_david_req',
      name: 'David Zhao',
      email: 'david.z@company.org',
      department: 'Finance'
    },
    assignedTo: {
      id: 'stf_alex_support',
      name: 'Alex Rivera',
      department: 'IT Service Desk'
    },
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    tags: ['hardware', 'facilities', 'printer'],
    responses: [
      {
        id: 'rsp-20',
        author: {
          id: 'stf_alex_support',
          name: 'Alex Rivera',
          role: 'Staff Specialist'
        },
        isInternal: false,
        message: 'Is the paper weight 80gsm or heavy cardstock? Could you verify if Tray 1 works without errors while we await technician dispatch?',
        timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
      }
    ],
    timeline: [
      {
        action: 'CREATED',
        summary: 'Ticket submitted with Low priority',
        actor: 'David Zhao (Requester)',
        timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
      },
      {
        action: 'STATUS_CHANGE',
        summary: 'Status updated to Pending User Info',
        actor: 'Alex Rivera (Staff Specialist)',
        timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
      }
    ]
  }
];

class StorageManager {
  constructor() {
    this.ensureInitialized();
  }

  ensureInitialized() {
    try {
      const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
      const existing = localStorage.getItem(STORAGE_KEYS.TICKETS);
      
      if (!isInit || !existing || JSON.parse(existing).length === 0) {
        this.resetToDefaults();
      }
    } catch (e) {
      window.SystemLogger.logError(
        'STORAGE_INIT_ERROR',
        'Failed during storage initialization check: ' + e.message,
        { error: e.toString() }
      );
      this.resetToDefaults();
    }
  }

  getTickets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error('Tickets payload in web storage is corrupted or not an array');
      }
      return parsed;
    } catch (err) {
      window.SystemLogger.logError(
        'STORAGE_READ_ERROR',
        'Could not read tickets from localStorage: ' + err.message,
        { error: err.toString() }
      );
      return [];
    }
  }

  saveTickets(tickets) {
    try {
      if (!Array.isArray(tickets)) {
        throw new Error('Cannot save non-array tickets payload');
      }
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
      return true;
    } catch (err) {
      // Catch quota exceeded or permission errors in Web Storage
      const isQuota = err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014;
      window.SystemLogger.logError(
        isQuota ? 'STORAGE_QUOTA_EXCEEDED' : 'STORAGE_WRITE_ERROR',
        `Failed to write tickets to web storage: ${err.message}`,
        { errorName: err.name, isQuota },
        LogLevel.CRITICAL
      );
      return false;
    }
  }

  resetToDefaults() {
    try {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(DEFAULT_TICKETS));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

      // Preload standard demo logs into audit history
      const initialLogs = [
        {
          id: 'LOG-INIT-001',
          timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
          category: LogCategory.USER_ROLE,
          level: LogLevel.INFO,
          action: 'SYSTEM_BOOTSTRAP',
          message: 'System initialized with default roles: Requester, Staff Specialist, System Admin',
          actor: { id: 'system', name: 'System Core', role: 'System', department: 'IT' },
          metadata: { version: '1.0.0', storageEngine: 'localStorage' }
        },
        {
          id: 'LOG-INIT-002',
          timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
          category: LogCategory.WORKFLOW_DECISION,
          level: LogLevel.INFO,
          action: 'TICKET_CREATED',
          message: 'Ticket TCK-1001 created by Sarah Jenkins with Priority: High',
          actor: { id: 'usr_sarah_req', name: 'Sarah Jenkins', role: 'Requester', department: 'Marketing' },
          metadata: { ticketId: 'TCK-1001', priority: 'High', category: 'Network & VPN' }
        },
        {
          id: 'LOG-INIT-003',
          timestamp: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
          category: LogCategory.WORKFLOW_DECISION,
          level: LogLevel.INFO,
          action: 'WORKFLOW_ASSIGNMENT',
          message: 'Ticket TCK-1001 claimed and assigned to Alex Rivera',
          actor: { id: 'stf_alex_support', name: 'Alex Rivera', role: 'Staff Specialist', department: 'IT Service Desk' },
          metadata: { ticketId: 'TCK-1001', assignedTo: 'Alex Rivera' }
        },
        {
          id: 'LOG-INIT-004',
          timestamp: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
          category: LogCategory.PERMISSION,
          level: LogLevel.WARN,
          action: 'PERMISSION_CHECK_FAILED',
          message: '[ACCESS DENIED] User "Sarah Jenkins" (Requester) was denied access to permission "EDIT_STATUS"',
          actor: { id: 'usr_sarah_req', name: 'Sarah Jenkins', role: 'Requester', department: 'Marketing' },
          metadata: { attemptedPermission: 'EDIT_STATUS', granted: false }
        },
        {
          id: 'LOG-INIT-005',
          timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          category: LogCategory.WORKFLOW_DECISION,
          level: LogLevel.WARN,
          action: 'PRIORITY_ESCALATION',
          message: 'Ticket TCK-1002 marked as CRITICAL due to production replica lag alert',
          actor: { id: 'usr_david_req', name: 'David Zhao', role: 'Requester', department: 'Finance' },
          metadata: { ticketId: 'TCK-1002', priority: 'Critical' }
        }
      ];

      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(initialLogs));

      window.SystemLogger.logWorkflowDecision(
        'SYSTEM_RESET',
        'Database reset to standard seed demonstration data',
        { ticketCount: DEFAULT_TICKETS.length, initializedAt: new Date().toISOString() }
      );

      return true;
    } catch (e) {
      window.SystemLogger.logError(
        'RESET_FAILURE',
        'Unable to reset system to default state: ' + e.message,
        { error: e.toString() }
      );
      return false;
    }
  }

  exportData() {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        tickets: this.getTickets(),
        auditLogs: window.SystemLogger.getLogs(),
        currentUser: window.AuthService.getCurrentUser()
      };
      return JSON.stringify(payload, null, 2);
    } catch (e) {
      window.SystemLogger.logError('DATA_EXPORT_ERROR', 'Failed exporting data: ' + e.message);
      return null;
    }
  }

  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.tickets || !Array.isArray(parsed.tickets)) {
        throw new Error('Import data missing valid "tickets" array.');
      }
      this.saveTickets(parsed.tickets);
      if (parsed.auditLogs && Array.isArray(parsed.auditLogs)) {
        window.SystemLogger.saveLogs(parsed.auditLogs);
      }
      window.SystemLogger.logWorkflowDecision(
        'DATA_IMPORTED',
        `Successfully imported backup with ${parsed.tickets.length} tickets.`,
        { count: parsed.tickets.length }
      );
      return { success: true, count: parsed.tickets.length };
    } catch (e) {
      window.SystemLogger.logError('DATA_IMPORT_ERROR', 'Failed to import backup: ' + e.message, { error: e.toString() });
      return { success: false, error: e.message };
    }
  }
}

window.PriorityLevel = PriorityLevel;
window.TicketStatus = TicketStatus;
window.TicketCategory = TicketCategory;
window.StorageManager = new StorageManager();
