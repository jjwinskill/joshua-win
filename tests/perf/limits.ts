// The lines the throttled checks hold every page to (S1, G30): CLS and INP. Frame timing is reported
// only, because CI runners are too noisy for it.
export interface Limits {
  cls: number;
  inp: number;
}

const defaults: Limits = { cls: 0.1, inp: 200 };

// A page may have its own limit only with Josh's OK and a recorded reason (G30), for a minor miss that
// buys an especially good visual. There are none yet.
const exceptions: Record<string, Partial<Limits> & { reason: string }> = {};

export function limitsFor(route: string): Limits {
  return { ...defaults, ...exceptions[route] };
}
