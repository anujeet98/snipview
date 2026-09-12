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
