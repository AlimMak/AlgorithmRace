import type { AlgoMetrics } from '../algorithms/types'
import { formatBool, formatNumber } from '../utils/format'

interface MetricsSnapshot {
  label: string
  metrics: AlgoMetrics
  isDone: boolean
  isSorted: boolean
}

interface MetricsProps {
  left: MetricsSnapshot
  right: MetricsSnapshot
  winnerLabel: string
}

interface MetricRow {
  key: string
  left: string
  right: string
}

export const Metrics = ({ left, right, winnerLabel }: MetricsProps) => {
  const rows: MetricRow[] = [
    {
      key: 'comparisons',
      left: formatNumber(left.metrics.comparisons),
      right: formatNumber(right.metrics.comparisons),
    },
    {
      key: 'swaps',
      left: formatNumber(left.metrics.swaps),
      right: formatNumber(right.metrics.swaps),
    },
    {
      key: 'overwrites',
      left: formatNumber(left.metrics.overwrites),
      right: formatNumber(right.metrics.overwrites),
    },
    {
      key: 'steps executed',
      left: formatNumber(left.metrics.steps),
      right: formatNumber(right.metrics.steps),
    },
    {
      key: 'time (ticks)',
      left: formatNumber(left.metrics.elapsedTicks),
      right: formatNumber(right.metrics.elapsedTicks),
    },
    {
      key: 'isDone',
      left: formatBool(left.isDone),
      right: formatBool(right.isDone),
    },
    {
      key: 'isSorted',
      left: formatBool(left.isSorted),
      right: formatBool(right.isSorted),
    },
  ]

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-[0_16px_36px_rgba(2,6,23,0.4)]">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-100">Live Metrics</h3>
        <p className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200">
          Winner: <span className="font-medium text-sky-300">{winnerLabel}</span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="border-b border-slate-800 pb-2 pr-4 uppercase tracking-[0.08em]">Metric</th>
              <th className="border-b border-slate-800 pb-2 pr-4 uppercase tracking-[0.08em]">{left.label}</th>
              <th className="border-b border-slate-800 pb-2 uppercase tracking-[0.08em]">{right.label}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="text-slate-200">
                <td className="border-b border-slate-900 py-2 pr-4 capitalize text-slate-400">{row.key}</td>
                <td className="border-b border-slate-900 py-2 pr-4 font-mono text-slate-100">{row.left}</td>
                <td className="border-b border-slate-900 py-2 font-mono text-slate-100">{row.right}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
