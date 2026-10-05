#!/usr/bin/env bash
# Hoja de contactos de snapshots: contact.sh <prefijo> <columnas> <salida.png>
set -e
dir="$(cd "$(dirname "$0")/../../renders/_snapshots" && pwd)"
prefix="$1"; cols="${2:-6}"; out="${3:-$dir/../_contact-$prefix.png}"
files=$(ls "$dir"/"$prefix"@*.png | sort -t@ -k2 -n)
n=$(echo "$files" | wc -l); rows=$(( (n + cols - 1) / cols ))
args=(); for f in $files; do args+=(-i "$f"); done
ffmpeg -hide_banner -loglevel error -y "${args[@]}" -filter_complex "$(for i in $(seq 0 $((n-1))); do printf '[%d:v]scale=360:-1,drawtext=text=%s:x=10:y=10:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.6[v%d];' $i "$(basename $(echo "$files" | sed -n "$((i+1))p") .png | cut -d@ -f2)" $i; done)$(for i in $(seq 0 $((n-1))); do printf '[v%d]' $i; done)xstack=inputs=$n:layout=$(for i in $(seq 0 $((n-1))); do c=$((i % cols)); r=$((i / cols)); printf '%s_%s|' "$([ $c -eq 0 ] && echo 0 || echo $(for j in $(seq 1 $c); do printf 'w0+'; done | sed 's/+$//'))" "$([ $r -eq 0 ] && echo 0 || echo $(for j in $(seq 1 $r); do printf 'h0+'; done | sed 's/+$//'))"; done | sed 's/|$//'):fill=gray" "$out"
echo "$out"
