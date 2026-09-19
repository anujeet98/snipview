# SnipView

Crop any region of a browser tab and float it in a resizable picture-in-picture window,
so you can keep an eye on it (a crypto chart, a dashboard, a doc) while you work in other tabs or apps.

## Status

Incremental build. Current: **v3 — status popup, recapture, Chrome Web Store listing in progress**.

| Step | Scope |
|------|-------|
| v0 | Click the toolbar icon → the active tab plays in a floating, resizable PiP window ✅ |
| v1 | Drag to select a region → only that crop shows in PiP ✅ |
| v2 | Move/resize the crop live ✅ |
| v3 | Keyboard shortcut ✅, status popup + recapture + FPS setting ✅, Chrome Web Store listing, multiple PiPs, polish |

Remaining tasks and bugs are tracked in [GitHub Issues](https://github.com/anujeet98/snipview/issues).

## Stack

- **Vite 6** + **TypeScript** — build and bundling
- **@crxjs/vite-plugin** — MV3 manifest handling, content-script bundling, dev hot-reload
- **React 18** — the selection overlay, adjust frame, and toolbar popup

## Develop

```bash
npm install
npm run dev        # Vite dev server with hot-reload
```

Then load the extension once:

1. Open `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select the `dist/` folder (created by `dev` or `build`)
3. Edits reload automatically while `npm run dev` runs

Shortcut: **Ctrl/Cmd+Shift+S** opens SnipView on the current tab (rebindable at
`chrome://extensions/shortcuts`).

## Build

```bash
npm run build      # typecheck + production bundle into dist/
npm run zip        # dist/ -> snipview.zip for the Web Store
```

## Layout

```
manifest.config.ts             extension manifest (typed)
vite.config.ts
src/
  background/index.ts          keyboard shortcut -> inject open() into the tab; serves stream ids
  messages.ts                  content/popup <-> background/content message contract
  settings.ts                  global settings (capture FPS) in chrome.storage
  restricted.ts                pages SnipView can't run on (chrome://, etc.)
  content/index.ts             flow: select -> capture -> adjust; status + reselect messages
  content/region.ts            Region = crop rect as viewport fractions (+ clamp)
  content/capture.ts           tab stream -> canvas crop (mutable region) -> PiP
  content/overlay/mount.ts     mounts React in a shadow root
  content/overlay/SelectionOverlay.tsx   drag-to-select rectangle (or "whole tab")
  content/overlay/AdjustFrame.tsx        move/resize the active crop
  popup/Popup.tsx              toolbar popup: running status, Recapture, FPS setting
  icons/
```

## How it works

- The keyboard shortcut runs `window.__snipviewOpen` in the tab (via
  `chrome.scripting.executeScript`, so the user gesture PiP needs is preserved).
  The toolbar icon instead opens a status popup (`src/popup`) — a click there
  doesn't carry a real page gesture, so it can't start PiP directly.
- Not already running → a full-viewport overlay to drag a rectangle (or pick
  "Whole tab"). Already running → the adjust frame reappears over the live crop.
- The content script asks the background for a fresh `chrome.tabCapture` stream id
  (they expire in seconds) and calls `getUserMedia({ chromeMediaSource: "tab" })`
- A `<canvas>` copies just the region out of each frame; `canvas.captureStream(fps)`
  feeds a hidden `<video>` whose `requestPictureInPicture()` opens the floating window
- The draw loop reads a **mutable** region on `requestVideoFrameCallback`, so the
  on-page adjust frame reshapes the crop live and it keeps updating while the source
  tab is backgrounded
- The region only lives in memory for the current session — nothing is persisted
  per site. The popup's "Recapture" button re-shows the select overlay for a
  running session via a `chrome.tabs.sendMessage`, without requesting PiP again.
