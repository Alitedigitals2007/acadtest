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
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 3600000);
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
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
  const lagos = new Date(utcMs + 3600000);
  return lagos.toISOString();
}
