const DEFAULTS = {
  enabled: true,
  idleMinutes: 30,
  whitelist: [],
  discardPinned: false,
  discardAudio: false,
  discardWhenCharging: false,
  protectForms: true
};

const formDirtyTabs = new Set();
let activeTabId = null;

async function settings() {
  return { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) };
}

function matchesWhitelist(url, rules) {
  try {
    const { hostname, href } = new URL(url);
    return rules.some(raw => {
      const rule = raw.trim().toLowerCase();
      if (!rule) return false;
      return hostname === rule || hostname.endsWith("." + rule) || href.toLowerCase().includes(rule);
    });
  } catch { return false; }
}

async function discardEligibleTabs({ manual = false } = {}) {
  const config = await settings();
  if (!config.enabled && !manual) return { discarded: 0, skipped: 0 };

  const tabs = await chrome.tabs.query({});
  const cutoff = Date.now() - config.idleMinutes * 60_000;
  let discarded = 0, skipped = 0;

  for (const tab of tabs) {
    const protectedTab =
      tab.id === activeTabId ||
      tab.discarded ||
      (!config.discardPinned && tab.pinned) ||
      (!config.discardAudio && (tab.audible || tab.mutedInfo?.muted === false && tab.status === "loading")) ||
      matchesWhitelist(tab.url || "", config.whitelist) ||
      (config.protectForms && formDirtyTabs.has(tab.id));

    if (protectedTab || (!manual && (tab.lastAccessed || 0) > cutoff)) {
      skipped++;
      continue;
    }
    try {
      await chrome.tabs.discard(tab.id);
      discarded++;
    } catch { skipped++; }
  }
  return { discarded, skipped };
}

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.sync.set({ ...(await chrome.storage.sync.get()), ...DEFAULTS });
  chrome.contextMenus.create({ id: "discard-tab", title: "Hibernate this tab", contexts: ["page", "action"] });
  chrome.contextMenus.create({ id: "toggle-whitelist", title: "Protect this site from hibernation", contexts: ["page", "action"] });
  await chrome.alarms.create("tab-hibernator", { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "tab-hibernator") discardEligibleTabs();
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  activeTabId = tabId;
  formDirtyTabs.delete(tabId);
});

chrome.tabs.onRemoved.addListener(tabId => formDirtyTabs.delete(tabId));

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message.type === "form-dirty" && sender.tab?.id) formDirtyTabs.add(sender.tab.id);
  if (message.type === "form-clean" && sender.tab?.id) formDirtyTabs.delete(sender.tab.id);
  if (message.type === "discard-now") discardEligibleTabs({ manual: true }).then(respond);
  if (message.type === "get-status") {
    settings().then(async config => respond({ config, formProtected: formDirtyTabs.size }));
  }
  return true;
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === "discard-tab") {
    await chrome.tabs.discard(tab.id);
  }
  if (info.menuItemId === "toggle-whitelist" && tab.url) {
    const config = await settings();
    const host = new URL(tab.url).hostname;
    const exists = config.whitelist.includes(host);
    await chrome.storage.sync.set({ whitelist: exists ? config.whitelist.filter(x => x !== host) : [...config.whitelist, host] });
  }
});