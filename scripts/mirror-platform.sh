#!/usr/bin/env bash
# Publish per-push release notes to the public wiki-platform mirror.
# Only commit SUBJECTS cross the boundary — never diffs, file bodies, or secrets.
#
# Usage (CI):  mirror-platform.sh <old-sha> <new-sha> <public-clone-dir>
# Usage (local manual): ./scripts/mirror-platform.sh HEAD~3 HEAD /tmp/wiki-platform
set -euo pipefail

OLD_SHA="${1:?usage: mirror-platform.sh <old-sha> <new-sha> <public-clone-dir>}"
NEW_SHA="${2:?usage: mirror-platform.sh <old-sha> <new-sha> <public-clone-dir>}"
PUBLIC_DIR="${3:?usage: mirror-platform.sh <old-sha> <new-sha> <public-clone-dir>}"

# --- 1. Collect commit subjects only (no bodies, no diffs) ---
SUBJECTS="$(git log "${OLD_SHA}..${NEW_SHA}" --format=%s)"
if [ -z "${SUBJECTS}" ]; then
  echo "mirror-platform: no commits in range, nothing to publish."
  exit 0
fi

DATE="$(date +%F)"
SHORT_SHA="$(echo "${NEW_SHA}" | cut -c1-7)"
RELEASE_FILE="${PUBLIC_DIR}/releases/${DATE}-${SHORT_SHA}.md"

# --- 2. Leak guard: fail closed on secret-looking or code-looking content ---
BLOCKLIST='turnstile|BEGIN .*PRIVATE KEY|private.?key|password|api[_-]?key|-----BEGIN|ghp_[A-Za-z0-9]+|github_pat_[A-Za-z0-9_]+'
if echo "${SUBJECTS}" | grep -qiE "${BLOCKLIST}"; then
  echo "mirror-platform: BLOCKED — a commit subject matches the leak blocklist."
  echo "Rename the commit or extend the blocklist before publishing."
  echo "${SUBJECTS}" | grep -niE "${BLOCKLIST}" || true
  exit 1
fi

# --- 3. Write release note (subjects only) ---
{
  echo "# ${DATE} — shipment ${SHORT_SHA}"
  echo ""
  echo "Shipped to lingadevaru.in:"
  echo ""
  echo "${SUBJECTS}" | sed 's/^/- /'
  echo ""
  echo "- **Deployed:** lingadevaru.in"
} > "${RELEASE_FILE}"

# --- 4. Append changelog entry ---
{
  echo ""
  echo "## ${DATE} — shipment ${SHORT_SHA}"
  echo ""
  echo "${SUBJECTS}" | sed 's/^/- /'
  echo ""
  echo "- Release: [${DATE}-${SHORT_SHA}](./releases/${DATE}-${SHORT_SHA}.md)"
} >> "${PUBLIC_DIR}/CHANGELOG.md"

echo "mirror-platform: wrote ${RELEASE_FILE}"
