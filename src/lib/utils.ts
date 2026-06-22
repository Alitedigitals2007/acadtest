export function generateCode(prefix: string): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${num}`;
}

export function calculateAvailable(
  limit: number,
  used: number,
  bonus: number
): number {
  return limit + bonus - used;
}
