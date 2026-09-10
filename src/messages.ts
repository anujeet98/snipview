// Messages from a content script to the background worker.

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
