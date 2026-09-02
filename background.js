const DEFAULTS = { enabled: true, idleMinutes: 5, whitelist: [], discardPinned: false, discardAudio: false };
let activeTabId;

async function settings() { return { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) }; }
function isProtected(tab, config) {
  if (tab.id === activeTabId || tab.discarded) return true;
  if (!config.discardPinned && tab.pinned) return true;
  if (!config.discardAudio && tab.audible) return true;
  try {
    const host = new URL(tab.url).hostname.toLowerCase();
    return config.whitelist.some(rule => host === rule || host.endsWith("." + rule));
  } catch { return true; }
}
async function scheduleNextWake() {
  const config = await settings();
  await chrome.alarms.clear("tab-hibernator");
  if (!config.enabled) return;
  const tabs = await chrome.tabs.query({});
  const earliest = tabs.filter(tab => !isProtected(tab, config))
    .reduce((next, tab) => Math.min(next, (tab.lastAccessed || Date.now()) + config.idleMinutes * 60_000), Infinity);
  if (Number.isFinite(earliest)) chrome.alarms.create("tab-hibernator", { when: Math.max(Date.now() + 60_000, earliest) });
}
async function discardEligibleTabs({ manual = false } = {}) {
  const config = await settings();
  if (!config.enabled && !manual) return { discarded: 0, skipped: 0 };
  const cutoff = Date.now() - config.idleMinutes * 60_000;
  let discarded = 0, skipped = 0;
  for (const tab of await chrome.tabs.query({})) {
    if (isProtected(tab, config) || (!manual && (tab.lastAccessed || 0) > cutoff)) { skipped++; continue; }
    try { await chrome.tabs.discard(tab.id); discarded++; } catch { skipped++; }
  }
  await scheduleNextWake();
  return { discarded, skipped };
}
chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(DEFAULTS);
  await chrome.storage.sync.set({ ...DEFAULTS, ...current });
  chrome.contextMenus.create({ id: "discard-tab", title: "Hibernate this tab", contexts: ["page", "action"] });
  chrome.contextMenus.create({ id: "toggle-whitelist", title: "Protect this site from hibernation", contexts: ["page", "action"] });
  scheduleNextWake();
});
chrome.runtime.onStartup.addListener(scheduleNextWake);
chrome.tabs.onActivated.addListener(({ tabId }) => { activeTabId = tabId; scheduleNextWake(); });
chrome.tabs.onRemoved.addListener(scheduleNextWake);
chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === "tab-hibernator") discardEligibleTabs(); });
chrome.storage.onChanged.addListener((_, area) => { if (area === "sync") scheduleNextWake(); });
chrome.runtime.onMessage.addListener((message, _, respond) => {
  if (message.type === "discard-now") discardEligibleTabs({ manual: true }).then(respond);
  if (message.type === "get-status") settings().then(config => respond({ config }));
  return true;
});
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === "discard-tab") await chrome.tabs.discard(tab.id);
  if (info.menuItemId === "toggle-whitelist" && tab.url) {
    const config = await settings(), host = new URL(tab.url).hostname.toLowerCase();
    await chrome.storage.sync.set({ whitelist: config.whitelist.includes(host) ? config.whitelist.filter(x => x !== host) : [...config.whitelist, host] });
  }
  scheduleNextWake();
});