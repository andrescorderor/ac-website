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
  },
  {
    title: 'SOFTWARE DEVELOPMENT',
    subtitle: 'Custom software solutions tailored to your business needs.',
    paragraph:
      'I offer front-end development services utilizing modern frameworks and design tools, ensuring a seamless user experience and robust software architecture.',
    image: '/assets/SoftwareDevelopment.svg',
  },
  {
    title: 'QUALITY ASSURANCE',
    subtitle: 'Comprehensive QA strategies to maintain software excellence.',
    paragraph:
      'Providing both manual and automated testing, I ensure the quality and reliability of your software products, leveraging tools and techniques to streamline testing processes.',
    image: '/assets/QualityAssurance.svg',
  },
];
