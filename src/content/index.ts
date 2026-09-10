// Content script entry. The background worker calls window.__snipviewToggle
// (via chrome.scripting.executeScript) on the toolbar click.

import { createElement } from "react";
import { requestStreamId } from "../messages";
import { isRunning, startCroppedPip, stopPip } from "./capture";
import { mountOverlay, unmountOverlay } from "./overlay/mount";
import { SelectionOverlay } from "./overlay/SelectionOverlay";

declare global {
  interface Window {
    __snipviewToggle?: () => void;
  }
}

window.__snipviewToggle = () => {
  if (isRunning()) {
    stopPip();
    return;
  }

  mountOverlay(
    createElement(SelectionOverlay, {
      onCancel: unmountOverlay,
      onSelect: async (region) => {
        unmountOverlay();
        try {
          const streamId = await requestStreamId();
          await startCroppedPip(streamId, region);
        } catch (error) {
          console.warn("[SnipView]", error instanceof Error ? error.message : error);
        }
      },
    }),
  );
};
