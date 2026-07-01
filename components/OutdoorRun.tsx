"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "./AppState";
import { Icon } from "./icons";
import { uuid, type RunLog } from "@/lib/models";
import RunRouteMap from "./RunRouteMap";
import {
  haversineMeters, distanceDisplay, distanceUnitLabel,
  speedDisplay, speedUnitLabel, paceDisplay, paceUnitLabel,
  formatDuration, estimateCalories, avgPaceSecPerKm,
} from "@/lib/runMetrics";

type Phase = "ready" | "running" | "paused" | "finished";
type GpsState = "idle" | "acquiring" | "tracking" | "denied" | "unsupported";
type MotionState = "idle" | "active" | "denied" | "unsupported";

// GPS jitter filters.
const MAX_ACCURACY_M = 35;
const MIN_STEP_M = 1.2;
// Motion (accelerometer) footfall detection.
const STEP_ACCEL_THRESH = 2.2; // m/s^2 deviation from baseline that marks a footfall
const STEP_MIN_INTERVAL = 260; // ms debounce between counted steps
const MOTION_WINDOW = 3000;    // ms — running motion considered "live" within this
const VEHICLE_SPEED = 2.5;     // m/s (~9 km/h) — above brisk walking
const VEHICLE_GRACE = 6000;    // ms of fast movement with no footfalls before flagging a vehicle

