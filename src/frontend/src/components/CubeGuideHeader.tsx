export default function CubeGuideHeader() {
  return (
    <header className="w-full border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
        {/* Cube Icon — 2×2 mini cube */}
        <div className="relative shrink-0">
          <div className="grid grid-cols-2 gap-0.5 w-9 h-9 rounded-sm overflow-hidden">
            <div style={{ backgroundColor: "var(--cube-white)" }} className="rounded-[1px]" />
            <div style={{ backgroundColor: "var(--cube-red)" }} className="rounded-[1px]" />
            <div style={{ backgroundColor: "var(--cube-blue)" }} className="rounded-[1px]" />
            <div style={{ backgroundColor: "var(--cube-yellow)" }} className="rounded-[1px]" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground leading-none tracking-tight">
            CubeGuide
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono-custom mt-0.5 tracking-wide">
            Learn to solve any Rubik&apos;s Cube
          </p>
        </div>

        {/* Decorative colored dots */}
        <div className="ml-auto flex items-center gap-2 opacity-60">
          {(["white", "red", "blue", "orange", "yellow", "green"] as const).map((name) => (
            <div
              key={name}
              className="w-2.5 h-2.5 rounded-full hidden sm:block"
              style={{ backgroundColor: `var(--cube-${name})` }}
            />
          ))}
        </div>
      </div>
    </header>
  );
}
