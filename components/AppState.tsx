"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  type Survey, type Workout, type WorkoutLog, type User, type UserPreferences,
  type MealEntry, type WaterEntry, type SetLog, type WorkoutTemplate, type RunLog,
  emptySurvey, defaultPreferences, uuid,
  exerciseCompletedSetCount, makeFreshCopy,
} from "@/lib/models";
import { Storage } from "@/lib/storage";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import { startSync, stopSync, pullAll, pushAllLocal } from "@/lib/sync";

export type Route = "welcome" | "survey" | "main";

export interface AuthResult {
  error?: string;
  needsConfirm?: boolean;
}

interface AppStateValue {
  hydrated: boolean;
  cloudEnabled: boolean;
  authRecovery: boolean;
  route: Route;
  user: User | null;
  survey: Survey;
  currentWorkout: Workout | null;
  program: Workout[];
  programIndex: number;
  logs: WorkoutLog[];
  setLogs: SetLog[];
  meals: MealEntry[];
  water: WaterEntry[];
  templates: WorkoutTemplate[];
  runs: RunLog[];
  preferences: UserPreferences;
  // actions
  signUp: (name: string, email?: string) => void;               // local-only mode
  signUpEmail: (name: string, email: string, password: string) => Promise<AuthResult>;
  signInEmail: (email: string, password: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  signOut: () => void;
  setSurvey: (s: Survey) => void;
  setCurrentWorkout: (w: Workout | null) => void;
  installProgram: (program: Workout[]) => void;
  startSession: (index: number) => void;
  finishWorkout: (w: Workout, durationMinutes: number) => void;
  appendSetLogs: (logs: SetLog[]) => void;
  addMeal: (m: MealEntry) => void;
  deleteMeal: (id: string) => void;
  addWater: (oz: number) => void;
  saveTemplate: (name: string, w: Workout) => void;
  deleteTemplate: (id: string) => void;
  addRun: (run: RunLog) => void;
  setPreferences: (p: UserPreferences) => void;
  goToSurvey: () => void;
  resetAll: () => void;
}

const Ctx = createContext<AppStateValue | null>(null);
export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppStateProvider");
  return v;
};