export default function OutdoorRun({ onExit }: { onExit: () => void }) {
  const { preferences, survey, user, addRun } = useApp();
  const units = preferences.units;

  const [phase, setPhase] = useState<Phase>("ready");
  const [gps, setGps] = useState<GpsState>("idle");
  const [motion, setMotion] = useState<MotionState>("idle");
  const [cadence, setCadence] = useState(0);   // steps per minute
  const [vehicle, setVehicle] = useState(false);
  const [elapsed, setElapsed] = useState(0);   // seconds, active only
  const [meters, setMeters] = useState(0);
  const [speedMps, setSpeedMps] = useState(0); // current speed
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [saved, setSaved] = useState<RunLog | null>(null);

  const weightKg = survey.weightKg ?? user?.weightKg ?? 70;

  // refs used inside geolocation / motion / interval callbacks
  const watchId = useRef<number | null>(null);
  const tickId = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPoint = useRef<{ lat: number; lng: number; t: number } | null>(null);
  const phaseRef = useRef<Phase>("ready");
  phaseRef.current = phase;
  const speedRef = useRef(0);
  const maxSpeedRef = useRef(0);
  const pathRef = useRef<{ lat: number; lng: number }[]>([]);
  const motionActiveRef = useRef(false);
  const stepTimes = useRef<number[]>([]);
  const stepTotalRef = useRef(0);
  const accelBuf = useRef<number[]>([]);
  const lastStepAt = useRef(0);
  const lastMotionAt = useRef(0);
  const vehicleRef = useRef(false);
  const noMotionSince = useRef<number | null>(null);

  const gpsSupported = typeof navigator !== "undefined" && "geolocation" in navigator;
  const motionSupported = typeof window !== "undefined" && typeof window.DeviceMotionEvent !== "undefined";

  // Warm up GPS on mount so we can prompt for permission and show "ready".
  useEffect(() => {
    if (!gpsSupported) { setGps("unsupported"); return; }
    setGps("acquiring");
    navigator.geolocation.getCurrentPosition(
      () => setGps((s) => (s === "tracking" ? s : "idle")),
      (err) => { if (err.code === err.PERMISSION_DENIED) setGps("denied"); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    if (!motionSupported) setMotion("unsupported");
  }, [gpsSupported, motionSupported]);

  // ---- accelerometer: count footfalls to confirm the user is on foot ----
  const onMotion = useCallback((e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const mag = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
    const buf = accelBuf.current;
    buf.push(mag);
    if (buf.length > 40) buf.shift();
    const mean = buf.reduce((s, v) => s + v, 0) / buf.length;
    const dev = Math.abs(mag - mean);
    const now = performance.now();
    if (dev > STEP_ACCEL_THRESH && now - lastStepAt.current > STEP_MIN_INTERVAL) {
      lastStepAt.current = now;
      lastMotionAt.current = now;
      stepTimes.current.push(now);
      if (phaseRef.current === "running") stepTotalRef.current += 1;
    }
  }, []);

  const requestMotion = useCallback(async () => {
    if (!motionSupported) { setMotion("unsupported"); return; }
    try {
      const DM = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof DM.requestPermission === "function") {
        const res = await DM.requestPermission();
        if (res !== "granted") { setMotion("denied"); return; }
      }
      window.addEventListener("devicemotion", onMotion);
      motionActiveRef.current = true;
      setMotion("active");
    } catch {
      setMotion("unsupported");
    }
  }, [motionSupported, onMotion]);

  const stopMotion = useCallback(() => {
    if (typeof window !== "undefined") window.removeEventListener("devicemotion", onMotion);
    motionActiveRef.current = false;
  }, [onMotion]);

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
  useEffect(() => () => { stopWatch(); stopTick(); stopMotion(); }, [stopWatch, stopTick, stopMotion]);

  const onPosition = useCallback((pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy: acc, speed } = pos.coords;
    setAccuracy(acc ?? null);
    setGps("tracking");
    if (typeof speed === "number" && speed >= 0) {
      setSpeedMps(speed); speedRef.current = speed;
      if (speed > maxSpeedRef.current) maxSpeedRef.current = speed;
    }

    if (phaseRef.current !== "running") {
      lastPoint.current = { lat: latitude, lng: longitude, t: pos.timestamp };
      return;
    }
    if (acc != null && acc > MAX_ACCURACY_M) return; // too noisy to trust
    const prev = lastPoint.current;
    lastPoint.current = { lat: latitude, lng: longitude, t: pos.timestamp };
    if (!prev) { pathRef.current.push({ lat: latitude, lng: longitude }); return; }

    const step = haversineMeters(prev.lat, prev.lng, latitude, longitude);
    if (step < MIN_STEP_M) return; // ignore GPS jitter while standing still

    if (speed == null || speed < 0) {
      const dt = (pos.timestamp - prev.t) / 1000;
      if (dt > 0) {
        const v = step / dt; setSpeedMps(v); speedRef.current = v;
        if (v > maxSpeedRef.current) maxSpeedRef.current = v;
      }
    }

    // Don't count distance while a vehicle is suspected (moving fast, no footfalls).
    if (vehicleRef.current) return;
    setMeters((m) => m + step);
    pathRef.current.push({ lat: latitude, lng: longitude });
  }, []);

  const onGeoError = useCallback((err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) { setGps("denied"); }
  }, []);

  const beginWatch = useCallback(() => {
    if (!gpsSupported || watchId.current != null) return;
    watchId.current = navigator.geolocation.watchPosition(onPosition, onGeoError, {
      enableHighAccuracy: true, timeout: 15000, maximumAge: 1000,
    });
  }, [gpsSupported, onPosition, onGeoError]);

  const startTick = useCallback(() => {
    stopTick();
    tickId.current = setInterval(() => {
      if (phaseRef.current === "running") setElapsed((e) => e + 1);

      // Evaluate motion each second (only when the sensor is active).
      if (!motionActiveRef.current) return;
      const now = performance.now();
      stepTimes.current = stepTimes.current.filter((t) => now - t < 20000);
      setCadence(Math.round(stepTimes.current.length * 3)); // steps/min over a 20s window
      const moving = now - lastMotionAt.current < MOTION_WINDOW;

      if (phaseRef.current === "running" && speedRef.current > VEHICLE_SPEED && !moving) {
        if (noMotionSince.current == null) noMotionSince.current = now;
        else if (now - noMotionSince.current > VEHICLE_GRACE) {
          if (!vehicleRef.current) { vehicleRef.current = true; setVehicle(true); }
        }
      } else {
        noMotionSince.current = null;
        if (vehicleRef.current) { vehicleRef.current = false; setVehicle(false); }
      }
    }, 1000);
  }, [stopTick]);

  const start = () => {
    setPhase("running");
    lastPoint.current = null;
    setSpeedMps(0);
    speedRef.current = 0;
    void requestMotion();
    beginWatch();
    startTick();
  };
  const pause = () => { setPhase("paused"); setSpeedMps(0); speedRef.current = 0; };
  const resume = () => { setPhase("running"); lastPoint.current = null; };

  const finish = () => {
    stopWatch();
    stopTick();
    stopMotion();
    setPhase("finished");
    const run: RunLog = {
      id: uuid(),
      date: new Date().toISOString(),
      durationSeconds: elapsed,
      distanceMeters: meters,
      calories: estimateCalories(meters, weightKg),
      avgPaceSecPerKm: avgPaceSecPerKm(elapsed, meters),
      maxSpeedMps: maxSpeedRef.current,
      steps: stepTotalRef.current,
      path: pathRef.current.slice(),
    };
    if (meters > 5 || elapsed > 10) { addRun(run); setSaved(run); }
    else setSaved(null);
  };

  const reset = () => {
    stopWatch();
    stopTick();
    stopMotion();
    setPhase("ready");
    setElapsed(0);
    setMeters(0);
    setSpeedMps(0);
    speedRef.current = 0;
    maxSpeedRef.current = 0;
    stepTotalRef.current = 0;
    setSaved(null);
    setVehicle(false);
    setCadence(0);
    setMotion(motionSupported ? "idle" : "unsupported");
    lastPoint.current = null;
    pathRef.current = [];
    stepTimes.current = [];
    accelBuf.current = [];
    vehicleRef.current = false;
    noMotionSince.current = null;
  };

  const calories = estimateCalories(meters, weightKg);
  const displaySpeed = phase === "running" ? speedMps : (phase === "finished" && elapsed > 0 ? meters / elapsed : 0);

  const phaseLabel =
    phase === "ready" ? "Ready" : phase === "running" ? "Running" :
    phase === "paused" ? "Paused" : "Finished";

  const gpsChip =
    gps === "tracking" ? { text: `GPS locked${accuracy != null ? ` · ±${Math.round(accuracy)} m` : ""}`, ok: true } :
    gps === "acquiring" ? { text: "Acquiring GPS…", ok: false } :
    gps === "denied" ? { text: "Location denied", ok: false } :
    gps === "unsupported" ? { text: "GPS unavailable", ok: false } :
    { text: "GPS ready", ok: true };

  const motionChip =
    motion === "active" && vehicle ? { text: "No running motion", ok: false } :
    motion === "active" && cadence > 0 ? { text: `On foot · ${cadence} spm`, ok: true } :
    motion === "active" ? { text: "Motion check on", ok: true } :
    motion === "denied" ? { text: "Motion denied", ok: false } :
    motion === "unsupported" ? { text: "Motion N/A", ok: false } :
    { text: "Motion check ready", ok: true };

  const helper =
    gps === "denied" ? "Enable location access for this site in your browser settings, then reload."
    : gps === "unsupported" ? "Open FitFlow on a phone with GPS to track outdoor runs."
    : vehicle ? "No running motion detected — distance is paused. This looks like a vehicle. Keep running to resume."
    : phase === "ready" ? "GPS and motion check are ready. Start your run when you're outside."
    : phase === "running" ? "Tracking your run — motion check confirms you're on foot. Keep your screen on."
    : phase === "paused" ? "Paused. Resume when you're moving again."
    : saved ? (motion === "active" ? "Nice work — motion-verified and saved to Progress." : "Nice work! Saved to Progress.")
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

  const Chip = ({ text, ok }: { text: string; ok: boolean }) => (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium border
      ${ok ? "bg-accentGreen/12 border-accentGreen/30 text-accentGreen" : "bg-amber-400/10 border-amber-400/30 text-amber-300"}`}>
      <span className={`w-2 h-2 rounded-full ${ok ? "bg-accentGreen animate-pulse" : "bg-amber-400"}`} />
      {text}
    </span>
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

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-4">
        {/* timer hero */}
        <div className={`rounded-[24px] p-6 text-center transition-colors ${vehicle ? "bg-amber-100" : "bg-mintBg"}`}>
          <div className="text-deepGreen/60 text-[12px] font-bold uppercase tracking-[0.16em]">{phaseLabel}</div>
          <div className="font-display text-[64px] leading-[1.05] text-deepGreen tabular-nums mt-1">
            {formatDuration(elapsed)}
          </div>
        </div>

        {/* stat grid */}
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          <Stat label="Distance" value={distanceDisplay(meters, units)} unit={distanceUnitLabel(units)} />
          <Stat label="Pace" value={paceDisplay(elapsed, meters, units)} unit={paceUnitLabel(units)} />
          <Stat label="Speed" value={speedDisplay(displaySpeed, units)} unit={speedUnitLabel(units)} />
          <Stat label="Calories" value={`${calories}`} unit="kcal" />
        </div>

        {/* route map once finished */}
        {phase === "finished" && (saved?.path?.length ?? 0) > 1 && (
          <div className="mt-3">
            <div className="text-textFaint text-[11px] uppercase tracking-wider mb-2 px-1">Your route</div>
            <RunRouteMap path={saved!.path!} />
          </div>
        )}

        {/* status chips */}
        {phase !== "finished" && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Chip text={gpsChip.text} ok={gpsChip.ok} />
            <Chip text={motionChip.text} ok={motionChip.ok} />
          </div>
        )}
        <p className={`text-[13px] mt-3 leading-snug ${vehicle ? "text-amber-300" : "text-textFaint"}`}>{helper}</p>
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
