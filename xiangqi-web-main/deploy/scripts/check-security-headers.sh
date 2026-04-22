#!/usr/bin/env bash
set -euo pipefail

URL="${1:-https://cotuong.xyz}"

# Follow redirects, print response headers only.
HEADERS="$(curl -fsSIL "$URL" | tr -d '\r')"

echo "Checked: $URL"
echo

required=(
  "strict-transport-security:"
  "content-security-policy:"
  "x-content-type-options:"
  "referrer-policy:"
  "permissions-policy:"
)

missing=0
for h in "${required[@]}"; do
  if ! echo "$HEADERS" | grep -qi "$h"; then
    echo "MISSING: $h"
    missing=1
  else
    echo "OK:      $h"
  fi
done

echo

echo "--- Raw headers (last response) ---"
# Print only the last header block (after redirects)
echo "$HEADERS" | awk 'BEGIN{block=""} /^HTTP\//{block=""} {block=block $0 "\n"} END{printf "%s", block}'

echo
if [[ "$missing" -ne 0 ]]; then
  echo "\nOne or more required headers are missing." >&2
  exit 2
fi
