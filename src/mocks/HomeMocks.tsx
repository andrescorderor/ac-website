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
  text: 'I am a developer and project manager with experience in software development, project coordination, and more.',
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
    subtitle: 'Get expert advice on your project and optimize your workflow.',
    paragraph: 'asfasf',
    image: '/assets/ProjectManagement.svg',
  },
  {
    title: 'SOFTWARE DEVELOPMENT',
    subtitle: 'We develop software solutions tailored to your specifications.',
    paragraph: 'asfasf',
    image: '/assets/SoftwareDevelopment.svg',
  },
  {
    title: 'QUALITY ASSURANCE',
    subtitle: 'Receive 24/7 support to keep your projects running smoothly.',
    paragraph: 'asfasf',
    image: '/assets/QualityAssurance.svg',
  },
];
