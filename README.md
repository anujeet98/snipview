# SnipView

Crop any region of a browser tab and float it in a resizable picture-in-picture window,
so you can keep an eye on it (a crypto chart, a dashboard, a doc) while you work in other tabs or apps.

## Status

Incremental build. Current: **v0 — whole-tab PiP**.

| Step | Scope |
|------|-------|
| v0 | Click the toolbar icon → the active tab plays in a floating, resizable PiP window |
| v1 | Drag to select a region → only that crop shows in PiP |
| v2 | Adjust the crop live; remember last region per site |
| v3 | Multiple PiPs, keyboard shortcut, polish, Chrome Web Store listing |

## Install (unpacked, for development)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the `src/` folder
4. Pin SnipView, open a tab with something worth watching, click the icon

## How it works

- `chrome.tabCapture.getMediaStreamId` produces a stream id for the active tab
- A content script turns that into a `MediaStream` and plays it in a hidden `<video>`
- `video.requestPictureInPicture()` pops the OS-level floating window
- (v1+) a `<canvas>` crops the stream before it reaches the video, via `canvas.captureStream()`
