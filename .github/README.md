# GitHub Actions Workflows

This directory contains CI/CD workflows and configurations for the DeltaScan monorepo.

## Workflows

### 🔄 Continuous Integration

#### [`ci.yml`](workflows/ci.yml)
Main CI pipeline that runs on every push and pull request.

**Jobs:**
- **Lint & Type Check:** Validates code quality and TypeScript types
- **Test:** Runs test suites for all packages
- **Build:** Builds all packages on Node 18 and 20, uploads artifacts

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

---

#### [`pr-checks.yml`](workflows/pr-checks.yml)
Enhanced validation for pull requests.

**Features:**
- Detects which packages changed
- Runs comprehensive quality checks
- Reports build output sizes
- Security dependency review

**Triggers:**
- Pull request opened, synchronized, or reopened

---

### 🚀 Deployment

#### [`deploy-vercel.yml`](workflows/deploy-vercel.yml)
Deploys the client (frontend) to Vercel.

**Features:**
- Production deployments on push to `main`
- Preview deployments for pull requests
- Automatic PR comments with preview URLs
- Build artifact optimization

**Required Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VITE_API_URL` (optional)

**Triggers:**
- Push to `main` (affecting client or shared packages)
- Pull requests (affecting client or shared packages)

---

#### [`deploy-render.yml`](workflows/deploy-render.yml)
Deploys the server (backend) to Render.

**Features:**
- Automatic deployment on push to `main`
- Manual deployment via workflow dispatch
- Deployment status tracking
- Build validation before deployment

**Required Secrets:**
- `RENDER_API_KEY`
- `RENDER_SERVICE_ID`

**Triggers:**
- Push to `main` (affecting server or shared packages)
- Manual trigger via Actions tab

---

### 🏷️ Automation

#### [`pr-labeler.yml`](workflows/pr-labeler.yml)
Automatically labels pull requests based on changed files.

**Labels Applied:**
- `package: shared` - Changes to shared package
- `package: server` - Changes to server package
- `package: client` - Changes to client package
- `dependencies` - Dependency updates
- `documentation` - Documentation changes
- `ci/cd` - CI/CD configuration changes

**Triggers:**
- Pull request opened or synchronized

---

## Configurations

### [`dependabot.yml`](dependabot.yml)
Automated dependency updates for all workspace packages.

**Update Schedule:** Weekly (Mondays)

**Monitors:**
- Root package.json
- Server package dependencies
- Client package dependencies
- Shared package dependencies
- GitHub Actions versions

---

### [`labeler.yml`](labeler.yml)
Configuration for automatic PR labeling rules.

Defines which file patterns trigger which labels.

---

## Setup Guide

### For Deployments

See **[DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md)** for detailed instructions on:
- Setting up GitHub secrets
- Configuring Vercel
- Configuring Render
- Troubleshooting deployment issues

### Quick Start

1. **Set up secrets** (required for deployments):
   ```bash
   gh secret set VERCEL_TOKEN
   gh secret set VERCEL_ORG_ID
   gh secret set VERCEL_PROJECT_ID
   gh secret set RENDER_API_KEY
   gh secret set RENDER_SERVICE_ID
   ```

2. **Verify workflows:**
   - Push changes to trigger CI
   - Create PR to test PR checks
   - Merge to `main` to trigger deployments

---

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Push to main/develop                      │
│                    or Pull Request Created                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ├──────────────────┬──────────────────────┐
                  │                  │                      │
         ┌────────▼─────────┐ ┌─────▼──────┐   ┌─────────▼────────┐
         │   CI Pipeline    │ │ PR Checks  │   │   PR Labeler     │
         │                  │ │            │   │                  │
         │ • Lint           │ │ • Changed  │   │ • Auto Labels    │
         │ • Type Check     │ │   Files    │   │                  │
         │ • Test           │ │ • Security │   │                  │
         │ • Build          │ │ • Summary  │   │                  │
         └────────┬─────────┘ └────────────┘   └──────────────────┘
                  │
                  │ (on merge to main)
                  │
         ┌────────▼─────────────────────────────────────┐
         │          Deployment Workflows                 │
         │                                               │
         │  ┌──────────────────┐  ┌──────────────────┐ │
         │  │  Vercel Deploy   │  │  Render Deploy   │ │
         │  │  (Client)        │  │  (Server)        │ │
         │  └──────────────────┘  └──────────────────┘ │
         └───────────────────────────────────────────────┘
```

---

## Best Practices

### For Contributors

1. **Ensure CI passes** before requesting review
2. **Check PR labels** to verify affected packages
3. **Review preview deployments** for client changes
4. **Monitor workflow runs** in the Actions tab

### For Maintainers

1. **Keep secrets up to date** and rotate periodically
2. **Review Dependabot PRs** weekly
3. **Monitor deployment logs** for issues
4. **Update Node versions** in workflows as needed

---

## Troubleshooting

### CI Failures

**Lint/Type Check Fails:**
- Run `npm run lint` and `npm run type-check` locally
- Fix issues before pushing

**Build Fails:**
- Run `npm run build` locally
- Check for missing dependencies

**Tests Fail:**
- Run `npm test` locally
- Ensure all tests pass before pushing

### Deployment Failures

**Vercel Deployment:**
- Check secrets are configured correctly
- Verify Vercel project is linked
- See [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md)

**Render Deployment:**
- Verify API key is valid
- Check service ID is correct
- Review Render dashboard logs

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Documentation](https://vercel.com/docs/deployments/overview)
- [Render Deployment Documentation](https://render.com/docs/deploys)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)

---

## Contributing

When adding new workflows:

1. Test locally with [act](https://github.com/nektos/act) if possible
2. Document required secrets and environment variables
3. Add workflow to this README
4. Update DEPLOYMENT_SETUP.md if adding deployment steps
