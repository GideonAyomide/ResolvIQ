/**
 * Role-Based Access Control (RBAC) & Authentication Simulation
 * Manages active user profile, permission matrices, and audit logging of role events.
 */

const UserRoles = {
  USER: 'Requester',
  STAFF: 'Staff Specialist',
  ADMIN: 'System Admin'
};

const Permissions = {
  CREATE_TICKET: 'CREATE_TICKET',
  VIEW_ALL_TICKETS: 'VIEW_ALL_TICKETS',
  EDIT_STATUS: 'EDIT_STATUS',
  EDIT_PRIORITY: 'EDIT_PRIORITY',
  ASSIGN_TICKET: 'ASSIGN_TICKET',
  POST_PUBLIC_REPLY: 'POST_PUBLIC_REPLY',
  POST_INTERNAL_NOTE: 'POST_INTERNAL_NOTE',
  VIEW_INTERNAL_NOTES: 'VIEW_INTERNAL_NOTES',
  DELETE_TICKET: 'DELETE_TICKET',
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
  MANAGE_SYSTEM: 'MANAGE_SYSTEM'
};

// Available Demo Users for quick switching
const DEMO_USERS = [
  {
    id: 'usr_sarah_req',
    name: 'Sarah Jenkins',
    email: 'sarah.j@company.org',
    role: UserRoles.USER,
    department: 'Marketing',
    avatar: '👩‍💼',
    color: '#0284c7'
  },
  {
    id: 'usr_david_req',
    name: 'David Zhao',
    email: 'david.z@company.org',
    role: UserRoles.USER,
    department: 'Finance',
    avatar: '👨‍💼',
    color: '#0891b2'
  },
  {
    id: 'stf_alex_support',
    name: 'Alex Rivera',
    email: 'alex.support@company.org',
    role: UserRoles.STAFF,
    department: 'IT Service Desk',
    avatar: '👨‍💻',
    color: '#7c3aed'
  },
  {
    id: 'stf_maya_engineer',
    name: 'Maya Patel',
    email: 'maya.sec@company.org',
    role: UserRoles.STAFF,
    department: 'Infrastructure & Ops',
    avatar: '👩‍💻',
    color: '#9333ea'
  },
  {
    id: 'adm_marcus_admin',
    name: 'Marcus Vance',
    email: 'marcus.admin@company.org',
    role: UserRoles.ADMIN,
    department: 'IT Administration',
    avatar: '🛡️',
    color: '#e11d48'
  }
];

class AuthService {
  constructor(storageKey = 'issue_tracker_active_user') {
    this.storageKey = storageKey;
    this.currentUser = this.loadUser();
  }

  loadUser() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load user session:', e);
    }
    // Default initial user: Sarah Jenkins (Requester) to demonstrate regular flow first
    const defaultUser = DEMO_USERS[0];
    this.saveUser(defaultUser);
    return defaultUser;
  }

  saveUser(user) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to store active user:', e);
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getAllDemoUsers() {
    return DEMO_USERS;
  }

  switchUser(userId) {
    const targetUser = DEMO_USERS.find(u => u.id === userId);
    if (!targetUser) {
      window.SystemLogger.logError(
        'USER_SWITCH_FAILED',
        `Attempted to switch to nonexistent user ID: ${userId}`,
        { requestedId: userId }
      );
      return false;
    }

    const previousUser = this.currentUser;
    this.currentUser = targetUser;
    this.saveUser(targetUser);

    // Requirement: Log user role changes / switches
    window.SystemLogger.logUserRole(
      'USER_ROLE_SWITCHED',
      `Active identity switched from "${previousUser.name}" (${previousUser.role}) to "${targetUser.name}" (${targetUser.role})`,
      {
        previousUser: { id: previousUser.id, role: previousUser.role },
        newUser: { id: targetUser.id, role: targetUser.role, department: targetUser.department }
      },
      targetUser
    );

    window.dispatchEvent(new CustomEvent('tracker:user-changed', { detail: targetUser }));
    return true;
  }

  /**
   * Evaluates if the current user holds a specific permission.
   * Also systematically logs permission checks and permission denials.
   */
  hasPermission(permission, quiet = false) {
    const user = this.currentUser;
    let allowed = false;

    switch (permission) {
      case Permissions.CREATE_TICKET:
        // Everyone can create tickets
        allowed = true;
        break;

      case Permissions.VIEW_ALL_TICKETS:
        // Staff and admin can view everything; User can also view public list or filter to own
        allowed = true;
        break;

      case Permissions.POST_PUBLIC_REPLY:
        // Any authenticated user can reply to tickets they have access to
        allowed = true;
        break;

      case Permissions.EDIT_STATUS:
      case Permissions.EDIT_PRIORITY:
      case Permissions.ASSIGN_TICKET:
      case Permissions.POST_INTERNAL_NOTE:
      case Permissions.VIEW_INTERNAL_NOTES:
        // Staff and Admin only
        allowed = (user.role === UserRoles.STAFF || user.role === UserRoles.ADMIN);
        break;

      case Permissions.VIEW_AUDIT_LOGS:
        // Staff can view, Admin can view & manage
        allowed = (user.role === UserRoles.STAFF || user.role === UserRoles.ADMIN);
        break;

      case Permissions.DELETE_TICKET:
      case Permissions.MANAGE_SYSTEM:
        // Admin only
        allowed = (user.role === UserRoles.ADMIN);
        break;

      default:
        allowed = false;
    }

    // Requirement: Log permissions (both allowed and denied events)
    if (!allowed && !quiet) {
      window.SystemLogger.logPermission(
        'PERMISSION_CHECK_FAILED',
        false,
        `User "${user.name}" (${user.role}) was denied access to permission "${permission}"`,
        {
          userId: user.id,
          role: user.role,
          attemptedPermission: permission
        }
      );
    } else if (allowed && !quiet) {
      window.SystemLogger.logPermission(
        'PERMISSION_CHECK_SUCCESS',
        true,
        `Permission "${permission}" verified for user "${user.name}" (${user.role})`,
        {
          userId: user.id,
          role: user.role,
          permission
        }
      );
    }

    return allowed;
  }
}

window.UserRoles = UserRoles;
window.Permissions = Permissions;
window.DEMO_USERS = DEMO_USERS;
window.AuthService = new AuthService();
