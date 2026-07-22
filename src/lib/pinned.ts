export type PinnedItem = {
  id: string;
  type: 'note' | 'task' | 'debt' | 'vault' | 'shopping' | 'reminder';
  title: string;
  subtitle?: string;
  path: string;
  pinnedAt: string;
};

const STORAGE_KEY = 'ac_pinned_items_v1';

export function getPinnedItems(): PinnedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isItemPinned(id: string): boolean {
  const items = getPinnedItems();
  return items.some((item) => item.id === id);
}

export function togglePinItem(item: Omit<PinnedItem, 'pinnedAt'>): boolean {
  const items = getPinnedItems();
  const index = items.findIndex((i) => i.id === item.id);

  let isPinned = false;
  if (index >= 0) {
    items.splice(index, 1);
    isPinned = false;
  } else {
    items.unshift({ ...item, pinnedAt: new Date().toISOString() });
    isPinned = true;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  // Dispatch custom event so all components react to pin changes immediately
  window.dispatchEvent(new CustomEvent('ac_pinned_changed'));
  return isPinned;
}

export function removePinnedItem(id: string) {
  const items = getPinnedItems().filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('ac_pinned_changed'));
}
