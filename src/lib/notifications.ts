import { supabase } from '@/lib/supabase';

// VAPID Public Key for Web Push Protocol (Safe to be public)
export const VAPID_PUBLIC_KEY = 'BFMrFY-j-MXeAU3olGKxMpp6kZjQLnSLh3BjZKQuoPYnMGjSKbQvy8nJKuZsoSYss7cvkBf-59jeg1CxHJlKwd4';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function registerPushSubscription(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Este dispositivo/navegador no soporta PushManager.');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // Forzar actualización del Service Worker para cargar sw-push.js si estaba obsoleto
    registration.update().catch(() => {});

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
    }

    if (subscription) {
      const subJson = subscription.toJSON();
      const { data: { user } } = await supabase.auth.getUser();

      const endpoint = subJson.endpoint || subscription.endpoint || '';
      let p256dh = subJson.keys?.p256dh || '';
      let auth = subJson.keys?.auth || '';

      if (!p256dh && typeof subscription.getKey === 'function') {
        p256dh = arrayBufferToBase64(subscription.getKey('p256dh'));
      }
      if (!auth && typeof subscription.getKey === 'function') {
        auth = arrayBufferToBase64(subscription.getKey('auth'));
      }

      if (endpoint && p256dh && auth) {
        // Upsert subscription to Supabase push_subscriptions table
        const { error } = await supabase.from('push_subscriptions').upsert(
          {
            user_id: user?.id || null,
            endpoint,
            p256dh,
            auth,
            user_agent: navigator.userAgent,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' }
        );

        if (error) {
          console.warn('⚠️ No se pudo guardar la suscripción push en Supabase:', error.message);
        } else {
          console.log('✅ Suscripción Web Push sincronizada en Supabase para iOS / Móvil.');
        }
      }
      return true;
    }
  } catch (err) {
    console.warn('No se pudo registrar la suscripción Web Push en este dispositivo:', err);
  }
  return false;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones.');
    return false;
  }

  if (Notification.permission === 'granted') {
    await registerPushSubscription();
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerPushSubscription();
      return true;
    }
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
    icon: '/assets/ac-website-icon-192.png',
    ...options,
  };

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, defaultOptions).catch(() => {
        // Fallback mínimo para iOS si falla alguna opción específica
        registration.showNotification(title, { body: options?.body || '' }).catch(() => {});
      });
    }).catch(() => {
      try {
        new Notification(title, defaultOptions);
      } catch {
        // En iOS Safari 'new Notification' lanza TypeError si no es a través de serviceWorker
      }
    });
  } else {
    try {
      new Notification(title, defaultOptions);
    } catch {
      // Ignorar fallback en navegadores móviles sin constructor Notification
    }
  }
}

/**
 * Escanea eventos próximos (recordatorios, pendientes, plantas).
 * Por defecto, si el usuario ya tiene la aplicación abierta y visible en pantalla,
 * NO dispara banners nativos ruidosos del sistema operativo para evitar la sensación
 * de que "las notificaciones solo aparecen al meterse a la app".
 */
export async function scanAndNotifyUpcomingEvents(options?: { forceSystemNotification?: boolean }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // Si la pestaña está en primer plano y visible, evitamos spam de banners nativos
  const isPageVisible = typeof document !== 'undefined' && document.visibilityState === 'visible';
  const shouldSendSystemNotification = !isPageVisible || Boolean(options?.forceSystemNotification);

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

          if (shouldSendSystemNotification) {
            sendBrowserNotification(`📌 ${r.title}`, {
              body: `${msg}${r.time ? ` a las ${r.time} hrs` : ''}. ${r.notes || ''}`,
              tag: eventId,
            });
          }

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

          if (shouldSendSystemNotification) {
            sendBrowserNotification(`✅ Tarea Pendiente: ${t.title}`, {
              body: `${msg}. ${t.description || ''}`,
              tag: taskId,
            });
          }

          notifiedSet.add(taskId);
        }
      }
    }

    // Scan plants watering schedules
    const { data: plants } = await supabase.from('plants').select('*');
    if (plants && plants.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const p of plants) {
        if (!p.last_watered_at || !p.watering_frequency_days) continue;

        const parts = p.last_watered_at.split('-');
        const wateredDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        wateredDate.setHours(0, 0, 0, 0);

        const nextWatering = new Date(wateredDate);
        nextWatering.setDate(nextWatering.getDate() + p.watering_frequency_days);

        const diffDays = Math.ceil((nextWatering.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const plantNotifId = `plant_${p.id}_${diffDays}`;

        if (diffDays <= 0 && !notifiedSet.has(plantNotifId)) {
          if (shouldSendSystemNotification) {
            sendBrowserNotification(`${p.emoji || '🪴'} Riego de Planta: ${p.nickname}`, {
              body: `¡Hoy toca regar a ${p.nickname} (${p.species})! Frecuencia: cada ${p.watering_frequency_days} días.`,
              tag: plantNotifId,
            });
          }

          notifiedSet.add(plantNotifId);
        }
      }
    }

    localStorage.setItem(notifiedKey, JSON.stringify(Array.from(notifiedSet)));
  } catch (err) {
    console.error('Error al escanear eventos para notificaciones:', err);
  }
}
