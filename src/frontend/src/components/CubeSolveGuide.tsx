import React, { useState, useRef, useLayoutEffect, useCallback } from "react";
import type { CubeType, CubeFaceState } from "../App";

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
// Colors
// ---------------------------------------------------------------------------

const FACE_COLOR_HEX: Record<FaceName, string> = {
  U: "#F5F5F0", D: "#FFD600", F: "#C41E3A", B: "#FF6B1A", L: "#009B48", R: "#0051A8",
};

const COLOR_HEX: Record<ColorKey, string> = {
  white: "#F5F5F0", yellow: "#FFD600", red: "#C41E3A",
  blue: "#0051A8", orange: "#FF6B1A", green: "#009B48", gray: "#1e2235",
};

// ---------------------------------------------------------------------------
// Solved state
// ---------------------------------------------------------------------------

function createSolvedState(n: number): Record<FaceName, ColorKey[][]> {
  const fill = (c: ColorKey): ColorKey[][] =>
    Array.from({ length: n }, () => Array.from({ length: n }, () => c));
  return { U: fill("white"), D: fill("yellow"), F: fill("red"), B: fill("orange"), L: fill("green"), R: fill("blue") };
}

// ---------------------------------------------------------------------------
// Convert CubeFaceState (from painter) → internal ColorKey state
// Mapping: top→U, bottom→D, front→F, back→B, left→L, right→R
// CubeColor null → "gray"
// ---------------------------------------------------------------------------

function convertPaintedState(painted: CubeFaceState, n: number): Record<FaceName, ColorKey[][]> {
  const toColorKey = (c: string | null): ColorKey =>
    (c && c !== "null" ? c as ColorKey : "gray");

  const convertFace = (face: (string | null)[][]): ColorKey[][] =>
    face.map(row => row.map(toColorKey));

  // Only override faces that have at least one painted cell
  const hasPaint = (face: (string | null)[][]): boolean =>
    face.some(row => row.some(c => c !== null));

  const solved = createSolvedState(n);
  return {
    U: hasPaint(painted.top)    ? convertFace(painted.top)    : solved.U,
    D: hasPaint(painted.bottom) ? convertFace(painted.bottom) : solved.D,
    F: hasPaint(painted.front)  ? convertFace(painted.front)  : solved.F,
    B: hasPaint(painted.back)   ? convertFace(painted.back)   : solved.B,
    L: hasPaint(painted.left)   ? convertFace(painted.left)   : solved.L,
    R: hasPaint(painted.right)  ? convertFace(painted.right)  : solved.R,
  };
}

// ---------------------------------------------------------------------------
// Move sequences
// ---------------------------------------------------------------------------

const MOVES_3X3: Move[] = [
  { label: "Turn the top layer clockwise",               face: "U", dir: "CW"  },
  { label: "Turn the right side down",                   face: "R", dir: "CW"  },
  { label: "Turn the top layer counter-clockwise",       face: "U", dir: "CCW" },
  { label: "Turn the right side back up",                face: "R", dir: "CCW" },
  { label: "Turn the front face clockwise",              face: "F", dir: "CW"  },
  { label: "Turn the top layer clockwise again",         face: "U", dir: "CW"  },
  { label: "Turn the front face counter-clockwise",      face: "F", dir: "CCW" },
  { label: "Turn the right side down again",             face: "R", dir: "CW"  },
  { label: "Turn the top layer clockwise",               face: "U", dir: "CW"  },
  { label: "Turn the right side back up",                face: "R", dir: "CCW" },
  { label: "Turn the top layer counter-clockwise",       face: "U", dir: "CCW" },
  { label: "Turn the top layer counter-clockwise",       face: "U", dir: "CCW" },
];

const MOVES_2X2: Move[] = [
  { label: "Turn the top layer clockwise",               face: "U", dir: "CW"  },
  { label: "Turn the right side down",                   face: "R", dir: "CW"  },
  { label: "Turn the top layer counter-clockwise",       face: "U", dir: "CCW" },
  { label: "Turn the right side back up",                face: "R", dir: "CCW" },
  { label: "Turn the front face clockwise",              face: "F", dir: "CW"  },
  { label: "Turn the right side clockwise",              face: "R", dir: "CW"  },
  { label: "Turn the top layer clockwise",               face: "U", dir: "CW"  },
  { label: "Turn the right side counter-clockwise",      face: "R", dir: "CCW" },
];

