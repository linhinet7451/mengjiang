#!/bin/sh
# usage: cpicon.sh name hash [name hash ...]  -> src/assets/iraw/<name>.jpg
A=/cursor/stores/store-ebdc4e41-38a0-49cf-96cd-b7914c20f4c4/grok-bot/agents/0e19efaa-c359-45f0-a49d-46d345373757/assets
cd /workspace/mengjiang/src/assets/iraw
while [ $# -gt 1 ]; do cp "$A/$2.jpg" "$1.jpg" && echo "$1 $2" >> ../provenance-hashes.txt; shift 2; done
