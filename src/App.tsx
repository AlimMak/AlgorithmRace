import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { algorithmOptions, algorithms, type AlgoState, type AlgorithmKey } from './algorithms'
import { Controls } from './components/Controls'
import { Explanation } from './components/Explanation'
import { Metrics } from './components/Metrics'
import { RacePanel } from './components/RacePanel'
import { dataPatternOptions, generateDataset, type DataPattern } from './utils/dataPatterns'
import { normalizeSeed, randomSeed } from './utils/rng'

const DEFAULT_SIZE = 60
const DEFAULT_PATTERN: DataPattern = 'random'
const DEFAULT_SPEED = 24
const DEFAULT_LEFT: AlgorithmKey = 'quick'
const DEFAULT_RIGHT: AlgorithmKey = 'merge'
const MAX_TICKS_PER_FRAME = 24

interface RunnerState {
  algorithm: AlgorithmKey
  state: AlgoState
  finishedAtTick: number | null
}

interface RaceState {
  seed: number
  initialData: number[]
  left: RunnerState
  right: RunnerState
}

const createRunner = (algorithm: AlgorithmKey, data: number[]): RunnerState => ({
  algorithm,
  state: algorithms[algorithm].init(data),
  finishedAtTick: null,
})

const createRace = (data: number[], seed: number, left: AlgorithmKey, right: AlgorithmKey): RaceState => ({
  seed,
  initialData: [...data],
  left: createRunner(left, data),
  right: createRunner(right, data),
})

const resetRace = (race: RaceState, left: AlgorithmKey, right: AlgorithmKey): RaceState => ({
  ...race,
  left: createRunner(left, race.initialData),
  right: createRunner(right, race.initialData),
})

const isSorted = (data: number[]): boolean => data.every((value, index) => index === 0 || data[index - 1] <= value)

const stepRunner = (runner: RunnerState): RunnerState => {
  if (runner.state.done) {
    return runner
  }

  const next = algorithms[runner.algorithm].step(runner.state)
  const finishedAtTick = next.done && runner.finishedAtTick === null ? next.state.metrics.elapsedTicks : runner.finishedAtTick

  return {
    ...runner,
    state: next.state,
    finishedAtTick,
  }
}

const runSteps = (race: RaceState, leftSteps: number, rightSteps: number): RaceState => {
  if (leftSteps <= 0 && rightSteps <= 0) {
    return race
  }

  let left = race.left
  let right = race.right
  const loops = Math.max(leftSteps, rightSteps)

  for (let i = 0; i < loops; i += 1) {
    if (i < leftSteps) {
      left = stepRunner(left)
    }
    if (i < rightSteps) {
      right = stepRunner(right)
    }

    if (left.state.done && right.state.done) {
      break
    }
  }

  if (left === race.left && right === race.right) {
    return race
  }

  return {
    ...race,
    left,
    right,
  }
}

