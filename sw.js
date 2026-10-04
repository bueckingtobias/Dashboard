// ESTRIQ Service Worker
// Er macht die App installierbar (Startbildschirm) und speichert bewusst nichts zwischen:
// Jede Datei kommt immer frisch vom Server. So zeigt die App nach einem Update nie einen alten Stand.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
