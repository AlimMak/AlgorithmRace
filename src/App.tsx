import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { algorithmOptions, algorithms, type AlgoState, type AlgorithmKey, type StepEvent } from './algorithms'
import { Controls } from './components/Controls'
import { Explanation } from './components/Explanation'
import { Metrics } from './components/Metrics'
import { RacePanel } from './components/RacePanel'
import { Timeline } from './components/Timeline'
import { dataPatternOptions, generateDataset, type DataPattern } from './utils/dataPatterns'
import { normalizeSeed, randomSeed } from './utils/rng'

const DEFAULT_SIZE = 60
const DEFAULT_PATTERN: DataPattern = 'random'
const DEFAULT_SPEED = 24
const DEFAULT_LEFT: AlgorithmKey = 'quick'
const DEFAULT_RIGHT: AlgorithmKey = 'merge'
const MAX_TICKS_PER_FRAME = 24
const HISTORY_CAP = 1800
const SNAPSHOT_INTERVAL = 20

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

interface TimelineEntry {
  leftStepped: boolean
  rightStepped: boolean
  leftEvents: StepEvent[]
  rightEvents: StepEvent[]
}

interface TimelineCheckpoint {
  step: number
  race: RaceState
}

interface TimelineState {
  baseStep: number
  latestStep: number
  cursorStep: number
  baseRace: RaceState
  entries: TimelineEntry[]
  checkpoints: TimelineCheckpoint[]
}

interface SessionState {
  race: RaceState
  timeline: TimelineState
}

