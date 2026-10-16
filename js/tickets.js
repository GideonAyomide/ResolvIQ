/**
 * Ticket Service
 * Manages creation, priority updates, status transitions, staff responses,
 * and internal notes, with full logging of workflow decisions and error handling.
 */

class TicketService {
  constructor() {
    this.storage = window.StorageManager;
  }

  getAllTickets() {
    return this.storage.getTickets();
  }

  getTicketById(ticketId) {
    if (!ticketId) {
      window.SystemLogger.logError('LOOKUP_ERROR', 'Attempted to fetch ticket with empty or null ID');
      return null;
    }
    const tickets = this.getAllTickets();
    const found = tickets.find(t => t.id === ticketId);
    if (!found) {
      window.SystemLogger.logError(
        'TICKET_NOT_FOUND',
        `Ticket with ID "${ticketId}" was not found in storage`,
        { ticketId }
      );
    }
    return found || null;
  }

  generateTicketId() {
    const tickets = this.getAllTickets();
    let maxNum = 1000;
    tickets.forEach(t => {
      const parts = t.id.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return `TCK-${maxNum + 1}`;
  }

  /**
   * 1. Ticket Creation with input validation and error logging
   */
  createTicket({ title, category, priority, description, tags = [] }) {
    const auth = window.AuthService;
    const currentUser = auth.getCurrentUser();

    // Check permission
    if (!auth.hasPermission(window.Permissions.CREATE_TICKET)) {
      const err = new Error('Permission denied: You do not have rights to submit tickets.');
      window.SystemLogger.logError('TICKET_CREATE_DENIED', err.message, { userId: currentUser.id });
      throw err;
    }

    // Validation
    const errors = [];
    if (!title || typeof title !== 'string' || title.trim().length < 5) {
      errors.push('Title must be at least 5 characters long.');
    }
    if (!category || !Object.values(window.TicketCategory).includes(category)) {
      errors.push('A valid issue category must be selected.');
    }
    if (!priority || !Object.values(window.PriorityLevel).includes(priority)) {
      errors.push('A valid priority level must be selected.');
    }
    if (!description || typeof description !== 'string' || description.trim().length < 15) {
      errors.push('Detailed description must be at least 15 characters long.');
    }

    if (errors.length > 0) {
      // Requirement: Log Error Handling
      window.SystemLogger.logError(
        'FORM_VALIDATION_FAILED',
        `Ticket submission validation failed: ${errors.join(', ')}`,
        { errors, submittedPayload: { title, category, priority } }
      );
      const validationError = new Error(errors.join(' '));
      validationError.validationDetails = errors;
      throw validationError;
    }

    const ticketId = this.generateTicketId();
    const newTicket = {
      id: ticketId,
      title: title.trim(),
      category,
      priority,
      status: window.TicketStatus.OPEN,
      description: description.trim(),
      requester: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        department: currentUser.department
      },
      assignedTo: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: Array.isArray(tags) ? tags.map(t => t.trim().toLowerCase()).filter(Boolean) : [],
      responses: [],
      timeline: [
        {
          action: 'CREATED',
          summary: `Ticket created with ${priority} priority in ${category}`,
          actor: `${currentUser.name} (${currentUser.role})`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    const tickets = this.getAllTickets();
    tickets.unshift(newTicket);
    const saved = this.storage.saveTickets(tickets);

    if (!saved) {
      throw new Error('Could not persist ticket to Web Storage. Please check storage capacity.');
    }

    // Requirement: Log workflow decision
    window.SystemLogger.logWorkflowDecision(
      'TICKET_CREATED',
      `New issue ${ticketId} [${priority}] submitted by ${currentUser.name}: "${title}"`,
      { ticketId, priority, category, requester: currentUser.name }
    );

    return newTicket;
  }

  /**
   * 2. Status Updates with Workflow Decision Logging & Permission Checks
   */
  updateStatus(ticketId, newStatus, reason = '') {
    const auth = window.AuthService;
    const currentUser = auth.getCurrentUser();

    // Permissions check
    if (!auth.hasPermission(window.Permissions.EDIT_STATUS)) {
      const err = new Error(`Permission Denied: User role "${currentUser.role}" is not allowed to update ticket status.`);
      window.SystemLogger.logError('UNAUTHORIZED_STATUS_UPDATE', err.message, { ticketId, attemptedStatus: newStatus });
      throw err;
    }

    if (!Object.values(window.TicketStatus).includes(newStatus)) {
      const err = new Error(`Invalid status "${newStatus}" specified.`);
      window.SystemLogger.logError('INVALID_STATUS_ERROR', err.message, { newStatus });
      throw err;
    }

    const tickets = this.getAllTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found.`);
    }

    const oldStatus = ticket.status;
    if (oldStatus === newStatus) {
      return ticket; // No change
    }

    ticket.status = newStatus;
    ticket.updatedAt = new Date().toISOString();

    // Auto-claim if Open -> In Progress and unassigned
    if (newStatus === window.TicketStatus.IN_PROGRESS && !ticket.assignedTo) {
      ticket.assignedTo = {
        id: currentUser.id,
        name: currentUser.name,
        department: currentUser.department
      };
    }

    const summary = `Status updated from "${oldStatus}" to "${newStatus}"${reason ? ` - Rationale: ${reason}` : ''}`;
    ticket.timeline.unshift({
      action: 'STATUS_CHANGE',
      summary,
      actor: `${currentUser.name} (${currentUser.role})`,
      timestamp: new Date().toISOString(),
      metadata: { oldStatus, newStatus, reason }
    });

    this.storage.saveTickets(tickets);

    // Requirement: Log workflow decision
    window.SystemLogger.logWorkflowDecision(
      'STATUS_TRANSITION',
      `Ticket ${ticketId} moved from [${oldStatus}] to [${newStatus}] by ${currentUser.name}${reason ? ` (${reason})` : ''}`,
      { ticketId, oldStatus, newStatus, reason, actorRole: currentUser.role }
    );

    return ticket;
  }

  /**
   * 3. Priority Level Updates with Workflow Decision Logging
   */
  updatePriority(ticketId, newPriority, escalationReason = '') {
    const auth = window.AuthService;
    const currentUser = auth.getCurrentUser();

    if (!auth.hasPermission(window.Permissions.EDIT_PRIORITY)) {
      const err = new Error(`Permission Denied: Role "${currentUser.role}" cannot alter priority levels.`);
      window.SystemLogger.logError('UNAUTHORIZED_PRIORITY_UPDATE', err.message, { ticketId, newPriority });
      throw err;
    }

    if (!Object.values(window.PriorityLevel).includes(newPriority)) {
      throw new Error(`Invalid priority level: ${newPriority}`);
    }

    const tickets = this.getAllTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const oldPriority = ticket.priority;
    if (oldPriority === newPriority) return ticket;

    ticket.priority = newPriority;
    ticket.updatedAt = new Date().toISOString();

    const summary = `Priority adjusted from ${oldPriority} to ${newPriority}${escalationReason ? ` (${escalationReason})` : ''}`;
    ticket.timeline.unshift({
      action: 'PRIORITY_CHANGE',
      summary,
      actor: `${currentUser.name} (${currentUser.role})`,
      timestamp: new Date().toISOString(),
      metadata: { oldPriority, newPriority, reason: escalationReason }
    });

    this.storage.saveTickets(tickets);

    // Requirement: Log workflow decision
    const isEscalation = (newPriority === window.PriorityLevel.CRITICAL || newPriority === window.PriorityLevel.HIGH);
    window.SystemLogger.logWorkflowDecision(
      isEscalation ? 'PRIORITY_ESCALATION' : 'PRIORITY_MODIFIED',
      `Ticket ${ticketId} priority changed: ${oldPriority} ➔ ${newPriority}${escalationReason ? ` | Note: ${escalationReason}` : ''}`,
      { ticketId, oldPriority, newPriority, escalationReason, changedBy: currentUser.name },
      isEscalation ? window.LogLevel.WARN : window.LogLevel.INFO
    );

    return ticket;
  }

  /**
   * 4. Staff Responses and Internal Notes
   */
  addResponse(ticketId, { message, isInternal = false }) {
    const auth = window.AuthService;
    const currentUser = auth.getCurrentUser();

    if (!message || message.trim().length === 0) {
      const err = new Error('Response message cannot be empty.');
      window.SystemLogger.logError('EMPTY_RESPONSE_ERROR', err.message, { ticketId });
      throw err;
    }

    // If internal note, check permissions
    if (isInternal && !auth.hasPermission(window.Permissions.POST_INTERNAL_NOTE)) {
      const err = new Error(`Permission Denied: Requester "${currentUser.name}" cannot post internal staff notes.`);
      window.SystemLogger.logError('INTERNAL_NOTE_UNAUTHORIZED', err.message, { ticketId, userId: currentUser.id });
      throw err;
    }

    const tickets = this.getAllTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const newResponse = {
      id: 'rsp-' + Date.now().toString(36),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        department: currentUser.department
      },
      isInternal: Boolean(isInternal),
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    if (!ticket.responses) ticket.responses = [];
    ticket.responses.push(newResponse);
    ticket.updatedAt = new Date().toISOString();

    // If requester replied while in "Pending User Info", automatically shift to "In Progress"
    if (!isInternal && currentUser.role === window.UserRoles.USER && ticket.status === window.TicketStatus.PENDING_INFO) {
      ticket.status = window.TicketStatus.IN_PROGRESS;
      ticket.timeline.unshift({
        action: 'STATUS_AUTO_UPDATE',
        summary: 'Status automatically shifted to In Progress upon requester reply',
        actor: 'Workflow Engine',
        timestamp: new Date().toISOString()
      });
      window.SystemLogger.logWorkflowDecision(
        'WORKFLOW_AUTO_TRANSITION',
        `Ticket ${ticketId} auto-resumed to In Progress after response from requester`,
        { ticketId, responder: currentUser.name }
      );
    }

    ticket.timeline.unshift({
      action: isInternal ? 'INTERNAL_NOTE_ADDED' : 'RESPONSE_ADDED',
      summary: isInternal ? 'Staff-only internal note recorded' : 'Public response posted',
      actor: `${currentUser.name} (${currentUser.role})`,
      timestamp: new Date().toISOString()
    });

    this.storage.saveTickets(tickets);

    // Requirement: Log workflow decision & activity
    window.SystemLogger.logWorkflowDecision(
      isInternal ? 'STAFF_INTERNAL_NOTE' : 'STAFF_PUBLIC_RESPONSE',
      `${isInternal ? '[INTERNAL NOTE]' : '[RESPONSE]'} posted to ${ticketId} by ${currentUser.name} (${currentUser.role})`,
      { ticketId, isInternal, responseId: newResponse.id, length: message.length }
    );

    return ticket;
  }

  /**
   * 5. Assignment
   */
  assignTicket(ticketId, staffUserId) {
    const auth = window.AuthService;
    const currentUser = auth.getCurrentUser();

    if (!auth.hasPermission(window.Permissions.ASSIGN_TICKET)) {
      const err = new Error(`Permission Denied: User role "${currentUser.role}" cannot assign tickets.`);
      window.SystemLogger.logError('ASSIGN_PERMISSION_DENIED', err.message, { ticketId });
      throw err;
    }

    const tickets = this.getAllTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const staffMember = window.DEMO_USERS.find(u => u.id === staffUserId);
    if (!staffMember && staffUserId !== null) {
      throw new Error(`Staff member with ID ${staffUserId} not found.`);
    }

    const previousAssignee = ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned';
    const newAssigneeName = staffMember ? staffMember.name : 'Unassigned';

    ticket.assignedTo = staffMember ? {
      id: staffMember.id,
      name: staffMember.name,
      department: staffMember.department
    } : null;
    ticket.updatedAt = new Date().toISOString();

    ticket.timeline.unshift({
      action: 'ASSIGNMENT_CHANGED',
      summary: `Ticket assigned to ${newAssigneeName} (previously: ${previousAssignee})`,
      actor: `${currentUser.name} (${currentUser.role})`,
      timestamp: new Date().toISOString()
    });

    this.storage.saveTickets(tickets);

    window.SystemLogger.logWorkflowDecision(
      'WORKFLOW_ASSIGNMENT',
      `Ticket ${ticketId} assigned to ${newAssigneeName} by ${currentUser.name}`,
      { ticketId, previousAssignee, newAssignee: newAssigneeName }
    );

    return ticket;
  }

  /**
   * 6. Deletion (Admin only)
   */
  deleteTicket(ticketId) {
    const auth = window.AuthService;
    const currentUser = auth.getCurrentUser();

    if (!auth.hasPermission(window.Permissions.DELETE_TICKET)) {
      const err = new Error(`Permission Denied: Only System Administrators can permanently delete tickets.`);
      window.SystemLogger.logError('DELETE_TICKET_UNAUTHORIZED', err.message, { ticketId, role: currentUser.role });
      throw err;
    }

    const tickets = this.getAllTickets();
    const index = tickets.findIndex(t => t.id === ticketId);
    if (index === -1) {
      throw new Error(`Ticket ${ticketId} does not exist.`);
    }

    const deleted = tickets.splice(index, 1)[0];
    this.storage.saveTickets(tickets);

    window.SystemLogger.logWorkflowDecision(
      'TICKET_DELETED',
      `Ticket ${ticketId} ("${deleted.title}") was purged by ${currentUser.name} (${currentUser.role})`,
      { ticketId, title: deleted.title, purgedBy: currentUser.name },
      window.LogLevel.WARN
    );

    return true;
  }
}

window.TicketService = new TicketService();
