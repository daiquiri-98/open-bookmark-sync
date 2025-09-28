// Options page functionality (clean rebuild)

class OptionsManager {
  constructor() {
    this.oauth = new RaindropOAuth();
    this.messageQueue = [];
    this.currentMessageTimeout = null;
    this.initializeElements();
    this.bindEvents();
    this.loadSettings();
    this.updateAuthStatus();
    this.loadSupportLinks();
    const initialTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'api';
    this.showTab(initialTab);
    this.startTokenHealthCheck();

    // Auto-check Worker status on load
    setTimeout(() => this.autoCheckWorker(), 1000);
  }

  initializeElements() {
    this.elements = {
      clientId: document.getElementById('clientId'),
      clientSecret: document.getElementById('clientSecret'),
      managedOAuth: document.getElementById('managedOAuth'),
      managedOAuthBaseUrl: document.getElementById('managedOAuthBaseUrl'),
      managedBaseEdit: document.getElementById('managedBaseEdit'),
      checkWorker: document.getElementById('checkWorker'),
      workerStatus: document.getElementById('workerStatus'),
      viewAuthState: document.getElementById('viewAuthState'),
      runHealthCheck: document.getElementById('runHealthCheck'),
      clearTokens: document.getElementById('clearTokens'),
      authStateOut: document.getElementById('authStateOut'),
      toggleClientId: document.getElementById('toggleClientId'),
      toggleClientSecret: document.getElementById('toggleClientSecret'),
      redirectUri: document.getElementById('redirectUri'),
      redirectReset: document.getElementById('redirectReset'),
      redirectHint: document.getElementById('redirectHint'),
      saveConfig: document.getElementById('saveConfig'),
      authenticateManaged: document.getElementById('authenticateManaged'),
      authenticateManual: document.getElementById('authenticateManual'),
      manualAuthSection: document.getElementById('manualAuthSection'),
      manualConfigSection: document.getElementById('manualConfigSection'),
      manualConfigDetails: document.getElementById('manualConfigDetails'),
      toggleManualConfig: document.getElementById('toggleManualConfig'),
      closePrivacyNotice: document.getElementById('closePrivacyNotice'),
      privacyNotice: document.getElementById('privacyNotice'),
      authStatus: document.getElementById('authStatus'),
      statusDetails: document.getElementById('statusDetails'),
      authProgress: document.getElementById('authProgress'),
      authProgressFill: document.getElementById('authProgressFill'),
      testConnection: document.getElementById('testConnection'),
      logout: document.getElementById('logout'),
      syncNow: document.getElementById('syncNow'),
      statusMessage: document.getElementById('statusMessage'),
      statusIndicator: document.getElementById('statusIndicator'),
      authStatusText: document.getElementById('authStatusText'),
      userInfo: document.getElementById('userInfo'),
      lastSyncTime: document.getElementById('lastSyncTime'),
      syncInterval: document.getElementById('syncInterval'),
      targetFolderSelect: document.getElementById('targetFolderSelect'),
      autoSyncInfo: document.getElementById('autoSyncInfo'),
      collectionsSortSelect: document.getElementById('collectionsSortSelect'),
      bookmarksSortSelect: document.getElementById('bookmarksSortSelect'),
      rateLimitRpm: document.getElementById('rateLimitRpm'),
      syncModeSelect: document.getElementById('syncModeSelect'),
      // collections chooser
      importAll: document.getElementById('importAll'),
      collectionsList: document.getElementById('collectionsList'),
      collectionsSearch: document.getElementById('collectionsSearch'),
      selectAllCollections: document.getElementById('selectAllCollections'),
      clearCollections: document.getElementById('clearCollections'),
      refreshCollections: document.getElementById('refreshCollections'),
      cleanupDuplicates: document.getElementById('cleanupDuplicates'),
      clearAllBookmarks: document.getElementById('clearAllBookmarks')
    };
  }

