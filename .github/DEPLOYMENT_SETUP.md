# Deployment Setup Guide

This guide explains how to configure GitHub secrets for automated deployments to Vercel and Render.

## Required GitHub Secrets

To enable automated deployments, you need to configure the following secrets in your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

---

## Vercel Deployment Secrets

### 1. `VERCEL_TOKEN`
**Description:** Personal or team access token for Vercel API authentication.

**How to obtain:**
1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name it (e.g., "GitHub Actions - DeltaScan")
4. Select appropriate scope (Full Account recommended)
5. Copy the generated token

**Usage:** Authenticates GitHub Actions to deploy to Vercel.

---

### 2. `VERCEL_ORG_ID`
**Description:** Your Vercel organization/team ID.

**How to obtain:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel login` and authenticate
3. In your project directory, run: `vercel link`
4. Follow prompts to link to your Vercel project
5. Check `.vercel/project.json` - the `orgId` field contains your org ID

**Alternative method:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to Settings → General
3. Find your Team/Organization ID in the URL or settings

**Usage:** Identifies which Vercel organization to deploy to.

---

### 3. `VERCEL_PROJECT_ID`
**Description:** The unique ID of your Vercel project.

**How to obtain:**
1. Same as `VERCEL_ORG_ID` - run `vercel link`
2. Check `.vercel/project.json` - the `projectId` field
3. Or go to your project settings in Vercel Dashboard

**Usage:** Specifies which Vercel project to deploy the client to.

---

### 4. `VITE_API_URL` (Optional)
**Description:** The API endpoint URL for your backend server.

**Example values:**
- Production: `https://your-api.render.com`
- Preview: `https://staging-api.render.com`

**Usage:** Sets the backend API URL that the Vite/React client will call.

---

## Render Deployment Secrets

### 1. `RENDER_API_KEY`
**Description:** API key for authenticating with Render's API.

**How to obtain:**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on your account icon (top right) → Account Settings
3. Navigate to "API Keys" section
4. Click "Create API Key"
5. Name it (e.g., "GitHub Actions")
6. Copy the generated key immediately (it won't be shown again)

**Usage:** Authenticates GitHub Actions to trigger Render deployments.

---

### 2. `RENDER_SERVICE_ID`
**Description:** The unique identifier for your Render web service.

**How to obtain:**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your web service (DeltaScan server)
3. The Service ID is in the URL: `https://dashboard.render.com/web/srv-XXXXX`
4. Or find it in Settings → General → Service ID

**Usage:** Specifies which Render service to deploy the server to.

---

### 3. `RENDER_SERVICE_ID_STAGING` (Optional)
**Description:** Service ID for staging environment if you have one.

**Usage:** For deploying to a staging/preview Render service.

---

## Environment-Specific Secrets

GitHub Actions supports environment-specific secrets for production vs. preview deployments:

1. Go to **Settings → Environments**
2. Create environments: `production`, `preview`, `staging`
3. Add environment-specific secrets to each

### Production Environment
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `RENDER_API_KEY`
- `RENDER_SERVICE_ID`
- `VITE_API_URL`

### Preview/Staging Environment
- Same secrets, but potentially different values for staging services

---

## Setting Up Secrets

### Via GitHub Web UI
1. Navigate to your repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter name and value
5. Click **Add secret**

### Via GitHub CLI
```bash
# Install GitHub CLI if needed
brew install gh  # macOS
# or: https://cli.github.com/

# Authenticate
gh auth login

# Add secrets
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
gh secret set VITE_API_URL
gh secret set RENDER_API_KEY
gh secret set RENDER_SERVICE_ID
```

---

## Vercel Project Configuration

To link your local project to Vercel:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project (from repository root)
vercel link

# Follow prompts:
# - Set up and deploy: Yes
# - Scope: Select your team/account
# - Link to existing project: Yes (or create new)
# - Project name: deltascan or your project name
# - Directory: ./packages/client
```

This creates `.vercel/project.json` with your IDs.

**Important:** Don't commit `.vercel/` directory (already in `.gitignore`).

---

## Render Project Configuration

### Creating a Render Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** deltascan-server
   - **Environment:** Node
   - **Build Command:** `npm ci && npm run build:server`
   - **Start Command:** `npm start`
   - **Root Directory:** Leave blank (monorepo setup)

5. Add environment variables in Render dashboard:
   - Any env vars your server needs (database URLs, API keys, etc.)

6. Copy the Service ID from the URL or settings

---

## Verification

After setting up secrets, verify by:

1. **Trigger a deployment:**
   - Push to `main` branch
   - Or manually trigger via Actions tab

2. **Check workflow runs:**
   - Go to **Actions** tab in GitHub
   - View the running workflows
   - Check for any errors

3. **Verify deployments:**
   - **Vercel:** Check deployment URLs in workflow summary
   - **Render:** Check Render dashboard for deployment status

---

## Troubleshooting

### Vercel Deployment Issues

**Error: "Invalid token"**
- Regenerate `VERCEL_TOKEN` and update secret

**Error: "Project not found"**
- Verify `VERCEL_PROJECT_ID` is correct
- Ensure project exists in Vercel dashboard

### Render Deployment Issues

**Error: "Unauthorized"**
- Check `RENDER_API_KEY` is valid
- Regenerate key if needed

**Error: "Service not found"**
- Verify `RENDER_SERVICE_ID` is correct
- Check service exists in Render dashboard

**Deployment stuck "In Progress"**
- Check Render dashboard for detailed logs
- Verify build commands are correct

---

## Security Best Practices

1. **Never commit secrets to repository**
2. **Rotate API keys periodically**
3. **Use environment-specific secrets** for production vs. staging
4. **Limit API key permissions** to minimum required
5. **Monitor deployment logs** for exposed secrets
6. **Use GitHub's secret scanning** feature

---

## Additional Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel API Documentation](https://vercel.com/docs/rest-api)
- [Render API Documentation](https://render.com/docs/api)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## Quick Reference

| Secret | Purpose | Where to Get |
|--------|---------|--------------|
| `VERCEL_TOKEN` | Vercel API auth | vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Vercel org identifier | `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Vercel project identifier | `.vercel/project.json` |
| `VITE_API_URL` | Backend API endpoint | Your Render URL |
| `RENDER_API_KEY` | Render API auth | dashboard.render.com/account |
| `RENDER_SERVICE_ID` | Render service identifier | Render service URL/settings |
