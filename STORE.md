# Chrome Web Store listing — draft

Working notes for the store submission. Not user-facing.

## Name

SnipView — Crop a tab into Picture-in-Picture

## Summary (132 chars max)

Crop any part of a browser tab and float it in a resizable picture-in-picture window while you work in other tabs or apps.

## Description

Keep an eye on one thing while you work on another.

SnipView lets you draw a box around any part of a browser tab — a crypto chart,
a live dashboard, a video, a document — and pops just that region into a
floating picture-in-picture window. The window stays on top of everything,
resizes freely, and keeps updating live even while the source tab sits in the
background.

Features
- Drag to select exactly the region you want
- Move and resize the crop at any time; the PiP updates instantly
- Remembers your last region per site, so it's one click next time
- Keyboard shortcut (Ctrl/Cmd+Shift+S), rebindable
- Works entirely on your device — no account, no network, no tracking

How to use
1. Open the tab you want to watch
2. Click the SnipView icon (or press Ctrl/Cmd+Shift+S)
3. Drag a box around the part you care about
4. A picture-in-picture window appears — switch tabs or apps and keep working

## Category

Productivity

## Permission justifications

- **tabCapture** — used only while a PiP window is open, to read the current
  tab's video frames so the cropped region can be displayed. Frames never leave
  the device.
- **activeTab, scripting** — to show the selection overlay on the tab when the
  user invokes SnipView.
- **storage** — to remember the last crop rectangle per site (local only).
- **host permissions (`<all_urls>`)** — the content script must be able to run
  on whatever page the user chooses to crop.

## Data disclosure

- Does the extension collect user data? **No.**
- Single purpose: display a cropped region of a browser tab in picture-in-picture.

## Assets still needed

- [ ] 1280×800 or 640×400 screenshots (at least 1, up to 5):
  - selection overlay over a chart
  - PiP window floating over an editor
  - adjust frame with resize handles
- [ ] 440×280 small promo tile (optional)
- [ ] Privacy policy URL → link to PRIVACY.md on GitHub
