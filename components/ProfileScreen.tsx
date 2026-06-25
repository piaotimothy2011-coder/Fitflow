"use client";

import { useApp } from "./AppState";
import { Card, GhostButton, Chip } from "./ui";
import { userInitials } from "@/lib/models";

export default function ProfileScreen() {
  const app = useApp();
  const user = app.user;
  const prefs = app.preferences;

  const setUnits = (units: "metric" | "imperial") =>
    app.setPreferences({ ...prefs, units });
  const setRest = (defaultRestSeconds: number) =>
    app.setPreferences({ ...prefs, defaultRestSeconds });

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-4">
      <Card className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-deepGreen text-accentGreen font-display text-2xl">
          {user ? userInitials(user) : "YOU"}
        </div>
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-white">
            {user?.name ?? "Athlete"}
          </div>
          <div className="truncate text-sm text-textFaint">
            {user?.email ?? "—"}
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-3 text-sm font-semibold text-textMuted">Units</div>
        <div className="flex gap-2">
          <Chip label="Imperial (lb)" selected={prefs.units === "imperial"} onClick={() => setUnits("imperial")} />
          <Chip label="Metric (kg)" selected={prefs.units === "metric"} onClick={() => setUnits("metric")} />
        </div>
      </Card>

      <Card>
        <div className="mb-3 text-sm font-semibold text-textMuted">Default rest timer</div>
        <div className="flex flex-wrap gap-2">
          {[45, 60, 90, 120, 180].map((s) => (
            <Chip
              key={s}
              label={s < 60 ? `${s}s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`}
              selected={prefs.defaultRestSeconds === s}
              onClick={() => setRest(s)}
            />
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-3 text-sm font-semibold text-textMuted">Your plan</div>
        <div className="text-sm text-textFaint">
          {app.survey && app.survey.goal
            ? "Survey complete. Regenerate workouts anytime from Home."
            : "No survey yet."}
        </div>
        <div className="mt-3">
          <GhostButton onClick={app.goToSurvey}>Retake survey</GhostButton>
        </div>
      </Card>

      <div className="flex flex-col gap-2 pt-2">
        <GhostButton onClick={app.signOut}>Sign out</GhostButton>
        <button
          onClick={() => {
            if (confirm("This erases all your data on this device. Continue?")) {
              app.resetAll();
            }
          }}
          className="rounded-button py-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10"
        >
          Reset all data
        </button>
      </div>

      <div className="pt-2 text-center text-xs text-textFaint">
        FitFlow Web · local-only data
      </div>
    </div>
  );
}
