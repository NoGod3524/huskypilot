"use client";

import { useEffect } from "react";

/**
 * Registers the offline app-shell service worker.
 *
 * Registration is skipped outside production so a stale cache can never mask
 * local changes during `npm run dev`, and failures are swallowed because
 * offline support is a progressive enhancement, not a requirement.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is optional; ignore registration failures.
    });
  }, []);

  return null;
}
