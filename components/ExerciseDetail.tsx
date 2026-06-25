"use client";
import React from "react";
import { type Exercise, exerciseAllMuscles } from "@/lib/models";
import { muscleDisplayName } from "@/lib/muscle";
import { Icon } from "./icons";
import { videoIdFor } from "@/lib/exerciseVideos";

function ytSearch(name: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " exercise proper form tutorial")}`;
}

export default function ExerciseDetail({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const muscles = exerciseAllMuscles(exercise).map((m) => muscleDisplayName[m]);
  const url = ytSearch(exercise.name);
  const videoId = videoIdFor(exercise.name);

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="w-full max-w-[440px] bg-bgPhone overflow-y-auto no-scrollbar ff-pop">
        <div className="px-6 pt-8 pb-10">
          <div className="flex justify-end">
            <button onClick={onClose} aria-label="Close" className="text-textMuted hover:text-white transition">
              <Icon name="close" size={24} />
            </button>
          </div>

          <div className="text-accentGreen text-[12px] font-bold uppercase tracking-[0.16em]">Exercise</div>
          <h1 className="font-display text-[44px] text-white leading-[0.95] mt-1">{exercise.name}</h1>

          {/* tutorial */}
          <div className="text-textFaint text-[12px] font-semibold uppercase tracking-wider mt-7 mb-2">Tutorial</div>
          {videoId ? (
            <div className="rounded-2xl overflow-hidden border border-border bg-black">
              <div className="aspect-video">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
                  title={`${exercise.name} tutorial`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-2.5 bg-bgCard">
                <span className="text-textMuted text-[13px]">More tutorials</span>
                <span className="flex items-center gap-1.5 text-accentGreen text-[13px] font-medium">Open in YouTube <Icon name="chevron" size={15} /></span>
              </a>
            </div>
          ) : (
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="block rounded-2xl overflow-hidden border border-border bg-bgCard active:scale-[0.99] transition">
              <div className="relative h-44 flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]">
                <div className="absolute inset-0 ff-grid opacity-[0.07]" />
                <span className="relative w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                  <Icon name="play" size={30} className="text-white ml-1" />
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="flex items-center gap-2 text-white text-[14px] font-medium">
                  <span className="text-red-500"><Icon name="play" size={16} /></span> Watch on YouTube
                </span>
                <span className="text-textFaint"><Icon name="chevron" size={18} /></span>
              </div>
            </a>
          )}

          {/* prescription */}
          <Block label="Volume" value={exercise.detail} />
          {exercise.tip && <Block label="Coaching cue" value={exercise.tip} />}
          <Block label="Form notes" value="Move with control. Quality over speed. Stop a rep before your form breaks down." />

          {muscles.length > 0 && (
            <>
              <div className="text-textFaint text-[12px] font-semibold uppercase tracking-wider mt-6 mb-2.5">Muscles worked</div>
              <div className="flex flex-wrap gap-2">
                {muscles.map((m) => (
                  <span key={m} className="text-[12px] bg-accentGreen/12 text-accentGreen rounded-full px-3 py-1.5 font-medium">{m}</span>
                ))}
              </div>
            </>
          )}

          <button onClick={onClose}
            className="mt-8 w-full rounded-button border border-borderStrong text-white font-medium py-3.5 text-[15px] transition active:scale-[0.98] hover:bg-white/5">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-6">
      <div className="text-textFaint text-[12px] font-semibold uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-white text-[15px] leading-relaxed">{value}</div>
    </div>
  );
}
