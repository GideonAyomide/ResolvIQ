/**
 * ResolvIQ - Application Controller
 * Handles UI interactions, ticket lifecycle, role guards, filtering, and live audit views.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  const state = {
    searchQuery: '',
    filterStatus: 'ALL',
    filterPriority: 'ALL',
    filterCategory: 'ALL',
    filterOnlyMyTickets: false,
    sortBy: 'newest',
    selectedTicketId: null,
    replyMode: 'public', // 'public' | 'internal'
    activeLogCategory: 'ALL',
    activeLogLevel: 'ALL',
    logSearchQuery: ''
  };

  // DOM Elements - Header & Identity
  const headerUserAvatar = document.getElementById('header-user-avatar');
  const headerUserName = document.getElementById('header-user-name');
  const headerUserRole = document.getElementById('header-user-role');
  const userRoleSelect = document.getElementById('user-role-select');
  const logsCounterBadge = document.getElementById('logs-counter-badge');

  // DOM Elements - Actions
  const btnOpenCreate = document.getElementById('btn-open-create-ticket');
  const btnOpenLogs = document.getElementById('btn-open-audit-logs');
  const btnOpenTools = document.getElementById('btn-open-system-tools');

  // DOM Elements - Metrics
  const statTotal = document.getElementById('stat-total');
  const statOpen = document.getElementById('stat-open');
  const statProgress = document.getElementById('stat-progress');
  const statResolved = document.getElementById('stat-resolved');
  const statCritical = document.getElementById('stat-critical');

  // DOM Elements - Toolbar
  const searchInput = document.getElementById('search-input');
  const filterStatus = document.getElementById('filter-status');
  const filterPriority = document.getElementById('filter-priority');
  const filterCategory = document.getElementById('filter-category');
  const btnToggleMyTickets = document.getElementById('btn-toggle-my-tickets');
  const btnResetFilters = document.getElementById('btn-reset-filters');
  const sortTicketsSelect = document.getElementById('sort-tickets');

  // DOM Elements - List
  const ticketsContainer = document.getElementById('tickets-container');
  const ticketsEmptyState = document.getElementById('tickets-empty-state');
  const btnEmptyCreate = document.getElementById('btn-empty-create');

  // DOM Elements - Create Ticket Modal
  const modalCreate = document.getElementById('modal-create-ticket');
  const formCreateTicket = document.getElementById('form-create-ticket');
  const btnCloseCreate = document.getElementById('btn-close-create-modal');
  const btnCancelCreate = document.getElementById('btn-cancel-create');
  const createSubmitterName = document.getElementById('create-submitter-name');
  const createSubmitterRole = document.getElementById('create-submitter-role');
  const createValidationAlert = document.getElementById('create-validation-alert');
  const inputTicketTitle = document.getElementById('input-ticket-title');
  const selectTicketCategory = document.getElementById('select-ticket-category');
  const selectTicketPriority = document.getElementById('select-ticket-priority');
  const inputTicketDesc = document.getElementById('input-ticket-desc');
  const inputTicketTags = document.getElementById('input-ticket-tags');

  // DOM Elements - Detail Modal
  const modalDetail = document.getElementById('modal-ticket-details');
  const btnCloseDetail = document.getElementById('btn-close-detail-modal');
  const btnCloseDetailFooter = document.getElementById('btn-close-detail-footer');
  const detailTicketId = document.getElementById('detail-ticket-id');
  const detailTicketPriority = document.getElementById('detail-ticket-priority');
  const detailTicketStatus = document.getElementById('detail-ticket-status');
  const detailTicketTitle = document.getElementById('detail-ticket-title');
  const detailTicketDesc = document.getElementById('detail-ticket-desc');
  const detailPropCategory = document.getElementById('detail-prop-category');
  const detailPropRequester = document.getElementById('detail-prop-requester');
  const detailPropAssignee = document.getElementById('detail-prop-assignee');
  const detailPropDate = document.getElementById('detail-prop-date');

  // DOM Elements - Workflow in Detail Modal
  const requesterWorkflowNotice = document.getElementById('requester-workflow-notice');
  const staffWorkflowControls = document.getElementById('staff-workflow-controls');
  const workflowReasonContainer = document.getElementById('workflow-reason-container');
  const workflowPermissionBadge = document.getElementById('workflow-permission-badge');
  const workflowStatusSelect = document.getElementById('workflow-status-select');
  const btnApplyStatus = document.getElementById('btn-apply-status');
  const workflowPrioritySelect = document.getElementById('workflow-priority-select');
  const btnApplyPriority = document.getElementById('btn-apply-priority');
  const workflowAssigneeSelect = document.getElementById('workflow-assignee-select');
  const btnApplyAssignee = document.getElementById('btn-apply-assignee');
  const workflowDecisionReason = document.getElementById('workflow-decision-reason');
  const btnAdminDeleteTicket = document.getElementById('btn-admin-delete-ticket');
  const btnTestPermissionDenial = document.getElementById('btn-test-permission-denial');

  // DOM Elements - Detail Tabs & Replies
  const tabBtnResponses = document.getElementById('tab-btn-responses');
  const tabBtnTimeline = document.getElementById('tab-btn-timeline');
  const tabContentResponses = document.getElementById('tab-content-responses');
  const tabContentTimeline = document.getElementById('tab-content-timeline');
  const countResponsesBadge = document.getElementById('count-responses-badge');
  const countTimelineBadge = document.getElementById('count-timeline-badge');
  const ticketResponsesThread = document.getElementById('ticket-responses-thread');
  const ticketTimelineList = document.getElementById('ticket-timeline-list');
  const btnReplyModePublic = document.getElementById('btn-reply-mode-public');
  const btnReplyModeInternal = document.getElementById('btn-reply-mode-internal');
  const replyMessageInput = document.getElementById('reply-message-input');
  const replyModeHelper = document.getElementById('reply-mode-helper');
  const btnSubmitReply = document.getElementById('btn-submit-reply');

  // DOM Elements - Audit Logs Modal
  const modalAuditLogs = document.getElementById('modal-audit-logs');
  const btnCloseLogs = document.getElementById('btn-close-logs-modal');
  const btnCloseLogsFooter = document.getElementById('btn-close-logs-footer');
  const logCategoryTabs = document.getElementById('log-category-tabs');
  const logFilterLevel = document.getElementById('log-filter-level');
  const logSearchInput = document.getElementById('log-search-input');
  const logsListContainer = document.getElementById('logs-list-container');
  const logsTotalCount = document.getElementById('logs-total-count');
  const btnExportLogs = document.getElementById('btn-export-logs');
  const btnClearLogs = document.getElementById('btn-clear-logs');
  const btnSimPermission = document.getElementById('btn-sim-permission-denial');
  const btnSimValidation = document.getElementById('btn-sim-validation-error');

  // DOM Elements - Tools Modal
  const modalTools = document.getElementById('modal-system-tools');
  const btnCloseTools = document.getElementById('btn-close-tools-modal');
  const btnCloseToolsFooter = document.getElementById('btn-close-tools-footer');
  const btnResetSeedData = document.getElementById('btn-reset-seed-data');
  const btnExportAllData = document.getElementById('btn-export-all-data');
  const btnTriggerImport = document.getElementById('btn-trigger-import');
  const inputImportFile = document.getElementById('input-import-file');

  // ==========================================================================
  // INITIALIZATION & USER ROLE SETUP
  // ==========================================================================

  function initUserRoleSelect() {
    const users = window.AuthService.getAllDemoUsers();
    const currentUser = window.AuthService.getCurrentUser();

    userRoleSelect.innerHTML = users.map(user => `
      <option value="${user.id}" ${user.id === currentUser.id ? 'selected' : ''}>
        ${user.name} (${user.role} - ${user.department})
      </option>
    `).join('');

    updateUserDisplay(currentUser);

    userRoleSelect.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      window.AuthService.switchUser(selectedId);
    });
  }

  function updateUserDisplay(user) {
    headerUserAvatar.textContent = user.avatar || '👤';
    headerUserName.textContent = user.name;
    headerUserRole.textContent = user.role;
    createSubmitterName.textContent = user.name;
    createSubmitterRole.textContent = user.role;

    // Refresh UI based on role permissions
    renderTickets();
    updateAuditLogBadge();

    // If detail modal is open, re-evaluate workflow controls
    if (modalDetail.classList.contains('active') && state.selectedTicketId) {
      loadTicketDetails(state.selectedTicketId);
    }
  }

  window.addEventListener('tracker:user-changed', (e) => {
    updateUserDisplay(e.detail);
    showToast(`Switched active user to "${e.detail.name}" (${e.detail.role})`, 'info');
  });

  // ==========================================================================
  // METRICS & KPIS
  // ==========================================================================

  function updateMetrics() {
    const tickets = window.TicketService.getAllTickets();
    statTotal.textContent = tickets.length;
    
    const openCount = tickets.filter(t => t.status === window.TicketStatus.OPEN || t.status === window.TicketStatus.PENDING_INFO).length;
    statOpen.textContent = openCount;

    const progressCount = tickets.filter(t => t.status === window.TicketStatus.IN_PROGRESS).length;
    statProgress.textContent = progressCount;

    const resolvedCount = tickets.filter(t => t.status === window.TicketStatus.RESOLVED || t.status === window.TicketStatus.CLOSED).length;
    statResolved.textContent = resolvedCount;

    const criticalCount = tickets.filter(t => t.priority === window.PriorityLevel.CRITICAL).length;
    statCritical.textContent = criticalCount;
  }

  function updateAuditLogBadge() {
    const logs = window.SystemLogger.getLogs();
    logsCounterBadge.textContent = logs.length;
    logsTotalCount.textContent = logs.length;
  }

  window.addEventListener('tracker:log-added', () => {
    updateAuditLogBadge();
    if (modalAuditLogs.classList.contains('active')) {
      renderAuditLogs();
    }
  });

  // ==========================================================================
  // TICKET RENDERING & FILTERING
  // ==========================================================================

  function getFilteredTickets() {
    let tickets = window.TicketService.getAllTickets();
    const currentUser = window.AuthService.getCurrentUser();

    // Search query filter
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      tickets = tickets.filter(t => 
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.requester && t.requester.name.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }

    // Status filter
    if (state.filterStatus !== 'ALL') {
      tickets = tickets.filter(t => t.status === state.filterStatus);
    }

    // Priority filter
    if (state.filterPriority !== 'ALL') {
      tickets = tickets.filter(t => t.priority === state.filterPriority);
    }

    // Category filter
    if (state.filterCategory !== 'ALL') {
      tickets = tickets.filter(t => t.category === state.filterCategory);
    }

    // "My Tickets" toggle
    if (state.filterOnlyMyTickets) {
      tickets = tickets.filter(t => t.requester && t.requester.id === currentUser.id);
    }

    // Sorting
    const priorityWeight = {
      [window.PriorityLevel.CRITICAL]: 4,
      [window.PriorityLevel.HIGH]: 3,
      [window.PriorityLevel.MEDIUM]: 2,
      [window.PriorityLevel.LOW]: 1
    };

    tickets.sort((a, b) => {
      switch (state.sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'priority':
          return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        case 'updated':
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return tickets;
  }

  function renderTickets() {
    updateMetrics();
    const tickets = getFilteredTickets();
    const currentUser = window.AuthService.getCurrentUser();
    const canViewInternal = window.AuthService.hasPermission(window.Permissions.VIEW_INTERNAL_NOTES, true);

    if (tickets.length === 0) {
      ticketsContainer.innerHTML = '';
      ticketsEmptyState.style.display = 'flex';
      return;
    }

    ticketsEmptyState.style.display = 'none';
    ticketsContainer.innerHTML = tickets.map(ticket => {
      const priorityClass = `badge-priority-${ticket.priority.toLowerCase()}`;
      const statusClass = getStatusBadgeClass(ticket.status);
      const isCritical = ticket.priority === window.PriorityLevel.CRITICAL;
      const isHigh = ticket.priority === window.PriorityLevel.HIGH;

      // Filter responses visible to this user
      const visibleResponses = (ticket.responses || []).filter(r => canViewInternal || !r.isInternal);
      const internalCount = (ticket.responses || []).filter(r => r.isInternal).length;

      const dateStr = formatRelativeTime(ticket.createdAt);

      return `
        <article class="ticket-card ${isCritical ? 'priority-critical-card' : ''} ${isHigh ? 'priority-high-card' : ''}" 
                 data-ticket-id="${ticket.id}" 
                 tabindex="0" 
                 role="button" 
                 aria-label="View details for ${ticket.id}: ${escapeHtml(ticket.title)}">
          
          <div class="ticket-card-header">
            <span class="ticket-id-badge">${ticket.id}</span>
            <div class="ticket-meta-badges">
              <span class="badge ${priorityClass}">
                <span class="badge-dot"></span>
                ${ticket.priority}
              </span>
              <span class="badge ${statusClass}">
                ${ticket.status}
              </span>
            </div>
          </div>

          <div>
            <div style="font-size: 0.725rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 0.2rem;">
              ${escapeHtml(ticket.category)}
            </div>
            <h3 class="ticket-title">${escapeHtml(ticket.title)}</h3>
            <p class="ticket-desc-preview">${escapeHtml(ticket.description)}</p>
          </div>

          ${ticket.tags && ticket.tags.length > 0 ? `
            <div class="ticket-tags">
              ${ticket.tags.map(tag => `<span class="tag-pill">#${escapeHtml(tag)}</span>`).join('')}
            </div>
          ` : ''}

          <div class="ticket-footer">
            <div class="requester-badge" title="Submitted by ${escapeHtml(ticket.requester ? ticket.requester.name : 'Unknown')}">
              <span class="avatar-tiny">👤</span>
              <span>${escapeHtml(ticket.requester ? ticket.requester.name : 'Unknown')}</span>
            </div>

            <div class="ticket-counts">
              ${ticket.assignedTo ? `
                <span style="font-size: 0.725rem; color: #a5b4fc;" title="Assigned to ${escapeHtml(ticket.assignedTo.name)}">
                  👨‍💻 ${escapeHtml(ticket.assignedTo.name)}
                </span>
              ` : `
                <span style="font-size: 0.725rem; color: var(--text-muted);">Unassigned</span>
              `}

              <span title="${visibleResponses.length} total responses${internalCount > 0 && canViewInternal ? ` (${internalCount} internal notes)` : ''}">
                💬 ${visibleResponses.length}
                ${internalCount > 0 && canViewInternal ? `<span style="color:#fbbf24;" title="${internalCount} internal staff notes">🔒</span>` : ''}
              </span>

              <span>${dateStr}</span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach click handlers to cards
    document.querySelectorAll('.ticket-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-ticket-id');
        openTicketDetailModal(id);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const id = card.getAttribute('data-ticket-id');
          openTicketDetailModal(id);
        }
      });
    });
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case window.TicketStatus.OPEN: return 'badge-status-open';
      case window.TicketStatus.IN_PROGRESS: return 'badge-status-progress';
      case window.TicketStatus.PENDING_INFO: return 'badge-status-pending';
      case window.TicketStatus.RESOLVED: return 'badge-status-resolved';
      case window.TicketStatus.CLOSED: return 'badge-status-closed';
      default: return 'badge-status-open';
    }
  }

  // ==========================================================================
  // TICKET DETAIL MODAL, WORKFLOW DECISIONS & REPLIES
  // ==========================================================================

  function openTicketDetailModal(ticketId) {
    state.selectedTicketId = ticketId;
    loadTicketDetails(ticketId);
    showModal(modalDetail);
  }

  function loadTicketDetails(ticketId) {
    const ticket = window.TicketService.getTicketById(ticketId);
    if (!ticket) {
      showToast(`Ticket ${ticketId} could not be loaded`, 'error');
      closeModal(modalDetail);
      return;
    }

    const currentUser = window.AuthService.getCurrentUser();
    const canEditStatus = window.AuthService.hasPermission(window.Permissions.EDIT_STATUS, true);
    const canEditPriority = window.AuthService.hasPermission(window.Permissions.EDIT_PRIORITY, true);
    const canAssign = window.AuthService.hasPermission(window.Permissions.ASSIGN_TICKET, true);
    const canDelete = window.AuthService.hasPermission(window.Permissions.DELETE_TICKET, true);
    const canPostInternal = window.AuthService.hasPermission(window.Permissions.POST_INTERNAL_NOTE, true);
    const canViewInternal = window.AuthService.hasPermission(window.Permissions.VIEW_INTERNAL_NOTES, true);

    // Populate Hero Details
    detailTicketId.textContent = ticket.id;
    detailTicketTitle.textContent = ticket.title;
    detailTicketDesc.textContent = ticket.description;

    detailTicketPriority.className = `badge badge-priority-${ticket.priority.toLowerCase()}`;
    detailTicketPriority.innerHTML = `<span class="badge-dot"></span>${ticket.priority}`;

    detailTicketStatus.className = `badge ${getStatusBadgeClass(ticket.status)}`;
    detailTicketStatus.textContent = ticket.status;

    detailPropCategory.textContent = ticket.category;
    detailPropRequester.textContent = ticket.requester ? `${ticket.requester.name} (${ticket.requester.department})` : 'Unknown';
    detailPropAssignee.textContent = ticket.assignedTo ? `${ticket.assignedTo.name} (${ticket.assignedTo.department})` : 'Unassigned';
    detailPropDate.textContent = new Date(ticket.createdAt).toLocaleString();

    // Workflow Controls Visibility & Guards
    if (canEditStatus || canEditPriority || canAssign) {
      requesterWorkflowNotice.style.display = 'none';
      staffWorkflowControls.style.display = 'flex';
      workflowReasonContainer.style.display = 'flex';
      workflowPermissionBadge.textContent = `${currentUser.role} Workflow Authorized`;
      workflowPermissionBadge.style.color = '#34d399';

      workflowStatusSelect.value = ticket.status;
      workflowPrioritySelect.value = ticket.priority;

      // Populate Assignee options
      const staffUsers = window.AuthService.getAllDemoUsers().filter(u => u.role !== window.UserRoles.USER);
      workflowAssigneeSelect.innerHTML = `
        <option value="">Assign To...</option>
        ${staffUsers.map(s => `
          <option value="${s.id}" ${ticket.assignedTo && ticket.assignedTo.id === s.id ? 'selected' : ''}>
            ${s.name} (${s.department})
          </option>
        `).join('')}
      `;

      btnAdminDeleteTicket.style.display = canDelete ? 'inline-flex' : 'none';
    } else {
      // User is Requester - workflow state modification is locked
      requesterWorkflowNotice.style.display = 'block';
      staffWorkflowControls.style.display = 'none';
      workflowReasonContainer.style.display = 'none';
      workflowPermissionBadge.textContent = 'Read-Only (Requester Role)';
      workflowPermissionBadge.style.color = '#fbbf24';
    }

    // Reply Composer Guard (Internal Note disabled for requesters)
    if (canPostInternal) {
      btnReplyModeInternal.classList.remove('disabled');
      btnReplyModeInternal.removeAttribute('disabled');
      btnReplyModeInternal.title = 'Staff-only note (hidden from requester)';
    } else {
      btnReplyModeInternal.classList.add('disabled');
      btnReplyModeInternal.title = 'Internal notes require Staff or Admin role';
      setReplyMode('public');
    }

    // Render Responses Thread
    renderResponses(ticket, canViewInternal);

    // Render Workflow Timeline
    renderTimeline(ticket);
  }

  function renderResponses(ticket, canViewInternal) {
    const responses = (ticket.responses || []).filter(r => canViewInternal || !r.isInternal);
    countResponsesBadge.textContent = responses.length;

    if (responses.length === 0) {
      ticketResponsesThread.innerHTML = `
        <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.825rem;">
          No staff responses or comments recorded yet. Post a message below to start the conversation.
        </div>
      `;
      return;
    }

    ticketResponsesThread.innerHTML = responses.map(r => {
      const isInternal = Boolean(r.isInternal);
      const isStaff = r.author && (r.author.role === window.UserRoles.STAFF || r.author.role === window.UserRoles.ADMIN);

      return `
        <div class="response-bubble ${isInternal ? 'internal-staff-note' : ''}">
          <div class="response-header">
            <div class="response-author">
              <span>${isStaff ? '👨‍💻' : '👤'}</span>
              <span>${escapeHtml(r.author ? r.author.name : 'Unknown')}</span>
              <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: normal;">(${escapeHtml(r.author ? r.author.role : 'User')})</span>
              ${isInternal ? '<span class="internal-note-badge">🔒 Staff Internal Note</span>' : ''}
            </div>
            <span style="color: var(--text-muted); font-size: 0.725rem;">
              ${formatRelativeTime(r.timestamp)}
            </span>
          </div>
          <div class="response-content">${escapeHtml(r.message)}</div>
        </div>
      `;
    }).join('');
  }

  function renderTimeline(ticket) {
    const timeline = ticket.timeline || [];
    countTimelineBadge.textContent = timeline.length;

    ticketTimelineList.innerHTML = timeline.map(event => `
      <div class="timeline-node">
        <span class="timeline-dot"></span>
        <div class="timeline-title">${escapeHtml(event.summary)}</div>
        <div class="timeline-meta">
          <span>By <strong>${escapeHtml(event.actor)}</strong></span> &bull; 
          <span>${formatRelativeTime(event.timestamp)}</span>
        </div>
      </div>
    `).join('');
  }

  function setReplyMode(mode) {
    state.replyMode = mode;
    if (mode === 'internal') {
      btnReplyModeInternal.classList.add('active', 'internal-active');
      btnReplyModePublic.classList.remove('active');
      replyModeHelper.textContent = '🔒 Internal Note: Visible ONLY to Support Staff & System Admins. Requesters cannot see this.';
      replyModeHelper.style.color = '#fbbf24';
      replyMessageInput.placeholder = 'Add confidential technical notes, internal escalations, or root-cause notes...';
    } else {
      btnReplyModePublic.classList.add('active');
      btnReplyModeInternal.classList.remove('active', 'internal-active');
      replyModeHelper.textContent = 'Visible to the ticket requester and all support staff.';
      replyModeHelper.style.color = 'var(--text-muted)';
      replyMessageInput.placeholder = 'Write a public response, update, or troubleshooting instructions...';
    }
  }

  // ==========================================================================
  // AUDIT & SECURITY LOG CONSOLE (Prompt Requirement: Log Roles, Decisions, Errors, Permissions)
  // ==========================================================================

  function renderAuditLogs() {
    let logs = window.SystemLogger.getLogs();

    // Category filter
    if (state.activeLogCategory !== 'ALL') {
      logs = logs.filter(l => l.category === state.activeLogCategory);
    }

    // Level filter
    if (state.activeLogLevel !== 'ALL') {
      logs = logs.filter(l => l.level === state.activeLogLevel);
    }

    // Search query
    if (state.logSearchQuery.trim()) {
      const q = state.logSearchQuery.toLowerCase();
      logs = logs.filter(l => 
        l.action.toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q) ||
        (l.actor && l.actor.name.toLowerCase().includes(q)) ||
        JSON.stringify(l.metadata).toLowerCase().includes(q)
      );
    }

    if (logs.length === 0) {
      logsListContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem;">
          No audit records found matching the active category or filter.
        </div>
      `;
      return;
    }

    logsListContainer.innerHTML = logs.map(entry => {
      const catClass = getLogCatClass(entry.category);
      const pillCat = getLogPillCat(entry.category);
      const levelClass = getLogLevelClass(entry.level);
      const timeStr = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      return `
        <div class="log-entry-row ${catClass}">
          <div class="log-header-line">
            <div class="log-badges">
              <span class="log-cat-pill ${pillCat}">${entry.category.replace('_', ' ')}</span>
              <span class="log-level-pill ${levelClass}">${entry.level}</span>
              <strong style="color: #cbd5e1; font-size: 0.8rem;">${entry.action}</strong>
            </div>
            <span style="color: var(--text-muted); font-size: 0.7rem;">${timeStr}</span>
          </div>

          <div class="log-message">${escapeHtml(entry.message)}</div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.2rem;">
            <span class="log-actor-tag">
              Actor: <strong>${escapeHtml(entry.actor ? entry.actor.name : 'System')}</strong> 
              [${escapeHtml(entry.actor ? entry.actor.role : '-')}]
            </span>

            <button class="log-json-toggle" type="button" data-log-id="${entry.id}">
              Inspect Payload
            </button>
          </div>

          <pre class="log-json-viewer" id="json-viewer-${entry.id}"><code>${escapeHtml(JSON.stringify(entry, null, 2))}</code></pre>
        </div>
      `;
    }).join('');

    // Attach inspect listeners
    document.querySelectorAll('.log-json-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-log-id');
        const viewer = document.getElementById(`json-viewer-${id}`);
        if (viewer) {
          const isAct = viewer.classList.toggle('active');
          btn.textContent = isAct ? 'Hide Payload' : 'Inspect Payload';
        }
      });
    });
  }

  function getLogCatClass(cat) {
    switch (cat) {
      case window.LogCategory.USER_ROLE: return 'cat-user-role';
      case window.LogCategory.WORKFLOW_DECISION: return 'cat-workflow';
      case window.LogCategory.ERROR_HANDLING: return 'cat-error';
      case window.LogCategory.PERMISSION: return 'cat-permission';
      default: return '';
    }
  }

  function getLogPillCat(cat) {
    switch (cat) {
      case window.LogCategory.USER_ROLE: return 'log-pill-user';
      case window.LogCategory.WORKFLOW_DECISION: return 'log-pill-workflow';
      case window.LogCategory.ERROR_HANDLING: return 'log-pill-error';
      case window.LogCategory.PERMISSION: return 'log-pill-permission';
      default: return '';
    }
  }

  function getLogLevelClass(level) {
    switch (level) {
      case window.LogLevel.INFO: return 'level-info';
      case window.LogLevel.WARN: return 'level-warn';
      case window.LogLevel.ERROR: return 'level-error';
      case window.LogLevel.CRITICAL: return 'level-critical';
      default: return 'level-info';
    }
  }

  // ==========================================================================
  // EVENT LISTENERS & ACTION HANDLERS
  // ==========================================================================

  // --- Modal Navigation ---
  btnOpenCreate.addEventListener('click', () => {
    createValidationAlert.style.display = 'none';
    formCreateTicket.reset();
    showModal(modalCreate);
    inputTicketTitle.focus();
  });
  btnCloseCreate.addEventListener('click', () => closeModal(modalCreate));
  btnCancelCreate.addEventListener('click', () => closeModal(modalCreate));
  btnEmptyCreate.addEventListener('click', () => {
    formCreateTicket.reset();
    showModal(modalCreate);
  });

  btnCloseDetail.addEventListener('click', () => closeModal(modalDetail));
  btnCloseDetailFooter.addEventListener('click', () => closeModal(modalDetail));

  btnOpenLogs.addEventListener('click', () => {
    renderAuditLogs();
    showModal(modalAuditLogs);
  });
  btnCloseLogs.addEventListener('click', () => closeModal(modalAuditLogs));
  btnCloseLogsFooter.addEventListener('click', () => closeModal(modalAuditLogs));

  btnOpenTools.addEventListener('click', () => showModal(modalTools));
  btnCloseTools.addEventListener('click', () => closeModal(modalTools));
  btnCloseToolsFooter.addEventListener('click', () => closeModal(modalTools));

  // Close modals on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // Escape key closes open modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(closeModal);
    }
  });

  // --- New Ticket Form Submission ---
  formCreateTicket.addEventListener('submit', (e) => {
    e.preventDefault();
    createValidationAlert.style.display = 'none';

    const title = inputTicketTitle.value;
    const category = selectTicketCategory.value;
    const priority = selectTicketPriority.value;
    const description = inputTicketDesc.value;
    const tags = inputTicketTags.value.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const created = window.TicketService.createTicket({
        title,
        category,
        priority,
        description,
        tags
      });

      showToast(`Ticket ${created.id} submitted successfully!`, 'success');
      closeModal(modalCreate);
      renderTickets();
    } catch (err) {
      createValidationAlert.textContent = err.message;
      createValidationAlert.style.display = 'block';
      showToast(`Validation Error: ${err.message}`, 'error');
    }
  });

  // --- Workflow Actions: Status, Priority, Assignee ---
  btnApplyStatus.addEventListener('click', () => {
    if (!state.selectedTicketId) return;
    const newStatus = workflowStatusSelect.value;
    const reason = workflowDecisionReason.value.trim();

    try {
      window.TicketService.updateStatus(state.selectedTicketId, newStatus, reason);
      showToast(`Status updated to "${newStatus}"`, 'success');
      workflowDecisionReason.value = '';
      loadTicketDetails(state.selectedTicketId);
      renderTickets();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  btnApplyPriority.addEventListener('click', () => {
    if (!state.selectedTicketId) return;
    const newPriority = workflowPrioritySelect.value;
    const reason = workflowDecisionReason.value.trim();

    try {
      window.TicketService.updatePriority(state.selectedTicketId, newPriority, reason);
      showToast(`Priority adjusted to "${newPriority}"`, 'success');
      workflowDecisionReason.value = '';
      loadTicketDetails(state.selectedTicketId);
      renderTickets();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  btnApplyAssignee.addEventListener('click', () => {
    if (!state.selectedTicketId) return;
    const assigneeId = workflowAssigneeSelect.value || null;

    try {
      window.TicketService.assignTicket(state.selectedTicketId, assigneeId);
      showToast('Specialist assignment updated', 'success');
      loadTicketDetails(state.selectedTicketId);
      renderTickets();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  btnAdminDeleteTicket.addEventListener('click', () => {
    if (!state.selectedTicketId) return;
    if (confirm(`Are you sure you want to permanently purge ticket ${state.selectedTicketId}? This decision is irreversible and will be logged.`)) {
      try {
        window.TicketService.deleteTicket(state.selectedTicketId);
        showToast(`Ticket ${state.selectedTicketId} deleted`, 'warning');
        closeModal(modalDetail);
        renderTickets();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  });

  // Test permission denial button for Requester role
  btnTestPermissionDenial.addEventListener('click', () => {
    try {
      window.TicketService.updateStatus(state.selectedTicketId, window.TicketStatus.RESOLVED, 'Requester attempted bypass');
    } catch (err) {
      showToast(`Guard Triggered: ${err.message}`, 'error');
      // Highlight audit log button
      logsCounterBadge.style.transform = 'scale(1.4)';
      setTimeout(() => logsCounterBadge.style.transform = 'scale(1)', 400);
    }
  });

  // --- Reply Composer Mode Switch ---
  btnReplyModePublic.addEventListener('click', () => setReplyMode('public'));
  btnReplyModeInternal.addEventListener('click', () => {
    if (window.AuthService.hasPermission(window.Permissions.POST_INTERNAL_NOTE)) {
      setReplyMode('internal');
    } else {
      showToast('Permission Denied: Only Staff and Admin can record internal notes', 'error');
    }
  });

  // Submit Response
  btnSubmitReply.addEventListener('click', () => {
    if (!state.selectedTicketId) return;
    const msg = replyMessageInput.value.trim();
    if (!msg) {
      showToast('Please enter a response message.', 'error');
      return;
    }

    try {
      window.TicketService.addResponse(state.selectedTicketId, {
        message: msg,
        isInternal: state.replyMode === 'internal'
      });

      showToast(state.replyMode === 'internal' ? 'Internal staff note recorded' : 'Response posted to ticket', 'success');
      replyMessageInput.value = '';
      loadTicketDetails(state.selectedTicketId);
      renderTickets();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // --- Detail Tabs ---
  tabBtnResponses.addEventListener('click', () => {
    tabBtnResponses.classList.add('active');
    tabBtnTimeline.classList.remove('active');
    tabContentResponses.style.display = 'block';
    tabContentTimeline.style.display = 'none';
  });

  tabBtnTimeline.addEventListener('click', () => {
    tabBtnTimeline.classList.add('active');
    tabBtnResponses.classList.remove('active');
    tabContentTimeline.style.display = 'block';
    tabContentResponses.style.display = 'none';
  });

  // --- Search, Filter & Sort Toolbar ---
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderTickets();
  });

  filterStatus.addEventListener('change', (e) => {
    state.filterStatus = e.target.value;
    renderTickets();
  });

  filterPriority.addEventListener('change', (e) => {
    state.filterPriority = e.target.value;
    renderTickets();
  });

  filterCategory.addEventListener('change', (e) => {
    state.filterCategory = e.target.value;
    renderTickets();
  });

  sortTicketsSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderTickets();
  });

  btnToggleMyTickets.addEventListener('click', () => {
    state.filterOnlyMyTickets = !state.filterOnlyMyTickets;
    btnToggleMyTickets.classList.toggle('btn-filter-active', state.filterOnlyMyTickets);
    renderTickets();
  });

  btnResetFilters.addEventListener('click', () => {
    state.searchQuery = '';
    state.filterStatus = 'ALL';
    state.filterPriority = 'ALL';
    state.filterCategory = 'ALL';
    state.filterOnlyMyTickets = false;
    state.sortBy = 'newest';

    searchInput.value = '';
    filterStatus.value = 'ALL';
    filterPriority.value = 'ALL';
    filterCategory.value = 'ALL';
    sortTicketsSelect.value = 'newest';
    btnToggleMyTickets.classList.remove('btn-filter-active');

    renderTickets();
    showToast('Filters reset to default view', 'info');
  });

  // KPI card click filters
  document.querySelectorAll('.metric-card').forEach(card => {
    card.addEventListener('click', () => {
      const filter = card.getAttribute('data-filter');
      const priority = card.getAttribute('data-priority');

      if (filter === 'all') {
        btnResetFilters.click();
      } else if (filter) {
        filterStatus.value = filter;
        state.filterStatus = filter;
        renderTickets();
      } else if (priority) {
        filterPriority.value = priority;
        state.filterPriority = priority;
        renderTickets();
      }
    });
  });

  // --- Audit Logs Toolbar & Simulator Tests ---
  logCategoryTabs.querySelectorAll('.cat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      logCategoryTabs.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeLogCategory = btn.getAttribute('data-category');
      renderAuditLogs();
    });
  });

  logFilterLevel.addEventListener('change', (e) => {
    state.activeLogLevel = e.target.value;
    renderAuditLogs();
  });

  logSearchInput.addEventListener('input', (e) => {
    state.logSearchQuery = e.target.value;
    renderAuditLogs();
  });

  // Simulator Test: Permission Denied
  btnSimPermission.addEventListener('click', () => {
    const cur = window.AuthService.getCurrentUser();
    window.SystemLogger.logPermission(
      'SIMULATED_PERMISSION_CHECK',
      false,
      `Simulated check: User "${cur.name}" requested restricted action "DELETE_SYSTEM_DATABASE"`,
      { attemptedAction: 'DELETE_SYSTEM_DATABASE', simulated: true }
    );
    showToast('Simulated Permission Denied event logged!', 'warning');
    renderAuditLogs();
  });

  // Simulator Test: Error Handling
  btnSimValidation.addEventListener('click', () => {
    window.SystemLogger.logError(
      'SIMULATED_ERROR_HANDLER',
      'Simulated validation exception: Mandatory parameter "resolution_code" missing during ticket transition.',
      { errorCode: 'ERR_VALIDATION_901', stack: 'Validator.validate(ticket) line 42' }
    );
    showToast('Simulated Error event logged!', 'error');
    renderAuditLogs();
  });

  // Clear Logs
  btnClearLogs.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear system audit logs?')) {
      window.SystemLogger.clearLogs();
      renderAuditLogs();
      showToast('Audit logs cleared', 'info');
    }
  });

  // Export Logs
  btnExportLogs.addEventListener('click', () => {
    const logs = window.SystemLogger.getLogs();
    downloadJsonFile(logs, `resolviq-audit-logs-${Date.now()}.json`);
    showToast('Audit logs exported to JSON file', 'success');
  });

  // --- System Tools: Reset, Backup & Restore ---
  btnResetSeedData.addEventListener('click', () => {
    if (confirm('Reset all tickets and audit logs to demonstration defaults?')) {
      window.StorageManager.resetToDefaults();
      renderTickets();
      updateAuditLogBadge();
      closeModal(modalTools);
      showToast('System reset to demonstration seed data', 'success');
    }
  });

  btnExportAllData.addEventListener('click', () => {
    const jsonStr = window.StorageManager.exportData();
    if (jsonStr) {
      downloadJsonFile(JSON.parse(jsonStr), `resolviq-full-backup-${Date.now()}.json`);
      showToast('Full system backup downloaded', 'success');
    }
  });

  btnTriggerImport.addEventListener('click', () => {
    inputImportFile.click();
  });

  inputImportFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = window.StorageManager.importData(event.target.result);
      if (result.success) {
        renderTickets();
        updateAuditLogBadge();
        closeModal(modalTools);
        showToast(`Successfully restored ${result.count} tickets from backup!`, 'success');
      } else {
        showToast(`Import Failed: ${result.error}`, 'error');
      }
    };
    reader.readAsText(file);
  });

  // ==========================================================================
  // UTILITY HELPERS
  // ==========================================================================

  function showModal(modalEl) {
    modalEl.classList.add('active');
  }

  function closeModal(modalEl) {
    modalEl.classList.remove('active');
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <span>${icons[type] || 'ℹ️'}</span>
      <span style="flex:1;">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function formatRelativeTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function downloadJsonFile(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Initial Boot
  initUserRoleSelect();
  renderTickets();
  updateAuditLogBadge();
});
