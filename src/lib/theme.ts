import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";
const KEY = "app-theme-v1";
let theme: Theme = "dark";
let hydrated = false;
const listeners = new Set<() => void>();

function apply(t: Theme) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.toggle("light", t === "light");
  el.classList.toggle("dark", t === "dark");
}

function emit() {
  listeners.forEach((l) => l());
}

export function setTheme(t: Theme) {
  theme = t;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, t);
    apply(t);
  }
  emit();
}

function subscribe(l: () => void) {
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    const stored = (localStorage.getItem(KEY) as Theme | null) ?? "dark";
    theme = stored;
    apply(stored);
    queueMicrotask(emit);
  }
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useTheme() {
  return useSyncExternalStore(
    subscribe,
    () => theme,
    () => "dark" as Theme,
  );
}
