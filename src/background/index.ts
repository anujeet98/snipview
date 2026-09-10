// Toolbar click -> mint a tab-capture stream id -> ask the content script to toggle PiP.

const RESTRICTED = /^(chrome|edge|about|chrome-extension|devtools):/i;

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;

  if (RESTRICTED.test(tab.url ?? "")) {
    warn(tab.id, "SnipView can't capture this page.");
    return;
  }

  let streamId: string;
  try {
    streamId = await getMediaStreamId(tab.id);
  } catch (error) {
    warn(tab.id, `SnipView: capture failed — ${asMessage(error)}`);
    return;
  }

  try {
    // Runs in the content script's world; the toolbar click still counts as a
    // user gesture here, which requestPictureInPicture() needs.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (id: string) => window.__snipviewToggle?.(id),
      args: [streamId],
    });
  } catch (error) {
    warn(tab.id, `SnipView: injection failed — ${asMessage(error)}`);
  }
});

// getMediaStreamId is callback-only in MV3.
function getMediaStreamId(targetTabId: number): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId }, (streamId) => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve(streamId);
    });
  });
}

function warn(tabId: number, message: string): void {
  void chrome.scripting
    .executeScript({ target: { tabId }, func: (m: string) => console.warn(m), args: [message] })
    .catch(() => {});
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
