import { auth } from './supabase.js';

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.authModal = null;
    this.profileModal = null;
    this.init();
  }

  async init() {
    // Check if user is already logged in
    const { user } = await auth.getCurrentUser();
    this.currentUser = user;
    this.updateUI();

    // Listen for auth state changes
    auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user || null;
      this.updateUI();
      
      if (event === 'SIGNED_IN') {
        this.showMessage('Successfully signed in!', 'success');
        this.closeAuthModal();
      } else if (event === 'SIGNED_OUT') {
        this.showMessage('Successfully signed out!', 'success');
      }
    });

    this.createAuthModal();
    this.createProfileModal();
    this.setupEventListeners();
  }

  updateUI() {
    const authButton = document.getElementById('auth-button');
    const userProfile = document.getElementById('user-profile');
    
    if (this.currentUser) {
      // User is logged in
      if (authButton) {
        authButton.style.display = 'none';
      }
      if (userProfile) {
        userProfile.style.display = 'flex';
        const userEmail = userProfile.querySelector('.user-email');
        if (userEmail) {
          userEmail.textContent = this.currentUser.email;
        }
      }
    } else {
      // User is not logged in
      if (authButton) {
        authButton.style.display = 'block';
      }
      if (userProfile) {
        userProfile.style.display = 'none';
      }
    }
  }

  createAuthModal() {
    const modalHTML = `
      <div id="auth-modal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 400px;">
          <span class="close" id="auth-modal-close">&times;</span>
          <div id="auth-tabs" style="display: flex; margin-bottom: 20px; border-bottom: 1px solid #333;">
            <button id="login-tab" class="auth-tab active" style="flex: 1; padding: 10px; background: none; border: none; color: #fff; cursor: pointer; border-bottom: 2px solid #f39c12;">Login</button>
            <button id="signup-tab" class="auth-tab" style="flex: 1; padding: 10px; background: none; border: none; color: #fff; cursor: pointer; border-bottom: 2px solid transparent;">Sign Up</button>
          </div>
          
          <div id="login-form" class="auth-form">
            <h2 style="margin-bottom: 20px; text-align: center;">Login</h2>
            <form id="login-form-element">
              <div style="margin-bottom: 15px;">
                <label for="login-email" style="display: block; margin-bottom: 5px;">Email:</label>
                <input type="email" id="login-email" required style="width: 100%; padding: 10px; border: 1px solid #333; border-radius: 5px; background: #222; color: #fff;">
              </div>
              <div style="margin-bottom: 20px;">
                <label for="login-password" style="display: block; margin-bottom: 5px;">Password:</label>
                <input type="password" id="login-password" required style="width: 100%; padding: 10px; border: 1px solid #333; border-radius: 5px; background: #222; color: #fff;">
              </div>
              <button type="submit" style="width: 100%; padding: 12px; background: #f39c12; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Login</button>
            </form>
          </div>
          
          <div id="signup-form" class="auth-form" style="display: none;">
            <h2 style="margin-bottom: 20px; text-align: center;">Sign Up</h2>
            <form id="signup-form-element">
              <div style="margin-bottom: 15px;">
                <label for="signup-email" style="display: block; margin-bottom: 5px;">Email:</label>
                <input type="email" id="signup-email" required style="width: 100%; padding: 10px; border: 1px solid #333; border-radius: 5px; background: #222; color: #fff;">
              </div>
              <div style="margin-bottom: 15px;">
                <label for="signup-password" style="display: block; margin-bottom: 5px;">Password:</label>
                <input type="password" id="signup-password" required minlength="6" style="width: 100%; padding: 10px; border: 1px solid #333; border-radius: 5px; background: #222; color: #fff;">
              </div>
              <div style="margin-bottom: 20px;">
                <label for="signup-confirm-password" style="display: block; margin-bottom: 5px;">Confirm Password:</label>
                <input type="password" id="signup-confirm-password" required minlength="6" style="width: 100%; padding: 10px; border: 1px solid #333; border-radius: 5px; background: #222; color: #fff;">
              </div>
              <button type="submit" style="width: 100%; padding: 12px; background: #f39c12; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Sign Up</button>
            </form>
          </div>
          
          <div id="auth-message" style="margin-top: 15px; padding: 10px; border-radius: 5px; display: none;"></div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.authModal = document.getElementById('auth-modal');
  }

  createProfileModal() {
    const modalHTML = `
      <div id="profile-modal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 400px;">
          <span class="close" id="profile-modal-close">&times;</span>
          <h2 style="margin-bottom: 20px; text-align: center;">User Profile</h2>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email:</label>
            <p id="profile-email" style="padding: 10px; background: #333; border-radius: 5px; margin: 0;"></p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Member Since:</label>
            <p id="profile-created-at" style="padding: 10px; background: #333; border-radius: 5px; margin: 0;"></p>
          </div>
          
          <button id="logout-button" style="width: 100%; padding: 12px; background: #dc3545; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Logout</button>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.profileModal = document.getElementById('profile-modal');
  }

  setupEventListeners() {
    // Auth modal events
    document.getElementById('auth-modal-close').addEventListener('click', () => this.closeAuthModal());
    document.getElementById('login-tab').addEventListener('click', () => this.switchTab('login'));
    document.getElementById('signup-tab').addEventListener('click', () => this.switchTab('signup'));
    
    // Form submissions
    document.getElementById('login-form-element').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('signup-form-element').addEventListener('submit', (e) => this.handleSignup(e));
    
    // Profile modal events
    document.getElementById('profile-modal-close').addEventListener('click', () => this.closeProfileModal());
    document.getElementById('logout-button').addEventListener('click', () => this.handleLogout());
    
    // Close modals when clicking outside
    this.authModal.addEventListener('click', (e) => {
      if (e.target === this.authModal) this.closeAuthModal();
    });
    
    this.profileModal.addEventListener('click', (e) => {
      if (e.target === this.profileModal) this.closeProfileModal();
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAuthModal();
        this.closeProfileModal();
      }
    });
  }

  openAuthModal() {
    this.authModal.style.display = 'flex';
    document.getElementById('login-email').focus();
  }

  closeAuthModal() {
    this.authModal.style.display = 'none';
    this.clearForms();
    this.hideMessage();
  }

  openProfileModal() {
    if (!this.currentUser) return;
    
    document.getElementById('profile-email').textContent = this.currentUser.email;
    document.getElementById('profile-created-at').textContent = 
      new Date(this.currentUser.created_at).toLocaleDateString();
    
    this.profileModal.style.display = 'flex';
  }

  closeProfileModal() {
    this.profileModal.style.display = 'none';
  }

  switchTab(tab) {
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (tab === 'login') {
      loginTab.classList.add('active');
      signupTab.classList.remove('active');
      loginTab.style.borderBottomColor = '#f39c12';
      signupTab.style.borderBottomColor = 'transparent';
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
      document.getElementById('login-email').focus();
    } else {
      signupTab.classList.add('active');
      loginTab.classList.remove('active');
      signupTab.style.borderBottomColor = '#f39c12';
      loginTab.style.borderBottomColor = 'transparent';
      signupForm.style.display = 'block';
      loginForm.style.display = 'none';
      document.getElementById('signup-email').focus();
    }
    
    this.clearForms();
    this.hideMessage();
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    this.showMessage('Signing in...', 'info');
    
    const { data, error } = await auth.signIn(email, password);
    
    if (error) {
      this.showMessage(error.message, 'error');
    }
  }

  async handleSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    if (password !== confirmPassword) {
      this.showMessage('Passwords do not match', 'error');
      return;
    }
    
    this.showMessage('Creating account...', 'info');
    
    const { data, error } = await auth.signUp(email, password);
    
    if (error) {
      this.showMessage(error.message, 'error');
    } else {
      this.showMessage('Account created successfully! Please check your email to verify your account.', 'success');
    }
  }

  async handleLogout() {
    const { error } = await auth.signOut();
    
    if (error) {
      this.showMessage('Error signing out: ' + error.message, 'error');
    } else {
      this.closeProfileModal();
    }
  }

  showMessage(message, type) {
    const messageEl = document.getElementById('auth-message');
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    
    // Set colors based on type
    switch (type) {
      case 'success':
        messageEl.style.backgroundColor = '#28a745';
        messageEl.style.color = '#fff';
        break;
      case 'error':
        messageEl.style.backgroundColor = '#dc3545';
        messageEl.style.color = '#fff';
        break;
      case 'info':
        messageEl.style.backgroundColor = '#17a2b8';
        messageEl.style.color = '#fff';
        break;
      default:
        messageEl.style.backgroundColor = '#333';
        messageEl.style.color = '#fff';
    }
  }

  hideMessage() {
    document.getElementById('auth-message').style.display = 'none';
  }

  clearForms() {
    document.getElementById('login-form-element').reset();
    document.getElementById('signup-form-element').reset();
  }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.authManager = new AuthManager();
});