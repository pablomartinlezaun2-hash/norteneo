#!/usr/bin/env python3
"""
Diseño sonoro procedural para los Reels (sin samples ni licencias de terceros).

  python3 synth.py meta.json salida.wav

meta.json lo genera el renderer a partir de la composición:
  duration, bpm, cues[{type, t, gain?, pitch?, pan?}], music{key, sections[{at, part}]}

Base musical a 120 BPM (re mayor, D-A-Bm-G) con partes:
  intro  -> bombo + bajo + pad (hay sonido desde el fotograma 0)
  groove -> + palmas, hats, acordes en contratiempo
  build  -> redoble que acelera + riser (anticipación)
  gap    -> silencio breve antes del pico
  drop   -> todo + impacto (el pico emocional coincide con la revelación visual)
  outro  -> pad + acorde final
  end    -> silencio (dejar sonar colas)

SFX sincronizados con cada cambio visual: whoosh, pop, slam, tick, ding, bounce,
swish, click, riser, impact.
"""
import json
import math
import sys
import wave

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
rng = np.random.default_rng(7)


# ---------------------------------------------------------------- utilidades
def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def env_exp(dur, decay, attack=0.002):
    t = t_axis(dur)
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay)


def filt(x, kind, f, order=2):
    if isinstance(f, (list, tuple)):
        wn = [min(max(v / (SR / 2), 1e-4), 0.999) for v in f]
    else:
        wn = min(max(f / (SR / 2), 1e-4), 0.999)
    return sosfilt(butter(order, wn, btype=kind, output="sos"), x)


def svf_sweep(x, f_start, f_end, q=1.2, curve="exp"):
    """Filtro de estado variable con frecuencia de corte variable (paso banda)."""
    n = len(x)
    if curve == "exp":
        fc = f_start * (f_end / f_start) ** (np.arange(n) / max(n - 1, 1))
    else:
        fc = np.linspace(f_start, f_end, n)
    out = np.zeros(n)
    low = band = 0.0
    damp = 1.0 / q
    fs = 2 * np.sin(np.pi * np.minimum(fc, SR / 6) / SR)
    for i in range(n):
        f = fs[i]
        high = x[i] - low - damp * band
        band += f * high
        low += f * band
        out[i] = band
    return out


def sine_sweep(dur, f0, f1, curve=8.0):
    t = t_axis(dur)
    f = f1 + (f0 - f1) * np.exp(-t * curve)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def saw(freq, dur, detune_cents=0.0, phase=0.0):
    t = t_axis(dur)
    f = freq * 2 ** (detune_cents / 1200)
    p = (t * f + phase) % 1.0
    return 2 * p - 1


def note_hz(name):
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    pitch, octave = name[:-1], int(name[-1])
    midi = 12 * (octave + 1) + names[pitch]
    return 440.0 * 2 ** ((midi - 69) / 12)


def reverb_ir(seconds=1.1, damp=3500):
    n = int(seconds * SR)
    noise = rng.standard_normal((n, 2))
    decay = np.exp(-np.arange(n) / (SR * seconds / 6.5))[:, None]
    ir = noise * decay
    ir = np.stack([filt(ir[:, c], "low", damp) for c in range(2)], axis=1)
    return ir / np.max(np.abs(ir)) * 0.12


IR = reverb_ir()


def add(buf, sig, t, gain=1.0, pan=0.0):
    """Suma una señal mono/estéreo a buf (estéreo) en el segundo t con paneo constante."""
    start = int(round(t * SR))
    if start >= len(buf):
        return
    if sig.ndim == 1:
        l = math.cos((pan + 1) * math.pi / 4)
        r = math.sin((pan + 1) * math.pi / 4)
        sig = np.stack([sig * l * 1.4142, sig * r * 1.4142], axis=1)
    if start < 0:
        sig = sig[-start:]
        start = 0
    end = min(len(buf), start + len(sig))
    buf[start:end] += sig[: end - start] * gain


