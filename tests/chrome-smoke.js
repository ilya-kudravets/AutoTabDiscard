const results = document.querySelector("#results");
function report(name, pass, detail = "") {
  const item = document.createElement("li");
  item.textContent = `${pass ? "PASS" : "FAIL"} — ${name}${detail ? ": " + detail : ""}`;
  item.style.color = pass ? "green" : "crimson";
  results.append(item);
}
async function check(name, fn) {
  try { await fn(); report(name, true); } catch (error) { report(name, false, error.message); }
}
await check("Chrome Extension API is available", () => {
  if (!chrome.runtime?.id || !chrome.tabs || !chrome.storage?.sync) throw new Error("Open this page from a loaded extension");
});
await check("Settings can be read", async () => {
  const value = await chrome.storage.sync.get(["enabled", "idleMinutes"]);
  if (typeof value !== "object") throw new Error("No settings response");
});
await check("Tabs permission works", async () => {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  if (!Array.isArray(tabs)) throw new Error("Expected a tab list");
});