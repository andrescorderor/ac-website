export type TaskPriority = 'Urgente' | 'Alta' | 'Media' | 'Baja';
export type TaskStatus = 'pending' | 'in_progress' | 'waiting' | 'completed';

export const PRIORITY_LEVELS: TaskPriority[] = ['Urgente', 'Alta', 'Media', 'Baja'];

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  Urgente: 0,
  Alta: 1,
  Media: 2,
  Baja: 3,
};

export const PRIORITY_STYLES: Record<TaskPriority, { badge: string; dot: string; label: string }> = {
  Urgente: {
    badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    dot: 'bg-rose-500',
    label: 'Urgente',
  },
  Alta: {
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    dot: 'bg-amber-500',
    label: 'Alta',
  },
  Media: {
    badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    dot: 'bg-sky-500',
    label: 'Media',
  },
  Baja: {
    badge: 'bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-400/30',
    dot: 'bg-gray-400',
    label: 'Baja',
  },
};

export const STATUS_OPTIONS: { value: TaskStatus; label: string; shortLabel: string; badge: string }[] = [
  {
    value: 'pending',
    label: 'Pendiente',
    shortLabel: 'Pendiente',
    badge: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  },
  {
    value: 'in_progress',
    label: 'En Progreso',
    shortLabel: 'Progreso',
    badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  {
    value: 'waiting',
    label: 'En Espera',
    shortLabel: 'Espera',
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  {
    value: 'completed',
    label: 'Completada',
    shortLabel: 'Lista',
    badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
];

export const SUGGESTED_AREAS = ['Personal', 'Trabajo', 'Social', 'Emprendimiento'];
export const SUGGESTED_TAGS = ['Importante', 'Rápido', 'Seguimiento', 'Bloqueado', 'Llamada', 'Entregable'];

const META_PREFIX_REGEX = /^\[\[([^|\]]+)\|([^|\]]+)(?:\|([^\]]*))?\]\]\s*/;

export function normalizePriority(raw?: string | null): TaskPriority {
  if (!raw) return 'Media';
  const lower = raw.toLowerCase();
  if (lower === 'urgente') return 'Urgente';
  if (lower === 'alta') return 'Alta';
  if (lower === 'baja') return 'Baja';
  return 'Media';
}

export function normalizeStatus(raw?: string | null, completed?: boolean): TaskStatus {
  if (completed) return 'completed';
  if (!raw) return 'pending';
  const lower = raw.toLowerCase();
  if (lower === 'in_progress' || lower === 'en progreso') return 'in_progress';
  if (lower === 'waiting' || lower === 'en espera') return 'waiting';
  if (lower === 'completed' || lower === 'completada') return 'completed';
  return 'pending';
}

export interface ParsedTaskMeta {
  area: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  cleanDescription: string;
}

/**
 * Extracts area, status, priority, custom tags and clean description from a task row,
 * supporting both native DB columns and metadata-prefixed descriptions.
 */
export function parseTaskMeta(row: {
  description?: string | null;
  area?: string | null;
  status?: string | null;
  priority?: string | null;
  tags?: string[] | null;
  completed?: boolean;
}): ParsedTaskMeta {
  const rawDesc = row.description || '';
  const match = rawDesc.match(META_PREFIX_REGEX);

  const metaArea = match ? match[1].trim() : '';
  const metaStatus = match ? match[2].trim() : '';
  const metaTagsRaw = match && match[3] ? match[3].trim() : '';
  const cleanDescription = match ? rawDesc.replace(META_PREFIX_REGEX, '').trim() : rawDesc;

  const area = (row.area && row.area.trim()) || metaArea || 'Personal';
  const status = normalizeStatus(row.status || metaStatus, row.completed);
  const priority = normalizePriority(row.priority);

  let tags: string[] = [];
  if (Array.isArray(row.tags) && row.tags.length > 0) {
    tags = row.tags.map((t) => String(t).trim()).filter(Boolean);
  } else if (metaTagsRaw) {
    tags = metaTagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  return {
    area,
    status,
    priority,
    tags,
    cleanDescription,
  };
}

/**
 * Serializes area, status and tags into description when native columns are absent in Supabase.
 */
export function serializeDescriptionWithMeta(
  cleanDescription: string,
  area: string,
  status: TaskStatus,
  tags: string[] = []
): string {
  const clean = cleanDescription.replace(META_PREFIX_REGEX, '').trim();
  const safeArea = (area || 'Personal').replace(/[|\[\]]/g, '').trim() || 'Personal';
  const cleanTags = tags
    .map((t) => t.replace(/[|\[\],]/g, '').trim())
    .filter(Boolean);
  const tagSegment = cleanTags.length > 0 ? `|${cleanTags.join(',')}` : '';
  const prefix = `[[${safeArea}|${status}${tagSegment}]]`;
  return clean ? `${prefix}\n${clean}` : prefix;
}
