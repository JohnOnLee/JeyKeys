import { writable } from 'svelte/store';

export const toastStore = writable({ message: '', show: false });

let toastTimeout = null;

export function showToast(message, duration = 3000) {
  toastStore.set({ message, show: true });

  if (toastTimeout) clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toastStore.set({ message: '', show: false });
  }, duration);
}
