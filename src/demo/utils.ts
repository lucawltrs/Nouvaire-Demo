/** Small helpers shared by every mock API module. */

/** Resolves after `ms` milliseconds — used to fake network latency. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Random latency in the 150–400ms band so loading states stay visible. */
export function fakeLatency(): Promise<void> {
  return delay(150 + Math.random() * 250);
}

let counter = 0;

/** Deterministic-ish unique id generator for freshly created demo entities. */
export function generateId(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
