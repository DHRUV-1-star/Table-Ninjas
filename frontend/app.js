// =============================================================================
// Table Ninjas Marketplace Application Controller (SVNIT CS203)
// =============================================================================

const API_BASE = '/api';

const DEFAULT_USERS = [
  {
    user_id: 1,
    email: 'alice@techcorp.io',
    first_name: 'Alice',
    last_name: 'Johnson',
    phone: '+1-415-555-0101',
    user_role: 'CLIENT',
    account_status: 'ACTIVE',
    company_name: 'TechCorp Solutions Inc.',
    total_spent: 8500.00,
    jobs_posted_count: 3
  },
  {
    user_id: 2,
    email: 'bob@finstart.com',
    first_name: 'Bob',
    last_name: 'Smith',
    phone: '+1-212-555-0102',
    user_role: 'CLIENT',
    account_status: 'ACTIVE',
    company_name: 'FinStart Capital',
    total_spent: 12000.00,
    jobs_posted_count: 3
  },
  {
    user_id: 6,
    email: 'faisal@codecraft.dev',
    first_name: 'Faisal',
    last_name: 'Khan',
    phone: '+91-98765-43210',
    user_role: 'FREELANCER',
    account_status: 'ACTIVE',
    professional_title: 'Principal Full-Stack Engineer',
    hourly_rate: 65.00,
    average_rating: 4.95,
    jobs_completed_count: 14,
    total_earnings: 18500.00
  },
  {
    user_id: 7,
    email: 'grace@fullstack.io',
    first_name: 'Grace',
    last_name: 'Hopper',
    phone: '+1-650-555-0107',
    user_role: 'FREELANCER',
    account_status: 'ACTIVE',
    professional_title: 'Senior Python & Django Architect',
    hourly_rate: 75.00,
    average_rating: 4.88,
    jobs_completed_count: 9,
    total_earnings: 14200.00
  },
  {
    user_id: 13,
    email: 'mona@agencyprime.com',
    first_name: 'Mona',
    last_name: 'Lisa',
    phone: '+1-702-555-0113',
    user_role: 'DUAL',
    account_status: 'ACTIVE',
    company_name: 'Prime Digital Agency',
    professional_title: 'Growth Engineering Consultant',
    hourly_rate: 70.00,
    average_rating: 4.90,
    jobs_completed_count: 8,
    total_earnings: 9800.00,
    total_spent: 4500.00,
    jobs_posted_count: 2
  },
  {
    user_id: 14,
    email: 'admin@freelancemarket.com',
    first_name: 'Admin',
    last_name: 'Super',
    phone: '+1-800-555-0199',
    user_role: 'ADMIN',
    account_status: 'ACTIVE'
  }
];

const DEFAULT_SKILLS = [
  { skill_id: 1,  skill_name: 'React', category: 'Frontend Development' },
  { skill_id: 2,  skill_name: 'Node.js', category: 'Backend Development' },
  { skill_id: 3,  skill_name: 'Python', category: 'Software Development' },
  { skill_id: 4,  skill_name: 'Django', category: 'Backend Frameworks' },
  { skill_id: 5,  skill_name: 'MySQL', category: 'Database Management' },
  { skill_id: 6,  skill_name: 'PostgreSQL', category: 'Database Management' },
  { skill_id: 7,  skill_name: 'Docker', category: 'DevOps & Virtualization' },
  { skill_id: 8,  skill_name: 'Kubernetes', category: 'DevOps & Orchestration' },
  { skill_id: 9,  skill_name: 'AWS Cloud', category: 'Cloud Computing' },
  { skill_id: 10, skill_name: 'Figma UI/UX', category: 'UI/UX Design' },
  { skill_id: 11, skill_name: 'Flutter', category: 'Mobile Development' },
  { skill_id: 12, skill_name: 'TypeScript', category: 'Programming Languages' }
];

// Application State
const state = {
  isLoggedIn: false,
  activeUser: DEFAULT_USERS[0],
  activeRole: 'CLIENT', // 'CLIENT' | 'FREELANCER' | 'ADMIN'
  currentTab: 'client-tab',
  users: [...DEFAULT_USERS],
  skills: [...DEFAULT_SKILLS],
  clientJobs: [],
  clientContracts: [],
  freelancerJobs: [],
  freelancerContracts: [],
  freelancerProposals: [],
  disputes: []
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Initialization
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupModals();
  setupFilters();
  setupGlobalHeaderSearch();
  setupAuthAndRoleFlow();
  setupSignUpFlow();
  setupForgotAndResetPassword();
  setupPasswordToggles();
  setupTheme();

  await loadSkills();
  await loadUsers();

  // Show login page initially
  showPageView('view-login');
});

// -----------------------------------------------------------------------------
// Dark / Light Theme Manager
// -----------------------------------------------------------------------------
function setupTheme() {
  const savedTheme = localStorage.getItem('table_ninjas_theme') || 'dark';
  applyTheme(savedTheme, false);

  const toggleIds = [
    'login-theme-toggle',
    'signup-theme-toggle',
    'role-theme-toggle',
    'workspace-theme-toggle',
    'btn-dropdown-theme-toggle'
  ];

  toggleIds.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next, true);
      });
    }
  });
}

function applyTheme(theme, showToastNotification = false) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('table_ninjas_theme', theme);

  const isDark = theme === 'dark';

  const loginBtn = document.getElementById('login-theme-toggle');
  if (loginBtn) {
    const icon = loginBtn.querySelector('.theme-toggle-icon');
    const text = loginBtn.querySelector('.theme-toggle-text');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    if (text) text.textContent = isDark ? 'Light' : 'Dark';
    loginBtn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  }

  const signupBtn = document.getElementById('signup-theme-toggle');
  if (signupBtn) {
    const icon = signupBtn.querySelector('.theme-toggle-icon');
    const text = signupBtn.querySelector('.theme-toggle-text');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    if (text) text.textContent = isDark ? 'Light' : 'Dark';
    signupBtn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  }

  const roleBtn = document.getElementById('role-theme-toggle');
  if (roleBtn) {
    const icon = roleBtn.querySelector('.theme-toggle-icon');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    roleBtn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  }

  const workspaceBtn = document.getElementById('workspace-theme-toggle');
  if (workspaceBtn) {
    workspaceBtn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  }

  const dropdownIcon = document.getElementById('dropdown-theme-icon');
  const dropdownText = document.getElementById('dropdown-theme-text');
  if (dropdownIcon) dropdownIcon.textContent = isDark ? '☀️' : '🌙';
  if (dropdownText) dropdownText.textContent = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';

  if (showToastNotification) {
    showToast(isDark ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️', 'info');
  }
}

// -----------------------------------------------------------------------------
// Password Visibility Eye Toggle
// -----------------------------------------------------------------------------
function setupPasswordToggles() {
  document.querySelectorAll('.btn-toggle-eye').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.textContent = isPassword ? '🙈' : '👁️';
      btn.title = isPassword ? 'Hide password' : 'Show password';
    });
  });
}

