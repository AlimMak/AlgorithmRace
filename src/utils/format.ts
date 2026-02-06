export const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)

export const formatBool = (value: boolean): string => (value ? 'true' : 'false')
