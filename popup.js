const enabled = document.querySelector("#enabled");
const summary = document.querySelector("#summary");
const result = document.querySelector("#result");

chrome.runtime.sendMessage({ type: "get-status" }, ({ config, formProtected }) => {
  enabled.checked = config.enabled;
  summary.textContent = `Tabs idle for ${config.idleMinutes} min will hibernate. ${formProtected} tab(s) protected by unsaved forms.`;
});

enabled.addEventListener("change", () => chrome.storage.sync.set({ enabled: enabled.checked }));
document.querySelector("#settings").addEventListener("click", () => chrome.runtime.openOptionsPage());
document.querySelector("#hibernate").addEventListener("click", async () => {
  const data = await chrome.runtime.sendMessage({ type: "discard-now" });
  result.textContent = `Hibernated ${data.discarded} tab(s); skipped ${data.skipped}.`;
});