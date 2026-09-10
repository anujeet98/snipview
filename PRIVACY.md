# SnipView Privacy Policy

_Last updated: 2026-09-10_

SnipView is a browser extension that shows a cropped region of one of your
browser tabs in a picture-in-picture window.

## What SnipView accesses

- **The video frames of the tab you point it at**, and only while a
  picture-in-picture window is open. This happens entirely on your device —
  the frames are drawn to a local canvas and shown in the PiP window.
- **A small preference in local storage**: the last crop rectangle you chose,
  saved per website so you don't have to redraw it. This is stored with
  `chrome.storage.local` on your machine.

## What SnipView does NOT do

- It does not send any data anywhere. SnipView makes no network requests.
- It does not use analytics, tracking, cookies, or remote logging.
- It does not read page content, form fields, passwords, or browsing history.
- It does not record or save video to a file.
- It has no account, no server, and no third-party services.

## Permissions

| Permission | Why |
|------------|-----|
| `tabCapture` | Capture the current tab's video to show it in picture-in-picture |
| `activeTab` / `scripting` | Run the selection overlay on the tab when you invoke SnipView |
| `storage` | Remember your last crop region per site, locally |

## Contact

Questions or concerns: open an issue at
https://github.com/anujeet98/snipview/issues
