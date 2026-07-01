"use client";
import React from "react";
import { useApp } from "./AppState";
import { Icon } from "./icons";
import type { RunLog } from "@/lib/models";
import RunRouteMap from "./RunRouteMap";
import {
  distanceDisplay, distanceUnitLabel, speedDisplay, speedUnitLabel,
  paceDisplay, paceUnitLabel, formatDuration,
} from "@/lib/runMetrics";

export default function RunDetailSheet({ run, onClose }: { run: RunLog; onClose: () => void }) {
  const { preferences } = useApp();
  const units = preferences.units;
  const topSpeed = run.maxSpeedMps ?? 0;
  const cadence = run.steps && run.durationSeconds > 0 ? Math.round((run.steps / run.durationSeconds) * 60) : 0;
  const d = new Date(run.date);
  const dateLabel = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const timeLabel = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const Stat = ({ label, value, unit }: { label: string; value: string; unit?: string }) => (
    <div className="rounded-2xl bg-bgCard border border-border p-4">
      <div className="text-textFaint text-[11px] uppercase tracking-wider">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="font-display text-[26px] leading-none text-white tabular-nums">{value}</span>
        {unit && <span className="text-textFaint text-[12px]">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="w-full max-w-[440px] bg-bgPhone overflow-y-auto no-scrollbar ff-pop">
        <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-bgPhone/95 backdrop-blur z-10">
          <button onClick={onClose} aria-label="Back"
            className="w-9 h-9 rounded-full bg-bgCard border border-border flex items-center justify-center text-textMuted hover:text-white transition active:scale-95">
            <Icon name="back" size={18} />
          </button>
          <div className="font-display text-[20px] text-white">Run details</div>
          <span className="w-9" />
        </div>

        <div className="px-6 pb-10">
          <div className="text-accentGreen text-[12px] font-bold uppercase tracking-wider">{dateLabel}</div>
          <div className="text-textFaint text-[12px] mb-3">{timeLabel}</div>

          {/* distance hero */}
          <div className="rounded-[22px] bg-mintBg p-5 flex items-end justify-between">
            <div>
              <div className="text-deepGreen/60 text-[11px] font-bold uppercase tracking-wider">Distance</div>
              <div className="font-display text-[46px] text-deepGreen leading-none mt-1">{distanceDisplay(run.distanceMeters, units)}</div>
            </div>
            <div className="text-midDeepGreen text-[16px] font-semibold mb-1.5">{distanceUnitLabel(units)}</div>
          </div>

          {/* route map */}
          <div className="mt-3"><RunRouteMap path={run.path ?? []} /></div>

          {/* stats */}
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <Stat label="Time" value={formatDuration(run.durationSeconds)} />
            <Stat label="Avg pace" value={paceDisplay(run.durationSeconds, run.distanceMeters, units)} unit={paceUnitLabel(units)} />
            <Stat label="Top speed" value={speedDisplay(topSpeed, units)} unit={speedUnitLabel(units)} />
            <Stat label="Calories" value={`${run.calories}`} unit="kcal" />
            {cadence > 0 && <Stat label="Avg cadence" value={`${cadence}`} unit="spm" />}
          </div>

          <button onClick={onClose}
            className="mt-8 w-full rounded-2xl border border-borderStrong text-white font-medium py-3.5 text-[15px] transition active:scale-[0.98] hover:bg-white/5">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
