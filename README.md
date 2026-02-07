# Algorithm Race Visualizer

https://algorithm-race-tan.vercel.app/

Production-ready React + TypeScript + Vite app for racing two sorting algorithms side-by-side on identical seeded datasets.

## Stack

- React 19 + TypeScript
- Vite 5
- Tailwind CSS 3
- Custom div-based bar visualizer (no external chart libs)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build production bundle:

```bash
npm run build
```

4. Preview production build:

```bash
npm run preview
```

## Features

- Two synchronized race lanes with selectable algorithms:
  - Bubble Sort
  - Insertion Sort
  - Selection Sort
  - Merge Sort
  - Quick Sort
- Deterministic seeded dataset generation
- Data patterns:
  - Random
  - Nearly sorted
  - Reversed
  - Few unique values
- Controls:
  - Dataset size
  - Pattern
  - Algorithm per lane
  - Speed (steps/second)
  - Generate / Start-Pause / Step / Reset
  - Lockstep mode toggle
- Live metrics per lane:
  - comparisons
  - swaps
  - overwrites
  - steps
  - ticks
  - isDone
  - isSorted
- Winner resolution:
  - First finisher wins
  - If tie on finish moment, fewer steps wins

## Stepper Architecture

Each algorithm is implemented as a deterministic state machine using a shared contract:

- `init(data: number[]): AlgoState`
- `step(state: AlgoState): { state: AlgoState; done: boolean; events: StepEvent[] }`

`StepEvent` values:

- `compare(i, j)`
- `swap(i, j)`
- `overwrite(i, value)`
- `pivot(i)`
- `markSorted(i)`

Each `step()` call performs only a small unit of work and updates metrics/events used by the UI.

## Notes / Limitations

- Quicksort uses iterative Lomuto partitioning and emits one operation-level step at a time; partition setup appears as a pivot event step.
- Merge sort is implemented as bottom-up iterative merge sort; merge-window highlighting applies while a merge frame is active.
- Independent mode currently uses the same global speed value for both lanes (no per-lane speed control).
