#!/bin/sh
# Rebuild the web-sized photographs and the gallery data.
# Pass --add-new to also add any unlisted photo in gallery-photos/ to gallery.tsv.
cd "$(dirname "$0")" || exit 1
exec python3 build.py "$@"
