import fs from 'node:fs';
import path from 'node:path';

const SITE_ORIGIN = 'https://andresmcorderor.netlify.app';
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const BASE_HTML_PATH = path.join(DIST_DIR, 'index.html');

if (!fs.existsSync(BASE_HTML_PATH)) {
  console.error('[prerender-seo] dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(BASE_HTML_PATH, 'utf8');

const ROUTES = [
  {
    route: '/servicios/desarrollo-software-ia',
    title: 'Desarrollo de Software a Medida e IA en México y León, Gto. | Andrés Cordero',
    description:
      'Diseño y desarrollo de aplicaciones web, sistemas internos, PWAs y automatización con inteligencia artificial para empresas en León, Guanajuato, todo México y en inglés.',
    heading: 'Desarrollo de Software a Medida e Inteligencia Artificial Aplicada',
    summary:
      'Plataformas web, portales operativos, PWAs y flujos con visión computacional o LLMs listos para usuarios reales en León, Guanajuato, todo México y equipos internacionales.',
    schemaType: 'Service',
  },
  {
    route: '/servicios/digitalizacion-procesos',
    title: 'Digitalización y Optimización de Procesos Empresariales en México | Andrés Cordero',
    description:
      'Transforma operaciones en Excel y WhatsApp en sistemas digitales trazables con tableros ejecutivos y dirección ágil de proyectos en León, Gto. y todo México.',
    heading: 'Digitalización y Optimización de Procesos Empresariales',
    summary:
      'Elimina retrabajos, hojas de cálculo duplicadas y seguimientos manuales convirtiendo tu operación en un sistema digital medible y escalable.',
    schemaType: 'Service',
  },
  {
    route: '/servicios/pruebas-qa',
    title: 'Pruebas de Software, Automatización y Liderazgo QA en México | Andrés Cordero',
    description:
      'Estrategia QA, pruebas funcionales, automatización E2E/API y compuertas CI/CD para reducir errores en producción hasta 40%. Servicio en español e inglés.',
    heading: 'Pruebas de Software, Automatización y Liderazgo QA',
    summary:
      'Estrategia de calidad basada en riesgo, automatización de regresiones críticas y control de despliegues en producción en español e inglés.',
    schemaType: 'Service',
  },
  {
    route: '/servicios/leon-guanajuato',
    title: 'Desarrollo de Software, Procesos y QA en León, Guanajuato y Bajío | Andrés Cordero',
    description:
      'Ingeniero en Software egresado de Universidad de La Salle Bajío en León, Guanajuato. Atención presencial e híbrida en Bajío y remota para todo México y EE.UU.',
    heading: 'Ingeniería de Software, Procesos y QA en León, Guanajuato y el Bajío',
    summary:
      'Acompañamiento presencial e híbrido para industria, comercio B2B y startups en León, Silao, Irapuato, Querétaro y de forma remota en todo México y Estados Unidos.',
    schemaType: 'Service',
  },
  {
    route: '/diagnostico',
    title: 'Diagnóstico Digital, Estimador de Alcance y Checklist QA Gratis | Andrés Cordero',
    description:
      'Herramientas interactivas gratuitas: evalúa la madurez digital de tus procesos, estima el alcance de tu proyecto de software o audita tu preparación QA en 2 minutos.',
    heading: 'Diagnóstico Interactivo de Procesos, Estimador de Alcance y Checklist QA',
    summary:
      'Evalúa gratis el nivel operativo de tu empresa, genera un roadmap estimado de fases o valida tu lista de control QA antes de liberar a producción.',
    schemaType: 'WebApplication',
  },
  {
    route: '/guias/de-excel-y-whatsapp-a-sistema-web',
    title: 'Cómo migrar tu operación de Excel y WhatsApp a un sistema web | Andrés Cordero',
    description:
      'Guía práctica en 3 etapas para digitalizar procesos manuales en empresas mexicanas sin frenar la operación diaria ni pagar licencias costosas.',
    heading: 'Cómo pasar tu operación de Excel y WhatsApp a un sistema web trazable',
    summary:
      'Marco práctico en 3 fases para reemplazar hojas de cálculo dispersas y seguimiento por chat con una aplicación web propia y medible.',
    schemaType: 'Article',
  },
  {
    route: '/guias/reducir-errores-produccion-qa',
    title: 'Cómo reducir hasta 40% los errores en producción con QA y CI/CD | Andrés Cordero',
    description:
      'Estrategia práctica de aseguramiento de calidad, pruebas automatizadas y compuertas CI/CD para equipos de desarrollo que buscan liberar más rápido sin romper producción.',
    heading: 'Cómo reducir hasta 40% los fallos en producción con compuertas QA',
    summary:
      'Priorización de pruebas basada en riesgo, automatización en CI/CD y criterios objetivos de liberación para software confiable.',
    schemaType: 'Article',
  },
  {
    route: '/guias/ia-aplicada-empresas-mexico',
    title: 'IA Aplicada para Empresas en México sin Licencias Costosas | Andrés Cordero',
    description:
      'Casos reales y rentables de inteligencia artificial integrada a sistemas web: lectura de tickets/documentos, asistentes internos y automatización operativa.',
    heading: 'IA aplicada en empresas: automatización real sin pagar licencias infladas',
    summary:
      'Patrones prácticos de alto retorno con IA multimodal y asistentes conectados a datos propios bajo supervisión humana.',
    schemaType: 'Article',
  },
];

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

for (const page of ROUTES) {
  const canonical = `${SITE_ORIGIN}${page.route}`;
  const safeTitle = escapeHtml(page.title);
  const safeDesc = escapeHtml(page.description);

  const routeJsonLd = {
    '@context': 'https://schema.org',
    '@type': page.schemaType,
    name: page.heading,
    headline: page.heading,
    description: page.description,
    url: canonical,
    inLanguage: 'es-MX',
    provider: {
      '@type': 'Person',
      name: 'Andrés Cordero',
      url: `${SITE_ORIGIN}/`,
    },
    author: {
      '@type': 'Person',
      name: 'Andrés Cordero',
      url: `${SITE_ORIGIN}/`,
    },
  };

  let html = baseHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${safeTitle}</title>`);
  html = html.replace(
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${canonical}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${canonical}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"[\s\S]*?\/>/,
    `<meta name="twitter:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"[\s\S]*?\/>/,
    `<meta name="twitter:description" content="${safeDesc}" />`
  );

  // Inject route JSON-LD before </head>
  html = html.replace(
    '</head>',
    `  <script id="route-jsonld" type="application/ld+json">${JSON.stringify(routeJsonLd)}</script>\n  </head>`
  );

  // Inject lightweight crawlable semantic fallback inside #root (replaced automatically by React on mount)
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"><main style="font-family:sans-serif;max-width:760px;margin:64px auto;padding:0 24px"><h1>${escapeHtml(
      page.heading
    )}</h1><p>${escapeHtml(
      page.summary
    )}</p><p>Andrés Cordero — León, Guanajuato, México · Todo México · ES / EN</p><a href="${SITE_ORIGIN}/">Ir al portafolio</a></main></div>`
  );

  const outDir = path.join(DIST_DIR, page.route.replace(/^\//, ''));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
}

console.log(`[prerender-seo] Generated ${ROUTES.length} static SEO route snapshots in dist/`);
