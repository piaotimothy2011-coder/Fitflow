"use client";
import React from "react";
import { useApp } from "./AppState";
import { ProgressBar, SectionLabel } from "./ui";
import { Icon, type IconName } from "./icons";
import { recoverySnapshot } from "@/lib/muscleRecovery";
import { computeRecords } from "@/lib/personalRecords";
import { muscleDisplayName, recoveryStatus } from "@/lib/muscle";
import { weightUnit } from "@/lib/units";

function startOfWeek(d: Date) {
  const x = new Date(d); const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x;
}

function Stat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-bgCard border border-border p-3.5">
      <span className="text-accentGreen"><Icon name={icon} size={18} /></span>
      <div className="font-display text-[28px] leading-none text-white mt-2">{value}</div>
      <div className="text-textFaint text-[11px] mt-1.5 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-bgCard border border-border p-5 mb-3">{children}</div>;
}

export default function ProgressScreen() {
  const { logs, setLogs, preferences } = useApp();
  const unit = weightUnit(preferences.units);

  const dayset = new Set(logs.map((l) => new Date(l.date).toDateString()));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (dayset.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }
  const totalMinutes = logs.reduce((a, l) => a + l.durationMinutes, 0);

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

  return (
    <div className="px-6 pt-9">
      <h1 className="font-display text-[44px] text-white leading-none mb-5">Progress</h1>

      <div className="flex gap-2.5 mb-3">
        <Stat icon="flame" value={`${streak}`} label="Day streak" />
        <Stat icon="dumbbell" value={`${logs.length}`} label="Workouts" />
        <Stat icon="clock" value={`${totalMinutes}`} label="Minutes" />
      </div>

      <Panel>
        <SectionLabel className="mb-3">Last 12 weeks</SectionLabel>
        <div className="flex items-end gap-1.5 h-28">
          {weeks.slice().reverse().map((c, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div className="w-full rounded-t-md bg-accentGreen" style={{ height: `${(c / maxWeek) * 100}%`, minHeight: c ? 6 : 3, opacity: c ? 1 : 0.18 }} />
            </div>
          ))}
        </div>
      </Panel>

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
    </div>
  );
}