// -----------------------------------------------------------------------------
// Page View Management (Login -> Signup -> Role Selection -> Main Workspace)
// -----------------------------------------------------------------------------
function showPageView(viewId) {
  document.querySelectorAll('.page-view').forEach(view => {
    view.classList.remove('active');
  });
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// -----------------------------------------------------------------------------
// User Identity & Name Display Helpers
// -----------------------------------------------------------------------------
function getUserDisplayName(user) {
  if (!user) return 'Guest';
  // 1. If username exists and is not empty, prioritize username
  if (user.username && typeof user.username === 'string' && user.username.trim()) {
    return user.username.trim();
  }
  // 2. Format from first_name and last_name (filtering out artificial 'Member')
  const f = (user.first_name || '').trim();
  const l = (user.last_name || '').trim();
  if (l && l.toLowerCase() !== 'member') {
    return f ? `${f} ${l}` : l;
  }
  if (f) return f;
  // 3. Fallback to email identifier or default
  if (user.email) return user.email.split('@')[0];
  return 'User';
}

function getUserInitials(user) {
  if (!user) return 'TN';
  if (user.username && typeof user.username === 'string' && user.username.trim()) {
    return user.username.trim().slice(0, 2).toUpperCase();
  }
  const f = (user.first_name || '').trim();
  const l = (user.last_name && user.last_name.toLowerCase() !== 'member') ? user.last_name.trim() : '';
  if (f && l) return (f[0] + l[0]).toUpperCase();
  if (f) return f.slice(0, 2).toUpperCase();
  if (user.email) return user.email.slice(0, 2).toUpperCase();
  return 'TN';
}

// -----------------------------------------------------------------------------
// Toast Notification Utility
// -----------------------------------------------------------------------------
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

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
// Authentication & Role Selection Flow
// -----------------------------------------------------------------------------
function setupAuthAndRoleFlow() {
  // 1. One-click demo persona chips in login box
  document.querySelectorAll('.demo-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const email = chip.dataset.email;
      const uname = email.split('@')[0];
      const emailInput = document.getElementById('login-email');
      if (emailInput) emailInput.value = email;
      const usernameInput = document.getElementById('login-username');
      if (usernameInput) usernameInput.value = uname;
      const pwInput = document.getElementById('login-password');
      if (pwInput) pwInput.value = 'password123';
      handleLogin(email, 'password123', null, uname);
    });
  });

  // 2. Login Form Submit with Username / Email & Password
  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username')?.value.trim() || '';
      const email = document.getElementById('login-email')?.value.trim() || '';
      const password = document.getElementById('login-password')?.value || '';
      if (!username && !email) {
        showToast('Please enter your username or registered email.', 'error');
        document.getElementById('login-username')?.focus();
        return;
      }
      handleLogin(email, password, null, username);
    });
  }

  // 3. Google Sign-In Modals & Accounts
  const googleBtn = document.getElementById('btn-social-google');
  const googleSignupBtn = document.getElementById('btn-signup-social-google');
  const googleModal = document.getElementById('modal-google-login');

  const openGoogleModal = (isSignUp = false) => {
    if (!googleModal) return;
    const titleEl = document.getElementById('google-modal-title');
    const demoAccounts = document.getElementById('google-oauth-demo-accounts');
    const demoIntro = document.getElementById('google-oauth-demo-intro');
    const divider = document.getElementById('google-oauth-divider');
    const submitBtn = document.getElementById('btn-submit-google-oauth');
    const emailInput = document.getElementById('custom-google-email');
    const pwInput = document.getElementById('custom-google-password');

    if (isSignUp) {
      if (titleEl) titleEl.textContent = 'Sign up with Google Account';
      if (demoAccounts) demoAccounts.style.display = 'none';
      if (demoIntro) demoIntro.style.display = 'none';
      if (divider) divider.style.display = 'none';
      if (submitBtn) submitBtn.textContent = 'Register with Google Account';
    } else {
      if (titleEl) titleEl.textContent = 'Sign in with Google';
      if (demoAccounts) demoAccounts.style.display = 'flex';
      if (demoIntro) demoIntro.style.display = 'block';
      if (divider) divider.style.display = 'flex';
      if (submitBtn) submitBtn.textContent = 'Sign in with Google Account';
    }
    if (emailInput) emailInput.value = '';
    if (pwInput) pwInput.value = '';
    googleModal.classList.add('active');
  };

  if (googleBtn) googleBtn.addEventListener('click', () => openGoogleModal(false));
  if (googleSignupBtn) googleSignupBtn.addEventListener('click', () => openGoogleModal(true));

  // Quick Google account cards selection (Only in login mode)
  document.querySelectorAll('#modal-google-login .oauth-account-card').forEach(card => {
    card.addEventListener('click', () => {
      const email = card.dataset.oauthEmail;
      const forcedRole = card.dataset.oauthRole;
      if (googleModal) googleModal.classList.remove('active');
      handleLogin(email, 'password123', forcedRole);
      showToast(`Signed in with Google as ${email}! 🌐`, 'success');
    });
  });

  // Custom Google account form submit
  const customGoogleForm = document.getElementById('form-custom-google-login');
  if (customGoogleForm) {
    customGoogleForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('custom-google-email').value.trim();
      const password = document.getElementById('custom-google-password').value;
      const role = document.getElementById('custom-google-role').value;
      if (googleModal) googleModal.classList.remove('active');
      handleLogin(email, password, role);
      showToast(`Connected with Google as ${email}! 🌐`, 'success');
    });
  }

  // 4. Apple ID Sign-In Modals
  const appleBtn = document.getElementById('btn-social-apple');
  const appleSignupBtn = document.getElementById('btn-signup-social-apple');
  const appleModal = document.getElementById('modal-apple-login');

  const openAppleModal = (isSignUp = false) => {
    if (!appleModal) return;
    const titleEl = document.getElementById('apple-modal-title');
    const submitBtn = document.getElementById('btn-submit-apple-oauth');
    const idInput = document.getElementById('apple-login-id');
    const pwInput = document.getElementById('apple-login-password');

    if (isSignUp) {
      if (titleEl) titleEl.textContent = 'Sign up with Apple ID';
      if (submitBtn) submitBtn.textContent = 'Register with Apple ID';
    } else {
      if (titleEl) titleEl.textContent = 'Sign in with Apple ID';
      if (submitBtn) submitBtn.textContent = 'Continue with Apple ID';
    }
    if (idInput) idInput.value = '';
    if (pwInput) pwInput.value = '';
    appleModal.classList.add('active');
  };

  if (appleBtn) appleBtn.addEventListener('click', () => openAppleModal(false));
  if (appleSignupBtn) appleSignupBtn.addEventListener('click', () => openAppleModal(true));

  const appleForm = document.getElementById('form-apple-login');
  if (appleForm) {
    appleForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const appleId = document.getElementById('apple-login-id').value.trim();
      const password = document.getElementById('apple-login-password').value;
      const role = document.getElementById('apple-login-role').value;
      if (appleModal) appleModal.classList.remove('active');
      handleLogin(appleId, password, role);
      showToast(`Signed in with Apple ID as ${appleId}! 🍎`, 'success');
    });
  }

  // 5. Switch between Login and Sign Up views
  const toSignupBtns = ['btn-quick-signup', 'link-create-account'];
  toSignupBtns.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        resetSignUpForm();
        showPageView('view-signup');
      });
    }
  });

  const toLoginBtns = ['btn-signup-header-login', 'link-signup-to-login', 'signup-brand-logo', 'login-brand-logo'];
  toLoginBtns.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        showPageView('view-login');
      });
    }
  });

  // 6. Role Selection Cards Interaction (When user manually navigates to role selection)
  let chosenRole = 'CLIENT';
  const clientCard = document.getElementById('card-role-client');
  const freelancerCard = document.getElementById('card-role-freelancer');
  const confirmBtn = document.getElementById('btn-confirm-role');

  if (clientCard && freelancerCard && confirmBtn) {
    clientCard.addEventListener('click', () => {
      chosenRole = 'CLIENT';
      clientCard.classList.add('selected');
      freelancerCard.classList.remove('selected');
      confirmBtn.textContent = 'Join as a Client';
    });

    freelancerCard.addEventListener('click', () => {
      chosenRole = 'FREELANCER';
      freelancerCard.classList.add('selected');
      clientCard.classList.remove('selected');
      confirmBtn.textContent = 'Apply as a Freelancer';
    });

    confirmBtn.addEventListener('click', () => {
      completeRoleSelection(chosenRole);
    });
  }

  // 7. Admin shortcut on role selection screen (Only for verified ADMIN users)
  const adminShortcut = document.getElementById('btn-select-admin-role');
  if (adminShortcut) {
    adminShortcut.addEventListener('click', () => {
      if (!state.activeUser || state.activeUser.user_role !== 'ADMIN') {
        showToast('Access Denied: Only Admin accounts have authority to access the Admin Console.', 'error');
        return;
      }
      completeRoleSelection('ADMIN');
    });
  }

  // 8. Role Selection screen log out button
  const logoutRoleBtn = document.getElementById('btn-logout-from-role');
  if (logoutRoleBtn) {
    logoutRoleBtn.addEventListener('click', () => {
      handleLogout();
    });
  }

  // 9. Header User Profile Dropdown Flyout
  const userMenuBtn = document.getElementById('user-menu-button');
  const userDropdown = document.getElementById('user-dropdown-menu');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('flyout-notifications')?.classList.remove('active');
      document.getElementById('flyout-messages')?.classList.remove('active');
      userDropdown.classList.toggle('active');
    });
  }

  // Close flyouts on outside click
  document.addEventListener('click', (e) => {
    const userMenuBtn = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown-menu');
    const notifBtn = document.getElementById('btn-notifications');
    const notifFlyout = document.getElementById('flyout-notifications');
    const msgBtn = document.getElementById('btn-messages');
    const msgFlyout = document.getElementById('flyout-messages');

    if (userMenuBtn && userDropdown && !userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
      userDropdown.classList.remove('active');
    }
    if (notifBtn && notifFlyout && !notifBtn.contains(e.target) && !notifFlyout.contains(e.target)) {
      notifFlyout.classList.remove('active');
    }
    if (msgBtn && msgFlyout && !msgBtn.contains(e.target) && !msgFlyout.contains(e.target)) {
      msgFlyout.classList.remove('active');
    }
  });

  // 10. Dropdown: Change Role
  const switchRoleBtn = document.getElementById('btn-dropdown-switch-role');
  if (switchRoleBtn) {
    switchRoleBtn.addEventListener('click', () => {
      if (userDropdown) userDropdown.classList.remove('active');
      openRoleSelectionScreen();
    });
  }

  // 11. Dropdown: Log Out
  const logoutBtn = document.getElementById('btn-dropdown-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (userDropdown) userDropdown.classList.remove('active');
      handleLogout();
    });
  }

  // 12. Permanent Account Deletion
  setupAccountDeletion();

  // 13. Notifications & Direct Messages Systems
  setupNotificationsFlyout();
  setupMessagesFlyoutAndChat();

  // 14. Persona Switcher with RBAC Guard
  setupPersonaSwitcher();
}

// =============================================================================
// Interactive Notifications Center
// =============================================================================
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    role: 'CLIENT',
    title: 'New proposal received',
    desc: 'Faisal Khan submitted a bid ($3,200) on "Full-Stack Web Requisition".',
    time: '5m ago',
    icon: '💼',
    unread: true
  },
  {
    id: 2,
    role: 'CLIENT',
    title: 'Milestone deliverable submitted',
    desc: 'Grace Hopper submitted milestone 1 deliverables for review.',
    time: '1h ago',
    icon: '🚀',
    unread: true
  },
  {
    id: 3,
    role: 'CLIENT',
    title: 'Escrow deposit confirmed',
    desc: 'Payment of $1,250 securely deposited into milestone escrow.',
    time: '3h ago',
    icon: '💳',
    unread: true
  },
  {
    id: 4,
    role: 'FREELANCER',
    title: 'Proposal accepted!',
    desc: 'TechCorp Solutions accepted your proposal for Python & Django Architect.',
    time: '10m ago',
    icon: '🎉',
    unread: true
  },
  {
    id: 5,
    role: 'FREELANCER',
    title: 'New milestone funded',
    desc: 'Client funded Escrow Milestone 2 ($1,800). Work authorization active.',
    time: '45m ago',
    icon: '💰',
    unread: true
  },
  {
    id: 6,
    role: 'FREELANCER',
    title: 'Contract #204 signed',
    desc: 'Alice Johnson confirmed your contract deliverables and terms.',
    time: '2h ago',
    icon: '📄',
    unread: true
  },
  {
    id: 7,
    role: 'ALL',
    title: 'Table Ninjas Security Verification',
    desc: 'Your account session was verified successfully.',
    time: '1d ago',
    icon: '🛡️',
    unread: false
  }
];

let activeNotifFilter = 'all';

function renderNotifications() {
  const container = document.getElementById('notification-list-container');
  const countEl = document.getElementById('notification-unread-count');
  const dotEl = document.getElementById('notification-badge-dot');
  if (!container) return;

  const userRole = (state.activeUser ? state.activeUser.user_role : state.activeRole) || 'CLIENT';
  const relevant = MOCK_NOTIFICATIONS.filter(n => n.role === 'ALL' || n.role === userRole || userRole === 'ADMIN');
  const unreadCount = relevant.filter(n => n.unread).length;

  if (countEl) countEl.textContent = `${unreadCount} unread`;
  if (dotEl) dotEl.style.display = unreadCount > 0 ? 'block' : 'none';

  let list = relevant;
  if (activeNotifFilter === 'unread') {
    list = relevant.filter(n => n.unread);
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px 16px; text-align: center; color: var(--text-muted); font-size: 13px;">
        <span style="font-size: 24px; display: block; margin-bottom: 6px;">🔔</span>
        No ${activeNotifFilter === 'unread' ? 'unread ' : ''}notifications
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(n => `
    <div class="notif-item ${n.unread ? 'unread' : ''}" data-id="${n.id}">
      <div class="notif-icon">${n.icon}</div>
      <div class="notif-content">
        <div class="notif-title">${escapeHtml(n.title)}</div>
        <div class="notif-desc">${escapeHtml(n.desc)}</div>
        <div class="notif-time">${n.time}</div>
      </div>
      ${n.unread ? '<span style="width:7px; height:7px; border-radius:50%; background:var(--ninja-green); margin-top:6px; flex-shrink:0;"></span>' : ''}
    </div>
  `).join('');

  container.querySelectorAll('.notif-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.dataset.id, 10);
      const found = MOCK_NOTIFICATIONS.find(n => n.id === id);
      if (found) {
        openNotificationDetail(found);
      }
    });
  });
}

function openNotificationDetail(notif) {
  if (!notif) return;
  notif.unread = false;
  renderNotifications();
  document.getElementById('flyout-notifications')?.classList.remove('active');

  const modal = document.getElementById('modal-notification-detail');
  if (!modal) return;

  const iconEl = document.getElementById('notif-detail-icon');
  const titleEl = document.getElementById('notif-detail-title');
  const timeEl = document.getElementById('notif-detail-time');
  const descEl = document.getElementById('notif-detail-desc');
  const actionBtn = document.getElementById('btn-notif-detail-action');

  if (iconEl) iconEl.textContent = notif.icon || '🔔';
  if (titleEl) titleEl.textContent = notif.title || 'Notification';
  if (timeEl) timeEl.textContent = notif.time || 'Just now';
  if (descEl) descEl.textContent = notif.desc || '';

  if (actionBtn) {
    const textLower = (notif.title + ' ' + notif.desc).toLowerCase();
    if (textLower.includes('alice')) {
      actionBtn.textContent = 'Chat with Alice Johnson 💬';
      actionBtn.onclick = () => {
        modal.classList.remove('active');
        openDirectChat('conv-alice');
      };
    } else if (textLower.includes('faisal')) {
      actionBtn.textContent = 'Chat with Faisal Khan 💬';
      actionBtn.onclick = () => {
        modal.classList.remove('active');
        openDirectChat('conv-faisal');
      };
    } else if (textLower.includes('contract') || textLower.includes('proposal') || textLower.includes('milestone') || textLower.includes('bids')) {
      actionBtn.textContent = 'View Proposals & Contracts ➤';
      actionBtn.onclick = () => {
        modal.classList.remove('active');
        if (state.activeRole === 'FREELANCER') {
          switchTab('freelancer-tab');
        } else {
          switchTab('client-tab');
        }
      };
    } else {
      actionBtn.textContent = 'View Workspace ➤';
      actionBtn.onclick = () => {
        modal.classList.remove('active');
        if (state.activeRole === 'FREELANCER') {
          switchTab('freelancer-tab');
        } else {
          switchTab('client-tab');
        }
      };
    }
  }

  modal.classList.add('active');
}

