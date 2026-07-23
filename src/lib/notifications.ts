import { supabase } from '@/lib/supabase';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones de escritorio/móvil.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function sendBrowserNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const defaultOptions: any = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    ...options,
  };

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, defaultOptions);
    }).catch(() => {
      new Notification(title, defaultOptions);
    });
  } else {
    new Notification(title, defaultOptions);
  }
}

export async function scanAndNotifyUpcomingEvents() {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const notifiedKey = `notified_events_${todayStr}`;
    const notifiedSet = new Set<string>(JSON.parse(localStorage.getItem(notifiedKey) || '[]'));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Scan reminders
    const { data: reminders } = await supabase.from('reminders').select('*');
    if (reminders && reminders.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const r of reminders) {
        const dateVal = r.date || r.event_date;
        if (!dateVal) continue;

        const isRecurring = Boolean(r.recurring);
        let target: Date;

        if (isRecurring) {
          const parts = dateVal.split('-');
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          target = new Date(today.getFullYear(), month, day);
          if (target < today) {
            target = new Date(today.getFullYear() + 1, month, day);
          }
        } else {
          target = new Date(dateVal + 'T00:00:00');
        }

        const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const eventId = `rem_${r.id}_${diffDays}`;

        if (diffDays >= 0 && diffDays <= 2 && !notifiedSet.has(eventId)) {
          let msg = '';
          if (diffDays === 0) msg = `¡HOY tienes un evento registrado! (${r.category})`;
          else if (diffDays === 1) msg = `Mañana tienes un evento registrado (${r.category})`;
          else msg = `En 2 días: ${r.category}`;

          sendBrowserNotification(`📌 ${r.title}`, {
            body: `${msg}${r.time ? ` a las ${r.time} hrs` : ''}. ${r.notes || ''}`,
            tag: eventId,
          });

          notifiedSet.add(eventId);
        }
      }
    }

    // Scan tasks with due dates
    const { data: tasks } = await supabase.from('tasks').select('*').eq('completed', false);
    if (tasks && tasks.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const t of tasks) {
        if (!t.due_date) continue;

        const target = new Date(t.due_date + 'T00:00:00');
        const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const taskId = `task_${t.id}_${diffDays}`;

        if (diffDays >= 0 && diffDays <= 2 && !notifiedSet.has(taskId)) {
          let msg = '';
          if (diffDays === 0) msg = '¡Esta tarea vence HOY!';
          else if (diffDays === 1) msg = 'Esta tarea vence mañana';
          else msg = 'Esta tarea vence en 2 días';

          sendBrowserNotification(`✅ Tarea Pendiente: ${t.title}`, {
            body: `${msg}. ${t.description || ''}`,
            tag: taskId,
          });

          notifiedSet.add(taskId);
        }
      }
    }

    localStorage.setItem(notifiedKey, JSON.stringify(Array.from(notifiedSet)));
  } catch (err) {
    console.error('Error al escanear eventos para notificaciones:', err);
  }
}
