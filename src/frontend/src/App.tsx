import { useState } from "react";
import CubeGuideHeader from "./components/CubeGuideHeader";
import CubeTypeNav from "./components/CubeTypeNav";
import CubeColorInput from "./components/CubeColorInput";
import CubeSolveGuide from "./components/CubeSolveGuide";
import AppFooter from "./components/AppFooter";

export type CubeType = "2x2" | "3x3" | "4x4";

export default function App() {
  const [activeCube, setActiveCube] = useState<CubeType>("3x3");

  return (
    <div className="min-h-screen bg-background bg-noise flex flex-col">
      <CubeGuideHeader />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <CubeTypeNav active={activeCube} onChange={setActiveCube} />
        <CubeColorInput cubeType={activeCube} />
        <CubeSolveGuide cubeType={activeCube} />
      </main>

      <AppFooter />
    </div>
  );
}
