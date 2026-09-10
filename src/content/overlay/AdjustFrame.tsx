import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { clampRegion, type Region } from "../region";

type Props = {
  initialRegion: Region;
  onChange: (region: Region) => void; // live, every move
  onCommit: (region: Region) => void; // on release, for persistence
  onDone: () => void; // hide the frame, keep PiP running
  onReselect: () => void; // draw a fresh region
  onStop: () => void; // stop PiP
};

type Handle = "move" | "nw" | "ne" | "sw" | "se";
const HANDLES: Exclude<Handle, "move">[] = ["nw", "ne", "sw", "se"];

type Drag = { handle: Handle; x: number; y: number; from: Region };

export function AdjustFrame({
  initialRegion,
  onChange,
  onCommit,
  onDone,
  onReselect,
  onStop,
}: Props) {
  const [region, setRegion] = useState(initialRegion);
  const drag = useRef<Drag | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);

  const startDrag = (handle: Handle) => (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { handle, x: e.clientX, y: e.clientY, from: region };
  };

  const moveDrag = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.x) / window.innerWidth;
    const dy = (e.clientY - d.y) / window.innerHeight;
    let { left, top, width, height } = d.from;

    if (d.handle === "move") {
      left += dx;
      top += dy;
    } else {
      if (d.handle.includes("w")) {
        left += dx;
        width -= dx;
      }
      if (d.handle.includes("e")) width += dx;
      if (d.handle.includes("n")) {
        top += dy;
        height -= dy;
      }
      if (d.handle.includes("s")) height += dy;
    }

    const next = clampRegion({ left, top, width, height });
    setRegion(next);
    onChange(next);
  };

  const endDrag = (e: PointerEvent) => {
    if (!drag.current) return;
    drag.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    onCommit(region);
  };

  const box: Box = {
    left: region.left * window.innerWidth,
    top: region.top * window.innerHeight,
    width: region.width * window.innerWidth,
    height: region.height * window.innerHeight,
  };

  return (
    <>
      <div
        style={frameStyle(box)}
        onPointerDown={startDrag("move")}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
      >
        {HANDLES.map((h) => (
          <span
            key={h}
            style={handleStyle(h)}
            onPointerDown={startDrag(h)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
          />
        ))}
      </div>
      <div style={toolbarStyle(box)}>
        <button style={buttonStyle} onClick={onDone}>
          Done
        </button>
        <button style={buttonStyle} onClick={onReselect}>
          New region
        </button>
        <button style={{ ...buttonStyle, color: "#ff9a9a" }} onClick={onStop}>
          Stop
        </button>
      </div>
    </>
  );
}

type Box = { left: number; top: number; width: number; height: number };

const ACCENT = "#50c88c";

function frameStyle(box: Box): CSSProperties {
  return {
    position: "fixed",
    left: box.left,
    top: box.top,
    width: box.width,
    height: box.height,
    border: `1.5px solid ${ACCENT}`,
    boxShadow: "0 0 0 9999px rgba(20, 22, 34, 0.35)",
    cursor: "move",
    pointerEvents: "auto",
    boxSizing: "border-box",
  };
}

function handleStyle(handle: Exclude<Handle, "move">): CSSProperties {
  const size = 14;
  return {
    position: "absolute",
    width: size,
    height: size,
    background: ACCENT,
    borderRadius: 3,
    pointerEvents: "auto",
    top: handle.includes("n") ? -size / 2 : undefined,
    bottom: handle.includes("s") ? -size / 2 : undefined,
    left: handle.includes("w") ? -size / 2 : undefined,
    right: handle.includes("e") ? -size / 2 : undefined,
    cursor: `${handle}-resize`,
  };
}

function toolbarStyle(box: Box): CSSProperties {
  const below = box.top + box.height + 8;
  return {
    position: "fixed",
    left: box.left,
    top: below + 34 > window.innerHeight ? Math.max(8, box.top - 42) : below,
    display: "flex",
    gap: 6,
    padding: 4,
    borderRadius: 8,
    background: "rgba(20, 22, 34, 0.92)",
    pointerEvents: "auto",
    fontFamily: "system-ui, sans-serif",
  };
}

const buttonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#e8e8ef",
  fontSize: 12,
  padding: "4px 8px",
  cursor: "pointer",
};
