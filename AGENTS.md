# Especificaciones y Reglas del Proyecto (AC Website & Admin Panel)

Este documento define las directrices maestras, arquitectura, estándares de diseño y criterios obligatorios de entrega que Antigravity debe seguir estrictamente al desarrollar, modificar o integrar nuevas funcionalidades en este proyecto.

---

## 🧭 Directrices Maestras y Filosofía de Ingeniería

### REGLA 0: Mentalidad de Producción Real para Usuarios Finales (MANDATORIA)
**SIEMPRE trabajar como si esto fuera la versión productiva final que van a usar clientes reales y que pagan dinero, desde el primer día.**
1. **Cero textos de prueba visibles:** Queda estrictamente prohibido mostrar "demo", "ejemplo", "placeholder", "mock", "prueba" o "modo local" en interfaces de usuario final.
2. **Sin accesos de prueba o bypass de desarrollador expuestos:** La pantalla y el panel deben verse 100% como un software comercial terminado de clase ejecutiva.
3. **Datos y entidades con coherencia profesional:** Cualquier registro base, predeterminado o de ejemplo debe representar información realista, coherente y funcional.
4. **Cada pantalla debe estar lista para operar:** Si un directivo, reclutador o usuario externo abre cualquier vista o modal, debe ver un sistema operativo, coherente, pulido y robusto.

---

### REGLA 0.1: Costo $0 USD por Defecto y Alerta de Pago Obligatoria (MÁXIMA PRIORIDAD)
**SIEMPRE implementar la opción gratuita, funcional y con capacidad de escalar a futuro.**
1. **Costo $0 USD por defecto:** Todo componente, librería, servicio, base de datos y despliegue debe utilizar tiers gratuitos y código abierto (Supabase Free Tier, Netlify Free, GitHub Actions, PWA nativa, Web APIs estándar).
2. **ALERTA DE PAGO OBLIGATORIA (MÁXIMA PRIORIDAD):**
   > [!CRITICAL]
   > **Si para cualquier funcionalidad, herramienta o servicio es necesario pagar algo o incurrir en costos recurrentes, SE LE DEBE INFORMAR A ANDRÉS CON MÁXIMA PRIORIDAD ANTES DE IMPLEMENTARLO O CONTRATARLO.** Jamás asumir o comprometer gasto alguno sin su aprobación explícita previa.

---

### REGLA 0.2: Regla de Cursor Interactivo Universal (MANDATORIA)
> [!CRITICAL]
> **Todo elemento clickeable (botones, enlaces `<a>`, selectores, tabs, tarjetas con acción, checkboxes, switches y disparadores) DEBE mostrar `cursor: pointer !important` (`cursor-pointer`) al pasar el cursor por encima.** Jamás dejar un botón o tarjeta interactiva con el cursor por defecto (`default` / `auto`).

---

### REGLA 0.3: Prohibición Estricta de Diálogos Nativos del Navegador (`alert`, `confirm`, `prompt`)
**Queda estrictamente prohibido el uso de ventanas modales nativas del navegador (`alert()`, `confirm()`, `prompt()`).**
1. **Componentes In-App Estandarizados:** Todas las notificaciones de éxito, error, advertencia o confirmación deben renderizarse con la capa de interfaz estandarizada del proyecto:
   - Notificaciones y toasts: `toast.success()`, `toast.error()`, `toast.info()` provistos por `src/components/common/ToastContext.tsx`.
   - Modales de confirmación interactivos: componentes modales in-app o confirmaciones con opción de Deshacer (`toast.undoable`).
2. **Cero Bloqueo de Hilo:** Las alertas in-app no congelan la ejecución del hilo principal de JavaScript ni degradan la experiencia del usuario.

---

### REGLA 0.4: Prohibición Estricta de Palabras "iPad" o "Tablet/Tableta" en la Interfaz
**Queda terminantemente prohibido colocar explícitamente las palabras "iPad", "Tablet" o "Tableta" en la interfaz de usuario.**
- No deben aparecer en textos, encabezados, títulos, badges, tooltips, opciones de formularios ni placeholders.
- En su lugar, utilizar siempre términos profesionales neutros:
  - *Dispositivo móvil* o *Tu dispositivo*
  - *Pantalla táctil*
  - *Cámara de tu dispositivo*

