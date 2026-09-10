// A crop region expressed as fractions (0..1) of the tab viewport,
// so it survives differences between CSS pixels and captured video pixels.
export type Region = {
  left: number;
  top: number;
  width: number;
  height: number;
};
