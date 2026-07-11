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

export function getLagosTime(): Date {
  const now = new Date();
  const lagosTime = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
  return lagosTime;
}

export function formatLagosTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", { timeZone: "Africa/Lagos" });
}

export function getLagosTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
}

export function toLagosISOString(date: Date): string {
  return new Date(date.toLocaleString("en-US", { timeZone: "Africa/Lagos" })).toISOString();
}
