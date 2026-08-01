<div align="center">
  <img src="public/assets/ac-website-icon.svg" alt="Logo" width="100" />
  
  # Andrés Cordero - Professional Portfolio & Personal Panel PWA ✨
  
  **Welcome to my personal ecosystem: a professional portfolio and a custom productivity hub.**  
  Built with UX/UI best practices, premium design, and a focus on mobile-first efficiency.

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

</div>

---

## 🚀 Overview

This repository hosts a dual-purpose platform:
1. **Professional Portfolio:** A high-end landing page showcasing my engineering background, skills, and achievements.
2. **Personal Panel PWA:** A private, secure productivity suite designed for daily life management.

---

## 🛠️ Personal Panel PWA - Core Modules

The productivity hub is a mobile-optimized private dashboard with 11 specialized modules:

*   📊 **Finance Manager (Finanzas):** Track monthly expenses, manage salary, category breakdown, and toggle **Privacy Mode** to mask sensitive monetary values.
*   ✅ **Task Management (Pendientes):** Effective task list with default pending filter, status tabs, and real-time search.
*   📝 **Important Notes (Notas Importantes):** Create and edit rich notes with optional bullet formatting, categories, and reference links.
*   🪴 **Plant Care Tracker (Mis Plantas):** Monitor watering schedules, species details, location recommendations, and watering logs.
*   🔗 **Bookmarks & Quick Links (Enlaces Rápidos):** Organize web tools, portals, and categories for fast access.
*   🔐 **Secure Vault (Bóveda de Textos):** Encrypted-access storage for sensitive texts (IDs, cards) with quick copy-to-clipboard functionality.
*   🛒 **Smart Shopping List & Mandado Quincenal Modal 🥗:** Comprehensive routine for bi-weekly diet and consumable supplies ("Hasta Agotar 📦") featuring hidden-by-default add form, checklist priority, store location tagging, direct launchers from Dashboard and Finanzas, and automated breakdown sync into **Finanzas** (`Comida 🍔` & `Insumos 🛒`).
*   📅 **Important Reminders (Fechas Importantes):** Categorized dates & optional times (Birthdays, Documents, Payments) with proximity alerts and recurring support.
*   💸 **Debt Tracker (Mis Deudas):** Monitor pending payments and collections with default pending filters.
*   🎨 **Creative Projects (Proyectos Creativos):** Private portfolio to manage side projects, track progress, organize sub-tasks, and filter dynamically by status and project category/type.
*   📋 **Monthly Checklist (Checklist Mensual):** Recurring habits and payments tracker that auto-resets every month with historical read-only view.
*   🍽️ **Recipe Book (Mis Recetas):** Recipe manager with ingredient purchase checklists, video/social media reference links, and bullet formatting.

---

## ✨ Design System & Master UX Specs (v1.201.0)

*   🏷️ **Automatic Commit-Based Versioning (`v1.201.0`):** Live versioning indicator displayed seamlessly in desktop and mobile sidebars.

*   👁️ **Global Privacy Mode & Dark Mode Default:** One-click toggle to mask financial values and default high-contrast dark theme.
*   🪟 **Universal Portal Floating Modals:** Every form across all 11 modules utilizes a React `createPortal` modal system rendered directly into `document.body` with fixed backdrop blurs (`backdrop-blur-sm`), smooth entrance animations, and full z-index isolation.
*   🔽 **100% Unified Custom Dropdowns (`CustomSelect`):** All native selects replaced with custom interactive Framer Motion dropdown components featuring checkmark indicators, keyboard accessibility, and z-index isolation.
*   🍞 **Ultra High Z-Index Toast System (`createPortal` & `z-[999999]`):** Toast notifications render directly to `document.body` above all modals and blur backdrop layers.
*   🔤 **Unified Button Design System:** Harmonized action buttons, filter pills, and modal submit/cancel triggers across all 11 modules (`font-syne text-xs font-bold uppercase tracking-wider`).
*   📱 **Full-Screen Mobile Search & AI Chat:** Command Palette modal (`Ctrl + K`) scales to full-screen on mobile devices for seamless queries and Gemini Flash 1.5 chat interaction.
*   🔽 **Custom UI Select Dropdowns (`CustomSelect`):** Native ugly dropdowns replaced with interactive custom Framer Motion dropdown components and native `color-scheme: dark` fallback support.
*   🎨 **Unified Glassmorphism Card System:** Borderless dark glass aesthetic (`dark-glass`) across all 11 modules with consistent shadow effects, hover scaling, and rounded corners (`rounded-[2rem]`).
*   📌 **Universal Pinned Items System:** Filter and collapse/expand pinned items (notes, reminders, tasks, debts, vault items, shopping items, projects, plants) directly from the dashboard home.
*   🔍 **Global Command Palette (`Ctrl + K` / `Cmd + K`):** Dual-mode search modal covering all 11 modules simultaneously, keyboard navigation, result highlighting, category grouping, and **🤖 100% Free AI Assistant Mode** powered by Gemini 1.5 Flash to query live database context.
*   🔔 **PWA Floating Push Notifications:** Native browser & mobile push alerts scanning upcoming reminders, pending tasks, and plant watering schedules.
*   💀 **Unified Skeleton Loaders & Loaders:** Animated shimmer loading states and smooth spinners across all modules.
*   💾 **Automated Database Backups:** GitHub Actions automation performing daily database pinging and bi-monthly automated JSON backups.

---

## 👨‍💻 About Me

Software Engineer specializing in Frontend Development and Project Management, focusing on creating scalable solutions and interfaces that users love.

🌟 **Highlights:**
- 🛠️ Development of complex web applications and interactive PWAs.
- 🎨 UI/UX Expert with a focus on "Premium & Alive" interfaces.
- 🎓 Software Engineering Graduate | Universidad La Salle Bajío.
- 🏆 1st Place | Hackathon Mejora Regulatoria 2.0.

---

## 🛠️ Tech Stack

*   ⚛️ **React + TypeScript**: Solid, scalable component architecture.
*   ⚡ **Vite**: Ultra-fast development and build environment.
*   🎨 **Tailwind CSS**: Modern utility-first styling with custom glassmorphism and gradients.
*   🔥 **Supabase**: Real-time database, authentication, and secure RLS policies.
*   🎞️ **Framer Motion**: Premium fluid animations and transitions.
*   📲 **Vite PWA Plugin**: For offline support and "Add to Home Screen" capability.

---

## ⚙️ Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/andrescorderor/ac-website.git
   ```
2. **Install dependencies:**
   ```bash
   yarn install
   ```
3. **Environment Variables:**
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
4. **Start the development server:**
   ```bash
   yarn dev
   ```

---

## 📬 Contact

- 💼 **LinkedIn**: [andresmcorderor](https://www.linkedin.com/in/andresmcorderor/)
- 💻 **GitHub**: [andrescorderor](https://github.com/andrescorderor)

---

<div align="center">
  <sub>Made with ❤️, precision, and clean code.</sub>
</div>
