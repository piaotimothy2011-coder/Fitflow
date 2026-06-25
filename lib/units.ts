// Ported subset of UnitFormatter from Models/User.swift
import type { UnitSystem } from "./models";

export function weightUnit(units: UnitSystem) { return units === "metric" ? "kg" : "lb"; }
export function weightToDisplay(kg: number, units: UnitSystem) { return units === "metric" ? kg : kg * 2.20462; }
export function weightFromDisplay(v: number, units: UnitSystem) { return units === "metric" ? v : v / 2.20462; }
export function heightToDisplay(cm: number, units: UnitSystem) { return units === "metric" ? cm : cm / 2.54; }
export function heightFromDisplay(v: number, units: UnitSystem) { return units === "metric" ? v : v * 2.54; }

export function trimmed(value: number): string {
  const r = Math.round(value * 10) / 10;
  return r === Math.round(r) ? String(Math.round(r)) : r.toFixed(1);
}
export function formatWeight(kg: number, units: UnitSystem): string {
  return `${trimmed(weightToDisplay(kg, units))} ${weightUnit(units)}`;
}
export function formatHeight(cm: number, units: UnitSystem): string {
  if (units === "metric") return `${Math.round(cm)} cm`;
  const totalInches = cm / 2.54;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches % 12);
  if (inches === 12) { feet += 1; inches = 0; }
  return `${feet}' ${inches}"`;
}
export function volumeUnit(units: UnitSystem) { return units === "metric" ? "ml" : "oz"; }
export function volumeOzToDisplay(oz: number, units: UnitSystem): number {
  if (units === "imperial") return oz;
  return Math.round((oz * 29.5735) / 10) * 10;
}
export function waterStepDisplay(units: UnitSystem) { return units === "metric" ? 250 : 8; }
export function waterStepOz(units: UnitSystem) { return units === "metric" ? 8 : 8; }
