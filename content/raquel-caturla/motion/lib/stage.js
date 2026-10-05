/*
  Runtime común de composiciones.
  - Un único timeline GSAP en pausa: el renderer llama a window.__seek(t) por
    fotograma, así que el resultado es determinista (sin relojes ni CSS animations).
  - Los SFX se registran como «cues» con su tiempo exacto; el renderer los pasa
    al sintetizador de audio para que cada sonido caiga en su cambio visual.
*/
(function () {
  const S = (window.S = {});
  S.cues = [];
  S.ambients = [];
  S.bpm = 120;
  S.beat = 0.5; // disponible antes de init para calcular secciones musicales
  S.params = new URLSearchParams(location.search);

  S.css = (name) => getComputedStyle(document.documentElement).getPropertyValue("--" + name).trim();
  S.$ = (sel, root = document) => root.querySelector(sel);
  S.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // preroll: segundos de timeline que ocurren «antes» del fotograma 0, para que
  // el primer fotograma ya muestre movimiento (checklist de hook, C.1).
  S.init = function ({ duration, bpm = 120, music = null, width = 1080, height = 1920, alpha = false, preroll = 0 }) {
    S.preroll = preroll;
    S.duration = duration;
    S.bpm = bpm;
    S.beat = 60 / bpm;
    S.music = music;
    S.width = width;
    S.height = height;
    S.alpha = alpha;
    gsap.ticker.lagSmoothing(0);
    S.tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out", duration: 0.67 } });
    if (S.params.get("guides") === "1") document.body.classList.add("guides");
    return S.tl;
  };

  // b(n): tiempo del beat n (cortes y entradas en tiempo con la música)
  S.b = (n) => +(n * S.beat).toFixed(4);

  S.cue = function (type, t, opts = {}) {
    S.cues.push(Object.assign({ type, t: +(+t).toFixed(4) }, opts));
  };

  S.ambient = (fn) => S.ambients.push(fn);

  // Desplaza todo lo que ocurre desde «from» (tweens, cues y secciones musicales):
  // para dar más tiempo de lectura a un bloque sin reescribir todos los tiempos.
  S.shift = function (from, amount) {
    S.tl.shiftChildren(amount, false, from);
    for (const c of S.cues) if (c.t >= from) c.t = +(c.t + amount).toFixed(4);
    if (S.music && S.music.sections) for (const sec of S.music.sections) if (sec.at >= from) sec.at = +(sec.at + amount).toFixed(4);
    S.duration += amount;
  };

  window.__seek = function (t) {
    const tt = t + S.preroll;
    S.tl.time(Math.min(tt, S.tl.duration() || tt), false);
    for (const fn of S.ambients) fn(tt);
  };

  // Tiempos de salida = tiempo de timeline - preroll
  window.__meta = () => ({
    duration: S.duration,
    bpm: S.bpm,
    cues: S.cues
      .map((c) => Object.assign({}, c, { t: +(c.t - S.preroll).toFixed(4) }))
      .filter((c) => c.t > -0.3)
      .map((c) => Object.assign(c, { t: Math.max(0, c.t) }))
      .sort((a, b) => a.t - b.t),
    music: S.music && Object.assign({}, S.music, { sections: (S.music.sections || []).map((s) => ({ part: s.part, at: +(s.at - S.preroll).toFixed(4) })) }),
    vo: S.vo && S.voPlacements.length ? { file: S.vo.file, segments: S.voPlacements.map((p) => Object.assign({}, p, { at: +(p.at - S.preroll).toFixed(4) })) } : null,
    width: S.width,
    height: S.height,
    alpha: S.alpha,
  });

  S.ready = async function (build, fonts = []) {
    const specs = fonts.length
      ? fonts
      : [
          '860 100px "Archivo Variable"',
          '700 100px "Archivo Variable"',
          'italic 560 100px "Fraunces Variable"',
          '600 40px "Inter Variable"',
          '700 40px "Inter Variable"',
        ];
    await Promise.all(specs.map((s) => document.fonts.load(s, "ÁÉÍÓÚÑáéíóúñ¿?¡!AaBb0123456789")));
    await document.fonts.ready;
    // locución (si existe): vo/<composicion>.json con los tiempos de cada frase
    const name = location.pathname.split("/").pop().replace(/\.html$/, "");
    try {
      const r = await fetch(`../vo/${name}.json`);
      if (r.ok) S.vo = await r.json();
    } catch (e) {}
    build();
    window.__seek(0);
    window.__isReady = true;
  };

  // Divide el texto de un elemento en palabras (.w) y letras (.ch), preservando
  // nodos hijos (spans con estilo). Devuelve { words, chars }.
  S.split = function (el, { mask = false } = {}) {
    const words = [];
    const chars = [];
    const walk = (node) => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          const parts = child.textContent.split(/(\s+)/);
          for (const part of parts) {
            if (!part) continue;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
              continue;
            }
            const w = document.createElement("span");
            w.className = "w";
            for (const c of Array.from(part)) {
              const ch = document.createElement("span");
              ch.className = "ch";
              ch.textContent = c;
              if (mask) {
                const m = document.createElement("span");
                m.className = "mask";
                m.appendChild(ch);
                w.appendChild(m);
              } else {
                w.appendChild(ch);
              }
              chars.push(ch);
            }
            words.push(w);
            frag.appendChild(w);
          }
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      }
    };
    walk(el);
    return { words, chars };
  };

  // Sincroniza la locución: cada frase i se ancla al tiempo de su animación.
  // Si una frase no ha terminado cuando toca la siguiente, se desplaza el resto
  // del montaje (S.shift) desde «from»: la imagen espera a la voz, nunca al revés.
  // anchors: [{ t, from?, gap? }] en tiempo de timeline, uno por frase.
  S.voPlacements = [];
  S.voSync = function (anchors) {
    if (!S.vo) return;
    const segs = S.vo.segments;
    let shifted = 0;
    let prevEnd = -1;
    anchors.forEach((a, i) => {
      const seg = segs[i];
      if (!seg) return;
      let at = a.t + shifted;
      const need = prevEnd + (a.gap ?? 0.15);
      if (i > 0 && at < need) {
        const amount = +(need - at).toFixed(3);
        S.shift((a.from ?? a.t - 0.4) + shifted, amount);
        shifted += amount;
        at += amount;
      }
      S.voPlacements.push({ start: seg.start, end: seg.end, at: +at.toFixed(4) });
      prevEnd = at + (seg.end - seg.start);
    });
    // cola: deja respirar el CTA al menos 0,9 s tras la última frase
    const minDur = prevEnd - S.preroll + 0.9;
    if (minDur > S.duration) S.duration = +minDur.toFixed(2);
    S.tl.set({}, {}, S.duration + S.preroll + 0.2);
  };

  // Ajusta el tamaño de fuente hasta que el elemento quepa en maxWidth.
  S.fit = function (el, maxWidth) {
    let size = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > maxWidth && size > 20) {
      size -= 2;
      el.style.fontSize = size + "px";
    }
    return size;
  };

  // Grano de película: ruido con semilla fija, desplazado a 12 fps.
  S.grain = function (el, { fps = 12 } = {}) {
    let seed = 1337;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(rnd() * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    el.style.backgroundImage = `url(${c.toDataURL()})`;
    S.ambient((t) => {
      const k = Math.floor(t * fps);
      el.style.backgroundPosition = `${(k * 73) % 256}px ${(k * 131) % 256}px`;
    });
  };

  // Deriva ambiental: nada queda totalmente estático (balanceo de cámara lento).
  S.drift = function (el, { amp = 6, rot = 0.25, period = 7 } = {}) {
    S.ambient((t) => {
      const p = (t / period) * Math.PI * 2;
      el.style.transform = `translate(${Math.sin(p) * amp}px, ${Math.cos(p * 0.8) * amp * 0.6}px) rotate(${Math.sin(p * 0.6) * rot}deg)`;
    });
  };

  // Golpe de cámara en un corte (scale-punch), con su whoosh.
  S.punch = function (tl, at, { scale = 1.06, sfx = "whoosh" } = {}) {
    tl.fromTo("#punch", { scale }, { scale: 1, duration: 0.6, ease: "expo.out", immediateRender: false }, at);
    if (sfx) S.cue(sfx, at - 0.12);
  };

  // Entrada letra a letra tipo «barrel roll» (~32 ms entre letras).
  // La opacidad aparece en 2 fotogramas (pop-on), el movimiento lleva el easing.
  S.letters = function (tl, chars, at, { stagger = 0.032, dur = 0.55, from = "bottom" } = {}) {
    const y = from === "bottom" ? 105 : -105;
    tl.fromTo(chars, { yPercent: y, rotationX: from === "bottom" ? -80 : 80 }, { yPercent: 0, rotationX: 0, duration: dur, ease: "expo.out", stagger }, at);
    tl.fromTo(chars, { opacity: 0 }, { opacity: 1, duration: 0.067, ease: "none", stagger }, at);
    return at + stagger * (chars.length - 1) + dur;
  };

  // Entrada «pop»: transformación con easing + opacidad en 2 fotogramas.
  S.pop = function (tl, targets, at, from = { y: 60, scale: 0.9 }, { dur = 0.6, ease = "back.out(1.7)", stagger = 0, origin = "50% 50%" } = {}) {
    const to = {};
    for (const k of Object.keys(from)) to[k] = k === "scale" || k === "scaleX" || k === "scaleY" ? 1 : 0;
    if ("rotation" in from && from.rotationTo !== undefined) to.rotation = from.rotationTo;
    const f = Object.assign({}, from);
    delete f.rotationTo;
    delete to.rotationTo;
    tl.fromTo(targets, Object.assign({ transformOrigin: origin }, f), Object.assign({ duration: dur, ease, stagger }, to), at);
    tl.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.067, ease: "none", stagger }, at);
  };

  // Salida rápida (60–70 % de la duración de entrada).
  S.out = function (tl, targets, at, { dur = 0.36, y = -40 } = {}) {
    tl.to(targets, { y, opacity: 0, duration: dur, ease: "power3.in" }, at);
  };

  // Contador numérico animado con «ticks» de sonido opcionales.
  S.counter = function (tl, el, at, { from = 0, to = 100, dur = 1.2, prefix = "", suffix = "", decimals = 0, ticks = 0, ease = "power2.out" } = {}) {
    const o = { v: from };
    el.textContent = prefix + from.toFixed(decimals) + suffix;
    tl.to(o, { v: to, duration: dur, ease, onUpdate: () => (el.textContent = prefix + o.v.toFixed(decimals) + suffix) }, at);
    for (let i = 0; i < ticks; i++) S.cue("tick", at + (dur * 0.8 * i) / ticks, { gain: 0.5 });
  };
})();
