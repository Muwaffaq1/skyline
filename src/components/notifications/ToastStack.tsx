// Transient in-app alert toasts, top-fixed over the sky. Auto-dismiss after
// 6 s; tap to dismiss. Reduced-motion zeroes the slide animation globally
// (tokens.css), so no extra handling needed here.

import { useEffect } from "react";
import { useView } from "../../store/view";

const AUTO_DISMISS_MS = 6_000;

export function ToastStack() {
  const toasts = useView((s) => s.toasts);
  const dismissToast = useView((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <ToastCard key={toast.key} id={toast.key} title={toast.title} body={toast.body} onDismiss={dismissToast} />
      ))}
    </div>
  );
}

function ToastCard({
  id,
  title,
  body,
  onDismiss,
}: {
  id: number;
  title: string;
  body: string;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <button type="button" className="toast" onClick={() => onDismiss(id)} aria-label={`Dismiss alert: ${title}`}>
      <span className="toast__title">{title}</span>
      <span className="toast__body">{body}</span>
    </button>
  );
}