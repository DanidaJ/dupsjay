import Keycloak from 'keycloak-js';

// Keycloak configuration
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_AUTH_SERVER_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
};

// Create Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

// User interface for Keycloak
export interface KeycloakUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  roles: string[];
}

// Authentication response interface
export interface AuthResponse {
  success: boolean;
  user?: KeycloakUser;
  token?: string;
  message?: string;
}

class KeycloakService {
  private initialized = false;
  private initPromise: Promise<boolean> | null = null;

  // Initialize Keycloak
  async init(): Promise<boolean> {
    // If already initialized, return the previous result
    if (this.initialized) {
      return keycloak.authenticated || false;
    }

    // If initialization is in progress, wait for it
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start initialization
    this.initPromise = this._performInit();
    return this.initPromise;
  }

  private async _performInit(): Promise<boolean> {
    try {
      const authenticated = await keycloak.init({
        onLoad: 'check-sso',
        checkLoginIframe: false,
        checkLoginIframeInterval: 0,
        pkceMethod: 'S256',
        flow: 'standard',
        responseMode: 'fragment',
        enableLogging: false
      });
      
      this.initialized = true;
      return authenticated;
    } catch (error) {
      console.error('Failed to initialize Keycloak:', error);
      this.initialized = true; // Mark as initialized to prevent retry loops
      return false;
    }
  }

  // Check if Keycloak is initialized
  isInitialized(): boolean {
    return this.initialized;
  }

  // Login user
  async login(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Keycloak not initialized');
    }
    
    await keycloak.login({
      redirectUri: window.location.origin + '/',
      prompt: 'login'
    });
  }

  // Login with username and password (for direct grant)
  async loginWithCredentials(username: string, password: string): Promise<AuthResponse> {
    try {
      // For direct access grant, we need to make a direct request to Keycloak
      const response = await fetch(`${import.meta.env.VITE_KEYCLOAK_AUTH_SERVER_URL}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
          client_secret: import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET,
          username: username,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || 'Login failed');
      }

      const tokenData = await response.json();
      
      // Set the token in Keycloak instance
      keycloak.token = tokenData.access_token;
      keycloak.refreshToken = tokenData.refresh_token;
      keycloak.idToken = tokenData.id_token;
      
      // Store token in localStorage for persistence
      localStorage.setItem('kc_token', tokenData.access_token);
      localStorage.setItem('kc_refresh_token', tokenData.refresh_token);
      
      const user = await this.getCurrentUser();
      
      return {
        success: true,
        user: user || undefined,
        token: tokenData.access_token,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  }

  // Register user (redirect to Keycloak registration)
  async register(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Keycloak not initialized');
    }
    
    await keycloak.register({
      redirectUri: window.location.origin + '/',
    });
  }

  // Register user via API (custom form)
  async registerUser(userData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      // Call backend API to create user in Keycloak
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/keycloak-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      return {
        success: true,
        message: 'Registration successful'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Registration failed',
      };
    }
  }

  // Logout user
  async logout(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Keycloak not initialized');
    }
    
    // Clear local storage
    localStorage.removeItem('kc_token');
    localStorage.removeItem('kc_refresh_token');
    
    await keycloak.logout({
      redirectUri: window.location.origin + '/',
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (!this.initialized) return false;
    
    // Check if we have a token in localStorage
    const token = localStorage.getItem('kc_token');
    if (token) {
      keycloak.token = token;
      const refreshToken = localStorage.getItem('kc_refresh_token');
      if (refreshToken) {
        keycloak.refreshToken = refreshToken;
      }
    }
    
    return keycloak.authenticated || !!token;
  }

  // Get current user information
  async getCurrentUser(): Promise<KeycloakUser | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      // Load user profile
      const profile = await keycloak.loadUserProfile();
      
      // Get user roles
      const roles = this.getUserRoles();
      
      return {
        id: profile.id || '',
        username: profile.username || '',
        email: profile.email || '',
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username || '',
        roles,
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  // Get user roles
  getUserRoles(): string[] {
    if (!keycloak.tokenParsed) return [];
    
    const realmRoles = keycloak.tokenParsed.realm_access?.roles || [];
    const clientRoles = keycloak.tokenParsed.resource_access?.[import.meta.env.VITE_KEYCLOAK_CLIENT_ID]?.roles || [];
    
    return [...realmRoles, ...clientRoles];
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  // Get access token
  getToken(): string | undefined {
    return keycloak.token || localStorage.getItem('kc_token') || undefined;
  }

  // Update token
  async updateToken(): Promise<boolean> {
    if (!this.initialized) return false;
    
    try {
      const refreshed = await keycloak.updateToken(30);
      if (refreshed) {
        localStorage.setItem('kc_token', keycloak.token || '');
        localStorage.setItem('kc_refresh_token', keycloak.refreshToken || '');
      }
      return refreshed;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }

  // Account management (redirect to Keycloak account page)
  accountManagement(): void {
    if (!this.initialized) {
      throw new Error('Keycloak not initialized');
    }
    keycloak.accountManagement();
  }
}

// Create and export a singleton instance
const keycloakService = new KeycloakService();
export default keycloakService;

// Also export the keycloak instance for direct access if needed
export { keycloak };