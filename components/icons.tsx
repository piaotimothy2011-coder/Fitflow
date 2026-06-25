"use client";
import React from "react";

// Flat, solid green icon system for FitFlow.
// All icons inherit `currentColor`.

export type IconName =
  | "flame" | "muscle" | "endurance" | "strength" | "flexibility"
  | "calm" | "athletic" | "active" | "posture"
  | "today" | "progress" | "diet" | "profile"
  | "water" | "clock" | "check" | "plus" | "spark" | "dumbbell"
  | "bolt" | "bulb" | "trophy" | "close" | "play" | "leaf" | "back";

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Shared lightning-bolt glyph (used for "athletic" + brand logo).
const BOLT_D = "M13 2L5 13h5l-1.5 9L19 10h-5.5z";

function paths(name: IconName): React.ReactNode {
  switch (name) {
    case "flame":
      return <path d="M12 2c.4 3.1 3 4.6 3 8.2a3 3 0 1 1-6 0c0-1 .3-1.9.9-2.6C8 8.9 7 11.1 7 13.6a5 5 0 1 0 10 0C17 8.6 13.6 5.2 12 2z" />;
    case "muscle":
    case "dumbbell":
      return (
        <g>
          <rect x="2" y="9" width="3" height="6" rx="1.2" />
          <rect x="5" y="10.4" width="2" height="3.2" rx="0.6" />
          <rect x="7" y="11" width="10" height="2" rx="1" />
          <rect x="17" y="10.4" width="2" height="3.2" rx="0.6" />
          <rect x="19" y="9" width="3" height="6" rx="1.2" />
        </g>
      );
    case "endurance":
      return <path {...STROKE} d="M2 12h4l2-5 3 11 2.4-7 1.6 1H22" />;
    case "strength":
      return (
        <g>
          <rect x="2" y="8" width="2" height="8" rx="1" />
          <rect x="4.6" y="6.4" width="2.6" height="11.2" rx="1.1" />
          <rect x="7.2" y="11" width="9.6" height="2" rx="1" />
          <rect x="16.8" y="6.4" width="2.6" height="11.2" rx="1.1" />
          <rect x="20" y="8" width="2" height="8" rx="1" />
        </g>
      );
    case "flexibility":
      return <path {...STROKE} strokeWidth={2.4} d="M5 4c4 0 4 6 7 8s4 8 7 8" />;
    case "calm":
    case "leaf":
      return <path d="M5 19c-1-7 3-13 14-14 1 11-5 16-12 15l3-7 4-2-5 1z" />;
    case "athletic":
    case "bolt":
      return <path d={BOLT_D} />;
    case "active":
      return (
        <g>
          <path d="M8 4c1.6 0 2.5 1.8 2.5 4S9.6 12 8 12 5.5 10.2 5.5 8 6.4 4 8 4z" />
          <path d="M7 13c1.4 0 2 .9 2 2.2 0 1.5-.6 2.8-2 2.8s-2-1.3-2-2.8C5 13.9 5.6 13 7 13z" />
          <path d="M16 8c1.6 0 2.5 1.8 2.5 4S17.6 16 16 16s-2.5-1.8-2.5-4S14.4 8 16 8z" />
          <path d="M15 17c1.4 0 2 .9 2 2.2 0 1.5-.6 2.8-2 2.8s-2-1.3-2-2.8c0-1.3.6-2.2 2-2.2z" />
        </g>
      );
    case "posture":
      return (
        <g {...STROKE} strokeWidth={2.2}>
          <path d="M12 3c-1.6 2.2-1.6 4 0 6s1.6 4 0 6 -1.6 4 0 6" />
          <path d="M11 5.5h3M10.5 9h3M10.5 12.5h3M11 16h3M11.5 19h3" />
        </g>
      );
    case "today":
      return <path d="M3 11.2 12 4l9 7.2V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />;
    case "progress":
      return (
        <g>
          <rect x="3" y="12" width="4" height="8" rx="1.2" />
          <rect x="10" y="7" width="4" height="13" rx="1.2" />
          <rect x="17" y="3" width="4" height="17" rx="1.2" />
        </g>
      );
    case "diet":
      return (
        <g>
          <path d="M12 6.2c-1.6-1.1-4.2-1-5.7.6C4.8 8.4 4.9 11.4 6 14.4c.8 2.2 2.1 4 3.4 4 .9 0 1.3-.5 2.6-.5s1.7.5 2.6.5c1.3 0 2.6-1.8 3.4-4 1.1-3 1.2-6-.3-7.6-1.5-1.6-4.1-1.7-5.7-.6z" />
          <path d="M12.5 6c0-2 1.5-3.2 3.3-3.2-.1 2-1.5 3.2-3.3 3.2z" />
        </g>
      );
    case "profile":
      return (
        <g>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20.5C4 16 7.6 13.5 12 13.5S20 16 20 20.5z" />
        </g>
      );
    case "water":
      return <path d="M12 3c3.9 4.9 6 8 6 11a6 6 0 0 1-12 0c0-3 2.1-6.1 6-11z" />;
    case "clock":
      return (
        <g {...STROKE}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.2 2" />
        </g>
      );
    case "check":
      return <path {...STROKE} strokeWidth={2.6} d="M5 12.5 10 17 19 7" />;
    case "close":
      return <path {...STROKE} strokeWidth={2.4} d="M6 6l12 12M18 6 6 18" />;
    case "back":
      return <path {...STROKE} strokeWidth={2.4} d="M15 5l-7 7 7 7" />;
    case "plus":
      return <path {...STROKE} strokeWidth={2.6} d="M12 5v14M5 12h14" />;
    case "play":
      return <path d="M7 5l12 7-12 7z" />;
    case "spark":
      return <path d="M12 2l2.2 6.4L21 11l-6.8 2.6L12 20l-2.2-6.4L3 11l6.8-2.6z" />;
    case "bulb":
      return (
        <g>
          <path d="M9.5 18.5h5v1A2.5 2.5 0 0 1 12 22a2.5 2.5 0 0 1-2.5-2.5z" />
          <path d="M12 2a7 7 0 0 0-4.2 12.6c.7.5 1.2 1.2 1.2 2v.4h6v-.4c0-.8.5-1.5 1.2-2A7 7 0 0 0 12 2z" />
        </g>
      );
    case "trophy":
      return (
        <g>
          <path d="M7 3h10v5a5 5 0 0 1-10 0z" />
          <rect x="11" y="12.5" width="2" height="4" />
          <rect x="8" y="20" width="8" height="2.2" rx="1.1" />
          <rect x="9.3" y="16" width="5.4" height="4.2" rx="1.2" />
          <path {...STROKE} strokeWidth={1.8} d="M7 5H4.5v1.5A2.5 2.5 0 0 0 7 9M17 5h2.5v1.5A2.5 2.5 0 0 1 17 9" />
        </g>
      );
  }
}

export function Icon({ name, className = "", size = 22 }: { name: IconName; className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden="true" focusable="false">
      {paths(name)}
    </svg>
  );
}

// Brand logo: green-gradient badge with a dark lightning bolt (strength).
export function LogoMark({ size = 56, className = "" }: { size?: number; className?: string }) {
  const id = React.useId();
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} className={className} aria-label="FitFlow logo" role="img">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ADE80" />
          <stop offset="1" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="24" fill={`url(#${id})`} />
      <g transform="translate(16,16) scale(2.7)">
        <path d={BOLT_D} fill="#052E16" />
      </g>
    </svg>
  );
}
