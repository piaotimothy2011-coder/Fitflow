// Geo + formatting helpers for the outdoor run tracker.
import type { UnitSystem } from "./models";

// Great-circle distance between two lat/lng points, in metres.
export function haversineMeters(
  aLat: number, aLng: number, bLat: number, bLng: number
): number {
  const R = 6371000; // earth radius, metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const METERS_PER_MILE = 1609.344;

// Distance in the user's preferred unit (miles or km).
export function distanceDisplay(meters: number, units: UnitSystem): string {
  const v = units === "imperial" ? meters / METERS_PER_MILE : meters / 1000;
  return v.toFixed(2);
}
export function distanceUnitLabel(units: UnitSystem): string {
  return units === "imperial" ? "mi" : "km";
}

// Speed in mph or km/h from metres-per-second.
export function speedDisplay(metersPerSec: number, units: UnitSystem): string {
  const v = units === "imperial" ? metersPerSec * 2.2369363 : metersPerSec * 3.6;
  return v.toFixed(1);
}
export function speedUnitLabel(units: UnitSystem): string {
  return units === "imperial" ? "mph" : "km/h";
}

// Pace = seconds per mile / km, rendered as M:SS. Returns "--" when we don't
// have enough movement yet to compute a meaningful pace.
export function paceDisplay(
  durationSeconds: number, meters: number, units: UnitSystem
): string {
  const distUnit = units === "imperial" ? meters / METERS_PER_MILE : meters / 1000;
  if (distUnit < 0.02 || durationSeconds < 3) return "--";
  const secPerUnit = durationSeconds / distUnit;
  if (!isFinite(secPerUnit) || secPerUnit > 60 * 60) return "--";
  const m = Math.floor(secPerUnit / 60);
  const s = Math.round(secPerUnit % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
export function paceUnitLabel(units: UnitSystem): string {
  return units === "imperial" ? "/mi" : "/km";
}

// Average pace in seconds per kilometre (for stored RunLog).
export function avgPaceSecPerKm(durationSeconds: number, meters: number): number {
  const km = meters / 1000;
  if (km < 0.02 || durationSeconds < 3) return 0;
  return Math.round(durationSeconds / km);
}

// Clock timer as M:SS or H:MM:SS.
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

// Calorie estimate. Running/walking burns roughly ~1 kcal per kg of body
// weight per km travelled; we nudge it up slightly for running effort.
export function estimateCalories(meters: number, weightKg: number): number {
  const km = meters / 1000;
  const w = weightKg > 0 ? weightKg : 70;
  return Math.round(km * w * 0.98);
}
