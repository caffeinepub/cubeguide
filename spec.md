# CubeGuide

## Current State
The app has:
- A CubeColorInput panel where users paint their cube's current state face-by-face
- A SolvingGuide that renders multiple step cards in a grid, each with a CubeNetAnimator showing algorithm moves
- The SolvingGuide shows steps side-by-side with algorithms, play/pause/step controls, and notation references

## Requested Changes (Diff)

### Add
- A single interactive cube flat-net display (one unified grid, all 6 faces in cross layout)
- Visual arrows drawn on/around the cube net cells showing which pieces to move and where
- A "next move" button that advances through the solving sequence
- Move arrows update per turn, drawn as SVG overlays on the flat-net
- Each move arrow shows: source cell(s) → destination cell(s) with a colored arrow
- A simple instruction label (e.g. "Turn the Right face clockwise") per move — no algorithm notation
- Arrows change per cube type (2x2, 3x3, 4x4)
- A reset/start-over button

### Modify
- App.tsx: Replace the two-column layout (CubeColorInput + SolvingGuide) with a single centered layout
- The cube type selector stays at the top
- The color input panel stays for painting the starting state
- The solving guide is replaced by the new single-grid arrow-guided view below the color input

### Remove
- SolvingGuide component (multi-step cards grid)
- CubeNetAnimator component (algorithm-driven animation)
- All algorithm text, notation reference table, step cards, play/pause controls
- Side-by-side / multi-column step grid

## Implementation Plan
1. Create a new `CubeSolveGuide` component:
   - Renders one large cube flat-net (U on top, L/F/R/B in middle row, D on bottom)
   - Predefines a sequence of moves per cube type as human-readable instructions + which face/cells are involved
   - Renders SVG arrow overlays on top of the net to show which cells move where
   - "Next" / "Back" / "Reset" buttons to walk through moves
   - Highlights the cells being moved with a glowing border
   - Arrow colors match the face being turned
   - Shows a plain-English label: e.g. "Rotate the top layer clockwise"
2. Update App.tsx to remove SolvingGuide import and render CubeSolveGuide instead
3. Remove SolvingGuide.tsx and CubeNetAnimator.tsx from components
