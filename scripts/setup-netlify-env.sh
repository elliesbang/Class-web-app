#!/usr/bin/env bash
set -euo pipefail

if ! command -v netlify >/dev/null 2>&1; then
  echo "Netlify CLI (netlify) is required. Install it with 'npm install -g netlify-cli'." >&2
  exit 1
fi

required_vars=(SUPABASE_URL SUPABASE_ANON_KEY JWT_SECRET)
missing=()
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    missing+=("$var")
  fi
done

if (( ${#missing[@]} > 0 )); then
  echo "The following environment variables must be exported before running this script: ${missing[*]}" >&2
  exit 1
fi

netlify env:set SUPABASE_URL "$SUPABASE_URL"
netlify env:set SUPABASE_ANON_KEY "$SUPABASE_ANON_KEY"
netlify env:set JWT_SECRET "$JWT_SECRET"

echo "Environment variables configured for the current Netlify site."
