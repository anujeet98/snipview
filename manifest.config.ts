import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

export default defineManifest({
  manifest_version: 3,
  name: "SnipView",
  version: pkg.version,
  description:
    "Crop a region of a tab and float it in a resizable picture-in-picture window while you work elsewhere.",
  permissions: ["tabCapture", "activeTab", "scripting", "storage"],
  background: { service_worker: "src/background/index.ts", type: "module" },
  action: { default_title: "SnipView — pop this tab into PiP" },
  commands: {
    "open-snipview": {
      suggested_key: { default: "Ctrl+Shift+S", mac: "Command+Shift+S" },
      description: "Open SnipView on the current tab",
    },
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/index.ts"],
      run_at: "document_idle",
    },
  ],
  icons: {
    16: "src/icons/icon16.png",
    48: "src/icons/icon48.png",
    128: "src/icons/icon128.png",
  },
});
