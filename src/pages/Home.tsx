import Certifications from '@components/home/CertificationsSection';
import DiscussionCarousel from '@components/home/DiscussionCarousel';
import ExpertiseSection from '@components/home/ExpertiseSection';
import Hero from '@components/home/Hero';
import KnowledgeCarousel from '@components/home/KnowledgeCarousel';
import RolesCarousel from '@components/home/RolesCarousel';

export default function Home() {
  return (
    <div>
      <Hero />
      <RolesCarousel />
      <ExpertiseSection />
      <DiscussionCarousel />
      <Certifications />
      <KnowledgeCarousel />
    </div>
  );
}
