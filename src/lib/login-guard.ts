// Client-side login attempt limiter.
// Note: purely client-side (per browser). Provides UX friction against
// casual credential guessing on this device. Supabase Auth itself
// enforces server-side rate limits on the auth endpoint.

const KEY = "rs-login-attempts";
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

type State = { count: number; lockedUntil: number | null };

function read(): State {
  if (typeof window === "undefined") return { count: 0, lockedUntil: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { count: 0, lockedUntil: null };
    return JSON.parse(raw) as State;
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

function write(s: State) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function getLockStatus(): { locked: boolean; minutesLeft: number; remaining: number } {
  const s = read();
  const now = Date.now();
  if (s.lockedUntil && s.lockedUntil > now) {
    return {
      locked: true,
      minutesLeft: Math.ceil((s.lockedUntil - now) / 60000),
      remaining: 0,
    };
  }
  if (s.lockedUntil && s.lockedUntil <= now) {
    write({ count: 0, lockedUntil: null });
    return { locked: false, minutesLeft: 0, remaining: MAX_ATTEMPTS };
  }
  return { locked: false, minutesLeft: 0, remaining: MAX_ATTEMPTS - s.count };
}

export function registerFailure(): { locked: boolean; remaining: number; minutesLeft: number } {
  const s = read();
  const count = s.count + 1;
  if (count >= MAX_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCK_MINUTES * 60000;
    write({ count, lockedUntil });
    return { locked: true, remaining: 0, minutesLeft: LOCK_MINUTES };
  }
  write({ count, lockedUntil: null });
  return { locked: false, remaining: MAX_ATTEMPTS - count, minutesLeft: 0 };
}

export function registerSuccess() {
  write({ count: 0, lockedUntil: null });
}
