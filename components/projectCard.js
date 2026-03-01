import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

const ProjectCard = ({ src, type, name, description, codeUrl, websiteUrl, detailsUrl, position }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`project-card ${type}`}
      style={{ animationDelay: `${0.1 * (position + 1)}s` }}
    >
      <div className="project-card-top">
        <Image
          className={clsx("card-image", loaded ? "no-blur" : "blur-image")}
          src={src}
          priority
          loading="eager"
          placeholder="blur"
          draggable={false}
          alt={`${name} thumbnail`}
          onLoad={() => setLoaded(true)}
        />
        <div className="project-details-bg" />
        <div className="project-details">
          <h4 className="project-name">{name}</h4>
          {description && (
            <p className="project-description" style={{
              fontSize: '0.9rem',
              marginTop: '0.5rem',
              marginBottom: '1rem',
              opacity: 0.9,
              lineHeight: '1.4'
            }}>
              {description}
            </p>
          )}
          <div className="project-buttons">
            {detailsUrl && (
              <Link href={detailsUrl} className="view-details">
                <span>View Details</span>
              </Link>
            )}
            {codeUrl && (
              <a className="view-code" href={codeUrl} target="_blank" rel="noopener noreferrer">
                <span>GitHub</span>
              </a>
            )}
            {websiteUrl && websiteUrl !== codeUrl && (
              <a className="visit" href={websiteUrl} target="_blank" rel="noopener noreferrer">
                <span>Live Demo</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
