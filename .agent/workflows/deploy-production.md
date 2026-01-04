---
description: Deploy to production environment via release branch strategy
---

# Production Deployment Workflow

This workflow documents how to deploy BloomStudio to production using the release branch strategy.

## Prerequisites

Before first production deployment, ensure:
- [ ] Convex production deployment is created and configured
- [ ] Vercel production environment variables are set
- [ ] Cloudflare R2 production bucket exists (`bloomstudio-prod`)
- [ ] Domain `bloom-studio.ai` is connected in Vercel

---

## Environment Architecture

| Environment | Vercel | Convex | Stripe | Clerk | Git Branch |
|-------------|--------|--------|--------|-------|------------|
| Local Dev | localhost:3000 | dev deployment | Test | Dev | any |
| Preview | *.vercel.app | dev deployment | Test | Dev | main, feature/* |
| Production | bloom-studio.ai | prod deployment | Live | Prod | release |

---

## Deployment Steps

### Using GitHub UI (Recommended)
1.  **Open Pull Requests**: Go to your repository on GitHub and click the "Pull requests" tab.
2.  **New Pull Request**: Click "New pull request".
3.  **Choose Branches**:
    *   **base**: `release`
    *   **compare**: `main`
4.  **Create & Merge**: Create the Pull Request (title it "Release v...") and merge it.
    *   *This will automatically trigger a production deployment on Vercel.*

---

## GitHub Configuration (One-Time Setup)

To ensure stability, set up **Branch Protection Rules** in your repository settings:

1.  **Protect `main`**:
    *   Go to **Settings** > **Branches** > **Add rule**.
    *   Pattern: `main`.
    *   Check **"Require a pull request before merging"**.
    *   Check **"Require status checks to pass before merging"** (if you have CI).

2.  **Protect `release`** (Production):
    *   Pattern: `release`.
    *   Check **"Require a pull request before merging"**.
    *   Check **"Do not allow bypassing the above settings"**.
    *   *This ensures production deployments are always intentional via PRs.*

---

## Vercel Configuration (One-Time Setup)

### 1. Configure Environment Variables
Ensure the "Production" environment in Vercel has these variables set:

```
# Convex
CONVEX_DEPLOYMENT=prod:<your-slug>
NEXT_PUBLIC_CONVEX_URL=https://<your-slug>.convex.cloud

# Clerk (Production instance)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Stripe (Live mode)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_...

# Cloudflare R2 (Production bucket)
R2_ACCOUNT_ID=<your-account-id>
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_BUCKET_NAME=bloomstudio-prod
R2_PUBLIC_URL=https://<your-bucket-public-url>.r2.dev

# Security
ENCRYPTION_KEY=<generate-with-openssl-rand-hex-32>
BATCH_PROCESSING_SECRET=<generate-with-openssl-rand-hex-32>

# App
NEXT_PUBLIC_APP_URL=https://bloom-studio.ai
```

### 2. Verify Production Deployment
- Check Vercel dashboard for production deployment status
- Visit https://bloom-studio.ai and verify functionality
- Test Stripe checkout flow with a real card (cancel before confirming if just testing)

---

## Convex Production Deployment

### First-time setup
```bash
# Create production deployment
npx convex deploy --prod

# Set environment variables for production
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://clerk.bloom-studio.ai" --prod
npx convex env set NEXT_PUBLIC_APP_URL "https://bloom-studio.ai" --prod
npx convex env set R2_ACCOUNT_ID "<your-account-id>" --prod
npx convex env set R2_ACCESS_KEY_ID "<your-access-key>" --prod
npx convex env set R2_SECRET_ACCESS_KEY "<your-secret-key>" --prod
npx convex env set R2_BUCKET_NAME "bloomstudio-prod" --prod
npx convex env set R2_PUBLIC_URL "<your-bucket-public-url>" --prod
npx convex env set ENCRYPTION_KEY "<generate-with-openssl-rand-hex-32>" --prod
```

### Subsequent deployments
Convex automatically deploys when you push to the release branch (configured in Vercel build).

---

## Rollback Procedure

If production has issues:

### Option 1: Revert in Vercel
1. Go to Vercel Dashboard → Deployments
2. Find the last working production deployment
3. Click "..." → "Promote to Production"

### Option 2: Git revert
```bash
git checkout release
git revert HEAD
git push origin release
```

---

## Convex Production Environment Variables

Set via `npx convex env set <KEY> <VALUE> --prod`:
- CLERK_JWT_ISSUER_DOMAIN
- NEXT_PUBLIC_APP_URL
- R2_ACCOUNT_ID
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET_NAME
- R2_PUBLIC_URL
- ENCRYPTION_KEY
