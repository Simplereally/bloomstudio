#!/bin/bash

# Vercel Ignored Build Step
# Controls which branches/environments can deploy.
# Exit 0 = Skip build, Exit 1 = Proceed with build
#
# Policy:
#   - Production deployments: ONLY from the 'release' branch
#   - Preview deployments: NONE (completely disabled)
#   - All other cases: blocked

echo "Branch: $VERCEL_GIT_COMMIT_REF"
echo "Environment: $VERCEL_ENV"

# Only allow production builds from the 'release' branch.
# Block everything else — no preview deployments, no other branches.
if [[ "$VERCEL_ENV" == "production" && "$VERCEL_GIT_COMMIT_REF" == "release" ]]; then
  echo "✅ Production build allowed: deploying from 'release' branch"
  exit 1
fi

echo "❌ Build skipped: only production builds from 'release' branch are allowed"
echo "   Got: env=$VERCEL_ENV, branch=$VERCEL_GIT_COMMIT_REF"
exit 0
