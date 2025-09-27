// OAuth2 flow for Raindrop.io authentication

class RaindropOAuth {
  constructor() {
    this.AUTHORIZE_URL = 'https://raindrop.io/oauth/authorize';
    this.TOKEN_URL = 'https://raindrop.io/oauth/access_token';
    this.API_BASE = 'https://api.raindrop.io/rest/v1';
    this.DEFAULT_MANAGED_BASE = 'https://raindrop-oauth.daiquiri.dev';
    this.MANAGED_ENABLED = false; // temporarily disabled
  }

  async startAuthFlow() {
    try {
      const config = await chrome.storage.sync.get(['clientId','managedOAuth','managedOAuthBaseUrl']);

      // Managed mode via Cloudflare Worker
      if (config.managedOAuth && this.MANAGED_ENABLED) {
        return await this.startManagedAuthFlow(config.managedOAuthBaseUrl || this.DEFAULT_MANAGED_BASE);
      }

      // Local (direct) mode
      if (!config.clientId) {
        throw new Error('Client ID must be configured first');
      }

      // Use chrome.identity.getRedirectURL() to get the proper redirect URI
      const redirectUri = chrome.identity.getRedirectURL();
      console.log('Using redirect URI:', redirectUri);

      // Generate state parameter for security
      const state = this.generateRandomString(32);
      await chrome.storage.local.set({ oauthState: state });

      // Build authorization URL
      const authUrl = new URL(this.AUTHORIZE_URL);
      authUrl.searchParams.append('client_id', config.clientId);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('state', state);

      console.log('Starting OAuth with URL:', authUrl.toString());

      // Launch the OAuth flow using chrome.identity
      const redirectUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl.toString(),
        interactive: true
      });

      console.log('OAuth redirect URL received:', redirectUrl);

      // Parse the authorization code from the redirect URL
      const urlParams = new URL(redirectUrl);
      const code = urlParams.searchParams.get('code');
      const returnedState = urlParams.searchParams.get('state');
      const error = urlParams.searchParams.get('error');

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      // Verify state parameter
      const { oauthState } = await chrome.storage.local.get(['oauthState']);
      if (returnedState !== oauthState) {
        throw new Error('Invalid state parameter');
      }

      // Exchange authorization code for access token
      await this.exchangeCodeForToken(code, redirectUri);

      // Clean up state
      await chrome.storage.local.remove(['oauthState']);

      return { success: true, message: 'Authentication successful' };

    } catch (error) {
      console.error('OAuth flow failed:', error);
      throw error;
    }
  }

  async startManagedAuthFlow(baseUrl) {
    // Start OAuth via Cloudflare Worker proxy
    const redirectUri = chrome.identity.getRedirectURL();
    const startUrl = new URL(baseUrl.replace(/\/$/, '') + '/auth/start');
    startUrl.searchParams.set('ext_redirect', redirectUri);

    const redirectUrl = await chrome.identity.launchWebAuthFlow({
      url: startUrl.toString(),
      interactive: true
    });

    // Expect session_code on the redirect back to the extension
    const urlParams = new URL(redirectUrl);
    const sessionCode = urlParams.searchParams.get('session_code');
    const error = urlParams.searchParams.get('error');
    if (error) throw new Error(`OAuth error: ${error}`);
    if (!sessionCode) throw new Error('No session code received');

    // Exchange session_code for tokens via Worker
    const fetchUrl = new URL(baseUrl.replace(/\/$/, '') + '/auth/fetch');
    fetchUrl.searchParams.set('session_code', sessionCode);
    const res = await fetch(fetchUrl.toString(), { method: 'GET' });
    if (!res.ok) throw new Error(`Failed to fetch tokens: ${res.status}`);
    const tokenData = await res.json();

    await chrome.storage.sync.set({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: Date.now() + (tokenData.expires_in * 1000)
    });

    return { success: true, message: 'Authentication successful' };
  }

  async exchangeCodeForToken(authCode, redirectUri) {
    try {
      const config = await chrome.storage.sync.get(['clientId', 'clientSecret']);

      const response = await fetch(this.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: redirectUri,
          code: authCode,
          grant_type: 'authorization_code'
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${response.status} - ${errorData}`);
      }

      const tokenData = await response.json();

      // Save tokens to storage
      await chrome.storage.sync.set({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: Date.now() + (tokenData.expires_in * 1000)
      });

      console.log('Access token obtained and saved');
      return tokenData;

    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  }

  async refreshAccessToken() {
    try {
      const config = await chrome.storage.sync.get(['clientId', 'clientSecret', 'refreshToken', 'managedOAuth', 'managedOAuthBaseUrl']);

      if (!config.refreshToken) {
        throw new Error('No refresh token available');
      }

      // Managed mode: refresh via Worker
      let response;
      if (config.managedOAuth && this.MANAGED_ENABLED) {
        const base = (config.managedOAuthBaseUrl || this.DEFAULT_MANAGED_BASE).replace(/\/$/, '');
        response = await fetch(base + '/token/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: config.refreshToken })
        });
      } else {
        // Local mode: refresh directly with Raindrop (requires client secret)
        response = await fetch(this.TOKEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            refresh_token: config.refreshToken,
            grant_type: 'refresh_token'
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token refresh failed: ${response.status} - ${errorData}`);
      }

      const tokenData = await response.json();

      // Update tokens in storage
      await chrome.storage.sync.set({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || config.refreshToken,
        tokenExpiresAt: Date.now() + (tokenData.expires_in * 1000)
      });

      console.log('Access token refreshed successfully');
      return tokenData.access_token;

    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear invalid tokens
      await chrome.storage.sync.remove(['accessToken', 'refreshToken', 'tokenExpiresAt']);
      throw error;
    }
  }

  async testConnection() {
    try {
      const { accessToken } = await chrome.storage.sync.get(['accessToken']);

      if (!accessToken) {
        return { success: false, message: 'No access token available' };
      }

      const response = await fetch(`${this.API_BASE}/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        return {
          success: true,
          message: 'Connection successful',
          user: userData.user
        };
      } else {
        return {
          success: false,
          message: `Connection failed: ${response.status}`
        };
      }

    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error.message}`
      };
    }
  }

  async logout() {
    try {
      // Clear all stored tokens and auth data
      await chrome.storage.sync.remove([
        'accessToken',
        'refreshToken',
        'tokenExpiresAt'
      ]);

      await chrome.storage.local.remove(['oauthState']);

      console.log('Logout successful - all tokens cleared');
      return { success: true, message: 'Logged out successfully' };

    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async isAuthenticated() {
    try {
      const { accessToken, tokenExpiresAt } = await chrome.storage.sync.get(['accessToken', 'tokenExpiresAt']);

      if (!accessToken) {
        return false;
      }

      // Check if token is expired
      if (tokenExpiresAt && Date.now() > tokenExpiresAt) {
        console.log('Token expired, attempting refresh');
        try {
          await this.refreshAccessToken();
          return true;
        } catch (error) {
          console.log('Token refresh failed');
          return false;
        }
      }

      return true;

    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }
}

// Export for use in other modules
window.RaindropOAuth = RaindropOAuth;
