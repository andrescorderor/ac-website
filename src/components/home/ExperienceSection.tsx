import { useTranslation } from 'react-i18next';

export default function ExperienceSection() {
  const { t } = useTranslation();

  const experiences = [
    {
      year: '2023 - Present',
      title: t('experience.exp1_title', 'Quality Assurance Team Lead'),
      company: t('experience.exp1_company', 'CBQA Solutions Inc.'),
      description: t('experience.exp1_desc', 'Led the QA department, establishing robust testing protocols and integrating automated testing pipelines. Managed project lifecycles to ensure high-quality software delivery.'),
    },
    {
      year: '2023 - Present',
      title: t('experience.exp2_title', 'Project Manager & QA Lead'),
      company: t('experience.exp2_company', 'Uanify'),
      description: t('experience.exp2_desc', 'Directed software development projects utilizing agile methodologies. Coordinated cross-functional teams to align business goals with technical execution while maintaining rigorous QA standards.'),
    },
    {
      year: '2023 - 2024',
      title: t('experience.exp3_title', 'Web Developer & UX/UI Designer'),
      company: t('experience.exp3_company', 'Freelance'),
      description: t('experience.exp3_desc', 'Delivered comprehensive digital solutions including custom web applications and interactive interfaces, focusing on user-centered design and seamless performance.'),
    },
    {
      year: '2020 - 2024',
      title: t('experience.exp4_title', 'Software Engineering Degree'),
      company: t('experience.exp4_company', 'Universidad de La Salle Bajío'),
      description: t('experience.exp4_desc', 'Comprehensive education in software architecture, algorithms, and project management.'),
    },
  ];

  return (
    <section className="flex flex-col px-6 md:px-16 lg:px-36 py-16 bg-[var(--deep-navy-blue-light)]">
      <div className="mb-12">
        <h2 className="font-dm-sans text-5xl sm:text-7xl lg:text-[6rem] font-light tracking-tight leading-tight text-[var(--dark-gray)] hover:cursor-default">
          {t('experience.title', 'My Journey')}
        </h2>
      </div>

      <div className="flex flex-col gap-8 w-full lg:w-3/4">
        {experiences.map((exp, index) => (
          <div key={index} className="flex flex-col md:flex-row gap-4 md:gap-12 group">
            <div className="md:w-32 flex-shrink-0 pt-1">
              <span className="font-syne text-xl font-medium text-[var(--vibrant-sky-blue)]">{exp.year}</span>
            </div>
            <div className="flex flex-col pb-8 border-b border-[var(--light-gray)] w-full group-last:border-0">
              <h3 className="font-dm-sans text-2xl lg:text-3xl font-medium text-[var(--black)]">{exp.title}</h3>
              <p className="font-syne text-lg text-[var(--gray)] mt-1 mb-4">{exp.company}</p>
              <p className="font-inter font-light text-[var(--dark-gray)] leading-relaxed">{exp.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
