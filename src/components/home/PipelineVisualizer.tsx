import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  HiOutlineCpuChip,
  HiOutlineClipboard,
  HiOutlineLightBulb,
  HiOutlineShieldCheck,
  HiOutlineRocketLaunch,
} from 'react-icons/hi2';
import SignatureMark from '@components/common/SignatureMark';

const stages = [
  {
    id: 'idea',
    icon: HiOutlineLightBulb,
    en: 'Idea',
    es: 'Idea',
    metric: '01 / DISCOVERY',
    detail: {
      en: 'Frame the problem, define the outcome, and turn ambiguity into a testable direction.',
      es: 'Enmarcar el problema, definir el resultado y convertir ambigüedad en una dirección comprobable.',
    },
  },
  {
    id: 'process',
    icon: HiOutlineClipboard,
    en: 'Process design',
    es: 'Diseño de proceso',
    metric: '02 / DELIVERY',
    detail: {
      en: 'Map ownership, dependencies, decision points and measurable delivery signals.',
      es: 'Mapear responsables, dependencias, decisiones e indicadores medibles de entrega.',
    },
  },
  {
    id: 'build',
    icon: HiOutlineCpuChip,
    en: 'Build + AI',
    es: 'Desarrollo + IA',
    metric: '03 / ENGINEERING',
    detail: {
      en: 'Ship a full-stack product with thoughtful architecture, automation and human-centered AI.',
      es: 'Lanzar un producto full-stack con arquitectura clara, automatización e IA centrada en las personas.',
    },
  },
  {
    id: 'quality',
    icon: HiOutlineShieldCheck,
    en: 'QA & control',
    es: 'QA y control',
    metric: '04 / CONFIDENCE',
    detail: {
      en: 'Make quality visible with risk-based coverage, repeatable checks and release gates.',
      es: 'Hacer visible la calidad con cobertura basada en riesgo, pruebas repetibles y controles de liberación.',
    },
  },
  {
    id: 'production',
    icon: HiOutlineRocketLaunch,
    en: 'Production',
    es: 'Producción',
    metric: '05 / IMPACT',
    detail: {
      en: 'Launch, observe and iterate on systems that solve real operational problems.',
      es: 'Lanzar, observar e iterar sistemas que resuelven problemas operativos reales.',
    },
  },
] as const;

interface PipelineVisualizerProps {
  spanish: boolean;
}

export default function PipelineVisualizer({ spanish }: PipelineVisualizerProps) {
  const [active, setActive] = useState(2);
  const reduceMotion = useReducedMotion();
  const current = stages[active];
  return (
    <div
      className="pipeline-frame spotlight-card"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--mx', `${event.clientX - bounds.left}px`);
        event.currentTarget.style.setProperty('--my', `${event.clientY - bounds.top}px`);
      }}
    >
      <div className="pipeline-topline">
        <span>
          <SignatureMark size="sm" /> AC / SYSTEM MAP
        </span>
        <span className="pipeline-live">
          <i />
          {spanish ? 'SISTEMA EN LÍNEA' : 'SYSTEM ONLINE'}
        </span>
      </div>
      <div className="pipeline-canvas">
        <svg className="pipeline-connectors" viewBox="0 0 720 260" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="pipeline-gradient">
              <stop stopColor="var(--site-accent)" stopOpacity=".15" />
              <stop offset=".5" stopColor="var(--site-accent)" />
              <stop offset="1" stopColor="var(--site-warm)" stopOpacity=".3" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((index) => {
            const y1 = index % 2 === 0 ? 75 : 185;
            const y2 = index % 2 === 0 ? 185 : 75;
            const x1 = 82 + index * 139;
            const x2 = x1 + 139;
            return (
              <g key={index}>
                <path
                  d={`M ${x1} ${y1} C ${x1 + 54} ${y1}, ${x2 - 54} ${y2}, ${x2} ${y2}`}
                  className="pipeline-track"
                />
                <motion.path
                  d={`M ${x1} ${y1} C ${x1 + 54} ${y1}, ${x2 - 54} ${y2}, ${x2} ${y2}`}
                  className="pipeline-beam"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 1.15, delay: index * 0.14, ease: 'easeInOut' }}
                />
              </g>
            );
          })}
        </svg>
        <div className="pipeline-nodes">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <motion.button
                key={stage.id}
                type="button"
                className={`pipeline-node ${active === index ? 'is-active' : ''}`}
                onClick={() => setActive(index)}
                aria-pressed={active === index}
                aria-label={`${String(index + 1).padStart(2, '0')} ${spanish ? stage.es : stage.en}`}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, type: 'spring', stiffness: 180, damping: 20 }}
              >
                <span className="pipeline-node-index">0{index + 1}</span>
                <span className="pipeline-node-icon">
                  <Icon aria-hidden="true" />
                </span>
                <b>{spanish ? stage.es : stage.en}</b>
                <span className="pipeline-node-state">{active === index ? 'ACTIVE' : 'READY'}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
      <motion.div
        className="pipeline-readout"
        key={current.id}
        initial={reduceMotion ? false : { opacity: 0, y: 7 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        aria-live="polite"
      >
        <span className="pipeline-readout-code">{current.metric}</span>
        <p>{spanish ? current.detail.es : current.detail.en}</p>
        <span className="pipeline-readout-index">
          {String(active + 1).padStart(2, '0')} <i>/</i> 05
        </span>
      </motion.div>
      <div className="pipeline-footer">
        <span>IDEA → PROCESS → BUILD → QA → PROD</span>
        <span>{spanish ? 'CICLO DE ENTREGA' : 'DELIVERY LOOP'}</span>
      </div>
    </div>
  );
}
