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

const LAGOS_TIMEZONE = "Africa/Lagos";

export function getLagosTime(): Date {
  return new Date();
}

export function formatLagosTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", { timeZone: LAGOS_TIMEZONE });
}

export function formatLagosDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { timeZone: LAGOS_TIMEZONE });
}

export function toLagosISOString(date: Date): string {
  const d = new Date(date);
  return d.toLocaleString("en-CA", { timeZone: "Africa/Lagos", hour12: false }).replace(", ", "T") + ":00.000+01:00";
}
