const POPULAR_URL_RULES = [
  { pattern: "youtube.com", idleMinutes: 1 },
  { pattern: "netflix.com", idleMinutes: 5 },
  { pattern: "twitch.tv", idleMinutes: 5 },
  { pattern: "facebook.com", idleMinutes: 10 },
  { pattern: "instagram.com", idleMinutes: 10 },
  { pattern: "x.com", idleMinutes: 10 },
  { pattern: "web.telegram.org", idleMinutes: 10 },
  { pattern: "web.whatsapp.com", idleMinutes: 10 },
  { pattern: "discord.com", idleMinutes: 10 },
  { pattern: "reddit.com", idleMinutes: 15 },
  { pattern: "mail.google.com", idleMinutes: 30 },
  { pattern: "docs.google.com", idleMinutes: 60 }
];
const DEFAULTS = { enabled: true, idleMinutes: 5, whitelist: [], urlRules: POPULAR_URL_RULES, discardPinned: false, discardAudio: false };
let activeTabId;

async function settings() { return { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) }; }
function matchesUrlRule(url, pattern) {
  const rule = pattern.trim().toLowerCase();
  if (!rule) return false;
  try {
    const parsed = new URL(url), full = parsed.href.toLowerCase(), host = parsed.hostname.toLowerCase();
    return rule.includes("://") ? full.startsWith(rule) : host === rule || host.endsWith("." + rule);
  } catch { return false; }
}
function idleMinutesFor(tab, config) {
  const rule = config.urlRules.find(item => matchesUrlRule(tab.url || "", item.pattern));
  return rule ? rule.idleMinutes : config.idleMinutes;
}
function isProtected(tab, config) {
  if (tab.id === activeTabId || tab.discarded) return true;
  if (!config.discardPinned && tab.pinned) return true;
  if (!config.discardAudio && tab.audible) return true;
  return config.whitelist.some(rule => matchesUrlRule(tab.url || "", rule));
}
async function scheduleNextWake() {
  const config = await settings();
  await chrome.alarms.clear("tab-hibernator");
  if (!config.enabled) return;
  const earliest = (await chrome.tabs.query({})).filter(tab => !isProtected(tab, config))
    .reduce((next, tab) => Math.min(next, (tab.lastAccessed || Date.now()) + idleMinutesFor(tab, config) * 60_000), Infinity);
  if (Number.isFinite(earliest)) chrome.alarms.create("tab-hibernator", { when: Math.max(Date.now() + 60_000, earliest) });
}
async function discardEligibleTabs({ manual = false } = {}) {
  const config = await settings(), now = Date.now();
  if (!config.enabled && !manual) return { discarded: 0, skipped: 0 };
  let discarded = 0, skipped = 0;
  for (const tab of await chrome.tabs.query({})) {
    const expiresAt = (tab.lastAccessed || now) + idleMinutesFor(tab, config) * 60_000;
    if (isProtected(tab, config) || (!manual && expiresAt > now)) { skipped++; continue; }
    try { await chrome.tabs.discard(tab.id); discarded++; } catch { skipped++; }
  }
  await scheduleNextWake();
  return { discarded, skipped };
}
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  const stored = await chrome.storage.sync.get();
  const next = { ...DEFAULTS, ...stored };
  if (reason === "update" && Array.isArray(stored.urlRules) && stored.urlRules.length === 0) next.urlRules = POPULAR_URL_RULES;
  await chrome.storage.sync.set(next);
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