import { useState, useRef, useCallback, useLayoutEffect } from "react";
import type { CubeType } from "../App";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FaceName = "U" | "D" | "F" | "B" | "L" | "R";
type ColorKey = "white" | "yellow" | "red" | "blue" | "orange" | "green" | "gray";
type MoveDir = "CW" | "CCW";

interface Move {
  label: string;
  face: FaceName;
  dir: MoveDir;
}

// ---------------------------------------------------------------------------
// Cube color CSS vars
// ---------------------------------------------------------------------------

const FACE_COLOR: Record<FaceName, string> = {
  U: "var(--cube-white)",
  D: "var(--cube-yellow)",
  F: "var(--cube-red)",
  B: "var(--cube-orange)",
  L: "var(--cube-green)",
  R: "var(--cube-blue)",
};

const COLOR_CSS: Record<ColorKey, string> = {
  white:  "var(--cube-white)",
  yellow: "var(--cube-yellow)",
  red:    "var(--cube-red)",
  blue:   "var(--cube-blue)",
  orange: "var(--cube-orange)",
  green:  "var(--cube-green)",
  gray:   "var(--cube-empty)",
};

// ---------------------------------------------------------------------------
// Solved cube state
// ---------------------------------------------------------------------------

function createSolvedState(n: number): Record<FaceName, ColorKey[][]> {
  const fill = (c: ColorKey): ColorKey[][] =>
    Array.from({ length: n }, () => Array.from({ length: n }, () => c));
  return {
    U: fill("white"),
    D: fill("yellow"),
    F: fill("red"),
    B: fill("orange"),
    L: fill("green"),
    R: fill("blue"),
  };
}

// ---------------------------------------------------------------------------
// Move sequences
// ---------------------------------------------------------------------------

const MOVES_3X3: Move[] = [
  { label: "Turn the top layer clockwise", face: "U", dir: "CW" },
  { label: "Turn the right side down (clockwise)", face: "R", dir: "CW" },
  { label: "Turn the top layer counter-clockwise", face: "U", dir: "CCW" },
  { label: "Turn the right side back up (counter-clockwise)", face: "R", dir: "CCW" },
  { label: "Turn the front face clockwise", face: "F", dir: "CW" },
  { label: "Turn the top layer clockwise again", face: "U", dir: "CW" },
  { label: "Turn the front face back (counter-clockwise)", face: "F", dir: "CCW" },
  { label: "Turn the right side down (clockwise)", face: "R", dir: "CW" },
  { label: "Turn the top layer clockwise", face: "U", dir: "CW" },
  { label: "Turn the right side back up (counter-clockwise)", face: "R", dir: "CCW" },
  { label: "Turn the top layer counter-clockwise", face: "U", dir: "CCW" },
  { label: "Turn the top layer counter-clockwise again", face: "U", dir: "CCW" },
];

const MOVES_2X2: Move[] = [
  { label: "Turn the top layer clockwise", face: "U", dir: "CW" },
  { label: "Turn the right side down (clockwise)", face: "R", dir: "CW" },
  { label: "Turn the top layer counter-clockwise", face: "U", dir: "CCW" },
  { label: "Turn the right side back up (counter-clockwise)", face: "R", dir: "CCW" },
  { label: "Turn the front face clockwise", face: "F", dir: "CW" },
  { label: "Turn the right side clockwise", face: "R", dir: "CW" },
  { label: "Turn the top layer clockwise", face: "U", dir: "CW" },
  { label: "Turn the right side counter-clockwise", face: "R", dir: "CCW" },
];

const MOVES_4X4: Move[] = [
  { label: "Turn the top layer clockwise", face: "U", dir: "CW" },
  { label: "Turn the right side down (clockwise)", face: "R", dir: "CW" },
  { label: "Turn the top layer counter-clockwise", face: "U", dir: "CCW" },
  { label: "Turn the right side back up (counter-clockwise)", face: "R", dir: "CCW" },
  { label: "Turn the front face clockwise", face: "F", dir: "CW" },
  { label: "Turn the top layer clockwise", face: "U", dir: "CW" },
  { label: "Turn the front face back (counter-clockwise)", face: "F", dir: "CCW" },
  { label: "Turn the right side down (clockwise)", face: "R", dir: "CW" },
  { label: "Turn the top layer clockwise", face: "U", dir: "CW" },
  { label: "Turn the right side back up (counter-clockwise)", face: "R", dir: "CCW" },
  { label: "Turn the left side clockwise", face: "L", dir: "CW" },
  { label: "Turn the top layer counter-clockwise", face: "U", dir: "CCW" },
  { label: "Turn the left side back (counter-clockwise)", face: "L", dir: "CCW" },
  { label: "Turn the bottom layer clockwise", face: "D", dir: "CW" },
  { label: "Turn the back face clockwise", face: "B", dir: "CW" },
];

