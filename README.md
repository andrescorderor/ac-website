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
1.  **Professional Portfolio:** A high-end landing page showcasing my engineering background, skills, and achievements.
2.  **Personal Panel PWA:** A private, secure productivity suite designed for daily life management.

---

## 🛠️ Personal Panel PWA - Features

The productivity hub is a mobile-optimized private dashboard with specialized modules:

*   📊 **Finance Manager:** Track monthly expenses, manage salary, and toggle **Privacy Mode** to mask sensitive monetary values.
*   ✅ **Task Management (Pendientes):** Effective task list with default pending filter, status tabs, and real-time search.
*   📝 **Important Notes (Notas Importantes):** Create and edit rich notes with optional bullet formatting, categories, and reference links.
*   🔐 **Secure Vault:** Encrypted-access storage for sensitive texts (IDs, cards) with quick copy-to-clipboard functionality.
*   🛒 **Smart Shopping List:** Manage unbought items with priority, location tracking, and price estimates.
*   📅 **Important Reminders:** Categorized dates & optional times (Birthdays, Documents, Payments) with proximity alerts and recurring support.
*   💸 **Debt Tracker:** Monitor pending payments and collections with default pending filters.
*   🎨 **Creative Projects (Proyectos Creativos):** Private portfolio to manage side projects, track progress, and organize sub-tasks.
*   📋 **Monthly Checklist (Checklist Mensual):** Recurring habits and payments tracker that auto-resets every month with historical read-only view.
*   🍽️ **Recipe Book (Mis Recetas):** Recipe manager with ingredient purchase checklists, video/social media reference links, and bullet formatting.

### ✨ Premium UX Design
*   👁️ **Global Privacy Mode & Dark Mode Default:** One-click toggle to mask financial values and default high-contrast dark theme.
*   📌 **Universal Pinned Items Section:** Pin any item (notes, reminders, tasks, debts, vault items, shopping items) directly from module cards or search, and view them on the main dashboard home.
*   🔍 **Global Command Palette (`Ctrl + K` / `Cmd + K`):** Instant search modal accessible anywhere across the app to query all 8 modules simultaneously.
*   🔔 **PWA Floating Push Notifications:** Native browser & mobile push alerts scanning upcoming reminders and pending tasks due today or in the next 2 days.
*   ⚡ **Persistent Active Session Auto-Redirect:** Automatically detects existing login sessions on `https://andresmcorderor.netlify.app/` and redirects straight to the private dashboard.
*   🌐 **Landing Page Navigation Link:** Easy "Ver Landing Page" link on login and panel navigation to view the public portfolio anytime.
*   🔔 **Toast Alert System:** Real-time feedback notifications for creation, edit, and deletion actions.
*   ⏳ **Submit Protection:** Loading indicators and button locking during async operations to prevent duplicate submissions.
*   📱 **Auto-Hide Navigation & Responsive Layouts:** Mobile-optimized headers and square responsive sidebar navigation.
*   🚀 **Database Keep-Alive & Auto-Backups:** Automated GitHub Actions workflows for database pinging and bi-monthly JSON backups.

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
