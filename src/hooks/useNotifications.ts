// Smart weather notifications: evaluates alerts on every successful fetch
// plus a 5-minute tick (visibility-gated), fires them as in-app toasts, and
// — only when the user opted in AND the tab is hidden — as OS notifications.
//
// Dedup: alert ids are content-addressed (kind + event wall-time key) and
// persisted in settings.firedAlerts, so each distinct event fires once even
// across refreshes; a repeat is suppressed for 6 h. Permission UX mirrors
// useDeviceLocation: never prompts unprompted, permanent dismissal, hidden
// entirely where the Notification API is unsupported.

import { useEffect, useState } from "react";
import type { WeatherForecast } from "../domain/types";
import { evaluateAlerts } from "../lib/insights/alerts";
import { locationNow } from "../lib/time";
import { useSettings } from "../store/settings";
import { useView } from "../store/view";

const REFIRE_COOLDOWN_MS = 6 * 60 * 60_000;
const TICK_MS = 5 * 60_000;

export type NotificationPermissionState = "unsupported" | "default" | "granted" | "denied";

function permissionState(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as NotificationPermissionState;
}

export function useNotifications(forecast: WeatherForecast | null) {
  const demoMode = useSettings((s) => s.demoMode);
  const notificationsEnabled = useSettings((s) => s.notificationsEnabled);
  const notificationsPromptDismissed = useSettings((s) => s.notificationsPromptDismissed);
  const markAlertFired = useSettings((s) => s.markAlertFired);
  const pushToast = useView((s) => s.pushToast);

  const [permission, setPermission] = useState<NotificationPermissionState>(permissionState);

  // Permission can change outside this hook (OS settings, other tabs).
  useEffect(() => {
    if (permissionState() === "unsupported") return;
    const id = setInterval(() => setPermission(permissionState()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!forecast?.current || demoMode) return;

    const run = () => {
      const now = locationNow(forecast.utcOffsetSeconds);
      const alerts = evaluateAlerts(forecast, now);
      const fired = useSettings.getState().firedAlerts;
      const nowMs = Date.now();

      for (const alert of alerts) {
        const lastAt = fired[alert.id];
        if (lastAt !== undefined && nowMs - lastAt < REFIRE_COOLDOWN_MS) continue;

        markAlertFired(alert.id);

        // In-app toast always. Browser notification only on explicit opt-in,
        // and only while the tab is hidden (a toast covers the visible case).
        pushToast(alert);
        const prefs = useSettings.getState();
        if (
          prefs.notificationsEnabled &&
          !demoMode &&
          "Notification" in window &&
          Notification.permission === "granted" &&
          document.visibilityState === "hidden"
        ) {
          try {
            new Notification(alert.title, { body: alert.body, tag: alert.id });
          } catch {
            // Notification construction can throw on some platforms; the
            // in-app toast already fired, so this is safe to ignore.
          }
        }
      }
    };

    run();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") run();
    }, TICK_MS);
    return () => clearInterval(id);
  }, [forecast, demoMode, markAlertFired, pushToast]);

  const optInVisible =
    permission === "default" && !notificationsPromptDismissed && !notificationsEnabled;

  const enable = async () => {
    if (permissionState() === "unsupported") return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermissionState);
      useSettings.getState().setNotificationsEnabled(result === "granted");
      if (result === "denied") useSettings.getState().dismissNotificationsPrompt();
    } catch {
      useSettings.getState().dismissNotificationsPrompt();
    }
  };

  return { optInVisible, permission, enable };
}