// SnipView — injected into the target tab. v0: whole tab -> picture-in-picture.
// Guard against double injection.
(() => {
  if (window.__snipViewStart) return;

  let active = null; // { stream, video }

  async function start(streamId) {
    // Toggle off if already running.
    if (active) return stop();

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "tab",
            chromeMediaSourceId: streamId,
            maxWidth: 3840,
            maxHeight: 2160,
          },
        },
      });
    } catch (e) {
      console.warn("SnipView: getUserMedia failed —", e.message);
      return;
    }

    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    Object.assign(video.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: "1px",
      height: "1px",
    });
    document.body.appendChild(video);

    active = { stream, video };
    stream.getVideoTracks()[0].addEventListener("ended", stop);
    video.addEventListener("leavepictureinpicture", stop, { once: true });

    try {
      await video.play();
      await video.requestPictureInPicture();
    } catch (e) {
      console.warn("SnipView: PiP failed —", e.message);
      stop();
    }
  }

  function stop() {
    if (!active) return;
    const { stream, video } = active;
    active = null;
    try {
      if (document.pictureInPictureElement === video) document.exitPictureInPicture();
    } catch (_) {}
    stream.getTracks().forEach((t) => t.stop());
    video.remove();
  }

  window.__snipViewStart = start;
})();
