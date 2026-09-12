# SnipView

Crop any region of a browser tab and float it in a resizable picture-in-picture window,
so you can keep an eye on it (a crypto chart, a dashboard, a doc) while you work in other tabs or apps.

## Status

Incremental build. Current: **v2 — adjustable crop + per-site memory**.

| Step | Scope |
|------|-------|
| v0 | Click the toolbar icon → the active tab plays in a floating, resizable PiP window ✅ |
| v1 | Drag to select a region → only that crop shows in PiP ✅ |
| v2 | Move/resize the crop live; remember the last region per site ✅ |
| v3 | Keyboard shortcut ✅, multiple PiPs, polish, Chrome Web Store listing |

Remaining tasks and bugs are tracked in [GitHub Issues](https://github.com/anujeet98/snipview/issues).

## Stack

- **Vite 6** + **TypeScript** — build and bundling
- **@crxjs/vite-plugin** — MV3 manifest handling, content-script bundling, dev hot-reload
- **React 18** — reserved for the selection overlay (v1) and options UI (v2); v0 needs no UI

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
  background/index.ts          toolbar click -> open overlay; serves stream ids
  messages.ts                  content <-> background message contract
  content/index.ts             flow: select -> capture -> adjust; per-site memory
  content/region.ts            Region = crop rect as viewport fractions (+ clamp)
  content/regionStore.ts       load/save last region per origin (chrome.storage)
  content/capture.ts           tab stream -> canvas crop (mutable region) -> PiP
  content/overlay/mount.ts     mounts React in a shadow root
  content/overlay/SelectionOverlay.tsx   drag-to-select rectangle
  content/overlay/AdjustFrame.tsx        move/resize the active crop
  icons/
```

## How it works

- The toolbar click runs `window.__snipviewOpen` in the tab (via
  `chrome.scripting.executeScript`, so the user gesture PiP needs is preserved)
- No saved region for this origin → a full-viewport overlay to drag a rectangle.
  A saved region → straight to capture with it.
- The content script asks the background for a fresh `chrome.tabCapture` stream id
  (they expire in seconds) and calls `getUserMedia({ chromeMediaSource: "tab" })`
- A `<canvas>` copies just the region out of each frame; `canvas.captureStream(30)`
  feeds a hidden `<video>` whose `requestPictureInPicture()` opens the floating window
- The draw loop reads a **mutable** region on `requestVideoFrameCallback`, so the
  on-page adjust frame reshapes the crop live and it keeps updating while the source
  tab is backgrounded
- The region is stored as viewport fractions and persisted per origin in
  `chrome.storage.local`
