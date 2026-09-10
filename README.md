# SnipView

Crop any region of a browser tab and float it in a resizable picture-in-picture window,
so you can keep an eye on it (a crypto chart, a dashboard, a doc) while you work in other tabs or apps.

## Status

Incremental build. Current: **v1 — drag-to-select region crop**.

| Step | Scope |
|------|-------|
| v0 | Click the toolbar icon → the active tab plays in a floating, resizable PiP window ✅ |
| v1 | Drag to select a region → only that crop shows in PiP ✅ |
| v2 | Adjust the crop live; remember last region per site; options popup |
| v3 | Multiple PiPs, keyboard shortcut, polish, Chrome Web Store listing |

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
  background/index.ts          toolbar click -> mint tab-capture stream id -> toggle
  content/index.ts             exposes window.__snipviewToggle; shows the overlay
  content/region.ts            Region = crop rect as viewport fractions
  content/capture.ts           tab stream -> canvas crop -> captureStream -> PiP
  content/overlay/mount.ts     mounts React in a shadow root
  content/overlay/SelectionOverlay.tsx   drag-to-select rectangle
  icons/
```

## How it works

- `chrome.tabCapture.getMediaStreamId` produces a stream id for the active tab
- The toolbar click mounts a full-viewport overlay; you drag a rectangle
- On mouse-up the region (stored as viewport fractions) feeds `startCroppedPip`
- `getUserMedia({ chromeMediaSource: "tab" })` plays the tab in a hidden `<video>`
- A `<canvas>` copies just the region out of each frame; `canvas.captureStream(30)`
  feeds a second `<video>` whose `requestPictureInPicture()` opens the floating window
- The draw loop runs on `requestVideoFrameCallback` so it keeps updating while the
  source tab is in the background
- The background triggers everything via `chrome.scripting.executeScript` so the
  click still counts as the user gesture PiP requires
