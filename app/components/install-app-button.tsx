"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
  }>;
}

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [instalavel, setInstalavel] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstalavel(true);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener("appinstalled", () => {
      setInstallPrompt(null);
      setInstalavel(false);
    });

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  async function instalarApp() {
    if (!installPrompt) return;

    await installPrompt.prompt();

    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      setInstallPrompt(null);
      setInstalavel(false);
    }
  }

  if (!instalavel) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={instalarApp}
      className="rounded-full bg-[#FF5A1F] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#e94d16]"
    >
      Instalar Wizenda
    </button>
  );
}