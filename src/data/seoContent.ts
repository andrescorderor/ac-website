export interface LocalizedCopy {
  es: string;
  en: string;
}

export interface ServiceLandingItem {
  slug: string;
  code: string;
  topic: LocalizedCopy;
  metaTitle: LocalizedCopy;
  metaDescription: LocalizedCopy;
  eyebrow: LocalizedCopy;
  headline: LocalizedCopy;
  accentWord: LocalizedCopy;
  summary: LocalizedCopy;
  coverageTag: LocalizedCopy;
  metrics: { value: string; label: LocalizedCopy }[];
  painPoints: { title: LocalizedCopy; detail: LocalizedCopy }[];
  deliverables: LocalizedCopy[];
  relatedGuideSlug: string;
  diagnosticTab: 'diagnostico' | 'estimador' | 'checklist_qa';
}

export interface GuideItem {
  slug: string;
  code: string;
  readTime: LocalizedCopy;
  publishedDate: string;
  metaTitle: LocalizedCopy;
  metaDescription: LocalizedCopy;
  title: LocalizedCopy;
  subtitle: LocalizedCopy;
  tags: string[];
  sections: { heading: LocalizedCopy; body: LocalizedCopy; takeaway: LocalizedCopy }[];
  relatedServiceSlug: string;
  diagnosticTab: 'diagnostico' | 'estimador' | 'checklist_qa';
}

