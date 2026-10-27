// Captura de quadros com Playwright + ffmpeg.
//   node capture.js stills 12.5 95 300 ...   -> PNGs em out/stills
//   node capture.js part <i> <n>             -> out/part_<i>.mp4 (fatia i de n)
//   node capture.js fx                       -> out/fx.json (eventos para o sfx.py)
//   node capture.js concat <n>               -> out/vice_city.mp4
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const TL = require('./timeline.js');

const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

async function open() {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.error('pageerror', e));
  page.on('console', (m) => m.type() === 'error' && console.error('console', m.text()));
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.evaluate(() => window.ready);
  return { browser, page };
}

async function stills(times) {
  const { browser, page } = await open();
  fs.mkdirSync(path.join(OUT, 'stills'), { recursive: true });
  for (const t of times) {
    await page.evaluate((t) => window.renderFrame(t), +t);
    await page.screenshot({ path: path.join(OUT, 'stills', `t_${String(t).padStart(6, '0')}.jpg`), type: 'jpeg', quality: 85 });
  }
  await browser.close();
}

async function part(i, n) {
  const total = Math.round(TL.duration * TL.fps), per = Math.ceil(total / n);
  const f0 = i * per, f1 = Math.min(total, f0 + per);
  const out = path.join(OUT, `part_${i}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(TL.fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(TL.fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const { browser, page } = await open();
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    await page.evaluate((t) => window.renderFrame(t), f / TL.fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - f0) % 300 === 0) console.log(`part ${i}: ${f - f0}/${f1 - f0} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log(`part ${i} done`);
}

function concat(n) {
  const list = path.join(OUT, 'list.txt');
  fs.writeFileSync(list, Array.from({ length: n }, (_, i) => `file 'part_${i}.mp4'`).join('\n'));
  // narração + efeitos (sfx.py) ou só narração; sem nenhuma, áudio mudo. A trilha entra depois.
  const mixed = path.join(__dirname, 'narration', 'mix_final.wav');
  const narr = fs.existsSync(mixed) ? mixed : path.join(__dirname, 'narration', 'narracao_completa.wav');
  const audio = fs.existsSync(narr) ? ['-i', narr] : ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono'];
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, ...audio,
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'apad', '-ac', '2', '-c:a', 'aac', '-b:a', '192k', '-shortest',
    '-movflags', '+faststart', path.join(OUT, 'vice_city.mp4')], { stdio: 'inherit' });
}

async function collectFx() {
  const { browser, page } = await open();
  const ev = await page.evaluate(() => window.collectFx(10));
  fs.writeFileSync(path.join(OUT, 'fx.json'), JSON.stringify(ev));
  await browser.close();
  console.log(ev.length, 'eventos de som');
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'fx') collectFx();
if (cmd === 'stills') stills(args);
else if (cmd === 'part') part(+args[0], +args[1]);
else if (cmd === 'concat') concat(+args[0]);
