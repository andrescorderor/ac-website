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
      <ExpertiseSection />
      <ExperienceSection />
      <KnowledgeCarousel />
      <ProjectsSection />
      <CertificationsSection />
      <DiscussionCarousel />
    </div>
  );
}
