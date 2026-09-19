// Global capture settings, in chrome.storage.local. Applied on the next
// capture start — the PiP framerate can't be changed mid-session.

const FPS_KEY = "settings:fps";

export const DEFAULT_FPS = 30;
export const FPS_OPTIONS = [15, 24, 30, 60] as const;

export async function loadFps(): Promise<number> {
  const stored = await chrome.storage.local.get(FPS_KEY);
  return (stored[FPS_KEY] as number | undefined) ?? DEFAULT_FPS;
}

export async function saveFps(fps: number): Promise<void> {
  await chrome.storage.local.set({ [FPS_KEY]: fps });
}
