# CubeGuide

## Current State
- The app has two main sections: `CubeColorInput` (flat net painting grid with a color palette) and `CubeSolveGuide` (3D cube with step-by-step navigation).
- `CubeColorInput` already supports drag-to-paint on a 2D unfolded cube net with 6 colors + eraser.
- `CubeSolveGuide` shows a 3D oblique cube with rotation arrows and Next/Back/Reset controls.
- The two sections are separate and don't share state.

## Requested Changes (Diff)

### Add
- A **Color Painting Mode** toggle button prominently placed in the `CubeSolveGuide` section header (or as a floating pill above the 3D cube), letting users switch between "Guide Mode" (current step-by-step) and "Paint Mode".
- In **Paint Mode**, show the color palette (6 colors + eraser) directly above the 3D cube in the solve guide section.
- In **Paint Mode**, clicking/tapping any visible cell on the 3D cube SVG (top face, left face, right face) paints it with the selected color. Each polygon cell in Cube3D becomes clickable.
- A "Done Painting" button that exits Paint Mode and returns to Guide Mode.
- When switching back to Guide Mode, the cube state set by painting is used as the starting state (so the guide starts from the user's scrambled cube).
- A "Reset to Solved" button visible only in Guide Mode to go back to the default solved state.

### Modify
- `Cube3D` component: accept an optional `onCellClick` callback prop `(face: FaceName, row: number, col: number) => void`. When provided, each cell polygon becomes clickable (cursor pointer, hover highlight).
- `CubeSolveGuide`: manage a `isPaintMode` boolean state and a `paintedState` (the user's custom starting cube state). Pass `onCellClick` to `Cube3D` when in paint mode.
- The color palette UI in paint mode should be compact and match the existing dark card style.

### Remove
- Nothing removed. The existing `CubeColorInput` flat-net section remains as-is.

## Implementation Plan
1. Add `selectedColor` state and `isPaintMode` state to `CubeSolveGuide`.
2. Add `onCellClick` optional prop to `Cube3D`; when set, each polygon gets `onClick`, `cursor: pointer`, and a subtle hover outline.
3. In paint mode, render a compact color palette row (6 color buttons + eraser) above the cube in `CubeSolveGuide`.
4. Add a "Paint Mode" toggle button in the solve guide header. When entering paint mode, freeze step navigation. When exiting, set `stateHistory[0]` to the painted state and reset `moveIndex` to 0.
5. In Guide Mode, show a "Reset to Solved" button that clears back to `createSolvedState(n)`.
