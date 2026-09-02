const defaults = { idleMinutes: 30, whitelist: [], discardPinned: false, discardAudio: false, protectForms: true };
const form = document.querySelector("#form");
const saved = document.querySelector("#saved");

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
  const idleMinutes = Number(document.querySelector("#idleMinutes").value);
  await chrome.storage.sync.set({
    idleMinutes,
    discardPinned: document.querySelector("#discardPinned").checked,
    discardAudio: document.querySelector("#discardAudio").checked,
    protectForms: document.querySelector("#protectForms").checked,
    whitelist: document.querySelector("#whitelist").value.split("\n").map(x => x.trim()).filter(Boolean)
  });
  saved.textContent = "Saved.";
  setTimeout(() => saved.textContent = "", 1800);
});