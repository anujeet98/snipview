// SnipView background service worker.
// On toolbar click: mint a tab-capture stream id, then inject the PiP script into that tab.

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;

  // chrome:// and Web Store pages cannot be captured or scripted.
  if (/^(chrome|edge|about|chrome-extension):/i.test(tab.url || "")) {
    return notify(tab.id, "SnipView can't capture this page.");
  }

  let streamId;
  try {
    streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
  } catch (e) {
    return notify(tab.id, "SnipView: couldn't start capture — " + e.message);
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["pip.js"],
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (id) => window.__snipViewStart && window.__snipViewStart(id),
      args: [streamId],
    });
  } catch (e) {
    return notify(tab.id, "SnipView: injection failed — " + e.message);
  }
});

function notify(tabId, message) {
  chrome.scripting
    .executeScript({ target: { tabId }, func: (m) => console.warn(m), args: [message] })
    .catch(() => {});
}
