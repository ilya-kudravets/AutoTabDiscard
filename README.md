# Tab Hibernator

A minimal, fast Chrome extension that hibernates inactive tabs and returns their memory to the system. It is an original Manifest V3 implementation inspired by the general tab-discarding workflow—not a copy of another extension.

## Fast, low-resource behavior

- No scripts are injected into websites.
- No fixed background polling: Chrome wakes the extension only when the next tab becomes eligible, when you switch tabs, or when settings change.
- Uses Chrome's native `tabs.discard` API, so discarded pages reload only when you return to them.
- Choose 1, 5, 10, 15, 30, or 60 minutes—or enter a custom value.
- Assign a separate hibernation time to each URL/domain rule; rules take precedence over the default timer.

## Built-in popular presets

| URLs | Hibernation time |
| --- | ---: |
| YouTube | 1 min |
| Netflix, Twitch | 5 min |
| Facebook, Instagram, X, Telegram Web, WhatsApp Web, Discord | 10 min |
| Reddit | 15 min |
| Gmail | 30 min |
| Google Docs | 60 min |

You can edit or delete any preset in Settings. To hibernate YouTube, enable **“Allow tabs playing audio/video to hibernate”**. Paused video is not specially excluded.

## Features

- Automatic and manual hibernation
- Per-domain and URL-prefix lifetime rules
- Per-domain exclusion list
- Pinned tabs and audible tabs protected by default
- Synced preferences
- No collection or transmission of browsing data

## Install

1. Clone the repository or download the latest `tab-hibernator.zip` from the GitHub Release.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose the repository folder.

## Tests

The CI workflow validates the MV3 manifest and runs `node --test tests/manifest.test.mjs`.

For a quick Chrome API smoke test after loading the unpacked extension, open:

`chrome-extension://<your-extension-id>/tests/chrome-smoke.html`

All three checks should pass: Extension APIs available, settings readable, and tab access available.
