"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  type Survey, type Workout, type WorkoutLog, type User, type UserPreferences,
  type MealEntry, type WaterEntry, type SetLog, type WorkoutTemplate,
  emptySurvey, defaultPreferences, uuid,
  exerciseCompletedSetCount,
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
  route: Route;
  user: User | null;
  survey: Survey;
  currentWorkout: Workout | null;
  logs: WorkoutLog[];
  setLogs: SetLog[];
  meals: MealEntry[];
  water: WaterEntry[];
  templates: WorkoutTemplate[];
  preferences: UserPreferences;
  // actions
  signUp: (name: string, email?: string) => void;               // local-only mode
  signUpEmail: (name: string, email: string, password: string) => Promise<AuthResult>;
  signInEmail: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => void;
  setSurvey: (s: Survey) => void;
  setCurrentWorkout: (w: Workout | null) => void;
  finishWorkout: (w: Workout, durationMinutes: number) => void;
  appendSetLogs: (logs: SetLog[]) => void;
  addMeal: (m: MealEntry) => void;
  deleteMeal: (id: string) => void;
  addWater: (oz: number) => void;
  saveTemplate: (name: string, w: Workout) => void;
  deleteTemplate: (id: string) => void;
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
  const [user, setUser] = useState<User | null>(null);
  const [survey, setSurveyState] = useState<Survey>(emptySurvey());
  const [currentWorkout, setCurrentWorkoutState] = useState<Workout | null>(null);
  const [logs, setLogsState] = useState<WorkoutLog[]>([]);
  const [setLogs, setSetLogs] = useState<SetLog[]>([]);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [water, setWater] = useState<WaterEntry[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
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

    // Cloud mode: restore session if present.
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

  const signOut = useCallback(() => {
    stopSync();
    if (supabase) void supabase.auth.signOut();
    Storage.clearAll();
    setUser(null); setSurveyState(emptySurvey()); setCurrentWorkoutState(null);
    setLogsState([]); setSetLogs([]); setMeals([]); setWater([]); setTemplates([]);
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
    setCurrentWorkoutState(null); Storage.saveCurrentWorkout(null);
    setRoute("survey");
  }, [survey.goal]);

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

  const setPreferences = useCallback((p: UserPreferences) => {
    setPreferencesState(p); Storage.savePreferences(p);
  }, []);

  const goToSurvey = useCallback(() => setRoute("survey"), []);

  const resetAll = useCallback(() => {
    Storage.clearAll();
    setUser(null); setSurveyState(emptySurvey()); setCurrentWorkoutState(null);
    setLogsState([]); setSetLogs([]); setMeals([]); setWater([]); setTemplates([]);
    setPreferencesState(defaultPreferences()); setRoute("welcome");
  }, []);

  const value: AppStateValue = {
    hydrated, cloudEnabled: supabaseEnabled, route, user, survey, currentWorkout,
    logs, setLogs, meals, water, templates, preferences,
    signUp, signUpEmail, signInEmail, signOut, setSurvey, setCurrentWorkout,
    finishWorkout, appendSetLogs, addMeal, deleteMeal, addWater, saveTemplate,
    deleteTemplate, setPreferences, goToSurvey, resetAll,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
