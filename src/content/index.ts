// Content script entry. The background worker calls window.__snipviewToggle
// (via chrome.scripting.executeScript) so the picture-in-picture request keeps
// the user gesture from the toolbar click.

import { createElement } from "react";
import { isRunning, startCroppedPip, stopPip } from "./capture";
import { mountOverlay, unmountOverlay } from "./overlay/mount";
import { SelectionOverlay } from "./overlay/SelectionOverlay";

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

  mountOverlay(
    createElement(SelectionOverlay, {
      onCancel: unmountOverlay,
      onSelect: (region) => {
        unmountOverlay();
        startCroppedPip(streamId, region).catch((error) => {
          console.warn("[SnipView]", error?.message ?? error);
        });
      },
    }),
  );
};