---

### REGLA 0.5: Higiene Visual Universal y Uso de Tooltips Interactivos (Cero Textos Permanentes que Saturen)
**En todos los módulos, modales, formularios y tarjetas, queda prohibido incluir párrafos o textos explicativos permanentes largos debajo de los inputs que saturen visualmente la interfaz y resten pulcritud.**
1. **Consumo de Información Bajo Demanda:** Toda nota secundaria, aclaración técnica o instrucción de cálculo debe ubicarse en tooltips interactivos (`title="..."`) o iconos circulares de información `(i)` discretos.
2. **Botones Limpios de Acción Directa:** Los botones deben contener únicamente el verbo de acción conciso (ej. *Guardar*, *Confirmar Compra*, *Renovar*), sin incrustar párrafos de ayuda en su interior.
3. **Formularios Compactos y Elegantes:** Los campos deben mantener etiquetas (`label`) limpias, reservando el espacio vertical para una navegación ágil en pantallas móviles y tablets.

---

### REGLA 0.6: Autonomía Técnica para la Mejora Continua de las Reglas
- Todo estándar, patrón de diseño, optimización de seguridad o necesidad de armonización detectada durante la evolución del sistema debe ser incorporado inmediatamente a este archivo de reglas (`AGENTS.md`) para blindar el crecimiento ordenado y homogéneo del software a largo plazo.

---

## 🎯 Criterios Obligatorios de Entrega en Cada Tarea

### 1. 📱 Responsividad Móvil y Tablet Impecable (Mobile-First & Ergonomía Táctil)
- Todo cambio, nuevo modal, componente, formulario o vista de datos **debe estar 100% adaptado a móviles (iOS/Android), tablets y pantallas de escritorio**.
- **Reglas de UI móvil y Ergonomía Táctil (WCAG 2.5.5 / 2.5.8):**
  - **Alturas Mínimas Táctiles:** Todo botón interactivo, selector, input y tab debe respetar una altura mínima táctil de 44px a 48px (`min-h-[44px]` o `py-2.5 sm:py-3`) con áreas de toque confortables para dedos.
  - **Separación Táctil:** Mantener un espaciado mínimo de 8px a 12px (`gap-2` a `gap-3`) entre botones adyacentes para prevenir pulsaciones involuntarias.
  - **Retardo Táctil Eliminado:** Utilizar `touch-action: manipulation;` donde aplique para erradicar el retraso de 300ms en navegadores móviles.
  - **Prevención de Desbordamiento:** Evitar desbordamientos horizontales (`overflow-x-hidden`, anchos responsivos con `w-full max-w-lg sm:max-w-xl`, padding adaptativo `p-4 sm:p-6 lg:p-8`).
  - **Modales Contenidos:** Todos los modales deben tener scroll vertical contenido (`max-h-[85vh]` a `max-h-[90vh]`, `overflow-y-auto`).
  - **Textareas Flexibles:** Los campos de texto largo o Markdown deben ser verticalmente redimensionables (`resize-y`, `min-h-[140px]`).

### 2. 🏷️ Control de Versiones Automático (Version Bump Obligatorio)
- Al completar cualquier conjunto relevante de cambios, nueva feature, refactorización o corrección, **se debe incrementar el número de versión (SemVer)** de la aplicación (ej. `v6.13.0` -> `v6.14.0`).
- La versión debe mantenerse estrictamente sincronizada en:
  1. `package.json` (campo `"version"`).
  2. `src/components/admin/DashboardLayout.tsx` (indicadores de versión en el sidebar de escritorio y en el menú móvil lateral).
  3. `README.md` (encabezado del Design System, títulos y Changelog).

### 3. 📖 Documentación y Actualización Continua de README.md
- Tras cualquier cambio relevante, integración de módulos o mejoras arquitectónicas, **evaluar y actualizar el `README.md`** para reflejar:
  - Nuevas características o especificaciones de UX añadidas.
  - Esquemas de datos o integración con servicios externos.
  - Reglas de negocio clave (ej. mandado semanal vs finanzas, deudas bidireccionales, etc.).
  - Changelog exhaustivo de la versión desplegada.

