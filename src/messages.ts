// Messages from a content script to the background worker.

import type { Region } from "./content/region";

export type GetStreamId = { type: "snipview:get-stream-id" };
export type StreamIdResult = { streamId?: string; error?: string };

export function requestStreamId(): Promise<string> {
  return chrome.runtime
    .sendMessage<GetStreamId, StreamIdResult>({ type: "snipview:get-stream-id" })
    .then((result) => {
      if (!result?.streamId) throw new Error(result?.error ?? "no stream id returned");
      return result.streamId;
    });
}

// Messages from the popup to a tab's content script, asking what SnipView
// is currently doing there.
export type GetStatus = { type: "snipview:get-status" };
export type StatusResult = { isRunning: boolean; region: Region | null };

export function requestStatus(tabId: number): Promise<StatusResult> {
  return chrome.tabs.sendMessage<GetStatus, StatusResult>(tabId, { type: "snipview:get-status" });
}

// Sent from the popup's "Recapture" button. Only meaningful while a session
// is already running there — it redraws the crop without requesting a new
// PiP window, so it doesn't need a fresh user gesture on the page.
export type Reselect = { type: "snipview:reselect" };

export function requestReselect(tabId: number): Promise<void> {
  return chrome.tabs.sendMessage<Reselect, void>(tabId, { type: "snipview:reselect" });
}
