import { Button } from '../Button';
import { FaArrowRight } from 'react-icons/fa';

export default function ExpertiseSectionSDModalContent() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 cursor-default">
      <div className="col-span-1 flex flex-col h-full w-3/4">
        <h3 className="text-5xl font-semibold font-dm-sans text-[var(--black)] mb-4">
          About my work
        </h3>
        <div className="font-syne flex items-center justify-start gap-4 font-bold mt-auto ">
          Lets get in contact
          <Button
            style="WHITE"
            name="Become a client"
            icon={FaArrowRight}
            type="icon-only"
          />
        </div>
      </div>
      <div className="col-span-2  text-base ">
        <div className="mb-6">
          <h3 className="font-dm-sans font-semibold text-[var(--black)] mb-2">
            Projects Developed
          </h3>
          <ul className="list-disc pl-6 text-[var(--dark-gray)] space-y-2">
            <li>
              Developed interactive websites and mobile apps for diverse
              sectors, focusing on user experience and performance.
            </li>
            <li>
              Implemented scalable and maintainable code, adhering to industry
              best practices and standards.
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold font-dm-sans text-[var(--black)] mb-2">
            Technical Skills
          </h3>
          <ul className="list-disc pl-6 text-[var(--dark-gray)] space-y-2">
            <li>
              Proficiency in JavaScript, React, TypeScript, HTML, CSS, and
              modern front-end frameworks.
            </li>
            <li>
              Experience integrating RESTful APIs and optimizing application
              performance.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold font-dm-sans text-[var(--black)] mb-2">
            Specific Achievements
          </h3>
          <ul className="list-disc pl-6 text-[var(--dark-gray)] space-y-2">
            <li>
              Successfully launched multiple web projects, increasing user
              engagement and client satisfaction.
            </li>
            <li>
              Delivered innovative solutions for government and private clients,
              significantly improving their digital presence.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
