import type { AlgorithmDefinition } from '../algorithms/types'

interface ExplanationProps {
  leftDefinition: AlgorithmDefinition
  rightDefinition: AlgorithmDefinition
  lockstep: boolean
}

const legend = [
  { label: 'Compare', color: 'bg-sky-400' },
  { label: 'Swap', color: 'bg-rose-400' },
  { label: 'Pivot', color: 'bg-amber-400' },
  { label: 'Merge window', color: 'bg-indigo-400/70' },
  { label: 'Overwrite', color: 'bg-cyan-300' },
  { label: 'Sorted', color: 'bg-emerald-400/70' },
]

export const Explanation = ({ leftDefinition, rightDefinition, lockstep }: ExplanationProps) => (
  <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-[0_16px_36px_rgba(2,6,23,0.4)]">
    <h3 className="text-lg font-semibold text-slate-100">Race Notes</h3>
    <p className="mt-2 text-sm text-slate-300">
      {lockstep
        ? 'Lockstep mode is ON: both lanes execute exactly one algorithm step each tick.'
        : 'Lockstep mode is OFF: each lane advances independently based on tick accumulation.'}
    </p>

    <div className="mt-4 grid gap-3 text-sm text-slate-300">
      <div>
        <p className="font-medium text-slate-100">Left: {leftDefinition.label}</p>
        <p className="text-slate-400">{leftDefinition.description}</p>
      </div>
      <div>
        <p className="font-medium text-slate-100">Right: {rightDefinition.label}</p>
        <p className="text-slate-400">{rightDefinition.description}</p>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
      {legend.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-2 py-1">
          <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
          {item.label}
        </span>
      ))}
    </div>
  </section>
)
