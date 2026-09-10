// Captures the current tab, crops it to the chosen region with a canvas,
// and shows the crop in a picture-in-picture window.

import type { Region } from "./region";

type Session = {
  tabStream: MediaStream;
  source: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  pip: HTMLVideoElement;
  stopDrawing: () => void;
};

let session: Session | null = null;

export function isRunning(): boolean {
  return session !== null;
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

  const source = document.createElement("video");
  source.srcObject = tabStream;
  source.muted = true;
  await source.play();

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const stopDrawing = runDrawLoop(source, canvas, ctx, region);

  const pip = document.createElement("video");
  pip.muted = true;
  hideOffscreen(pip);
  pip.srcObject = canvas.captureStream(30);
  document.body.appendChild(pip);
  await pip.play();
  if (pip.readyState < HTMLMediaElement.HAVE_METADATA) {
    await new Promise((resolve) => pip.addEventListener("loadedmetadata", resolve, { once: true }));
  }

  session = { tabStream, source, canvas, pip, stopDrawing };
  tabStream.getVideoTracks()[0].addEventListener("ended", stopPip);
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
  const { tabStream, source, pip, stopDrawing } = session;
  session = null;

  stopDrawing();
  if (document.pictureInPictureElement === pip) {
    void document.exitPictureInPicture().catch(() => {});
  }
  tabStream.getTracks().forEach((track) => track.stop());
  source.remove();
  pip.remove();
}

// Copies the region out of each source frame into the canvas. Driven by
// requestVideoFrameCallback so it keeps updating while this tab is in the
// background (where requestAnimationFrame would be throttled to ~1fps).
function runDrawLoop(
  source: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  region: Region,
): () => void {
  let stopped = false;

  const draw = () => {
    const vw = source.videoWidth;
    const vh = source.videoHeight;
    if (vw && vh) {
      const sw = Math.max(2, Math.round(region.width * vw));
      const sh = Math.max(2, Math.round(region.height * vh));
      if (canvas.width !== sw || canvas.height !== sh) {
        canvas.width = sw;
        canvas.height = sh;
      }
      ctx.drawImage(source, region.left * vw, region.top * vh, sw, sh, 0, 0, sw, sh);
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
