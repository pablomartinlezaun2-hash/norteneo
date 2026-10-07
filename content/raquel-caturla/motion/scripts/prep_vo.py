#!/usr/bin/env python3
"""
Prepara una locución (MP3 de ElevenLabs) para sincronizarla con su composición.

  python3 scripts/prep_vo.py <composicion> <n_frases>

Detecta las pausas (silencedetect), fusiona las pausas más cortas hasta tener
exactamente <n_frases> segmentos (una pausa tras una coma puede partir una frase)
y escribe vo/<composicion>.json con el inicio y fin de cada frase en el MP3.
La composición ancla cada frase a su animación con S.voSync().
"""
import json
import re
import subprocess
import sys
from pathlib import Path

comp, n = sys.argv[1], int(sys.argv[2])
vo_dir = Path(__file__).resolve().parent.parent / "vo"
mp3 = vo_dir / f"{comp}.mp3"

dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)]))
log = subprocess.run(
    ["ffmpeg", "-hide_banner", "-i", str(mp3), "-af", "silencedetect=noise=-40dB:d=0.3", "-f", "null", "-"],
    capture_output=True, text=True,
).stderr
starts = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
ends = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]

# segmentos hablados entre silencios
segs, cur = [], 0.0
for s, e in zip(starts, ends):
    if s > cur + 0.05:
        segs.append([cur, s])
    cur = e
if dur > cur + 0.05:
    segs.append([cur, dur])

while len(segs) > n:  # fusiona por la pausa más corta
    gaps = [segs[i + 1][0] - segs[i][1] for i in range(len(segs) - 1)]
    i = gaps.index(min(gaps))
    segs[i] = [segs[i][0], segs[i + 1][1]]
    del segs[i + 1]
if len(segs) != n:
    sys.exit(f"{comp}: {len(segs)} segmentos detectados, se esperaban {n}")

pad_in, pad_out = 0.03, 0.08  # respiración y cola natural
out = {
    "file": f"motion/vo/{comp}.mp3",
    "duration": round(dur, 3),
    "segments": [{"start": round(max(0, a - pad_in), 3), "end": round(min(dur, b + pad_out), 3)} for a, b in segs],
}
(vo_dir / f"{comp}.json").write_text(json.dumps(out, indent=2))
print(comp, [round(s["end"] - s["start"], 2) for s in out["segments"]])
