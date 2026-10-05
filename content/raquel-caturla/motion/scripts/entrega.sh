#!/usr/bin/env bash
# Comprime un Reel para entrega/subida (Instagram recomprime a ~3–5 Mbps): entrega.sh <composicion>
# H.264 High, CRF 22 con techo de 6 Mbps; el audio no se toca.
set -e
cd "$(dirname "$0")/../../renders"
c="$1"
ffmpeg -y -loglevel error -i "$c.mp4" -c:v libx264 -preset slow -crf 22 -maxrate 6M -bufsize 12M \
  -profile:v high -level 4.2 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a copy -movflags +faststart "../motion/.tmp/$c.entrega.mp4"
mv "../motion/.tmp/$c.entrega.mp4" "$c.mp4"
echo "→ renders/$c.mp4 ($(du -h "$c.mp4" | cut -f1))"
