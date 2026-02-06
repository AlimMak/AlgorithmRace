export type AlgorithmKey = 'bubble' | 'insertion' | 'selection' | 'merge' | 'quick'

export type Range = [number, number]

export type StepEvent =
  | { type: 'compare'; i: number; j: number }
  | { type: 'swap'; i: number; j: number }
  | { type: 'overwrite'; i: number; value: number }
  | { type: 'pivot'; i: number }
  | { type: 'markSorted'; i: number }

export interface AlgoMetrics {
  comparisons: number
  swaps: number
  overwrites: number
  steps: number
  elapsedTicks: number
}

export interface AlgoState<TInternal = unknown> {
  algorithm: AlgorithmKey
  array: number[]
  internal: TInternal
  done: boolean
  metrics: AlgoMetrics
  sorted: boolean[]
  activeCompare: Range | null
  activeSwap: Range | null
  pivotIndex: number | null
  mergeWindow: Range | null
  lastOverwrite: number | null
}

export interface StepResult<TInternal = unknown> {
  state: AlgoState<TInternal>
  done: boolean
  events: StepEvent[]
}

export interface AlgorithmDefinition<TInternal = unknown> {
  key: AlgorithmKey
  label: string
  bigO: string
  description: string
  init: (data: number[]) => AlgoState<TInternal>
  step: (state: AlgoState<TInternal>) => StepResult<TInternal>
}

const emptyMetrics = (): AlgoMetrics => ({
  comparisons: 0,
  swaps: 0,
  overwrites: 0,
  steps: 0,
  elapsedTicks: 0,
})

export const createBaseState = <TInternal>(
  algorithm: AlgorithmKey,
  data: number[],
  internal: TInternal,
): AlgoState<TInternal> => {
  const done = data.length <= 1
  return {
    algorithm,
    array: [...data],
    internal,
    done,
    metrics: emptyMetrics(),
    sorted: data.map(() => done),
    activeCompare: null,
    activeSwap: null,
    pivotIndex: null,
    mergeWindow: null,
    lastOverwrite: null,
  }
}

interface StepPatch<TInternal> {
  array: number[]
  internal: TInternal
  done?: boolean
  mergeWindow?: Range | null
  pivotIndex?: number | null
}

export const applyStep = <TInternal>(
  prev: AlgoState<TInternal>,
  patch: StepPatch<TInternal>,
  events: StepEvent[],
): StepResult<TInternal> => {
  const sorted = [...prev.sorted]
  let activeCompare: Range | null = null
  let activeSwap: Range | null = null
  let lastOverwrite: number | null = null
  let pivotFromEvent: number | null = null

  let comparisons = prev.metrics.comparisons
  let swaps = prev.metrics.swaps
  let overwrites = prev.metrics.overwrites

  for (const event of events) {
    if (event.type === 'compare') {
      comparisons += 1
      activeCompare = [event.i, event.j]
      continue
    }
    if (event.type === 'swap') {
      swaps += 1
      activeSwap = [event.i, event.j]
      continue
    }
    if (event.type === 'overwrite') {
      overwrites += 1
      lastOverwrite = event.i
      continue
    }
    if (event.type === 'pivot') {
      pivotFromEvent = event.i
      continue
    }
    if (event.type === 'markSorted' && event.i >= 0 && event.i < sorted.length) {
      sorted[event.i] = true
    }
  }

  const done = patch.done ?? prev.done
  if (done) {
    for (let i = 0; i < sorted.length; i += 1) {
      sorted[i] = true
    }
  }

  const nextState: AlgoState<TInternal> = {
    algorithm: prev.algorithm,
    array: patch.array,
    internal: patch.internal,
    done,
    metrics: {
      comparisons,
      swaps,
      overwrites,
      steps: prev.metrics.steps + 1,
      elapsedTicks: prev.metrics.elapsedTicks + 1,
    },
    sorted,
    activeCompare,
    activeSwap,
    pivotIndex: patch.pivotIndex ?? pivotFromEvent ?? null,
    mergeWindow: patch.mergeWindow ?? null,
    lastOverwrite,
  }

  return {
    state: nextState,
    done,
    events,
  }
}
