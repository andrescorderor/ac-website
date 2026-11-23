import { supabase } from '@/lib/supabase';
import { loadSystemData, saveSystemData } from '@/lib/systemStore';

const TRASH_KEY = 'trash_bin';
const MAX_TRASH_ITEMS = 80;
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export type TrashItem = {
  trashId: string;
  table: string;
  entityLabel: string;
  title: string;
  subtitle?: string;
  payload: Record<string, any>;
  deletedAt: string;
  expiresAt: string;
};

function pruneExpired(items: TrashItem[]): TrashItem[] {
  const now = Date.now();
  return items
    .filter((item) => {
      const exp = new Date(item.expiresAt).getTime();
      return !Number.isNaN(exp) && exp > now;
    })
    .slice(0, MAX_TRASH_ITEMS);
}

/**
 * Loads non-expired trash items (30-day retention).
 */
export async function getTrashItems(): Promise<TrashItem[]> {
  const raw = await loadSystemData<TrashItem[]>(TRASH_KEY, [], 60 * 1000);
  const pruned = pruneExpired(Array.isArray(raw) ? raw : []);
  if (Array.isArray(raw) && pruned.length !== raw.length) {
    await saveSystemData(TRASH_KEY, pruned);
  }
  return pruned;
}

/**
 * Archives a deleted record into the 30-day soft-delete trash bin.
 */
export async function moveToTrash(input: {
  table: string;
  entityLabel: string;
  title: string;
  subtitle?: string;
  payload: Record<string, any>;
}): Promise<void> {
  try {
    const existing = await loadSystemData<TrashItem[]>(TRASH_KEY, [], 30 * 1000);
    const now = Date.now();
    const cleanPayload = { ...input.payload };
    delete cleanPayload.created_at;
    delete cleanPayload.updated_at;

    const newItem: TrashItem = {
      trashId: `${now}_${Math.random().toString(36).slice(2, 8)}`,
      table: input.table,
      entityLabel: input.entityLabel,
      title: input.title || 'Elemento sin título',
      subtitle: input.subtitle,
      payload: cleanPayload,
      deletedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + RETENTION_MS).toISOString(),
    };

    const next = pruneExpired([newItem, ...(Array.isArray(existing) ? existing : [])]);
    await saveSystemData(TRASH_KEY, next);
  } catch {
    // Non-blocking soft-delete archive
  }
}

/**
 * Restores an item from trash back into its original Supabase table.
 */
export async function restoreFromTrash(trashId: string): Promise<TrashItem | null> {
  const items = await getTrashItems();
  const target = items.find((i) => i.trashId === trashId);
  if (!target) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Sesión no activa para restaurar.');

  const insertPayload: Record<string, any> = { ...target.payload, user_id: user.id };
  const { error } = await supabase.from(target.table).insert([insertPayload]);

  if (error) {
    // Fallback stripping id in case of primary key conflict or missing optional columns
    const withoutId: Record<string, any> = { ...insertPayload };
    delete withoutId.id;
    const retry = await supabase.from(target.table).insert([withoutId]);
    if (retry.error) throw retry.error;
  }

  const remaining = items.filter((i) => i.trashId !== trashId);
  await saveSystemData(TRASH_KEY, remaining);
  return target;
}

/**
 * Permanently deletes an item from the trash bin.
 */
export async function deletePermanentlyFromTrash(trashId: string): Promise<TrashItem[]> {
  const items = await getTrashItems();
  const remaining = items.filter((i) => i.trashId !== trashId);
  await saveSystemData(TRASH_KEY, remaining);
  return remaining;
}

/**
 * Empties the entire trash bin.
 */
export async function emptyTrash(): Promise<void> {
  await saveSystemData<TrashItem[]>(TRASH_KEY, []);
}
