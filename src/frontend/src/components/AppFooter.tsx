import { Heart } from "lucide-react";

export default function AppFooter() {
  return (
    <footer className="border-t border-border mt-12 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: cube color bar */}
        <div className="flex gap-1">
          {(["white", "red", "blue", "orange", "yellow", "green"] as const).map((color) => (
            <div
              key={color}
              className="w-4 h-1 rounded-full opacity-70"
              style={{ backgroundColor: `var(--cube-${color})` }}
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground font-mono-custom flex items-center gap-1.5">
          © 2026. Built with{" "}
          <Heart className="w-3 h-3 text-destructive fill-destructive inline" />{" "}
          using{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/70 hover:text-foreground underline underline-offset-2 transition-colors"
          >
            caffeine.ai
          </a>
        </p>

        {/* Right: notation badge */}
        <p className="text-xs text-muted-foreground font-mono-custom opacity-50">
          WCA Notation Standard
        </p>
      </div>
    </footer>
  );
}