function setupNotificationsFlyout() {
  const btn = document.getElementById('btn-notifications');
  const flyout = document.getElementById('flyout-notifications');
  const markAllBtn = document.getElementById('btn-mark-all-read');
  const clearBtn = document.getElementById('btn-clear-notifications');
  const filterAllBtn = document.getElementById('filter-notif-all');
  const filterUnreadBtn = document.getElementById('filter-notif-unread');

  if (btn && flyout) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('user-dropdown-menu')?.classList.remove('active');
      document.getElementById('flyout-messages')?.classList.remove('active');
      flyout.classList.toggle('active');
      renderNotifications();
    });
  }

  if (markAllBtn) {
    markAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      MOCK_NOTIFICATIONS.forEach(n => n.unread = false);
      renderNotifications();
      showToast('All notifications marked as read! ✓', 'success');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      MOCK_NOTIFICATIONS.length = 0;
      renderNotifications();
      showToast('Notifications cleared', 'info');
    });
  }

  if (filterAllBtn && filterUnreadBtn) {
    filterAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      activeNotifFilter = 'all';
      filterAllBtn.classList.add('active');
      filterAllBtn.style.background = 'var(--ninja-green-tint)';
      filterAllBtn.style.color = 'var(--ninja-green)';
      filterUnreadBtn.classList.remove('active');
      filterUnreadBtn.style.background = 'none';
      filterUnreadBtn.style.color = 'var(--text-muted)';
      renderNotifications();
    });

    filterUnreadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      activeNotifFilter = 'unread';
      filterUnreadBtn.classList.add('active');
      filterUnreadBtn.style.background = 'var(--ninja-green-tint)';
      filterUnreadBtn.style.color = 'var(--ninja-green)';
      filterAllBtn.classList.remove('active');
      filterAllBtn.style.background = 'none';
      filterAllBtn.style.color = 'var(--text-muted)';
      renderNotifications();
    });
  }
}

// =============================================================================
// Interactive Direct Messages Flyout & Chat Dialog
// =============================================================================
let MOCK_CONVERSATIONS = [
  {
    id: 'conv-alice',
    name: 'Alice Johnson',
    role: 'TechCorp Solutions Inc.',
    avatar: 'AJ',
    lastMsg: 'Hi! Could you take a look at the revised backend specifications?',
    time: '10m ago',
    unread: true,
    history: [
      { sender: 'them', text: 'Hello! Thanks for connecting on Table Ninjas.', time: '10:15 AM' },
      { sender: 'them', text: 'Hi! Could you take a look at the revised backend specifications?', time: '10:18 AM' }
    ]
  },
  {
    id: 'conv-faisal',
    name: 'Faisal Khan',
    role: 'Principal Full-Stack Engineer',
    avatar: 'FK',
    lastMsg: 'Milestone 1 deliverable is pushed to the repo for your review!',
    time: '1h ago',
    unread: true,
    history: [
      { sender: 'them', text: 'Good morning! Working on the payment gateway integration today.', time: '9:00 AM' },
      { sender: 'them', text: 'Milestone 1 deliverable is pushed to the repo for your review!', time: '9:45 AM' }
    ]
  },
  {
    id: 'conv-support',
    name: 'Table Ninjas Concierge',
    role: 'Platform Escrow & Support',
    avatar: 'TN',
    lastMsg: 'Welcome to Table Ninjas! Let us know if you need any assistance.',
    time: 'Yesterday',
    unread: false,
    history: [
      { sender: 'them', text: 'Welcome to Table Ninjas! Let us know if you need assistance with hiring or escrow.', time: 'Yesterday' }
    ]
  }
];

let activeChatConv = null;

function renderConversations() {
  const container = document.getElementById('messages-list-container');
  const countEl = document.getElementById('messages-unread-count');
  const dotEl = document.getElementById('messages-badge-dot');
  if (!container) return;

  const unreadCount = MOCK_CONVERSATIONS.filter(c => c.unread).length;
  if (countEl) countEl.textContent = `${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`;
  if (dotEl) dotEl.style.display = unreadCount > 0 ? 'block' : 'none';

  container.innerHTML = MOCK_CONVERSATIONS.map(c => `
    <div class="msg-item ${c.unread ? 'unread' : ''}" data-conv-id="${c.id}">
      <div class="msg-avatar">${c.avatar}</div>
      <div class="msg-info">
        <div class="msg-header-row">
          <span class="msg-author">${escapeHtml(c.name)}</span>
          <span class="msg-time">${c.time}</span>
        </div>
        <div class="msg-snippet">${escapeHtml(c.lastMsg)}</div>
      </div>
      ${c.unread ? '<span style="width:7px; height:7px; border-radius:50%; background:var(--ninja-green); flex-shrink:0;"></span>' : ''}
    </div>
  `).join('');

  container.querySelectorAll('.msg-item').forEach(item => {
    item.addEventListener('click', () => {
      const convId = item.dataset.convId;
      openDirectChat(convId);
    });
  });
}

function openDirectChat(convId) {
  const conv = MOCK_CONVERSATIONS.find(c => c.id === convId) || MOCK_CONVERSATIONS[0];
  if (!conv) return;

  activeChatConv = conv;
  conv.unread = false;
  renderConversations();

  document.getElementById('flyout-messages')?.classList.remove('active');

  const modal = document.getElementById('modal-direct-chat');
  if (!modal) return;

  const avatarEl = document.getElementById('chat-recipient-avatar');
  const nameEl = document.getElementById('chat-recipient-name');
  const statusEl = document.getElementById('chat-recipient-status');

  if (avatarEl) avatarEl.textContent = conv.avatar;
  if (nameEl) nameEl.textContent = conv.name;
  if (statusEl) statusEl.textContent = `● ${conv.role}`;

  renderChatHistory();

  modal.classList.add('active');
  setTimeout(() => document.getElementById('chat-input-text')?.focus(), 100);
}

function renderChatHistory() {
  const msgContainer = document.getElementById('chat-messages-container');
  if (!msgContainer || !activeChatConv) return;

  msgContainer.innerHTML = activeChatConv.history.map(m => `
    <div class="chat-bubble ${m.sender === 'me' ? 'outgoing' : 'incoming'}">
      <div>${escapeHtml(m.text)}</div>
      <span class="chat-bubble-time">${m.time}</span>
    </div>
  `).join('');

  msgContainer.scrollTop = msgContainer.scrollHeight;
}

function setupMessagesFlyoutAndChat() {
  const btn = document.getElementById('btn-messages');
  const flyout = document.getElementById('flyout-messages');
  const newChatBtn = document.getElementById('btn-new-chat-trigger');
  const chatForm = document.getElementById('form-chat-send');
  const closeChatBtn = document.getElementById('btn-close-direct-chat');

  if (btn && flyout) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('user-dropdown-menu')?.classList.remove('active');
      document.getElementById('flyout-notifications')?.classList.remove('active');
      flyout.classList.toggle('active');
      renderConversations();
    });
  }

  if (newChatBtn) {
    newChatBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDirectChat('conv-support');
    });
  }

  if (closeChatBtn) {
    closeChatBtn.addEventListener('click', () => {
      document.getElementById('modal-direct-chat')?.classList.remove('active');
    });
  }

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-input-text');
      const text = input?.value.trim();
      if (!text || !activeChatConv) return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Add user message
      activeChatConv.history.push({ sender: 'me', text, time: timeStr });
      activeChatConv.lastMsg = text;
      activeChatConv.time = 'Just now';
      input.value = '';
      renderChatHistory();
      renderConversations();

      // Show dynamic typing indicator
      const msgContainer = document.getElementById('chat-messages-container');
      if (msgContainer) {
        const typingEl = document.createElement('div');
        typingEl.id = 'chat-typing-indicator';
        typingEl.className = 'chat-bubble incoming';
        typingEl.style.opacity = '0.75';
        typingEl.style.fontSize = '12px';
        typingEl.style.display = 'flex';
        typingEl.style.alignItems = 'center';
        typingEl.style.gap = '6px';
        typingEl.innerHTML = `<span>💬 ${escapeHtml(activeChatConv.name)} is typing...</span>`;
        msgContainer.appendChild(typingEl);
        msgContainer.scrollTop = msgContainer.scrollHeight;
      }

      // Generate intelligent, relevant answer based on question and recipient
      setTimeout(() => {
        document.getElementById('chat-typing-indicator')?.remove();

        const relevantReply = generateRelevantReply(text, activeChatConv);
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        activeChatConv.history.push({ sender: 'them', text: relevantReply, time: replyTime });
        activeChatConv.lastMsg = relevantReply;
        activeChatConv.time = 'Just now';
        renderChatHistory();
        renderConversations();
      }, 650);
    });
  }
}

