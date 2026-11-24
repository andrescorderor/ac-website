import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { loadPortfolioCms, CmsExperience } from '@/lib/portfolioCms';

export default function ExperienceSection() {
  const { t, i18n } = useTranslation();
  const [cmsExperiences, setCmsExperiences] = useState<CmsExperience[] | null>(null);

  useEffect(() => {
    loadPortfolioCms().then(({ data, source }) => {
      if (source !== 'default' && Array.isArray(data.experiences) && data.experiences.length > 0) {
        setCmsExperiences(data.experiences.filter((e) => e.visible !== false));
      }
    });
  }, []);

  const defaultExperiences = [
    {
      id: 'exp1',
      year: '2023 - Present',
      title: t('experience.exp1_title', 'Quality Assurance Team Lead'),
      company: t('experience.exp1_company', 'CBQA Solutions Inc.'),
      description: t('experience.exp1_desc', 'Led the QA department, establishing robust testing protocols and integrating automated testing pipelines. Managed project lifecycles to ensure high-quality software delivery.'),
    },
    {
      id: 'exp2',
      year: '2023 - Present',
      title: t('experience.exp2_title', 'Project Manager & QA Lead'),
      company: t('experience.exp2_company', 'Uanify'),
      description: t('experience.exp2_desc', 'Directed software development projects utilizing agile methodologies. Coordinated cross-functional teams to align business goals with technical execution while maintaining rigorous QA standards.'),
    },
    {
      id: 'exp3',
      year: '2023 - 2024',
      title: t('experience.exp3_title', 'Web Developer & UX/UI Designer'),
      company: t('experience.exp3_company', 'Freelance'),
      description: t('experience.exp3_desc', 'Delivered comprehensive digital solutions including custom web applications and interactive interfaces, focusing on user-centered design and seamless performance.'),
    },
    {
      id: 'exp4',
      year: '2020 - 2024',
      title: t('experience.exp4_title', 'Software Engineering Degree'),
      company: t('experience.exp4_company', 'Universidad de La Salle Bajío'),
      description: t('experience.exp4_desc', 'Comprehensive education in software architecture, algorithms, and project management.'),
    },
  ];

  const experiences = cmsExperiences ?? defaultExperiences;

  return (
    <section className="bg-[var(--deep-navy-blue-light)] relative overflow-hidden py-20 lg:py-28">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--vibrant-sky-blue-light)] rounded-full blur-[100px] opacity-50 -mr-32 -mt-32" />

      <div className="container mx-auto max-w-7xl px-6 md:px-12 lg:px-20 flex flex-col">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 lg:mb-20"
        >
          <span className="font-syne text-[var(--vibrant-sky-blue)] font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
            {i18n.language?.startsWith('es') ? 'TRAYECTORIA' : 'CAREER PATH'}
          </span>
          <h2 className="font-dm-sans text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] text-[var(--black)] hover:cursor-default">
            {t('experience.title', 'Professional Experience')}
          </h2>
          <div className="h-1.5 w-20 bg-gradient-to-r from-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] rounded-full mt-6" />
        </motion.div>

        <div className="relative flex flex-col gap-12 w-full lg:w-4/5 ml-auto">
        {/* The vertical line */}
        <div className="absolute left-0 md:left-40 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--vibrant-sky-blue)] via-[var(--light-gray)] to-transparent" />

        {experiences.map((exp, index) => (
          <motion.div 
            key={exp.id || index}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col md:flex-row gap-4 md:gap-20 group relative pl-7 md:pl-0"
          >
            {/* Year with indicator */}
            <div className="md:w-40 flex-shrink-0 relative">
              <span className="font-syne text-xl font-bold text-[var(--vibrant-sky-blue)] block md:text-right md:pr-12">
                {exp.year}
              </span>
              {/* Punto de línea de tiempo (móvil) */}
              <div className="md:hidden absolute -left-[33px] top-2 size-2.5 rounded-full bg-[var(--vibrant-sky-blue)] border-4 border-[var(--deep-navy-blue-light)] z-10" />
              {/* Timeline Dot */}
              <div className="hidden md:block absolute right-[-5px] top-2 size-2.5 rounded-full bg-[var(--vibrant-sky-blue)] border-4 border-[var(--white)] shadow-sm group-hover:scale-150 transition-transform duration-300 z-10" />
            </div>

            <div className="flex flex-col pb-12 border-b border-[var(--light-gray)]/50 w-full group-last:border-0">
              <h3 className="font-dm-sans text-2xl lg:text-4xl font-medium text-[var(--black)] group-hover:text-[var(--vibrant-sky-blue)] transition-colors duration-300">
                {exp.title}
              </h3>
              <p className="font-syne text-xl text-[var(--gray)] mt-2 mb-6 font-medium tracking-wide">
                {exp.company}
              </p>
              <p className="font-inter font-light text-[var(--dark-gray)] text-lg lg:text-xl leading-relaxed max-w-3xl">
                {exp.description}
              </p>
            </div>
          </motion.div>
        ))}
        </div>
      </div>
    </section>
  );
}
