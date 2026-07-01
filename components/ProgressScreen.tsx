"use client";
import React, { useState } from "react";
import { useApp } from "./AppState";
import { ProgressBar, SectionLabel } from "./ui";
import { Icon, type IconName } from "./icons";
import { recoverySnapshot } from "@/lib/muscleRecovery";
import { computeRecords } from "@/lib/personalRecords";
import { muscleDisplayName, recoveryStatus } from "@/lib/muscle";
import { weightUnit } from "@/lib/units";
import { distanceDisplay, distanceUnitLabel, formatDuration, paceDisplay, paceUnitLabel } from "@/lib/runMetrics";
import RunDetailSheet from "./RunDetailSheet";
import type { RunLog } from "@/lib/models";

function startOfWeek(d: Date) {
  const x = new Date(d); const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x;
}

function Stat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-bgCard border border-border p-3.5 text-center">
      <div className="font-display text-[30px] leading-none text-accentGreen">{value}</div>
      <div className="text-textFaint text-[10.5px] mt-1.5 uppercase tracking-wider flex items-center justify-center gap-1">
        <Icon name={icon} size={12} />{label}
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-bgCard border border-border p-5 mb-3">{children}</div>;
}

export default function ProgressScreen() {
  const { logs, setLogs, runs, preferences } = useApp();
  const unit = weightUnit(preferences.units);
  const [runDetail, setRunDetail] = useState<RunLog | null>(null);
  const recentRuns = [...runs].slice(0, 20);
  const totalRunMeters = runs.reduce((a, r) => a + r.distanceMeters, 0);

  const dayset = new Set(logs.map((l) => new Date(l.date).toDateString()));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (dayset.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }
  const totalMinutes = logs.reduce((a, l) => a + l.durationMinutes, 0);
  const totalExercises = logs.reduce((a, l) => a + l.exercisesCompleted, 0);

  const weeks: number[] = Array(12).fill(0);
  const thisWeek = startOfWeek(new Date()).getTime();
  for (const l of logs) {
    const w = startOfWeek(new Date(l.date)).getTime();
    const idx = Math.round((thisWeek - w) / (7 * 86400000));
    if (idx >= 0 && idx < 12) weeks[idx]++;
  }
  const maxWeek = Math.max(1, ...weeks);
  const recovery = recoverySnapshot(setLogs).sort((a, b) => a.recovery - b.recovery);
  const records = computeRecords(setLogs).slice(0, 6);
  const recent = [...logs].slice(0, 5);

  const weekLabels = weeks.map((_, i) => {
    const d = new Date(thisWeek - (11 - i) * 7 * 86400000);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  return (
    <div className="px-6 pt-9">
      <h1 className="font-display text-[44px] text-white leading-none">Progress</h1>
      <p className="text-textMuted text-[14px] mt-1.5 mb-5">Consistency is the win you can control.</p>

      {/* white streak hero */}
      <div className="rounded-[22px] bg-mintBg p-5 mb-3">
        <div className="text-deepGreen/60 text-[12px] font-bold uppercase tracking-wider">Current streak</div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-end gap-2">
            <span className="font-display text-[56px] text-deepGreen leading-none">{streak}</span>
            <span className="text-midDeepGreen text-[18px] font-semibold mb-1.5">{streak === 1 ? "day" : "days"}</span>
          </div>
          <span className="text-accentGreenDark"><Icon name="flame" size={40} /></span>
        </div>
        <div className="text-midDeepGreen text-[13px] mt-2">
          {streak > 0 ? "Keep showing up — momentum is everything." : "Train today to start a streak."}
        </div>
      </div>

      {/* stat tiles */}
      <div className="flex gap-2.5 mb-3">
        <Stat icon="play" value={`${logs.length}`} label="Sessions" />
        <Stat icon="clock" value={`${totalMinutes}`} label="Minutes" />
        <Stat icon="dumbbell" value={`${totalExercises}`} label="Exercises" />
      </div>

      {/* last 12 weeks */}
      <Panel>
        <SectionLabel className="mb-3">Last 12 weeks</SectionLabel>
        <div className="flex items-end gap-1.5 h-28">
          {weeks.slice().reverse().map((c, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div className="w-full rounded-t-md bg-accentGreen" style={{ height: `${(c / maxWeek) * 100}%`, minHeight: c ? 6 : 3, opacity: c ? 1 : 0.18 }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-textFaint text-[10px]">
          {[0, 2, 4, 6, 8, 10].map((i) => <span key={i}>{weekLabels[i]}</span>)}
        </div>
      </Panel>

      {/* recent sessions */}
      <Panel>
        <SectionLabel className="mb-3">Recent sessions</SectionLabel>
        {recent.length === 0 ? (
          <p className="text-textFaint text-[14px]">Finish your first workout and it will land here.</p>
        ) : (
          <div className="space-y-2.5">
            {recent.map((l) => (
              <div key={l.id} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-accentGreen/15 text-accentGreen flex items-center justify-center shrink-0"><Icon name="check" size={17} /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-white text-[14px] font-medium truncate">{l.workoutName}</div>
                  <div className="text-textFaint text-[12px]">{new Date(l.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {l.durationMinutes} min · {l.exercisesCompleted} exercises</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* runs */}
      {runs.length > 0 && (
        <Panel>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Runs</SectionLabel>
            <span className="text-textFaint text-[12px]">{runs.length} run{runs.length === 1 ? "" : "s"} · {distanceDisplay(totalRunMeters, preferences.units)} {distanceUnitLabel(preferences.units)}</span>
          </div>
          <div className="space-y-1">
            {recentRuns.map((r) => {
              const isToday = new Date(r.date).toDateString() === new Date().toDateString();
              return (
                <button key={r.id} onClick={() => setRunDetail(r)}
                  className="w-full flex items-center gap-3 text-left rounded-xl px-1 py-1.5 active:scale-[0.99] transition hover:bg-white/[0.03]">
                  <span className="w-9 h-9 rounded-xl bg-accentGreen/15 text-accentGreen flex items-center justify-center shrink-0"><Icon name="run" size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-white text-[14px] font-medium flex items-center gap-2">
                      <span>{distanceDisplay(r.distanceMeters, preferences.units)} {distanceUnitLabel(preferences.units)} · {formatDuration(r.durationSeconds)}</span>
                      {isToday && <span className="text-[9.5px] font-bold uppercase tracking-wider text-deepGreen bg-accentGreen rounded-full px-2 py-0.5">Today</span>}
                    </div>
                    <div className="text-textFaint text-[12px]">
                      {new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {paceDisplay(r.durationSeconds, r.distanceMeters, preferences.units)} {paceUnitLabel(preferences.units)} · {r.calories} kcal
                    </div>
                  </div>
                  <span className="text-textDisabled"><Icon name="chevron" size={18} /></span>
                </button>
              );
            })}
          </div>
        </Panel>
      )}

      {/* recovery */}
      <Panel>
        <SectionLabel className="mb-3">Muscle recovery</SectionLabel>
        {setLogs.length === 0 ? (
          <p className="text-textFaint text-[14px]">Log some sets to see recovery status here.</p>
        ) : (
          <div className="space-y-2.5">
            {recovery.slice(0, 8).map((m) => {
              const status = recoveryStatus(m.recovery);
              const color = status === "fresh" ? "#4ADE80" : status === "recovering" ? "#FACC15" : "#F87171";
              return (
                <div key={m.muscle} className="flex items-center gap-3">
                  <span className="text-[13px] text-white/90 w-24 shrink-0">{muscleDisplayName[m.muscle]}</span>
                  <ProgressBar value={m.recovery} color={color} />
                  <span className="text-[12px] text-textFaint w-9 text-right tabular-nums">{Math.round(m.recovery * 100)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* PRs */}
      <Panel>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-accentGreen"><Icon name="trophy" size={16} /></span>
          <SectionLabel>Personal records (est. 1RM)</SectionLabel>
        </div>
        {records.length === 0 ? (
          <p className="text-textFaint text-[14px]">Complete weighted sets to start tracking PRs.</p>
        ) : (
          <div className="space-y-2.5">
            {records.map((r) => (
              <div key={r.exerciseName} className="flex items-center justify-between">
                <span className="text-[14px] text-white/90 truncate mr-3">{r.exerciseName}</span>
                <span className="font-display text-xl text-accentGreen shrink-0">
                  {r.best1RM > 0 ? `${Math.round(r.best1RM)} ${unit}` : `${r.bestReps} reps`}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {runDetail && <RunDetailSheet run={runDetail} onClose={() => setRunDetail(null)} />}
    </div>
  );
}
