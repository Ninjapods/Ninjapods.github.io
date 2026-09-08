#!/bin/sh
# Rebuild the photographs, then commit and push. GitHub Pages picks it up
# within about a minute.
#
#   ./publish.sh                  -> commits with a default message
#   ./publish.sh "your message"   -> commits with your message
set -e
cd "$(dirname "$0")"
./build-photos.sh
cd ..
git add -A
if git diff --cached --quiet; then
  echo "Nothing changed - nothing to publish."
  exit 0
fi
git commit -m "${1:-Update the gallery}"
git push
echo ""
echo "Pushed. Live in about a minute at:"
echo "  https://creationsleyva.com/emotionphotography"
