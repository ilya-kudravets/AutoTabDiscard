# Tab Hibernator

A minimal, fast Chrome extension that hibernates inactive tabs and returns their memory to the system. It is an original Manifest V3 implementation inspired by the general tab-discarding workflow—not a copy of another extension.

## Fast, low-resource behavior

- No scripts are injected into websites.
- No fixed background polling: Chrome wakes the extension only when the next tab becomes eligible, when you switch tabs, or when settings change.
- Uses Chrome's native `tabs.discard` API, so discarded pages reload only when you return to them.
- Choose 1, 5, 10, 15, 30, or 60 minutes—or enter a custom value.
- Assign a separate hibernation time to each URL/domain rule; rules take precedence over the default timer.

## Built-in rules

| URLs | Hibernation time |
| --- | ---: |
| YouTube | 1 min |
| Netflix, Twitch | 5 min |
| Facebook, Instagram, X | 10 min |
| Reddit | 15 min |

### Protected PWA and communication apps

The following domains are excluded from hibernation by default: Microsoft Teams (all current Teams domains), Slack, WhatsApp Web, Telegram Web, Discord, Gmail, Google Calendar/Meet/Docs/Drive, Notion, Trello, Figma, and Linear. You can edit or remove any exclusion in Settings.

## Features

- Automatic and manual hibernation
- Per-domain and URL-prefix lifetime rules
- Per-domain exclusion list
- Active tabs, pinned tabs, and audible tabs protected by default
- Synced preferences
- No collection or transmission of browsing data

## Install and update locally

1. Clone the repository or download the latest `tab-hibernator.zip` from the GitHub Release.
2. Extract it into a permanent folder, for example `C:\Extensions\tab-hibernator`.
3. Open `chrome://extensions`, enable **Developer mode**, then select **Load unpacked** and choose that folder.

### Update without creating a second extension

Chrome cannot install or update an extension directly from a ZIP.

1. Download the new ZIP and extract its contents **over the same folder** used in step 3 above.
2. Go to `chrome://extensions`.
3. On the existing **Tab Hibernator** card, click the reload icon.

Do not use **Load unpacked** on a newly extracted folder: Chrome will treat it as another local extension. To get true automatic Chrome updates, the extension must be published through the Chrome Web Store (or distributed through a managed enterprise update service).

## Tests

The CI workflow validates the MV3 manifest and runs `node --test tests/manifest.test.mjs`.

For a quick Chrome API smoke test after loading the unpacked extension, open:

`chrome-extension://<your-extension-id>/tests/chrome-smoke.html`

All three checks should pass: Extension APIs available, settings readable, and tab access available.
