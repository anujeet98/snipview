import { useEffect, useState, type CSSProperties } from "react";
import { requestStatus, type StatusResult } from "../messages";
import { RESTRICTED } from "../restricted";

type State =
  | { kind: "loading" }
  | { kind: "restricted" }
  | { kind: "unreachable" } // no content script there yet (e.g. page loaded before install)
  | { kind: "ready"; status: StatusResult };

export function Popup() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    void loadStatus().then(setState);
  }, []);

  return (
    <div style={rootStyle}>
      <header style={headerStyle}>
        <span style={dotStyle(state.kind === "ready" && state.status.isRunning)} />
        <h1 style={titleStyle}>SnipView</h1>
      </header>
      <Body state={state} />
    </div>
  );
}

async function loadStatus(): Promise<State> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || RESTRICTED.test(tab.url ?? "")) return { kind: "restricted" };

  try {
    const status = await requestStatus(tab.id);
    return { kind: "ready", status };
  } catch {
    // No content script listening — most likely the tab was open before
    // SnipView was installed/reloaded, so it never got injected.
    return { kind: "unreachable" };
  }
}

function Body({ state }: { state: State }) {
  switch (state.kind) {
    case "loading":
      return <p style={mutedStyle}>Checking this tab…</p>;
    case "restricted":
      return <p style={mutedStyle}>SnipView can't run on this page.</p>;
    case "unreachable":
      return <p style={mutedStyle}>Reload this tab to use SnipView on it.</p>;
    case "ready":
      return state.status.isRunning ? (
        <RunningStatus region={state.status.region} />
      ) : (
        <p style={mutedStyle}>
          Not running on this tab. Press <kbd style={kbdStyle}>⌘⇧S</kbd> (
          <kbd style={kbdStyle}>Ctrl+Shift+S</kbd> on Windows/Linux) to start.
        </p>
      );
  }
}

function RunningStatus({ region }: { region: StatusResult["region"] }) {
  return (
    <div>
      <p style={{ ...mutedStyle, color: "#e8e8ef" }}>Running on this tab</p>
      {region && (
        <p style={regionStyle}>
          {Math.round(region.width * 100)}% × {Math.round(region.height * 100)}% region, at{" "}
          {Math.round(region.left * 100)}%, {Math.round(region.top * 100)}%
        </p>
      )}
    </div>
  );
}

const ACCENT = "#50c88c";

const rootStyle: CSSProperties = {
  width: 260,
  padding: 14,
  background: "#14161f",
  color: "#f5f5fa",
  fontFamily: "system-ui, sans-serif",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 10,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 700,
};

function dotStyle(on: boolean): CSSProperties {
  return {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: on ? ACCENT : "#484b5c",
  };
}

const mutedStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: "#9a9db0",
  lineHeight: 1.5,
};

const regionStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: 12,
  color: "#9a9db0",
};

const kbdStyle: CSSProperties = {
  padding: "1px 5px",
  borderRadius: 4,
  background: "#232637",
  fontSize: 11,
};