const MOVES_4X4: Move[] = [
  { label: "Turn the top layer clockwise",               face: "U", dir: "CW"  },
  { label: "Turn the right side down",                   face: "R", dir: "CW"  },
  { label: "Turn the top layer counter-clockwise",       face: "U", dir: "CCW" },
  { label: "Turn the right side back up",                face: "R", dir: "CCW" },
  { label: "Turn the front face clockwise",              face: "F", dir: "CW"  },
  { label: "Turn the top layer clockwise",               face: "U", dir: "CW"  },
  { label: "Turn the front face counter-clockwise",      face: "F", dir: "CCW" },
  { label: "Turn the right side down",                   face: "R", dir: "CW"  },
  { label: "Turn the top layer clockwise",               face: "U", dir: "CW"  },
  { label: "Turn the right side back up",                face: "R", dir: "CCW" },
  { label: "Turn the left side clockwise",               face: "L", dir: "CW"  },
  { label: "Turn the top layer counter-clockwise",       face: "U", dir: "CCW" },
  { label: "Turn the left side counter-clockwise",       face: "L", dir: "CCW" },
  { label: "Turn the bottom layer clockwise",            face: "D", dir: "CW"  },
  { label: "Turn the back face clockwise",               face: "B", dir: "CW"  },
];

const MOVES: Record<CubeType, Move[]> = { "2x2": MOVES_2X2, "3x3": MOVES_3X3, "4x4": MOVES_4X4 };

// ---------------------------------------------------------------------------
// Cube mutation logic
// ---------------------------------------------------------------------------

function deepClone(s: Record<FaceName, ColorKey[][]>): Record<FaceName, ColorKey[][]> {
  return { U: s.U.map(r => [...r]), D: s.D.map(r => [...r]), F: s.F.map(r => [...r]), B: s.B.map(r => [...r]), L: s.L.map(r => [...r]), R: s.R.map(r => [...r]) };
}

function rotateCW(face: ColorKey[][]): ColorKey[][] {
  const n = face.length;
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => face[n - 1 - c][r]));
}

function rotateCCW(face: ColorKey[][]): ColorKey[][] {
  const n = face.length;
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => face[c][n - 1 - r]));
}

function applyMove(state: Record<FaceName, ColorKey[][]>, move: Move): Record<FaceName, ColorKey[][]> {
  const s = deepClone(state);
  const n = s.U.length;
  const cw = move.dir === "CW";

  s[move.face] = cw ? rotateCW(s[move.face]) : rotateCCW(s[move.face]);

  switch (move.face) {
    case "U": {
      const tmp = [...s.F[0]];
      if (cw) { s.F[0] = [...s.L[0]]; s.L[0] = [...s.B[0]]; s.B[0] = [...s.R[0]]; s.R[0] = tmp; }
      else    { s.F[0] = [...s.R[0]]; s.R[0] = [...s.B[0]]; s.B[0] = [...s.L[0]]; s.L[0] = tmp; }
      break;
    }
    case "D": {
      const row = n - 1, tmp = [...s.F[row]];
      if (cw) { s.F[row] = [...s.R[row]]; s.R[row] = [...s.B[row]]; s.B[row] = [...s.L[row]]; s.L[row] = tmp; }
      else    { s.F[row] = [...s.L[row]]; s.L[row] = [...s.B[row]]; s.B[row] = [...s.R[row]]; s.R[row] = tmp; }
      break;
    }
    case "R": {
      const col = n - 1;
      const uC = Array.from({length:n},(_,r)=>s.U[r][col]);
      const fC = Array.from({length:n},(_,r)=>s.F[r][col]);
      const dC = Array.from({length:n},(_,r)=>s.D[r][col]);
      const bC = Array.from({length:n},(_,r)=>s.B[r][0]);
      for (let r=0;r<n;r++) {
        if (cw) { s.U[r][col]=bC[n-1-r]; s.F[r][col]=uC[r]; s.D[r][col]=fC[r]; s.B[n-1-r][0]=dC[r]; }
        else    { s.F[r][col]=dC[r]; s.D[r][col]=bC[n-1-r]; s.B[n-1-r][0]=uC[r]; s.U[r][col]=fC[r]; }
      }
      break;
    }
    case "L": {
      const col = 0;
      const uC = Array.from({length:n},(_,r)=>s.U[r][col]);
      const fC = Array.from({length:n},(_,r)=>s.F[r][col]);
      const dC = Array.from({length:n},(_,r)=>s.D[r][col]);
      const bC = Array.from({length:n},(_,r)=>s.B[r][n-1]);
      for (let r=0;r<n;r++) {
        if (cw) { s.F[r][col]=uC[r]; s.D[r][col]=fC[r]; s.B[n-1-r][n-1]=dC[r]; s.U[r][col]=bC[n-1-r]; }
        else    { s.U[r][col]=fC[r]; s.F[r][col]=dC[r]; s.D[r][col]=bC[n-1-r]; s.B[n-1-r][n-1]=uC[r]; }
      }
      break;
    }
    case "F": {
      const uR=[...s.U[n-1]], rC=Array.from({length:n},(_,r)=>s.R[r][0]);
      const dR=[...s.D[0]],   lC=Array.from({length:n},(_,r)=>s.L[r][n-1]);
      for (let i=0;i<n;i++) {
        if (cw) { s.R[i][0]=uR[i]; s.D[0][n-1-i]=rC[i]; s.L[n-1-i][n-1]=dR[i]; s.U[n-1][i]=lC[n-1-i]; }
        else    { s.U[n-1][n-1-i]=rC[i]; s.R[i][0]=dR[n-1-i]; s.D[0][i]=lC[i]; s.L[n-1-i][n-1]=uR[n-1-i]; }
      }
      break;
    }
    case "B": {
      const uR=[...s.U[0]],   lC=Array.from({length:n},(_,r)=>s.L[r][0]);
      const dR=[...s.D[n-1]], rC=Array.from({length:n},(_,r)=>s.R[r][n-1]);
      for (let i=0;i<n;i++) {
        if (cw) { s.L[n-1-i][0]=uR[i]; s.D[n-1][i]=lC[n-1-i]; s.R[i][n-1]=dR[n-1-i]; s.U[0][n-1-i]=rC[i]; }
        else    { s.U[0][i]=lC[n-1-i]; s.L[n-1-i][0]=dR[n-1-i]; s.D[n-1][n-1-i]=rC[i]; s.R[i][n-1]=uR[n-1-i]; }
      }
      break;
    }
  }
  return s;
}

