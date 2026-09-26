// =============================================================================
// Freelance Marketplace Application Controller (Table Ninjas - SVNIT CS203)
// =============================================================================

const API_BASE = '/api';

// Application State
const state = {
  currentTab: 'client-tab',
  activeUser: null,
  users: [],
  skills: [],
  clientJobs: [],
  clientContracts: [],
  freelancerJobs: [],
  freelancerContracts: [],
  freelancerProposals: [],
  disputes: []
};

// -----------------------------------------------------------------------------
// Initialization
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupModals();
  setupFilters();

  await loadSkills();
  await loadUsers();
  
  // Set default active tab
  switchTab('client-tab');
});

// -----------------------------------------------------------------------------
// Toast Notification Utility
// -----------------------------------------------------------------------------
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// -----------------------------------------------------------------------------
// Navigation & Sub-Tabs
// -----------------------------------------------------------------------------
function setupNavigation() {
  const navBtns = document.querySelectorAll('#main-nav .nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      switchTab(tabId);
    });
  });

  // Sub-tabs handling
  const subTabBtns = document.querySelectorAll('.sub-tab-btn');
  subTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.subtab;
      const parentPane = btn.closest('.tab-pane');
      
      parentPane.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
      parentPane.querySelectorAll('.sub-pane').forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

function switchTab(tabId) {
  state.currentTab = tabId;
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === tabId);
  });

  // Trigger data reload for active tab
  if (tabId === 'client-tab') loadClientPortal();
  else if (tabId === 'freelancer-tab') loadFreelancerHub();
  else if (tabId === 'admin-tab') loadAdminConsole();
  else if (tabId === 'analytics-tab') loadAnalyticsReports();
}

// -----------------------------------------------------------------------------
// Load Users & Skills Catalogs
// -----------------------------------------------------------------------------
async function loadSkills() {
  try {
    const res = await fetch(`${API_BASE}/skills`);
    state.skills = await res.json();
    
    // Populate skill dropdown in job filter
    const filterSkillSelect = document.getElementById('filter-skill');
    filterSkillSelect.innerHTML = '<option value="">All Skills</option>';
    
    // Populate skill checkboxes in post job modal
    const postJobSkillsContainer = document.getElementById('job-post-skills-container');
    postJobSkillsContainer.innerHTML = '';

    state.skills.forEach(skill => {
      filterSkillSelect.innerHTML += `<option value="${skill.skill_id}">${skill.skill_name} (${skill.category})</option>`;
      
      postJobSkillsContainer.innerHTML += `
        <label class="skill-checkbox-label">
          <input type="checkbox" name="skill_ids" value="${skill.skill_id}">
          <span>${skill.skill_name}</span>
        </label>
      `;
    });
  } catch (err) {
    showToast('Failed to load skills catalog', 'error');
  }
}

async function loadUsers() {
  try {
    const res = await fetch(`${API_BASE}/users`);
    state.users = await res.json();

    const personaSelect = document.getElementById('persona-select');
    personaSelect.innerHTML = '';

    state.users.forEach(u => {
      const roleBadge = u.user_role === 'CLIENT' ? 'Client' : u.user_role === 'FREELANCER' ? 'Freelancer' : u.user_role === 'ADMIN' ? 'Admin' : 'Dual';
      personaSelect.innerHTML += `
        <option value="${u.user_id}">
          ${u.first_name} ${u.last_name} (${roleBadge}${u.company_name ? ' - ' + u.company_name : ''})
        </option>
      `;
    });

    // Default to Alice Johnson (Client #1)
    state.activeUser = state.users[0];
    personaSelect.value = state.activeUser.user_id;

    personaSelect.addEventListener('change', (e) => {
      const userId = parseInt(e.target.value, 10);
      state.activeUser = state.users.find(u => u.user_id === userId);
      showToast(`Switched persona to: ${state.activeUser.first_name} ${state.activeUser.last_name}`, 'info');

      // Auto-navigate to appropriate view based on persona role
      if (state.activeUser.user_role === 'FREELANCER') {
        switchTab('freelancer-tab');
      } else if (state.activeUser.user_role === 'ADMIN') {
        switchTab('admin-tab');
      } else {
        switchTab('client-tab');
      }
    });
  } catch (err) {
    showToast('Failed to load user directory', 'error');
  }
}

