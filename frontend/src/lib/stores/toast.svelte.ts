export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

let seq = 0;

export const toasts = $state<Toast[]>([]);

export function pushToast(message: string, kind: ToastKind = 'info'): void {
  const id = ++seq;
  toasts.push({ id, message, kind });
  setTimeout(() => dismissToast(id), 4500);
}

export function dismissToast(id: number): void {
  const index = toasts.findIndex((t) => t.id === id);
  if (index >= 0) toasts.splice(index, 1);
}
