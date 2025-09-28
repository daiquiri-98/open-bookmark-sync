class PopupUI {
  constructor() {
    this.oauth = new RaindropOAuth();
    this.$ = id => document.getElementById(id);
    this.bind();
    this.load();
  }

  bind() {
    this.$('openSettings').addEventListener('click', () => chrome.runtime.openOptionsPage());
    this.$('syncNow').addEventListener('click', () => this.syncNow());
    this.$('authenticate').addEventListener('click', () => this.authenticate());
    this.$('logout').addEventListener('click', () => this.logout());
    this.$('interval').addEventListener('change', () => this.saveInterval());
    this.$('twoWayMode').addEventListener('change', () => this.saveTwoWay());
  }

  async load() {
    await this.updateAuth();
    const { syncIntervalMinutes, twoWayMode } = await chrome.storage.sync.get(['syncIntervalMinutes','twoWayMode']);
    this.$('interval').value = String(syncIntervalMinutes || 5);
    this.$('twoWayMode').value = twoWayMode || 'additions_only';

    // Support links from local text files
    this.loadSupportLinks();
  }

  async updateAuth() {
    const { accessToken } = await chrome.storage.sync.get(['accessToken']);
    const dot = this.$('dot');
    const text = this.$('statusText');
    const auth = !!accessToken;
    dot.className = 'dot ' + (auth ? 'ok' : 'err');
    text.textContent = auth ? 'Connected' : 'Not authenticated';
    this.$('authenticate').style.display = auth ? 'none' : 'inline-block';
    this.$('logout').style.display = auth ? 'inline-block' : 'none';
  }

  async syncNow() {
    try {
      this.setMsg('Syncing…');
      const res = await chrome.runtime.sendMessage({ action: 'syncNow' });
      if (res && res.success) this.setMsg('Sync completed', true);
      else this.setMsg('Sync failed: ' + (res?.error || 'Unknown'), false);
    } catch (e) {
      this.setMsg('Sync failed: ' + e.message, false);
    }
  }

  async authenticate() {
    try {
      this.setMsg('Authenticating…');
      const ok = await this.oauth.startAuthFlow();
      this.setMsg('Authenticated', true);
      await this.updateAuth();
    } catch (e) {
      this.setMsg('Auth failed: ' + e.message, false);
    }
  }

  async logout() {
    try {
      await this.oauth.logout();
      await this.updateAuth();
      this.setMsg('Logged out', true);
    } catch (e) {
      this.setMsg('Logout failed: ' + e.message, false);
    }
  }

  async saveInterval() {
    const minutes = Math.max(1, Number(this.$('interval').value) || 5);
    await chrome.storage.sync.set({ syncIntervalMinutes: minutes });
    this.setMsg('Interval saved', true);
  }

  async saveTwoWay() {
    const mode = this.$('twoWayMode').value;
    await chrome.storage.sync.set({ twoWayMode: mode });
    this.setMsg('Two-way mode: ' + mode, true);
  }

  async loadSupportLinks() {
    try {
      // BMC
      const bmc = await this.readFirstNonEmptyUrl(['buymeacoffee.txt']);
      const fallbackBmc = 'https://buymeacoffee.com/daiquiri';
      const a1 = this.$('bmcLink');
      if (a1) a1.href = bmc || fallbackBmc;
      // Website
      const site = await this.readFirstNonEmptyUrl(['website.txt']);
      const fallbackSite = 'https://daiquiri.dev';
      const s1 = this.$('siteLink');
      if (s1) s1.href = site || fallbackSite;
    } catch (e) {
      // ignore
    }
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
      } catch (e) { /* ignore */ }
    }
    return '';
  }

  normalizeUrl(s) {
    try {
      if (!/^https?:\/\//i.test(s)) return 'https://' + s;
      return s;
    } catch (e) { return ''; }
  }

  setMsg(msg, ok) {
    const el = this.$('msg');
    el.textContent = msg;
    el.style.color = ok ? '#155724' : '#721c24';
  }
}

document.addEventListener('DOMContentLoaded', () => new PopupUI());
