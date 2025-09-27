// Options page functionality (clean rebuild)

class OptionsManager {
  constructor() {
    this.oauth = new RaindropOAuth();
    this.initializeElements();
    this.bindEvents();
    this.loadSettings();
    this.updateAuthStatus();
    this.loadSupportLinks();
    const initialTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'api';
    this.showTab(initialTab);
  }

  initializeElements() {
    this.elements = {
      clientId: document.getElementById('clientId'),
      clientSecret: document.getElementById('clientSecret'),
      managedOAuth: document.getElementById('managedOAuth'),
      managedOAuthBaseUrl: document.getElementById('managedOAuthBaseUrl'),
      toggleClientId: document.getElementById('toggleClientId'),
      toggleClientSecret: document.getElementById('toggleClientSecret'),
      redirectUri: document.getElementById('redirectUri'),
      saveConfig: document.getElementById('saveConfig'),
      authenticate: document.getElementById('authenticate'),
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
    E.authenticate && E.authenticate.addEventListener('click', () => this.authenticate());
    E.testConnection && E.testConnection.addEventListener('click', () => this.testConnection());
    E.logout && E.logout.addEventListener('click', () => this.logout());
    E.syncNow && E.syncNow.addEventListener('click', () => this.syncNow());

    // Auto-save on input change
    [E.clientId, E.clientSecret, E.managedOAuthBaseUrl].forEach(input => { input && input.addEventListener('input', () => this.saveConfiguration()); });
    // Managed OAuth is disabled in UI; keep handler but will be no-op
    E.managedOAuth && E.managedOAuth.addEventListener('change', () => this.onManagedToggle());

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

  toggleSecret(inputEl, btnEl) {
    if (!inputEl || !btnEl) return;
    const show = inputEl.type === 'password';
    inputEl.type = show ? 'text' : 'password';
    btnEl.textContent = show ? 'Hide' : 'Show';
  }

  async loadSettings() {
    try {
      const config = await chrome.storage.sync.get([
        'clientId','clientSecret','managedOAuth','managedOAuthBaseUrl','lastSyncTime','syncIntervalMinutes','targetFolderId',
        'collectionsSort','bookmarksSort','rateLimitRpm','twoWayMode',
        'selectedCollectionIds','syncEnabled','topLevelOnly'
      ]);

      const E = this.elements;
      if (config.clientId) E.clientId.value = config.clientId;
      if (config.clientSecret) E.clientSecret.value = config.clientSecret;
      // Force managed OAuth off in UI for now
      if (E.managedOAuth) {
        E.managedOAuth.checked = false;
        E.managedOAuth.disabled = true;
      }
      if (E.managedOAuthBaseUrl) {
        E.managedOAuthBaseUrl.value = config.managedOAuthBaseUrl || 'https://raindrop-oauth.daiquiri.dev';
        E.managedOAuthBaseUrl.disabled = true;
      }
      this.updateManagedUi();

      if (chrome.identity && chrome.identity.getRedirectURL) {
        const redirectUri = chrome.identity.getRedirectURL();
        E.redirectUri && (E.redirectUri.value = redirectUri);
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

  onManagedToggle() {
    this.updateManagedUi();
    this.saveConfiguration();
  }

  updateManagedUi() {
    const E = this.elements;
    const managed = false; // Temporarily disabled
    // Disable ID/Secret when managed is on
    [E.clientId, E.clientSecret].forEach(el => { if (el) { el.disabled = managed; el.classList.toggle('pre-filled', managed); }});
    if (E.managedOAuthBaseUrl) E.managedOAuthBaseUrl.disabled = true;
    const baseGroup = document.getElementById('managedBaseGroup');
    if (baseGroup) baseGroup.style.display = 'none';
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
      } catch (_) {}
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
      const clientId = this.elements.clientId?.value.trim() || '';
      const clientSecret = this.elements.clientSecret?.value.trim() || '';
      const managedOAuth = false; // force off for now
      const managedOAuthBaseUrl = this.elements.managedOAuthBaseUrl?.value.trim() || 'https://raindrop-oauth.daiquiri.dev';

      if (!clientId) return this.showMessage('Client ID is required', 'error');
      if (!clientSecret) return this.showMessage('Client Secret is required', 'error');

      await chrome.storage.sync.set({ clientId, clientSecret, managedOAuth, managedOAuthBaseUrl });
      this.showMessage('Configuration saved successfully', 'success');
    } catch (_) { this.showMessage('Failed to save configuration', 'error'); }
  }

  async authenticate() {
    try {
      if (this.elements.authenticate) { this.elements.authenticate.disabled = true; this.elements.authenticate.textContent = 'Authenticating...'; }
      const res = await this.oauth.startAuthFlow();
      if (res?.success) {
        this.showMessage('Authentication successful!', 'success');
        await this.updateAuthStatus();
        await this.loadUserInfo();
      } else {
        this.showMessage('Authentication failed', 'error');
      }
    } catch (e) {
      this.showMessage(`Authentication failed: ${e.message}`, 'error');
    } finally {
      if (this.elements.authenticate) { this.elements.authenticate.disabled = false; this.elements.authenticate.textContent = 'Authenticate with Raindrop.io'; }
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
      if (result?.success && result.user && this.elements.userInfo) {
        this.elements.userInfo.innerHTML = `
          <div>Connected as: <strong>${result.user.name || result.user.email || 'Unknown'}</strong></div>
          ${result.user.email ? `<div>Email: ${result.user.email}</div>` : ''}
        `;
        this.elements.userInfo.classList.remove('hidden');
      }
    } catch (_) {}
  }

  clearUserInfo() { if (this.elements.userInfo) { this.elements.userInfo.classList.add('hidden'); this.elements.userInfo.innerHTML = ''; } }

  showMessage(message, type = 'info') {
    if (!this.elements.statusMessage) return;
    this.elements.statusMessage.textContent = message;
    this.elements.statusMessage.className = `status ${type}`;
    this.elements.statusMessage.classList.remove('hidden');
    try { this.elements.statusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (_) {}
    if (type === 'success') setTimeout(() => { this.elements.statusMessage.classList.add('hidden'); }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new OptionsManager();
  try { app.openRoadmapLink?.(); } catch (_) {}
});
