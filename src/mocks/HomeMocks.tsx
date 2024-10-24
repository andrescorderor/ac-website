import {
  expertisePMImageMocks,
  expertiseQAImageMocks,
  expertiseSDImageMocks,
  ExpertiseSectionImage,
} from './ExpertiseSectionMocks';
import ExpertiseSectionPMModalContent from '@components/common/modals/ExpertiseSectionPMModalContent';
import ExpertiseSectionSDModalContent from '@components/common/modals/ExpertiseSectionSDModalContent';
import ExpertiseSectionQAModalContent from '@components/common/modals/ExpertiseSectionQAModalContent';

interface HeroParagraph {
  profilePicture: string;
  text: string;
}

interface RolesCarouselParagraph {
  role: string;
}

interface ExpertiseCards {
  title: string;
  subtitle: string;
  paragraph: string;
  image: string;
  headerTitle: string;
  headerParagraph: string;
  expertiseData: ExpertiseSectionImage[];
  child: React.ReactNode;
}

export const heroParagraph: HeroParagraph = {
  profilePicture: '/assets/Profile.png',
  text: 'Experienced front-end developer and project manager specializing in innovative solutions, quality assurance, and team coordination.',
};

export const rolesCarousel: RolesCarouselParagraph[] = [
  {
    role: 'Quality Assurance',
  },
  {
    role: 'Project Management',
  },
  {
    role: 'Software Development',
  },
];

export const expertiseCards: ExpertiseCards[] = [
  {
    title: 'PROJECT MANAGEMENT',
    subtitle: 'Efficient planning and coordination to ensure project success.',
    paragraph:
      'With a background in leading teams using agile methodologies, I provide project management services focused on optimizing workflows, addressing blockers, and delivering high-quality results.',
    image: '/assets/ProjectManagement.svg',
    headerTitle: 'Project Management',
    headerParagraph:
      'As a Project Manager, I have successfully led multiple projects in both the private and public sectors. My approach focuses on aligning business goals with client needs, ensuring smooth project execution through agile methodologies.',
    expertiseData: expertisePMImageMocks,
    child: <ExpertiseSectionPMModalContent />,
  },
  {
    title: 'SOFTWARE DEVELOPMENT',
    subtitle: 'Custom software solutions tailored to your business needs.',
    paragraph:
      'I offer front-end development services utilizing modern frameworks and design tools, ensuring a seamless user experience and robust software architecture.',
    image: '/assets/SoftwareDevelopment.svg',
    headerTitle: 'Software Development',
    headerParagraph:
      'With a strong background in front-end development, I specialize in designing and developing user-centric interfaces and experiences. My work focuses on implementing responsive and visually appealing features that elevate the overall user journey.',
    expertiseData: expertiseSDImageMocks,
    child: <ExpertiseSectionSDModalContent />,
  },
  {
    title: 'QUALITY ASSURANCE',
    subtitle: 'Comprehensive QA strategies to maintain software excellence.',
    paragraph:
      'Providing both manual and automated testing, I ensure the quality and reliability of your software products, leveraging tools and techniques to streamline testing processes.',
    image: '/assets/QualityAssurance.svg',
    headerTitle: 'Quality Assurance',
    headerParagraph:
      'As a QA Engineer, my focus is to ensure that every project meets the highest quality standards. I perform manual and automated testing to identify and resolve issues, guaranteeing a smooth and user-friendly experience.',
    expertiseData: expertiseQAImageMocks,
    child: <ExpertiseSectionQAModalContent />,
  },
];
