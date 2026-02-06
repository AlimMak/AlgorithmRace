import {
  applyStep,
  createBaseState,
  type AlgoState,
  type AlgorithmDefinition,
  type StepEvent,
} from './types'

interface MergeFrame {
  left: number
  mid: number
  right: number
  leftBuffer: number[]
  rightBuffer: number[]
  i: number
  j: number
  k: number
}

interface MergeInternal {
  width: number
  leftStart: number
  frame: MergeFrame | null
}

const markAllSorted = (length: number): StepEvent[] =>
  Array.from({ length }, (_, i) => ({ type: 'markSorted' as const, i }))

const cloneFrame = (frame: MergeFrame | null): MergeFrame | null => {
  if (!frame) {
    return null
  }
  return {
    left: frame.left,
    mid: frame.mid,
    right: frame.right,
    leftBuffer: [...frame.leftBuffer],
    rightBuffer: [...frame.rightBuffer],
    i: frame.i,
    j: frame.j,
    k: frame.k,
  }
}

export const mergeSortStepper: AlgorithmDefinition<MergeInternal> = {
  key: 'merge',
  label: 'Merge Sort',
  bigO: 'O(n log n)',
  description:
    'Bottom-up merge sort that repeatedly merges sorted windows using overwrite operations.',
  init: (data) =>
    createBaseState('merge', data, {
      width: 1,
      leftStart: 0,
      frame: null,
    }),
  step: (state: AlgoState<MergeInternal>) => {
    if (state.done) {
      return applyStep(
        state,
        {
          array: [...state.array],
          internal: {
            width: state.internal.width,
            leftStart: state.internal.leftStart,
            frame: cloneFrame(state.internal.frame),
          },
          done: true,
        },
        [],
      )
    }

    const array = [...state.array]
    const internal: MergeInternal = {
      width: state.internal.width,
      leftStart: state.internal.leftStart,
      frame: cloneFrame(state.internal.frame),
    }
    const events: StepEvent[] = []
    const n = array.length
    let done = false

    if (n < 2) {
      events.push(...markAllSorted(n))
      return applyStep(state, { array, internal, done: true, mergeWindow: null }, events)
    }

    while (events.length === 0) {
      if (!internal.frame) {
        if (internal.width >= n) {
          events.push(...markAllSorted(n))
          done = true
          break
        }

        if (internal.leftStart >= n - 1) {
          internal.width *= 2
          internal.leftStart = 0
          continue
        }

        const left = internal.leftStart
        const mid = Math.min(left + internal.width - 1, n - 1)
        const right = Math.min(left + 2 * internal.width - 1, n - 1)
        internal.leftStart += internal.width * 2

        if (mid >= right) {
          continue
        }

        internal.frame = {
          left,
          mid,
          right,
          leftBuffer: array.slice(left, mid + 1),
          rightBuffer: array.slice(mid + 1, right + 1),
          i: 0,
          j: 0,
          k: left,
        }
      }

      const frame = internal.frame
      if (!frame) {
        continue
      }

      if (frame.i < frame.leftBuffer.length && frame.j < frame.rightBuffer.length) {
        const leftIndex = frame.left + frame.i
        const rightIndex = frame.mid + 1 + frame.j
        events.push({ type: 'compare', i: leftIndex, j: rightIndex })

        if (frame.leftBuffer[frame.i] <= frame.rightBuffer[frame.j]) {
          const value = frame.leftBuffer[frame.i]
          array[frame.k] = value
          events.push({ type: 'overwrite', i: frame.k, value })
          frame.i += 1
        } else {
          const value = frame.rightBuffer[frame.j]
          array[frame.k] = value
          events.push({ type: 'overwrite', i: frame.k, value })
          frame.j += 1
        }

        frame.k += 1
        break
      }

      if (frame.i < frame.leftBuffer.length) {
        const value = frame.leftBuffer[frame.i]
        array[frame.k] = value
        events.push({ type: 'overwrite', i: frame.k, value })
        frame.i += 1
        frame.k += 1
        break
      }

      if (frame.j < frame.rightBuffer.length) {
        const value = frame.rightBuffer[frame.j]
        array[frame.k] = value
        events.push({ type: 'overwrite', i: frame.k, value })
        frame.j += 1
        frame.k += 1
        break
      }

      internal.frame = null
    }

    const mergeWindow = internal.frame ? ([internal.frame.left, internal.frame.right] as [number, number]) : null

    return applyStep(
      state,
      {
        array,
        internal,
        done,
        mergeWindow,
        pivotIndex: null,
      },
      events,
    )
  },
}
