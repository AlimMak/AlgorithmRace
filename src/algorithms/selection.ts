import {
  applyStep,
  createBaseState,
  type AlgoState,
  type AlgorithmDefinition,
  type StepEvent,
} from './types'

interface SelectionInternal {
  i: number
  j: number
  minIndex: number
}

const markAllSorted = (length: number): StepEvent[] =>
  Array.from({ length }, (_, i) => ({ type: 'markSorted' as const, i }))

export const selectionSortStepper: AlgorithmDefinition<SelectionInternal> = {
  key: 'selection',
  label: 'Selection Sort',
  bigO: 'O(n²)',
  description:
    'Finds the smallest remaining value and places it at the front of the unsorted region.',
  init: (data) =>
    createBaseState('selection', data, {
      i: 0,
      j: 1,
      minIndex: 0,
    }),
  step: (state: AlgoState<SelectionInternal>) => {
    if (state.done) {
      return applyStep(
        state,
        {
          array: [...state.array],
          internal: { ...state.internal },
          done: true,
        },
        [],
      )
    }

    const array = [...state.array]
    const internal = { ...state.internal }
    const events: StepEvent[] = []
    const n = array.length

    if (n < 2 || internal.i >= n - 1) {
      events.push(...markAllSorted(n))
      return applyStep(state, { array, internal, done: true }, events)
    }

    if (internal.j < n) {
      events.push({ type: 'compare', i: internal.minIndex, j: internal.j })
      if (array[internal.j] < array[internal.minIndex]) {
        internal.minIndex = internal.j
      }
      internal.j += 1
      return applyStep(state, { array, internal, done: false }, events)
    }

    if (internal.minIndex !== internal.i) {
      ;[array[internal.i], array[internal.minIndex]] = [array[internal.minIndex], array[internal.i]]
      events.push({ type: 'swap', i: internal.i, j: internal.minIndex })
    }
    events.push({ type: 'markSorted', i: internal.i })

    internal.i += 1
    internal.minIndex = internal.i
    internal.j = internal.i + 1

    if (internal.i >= n - 1) {
      events.push(...markAllSorted(n))
      return applyStep(state, { array, internal, done: true }, events)
    }

    return applyStep(state, { array, internal, done: false }, events)
  },
}
