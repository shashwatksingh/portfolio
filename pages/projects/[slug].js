import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import fs from "fs";
import path from "path";
import { ChevronLeft } from "react-feather";

import MarkdownRenderer from "../../components/markdownRenderer";

const ProjectDetails = ({ content, title, description }) => {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <div className="blog-page-wrapper">
      <Head>
        <title>{title} | Shashwat Kumar Singh</title>
        <meta
          name="description"
          content={description || `Detailed overview of ${title} project`}
          key="desc"
        />
      </Head>
      <Link href="/work" as="/work" className="flex-start back-to-blogs">
        <ChevronLeft size={20} /> <span>Back to Work</span>
      </Link>

      <div className="markdown">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
};

export async function getStaticPaths() {
  const projectsDirectory = path.join(process.cwd(), "markdown");
  const filenames = fs.readdirSync(projectsDirectory);
  
  const projectFiles = filenames.filter(
    (filename) =>
      filename.includes("arjun-backend-microservices") ||
      filename.includes("sanjay-websocket-platform") ||
      filename.includes("anushanga-url-shortener")
  );

  const paths = projectFiles.map((filename) => ({
    params: { slug: filename.replace(".md", "") },
  }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const filePath = path.join(process.cwd(), "markdown", `${slug}.md`);
  const fileContents = fs.readFileSync(filePath, "utf8");

  // Extract title from content (first # heading)
  const titleMatch = fileContents.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : slug;

  // Extract description from content (first paragraph after title)
  const descMatch = fileContents.match(/^#\s+.+\n\n(.+)$/m);
  const description = descMatch ? descMatch[1] : `Detailed overview of ${title}`;

  return {
    props: {
      content: fileContents,
      title,
      description,
    },
  };
}

export default ProjectDetails;
