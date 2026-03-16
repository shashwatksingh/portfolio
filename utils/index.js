import path from "path";
import formatDuration from "date-fns/formatDuration";
import intervalToDuration from "date-fns/intervalToDuration";
import { GitHub, Linkedin } from "react-feather";

import GenericProjectImage from "../assets/paper.webp";

import Javascript from "../assets/svg/javascript.svg";
import TypeScript from "../assets/svg/typescript.svg";
import Java from "../assets/svg/java.svg";
import Go from "../assets/svg/go.svg";
import Python from "../assets/svg/python.svg";
import Node from "../assets/svg/node.svg";
import NestJS from "../assets/svg/nestjs.svg";
import Express from "../assets/svg/express.svg";
import React from "../assets/svg/react.svg";
import NextJs from "../assets/svg/nextjs.svg";
import MongoDB from "../assets/svg/mongodb.svg";
import MySQL from "../assets/svg/mysql.svg";
import PostgreSQL from "../assets/svg/postgresql.svg";
import Redis from "../assets/svg/redis.svg";
import Docker from "../assets/svg/docker.svg";
import Kubernetes from "../assets/svg/kubernetes.svg";
import AWS from "../assets/svg/aws.svg";
import Kafka from "../assets/svg/kafka.svg";
import GRPC from "../assets/svg/grpc.svg";
import NGINX from "../assets/svg/nginx.svg";
import Git from "../assets/svg/git.svg";
import { PenTool, Command, User } from "react-feather";

export const humanizeDuration = (time) => {
  const durations = intervalToDuration({ start: 0, end: time * 1000 });
  return formatDuration(durations);
};

export const resumeLink =
  "https://drive.google.com/file/d/1pOwk_RQ-FI3rVvlenPJnoFfJjHQMmI-d/view?usp=sharing";

export const timeline = [
  {
    orgId: 0,
    orgName: "Edugorilla",
    yearwise: [
      {
        id: 0,
        start: "Mar 2021",
        end: "May 2021",
        position: "Frontend Intern",
      },
    ],
  },
  {
    orgId: 1,
    orgName: "Auzmor Technology",
    yearwise: [
      {
        id: 0,
        start: "Aug 2021",
        end: "Dec 2022",
        position: "SWE 1",
      },
      {
        id: 1,
        start: "Jan 2023",
        end: "Dec 2024",
        position: "SWE 3",
      },
      {
        id: 2,
        start: "Jan 2025",
        end: "Present",
        position: "Senior SWE",
      },
    ],
  },
];

export const projects = [
  {
    id: 0,
    src: GenericProjectImage,
    name: "Qelaura Backend",
    description: "Enterprise Social Content Management Platform built with TypeScript, NestJS, MongoDB, MySQL, Redis, AWS, Docker, and gRPC",
    codeUrl: "https://github.com/SamvetaOrg/arjun",
    websiteUrl: "https://api.samveta.qelaura.com/",
    type: "",
    detailsUrl: "/projects/arjun-backend-microservices",
  },
  {
    id: 1,
    src: GenericProjectImage,
    name: "Qelaura WebSocket Microservice",
    description: "Enterprise Real-Time Communication Platform supporting 50k+ concurrent connections with Go, WebSockets, Redis, MongoDB, gRPC, NGINX, and Docker",
    codeUrl: "https://github.com/SamvetaOrg/sanjay",
    websiteUrl: "https://github.com/SamvetaOrg/sanjay",
    type: "",
    detailsUrl: "/projects/sanjay-websocket-platform",
  },
  {
    id: 2,
    src: GenericProjectImage,
    name: "URL Shortener",
    description: "Production-grade URL shortening microservice with Go 1.25, MongoDB, Redis, featuring Snowflake ID generation and 10,000+ clicks/second throughput",
    codeUrl: "https://github.com/SamvetaOrg/anushanga",
    websiteUrl: "https://github.com/SamvetaOrg/anushanga",
    type: "",
    detailsUrl: "/projects/anushanga-url-shortener",
  },
];

export const navMenuItems = [
  {
    id: 0,
    name: "About",
    url: "/",
    icon: (props) => <User {...props} />,
  },
  {
    id: 1,
    name: "Work",
    url: "/work",
    icon: (props) => <Command {...props} />,
  },
  {
    id: 2,
    name: "Blogs",
    url: "/blogs",
    icon: (props) => <PenTool {...props} />,
  },
];

export const whiteListRoutes = ["/", "/work", "/contact", "/blogs"];

export const navbarRoutes = ["/", "/work", "/contact", "/blogs"];

const docsDirectory = path.join(process.cwd(), "markdown");

