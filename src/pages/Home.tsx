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
    <div className="relative overflow-y-hidden bg-[var(--white)] selection:bg-[var(--vibrant-sky-blue)] selection:text-white">
      {/* Mesh Background */}
      <div className="fixed inset-0 -z-20 pointer-events-none opacity-20">
        <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-[var(--vibrant-sky-blue-light)] blur-[150px] animate-pulse" />
        <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-[var(--magenta-pink-light)] blur-[150px] animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-[0.03] mix-blend-overlay" 
           style={{ backgroundImage: 'url("/assets/noise.svg")' }} />

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
