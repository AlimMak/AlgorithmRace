import type { AlgorithmKey } from '../algorithms'
import type { DataPattern } from '../utils/dataPatterns'

interface ControlsProps {
  size: number
  speed: number
  pattern: DataPattern
  lockstep: boolean
  soundEnabled: boolean
  running: boolean
  seedInput: string
  leftAlgorithm: AlgorithmKey
  rightAlgorithm: AlgorithmKey
  algorithmOptions: Array<{ value: AlgorithmKey; label: string }>
  patternOptions: Array<{ value: DataPattern; label: string }>
  onSizeChange: (value: number) => void
  onSpeedChange: (value: number) => void
  onPatternChange: (value: DataPattern) => void
  onLockstepChange: (value: boolean) => void
  onSoundChange: (value: boolean) => void
  onSeedChange: (value: string) => void
  onLeftAlgorithmChange: (value: AlgorithmKey) => void
  onRightAlgorithmChange: (value: AlgorithmKey) => void
  onGenerate: () => void
  onStartPause: () => void
  onStep: () => void
  onReset: () => void
  onAutoSeed: () => void
  disableStart: boolean
}

const controlClassName =
  'rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-400'

const actionClassName =
  'rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50'

export const Controls = ({
  size,
  speed,
  pattern,
  lockstep,
  soundEnabled,
  running,
  seedInput,
  leftAlgorithm,
  rightAlgorithm,
  algorithmOptions,
  patternOptions,
  onSizeChange,
  onSpeedChange,
  onPatternChange,
  onLockstepChange,
  onSoundChange,
  onSeedChange,
  onLeftAlgorithmChange,
  onRightAlgorithmChange,
  onGenerate,
  onStartPause,
  onStep,
  onReset,
  onAutoSeed,
  disableStart,
}: ControlsProps) => (
  <header className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_24px_60px_rgba(2,6,23,0.55)]">
    <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Algorithm Race Visualizer</h1>
        <p className="text-sm text-slate-400">Race two step-based sorting algorithms on the same seeded dataset.</p>
      </div>
      <div className="grid gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
        <div className="flex items-center gap-3">
          <label className="text-xs uppercase tracking-[0.12em] text-slate-400" htmlFor="lockstep-toggle">
            Lockstep mode
          </label>
          <button
            id="lockstep-toggle"
            type="button"
            onClick={() => onLockstepChange(!lockstep)}
            className={`h-7 w-14 rounded-full border transition ${
              lockstep ? 'border-sky-500 bg-sky-600/40' : 'border-slate-600 bg-slate-800'
            }`}
            aria-pressed={lockstep}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-slate-100 transition ${lockstep ? 'translate-x-7' : 'translate-x-1'}`}
            />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs uppercase tracking-[0.12em] text-slate-400" htmlFor="sound-toggle">
            Sound cues
          </label>
          <button
            id="sound-toggle"
            type="button"
            onClick={() => onSoundChange(!soundEnabled)}
            className={`h-7 w-14 rounded-full border transition ${
              soundEnabled ? 'border-teal-500 bg-teal-600/40' : 'border-slate-600 bg-slate-800'
            }`}
            aria-pressed={soundEnabled}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-slate-100 transition ${
                soundEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>

    <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2">
        <label className="block text-xs uppercase tracking-[0.12em] text-slate-400" htmlFor="size-slider">
          Dataset size: <span className="text-slate-200">{size}</span>
        </label>
        <input
          id="size-slider"
          type="range"
          min={10}
          max={200}
          value={size}
          onChange={(event) => onSizeChange(Number.parseInt(event.target.value, 10))}
          className="w-full accent-sky-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs uppercase tracking-[0.12em] text-slate-400" htmlFor="speed-slider">
          Speed (steps/s): <span className="text-slate-200">{speed}</span>
        </label>
        <input
          id="speed-slider"
          type="range"
          min={1}
          max={120}
          value={speed}
          onChange={(event) => onSpeedChange(Number.parseInt(event.target.value, 10))}
          className="w-full accent-sky-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs uppercase tracking-[0.12em] text-slate-400" htmlFor="pattern-select">
          Data pattern
        </label>
        <select
          id="pattern-select"
          value={pattern}
          onChange={(event) => onPatternChange(event.target.value as DataPattern)}
          className={`${controlClassName} w-full`}
        >
          {patternOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="block text-xs uppercase tracking-[0.12em] text-slate-400" htmlFor="seed-input">
          Seed
        </label>
        <div className="flex gap-2">
          <input
            id="seed-input"
            value={seedInput}
            onChange={(event) => onSeedChange(event.target.value)}
            placeholder="Auto"
            className={`${controlClassName} min-w-0 flex-1`}
          />
          <button type="button" onClick={onAutoSeed} className={actionClassName}>
            Auto
          </button>
        </div>
      </div>
    </div>

    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.12em] text-slate-400" htmlFor="left-algo-select">
          Left algorithm
        </label>
        <select
          id="left-algo-select"
          value={leftAlgorithm}
          onChange={(event) => onLeftAlgorithmChange(event.target.value as AlgorithmKey)}
          className={`${controlClassName} w-full`}
        >
          {algorithmOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.12em] text-slate-400" htmlFor="right-algo-select">
          Right algorithm
        </label>
        <select
          id="right-algo-select"
          value={rightAlgorithm}
          onChange={(event) => onRightAlgorithmChange(event.target.value as AlgorithmKey)}
          className={`${controlClassName} w-full`}
        >
          {algorithmOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="mt-5 flex flex-wrap gap-2">
      <button type="button" onClick={onGenerate} className={actionClassName}>
        Generate
      </button>
      <button type="button" onClick={onStartPause} disabled={disableStart} className={actionClassName}>
        {running ? 'Pause' : 'Start'}
      </button>
      <button type="button" onClick={onStep} disabled={running} className={actionClassName}>
        Step
      </button>
      <button type="button" onClick={onReset} className={actionClassName}>
        Reset
      </button>
    </div>
  </header>
)
