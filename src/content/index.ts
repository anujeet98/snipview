// Content script entry. The background worker calls window.__snipviewOpen
// (via chrome.scripting.executeScript) on the toolbar click.

import { createElement } from "react";
import { requestStreamId } from "../messages";
import { getRegion, isRunning, setRegion, startCroppedPip, stopPip } from "./capture";
import type { Region } from "./region";
import { loadRegion, saveRegion } from "./regionStore";
import { AdjustFrame } from "./overlay/AdjustFrame";
import { mountOverlay, unmountOverlay } from "./overlay/mount";
import { SelectionOverlay } from "./overlay/SelectionOverlay";

declare global {
  interface Window {
    __snipviewOpen?: () => void;
  }
}

const origin = location.origin;

window.__snipviewOpen = () => {
  void open();
};

async function open(): Promise<void> {
  if (isRunning()) {
    showAdjust(getRegion()!);
    return;
  }
  const saved = await loadRegion(origin);
  if (saved) start(saved);
  else showSelect();
}

function showSelect(): void {
  mountOverlay(
    createElement(SelectionOverlay, {
      onCancel: unmountOverlay,
      onSelect: (region) => start(region),
    }),
  );
}

async function start(region: Region): Promise<void> {
  try {
    if (isRunning()) {
      setRegion(region);
    } else {
      const streamId = await requestStreamId();
      await startCroppedPip(streamId, region);
    }
    await saveRegion(origin, region);
    showAdjust(region);
  } catch (error) {
    console.warn("[SnipView]", error instanceof Error ? error.message : error);
    unmountOverlay();
  }
}

function showAdjust(region: Region): void {
  mountOverlay(
    createElement(AdjustFrame, {
      initialRegion: region,
      onChange: setRegion,
      onCommit: (r) => void saveRegion(origin, r),
      onDone: unmountOverlay,
      onReselect: showSelect,
      onStop: () => {
        stopPip();
        unmountOverlay();
      },
    }),
  );
}