const MOVES: Record<CubeType, Move[]> = {
  "2x2": MOVES_2X2,
  "3x3": MOVES_3X3,
  "4x4": MOVES_4X4,
};

// ---------------------------------------------------------------------------
// Cube mutation logic
// ---------------------------------------------------------------------------

function deepClone(state: Record<FaceName, ColorKey[][]>): Record<FaceName, ColorKey[][]> {
  return {
    U: state.U.map(r => [...r]),
    D: state.D.map(r => [...r]),
    F: state.F.map(r => [...r]),
    B: state.B.map(r => [...r]),
    L: state.L.map(r => [...r]),
    R: state.R.map(r => [...r]),
  };
}

function rotateFaceCW(face: ColorKey[][]): ColorKey[][] {
  const n = face.length;
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => face[n - 1 - c][r])
  );
}

function rotateFaceCCW(face: ColorKey[][]): ColorKey[][] {
  const n = face.length;
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => face[c][n - 1 - r])
  );
}

function applyMove(state: Record<FaceName, ColorKey[][]>, move: Move): Record<FaceName, ColorKey[][]> {
  const s = deepClone(state);
  const n = s.U.length;
  const cw = move.dir === "CW";

  if (cw) {
    s[move.face] = rotateFaceCW(s[move.face]);
  } else {
    s[move.face] = rotateFaceCCW(s[move.face]);
  }

  switch (move.face) {
    case "U": {
      const tmpF = [...s.F[0]];
      if (cw) {
        s.F[0] = [...s.L[0]];
        s.L[0] = [...s.B[0]];
        s.B[0] = [...s.R[0]];
        s.R[0] = [...tmpF];
      } else {
        s.F[0] = [...s.R[0]];
        s.R[0] = [...s.B[0]];
        s.B[0] = [...s.L[0]];
        s.L[0] = [...tmpF];
      }
      break;
    }
    case "D": {
      const row = n - 1;
      const tmpF = [...s.F[row]];
      if (cw) {
        s.F[row] = [...s.R[row]];
        s.R[row] = [...s.B[row]];
        s.B[row] = [...s.L[row]];
        s.L[row] = [...tmpF];
      } else {
        s.F[row] = [...s.L[row]];
        s.L[row] = [...s.B[row]];
        s.B[row] = [...s.R[row]];
        s.R[row] = [...tmpF];
      }
      break;
    }
    case "R": {
      const col = n - 1;
      const uCol = Array.from({ length: n }, (_, r) => s.U[r][col]);
      const fCol = Array.from({ length: n }, (_, r) => s.F[r][col]);
      const dCol = Array.from({ length: n }, (_, r) => s.D[r][col]);
      const bCol = Array.from({ length: n }, (_, r) => s.B[r][0]);
      if (cw) {
        for (let r = 0; r < n; r++) {
          s.U[r][col] = bCol[n - 1 - r];
          s.F[r][col] = uCol[r];
          s.D[r][col] = fCol[r];
          s.B[n - 1 - r][0] = dCol[r];
        }
      } else {
        for (let r = 0; r < n; r++) {
          s.F[r][col] = dCol[r];
          s.D[r][col] = bCol[n - 1 - r];
          s.B[n - 1 - r][0] = uCol[r];
          s.U[r][col] = fCol[r];
        }
      }
      break;
    }
    case "L": {
      const col = 0;
      const uCol = Array.from({ length: n }, (_, r) => s.U[r][col]);
      const fCol = Array.from({ length: n }, (_, r) => s.F[r][col]);
      const dCol = Array.from({ length: n }, (_, r) => s.D[r][col]);
      const bCol = Array.from({ length: n }, (_, r) => s.B[r][n - 1]);
      if (cw) {
        for (let r = 0; r < n; r++) {
          s.F[r][col] = uCol[r];
          s.D[r][col] = fCol[r];
          s.B[n - 1 - r][n - 1] = dCol[r];
          s.U[r][col] = bCol[n - 1 - r];
        }
      } else {
        for (let r = 0; r < n; r++) {
          s.U[r][col] = fCol[r];
          s.F[r][col] = dCol[r];
          s.D[r][col] = bCol[n - 1 - r];
          s.B[n - 1 - r][n - 1] = uCol[r];
        }
      }
      break;
    }
    case "F": {
      const uRow = [...s.U[n - 1]];
      const rCol = Array.from({ length: n }, (_, r) => s.R[r][0]);
      const dRow = [...s.D[0]];
      const lCol = Array.from({ length: n }, (_, r) => s.L[r][n - 1]);
      if (cw) {
        for (let i = 0; i < n; i++) {
          s.R[i][0] = uRow[i];
          s.D[0][n - 1 - i] = rCol[i];
          s.L[n - 1 - i][n - 1] = dRow[i];
          s.U[n - 1][i] = lCol[n - 1 - i];
        }
      } else {
        for (let i = 0; i < n; i++) {
          s.U[n - 1][n - 1 - i] = rCol[i];
          s.R[i][0] = dRow[n - 1 - i];
          s.D[0][i] = lCol[i];
          s.L[n - 1 - i][n - 1] = uRow[n - 1 - i];
        }
      }
      break;
    }
    case "B": {
      const uRow = [...s.U[0]];
      const lCol = Array.from({ length: n }, (_, r) => s.L[r][0]);
      const dRow = [...s.D[n - 1]];
      const rCol = Array.from({ length: n }, (_, r) => s.R[r][n - 1]);
      if (cw) {
        for (let i = 0; i < n; i++) {
          s.L[n - 1 - i][0] = uRow[i];
          s.D[n - 1][i] = lCol[n - 1 - i];
          s.R[i][n - 1] = dRow[n - 1 - i];
          s.U[0][n - 1 - i] = rCol[i];
        }
      } else {
        for (let i = 0; i < n; i++) {
          s.U[0][i] = lCol[n - 1 - i];
          s.L[n - 1 - i][0] = dRow[n - 1 - i];
          s.D[n - 1][n - 1 - i] = rCol[i];
          s.R[i][n - 1] = uRow[n - 1 - i];
        }
      }
      break;
    }
  }

  return s;
}

