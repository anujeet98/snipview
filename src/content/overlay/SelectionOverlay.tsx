import { useEffect, useState, type CSSProperties } from "react";
import type { Region } from "../region";

type Props = {
  onSelect: (region: Region) => void;
  onCancel: () => void;
};

type Point = { x: number; y: number };
type Box = { x: number; y: number; width: number; height: number };

const MIN_SIZE = 12;

export function SelectionOverlay({ onSelect, onCancel }: Props) {
  const [start, setStart] = useState<Point | null>(null);
  const [end, setEnd] = useState<Point | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const box = start && end ? boxFrom(start, end) : null;

  const finish = () => {
    if (!box || box.width < MIN_SIZE || box.height < MIN_SIZE) {
      onCancel();
      return;
    }
    onSelect({
      left: box.x / window.innerWidth,
      top: box.y / window.innerHeight,
      width: box.width / window.innerWidth,
      height: box.height / window.innerHeight,
    });
  };

  return (
    <div
      style={overlayStyle}
      onMouseDown={(e) => {
        const p = { x: e.clientX, y: e.clientY };
        setStart(p);
        setEnd(p);
      }}
      onMouseMove={(e) => {
        if (start) setEnd({ x: e.clientX, y: e.clientY });
      }}
      onMouseUp={finish}
    >
      {box && <div style={selectionStyle(box)} />}
      {!start && <p style={hintStyle}>Drag to pick a region · Esc to cancel</p>}
    </div>
  );
}

function boxFrom(a: Point, b: Point): Box {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  cursor: "crosshair",
  background: "transparent",
  fontFamily: "system-ui, sans-serif",
};

function selectionStyle(box: Box): CSSProperties {
  return {
    position: "fixed",
    left: box.x,
    top: box.y,
    width: box.width,
    height: box.height,
    border: "1.5px solid #50c88c",
    boxShadow: "0 0 0 9999px rgba(20, 22, 34, 0.45)",
  };
}

const hintStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  top: 24,
  transform: "translateX(-50%)",
  margin: 0,
  padding: "6px 14px",
  borderRadius: 8,
  background: "rgba(20, 22, 34, 0.9)",
  color: "#e8e8ef",
  fontSize: 13,
};
