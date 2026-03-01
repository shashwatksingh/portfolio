import Head from "next/head";

import ProjectCard from "../components/projectCard";
import AnimateText from "../components/animateText";
import { projects } from "../utils";

const Work = () => {
  return (
    <>
      <Head>
        <title>Work | Shashwat Kumar Singh</title>
        <meta
          title="description"
          content="Showcasing my backend engineering projects and microservices architecture"
          key="desc"
        />
      </Head>
      <div className="work-section">
        <div className="work-section-inner">
          <AnimateText text="WORK" />
          <ul className="project-section">
            {projects.map((project, index) => (
              <li key={project.id}>
                <ProjectCard {...project} position={index} />
              </li>
            ))}
          </ul>
          <div className="flex-center view-more-wrapper">
            <a
              className="view-more"
              href="https://github.com/shashwatksingh?tab=repositories"
              target="_blank"
            >
              <span>View More on GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Work;