// -----------------------------------------------------------------------------
// Intelligent Context-Aware Chat Response Engine
// Answers questions relevantly based on recipient persona and subject matter
// -----------------------------------------------------------------------------
function generateRelevantReply(rawText, conv) {
  if (!rawText) return 'Could you please clarify your question? I am here to help!';

  const text = rawText.trim();
  const q = text.toLowerCase();
  const convId = conv?.id || '';
  const isAlice = convId === 'conv-alice';
  const isFaisal = convId === 'conv-faisal';
  const isSupport = convId === 'conv-support';

  // 1. Identity & Role questions
  if (q.includes('who are you') || q.includes('what is your name') || q.includes('what\'s your name') || q.includes('who is this') || q.includes('your role') || q.includes('what do you do') || q.includes('about yourself') || q.includes('introduce yourself') || q.includes('tell me about you')) {
    if (isAlice) {
      return 'I am Alice Johnson, Project Lead and Hiring Manager at TechCorp Solutions Inc. I oversee software engineering contracts, job postings, and technical deliverables on Table Ninjas.';
    }
    if (isFaisal) {
      return 'I am Faisal Khan, a Principal Full-Stack Engineer on Table Ninjas. I have over 8 years of experience building scalable web applications with React, Node.js, Express, Python, and MySQL.';
    }
    return 'I am the Table Ninjas Concierge assistant. I am here to help you navigate hiring, bidding, contracts, milestone escrow, and account management.';
  }

  // 2. Help & Guidance requests
  if (q === 'help' || q.includes('help') || q.includes('assist') || q.includes('have a question') || q.includes('can i ask') || q.includes('guide me')) {
    if (isAlice) {
      return 'Yes, absolutely! Let me know what you need assistance with regarding our project specifications, milestone deliverables, or contract terms.';
    }
    if (isFaisal) {
      return 'Of course! Feel free to ask anything about my technical background, proposed architecture, pricing, or project availability.';
    }
    return 'Yes! I can assist you with anything on Table Ninjas, including posting jobs, submitting proposals, escrow payments, password resets, or account settings. What would you like help with?';
  }

  // 3. Platform info: What is Table Ninjas
  if (q.includes('what is table ninjas') || q.includes('about table ninjas') || q.includes('what is this platform') || q.includes('what is this website') || q.includes('how does table ninjas work') || q.includes('how does this platform work') || q.includes('features of this')) {
    if (isSupport) {
      return 'Table Ninjas is a professional freelance marketplace connecting verified clients and top freelancers. It features role-based access control, interactive job posting and bidding, milestone escrow protection, real-time messaging, and analytical reporting.';
    }
    if (isAlice) {
      return 'Table Ninjas is the verified marketplace where TechCorp Solutions hires top-tier developers and manages escrow-protected milestones.';
    }
    return 'Table Ninjas is the freelance marketplace where I manage client contracts, submit bids, and receive escrow-guaranteed payments.';
  }

  // 4. Account Deletion questions
  if (q.includes('delete') && (q.includes('account') || q.includes('profile') || q.includes('user') || q.includes('data')) || q.includes('close account') || q.includes('erase account')) {
    if (isSupport) {
      return 'To permanently delete your Table Ninjas account: click your profile avatar in the top-right header, select "🗑️ Delete Account Permanently" from the dropdown menu, and type DELETE in capital letters to confirm. This will permanently remove all your profile data, jobs, proposals, and records from the database.';
    }
    return 'You can permanently delete your account anytime from the top-right profile dropdown menu under "🗑️ Delete Account Permanently". Just ensure our active milestones and escrow funds are completed or resolved first!';
  }

  // 5. Password Reset & Confirmation Code questions
  if (q.includes('password') || q.includes('reset') || q.includes('confirmation code') || q.includes('verification code') || q.includes('forgot')) {
    if (isSupport) {
      return 'To reset your password: log out and click "Forgot your password?" on the login page. Enter your registered email to process a 6-digit verification code. If you configured your Gmail credentials in backend/.env, the code is delivered directly to your inbox; during local testing, it is safely printed in your server terminal console. Enter the code on screen to set your new password.';
    }
    return 'For password changes or reset codes, head to the Table Ninjas login screen and click "Forgot your password?". The system will authenticate your registered email and guide you through setting a new password.';
  }

  // 6. Email delivery & SMTP questions
  if ((q.includes('email') || q.includes('mail') || q.includes('code')) && (q.includes('receive') || q.includes('not sending') || q.includes('didn\'t get') || q.includes('inbox') || q.includes('smtp') || q.includes('sent') || q.includes('why'))) {
    return 'Platform verification emails are sent via Gmail SMTP. To receive real emails at your inbox, configure your Gmail address and 16-character Google App Password in backend/.env (under SMTP_USER and SMTP_PASS). If SMTP credentials are not yet entered, your private 6-digit code is logged securely in the server terminal console for privacy.';
  }

  // 7. Negotiation & Discounts (Evaluated before generic budget/price)
  if (q.includes('negotiat') || q.includes('discount') || q.includes('lower price') || q.includes('cheaper') || q.includes('reduce rate') || q.includes('reduce price') || q.includes('can you lower') || q.includes('flexible on price')) {
    if (isAlice) {
      return 'Yes, we are open to reasonable adjustments depending on your proposed project architecture, scope, and delivery timeline.';
    }
    if (isFaisal) {
      return 'I am open to discussing the milestone breakdown! If we adjust the initial scope or commit to a multi-month contract, I can offer a 10% discount on my hourly rate.';
    }
    return 'Clients and freelancers are welcome to negotiate rates and milestones freely via direct messages before signing a contract.';
  }

  // 8. Budget, Price, Cost, Rates & Payment questions
  if (q.includes('budget') || q.includes('rate') || q.includes('cost') || q.includes('price') || q.includes('charge') || q.includes('pay') || q.includes('salary') || q.includes('how much') || q.includes('fee') || q.includes('pricing') || q.includes('quote')) {
    if (isAlice) {
      return 'Our budget for this requisition is $3,200 for the full milestone deliverable, or $65 to $80 per hour depending on technical expertise. Payments are deposited into Table Ninjas Escrow before work starts and released upon deliverable verification.';
    }
    if (isFaisal) {
      return 'My standard rate is $65 per hour for full-stack architecture and development. For fixed-price projects, I quote $1,200 for database and API architecture, and $1,800 to $2,000 for frontend components and integration.';
    }
    return 'On Table Ninjas, clients set project budgets as either Fixed-Price or Hourly rates. All transactions are escrow-secured: clients fund the milestone before work begins, and funds are automatically released upon work approval.';
  }

  // 9. Location, Timezone & Availability
  if (q.includes('where are you') || q.includes('location') || q.includes('country') || q.includes('timezone') || q.includes('time zone') || q.includes('where do you live') || q.includes('available') || q.includes('availability') || q.includes('start today') || q.includes('start now') || q.includes('can you start')) {
    if (isAlice) {
      return 'Our company is based in San Francisco, California (PST), but we collaborate with engineering talent globally across all time zones.';
    }
    if (isFaisal) {
      return 'I work in the Eastern Time Zone (EST) with flexible overlap for international teams. I am currently available to take on this project and can begin immediately.';
    }
    return 'Table Ninjas is a global distributed platform operating 24/7 across all international time zones.';
  }

  // 10. Experience, Portfolio & Previous Projects
  if (q.includes('experience') || q.includes('portfolio') || q.includes('previous work') || q.includes('projects worked on') || q.includes('sample') || q.includes('github') || q.includes('resume') || q.includes('past work') || q.includes('background') || q.includes('credentials')) {
    if (isFaisal) {
      return 'I have over 8 years of full-stack experience delivering SaaS applications, high-throughput REST APIs, and responsive dashboards with React, Node.js, Python, and MySQL. You can review my verified 5-star ratings and completed contracts on my Table Ninjas profile.';
    }
    if (isAlice) {
      return 'At TechCorp Solutions, we build enterprise cloud tools and client portals. We have completed over 40 milestones on Table Ninjas with verified 5-star client ratings.';
    }
    return 'You can explore a freelancer\'s completed projects, client reviews, and hourly history by clicking their name on the Talent Leaderboard under the Analytics tab.';
  }

  // 11. Deadlines, Timeline & Completion
  if (q.includes('deadline') || q.includes('timeline') || q.includes('when can you') || q.includes('how long') || q.includes('duration') || q.includes('eta') || q.includes('delivery') || q.includes('deliver') || q.includes('finish') || q.includes('schedule') || q.includes('complete') || q.includes('turnaround')) {
    if (isAlice) {
      return 'Our target timeline is 3 to 4 weeks for full delivery. We expect Milestone 1 (API & Database Schema) within 7 to 10 days, followed by frontend integration in week 2 and QA testing in week 3.';
    }
    if (isFaisal) {
      return 'I can have the initial working prototype and database schemas ready within 5 to 7 business days. Full production completion with automated tests typically takes 2 to 3 weeks.';
    }
    return 'Project deadlines are defined when a client posts a requisition and can be finalized in the contract terms. You can monitor all active milestone countdowns under the Contracts tab.';
  }

  // 12. Tech Stack, Skills & Architecture
  if (q.includes('tech stack') || q.includes('technology') || q.includes('stack') || q.includes('react') || q.includes('node') || q.includes('python') || q.includes('django') || q.includes('sql') || q.includes('database') || q.includes('api') || q.includes('frontend') || q.includes('backend') || q.includes('javascript') || q.includes('typescript')) {
    if (isAlice) {
      return 'We require React on the frontend, Node.js with Express on the backend, and MySQL for relational persistence with clean RESTful API design.';
    }
    if (isFaisal) {
      return 'My core stack is React, Node.js, Express, Python/Django, and MySQL. I specialize in RESTful APIs, relational data modeling, and responsive CSS.';
    }
    return 'Table Ninjas supports technologies including React, Node.js, Express, Python, Django, MySQL, PostgreSQL, Docker, and AWS. You can search talent and jobs by skill in the search bar.';
  }

  // 13. Scope, Requirements & Specifications
  if (q.includes('requirement') || q.includes('requirements') || q.includes('scope') || q.includes('specification') || q.includes('spec') || q.includes('what do you need') || q.includes('what is the job') || q.includes('details') || q.includes('deliverable')) {
    if (isAlice) {
      return 'The primary requirements are: 1) Responsive user interfaces for clients and freelancers, 2) Role-based access control, 3) Real-time interactive direct messaging, 4) Secure escrow milestone workflows, and 5) Comprehensive database analytics.';
    }
    if (isFaisal) {
      return 'I have reviewed the scope. The deliverables include structured database migrations, parameterized SQL queries, JWT-authenticated API endpoints, and a responsive frontend interface.';
    }
    return 'You can find the detailed project scope, budget, and required skills on any job requisition card under the "Explore Jobs" marketplace feed.';
  }

  // 14. Escrow & Payment Safety
  if (q.includes('escrow') || q.includes('safe') || q.includes('security') || q.includes('protection') || q.includes('guarantee') || q.includes('scam') || q.includes('trust')) {
    if (isSupport) {
      return 'Table Ninjas Escrow holds project funds in an encrypted vault before work begins. Payment is released to the freelancer only after the client inspects and approves the delivered milestone. Both parties are fully protected.';
    }
    if (isAlice) {
      return 'Yes, all our payments are funded into Table Ninjas Escrow upfront, so your earnings are 100% guaranteed once milestones are verified.';
    }
    return 'Every contract I work on uses Table Ninjas Escrow protection. It guarantees that funds are locked before work starts and released upon successful delivery.';
  }

  // 15. Disputes, Refunds & Cancellations
  if (q.includes('dispute') || q.includes('refund') || q.includes('cancel') || q.includes('cancellation') || q.includes('doesn\'t pay') || q.includes('doesn\'t deliver') || q.includes('arbitration')) {
    if (isSupport) {
      return 'If any disagreement occurs, either party can open a dispute from the Contracts tab. An administrator reviews the deliverables and escrow funds to issue a fair resolution or refund.';
    }
    return 'If any issues arise with a deliverable, Table Ninjas has built-in dispute resolution and arbitration to ensure fair outcomes and milestone adjustments.';
  }

  // 16. How to Hire, Post Job, or Bid
  if ((q.includes('how') || q.includes('can i')) && (q.includes('post') || q.includes('apply') || q.includes('bid') || q.includes('proposal') || q.includes('hire'))) {
    if (isSupport) {
      return 'To post a job, open the Client Portal tab and click "Post a New Job". To apply or submit a proposal, go to the Freelancer marketplace under "Explore Jobs", select a listing, and click "Submit Proposal".';
    }
    if (isAlice) {
      return 'To apply for my project, find TechCorp Solutions under Explore Jobs and click "Submit Proposal" with your proposed rate and milestone schedule.';
    }
    if (isFaisal) {
      return 'You can hire me by accepting my proposal on your job listing, or click "Hire Freelancer" on my profile to create a new contract.';
    }
  }

  // 17. Meetings, Calls & Communications
  if (q.includes('call') || q.includes('meeting') || q.includes('zoom') || q.includes('google meet') || q.includes('phone') || q.includes('speak')) {
    if (isAlice) {
      return 'We can coordinate a quick sync or exchange updates directly here on Table Ninjas messaging. What time window works best for your schedule?';
    }
    if (isFaisal) {
      return 'Yes, I am happy to hop on a call or discuss requirements here. Let me know your preferred time and timezone!';
    }
    return 'Table Ninjas provides verified in-app direct messaging for all communication between clients and freelancers.';
  }

  // 18. NDA, Confidentiality & Code Ownership
  if (q.includes('nda') || q.includes('confidential') || q.includes('non-disclosure') || q.includes('intellectual property') || q.includes('ownership')) {
    if (isAlice) {
      return 'Yes, confidentiality is standard for all our corporate projects. Table Ninjas platform terms also protect intellectual property rights.';
    }
    if (isFaisal) {
      return 'Yes, absolutely. I sign standard NDAs, and all source code, architecture, and intellectual property belong 100% to the client upon milestone payment.';
    }
    return 'Table Ninjas contracts include standard intellectual property assignment to clients upon escrow fund release.';
  }

  // 19. Unit Tests, QA & Revisions
  if (q.includes('test') || q.includes('qa') || q.includes('revision') || q.includes('bug') || q.includes('quality')) {
    if (isAlice) {
      return 'We include milestone review cycles to test and verify the code before approving escrow release.';
    }
    if (isFaisal) {
      return 'Yes! I write unit tests for critical endpoints and provide revisions to ensure everything matches your specifications.';
    }
    return 'Deliverables should include verification tests. Clients have a review period to request revisions before approving escrow funds.';
  }

  // 20. Documentation
  if (q.includes('doc') || q.includes('readme') || q.includes('guide')) {
    if (isFaisal) {
      return 'Yes, I deliver clean README documentation, API schema docs, and inline comments with every milestone.';
    }
    if (isAlice) {
      return 'Comprehensive documentation and API schemas are a required deliverable for our repository.';
    }
    return 'All delivered projects are recommended to include clear setup guides and documentation for the client.';
  }

  // 21. Greetings & How are you
  if (q === 'hi' || q === 'hello' || q === 'hey' || q.startsWith('hi ') || q.startsWith('hello ') || q.startsWith('hey ') || q.includes('how are you') || q.includes('how r u') || q.includes('good morning') || q.includes('good evening') || q.includes('sup') || q.includes('yo')) {
    if (isAlice) {
      return 'Hello! I am doing well, thank you. How can I assist you today with our project requirements or job openings?';
    }
    if (isFaisal) {
      return 'Hey there! I am doing great and actively coding. How can I help you today with your project or technical questions?';
    }
    return 'Hello! Welcome to Table Ninjas Concierge. How can I assist you with your hiring, freelancing, or account questions today?';
  }

  // 22. Gratitude & Acknowledgements
  if (q.includes('thank') || q.includes('thanks') || q.includes('thx') || q.includes('appreciate') || q.includes('awesome') || q.includes('great') || q.includes('perfect') || q.includes('good job') || q.includes('well done') || q.includes('nice work')) {
    if (isAlice) return 'You are very welcome! Let me know whenever you would like to proceed with the next step.';
    if (isFaisal) return 'Happy to help! Let me know if you need anything else clarified.';
    return 'You are most welcome! Let us know if you have any other questions about Table Ninjas.';
  }

  // 23. Affirmatives & Short checks
  if (q === 'ok' || q === 'okay' || q === 'sure' || q === 'yes' || q === 'yep' || q === 'got it' || q === 'understood' || q === 'cool' || q === 'fine' || q === 'done') {
    if (isAlice) return 'Sounds great! I will keep you posted as we move to the next phase.';
    if (isFaisal) return 'Great! I am on it and will share the progress update soon.';
    return 'Sounds good! Feel free to reach out whenever you need assistance.';
  }

  // 24. Farewells
  if (q.includes('bye') || q.includes('goodbye') || q.includes('see you') || q.includes('talk later') || q.includes('take care')) {
    if (isAlice) return 'Goodbye! Have a productive day and talk soon.';
    if (isFaisal) return 'Take care! Talk to you soon.';
    return 'Goodbye! Thank you for using Table Ninjas. Have a great day!';
  }

  // 25. General Inquiries Fallback (DIRECT ANSWER ONLY - NO QUOTES, NO ECHOING)
  if (isAlice) {
    return 'As the project client at TechCorp Solutions, my priority is clean architecture, verified milestones, and transparent communication. Feel free to share your specific thoughts and I will review them right away.';
  }
  if (isFaisal) {
    return 'From a full-stack engineering perspective, I focus on clean code, scalable database schemas, and prompt milestone delivery. Let me know what specific requirements you would like to discuss next.';
  }
  return 'Table Ninjas provides verified marketplace hiring, role-based dashboards, and milestone escrow security. Please let me know what specific feature or account question you need guidance on.';
}

