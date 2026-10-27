// Gera out/vice_city.srt e out/roteiro_tempos.txt com os mesmos tempos das legendas queimadas.
const fs = require('fs');
const path = require('path');
const TL = require('./timeline.js');

const ts = (t) => {
  const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

let n = 0, srt = '', guide = '';
for (const c of TL.chapters) {
  guide += `\nCAP ${c.n} · ${c.title} (${mmss(c.start)}–${mmss(c.end)})\n`;
  c.segs.forEach((s, i) => {
    srt += `${++n}\n${ts(c.segT[i].start)} --> ${ts(c.segT[i].end)}\n${s}\n\n`;
    guide += `  ${mmss(c.segT[i].start).padStart(5)}  ${s}\n`;
  });
}
fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'out', 'vice_city.srt'), srt);
fs.writeFileSync(path.join(__dirname, 'out', 'roteiro_tempos.txt'), guide.trimStart());
console.log(n, 'legendas');
