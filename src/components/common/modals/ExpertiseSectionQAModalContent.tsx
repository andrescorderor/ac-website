import { Button } from '../Button';
import { FaArrowRight } from 'react-icons/fa';

export default function ExpertiseSectionQAModalContent() {
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
            Testing Methodologies
          </h3>
          <ul className="list-disc pl-6 text-[var(--dark-gray)] space-y-2">
            <li>
              Implemented Agile testing frameworks including regression, unit,
              integration, and UAT testing.
            </li>
            <li>
              Applied risk-based testing techniques to prioritize critical
              features and functionalities.
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold font-dm-sans text-[var(--black)] mb-2">
            Tools and Technologies
          </h3>
          <ul className="list-disc pl-6 text-[var(--dark-gray)] space-y-2">
            <li>
              Expertise with tools like Selenium, JIRA, Postman, and Git for
              seamless testing and collaboration.
            </li>
            <li>
              Proficient in CI/CD pipelines to support continuous testing and
              deployment processes.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold font-dm-sans text-[var(--black)] mb-2">
            Success Cases
          </h3>
          <ul className="list-disc pl-6 text-[var(--dark-gray)] space-y-2">
            <li>
              Delivered high-quality solutions by preventing critical bugs in
              e-commerce and government projects.
            </li>
            <li>
              Achieved 95% on-time project delivery with zero major defects
              through proactive quality measures.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
