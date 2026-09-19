import { useEffect, useState, type CSSProperties } from "react";
import { requestReselect, requestStatus, type StatusResult } from "../messages";
import { RESTRICTED } from "../restricted";
import { FPS_OPTIONS, loadFps, saveFps } from "../settings";

type State =
  | { kind: "loading" }
  | { kind: "restricted" }
  | { kind: "unreachable" } // no content script there yet (e.g. page loaded before install)
  | { kind: "ready"; tabId: number; status: StatusResult };

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
      <FpsSetting />
    </div>
  );
}

async function loadStatus(): Promise<State> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || RESTRICTED.test(tab.url ?? "")) return { kind: "restricted" };

  try {
    const status = await requestStatus(tab.id);
    return { kind: "ready", tabId: tab.id, status };
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
        <RunningStatus tabId={state.tabId} region={state.status.region} />
      ) : (
        <p style={mutedStyle}>
          Not running on this tab. Press <kbd style={kbdStyle}>⌘⇧S</kbd> (
          <kbd style={kbdStyle}>Ctrl+Shift+S</kbd> on Windows/Linux) to start.
        </p>
      );
  }
}

function RunningStatus({ tabId, region }: { tabId: number; region: StatusResult["region"] }) {
  const recapture = () => {
    void requestReselect(tabId);
    window.close();
  };

  return (
    <div>
      <p style={{ ...mutedStyle, color: "#e8e8ef" }}>Running on this tab</p>
      {region && (
        <p style={regionStyle}>
          {Math.round(region.width * 100)}% × {Math.round(region.height * 100)}% region, at{" "}
          {Math.round(region.left * 100)}%, {Math.round(region.top * 100)}%
        </p>
      )}
      <button style={recaptureButtonStyle} onClick={recapture}>
        Recapture
      </button>
    </div>
  );
}

function FpsSetting() {
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    void loadFps().then(setFps);
  }, []);

  if (fps === null) return null;

  const onChange = (value: number) => {
    setFps(value);
    void saveFps(value);
  };

  return (
    <div style={fpsRowStyle}>
      <label style={mutedStyle} htmlFor="snipview-fps">
        Capture FPS
      </label>
      <select
        id="snipview-fps"
        style={fpsSelectStyle}
        value={fps}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {FPS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
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

const recaptureButtonStyle: CSSProperties = {
  marginTop: 10,
  border: `1px solid ${ACCENT}`,
  background: "transparent",
  color: ACCENT,
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 6,
  padding: "5px 10px",
  cursor: "pointer",
};

const fpsRowStyle: CSSProperties = {
  marginTop: 14,
  paddingTop: 10,
  borderTop: "1px solid #232637",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const fpsSelectStyle: CSSProperties = {
  background: "#232637",
  color: "#f5f5fa",
  border: "none",
  borderRadius: 6,
  padding: "3px 6px",
  fontSize: 12,
};
