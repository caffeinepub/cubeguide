import { useState, useCallback, useEffect } from "react";
import type { CubeType } from "../App";

type CubeColor = "white" | "red" | "blue" | "orange" | "yellow" | "green" | null;

const PALETTE_COLORS: { id: CubeColor & string; label: string; cssVar: string }[] = [
  { id: "white",  label: "W", cssVar: "var(--cube-white)"  },
  { id: "red",    label: "R", cssVar: "var(--cube-red)"    },
  { id: "blue",   label: "B", cssVar: "var(--cube-blue)"   },
  { id: "orange", label: "O", cssVar: "var(--cube-orange)" },
  { id: "yellow", label: "Y", cssVar: "var(--cube-yellow)" },
  { id: "green",  label: "G", cssVar: "var(--cube-green)"  },
];

const FACE_LABELS: Record<string, string> = {
  top: "Top",
  left: "Left",
  front: "Front",
  right: "Right",
  back: "Back",
  bottom: "Bottom",
};

const FACE_COLORS: Record<string, string> = {
  top:    "var(--cube-white)",
  front:  "var(--cube-red)",
  right:  "var(--cube-blue)",
  bottom: "var(--cube-yellow)",
  left:   "var(--cube-orange)",
  back:   "var(--cube-green)",
};

type FaceName = "top" | "left" | "front" | "right" | "back" | "bottom";
const FACES: FaceName[] = ["top", "left", "front", "right", "back", "bottom"];

function getGridSize(cubeType: CubeType): number {
  if (cubeType === "2x2") return 2;
  if (cubeType === "4x4") return 4;
  return 3;
}

function createEmptyFace(size: number): CubeColor[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}

function createEmptyState(size: number): Record<FaceName, CubeColor[][]> {
  return {
    top:    createEmptyFace(size),
    left:   createEmptyFace(size),
    front:  createEmptyFace(size),
    right:  createEmptyFace(size),
    back:   createEmptyFace(size),
    bottom: createEmptyFace(size),
  };
}

interface Props {
  cubeType: CubeType;
}

