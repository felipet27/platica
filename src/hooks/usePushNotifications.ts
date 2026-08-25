"use client";

import { useState, useEffect, useCallback } from "react";

// Convierte la clave pública VAPID (base64url) al formato que espera el navegador.
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return buffer;
}

export interface PushNotifications {
  supported: boolean;
  enabled: boolean;
  denied: boolean;
  loading: boolean;
  error: string | null;
  enable: () => Promise<boolean>;
  disable: () => Promise<void>;
}

export function usePushNotifications(): PushNotifications {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    if (!ok) {
      setSupported(false);
      setLoading(false);
      return;
    }
    if (Notification.permission === "denied") {
      setDenied(true);
      setLoading(false);
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setEnabled(!!sub);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const enable = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setDenied(true);
        return false;
      }
      if (permission !== "granted") return false;

      const reg = await navigator.serviceWorker.ready;

      const vapidRes = await fetch("/api/push/vapid-key");
      if (!vapidRes.ok) {
        setError("Falta la clave de notificaciones. Contacta al soporte.");
        return false;
      }
      const { key } = await vapidRes.json();
      if (!key) {
        setError("Falta la clave de notificaciones. Contacta al soporte.");
        return false;
      }

      // Reutiliza la suscripción del navegador si ya existe
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);

      setEnabled(true);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo activar. Intenta de nuevo."
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
    } catch {
      setError("No se pudo desactivar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { supported, enabled, denied, loading, error, enable, disable };
}