### 4. 🚀 Cero Fallos en Compilación y Despliegue Obligatorio en Cada Iteración
- **Validación previa:** Siempre ejecutar y verificar con `yarn build` (`tsc -b && vite build`) que no existan errores de TypeScript, imports rotos ni advertencias bloqueantes antes de desplegar.
- **Flujo de Git y Despliegue (Cero Retención de Cambios):**
  - Los cambios se integran y verifican primero en la rama `development`.
  - Se realiza commit atómico con mensaje semántico descriptivo (`feat`, `fix`, `docs`, `style`).
  - Se sube a `development` (`git push origin development`).
  - Se fusiona a `production` (`git checkout production`, `git merge development`, `git push origin production`), rama conectada al CI/CD de Netlify.
  - Se regresa a la rama de trabajo `development` (`git checkout development`).
  - **Queda estrictamente prohibido dar por finalizada una respuesta dejando commits o cambios pendientes de subida en local.**

---

## 🛠️ Arquitectura y Stack Tecnológico

- **Core:** React 18 + Vite + TypeScript
- **Estilos:** TailwindCSS + Vanilla CSS tokens (`src/index.css`)
- **Animaciones:** Framer Motion
- **Iconos:** React Icons (`Hi*`, `Fa*`, `Io*`, `Md*`)
- **Backend & Auth:** Supabase (`@supabase/supabase-js`)
- **PWA:** Vite PWA Plugin con soporte offline y Web Push Ready

---

## 💡 Patrones de Código y Reglas de Negocio Establecidas

### 1. ↩️ Deshacer Universal (Undo)
- Cualquier acción destructiva / eliminación debe ejecutarse mediante `toast.undoable('Mensaje...', async () => { /* restauración en Supabase y estado local */ })` provisto por `src/components/common/ToastContext.tsx`.

### 2. 🪟 Arquitectura Estricta de Modales (4 Partes) y Cierre por Backdrop
- Todos los modales deben implementar obligatoriamente la arquitectura de 4 partes:
  1. **Backdrop con Cierre:** Fondo oscuro con blur (`bg-black/60 backdrop-blur-md`) con soporte de cierre al hacer clic exterior (`onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}` con `e.stopPropagation()` en el hijo).
  2. **Cabecera Fija Superior (`shrink-0`):** Título, subtítulo conciso y botón de cierre táctil `X` (mínimo 40x40px).
  3. **Cuerpo Central Scrollable (`flex-1 min-h-0 overflow-y-auto`):** Único elemento que genera scroll vertical, con padding adaptativo y contenedor de formularios.
  4. **Pie Fijo Inferior (`shrink-0`):** Contenedor de acciones fijado con botón secundario/cancelar a la izquierda y botón primario de acción/guardar a la derecha.

### 3. 🤖 Cobertura Total en Búsqueda Global y Asistente de IA (`CommandPalette.tsx`)
- Al crear, modificar o extender cualquier módulo o tabla de datos del panel (ej. `notas`, `mandado`, `deudas`, `enlaces`, `recetas`, `finanzas`, `plantas`, `boveda`, `proyectos`, etc.), **es obligatorio actualizar `CommandPalette.tsx`**:
  - Incluir la entidad en las consultas y tipos de búsqueda global (`searchAll`) con soporte de caché (`cache.ts`).
  - Inyectar el resumen o datos de la entidad en el prompt de contexto del Asistente de IA (`system_prompt`) para que siempre responda con conocimiento actualizado de toda la app.

### 4. 🥗 Lógica de Negocio de Mandado Semanal vs Finanzas Mensuales
- Todos los productos de mandado semanal (`isMandadoItem` / `tipo: semanal` o retrocompatible `quincenal`) representan compras recurrentes de dieta e insumos realizadas cada 7 días.
- En el modal de Mandado (`src/components/admin/MandadoModal.tsx`), el estimador mensual proyecta $\times 4$ el costo semanal (`item.price * 4`).
- El registro de compras reales en Modo Súper (`⚡ Modo Súper`) ingresa gastos fechados individualmente al historial de Finanzas (`finance_expenses`).