export default function CubeColorInput({ cubeType }: Props) {
  const size = getGridSize(cubeType);
  const [faces, setFaces] = useState<Record<FaceName, CubeColor[][]>>(() => createEmptyState(size));
  const [selectedColor, setSelectedColor] = useState<CubeColor>("white");
  const [prevCubeType, setPrevCubeType] = useState<CubeType>(cubeType);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Reset drag state on global mouseup (handles leaving the component)
  useEffect(() => {
    const handleMouseUp = () => setIsMouseDown(false);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  // Reset grid when cube type changes
  if (cubeType !== prevCubeType) {
    setPrevCubeType(cubeType);
    setFaces(createEmptyState(getGridSize(cubeType)));
  }

  const paintCell = useCallback((face: FaceName, row: number, col: number) => {
    setFaces((prev) => {
      const newFace = prev[face].map((r, ri) =>
        r.map((c, ci) => (ri === row && ci === col ? selectedColor : c))
      );
      return { ...prev, [face]: newFace };
    });
  }, [selectedColor]);

  const clearAll = () => setFaces(createEmptyState(size));

  const cellSize = cubeType === "4x4" ? 22 : cubeType === "2x2" ? 36 : 28;
  const gap = cubeType === "4x4" ? 2 : 3;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground">Cube Input</h2>
          <p className="text-xs text-muted-foreground font-mono-custom mt-0.5">
            Paint your cube state
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
              title={color.id}
              onClick={() => setSelectedColor(color.id)}
              className={`
                relative w-10 h-10 rounded-lg transition-all duration-150 flex items-center justify-center
                ${selectedColor === color.id
                  ? "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110"
                  : "hover:scale-105 opacity-80 hover:opacity-100"
                }
              `}
              style={{ backgroundColor: color.cssVar }}
            >
              {selectedColor === color.id && (
                <span className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
              )}
            </button>
          ))}
          {/* Eraser */}
          <button
            type="button"
            title="Erase"
            onClick={() => setSelectedColor(null)}
            className={`
              w-10 h-10 rounded-lg border-2 transition-all duration-150 flex items-center justify-center text-xs font-mono-custom
              ${selectedColor === null
                ? "ring-2 ring-offset-2 ring-offset-card ring-foreground border-foreground text-foreground scale-110"
                : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground hover:scale-105"
              }
            `}
            style={{ backgroundColor: "var(--cube-empty)" }}
          >
            ✕
          </button>
        </div>
        {selectedColor !== null ? (
          <p className="text-xs text-muted-foreground font-mono-custom mt-2">
            Selected: <span className="text-foreground capitalize">{selectedColor}</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground font-mono-custom mt-2">
            Selected: <span className="text-foreground">Eraser</span>
          </p>
        )}
      </div>

      {/* Cube Net */}
      <div>
        <p className="text-xs font-mono-custom text-muted-foreground uppercase tracking-widest mb-3">
          Cube Net (Unfolded {cubeType})
        </p>

        {/* Standard cross layout: top, then row of left/front/right/back, then bottom */}
        <div className="select-none">
          {/* Top face */}
          <div className="flex" style={{ paddingLeft: `${(cellSize + gap) * size}px` }}>
            <CubeFace
              face="top"
              cells={faces.top}
              size={size}
              cellSize={cellSize}
              gap={gap}
              isMouseDown={isMouseDown}
              setIsMouseDown={setIsMouseDown}
              onPaint={paintCell}
              faceColor={FACE_COLORS.top}
              label={FACE_LABELS.top}
            />
          </div>

          {/* Middle row: left, front, right, back */}
          <div className="flex" style={{ gap: `${gap}px`, marginTop: `${gap}px` }}>
            {(["left", "front", "right", "back"] as FaceName[]).map((faceName) => (
              <CubeFace
                key={faceName}
                face={faceName}
                cells={faces[faceName]}
                size={size}
                cellSize={cellSize}
                gap={gap}
                isMouseDown={isMouseDown}
                setIsMouseDown={setIsMouseDown}
                onPaint={paintCell}
                faceColor={FACE_COLORS[faceName]}
                label={FACE_LABELS[faceName]}
              />
            ))}
          </div>

          {/* Bottom face */}
          <div
            className="flex"
            style={{ paddingLeft: `${(cellSize + gap) * size}px`, marginTop: `${gap}px` }}
          >
            <CubeFace
              face="bottom"
              cells={faces.bottom}
              size={size}
              cellSize={cellSize}
              gap={gap}
              isMouseDown={isMouseDown}
              setIsMouseDown={setIsMouseDown}
              onPaint={paintCell}
              faceColor={FACE_COLORS.bottom}
              label={FACE_LABELS.bottom}
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
          {FACES.map((face) => (
            <div key={face} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm shrink-0 border border-white/10"
                style={{ backgroundColor: FACE_COLORS[face] }}
              />
              <span className="text-xs text-muted-foreground font-mono-custom capitalize">{face}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface CubeFaceProps {
  face: FaceName;
  cells: CubeColor[][];
  size: number;
  cellSize: number;
  gap: number;
  isMouseDown: boolean;
  setIsMouseDown: (v: boolean) => void;
  onPaint: (face: FaceName, row: number, col: number) => void;
  faceColor: string;
  label: string;
}

function CubeFace({
  face,
  cells,
  size,
  cellSize,
  gap,
  isMouseDown,
  setIsMouseDown,
  onPaint,
  faceColor,
  label,
}: CubeFaceProps) {
  const totalWidth = size * cellSize + (size - 1) * gap;

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-[9px] font-mono-custom uppercase tracking-widest"
        style={{ color: faceColor, width: totalWidth, textAlign: "center", opacity: 0.8 }}
      >
        {label}
      </span>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
          gap: `${gap}px`,
        }}
      >
        {cells.flatMap((row, ri) =>
          row.map((cell, ci) => {
            const cellKey = `${face}-r${ri}c${ci}`;
            return (
              <button
                key={cellKey}
                type="button"
                aria-label={`Face ${face} row ${ri + 1} col ${ci + 1}: ${cell ?? "empty"}`}
                className="rounded-sm cursor-crosshair transition-all duration-100 border border-white/8 hover:border-white/20 focus:outline-none focus:ring-1 focus:ring-ring"
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: cell ? `var(--cube-${cell})` : "var(--cube-empty)",
                  boxShadow: cell ? `0 0 6px var(--cube-${cell})40` : undefined,
                }}
                onMouseDown={() => {
                  setIsMouseDown(true);
                  onPaint(face, ri, ci);
                }}
                onMouseEnter={() => {
                  if (isMouseDown) onPaint(face, ri, ci);
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
