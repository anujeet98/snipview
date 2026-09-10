// Mounts the selection overlay in a shadow root so the host page's styles
// can't reach it and its styles can't leak out.

import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

let host: HTMLElement | null = null;
let root: Root | null = null;

export function mountOverlay(node: ReactNode): void {
  if (host) return;

  host = document.createElement("div");
  host.style.cssText = "all: initial; position: fixed; inset: 0; z-index: 2147483647;";
  const shadow = host.attachShadow({ mode: "open" });
  const container = document.createElement("div");
  shadow.appendChild(container);
  document.documentElement.appendChild(host);

  root = createRoot(container);
  root.render(node);
}

export function unmountOverlay(): void {
  root?.unmount();
  host?.remove();
  root = null;
  host = null;
}
