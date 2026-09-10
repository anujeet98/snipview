// Remembers the last crop region per site, in chrome.storage.local.

import type { Region } from "./region";

const key = (origin: string) => `region:${origin}`;

export async function loadRegion(origin: string): Promise<Region | null> {
  const stored = await chrome.storage.local.get(key(origin));
  return (stored[key(origin)] as Region | undefined) ?? null;
}

export async function saveRegion(origin: string, region: Region): Promise<void> {
  await chrome.storage.local.set({ [key(origin)]: region });
}
