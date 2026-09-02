const defaults = { idleMinutes: 30, whitelist: [], discardPinned: false, discardAudio: false };
const form = document.querySelector("#form"), saved = document.querySelector("#saved");
chrome.storage.sync.get(defaults).then(config => {
  for (const [key, value] of Object.entries(config)) {
    const el = document.querySelector("#" + key);
    if (!el) continue;
    if (el.type === "checkbox") el.checked = value;
    else if (key === "whitelist") el.value = value.join("\n");
    else el.value = value;
  }
});
form.addEventListener("submit", async event => {
  event.preventDefault();
  await chrome.storage.sync.set({
    idleMinutes: Number(document.querySelector("#idleMinutes").value),
    discardPinned: document.querySelector("#discardPinned").checked,
    discardAudio: document.querySelector("#discardAudio").checked,
    whitelist: document.querySelector("#whitelist").value.split("\n").map(x => x.trim().toLowerCase()).filter(Boolean)
  });
  saved.textContent = "Saved."; setTimeout(() => saved.textContent = "", 1800);
});