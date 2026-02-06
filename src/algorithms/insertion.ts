import {
  applyStep,
  createBaseState,
  type AlgoState,
  type AlgorithmDefinition,
  type StepEvent,
} from './types'

interface InsertionInternal {
  i: number
  j: number
}

const markAllSorted = (length: number): StepEvent[] =>
  Array.from({ length }, (_, i) => ({ type: 'markSorted' as const, i }))

export const insertionSortStepper: AlgorithmDefinition<InsertionInternal> = {
  key: 'insertion',
  label: 'Insertion Sort',
  bigO: 'O(n²)',
  description:
    'Builds a sorted prefix by inserting each new value into its correct location with adjacent swaps.',
  init: (data) =>
    createBaseState('insertion', data, {
      i: 1,
      j: 1,
    }),
  step: (state: AlgoState<InsertionInternal>) => {
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

    if (n < 2 || internal.i >= n) {
      events.push(...markAllSorted(n))
      return applyStep(state, { array, internal, done: true }, events)
    }

    if (internal.j > 0) {
      const left = internal.j - 1
      const right = internal.j
      events.push({ type: 'compare', i: left, j: right })

      if (array[left] > array[right]) {
        ;[array[left], array[right]] = [array[right], array[left]]
        events.push({ type: 'swap', i: left, j: right })
        internal.j -= 1
      } else {
        events.push({ type: 'markSorted', i: internal.i })
        internal.i += 1
        internal.j = internal.i
      }
    } else {
      events.push({ type: 'markSorted', i: internal.i })
      internal.i += 1
      internal.j = internal.i
    }

    if (internal.i >= n) {
      events.push(...markAllSorted(n))
      return applyStep(state, { array, internal, done: true }, events)
    }

    return applyStep(state, { array, internal, done: false }, events)
  },
}
