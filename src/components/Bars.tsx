import type { Range } from '../algorithms/types'

interface BarsProps {
  data: number[]
  sorted: boolean[]
  activeCompare: Range | null
  activeSwap: Range | null
  pivotIndex: number | null
  mergeWindow: Range | null
  lastOverwrite: number | null
}

const includesIndex = (range: Range | null, index: number): boolean =>
  Boolean(range && (range[0] === index || range[1] === index))

const inWindow = (window: Range | null, index: number): boolean =>
  Boolean(window && index >= window[0] && index <= window[1])

const barColor = (
  index: number,
  sorted: boolean[],
  activeCompare: Range | null,
  activeSwap: Range | null,
  pivotIndex: number | null,
  mergeWindow: Range | null,
  lastOverwrite: number | null,
): string => {
  if (includesIndex(activeSwap, index)) {
    return 'bg-rose-400'
  }
  if (index === pivotIndex) {
    return 'bg-amber-400'
  }
  if (includesIndex(activeCompare, index)) {
    return 'bg-sky-400'
  }
  if (index === lastOverwrite) {
    return 'bg-cyan-300'
  }
  if (inWindow(mergeWindow, index)) {
    return 'bg-indigo-400/60'
  }
  if (sorted[index]) {
    return 'bg-emerald-400/70'
  }
  return 'bg-slate-500/85'
}

export const Bars = ({
  data,
  sorted,
  activeCompare,
  activeSwap,
  pivotIndex,
  mergeWindow,
  lastOverwrite,
}: BarsProps) => {
  const maxValue = Math.max(...data, 1)

  return (
    <div className="relative h-64 overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-2">
      <div className="flex h-full items-end gap-[1px]">
        {data.map((value, index) => {
          const height = `${Math.max((value / maxValue) * 100, 2)}%`

          return (
            <div
              key={`${index}-${value}`}
              className={`min-w-0 flex-1 rounded-t-sm transition-[height,background-color] duration-150 ease-out ${barColor(
                index,
                sorted,
                activeCompare,
                activeSwap,
                pivotIndex,
                mergeWindow,
                lastOverwrite,
              )}`}
              style={{ height }}
            />
          )
        })}
      </div>
    </div>
  )
}
