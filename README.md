# SnipView

Crop any region of a browser tab and float it in a resizable picture-in-picture window,
so you can keep an eye on it (a crypto chart, a dashboard, a doc) while you work in other tabs or apps.

## Status

Incremental build. Current: **v0 — whole-tab PiP**.

| Step | Scope |
|------|-------|
| v0 | Click the toolbar icon → the active tab plays in a floating, resizable PiP window |
| v1 | Drag to select a region → only that crop shows in PiP |
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
manifest.config.ts     extension manifest (typed)
vite.config.ts
src/
  background/index.ts   toolbar click -> mint tab-capture stream id -> toggle PiP
  content/index.ts      exposes window.__snipviewToggle for the background to call
  content/capture.ts    getUserMedia(tab) -> <video> -> requestPictureInPicture()
  icons/
```

## How it works

- `chrome.tabCapture.getMediaStreamId` produces a stream id for the active tab
- The content script turns that into a `MediaStream` and plays it in a hidden `<video>`
- `video.requestPictureInPicture()` opens the OS-level floating window
- The background calls the toggle via `chrome.scripting.executeScript` so the toolbar
  click still counts as the user gesture PiP requires
- (v1+) a `<canvas>` will crop the stream before the video via `canvas.captureStream()`