interface RunnerStepOutcome {
  runner: RunnerState
  didStep: boolean
  events: StepEvent[]
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

const cloneRace = (race: RaceState): RaceState => structuredClone(race)

const createTimeline = (race: RaceState): TimelineState => ({
  baseStep: 0,
  latestStep: 0,
  cursorStep: 0,
  baseRace: cloneRace(race),
  entries: [],
  checkpoints: [{ step: 0, race: cloneRace(race) }],
})

const createSession = (race: RaceState): SessionState => ({
  race,
  timeline: createTimeline(race),
})

const isSorted = (data: number[]): boolean => data.every((value, index) => index === 0 || data[index - 1] <= value)

const stepRunner = (runner: RunnerState): RunnerStepOutcome => {
  if (runner.state.done) {
    return {
      runner,
      didStep: false,
      events: [],
    }
  }

  const next = algorithms[runner.algorithm].step(runner.state)
  const finishedAtTick = next.done && runner.finishedAtTick === null ? next.state.metrics.elapsedTicks : runner.finishedAtTick

  return {
    runner: {
      ...runner,
      state: next.state,
      finishedAtTick,
    },
    didStep: true,
    events: next.events,
  }
}

const executeTick = (
  race: RaceState,
  leftRequested: boolean,
  rightRequested: boolean,
): { race: RaceState; entry: TimelineEntry | null } => {
  const leftOutcome = leftRequested
    ? stepRunner(race.left)
    : {
        runner: race.left,
        didStep: false,
        events: [],
      }

  const rightOutcome = rightRequested
    ? stepRunner(race.right)
    : {
        runner: race.right,
        didStep: false,
        events: [],
      }

  if (!leftOutcome.didStep && !rightOutcome.didStep) {
    return {
      race,
      entry: null,
    }
  }

  const nextRace: RaceState = {
    ...race,
    left: leftOutcome.runner,
    right: rightOutcome.runner,
  }

  return {
    race: nextRace,
    entry: {
      leftStepped: leftOutcome.didStep,
      rightStepped: rightOutcome.didStep,
      leftEvents: leftOutcome.events,
      rightEvents: rightOutcome.events,
    },
  }
}

const runSteps = (
  race: RaceState,
  leftSteps: number,
  rightSteps: number,
): { race: RaceState; entries: TimelineEntry[] } => {
  if (leftSteps <= 0 && rightSteps <= 0) {
    return {
      race,
      entries: [],
    }
  }

  let currentRace = race
  const entries: TimelineEntry[] = []
  const loops = Math.max(leftSteps, rightSteps)

  for (let i = 0; i < loops; i += 1) {
    const { race: nextRace, entry } = executeTick(currentRace, i < leftSteps, i < rightSteps)
    currentRace = nextRace

    if (entry) {
      entries.push(entry)
    }

    if (currentRace.left.state.done && currentRace.right.state.done) {
      break
    }
  }

  return {
    race: currentRace,
    entries,
  }
}

const getTimelineEntry = (timeline: TimelineState, step: number): TimelineEntry | null => {
  if (step <= timeline.baseStep || step > timeline.latestStep) {
    return null
  }

  return timeline.entries[step - timeline.baseStep - 1] ?? null
}

const replayEntry = (race: RaceState, entry: TimelineEntry): RaceState =>
  executeTick(race, entry.leftStepped, entry.rightStepped).race

const getRaceAtStep = (timeline: TimelineState, targetStep: number): RaceState => {
  const clampedStep = Math.max(timeline.baseStep, Math.min(targetStep, timeline.latestStep))

  if (clampedStep === timeline.baseStep) {
    return cloneRace(timeline.baseRace)
  }

  let checkpoint: TimelineCheckpoint | null = null
  for (let i = timeline.checkpoints.length - 1; i >= 0; i -= 1) {
    const candidate = timeline.checkpoints[i]
    if (candidate.step <= clampedStep && candidate.step >= timeline.baseStep) {
      checkpoint = candidate
      break
    }
  }

  let currentStep = checkpoint ? checkpoint.step : timeline.baseStep
  let race = checkpoint ? cloneRace(checkpoint.race) : cloneRace(timeline.baseRace)

  while (currentStep < clampedStep) {
    const entry = getTimelineEntry(timeline, currentStep + 1)
    if (!entry) {
      break
    }
    race = replayEntry(race, entry)
    currentStep += 1
  }

  return race
}

const trimTimeline = (timeline: TimelineState): TimelineState => {
  const nextBaseStep = Math.max(0, timeline.latestStep - HISTORY_CAP)

  if (nextBaseStep <= timeline.baseStep) {
    return timeline
  }

  const nextBaseRace = getRaceAtStep(timeline, nextBaseStep)
  const dropCount = nextBaseStep - timeline.baseStep
  const nextEntries = timeline.entries.slice(dropCount)
  const nextCheckpoints = timeline.checkpoints.filter((checkpoint) => checkpoint.step >= nextBaseStep)

  if (!nextCheckpoints.some((checkpoint) => checkpoint.step === nextBaseStep)) {
    nextCheckpoints.unshift({
      step: nextBaseStep,
      race: cloneRace(nextBaseRace),
    })
  }

  const clampedCursor = Math.min(timeline.latestStep, Math.max(nextBaseStep, timeline.cursorStep))

  return {
    ...timeline,
    baseStep: nextBaseStep,
    baseRace: nextBaseRace,
    entries: nextEntries,
    checkpoints: nextCheckpoints,
    cursorStep: clampedCursor,
  }
}

const truncateTimelineFuture = (timeline: TimelineState): TimelineState => {
  if (timeline.cursorStep === timeline.latestStep) {
    return timeline
  }

  const keepCount = Math.max(0, timeline.cursorStep - timeline.baseStep)

  return {
    ...timeline,
    latestStep: timeline.cursorStep,
    entries: timeline.entries.slice(0, keepCount),
    checkpoints: timeline.checkpoints.filter((checkpoint) => checkpoint.step <= timeline.cursorStep),
  }
}

const appendTimelineEntries = (timeline: TimelineState, startRace: RaceState, entries: TimelineEntry[]): TimelineState => {
  if (entries.length === 0) {
    return timeline
  }

  const nextEntries = [...timeline.entries]
  const nextCheckpoints = [...timeline.checkpoints]
  let latestStep = timeline.latestStep
  let replayRace = startRace

  for (const entry of entries) {
    latestStep += 1
    nextEntries.push(entry)
    replayRace = replayEntry(replayRace, entry)

    if (latestStep % SNAPSHOT_INTERVAL === 0) {
      nextCheckpoints.push({
        step: latestStep,
        race: cloneRace(replayRace),
      })
    }
  }

  return trimTimeline({
    ...timeline,
    latestStep,
    cursorStep: latestStep,
    entries: nextEntries,
    checkpoints: nextCheckpoints,
  })
}

const advanceSession = (session: SessionState, leftSteps: number, rightSteps: number): SessionState => {
  const batch = runSteps(session.race, leftSteps, rightSteps)

  if (batch.entries.length === 0) {
    return session
  }

  const timelineForAppend =
    session.timeline.cursorStep < session.timeline.latestStep ? truncateTimelineFuture(session.timeline) : session.timeline

  return {
    race: batch.race,
    timeline: appendTimelineEntries(timelineForAppend, session.race, batch.entries),
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
  const [session, setSession] = useState<SessionState>(() => {
    const data = generateDataset({ size: DEFAULT_SIZE, pattern: DEFAULT_PATTERN, seed: initialSeed })
    return createSession(createRace(data, initialSeed, DEFAULT_LEFT, DEFAULT_RIGHT))
  })

  const frameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)
  const lockstepAccumulatorRef = useRef(0)
  const leftAccumulatorRef = useRef(0)
  const rightAccumulatorRef = useRef(0)

  const race = session.race
  const timeline = session.timeline
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
      setSession(createSession(createRace(nextData, seedValue, leftAlgorithm, rightAlgorithm)))
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
    setSession((current) => createSession(resetRace(current.race, leftAlgorithm, rightAlgorithm)))
  }, [leftAlgorithm, rightAlgorithm])

  const handleAdvance = useCallback((leftSteps: number, rightSteps: number) => {
    setSession((current) => advanceSession(current, leftSteps, rightSteps))
  }, [])

  const handleStep = useCallback(() => {
    handleAdvance(1, 1)
  }, [handleAdvance])

  const handleLeftAlgorithm = useCallback((value: AlgorithmKey) => {
    setRunning(false)
    setLeftAlgorithm(value)
    setSession((current) =>
      createSession({
        ...current.race,
        left: createRunner(value, current.race.initialData),
      }),
    )
  }, [])

  const handleRightAlgorithm = useCallback((value: AlgorithmKey) => {
    setRunning(false)
    setRightAlgorithm(value)
    setSession((current) =>
      createSession({
        ...current.race,
        right: createRunner(value, current.race.initialData),
      }),
    )
  }, [])

  const handleScrub = useCallback((targetStep: number) => {
    setRunning(false)
    setSession((current) => {
      const clampedStep = Math.max(current.timeline.baseStep, Math.min(targetStep, current.timeline.latestStep))

      if (clampedStep === current.timeline.cursorStep) {
        return current
      }

      return {
        race: getRaceAtStep(current.timeline, clampedStep),
        timeline: {
          ...current.timeline,
          cursorStep: clampedStep,
        },
      }
    })
  }, [])

  const handleTimelineBack = useCallback(() => {
    setRunning(false)
    setSession((current) => {
      const nextStep = Math.max(current.timeline.baseStep, current.timeline.cursorStep - 1)
      if (nextStep === current.timeline.cursorStep) {
        return current
      }

      return {
        race: getRaceAtStep(current.timeline, nextStep),
        timeline: {
          ...current.timeline,
          cursorStep: nextStep,
        },
      }
    })
  }, [])

  const handleTimelineForward = useCallback(() => {
    setRunning(false)
    setSession((current) => {
      const nextStep = Math.min(current.timeline.latestStep, current.timeline.cursorStep + 1)
      if (nextStep === current.timeline.cursorStep) {
        return current
      }

      return {
        race: getRaceAtStep(current.timeline, nextStep),
        timeline: {
          ...current.timeline,
          cursorStep: nextStep,
        },
      }
    })
  }, [])

  const handleJumpToLatest = useCallback(() => {
    setRunning(false)
    setSession((current) => {
      if (current.timeline.cursorStep === current.timeline.latestStep) {
        return current
      }

      return {
        race: getRaceAtStep(current.timeline, current.timeline.latestStep),
        timeline: {
          ...current.timeline,
          cursorStep: current.timeline.latestStep,
        },
      }
    })
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
          handleAdvance(tickCount, tickCount)
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

          handleAdvance(leftTicks, rightTicks)
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
  }, [handleAdvance, isAnimating, lockstep, speed])

  const activeTimelineEntry = useMemo(() => getTimelineEntry(timeline, timeline.cursorStep), [timeline])

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
          <Explanation
            leftDefinition={leftDefinition}
            rightDefinition={rightDefinition}
            lockstep={lockstep}
            pattern={pattern}
            leftEvents={activeTimelineEntry?.leftEvents ?? []}
            rightEvents={activeTimelineEntry?.rightEvents ?? []}
            leftDone={race.left.state.done}
            rightDone={race.right.state.done}
          />
        </section>

        <Timeline
          baseStep={timeline.baseStep}
          latestStep={timeline.latestStep}
          cursorStep={timeline.cursorStep}
          historyCap={HISTORY_CAP}
          entry={activeTimelineEntry}
          onScrub={handleScrub}
          onStepBack={handleTimelineBack}
          onStepForward={handleTimelineForward}
          onJumpToLatest={handleJumpToLatest}
        />

        <footer className="text-xs text-slate-500">
          Seed: {race.seed} | Dataset size: {race.initialData.length}
        </footer>
      </div>
    </div>
  )
}

export default App
