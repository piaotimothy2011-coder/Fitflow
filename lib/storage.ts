// localStorage persistence — mirrors Services/StorageService.swift (same "ff.*" keys)
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
  auth: "ff.isAuthenticated",
} as const;

const isBrowser = typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  if (!isBrowser) return;
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / serialization — ignore */
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

  loadIsAuthenticated: () => read<boolean>(KEYS.auth, false),
  saveIsAuthenticated: (v: boolean) => write(KEYS.auth, v),

  clearAll: () => {
    if (!isBrowser) return;
    Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
  },
};