# ---------------------------------------------------------------- batería
def kick():
    d = 0.45
    body = sine_sweep(d, 150, 46, curve=30) * env_exp(d, 0.16, 0.001)
    click = filt(rng.standard_normal(int(0.004 * SR)), "high", 2000) * 0.25
    body[: len(click)] += click
    return np.tanh(body * 1.6) * 0.9


def clap():
    d = 0.35
    n = rng.standard_normal(int(d * SR))
    n = filt(n, "band", [900, 3200])
    e = np.zeros_like(n)
    for k, off in enumerate([0, 0.011, 0.022]):
        s = int(off * SR)
        seg = env_exp(d - off, 0.012 if k < 2 else 0.11, 0.0005)
        e[s : s + len(seg)] = np.maximum(e[s : s + len(seg)], seg)
    return n * e * 0.7


def hat(open_=False):
    d = 0.2 if open_ else 0.05
    n = filt(rng.standard_normal(int(d * SR)), "high", 7500)
    return n * env_exp(d, 0.06 if open_ else 0.012, 0.0005) * 0.35


def snare():
    d = 0.25
    n = filt(rng.standard_normal(int(d * SR)), "band", [1200, 6000]) * env_exp(d, 0.06)
    tone = sine_sweep(d, 260, 180, curve=20) * env_exp(d, 0.04)
    return (n * 0.6 + tone * 0.35) * 0.8


# ---------------------------------------------------------------- melódico
PROG = [["D3", "F#3", "A3"], ["A2", "C#3", "E3"], ["B2", "D3", "F#3"], ["G2", "B2", "D3"]]
ROOTS = ["D2", "A1", "B1", "G1"]


def bass_note(name, dur, cutoff=700):
    f = note_hz(name)
    x = saw(f, dur) * 0.6 + np.sign(np.sin(2 * np.pi * f * t_axis(dur))) * 0.25
    x = filt(x, "low", cutoff, order=2)
    a = np.clip(t_axis(dur) / 0.004, 0, 1)
    r = np.clip((dur - t_axis(dur)) / 0.03, 0, 1)
    return x * a * r * 0.55


def chord(notes, dur, cutoff=3200, attack=0.006, release=0.08, stab=True):
    out = np.zeros((int(dur * SR), 2))
    for nn in notes:
        f = note_hz(nn) * 2  # una octava arriba: brillante pero no chillón
        for det, pan in [(-9, -0.6), (0, 0.0), (9, 0.6)]:
            v = saw(f, dur, det, phase=rng.random())
            v = filt(v, "low", cutoff)
            l = math.cos((pan + 1) * math.pi / 4)
            r = math.sin((pan + 1) * math.pi / 4)
            out[:, 0] += v * l
            out[:, 1] += v * r
    t = t_axis(dur)
    a = np.clip(t / attack, 0, 1)
    if stab:
        e = a * np.exp(-t / 0.18)
    else:
        e = a * np.clip((dur - t) / release, 0, 1)
    out = np.stack([filt(out[:, c], "high", 220) for c in range(2)], axis=1)  # sin barro en graves
    return out * e[:, None] * 0.09