export const SERVICE_LANDINGS: ServiceLandingItem[] = [
  {
    slug: 'desarrollo-software-ia',
    code: 'SRV // 01',
    topic: { es: 'Desarrollo de Software & IA', en: 'Custom Software & AI' },
    metaTitle: {
      es: 'Desarrollo de Software a Medida e IA en México y León, Gto. | Andrés Cordero',
      en: 'Custom Software & Applied AI Engineering in Mexico | Andrés Cordero',
    },
    metaDescription: {
      es: 'Diseño y desarrollo de aplicaciones web, sistemas internos, PWAs y automatización con inteligencia artificial para empresas en León, Guanajuato, todo México y en inglés.',
      en: 'Full-stack web applications, internal portals, PWAs, and practical AI integration engineered for companies in Mexico and international teams.',
    },
    eyebrow: { es: 'SERVICIO // SOFTWARE A MEDIDA + IA', en: 'SERVICE // CUSTOM SOFTWARE + AI' },
    headline: { es: 'Software a medida con', en: 'Custom software powered by' },
    accentWord: { es: 'IA aplicada.', en: 'applied AI.' },
    summary: {
      es: 'Plataformas web, portales operativos, PWAs y flujos con visión computacional o LLMs listos para usuarios reales en producción.',
      en: 'Scalable web platforms, internal systems, PWAs, and practical LLM or vision workflows built for real production workloads.',
    },
    coverageTag: { es: 'León, Gto. · Todo México · ES / EN', en: 'León, MX · All Mexico · EN / ES' },
    metrics: [
      { value: '0 → PROD', label: { es: 'Arquitectura a producción', en: 'Architecture to release' } },
      { value: '100% OWN', label: { es: 'Código y datos tuyos', en: 'Full code & data ownership' } },
      { value: 'AI READY', label: { es: 'OCR, LLMs y automatización', en: 'OCR, LLMs & automation' } },
    ],
    painPoints: [
      {
        title: { es: 'Software genérico que frena tu operación', en: 'Off-the-shelf tools forcing workarounds' },
        detail: {
          es: 'Construyo exactamente los módulos, permisos y reglas que tu negocio usa cada día sin pagar licencias por usuario.',
          en: 'Build the exact workflows, permissions, and dashboards your operation requires without recurring per-seat bloat.',
        },
      },
      {
        title: { es: 'Captura manual lenta y propensa a errores', en: 'Slow manual data entry & friction' },
        detail: {
          es: 'Integro visión computacional (tickets, facturas, documentos) y asistentes contextuales con validación humana previa.',
          en: 'Integrate multimodal vision extraction and structured LLM flows with human review gates before saving.',
        },
      },
      {
        title: { es: 'Proyectos que se quedan a medias', en: 'Stalled prototypes that never launch' },
        detail: {
          es: 'Entregas iterativas semanales en producción con TypeScript estricto, control de versiones y despliegue automatizado.',
          en: 'Weekly production increments backed by strict TypeScript, version control, and automated CI/CD releases.',
        },
      },
    ],
    deliverables: [
      { es: 'Aplicaciones web responsivas y PWAs instalables (React, TypeScript, Node, PostgreSQL/Supabase)', en: 'Responsive web apps and installable PWAs (React, TypeScript, Node, PostgreSQL/Supabase)' },
      { es: 'Integración de IA práctica: lectura de imágenes/documentos, clasificación y asistentes internos', en: 'Practical AI integration: document/image parsing, classification, and internal assistants' },
      { es: 'Control de accesos por rol (RLS), auditoría de datos y documentación técnica transferible', en: 'Role-based security (RLS), auditability, and clean transferable technical documentation' },
    ],
    relatedGuideSlug: 'ia-aplicada-empresas-mexico',
    diagnosticTab: 'estimador',
  },
  {
    slug: 'digitalizacion-procesos',
    code: 'SRV // 02',
    topic: { es: 'Digitalización y Optimización de Procesos', en: 'Process Digitization & PM' },
    metaTitle: {
      es: 'Digitalización y Optimización de Procesos Empresariales en México | Andrés Cordero',
      en: 'Business Process Digitization & Agile Delivery | Andrés Cordero',
    },
    metaDescription: {
      es: 'Transforma operaciones en Excel y WhatsApp en sistemas digitales trazables con tableros ejecutivos y dirección ágil de proyectos en León, Gto. y todo México.',
      en: 'Replace fragmented spreadsheets and manual follow-ups with traceable digital systems, executive dashboards, and agile governance.',
    },
    eyebrow: { es: 'SERVICIO // PROCESOS Y DIGITALIZACIÓN', en: 'SERVICE // PROCESS DIGITIZATION' },
    headline: { es: 'Procesos claros,', en: 'Clear workflows,' },
    accentWord: { es: 'operación trazable.', en: 'traceable execution.' },
    summary: {
      es: 'Elimina retrabajos, hojas de cálculo duplicadas y seguimientos perdidos en chats convirtiendo tu flujo operativo en un sistema medible.',
      en: 'Eliminate rework, duplicate spreadsheets, and scattered chat updates by turning your operation into a measurable digital system.',
    },
    coverageTag: { es: 'Presencial Bajío · Remoto México · ES / EN', en: 'Onsite Bajío · Remote Worldwide · EN / ES' },
    metrics: [
      { value: '−60% CAP', label: { es: 'Menos captura duplicada', en: 'Less manual re-entry' } },
      { value: 'REAL-TIME', label: { es: 'Visibilidad directiva', en: 'Executive visibility' } },
      { value: 'AGILE PM', label: { es: 'Hitos y responsables claros', en: 'Clear milestones & owners' } },
    ],
    painPoints: [
      {
        title: { es: 'Dependencia crítica de hojas de Excel', en: 'Mission-critical spreadsheets breaking' },
        detail: {
          es: 'Centralizo inventarios, cotizaciones, órdenes y seguimiento en una base de datos única con historial y respaldos.',
          en: 'Centralize orders, inventory, and approvals in a single source of truth with full change history and backups.',
        },
      },
      {
        title: { es: 'Cuellos de botella invisibles entre áreas', en: 'Hidden handoff bottlenecks' },
        detail: {
          es: 'Mapeo tu operación real, simplifico pasos innecesarios y automatizo alertas cuando un pendiente requiere acción.',
          en: 'Audit your real workflow, strip unnecessary handoffs, and automate alerts when tasks need attention.',
        },
      },
      {
        title: { es: 'Falta de alineación entre negocio y tecnología', en: 'Gap between business and engineering' },
        detail: {
          es: 'Actúo como puente técnico y Project Manager ágil traduciendo metas comerciales en entregables semanales verificables.',
          en: 'Bridge executives and engineers with clear technical specs, prioritized backlogs, and predictable sprints.',
        },
      },
    ],
    deliverables: [
      { es: 'Diagnóstico operativo con mapa de cuellos de botella y plan de digitalización por fases', en: 'Operational diagnostic mapping bottlenecks and a phased digitization roadmap' },
      { es: 'Portales internos con roles, estatus en tiempo real, exportación y alertas automáticas', en: 'Internal web portals with role access, real-time statuses, exports, and automated alerts' },
      { es: 'Dirección ágil de proyectos (Scrum / Kanban) para equipos internos o proveedores externos', en: 'Agile project governance (Scrum / Kanban) coordinating internal or external engineering teams' },
    ],
    relatedGuideSlug: 'de-excel-y-whatsapp-a-sistema-web',
    diagnosticTab: 'diagnostico',
  },
  {
    slug: 'pruebas-qa',
    code: 'SRV // 03',
    topic: { es: 'Pruebas de Software y QA', en: 'Software Testing & QA' },
    metaTitle: {
      es: 'Pruebas de Software, Automatización y Liderazgo QA en México | Andrés Cordero',
      en: 'Software Testing, QA Automation & Release Leadership | Andrés Cordero',
    },
    metaDescription: {
      es: 'Estrategia QA, pruebas funcionales, automatización E2E/API y compuertas CI/CD para reducir errores en producción hasta 40%. Servicio en español e inglés.',
      en: 'Risk-based QA strategy, automated E2E/API suites, and CI/CD quality gates reducing production defects by up to 40%. English & Spanish.',
    },
    eyebrow: { es: 'SERVICIO // PRUEBAS DE SOFTWARE Y QA', en: 'SERVICE // QA & QUALITY ENGINEERING' },
    headline: { es: 'Lanza a producción con', en: 'Release to production with' },
    accentWord: { es: 'confianza medible.', en: 'measurable confidence.' },
    summary: {
      es: 'Estructura tu estrategia de calidad, automatiza regresiones críticas y evita que tus clientes descubran los errores primero.',
      en: 'Establish risk-based QA protocols, automate critical regressions, and stop shipping preventable defects to customers.',
    },
    coverageTag: { es: 'Equipos México & EE.UU. · Bilingüe EN / ES', en: 'Mexico & US Teams · Bilingual EN / ES' },
    metrics: [
      { value: '−40% BUGS', label: { es: 'Menos fallos en despliegues', en: 'Lower deployment defect rate' } },
      { value: 'CI / CD', label: { es: 'Compuertas automatizadas', en: 'Automated release gates' } },
      { value: 'E2E + API', label: { es: 'Cobertura en rutas críticas', en: 'Critical-path coverage' } },
    ],
    painPoints: [
      {
        title: { es: 'Cada actualización rompe funciones existentes', en: 'Every release triggers regressions' },
        detail: {
          es: 'Diseño matrices de regresión priorizadas por riesgo de negocio y suites automatizadas repetibles.',
          en: 'Build risk-prioritized regression matrices and repeatable automated test suites across revenue paths.',
        },
      },
      {
        title: { es: 'Sin criterios claros antes de liberar', en: 'No objective sign-off gates' },
        detail: {
          es: 'Implemento checklists de aceptación, validación de APIs y controles automáticos integrados a tu flujo Git.',
          en: 'Implement clear acceptance criteria, API validation, and automated checks directly inside your Git workflow.',
        },
      },
      {
        title: { es: 'Equipos de desarrollo saturados probando manualmente', en: 'Developers slowed down by manual checks' },
        detail: {
          es: 'Lidero la coordinación QA, trazabilidad de incidentes y documentación de defectos para acelerar el ritmo del equipo.',
          en: 'Lead QA coordination, defect traceability, and UAT cycles so developers stay focused on building.',
        },
      },
    ],
    deliverables: [
      { es: 'Auditoría de calidad del producto actual y matriz de pruebas basada en riesgo', en: 'Current product quality audit and risk-based test strategy matrix' },
      { es: 'Automatización de flujos críticos (Playwright / Selenium / Postman / CI)', en: 'Automated critical-path and API test suites (Playwright / Selenium / Postman / CI)' },
      { es: 'Coordinación de ciclos UAT, reporte ejecutivo de defectos y métricas de liberación', en: 'UAT cycle orchestration, structured defect tracking, and executive release sign-off' },
    ],
    relatedGuideSlug: 'reducir-errores-produccion-qa',
    diagnosticTab: 'checklist_qa',
  },
  {
    slug: 'leon-guanajuato',
    code: 'GEO // BAJÍO',
    topic: { es: 'Consultoría Tecnológica en León, Gto.', en: 'Software & Process Consulting — León, MX' },
    metaTitle: {
      es: 'Desarrollo de Software, Procesos y QA en León, Guanajuato y Bajío | Andrés Cordero',
      en: 'Software Engineer & Process Consultant in León, Guanajuato, Mexico | Andrés Cordero',
    },
    metaDescription: {
      es: 'Ingeniero en Software egresado de Universidad de La Salle Bajío en León, Guanajuato. Atención presencial e híbrida en Bajío y remota para todo México y EE.UU.',
      en: 'Software Engineer based in León, Guanajuato (Bajío), serving local industry onsite/hybrid and remote teams across Mexico and the US.',
    },
    eyebrow: { es: 'COBERTURA LOCAL // LEÓN, GUANAJUATO Y BAJÍO', en: 'LOCAL PRESENCE // LEÓN, GUANAJUATO & BAJÍO' },
    headline: { es: 'Ingeniería senior en', en: 'Senior engineering in' },
    accentWord: { es: 'León, Guanajuato.', en: 'León, Guanajuato.' },
    summary: {
      es: 'Acompañamiento directo presencial o híbrido para empresas industriales, comerciales y startups de León, Querétaro, Irapuato y todo México.',
      en: 'Direct onsite or hybrid partnership for industrial, commercial, and tech organizations in León, Bajío, nationwide Mexico, and abroad.',
    },
    coverageTag: { es: 'León · Silao · Irapuato · Querétaro · Todo México', en: 'León · Bajío · All Mexico · US Timezone' },
    metrics: [
      { value: 'BAJÍO', label: { es: 'Sesiones presenciales / híbridas', en: 'Onsite & hybrid discovery' } },
      { value: 'CST / MX', label: { es: 'Horario sincronizado MX & EE.UU.', en: 'Aligned MX & US timezone' } },
      { value: 'ES / EN', label: { es: 'Operación bilingüe fluida', en: 'Fluent bilingual delivery' } },
    ],
    painPoints: [
      {
        title: { es: 'Necesitas un aliado técnico cercano que entienda tu negocio', en: 'Need an accessible technical partner' },
        detail: {
          es: 'Sesiones directas de diagnóstico en León y corredor industrial del Bajío sin intermediarios ni agencias infladas.',
          en: 'Direct discovery sessions across León and the Bajío industrial corridor without agency layers.',
        },
      },
      {
        title: { es: 'Empresas en crecimiento con operación todavía manual', en: 'Growing companies outgrowing manual ops' },
        detail: {
          es: 'Experiencia real en manufactura, comercio B2B industrial, sector automotriz (Volkswagen), GovTech y clínicas.',
          en: 'Proven delivery across automotive (Volkswagen), industrial B2B trade, GovTech, and healthcare clinics.',
        },
      },
      {
        title: { es: 'Proyectos con casa matriz o clientes en Estados Unidos', en: 'Cross-border projects with US stakeholders' },
        detail: {
          es: 'Comunicación ejecutiva y técnica 100% fluida en español e inglés para alinear equipos binacionales.',
          en: 'Fluent English and Spanish technical leadership bridging local operations and international stakeholders.',
        },
      },
    ],
    deliverables: [
      { es: 'Desarrollo de software a medida, portales B2B, apps web e integración de IA', en: 'Custom software engineering, B2B portals, web applications, and AI integration' },
      { es: 'Digitalización de procesos operativos, inventarios, seguimiento comercial y reportes', en: 'Digitization of operational workflows, inventory, sales pipelines, and reporting' },
      { es: 'Liderazgo QA y pruebas de software para plataformas empresariales existentes', en: 'QA leadership and automated testing for existing enterprise platforms' },
    ],
    relatedGuideSlug: 'de-excel-y-whatsapp-a-sistema-web',
    diagnosticTab: 'diagnostico',
  },
];