// ---------------------------------------------------------------------------
// 3D Cube SVG
// ---------------------------------------------------------------------------

interface Cube3DProps {
  state: Record<FaceName, ColorKey[][]>;
  n: number;
  currentMove: Move | null;
  svgWidth: number;
}

function Cube3D({ state, n, currentMove, svgWidth }: Cube3DProps) {
  const cs = Math.max(20, Math.min(46, Math.floor((svgWidth * 0.38) / n)));
  const rx = Math.cos(Math.PI / 6) * cs;
  const ry = Math.sin(Math.PI / 6) * cs;
  const originX = rx * n * 2;
  const originY = ry * n * 2 + 4;

  const topV  = (r: number, c: number) => ({ x: originX + c*rx - r*rx, y: originY - c*ry - r*ry });
  const rightV = (r: number, c: number) => ({ x: originX + c*rx,        y: originY + c*ry + r*cs });
  const leftV  = (r: number, c: number) => ({ x: originX - c*rx,        y: originY + c*ry + r*cs });

  const corners = [topV,rightV,leftV].flatMap(v => [v(0,0),v(0,n),v(n,0),v(n,n)]);
  const minX = Math.min(...corners.map(p=>p.x)) - 10;
  const minY = Math.min(...corners.map(p=>p.y)) - 10;
  const maxX = Math.max(...corners.map(p=>p.x)) + 10;
  const maxY = Math.max(...corners.map(p=>p.y)) + 10;

  function poly(v: (r:number,c:number)=>{x:number,y:number}, r:number, c:number) {
    const [tl,tr,br,bl] = [v(r,c),v(r,c+1),v(r+1,c+1),v(r+1,c)];
    return `${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`;
  }

  function shade(hex: string, mode: "top"|"right"|"left") {
    const [r,g,b] = [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
    const f = {top:1.15,right:1.0,left:0.72}[mode];
    const cl = (v:number) => Math.min(255,Math.max(0,Math.round(v*f)));
    return `rgb(${cl(r)},${cl(g)},${cl(b)})`;
  }

  function arc(cx:number,cy:number,rx2:number,ry2:number,a1:number,a2:number,cw:boolean) {
    const rad = (d:number) => d*Math.PI/180;
    const [x1,y1] = [cx+rx2*Math.cos(rad(a1)), cy+ry2*Math.sin(rad(a1))];
    const [x2,y2] = [cx+rx2*Math.cos(rad(a2)), cy+ry2*Math.sin(rad(a2))];
    const lg = Math.abs(a2-a1)>180?1:0, sw = cw?1:0;
    return `M ${x1} ${y1} A ${rx2} ${ry2} 0 ${lg} ${sw} ${x2} ${y2}`;
  }

  function faceCenter(v: (r:number,c:number)=>{x:number,y:number}) {
    const pts = [v(0,0),v(0,n),v(n,n),v(n,0)];
    return { x: pts.reduce((a,p)=>a+p.x,0)/4, y: pts.reduce((a,p)=>a+p.y,0)/4 };
  }

  const activeFace = currentMove?.face ?? null;
  const isCW = currentMove?.dir === "CW";

  function buildArrow() {
    if (!currentMove) return null;
    const { face } = currentMove;
    const color = FACE_COLOR_HEX[face];
    if (face === "U") {
      const fc = faceCenter(topV);
      const ax = Math.sqrt(rx*rx+ry*ry)*n*0.27;
      return { d: arc(fc.x,fc.y,ax,ax*0.5,-160,160,isCW), color, id: `ah-${face}` };
    }
    if (face === "F" || face === "R") {
      const fc = faceCenter(rightV); const ar = cs*n*0.32;
      return { d: arc(fc.x,fc.y,ar,ar,-150,150,isCW), color, id: `ah-${face}` };
    }
    if (face === "L") {
      const fc = faceCenter(leftV); const ar = cs*n*0.32;
      return { d: arc(fc.x,fc.y,ar,ar,-150,150,!isCW), color, id: `ah-${face}` };
    }
    if (face === "D") {
      const bm = leftV(n,Math.floor(n/2)); const ar = cs*0.8*n*0.4;
      return { d: arc(bm.x,bm.y+ar*0.3,ar,ar*0.4,180,0,isCW), color, id: `ah-${face}` };
    }
    if (face === "B") {
      const bm = topV(n,Math.floor(n/2)); const ar = cs*0.8*n*0.38;
      return { d: arc(bm.x,bm.y-ar*0.2,ar,ar*0.45,180,0,isCW), color, id: `ah-${face}` };
    }
    return null;
  }

  function isActive(faceKey: FaceName) {
    return activeFace === faceKey || (activeFace==="R" && faceKey==="F") || (activeFace==="D" && faceKey==="L");
  }

  function renderCells(faceKey: FaceName, data: ColorKey[][], vfn: (r:number,c:number)=>{x:number,y:number}, mode: "top"|"right"|"left") {
    const active = isActive(faceKey);
    const size = data.length;
    return Array.from({length: size * size}, (_, idx) => {
      const ri = Math.floor(idx / size);
      const ci = idx % size;
      const colorKey = data[ri]?.[ci] ?? "gray";
      const hex = COLOR_HEX[colorKey];
      return (
        <polygon
          key={`${faceKey}-r${ri}c${ci}`}
          points={poly(vfn, ri, ci)}
          fill={shade(hex, mode)}
          stroke={active ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.25)"}
          strokeWidth={active ? 1.5 : 0.8}
          style={{ filter: active ? `drop-shadow(0 0 3px ${hex}aa)` : undefined }}
        />
      );
    });
  }

  function outline(v: (r:number,c:number)=>{x:number,y:number}) {
    const [tl,tr,br,bl]=[v(0,0),v(0,n),v(n,n),v(n,0)];
    return `${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`;
  }

  const arrowData = buildArrow();

  return (
    <svg
      viewBox={`${minX} ${minY} ${maxX-minX} ${maxY-minY}`}
      width={svgWidth}
      height={Math.round(svgWidth*((maxY-minY)/(maxX-minX)))}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display:"block", overflow:"visible" }}
      aria-label={currentMove ? `3D cube — ${currentMove.face} ${currentMove.dir}` : "3D cube"}
    >
      <defs>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {(["U","D","F","B","L","R"] as FaceName[]).map(f => (
          <marker key={f} id={`ah-${f}`} markerWidth={10} markerHeight={10} refX={8} refY={4} orient="auto">
            <path d="M1,1 L1,7 L9,4 z" fill={FACE_COLOR_HEX[f]} />
          </marker>
        ))}
      </defs>

      {/* Top face */}
      <g>
        {renderCells("U", state.U, topV, "top")}
        <polygon points={outline(topV)} fill="none" stroke={activeFace==="U" ? FACE_COLOR_HEX.U : "rgba(255,255,255,0.15)"} strokeWidth={activeFace==="U"?2:1} style={{pointerEvents:"none"}} />
        {Array.from({length:n-1},(_,i)=>{
          const seam = i + 1;
          const a=topV(seam,0),b=topV(seam,n),c=topV(0,seam),d=topV(n,seam);
          return <g key={`seam-${seam}`} style={{pointerEvents:"none"}}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(0,0,0,0.3)" strokeWidth={0.5}/>
            <line x1={c.x} y1={c.y} x2={d.x} y2={d.y} stroke="rgba(0,0,0,0.3)" strokeWidth={0.5}/>
          </g>;
        })}
      </g>

      {/* Left face */}
      <g>
        {renderCells("L", state.L, leftV, "left")}
        <polygon points={outline(leftV)} fill="none" stroke={activeFace==="L" ? FACE_COLOR_HEX.L : "rgba(255,255,255,0.1)"} strokeWidth={activeFace==="L"?2:1} style={{pointerEvents:"none"}} />
      </g>

      {/* Right (front) face */}
      <g>
        {renderCells("F", state.F, rightV, "right")}
        <polygon points={outline(rightV)} fill="none" stroke={(activeFace==="F"||activeFace==="R") ? FACE_COLOR_HEX.F : "rgba(255,255,255,0.1)"} strokeWidth={(activeFace==="F"||activeFace==="R")?2:1} style={{pointerEvents:"none"}} />
      </g>

      {/* Arrow */}
      {arrowData && (
        <path d={arrowData.d} fill="none" stroke={arrowData.color} strokeWidth={3.5} strokeLinecap="round" markerEnd={`url(#${arrowData.id})`} filter="url(#glow)" opacity={0.95} style={{pointerEvents:"none"}} />
      )}

      {/* Rotation label */}
      {currentMove && (() => {
        const { face, dir } = currentMove;
        let pos: {x:number,y:number}|null = null;
        if (face==="U") { const c=faceCenter(topV); pos=c; }
        else if (face==="F"||face==="R") { const c=faceCenter(rightV); pos=c; }
        else if (face==="L"||face==="D") { const c=faceCenter(leftV); pos=c; }
        if (!pos) return null;
        return (
          <text x={pos.x} y={pos.y+cs*0.18} textAnchor="middle" fontSize={cs*0.55} fontWeight="700" fontFamily="'Space Mono',monospace" fill={FACE_COLOR_HEX[face]} filter="url(#glow)" opacity={0.9} style={{pointerEvents:"none"}}>
            {dir==="CW"?"↻":"↺"}
          </text>
        );
      })()}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  cubeType: CubeType;
  paintedFaceState: CubeFaceState;
}

