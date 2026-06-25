"use client";
import React from "react";
import {
  Flame, Dumbbell, HeartPulse, Weight, PersonStanding, Brain, Medal,
  Footprints, BriefcaseMedical, Home, BarChart3, Carrot, User, Library,
  Droplet, Clock, Check, Plus, Sparkles, Zap, Lightbulb, Trophy, X, Play,
  Leaf, ChevronLeft, ChevronRight, Scale, Pencil, RefreshCw, Bookmark, Target,
  type LucideIcon,
} from "lucide-react";

// Icon system backed by lucide-react (clean, recognizable, consistent).
export type IconName =
  | "flame" | "muscle" | "endurance" | "strength" | "flexibility"
  | "calm" | "athletic" | "active" | "posture"
  | "today" | "library" | "progress" | "diet" | "profile"
  | "water" | "clock" | "check" | "plus" | "spark" | "dumbbell"
  | "bolt" | "bulb" | "trophy" | "close" | "play" | "leaf" | "back"
  | "scale" | "medal" | "chevron" | "edit" | "regenerate" | "bookmark" | "target" | "run";

const MAP: Record<IconName, LucideIcon> = {
  flame: Flame, muscle: Dumbbell, endurance: HeartPulse, strength: Weight,
  flexibility: PersonStanding, calm: Brain, athletic: Medal, active: Footprints,
  posture: BriefcaseMedical, today: Home, library: Library, progress: BarChart3,
  diet: Carrot, profile: User, water: Droplet, clock: Clock, check: Check,
  plus: Plus, spark: Sparkles, dumbbell: Dumbbell, bolt: Zap, bulb: Lightbulb,
  trophy: Trophy, close: X, play: Play, leaf: Leaf, back: ChevronLeft,
  scale: Scale, medal: Medal, chevron: ChevronRight, edit: Pencil,
  regenerate: RefreshCw, bookmark: Bookmark, target: Target, run: Footprints,
};

export function Icon({ name, className = "", size = 22 }: { name: IconName; className?: string; size?: number }) {
  const C = MAP[name] ?? Sparkles;
  return <C size={size} className={className} strokeWidth={2} aria-hidden="true" />;
}

export function LogoMark({ size = 56, className = "" }: { size?: number; className?: string }) {
  const id = React.useId();
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} className={className} aria-label="FitFlow logo" role="img">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ADE80" /><stop offset="1" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="24" fill={`url(#${id})`} />
      <g transform="translate(16,16) scale(2.7)"><path d="M13 2L5 13h5l-1.5 9L19 10h-5.5z" fill="#052E16" /></g>
    </svg>
  );
}
