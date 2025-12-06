# Deployment Guide for Sun in Sky

This guide will help you deploy the Sun in Sky application to the web so your students can access it from any device with a browser. No coding experience required!

## Table of Contents
- [Before You Start](#before-you-start)
- [Option 1: GitHub Pages (Recommended)](#option-1-github-pages-recommended)
- [Option 2: Netlify](#option-2-netlify)
- [Option 3: Vercel](#option-3-vercel)
- [Updating Your Deployed Site](#updating-your-deployed-site)
- [Troubleshooting](#troubleshooting)

---

## Before You Start

### What You'll Need
1. **A computer** with internet access
2. **Node.js installed** (version 20.19+ or 22.12+)
   - Download from: https://nodejs.org
   - Choose the LTS (Long Term Support) version
3. **The Sun in Sky project files** (you should already have these)

### One-Time Setup
Open your computer's terminal or command prompt and navigate to the project folder:

```bash
cd /path/to/sun-in-sky
npm install
```

This downloads all the necessary files the app needs to run. You only need to do this once.

---

## Option 1: GitHub Pages (Recommended)

**Best for:** Free, simple, and works great for classroom use

### Step 1: Create a GitHub Account
1. Go to https://github.com
2. Click "Sign up" and create a free account
3. Verify your email address

### Step 2: Install Git
1. Download Git from: https://git-scm.com/downloads
2. Install with default settings
3. Open terminal/command prompt and verify:
   ```bash
   git --version
   ```

### Step 3: Create a Repository
1. Log into GitHub
2. Click the "+" icon in the top right
3. Select "New repository"
4. Name it: `sun-in-sky`
5. Keep it public (required for free hosting)
6. DO NOT initialize with README
7. Click "Create repository"

### Step 4: Connect Your Project to GitHub
In your terminal, from the `sun-in-sky` folder:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create your first commit
git commit -m "Initial commit"

# Connect to GitHub (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/sun-in-sky.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 5: Deploy to GitHub Pages
```bash
# Build and deploy
npm run deploy:github
```

### Step 6: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click "Settings" tab
3. Click "Pages" in the left sidebar
4. Under "Source", select the `gh-pages` branch
5. Click "Save"
6. Wait 2-3 minutes for deployment
7. Your site will be available at: `https://YOUR-USERNAME.github.io/sun-in-sky/`

**That's it!** Bookmark this URL and share it with students.

---

## Option 2: Netlify

**Best for:** Drag-and-drop simplicity, no command line needed after initial build

### Step 1: Build Your Site
In terminal, from the `sun-in-sky` folder:

```bash
npm run build
```

This creates a `dist` folder with your website files.

### Step 2: Create a Netlify Account
1. Go to https://netlify.com
2. Click "Sign up"
3. Sign up with GitHub, GitLab, or email

### Step 3: Deploy Your Site
1. Log into Netlify
2. Click "Add new site" → "Deploy manually"
3. Drag the entire `dist` folder onto the upload area
4. Wait for deployment to complete
5. Netlify will give you a URL like: `https://random-name-12345.netlify.app`

### Step 4: Customize Your URL (Optional)
1. Click "Site settings"
2. Click "Change site name"
3. Enter a custom name: `your-school-sun-in-sky`
4. Your new URL: `https://your-school-sun-in-sky.netlify.app`

### Continuous Deployment (Advanced)
Instead of manual uploads, connect your GitHub repository:
1. In Netlify, click "Add new site" → "Import an existing project"
2. Connect to GitHub
3. Select your `sun-in-sky` repository
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Click "Deploy site"

Now every time you push to GitHub, Netlify automatically rebuilds your site!

---

## Option 3: Vercel

**Best for:** Similar to Netlify, excellent performance

### Step 1: Create a Vercel Account
1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended)

### Step 2: Import Your Project

#### Option A: From GitHub
1. Click "Add New..." → "Project"
2. Import your `sun-in-sky` repository
3. Vercel detects Vite automatically
4. Click "Deploy"
5. Done! Vercel gives you a URL: `https://sun-in-sky-xyz.vercel.app`

#### Option B: Manual Deploy
1. Build your site first:
   ```bash
   npm run build
   ```
2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Deploy:
   ```bash
   vercel --prod
   ```
4. Follow the prompts
5. Your site is live!

---

## Updating Your Deployed Site

### GitHub Pages
After making changes to your code:
```bash
npm run deploy:github
```

### Netlify

**Manual deployment:**
1. Run `npm run build`
2. Go to Netlify dashboard
3. Drag the new `dist` folder to your site
4. Wait for deployment

**Automatic (if connected to GitHub):**
1. Make your changes
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Updated content"
   git push
   ```
3. Netlify automatically rebuilds (takes 1-2 minutes)

### Vercel
Same as Netlify automatic deployment - just push to GitHub!

---

## Troubleshooting

### "Command not found: npm"
**Problem:** Node.js isn't installed or not in your PATH

**Solution:**
1. Download Node.js from https://nodejs.org
2. Install with default settings
3. Restart your terminal
4. Try again

### "Permission denied" errors
**Problem:** Need administrator access

**Solution (Mac/Linux):**
```bash
sudo npm install -g [package-name]
```

**Solution (Windows):**
Run terminal/command prompt as Administrator

### Build fails with "out of memory"
**Problem:** Not enough RAM for build

**Solution:**
```bash
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### GitHub Pages shows 404
**Problem:** GitHub Pages not configured correctly

**Solution:**
1. Check that `gh-pages` branch exists
2. Verify GitHub Pages source is set to `gh-pages` branch
3. Wait 5-10 minutes for DNS to propagate
4. Try the URL in incognito/private browsing mode

### Site works locally but not when deployed
**Problem:** Usually a base path issue

**Solution:**
Ensure `vite.config.js` has the correct base:
```javascript
export default defineConfig({
  base: '/sun-in-sky/', // For GitHub Pages
  // OR
  base: '/', // For Netlify/Vercel
  plugins: [react()],
})
```

### Changes not appearing on deployed site
**Problem:** Browser cache

**Solution:**
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Try in incognito/private mode

### Students can't access the site
**Problem:** School firewall or URL blocked

**Solution:**
1. Contact IT department
2. Provide the URL for whitelisting
3. Explain it's an educational tool
4. Alternative: Deploy to multiple platforms and try different URLs

---

## Quick Comparison

| Platform | Difficulty | Speed | Cost | Best For |
|----------|-----------|-------|------|----------|
| **GitHub Pages** | Medium | Fast | Free | Long-term hosting |
| **Netlify** | Easy | Very Fast | Free | Quick setup |
| **Vercel** | Easy | Very Fast | Free | Modern workflow |

**Our recommendation:**
- Complete beginners: **Netlify** (drag and drop)
- Teachers comfortable with Git: **GitHub Pages** (most control)
- Teams using GitHub already: **Vercel** (seamless integration)

---

## Need More Help?

### Video Tutorials
Search YouTube for:
- "Deploy React app to GitHub Pages"
- "Deploy to Netlify tutorial"
- "Vercel deployment guide"

### Documentation
- GitHub Pages: https://pages.github.com
- Netlify: https://docs.netlify.com
- Vercel: https://vercel.com/docs

### Common Questions

**Q: How much does hosting cost?**
A: All three options are completely free for projects like this!

**Q: Can I use a custom domain (like sun.myschool.edu)?**
A: Yes! All three platforms support custom domains. Check their documentation for setup.

**Q: What if my school blocks GitHub/Netlify/Vercel?**
A: Deploy to all three and try different URLs. Contact IT with the educational purpose.

**Q: How do I password-protect the site?**
A: Netlify and Vercel offer password protection in their settings. GitHub Pages requires more advanced setup.

**Q: Can students edit the site?**
A: No, the deployed site is read-only. Only you can update it by deploying new versions.

---

## Next Steps

Once deployed:
1. Bookmark the URL
2. Share with students via your LMS (Canvas, Google Classroom, etc.)
3. Test on different devices (phone, tablet, computer)
4. Read the [Teacher Guide](teacher-guide.md) for classroom tips
5. Try the [Classroom Activities](classroom-activities.md)

**Congratulations!** Your Sun in Sky app is now live and ready for classroom use!
