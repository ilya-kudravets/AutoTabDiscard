# Tab Hibernator

A privacy-first, Manifest V3 Chrome extension that unloads inactive tabs to reduce memory use.

## Performance-first design

- **No content scripts**: it never injects code into web pages.
- **No polling**: one native Chrome alarm is scheduled for the next eligible tab, rather than scanning every minute.
- **Native APIs only**: settings and rules are evaluated only when Chrome wakes the extension, a tab changes, or you use the popup.
- Chrome restores discarded tabs on demand, preserving the browser-managed state.

## Features

- Automatic hibernation after a configurable idle period
- One-click hibernation from the popup or right-click menu
- Per-domain protection list
- Pinned tabs and audible tabs protected by default
- Settings synced through Chrome storage

## Install locally

1. Clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select this project folder.

The extension uses only Chrome extension APIs and sends no browsing data to external services.
