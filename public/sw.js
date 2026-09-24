const CACHE_NAME = "wizenda-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // O service worker fica ativo para permitir a instalação da PWA.
});