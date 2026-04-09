/**
 * Format a number as Malaysian Ringgit (RM) with 2 decimal places.
 */
export function formatCurrency(value: number): string {
  return `RM${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
