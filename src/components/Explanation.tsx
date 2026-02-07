import type { StepEvent } from '../algorithms'
import type { AlgorithmDefinition } from '../algorithms/types'
import type { DataPattern } from '../utils/dataPatterns'

interface ExplanationProps {
  leftDefinition: AlgorithmDefinition
  rightDefinition: AlgorithmDefinition
  lockstep: boolean
  pattern: DataPattern
  leftEvents: StepEvent[]
  rightEvents: StepEvent[]
  leftDone: boolean
  rightDone: boolean
}

const patternLabel: Record<DataPattern, string> = {
  random: 'Random',
  'nearly-sorted': 'Nearly sorted',
  reversed: 'Reversed',
  'few-unique': 'Few unique values',
}

const describeCurrentAction = (events: StepEvent[], done: boolean): string => {
  if (done) {
    return 'Finished: all positions are now in sorted order.'
  }

  if (events.length === 0) {
    return 'Waiting for the next step.'
  }

  const compare = events.find((event) => event.type === 'compare')
  const swap = events.find((event) => event.type === 'swap')
  const overwrite = events.find((event) => event.type === 'overwrite')
  const pivot = events.find((event) => event.type === 'pivot')
  const markSorted = events.find((event) => event.type === 'markSorted')

  if (compare && swap) {
    return `Compared index ${compare.i} with ${compare.j}, then swapped to fix order.`
  }

  if (overwrite && compare) {
    return `Compared merge candidates, then wrote value ${overwrite.value} into index ${overwrite.i}.`
  }

  if (pivot) {
    return `Picked index ${pivot.i} as the pivot to split smaller and larger values.`
  }

  if (swap) {
    return `Swapped index ${swap.i} with ${swap.j} because they were out of order.`
  }

  if (overwrite) {
    return `Wrote value ${overwrite.value} into index ${overwrite.i} during merge.`
  }

  if (compare) {
    return `Comparing index ${compare.i} with ${compare.j} to decide order.`
  }

  if (markSorted) {
    return `Marked index ${markSorted.i} as confirmed sorted.`
  }

  return 'Executing the next algorithm operation.'
}

const describePatternBehavior = (algorithm: AlgorithmDefinition, pattern: DataPattern): string => {
  const key = algorithm.key

  if (pattern === 'random') {
    if (key === 'merge' || key === 'quick') {
      return 'On random data, this usually scales well because it reduces work by partitioning/merging chunks.'
    }
    return 'On random data, this checks many pairs, so step count usually grows quickly as size increases.'
  }

  if (pattern === 'nearly-sorted') {
    if (key === 'insertion' || key === 'bubble') {
      return 'Nearly sorted data helps here because only a few values need to move far.'
    }
    if (key === 'selection') {
      return 'This still scans the unsorted tail each round, so it gains little from nearly sorted input.'
    }
    if (key === 'quick') {
      return 'With a last-element pivot, nearly sorted input can create uneven splits and extra steps.'
    }
    return 'This does similar divide-and-merge work regardless of starting order, so gains are modest.'
  }

  if (pattern === 'reversed') {
    if (key === 'insertion' || key === 'bubble') {
      return 'Reversed order is difficult here because many adjacent elements must move.'
    }
    if (key === 'quick') {
      return 'Reversed input is often a bad case for this pivot strategy, so partitions can be unbalanced.'
    }
    if (key === 'selection') {
      return 'Comparisons stay high because each round still scans most of the remaining array.'
    }
    return 'This remains fairly consistent on reversed input because it always splits and merges by size.'
  }

  if (key === 'quick') {
    return 'Many duplicate values can reduce partition quality here, sometimes adding extra recursion depth.'
  }

  if (key === 'selection') {
    return 'Duplicate values do not reduce its scan work much, so comparisons remain similar.'
  }

  if (key === 'merge') {
    return 'Duplicates are handled smoothly, and total work stays close to its normal divide-and-merge pattern.'
  }

  return 'Many equal values can reduce movement because fewer swaps are needed to restore order.'
}

export const Explanation = ({
  leftDefinition,
  rightDefinition,
  lockstep,
  pattern,
  leftEvents,
  rightEvents,
  leftDone,
  rightDone,
}: ExplanationProps) => (
  <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-[0_16px_36px_rgba(2,6,23,0.4)]">
    <h3 className="text-lg font-semibold text-slate-100">Live Explanation</h3>

    <p className="mt-2 text-sm text-slate-300">
      {lockstep
        ? 'Lockstep mode: both lanes try exactly one step per tick.'
        : 'Independent mode: each lane advances when its own ticks accumulate.'}
    </p>
    <p className="mt-1 text-sm text-slate-400">Selected pattern: {patternLabel[pattern]}.</p>

    <div className="mt-4 space-y-3 text-sm">
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <p className="font-medium text-slate-100">Left ({leftDefinition.label})</p>
        <p className="mt-1 text-slate-300">Now: {describeCurrentAction(leftEvents, leftDone)}</p>
        <p className="mt-1 text-slate-400">Why on this pattern: {describePatternBehavior(leftDefinition, pattern)}</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <p className="font-medium text-slate-100">Right ({rightDefinition.label})</p>
        <p className="mt-1 text-slate-300">Now: {describeCurrentAction(rightEvents, rightDone)}</p>
        <p className="mt-1 text-slate-400">Why on this pattern: {describePatternBehavior(rightDefinition, pattern)}</p>
      </div>
    </div>
  </section>
)