function App() {
  const initialSeed = useMemo(() => randomSeed(), [])
  const [size, setSize] = useState(DEFAULT_SIZE)
  const [pattern, setPattern] = useState<DataPattern>(DEFAULT_PATTERN)
  const [speed, setSpeed] = useState(DEFAULT_SPEED)
  const [lockstep, setLockstep] = useState(true)
  const [leftAlgorithm, setLeftAlgorithm] = useState<AlgorithmKey>(DEFAULT_LEFT)
  const [rightAlgorithm, setRightAlgorithm] = useState<AlgorithmKey>(DEFAULT_RIGHT)
  const [seedInput, setSeedInput] = useState(String(initialSeed))
  const [running, setRunning] = useState(false)
  const [race, setRace] = useState<RaceState>(() => {
    const data = generateDataset({ size: DEFAULT_SIZE, pattern: DEFAULT_PATTERN, seed: initialSeed })
    return createRace(data, initialSeed, DEFAULT_LEFT, DEFAULT_RIGHT)
  })

  const frameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)
  const lockstepAccumulatorRef = useRef(0)
  const leftAccumulatorRef = useRef(0)
  const rightAccumulatorRef = useRef(0)

  const allDone = race.left.state.done && race.right.state.done
  const isAnimating = running && !allDone

  const leftDefinition = algorithms[race.left.algorithm]
  const rightDefinition = algorithms[race.right.algorithm]

  const winnerLabel = useMemo(() => {
    const leftDone = race.left.state.done
    const rightDone = race.right.state.done

    if (!leftDone && !rightDone) {
      return 'Pending'
    }

    if (leftDone && !rightDone) {
      return `${leftDefinition.label} (left)`
    }

    if (rightDone && !leftDone) {
      return `${rightDefinition.label} (right)`
    }

    const leftFinish = race.left.finishedAtTick ?? Number.POSITIVE_INFINITY
    const rightFinish = race.right.finishedAtTick ?? Number.POSITIVE_INFINITY

    if (leftFinish < rightFinish) {
      return `${leftDefinition.label} (left)`
    }

    if (rightFinish < leftFinish) {
      return `${rightDefinition.label} (right)`
    }

    if (race.left.state.metrics.steps < race.right.state.metrics.steps) {
      return `${leftDefinition.label} (left)`
    }

    if (race.right.state.metrics.steps < race.left.state.metrics.steps) {
      return `${rightDefinition.label} (right)`
    }

    return 'Tie'
  }, [
    leftDefinition.label,
    race.left.finishedAtTick,
    race.left.state.done,
    race.left.state.metrics.steps,
    race.right.finishedAtTick,
    race.right.state.done,
    race.right.state.metrics.steps,
    rightDefinition.label,
  ])

  const generateFromSeed = useCallback(
    (seedValue: number) => {
      const nextData = generateDataset({
        size,
        pattern,
        seed: seedValue,
      })
      setRace(createRace(nextData, seedValue, leftAlgorithm, rightAlgorithm))
    },
    [leftAlgorithm, pattern, rightAlgorithm, size],
  )

  const handleGenerate = useCallback(() => {
    const resolvedSeed = seedInput.trim() ? normalizeSeed(seedInput) : randomSeed()
    setRunning(false)
    setSeedInput(String(resolvedSeed))
    generateFromSeed(resolvedSeed)
  }, [generateFromSeed, seedInput])

  const handleAutoSeed = useCallback(() => {
    const seedValue = randomSeed()
    setRunning(false)
    setSeedInput(String(seedValue))
    generateFromSeed(seedValue)
  }, [generateFromSeed])

  const handleReset = useCallback(() => {
    setRunning(false)
    setRace((current) => resetRace(current, leftAlgorithm, rightAlgorithm))
  }, [leftAlgorithm, rightAlgorithm])

  const handleStep = useCallback(() => {
    setRace((current) => runSteps(current, 1, 1))
  }, [])

  const handleLeftAlgorithm = useCallback((value: AlgorithmKey) => {
    setRunning(false)
    setLeftAlgorithm(value)
    setRace((current) => ({
      ...current,
      left: createRunner(value, current.initialData),
    }))
  }, [])

  const handleRightAlgorithm = useCallback((value: AlgorithmKey) => {
    setRunning(false)
    setRightAlgorithm(value)
    setRace((current) => ({
      ...current,
      right: createRunner(value, current.initialData),
    }))
  }, [])

  useEffect(() => {
    if (!isAnimating) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      lastTimestampRef.current = null
      lockstepAccumulatorRef.current = 0
      leftAccumulatorRef.current = 0
      rightAccumulatorRef.current = 0
      return
    }

    const interval = 1000 / Math.max(speed, 1)

    const frame = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp
        frameRef.current = requestAnimationFrame(frame)
        return
      }

      const delta = timestamp - lastTimestampRef.current
      lastTimestampRef.current = timestamp

      if (lockstep) {
        lockstepAccumulatorRef.current += delta
        const dueTicks = Math.floor(lockstepAccumulatorRef.current / interval)

        if (dueTicks > 0) {
          const tickCount = Math.min(dueTicks, MAX_TICKS_PER_FRAME)
          lockstepAccumulatorRef.current =
            dueTicks > MAX_TICKS_PER_FRAME ? 0 : lockstepAccumulatorRef.current - dueTicks * interval
          setRace((current) => runSteps(current, tickCount, tickCount))
        }
      } else {
        leftAccumulatorRef.current += delta
        rightAccumulatorRef.current += delta

        const leftDueTicks = Math.floor(leftAccumulatorRef.current / interval)
        const rightDueTicks = Math.floor(rightAccumulatorRef.current / interval)

        if (leftDueTicks > 0 || rightDueTicks > 0) {
          const leftTicks = Math.min(leftDueTicks, MAX_TICKS_PER_FRAME)
          const rightTicks = Math.min(rightDueTicks, MAX_TICKS_PER_FRAME)

          leftAccumulatorRef.current =
            leftDueTicks > MAX_TICKS_PER_FRAME ? 0 : leftAccumulatorRef.current - leftDueTicks * interval
          rightAccumulatorRef.current =
            rightDueTicks > MAX_TICKS_PER_FRAME ? 0 : rightAccumulatorRef.current - rightDueTicks * interval

          setRace((current) => runSteps(current, leftTicks, rightTicks))
        }
      }

      frameRef.current = requestAnimationFrame(frame)
    }

    frameRef.current = requestAnimationFrame(frame)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
      frameRef.current = null
      lastTimestampRef.current = null
    }
  }, [isAnimating, lockstep, speed])

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <Controls
          size={size}
          speed={speed}
          pattern={pattern}
          lockstep={lockstep}
          running={isAnimating}
          seedInput={seedInput}
          leftAlgorithm={leftAlgorithm}
          rightAlgorithm={rightAlgorithm}
          algorithmOptions={algorithmOptions}
          patternOptions={dataPatternOptions}
          onSizeChange={setSize}
          onSpeedChange={setSpeed}
          onPatternChange={setPattern}
          onLockstepChange={setLockstep}
          onSeedChange={setSeedInput}
          onLeftAlgorithmChange={handleLeftAlgorithm}
          onRightAlgorithmChange={handleRightAlgorithm}
          onGenerate={handleGenerate}
          onStartPause={() => setRunning((current) => !current)}
          onStep={handleStep}
          onReset={handleReset}
          onAutoSeed={handleAutoSeed}
          disableStart={allDone}
        />

        <main className="grid gap-5 xl:grid-cols-2">
          <RacePanel lane="Left Lane" definition={leftDefinition} state={race.left.state} />
          <RacePanel lane="Right Lane" definition={rightDefinition} state={race.right.state} />
        </main>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <Metrics
            left={{
              label: leftDefinition.label,
              metrics: race.left.state.metrics,
              isDone: race.left.state.done,
              isSorted: isSorted(race.left.state.array),
            }}
            right={{
              label: rightDefinition.label,
              metrics: race.right.state.metrics,
              isDone: race.right.state.done,
              isSorted: isSorted(race.right.state.array),
            }}
            winnerLabel={winnerLabel}
          />
          <Explanation leftDefinition={leftDefinition} rightDefinition={rightDefinition} lockstep={lockstep} />
        </section>

        <footer className="text-xs text-slate-500">
          Seed: {race.seed} | Dataset size: {race.initialData.length}
        </footer>
      </div>
    </div>
  )
}

export default App
