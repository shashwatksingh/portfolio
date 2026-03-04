# Overview

![Banner](https://github.com/shashwatksingh/portfolio/blob/main/public/preview.png)

This website serves as an online portfolio to showcase
- my resume
- my web presence
- my journey 
- my featured projects

## Technologies Used

- Next.js
- SCSS
- React-Markdown
- Vercel

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/shashwatksingh/portfolio.git
   ```
   
2. Navigate to the project directory:

   ```
   cd portfolio
   ```
  
3. Install the dependencies:

   ```
   npm install
   ```

4. Start the development server:

   ```
   npm run dev
   ```
   
5. Open your browser and visit http://localhost:3000 to see the website in development mode.

## Deployment

### Deploy to Vercel (Recommended)

This project is optimized for deployment on Vercel. Follow these steps:

#### Option 1: Deploy via Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Add New..." → "Project"
4. Import your Git repository
5. Vercel will auto-detect Next.js settings
6. Add environment variables if needed:
   - `NEXT_PUBLIC_API_URL` - Your production API URL
7. Click "Deploy"
8. Your site will be live at `https://your-project.vercel.app`

#### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from project directory)
vercel

# Deploy to production
vercel --prod
```

#### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO)

For detailed deployment instructions, see [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Build

To create a production build locally:

```bash
npm run build
npm start
```
