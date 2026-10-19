/**
 * Authentication Management Module
 */

const Auth = {
  tokenKey: 'lumina_token',
  userKey: 'lumina_user',

  getToken() {
    return localStorage.getItem(this.tokenKey);
  },

  getUser() {
    try {
      const data = localStorage.getItem(this.userKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },

  setSession(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.updateUI();
    if (typeof loadUserOrders === 'function') {
      loadUserOrders();
    }
  },

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.updateUI();
    showToast('Signed out successfully', 'info');
    // If on orders page, redirect home
    if (window.location.pathname.includes('orders.html')) {
      window.location.href = '/index.html';
    }
  },

  openModal(tab = 'login') {
    const modal = document.getElementById('authModalOverlay');
    if (!modal) return;
    this.switchTab(tab);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const modal = document.getElementById('authModalOverlay');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  },

  switchTab(tab) {
    const loginTab = document.getElementById('tabLogin');
    const registerTab = document.getElementById('tabRegister');
    const loginForm = document.getElementById('formLogin');
    const registerForm = document.getElementById('formRegister');

    if (tab === 'login') {
      if (loginTab) loginTab.classList.add('active');
      if (registerTab) registerTab.classList.remove('active');
      if (loginForm) loginForm.style.display = 'block';
      if (registerForm) registerForm.style.display = 'none';
    } else {
      if (registerTab) registerTab.classList.add('active');
      if (loginTab) loginTab.classList.remove('active');
      if (registerForm) registerForm.style.display = 'block';
      if (loginForm) loginForm.style.display = 'none';
    }
  },

  useDemoAccount() {
    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPassword');
    if (emailInput && passInput) {
      emailInput.value = 'demo@store.com';
      passInput.value = 'password123';
      showToast('Demo credentials autofilled!', 'info');
    }
  },

  updateUI() {
    const authContainer = document.getElementById('navAuthContainer');
    if (!authContainer) return;

    const user = this.getUser();

    if (user) {
      const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
      authContainer.innerHTML = `
        <div style="position: relative;">
          <button type="button" class="user-menu-btn" id="btnUserMenu">
            <div class="user-avatar-circle">${initial}</div>
            <span>${user.name.split(' ')[0]}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="user-dropdown" id="userDropdownMenu">
            <div class="user-dropdown-header">
              <div class="name">${user.name}</div>
              <div class="email">${user.email}</div>
            </div>
            <a href="/orders.html" class="user-dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              My Orders
            </a>
            <div class="user-dropdown-item logout" id="btnLogout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sign Out
            </div>
          </div>
        </div>
      `;

      // Setup Dropdown toggle
      const btnMenu = document.getElementById('btnUserMenu');
      const dropdown = document.getElementById('userDropdownMenu');
      if (btnMenu && dropdown) {
        btnMenu.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
          dropdown.classList.remove('show');
        });
      }

      const btnLogout = document.getElementById('btnLogout');
      if (btnLogout) {
        btnLogout.addEventListener('click', () => this.logout());
      }
    } else {
      authContainer.innerHTML = `
        <button type="button" class="btn btn-secondary btn-sm" id="btnOpenAuthModal">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Sign In
        </button>
      `;

      const btnOpen = document.getElementById('btnOpenAuthModal');
      if (btnOpen) {
        btnOpen.addEventListener('click', () => this.openModal('login'));
      }
    }
  },

  init() {
    this.updateUI();

    // Verify token validity on start
    if (this.isLoggedIn()) {
      API.getMe().catch(() => {
        // Token expired or invalid
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this.updateUI();
      });
    }

    // Modal tabs
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    if (tabLogin) tabLogin.addEventListener('click', () => this.switchTab('login'));
    if (tabRegister) tabRegister.addEventListener('click', () => this.switchTab('register'));

    // Modal Close
    const btnCloseModal = document.getElementById('btnCloseAuthModal');
    if (btnCloseModal) btnCloseModal.addEventListener('click', () => this.closeModal());

    const overlay = document.getElementById('authModalOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeModal();
      });
    }

    // Demo Fill button
    const btnDemo = document.getElementById('btnFillDemo');
    if (btnDemo) {
      btnDemo.addEventListener('click', () => this.useDemoAccount());
    }

    // Handle Login Submit
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
      formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = formLogin.querySelector('button[type="submit"]');

        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Signing In...';
          const res = await API.login(email, password);
          this.setSession(res.token, res.user);
          this.closeModal();
          showToast(`Welcome back, ${res.user.name}!`, 'success');
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
        }
      });
    }

    // Handle Register Submit
    const formRegister = document.getElementById('formRegister');
    if (formRegister) {
      formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const submitBtn = formRegister.querySelector('button[type="submit"]');

        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Creating Account...';
          const res = await API.register(name, email, password);
          this.setSession(res.token, res.user);
          this.closeModal();
          showToast(`Account created! Welcome, ${res.user.name}!`, 'success');
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
        }
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});