// ---------------------------------------------------------------------------
// Highlighted cells per move
// ---------------------------------------------------------------------------

function getHighlightedCells(face: FaceName, n: number): { face: FaceName; row: number; col: number }[] {
  const cells: { face: FaceName; row: number; col: number }[] = [];

  // Always highlight the entire rotating face
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      cells.push({ face, row: r, col: c });
    }
  }

  // Also highlight the affected edge row/col on adjacent faces
  switch (face) {
    case "U":
      for (let c = 0; c < n; c++) {
        cells.push({ face: "F", row: 0, col: c });
        cells.push({ face: "L", row: 0, col: c });
        cells.push({ face: "R", row: 0, col: c });
        cells.push({ face: "B", row: 0, col: c });
      }
      break;
    case "D":
      for (let c = 0; c < n; c++) {
        cells.push({ face: "F", row: n - 1, col: c });
        cells.push({ face: "L", row: n - 1, col: c });
        cells.push({ face: "R", row: n - 1, col: c });
        cells.push({ face: "B", row: n - 1, col: c });
      }
      break;
    case "R":
      for (let r = 0; r < n; r++) {
        cells.push({ face: "U", row: r, col: n - 1 });
        cells.push({ face: "F", row: r, col: n - 1 });
        cells.push({ face: "D", row: r, col: n - 1 });
        cells.push({ face: "B", row: r, col: 0 });
      }
      break;
    case "L":
      for (let r = 0; r < n; r++) {
        cells.push({ face: "U", row: r, col: 0 });
        cells.push({ face: "F", row: r, col: 0 });
        cells.push({ face: "D", row: r, col: 0 });
        cells.push({ face: "B", row: r, col: n - 1 });
      }
      break;
    case "F":
      for (let i = 0; i < n; i++) {
        cells.push({ face: "U", row: n - 1, col: i });
        cells.push({ face: "D", row: 0, col: i });
        cells.push({ face: "L", row: i, col: n - 1 });
        cells.push({ face: "R", row: i, col: 0 });
      }
      break;
    case "B":
      for (let i = 0; i < n; i++) {
        cells.push({ face: "U", row: 0, col: i });
        cells.push({ face: "D", row: n - 1, col: i });
        cells.push({ face: "L", row: i, col: 0 });
        cells.push({ face: "R", row: i, col: n - 1 });
      }
      break;
  }

  return cells;
}