# ---------------------------------------------------------------- SFX
def sfx_whoosh(pitch=1.0, dur=0.42):
    n = rng.standard_normal(int(dur * SR))
    up = svf_sweep(n[: len(n) // 2], 350 * pitch, 3200 * pitch, q=1.8)
    down = svf_sweep(n[len(n) // 2 :], 3200 * pitch, 900 * pitch, q=1.8)
    x = np.concatenate([up, down])
    t = t_axis(dur)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2.2
    x = x * e
    # paneo L -> R
    pan = np.linspace(-0.5, 0.5, len(x))
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l, x * r], axis=1) * 0.55


def sfx_swish(pitch=1.0):
    d = 0.22
    n = rng.standard_normal(int(d * SR))
    x = svf_sweep(n, 1800 * pitch, 7000 * pitch, q=1.4)
    t = t_axis(d)
    return x * (np.sin(np.pi * t / d) ** 2) * 0.35


def sfx_pop(pitch=1.0):
    d = 0.09
    x = sine_sweep(d, 1100 * pitch, 420 * pitch, curve=60) * env_exp(d, 0.03, 0.0008)
    x += sine_sweep(d, 2200 * pitch, 840 * pitch, curve=60) * env_exp(d, 0.012, 0.0008) * 0.25
    return x * 0.6


def sfx_slam(pitch=1.0):
    d = 0.6
    boom = sine_sweep(d, 95 * pitch, 42 * pitch, curve=18) * env_exp(d, 0.22, 0.001)
    crack = filt(rng.standard_normal(int(d * SR)), "band", [900, 4500]) * env_exp(d, 0.035, 0.0005)
    x = np.tanh((boom * 1.2 + crack * 0.7) * 1.8)
    return x * 0.6


def sfx_impact():
    d = 1.6
    sub = sine_sweep(d, 70, 38, curve=4) * env_exp(d, 0.55, 0.002)
    n = filt(rng.standard_normal(int(d * SR)), "low", 5000) * env_exp(d, 0.18, 0.001)
    return np.tanh((sub * 1.3 + n * 0.5) * 1.5) * 0.9


def crash():
    d = 2.2
    n = filt(rng.standard_normal(int(d * SR)), "high", 5500)
    return n * env_exp(d, 0.55, 0.001) * 0.22


def sfx_tick(pitch=1.0):
    d = 0.03
    return np.sin(2 * np.pi * 2300 * pitch * t_axis(d)) * env_exp(d, 0.006, 0.0003) * 0.35


def sfx_click(pitch=1.0):
    d = 0.02
    return filt(rng.standard_normal(int(d * SR)), "band", [1500 * pitch, 6000]) * env_exp(d, 0.003, 0.0002) * 0.5


def sfx_ding(pitch=1.0):
    d = 1.4
    f = note_hz("D6") * pitch
    t = t_axis(d)
    x = np.zeros_like(t)
    for ratio, amp, dec in [(1, 1.0, 0.5), (2.0, 0.35, 0.3), (2.76, 0.25, 0.18), (5.4, 0.1, 0.08)]:
        x += np.sin(2 * np.pi * f * ratio * t) * amp * np.exp(-t / dec)
    return x * np.clip(t / 0.002, 0, 1) * 0.22


def sfx_bounce(pitch=1.0):
    """Rebote: golpe blando + muelle sutil (firma sonora Kangoo)."""
    d = 0.32
    t = t_axis(d)
    thud = sine_sweep(d, 190 * pitch, 72 * pitch, curve=26) * env_exp(d, 0.07, 0.001)
    wob = 420 * pitch * (1 + 0.06 * np.sin(2 * np.pi * 26 * t) * np.exp(-t / 0.08))
    spring = np.sin(2 * np.pi * np.cumsum(wob) / SR) * env_exp(d, 0.09, 0.004) * 0.18
    return np.tanh((thud + spring) * 1.4) * 0.6


def sfx_riser(dur=2.0):
    t = t_axis(dur)
    n = rng.standard_normal(len(t))
    x = svf_sweep(n, 300, 6000, q=2.2)
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2.5 * t / dur)) / SR) * 0.2
    e = (t / dur) ** 2.4
    return (x * 0.5 + tone) * e * 0.5


def sfx_ui(pitch=1.0):
    """Notificación de interfaz: dos tonos limpios ascendentes."""
    out = np.zeros(int(0.22 * SR))
    for k, (f, st) in enumerate([(1320, 0.0), (1760, 0.075)]):
        d = 0.14
        t = t_axis(d)
        tone = (np.sin(2 * np.pi * f * pitch * t) + 0.3 * np.sin(4 * np.pi * f * pitch * t)) * env_exp(d, 0.05, 0.002)
        i = int(st * SR)
        out[i : i + len(tone)] += tone[: len(out) - i]
    return out * 0.3


