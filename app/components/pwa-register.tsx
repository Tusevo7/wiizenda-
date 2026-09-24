"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          console.log("Wizenda PWA: Service Worker registado.");
        })
        .catch((error) => {
          console.error("Wizenda PWA: erro ao registar Service Worker:", error);
        });
    }
  }, []);

  return null;
}