function computeRoute(user: User | null, currentWorkout: Workout | null): Route {
  if (!user) return "welcome";
  return currentWorkout ? "main" : "survey";
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [authRecovery, setAuthRecovery] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [survey, setSurveyState] = useState<Survey>(emptySurvey());
  const [currentWorkout, setCurrentWorkoutState] = useState<Workout | null>(null);
  const [program, setProgram] = useState<Workout[]>([]);
  const [programIndex, setProgramIndex] = useState(0);
  const [logs, setLogsState] = useState<WorkoutLog[]>([]);
  const [setLogs, setSetLogs] = useState<SetLog[]>([]);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [water, setWater] = useState<WaterEntry[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [runs, setRuns] = useState<RunLog[]>([]);
  const [preferences, setPreferencesState] = useState<UserPreferences>(defaultPreferences());
  const [route, setRoute] = useState<Route>("welcome");

  // Reload all in-memory state from localStorage (used after a cloud pull).
  const loadAll = useCallback(() => {
    const u = Storage.loadUser();
    const cw = Storage.loadCurrentWorkout();
    setUser(u);
    setSurveyState(Storage.loadSurvey() ?? emptySurvey());
    setCurrentWorkoutState(cw);
    setLogsState(Storage.loadLogs());
    setSetLogs(Storage.loadSetLogs());
    setMeals(Storage.loadMeals());
    setWater(Storage.loadWater());
    setTemplates(Storage.loadTemplates());
    setRuns(Storage.loadRuns());
    setProgram(Storage.loadProgram());
    setProgramIndex(Storage.loadProgramIndex());
    setPreferencesState(Storage.loadPreferences());
    setRoute(computeRoute(u, cw));
  }, []);

  // Pull cloud data, start mirroring, ensure a profile exists, then hydrate.
  const onSignedIn = useCallback(async (userId: string) => {
    await pullAll(userId);
    startSync(userId);
    if (!Storage.loadUser()) {
      let email: string | null = null;
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        email = data.user?.email ?? null;
      }
      const u: User = {
        id: userId,
        name: email ? email.split("@")[0] : "You",
        email,
        createdAt: new Date().toISOString(),
        authProvider: "email",
      };
      Storage.saveUser(u);
      await pushAllLocal(userId);
    }
    loadAll();
  }, [loadAll]);

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    // Pure-local mode: no Supabase configured.
    if (!supabaseEnabled || !supabase) {
      loadAll();
      setHydrated(true);
      return;
    }

    // Cloud mode: watch for password-recovery links, then restore session.
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setAuthRecovery(true);
    });
    // Also detect the recovery link directly from the URL (Supabase adds
    // `type=recovery` to the redirect hash), in case the event fires early.
    try {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      if (hash.get("type") === "recovery") setAuthRecovery(true);
    } catch { /* ignore */ }
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          await onSignedIn(data.session.user.id);
        } else {
          setRoute("welcome");
        }
      } catch {
        setRoute("welcome");
      } finally {
        setHydrated(true);
      }
    })();
  }, [loadAll, onSignedIn]);

  // ---- auth: local-only fallback ----
  const signUp = useCallback((name: string, email?: string) => {
    const cleanName = name.trim() || "You";
    const u: User = {
      id: uuid(), name: cleanName, email: email ?? null,
      createdAt: new Date().toISOString(), authProvider: "email",
    };
    setUser(u); Storage.saveUser(u); Storage.saveIsAuthenticated(true);
    setRoute(computeRoute(u, currentWorkout));
  }, [currentWorkout]);

  // ---- auth: Supabase email + password ----
  const signUpEmail = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: "Cloud not configured." };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.session || !data.user) return { needsConfirm: true };
    const u: User = {
      id: data.user.id, name: name.trim() || (email.split("@")[0] || "You"),
      email, createdAt: new Date().toISOString(), authProvider: "email",
    };
    Storage.saveUser(u);
    await pushAllLocal(data.user.id);
    startSync(data.user.id);
    loadAll();
    return {};
  }, [loadAll]);

  const signInEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: "Cloud not configured." };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: "Sign in failed." };
    await onSignedIn(data.user.id);
    return {};
  }, [onSignedIn]);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return { error: "Cloud not configured." };
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return error ? { error: error.message } : {};
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!supabase) return { error: "Cloud not configured." };
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    setAuthRecovery(false);
    if (data.user) await onSignedIn(data.user.id);
    return {};
  }, [onSignedIn]);

  const signOut = useCallback(() => {
    stopSync();
    if (supabase) void supabase.auth.signOut();
    Storage.clearAll();
    setUser(null); setSurveyState(emptySurvey()); setCurrentWorkoutState(null);
    setLogsState([]); setSetLogs([]); setMeals([]); setWater([]); setTemplates([]);
    setRuns([]); setProgram([]); setProgramIndex(0);
    setPreferencesState(defaultPreferences());
    setRoute("welcome");
  }, []);

  const setSurvey = useCallback((s: Survey) => {
    setSurveyState(s); Storage.saveSurvey(s);
  }, []);

  const setCurrentWorkout = useCallback((w: Workout | null) => {
    setCurrentWorkoutState(w); Storage.saveCurrentWorkout(w);
    setRoute(computeRoute(user, w));
  }, [user]);

  const installProgram = useCallback((prog: Workout[]) => {
    setProgram(prog); Storage.saveProgram(prog);
    setProgramIndex(0); Storage.saveProgramIndex(0);
    const first = prog[0] ? makeFreshCopy(prog[0]) : null;
    setCurrentWorkoutState(first); Storage.saveCurrentWorkout(first);
    setRoute(computeRoute(user, first));
  }, [user]);

  const startSession = useCallback((i: number) => {
    if (!program[i]) return;
    setProgramIndex(i); Storage.saveProgramIndex(i);
    const w = makeFreshCopy(program[i]);
    setCurrentWorkoutState(w); Storage.saveCurrentWorkout(w);
    setRoute("main");
  }, [program]);

  const appendSetLogs = useCallback((newLogs: SetLog[]) => {
    setSetLogs((prev) => {
      const next = [...newLogs, ...prev];
      Storage.saveSetLogs(next);
      return next;
    });
  }, []);

  const finishWorkout = useCallback((w: Workout, durationMinutes: number) => {
    const completed = w.exercises.filter((e) => exerciseCompletedSetCount(e) > 0).length;
    const log: WorkoutLog = {
      id: uuid(), date: new Date().toISOString(), workoutName: w.workoutName,
      tag: w.tag, exercisesCompleted: completed, totalExercises: w.exercises.length,
      durationMinutes, goal: survey.goal,
    };
    setLogsState((prev) => { const next = [log, ...prev]; Storage.saveLogs(next); return next; });
    if (program.length > 0) {
      const nextIndex = (programIndex + 1) % program.length;
      const next = makeFreshCopy(program[nextIndex]);
      setProgramIndex(nextIndex); Storage.saveProgramIndex(nextIndex);
      setCurrentWorkoutState(next); Storage.saveCurrentWorkout(next);
      setRoute("main");
    } else {
      setCurrentWorkoutState(null); Storage.saveCurrentWorkout(null);
      setRoute("survey");
    }
  }, [survey.goal, program, programIndex]);

  const addMeal = useCallback((m: MealEntry) => {
    setMeals((prev) => { const next = [m, ...prev]; Storage.saveMeals(next); return next; });
  }, []);
  const deleteMeal = useCallback((id: string) => {
    setMeals((prev) => { const next = prev.filter((x) => x.id !== id); Storage.saveMeals(next); return next; });
  }, []);
  const addWater = useCallback((oz: number) => {
    const entry: WaterEntry = { id: uuid(), date: new Date().toISOString(), amountOz: oz };
    setWater((prev) => { const next = [entry, ...prev]; Storage.saveWater(next); return next; });
  }, []);

  const saveTemplate = useCallback((name: string, w: Workout) => {
    const t: WorkoutTemplate = { id: uuid(), name, createdAt: new Date().toISOString(), workout: w };
    setTemplates((prev) => { const next = [t, ...prev]; Storage.saveTemplates(next); return next; });
  }, []);
  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => { const next = prev.filter((x) => x.id !== id); Storage.saveTemplates(next); return next; });
  }, []);

  const addRun = useCallback((run: RunLog) => {
    setRuns((prev) => { const next = [run, ...prev]; Storage.saveRuns(next); return next; });
  }, []);

  const setPreferences = useCallback((p: UserPreferences) => {
    setPreferencesState(p); Storage.savePreferences(p);
  }, []);

  const goToSurvey = useCallback(() => setRoute("survey"), []);

  const resetAll = useCallback(() => {
    Storage.clearAll();
    setUser(null); setSurveyState(emptySurvey()); setCurrentWorkoutState(null);
    setLogsState([]); setSetLogs([]); setMeals([]); setWater([]); setTemplates([]);
    setRuns([]); setProgram([]); setProgramIndex(0);
    setPreferencesState(defaultPreferences()); setRoute("welcome");
  }, []);

  const value: AppStateValue = {
    hydrated, cloudEnabled: supabaseEnabled, authRecovery, route, user, survey, currentWorkout, program, programIndex,
    logs, setLogs, meals, water, templates, runs, preferences,
    signUp, signUpEmail, signInEmail, resetPassword, updatePassword, signOut, setSurvey, setCurrentWorkout, installProgram, startSession,
    finishWorkout, appendSetLogs, addMeal, deleteMeal, addWater, saveTemplate,
    deleteTemplate, addRun, setPreferences, goToSurvey, resetAll,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
