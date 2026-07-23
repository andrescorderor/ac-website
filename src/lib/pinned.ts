import { supabase } from './supabase';

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
  let updatedItems: PinnedItem[] = [];

  if (index >= 0) {
    items.splice(index, 1);
    updatedItems = [...items];
    isPinned = false;

    // Asynchronously delete from Supabase user_pinned_items table
    deleteFromSupabase(item.id);
  } else {
    const newItem: PinnedItem = { ...item, pinnedAt: new Date().toISOString() };
    updatedItems = [newItem, ...items];
    isPinned = true;

    // Asynchronously upsert to Supabase user_pinned_items table
    upsertToSupabase(newItem);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
  window.dispatchEvent(new CustomEvent('ac_pinned_changed'));
  return isPinned;
}

export function removePinnedItem(id: string) {
  const items = getPinnedItems().filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('ac_pinned_changed'));
  deleteFromSupabase(id);
}

// ════════════════════════════════════════════════════════════
// ☁️ SUPABASE CROSS-DEVICE PERSISTENCE & SYNC LOGIC
// ════════════════════════════════════════════════════════════

async function upsertToSupabase(item: PinnedItem) {
  try {
    await supabase.from('user_pinned_items').upsert({
      id: item.id,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle || null,
      path: item.path,
      pinned_at: item.pinnedAt,
    });
  } catch {
    // Graceful fallback if table not created yet
  }
}

async function deleteFromSupabase(id: string) {
  try {
    await supabase.from('user_pinned_items').delete().eq('id', id);
  } catch {
    // Graceful fallback
  }
}

/**
 * Synchronizes local pinned items with Supabase user_pinned_items table.
 * Call this on DashboardLayout and DashboardHome mount so PC and Mobile show identical pins!
 */
export async function syncPinnedItemsWithSupabase() {
  try {
    const { data, error } = await supabase
      .from('user_pinned_items')
      .select('*')
      .order('pinned_at', { ascending: false });

    if (error) {
      // If table doesn't exist yet, keep local state
      return;
    }

    if (data) {
      const syncedItems: PinnedItem[] = data.map((row) => ({
        id: row.id,
        type: row.type as PinnedItem['type'],
        title: row.title,
        subtitle: row.subtitle || undefined,
        path: row.path,
        pinnedAt: row.pinned_at || new Date().toISOString(),
      }));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedItems));
      window.dispatchEvent(new CustomEvent('ac_pinned_changed'));
    }
  } catch {
    // Keep local cache on network offline
  }
}
