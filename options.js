const defaults = { idleMinutes: 5, whitelist: [], discardPinned: false, discardAudio: false };
const form = document.querySelector("#form"), saved = document.querySelector("#saved");
const preset = document.querySelector("#idlePreset"), minutes = document.querySelector("#idleMinutes");
chrome.storage.sync.get(defaults).then(config => {
  minutes.value = config.idleMinutes;
  preset.value = ["1", "5"].includes(String(config.idleMinutes)) ? String(config.idleMinutes) : "custom";
  document.querySelector("#discardPinned").checked = config.discardPinned;
  document.querySelector("#discardAudio").checked = config.discardAudio;
  document.querySelector("#whitelist").value = config.whitelist.join("\n");
});
preset.addEventListener("change", () => {
  if (preset.value !== "custom") minutes.value = preset.value;
  minutes.focus();
});
form.addEventListener("submit", async event => {
  event.preventDefault();
  await chrome.storage.sync.set({
    idleMinutes: Number(minutes.value),
    discardPinned: document.querySelector("#discardPinned").checked,
    discardAudio: document.querySelector("#discardAudio").checked,
    whitelist: document.querySelector("#whitelist").value.split("\n").map(x => x.trim().toLowerCase()).filter(Boolean)
  });
  saved.textContent = "Saved."; setTimeout(() => saved.textContent = "", 1800);
});