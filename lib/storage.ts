// localStorage persistence + optional cloud-sync hook.
// localStorage is the synchronous source of truth for the UI; when a sync
// pusher is registered (after Supabase sign-in), every write is also mirrored
// up to the cloud. With no pusher registered the app is pure-local as before.
import {
  type Survey, type Workout, type WorkoutLog, type User, type UserPreferences,
  type MealEntry, type WaterEntry, type SetLog, type WorkoutTemplate,
  defaultPreferences,
} from "./models";

const KEYS = {
  survey: "ff.survey",
  current: "ff.currentWorkout",
  logs: "ff.logs",
  user: "ff.user",
  prefs: "ff.prefs",
  meals: "ff.meals",
  water: "ff.water",
  setLogs: "ff.setLogs",
  templates: "ff.templates",
  program: "ff.program",
  programIndex: "ff.programIndex",
  auth: "ff.isAuthenticated",
} as const;

// All keys that participate in cloud sync.
export const SYNC_KEYS: string[] = Object.values(KEYS);
// Device-local keys that must NOT be synced to the cloud.
export const SKIP_SYNC_KEYS: Set<string> = new Set([KEYS.auth]);

const isBrowser = typeof window !== "undefined";

// ---- cloud-sync pusher (registered by lib/sync) ----
type Pusher = (key: string, value: unknown) => void;
let pusher: Pusher | null = null;
export function setSyncPusher(p: Pusher | null) {
  pusher = p;
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

// Local-only write (no cloud push). Used by the pull path.
export function rawWrite(key: string, value: unknown) {
  if (!isBrowser) return;
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / serialization — ignore */
  }
}

// Write-through: local first, then mirror up to the cloud if syncing.
function write(key: string, value: unknown) {
  rawWrite(key, value);
  try {
    pusher?.(key, value);
  } catch {
    /* never let a sync error break a local write */
  }
}

export const Storage = {
  loadSurvey: () => read<Survey | null>(KEYS.survey, null),
  saveSurvey: (s: Survey) => write(KEYS.survey, s),

  loadCurrentWorkout: () => read<Workout | null>(KEYS.current, null),
  saveCurrentWorkout: (w: Workout | null) => write(KEYS.current, w),

  loadLogs: () => read<WorkoutLog[]>(KEYS.logs, []),
  saveLogs: (l: WorkoutLog[]) => write(KEYS.logs, l),

  loadUser: () => read<User | null>(KEYS.user, null),
  saveUser: (u: User | null) => write(KEYS.user, u),

  loadPreferences: () => read<UserPreferences>(KEYS.prefs, defaultPreferences()),
  savePreferences: (p: UserPreferences) => write(KEYS.prefs, p),

  loadMeals: () => read<MealEntry[]>(KEYS.meals, []),
  saveMeals: (m: MealEntry[]) => write(KEYS.meals, m),

  loadWater: () => read<WaterEntry[]>(KEYS.water, []),
  saveWater: (w: WaterEntry[]) => write(KEYS.water, w),

  loadSetLogs: () => read<SetLog[]>(KEYS.setLogs, []),
  saveSetLogs: (s: SetLog[]) => write(KEYS.setLogs, s),

  loadTemplates: () => read<WorkoutTemplate[]>(KEYS.templates, []),
  saveTemplates: (t: WorkoutTemplate[]) => write(KEYS.templates, t),

  loadProgram: () => read<Workout[]>(KEYS.program, []),
  saveProgram: (p: Workout[]) => write(KEYS.program, p),

  loadProgramIndex: () => read<number>(KEYS.programIndex, 0),
  saveProgramIndex: (i: number) => write(KEYS.programIndex, i),

  loadIsAuthenticated: () => read<boolean>(KEYS.auth, false),
  saveIsAuthenticated: (v: boolean) => write(KEYS.auth, v),

  clearAll: () => {
    if (!isBrowser) return;
    Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
  },
};
