export type DesignSelection = {
  id: string;
  kind: "sticker" | "wallpaper";
  category: string;
  english: string;
  bangla: string;
  image?: string;
};

const STORAGE_KEY = "mila-design-selection";
const LEGACY_SESSION_KEY = STORAGE_KEY;
const DESIGN_SELECTION_LIMIT = 50;

function safelyRead(): DesignSelection[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const legacy = window.sessionStorage.getItem(LEGACY_SESSION_KEY);
    const value = JSON.parse(stored ?? legacy ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is DesignSelection => Boolean(item?.id && item?.kind && item?.english)) : [];
  } catch {
    return [];
  }
}

function save(items: DesignSelection[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, DESIGN_SELECTION_LIMIT)));
    window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
  }
}

export function getDesignSelection() {
  return safelyRead();
}

export function addDesignSelection(selection: DesignSelection) {
  const current = safelyRead();
  const next = current.some((item) => item.id === selection.id && item.kind === selection.kind) ? current : [...current, selection];
  save(next);
  return next;
}

export function removeDesignSelection(id: string, kind: DesignSelection["kind"]) {
  const next = safelyRead().filter((item) => item.id !== id || item.kind !== kind);
  save(next);
  return next;
}

export function clearDesignSelection(kind?: DesignSelection["kind"]) {
  const next = kind ? safelyRead().filter((item) => item.kind !== kind) : [];
  save(next);
  return next;
}