### 5. 🌓 Soporte Bimodal Estricto (Dark Mode & Light Mode)
- Todo componente, formulario, tarjeta, modal o estado de carga debe estar diseñado con soporte nativo para **Modo Claro** y **Modo Oscuro** usando clases Tailwind explícitas:
  - Fondos: `bg-white dark:bg-gray-900` / `bg-gray-50 dark:bg-gray-800`
  - Textos: `text-gray-900 dark:text-white` / `text-gray-500 dark:text-gray-400`
  - Bordes y líneas: `border-gray-100 dark:border-gray-800`
  - Focus & rings: `focus:border-[var(--vibrant-sky-blue)]`

### 6. 📲 PWA, Notificaciones y Modo Offline Resiliente
- La aplicación es una PWA instalable configurada con `vite-plugin-pwa`.
- Cualquier cambio en la estructura de archivos, service workers o assets públicos debe mantener la validez del manifiesto web (`dist/manifest.webmanifest`) y la suscripción/permiso a notificaciones del navegador (`requestNotificationPermission`).
- Las notificaciones en primer plano se silencian internamente para evitar popups molestos del SO mientras el usuario tiene la app abierta.

### 7. ⚡ Optimización de Rendimiento, Egress de Supabase y Empaquetado (Bundle Hygiene & Cache)
- **Caché en Memoria y SessionStorage:** Utilizar el gestor de caché `src/lib/cache.ts` con TTL para reducir drásticamente el egress saliente a Supabase (~90% de ahorro) en búsquedas globales y consultas repetitivas.
- **Proyecciones Específicas:** Proyectar solo las columnas necesarias en `select('id, name, ...')` cuando no se requieran payloads completos.
- **Tree-Shaking de Iconos:** Importar iconos y utilidades de forma granular y eficiente (ej. `import { HiPlus } from 'react-icons/hi'` en lugar de paquetes gigantes).

### 8. 🛡️ Persistencia Resiliente en Supabase y Seguridad en `localStorage`
- Siempre envolver consultas a Supabase en bloques `try/catch` con feedback visual al usuario (`toast.error` / `toast.success`).
- Manejar fallbacks defensivos ante columnas opcionales en tablas de Supabase.
- **Seguridad en Almacenamiento Local:** Siempre proteger accesos a `localStorage` y `sessionStorage` con bloques `try/catch` para evitar bloqueos en modo incógnito de Safari. Queda estrictamente prohibido guardar contraseñas o tokens sensibles en texto plano.

### 9. 🎛️ Componentes Unificados de Formulario (`CustomSelect` y `CustomDatePicker`)
- **Selectores:** Todos los selectores de opciones/categorías deben utilizar el componente reutilizable `CustomSelect` (`src/components/common/CustomSelect.tsx`). Queda estrictamente prohibido el menú desplegable gris tosco nativo del sistema operativo en formularios del panel.
- **Fechas:** Todos los campos de fecha en formularios y modales deben utilizar el componente unificado `CustomDatePicker` (`src/components/common/CustomDatePicker.tsx`) con popup animado, soporte de modo oscuro/claro y portal flotante, evitando selectores nativos inconsistentes.

### 10. 🔍 Estandarización Universal de Tablas, Listados y Búsquedas Insensibles a Acentos
- **Búsqueda Insensible a Acentos Obligatoria:** Todo filtro o buscador de la aplicación debe normalizar caracteres diacríticos mediante la función estándar:
  ```ts
  const normalize = (s: string | null | undefined) =>
    (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  ```
- **Higiene en Barras de Búsqueda:** El icono de búsqueda debe ser un vector SVG de lupa alineado a la izquierda con padding izquierdo adecuado (`pl-10` a `pl-12`), sin textos "BUSCAR" encimados sobre los placeholders.
- **Badges de Conteo y Estados Vacíos:** Todo listado debe mostrar conteo reactivo de elementos y un estado vacío estético y claro cuando no existan coincidencias, con opción para restablecer filtros o registrar nuevos elementos.
