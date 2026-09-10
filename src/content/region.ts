// A crop region expressed as fractions (0..1) of the tab viewport,
// so it survives differences between CSS pixels and captured video pixels.
export type Region = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const MIN_FRACTION = 0.02;

// Keeps a region inside the viewport and above a minimum size.
export function clampRegion(region: Region): Region {
  const width = clamp(region.width, MIN_FRACTION, 1);
  const height = clamp(region.height, MIN_FRACTION, 1);
  return {
    width,
    height,
    left: clamp(region.left, 0, 1 - width),
    top: clamp(region.top, 0, 1 - height),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
