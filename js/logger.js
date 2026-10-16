/**
 * Central Logger module for Issue Tracker
 * Categories required to log:
 * 1. User Roles (role assignments, switches, access token/session events)
 * 2. Workflow Decisions (status transitions, priority escalations, assignees, approval/rejection)
 * 3. Error Handling (validation failures, invalid state operations, missing references, storage exceptions)
 * 4. Permissions (permission checks, access grants, unauthorized access attempts/blocks)
 */

const LogCategory = {
  USER_ROLE: 'USER_ROLE',
  WORKFLOW_DECISION: 'WORKFLOW_DECISION',
  ERROR_HANDLING: 'ERROR_HANDLING',
  PERMISSION: 'PERMISSION'
};

const LogLevel = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
  SUCCESS: 'SUCCESS'
};

class SystemLogger {
  constructor(storageKey = 'issue_tracker_audit_logs') {
    this.storageKey = storageKey;
    this.listeners = [];
  }

  getLogs() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Failed to read audit logs from localStorage:', err);
      return [];
    }
  }

  saveLogs(logs) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(logs));
      this.notifyListeners(logs);
    } catch (err) {
      console.error('Failed to save audit logs to localStorage:', err);
    }
  }

  log({ category, level = LogLevel.INFO, action, message, metadata = {}, actor = null }) {
    const logs = this.getLogs();
    
    // Fallback to active user if actor not provided
    const user = actor || (window.AuthService ? window.AuthService.getCurrentUser() : { name: 'System', role: 'System' });

    const newEntry = {
      id: 'LOG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      timestamp: new Date().toISOString(),
      category,
      level,
      action,
      message,
      actor: {
        id: user.id || 'system',
        name: user.name || 'System',
        role: user.role || 'Guest',
        department: user.department || 'N/A'
      },
      metadata
    };

    logs.unshift(newEntry); // newest first

    // Limit to 500 records to prevent localStorage overflow
    if (logs.length > 500) {
      logs.length = 500;
    }

    this.saveLogs(logs);

    // Also dispatch event for real-time live log console or toast
    window.dispatchEvent(new CustomEvent('tracker:log-added', { detail: newEntry }));

    return newEntry;
  }

  // --- Convenience Logging Helpers for the 4 Prompt Requirements ---

  // 1. User Roles
  logUserRole(action, message, metadata = {}, actor = null) {
    return this.log({
      category: LogCategory.USER_ROLE,
      level: LogLevel.INFO,
      action,
      message,
      metadata,
      actor
    });
  }

  // 2. Workflow Decisions
  logWorkflowDecision(action, message, metadata = {}, level = LogLevel.INFO) {
    return this.log({
      category: LogCategory.WORKFLOW_DECISION,
      level,
      action,
      message,
      metadata
    });
  }

  // 3. Error Handling
  logError(action, message, errorDetails = {}, level = LogLevel.ERROR) {
    return this.log({
      category: LogCategory.ERROR_HANDLING,
      level,
      action,
      message,
      metadata: errorDetails
    });
  }

  // 4. Permissions
  logPermission(action, granted, message, metadata = {}) {
    return this.log({
      category: LogCategory.PERMISSION,
      level: granted ? LogLevel.INFO : LogLevel.WARN,
      action,
      message: granted ? `[ACCESS GRANTED] ${message}` : `[ACCESS DENIED] ${message}`,
      metadata: {
        ...metadata,
        granted
      }
    });
  }

  clearLogs() {
    this.saveLogs([]);
    this.log({
      category: LogCategory.WORKFLOW_DECISION,
      level: LogLevel.WARN,
      action: 'LOGS_CLEARED',
      message: 'System audit logs were cleared by user action.',
      metadata: { timestamp: new Date().toISOString() }
    });
  }

  onLogAdded(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(logs) {
    this.listeners.forEach(cb => {
      try {
        cb(logs);
      } catch (e) {
        console.error(e);
      }
    });
  }
}

window.SystemLogger = new SystemLogger();
window.LogCategory = LogCategory;
window.LogLevel = LogLevel;
