/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useRef, useState } from "react";

type Pt = { lat: number; lng: number };

// Load Leaflet from CDN once (client-side only).
let leafletPromise: Promise<any> | null = null;
function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if ((window as any).L) return Promise.resolve((window as any).L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve((window as any).L);
    script.onerror = () => reject(new Error("leaflet failed"));
    document.body.appendChild(script);
  });
  return leafletPromise;
}

// Fallback: proportioned SVG trace on a dark card (used offline / if tiles fail).
function SvgTrace({ path, height }: { path: Pt[]; height: number }) {
  const W = 320, H = height, P = 18;
  const lat0 = path.reduce((s, p) => s + p.lat, 0) / path.length;
  const k = Math.cos((lat0 * Math.PI) / 180) || 1;
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
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-2xl border border-border" style={{ background: "#10160F" }} role="img" aria-label="Run route">
      <path d={d} fill="none" stroke="#4ADE80" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={sx} cy={sy} r={6} fill="#4ADE80" stroke="#052E16" strokeWidth={2} />
      <circle cx={ex} cy={ey} r={6} fill="#ffffff" stroke="#052E16" strokeWidth={2} />
    </svg>
  );
}

export default function RunRouteMap({ path, height = 200 }: { path: Pt[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!path || path.length < 2) return;
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !ref.current) return;
      const latlngs = path.map((p) => [p.lat, p.lng]) as [number, number][];
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      const map = L.map(ref.current, { zoomControl: false, attributionControl: false, scrollWheelZoom: false });
      mapRef.current = map;
      // Esri World Imagery — satellite tiles, no API key required.
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      ).addTo(map);
      const poly = L.polyline(latlngs, { color: "#4ADE80", weight: 4, opacity: 0.95 }).addTo(map);
      L.circleMarker(latlngs[0], { radius: 6, color: "#052E16", weight: 2, fillColor: "#4ADE80", fillOpacity: 1 }).addTo(map);
      L.circleMarker(latlngs[latlngs.length - 1], { radius: 6, color: "#052E16", weight: 2, fillColor: "#ffffff", fillOpacity: 1 }).addTo(map);
      map.fitBounds(poly.getBounds(), { padding: [22, 22] });
      setTimeout(() => { try { map.invalidateSize(); } catch { /* noop */ } }, 120);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      if (mapRef.current) { try { mapRef.current.remove(); } catch { /* noop */ } mapRef.current = null; }
    };
  }, [path]);

  if (!path || path.length < 2) {
    return (
      <div className="rounded-2xl bg-bgCard border border-border flex items-center justify-center text-textFaint text-[13px] px-6 text-center"
        style={{ minHeight: height }}>
        Route not available — GPS did not record enough points.
      </div>
    );
  }
  if (failed) return <SvgTrace path={path} height={height} />;
  return <div ref={ref} className="rounded-2xl border border-border overflow-hidden bg-bgCard" style={{ height }} />;
}
