# Especificaciones y Reglas del Proyecto (AC Website & Admin Panel)

Este documento define las directrices maestras, arquitectura y criterios obligatorios de entrega que Antigravity debe seguir estrictamente al desarrollar, modificar o integrar nuevas funcionalidades en este proyecto.

---

## 🎯 Reglas Maestras Obligatorias en Cada Tarea

### 1. 📱 Responsividad Móvil y Tablet Impecable (Mobile-First / Adaptive)
- Todo cambio, nuevo modal, componente, formulario o vista de datos **debe estar 100% adaptado a móviles (iOS/Android), tablets y pantallas de escritorio**.
- **Reglas de UI móvil:**
  - Evitar desbordamientos horizontales (`overflow-x-hidden`, anchos responsivos con `w-full max-w-lg sm:max-w-xl`, padding adaptativo `p-4 sm:p-6 lg:p-8`).
  - Todos los modales deben tener scroll vertical contenido (`max-h-[85vh]` a `max-h-[90vh]`, `overflow-y-auto`).
  - Los campos de texto largo o Markdown deben ser verticalmente redimensionables (`resize-y`, `min-h-[140px]`).
  - Los botones interactivos y acciones rápidas deben tener áreas de toque confortables para dedos en pantallas táctiles (`min-h-[44px]` o padding suficiente).

### 2. 🏷️ Control de Versiones Automático (Version Bump)
- Al completar cualquier conjunto de cambios, nueva feature, refactorización o corrección, **se debe incrementar el número de versión (SemVer)** de la aplicación.
- La versión debe mantenerse sincronizada en:
  1. `package.json` (campo `"version"`).
  2. `src/components/admin/DashboardLayout.tsx` (indicadores de versión en el sidebar de escritorio y en el menú móvil lateral).
  3. `README.md` (encabezado del Design System & Changelog).

### 3. 📖 Documentación y Actualización de README.md
- Tras cualquier cambio relevante, integración de módulos o mejoras arquitectónicas, **evaluar y actualizar el `README.md`** para reflejar:
  - Nuevas características o especificaciones de UX añadidas.
  - Esquemas de datos o integración con servicios externos.
  - Reglas de negocio clave (ej. cálculo de mandado quincenal vs mensual, sistema de Deshacer `undo`, etc.).

### 4. 🚀 Cero Fallos en Compilación y Despliegue en Netlify
- **Validación previa:** Siempre ejecutar y verificar con `yarn build` (`tsc -b && vite build`) que no existan errores de TypeScript, imports rotos ni advertencias bloqueantes antes de desplegar.
- **Flujo de Git y Despliegue:**
  - Los cambios se integran y verifican primero en la rama `development`.
  - Se realiza commit descriptivo.
  - Se sube a `development` y luego se fusiona a `production` (`git push origin production`), rama conectada al CI/CD de Netlify.

---

## 🛠️ Arquitectura y Stack Tecnológico

- **Core:** React 18 + Vite + TypeScript
- **Estilos:** TailwindCSS + Vanilla CSS tokens (`src/index.css`)
- **Animaciones:** Framer Motion
- **Iconos:** React Icons (`Hi*`, `Fa*`, `Io*`)
- **Backend & Auth:** Supabase (`@supabase/supabase-js`)
- **PWA:** Vite PWA Plugin con soporte offline y Web Push Ready

---

## 💡 Patrones de Código y Reglas de Negocio Establecidas

1. **Deshacer Universal (Undo ↩️):**
   - Cualquier acción destructiva / eliminación debe ejecutarse mediante `toast.undoable('Mensaje...', async () => { /* restauración en Supabase y estado local */ })` provisto por `src/components/common/ToastContext.tsx`.

2. **Cierre de Modales por Backdrop:**
   - Todos los modales deben soportar cierre al hacer clic en el fondo (`onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}` con `e.stopPropagation()` en el contenedor hijo).

3. **🤖 Cobertura Total en Búsqueda Global y Asistente de IA (`CommandPalette.tsx`):**
   - Al crear, modificar o extender cualquier módulo o tabla de datos del panel (ej. `notas`, `mandado`, `deudas`, `enlaces`, `recetas`, `salario`, etc.), **es obligatorio actualizar `CommandPalette.tsx`**:
     - Incluir la entidad en las consultas y tipos de búsqueda global (`searchAll`).
     - Inyectar el resumen o datos de la entidad en el prompt de contexto del Asistente de IA (`system_prompt`) para que siempre responda con conocimiento actualizado de toda la app.

4. **🥗 Lógica de Negocio de Mandado vs Finanzas Mensuales:**
   - Todos los productos de mandado quincenales (`isQuincenalItem` / `tipo: quincenal`) representan compras recurrentes cada 15 días.
   - En el módulo de Finanzas (`src/pages/admin/Finanzas.tsx`), el total del mandado se multiplica automáticamente $\times 2$ (`item.price * 2`) para calcular con exactitud el gasto mensual proyectado y el balance salarial restante.

5. **🌓 Soporte Bimodal Estricto (Dark Mode & Light Mode):**
   - Todo componente, formulario, tarjeta, modal o estado de carga debe estar diseñado con soporte nativo para **Modo Claro** y **Modo Oscuro** usando clases Tailwind explícitas:
     - Fondos: `bg-white dark:bg-gray-900` / `bg-gray-50 dark:bg-gray-800`
     - Textos: `text-gray-900 dark:text-white` / `text-gray-500 dark:text-gray-400`
     - Bordes y líneas: `border-gray-100 dark:border-gray-800`
     - Focus & rings: `focus:border-[var(--vibrant-sky-blue)]`

6. **📲 PWA, Notificaciones y Modo Offline Resiliente:**
   - La aplicación es una PWA instalable configurada con `vite-plugin-pwa`.
   - Cualquier cambio en la estructura de archivos, service workers o assets públicos debe mantener la validez del manifiesto web (`dist/manifest.webmanifest`) y la suscripción/permiso a notificaciones del navegador (`requestNotificationPermission`).

7. **⚡ Optimización de Rendimiento y Empaquetado (Bundle Hygiene):**
   - Importar iconos y utilidades de forma granular y eficiente (ej. `import { HiPlus } from 'react-icons/hi'` en lugar de paquetes gigantes sin tree-shaking).
   - Mantener el tamaño de chunks optimizado y verificar con `yarn build` que no se generen advertencias críticas de empaquetado.

8. **Persistencia Resiliente en Supabase:**
   - Siempre envolver consultas en bloques `try/catch` con feedback visual al usuario (`toast.error` / `toast.success`).
   - Manejar fallbacks defensivos ante columnas opcionales en tablas de Supabase.

9. **🎛️ Componentes Unificados de Formulario (`CustomSelect` y `CustomDatePicker`):**
   - Todos los selectores de opciones/categorías deben utilizar el componente reutilizable `CustomSelect` (`src/components/common/CustomSelect.tsx`).
   - Todos los campos de fecha en formularios y modales deben utilizar el componente unificado `CustomDatePicker` (`src/components/common/CustomDatePicker.tsx`) con popup animado, soporte de modo oscuro/claro y portal flotante, evitando selectores nativos inconsistentes.
