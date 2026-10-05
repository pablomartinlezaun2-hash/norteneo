#!/usr/bin/env node
/*
  Render determinista de una composición HTML+GSAP a vídeo.

  node scripts/render.mjs <composicion> [opciones]
    --fps=30            fotogramas por segundo de salida
    --sub=4             subfotogramas por fotograma para motion blur (obturador 180°)
    --snap=0.5,2,4.25   solo capturas PNG en esos segundos (bucle de verificación)
    --guides            dibuja la zona segura de Instagram en las capturas
    --still=<t>         exporta un PNG final (portada / slide) en el segundo t

  Salidas en ../renders/:
    <composicion>.mp4   H.264 High + AAC 48 kHz, faststart (listo para Instagram)
    alfa (si la composición declara alpha:true):
    <composicion>.mov   QuickTime PNG con canal alfa (Premiere, After Effects, DaVinci)
    <composicion>.webm  VP9 con alfa (CapCut, web)
*/
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../.."); // content/raquel-caturla
const RENDERS = path.join(ROOT, "renders");
const TMP = path.join(__dirname, "../.tmp");

const args = process.argv.slice(2);
const comp = args.find((a) => !a.startsWith("--"));
const opt = Object.fromEntries(
  args.filter((a) => a.startsWith("--")).map((a) => {
    const [k, v] = a.slice(2).split("=");
    return [k, v ?? true];
  })
);
if (!comp) {
  console.error("Uso: node scripts/render.mjs <composicion> [--snap=1,2] [--still=t] [--fps=30] [--sub=4]");
  process.exit(1);
}
const fps = +(opt.fps ?? 30);
const compFile = path.join(ROOT, "motion/compositions", comp + ".html");
if (!fs.existsSync(compFile)) throw new Error("No existe " + compFile);
fs.mkdirSync(RENDERS, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const browser = await chromium.launch({ args: ["--font-render-hinting=none", "--disable-lcd-text"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on("console", (m) => m.type() === "error" && console.error("[page]", m.text()));
let pageError = null;
page.on("pageerror", (e) => {
  console.error("[pageerror]", e.message);
  pageError = e;
});
const qs = opt.guides ? "?guides=1" : "";
await page.goto(`http://127.0.0.1:${port}/motion/compositions/${comp}.html${qs}`);
await Promise.race([
  page.waitForFunction(() => window.__isReady === true, null, { timeout: 60000 }),
  new Promise((_, rej) => {
    const iv = setInterval(() => pageError && (clearInterval(iv), rej(pageError)), 100);
  }),
]);
const meta = await page.evaluate(() => window.__meta());
await page.setViewportSize({ width: meta.width, height: meta.height });
console.log(`${comp}: ${meta.duration.toFixed(2)} s${meta.vo ? " · voz: " + meta.vo.segments.map((p) => p.at.toFixed(2)).join(" ") : ""}`);

const client = await page.context().newCDPSession(page);
if (meta.alpha) await client.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
const shot = async (format = "png") => {
  const p = { format, optimizeForSpeed: format === "png", captureBeyondViewport: false };
  if (format === "jpeg") p.quality = 95;
  const { data } = await client.send("Page.captureScreenshot", p);
  return Buffer.from(data, "base64");
};
const seek = (t) => page.evaluate((t) => window.__seek(t), t);

async function finish(code = 0) {
  await browser.close();
  server.close();
  process.exit(code);
}

// --- Capturas sueltas (verificación / portadas) ---
if (opt.snap || opt.still !== undefined) {
  const dir = opt.still !== undefined ? RENDERS : path.join(RENDERS, "_snapshots");
  fs.mkdirSync(dir, { recursive: true });
  const times = String(opt.still !== undefined ? opt.still : opt.snap).split(",");
  for (const [i, ts] of times.entries()) {
    await seek(+ts);
    const base = opt.name || comp;
    // portadas y slides: JPEG 95 (el grano dispara el peso del PNG); snapshots y alfa: PNG
    const ext = opt.still !== undefined && !meta.alpha ? "jpg" : "png";
    const name = opt.still !== undefined ? (times.length > 1 ? `${base}-${String(i + 1).padStart(2, "0")}.${ext}` : `${base}.${ext}`) : `${comp}@${(+ts).toFixed(2)}s.png`;
    fs.writeFileSync(path.join(dir, name), await shot(ext === "jpg" ? "jpeg" : "png"));
    console.log("→", path.relative(ROOT, path.join(dir, name)));
  }
  await finish();
}

// --- Audio: cues → sintetizador ---
const metaPath = path.join(TMP, comp + ".meta.json");
const wavPath = path.join(TMP, comp + ".wav");
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
let hasAudio = false;
if (!meta.alpha || meta.cues.length) {
  await new Promise((resolve, reject) => {
    const py = spawn("python3", [path.join(ROOT, "motion/audio/synth.py"), metaPath, wavPath], { stdio: "inherit" });
    py.on("exit", (c) => (c === 0 ? resolve() : reject(new Error("synth.py salió con " + c))));
  });
  hasAudio = !meta.alpha;
  // overlays: los SFX van en un WAV aparte para colocarlos en la línea de tiempo del editor
  if (meta.alpha) fs.copyFileSync(wavPath, path.join(RENDERS, comp + "-sfx.wav"));
}

// --- Vídeo: subfotogramas → ffmpeg (tmix = motion blur real), en paralelo por tramos ---
const sub = +(opt.sub ?? (meta.alpha ? 2 : 4));
const shutter = 0.5;
const total = Math.round(meta.duration * fps);
const workers = Math.max(1, Math.min(+(opt.workers ?? 3), total));
const vf = [];
if (sub > 1) {
  const w = Array(sub).fill(1).join(" ");
  vf.push(`tmix=frames=${sub}:weights='${w}'`, `select='eq(mod(n\\,${sub})\\,${sub - 1})'`);
}
vf.push(`setpts=N/(${fps}*TB)`);
const outBase = path.join(RENDERS, comp);
const segExt = meta.alpha ? "mov" : "mp4";

async function renderChunk(k, from, to, pg, cdp) {
  const seg = path.join(TMP, `${comp}.seg${k}.${segExt}`);
  const a = ["-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", "png", "-framerate", String(fps * sub), "-i", "-", "-vf"];
  if (meta.alpha) a.push(vf.join(","), "-r", String(fps), "-c:v", "png", "-pix_fmt", "rgba", seg);
  else a.push([...vf, "format=yuv420p"].join(","), "-r", String(fps), "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-profile:v", "high", "-level", "4.2", "-x264-params", "keyint=60", seg);
  const ff = spawn("ffmpeg", a, { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((res, rej) => ff.on("exit", (c) => (c === 0 ? res(seg) : rej(new Error("ffmpeg " + c)))));
  for (let i = from; i < to; i++) {
    for (let j = 0; j < sub; j++) {
      await pg.evaluate((t) => window.__seek(t), i / fps + (j * shutter) / (fps * sub));
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true, captureBeyondViewport: false });
      if (!ff.stdin.write(Buffer.from(data, "base64"))) await new Promise((r) => ff.stdin.once("drain", r));
    }
    progress[k] = i - from + 1;
  }
  ff.stdin.end();
  return done;
}

const progress = Array(workers).fill(0);
const t0 = Date.now();
const ticker = setInterval(() => {
  const n = progress.reduce((x, y) => x + y, 0);
  process.stdout.write(`\r${comp}: ${n}/${total} fotogramas · ${((Date.now() - t0) / 1000).toFixed(0)} s   `);
}, 2000);
const pages = [{ pg: page, cdp: client }];
for (let k = 1; k < workers; k++) {
  const pg = await browser.newPage({ viewport: { width: meta.width, height: meta.height }, deviceScaleFactor: 1 });
  await pg.goto(page.url());
  await pg.waitForFunction(() => window.__isReady === true, null, { timeout: 60000 });
  const cdp = await pg.context().newCDPSession(pg);
  if (meta.alpha) await cdp.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
  pages.push({ pg, cdp });
}
const per = Math.ceil(total / workers);
const segs = await Promise.all(pages.map(({ pg, cdp }, k) => renderChunk(k, k * per, Math.min(total, (k + 1) * per), pg, cdp)));
clearInterval(ticker);
process.stdout.write(`\r${comp}: ${total}/${total} fotogramas · ${((Date.now() - t0) / 1000).toFixed(0)} s   \n`);

const list = path.join(TMP, comp + ".concat.txt");
fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join("\n"));
await new Promise((resolve, reject) => {
  const a = ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list];
  if (meta.alpha) a.push("-c", "copy", outBase + ".mov");
  else
    a.push("-i", wavPath, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
      "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
      "-movflags", "+faststart", "-shortest", outBase + ".mp4");
  const p = spawn("ffmpeg", a, { stdio: "inherit" });
  p.on("exit", (c) => (c === 0 ? resolve() : reject(new Error("concat " + c))));
});
segs.forEach((s) => fs.rmSync(s, { force: true }));

if (meta.alpha) {
  await new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", ["-y", "-loglevel", "error", "-i", outBase + ".mov", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "30", "-row-mt", "1", outBase + ".webm"], { stdio: "inherit" });
    p.on("exit", (c) => (c === 0 ? resolve() : reject(new Error("vp9 " + c))));
  });
  console.log("→", path.relative(ROOT, outBase + ".mov"), "+ .webm");
} else {
  console.log("→", path.relative(ROOT, outBase + ".mp4"));
}
await finish();
