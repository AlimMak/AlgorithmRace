import { Bars } from './Bars'
import type { AlgoState, AlgorithmDefinition } from '../algorithms/types'

interface RacePanelProps {
  lane: string
  definition: AlgorithmDefinition
  state: AlgoState
}

export const RacePanel = ({ lane, definition, state }: RacePanelProps) => (
  <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-[0_16px_40px_rgba(2,6,23,0.45)]">
    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{lane}</p>
        <h2 className="text-xl font-semibold text-slate-100">{definition.label}</h2>
      </div>
      <div className="space-y-1 text-right">
        <p className="text-sm text-slate-400">Big-O: {definition.bigO}</p>
        <p className={`text-sm font-medium ${state.done ? 'text-emerald-300' : 'text-slate-300'}`}>
          {state.done ? 'Completed' : 'Running'}
        </p>
      </div>
    </div>

    <Bars
      data={state.array}
      sorted={state.sorted}
      activeCompare={state.activeCompare}
      activeSwap={state.activeSwap}
      pivotIndex={state.pivotIndex}
      mergeWindow={state.mergeWindow}
      lastOverwrite={state.lastOverwrite}
    />
  </section>
)