// -----------------------------------------------------------------------------
// CLIENT PORTAL LOGIC
// -----------------------------------------------------------------------------
async function loadClientPortal() {
  if (!state.activeUser) return;

  // Update client banner
  document.getElementById('client-banner-name').textContent = `${state.activeUser.first_name} ${state.activeUser.last_name}`;
  document.getElementById('client-banner-company').textContent = state.activeUser.company_name || 'Individual Client';
  document.getElementById('client-banner-spend').textContent = `$${parseFloat(state.activeUser.total_spent || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  document.getElementById('client-banner-jobs-count').textContent = state.activeUser.jobs_posted_count || 0;

  await loadClientJobs();
  await loadClientContracts();
}

async function loadClientJobs() {
  const tbody = document.getElementById('client-jobs-tbody');
  tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">Fetching jobs...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/jobs?client_id=${state.activeUser.user_id}`);
    state.clientJobs = await res.json();

    if (state.clientJobs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-dim">No job postings created yet. Click "Post New Job" above.</td></tr>';
      return;
    }

    tbody.innerHTML = state.clientJobs.map(j => {
      const statusBadge = j.job_status === 'OPEN' ? 'badge-success' : j.job_status === 'IN_PROGRESS' ? 'badge-primary' : 'badge-info';
      return `
        <tr>
          <td><strong>#${j.job_id}</strong></td>
          <td>
            <strong>${escapeHtml(j.title)}</strong><br>
            <small class="text-dim">${j.required_skills ? 'Skills: ' + escapeHtml(j.required_skills) : 'General'}</small>
          </td>
          <td><span class="badge badge-accent">${escapeHtml(j.category)}</span></td>
          <td><strong>$${parseFloat(j.budget).toLocaleString()}</strong></td>
          <td><span class="badge ${statusBadge}">${j.job_status}</span></td>
          <td>
            <span class="badge ${j.proposal_count > 0 ? 'badge-warning' : 'badge-secondary'}">
              ${j.proposal_count} Bids
            </span>
          </td>
          <td><small>${formatDate(j.deadline)}</small></td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-sm btn-primary" onclick="openViewProposalsModal(${j.job_id})">
                Inspect Bids (${j.proposal_count})
              </button>
              ${j.job_status === 'OPEN' && j.proposal_count === 0 ? `
                <button class="btn btn-sm btn-danger" onclick="deleteJob(${j.job_id})">Delete</button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger">Error: ${err.message}</td></tr>`;
  }
}

