import CertificationsSection from '@components/home/CertificationsSection';
import DiscussionCarousel from '@components/home/DiscussionCarousel';
import Hero from '@components/home/Hero';
import ExpertiseSection from '@components/home/ExpertiseSection';
import ExperienceSection from '@components/home/ExperienceSection';
import KnowledgeCarousel from '@components/home/KnowledgeCarousel';
import ProjectsSection from '@components/home/ProjectsSection';
// import ProjectsSection from '@components/home/ProjectsSection';

export default function Home() {
  return (
    <div className="overflow-y-hidden bg-[var(--white)]">
      <Hero />
      <div className="relative flex items-center justify-center">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--gray)] to-transparent opacity-30" />
        <div className="absolute size-1.5 rotate-45 border border-[var(--gray)] bg-[var(--white)] opacity-40" />
      </div>
      <ExpertiseSection />
      <div className="relative flex items-center justify-center">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--gray)] to-transparent opacity-30" />
        <div className="absolute size-1.5 rotate-45 border border-[var(--gray)] bg-[var(--white)] opacity-40" />
      </div>
      <ExperienceSection />
      <KnowledgeCarousel />
      <ProjectsSection />
      <CertificationsSection />
      <DiscussionCarousel />
    </div>
  );
}
