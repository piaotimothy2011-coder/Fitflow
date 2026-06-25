"use client";
import React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-bgCard border border-border rounded-card ${className}`}>{children}</div>
  );
}

export function PrimaryButton(
  { children, onClick, disabled, className = "", type = "button" }:
  { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string; type?: "button" | "submit" }
) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-button bg-accentGreen text-deepGreen font-semibold py-3.5 px-5 text-[15px]
        transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton(
  { children, onClick, className = "" }:
  { children: React.ReactNode; onClick?: () => void; className?: string }
) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-button border border-borderStrong text-white font-medium py-3.5 px-5 text-[15px]
        transition active:scale-[0.98] hover:bg-white/5 ${className}`}
    >
      {children}
    </button>
  );
}

export function Chip(
  { label, selected, onClick, icon }:
  { label: string; selected: boolean; onClick: () => void; icon?: React.ReactNode }
) {
  return (
    <button
      onClick={onClick}
      className={`rounded-chip px-4 py-2.5 text-[14px] border transition text-left flex items-center gap-2.5
        ${selected
          ? "bg-accentGreen text-deepGreen border-accentGreen font-semibold"
          : "bg-bgCard text-textMuted border-borderStrong hover:border-white/30"}`}
    >
      {icon != null && (
        <span className={`shrink-0 ${selected ? "text-deepGreen" : "text-accentGreen"}`}>{icon}</span>
      )}
      <span className="min-w-0">{label}</span>
    </button>
  );
}

// Small uppercase section label used across screens.
export function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-textFaint text-[12px] font-semibold uppercase tracking-wider ${className}`}>{children}</div>
  );
}

export function ProgressBar({ value, color = "#4ADE80" }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="h-2 w-full rounded-full bg-borderStrong overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 bg-bgCard border border-border rounded-card p-4">
      <div className="font-display text-3xl leading-none text-white">{value}</div>
      <div className="text-textFaint text-[12px] mt-1.5 uppercase tracking-wide">{label}</div>
    </div>
  );
}
