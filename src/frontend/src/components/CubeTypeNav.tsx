import type { CubeType } from "../App";

const CUBE_TYPES: { id: CubeType; label: string; desc: string }[] = [
  { id: "2x2", label: "2×2", desc: "Pocket Cube" },
  { id: "3x3", label: "3×3", desc: "Classic Cube" },
  { id: "4x4", label: "4×4", desc: "Revenge Cube" },
];

interface Props {
  active: CubeType;
  onChange: (type: CubeType) => void;
}

export default function CubeTypeNav({ active, onChange }: Props) {
  return (
    <div>
      <p className="text-xs font-mono-custom text-muted-foreground uppercase tracking-widest mb-3">
        Select Cube Type
      </p>
      <div className="flex gap-3 flex-wrap">
        {CUBE_TYPES.map((cube) => (
          <button
            key={cube.id}
            type="button"
            onClick={() => onChange(cube.id)}
            className={`
              relative group flex flex-col items-start px-5 py-3 rounded-lg border transition-all duration-200
              ${active === cube.id
                ? "border-foreground bg-card shadow-lg"
                : "border-border bg-card/40 hover:border-muted-foreground hover:bg-card"
              }
            `}
          >
            <span className={`text-2xl font-display font-bold leading-none transition-colors ${
              active === cube.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
            }`}>
              {cube.label}
            </span>
            <span className="text-xs font-mono-custom text-muted-foreground mt-0.5">
              {cube.desc}
            </span>
            {active === cube.id && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-foreground rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
