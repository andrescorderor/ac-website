import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hpijsgxcjynqtrclkbnq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_MVibXQf39R9rP1sWSshMWQ_aX5JzbmZ';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BFMrFY-j-MXeAU3olGKxMpp6kZjQLnSLh3BjZKQuoPYnMGjSKbQvy8nJKuZsoSYss7cvkBf-59jeg1CxHJlKwd4';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'qHbyjsl9IJE81ZIydlUQxJrdBWCjDCqIgLf4Mi8KGqs';
const VAPID_SUBJECT = 'mailto:andresmcorderor@admin.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Desactivar realtime para prevenir fallos por falta de WebSocket en runners de Node
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: false,
});

async function checkAndSendPushNotifications() {
  console.log('🚀 Iniciando escaneo diario para Notificaciones Web Push...');

  let subscriptions = [];
  let notificationsToSend = [];

  // Método 1: Intentar mediante función RPC de Supabase (SECURITY DEFINER)
  // Esto permite extraer datos del día sin requerir permisos RLS maestros ni exponer datos privados.
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_daily_notifications_to_send');
    if (!rpcError && rpcResult) {
      subscriptions = rpcResult.subscriptions || [];
      notificationsToSend = rpcResult.notifications || [];
      console.log(`⚡ Modo RPC ejecutado con éxito: ${subscriptions.length} dispositivos suscritos, ${notificationsToSend.length} alertas para hoy.`);
    } else {
      if (rpcError) {
        console.warn('⚠️ La función RPC get_daily_notifications_to_send no está disponible o falló:', rpcError.message);
        console.log('ℹ️ Recurriendo al escaneo directo de tablas...');
      }
    }
  } catch (err) {
    console.warn('⚠️ Error al invocar RPC:', err.message);
  }

  // Método 2: Fallback directo a tablas si la RPC no devolvió resultados o no existe
  if (subscriptions.length === 0 && notificationsToSend.length === 0) {
    const { data: subs, error: subErr } = await supabase.from('push_subscriptions').select('*');
    if (subErr) {
      console.error('❌ Error al obtener suscripciones de push_subscriptions:', subErr.message);
      return;
    }
    subscriptions = subs || [];

    if (subscriptions.length === 0) {
      console.log('ℹ️ No hay suscripciones de dispositivos registradas en push_subscriptions.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Escaneo de recordatorios
    const { data: reminders } = await supabase.from('reminders').select('*');
    if (reminders && reminders.length > 0) {
      for (const r of reminders) {
        const dateVal = r.date || r.event_date;
        if (!dateVal) continue;

        const isRecurring = Boolean(r.recurring);
        let target;

        if (isRecurring) {
          const parts = dateVal.split('-');
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          target = new Date(today.getFullYear(), month, day);
          if (target < today) target = new Date(today.getFullYear() + 1, month, day);
        } else {
          target = new Date(dateVal + 'T00:00:00');
        }

        const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
          notificationsToSend.push({
            title: `📌 ${r.title}`,
            body: `¡HOY tienes un evento registrado! (${r.category || 'General'})${r.time ? ` a las ${r.time} hrs` : ''}.`,
            url: '/admin/panel/recordatorios',
          });
        } else if (diffDays === 1) {
          notificationsToSend.push({
            title: `📌 Recordatorio Mañana: ${r.title}`,
            body: `Mañana tienes un evento registrado (${r.category || 'General'}).`,
            url: '/admin/panel/recordatorios',
          });
        }
      }
    }

    // Escaneo de tareas pendientes
    const { data: tasks } = await supabase.from('tasks').select('*').eq('completed', false);
    if (tasks && tasks.length > 0) {
      for (const t of tasks) {
        if (!t.due_date) continue;
        const target = new Date(t.due_date + 'T00:00:00');
        const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          notificationsToSend.push({
            title: `✅ Tarea Pendiente: ${t.title}`,
            body: '¡Esta tarea vence el día de HOY!',
            url: '/admin/panel/pendientes',
          });
        }
      }
    }

    // Escaneo de plantas
    const { data: plants } = await supabase.from('plants').select('*');
    if (plants && plants.length > 0) {
      for (const p of plants) {
        if (!p.last_watered_at || !p.watering_frequency_days) continue;

        const parts = p.last_watered_at.split('-');
        const wateredDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        wateredDate.setHours(0, 0, 0, 0);

        const nextWatering = new Date(wateredDate);
        nextWatering.setDate(nextWatering.getDate() + p.watering_frequency_days);

        const diffDays = Math.ceil((nextWatering.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          notificationsToSend.push({
            title: `${p.emoji || '🪴'} Riego Hoy: ${p.nickname}`,
            body: `¡Hoy toca regar a ${p.nickname} (${p.species})!`,
            url: '/admin/panel/plantas',
          });
        }
      }
    }
  }

  if (subscriptions.length === 0) {
    console.log('ℹ️ No hay suscripciones de dispositivos a las cuales enviar notificaciones.');
    return;
  }

  console.log(`🔔 Notificaciones a despachar hoy: ${notificationsToSend.length} a ${subscriptions.length} dispositivo(s)`);

  if (notificationsToSend.length === 0) {
    console.log('✨ Todo al día. No hay alertas pendientes para despachar hoy.');
    return;
  }

  // Enviar notificaciones cifradas a través de Web Push Protocol
  let sentCount = 0;
  let failCount = 0;

  for (const sub of subscriptions) {
    if (!sub.endpoint || !sub.p256dh || !sub.auth) {
      console.warn(`⚠️ Suscripción incompleta ignorada: id=${sub.id || 'desconocido'}`);
      continue;
    }

    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    for (const notif of notificationsToSend) {
      const payload = JSON.stringify({
        title: notif.title,
        body: notif.body,
        icon: '/assets/ac-website-icon.svg',
        badge: '/assets/ac-website-icon.svg',
        data: { url: notif.url || '/admin/panel/dashboard' },
        tag: notif.tag || `push-${Date.now()}`,
      });

      try {
        await webpush.sendNotification(pushSubscription, payload);
        sentCount++;
        console.log(`✅ Push enviado con éxito -> ${notif.title}`);
      } catch (err) {
        failCount++;
        console.error(`❌ Error enviando push a ${sub.endpoint.substring(0, 35)}...:`, err.statusCode || err.message);
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Suscripción caducada o app desinstalada: limpiar
          if (sub.id) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
            console.log(`🗑️ Suscripción caducada eliminada (${sub.id})`);
          }
        }
      }
    }
  }

  console.log(`🎉 Proceso de notificación push completado. Enviadas con éxito: ${sentCount}, Fallidas: ${failCount}`);
}

checkAndSendPushNotifications();
