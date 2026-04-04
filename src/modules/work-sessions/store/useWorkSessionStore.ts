import { create } from 'zustand';

const COOKIE_NAME = 'work_session';
const SNOOZE_KEY = 'work_session_snooze_until';
const COOKIE_EXPIRY_HOURS = 12;

interface WorkSessionData {
  active: boolean;
  started_at: string;
  id: number;
}

interface WorkSessionStore {
  active: boolean;
  startedAt: string | null;
  sessionId: number | null;
  showModal: boolean;
  init: () => void;
  startSession: (startedAt: string, id: number) => void;
  endSession: () => void;
  snooze: () => void;
  dismissModal: () => void;
}

// ── Cookie helpers ──────────────────────────────────────────────────────────

function readCookie(): WorkSessionData | null {
  const match = document.cookie.match(/(?:^|; )work_session=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

function writeCookie(data: WorkSessionData): void {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + COOKIE_EXPIRY_HOURS);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))}; expires=${expiry.toUTCString()}; path=/; SameSite=Strict`;
}

function deleteCookie(): void {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
}

// ── Snooze helpers ──────────────────────────────────────────────────────────

function isSnoozed(): boolean {
  const val = localStorage.getItem(SNOOZE_KEY);
  if (!val) return false;
  return new Date() < new Date(val);
}

function setSnoozedUntil(): void {
  const until = new Date();
  until.setMinutes(until.getMinutes() + 5);
  localStorage.setItem(SNOOZE_KEY, until.toISOString());
}

function clearSnooze(): void {
  localStorage.removeItem(SNOOZE_KEY);
}

// ── Store ───────────────────────────────────────────────────────────────────

export const useWorkSessionStore = create<WorkSessionStore>((set) => ({
  active: false,
  startedAt: null,
  sessionId: null,
  showModal: false,

  init: () => {
    const session = readCookie();

    if (session?.active && session.started_at) {
      // Active session already running
      set({ active: true, startedAt: session.started_at, sessionId: session.id ?? null, showModal: false });
      return;
    }

    // No active session – show modal unless snoozed
    if (!isSnoozed()) {
      set({ active: false, startedAt: null, sessionId: null, showModal: true });
    } else {
      set({ active: false, startedAt: null, sessionId: null, showModal: false });
    }
  },

  startSession: (startedAt: string, id: number) => {
    clearSnooze();
    writeCookie({ active: true, started_at: startedAt, id });
    set({ active: true, startedAt, sessionId: id, showModal: false });
  },

  endSession: () => {
    deleteCookie();
    set({ active: false, startedAt: null, sessionId: null, showModal: false });
  },

  snooze: () => {
    setSnoozedUntil();
    set({ showModal: false });
  },

  dismissModal: () => {
    set({ showModal: false });
  },
}));
