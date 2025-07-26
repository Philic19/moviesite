// Test utilities for authentication system
// This file helps you test the auth system without a real Supabase connection

class MockSupabase {
  constructor() {
    this.users = new Map();
    this.currentUser = null;
    this.authCallbacks = [];
  }

  auth = {
    signUp: async ({ email, password }) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (this.users.has(email)) {
        return { 
          data: null, 
          error: { message: 'User already exists' } 
        };
      }

      const user = {
        id: 'user_' + Date.now(),
        email,
        created_at: new Date().toISOString()
      };

      this.users.set(email, { ...user, password });
      
      return { 
        data: { user }, 
        error: null 
      };
    },

    signInWithPassword: async ({ email, password }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const userData = this.users.get(email);
      if (!userData || userData.password !== password) {
        return { 
          data: null, 
          error: { message: 'Invalid email or password' } 
        };
      }

      this.currentUser = { ...userData };
      delete this.currentUser.password;

      // Trigger auth state change
      this.authCallbacks.forEach(callback => {
        callback('SIGNED_IN', { user: this.currentUser });
      });

      return { 
        data: { user: this.currentUser }, 
        error: null 
      };
    },

    signOut: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.currentUser = null;
      
      // Trigger auth state change
      this.authCallbacks.forEach(callback => {
        callback('SIGNED_OUT', null);
      });

      return { error: null };
    },

    getUser: async () => {
      return { 
        data: { user: this.currentUser }, 
        error: null 
      };
    },

    onAuthStateChange: (callback) => {
      this.authCallbacks.push(callback);
      return { data: { subscription: {} } };
    }
  };

  from(table) {
    return {
      select: () => ({
        eq: () => ({
          data: [],
          error: null
        })
      }),
      insert: () => ({
        data: null,
        error: null
      }),
      delete: () => ({
        eq: () => ({
          data: null,
          error: null
        })
      })
    };
  }
}

// Test mode detection and setup
function setupTestMode() {
  // Check if we're in test mode (no real Supabase credentials)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl.includes('your_supabase') || 
      supabaseKey.includes('your_supabase')) {
    
    console.log('🧪 Running in TEST MODE - Using mock authentication');
    
    // Replace the real supabase with mock
    window.mockSupabase = new MockSupabase();
    
    // Show test mode indicator
    showTestModeIndicator();
    
    return true;
  }
  
  return false;
}

function showTestModeIndicator() {
  const indicator = document.createElement('div');
  indicator.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(45deg, #ff6b6b, #feca57);
      color: white;
      text-align: center;
      padding: 8px;
      font-weight: bold;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    ">
      🧪 TEST MODE - Mock Authentication Active | 
      <span style="font-size: 12px; opacity: 0.9;">
        Try: test@example.com / password123
      </span>
    </div>
  `;
  
  document.body.appendChild(indicator);
  
  // Adjust body padding to account for indicator
  document.body.style.paddingTop = '100px';
}

// Auto-setup when script loads
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    setupTestMode();
  });
}

export { setupTestMode, MockSupabase };