import {
  applyStep,
  createBaseState,
  type AlgoState,
  type AlgorithmDefinition,
  type StepEvent,
} from './types'

interface BubbleInternal {
  i: number
  j: number
  passSwapped: boolean
}

const markAllSorted = (length: number): StepEvent[] =>
  Array.from({ length }, (_, i) => ({ type: 'markSorted' as const, i }))

export const bubbleSortStepper: AlgorithmDefinition<BubbleInternal> = {
  key: 'bubble',
  label: 'Bubble Sort',
  bigO: 'O(n²)',
  description:
    'Repeatedly compares adjacent values and swaps them, bubbling larger values rightward each pass.',
  init: (data) =>
    createBaseState('bubble', data, {
      i: 0,
      j: 0,
      passSwapped: false,
    }),
  step: (state: AlgoState<BubbleInternal>) => {
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

    events.push({ type: 'compare', i: internal.j, j: internal.j + 1 })
    if (array[internal.j] > array[internal.j + 1]) {
      ;[array[internal.j], array[internal.j + 1]] = [array[internal.j + 1], array[internal.j]]
      events.push({ type: 'swap', i: internal.j, j: internal.j + 1 })
      internal.passSwapped = true
    }

    internal.j += 1

    if (internal.j >= n - internal.i - 1) {
      if (!internal.passSwapped) {
        events.push(...markAllSorted(n))
        return applyStep(state, { array, internal, done: true }, events)
      }

      events.push({ type: 'markSorted', i: n - internal.i - 1 })
      internal.i += 1
      internal.j = 0
      internal.passSwapped = false

      if (internal.i >= n - 1) {
        events.push(...markAllSorted(n))
        return applyStep(state, { array, internal, done: true }, events)
      }
    }

    return applyStep(state, { array, internal, done: false }, events)
  },
}
