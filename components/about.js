import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Circle, ChevronsDown, ChevronsUp } from "react-feather";

import Skills from "./skills";
import Contact from "./contact";
import AnimateText from "./animateText";

import CheckMarkIcon from "../assets/icons/checkMarkIcon";
import { resumeLink, timeline } from "../utils";

const About = () => {
  const [animateContact, setAnimateContact] = useState(false);

  const onClickContact = () => {
    window.scrollTo({ top: window.outerHeight * 2.25, behavior: "smooth" });

    if (!animateContact) setTimeout(() => setAnimateContact(false), 1500);
    setAnimateContact(true);
  };

  return (
    <>
      <Head>
        <title>Shashwat's Portfolio</title>
        <meta
          title="description"
          content="Senior Backend Engineer with experience designing cloud-native, high-availability systems. Specialised in Node.js (NestJS), distributed architectures, payment integrations and observability."
          key="desc"
        />
      </Head>
      <div className="about-section">
        <div className="about-section-inner">
          <div className="about-main">
            <h1>
              Hey there! <span className="hand-waive">👋🏼</span>
            </h1>
            <h1>
              I'm <b>Shashwat Kumar Singh</b>
            </h1>
            <h1>
              <span className="first-word">I'm </span>
              <span className="second-word">a </span> passionate
              <div>
                <span>
                  <b> Backend Engineer</b>
                  <b>,</b>
                </span>
                <span>
                  <b> Distributed Systems<br className="mobile-break" /> Expert</b>
                  <b>,</b>
                </span>
                <span>
                  <b> Software Engineer</b>
                </span>
              </div>
            </h1>
            <div className="available-to-contact">
              <h3 className="contact-heading">
                <Circle size={12} fill="#00ac00" stroke="#00ac00" />
                <span>Available for new opportunities</span>
              </h3>
              <div className="contact-cta-wrapper">
                <Link
                  className="resume-button"
                  href={resumeLink}
                  as={resumeLink}
                  target="_blank"
                >
                  <ChevronsUp size={18} strokeWidth={2.5} />
                  <span>Résumé</span>
                </Link>
                <button className="contact-cta" onClick={onClickContact}>
                  <ChevronsDown size={18} strokeWidth={2.5} />
                  <span>Contact Me</span>
                </button>
              </div>
            </div>
          </div>
          <div className="about-me">
            <AnimateText text="ABOUT ME" animate={false} />
            <ul className="about-desc">
              <li>
                Senior Backend Engineer with <b>5+ years</b> of experience designing cloud-native, high-availability systems. Specialised in <b>Node.js (NestJS)</b>, distributed architectures, payment integrations and observability.
              </li>
              <li>
                Currently working on <b>RAG-based enterprise Knowledge Base</b> systems using <b>LangChain</b> and <b>LangGraph</b>, and building AI assistants with MCP-based orchestration.
              </li>
              <li>
                Graduated from <b>Tezpur University, Assam</b> in 2020 with a B.Tech in <b>Electrical Engineering</b>.
              </li>
              <li>
                Strong focus on reliability, data integrity, and scalable backend design. Experienced in handling <b>70M+ monthly database operations</b> with optimised performance.
              </li>
              <li>
                Beyond engineering, I'm passionate about building robust systems that solve real-world problems at scale.
              </li>
            </ul>
          </div>
        </div>
        <Skills />
        <div className="timeline-section">
          <AnimateText text="EXPERIENCE" animate={false} />
          {timeline
            .sort((a, b) => b.orgId - a.orgId)
            .map(({ orgId, orgName, yearwise }) => (
              <div className="timeline-org" key={orgId}>
                <h3>{orgName}</h3>
                <div
                  className={
                    yearwise.length < 2 ? "org-levels" : `org-levels border`
                  }
                >
                  {yearwise
                    .sort((a, b) => b.id - a.id)
                    .map(({ id, start, end, position }) => (
                      <div className="org-level" key={id}>
                        <CheckMarkIcon /> <h4>{`${start} - ${end}`}</h4>
                        <h4>—&nbsp;&nbsp;{position}</h4>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
        <Contact animate={animateContact} />
      </div>
    </>
  );
};

export default About;
