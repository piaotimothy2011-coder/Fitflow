"use client";
import React from "react";
import { AppStateProvider, useApp } from "./AppState";
import WelcomeScreen from "./WelcomeScreen";
import SurveyFlow from "./SurveyFlow";
import MainTabs from "./MainTabs";
import { LogoMark } from "./icons";

function Shell() {
  const { hydrated, route } = useApp();

  return (
    <div className="min-h-screen w-full flex justify-center bg-bgRoot">
      <div className="w-full max-w-[440px] min-h-screen bg-bgPhone relative">
        {!hydrated ? (
          <div className="h-screen flex flex-col items-center justify-center gap-4">
            <LogoMark size={64} className="animate-pulse" />
            <div className="font-display text-5xl text-accentGreen">FITFLOW</div>
          </div>
        ) : route === "welcome" ? (
          <WelcomeScreen />
        ) : route === "survey" ? (
          <SurveyFlow />
        ) : (
          <MainTabs />
        )}
      </div>
    </div>
  );
}

export default function FitFlowApp() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  );
}
