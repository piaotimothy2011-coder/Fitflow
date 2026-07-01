"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "./AppState";
import { Icon } from "./icons";
import { uuid, type RunLog } from "@/lib/models";
import {
  haversineMeters, distanceDisplay, distanceUnitLabel,
  speedDisplay, speedUnitLabel, paceDisplay, paceUnitLabel,
  formatDuration, estimateCalories, avgPaceSecPerKm,
} from "@/lib/runMetrics";

type Phase = "ready" | "running" | "paused" | "finished";
type GpsState = "idle" | "acquiring" | "tracking" | "denied" | "unsupported";

// Ignore fixes worse than this accuracy (metres) and jitter below this movement.
const MAX_ACCURACY_M = 35;
const MIN_STEP_M = 1.2;

export default function OutdoorRun({ onExit }: { onExit: () => void }) {
  const { preferences, survey, user, addRun } = useApp();
  const units = preferences.units;

  const [phase, setPhase] = useState<Phase>("ready");
  const [gps, setGps] = useState<GpsState>("idle");
  const [elapsed, setElapsed] = useState(0);        // seconds, active only
  const [meters, setMeters] = useState(0);
  const [speedMps, setSpeedMps] = useState(0);      // current speed
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [saved, setSaved] = useState<RunLog | null>(null);

  const weightKg = survey.weightKg ?? user?.weightKg ?? 70;

  // refs for values needed inside geolocation callbacks / intervals
  const watchId = useRef<number | null>(null);
  const tickId = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPoint = useRef<{ lat: number; lng: number; t: number } | null>(null);
  const phaseRef = useRef<Phase>("ready");
  phaseRef.current = phase;

  const gpsSupported = typeof navigator !== "undefined" && "geolocation" in navigator;

  // Warm up GPS on mount so we can show "ready" and pre-seed a position.
  useEffect(() => {
    if (!gpsSupported) { setGps("unsupported"); return; }
    setGps("acquiring");
    navigator.geolocation.getCurrentPosition(
      () => setGps((s) => (s === "tracking" ? s : "idle")),
      (err) => { if (err.code === err.PERMISSION_DENIED) setGps("denied"); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, [gpsSupported]);

  const stopWatch = useCallback(() => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const stopTick = useCallback(() => {
    if (tickId.current != null) { clearInterval(tickId.current); tickId.current = null; }
  }, []);

  // cleanup on unmount
  useEffect(() => () => { stopWatch(); stopTick(); }, [stopWatch, stopTick]);

  const onPosition = useCallback((pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy: acc, speed } = pos.coords;
    setAccuracy(acc ?? null);
    setGps("tracking");
    if (typeof speed === "number" && speed >= 0) setSpeedMps(speed);

    if (phaseRef.current !== "running") {
      // keep a reference point while paused/ready but don't accumulate distance
      lastPoint.current = { lat: latitude, lng: longitude, t: pos.timestamp };
      return;
    }
    const prev = lastPoint.current;
    lastPoint.current = { lat: latitude, lng: longitude, t: pos.timestamp };
    if (!prev) return;
    if (acc != null && acc > MAX_ACCURACY_M) return; // too noisy to trust

    const step = haversineMeters(prev.lat, prev.lng, latitude, longitude);
    if (step < MIN_STEP_M) return; // ignore GPS jitter while standing still
    setMeters((m) => m + step);

    // Fallback speed from displacement when the device doesn't report speed.
    if (speed == null || speed < 0) {
      const dt = (pos.timestamp - prev.t) / 1000;
      if (dt > 0) setSpeedMps(step / dt);
    }
  }, []);

  const onGeoError = useCallback((err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) { setGps("denied"); }
  }, []);

  const beginWatch = useCallback(() => {
    if (!gpsSupported || watchId.current != null) return;
    watchId.current = navigator.geolocation.watchPosition(onPosition, onGeoError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 1000,
    });
  }, [gpsSupported, onPosition, onGeoError]);

  const startTick = useCallback(() => {
    stopTick();
    tickId.current = setInterval(() => {
      if (phaseRef.current === "running") setElapsed((e) => e + 1);
    }, 1000);
  }, [stopTick]);

  const start = () => {
    setPhase("running");
    lastPoint.current = null;
    setSpeedMps(0);
    beginWatch();
    startTick();
  };
  const pause = () => { setPhase("paused"); setSpeedMps(0); };
  const resume = () => { setPhase("running"); lastPoint.current = null; };

  const finish = () => {
    stopWatch();
    stopTick();
    setPhase("finished");
    const run: RunLog = {
      id: uuid(),
      date: new Date().toISOString(),
      durationSeconds: elapsed,
      distanceMeters: meters,
      calories: estimateCalories(meters, weightKg),
      avgPaceSecPerKm: avgPaceSecPerKm(elapsed, meters),
    };
    if (meters > 5 || elapsed > 10) {
      addRun(run);
      setSaved(run);
    } else {
      setSaved(null);
    }
  };

  const reset = () => {
    stopWatch();
    stopTick();
    setPhase("ready");
    setElapsed(0);
    setMeters(0);
    setSpeedMps(0);
    setSaved(null);
    lastPoint.current = null;
  };

  const calories = estimateCalories(meters, weightKg);

  const phaseLabel =
    phase === "ready" ? "Ready" :
    phase === "running" ? "Running" :
    phase === "paused" ? "Paused" : "Finished";

  const gpsChip =
    gps === "tracking" ? { text: `GPS locked${accuracy != null ? ` · ±${Math.round(accuracy)} m` : ""}`, ok: true } :
    gps === "acquiring" ? { text: "Acquiring GPS…", ok: false } :
    gps === "denied" ? { text: "Location permission denied", ok: false } :
    gps === "unsupported" ? { text: "GPS not available on this device", ok: false } :
    { text: "GPS ready", ok: true };

  const helper =
    gps === "denied"
      ? "Enable location access for this site in your browser settings, then reload."
      : gps === "unsupported"
      ? "Open FitFlow on a phone with GPS to track outdoor runs."
      : phase === "ready"
      ? "GPS is ready. Start your run when you're outside."
      : phase === "running"
      ? "Tracking your run — keep your screen on for best accuracy."
      : phase === "paused"
      ? "Paused. Resume when you're moving again."
      : saved
      ? "Nice work! This run has been saved to Progress."
      : "Run was too short to save.";

  const Stat = ({ label, value, unit }: { label: string; value: string; unit?: string }) => (
    <div className="rounded-2xl bg-bgCard border border-border p-4">
      <div className="text-textFaint text-[11px] uppercase tracking-wider">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="font-display text-[30px] leading-none text-white tabular-nums">{value}</span>
        {unit && <span className="text-textFaint text-[13px]">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <button onClick={onExit} aria-label="Close"
          className="w-9 h-9 rounded-full bg-bgCard border border-border flex items-center justify-center text-textMuted hover:text-white transition active:scale-95">
          <Icon name="close" size={18} />
        </button>
        <div className="font-display text-[20px] text-white">Outdoor Run</div>
        <span className="inline-flex items-center gap-1.5 text-accentGreen text-[12px] font-semibold">
          <Icon name="run" size={16} />
        </span>
      </div>

      <div className="flex-1 px-6">
        {/* timer hero */}
        <div className="rounded-[24px] bg-mintBg p-6 text-center">
          <div className="text-deepGreen/60 text-[12px] font-bold uppercase tracking-[0.16em]">{phaseLabel}</div>
          <div className="font-display text-[64px] leading-[1.05] text-deepGreen tabular-nums mt-1">
            {formatDuration(elapsed)}
          </div>
        </div>

        {/* stat grid */}
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          <Stat label="Distance" value={distanceDisplay(meters, units)} unit={distanceUnitLabel(units)} />
          <Stat label="Pace" value={paceDisplay(elapsed, meters, units)} unit={paceUnitLabel(units)} />
          <Stat label="Speed" value={speedDisplay(phase === "running" ? speedMps : 0, units)} unit={speedUnitLabel(units)} />
          <Stat label="Calories" value={`${calories}`} unit="kcal" />
        </div>

        {/* gps status */}
        <div className="mt-4 flex items-center gap-2">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium border
            ${gpsChip.ok ? "bg-accentGreen/12 border-accentGreen/30 text-accentGreen" : "bg-white/[0.05] border-border text-textMuted"}`}>
            <span className={`w-2 h-2 rounded-full ${gpsChip.ok ? "bg-accentGreen animate-pulse" : "bg-textFaint"}`} />
            {gpsChip.text}
          </span>
        </div>
        <p className="text-textFaint text-[13px] mt-3 leading-snug">{helper}</p>
      </div>

      {/* controls */}
      <div className="px-6 py-5 sticky bottom-0 bg-bgPhone/95 backdrop-blur border-t border-border">
        <div className="flex items-center gap-3">
          {phase === "ready" && (
            <button onClick={start}
              className="flex-1 rounded-2xl bg-accentGreen text-deepGreen font-bold py-4 text-[16px] active:scale-[0.98] transition flex items-center justify-center gap-2">
              <Icon name="play" size={18} /> Start
            </button>
          )}

          {phase === "running" && (
            <>
              <button onClick={pause}
                className="flex-1 rounded-2xl border border-borderStrong text-white font-semibold py-4 text-[15px] active:scale-[0.98] transition hover:bg-white/5">
                Pause
              </button>
              <button onClick={finish}
                className="flex-1 rounded-2xl bg-accentGreen text-deepGreen font-bold py-4 text-[15px] active:scale-[0.98] transition">
                Finish
              </button>
            </>
          )}

          {phase === "paused" && (
            <>
              <button onClick={resume}
                className="flex-1 rounded-2xl bg-accentGreen text-deepGreen font-bold py-4 text-[15px] active:scale-[0.98] transition flex items-center justify-center gap-2">
                <Icon name="play" size={17} /> Resume
              </button>
              <button onClick={finish}
                className="flex-1 rounded-2xl border border-borderStrong text-white font-semibold py-4 text-[15px] active:scale-[0.98] transition hover:bg-white/5">
                Finish
              </button>
            </>
          )}

          {phase === "finished" && (
            <>
              <button onClick={reset}
                className="flex-1 rounded-2xl bg-accentGreen text-deepGreen font-bold py-4 text-[15px] active:scale-[0.98] transition">
                New run
              </button>
              <button onClick={onExit}
                className="flex-1 rounded-2xl border border-borderStrong text-white font-semibold py-4 text-[15px] active:scale-[0.98] transition hover:bg-white/5">
                Done
              </button>
            </>
          )}

          {(phase === "running" || phase === "paused") && (
            <button onClick={reset} aria-label="Reset"
              className="w-14 shrink-0 rounded-2xl border border-borderStrong text-textMuted hover:text-white py-4 flex items-center justify-center active:scale-[0.98] transition">
              <Icon name="regenerate" size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