export const TECHNICAL_GUIDES: GuideItem[] = [
  {
    slug: 'de-excel-y-whatsapp-a-sistema-web',
    code: 'GUIDE // 01',
    readTime: { es: '3 min de lectura', en: '3 min read' },
    publishedDate: '2026-11-27',
    metaTitle: {
      es: 'Cómo migrar tu operación de Excel y WhatsApp a un sistema web | Andrés Cordero',
      en: 'How to Migrate Operations from Spreadsheets & Chat to a Web System | Andrés Cordero',
    },
    metaDescription: {
      es: 'Guía práctica en 3 etapas para digitalizar procesos manuales en empresas mexicanas sin frenar la operación diaria ni pagar licencias costosas.',
      en: 'A practical 3-step blueprint to digitize manual spreadsheet and chat operations without halting daily business execution.',
    },
    title: {
      es: 'Cómo pasar tu operación de Excel y WhatsApp a un sistema web trazable',
      en: 'Moving your operation from spreadsheets & chat to a traceable web system',
    },
    subtitle: {
      es: 'Marco práctico para digitalizar pedidos, inventarios o seguimiento interno en semanas, sin interrumpir al equipo.',
      en: 'A practical framework to digitize orders, inventory, or internal workflows in weeks without disrupting daily work.',
    },
    tags: ['Procesos', 'Digitalización', 'Web Apps', 'PYMEs México'],
    sections: [
      {
        heading: { es: '1. Detecta dónde se pierde dinero y tiempo hoy', en: '1. Pinpoint where time and margin leak today' },
        body: {
          es: 'Antes de escribir una línea de código, identifica los 2 o 3 puntos donde la información se captura doble, se sobrescriben archivos de Excel o nadie sabe el estatus real de un pedido sin preguntar por WhatsApp.',
          en: 'Before writing any code, isolate the 2–3 handoffs where staff re-type data twice, overwrite shared sheets, or chase status updates across group chats.',
        },
        takeaway: {
          es: 'Regla clave: no digitalices todo el organigrama el día 1; ataca primero el cuello de botella de mayor impacto.',
          en: 'Key rule: do not digitize everything on day one—target the highest-leverage operational bottleneck first.',
        },
      },
      {
        heading: { es: '2. Lanza un núcleo operativo utilizable desde móvil y escritorio', en: '2. Ship a focused operational core for mobile & desktop' },
        body: {
          es: 'Una aplicación web moderna (PWA) con base de datos centralizada (PostgreSQL/Supabase) y permisos por rol reemplaza hojas sueltas en 3 a 5 semanas, sin obligar a instalar programas complejos ni pagar rentas por cada nuevo empleado.',
          en: 'A modern web app (PWA) backed by a central database (PostgreSQL/Supabase) and role permissions replaces scattered files in 3–5 weeks without per-seat licensing lock-in.',
        },
        takeaway: {
          es: 'Adopción inmediata: si el formulario toma menos clics que mandar un mensaje, tu equipo lo adopta desde el primer día.',
          en: 'Fast adoption: when logging an update takes fewer taps than sending a chat message, teams adopt it immediately.',
        },
      },
      {
        heading: { es: '3. Mide, automatiza y escala con IA donde suma valor', en: '3. Measure, automate, and layer AI where it pays off' },
        body: {
          es: 'Con los datos ya limpios en un sistema propio, puedes activar alertas automáticas, reportes diarios y lectura inteligente de comprobantes o documentos con IA para ahorrar horas cada semana.',
          en: 'Once structured data flows cleanly through your own system, adding automated alerts, executive metrics, and AI document parsing compounds weekly time savings.',
        },
        takeaway: {
          es: 'Resultado típico: menos errores de captura, visibilidad en tiempo real y control total de tu operación.',
          en: 'Typical outcome: fewer entry errors, real-time executive visibility, and full operational ownership.',
        },
      },
    ],
    relatedServiceSlug: 'digitalizacion-procesos',
    diagnosticTab: 'diagnostico',
  },
  {
    slug: 'reducir-errores-produccion-qa',
    code: 'GUIDE // 02',
    readTime: { es: '3 min de lectura', en: '3 min read' },
    publishedDate: '2026-11-27',
    metaTitle: {
      es: 'Cómo reducir hasta 40% los errores en producción con QA y CI/CD | Andrés Cordero',
      en: 'How to Cut Production Defects by 40% with Risk-Based QA & CI/CD | Andrés Cordero',
    },
    metaDescription: {
      es: 'Estrategia práctica de aseguramiento de calidad, pruebas automatizadas y compuertas CI/CD para equipos de desarrollo que buscan liberar más rápido sin romper producción.',
      en: 'Practical quality assurance strategy, automated critical-path suites, and CI/CD release gates for engineering teams shipping faster safely.',
    },
    title: {
      es: 'Cómo reducir hasta 40% los fallos en producción con compuertas QA',
      en: 'Cutting production deployment defects by up to 40% with QA gates',
    },
    subtitle: {
      es: 'Por qué probar manualmente al final del sprint no escala y cómo estructurar calidad sin frenar entregas.',
      en: 'Why last-minute manual testing breaks down and how to build release confidence without slowing delivery.',
    },
    tags: ['QA', 'Testing', 'CI/CD', 'Automatización'],
    sections: [
      {
        heading: { es: '1. Prioriza pruebas por riesgo de negocio, no por volumen', en: '1. Prioritize test coverage by business risk' },
        body: {
          es: 'Intentar automatizar el 100% de pantallas triviales solo crea pruebas frágiles. Concentra la cobertura en autenticación, pagos, flujos de datos críticos y permisos de seguridad.',
          en: 'Automating low-impact UI screens creates brittle maintenance drag. Focus coverage on authentication, transactions, core data flows, and access controls.',
        },
        takeaway: {
          es: 'El 20% de los flujos críticos concentra el 80% del riesgo comercial ante un fallo.',
          en: '20% of user journeys carry 80% of business and reputational impact.',
        },
      },
      {
        heading: { es: '2. Integra validación automática antes de cada merge', en: '2. Gate every merge with automated checks' },
        body: {
          es: 'Combinar validación estricta de tipos, pruebas de contrato de API y smoke tests E2E en CI/CD detecta regresiones en minutos antes de llegar al entorno del cliente.',
          en: 'Combining strict type checks, API contract suites, and E2E smoke tests in CI/CD catches regressions minutes after a commit rather than after customer reports.',
        },
        takeaway: {
          es: 'Corregir un defecto antes del despliegue cuesta una fracción de resolverlo en producción.',
          en: 'Fixing a defect before release takes a fraction of the cost of hotfixing production.',
        },
      },
      {
        heading: { es: '3. Haz visible la calidad para negocio e ingeniería', en: '3. Make release readiness visible across teams' },
        body: {
          es: 'Un criterio claro de liberación (Definition of Done + trazabilidad de incidentes) elimina discusiones subjetivas sobre si una versión está lista para salir.',
          en: 'Objective sign-off criteria and defect traceability remove guesswork around whether a release is ready to ship.',
        },
        takeaway: {
          es: 'Menos urgencias nocturnas, clientes más satisfechos y entregas predecibles.',
          en: 'Fewer emergency rollbacks, stronger client trust, and predictable release cadences.',
        },
      },
    ],
    relatedServiceSlug: 'pruebas-qa',
    diagnosticTab: 'checklist_qa',
  },
  {
    slug: 'ia-aplicada-empresas-mexico',
    code: 'GUIDE // 03',
    readTime: { es: '3 min de lectura', en: '3 min read' },
    publishedDate: '2026-11-27',
    metaTitle: {
      es: 'IA Aplicada para Empresas en México sin Licencias Costosas | Andrés Cordero',
      en: 'Practical Applied AI for Companies Without Heavy Licensing Costs | Andrés Cordero',
    },
    metaDescription: {
      es: 'Casos reales y rentables de inteligencia artificial integrada a sistemas web: lectura de tickets/documentos, asistentes internos y automatización operativa.',
      en: 'High-ROI patterns for embedding practical AI into business software: vision OCR, structured extraction, and contextual workflow assistants.',
    },
    title: {
      es: 'IA aplicada en empresas: automatización real sin pagar licencias infladas',
      en: 'Applied AI for businesses: real automation without bloated licensing',
    },
    subtitle: {
      es: 'Dónde la inteligencia artificial entrega retorno inmediato hoy y cómo integrarla con control humano en tu software.',
      en: 'Where applied AI delivers immediate operational ROI today and how to embed it safely with human oversight.',
    },
    tags: ['IA Aplicada', 'Automatización', 'Visión', 'ROI'],
    sections: [
      {
        heading: { es: '1. Extracción estructurada desde fotos, tickets y PDFs', en: '1. Structured extraction from photos, receipts & PDFs' },
        body: {
          es: 'Los modelos multimodales actuales leen notas, facturas, listas o recibos y devuelven JSON estructurado listo para revisar y guardar en tu base de datos en segundos.',
          en: 'Modern multimodal models parse receipts, forms, or invoices into structured JSON ready for quick human verification and database persistence.',
        },
        takeaway: {
          es: 'Ahorra horas de captura administrativa con supervisión humana antes de confirmar.',
          en: 'Eliminate hours of administrative entry while keeping human sign-off before saving.',
        },
      },
      {
        heading: { es: '2. Asistentes internos conectados a tus propios datos', en: '2. Internal assistants grounded in your live data' },
        body: {
          es: 'En lugar de chats genéricos desconectados, un asistente integrado a tu panel consulta únicamente la información autorizada para resumir pendientes, cotizaciones o indicadores.',
          en: 'Instead of generic disconnected chatbots, a grounded assistant reads only authorized operational records to summarize blockers, metrics, or next actions.',
        },
        takeaway: {
          es: 'Privacidad controlada: nunca expongas secretos ni datos sensibles innecesarios al modelo.',
          en: 'Controlled privacy: strictly project safe fields and never leak secrets into prompts.',
        },
      },
      {
        heading: { es: '3. Empieza ligero y escala según uso real', en: '3. Start lean and scale on real usage' },
        body: {
          es: 'Con APIs modernas bajo demanda y arquitectura web ligera puedes validar un flujo con IA a costo mínimo y escalar solo cuando el retorno esté comprobado.',
          en: 'Using pay-as-you-go APIs and lean web architecture lets you validate AI ROI quickly without heavy upfront infrastructure.',
        },
        takeaway: {
          es: 'Enfoque práctico: la IA es una pieza de ingeniería al servicio del negocio, no un adorno.',
          en: 'Pragmatic mindset: AI is an engineering lever serving measurable outcomes, not a gimmick.',
        },
      },
    ],
    relatedServiceSlug: 'desarrollo-software-ia',
    diagnosticTab: 'estimador',
  },
];

export function getServiceBySlug(slug: string | undefined): ServiceLandingItem | undefined {
  return SERVICE_LANDINGS.find((s) => s.slug === slug);
}

export function getGuideBySlug(slug: string | undefined): GuideItem | undefined {
  return TECHNICAL_GUIDES.find((g) => g.slug === slug);
}
