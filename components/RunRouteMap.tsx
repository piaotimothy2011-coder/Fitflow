"use client";
import React from "react";

// Lightweight route trace of the recorded GPS points (no external map tiles /
// API keys). Equirectangular projection with latitude compression so the shape
// is proportioned correctly, drawn onto a dark card with start/finish markers.
export default function RunRouteMap({ path, height = 190 }: { path: { lat: number; lng: number }[]; height?: number }) {
  if (!path || path.length < 2) {
    return (
      <div className="rounded-2xl bg-bgCard border border-border flex items-center justify-center text-textFaint text-[13px] px-6 text-center"
        style={{ minHeight: height }}>
        Route not available — GPS did not record enough points.
      </div>
    );
  }
  const W = 320, H = height, P = 18;
  const lat0 = path.reduce((s, p) => s + p.lat, 0) / path.length;
  const k = Math.cos((lat0 * Math.PI) / 180) || 1; // longitude compression at this latitude
  const xs = path.map((p) => p.lng * k);
  const ys = path.map((p) => p.lat);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = Math.max(1e-9, maxX - minX);
  const rangeY = Math.max(1e-9, maxY - minY);
  const s = Math.min((W - 2 * P) / rangeX, (H - 2 * P) / rangeY);
  const offX = (W - rangeX * s) / 2;
  const offY = (H - rangeY * s) / 2;
  const px = (lng: number) => offX + (lng * k - minX) * s;
  const py = (lat: number) => offY + (maxY - lat) * s;
  const pts = path.map((p) => [px(p.lng), py(p.lat)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [sx, sy] = pts[0];
  const [ex, ey] = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-2xl border border-border" style={{ background: "#10160F" }}
      role="img" aria-label="Run route map">
      <defs>
        <linearGradient id="ff-route" x1="0" y1="0" x2={W} y2={H} gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ADE80" /><stop offset="1" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke="url(#ff-route)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={sx} cy={sy} r={6} fill="#4ADE80" stroke="#052E16" strokeWidth={2} />
      <circle cx={ex} cy={ey} r={6} fill="#ffffff" stroke="#052E16" strokeWidth={2} />
    </svg>
  );
}