// -----------------------------------------------------------------------------
// Sign Up Flow Setup & Interactive Role Checkbox Selection
// -----------------------------------------------------------------------------
function selectSignUpRole(role) {
  const isClient = role === 'CLIENT';
  const roleClient = document.getElementById('signup-role-client');
  const roleFreelancer = document.getElementById('signup-role-freelancer');
  const cardClient = document.getElementById('signup-card-client');
  const cardFreelancer = document.getElementById('signup-card-freelancer');
  const roleVal = document.getElementById('signup-role-value');
  const companyField = document.getElementById('signup-field-company');
  const titleField = document.getElementById('signup-field-title');
  const companyInput = document.getElementById('signup-company');
  const titleInput = document.getElementById('signup-title');

  if (roleClient) roleClient.checked = isClient;
  if (roleFreelancer) roleFreelancer.checked = !isClient;

  if (cardClient) cardClient.classList.toggle('selected', isClient);
  if (cardFreelancer) cardFreelancer.classList.toggle('selected', !isClient);

  if (roleVal) roleVal.value = isClient ? 'CLIENT' : 'FREELANCER';

  if (companyField) companyField.style.display = isClient ? 'block' : 'none';
  if (titleField) titleField.style.display = isClient ? 'none' : 'block';

  if (companyInput) companyInput.required = isClient;
  if (titleInput) titleInput.required = !isClient;
}

function resetSignUpForm() {
  const signupForm = document.getElementById('form-signup');
  if (signupForm) {
    signupForm.reset();
  }
  selectSignUpRole('CLIENT');
  const firstNameInput = document.getElementById('signup-first-name');
  if (firstNameInput) {
    setTimeout(() => firstNameInput.focus(), 80);
  }
}
window.resetSignUpForm = resetSignUpForm;

function setupSignUpFlow() {
  // 1. Radio and Card click listeners for role selection
  const radios = document.querySelectorAll('input[name="signup_role_choice"]');
  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      selectSignUpRole(radio.value);
    });
  });

  const cardClient = document.getElementById('signup-card-client');
  const cardFreelancer = document.getElementById('signup-card-freelancer');

  if (cardClient) {
    cardClient.addEventListener('click', () => {
      selectSignUpRole('CLIENT');
    });
  }

  if (cardFreelancer) {
    cardFreelancer.addEventListener('click', () => {
      selectSignUpRole('FREELANCER');
    });
  }

  // Initial state: default to CLIENT
  selectSignUpRole('CLIENT');

  // 2. Sign Up Form submission
  const signupForm = document.getElementById('form-signup');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const first_name = document.getElementById('signup-first-name')?.value.trim();
      const last_name = document.getElementById('signup-last-name')?.value.trim();
      const username = document.getElementById('signup-username')?.value.trim();
      const email = document.getElementById('signup-email')?.value.trim();
      const password = document.getElementById('signup-password')?.value;
      const confirm_password = document.getElementById('signup-confirm-password')?.value;
      const user_role = document.getElementById('signup-role-value')?.value || 'CLIENT';
      const company_name = document.getElementById('signup-company')?.value.trim();
      const professional_title = document.getElementById('signup-title')?.value.trim();

      if (!first_name || !last_name || !username || !email || !password || !confirm_password) {
        showToast('Please fill out all required fields to register.', 'error');
        return;
      }

      if (user_role === 'CLIENT' && !company_name) {
        showToast('Please provide your Company or Organization Name.', 'error');
        document.getElementById('signup-company')?.focus();
        return;
      }

      if (user_role === 'FREELANCER' && !professional_title) {
        showToast('Please provide your Professional Title (e.g. Full-Stack Engineer).', 'error');
        document.getElementById('signup-title')?.focus();
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters long.', 'error');
        document.getElementById('signup-password')?.focus();
        return;
      }

      if (password !== confirm_password) {
        showToast('Passwords do not match. Please verify your passwords.', 'error');
        document.getElementById('signup-confirm-password')?.focus();
        return;
      }

      const submitBtn = document.getElementById('btn-signup-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';
      }

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name, last_name, username, email, password, user_role, company_name, professional_title
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        showToast(`Welcome to Table Ninjas, ${first_name}! Your account has been created. 🎉`, 'success');
        await handleLogin(email, password, user_role);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create My Table Ninjas Account';
        }
      }
    });
  }
}

// -----------------------------------------------------------------------------
// Forgot Password & Reset Password Flow (Registered Email Only)
// -----------------------------------------------------------------------------
function setupForgotAndResetPassword() {
  const forgotLink = document.getElementById('link-forgot-password');
  const forgotModal = document.getElementById('modal-forgot-password');
  const stage1 = document.getElementById('forgot-stage-1');
  const stage2 = document.getElementById('forgot-stage-2');
  const emailInput = document.getElementById('forgot-input-email');
  const sendBtn = document.getElementById('btn-send-permission-email');
  const dispatchedLabel = document.getElementById('forgot-dispatched-email-label');
  const resetForm = document.getElementById('form-reset-password');
  const codeInput = document.getElementById('forgot-input-code');
  const newPwInput = document.getElementById('forgot-new-password');
  const confirmPwInput = document.getElementById('forgot-confirm-password');
  const resendBtn = document.getElementById('btn-forgot-resend');
  const changeEmailBtn = document.getElementById('btn-forgot-change-email');

  let currentResetEmail = '';

  if (forgotLink && forgotModal) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Pre-fill email from login form only if it looks like an email
      const loginVal = document.getElementById('login-email')?.value.trim();
      if (emailInput) {
        emailInput.value = (loginVal && loginVal.includes('@')) ? loginVal : '';
      }
      if (codeInput) codeInput.value = '';
      if (newPwInput) newPwInput.value = '';
      if (confirmPwInput) confirmPwInput.value = '';
      if (stage1) stage1.style.display = 'block';
      if (stage2) stage2.style.display = 'none';
      forgotModal.classList.add('active');
      setTimeout(() => emailInput?.focus(), 80);
    });
  }

  // Send confirmation code function (Registered Email Only)
  const dispatchCodeToEmail = async () => {
    const email = emailInput?.value.trim();
    if (!email || !email.includes('@')) {
      showToast('Please enter your valid registered email address (e.g. name@company.com).', 'error');
      emailInput?.focus();
      return;
    }

    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending Confirmation Code...';
    }

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch confirmation email');
      }

      currentResetEmail = data.email || email;

      if (dispatchedLabel) dispatchedLabel.textContent = currentResetEmail;
      if (codeInput) codeInput.value = '';

      const statusBanner = document.getElementById('forgot-dispatch-status-banner');
      const instructions = document.getElementById('forgot-dispatched-instructions');

      if (data.has_smtp) {
        if (statusBanner) {
          statusBanner.innerHTML = `
            <div class="email-dispatch-header">
              <span class="badge badge-success" id="forgot-dispatch-badge">📨 Dispatched via Gmail SMTP</span>
              <span class="text-dim" style="font-size:11px;">security@tableninjas.com</span>
            </div>
            <p style="font-size:13px; margin: 8px 0 4px; color: var(--text-dark);">
              A 6-digit confirmation code has been dispatched directly to your registered inbox:
            </p>
          `;
        }
        if (instructions) {
          instructions.textContent = 'Please check your registered email inbox (including spam or junk folder) and enter the 6-digit code below to set your new password.';
        }
        showToast(`Private confirmation code sent to ${currentResetEmail}! 📨 Please check your inbox and spam folder.`, 'success');
      } else {
        if (statusBanner) {
          statusBanner.innerHTML = `
            <div class="email-dispatch-header" style="display:flex; justify-content:space-between; align-items:center;">
              <span class="badge" style="background:#fef3c7; color:#92400e; font-weight:700;">⚠️ Gmail SMTP Not Configured in .env</span>
              <span class="text-dim" style="font-size:11px;">Console Fallback</span>
            </div>
            <p style="font-size:12.5px; margin: 8px 0 4px; color: var(--text-dark); line-height:1.4;">
              Confirmation code generated for account:
            </p>
          `;
        }
        if (instructions) {
          instructions.innerHTML = `
            <div style="background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; font-size: 11.5px; color: var(--text-dark); line-height: 1.45;">
              <strong>Notice:</strong> To deliver real emails to your Gmail inbox, add your 16-character Google App Password in <code style="background:var(--bg-card); padding:1px 4px; border-radius:3px;">backend/.env</code>.
              <br>For testing right now, your 6-digit code is logged in the <strong>server terminal console</strong>.
            </div>
            Please enter your 6-digit confirmation code below:
          `;
        }
        showToast(`Confirmation code generated! SMTP credentials not configured in backend/.env — check server console or add Gmail credentials.`, 'warning');
      }

      if (stage1) stage1.style.display = 'none';
      if (stage2) stage2.style.display = 'block';

      setTimeout(() => codeInput?.focus(), 80);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send Confirmation Code to Registered Email';
      }
    }
  };

  if (sendBtn) {
    sendBtn.addEventListener('click', dispatchCodeToEmail);
  }

  // Resend code to registered email
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      if (!currentResetEmail) return;
      resendBtn.disabled = true;
      resendBtn.textContent = 'Resending...';
      try {
        const res = await fetch(`${API_BASE}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentResetEmail })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to resend confirmation email');

        if (data.has_smtp) {
          showToast(`New confirmation code sent to ${currentResetEmail}! 📨 Please check your inbox and spam folder.`, 'success');
        } else {
          showToast(`New code generated! Check server terminal console (SMTP not configured in backend/.env).`, 'warning');
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        resendBtn.disabled = false;
        resendBtn.textContent = '🔄 Resend code to email';
      }
    });
  }

  // Change registered email address
  if (changeEmailBtn) {
    changeEmailBtn.addEventListener('click', () => {
      if (stage1) stage1.style.display = 'block';
      if (stage2) stage2.style.display = 'none';
      setTimeout(() => emailInput?.focus(), 80);
    });
  }

  // Submit reset password with code entered from email
  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = codeInput?.value.trim();
      const new_password = newPwInput?.value;
      const confirm_password = confirmPwInput?.value;

      if (!code || code.length !== 6) {
        showToast('Please enter the 6-digit confirmation code sent to your registered email.', 'error');
        codeInput?.focus();
        return;
      }

      if (!new_password || new_password.length < 6) {
        showToast('New password must be at least 6 characters long.', 'error');
        newPwInput?.focus();
        return;
      }

      if (new_password !== confirm_password) {
        showToast('New passwords do not match. Please verify your passwords.', 'error');
        confirmPwInput?.focus();
        return;
      }

      const submitBtn = document.getElementById('btn-submit-reset-password');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating Password...';
      }

      try {
        const res = await fetch(`${API_BASE}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentResetEmail,
            code,
            new_password
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Password reset failed');
        }

        // Close forgot modal
        if (forgotModal) forgotModal.classList.remove('active');

        // Pre-fill login form with newly updated credentials
        const loginUsername = document.getElementById('login-username');
        const loginEmail = document.getElementById('login-email');
        const loginPw = document.getElementById('login-password');
        if (loginEmail) loginEmail.value = currentResetEmail;
        if (loginUsername && currentResetEmail) loginUsername.value = currentResetEmail.split('@')[0];
        if (loginPw) loginPw.value = new_password;

        // Open celebratory confirmation modal
        const successModal = document.getElementById('modal-password-success');
        if (successModal) {
          successModal.classList.add('active');
        }

        showToast('Password changed successfully! ✅', 'success');
        showPageView('view-login');
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Change & Update Password';
        }
      }
    });
  }
}