def sfx_error(pitch=1.0):
    """Error: dos notas graves descendentes, timbre cuadrado filtrado."""
    out = np.zeros(int(0.42 * SR))
    for f, st in [(330, 0.0), (247, 0.16)]:
        d = 0.2
        t = t_axis(d)
        sq = np.sign(np.sin(2 * np.pi * f * pitch * t))
        sq = filt(sq, "low", 1800) * env_exp(d, 0.09, 0.003)
        i = int(st * SR)
        out[i : i + len(sq)] += sq[: len(out) - i]
    return out * 0.32


def sfx_success(pitch=1.0):
    """Acierto: arpegio brillante (do-mi-sol-do) tipo campana."""
    out = np.zeros(int(1.0 * SR))
    for k, n in enumerate(["C6", "E6", "G6", "C7"]):
        f = note_hz(n) * pitch
        d = 0.7
        t = t_axis(d)
        b = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.1)) * env_exp(d, 0.28, 0.002)
        i = int(k * 0.07 * SR)
        out[i : i + len(b)] += b[: len(out) - i]
    return out * 0.22


def sfx_shutter(pitch=1.0):
    """Obturador de cámara de fotos: dos clics mecánicos + cuerpo."""
    out = np.zeros(int(0.25 * SR))
    for st, g in [(0.0, 1.0), (0.085, 0.7)]:
        d = 0.06
        n = filt(rng.standard_normal(int(d * SR)), "band", [1500 * pitch, 9000]) * env_exp(d, 0.008, 0.0003)
        thunk = sine_sweep(d, 240, 120, curve=50) * env_exp(d, 0.015, 0.0005) * 0.6
        i = int(st * SR)
        out[i : i + len(n)] += (n + thunk) * g
    return out * 0.55


def sfx_bassdrop(pitch=1.0):
    """Bass drop: 808 que cae de 110 a 32 Hz con saturación."""
    d = 1.8
    t = t_axis(d)
    f = 32 + 78 * np.exp(-t * 2.2)
    x = np.sin(2 * np.pi * np.cumsum(f * pitch) / SR) * env_exp(d, 0.9, 0.004)
    return np.tanh(x * 2.2) * 0.75


def sfx_riser_cue(pitch=1.0, dur=1.5):
    return sfx_riser(dur) * 0.9


SFX = {
    "ui": sfx_ui,
    "error": sfx_error,
    "success": sfx_success,
    "shutter": sfx_shutter,
    "bassdrop": sfx_bassdrop,
    "riser": sfx_riser_cue,
    "whoosh": sfx_whoosh,
    "swish": sfx_swish,
    "pop": sfx_pop,
    "slam": sfx_slam,
    "impact": sfx_impact,
    "tick": sfx_tick,
    "click": sfx_click,
    "ding": sfx_ding,
    "bounce": sfx_bounce,
}


