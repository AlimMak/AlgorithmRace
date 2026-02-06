import {
  applyStep,
  createBaseState,
  type AlgoState,
  type AlgorithmDefinition,
  type StepEvent,
} from './types'

interface Segment {
  low: number
  high: number
}

interface PartitionFrame {
  low: number
  high: number
  pivotIndex: number
  pivotValue: number
  i: number
  j: number
}

interface QuickInternal {
  stack: Segment[]
  frame: PartitionFrame | null
}

const markAllSorted = (length: number): StepEvent[] =>
  Array.from({ length }, (_, i) => ({ type: 'markSorted' as const, i }))

const cloneFrame = (frame: PartitionFrame | null): PartitionFrame | null => {
  if (!frame) {
    return null
  }
  return {
    low: frame.low,
    high: frame.high,
    pivotIndex: frame.pivotIndex,
    pivotValue: frame.pivotValue,
    i: frame.i,
    j: frame.j,
  }
}

export const quickSortStepper: AlgorithmDefinition<QuickInternal> = {
  key: 'quick',
  label: 'Quick Sort',
  bigO: 'O(n log n) avg',
  description:
    'Iterative Lomuto partition quicksort with explicit pivot, compare, and swap events.',
  init: (data) =>
    createBaseState('quick', data, {
      stack: data.length > 1 ? [{ low: 0, high: data.length - 1 }] : [],
      frame: null,
    }),
  step: (state: AlgoState<QuickInternal>) => {
    if (state.done) {
      return applyStep(
        state,
        {
          array: [...state.array],
          internal: {
            stack: [...state.internal.stack],
            frame: cloneFrame(state.internal.frame),
          },
          done: true,
        },
        [],
      )
    }

    const array = [...state.array]
    const internal: QuickInternal = {
      stack: [...state.internal.stack],
      frame: cloneFrame(state.internal.frame),
    }
    const events: StepEvent[] = []
    const n = array.length
    let done = false

    if (n < 2) {
      events.push(...markAllSorted(n))
      return applyStep(state, { array, internal, done: true, pivotIndex: null }, events)
    }

    while (events.length === 0) {
      if (!internal.frame) {
        const segment = internal.stack.pop()

        if (!segment) {
          events.push(...markAllSorted(n))
          done = true
          break
        }

        if (segment.low >= segment.high) {
          if (segment.low === segment.high) {
            events.push({ type: 'markSorted', i: segment.low })
            break
          }
          continue
        }

        const pivotIndex = segment.high
        internal.frame = {
          low: segment.low,
          high: segment.high,
          pivotIndex,
          pivotValue: array[pivotIndex],
          i: segment.low,
          j: segment.low,
        }

        events.push({ type: 'pivot', i: pivotIndex })
        break
      }

      const frame = internal.frame
      if (!frame) {
        continue
      }

      if (frame.j < frame.high) {
        events.push({ type: 'compare', i: frame.j, j: frame.pivotIndex })

        if (array[frame.j] <= frame.pivotValue) {
          if (frame.i !== frame.j) {
            ;[array[frame.i], array[frame.j]] = [array[frame.j], array[frame.i]]
            events.push({ type: 'swap', i: frame.i, j: frame.j })
          }
          frame.i += 1
        }

        frame.j += 1
        break
      }

      if (frame.i !== frame.pivotIndex) {
        ;[array[frame.i], array[frame.pivotIndex]] = [array[frame.pivotIndex], array[frame.i]]
        events.push({ type: 'swap', i: frame.i, j: frame.pivotIndex })
      }
      events.push({ type: 'markSorted', i: frame.i })

      const left: Segment = { low: frame.low, high: frame.i - 1 }
      const right: Segment = { low: frame.i + 1, high: frame.high }

      if (right.low < right.high) {
        internal.stack.push(right)
      } else if (right.low === right.high) {
        events.push({ type: 'markSorted', i: right.low })
      }

      if (left.low < left.high) {
        internal.stack.push(left)
      } else if (left.low === left.high) {
        events.push({ type: 'markSorted', i: left.low })
      }

      internal.frame = null

      if (internal.stack.length === 0) {
        events.push(...markAllSorted(n))
        done = true
      }
      break
    }

    return applyStep(
      state,
      {
        array,
        internal,
        done,
        pivotIndex: internal.frame ? internal.frame.pivotIndex : null,
        mergeWindow: null,
      },
      events,
    )
  },
}