// ---------------------------------------------------------------------------
// Arrow SVG overlay logic
// ---------------------------------------------------------------------------

interface NetLayout {
  cellSize: number;
  gap: number;
  faceOrigins: Record<FaceName, { x: number; y: number }>;
}

function computeNetLayout(n: number, cellSize: number, gap: number): NetLayout {
  const faceSpan = n * cellSize + (n - 1) * gap;
  const facePad = gap;

  // Cross layout: U at top (offset by one face width), L/F/R/B in middle, D at bottom
  const faceOrigins: Record<FaceName, { x: number; y: number }> = {
    U: { x: faceSpan + facePad, y: 0 },
    L: { x: 0,                  y: faceSpan + facePad },
    F: { x: faceSpan + facePad, y: faceSpan + facePad },
    R: { x: 2 * (faceSpan + facePad), y: faceSpan + facePad },
    B: { x: 3 * (faceSpan + facePad), y: faceSpan + facePad },
    D: { x: faceSpan + facePad, y: 2 * (faceSpan + facePad) },
  };

  return { cellSize, gap, faceOrigins };
}

/** Get center pixel of a cell in the net layout */
function cellCenter(
  layout: NetLayout,
  face: FaceName,
  row: number,
  col: number
): { x: number; y: number } {
  const { cellSize, gap, faceOrigins } = layout;
  const origin = faceOrigins[face];
  return {
    x: origin.x + col * (cellSize + gap) + cellSize / 2,
    y: origin.y + row * (cellSize + gap) + cellSize / 2,
  };
}

/** Center of an entire face */
function faceCenter(layout: NetLayout, face: FaceName, n: number): { x: number; y: number } {
  const { cellSize, gap, faceOrigins } = layout;
  const origin = faceOrigins[face];
  const faceSpan = n * cellSize + (n - 1) * gap;
  return {
    x: origin.x + faceSpan / 2,
    y: origin.y + faceSpan / 2,
  };
}

interface ArrowPath {
  d: string;
  color: string;
  key: string;
}

/** Build SVG curved rotation arrow around a face */
function buildFaceRotationArrow(
  layout: NetLayout,
  face: FaceName,
  dir: MoveDir,
  n: number
): ArrowPath {
  const { cellSize, gap, faceOrigins } = layout;
  const faceSpan = n * cellSize + (n - 1) * gap;
  const cx = faceOrigins[face].x + faceSpan / 2;
  const cy = faceOrigins[face].y + faceSpan / 2;
  const r = faceSpan / 2 + 10;

  // Draw arc: start at top, sweep CW or CCW ~270°
  const startAngle = dir === "CW" ? -90 : -90;
  const endAngle   = dir === "CW" ? 180  : -360 + 90;
  // Represent as a large arc from top to left (CW) or top to right (CCW)
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const a1 = toRad(startAngle);
  const a2 = dir === "CW" ? toRad(180) : toRad(-180 + 10);

  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2);
  const y2 = cy + r * Math.sin(a2);

  const sweepFlag = dir === "CW" ? 1 : 0;
  const d = `M ${x1} ${y1} A ${r} ${r} 0 1 ${sweepFlag} ${x2} ${y2}`;

  return {
    d,
    color: FACE_COLOR[face],
    key: `rot-${face}-${dir}`,
  };
}

