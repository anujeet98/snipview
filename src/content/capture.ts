// Captures the current tab and shows a cropped region of it in a
// picture-in-picture window.
//
// The crop is anchored to an invisible <div> placed in document coordinates,
// so it follows the page as it scrolls. Where the browser supports Region
// Capture, the compositor crops to that div directly (no per-frame work);
// otherwise a <canvas> copies the div's current rect out of each frame.

import type { Region } from "./region";

type Session = {
  region: Region;
  tabStream: MediaStream;
  anchor: HTMLDivElement;
  pip: HTMLVideoElement;
  cleanup: () => void;
};

let session: Session | null = null;

const regionCaptureSupported =
  typeof CropTarget !== "undefined" && typeof CropTarget.fromElement === "function";

export function isRunning(): boolean {
  return session !== null;
}

export function getRegion(): Region | null {
  return session?.region ?? null;
}

export function setRegion(region: Region): void {
  if (!session) return;
  session.region = region;
  positionAnchor(session.anchor, region);
}

export async function startCroppedPip(streamId: string, region: Region): Promise<void> {
  if (session) return;

  const tabStream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
        maxWidth: 3840,
        maxHeight: 2160,
      },
    } as MediaTrackConstraints,
  });
  const track = tabStream.getVideoTracks()[0];

  const anchor = document.createElement("div");
  // Rendered (opacity, not visibility/display) so Region Capture can track it.
  anchor.style.cssText = "position:absolute;z-index:-1;opacity:0;pointer-events:none;";
  positionAnchor(anchor, region);
  document.body.appendChild(anchor);

  const pip = document.createElement("video");
  pip.muted = true;
  hideOffscreen(pip);
  document.body.appendChild(pip);

  const cleanup = regionCaptureSupported
    ? await cropWithRegionCapture(track, anchor, pip)
    : await cropWithCanvas(tabStream, anchor, pip);

  await pip.play();
  if (pip.readyState < HTMLMediaElement.HAVE_METADATA) {
    await new Promise((resolve) => pip.addEventListener("loadedmetadata", resolve, { once: true }));
  }

  session = { region, tabStream, anchor, pip, cleanup };
  track.addEventListener("ended", stopPip);
  pip.addEventListener("leavepictureinpicture", stopPip, { once: true });

  try {
    await pip.requestPictureInPicture();
  } catch (error) {
    stopPip();
    throw error;
  }
}

export function stopPip(): void {
  if (!session) return;
  const { tabStream, anchor, pip, cleanup } = session;
  session = null;

  cleanup();
  if (document.pictureInPictureElement === pip) {
    void document.exitPictureInPicture().catch(() => {});
  }
  tabStream.getTracks().forEach((track) => track.stop());
  anchor.remove();
  pip.remove();
}

// The compositor crops the track to the anchor's box and keeps following it.
async function cropWithRegionCapture(
  track: MediaStreamTrack,
  anchor: HTMLElement,
  pip: HTMLVideoElement,
): Promise<() => void> {
  const target = await CropTarget.fromElement(anchor);
  await track.cropTo!(target);
  pip.srcObject = new MediaStream([track]);
  return () => {};
}

async function cropWithCanvas(
  tabStream: MediaStream,
  anchor: HTMLElement,
  pip: HTMLVideoElement,
): Promise<() => void> {
  const source = document.createElement("video");
  source.srcObject = tabStream;
  source.muted = true;
  await source.play();

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const stop = runCanvasCrop(source, canvas, ctx, anchor);

  pip.srcObject = canvas.captureStream(30);
  return () => {
    stop();
    source.remove();
  };
}

// Copies the anchor's current on-screen rect out of each source frame. Driven
// by requestVideoFrameCallback so it keeps updating while the tab is in the
// background (where requestAnimationFrame would be throttled to ~1fps).
function runCanvasCrop(
  source: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  anchor: HTMLElement,
): () => void {
  let stopped = false;

  const draw = () => {
    const vw = source.videoWidth;
    const vh = source.videoHeight;
    if (vw && vh) {
      const rect = anchor.getBoundingClientRect();
      const scaleX = vw / window.innerWidth;
      const scaleY = vh / window.innerHeight;
      const sx = clamp(rect.left * scaleX, 0, vw - 2);
      const sy = clamp(rect.top * scaleY, 0, vh - 2);
      const sw = clamp(rect.width * scaleX, 2, vw - sx);
      const sh = clamp(rect.height * scaleY, 2, vh - sy);
      const w = Math.round(sw);
      const h = Math.round(sh);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.drawImage(source, sx, sy, sw, sh, 0, 0, w, h);
    }
    schedule();
  };

  const rvfc = source.requestVideoFrameCallback?.bind(source);
  const schedule = rvfc
    ? () => {
        if (!stopped) rvfc(draw);
      }
    : () => {
        if (!stopped) requestAnimationFrame(draw);
      };

  schedule();
  return () => {
    stopped = true;
  };
}

// Places the anchor in document coordinates (viewport fraction + scroll),
// so the crop follows the page content as it scrolls.
function positionAnchor(anchor: HTMLElement, region: Region): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  anchor.style.left = `${region.left * w + window.scrollX}px`;
  anchor.style.top = `${region.top * h + window.scrollY}px`;
  anchor.style.width = `${region.width * w}px`;
  anchor.style.height = `${region.height * h}px`;
}

function hideOffscreen(el: HTMLElement): void {
  Object.assign(el.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "1px",
    height: "1px",
    pointerEvents: "none",
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
