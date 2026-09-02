const defaults = { idleMinutes: 5, whitelist: [], urlRules: [], discardPinned: false, discardAudio: false };
const form = document.querySelector("#form"), saved = document.querySelector("#saved");
const preset = document.querySelector("#idlePreset"), minutes = document.querySelector("#idleMinutes");
const rows = document.querySelector("#ruleRows");

function addRule(rule = { pattern: "", idleMinutes: 5 }) {
  const row = document.createElement("tr");
  row.innerHTML = `<td><input class="rule-pattern" placeholder="youtube.com" value="${rule.pattern}"></td><td><input class="rule-minutes" type="number" min="1" max="1440" value="${rule.idleMinutes}"> min</td><td><button type="button" class="remove-rule" aria-label="Remove rule">×</button></td>`;
  row.querySelector(".remove-rule").addEventListener("click", () => row.remove());
  rows.append(row);
}
function setTimeInput() {
  const custom = preset.value === "custom";
  minutes.disabled = !custom;
  if (!custom) minutes.value = preset.value;
}
chrome.storage.sync.get(defaults).then(config => {
  minutes.value = config.idleMinutes;
  preset.value = ["1", "5", "10", "15", "30", "60"].includes(String(config.idleMinutes)) ? String(config.idleMinutes) : "custom";
  setTimeInput();
  document.querySelector("#discardPinned").checked = config.discardPinned;
  document.querySelector("#discardAudio").checked = config.discardAudio;
  document.querySelector("#whitelist").value = config.whitelist.join("\n");
  config.urlRules.forEach(addRule);
});
preset.addEventListener("change", () => { setTimeInput(); if (preset.value === "custom") minutes.focus(); });
document.querySelector("#addRule").addEventListener("click", () => addRule());
form.addEventListener("submit", async event => {
  event.preventDefault();
  const urlRules = [...rows.querySelectorAll("tr")].map(row => ({
    pattern: row.querySelector(".rule-pattern").value.trim().toLowerCase(),
    idleMinutes: Number(row.querySelector(".rule-minutes").value)
  })).filter(rule => rule.pattern && Number.isFinite(rule.idleMinutes) && rule.idleMinutes >= 1);
  await chrome.storage.sync.set({
    idleMinutes: Number(minutes.value),
    urlRules,
    discardPinned: document.querySelector("#discardPinned").checked,
    discardAudio: document.querySelector("#discardAudio").checked,
    whitelist: document.querySelector("#whitelist").value.split("\n").map(x => x.trim().toLowerCase()).filter(Boolean)
  });
  saved.textContent = "Saved."; setTimeout(() => saved.textContent = "", 1800);
});