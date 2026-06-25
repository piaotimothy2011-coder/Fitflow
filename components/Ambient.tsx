"use client";
import React from "react";

// Subtle shared ambient glow for in-app screens — quiet, low-opacity,
// just enough to tie the app to the welcome screen without hurting readability.
export default function Ambient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-28 -right-24 w-[320px] h-[320px] rounded-full blur-[100px] opacity-[0.16]"
        style={{ background: "radial-gradient(circle, #22C55E, transparent 70%)", animation: "ff-aurora1 24s ease-in-out infinite" }} />
      <div className="absolute top-1/2 -left-28 w-[300px] h-[300px] rounded-full blur-[100px] opacity-[0.10]"
        style={{ background: "radial-gradient(circle, #0EA5E9, transparent 72%)", animation: "ff-aurora3 30s ease-in-out infinite" }} />
    </div>
  );
}
