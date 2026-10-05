#!/usr/bin/env python3
"""
Primer corte del vídeo a cámara (sin silencios) a partir de la transcripción.

  python3 build_base.py

- Agrupa palabras separadas por pausas cortas; las pausas largas se recortan
  dejando una respiración natural (~0,18 s) → jump cuts.
- Quita el cierre de CapCut del final.
- Exporta fotogramas JPEG 1080×1920 a 30 fps (la composición HTML los anima:
  zooms, congelado tipo foto, pantalla partida…), el audio cortado y edl.json
  con el mapa de tiempos original → editado y las palabras retemporizadas.
"""
import json
import shutil
import subprocess
from pathlib import Path

FPS = 30
HERE = Path(__file__).resolve().parent
SRC = HERE / "src" / "original.mov"
TMP = HERE / ".tmp"
FRAMES = TMP / "frames"

MAX_GAP = 0.30   # pausas mayores se recortan
PAD_IN, PAD_OUT = 0.08, 0.10

q = lambda t: round(round(t * FPS) / FPS, 4)  # cortes en frontera de fotograma

words = json.load(open(HERE / "transcript.json"))["words"]
groups, cur = [], [words[0]]
for w in words[1:]:
    if w["start"] - cur[-1]["end"] > MAX_GAP:
        groups.append(cur)
        cur = [w]
    else:
        cur.append(w)
groups.append(cur)

segs, dst = [], 0.0
prev_end = 0.0
for g in groups:
    a = q(max(prev_end, g[0]["start"] - PAD_IN))
    b = q(g[-1]["end"] + PAD_OUT)
    segs.append({"src_start": a, "src_end": b, "dst_start": round(dst, 4)})
    dst += b - a
    prev_end = b
duration = round(dst, 4)


def remap(t):
    for s in segs:
        if s["src_start"] - 1e-6 <= t <= s["src_end"] + 1e-6:
            return round(s["dst_start"] + t - s["src_start"], 4)
    raise ValueError(t)


out_words = [{"text": w["text"], "start": remap(w["start"]), "end": remap(w["end"]), "src": w["start"]} for w in words]
json.dump({"fps": FPS, "duration": duration, "segments": segs, "words": out_words}, open(HERE / "edl.json", "w"), ensure_ascii=False, indent=1)

# filtro: recorte de cada tramo + concat (vídeo y audio con micro-fundidos anti-click)
parts, labels = [], []
for i, s in enumerate(segs):
    a, b = s["src_start"], s["src_end"]
    d = b - a
    parts.append(f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[v{i}]")
    parts.append(f"[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st={max(0, d - 0.012):.4f}:d=0.012[a{i}]")
    labels.append(f"[v{i}][a{i}]")
parts.append(f"{''.join(labels)}concat=n={len(segs)}:v=1:a=1[cv][ca]")
# look: contraste y saturación suaves, nitidez ligera para el reescalado 720p → 1080p
parts.append(f"[cv]fps={FPS},scale=1080:1920:flags=lanczos,eq=contrast=1.05:saturation=1.06:gamma=0.98,unsharp=5:5:0.55[vo]")

if FRAMES.exists():
    shutil.rmtree(FRAMES)
FRAMES.mkdir(parents=True)
subprocess.run([
    "ffmpeg", "-y", "-loglevel", "error", "-i", str(SRC), "-filter_complex", ";".join(parts),
    "-map", "[vo]", "-q:v", "3", "-start_number", "0", str(FRAMES / "%05d.jpg"),
    "-map", "[ca]", "-ar", "48000", "-ac", "2", str(TMP / "base.wav"),
], check=True)
n = len(list(FRAMES.glob("*.jpg")))
print(f"{len(segs)} tramos · {duration:.2f} s (original 32,7 s de voz) · {n} fotogramas")