async function loadClientContracts() {
  const container = document.getElementById('client-contracts-container');
  container.innerHTML = '<p class="text-center py-4">Fetching active engagements...</p>';

  try {
    const res = await fetch(`${API_BASE}/contracts?client_id=${state.activeUser.user_id}`);
    state.clientContracts = await res.json();

    document.getElementById('client-banner-contracts-count').textContent = state.clientContracts.filter(c => c.contract_status === 'ACTIVE').length;

    if (state.clientContracts.length === 0) {
      container.innerHTML = '<p class="text-center py-4 text-dim">No active or completed contracts found.</p>';
      return;
    }

    // Fetch full details for each contract including milestones
    const detailedContracts = await Promise.all(state.clientContracts.map(async c => {
      const detailRes = await fetch(`${API_BASE}/contracts/${c.contract_id}`);
      return await detailRes.json();
    }));

    container.innerHTML = detailedContracts.map(c => {
      const statusBadge = c.contract_status === 'ACTIVE' ? 'badge-primary' : 'badge-success';
      const allApproved = c.milestones && c.milestones.length > 0 && c.milestones.every(m => m.milestone_status === 'APPROVED');
      const hasReviewed = c.reviews && c.reviews.some(r => r.reviewer_id === state.activeUser.user_id);

      return `
        <div class="contract-item">
          <div class="contract-header">
            <div>
              <span class="badge ${statusBadge}">${c.contract_status}</span>
              <h4 class="contract-title">Contract #${c.contract_id}: ${escapeHtml(c.job_title)}</h4>
              <p class="contract-parties">
                Freelancer: <strong>${escapeHtml(c.freelancer_name)}</strong> (${escapeHtml(c.professional_title)}) &bull; Agreed Price: <strong>$${parseFloat(c.agreed_amount).toLocaleString()}</strong>
              </p>
            </div>
            <div style="display:flex; gap:8px;">
              ${c.contract_status === 'ACTIVE' && allApproved ? `
                <button class="btn btn-sm btn-success" onclick="markContractCompleted(${c.contract_id})">
                  Mark Contract Complete
                </button>
              ` : ''}
              ${c.contract_status === 'COMPLETED' && !hasReviewed ? `
                <button class="btn btn-sm btn-primary" onclick="openReviewModal(${c.contract_id}, ${c.freelancer_id}, '${escapeHtml(c.freelancer_name)}', '${escapeHtml(c.job_title)}')">
                  ⭐ Leave Review
                </button>
              ` : hasReviewed ? `
                <span class="badge badge-success">Review Submitted</span>
              ` : ''}
            </div>
          </div>

          <!-- Milestones Breakdown -->
          <div class="milestones-timeline">
            <strong>Milestones & Escrow Disbursal:</strong>
            ${(c.milestones || []).map(m => {
              const mStatusBadge = m.milestone_status === 'APPROVED' ? 'badge-success' : m.milestone_status === 'IN_REVIEW' ? 'badge-warning' : m.milestone_status === 'FUNDED' ? 'badge-primary' : 'badge-secondary';
              return `
                <div class="milestone-row status-${m.milestone_status}">
                  <div class="milestone-meta">
                    <span class="badge ${mStatusBadge}">${m.milestone_status}</span>
                    <div>
                      <strong>#${m.milestone_seq_no} - ${escapeHtml(m.title)}</strong>
                      <div class="text-dim" style="font-size:12px;">${escapeHtml(m.deliverable_description)}</div>
                      ${m.submission_notes ? `<div class="text-accent" style="font-size:12px; margin-top:4px;">Submission: ${escapeHtml(m.submission_notes)}</div>` : ''}
                    </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:12px;">
                    <span class="milestone-amount">$${parseFloat(m.amount).toLocaleString()}</span>
                    ${m.milestone_status === 'IN_REVIEW' || m.milestone_status === 'FUNDED' ? `
                      <button class="btn btn-sm btn-success" onclick="approveMilestone(${c.contract_id}, ${m.milestone_seq_no})">
                        Approve & Release Payment
                      </button>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-center py-4 text-danger">Error: ${err.message}</p>`;
  }
}

// -----------------------------------------------------------------------------
// FREELANCER WORKPLACE LOGIC
// -----------------------------------------------------------------------------
async function loadFreelancerHub() {
  if (!state.activeUser) return;

  // Update Freelancer Banner
  const avatarText = (state.activeUser.first_name[0] || 'F') + (state.activeUser.last_name[0] || 'K');
  document.getElementById('freelancer-banner-avatar').textContent = avatarText;
  document.getElementById('freelancer-banner-name').textContent = `${state.activeUser.first_name} ${state.activeUser.last_name}`;
  document.getElementById('freelancer-banner-title').textContent = state.activeUser.professional_title || 'Independent Professional';
  document.getElementById('freelancer-banner-rate').textContent = `$${parseFloat(state.activeUser.hourly_rate || 50).toFixed(2)}/hr`;
  document.getElementById('freelancer-banner-rating').textContent = `⭐ ${parseFloat(state.activeUser.average_rating || 5.0).toFixed(2)} Rating`;
  document.getElementById('freelancer-banner-completed').textContent = `${state.activeUser.jobs_completed_count || 0} Jobs Completed`;
  document.getElementById('freelancer-banner-earnings').textContent = `$${parseFloat(state.activeUser.total_earnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  await searchFreelancerJobs();
  await loadFreelancerContracts();
  await loadFreelancerProposals();
}

async function searchFreelancerJobs() {
  const container = document.getElementById('freelancer-jobs-container');
  container.innerHTML = '<p class="text-center py-4">Searching open marketplace jobs...</p>';

  const search = document.getElementById('filter-search').value.trim();
  const skillId = document.getElementById('filter-skill').value;
  const category = document.getElementById('filter-category').value;
  const minBudget = document.getElementById('filter-min-budget').value;
  const maxBudget = document.getElementById('filter-max-budget').value;

  const params = new URLSearchParams({ job_status: 'OPEN' });
  if (search) params.append('search', search);
  if (skillId) params.append('skill_id', skillId);
  if (category) params.append('category', category);
  if (minBudget) params.append('min_budget', minBudget);
  if (maxBudget) params.append('max_budget', maxBudget);

  try {
    const res = await fetch(`${API_BASE}/jobs?${params.toString()}`);
    state.freelancerJobs = await res.json();

    if (state.freelancerJobs.length === 0) {
      container.innerHTML = '<p class="text-center py-4 text-dim">No open jobs match your current search filters.</p>';
      return;
    }

    container.innerHTML = state.freelancerJobs.map(j => {
      const skillsArray = (j.required_skills || '').split(',').map(s => s.trim()).filter(Boolean);
      return `
        <div class="job-card glass">
          <div>
            <div class="job-card-header">
              <h4 class="job-card-title">${escapeHtml(j.title)}</h4>
              <span class="job-card-budget">$${parseFloat(j.budget).toLocaleString()}</span>
            </div>
            <p class="job-card-client">
              Posted by <strong>${escapeHtml(j.company_name || j.client_name)}</strong> &bull; <span class="badge badge-accent">${escapeHtml(j.category)}</span>
            </p>
            <p class="job-card-desc">${escapeHtml(j.description)}</p>
            <div class="job-card-skills">
              ${skillsArray.map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}
            </div>
          </div>
          <div class="job-card-footer">
            <span>Deadline: ${formatDate(j.deadline)} (${j.duration_days} days)</span>
            <button class="btn btn-sm btn-primary" onclick="openSubmitProposalModal(${j.job_id}, '${escapeHtml(j.title)}', '${escapeHtml(j.company_name || j.client_name)}', ${j.budget})">
              Submit Bid
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-center py-4 text-danger">Error: ${err.message}</p>`;
  }
}

async function loadFreelancerContracts() {
  const container = document.getElementById('freelancer-contracts-container');
  container.innerHTML = '<p class="text-center py-4">Fetching your active projects...</p>';

  try {
    const res = await fetch(`${API_BASE}/contracts?freelancer_id=${state.activeUser.user_id}`);
    state.freelancerContracts = await res.json();

    if (state.freelancerContracts.length === 0) {
      container.innerHTML = '<p class="text-center py-4 text-dim">You currently have no active project contracts.</p>';
      return;
    }

    const detailedContracts = await Promise.all(state.freelancerContracts.map(async c => {
      const detailRes = await fetch(`${API_BASE}/contracts/${c.contract_id}`);
      return await detailRes.json();
    }));

    container.innerHTML = detailedContracts.map(c => {
      const statusBadge = c.contract_status === 'ACTIVE' ? 'badge-primary' : 'badge-success';
      return `
        <div class="contract-item">
          <div class="contract-header">
            <div>
              <span class="badge ${statusBadge}">${c.contract_status}</span>
              <h4 class="contract-title">Contract #${c.contract_id}: ${escapeHtml(c.job_title)}</h4>
              <p class="contract-parties">
                Client: <strong>${escapeHtml(c.company_name || c.client_name)}</strong> &bull; Value: <strong>$${parseFloat(c.agreed_amount).toLocaleString()}</strong>
              </p>
            </div>
          </div>

          <div class="milestones-timeline">
            <strong>Project Deliverables Timeline:</strong>
            ${(c.milestones || []).map(m => {
              const mStatusBadge = m.milestone_status === 'APPROVED' ? 'badge-success' : m.milestone_status === 'IN_REVIEW' ? 'badge-warning' : m.milestone_status === 'FUNDED' ? 'badge-primary' : 'badge-secondary';
              return `
                <div class="milestone-row status-${m.milestone_status}">
                  <div class="milestone-meta">
                    <span class="badge ${mStatusBadge}">${m.milestone_status}</span>
                    <div>
                      <strong>#${m.milestone_seq_no} - ${escapeHtml(m.title)}</strong>
                      <div class="text-dim" style="font-size:12px;">Due: ${formatDate(m.due_date)} &bull; ${escapeHtml(m.deliverable_description)}</div>
                      ${m.submission_notes ? `<div class="text-success" style="font-size:12px; margin-top:4px;">Submitted: ${escapeHtml(m.submission_notes)}</div>` : ''}
                    </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:12px;">
                    <span class="milestone-amount">$${parseFloat(m.amount).toLocaleString()}</span>
                    ${m.milestone_status === 'FUNDED' || m.milestone_status === 'PENDING' ? `
                      <button class="btn btn-sm btn-primary" onclick="openSubmitMilestoneModal(${c.contract_id}, ${m.milestone_seq_no}, '${escapeHtml(m.title)}', ${m.amount}, '${formatDate(m.due_date)}')">
                        Submit Work
                      </button>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-center py-4 text-danger">Error: ${err.message}</p>`;
  }
}

async function loadFreelancerProposals() {
  const tbody = document.getElementById('freelancer-proposals-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Fetching bids...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/proposals?freelancer_id=${state.activeUser.user_id}`);
    state.freelancerProposals = await res.json();

    if (state.freelancerProposals.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-dim">You have not submitted any proposals yet.</td></tr>';
      return;
    }

    tbody.innerHTML = state.freelancerProposals.map(p => {
      const statusBadge = p.proposal_status === 'ACCEPTED' ? 'badge-success' : p.proposal_status === 'REJECTED' ? 'badge-danger' : 'badge-warning';
      return `
        <tr>
          <td><strong>${escapeHtml(p.job_title)}</strong></td>
          <td>${escapeHtml(p.company_name || p.client_name)}</td>
          <td><strong>$${parseFloat(p.bid_amount).toLocaleString()}</strong></td>
          <td>${p.estimated_delivery_days} days</td>
          <td><span class="badge ${statusBadge}">${p.proposal_status}</span></td>
          <td><small>${formatDate(p.submitted_at)}</small></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Error: ${err.message}</td></tr>`;
  }
}

// -----------------------------------------------------------------------------
// ADMIN CONSOLE LOGIC
// -----------------------------------------------------------------------------
async function loadAdminConsole() {
  try {
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    const counts = healthData.counts || {};

    document.getElementById('admin-stat-users').textContent = counts.total_users || 0;
    document.getElementById('admin-stat-jobs').textContent = counts.total_jobs || 0;
    document.getElementById('admin-stat-contracts').textContent = counts.total_contracts || 0;
    document.getElementById('admin-stat-disputes').textContent = counts.open_disputes || 0;

    // Load Disputes
    const disputesRes = await fetch(`${API_BASE}/disputes`);
    state.disputes = await disputesRes.json();
    const disputesTbody = document.getElementById('disputes-tbody');

    if (state.disputes.length === 0) {
      disputesTbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-dim">No disputes on file.</td></tr>';
    } else {
      disputesTbody.innerHTML = state.disputes.map(d => {
        const isResolved = d.dispute_status === 'RESOLVED';
        return `
          <tr>
            <td><strong>#${d.dispute_id}</strong></td>
            <td>Contract #${d.contract_id} (${escapeHtml(d.job_title)})</td>
            <td>${escapeHtml(d.raised_by_name)}</td>
            <td style="max-width:280px;">${escapeHtml(d.reason)}</td>
            <td>
              <span class="badge ${isResolved ? 'badge-success' : 'badge-danger'}">${d.dispute_status}</span>
            </td>
            <td>
              ${d.resolution_type ? `<span class="badge badge-accent">${d.resolution_type}</span>` : '<span class="text-dim">Pending</span>'}
            </td>
            <td>
              ${!isResolved ? `
                <div style="display:flex; gap:6px;">
                  <button class="btn btn-sm btn-success" onclick="resolveDispute(${d.dispute_id}, 'PAYOUT_FREELANCER')">
                    Payout Freelancer
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="resolveDispute(${d.dispute_id}, 'REFUND_CLIENT')">
                    Refund Client
                  </button>
                </div>
              ` : `<small class="text-dim">Resolved by ${escapeHtml(d.resolved_by_name || 'Admin')}</small>`}
            </td>
          </tr>
        `;
      }).join('');
    }

    // Load Users Directory
    const usersTbody = document.getElementById('admin-users-tbody');
    usersTbody.innerHTML = state.users.map(u => `
      <tr>
        <td><strong>#${u.user_id}</strong></td>
        <td><strong>${escapeHtml(u.first_name + ' ' + u.last_name)}</strong></td>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="badge badge-primary">${u.user_role}</span></td>
        <td><span class="badge badge-success">${u.account_status}</span></td>
        <td>${escapeHtml(u.company_name || u.professional_title || '-')}</td>
        <td>
          ${u.total_spent ? 'Spent: $' + parseFloat(u.total_spent).toLocaleString() : ''}
          ${u.total_earnings ? 'Earned: $' + parseFloat(u.total_earnings).toLocaleString() : ''}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Failed to load administration data', 'error');
  }
}

// -----------------------------------------------------------------------------
// ANALYTICS & COMPLEX SQL REPORTING LOGIC
// -----------------------------------------------------------------------------
async function loadAnalyticsReports() {
  const fTbody = document.getElementById('report-freelancers-tbody');
  const cTbody = document.getElementById('report-clients-tbody');

  fTbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">Executing aggregation query...</td></tr>';
  cTbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Executing aggregation query...</td></tr>';

  try {
    // 1. Top Freelancers
    const fRes = await fetch(`${API_BASE}/reports/top-freelancers`);
    const topFreelancers = await fRes.json();

    fTbody.innerHTML = topFreelancers.map((f, i) => `
      <tr>
        <td><strong>#${i + 1}</strong></td>
        <td><strong>${escapeHtml(f.freelancer_name)}</strong><br><small class="text-dim">${escapeHtml(f.email)}</small></td>
        <td>${escapeHtml(f.professional_title)}</td>
        <td><span class="badge badge-success">⭐ ${parseFloat(f.average_rating).toFixed(2)}</span></td>
        <td>${f.reviews_count} Reviews</td>
        <td>${f.jobs_completed_count} Contracts</td>
        <td><strong class="text-success">$${parseFloat(f.total_earnings).toLocaleString()}</strong></td>
        <td><small>${escapeHtml(f.top_skills || 'None')}</small></td>
      </tr>
    `).join('');

    // 2. Client Enterprise Summary
    const cRes = await fetch(`${API_BASE}/reports/client-summary`);
    const clientsSummary = await cRes.json();

    cTbody.innerHTML = clientsSummary.map(c => `
      <tr>
        <td><strong>${escapeHtml(c.company_name || 'Individual')}</strong></td>
        <td>${escapeHtml(c.contact_person)}</td>
        <td>${escapeHtml(c.city ? c.city + ', ' + c.country : 'Remote')}</td>
        <td>${c.jobs_posted_count}</td>
        <td>${c.total_contracts_awarded}</td>
        <td><span class="badge badge-primary">${c.active_contracts}</span></td>
        <td><strong class="text-success">$${parseFloat(c.total_spent).toLocaleString()}</strong></td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Failed to execute analytical queries', 'error');
  }
}

// -----------------------------------------------------------------------------
// MODALS & ACTIONS
// -----------------------------------------------------------------------------
function setupModals() {
  // Close modals on clicking backdrop or close button
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('active');
    }
  });

  // Post Job Modal trigger
  document.getElementById('btn-open-post-job').addEventListener('click', () => {
    // Set default deadline 30 days from today
    const d = new Date();
    d.setDate(d.getDate() + 30);
    document.getElementById('job-post-deadline').value = d.toISOString().split('T')[0];
    document.getElementById('modal-post-job').classList.add('active');
  });

  // Post Job Form Submit
  document.getElementById('form-post-job').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('job-post-title').value.trim();
    const category = document.getElementById('job-post-category').value;
    const payment_type = document.getElementById('job-post-type').value;
    const budget = parseFloat(document.getElementById('job-post-budget').value);
    const duration_days = parseInt(document.getElementById('job-post-duration').value, 10);
    const deadline = document.getElementById('job-post-deadline').value;
    const description = document.getElementById('job-post-description').value.trim();

    const skill_ids = Array.from(document.querySelectorAll('#job-post-skills-container input:checked')).map(cb => parseInt(cb.value, 10));

    try {
      const res = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: state.activeUser.user_id,
          title, category, payment_type, budget, duration_days, deadline, description, skill_ids
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Requisition published successfully!', 'success');
      document.getElementById('modal-post-job').classList.remove('active');
      document.getElementById('form-post-job').reset();
      await loadClientPortal();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Submit Proposal Form Submit
  document.getElementById('form-submit-proposal').addEventListener('submit', async (e) => {
    e.preventDefault();
    const job_id = parseInt(document.getElementById('proposal-job-id').value, 10);
    const bid_amount = parseFloat(document.getElementById('proposal-bid-amount').value);
    const estimated_delivery_days = parseInt(document.getElementById('proposal-delivery-days').value, 10);
    const cover_letter = document.getElementById('proposal-cover-letter').value.trim();

    try {
      const res = await fetch(`${API_BASE}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id,
          freelancer_id: state.activeUser.user_id,
          bid_amount,
          estimated_delivery_days,
          cover_letter
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Proposal submitted successfully!', 'success');
      document.getElementById('modal-submit-proposal').classList.remove('active');
      document.getElementById('form-submit-proposal').reset();
      await loadFreelancerHub();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Submit Milestone Form Submit
  document.getElementById('form-submit-milestone').addEventListener('submit', async (e) => {
    e.preventDefault();
    const contract_id = document.getElementById('milestone-contract-id').value;
    const seq_no = document.getElementById('milestone-seq-no').value;
    const submission_notes = document.getElementById('milestone-notes').value.trim();

    try {
      const res = await fetch(`${API_BASE}/milestones/${contract_id}/${seq_no}/submit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_notes })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Milestone submitted to client for signoff!', 'success');
      document.getElementById('modal-submit-milestone').classList.remove('active');
      document.getElementById('form-submit-milestone').reset();
      await loadFreelancerContracts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Submit Review Form Submit
  document.getElementById('form-leave-review').addEventListener('submit', async (e) => {
    e.preventDefault();
    const contract_id = parseInt(document.getElementById('review-contract-id').value, 10);
    const reviewer_id = parseInt(document.getElementById('review-reviewer-id').value, 10);
    const reviewee_id = parseInt(document.getElementById('review-reviewee-id').value, 10);
    const overall_rating = parseInt(document.getElementById('review-overall-rating').value, 10);
    const communication_rating = parseInt(document.getElementById('review-communication').value, 10);
    const quality_rating = parseInt(document.getElementById('review-quality').value, 10);
    const adherence_rating = parseInt(document.getElementById('review-adherence').value, 10);
    const feedback_comment = document.getElementById('review-feedback').value.trim();

    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id, reviewer_id, reviewee_id,
          overall_rating, communication_rating, quality_rating, adherence_rating, feedback_comment
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Review published! Rating calculated automatically.', 'success');
      document.getElementById('modal-leave-review').classList.remove('active');
      document.getElementById('form-leave-review').reset();
      await loadClientContracts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// Global modal triggers
window.openSubmitProposalModal = function(jobId, title, clientName, budget) {
  document.getElementById('proposal-job-id').value = jobId;
  document.getElementById('proposal-modal-job-title').textContent = title;
  document.getElementById('proposal-modal-job-client').textContent = `Client: ${clientName} | Budget: $${parseFloat(budget).toLocaleString()}`;
  document.getElementById('proposal-bid-amount').value = budget;
  document.getElementById('modal-submit-proposal').classList.add('active');
};

window.openViewProposalsModal = async function(jobId) {
  const container = document.getElementById('proposals-list-container');
  container.innerHTML = '<p class="text-center py-4">Fetching submitted proposals...</p>';
  document.getElementById('modal-view-proposals').classList.add('active');

  try {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`);
    const job = await res.json();

    document.getElementById('proposals-modal-subtitle').textContent = `Proposals for: "${job.title}" (Allocated Budget: $${parseFloat(job.budget).toLocaleString()})`;

    if (!job.proposals || job.proposals.length === 0) {
      container.innerHTML = '<p class="text-center py-4 text-dim">No freelancers have submitted bids for this job yet.</p>';
      return;
    }

    container.innerHTML = job.proposals.map(p => {
      const isAccepted = p.proposal_status === 'ACCEPTED';
      const isRejected = p.proposal_status === 'REJECTED';
      return `
        <div class="card glass mb-3" style="border:1px solid var(--border-subtle);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div>
              <h4 style="font-size:17px; color:#fff;">${escapeHtml(p.freelancer_name)}</h4>
              <p class="text-dim" style="font-size:13px;">${escapeHtml(p.professional_title)} &bull; ⭐ ${parseFloat(p.average_rating).toFixed(2)} (${p.jobs_completed_count} completed)</p>
            </div>
            <div style="text-align:right;">
              <span class="text-success" style="font-size:22px; font-weight:800; font-family:var(--font-heading);">$${parseFloat(p.bid_amount).toLocaleString()}</span>
              <div class="text-dim" style="font-size:12px;">Estimated: ${p.estimated_delivery_days} days</div>
            </div>
          </div>
          <div style="background:rgba(0,0,0,0.2); padding:12px; border-radius:6px; font-size:13px; color:#cbd5e1; margin-bottom:14px;">
            ${escapeHtml(p.cover_letter)}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="badge ${isAccepted ? 'badge-success' : isRejected ? 'badge-danger' : 'badge-warning'}">Status: ${p.proposal_status}</span>
            ${job.job_status === 'OPEN' && p.proposal_status === 'SUBMITTED' ? `
              <button class="btn btn-sm btn-primary" onclick="awardContract(${p.proposal_id})">
                Award Binding Contract
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-center py-4 text-danger">Error: ${err.message}</p>`;
  }
};

window.awardContract = async function(proposalId) {
  if (!confirm('Are you sure you want to award this contract? Milestone 1 will be locked into simulated escrow.')) return;

  try {
    const res = await fetch(`${API_BASE}/contracts/award`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal_id: proposalId })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('Contract awarded and Phase 1 escrow locked!', 'success');
    document.getElementById('modal-view-proposals').classList.remove('active');
    await loadClientPortal();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.approveMilestone = async function(contractId, seqNo) {
  if (!confirm(`Confirm milestone #${seqNo} completion and release escrow payment to freelancer?`)) return;

  try {
    const res = await fetch(`${API_BASE}/milestones/${contractId}/${seqNo}/approve-pay`, {
      method: 'POST'
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('Milestone signed off and payment released!', 'success');
    await loadClientContracts();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.markContractCompleted = async function(contractId) {
  try {
    const res = await fetch(`${API_BASE}/contracts/${contractId}/complete`, {
      method: 'POST'
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('Contract marked as COMPLETED!', 'success');
    await loadClientContracts();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.openSubmitMilestoneModal = function(contractId, seqNo, title, amount, dueDate) {
  document.getElementById('milestone-contract-id').value = contractId;
  document.getElementById('milestone-seq-no').value = seqNo;
  document.getElementById('milestone-modal-title').textContent = `Milestone #${seqNo}: ${title}`;
  document.getElementById('milestone-modal-amount').textContent = `Allocation: $${parseFloat(amount).toLocaleString()} | Due: ${dueDate}`;
  document.getElementById('modal-submit-milestone').classList.add('active');
};

window.openReviewModal = function(contractId, revieweeId, targetName, contractTitle) {
  document.getElementById('review-contract-id').value = contractId;
  document.getElementById('review-reviewer-id').value = state.activeUser.user_id;
  document.getElementById('review-reviewee-id').value = revieweeId;
  document.getElementById('review-modal-target-name').textContent = `Reviewing: ${targetName}`;
  document.getElementById('review-modal-contract-title').textContent = `Engagement: ${contractTitle}`;
  document.getElementById('modal-leave-review').classList.add('active');
};

window.resolveDispute = async function(disputeId, resolutionType) {
  try {
    const res = await fetch(`${API_BASE}/disputes/${disputeId}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution_type: resolutionType, admin_id: state.activeUser.user_id })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(`Dispute resolved via ${resolutionType}!`, 'success');
    await loadAdminConsole();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.deleteJob = async function(jobId) {
  if (!confirm(`Are you sure you want to permanently delete Job #${jobId}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('Job removed successfully', 'success');
    await loadClientJobs();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// -----------------------------------------------------------------------------
// Filters & Search Setup
// -----------------------------------------------------------------------------
function setupFilters() {
  let debounceTimeout = null;
  const triggerSearch = () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchFreelancerJobs();
    }, 250);
  };

  ['filter-search', 'filter-skill', 'filter-category', 'filter-min-budget', 'filter-max-budget'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', triggerSearch);
      el.addEventListener('change', triggerSearch);
    }
  });

  document.getElementById('btn-reset-filters').addEventListener('click', () => {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-skill').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-min-budget').value = '';
    document.getElementById('filter-max-budget').value = '';
    searchFreelancerJobs();
  });

  // Refresh buttons
  const bindRefresh = (id, fn) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', fn);
  };
  bindRefresh('btn-refresh-client-jobs', loadClientJobs);
  bindRefresh('btn-refresh-client-contracts', loadClientContracts);
  bindRefresh('btn-refresh-freelancer-contracts', loadFreelancerContracts);
  bindRefresh('btn-refresh-freelancer-proposals', loadFreelancerProposals);
  bindRefresh('btn-refresh-admin', loadAdminConsole);
  bindRefresh('btn-refresh-analytics', loadAnalyticsReports);
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
