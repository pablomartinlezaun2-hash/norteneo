#!/usr/bin/env bash
# Regenera solo el audio de un Reel ya renderizado (misma imagen): remix.sh <composicion>
set -e
cd "$(dirname "$0")/.."
c="$1"
python3 audio/synth.py ".tmp/$c.meta.json" ".tmp/$c.wav"
ffmpeg -y -loglevel error -i "../renders/$c.mp4" -i ".tmp/$c.wav" -map 0:v -map 1:a -c:v copy \
  -c:a aac -b:a 192k -ar 48000 -af loudnorm=I=-14:TP=-1.5:LRA=11 -movflags +faststart -shortest ".tmp/$c.remix.mp4"
mv ".tmp/$c.remix.mp4" "../renders/$c.mp4"
echo "→ renders/$c.mp4 (audio remezclado)"
