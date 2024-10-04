import { Card } from '@components/common/Card';

export default function ExpertiseSection() {
  return (
    <section className="flex flex-row px-36 py-16">
      <h2 className=" font-dm-sans flex flex-col justify-end text-[6rem] font-bold leading-tight text-[var(--black)]">
        My Expertise
      </h2>

      <div className="ml-auto flex flex-col gap-8">
        <Card
          title="PROJECT MANAGEMENT"
          text="Get expert advice on your project and optimize your workflow."
          paragraph="We offer asfasasfsfasfasfasfasfasf consulting to meet your business needs."
          imageUrl="/assets/ProjectManagement.svg"
          bgColorLight="bg-[var(--vibrant-sky-blue-light)]"
          bgColor="bg-[var(--vibrant-sky-blue)]"
        />
        <Card
          title="SOFTWARE DEVELOPMENT"
          text="We develop software solutions tailored to your specifications."
          paragraph="Our experienced team builds robust applications for your business."
          imageUrl="/assets/SoftwareDevelopment.svg"
          bgColorLight="bg-[var(--deep-navy-blue-light)]"
          bgColor="bg-[var(--deep-navy-blue)]"
        />
        <Card
          title="QA ASSURANCE"
          text="Receive 24/7 support to keep your projects running smoothly."
          paragraph="Our support team is always available to help resolve any issues."
          imageUrl="/assets/QualityAssurance.svg"
          bgColorLight="bg-[var(--magenta-pink-light)]"
          bgColor="bg-[var(--magenta-pink)]"
        />
      </div>
    </section>
  );
}