/** Build arrows showing which edge rows/cols move where */
function buildEdgeArrows(
  layout: NetLayout,
  face: FaceName,
  dir: MoveDir,
  n: number
): ArrowPath[] {
  const arrows: ArrowPath[] = [];
  const midCell = Math.floor(n / 2);
  const color = FACE_COLOR[face];

  function arrowBetween(
    fromFace: FaceName, fromRow: number, fromCol: number,
    toFace: FaceName, toRow: number, toCol: number,
    key: string
  ): ArrowPath {
    const from = cellCenter(layout, fromFace, fromRow, fromCol);
    const to   = cellCenter(layout, toFace, toRow, toCol);
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    // Curve the midpoint perpendicular to direction
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const bend = Math.min(len * 0.25, 32);
    const cpx = mx - (dy / len) * bend;
    const cpy = my + (dx / len) * bend;
    return {
      d: `M ${from.x} ${from.y} Q ${cpx} ${cpy} ${to.x} ${to.y}`,
      color,
      key,
    };
  }

  switch (face) {
    case "U":
      if (dir === "CW") {
        // F→R, L→F, B→L, R→B (top row)
        arrows.push(arrowBetween("F", 0, midCell, "R", 0, midCell, "u-fr"));
        arrows.push(arrowBetween("L", 0, midCell, "F", 0, midCell, "u-lf"));
      } else {
        arrows.push(arrowBetween("F", 0, midCell, "L", 0, midCell, "u-fl"));
        arrows.push(arrowBetween("R", 0, midCell, "F", 0, midCell, "u-rf"));
      }
      break;
    case "D":
      if (dir === "CW") {
        arrows.push(arrowBetween("F", n - 1, midCell, "L", n - 1, midCell, "d-fl"));
        arrows.push(arrowBetween("R", n - 1, midCell, "F", n - 1, midCell, "d-rf"));
      } else {
        arrows.push(arrowBetween("F", n - 1, midCell, "R", n - 1, midCell, "d-fr"));
        arrows.push(arrowBetween("L", n - 1, midCell, "F", n - 1, midCell, "d-lf"));
      }
      break;
    case "R":
      if (dir === "CW") {
        arrows.push(arrowBetween("U", midCell, n - 1, "F", midCell, n - 1, "r-uf"));
        arrows.push(arrowBetween("F", midCell, n - 1, "D", midCell, n - 1, "r-fd"));
      } else {
        arrows.push(arrowBetween("F", midCell, n - 1, "U", midCell, n - 1, "r-fu"));
        arrows.push(arrowBetween("D", midCell, n - 1, "F", midCell, n - 1, "r-df"));
      }
      break;
    case "L":
      if (dir === "CW") {
        arrows.push(arrowBetween("U", midCell, 0, "F", midCell, 0, "l-uf"));
        arrows.push(arrowBetween("F", midCell, 0, "D", midCell, 0, "l-fd"));
      } else {
        arrows.push(arrowBetween("F", midCell, 0, "U", midCell, 0, "l-fu"));
        arrows.push(arrowBetween("D", midCell, 0, "F", midCell, 0, "l-df"));
      }
      break;
    case "F":
      if (dir === "CW") {
        arrows.push(arrowBetween("U", n - 1, midCell, "R", midCell, 0, "f-ur"));
        arrows.push(arrowBetween("L", midCell, n - 1, "U", n - 1, midCell, "f-lu"));
      } else {
        arrows.push(arrowBetween("U", n - 1, midCell, "L", midCell, n - 1, "f-ul"));
        arrows.push(arrowBetween("R", midCell, 0, "U", n - 1, midCell, "f-ru"));
      }
      break;
    case "B":
      if (dir === "CW") {
        arrows.push(arrowBetween("U", 0, midCell, "L", midCell, 0, "b-ul"));
        arrows.push(arrowBetween("R", midCell, n - 1, "U", 0, midCell, "b-ru"));
      } else {
        arrows.push(arrowBetween("U", 0, midCell, "R", midCell, n - 1, "b-ur"));
        arrows.push(arrowBetween("L", midCell, 0, "U", 0, midCell, "b-lu"));
      }
      break;
  }

  // Add arrow for face center to itself (rotation indicator)
  const fc = faceCenter(layout, face, n);
  const rotArrow = buildFaceRotationArrow(layout, face, dir, n);
  arrows.push(rotArrow);
  // Suppress unused fc warning
  void fc;

  return arrows;
}

// ---------------------------------------------------------------------------
// SVG arrowhead marker id helper
// ---------------------------------------------------------------------------

function markerId(color: string): string {
  return `arrowhead-${color.replace(/[^a-z0-9]/gi, "_")}`;
}

// ---------------------------------------------------------------------------
// CubeNet flat-net renderer with arrow overlay
// ---------------------------------------------------------------------------

interface CubeNetProps {
  state: Record<FaceName, ColorKey[][]>;
  n: number;
  highlightSet: Set<string>;
  layout: NetLayout;
  arrows: ArrowPath[];
  netWidth: number;
  netHeight: number;
}