export const blogsList = [
  {
    id: 0,
    slug: "understanding-jvm-garbage-collection-for-high-performance-applications",
    fileName: "jvm-garbage-collection",
    createdAt: 1735689600000, // January 1, 2025
    readDuration: 480,
    name: "Understanding JVM Garbage Collection for High-Performance Applications",
    description:
      "Deep dive into JVM garbage collection mechanisms, tuning strategies, and best practices for building low-latency, high-throughput applications in fintech.",
    keywords: "JVM,Java,Garbage Collection,G1GC,ZGC,Performance Tuning,Fintech,Low Latency,Memory Management",
  },
  {
    id: 1,
    slug: "implementing-acid-transactions-in-distributed-systems",
    fileName: "acid-transactions-distributed",
    createdAt: 1738368000000, // February 1, 2025
    readDuration: 420,
    name: "Implementing ACID Transactions in Distributed Systems",
    description:
      "Explore strategies for maintaining ACID properties in distributed architectures, including two-phase commit, saga patterns, and eventual consistency in payment systems.",
    keywords: "ACID,Distributed Systems,Transactions,Two-Phase Commit,Saga Pattern,Database,Consistency,Fintech,Payment Processing",
  },
  {
    id: 2,
    slug: "concurrency-patterns-in-go-for-payment-processing",
    fileName: "go-concurrency-payments",
    createdAt: 1740787200000, // March 1, 2025
    readDuration: 360,
    name: "Concurrency Patterns in Go for Payment Processing Systems",
    description:
      "Learn how to leverage Go's goroutines, channels, and concurrency primitives to build robust, high-throughput payment processing systems with proper error handling and idempotency.",
    keywords: "Go,Golang,Concurrency,Goroutines,Channels,Payment Processing,Fintech,Idempotency,Error Handling,Distributed Systems",
  },
];

export const notFoundBlogMeta = {
  id: 0,
  slug: "",
  fileName: "",
  createdAt: 0,
  readDuration: 0,
  name: "Blogs",
};

export const getBlogMeta = (slug) =>
  blogsList.find((blog) => blog.slug === slug);

export const getDocBySlug = (slug) => {
  const blogMeta = getBlogMeta(slug);

  if (blogMeta) {
    return {
      file: path.join(docsDirectory, `${blogMeta.fileName}.md`),
      blogMeta,
    };
  }

  return {
    file: path.join(docsDirectory, "not-found.md"),
    blogMeta: notFoundBlogMeta,
  };
};

export const skillsList = [
  // Programming Languages
  {
    id: 0,
    imgSrc: TypeScript,
    name: "TypeScript",
    url: "https://www.typescriptlang.org/",
  },
  {
    id: 1,
    imgSrc: Javascript,
    name: "JavaScript",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  },
  {
    id: 2,
    imgSrc: Go,
    name: "Go",
    url: "https://go.dev/",
  },
  {
    id: 3,
    imgSrc: Java,
    name: "Java",
    url: "https://www.java.com/",
  },
  {
    id: 4,
    imgSrc: Python,
    name: "Python",
    url: "https://www.python.org/",
  },
  // Backend Frameworks
  {
    id: 5,
    imgSrc: Node,
    name: "Node.js",
    url: "https://nodejs.org/en",
  },
  {
    id: 6,
    imgSrc: NestJS,
    name: "NestJS",
    url: "https://nestjs.com/",
  },
  {
    id: 7,
    imgSrc: Express,
    name: "Express.js",
    url: "https://expressjs.com/",
  },
  // Databases
  {
    id: 8,
    imgSrc: MongoDB,
    name: "MongoDB",
    url: "https://www.mongodb.com/",
  },
  {
    id: 9,
    imgSrc: MySQL,
    name: "MySQL",
    url: "https://www.mysql.com/",
  },
  {
    id: 10,
    imgSrc: PostgreSQL,
    name: "PostgreSQL",
    url: "https://www.postgresql.org/",
  },
  {
    id: 11,
    imgSrc: Redis,
    name: "Redis",
    url: "https://redis.io/",
  },
  // DevOps & Cloud
  {
    id: 12,
    imgSrc: Docker,
    name: "Docker",
    url: "https://www.docker.com/",
  },
  {
    id: 13,
    imgSrc: Kubernetes,
    name: "Kubernetes",
    url: "https://kubernetes.io/",
  },
  {
    id: 14,
    imgSrc: AWS,
    name: "AWS",
    url: "https://aws.amazon.com/",
  },
  {
    id: 15,
    imgSrc: Git,
    name: "Git",
    url: "https://git-scm.com/",
  },
  // Message Queues & Communication
  {
    id: 16,
    imgSrc: Kafka,
    name: "Apache Kafka",
    url: "https://kafka.apache.org/",
  },
  {
    id: 17,
    imgSrc: GRPC,
    name: "gRPC",
    url: "https://grpc.io/",
  },
  {
    id: 18,
    imgSrc: NGINX,
    name: "NGINX",
    url: "https://www.nginx.com/",
  },
  // Frontend (keeping existing)
  {
    id: 19,
    imgSrc: React,
    name: "React.js",
    url: "https://react.dev/",
  },
  {
    id: 20,
    imgSrc: NextJs,
    name: "Next.js",
    url: "https://nextjs.org/",
  },
];

export const getBlogUrl = (slug) => {
  return `https://shashwatksingh.dev/blogs/${slug}`;
};

export const socials = [
  {
    id: 'github',
    class: 'github',
    url: 'https://github.com/shashwatksingh',
    icon: <GitHub size={24} strokeWidth={1.25} />,
    name: 'GitHub',
    username: 'shashwatksingh',
  },
  {
    id: 'linkedin',
    class: 'linkedin',
    url: 'https://www.linkedin.com/in/shashwat-kumar-singh/',
    icon: <Linkedin size={24} strokeWidth={1.25} />,
    name: 'LinkedIn',
    username: 'shashwat-kumar-singh'
  },
  {
    id: 'twitter',
    class: 'twitter',
    url: 'https://x.com/shashwatksingh',
    icon: '𝕏',
    name: 'Twitter',
    username: 'shashwatksingh',
  },
]