  bindEvents() {
    const E = this.elements;
    E.saveConfig && E.saveConfig.addEventListener('click', () => this.saveConfiguration());
    E.authenticateManaged && E.authenticateManaged.addEventListener('click', () => this.authenticateManaged());
    E.authenticateManual && E.authenticateManual.addEventListener('click', () => this.authenticateManual());
    E.testConnection && E.testConnection.addEventListener('click', () => this.testConnection());
    E.logout && E.logout.addEventListener('click', () => this.logout());
    E.syncNow && E.syncNow.addEventListener('click', () => this.syncNow());

    // Auto-save on input change
    [E.clientId, E.clientSecret, E.managedOAuthBaseUrl].forEach(input => { input && input.addEventListener('input', () => this.saveConfiguration()); });
    // Managed OAuth is disabled in UI; keep handler but will be no-op
    E.managedOAuth && E.managedOAuth.addEventListener('change', () => this.onManagedToggle());
    E.managedBaseEdit && E.managedBaseEdit.addEventListener('click', () => this.toggleManagedBaseEdit());
    E.toggleManualConfig && E.toggleManualConfig.addEventListener('click', () => this.toggleManualConfig());
    E.closePrivacyNotice && E.closePrivacyNotice.addEventListener('click', () => this.closePrivacyNotice());
    E.redirectReset && E.redirectReset.addEventListener('click', () => this.resetRedirectUri());
    E.redirectUri && E.redirectUri.addEventListener('input', () => this.validateRedirectUri());
    E.viewAuthState && E.viewAuthState.addEventListener('click', () => this.viewAuthState());
    E.runHealthCheck && E.runHealthCheck.addEventListener('click', () => this.runHealthCheckUI());
    E.clearTokens && E.clearTokens.addEventListener('click', () => this.clearTokens());

    E.toggleClientId && E.toggleClientId.addEventListener('click', () => this.toggleSecret(E.clientId, E.toggleClientId));
    E.toggleClientSecret && E.toggleClientSecret.addEventListener('click', () => this.toggleSecret(E.clientSecret, E.toggleClientSecret));

    E.syncInterval && E.syncInterval.addEventListener('change', () => this.saveSyncOptions());
    E.syncInterval && E.syncInterval.addEventListener('input', () => this.previewSyncInterval());

    E.targetFolderSelect && E.targetFolderSelect.addEventListener('change', () => this.saveTargetFolder());
    E.collectionsSortSelect && E.collectionsSortSelect.addEventListener('change', () => this.saveSorting());
    E.bookmarksSortSelect && E.bookmarksSortSelect.addEventListener('change', () => this.saveSorting());

    E.rateLimitRpm && E.rateLimitRpm.addEventListener('change', () => this.saveRateLimit());
    E.rateLimitRpm && E.rateLimitRpm.addEventListener('input', () => this.saveRateLimitDebounced());

    E.syncModeSelect && E.syncModeSelect.addEventListener('change', () => this.saveSyncMode());

    // Sync enable/disable
    const syncEnabled = document.getElementById('syncEnabled');
    syncEnabled && syncEnabled.addEventListener('change', () => this.onSyncEnabledToggle());

    // Import/Export
    const exportBookmarks = document.getElementById('exportBookmarks');
    const importBookmarks = document.getElementById('importBookmarks');
    const importFile = document.getElementById('importFile');

    exportBookmarks && exportBookmarks.addEventListener('click', () => this.exportBookmarks());
    importBookmarks && importBookmarks.addEventListener('click', () => this.importBookmarks());
    importFile && importFile.addEventListener('change', () => this.onImportFileSelected());

    // Collections chooser
    const topLevelOnly = document.getElementById('topLevelOnly');
    topLevelOnly && topLevelOnly.addEventListener('change', () => this.onTopLevelOnlyToggle());
    E.collectionsSearch && E.collectionsSearch.addEventListener('input', () => this.filterCollections());
    E.selectAllCollections && E.selectAllCollections.addEventListener('click', () => this.setAllCollections(true));
    E.clearCollections && E.clearCollections.addEventListener('click', () => this.setAllCollections(false));
    E.refreshCollections && E.refreshCollections.addEventListener('click', () => this.refreshAll());
    E.cleanupDuplicates && E.cleanupDuplicates.addEventListener('click', () => this.cleanupDuplicates());
    E.clearAllBookmarks && E.clearAllBookmarks.addEventListener('click', () => this.clearAllBookmarks());

    // Clear confirmation form elements
    const clearConfirmText = document.getElementById('clearConfirmText');
    const executeClear = document.getElementById('executeClear');
    const cancelClear = document.getElementById('cancelClear');
    const downloadBackup = document.getElementById('downloadBackup');

    clearConfirmText && clearConfirmText.addEventListener('input', () => this.onClearConfirmTextChange());
    executeClear && executeClear.addEventListener('click', () => this.executeClear());
    cancelClear && cancelClear.addEventListener('click', () => this.cancelClear());
    downloadBackup && downloadBackup.addEventListener('click', (e) => {
      e.preventDefault();
      this.downloadBackup();
    });

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.showTab(btn.dataset.tab));
    });

    // Sidebar nav
    document.querySelectorAll('.side-link').forEach(btn => {
      btn.addEventListener('click', () => this.showTab(btn.dataset.tab));
    });
  }

  async checkWorker() {
    const base = (this.elements.managedOAuthBaseUrl?.value || '').replace(/\/$/, '');
    const status = this.elements.workerStatus;
    if (!base) {
      if (status) status.textContent = 'Enter base URL first.';
      return { healthy: false, error: 'No base URL provided' };
    }

    try {
      if (status) status.textContent = 'Checking…';

      const healthCheck = {
        envCheck: false,
        responseTime: 0,
        version: null,
        lastError: null
      };

      const startTime = Date.now();
      const res = await fetch(base + '/env-ok', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      healthCheck.responseTime = Date.now() - startTime;

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('HTTP ' + res.status);

      console.log('Worker /env-ok response:', json);

      healthCheck.envCheck = !!(json.hasClientId && json.hasClientSecret && json.hasSessionSecret);
      healthCheck.version = json.version || 'unknown';

      // Additional checks for response format
      if (json.responseFormat) {
        healthCheck.responseFormat = json.responseFormat;
      }

      const isHealthy = healthCheck.envCheck && healthCheck.responseTime < 5000;

      if (status) {
        status.textContent = isHealthy
          ? `✅ Worker OK (${healthCheck.responseTime}ms)`
          : '❌ Worker has issues';
        status.style.color = isHealthy ? '#28a745' : '#dc3545';
      }

      if (!healthCheck.envCheck) {
        const suggestions = [
          'Check RAINDROP_CLIENT_ID is set in your Cloudflare Worker',
          'Check RAINDROP_CLIENT_SECRET is set in your Cloudflare Worker',
          'Check SESSION_SECRET is set in your Cloudflare Worker',
          'Redeploy your Cloudflare Worker with the correct environment variables'
        ];
        this.showDetailedError('Worker Configuration Issue', 'Worker is missing required environment variables', suggestions);
      } else if (healthCheck.responseTime > 3000) {
        this.showMessage(`Worker is slow (${healthCheck.responseTime}ms). This may affect authentication performance.`, 'info');
      }

      return { healthy: isHealthy, ...healthCheck };

    } catch (e) {
      if (status) {
        status.textContent = '❌ Worker unreachable';
        status.style.color = '#dc3545';
      }

      const suggestions = [
        'Check if the Cloudflare Worker URL is correct',
        'Verify the Worker is deployed and running',
        'Check your internet connection',
        'Try the Worker URL directly in your browser'
      ];
      this.showDetailedError('Worker Connection Failed', e?.message || 'Unknown error', suggestions);

      return { healthy: false, error: e?.message || e };
    }
  }

  toggleSecret(inputEl, btnEl) {
    if (!inputEl || !btnEl) return;
    const show = inputEl.type === 'password';
    inputEl.type = show ? 'text' : 'password';
    btnEl.textContent = show ? 'Hide' : 'Show';
  }

  async loadSettings() {
    try {
      const config = await chrome.storage.sync.get([
        'clientId','clientSecret','managedOAuth','managedOAuthBaseUrl','redirectUri','lastSyncTime','syncIntervalMinutes','targetFolderId',
        'collectionsSort','bookmarksSort','rateLimitRpm','twoWayMode',
        'selectedCollectionIds','syncEnabled','topLevelOnly'
      ]);

      const E = this.elements;
      if (config.clientId) E.clientId.value = config.clientId;
      if (config.clientSecret) E.clientSecret.value = config.clientSecret;
      // Force managed OAuth off in UI for now
      if (E.managedOAuth) {
        E.managedOAuth.disabled = false;
        E.managedOAuth.checked = (config.managedOAuth ?? true); // default ON
      }
      if (E.managedOAuthBaseUrl) {
        const defaultBase = 'https://rdoauth.daiquiri.dev';
        E.managedOAuthBaseUrl.value = config.managedOAuthBaseUrl || defaultBase;
        // Lock by default; can unlock via Edit button
        E.managedOAuthBaseUrl.disabled = true;
        if (E.managedBaseEdit) E.managedBaseEdit.textContent = 'Edit';
      }
      this.updateManagedUi();

      if (E.redirectUri) {
        if (config.redirectUri) {
          E.redirectUri.value = config.redirectUri;
        } else if (chrome.identity && chrome.identity.getRedirectURL) {
          E.redirectUri.value = chrome.identity.getRedirectURL();
        }
        this.validateRedirectUri();
      }

      if (config.lastSyncTime && E.lastSyncTime) {
        const lastSync = new Date(config.lastSyncTime);
        E.lastSyncTime.textContent = `Last sync: ${lastSync.toLocaleString()}`;
      }

      const minutes = Math.max(1, Number(config.syncIntervalMinutes) || 5);
      if (E.syncInterval) E.syncInterval.value = String(minutes);
      this.updateAutoSyncInfo(minutes);

      await this.populateFolderSelect(String(config.targetFolderId || '1'));

      E.collectionsSortSelect && (E.collectionsSortSelect.value = config.collectionsSort || 'alpha_asc');
      E.bookmarksSortSelect && (E.bookmarksSortSelect.value = config.bookmarksSort || 'created_desc');
      E.rateLimitRpm && (E.rateLimitRpm.value = String(config.rateLimitRpm || 60));
      E.syncModeSelect && (E.syncModeSelect.value = config.twoWayMode || 'additions_only');

      const topLevelOnly = (config.topLevelOnly ?? true); // Default to true now
      const topLevelCheckbox = document.getElementById('topLevelOnly');
      if (topLevelCheckbox) {
        topLevelCheckbox.checked = topLevelOnly;
      }

      this.toggleCollectionsDisabled();
      await this.loadCollectionsList(config.selectedCollectionIds || []);

      // Sync enabled/disabled
      const syncEnabled = (config.syncEnabled ?? true);
      const syncEnabledCheckbox = document.getElementById('syncEnabled');
      if (syncEnabledCheckbox) {
        syncEnabledCheckbox.checked = syncEnabled;
        this.updateSyncSettingsVisibility(syncEnabled);
      }

      // Force sidebar layout
      this.applyLayout('sidebar');
    } catch (error) {
      this.showMessage('Failed to load settings', 'error');
    }
  }

  resetRedirectUri() {
    if (chrome.identity && chrome.identity.getRedirectURL) {
      const url = chrome.identity.getRedirectURL();
      if (this.elements.redirectUri) this.elements.redirectUri.value = url;
      chrome.storage.sync.set({ redirectUri: url }).catch(() => {});
      this.validateRedirectUri();
      this.showMessage('Redirect URI reset to default', 'success');
    } else {
      this.showMessage('Unable to get default Redirect URI', 'error');
    }
  }

  validateRedirectUri() {
    const el = this.elements.redirectUri;
    const hint = this.elements.redirectHint;
    if (!el || !hint) return;
    const v = (el.value || '').trim();
    const isChromiumApp = /\.chromiumapp\.org\/?$/.test(v) || v.includes('.chromiumapp.org/');
    const managedOn = !!this.elements.managedOAuth?.checked;
    if (managedOn && !isChromiumApp) {
      hint.textContent = 'Managed mode: Redirect URI should be your extension identity URL (…chromiumapp.org).';
      hint.style.color = '#b54708'; // amber
    } else {
      hint.textContent = '';
    }
  }

  async viewAuthState() {
    try {
      const keys = ['managedOAuth','managedOAuthBaseUrl','redirectUri','clientId','accessToken','refreshToken','tokenExpiresAt'];
      const data = await chrome.storage.sync.get(keys);
      const out = Object.fromEntries(Object.entries(data).map(([k,v]) => [k, k.includes('Token') ? (v ? `(present${typeof v === 'string' ? `:${v.slice(0,6)}…` : ''})` : '(missing)') : v]));
      if (this.elements.authStateOut) this.elements.authStateOut.textContent = JSON.stringify(out, null, 2);
    } catch (e) {
      if (this.elements.authStateOut) this.elements.authStateOut.textContent = 'Failed to read auth state: ' + (e?.message || e);
    }
  }

  async clearTokens() {
    try {
      await chrome.storage.sync.remove(['accessToken','refreshToken','tokenExpiresAt']);
      if (this.elements.authStateOut) this.elements.authStateOut.textContent = 'Tokens cleared.';
      await this.updateAuthStatus();
    } catch (e) {
      this.showMessage('Failed to clear tokens: ' + (e?.message || e), 'error');
    }
  }

  onManagedToggle() {
    this.updateManagedUi();
    this.saveConfiguration();
  }

  updateManagedUi() {
    const E = this.elements;
    const managed = !!this.elements.managedOAuth?.checked;

    // Always show managed base URL when managed is on
    const baseGroup = document.getElementById('managedBaseGroup');
    if (baseGroup) baseGroup.style.display = managed ? 'block' : 'none';
  }

  toggleManualConfig() {
    const isHidden = this.elements.manualConfigDetails?.classList.contains('hidden');

    if (this.elements.manualConfigDetails) {
      this.elements.manualConfigDetails.classList.toggle('hidden');
    }

    if (this.elements.toggleManualConfig) {
      this.elements.toggleManualConfig.textContent = isHidden
        ? 'Hide'
        : 'Show';
    }
  }

  closePrivacyNotice() {
    if (this.elements.privacyNotice) {
      this.elements.privacyNotice.style.display = 'none';
    }
  }

  async autoCheckWorker() {
    // Only check if managed OAuth is enabled and we have a base URL
    const { managedOAuth } = await chrome.storage.sync.get(['managedOAuth']);
    if (!managedOAuth) return;

    const baseUrl = this.elements.managedOAuthBaseUrl?.value;
    if (!baseUrl) return;

    try {
      await this.checkWorker();
    } catch (error) {
      console.log('Auto Worker check failed:', error);
    }
  }

  toggleManagedBaseEdit() {
    const input = this.elements.managedOAuthBaseUrl;
    if (!input) return;
    input.disabled = !input.disabled; // toggle
    if (this.elements.managedBaseEdit) {
      this.elements.managedBaseEdit.textContent = input.disabled ? 'Edit' : 'Lock';
    }
  }

  updateAutoSyncInfo(minutes) {
    this.elements.autoSyncInfo && (this.elements.autoSyncInfo.textContent = `Automatic sync: Every ${minutes} minute${minutes === 1 ? '' : 's'}`);
  }

  previewSyncInterval() {
    const minutes = Math.max(1, Number(this.elements.syncInterval?.value) || 5);
    this.updateAutoSyncInfo(minutes);
  }

  async saveSyncOptions() {
    try {
      const minutes = Math.max(1, Number(this.elements.syncInterval?.value) || 5);
      await chrome.storage.sync.set({ syncIntervalMinutes: minutes });
      this.updateAutoSyncInfo(minutes);
      this.showMessage('Sync interval saved', 'success');
    } catch (_) {
      this.showMessage('Failed to save sync interval', 'error');
    }
  }

  async saveTargetFolder() {
    try {
      const targetId = this.elements.targetFolderSelect?.value;
      await chrome.storage.sync.set({ targetFolderId: targetId });
      this.showMessage('Target folder saved', 'success');
    } catch (_) {
      this.showMessage('Failed to save target folder', 'error');
    }
  }

  async populateFolderSelect(selectedId) {
    try {
      if (!this.elements.targetFolderSelect) return;
      const tree = await chrome.bookmarks.getTree();
      const folders = [];
      const pushNode = (node, pathParts) => {
        if (!node.url) {
          const path = [...pathParts, node.title || ''].filter(Boolean).join(' > ');
          if (node.id !== '0') folders.push({ id: node.id, path: path || '(root)' });
          if (node.children) for (const child of node.children) pushNode(child, [...pathParts, node.title || '']);
        }
      };
      for (const root of tree) pushNode(root, []);
      folders.sort((a,b) => a.path.localeCompare(b.path));
      this.elements.targetFolderSelect.innerHTML = '';
      for (const f of folders) {
        const opt = document.createElement('option'); opt.value = f.id; opt.textContent = f.path || f.id;
        this.elements.targetFolderSelect.appendChild(opt);
      }
      if (selectedId) this.elements.targetFolderSelect.value = String(selectedId);
    } catch (_) {
      this.showMessage('Failed to load bookmarks folders', 'error');
    }
  }

  async saveSorting() {
    try {
      const collectionsSort = this.elements.collectionsSortSelect?.value || 'alpha_asc';
      const bookmarksSort = this.elements.bookmarksSortSelect?.value || 'created_desc';
      await chrome.storage.sync.set({ collectionsSort, bookmarksSort });
      this.showMessage('Sorting preferences saved', 'success');
    } catch (_) {
      this.showMessage('Failed to save sorting', 'error');
    }
  }

  async saveRateLimit() {
    try {
      const rpm = Math.max(1, Number(this.elements.rateLimitRpm?.value) || 60);
      await chrome.storage.sync.set({ rateLimitRpm: rpm });
      this.showMessage('Rate limit saved', 'success');
    } catch (_) {
      this.showMessage('Failed to save rate limit', 'error');
    }
  }

  saveRateLimitDebounced() {
    clearTimeout(this._saveRateLimitTimer);
    this._saveRateLimitTimer = setTimeout(() => this.saveRateLimit(), 400);
  }

  async saveSyncMode() {
    try {
      const mode = this.elements.syncModeSelect?.value || 'additions_only';
      await chrome.storage.sync.set({ twoWayMode: mode });
      this.showMessage('Sync mode saved', 'success');
    } catch (_) {
      this.showMessage('Failed to save sync mode', 'error');
    }
  }

  async loadSupportLinks() {
    try {
      const bmc = await this.readFirstNonEmptyUrl(['buymeacoffee.txt']);
      const fallbackBmc = 'https://buymeacoffee.com/daiquiri';
      const aTopBmc = document.getElementById('bmcLink');
      if (aTopBmc) aTopBmc.href = bmc || fallbackBmc;
      const aPanelBmc = document.getElementById('bmcPanelLink');
      if (aPanelBmc) aPanelBmc.href = bmc || fallbackBmc;

      const site = await this.readFirstNonEmptyUrl(['website.txt']);
      const fallbackSite = 'https://daiquiri.dev';
      const aTopSite = document.getElementById('siteLink');
      const aPanelSite = document.getElementById('supportPanelSite');
      if (aTopSite) aTopSite.href = site || fallbackSite;
      if (aPanelSite) aPanelSite.href = site || fallbackSite;

      // BMC button is now loaded directly in HTML
    } catch (_) {}
  }

  loadBMCButton() {
    try {
      const container = document.getElementById('bmcButtonContainer');
      if (!container) return;

      // Clear any existing content and ensure container is visible
      container.innerHTML = '';
      container.style.display = 'block';

      // Create BMC button script with your exact specifications
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js';
      script.setAttribute('data-name', 'bmc-button');
      script.setAttribute('data-slug', 'daiquiri');
      script.setAttribute('data-color', '#FFDD00');
      script.setAttribute('data-emoji', '');
      script.setAttribute('data-font', 'Poppins');
      script.setAttribute('data-text', 'Buy me a coffee');
      script.setAttribute('data-outline-color', '#000000');
      script.setAttribute('data-font-color', '#000000');
      script.setAttribute('data-coffee-color', '#ffffff');

      container.appendChild(script);
    } catch (e) {
      console.error('Failed to load BMC button:', e);
    }
  }

  openRoadmapLink() {
    try {
      const a = document.getElementById('openRoadmapRepo');
      if (!a) return;
      // If the repo URL is known, set it; else hide link
      const repoUrl = 'https://github.com/daiquiri-98/open-bookmark-sync';
      a.href = repoUrl ? (repoUrl + '/blob/main/ROADMAP.md') : '#';
      if (!repoUrl) a.style.display = 'none';
    } catch (_) {}
  }

  async readFirstNonEmptyUrl(files) {
    for (const name of files) {
      try {
        const res = await fetch(chrome.runtime.getURL(name));
        if (!res.ok) continue;
        const raw = await res.text();
        const line = raw.split(/\r?\n/).map(s => s.trim()).find(s => s && !s.startsWith('#'));
        if (!line) continue;
        return this.normalizeUrl(line);
      } catch (e) {
        // Silently continue if file doesn't exist
        console.debug(`Optional file ${name} not found, using fallback`);
      }
    }
    return '';
  }

  normalizeUrl(s) { try { return /^https?:\/\//i.test(s) ? s : ('https://' + s); } catch (_) { return ''; } }

  showTab(key) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === key));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', (p.dataset.tab === key)));
    document.querySelectorAll('.side-link').forEach(b => b.classList.toggle('active', b.dataset.tab === key));
  }

  applyLayout(mode) {
    const isSidebar = mode === 'sidebar';
    document.body.classList.toggle('layout-sidebar', isSidebar);
  }

  // Collections chooser helpers
  toggleCollectionsDisabled() {
    const topLevelCheckbox = document.getElementById('topLevelOnly');
    const disabled = !!topLevelCheckbox?.checked; // Disabled when top-level only is ON

    if (this.elements.collectionsList) {
      this.elements.collectionsList.style.pointerEvents = disabled ? 'none' : '';
      this.elements.collectionsList.style.opacity = disabled ? '0.5' : '';
    }
    if (this.elements.collectionsSearch) this.elements.collectionsSearch.disabled = disabled;
    if (this.elements.selectAllCollections) this.elements.selectAllCollections.disabled = disabled;
    if (this.elements.clearCollections) this.elements.clearCollections.disabled = disabled;
  }

  async refreshAll() {
    try {
      // Show loading state
      if (this.elements.refreshCollections) {
        this.elements.refreshCollections.disabled = true;
        this.elements.refreshCollections.textContent = 'Refreshing...';
      }

      await Promise.all([
        this.populateFolderSelect(),
        this.loadCollectionsList()
      ]);

      this.showMessage('Collections and folders refreshed', 'success');
    } catch (error) {
      this.showMessage('Failed to refresh', 'error');
    } finally {
      // Restore button state
      if (this.elements.refreshCollections) {
        this.elements.refreshCollections.disabled = false;
        this.elements.refreshCollections.textContent = 'Refresh Collections & Folders';
      }
    }
  }


  async onTopLevelOnlyToggle() {
    try {
      const topLevelCheckbox = document.getElementById('topLevelOnly');
      const val = !!topLevelCheckbox?.checked;
      await chrome.storage.sync.set({ topLevelOnly: val });

      // Update UI state
      this.toggleCollectionsDisabled();

      if (val) {
        this.showMessage('Only top-level collections will be imported', 'info');
      } else {
        this.showMessage('You can now select specific collections to import', 'info');
      }
    } catch (_) {}
  }


  async saveSelectedCollections() {
    try {
      const ids = new Set();
      if (this.elements.collectionsList) {
        this.elements.collectionsList.querySelectorAll('.collection-checkbox').forEach(cb => {
          // Include all checked collections, regardless of indeterminate state
          // Indeterminate is only a visual state for parent collections
          if (cb.checked) ids.add(cb.value);
        });
      }
      await chrome.storage.sync.set({ selectedCollectionIds: Array.from(ids) });
    } catch (_) {}
  }

  async loadCollectionsList(preselected = []) {
    try {
      const list = this.elements.collectionsList;
      const { accessToken } = await chrome.storage.sync.get(['accessToken']);
      if (!accessToken) {
        if (list) list.innerHTML = '<div class="help-text">Authenticate to load collections</div>';
        return;
      }

      // Show loading state without clearing content immediately
      if (list && list.children.length === 0) {
        list.innerHTML = '<div class="help-text">Loading collections...</div>';
      }

      // Fetch root collections
      const resp = await fetch('https://api.raindrop.io/rest/v1/collections', { headers: { 'Authorization': `Bearer ${accessToken}` }});
      if (!resp.ok) throw new Error('Failed to load collections');
      let items = (await resp.json()).items || [];
      items = items.filter(c => c._id >= 0);

      console.log('Root collections from API:', items);

      // Fetch child collections
      const childResp = await fetch('https://api.raindrop.io/rest/v1/collections/childrens', { headers: { 'Authorization': `Bearer ${accessToken}` }});
      if (childResp.ok) {
        const childItems = (await childResp.json()).items || [];
        const filteredChildItems = childItems.filter(c => c._id >= 0);
        console.log('Child collections from API:', filteredChildItems);

        // Merge root and child collections
        items = [...items, ...filteredChildItems];
      } else {
        console.warn('Failed to load child collections:', childResp.status);
      }

      console.log('All collections (root + children):', items);

      // Build hierarchy
      const hierarchy = this.buildCollectionHierarchy(items);

      // Create content in memory first, then replace all at once
      const fragment = document.createDocumentFragment();
      const tempContainer = document.createElement('div');
      this.renderCollectionHierarchy(hierarchy, tempContainer, preselected);

      // Move all children from temp container to fragment
      while (tempContainer.firstChild) {
        fragment.appendChild(tempContainer.firstChild);
      }

      // Replace content in one operation
      if (list) {
        list.innerHTML = '';
        list.appendChild(fragment);
      }
    } catch (_) {
      const list = this.elements.collectionsList;
      if (list) list.innerHTML = '<div class="help-text">Failed to load collections</div>';
    }
  }

  buildCollectionHierarchy(collections) {
    const itemsById = new Map();
    const roots = [];

    console.log('=== Building Collection Hierarchy ===');
    console.log('Total collections:', collections.length);

    // First pass: create items map
    for (const c of collections) {
      itemsById.set(c._id, { ...c, children: [] });
    }

    // Second pass: build hierarchy
    let childCount = 0;
    for (const c of collections) {
      const item = itemsById.get(c._id);
      const parentId = this.getParentId(c);

      console.log(`Collection "${c.title}" (ID: ${c._id}), Parent ID: ${parentId}`);

      if (parentId && itemsById.has(parentId)) {
        itemsById.get(parentId).children.push(item);
        childCount++;
        console.log(`  -> Added as child to "${itemsById.get(parentId).title}"`);
      } else {
        roots.push(item);
        console.log(`  -> Added as root (parent ${parentId} not found or null)`);
      }
    }

    console.log(`Hierarchy complete: ${roots.length} root collections, ${childCount} child collections`);
    console.log('Root collections:', roots.map(r => r.title));

    // Show hierarchy tree structure
    const showTree = (items, indent = '') => {
      for (const item of items) {
        console.log(`${indent}${item.title} (ID: ${item._id})`);
        if (item.children.length > 0) {
          showTree(item.children, indent + '  ');
        }
      }
    };
    console.log('=== Hierarchy Tree ===');
    showTree(roots);

    return roots;
  }

  getParentId(c) {
    try {
      // Check various possible parent field formats
      let parentId = null;

      // Check all possible parent field variations
      const possibleFields = [
        c.parent?.$id,
        c.parent?.id,
        c.parent?._id,
        c.parentId,
        c.parent_id,
        c.parent
      ];

      for (const field of possibleFields) {
        if (field && (typeof field === 'number' || typeof field === 'string')) {
          parentId = field;
          break;
        }
      }

      // Convert to number if it's a string number
      if (parentId && typeof parentId === 'string' && !isNaN(parentId)) {
        parentId = parseInt(parentId);
      }

      console.log(`Getting parent for "${c.title}" (ID: ${c._id}):`, {
        rawCollection: c,
        foundParentId: parentId,
        parentField: c?.parent,
        parentIdField: c?.parentId
      });

      return parentId;
    } catch (e) {
      console.error('Error getting parent ID:', e);
      return null;
    }
  }

  renderCollectionHierarchy(items, container, preselected, level = 0) {
    for (const item of items) {
      const id = String(item._id);
      const hasChildren = item.children && item.children.length > 0;

      // Create collection item
      const row = document.createElement('div');
      row.className = `collection-item ${level === 1 ? 'child' : level >= 2 ? 'grandchild' : ''}`;
      row.dataset.collectionId = id;

      // Add expand/collapse button for parents
      if (hasChildren) {
        const expandBtn = document.createElement('span');
        expandBtn.className = 'expand-button collapsed';
        expandBtn.textContent = '+';
        expandBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleCollectionExpansion(id, expandBtn);
        });
        row.appendChild(expandBtn);
      } else {
        // Add spacer for alignment
        const spacer = document.createElement('span');
        spacer.className = 'expand-spacer';
        row.appendChild(spacer);
      }

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = id;
      cb.className = 'collection-checkbox';
      cb.checked = preselected.includes(id);
      cb.addEventListener('change', () => this.onCollectionCheckboxChange(cb));

      const label = document.createElement('span');
      label.className = 'collection-label';
      label.textContent = item.title || id;
      label.addEventListener('click', () => {
        cb.checked = !cb.checked;
        this.onCollectionCheckboxChange(cb);
      });

      row.appendChild(cb);
      row.appendChild(label);
      container.appendChild(row);

      // Render children in a collapsible container
      if (hasChildren) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'collection-children';
        childrenContainer.dataset.parentId = id;
        childrenContainer.style.display = 'none'; // Default collapsed
        this.renderCollectionHierarchy(item.children, childrenContainer, preselected, level + 1);
        container.appendChild(childrenContainer);
      }
    }
  }

  onCollectionCheckboxChange(checkbox) {
    const container = this.elements.collectionsList;
    const collectionId = checkbox.value;
    const isChecked = checkbox.checked;

    // Update children
    this.updateChildCollections(container, collectionId, isChecked);

    // Update parent
    this.updateParentCollection(container, collectionId);

    // Save selection
    this.saveSelectedCollections();
  }

  updateChildCollections(container, parentId, checked) {
    const items = container.querySelectorAll('.collection-item');
    let foundParent = false;
    let parentLevel = 0;

    for (const item of items) {
      if (item.dataset.collectionId === parentId) {
        foundParent = true;
        parentLevel = item.classList.contains('child') ? 1 : item.classList.contains('grandchild') ? 2 : 0;
        continue;
      }

      if (foundParent) {
        const currentLevel = item.classList.contains('child') ? 1 : item.classList.contains('grandchild') ? 2 : 0;

        // If we've moved to same or higher level, we're done with children
        if (currentLevel <= parentLevel) break;

        // This is a child, update it
        const cb = item.querySelector('.collection-checkbox');
        if (cb) {
          cb.checked = checked;
          cb.indeterminate = false;
        }
      }
    }
  }

  updateParentCollection(container, childId) {
    const items = Array.from(container.querySelectorAll('.collection-item'));
    const childItem = items.find(item => item.dataset.collectionId === childId);
    if (!childItem) return;

    const childLevel = childItem.classList.contains('child') ? 1 : childItem.classList.contains('grandchild') ? 2 : 0;
    if (childLevel === 0) return; // This is a root item

    // Find parent
    const childIndex = items.indexOf(childItem);
    let parentItem = null;

    for (let i = childIndex - 1; i >= 0; i--) {
      const item = items[i];
      const itemLevel = item.classList.contains('child') ? 1 : item.classList.contains('grandchild') ? 2 : 0;
      if (itemLevel < childLevel) {
        parentItem = item;
        break;
      }
    }

    if (!parentItem) return;

    // Find all siblings (children of the same parent)
    const parentLevel = parentItem.classList.contains('child') ? 1 : parentItem.classList.contains('grandchild') ? 2 : 0;
    const siblings = [];

    for (let i = items.indexOf(parentItem) + 1; i < items.length; i++) {
      const item = items[i];
      const itemLevel = item.classList.contains('child') ? 1 : item.classList.contains('grandchild') ? 2 : 0;

      if (itemLevel <= parentLevel) break; // No more children
      if (itemLevel === childLevel) siblings.push(item);
    }

    // Check parent state
    const parentCb = parentItem.querySelector('.collection-checkbox');
    if (!parentCb) return;

    const checkedSiblings = siblings.filter(s => s.querySelector('.collection-checkbox')?.checked);

    if (checkedSiblings.length === 0) {
      parentCb.checked = false;
      parentCb.indeterminate = false;
    } else if (checkedSiblings.length === siblings.length) {
      parentCb.checked = true;
      parentCb.indeterminate = false;
    } else {
      parentCb.checked = false;
      parentCb.indeterminate = true;
    }

    // Recursively update grandparent
    this.updateParentCollection(container, parentItem.dataset.collectionId);
  }

  hasParent(c) { try { return !!(c?.parentId || c?.parent?.$id || c?.parent?.id); } catch (_) { return false; } }

  async clearAllBookmarks() {
    // Show the inline confirmation form with backup and confirmation steps
    const confirmationDiv = document.getElementById('clearConfirmation');
    const confirmText = document.getElementById('clearConfirmText');
    const executeBtn = document.getElementById('executeClear');
    const downloadBtn = document.getElementById('downloadBackup');
    const syncWarn = document.getElementById('clearSyncWarning');

    if (confirmationDiv) {
      confirmationDiv.style.display = 'block';
      confirmText.value = '';
      executeBtn.disabled = true;

      // Reset download button to initial state
      if (downloadBtn) {
        downloadBtn.textContent = 'Download Bookmarks Backup';
        downloadBtn.style.backgroundColor = '';
        downloadBtn.style.color = '';
        downloadBtn.style.pointerEvents = '';
        downloadBtn.className = 'button secondary';
      }

      // Show warning if sync is enabled
      try {
        const { syncEnabled } = await chrome.storage.sync.get(['syncEnabled']);
        if (syncWarn) syncWarn.style.display = syncEnabled ? 'block' : 'none';
      } catch (_) { if (syncWarn) syncWarn.style.display = 'none'; }
    }
  }

  cancelClear() {
    const confirmationDiv = document.getElementById('clearConfirmation');
    if (confirmationDiv) {
      confirmationDiv.style.display = 'none';
    }
  }

  onClearConfirmTextChange() {
    const confirmText = document.getElementById('clearConfirmText');
    const executeBtn = document.getElementById('executeClear');

    if (confirmText && executeBtn) {
      executeBtn.disabled = confirmText.value !== 'CLEAR ALL';
    }
  }

  async executeClear() {
    // Execute the clearing (backup should already be downloaded)
    try {
      const executeBtn = document.getElementById('executeClear');
      if (executeBtn) {
        executeBtn.disabled = true;
        executeBtn.textContent = 'Deleting...';
      }

      console.log('Options: Sending clearAllBookmarks message...');
      const response = await chrome.runtime.sendMessage({ action: 'clearAllBookmarks' });
      console.log('Options: Received response:', response);

      if (response?.success) {
        this.showMessage(`Successfully deleted ${response.bookmarksDeleted} bookmarks`, 'success');
        this.cancelClear();
      } else {
        this.showMessage(`Clear failed: ${response?.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      this.showMessage(`Clear failed: ${error.message}`, 'error');
    } finally {
      const executeBtn = document.getElementById('executeClear');
      if (executeBtn) {
        executeBtn.disabled = false;
        executeBtn.textContent = 'Execute Clear';
      }
    }
  }

  async downloadBackup() {
    try {
      const downloadBtn = document.getElementById('downloadBackup');
      if (downloadBtn) {
        downloadBtn.textContent = 'Generating...';
        downloadBtn.style.pointerEvents = 'none';
      }

      await this.backupBookmarks();

      if (downloadBtn) {
        downloadBtn.textContent = '✓ Downloaded';
        downloadBtn.style.backgroundColor = '#28a745';
        downloadBtn.style.color = 'white';
      }
    } catch (error) {
      this.showMessage(`Backup failed: ${error.message}`, 'error');
      const downloadBtn = document.getElementById('downloadBackup');
      if (downloadBtn) {
        downloadBtn.textContent = 'Download Failed';
        downloadBtn.style.backgroundColor = '#dc3545';
        downloadBtn.style.color = 'white';
      }
    }
  }

  async backupBookmarks() {
    try {
      // Get all bookmarks
      const bookmarks = await chrome.bookmarks.getTree();

      // Create backup data
      const backupData = {
        timestamp: new Date().toISOString(),
        bookmarks: bookmarks,
        extensionVersion: chrome.runtime.getManifest().version
      };

      // Convert to JSON
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Create download
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `bookmarks-backup-${timestamp}.json`;

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showMessage(`Backup saved as ${filename}`, 'success');
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  onSyncEnabledToggle() {
    const syncEnabledCheckbox = document.getElementById('syncEnabled');
    if (syncEnabledCheckbox) {
      const enabled = syncEnabledCheckbox.checked;
      chrome.storage.sync.set({ syncEnabled: enabled });
      this.updateSyncSettingsVisibility(enabled);

      if (enabled) {
        this.showMessage('Raindrop sync enabled', 'success');
      } else {
        this.showMessage('Raindrop sync disabled', 'info');
      }
    }
  }

  updateSyncSettingsVisibility(enabled) {
    const syncSettings = document.getElementById('syncSettings');
    if (syncSettings) {
      if (enabled) {
        syncSettings.classList.remove('disabled');
      } else {
        syncSettings.classList.add('disabled');
      }
    }
  }

  async exportBookmarks() {
    try {
      const exportBtn = document.getElementById('exportBookmarks');
      if (exportBtn) {
        exportBtn.textContent = 'Exporting...';
        exportBtn.disabled = true;
      }

      await this.backupBookmarks();

      if (exportBtn) {
        exportBtn.textContent = '✓ Exported';
        exportBtn.style.backgroundColor = '#28a745';
        exportBtn.style.color = 'white';

        setTimeout(() => {
          exportBtn.textContent = 'Export All Bookmarks (JSON)';
          exportBtn.style.backgroundColor = '';
          exportBtn.style.color = '';
          exportBtn.disabled = false;
        }, 2000);
      }
    } catch (error) {
      this.showMessage(`Export failed: ${error.message}`, 'error');
      const exportBtn = document.getElementById('exportBookmarks');
      if (exportBtn) {
        exportBtn.textContent = 'Export All Bookmarks (JSON)';
        exportBtn.disabled = false;
      }
    }
  }

  onImportFileSelected() {
    const importFile = document.getElementById('importFile');
    const importBtn = document.getElementById('importBookmarks');

    if (importFile && importBtn) {
      importBtn.disabled = !importFile.files.length;
    }
  }

  async importBookmarks() {
    const importFile = document.getElementById('importFile');
    if (!importFile || !importFile.files.length) {
      this.showMessage('Please select a file first', 'error');
      return;
    }

    const file = importFile.files[0];
    const importBtn = document.getElementById('importBookmarks');

    try {
      if (importBtn) {
        importBtn.textContent = 'Importing...';
        importBtn.disabled = true;
      }

      const content = await this.readFileContent(file);

      if (file.name.toLowerCase().endsWith('.json')) {
        await this.importFromJSON(content);
      } else if (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm')) {
        await this.importFromHTML(content);
      } else {
        throw new Error('Unsupported file format');
      }

      this.showMessage('Bookmarks imported successfully', 'success');
    } catch (error) {
      this.showMessage(`Import failed: ${error.message}`, 'error');
    } finally {
      if (importBtn) {
        importBtn.textContent = 'Import Bookmarks';
        importBtn.disabled = false;
      }
      importFile.value = '';
      this.onImportFileSelected();
    }
  }

  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  async importFromJSON(content) {
    try {
      const data = JSON.parse(content);

      // Handle our backup format
      if (data.bookmarks && Array.isArray(data.bookmarks)) {
        await this.createBookmarksFromTree(data.bookmarks, '1'); // Import to Bookmarks Bar
      }
      // Handle Chrome bookmark export format
      else if (data.roots) {
        for (const [key, folder] of Object.entries(data.roots)) {
          if (folder.children) {
            const targetId = key === 'bookmark_bar' ? '1' : '2';
            await this.createBookmarksFromTree(folder.children, targetId);
          }
        }
      }
      else {
        throw new Error('Unrecognized JSON format');
      }
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }

  async importFromHTML(content) {
    // Basic HTML bookmark import - parse DT/A tags
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const links = doc.querySelectorAll('a[href]');

    let imported = 0;
    for (const link of links) {
      try {
        await chrome.bookmarks.create({
          parentId: '1', // Bookmarks Bar
          title: link.textContent || link.href,
          url: link.href
        });
        imported++;
      } catch (error) {
        console.warn('Failed to import bookmark:', link.href, error);
      }
    }

    if (imported === 0) {
      throw new Error('No valid bookmarks found in HTML file');
    }
  }

  async createBookmarksFromTree(nodes, parentId) {
    for (const node of nodes) {
      try {
        if (node.url) {
          // It's a bookmark
          await chrome.bookmarks.create({
            parentId: parentId,
            title: node.name || node.title || node.url,
            url: node.url
          });
        } else if (node.children) {
          // It's a folder
          const folder = await chrome.bookmarks.create({
            parentId: parentId,
            title: node.name || node.title || 'Imported Folder'
          });
          await this.createBookmarksFromTree(node.children, folder.id);
        }
      } catch (error) {
        console.warn('Failed to import item:', node, error);
      }
    }
  }

  async cleanupDuplicates() {
    try {
      if (this.elements.cleanupDuplicates) {
        this.elements.cleanupDuplicates.disabled = true;
        this.elements.cleanupDuplicates.textContent = 'Cleaning...';
      }

      console.log('Options: Sending cleanupDuplicates message...');
      const response = await chrome.runtime.sendMessage({ action: 'cleanupDuplicates' });
      console.log('Options: Received response:', response);

      if (response?.success) {
        this.showMessage(`Removed ${response.duplicatesRemoved} duplicate bookmarks`, 'success');
      } else {
        this.showMessage(`Cleanup failed: ${response?.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      this.showMessage(`Cleanup failed: ${error.message}`, 'error');
    } finally {
      if (this.elements.cleanupDuplicates) {
        this.elements.cleanupDuplicates.disabled = false;
        this.elements.cleanupDuplicates.textContent = 'Remove Duplicate Bookmarks';
      }
    }
  }

  toggleCollectionExpansion(collectionId, expandButton) {
    const childrenContainer = document.querySelector(`[data-parent-id="${collectionId}"]`);
    if (!childrenContainer) return;

    const isExpanded = expandButton.classList.contains('expanded');

    if (isExpanded) {
      // Collapse
      expandButton.classList.remove('expanded');
      expandButton.classList.add('collapsed');
      expandButton.textContent = '+';
      childrenContainer.style.display = 'none';
    } else {
      // Expand
      expandButton.classList.remove('collapsed');
      expandButton.classList.add('expanded');
      expandButton.textContent = '−';
      childrenContainer.style.display = 'block';
    }
  }

  filterCollections() {
    const q = (this.elements.collectionsSearch?.value || '').toLowerCase();
    if (!this.elements.collectionsList) return;
    this.elements.collectionsList.querySelectorAll('.collection-item').forEach(item => {
      const t = (item.textContent || '').toLowerCase();
      item.style.display = t.includes(q) ? 'flex' : 'none';
    });
  }

  setAllCollections(check) {
    if (!this.elements.collectionsList) return;
    this.elements.collectionsList.querySelectorAll('.collection-checkbox').forEach(cb => {
      cb.checked = !!check;
      cb.indeterminate = false;
    });
    this.saveSelectedCollections();
  }

  // ---------- Auth and config actions ----------
  async saveConfiguration() {
    try {
      const managedOAuth = !!this.elements.managedOAuth?.checked;
      const managedOAuthBaseUrl = this.elements.managedOAuthBaseUrl?.value.trim() || 'https://rdoauth.daiquiri.dev';

      let clientId = this.elements.clientId?.value.trim() || '';
      let clientSecret = this.elements.clientSecret?.value.trim() || '';
      let redirectUri = (this.elements.redirectUri?.value.trim()) || '';
      if (!redirectUri && chrome.identity && chrome.identity.getRedirectURL) {
        redirectUri = chrome.identity.getRedirectURL();
      }
      if (!managedOAuth) {
        if (!clientId) return this.showMessage('Client ID is required', 'error');
        if (!clientSecret) return this.showMessage('Client Secret is required', 'error');
      } else {
        // In managed mode, we can clear local secrets if previously set
        clientId = clientId; // optional
        clientSecret = clientSecret; // optional
      }

      await chrome.storage.sync.set({ clientId, clientSecret, managedOAuth, managedOAuthBaseUrl, redirectUri });
      // Only show save message if not in the middle of authentication
      if (!this.elements.authenticateManaged?.disabled && !this.elements.authenticateManual?.disabled) {
        this.showMessage('Configuration saved successfully', 'success');
      }
    } catch (_) { this.showMessage('Failed to save configuration', 'error'); }
  }

  async authenticateManaged() {
    try {
      this.clearMessages(); // Clear any previous messages
      this.setButtonLoading(this.elements.authenticateManaged, true);
      this.setAuthStatus('Connecting...', 'Initializing Cloudflare authentication', true);
      this.showProgress(true, 10, 'Starting authentication flow...');

      // Force managed mode on
      if (this.elements.managedOAuth) {
        this.elements.managedOAuth.checked = true;
        await this.saveConfiguration();
      }

      this.showProgress(true, 30, 'Redirecting to authentication...');
      const res = await this.oauth.startAuthFlow();

      this.showProgress(true, 80, 'Processing authentication response...');

      if (res?.success) {
        this.showProgress(true, 100, 'Authentication successful!');
        this.showMessage('Managed authentication successful!', 'success');
        await this.updateAuthStatus();
        await this.loadUserInfo();
      } else {
        this.showMessage('Managed authentication failed', 'error');
        this.setAuthStatus('Authentication failed', 'Please try again or use manual mode');
      }
    } catch (e) {
      const suggestions = this.getErrorSuggestions(e.message);
      this.showDetailedError('Managed Authentication Failed', e.message, suggestions);
      this.setAuthStatus('Authentication error', e.message);

      // Show manual auth section for fallback
      if (this.elements.manualAuthSection) {
        this.elements.manualAuthSection.classList.remove('hidden');
      }

      // Fallback suggestion
      await this.suggestFallbackAuth('managed-to-manual', e.message);
    } finally {
      this.setButtonLoading(this.elements.authenticateManaged, false);
      this.showProgress(false);
    }
  }

  async authenticateManual() {
    try {
      this.clearMessages(); // Clear any previous messages
      this.setButtonLoading(this.elements.authenticateManual, true);
      this.setAuthStatus('Validating...', 'Checking credentials', true);
      this.showProgress(true, 10, 'Validating configuration...');

      // Force managed mode off
      if (this.elements.managedOAuth) {
        this.elements.managedOAuth.checked = false;
        this.updateManagedUi();
        await this.saveConfiguration();
      }

      // Validate required fields for manual mode
      const clientId = this.elements.clientId?.value.trim();
      const clientSecret = this.elements.clientSecret?.value.trim();

      const { sanitized, validation } = this.sanitizeCredentials(clientId, clientSecret);

      if (!validation.valid) {
        const suggestions = validation.errors.map(error => `Fix: ${error}`);
        this.showDetailedError('Invalid Credentials', validation.errors.join(', '), suggestions);
        this.setAuthStatus('Configuration incomplete', 'Invalid credentials provided');
        return;
      }

      this.showProgress(true, 30, 'Starting direct authentication...');
      const res = await this.oauth.startAuthFlow();

      this.showProgress(true, 80, 'Processing authentication...');

      if (res?.success) {
        this.showProgress(true, 100, 'Authentication complete!');
        this.showMessage('Manual authentication successful!', 'success');
        await this.updateAuthStatus();
        await this.loadUserInfo();
      } else {
        this.showMessage('Manual authentication failed', 'error');
        this.setAuthStatus('Authentication failed', 'Check your credentials and try again');
      }
    } catch (e) {
      const suggestions = this.getErrorSuggestions(e.message);
      this.showDetailedError('Manual Authentication Failed', e.message, suggestions);
      this.setAuthStatus('Authentication error', e.message);
    } finally {
      this.setButtonLoading(this.elements.authenticateManual, false);
      this.showProgress(false);
    }
  }

  async testConnection() {
    try {
      if (this.elements.testConnection) { this.elements.testConnection.disabled = true; this.elements.testConnection.textContent = 'Testing...'; }
      const result = await this.oauth.testConnection();
      if (result?.success) {
        this.showMessage(`Connection successful! Connected as: ${result.user?.name || 'Unknown'}`, 'success');
        await this.updateAuthStatus();
      } else {
        this.showMessage(`Connection failed: ${result?.message || 'Unknown'}`, 'error');
      }
    } catch (e) { this.showMessage(`Connection test failed: ${e.message}`, 'error'); }
    finally { if (this.elements.testConnection) { this.elements.testConnection.disabled = false; this.elements.testConnection.textContent = 'Test Connection'; } }
  }

  async logout() {
    try {
      if (this.elements.logout) this.elements.logout.disabled = true;
      await this.oauth.logout();
      this.showMessage('Logged out successfully', 'success');
      await this.updateAuthStatus();
      this.clearUserInfo();
    } catch (e) { this.showMessage(`Logout failed: ${e.message}`, 'error'); }
    finally { if (this.elements.logout) this.elements.logout.disabled = false; }
  }

  async syncNow() {
    try {
      if (this.elements.syncNow) { this.elements.syncNow.disabled = true; this.elements.syncNow.textContent = 'Syncing...'; }
      const response = await chrome.runtime.sendMessage({ action: 'syncNow' });
      if (response?.success) {
        this.showMessage('Sync completed successfully!', 'success');
        await chrome.storage.sync.set({ lastSyncTime: Date.now() });
        await this.loadSettings();
      } else {
        this.showMessage(`Sync failed: ${response?.error || 'Unknown'}`, 'error');
      }
    } catch (e) { this.showMessage(`Sync failed: ${e.message}`, 'error'); }
    finally { if (this.elements.syncNow) { this.elements.syncNow.disabled = false; this.elements.syncNow.textContent = 'Sync Now'; } }
  }

  async updateAuthStatus() {
    try {
      const { authenticated } = await chrome.runtime.sendMessage({ action: 'getAuthStatus' });
      const isAuth = !!authenticated;
      if (isAuth) {
        if (this.elements.statusIndicator) this.elements.statusIndicator.className = 'status-indicator connected';
        if (this.elements.authStatusText) this.elements.authStatusText.textContent = 'Connected';
        if (this.elements.logout) this.elements.logout.classList.remove('hidden');
        if (this.elements.syncNow) this.elements.syncNow.disabled = false;
        await this.loadUserInfo();
      } else {
        if (this.elements.statusIndicator) this.elements.statusIndicator.className = 'status-indicator disconnected';
        if (this.elements.authStatusText) this.elements.authStatusText.textContent = 'Not authenticated';
        if (this.elements.logout) this.elements.logout.classList.add('hidden');
        if (this.elements.syncNow) this.elements.syncNow.disabled = true;
        this.clearUserInfo();
      }
    } catch (e) {
      if (this.elements.statusIndicator) this.elements.statusIndicator.className = 'status-indicator disconnected';
      if (this.elements.authStatusText) this.elements.authStatusText.textContent = 'Status unknown';
    }
  }

  async loadUserInfo() {
    try {
      const result = await this.oauth.testConnection();
      if (result?.success && result.user) {
        const userName = result.user.name || 'Unknown';
        const userEmail = result.user.email || '';
        // Update authStatusText to include user info on same line
        if (this.elements.authStatusText) {
          this.elements.authStatusText.innerHTML = `Connected as: <strong>${userName}</strong>${userEmail ? ` (${userEmail})` : ''}`;
        }
        // Hide the separate userInfo section since we're showing it inline
        if (this.elements.userInfo) {
          this.elements.userInfo.classList.add('hidden');
        }
      }
    } catch (_) {}
  }

  clearUserInfo() {
    if (this.elements.userInfo) {
      this.elements.userInfo.classList.add('hidden');
      this.elements.userInfo.innerHTML = '';
    }
    // Also reset authStatusText when clearing user info
    if (this.elements.authStatusText) {
      this.elements.authStatusText.textContent = 'Not authenticated';
    }
  }

  showMessage(message, type = 'info', priority = 'normal') {
    const messageObj = { message, type, priority, id: Date.now() };

    // Clear existing timeout for auto-hide messages
    if (this.currentMessageTimeout) {
      clearTimeout(this.currentMessageTimeout);
      this.currentMessageTimeout = null;
    }

    // High priority messages (errors) clear the queue and show immediately
    if (priority === 'high' || type === 'error') {
      this.messageQueue = [];
      this.displayMessage(messageObj);
      return;
    }

    // Add to queue and process
    this.messageQueue.push(messageObj);
    this.processMessageQueue();
  }

  processMessageQueue() {
    if (this.messageQueue.length === 0) return;

    // If no message is currently showing, show the next one
    if (!this.elements.statusMessage || this.elements.statusMessage.classList.contains('hidden')) {
      const nextMessage = this.messageQueue.shift();
      this.displayMessage(nextMessage);
    }
  }

  displayMessage(messageObj) {
    if (!this.elements.statusMessage) return;

    this.elements.statusMessage.textContent = messageObj.message;
    this.elements.statusMessage.className = `status ${messageObj.type}`;
    this.elements.statusMessage.classList.remove('hidden');

    try {
      this.elements.statusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (_) {}

    // Auto-hide success messages and process next in queue
    if (messageObj.type === 'success' || messageObj.type === 'info') {
      this.currentMessageTimeout = setTimeout(() => {
        if (this.elements.statusMessage) {
          this.elements.statusMessage.classList.add('hidden');
        }
        this.currentMessageTimeout = null;
        // Process next message in queue after hiding current one
        setTimeout(() => this.processMessageQueue(), 100);
      }, messageObj.type === 'success' ? 2000 : 3000);
    } else if (messageObj.type === 'error') {
      // Error messages auto-hide after 8 seconds but user can click to dismiss
      this.currentMessageTimeout = setTimeout(() => {
        if (this.elements.statusMessage) {
          this.elements.statusMessage.classList.add('hidden');
        }
        this.currentMessageTimeout = null;
        setTimeout(() => this.processMessageQueue(), 100);
      }, 8000);
    }
  }

  clearMessages() {
    this.messageQueue = [];
    if (this.currentMessageTimeout) {
      clearTimeout(this.currentMessageTimeout);
      this.currentMessageTimeout = null;
    }
    if (this.elements.statusMessage) {
      this.elements.statusMessage.classList.add('hidden');
    }
  }

  setButtonLoading(button, loading, originalText = null) {
    if (!button) return;
    if (loading) {
      button.disabled = true;
      button.classList.add('loading');
      button.dataset.originalText = button.textContent;
    } else {
      button.disabled = false;
      button.classList.remove('loading');
      button.textContent = originalText || button.dataset.originalText || button.textContent;
    }
  }

  showProgress(show, percentage = 0, details = '') {
    if (this.elements.authProgress) {
      this.elements.authProgress.classList.toggle('hidden', !show);
    }
    if (this.elements.authProgressFill) {
      this.elements.authProgressFill.style.width = `${percentage}%`;
    }
    if (this.elements.statusDetails) {
      this.elements.statusDetails.classList.toggle('hidden', !details);
      if (details) this.elements.statusDetails.textContent = details;
    }
  }

  setAuthStatus(status, details = '', checking = false) {
    if (this.elements.authStatus) {
      this.elements.authStatus.classList.toggle('checking', checking);
    }
    if (this.elements.authStatusText) {
      this.elements.authStatusText.textContent = status;
    }
    this.showProgress(false, 0, details);
  }

  showDetailedError(message, error, suggestions = []) {
    const errorHtml = `
      <div class="error-details">
        <details>
          <summary>❌ ${message}</summary>
          <div style="margin-top: 8px;">
            <strong>Error details:</strong> ${error}
            ${suggestions.length > 0 ? `
              <p><strong>Possible solutions:</strong></p>
              <ul>
                ${suggestions.map(s => `<li>${s}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        </details>
      </div>
    `;

    if (this.elements.statusMessage) {
      this.elements.statusMessage.innerHTML = errorHtml;
      this.elements.statusMessage.className = 'status error';
      this.elements.statusMessage.classList.remove('hidden');
    }
  }

  getErrorSuggestions(error) {
    const errorMsg = error.toLowerCase();

    if (errorMsg.includes('worker returned no access token') || errorMsg.includes('invalid response format')) {
      return [
        'Check if your Cloudflare Worker is properly deployed',
        'Verify RAINDROP_CLIENT_ID and RAINDROP_CLIENT_SECRET are set in Worker environment',
        'Check SESSION_SECRET is configured in Worker',
        'Try using Manual authentication instead',
        'Contact your Worker administrator'
      ];
    }

    if (errorMsg.includes('worker error')) {
      return [
        'Check Worker logs in Cloudflare dashboard',
        'Verify Worker environment variables are correct',
        'Ensure Worker script is deployed and active',
        'Try Manual authentication as fallback'
      ];
    }

    if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
      return [
        'Check your internet connection',
        'Verify Cloudflare Worker URL is correct',
        'Try again in a few moments'
      ];
    }

    if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
      return [
        'Check your Client ID and Secret are correct',
        'Ensure your Raindrop.io app is properly configured',
        'Try re-entering your credentials'
      ];
    }

    if (errorMsg.includes('cors') || errorMsg.includes('blocked')) {
      return [
        'Check browser extension permissions',
        'Verify redirect URI matches your app configuration',
        'Try using Managed OAuth instead'
      ];
    }

    return [
      'Check browser console for more details',
      'Try refreshing the page and attempting again',
      'Contact support if the problem persists'
    ];
  }

  async validateTokenSecurity() {
    try {
      const { accessToken, tokenExpiresAt, refreshToken } = await chrome.storage.sync.get(['accessToken', 'tokenExpiresAt', 'refreshToken']);

      if (!accessToken) {
        return { valid: false, reason: 'No access token found' };
      }

      // Check expiration
      if (tokenExpiresAt && Date.now() > tokenExpiresAt) {
        if (refreshToken) {
          try {
            await this.oauth.refreshAccessToken();
            return { valid: true, refreshed: true };
          } catch (e) {
            return { valid: false, reason: 'Token expired and refresh failed', error: e.message };
          }
        } else {
          return { valid: false, reason: 'Token expired, no refresh token available' };
        }
      }

      // Test token validity with API call
      const result = await this.oauth.testConnection();
      if (result?.success) {
        return { valid: true, user: result.user };
      } else {
        return { valid: false, reason: 'Token invalid or API test failed' };
      }
    } catch (error) {
      return { valid: false, reason: 'Token validation error', error: error.message };
    }
  }

  sanitizeCredentials(clientId, clientSecret) {
    // Basic sanitization and validation
    const sanitized = {
      clientId: (clientId || '').trim(),
      clientSecret: (clientSecret || '').trim()
    };

    const validation = {
      valid: true,
      errors: []
    };

    if (!sanitized.clientId) {
      validation.errors.push('Client ID is required');
    } else if (sanitized.clientId.length < 10) {
      validation.errors.push('Client ID seems too short');
    }

    if (!sanitized.clientSecret) {
      validation.errors.push('Client Secret is required');
    } else if (sanitized.clientSecret.length < 20) {
      validation.errors.push('Client Secret seems too short');
    }

    // Check for common patterns that might indicate invalid credentials
    if (sanitized.clientId.includes(' ') || sanitized.clientSecret.includes(' ')) {
      validation.errors.push('Credentials should not contain spaces');
    }

    validation.valid = validation.errors.length === 0;
    return { sanitized, validation };
  }

  startTokenHealthCheck() {
    // Check token health every 10 minutes
    setInterval(async () => {
      const validation = await this.validateTokenSecurity();
      if (!validation.valid && validation.reason !== 'No access token found') {
        console.warn('Token health check failed:', validation.reason);
        this.setAuthStatus('Token issue detected', validation.reason);
      }
    }, 10 * 60 * 1000);

    // Also check configuration health
    this.startConfigHealthCheck();
  }

  startConfigHealthCheck() {
    // Check configuration every 5 minutes
    setInterval(async () => {
      const healthReport = await this.validateConfiguration();
      if (healthReport.warnings.length > 0) {
        console.warn('Configuration warnings:', healthReport.warnings);
      }
    }, 5 * 60 * 1000);
  }

  async validateConfiguration() {
    const config = await chrome.storage.sync.get([
      'managedOAuth', 'managedOAuthBaseUrl', 'clientId', 'clientSecret',
      'redirectUri', 'syncEnabled', 'syncIntervalMinutes'
    ]);

    const healthReport = {
      valid: true,
      warnings: [],
      errors: [],
      suggestions: []
    };

    // Check managed OAuth configuration
    if (config.managedOAuth) {
      if (!config.managedOAuthBaseUrl) {
        healthReport.errors.push('Managed OAuth enabled but no base URL configured');
        healthReport.suggestions.push('Set a valid Cloudflare Worker URL');
      } else {
        // Test worker health if in managed mode
        try {
          const workerHealth = await this.checkWorker();
          if (!workerHealth.healthy) {
            healthReport.warnings.push('Cloudflare Worker is not responding correctly');
            healthReport.suggestions.push('Check your Worker deployment and environment variables');
          }
        } catch (e) {
          healthReport.warnings.push('Could not verify Worker health');
        }
      }
    } else {
      // Manual mode - check credentials
      if (!config.clientId || !config.clientSecret) {
        healthReport.errors.push('Manual OAuth mode requires both Client ID and Secret');
        healthReport.suggestions.push('Enter your Raindrop.io app credentials');
      }
    }

    // Check sync configuration
    if (config.syncEnabled) {
      const interval = Number(config.syncIntervalMinutes) || 5;
      if (interval < 1) {
        healthReport.warnings.push('Sync interval is too short (< 1 minute)');
        healthReport.suggestions.push('Set sync interval to at least 1 minute to avoid rate limits');
      } else if (interval > 60) {
        healthReport.warnings.push('Sync interval is very long (> 1 hour)');
        healthReport.suggestions.push('Consider a shorter interval for more frequent updates');
      }
    }

    // Check redirect URI
    if (config.redirectUri && !config.redirectUri.includes('chromiumapp.org')) {
      healthReport.warnings.push('Redirect URI may not be correct for browser extension');
      healthReport.suggestions.push('Use the default extension identity URL for redirect URI');
    }

    healthReport.valid = healthReport.errors.length === 0;
    return healthReport;
  }

  async runFullHealthCheck() {
    const results = {
      configuration: await this.validateConfiguration(),
      token: await this.validateTokenSecurity(),
      worker: null,
      timestamp: Date.now()
    };

    // Check worker if in managed mode
    const { managedOAuth } = await chrome.storage.sync.get(['managedOAuth']);
    if (managedOAuth) {
      results.worker = await this.checkWorker();
    }

    return results;
  }

  async runHealthCheckUI() {
    try {
      this.setButtonLoading(this.elements.runHealthCheck, true);
      if (this.elements.authStateOut) {
        this.elements.authStateOut.textContent = 'Running comprehensive health check...';
      }

      const healthResults = await this.runFullHealthCheck();

      const report = this.formatHealthReport(healthResults);
      if (this.elements.authStateOut) {
        this.elements.authStateOut.innerHTML = report;
      }

      // Show summary message
      const hasErrors = healthResults.configuration.errors.length > 0 ||
                       (healthResults.worker && !healthResults.worker.healthy) ||
                       !healthResults.token.valid;

      if (hasErrors) {
        this.showMessage('Health check found issues. See debug output for details.', 'error');
      } else {
        this.showMessage('Health check passed! All systems are operational.', 'success');
      }

    } catch (error) {
      if (this.elements.authStateOut) {
        this.elements.authStateOut.textContent = `Health check failed: ${error.message}`;
      }
      this.showMessage(`Health check failed: ${error.message}`, 'error');
    } finally {
      this.setButtonLoading(this.elements.runHealthCheck, false);
    }
  }

  formatHealthReport(results) {
    const formatTimestamp = (ts) => new Date(ts).toLocaleString();

    let report = `<div style="font-family: monospace; font-size: 12px;">`;
    report += `<strong>🔍 Health Check Report</strong><br>`;
    report += `Generated: ${formatTimestamp(results.timestamp)}<br><br>`;

    // Configuration
    report += `<strong>📋 Configuration:</strong><br>`;
    if (results.configuration.valid) {
      report += `✅ Valid<br>`;
    } else {
      report += `❌ Issues found<br>`;
      results.configuration.errors.forEach(error => {
        report += `  • Error: ${error}<br>`;
      });
    }
    if (results.configuration.warnings.length > 0) {
      results.configuration.warnings.forEach(warning => {
        report += `  ⚠️ Warning: ${warning}<br>`;
      });
    }
    report += `<br>`;

    // Token
    report += `<strong>🔐 Authentication:</strong><br>`;
    if (results.token.valid) {
      report += `✅ Valid${results.token.refreshed ? ' (refreshed)' : ''}<br>`;
      if (results.token.user) {
        report += `  User: ${results.token.user.name || results.token.user.email || 'Unknown'}<br>`;
      }
    } else {
      report += `❌ ${results.token.reason}<br>`;
      if (results.token.error) {
        report += `  Error: ${results.token.error}<br>`;
      }
    }
    report += `<br>`;

    // Worker (if applicable)
    if (results.worker) {
      report += `<strong>☁️ Cloudflare Worker:</strong><br>`;
      if (results.worker.healthy) {
        report += `✅ Healthy (${results.worker.responseTime}ms)<br>`;
        if (results.worker.version) {
          report += `  Version: ${results.worker.version}<br>`;
        }
      } else {
        report += `❌ Unhealthy<br>`;
        if (results.worker.error) {
          report += `  Error: ${results.worker.error}<br>`;
        }
      }
      report += `<br>`;
    }

    // Suggestions
    const allSuggestions = [
      ...results.configuration.suggestions,
      ...(results.token.suggestions || [])
    ];

    if (allSuggestions.length > 0) {
      report += `<strong>💡 Suggestions:</strong><br>`;
      allSuggestions.forEach(suggestion => {
        report += `  • ${suggestion}<br>`;
      });
    }

    report += `</div>`;
    return report;
  }

  async suggestFallbackAuth(fallbackType, originalError) {
    // Add a delay to not overwhelm the user immediately
    setTimeout(() => {
      const fallbackSuggestions = this.getFallbackSuggestions(fallbackType, originalError);
      if (fallbackSuggestions.length > 0) {
        this.showFallbackOptions(fallbackType, fallbackSuggestions);
      }
    }, 2000);
  }

  getFallbackSuggestions(fallbackType, error) {
    const errorMsg = error.toLowerCase();

    switch (fallbackType) {
      case 'managed-to-manual':
        if (errorMsg.includes('network') || errorMsg.includes('worker') || errorMsg.includes('cloudflare') ||
            errorMsg.includes('no access token') || errorMsg.includes('invalid response format')) {
          return [
            {
              title: 'Try Manual Authentication',
              description: 'Switch to direct authentication with your credentials',
              action: 'switch-to-manual',
              priority: 'high'
            }
          ];
        }
        break;

      case 'manual-to-managed':
        if (errorMsg.includes('cors') || errorMsg.includes('redirect') || errorMsg.includes('identity')) {
          return [
            {
              title: 'Try Managed Authentication',
              description: 'Use Cloudflare Worker for safer authentication',
              action: 'switch-to-managed',
              priority: 'medium'
            }
          ];
        }
        break;
    }

    return [];
  }

  showFallbackOptions(fallbackType, suggestions) {
    const container = document.createElement('div');
    container.className = 'fallback-suggestions';
    container.style.cssText = `
      background: #f0f8ff;
      border: 1px solid #4a90e2;
      border-radius: 6px;
      padding: 12px;
      margin: 12px 0;
      position: relative;
    `;

    const html = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="color: #4a90e2; margin-right: 8px;">💡</span>
        <strong style="color: #2c5aa0;">Alternative Authentication Method</strong>
        <button onclick="this.parentElement.parentElement.parentElement.remove()"
                style="margin-left: auto; background: none; border: none; font-size: 18px; cursor: pointer; color: #999;">×</button>
      </div>
      ${suggestions.map(s => `
        <div style="margin: 8px 0;">
          <div style="font-weight: 500; color: #2c5aa0;">${s.title}</div>
          <div style="font-size: 13px; color: #666; margin: 4px 0;">${s.description}</div>
          <button onclick="window.optionsManager.executeFallback('${s.action}')"
                  class="button secondary" style="margin-top: 6px; padding: 6px 12px; font-size: 12px;">
            Try This Method
          </button>
        </div>
      `).join('')}
    `;

    container.innerHTML = html;

    // Insert after status message
    const statusMessage = this.elements.statusMessage;
    if (statusMessage && statusMessage.parentNode) {
      statusMessage.parentNode.insertBefore(container, statusMessage.nextSibling);
    }
  }

  async executeFallback(action) {
    switch (action) {
      case 'switch-to-manual':
        if (this.elements.managedOAuth) {
          this.elements.managedOAuth.checked = false;
          this.updateManagedUi();
          await this.saveConfiguration();
          this.showMessage('Switched to Manual mode. Please enter your Client ID and Secret above, then try authenticating.', 'info');
        }
        break;

      case 'switch-to-managed':
        if (this.elements.managedOAuth) {
          this.elements.managedOAuth.checked = true;
          this.updateManagedUi();
          await this.saveConfiguration();
          this.showMessage('Switched to Managed mode. You can now try Cloudflare authentication.', 'info');
        }
        break;
    }

    // Remove fallback suggestions
    document.querySelectorAll('.fallback-suggestions').forEach(el => el.remove());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new OptionsManager();
  window.optionsManager = app; // Global reference for fallback buttons
  try { app.openRoadmapLink?.(); } catch (_) {}
});
