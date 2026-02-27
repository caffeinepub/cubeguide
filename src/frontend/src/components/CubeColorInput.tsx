import { useState, useCallback, useEffect } from "react";
import type { CubeType, CubeColor, FaceName, CubeFaceState } from "../App";
import { createEmptyFaceState } from "../App";

const PALETTE_COLORS: { id: CubeColor & string; label: string; hex: string }[] = [
  { id: "white",  label: "White",  hex: "#F5F5F0" },
  { id: "red",    label: "Red",    hex: "#C41E3A" },
  { id: "blue",   label: "Blue",   hex: "#0051A8" },
  { id: "orange", label: "Orange", hex: "#FF6B1A" },
  { id: "yellow", label: "Yellow", hex: "#FFD600" },
  { id: "green",  label: "Green",  hex: "#009B48" },
];

const FACE_LABELS: Record<FaceName, string> = {
  top: "Top", left: "Left", front: "Front", right: "Right", back: "Back", bottom: "Bottom",
};

// Default face colours for the legend dots
const FACE_HEX: Record<FaceName, string> = {
  top: "#F5F5F0", front: "#C41E3A", right: "#0051A8",
  bottom: "#FFD600", left: "#FF6B1A", back: "#009B48",
};

const FACE_ORDER: FaceName[] = ["top", "left", "front", "right", "back", "bottom"];

interface Props {
  cubeType: CubeType;
  faceState: CubeFaceState;
  onFaceStateChange: (state: CubeFaceState) => void;
}

export default function CubeColorInput({ cubeType, faceState, onFaceStateChange }: Props) {
  const size = cubeType === "2x2" ? 2 : cubeType === "4x4" ? 4 : 3;
  const [selectedColor, setSelectedColor] = useState<CubeColor>("white");
  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
    const up = () => setIsMouseDown(false);
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  const paintCell = useCallback((face: FaceName, row: number, col: number) => {
    onFaceStateChange({
      ...faceState,
      [face]: faceState[face].map((r, ri) =>
        r.map((c, ci) => (ri === row && ci === col ? selectedColor : c))
      ),
    });
  }, [faceState, onFaceStateChange, selectedColor]);

  const clearAll = () => onFaceStateChange(createEmptyFaceState(cubeType));

  const cellSize = cubeType === "4x4" ? 22 : cubeType === "2x2" ? 36 : 28;
  const gap = cubeType === "4x4" ? 2 : 3;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground">Cube Input</h2>
          <p className="text-xs text-muted-foreground font-mono-custom mt-0.5">
            Paint your cube — changes reflect in the solve guide below
          </p>
        </div>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-mono-custom text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground px-3 py-1.5 rounded-md transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Color Palette */}
      <div>
        <p className="text-xs font-mono-custom text-muted-foreground uppercase tracking-widest mb-2">
          Color Palette
        </p>
        <div className="flex flex-wrap gap-2">
          {PALETTE_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              title={color.label}
              onClick={() => setSelectedColor(color.id)}
              className="w-10 h-10 rounded-lg transition-all duration-150 relative"
              style={{
                backgroundColor: color.hex,
                transform: selectedColor === color.id ? "scale(1.1)" : undefined,
                outline: selectedColor === color.id ? "2px solid white" : "none",
                outlineOffset: 2,
              }}
            />
          ))}
          {/* Eraser */}
          <button
            type="button"
            title="Erase"
            onClick={() => setSelectedColor(null)}
            className="w-10 h-10 rounded-lg border-2 transition-all duration-150 flex items-center justify-center text-xs font-mono-custom"
            style={{
              backgroundColor: "#1e2235",
              borderColor: selectedColor === null ? "white" : "rgba(255,255,255,0.15)",
              transform: selectedColor === null ? "scale(1.1)" : undefined,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-mono-custom mt-2">
          Selected:{" "}
          <span className="text-foreground capitalize">
            {selectedColor ?? "Eraser"}
          </span>
        </p>
      </div>

      {/* Cube Net */}
      <div>
        <p className="text-xs font-mono-custom text-muted-foreground uppercase tracking-widest mb-3">
          Cube Net — Unfolded {cubeType}
        </p>
        <div className="select-none">
          {/* Top face */}
          <div className="flex" style={{ paddingLeft: `${(cellSize + gap) * size}px` }}>
            <CubeFaceGrid
              face="top" cells={faceState.top} size={size} cellSize={cellSize} gap={gap}
              isMouseDown={isMouseDown} setIsMouseDown={setIsMouseDown} onPaint={paintCell}
            />
          </div>
          {/* Middle row */}
          <div className="flex" style={{ gap: `${gap}px`, marginTop: `${gap}px` }}>
            {(["left", "front", "right", "back"] as FaceName[]).map((face) => (
              <CubeFaceGrid
                key={face} face={face} cells={faceState[face]} size={size} cellSize={cellSize} gap={gap}
                isMouseDown={isMouseDown} setIsMouseDown={setIsMouseDown} onPaint={paintCell}
              />
            ))}
          </div>
          {/* Bottom face */}
          <div className="flex" style={{ paddingLeft: `${(cellSize + gap) * size}px`, marginTop: `${gap}px` }}>
            <CubeFaceGrid
              face="bottom" cells={faceState.bottom} size={size} cellSize={cellSize} gap={gap}
              isMouseDown={isMouseDown} setIsMouseDown={setIsMouseDown} onPaint={paintCell}
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground font-mono-custom mb-2 uppercase tracking-widest">
          Face Reference
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {FACE_ORDER.map((face) => (
            <div key={face} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm shrink-0 border border-white/10" style={{ backgroundColor: FACE_HEX[face] }} />
              <span className="text-xs text-muted-foreground font-mono-custom capitalize">{FACE_LABELS[face]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CubeFaceGrid sub-component
// ---------------------------------------------------------------------------

interface CubeFaceGridProps {
  face: FaceName;
  cells: CubeColor[][];
  size: number;
  cellSize: number;
  gap: number;
  isMouseDown: boolean;
  setIsMouseDown: (v: boolean) => void;
  onPaint: (face: FaceName, row: number, col: number) => void;
}

function CubeFaceGrid({ face, cells, size, cellSize, gap, isMouseDown, setIsMouseDown, onPaint }: CubeFaceGridProps) {
  const totalWidth = size * cellSize + (size - 1) * gap;
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-[9px] font-mono-custom uppercase tracking-widest opacity-70"
        style={{ color: FACE_HEX[face], width: totalWidth, textAlign: "center" }}
      >
        {FACE_LABELS[face]}
      </span>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${size}, ${cellSize}px)`, gap: `${gap}px` }}>
        {Array.from({ length: size * size }, (_, idx) => {
          const ri = Math.floor(idx / size);
          const ci = idx % size;
          const cell = cells[ri]?.[ci] ?? null;
          return (
            <button
              key={`${face}-${ri}-${ci}`}
              type="button"
              aria-label={`${face} row ${ri + 1} col ${ci + 1}: ${cell ?? "empty"}`}
              className="rounded-sm cursor-crosshair border border-white/8 hover:border-white/30 focus:outline-none"
              style={{
                width: cellSize, height: cellSize,
                backgroundColor: cell ? `var(--cube-${cell})` : "var(--cube-empty)",
                boxShadow: cell ? `0 0 6px var(--cube-${cell})40` : undefined,
              }}
              onMouseDown={() => { setIsMouseDown(true); onPaint(face, ri, ci); }}
              onMouseEnter={() => { if (isMouseDown) onPaint(face, ri, ci); }}
            />
          );
        })}
      </div>
    </div>
  );
}