# ---------------------------------------------------------------- música
def render_music(buf, duration, bpm, sections):
    beat = 60 / bpm
    step = beat / 4
    music = np.zeros_like(buf)
    reverb_send = np.zeros_like(buf)
    kicks = []
    secs = sorted(sections, key=lambda s: s["at"]) + [{"at": duration + 10, "part": "end"}]
    K, C, H, Ho, Sn = kick(), clap(), hat(), hat(True), snare()

    for si in range(len(secs) - 1):
        part, a, b = secs[si]["part"], secs[si]["at"], secs[si + 1]["at"]
        if part in ("end", "gap"):
            continue
        n_steps = int(round((b - a) / step))
        for s in range(n_steps):
            t = a + s * step
            if t >= duration:
                break
            gbeat = int(round(t / beat))
            bar = int(t // (beat * 4))
            ch = PROG[bar % 4]
            root = ROOTS[bar % 4]
            sub = s % 4
            on_beat = sub == 0
            beat_in_bar = gbeat % 4
            if part in ("intro", "groove", "drop", "build") and on_beat:
                add(music, K, t, 1.0)
                kicks.append(t)
            if part in ("groove", "drop") and on_beat and beat_in_bar in (1, 3):
                add(music, C, t, 0.55)
                add(reverb_send, C, t, 0.5)
            if part in ("groove", "drop") and sub == 2:
                add(music, Ho if part == "drop" and beat_in_bar == 3 else H, t, 0.6, pan=0.25)
            if part == "drop" and sub in (1, 3):
                add(music, H, t, 0.3, pan=-0.25)
            # bajo: corcheas con síncopa
            if part in ("intro", "groove", "drop", "build") and sub in (0, 2, 3) and not (part == "build" and sub == 3):
                dur = step * (2 if sub == 0 else 1) * 0.92
                cut = 900 if part == "drop" else 600
                add(music, bass_note(root, dur, cut), t, 0.9)
            # acordes
            if part in ("groove",) and sub == 2:
                add(music, chord(ch, step * 1.8), t, 0.9)
                add(reverb_send, chord(ch, step * 1.8), t, 0.6)
            if part == "drop" and on_beat and beat_in_bar == 0:
                pad = chord(ch, beat * 4, cutoff=4200, attack=0.01, release=0.2, stab=False)
                add(music, pad, t, 1.2)
                add(reverb_send, pad, t, 0.5)
            if part == "drop" and sub == 2:
                add(music, chord(ch, step * 1.5, cutoff=5000), t, 0.7)
            if part in ("intro", "outro") and on_beat and beat_in_bar == 0:
                pad = chord(ch, beat * 4, cutoff=1800, attack=0.25, release=0.5, stab=False)
                add(music, pad, t, 1.0)
                add(reverb_send, pad, t, 0.8)
            # redoble que acelera
            if part == "build":
                prog = (t - a) / max(b - a, 1e-3)
                div = 2 if prog < 0.5 else 1
                if s % div == 0:
                    add(music, Sn, t, 0.25 + 0.55 * prog)
        if part == "build":
            add(music, sfx_riser(b - a), a, 0.8)
        if part == "drop":
            add(music, sfx_impact(), a, 1.15)
            add(music, crash(), a, 1.0, pan=0.15)
            add(reverb_send, crash(), a, 0.4)
        if part == "outro":
            last = chord(PROG[0], 2.5, cutoff=2600, attack=0.01, release=1.2, stab=False)
            add(music, last, b - 2.6 if b - a > 2.6 else a, 0.8)

    # compresión por bombo (pumping): bajo y acordes respiran con el kick
    duck = np.ones(len(buf))
    for k in kicks:
        if k < 0 or k >= duration:
            continue
        i = int(k * SR)
        n = int(0.22 * SR)
        seg = 1 - 0.45 * np.exp(-np.arange(n) / (0.06 * SR))
        end = min(len(duck), i + n)
        duck[i:end] = np.minimum(duck[i:end], seg[: end - i])
    music *= duck[:, None] ** 0.5
    wet = np.stack([fftconvolve(reverb_send[:, c], IR[:, c])[: len(buf)] for c in range(2)], axis=1)
    return music + wet


def render_voice(vo, n):
    """Decodifica la locución con una cadena de voz ligera y coloca cada frase."""
    from pathlib import Path
    import subprocess

    root = Path(__file__).resolve().parents[2]
    raw = subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", str(root / vo["file"]),
        "-af", "highpass=f=75,acompressor=threshold=-22dB:ratio=3:attack=6:release=90:makeup=2,equalizer=f=3500:t=q:w=1.2:g=2",
        "-ac", "1", "-ar", str(SR), "-f", "f32le", "-",
    ])
    src = np.frombuffer(raw, dtype="<f4").astype(np.float64)
    src = src / (np.max(np.abs(src)) or 1.0) * 0.9
    out = np.zeros(n)
    f = int(0.008 * SR)
    for sgm in vo["segments"]:
        a, b = int(sgm["start"] * SR), int(sgm["end"] * SR)
        piece = src[a:b].copy()
        if len(piece) > 2 * f:
            piece[:f] *= np.linspace(0, 1, f)
            piece[-f:] *= np.linspace(1, 0, f)
        st = int(sgm["at"] * SR)
        if st < 0:
            piece, st = piece[-st:], 0
        end = min(n, st + len(piece))
        out[st:end] += piece[: end - st]
    return out * 2.2  # la voz manda en la mezcla


