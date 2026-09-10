// Captures the current tab and shows it in a picture-in-picture window.
// v0: mirrors the whole tab. Region cropping arrives in v1.

type Session = {
  stream: MediaStream;
  video: HTMLVideoElement;
};

let session: Session | null = null;

export function isRunning(): boolean {
  return session !== null;
}

export async function startPip(streamId: string): Promise<void> {
  if (session) return;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      // Non-standard constraints Chrome uses for tab capture.
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
        maxWidth: 3840,
        maxHeight: 2160,
      },
    } as MediaTrackConstraints,
  });

  const video = document.createElement("video");
  video.srcObject = stream;
  video.muted = true;
  video.disablePictureInPicture = false;
  Object.assign(video.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "1px",
    height: "1px",
    pointerEvents: "none",
  });
  document.body.appendChild(video);

  session = { stream, video };
  stream.getVideoTracks()[0].addEventListener("ended", stopPip);
  video.addEventListener("leavepictureinpicture", stopPip, { once: true });

  try {
    await video.play();
    await video.requestPictureInPicture();
  } catch (error) {
    stopPip();
    throw error;
  }
}

export function stopPip(): void {
  if (!session) return;
  const { stream, video } = session;
  session = null;

  if (document.pictureInPictureElement === video) {
    void document.exitPictureInPicture().catch(() => {});
  }
  stream.getTracks().forEach((track) => track.stop());
  video.remove();
}
