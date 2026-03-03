const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Logo sources from CDNs and official sources
const logos = [
  {
    name: 'typescript',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
    filename: 'typescript.svg'
  },
  {
    name: 'go',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
    filename: 'go.svg'
  },
  {
    name: 'mongodb',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
    filename: 'mongodb.svg'
  },
  {
    name: 'mysql',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
    filename: 'mysql.svg'
  },
  {
    name: 'redis',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg',
    filename: 'redis.svg'
  },
  {
    name: 'docker',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
    filename: 'docker.svg'
  },
  {
    name: 'postgresql',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    filename: 'postgresql.svg'
  },
  {
    name: 'aws',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg',
    filename: 'aws.svg'
  },
  {
    name: 'nginx',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg',
    filename: 'nginx.svg'
  },
  {
    name: 'grpc',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/grpc/grpc-original.svg',
    filename: 'grpc.svg'
  },
  {
    name: 'nestjs',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nestjs/nestjs-original.svg',
    filename: 'nestjs.svg'
  },
  {
    name: 'kafka',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apachekafka/apachekafka-original.svg',
    filename: 'kafka.svg'
  },
  {
    name: 'kubernetes',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg',
    filename: 'kubernetes.svg'
  },
  {
    name: 'python',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    filename: 'python.svg'
  },
  {
    name: 'spring',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg',
    filename: 'spring.svg'
  }
];

const outputDir = path.join(__dirname, 'assets', 'svg');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        downloadFile(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`✓ Downloaded: ${path.basename(filepath)}`);
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadAllLogos() {
  console.log('Starting logo downloads...\n');
  
  for (const logo of logos) {
    const filepath = path.join(outputDir, logo.filename);
    
    try {
      await downloadFile(logo.url, filepath);
    } catch (error) {
      console.error(`✗ Failed to download ${logo.name}:`, error.message);
    }
  }
  
  console.log('\nDownload complete!');
}

downloadAllLogos();