def main():
    meta = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    duration = float(meta["duration"])
    bpm = float(meta.get("bpm", 120))
    buf = np.zeros((int((duration + 0.05) * SR), 2))

    music = meta.get("music") or {}
    music_bus = np.zeros_like(buf)
    if music.get("sections"):
        music_bus = render_music(buf, duration, bpm, music["sections"]) * float(music.get("gain", 0.55))

    sfx_bus = np.zeros_like(buf)
    send = np.zeros_like(buf)
    for c in meta.get("cues", []):
        fn = SFX.get(c["type"])
        if not fn:
            print("cue desconocido:", c["type"], file=sys.stderr)
            continue
        kw = {}
        if "pitch" in c and c["type"] not in ("impact",):
            kw["pitch"] = float(c["pitch"])
        if "dur" in c and c["type"] == "riser":
            kw["dur"] = float(c["dur"])
        sig = fn(**kw)
        add(sfx_bus, sig, c["t"], float(c.get("gain", 1.0)), float(c.get("pan", 0.0)))
        if c["type"] in ("ding", "pop", "bounce", "slam"):
            add(send, sig, c["t"], 0.35)
    wet = np.stack([fftconvolve(send[:, ch], IR[:, ch])[: len(buf)] for ch in range(2)], axis=1)
    sfx_bus = (sfx_bus + wet) * 0.75

    # locución: cada frase en su anclaje; la música y los SFX se apartan (ducking)
    vo = meta.get("vo")
    voice = np.zeros(len(buf))
    if vo and vo.get("segments"):
        voice = render_voice(vo, len(buf))
        env = np.abs(voice)
        win = int(0.03 * SR)
        env = np.convolve(env, np.ones(win) / win, mode="same")
        env = np.clip(env / (np.percentile(env[env > 1e-4], 60) if np.any(env > 1e-4) else 1), 0, 1)
        # ataque rápido, liberación lenta (~250 ms)
        rel = math.exp(-1 / (0.25 * SR))
        sm = np.zeros_like(env)
        last = 0.0
        for i in range(0, len(env), 32):
            v = env[i]
            last = v if v > last else last * rel ** 32
            sm[i : i + 32] = last
        music_bus *= (1 - 0.72 * sm)[:, None]  # ≈ −11 dB bajo la voz
        sfx_bus *= (1 - 0.55 * sm)[:, None]
    buf += music_bus + sfx_bus + np.stack([voice, voice], axis=1)

    # fades de seguridad y limitador suave
    fade = int(0.01 * SR)
    buf[:fade] *= np.linspace(0, 1, fade)[:, None]
    tail = int(0.25 * SR)
    buf[-tail:] *= np.linspace(1, 0, tail)[:, None]
    buf = np.tanh(buf * 1.1) / np.tanh(1.1)
    peak = np.max(np.abs(buf)) or 1.0
    buf = buf / peak * 0.89

    pcm = (buf * 32767).astype("<i2")
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"audio → {out} ({duration:.2f} s, {len(meta.get('cues', []))} cues)")


if __name__ == "__main__":
    main()
