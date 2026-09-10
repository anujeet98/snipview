// Opens SnipView on the active tab — from the toolbar click or the keyboard
// shortcut. The content script asks back for a tab-capture stream id once the
// region is chosen, so the id is fresh when it's used (they expire in seconds).

import type { GetStreamId, StreamIdResult } from "../messages";

const RESTRICTED = /^(chrome|edge|about|chrome-extension|devtools):/i;

chrome.action.onClicked.addListener((tab) => openInTab(tab));

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-snipview") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) openInTab(tab);
});

async function openInTab(tab: chrome.tabs.Tab): Promise<void> {
  if (!tab.id) return;

  if (RESTRICTED.test(tab.url ?? "")) {
    warn(tab.id, "SnipView can't capture this page.");
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.__snipviewOpen?.(),
    });
  } catch (error) {
    warn(tab.id, `SnipView: injection failed — ${asMessage(error)}`);
  }
}

chrome.runtime.onMessage.addListener(
  (message: GetStreamId, sender, sendResponse: (result: StreamIdResult) => void) => {
    if (message?.type !== "snipview:get-stream-id" || !sender.tab?.id) return;

    // consumerTabId must be set, or the content script in that tab can't use the stream.
    chrome.tabCapture.getMediaStreamId(
      { targetTabId: sender.tab.id, consumerTabId: sender.tab.id },
      (streamId) => {
        const error = chrome.runtime.lastError;
        sendResponse(error ? { error: error.message } : { streamId });
      },
    );
    return true; // keep the message channel open for the async response
  },
);

function warn(tabId: number, message: string): void {
  void chrome.scripting
    .executeScript({ target: { tabId }, func: (m: string) => console.warn(m), args: [message] })
    .catch(() => {});
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
