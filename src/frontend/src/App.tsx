import { useState } from "react";
import CubeGuideHeader from "./components/CubeGuideHeader";
import CubeTypeNav from "./components/CubeTypeNav";
import CubeColorInput from "./components/CubeColorInput";
import CubeSolveGuide from "./components/CubeSolveGuide";
import AppFooter from "./components/AppFooter";

export type CubeType = "2x2" | "3x3" | "4x4";
export type CubeColor = "white" | "red" | "blue" | "orange" | "yellow" | "green" | null;
export type FaceName = "top" | "left" | "front" | "right" | "back" | "bottom";
export type CubeFaceState = Record<FaceName, CubeColor[][]>;

function getSize(cubeType: CubeType) {
  return cubeType === "2x2" ? 2 : cubeType === "4x4" ? 4 : 3;
}

export function createEmptyFaceState(cubeType: CubeType): CubeFaceState {
  const size = getSize(cubeType);
  const emptyFace = () => Array.from({ length: size }, () => Array.from({ length: size }, () => null as CubeColor));
  return { top: emptyFace(), left: emptyFace(), front: emptyFace(), right: emptyFace(), back: emptyFace(), bottom: emptyFace() };
}

export default function App() {
  const [activeCube, setActiveCube] = useState<CubeType>("3x3");
  const [faceState, setFaceState] = useState<CubeFaceState>(() => createEmptyFaceState("3x3"));

  function handleCubeTypeChange(t: CubeType) {
    setActiveCube(t);
    setFaceState(createEmptyFaceState(t));
  }

  return (
    <div className="min-h-screen bg-background bg-noise flex flex-col">
      <CubeGuideHeader />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <CubeTypeNav active={activeCube} onChange={handleCubeTypeChange} />
        <CubeColorInput cubeType={activeCube} faceState={faceState} onFaceStateChange={setFaceState} />
        <CubeSolveGuide cubeType={activeCube} paintedFaceState={faceState} />
      </main>
      <AppFooter />
    </div>
  );
}
