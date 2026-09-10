// Content script entry. Exposes a toggle that the background worker calls
// (via chrome.scripting.executeScript) so the picture-in-picture request
// keeps the user gesture from the toolbar click.

import { isRunning, startPip, stopPip } from "./capture";

declare global {
  interface Window {
    __snipviewToggle?: (streamId: string) => void;
  }
}

window.__snipviewToggle = (streamId: string) => {
  if (isRunning()) {
    stopPip();
    return;
  }
  startPip(streamId).catch((error) => {
    console.warn("[SnipView]", error?.message ?? error);
  });
};
