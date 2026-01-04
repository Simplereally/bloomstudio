#!/bin/bash

# Vercel Ignored Build Step
# This script controls which branches can deploy to which environments.
# Exit 0 = Skip build, Exit 1 = Proceed with build

echo "Branch: $VERCEL_GIT_COMMIT_REF"
echo "Environment: $VERCEL_ENV"

# Production deployments: Only allow 'release' branch
if [[ "$VERCEL_ENV" == "production" ]]; then
  if [[ "$VERCEL_GIT_COMMIT_REF" == "release" ]]; then
    echo "✅ Production build allowed: deploying from 'release' branch"
    exit 1
  else
    echo "❌ Production build blocked: only 'release' branch can deploy to production"
    echo "   Current branch: $VERCEL_GIT_COMMIT_REF"
    exit 0
  fi
fi

# Preview deployments: Allow main and feature branches
if [[ "$VERCEL_ENV" == "preview" ]]; then
  echo "✅ Preview build allowed for branch: $VERCEL_GIT_COMMIT_REF"
  exit 1
fi

# Default: proceed with build
exit 1
