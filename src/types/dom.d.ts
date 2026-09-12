// APIs that are shipped in Chrome but not yet in TypeScript's lib.dom.

interface HTMLVideoElement {
  requestVideoFrameCallback?(callback: (now: DOMHighResTimeStamp, metadata: unknown) => void): number;
}

// Region Capture (https://w3c.github.io/mediacapture-region/)
interface CropTarget {}
declare const CropTarget: {
  fromElement(element: Element): Promise<CropTarget>;
};

interface MediaStreamTrack {
  cropTo?(target: CropTarget | null): Promise<void>;
}
