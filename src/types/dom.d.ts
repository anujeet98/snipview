// requestVideoFrameCallback is widely shipped but not yet in TypeScript's lib.dom.
interface HTMLVideoElement {
  requestVideoFrameCallback?(callback: (now: DOMHighResTimeStamp, metadata: unknown) => void): number;
}