// Perform Login with Email, Password, and Role resolution
async function handleLogin(email, password = '', forcedRole = null, username = '') {
  try {
    email = (email || '').trim().toLowerCase();
    username = (username || '').trim();

    // If only username provided (e.g. login by username), allow it
    const searchIdentifier = username || email || 'alice@techcorp.io';

    if (!Array.isArray(state.users) || state.users.length === 0) {
      state.users = [...DEFAULT_USERS];
    }

    let matchedUser = state.users.find(u => 
      (email && (u.email || '').toLowerCase() === email) ||
      (username && (u.username || '').toLowerCase() === username.toLowerCase()) ||
      (searchIdentifier && (u.email || '').toLowerCase() === searchIdentifier.toLowerCase()) ||
      (searchIdentifier && (u.username || '').toLowerCase() === searchIdentifier.toLowerCase()) ||
      (searchIdentifier && (u.first_name || '').toLowerCase() === searchIdentifier.toLowerCase())
    );

    // Try backend auth endpoint
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Authentication failed. Please verify credentials.', 'error');
        return;
      }
      if (data && data.user) {
        matchedUser = data.user;
      }
    } catch (e) {
      // Fallback to local match
    }

    if (!matchedUser) {
      const primaryName = username || (email ? email.split('@')[0] : 'User');
      const capName = primaryName.charAt(0).toUpperCase() + primaryName.slice(1);
      matchedUser = {
        user_id: 100 + state.users.length,
        username: primaryName.toLowerCase(),
        first_name: capName,
        last_name: '', // Empty last name, no artificial 'Member' suffix
        email: email.includes('@') ? email : `${primaryName.toLowerCase()}@example.com`,
        user_role: forcedRole || 'CLIENT',
        account_status: 'ACTIVE',
        company_name: forcedRole === 'CLIENT' ? `${capName} Enterprise` : null,
        professional_title: forcedRole === 'FREELANCER' ? 'Independent Professional' : null,
        total_spent: 0,
        jobs_posted_count: 0
      };
      state.users.push(matchedUser);
    }

    if (username && !matchedUser.username) {
      matchedUser.username = username;
    }

    if (forcedRole && matchedUser.user_role !== 'ADMIN') {
      matchedUser.user_role = forcedRole;
    }

    state.activeUser = matchedUser;
    state.isLoggedIn = true;

    const displayName = getUserDisplayName(matchedUser);

    // Direct routing to the user's workspace based on their role:
    if (matchedUser.user_role === 'FREELANCER') {
      state.activeRole = 'FREELANCER';
      updateHeaderUserInfo();
      showPageView('view-workspace');
      switchTab('freelancer-tab');
      showToast(`Welcome back, ${displayName}! Freelancer Hub opened.`, 'success');
      return;
    }

    if (matchedUser.user_role === 'ADMIN') {
      state.activeRole = 'ADMIN';
      updateHeaderUserInfo();
      showPageView('view-workspace');
      switchTab('admin-tab');
      showToast(`Welcome Administrator ${displayName}! Admin Console activated.`, 'success');
      return;
    }

    // Default to CLIENT for clients, dual, or custom accounts
    state.activeRole = 'CLIENT';
    updateHeaderUserInfo();
    showPageView('view-workspace');
    switchTab('client-tab');
    showToast(`Welcome back, ${displayName}! Client Portal ready.`, 'success');
  } catch (err) {
    showToast('Login error: ' + err.message, 'error');
  }
}

// Open the Role Selection Page (Ask: Freelancer or Client?)
function openRoleSelectionScreen() {
  if (!state.activeUser) {
    state.activeUser = state.users[0] || DEFAULT_USERS[0];
  }

  // Update greeting elements on role selection page using username
  const avatarText = getUserInitials(state.activeUser);
  const avatarEl = document.getElementById('role-avatar-chip');
  if (avatarEl) avatarEl.textContent = avatarText;

  const nameEl = document.getElementById('role-user-name');
  if (nameEl) nameEl.textContent = getUserDisplayName(state.activeUser);

  // Hide or show Admin evaluation shortcut strictly based on user_role
  const adminShortcut = document.getElementById('admin-eval-shortcut');
  if (adminShortcut) {
    const isAdminAccount = state.activeUser && state.activeUser.user_role === 'ADMIN';
    adminShortcut.style.display = isAdminAccount ? 'block' : 'none';
  }

  // Pre-select card matching user's default role
  const clientCard = document.getElementById('card-role-client');
  const freelancerCard = document.getElementById('card-role-freelancer');
  const confirmBtn = document.getElementById('btn-confirm-role');

  if (state.activeUser.user_role === 'FREELANCER') {
    if (freelancerCard) freelancerCard.classList.add('selected');
    if (clientCard) clientCard.classList.remove('selected');
    if (confirmBtn) confirmBtn.textContent = 'Apply as a Freelancer';
  } else {
    if (clientCard) clientCard.classList.add('selected');
    if (freelancerCard) freelancerCard.classList.remove('selected');
    if (confirmBtn) confirmBtn.textContent = 'Join as a Client';
  }

  showPageView('view-role-selection');
}

// Complete Role Selection & Open Appropriate Workspace Page
function completeRoleSelection(role) {
  // Security Enforcement: Clients and Freelancers cannot access ADMIN
  if (role === 'ADMIN') {
    if (!state.activeUser || state.activeUser.user_role !== 'ADMIN') {
      showToast('Access Denied: Only Admin accounts can access the Admin Console.', 'error');
      role = (state.activeUser && state.activeUser.user_role === 'FREELANCER') ? 'FREELANCER' : 'CLIENT';
    }
  }

  state.activeRole = role;

  if (!Array.isArray(state.users) || state.users.length === 0) {
    state.users = [...DEFAULT_USERS];
  }

  // If chosen role differs from current activeUser persona type, switch to an appropriate persona if possible
  if (role === 'CLIENT' && state.activeUser && state.activeUser.user_role === 'FREELANCER') {
    const clientUser = state.users.find(u => u.user_role === 'CLIENT');
    if (clientUser) state.activeUser = clientUser;
  } else if (role === 'FREELANCER' && state.activeUser && state.activeUser.user_role === 'CLIENT') {
    const freelancerUser = state.users.find(u => u.user_role === 'FREELANCER');
    if (freelancerUser) state.activeUser = freelancerUser;
  }

  // Update header indicators and RBAC visibility
  updateHeaderUserInfo();

  // Show Workspace
  showPageView('view-workspace');

  const displayName = getUserDisplayName(state.activeUser);

  // Open appropriate tab based on chosen role
  if (role === 'CLIENT') {
    switchTab('client-tab');
    showToast(`Client Portal ready for ${displayName}`, 'success');
  } else if (role === 'FREELANCER') {
    switchTab('freelancer-tab');
    showToast(`Freelancer Hub opened! Welcome ${displayName}`, 'success');
  } else if (role === 'ADMIN') {
    switchTab('admin-tab');
    showToast('System Admin Console opened', 'info');
  }
}

// Update Top Header with active user credentials
function updateHeaderUserInfo() {
  if (!state.activeUser) return;

  const initials = getUserInitials(state.activeUser);
  const displayName = getUserDisplayName(state.activeUser);

  const headerAvatar = document.getElementById('header-user-avatar');
  if (headerAvatar) headerAvatar.textContent = initials;

  const headerName = document.getElementById('header-user-name');
  if (headerName) headerName.textContent = displayName;

  const headerRole = document.getElementById('header-user-role');
  if (headerRole) headerRole.textContent = state.activeRole;

  const dropdownName = document.getElementById('dropdown-full-name');
  if (dropdownName) dropdownName.textContent = displayName;

  const dropdownEmail = document.getElementById('dropdown-email');
  if (dropdownEmail) dropdownEmail.textContent = state.activeUser.email || '';

  const dropdownRole = document.getElementById('dropdown-role-badge');
  if (dropdownRole) dropdownRole.textContent = state.activeRole;

  // Refresh persona dropdown options (admin personas hidden from non-admin users)
  populatePersonaDropdown();

  // =========================================================================
  // RBAC AUTHORITY: Admin Console is strictly visible for ADMIN role only.
  // Freelancers and Clients cannot see or access that page.
  // =========================================================================
  const isAdmin = Boolean(state.activeUser && state.activeUser.user_role === 'ADMIN');
  const adminNavBtn = document.getElementById('nav-btn-admin');
  if (adminNavBtn) {
    adminNavBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  }

  // Admin tab section container completely hidden from non-admin DOM visibility
  const adminTabSection = document.getElementById('admin-tab');
  if (adminTabSection) {
    if (!isAdmin) {
      adminTabSection.style.display = 'none';
      adminTabSection.classList.remove('active');
    } else {
      adminTabSection.style.display = '';
    }
  }

  // If a non-admin is currently on admin-tab, redirect them immediately to their portal
  if (!isAdmin && state.currentTab === 'admin-tab') {
    switchTab(state.activeRole === 'FREELANCER' ? 'freelancer-tab' : 'client-tab');
  }
}

// Log Out User
function handleLogout() {
  state.isLoggedIn = false;
  state.activeUser = null;
  showToast('Logged out of Table Ninjas', 'info');
  showPageView('view-login');
}

