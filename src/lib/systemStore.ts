import { supabase } from '@/lib/supabase';
import { fetchWithCache, invalidateCache } from '@/lib/cache';

const CATEGORY_PREFIX = 'System_Store:';
const LOCAL_PREFIX = 'ac_sys_store_v1_';

function getLocalFallback<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function setLocalFallback<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${LOCAL_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Ignore storage quota or private mode errors
  }
}

/**
 * Loads structured JSON state stored compactly under `notes.category = System_Store:<key>`.
 * Uses in-memory/session cache + localStorage fallback to protect Supabase free-tier egress.
 */
export async function loadSystemData<T>(
  key: string,
  fallback: T,
  ttlMs: number = 5 * 60 * 1000
): Promise<T> {
  const categoryKey = `${CATEGORY_PREFIX}${key}`;
  try {
    return await fetchWithCache<T>(
      `sys_${key}`,
      async () => {
        const { data, error } = await supabase
          .from('notes')
          .select('content')
          .eq('category', categoryKey)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0 && data[0].content) {
          try {
            const parsed = JSON.parse(data[0].content) as T;
            setLocalFallback(key, parsed);
            return parsed;
          } catch {
            // Fall through to local/default if malformed JSON
          }
        }

        const local = getLocalFallback<T>(key);
        return local !== null ? local : fallback;
      },
      ttlMs
    );
  } catch {
    const local = getLocalFallback<T>(key);
    return local !== null ? local : fallback;
  }
}

/**
 * Persists structured JSON state compactly in `notes` (`System_Store:<key>`) and localStorage.
 * Updates existing row instead of duplicating rows to keep Supabase DB size minimal.
 */
export async function saveSystemData<T>(key: string, value: T): Promise<void> {
  const categoryKey = `${CATEGORY_PREFIX}${key}`;
  setLocalFallback(key, value);
  invalidateCache(`sys_${key}`);

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    const payloadContent = JSON.stringify(value);

    const { data: existing } = await supabase
      .from('notes')
      .select('id')
      .eq('category', categoryKey)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase
        .from('notes')
        .update({ content: payloadContent })
        .eq('id', existing[0].id);
    } else {
      await supabase.from('notes').insert([
        {
          user_id: user.id,
          title: `System Store (${key})`,
          content: payloadContent,
          category: categoryKey,
        },
      ]);
    }
  } catch {
    // Local persistence still succeeded offline
  }
}
