import { bubbleSortStepper } from './bubble'
import { insertionSortStepper } from './insertion'
import { mergeSortStepper } from './merge'
import { quickSortStepper } from './quick'
import { selectionSortStepper } from './selection'
import type { AlgorithmDefinition, AlgorithmKey } from './types'

export { type AlgoState, type AlgorithmKey, type StepEvent } from './types'

export const algorithms: Record<AlgorithmKey, AlgorithmDefinition> = {
  bubble: bubbleSortStepper as AlgorithmDefinition,
  insertion: insertionSortStepper as AlgorithmDefinition,
  selection: selectionSortStepper as AlgorithmDefinition,
  merge: mergeSortStepper as AlgorithmDefinition,
  quick: quickSortStepper as AlgorithmDefinition,
}

export const algorithmOptions = (
  Object.entries(algorithms) as Array<[AlgorithmKey, AlgorithmDefinition]>
).map(([value, definition]) => ({
  value,
  label: definition.label,
}))