// -----------------------------------------------------------------------------
// Permanent Account Deletion
// -----------------------------------------------------------------------------
function setupAccountDeletion() {
  const deleteBtn = document.getElementById('btn-dropdown-delete-account');
  const deleteModal = document.getElementById('modal-delete-account');
  const confirmInput = document.getElementById('delete-account-confirm-input');
  const confirmBtn = document.getElementById('btn-confirm-delete-account');
  const targetNameEl = document.getElementById('delete-account-target-name');

  if (deleteBtn && deleteModal) {
    deleteBtn.addEventListener('click', () => {
      document.getElementById('user-dropdown-menu')?.classList.remove('active');
      if (targetNameEl && state.activeUser) {
        targetNameEl.textContent = `${getUserDisplayName(state.activeUser)} (${state.activeUser.email})`;
      }
      if (confirmInput) confirmInput.value = '';
      deleteModal.classList.add('active');
      setTimeout(() => confirmInput?.focus(), 80);
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      const typed = confirmInput ? confirmInput.value.trim() : '';
      if (typed !== 'DELETE') {
        showToast('Please type DELETE in capital letters to confirm account deletion.', 'error');
        confirmInput?.focus();
        return;
      }

      if (!state.activeUser) {
        showToast('No active account session found to delete.', 'error');
        deleteModal?.classList.remove('active');
        return;
      }

      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Deleting Account...';

      try {
        const res = await fetch(`${API_BASE}/auth/delete-account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: state.activeUser.user_id,
            email: state.activeUser.email
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete account');

        deleteModal.classList.remove('active');
        showToast('Your Table Ninjas account has been permanently deleted.', 'info');

        // Remove deleted user from state.users array & dropdown
        const deletedId = state.activeUser.user_id;
        state.users = state.users.filter(u => u.user_id !== deletedId);
        populatePersonaDropdown();

        handleLogout();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = '🗑️ Permanently Delete Account';
      }
    });
  }
}

// -----------------------------------------------------------------------------
// Navigation & Sub-Tabs
// -----------------------------------------------------------------------------
function setupNavigation() {
  const navBtns = document.querySelectorAll('#main-nav .nav-item-btn');
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
      if (!parentPane) return;
      
      parentPane.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
      parentPane.querySelectorAll('.sub-pane').forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

function switchTab(tabId) {
  // Security Enforcement: Authority for admin-tab is restricted to ADMIN only
  if (tabId === 'admin-tab') {
    const isAdmin = Boolean(state.activeUser && state.activeUser.user_role === 'ADMIN');
    if (!isAdmin) {
      showToast('Access Denied: Admin Console requires System Administrator authority.', 'error');
      tabId = state.activeRole === 'FREELANCER' ? 'freelancer-tab' : 'client-tab';
    } else {
      state.activeRole = 'ADMIN';
      updateHeaderUserInfo();
    }
  }

  state.currentTab = tabId;
  document.querySelectorAll('.nav-item-btn').forEach(b => {
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
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        state.skills = data;
      }
    }
  } catch (err) {
    console.warn('Skills endpoint fallback active');
  }

  // Populate skill dropdown in job filter
  const filterSkillSelect = document.getElementById('filter-skill');
  if (filterSkillSelect && Array.isArray(state.skills)) {
    filterSkillSelect.innerHTML = '<option value="">All Skills</option>';
    state.skills.forEach(skill => {
      filterSkillSelect.innerHTML += `<option value="${skill.skill_id}">${skill.skill_name} (${skill.category || 'General'})</option>`;
    });
  }
  
  // Populate skill checkboxes in post job modal
  const postJobSkillsContainer = document.getElementById('job-post-skills-container');
  if (postJobSkillsContainer && Array.isArray(state.skills)) {
    postJobSkillsContainer.innerHTML = '';
    state.skills.forEach(skill => {
      postJobSkillsContainer.innerHTML += `
        <label class="skill-checkbox-label">
          <input type="checkbox" name="skill_ids" value="${skill.skill_id}">
          <span>${skill.skill_name}</span>
        </label>
      `;
    });

    postJobSkillsContainer.addEventListener('change', (e) => {
      if (e.target && e.target.type === 'checkbox') {
        const label = e.target.closest('.skill-checkbox-label');
        if (label) {
          label.classList.toggle('selected', e.target.checked);
        }
      }
    });
  }
}

async function loadUsers() {
  try {
    const res = await fetch(`${API_BASE}/users`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        state.users = data;
      }
    }
  } catch (err) {
    console.warn('Users endpoint fallback active');
  }

  // Populate persona selector respecting RBAC
  populatePersonaDropdown();

  // Default active user initially
  if (!state.activeUser && Array.isArray(state.users) && state.users.length > 0) {
    state.activeUser = state.users[0];
  }
}

// Populate Persona dropdown with strict RBAC visibility (Admin hidden from non-admin accounts)
function populatePersonaDropdown() {
  const personaSelect = document.getElementById('persona-select');
  if (!personaSelect || !Array.isArray(state.users)) return;

  const isAdmin = state.activeUser && state.activeUser.user_role === 'ADMIN';
  const currentVal = state.activeUser ? state.activeUser.user_id : parseInt(personaSelect.value, 10);

  personaSelect.innerHTML = '';
  state.users.forEach(u => {
    // RBAC: Freelancers and Clients are strictly not permitted to see or switch to ADMIN accounts
    if (!isAdmin && u.user_role === 'ADMIN') return;

    const roleBadge = u.user_role === 'CLIENT' ? 'Client' : u.user_role === 'FREELANCER' ? 'Freelancer' : u.user_role === 'ADMIN' ? 'Admin' : 'Dual';
    const opt = document.createElement('option');
    opt.value = u.user_id;
    opt.textContent = `${getUserDisplayName(u)} (${roleBadge}${u.company_name ? ' - ' + u.company_name : ''})`;
    if (u.user_id === currentVal) {
      opt.selected = true;
    }
    personaSelect.appendChild(opt);
  });
}

// Setup Persona switcher change event listener with RBAC enforcement
function setupPersonaSwitcher() {
  const personaSelect = document.getElementById('persona-select');
  if (!personaSelect) return;

  personaSelect.addEventListener('change', (e) => {
    const userId = parseInt(e.target.value, 10);
    const found = state.users.find(u => u.user_id === userId);
    if (!found) return;

    const isAdmin = state.activeUser && state.activeUser.user_role === 'ADMIN';
    if (found.user_role === 'ADMIN' && !isAdmin) {
      showToast('Access Denied: Only administrators have authority to access Admin accounts.', 'error');
      populatePersonaDropdown();
      return;
    }

    state.activeUser = found;
    state.activeRole = state.activeUser.user_role === 'DUAL' ? 'CLIENT' : state.activeUser.user_role;
    updateHeaderUserInfo();
    showToast(`Switched persona to: ${getUserDisplayName(state.activeUser)}`, 'info');

    // Auto-navigate to appropriate view based on persona role
    if (state.activeUser.user_role === 'FREELANCER') {
      switchTab('freelancer-tab');
    } else if (state.activeUser.user_role === 'ADMIN') {
      switchTab('admin-tab');
    } else {
      switchTab('client-tab');
    }
  });
}

// -----------------------------------------------------------------------------
// CLIENT PORTAL LOGIC
// -----------------------------------------------------------------------------
async function loadClientPortal() {
  if (!state.activeUser) return;

  // Update client banner
  const nameEl = document.getElementById('client-banner-name');
  if (nameEl) nameEl.textContent = getUserDisplayName(state.activeUser);

  const compEl = document.getElementById('client-banner-company');
  if (compEl) compEl.textContent = state.activeUser.company_name || 'Individual Client';

  const spendEl = document.getElementById('client-banner-spend');
  if (spendEl) spendEl.textContent = `$${parseFloat(state.activeUser.total_spent || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const jobsEl = document.getElementById('client-banner-jobs-count');
  if (jobsEl) jobsEl.textContent = state.activeUser.jobs_posted_count || 0;

  await loadClientJobs();
  await loadClientContracts();
}

async function loadClientJobs() {
  const tbody = document.getElementById('client-jobs-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">Fetching jobs...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/jobs?client_id=${state.activeUser.user_id}`);
    const data = await res.json();
    state.clientJobs = Array.isArray(data) ? data : [];

    if (state.clientJobs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-dim">No job postings created yet. Click "Post a Job" above.</td></tr>';
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
  if (!container) return;
  container.innerHTML = '<p class="text-center py-4">Fetching active engagements...</p>';

  try {
    const res = await fetch(`${API_BASE}/contracts?client_id=${state.activeUser.user_id}`);
    const data = await res.json();
    state.clientContracts = Array.isArray(data) ? data : [];

    const countEl = document.getElementById('client-banner-contracts-count');
    if (countEl) countEl.textContent = state.clientContracts.filter(c => c.contract_status === 'ACTIVE').length;

    if (state.clientContracts.length === 0) {
      container.innerHTML = '<p class="text-center py-4 text-dim">No active or completed contracts found.</p>';
      return;
    }

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
  const avatarText = getUserInitials(state.activeUser);
  const avatarEl = document.getElementById('freelancer-banner-avatar');
  if (avatarEl) avatarEl.textContent = avatarText;

  const nameEl = document.getElementById('freelancer-banner-name');
  if (nameEl) nameEl.textContent = getUserDisplayName(state.activeUser);

  const titleEl = document.getElementById('freelancer-banner-title');
  if (titleEl) titleEl.textContent = state.activeUser.professional_title || 'Independent Professional';

  const rateEl = document.getElementById('freelancer-banner-rate');
  if (rateEl) rateEl.textContent = `$${parseFloat(state.activeUser.hourly_rate || 65).toFixed(2)}/hr`;

  const ratingEl = document.getElementById('freelancer-banner-rating');
  if (ratingEl) ratingEl.textContent = `⭐ ${parseFloat(state.activeUser.average_rating || 5.0).toFixed(2)} Rating`;

  const compEl = document.getElementById('freelancer-banner-completed');
  if (compEl) compEl.textContent = `${state.activeUser.jobs_completed_count || 0} Jobs Completed`;

  const earnEl = document.getElementById('freelancer-banner-earnings');
  if (earnEl) earnEl.textContent = `$${parseFloat(state.activeUser.total_earnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  await searchFreelancerJobs();
  await loadFreelancerContracts();
  await loadFreelancerProposals();
}

async function searchFreelancerJobs() {
  const container = document.getElementById('freelancer-jobs-container');
  if (!container) return;
  container.innerHTML = '<p class="text-center py-4">Searching open marketplace jobs...</p>';

  let search = document.getElementById('filter-search')?.value.trim() || '';
  const headerInput = document.getElementById('header-global-search');
  const headerType = document.getElementById('header-search-type');
  if (!search && headerInput && headerType && headerType.value === 'jobs' && headerInput.value.trim()) {
    search = headerInput.value.trim();
    const filterInput = document.getElementById('filter-search');
    if (filterInput) filterInput.value = search;
  }

  const skillId = document.getElementById('filter-skill')?.value || '';
  const category = document.getElementById('filter-category')?.value || '';
  const minBudget = document.getElementById('filter-min-budget')?.value || '';
  const maxBudget = document.getElementById('filter-max-budget')?.value || '';

  const params = new URLSearchParams({ job_status: 'OPEN' });
  if (search) params.append('search', search);
  if (skillId) params.append('skill_id', skillId);
  if (category) params.append('category', category);
  if (minBudget) params.append('min_budget', minBudget);
  if (maxBudget) params.append('max_budget', maxBudget);

  try {
    const res = await fetch(`${API_BASE}/jobs?${params.toString()}`);
    const data = await res.json();
    state.freelancerJobs = Array.isArray(data) ? data : [];

    if (state.freelancerJobs.length === 0) {
      container.innerHTML = `<p class="text-center py-4 text-dim">No open jobs match your current search ${search ? 'for "' + escapeHtml(search) + '"' : 'filters'}.</p>`;
      return;
    }

    container.innerHTML = state.freelancerJobs.map(j => {
      const skillsArray = (j.required_skills || '').split(',').map(s => s.trim()).filter(Boolean);
      return `
        <div class="job-card">
          <div class="job-card-header">
            <div>
              <h4 class="job-card-title">${escapeHtml(j.title)}</h4>
              <p class="job-card-client">
                Posted by <strong>${escapeHtml(j.company_name || j.client_name)}</strong> &bull; <span class="badge badge-accent">${escapeHtml(j.category)}</span>
              </p>
            </div>
            <span class="job-card-budget">$${parseFloat(j.budget).toLocaleString()}</span>
          </div>
          <p class="job-card-desc">${escapeHtml(j.description)}</p>
          <div class="job-card-skills">
            ${skillsArray.map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}
          </div>
          <div class="job-card-footer">
            <span>🗓️ Deadline: ${formatDate(j.deadline)} (${j.duration_days} days) &bull; Verified Escrow 🔒</span>
            <button class="btn-ninja-primary btn-sm" onclick="openSubmitProposalModal(${j.job_id}, '${escapeHtml(j.title)}', '${escapeHtml(j.company_name || j.client_name)}', ${j.budget})">
              Apply Now
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
  if (!container) return;
  container.innerHTML = '<p class="text-center py-4">Fetching your active projects...</p>';

  try {
    const res = await fetch(`${API_BASE}/contracts?freelancer_id=${state.activeUser.user_id}`);
    const data = await res.json();
    state.freelancerContracts = Array.isArray(data) ? data : [];

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
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Fetching bids...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/proposals?freelancer_id=${state.activeUser.user_id}`);
    const data = await res.json();
    state.freelancerProposals = Array.isArray(data) ? data : [];

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
  const isAdmin = Boolean(state.activeUser && state.activeUser.user_role === 'ADMIN');
  if (!isAdmin) {
    showToast('Access Denied: Only administrators have authority to access the Admin Console.', 'error');
    switchTab(state.activeRole === 'FREELANCER' ? 'freelancer-tab' : 'client-tab');
    return;
  }

  try {
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    const counts = healthData.counts || {};

    const uEl = document.getElementById('admin-stat-users');
    if (uEl) uEl.textContent = counts.total_users || 0;
    const jEl = document.getElementById('admin-stat-jobs');
    if (jEl) jEl.textContent = counts.total_jobs || 0;
    const cEl = document.getElementById('admin-stat-contracts');
    if (cEl) cEl.textContent = counts.total_contracts || 0;
    const dEl = document.getElementById('admin-stat-disputes');
    if (dEl) dEl.textContent = counts.open_disputes || 0;

    // Load Disputes (Secured via admin_id parameter)
    const disputesRes = await fetch(`${API_BASE}/disputes?admin_id=${state.activeUser.user_id}`);
    if (disputesRes.status === 403) {
      showToast('Access Denied: Only administrators have authority to view disputes.', 'error');
      switchTab(state.activeRole === 'FREELANCER' ? 'freelancer-tab' : 'client-tab');
      return;
    }
    const dData = await disputesRes.json();
    state.disputes = Array.isArray(dData) ? dData : [];
    const disputesTbody = document.getElementById('disputes-tbody');

    if (disputesTbody) {
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
    }

    // Load Users Directory
    const usersTbody = document.getElementById('admin-users-tbody');
    if (usersTbody) {
      usersTbody.innerHTML = state.users.map(u => `
        <tr>
          <td><strong>#${u.user_id}</strong></td>
          <td><strong>${escapeHtml(getUserDisplayName(u))}</strong></td>
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
    }
  } catch (err) {
    showToast('Failed to load administration data', 'error');
  }
}

// -----------------------------------------------------------------------------
// ANALYTICS & COMPLEX SQL REPORTING LOGIC
// -----------------------------------------------------------------------------
async function loadAnalyticsReports(talentSearchQuery = '') {
  const fTbody = document.getElementById('report-freelancers-tbody');
  const cTbody = document.getElementById('report-clients-tbody');

  if (fTbody) fTbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">Executing aggregation query...</td></tr>';
  if (cTbody && !talentSearchQuery) cTbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Executing aggregation query...</td></tr>';

  try {
    // 1. Top Freelancers
    const queryParam = talentSearchQuery ? `?search=${encodeURIComponent(talentSearchQuery)}` : '';
    const fRes = await fetch(`${API_BASE}/reports/top-freelancers${queryParam}`);
    const fData = await fRes.json();
    const topFreelancers = Array.isArray(fData) ? fData : [];

    if (fTbody) {
      if (topFreelancers.length === 0) {
        fTbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-dim">No matching talent found${talentSearchQuery ? ' for "' + escapeHtml(talentSearchQuery) + '"' : ''}.</td></tr>`;
      } else {
        fTbody.innerHTML = topFreelancers.map((f, i) => `
          <tr>
            <td><strong>#${i + 1}</strong></td>
            <td><strong>${escapeHtml(f.freelancer_name || f.full_name || 'Freelancer')}</strong><br><small class="text-dim">${escapeHtml(f.email || '')}</small></td>
            <td>${escapeHtml(f.professional_title || 'Expert')}</td>
            <td><span class="badge badge-success">⭐ ${parseFloat(f.average_rating || 5).toFixed(2)}</span></td>
            <td>${f.reviews_count || 0} Reviews</td>
            <td>${f.jobs_completed_count || 0} Contracts</td>
            <td><strong class="text-success">$${parseFloat(f.total_earnings || 0).toLocaleString()}</strong></td>
            <td><small>${escapeHtml(f.top_skills || 'Full-Stack')}</small></td>
          </tr>
        `).join('');
      }
    }

    // 2. Client Enterprise Summary (only fetch if initial load or without search filter)
    if (!talentSearchQuery) {
      const cRes = await fetch(`${API_BASE}/reports/client-summary`);
      const cData = await cRes.json();
      const clientsSummary = Array.isArray(cData) ? cData : [];

      if (cTbody) {
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
      }
    }
  } catch (err) {
    showToast('Failed to execute analytical queries', 'error');
  }
}

// -----------------------------------------------------------------------------
// MODALS & ACTIONS
// -----------------------------------------------------------------------------
function setupModals() {
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
  const openPostBtn = document.getElementById('btn-open-post-job');
  if (openPostBtn) {
    openPostBtn.addEventListener('click', () => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      const deadlineInput = document.getElementById('job-post-deadline');
      if (deadlineInput) deadlineInput.value = d.toISOString().split('T')[0];
      const modal = document.getElementById('modal-post-job');
      if (modal) modal.classList.add('active');
    });
  }

  // Post Job Form Submit
  const postForm = document.getElementById('form-post-job');
  if (postForm) {
    postForm.addEventListener('submit', async (e) => {
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

        showToast('Project requisition published to Table Ninjas feed!', 'success');
        document.getElementById('modal-post-job').classList.remove('active');
        document.getElementById('form-post-job').reset();
        await loadClientPortal();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Submit Proposal Form Submit
  const proposalForm = document.getElementById('form-submit-proposal');
  if (proposalForm) {
    proposalForm.addEventListener('submit', async (e) => {
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

        showToast('Proposal bid submitted to client!', 'success');
        document.getElementById('modal-submit-proposal').classList.remove('active');
        document.getElementById('form-submit-proposal').reset();
        await loadFreelancerHub();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Submit Milestone Form Submit
  const milestoneForm = document.getElementById('form-submit-milestone');
  if (milestoneForm) {
    milestoneForm.addEventListener('submit', async (e) => {
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

        showToast('Deliverable submitted to client for approval!', 'success');
        document.getElementById('modal-submit-milestone').classList.remove('active');
        document.getElementById('form-submit-milestone').reset();
        await loadFreelancerContracts();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Submit Review Form Submit
  const reviewForm = document.getElementById('form-leave-review');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
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

        showToast('Verified review published to platform!', 'success');
        document.getElementById('modal-leave-review').classList.remove('active');
        document.getElementById('form-leave-review').reset();
        await loadClientContracts();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
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
  if (!container) return;
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
        <div class="ninja-card mb-3" style="border:1px solid var(--border-medium);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div>
              <h4 style="font-size:17px; color:var(--text-dark);">${escapeHtml(p.freelancer_name)}</h4>
              <p class="text-dim" style="font-size:13px;">${escapeHtml(p.professional_title)} &bull; ⭐ ${parseFloat(p.average_rating).toFixed(2)} (${p.jobs_completed_count} completed)</p>
            </div>
            <div style="text-align:right;">
              <span class="text-success" style="font-size:22px; font-weight:800; font-family:var(--font-heading);">$${parseFloat(p.bid_amount).toLocaleString()}</span>
              <div class="text-dim" style="font-size:12px;">Estimated: ${p.estimated_delivery_days} days</div>
            </div>
          </div>
          <div style="background:var(--bg-muted); padding:12px; border-radius:8px; font-size:13px; color:var(--text-body); margin-bottom:14px;">
            ${escapeHtml(p.cover_letter)}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="badge ${isAccepted ? 'badge-success' : isRejected ? 'badge-danger' : 'badge-warning'}">Status: ${p.proposal_status}</span>
            ${job.job_status === 'OPEN' && p.proposal_status === 'SUBMITTED' ? `
              <button class="btn-ninja-primary btn-sm" onclick="awardContract(${p.proposal_id})">
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
  if (!state.activeUser || state.activeUser.user_role !== 'ADMIN') {
    showToast('Access Denied: Only administrators have the authority to arbitrate and resolve disputes.', 'error');
    return;
  }

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
      // Sync back to header search if header search is set to 'jobs'
      const headerInput = document.getElementById('header-global-search');
      const headerType = document.getElementById('header-search-type');
      const filterSearch = document.getElementById('filter-search');
      if (headerInput && headerType && headerType.value === 'jobs' && filterSearch && headerInput.value !== filterSearch.value) {
        headerInput.value = filterSearch.value;
      }
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

  const resetBtn = document.getElementById('btn-reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.getElementById('filter-search').value = '';
      document.getElementById('filter-skill').value = '';
      document.getElementById('filter-category').value = '';
      document.getElementById('filter-min-budget').value = '';
      document.getElementById('filter-max-budget').value = '';

      const headerInput = document.getElementById('header-global-search');
      const headerType = document.getElementById('header-search-type');
      if (headerInput && headerType && headerType.value === 'jobs') {
        headerInput.value = '';
      }

      searchFreelancerJobs();
    });
  }

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
  bindRefresh('btn-refresh-analytics', () => loadAnalyticsReports(''));
}

// -----------------------------------------------------------------------------
// Global Navigation Header Search
// -----------------------------------------------------------------------------
function setupGlobalHeaderSearch() {
  const headerInput = document.getElementById('header-global-search');
  const typeSelect = document.getElementById('header-search-type');
  const filterSearchInput = document.getElementById('filter-search');

  if (!headerInput || !typeSelect) return;

  let headerDebounce = null;

  const executeHeaderSearch = (forceFocus = false) => {
    if (!state.isLoggedIn) return;

    const query = headerInput.value.trim();
    const type = typeSelect.value; // 'jobs' | 'talent'

    if (type === 'jobs') {
      // Switch to freelancer marketplace if not already there
      if (state.currentTab !== 'freelancer-tab') {
        switchTab('freelancer-tab');
      }

      // Ensure 'Explore Jobs' sub-pane is active
      const browseSubTabBtn = document.querySelector('.sub-tab-btn[data-subtab="freelancer-browse-view"]');
      if (browseSubTabBtn && !browseSubTabBtn.classList.contains('active')) {
        browseSubTabBtn.click();
      }

      // Sync value to marketplace feed search input
      if (filterSearchInput && filterSearchInput.value !== query) {
        filterSearchInput.value = query;
      }

      // Trigger jobs search
      searchFreelancerJobs();

      if (forceFocus && filterSearchInput) {
        filterSearchInput.focus();
      }
    } else if (type === 'talent') {
      // Switch to SQL Analytics (Top Freelancers / Talent Leaderboard)
      if (state.currentTab !== 'analytics-tab') {
        switchTab('analytics-tab');
      }

      // Filter the talent leaderboard
      loadAnalyticsReports(query);
    }
  };

  headerInput.addEventListener('input', () => {
    clearTimeout(headerDebounce);
    headerDebounce = setTimeout(() => {
      executeHeaderSearch(false);
    }, 250);
  });

  headerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(headerDebounce);
      executeHeaderSearch(false);
    }
  });

  typeSelect.addEventListener('change', () => {
    // Update placeholder text based on mode
    if (typeSelect.value === 'jobs') {
      headerInput.placeholder = 'Search jobs by title, tech stack (React, Python...), or client...';
    } else {
      headerInput.placeholder = 'Search talent by name, title, skill, or email...';
    }

    if (headerInput.value.trim()) {
      executeHeaderSearch(false);
    }
  });
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
