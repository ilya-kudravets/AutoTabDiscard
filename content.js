let dirty = false;
function update() {
  chrome.runtime.sendMessage({ type: dirty ? "form-dirty" : "form-clean" });
}
addEventListener("input", event => {
  const el = event.target;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    dirty = true;
    update();
  }
}, true);
addEventListener("submit", () => { dirty = false; update(); }, true);
addEventListener("beforeunload", () => { dirty = false; update(); });