function CubeNetWithArrows({ state, n, highlightSet, layout, arrows, netWidth, netHeight }: CubeNetProps) {
  const { cellSize, gap } = layout;

  const uniqueColors = [...new Set(arrows.map(a => a.color))];

  function renderFace(face: FaceName) {
    const origin = layout.faceOrigins[face];
    return (
      <g key={face}>
        {state[face].flatMap((row, ri) =>
          row.map((colorKey, ci) => {
            const cellId = `${face}-cell-r${ri}c${ci}`;
            const hlKey = `${face}-${ri}-${ci}`;
            const isHighlighted = highlightSet.has(hlKey);
            const x = origin.x + ci * (cellSize + gap);
            const y = origin.y + ri * (cellSize + gap);
            return (
              <rect
                key={cellId}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx={2}
                fill={COLOR_CSS[colorKey]}
                stroke={isHighlighted ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.1)"}
                strokeWidth={isHighlighted ? 2 : 1}
                style={{
                  filter: isHighlighted
                    ? `drop-shadow(0 0 6px ${COLOR_CSS[colorKey]})`
                    : undefined,
                  transition: "stroke 0.2s, stroke-width 0.2s",
                }}
              />
            );
          })
        )}
        {/* Face label */}
        <text
          x={origin.x + (n * cellSize + (n - 1) * gap) / 2}
          y={origin.y - 5}
          textAnchor="middle"
          fontSize={8}
          fill={FACE_COLOR[face]}
          fontFamily="'Space Mono', monospace"
          opacity={0.7}
        >
          {face}
        </text>
      </g>
    );
  }

  return (
    <svg
      width={netWidth}
      height={netHeight}
      viewBox={`0 0 ${netWidth} ${netHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        {uniqueColors.map(color => (
          <marker
            key={color}
            id={markerId(color)}
            markerWidth={8}
            markerHeight={8}
            refX={6}
            refY={3}
            orient="auto"
          >
            <path d="M0,0 L0,6 L8,3 z" fill={color} />
          </marker>
        ))}
      </defs>

      {/* Face cells */}
      {(["U", "L", "F", "R", "B", "D"] as FaceName[]).map(face => renderFace(face))}

      {/* SVG arrows */}
      {arrows.map(arrow => (
        <path
          key={arrow.key}
          d={arrow.d}
          fill="none"
          stroke={arrow.color}
          strokeWidth={2.5}
          strokeLinecap="round"
          markerEnd={`url(#${markerId(arrow.color)})`}
          opacity={0.9}
          style={{ filter: `drop-shadow(0 0 4px ${arrow.color}80)` }}
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main CubeSolveGuide component
// ---------------------------------------------------------------------------

interface Props {
  cubeType: CubeType;
}

export default function CubeSolveGuide({ cubeType }: Props) {
  const n = cubeType === "2x2" ? 2 : cubeType === "4x4" ? 4 : 3;
  const moves = MOVES[cubeType];

  // Cell size: larger for 2x2, smaller for 4x4
  const cellSize = cubeType === "2x2" ? 36 : cubeType === "4x4" ? 22 : 30;
  const gap = 3;

  const layout = computeNetLayout(n, cellSize, gap);

  const faceSpan = n * cellSize + (n - 1) * gap;
  const facePad = gap;
  // Net spans 4 faces wide (L, F, R, B) + padding, and 3 faces tall (U, middle, D) + padding + label space
  const netWidth  = 4 * (faceSpan + facePad) + faceSpan + 20;
  const netHeight = 3 * (faceSpan + facePad) + faceSpan + 20;

  // Adjust faceOrigins to include some top padding for labels
  const labelPad = 14;
  const adjustedLayout: NetLayout = {
    ...layout,
    faceOrigins: {
      U: { x: layout.faceOrigins.U.x, y: layout.faceOrigins.U.y + labelPad },
      L: { x: layout.faceOrigins.L.x, y: layout.faceOrigins.L.y + labelPad },
      F: { x: layout.faceOrigins.F.x, y: layout.faceOrigins.F.y + labelPad },
      R: { x: layout.faceOrigins.R.x, y: layout.faceOrigins.R.y + labelPad },
      B: { x: layout.faceOrigins.B.x, y: layout.faceOrigins.B.y + labelPad },
      D: { x: layout.faceOrigins.D.x, y: layout.faceOrigins.D.y + labelPad },
    },
  };

  const adjustedNetHeight = netHeight + labelPad;

  // State
  const initialState = createSolvedState(n);
  const [stateHistory, setStateHistory] = useState<Record<FaceName, ColorKey[][]>[]>([initialState]);
  const [moveIndex, setMoveIndex] = useState(0); // 0 = before any move
  const [prevCubeType, setPrevCubeType] = useState<CubeType>(cubeType);

  // Reset when cube type changes
  if (cubeType !== prevCubeType) {
    setPrevCubeType(cubeType);
    setStateHistory([createSolvedState(n)]);
    setMoveIndex(0);
  }

  const currentState = stateHistory[moveIndex] ?? stateHistory[stateHistory.length - 1];
  const currentMove = moveIndex < moves.length ? moves[moveIndex] : null;

  // Highlight set for current move
  const highlightSet = currentMove
    ? new Set(
        getHighlightedCells(currentMove.face, n).map(
          c => `${c.face}-${c.row}-${c.col}`
        )
      )
    : new Set<string>();

  // Build arrows for current move
  const arrows: ArrowPath[] = currentMove
    ? buildEdgeArrows(adjustedLayout, currentMove.face, currentMove.dir, n)
    : [];

  const handleNext = useCallback(() => {
    if (moveIndex >= moves.length) return;
    const currentMoveData = moves[moveIndex];
    const newState = applyMove(stateHistory[moveIndex], currentMoveData);
    setStateHistory(prev => {
      const next = prev.slice(0, moveIndex + 1);
      next.push(newState);
      return next;
    });
    setMoveIndex(prev => prev + 1);
  }, [moveIndex, moves, stateHistory]);

  const handleBack = useCallback(() => {
    if (moveIndex === 0) return;
    setMoveIndex(prev => prev - 1);
  }, [moveIndex]);

  const handleReset = useCallback(() => {
    setStateHistory([createSolvedState(n)]);
    setMoveIndex(0);
  }, [n]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    obs.observe(containerRef.current);
    setContainerWidth(containerRef.current.offsetWidth);
    return () => obs.disconnect();
  }, []);

  // Scale to fit container
  const scale = containerWidth > 0 ? Math.min(1, (containerWidth - 16) / netWidth) : 1;

  const isFirst = moveIndex === 0;
  const isLast = moveIndex >= moves.length;

  return (
    <div
      className="rounded-xl border border-border overflow-hidden"
      style={{ background: "oklch(0.14 0.006 260)" }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground tracking-tight">
            How to Solve — {cubeType} Cube
          </h2>
          <p className="text-xs text-muted-foreground font-mono-custom mt-0.5">
            {moveIndex > 0 ? `Move ${moveIndex} of ${moves.length}` : `${moves.length} moves total`}
            {isLast ? " · Sequence complete!" : ""}
          </p>
        </div>

        {/* Move indicator pill */}
        {currentMove && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-mono-custom shrink-0"
            style={{
              borderColor: FACE_COLOR[currentMove.face] + "60",
              background: FACE_COLOR[currentMove.face] + "12",
              color: FACE_COLOR[currentMove.face],
            }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: FACE_COLOR[currentMove.face] }} />
            {currentMove.face} — {currentMove.dir === "CW" ? "Clockwise ↻" : "Counter-clockwise ↺"}
          </div>
        )}
        {isLast && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-mono-custom shrink-0"
            style={{ borderColor: "var(--cube-green)60", background: "var(--cube-green)12", color: "var(--cube-green)" }}
          >
            ✓ Complete
          </div>
        )}
      </div>

      {/* Instruction banner */}
      <div
        className="px-5 py-3 flex items-center gap-3"
        style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="w-1 rounded-full self-stretch shrink-0"
          style={{ background: currentMove ? FACE_COLOR[currentMove.face] : "rgba(255,255,255,0.15)" }}
        />
        <p className="text-sm text-foreground leading-relaxed">
          {currentMove
            ? currentMove.label
            : isLast
            ? "You've followed all the moves. Hit Reset to start over."
            : "Press Next to begin the solving sequence."}
        </p>
      </div>

      {/* Cube flat-net with arrows */}
      <div
        ref={containerRef}
        className="px-4 py-5 flex justify-center overflow-hidden"
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            width: netWidth,
            height: adjustedNetHeight * scale,
          }}
        >
          <CubeNetWithArrows
            state={currentState}
            n={n}
            highlightSet={highlightSet}
            layout={adjustedLayout}
            arrows={arrows}
            netWidth={netWidth}
            netHeight={adjustedNetHeight}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-2">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(moveIndex / moves.length) * 100}%`,
              background: currentMove
                ? `linear-gradient(90deg, ${FACE_COLOR[currentMove.face]}90, ${FACE_COLOR[currentMove.face]})`
                : "rgba(255,255,255,0.2)",
            }}
          />
        </div>
        <div className="flex gap-1 mt-2 flex-wrap">
          {moves.map((m, i) => (
            <button
              key={`move-dot-${m.face}-${m.dir}-${i}-${m.label.slice(0, 8)}`}
              type="button"
              title={m.label}
              onClick={() => {
                // Navigate to this step
                if (i < moveIndex) {
                  setMoveIndex(i);
                } else if (i === moveIndex) {
                  // already there
                } else {
                  // Fast-forward: compute states
                  let current = stateHistory[moveIndex];
                  const history = stateHistory.slice(0, moveIndex + 1);
                  for (let j = moveIndex; j < i; j++) {
                    current = applyMove(current, moves[j]);
                    history.push(current);
                  }
                  setStateHistory(history);
                  setMoveIndex(i);
                }
              }}
              style={{
                width: 20,
                height: 8,
                borderRadius: 4,
                background: i < moveIndex
                  ? FACE_COLOR[m.face]
                  : i === moveIndex
                  ? FACE_COLOR[m.face] + "90"
                  : "rgba(255,255,255,0.08)",
                border: i === moveIndex ? `1px solid ${FACE_COLOR[m.face]}` : "none",
                cursor: "pointer",
                transition: "background 0.2s",
                padding: 0,
                flexShrink: 0,
              }}
              aria-label={`Go to move ${i + 1}: ${m.label}`}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 pb-5 pt-3 flex items-center gap-3">
        {/* Back */}
        <button
          type="button"
          onClick={handleBack}
          disabled={isFirst}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-mono-custom transition-all"
          style={{
            background: isFirst ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: isFirst ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
            cursor: isFirst ? "not-allowed" : "pointer",
          }}
        >
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
          Back
        </button>

        {/* Next — primary */}
        <button
          type="button"
          onClick={handleNext}
          disabled={isLast}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-display font-bold transition-all"
          style={{
            background: isLast
              ? "rgba(255,255,255,0.04)"
              : currentMove
              ? `linear-gradient(135deg, ${FACE_COLOR[currentMove.face]}cc, ${FACE_COLOR[currentMove.face]})`
              : "rgba(255,255,255,0.12)",
            border: isLast ? "1px solid rgba(255,255,255,0.08)" : "none",
            color: isLast ? "rgba(255,255,255,0.2)" : "#000",
            cursor: isLast ? "not-allowed" : "pointer",
            boxShadow: !isLast && currentMove
              ? `0 4px 20px ${FACE_COLOR[currentMove.face]}40`
              : undefined,
          }}
        >
          {isLast ? "Sequence Complete" : "Next Move"}
          {!isLast && (
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          )}
        </button>

        {/* Reset */}
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-mono-custom transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
          }}
        >
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          Reset
        </button>
      </div>

      {/* Face legend */}
      <div className="px-5 pb-5">
        <div
          className="rounded-lg px-4 py-3 flex flex-wrap gap-x-5 gap-y-1.5"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="w-full text-[9px] font-mono-custom uppercase tracking-widest text-muted-foreground mb-0.5">
            Face Legend
          </p>
          {(["U","L","F","R","B","D"] as FaceName[]).map(face => {
            const faceNames: Record<FaceName, string> = {
              U: "Up (White)",
              D: "Down (Yellow)",
              F: "Front (Red)",
              B: "Back (Orange)",
              L: "Left (Green)",
              R: "Right (Blue)",
            };
            return (
              <div key={face} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm border border-white/10 shrink-0"
                  style={{ background: FACE_COLOR[face] }}
                />
                <span className="text-[10px] font-mono-custom text-muted-foreground">
                  <span className="text-foreground">{face}</span> = {faceNames[face]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
