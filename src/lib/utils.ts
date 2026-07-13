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

export function parseLagosDate(dateStr: string): Date {
  if (dateStr.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  const d = new Date(dateStr);
  return new Date(d.getTime() - 3600000);
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
