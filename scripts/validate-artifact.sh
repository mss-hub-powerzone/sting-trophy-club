#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

worker="${SITES_PROJECT_ROOT}/dist/server/index.js"
hosting="${SITES_PROJECT_ROOT}/dist/.openai/hosting.json"

[[ -f "${worker}" ]] || {
  echo "Missing Sites Worker entry: dist/server/index.js" >&2
  exit 66
}
[[ -f "${hosting}" ]] || {
  echo "Missing packaged Sites manifest: dist/.openai/hosting.json" >&2
  exit 66
}

# Workers can import cloudflare:workers, which plain Node cannot resolve.
# Parse the entrypoint, then validate the complete bundle with Wrangler.
node --check "${worker}"
node -e 'JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8"))' "${hosting}"
node "${SITES_PROJECT_ROOT}/node_modules/wrangler/bin/wrangler.js" deploy \
  --dry-run --config "${SITES_PROJECT_ROOT}/dist/server/wrangler.json" \
  --outdir "${SITES_PROJECT_ROOT}/.sites-runtime/validated-worker"

echo "Validated Sites artifact: Worker syntax, hosting manifest, and Cloudflare bundle."

