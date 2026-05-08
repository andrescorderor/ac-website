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
      <hr className="border-[var(--light-gray)] mx-6 md:px-16 lg:mx-36 opacity-30" />
      <ExpertiseSection />
      <hr className="border-[var(--light-gray)] mx-6 md:px-16 lg:mx-36 opacity-30" />
      <ExperienceSection />
      <KnowledgeCarousel />
      <ProjectsSection />
      <CertificationsSection />
      <DiscussionCarousel />
    </div>
  );
}
