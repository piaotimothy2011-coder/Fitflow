"use client";
import React, { useEffect, useState } from "react";
import { Icon, LogoMark } from "./icons";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    // register the service worker (makes the app installable + offline)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return; // already installed

    const dismissed = localStorage.getItem("ff.installDismissed") === "1";

    // Android / Chrome / Edge: capture the native prompt
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      if (!dismissed) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS Safari has no beforeinstallprompt — show manual A2HS hint
    const ua = window.navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = isIOS && !/crios|fxios/i.test(ua);
    if (isIOS && isSafari && !dismissed) {
      setIosHint(true);
      setShow(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (!show) return null;

  const close = () => {
    setShow(false);
    localStorage.setItem("ff.installDismissed", "1");
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-[412px] rounded-2xl border border-accentGreen/30 bg-bgCard/95 backdrop-blur p-4 shadow-2xl ff-pop">
        <div className="flex items-start gap-3">
          <LogoMark size={42} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-white font-semibold text-[15px]">Install FitFlow</div>
            <div className="text-textMuted text-[13px] mt-0.5">
              {iosHint
                ? <>Tap <span className="text-white font-medium">Share</span> then <span className="text-white font-medium">“Add to Home Screen”</span> to use it like an app.</>
                : "Add it to your home screen for a full-screen, app-like experience."}
            </div>
          </div>
          <button onClick={close} aria-label="Dismiss" className="text-textFaint hover:text-white transition shrink-0">
            <Icon name="close" size={18} />
          </button>
        </div>
        {!iosHint && (
          <button onClick={install}
            className="mt-3 w-full rounded-xl bg-accentGreen text-deepGreen font-bold py-3 text-[14px] active:scale-[0.98] transition">
            Install app
          </button>
        )}
      </div>
    </div>
  );
}
