import Card from '../common/Card';

export default function CardSection() {
  return (
    <div className="mx-64">
      <h1 className="font-manrope animate-gradient-rotate my-16 bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--black)] bg-clip-text text-center text-[4rem] font-bold leading-none text-transparent">
        My expertise
      </h1>
      <div className="relative z-20 flex flex-col gap-16">
        <div className="w-full">
          <Card
            title="Project Management"
            text="Manage your projects efficiently and collaborate with your team."
            imageUrl="/src/assets/ProjectManagement.svg"
            bgColorLight="bg-[var(--deep-navy-blue-light)]"
            bgColor="bg-[var(--deep-navy-blue)]"
          />
        </div>
        <div className="flex w-full gap-16">
          <Card
            title="Front-End Development"
            text="Build interactive user interfaces with cutting-edge technologies."
            imageUrl="/src/assets/SoftwareDevelopment.svg"
            bgColorLight="bg-[var(--vibrant-sky-blue-light)]"
            bgColor="bg-[var(--vibrant-sky-blue)]"
          />
          <Card
            title="QA Assurance"
            text="Ensure the quality of your software with reliable testing practices."
            imageUrl="/src/assets/QualityAssurance.svg"
            bgColorLight="bg-[var(--magenta-pink-light)]"
            bgColor="bg-[var(--magenta-pink)]"
          />
        </div>
      </div>
    </div>
  );
}
