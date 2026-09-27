/**
 * Autoplay-with-sound helper: browsers (Chrome included) allow unmuted
 * playback once the visitor has engaged with the site, and reject
 * video.play() with NotAllowedError before that. So every video attempts
 * sound first and falls back to muted playback where blocked — the mute
 * button always reflects the real state and stays as the manual control.
 */

/** Attempt audible autoplay; fall back to muted playback. Resolves true with sound. */
export async function tryUnmutedPlayback(
  video: HTMLVideoElement,
): Promise<boolean> {
  try {
    video.muted = false;
    video.volume = 1;
    await video.play();
    return true;
  } catch {
    try {
      video.muted = true;
      await video.play();
    } catch {
      /* stays paused; the visitor can tap play */
    }
    return false;
  }
}

/**
 * One-shot retry: the first tap/keypress anywhere re-attempts sound unless
 * the visitor explicitly muted. Returns a cleanup for unmount.
 */
export function retryUnmutedOnGesture(
  video: HTMLVideoElement,
  isManuallyMuted: () => boolean,
  onAudible: () => void,
): () => void {
  const attempt = () => {
    if (isManuallyMuted()) {
      cleanup();
      return;
    }
    video.muted = false;
    video
      .play()
      .then(() => {
        onAudible();
        cleanup();
      })
      .catch(() => {
        /* still blocked; keep listening for the next gesture */
      });
  };
  const cleanup = () => {
    window.removeEventListener("pointerdown", attempt);
    window.removeEventListener("keydown", attempt);
  };
  window.addEventListener("pointerdown", attempt);
  window.addEventListener("keydown", attempt);
  return cleanup;
}
