# Deploying to Vercel

This guide will help you deploy your Next.js portfolio application to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier available)
- Git repository (GitHub, GitLab, or Bitbucket)
- Your project pushed to the repository

## Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended for First-Time)

1. **Push your code to a Git repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repository-url>
   git push -u origin main
   ```

2. **Import your project to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." → "Project"
   - Import your Git repository
   - Vercel will automatically detect it's a Next.js project

3. **Configure your project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `next build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Add Environment Variables** (if needed):
   - Click "Environment Variables"
   - Add your variables:
     - `NEXT_PUBLIC_API_URL` - Your production API URL
     - `NEXT_PUBLIC_API_URL_LOCAL` - Your local API URL (optional for production)
   
5. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (usually 1-2 minutes)
   - Your site will be live at `https://your-project-name.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:
   ```bash
   # For preview deployment
   vercel
   
   # For production deployment
   vercel --prod
   ```

4. **Follow the prompts**:
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N` (first time) or `Y` (subsequent deploys)
   - What's your project's name? Enter a name
   - In which directory is your code located? `./`

5. **Add environment variables via CLI** (optional):
   ```bash
   vercel env add NEXT_PUBLIC_API_URL production
   vercel env add NEXT_PUBLIC_API_URL_LOCAL development
   ```

### Method 3: Deploy with One Click

Click the button below to deploy directly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO)

## Post-Deployment Configuration

### Custom Domain (Optional)

1. Go to your project settings on Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update your domain's DNS settings as instructed by Vercel

### Environment Variables

After deployment, you can manage environment variables:

1. Go to your project on Vercel Dashboard
2. Click "Settings" → "Environment Variables"
3. Add/Edit variables as needed
4. Redeploy for changes to take effect

### Automatic Deployments

Vercel automatically deploys:
- **Production**: Every push to your `main` or `master` branch
- **Preview**: Every push to other branches and pull requests

## Vercel Configuration

The project includes a `vercel.json` file with optimized settings for:
- Build configuration
- Security headers
- Route handling
- Performance optimization

## Build Optimization

Your project is already optimized with:
- ✅ Next.js 14 with App Router support
- ✅ Vercel Analytics integration
- ✅ Vercel Speed Insights
- ✅ Image optimization with Sharp
- ✅ Security headers configured
- ✅ PWA support with manifest

## Troubleshooting

### Build Fails

1. **Check build logs** in Vercel Dashboard
2. **Ensure all dependencies are in `package.json`**
3. **Test build locally**:
   ```bash
   npm run build
   npm start
   ```

### Environment Variables Not Working

- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding/changing environment variables
- Check variable names match exactly (case-sensitive)

### 404 Errors on Dynamic Routes

- Ensure your dynamic route files are named correctly: `[slug].js`, `[id].js`
- Check that `getStaticPaths` and `getStaticProps` are properly configured

### Images Not Loading

- Verify image paths are correct
- Check that images are in the `public` directory or properly imported
- Ensure Sharp is installed for image optimization

## Performance Monitoring

After deployment, monitor your app:
- **Vercel Analytics**: Automatic visitor tracking
- **Speed Insights**: Core Web Vitals monitoring
- **Deployment Logs**: Check for any runtime errors

## Useful Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs <deployment-url>

# Remove a deployment
vercel rm <deployment-name>

# Pull environment variables locally
vercel env pull

# Link local project to Vercel project
vercel link
```

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## Support

If you encounter issues:
1. Check [Vercel Status](https://www.vercel-status.com/)
2. Visit [Vercel Community](https://github.com/vercel/vercel/discussions)
3. Review [Next.js Discussions](https://github.com/vercel/next.js/discussions)
