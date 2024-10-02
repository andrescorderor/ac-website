import Card from '../common/Card';

export default function CardSection() {
  return (
    <div className="flex flex-col gap-8">
      <Card
        title="Project Management"
        text="  This is an example paragraph for the second card. Hover to reveal the
          button."
        imageUrl="/src/assets/ProjectManagement.svg"
      />
      <Card
        title="Front-End Development"
        text="  This is an example paragraph for the second card. Hover to reveal the
        button."
        imageUrl="/src/assets/SoftwareDevelopment.svg"
      />
      <Card
        title="QA Assurance"
        text="  This is an example paragraph for the second card. Hover to reveal the
        button."
        imageUrl="/src/assets/QualityAssurance.svg"
      />
    </div>
  );
}
