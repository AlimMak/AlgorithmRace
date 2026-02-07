import type { StepEvent } from '../algorithms'

interface TimelineEntryView {
  leftEvents: StepEvent[]
  rightEvents: StepEvent[]
}

interface TimelineProps {
  baseStep: number
  latestStep: number
  cursorStep: number
  historyCap: number
  entry: TimelineEntryView | null
  onScrub: (step: number) => void
  onStepBack: () => void
  onStepForward: () => void
  onJumpToLatest: () => void
}

const eventLabel = (event: StepEvent): string => {
  if (event.type === 'compare') {
    return `compare(${event.i}, ${event.j})`
  }

  if (event.type === 'swap') {
    return `swap(${event.i}, ${event.j})`
  }

  if (event.type === 'overwrite') {
    return `overwrite(${event.i}, ${event.value})`
  }

  if (event.type === 'pivot') {
    return `pivot(${event.i})`
  }

  return `markSorted(${event.i})`
}

const laneClassName = 'rounded-xl border border-slate-800 bg-slate-900/70 p-3'
const buttonClassName =
  'rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40'

const renderEvents = (events: StepEvent[]) => {
  if (events.length === 0) {
    return <p className="text-xs text-slate-500">No events in this step.</p>
  }

  return (
    <ul className="space-y-1 text-xs text-slate-300">
      {events.map((event, index) => (
        <li key={`${event.type}-${index}`} className="rounded-md border border-slate-800 bg-slate-950/70 px-2 py-1 font-mono">
          {eventLabel(event)}
        </li>
      ))}
    </ul>
  )
}

export const Timeline = ({
  baseStep,
  latestStep,
  cursorStep,
  historyCap,
  entry,
  onScrub,
  onStepBack,
  onStepForward,
  onJumpToLatest,
}: TimelineProps) => {
  const retained = latestStep - baseStep
  const canBack = cursorStep > baseStep
  const canForward = cursorStep < latestStep

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-[0_16px_36px_rgba(2,6,23,0.4)]">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Timeline</h3>
          <p className="text-sm text-slate-400">
            Step {cursorStep} of {latestStep} | retained window {retained}/{historyCap}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onStepBack} disabled={!canBack} className={buttonClassName}>
            Back
          </button>
          <button type="button" onClick={onStepForward} disabled={!canForward} className={buttonClassName}>
            Forward
          </button>
          <button type="button" onClick={onJumpToLatest} disabled={!canForward} className={buttonClassName}>
            Latest
          </button>
        </div>
      </div>

      <input
        type="range"
        min={baseStep}
        max={latestStep}
        value={cursorStep}
        onChange={(event) => onScrub(Number.parseInt(event.target.value, 10))}
        className="w-full accent-sky-500"
        disabled={latestStep === baseStep}
      />

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className={laneClassName}>
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Left lane events</p>
          {renderEvents(entry?.leftEvents ?? [])}
        </div>
        <div className={laneClassName}>
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Right lane events</p>
          {renderEvents(entry?.rightEvents ?? [])}
        </div>
      </div>
    </section>
  )
}