export default function CubeSolveGuide({ cubeType, paintedFaceState }: Props) {
  const n = cubeType === "2x2" ? 2 : cubeType === "4x4" ? 4 : 3;
  const moves = MOVES[cubeType];

  const [stateHistory, setStateHistory] = useState<Record<FaceName, ColorKey[][]>[]>(() => [createSolvedState(n)]);
  const [moveIndex, setMoveIndex] = useState(0);
  const [prevCubeType, setPrevCubeType] = useState<CubeType>(cubeType);
  const [usingPainted, setUsingPainted] = useState(false);

  // Reset when cube type changes
  if (cubeType !== prevCubeType) {
    setPrevCubeType(cubeType);
    setStateHistory([createSolvedState(n)]);
    setMoveIndex(0);
    setUsingPainted(false);
  }

  const currentState = stateHistory[moveIndex] ?? stateHistory[stateHistory.length - 1];
  const currentMove = moveIndex < moves.length ? moves[moveIndex] : null;

  const handleNext = useCallback(() => {
    if (moveIndex >= moves.length) return;
    const next = applyMove(stateHistory[moveIndex], moves[moveIndex]);
    setStateHistory(prev => [...prev.slice(0, moveIndex + 1), next]);
    setMoveIndex(i => i + 1);
  }, [moveIndex, moves, stateHistory]);

  const handleBack = useCallback(() => {
    if (moveIndex > 0) setMoveIndex(i => i - 1);
  }, [moveIndex]);

  const handleReset = useCallback(() => {
    setStateHistory([createSolvedState(n)]);
    setMoveIndex(0);
    setUsingPainted(false);
  }, [n]);

  const handleSolveFromPainted = useCallback(() => {
    const start = convertPaintedState(paintedFaceState, n);
    setStateHistory([start]);
    setMoveIndex(0);
    setUsingPainted(true);
  }, [paintedFaceState, n]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(e => setContainerWidth(e[0].contentRect.width));
    obs.observe(containerRef.current);
    setContainerWidth(containerRef.current.offsetWidth);
    return () => obs.disconnect();
  }, []);

  const isFirst = moveIndex === 0;
  const isLast = moveIndex >= moves.length;
  const svgWidth = containerWidth > 0 ? Math.min(480, containerWidth - 32) : 360;

  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ background: "oklch(0.14 0.006 260)" }}>

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground tracking-tight">
            How to Solve — {cubeType} Cube
          </h2>
          <p className="text-xs text-muted-foreground font-mono-custom mt-0.5">
            {moveIndex > 0 ? `Move ${moveIndex} of ${moves.length}` : `${moves.length} moves total`}
            {isLast ? " · Sequence complete!" : ""}
            {usingPainted ? " · Starting from your painted state" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Solve from painted button */}
          <button
            type="button"
            onClick={handleSolveFromPainted}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-custom transition-all"
            style={{
              background: "rgba(255,200,50,0.1)",
              border: "1px solid rgba(255,200,50,0.3)",
              color: "rgba(255,200,100,0.85)",
              cursor: "pointer",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
              <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1 2.48 1.02 3.5 1.02 2.2 0 3-1.8 3-3.02 0-1.65-1.35-3.04-1.5-3.04z" />
            </svg>
            Solve from painted
          </button>

          {/* Current move pill */}
          {currentMove && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-mono-custom shrink-0"
              style={{
                borderColor: FACE_COLOR_HEX[currentMove.face] + "60",
                background: FACE_COLOR_HEX[currentMove.face] + "18",
                color: FACE_COLOR_HEX[currentMove.face],
              }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: FACE_COLOR_HEX[currentMove.face] }} />
              {currentMove.face} — {currentMove.dir === "CW" ? "Clockwise ↻" : "Counter-clockwise ↺"}
            </div>
          )}
          {isLast && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-mono-custom shrink-0"
              style={{ borderColor: FACE_COLOR_HEX.L + "60", background: FACE_COLOR_HEX.L + "18", color: FACE_COLOR_HEX.L }}
            >
              Complete
            </div>
          )}
        </div>
      </div>

      {/* 3D Cube */}
      <div ref={containerRef} className="px-4 py-6 flex justify-center items-center" style={{ minHeight: 260 }}>
        {containerWidth > 0 ? (
          <Cube3D state={currentState} n={n} currentMove={currentMove} svgWidth={svgWidth} />
        ) : (
          <div style={{ width: 360, height: 260, background: "rgba(255,255,255,0.04)", borderRadius: 8 }} />
        )}
      </div>

      {/* Controls */}
      <div className="px-5 pb-5 pt-1 flex items-center gap-3">
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
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={isLast}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-display font-bold transition-all"
          style={{
            background: isLast ? "rgba(255,255,255,0.04)" : currentMove ? `linear-gradient(135deg,${FACE_COLOR_HEX[currentMove.face]}cc,${FACE_COLOR_HEX[currentMove.face]})` : "rgba(255,255,255,0.12)",
            border: isLast ? "1px solid rgba(255,255,255,0.08)" : "none",
            color: isLast ? "rgba(255,255,255,0.2)" : "#000",
            cursor: isLast ? "not-allowed" : "pointer",
            boxShadow: !isLast && currentMove ? `0 4px 20px ${FACE_COLOR_HEX[currentMove.face]}50` : undefined,
          }}
        >
          {isLast ? "Sequence Complete" : "Next Move"}
          {!isLast && (
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-mono-custom transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
        >
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reset
        </button>
      </div>

      {/* Face legend */}
      <div className="px-5 pb-5">
        <div className="rounded-lg px-4 py-3 flex flex-wrap gap-x-5 gap-y-1.5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="w-full text-[9px] font-mono-custom uppercase tracking-widest text-muted-foreground mb-0.5">Face Legend</p>
          {(["U","L","F","R","B","D"] as FaceName[]).map(face => {
            const names: Record<FaceName,string> = { U:"Up (White)", D:"Down (Yellow)", F:"Front (Red)", B:"Back (Orange)", L:"Left (Green)", R:"Right (Blue)" };
            return (
              <div key={face} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm border border-white/10 shrink-0" style={{ background: FACE_COLOR_HEX[face] }} />
                <span className="text-[10px] font-mono-custom text-muted-foreground">
                  <span className="text-foreground">{face}</span> = {names[face]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
