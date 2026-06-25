"use client";
import React from "react";
import { AppStateProvider, useApp } from "./AppState";
import WelcomeScreen from "./WelcomeScreen";
import SurveyFlow from "./SurveyFlow";
import MainTabs from "./MainTabs";

function Shell() {
  const { hydrated, route } = useApp();

  return (
    <div className="min-h-screen w-full flex justify-center bg-bgRoot">
      <div className="w-full max-w-[440px] min-h-screen bg-bgPhone relative">
        {!hydrated ? (
          <div className="h-screen flex items-center justify-center">
            <div className="font-display text-5xl text-accentGreen animate-pulse">FITFLOW</div>
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
