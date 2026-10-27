"""Gera a narração (TTS pt-BR) frase por frase, com o tempo de cada palavra.

Saída: narration/seg_<cap>_<i>.wav e narration/narration.js (durações e palavras, lidas pelo timeline.js).
Uso: python3 narrate.py [--voice pt-BR-ThalitaMultilingualNeural] [--rate +6%]
     python3 narrate.py --mix   (monta narration/narracao_completa.wav)
"""
import argparse, asyncio, json, os, re, subprocess, sys

import certifi
# o proxy da sessão re-termina TLS; o edge-tts usa o certifi para validar
if os.path.exists('/root/.ccr/ca-bundle.crt'):
    certifi.where = lambda: '/root/.ccr/ca-bundle.crt'
import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'narration')

SPOKEN = [  # como a frase deve ser falada (a legenda continua com a grafia original)
    (r'\bVice City\b', 'Vaice Cíti'), (r'\bVice\b', 'Vaice'),
    (r'\bGTA VI\b', 'GTA seis'), (r'\bGTA V\b', 'GTA cinco'), (r'\bXIX\b', 'dezenove'),
    (r'NINE1NINE', 'Nine One Nine'), (r'E11EVEN', 'Eleven'), (r'\b24 horas\b', 'vinte e quatro horas'),
]


def spoken(t):
    for a, b in SPOKEN:
        t = re.sub(a, b, t)
    return t


def segments():
    js = subprocess.run(['node', '-e', "const T=require('./timeline.js');console.log(JSON.stringify(T.chapters.map(c=>c.segs)))"],
                        cwd=HERE, capture_output=True, text=True, check=True).stdout
    return json.loads(js)


def rate_for(base, c, i):
    """Ritmo levemente diferente a cada frase, como uma pessoa falando (determinístico)."""
    b = int(base.rstrip('%'))
    jitter = [0, 3, -2, 4, -3, 1, -1, 2][(c * 3 + i) % 8]
    return f'{b + jitter:+d}%'


async def tts(text, voice, rate, mp3):
    words = []
    c = edge_tts.Communicate(text, voice, rate=rate, boundary='WordBoundary')
    with open(mp3, 'wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio':
                f.write(ch['data'])
            elif ch['type'] == 'WordBoundary':
                words.append((ch['offset'] / 1e7, (ch['offset'] + ch['duration']) / 1e7, ch['text']))
    return words


def align(display, spoken_text, words, t0):
    """Tempo de início de cada palavra da legenda, pela posição relativa no texto falado."""
    if not words:
        return []
    disp = display.split()
    if len(disp) == len(words):
        return [round(w[0] - t0, 3) for w in words]
    pos, k = [], 0  # posição relativa de cada palavra falada
    for w in words:
        j = spoken_text.find(w[2], k)
        j = k if j < 0 else j
        pos.append(j / max(1, len(spoken_text))); k = j + len(w[2])
    out, k = [], 0
    for wd in disp:
        j = display.find(wd, k); k = j + len(wd)
        r = j / max(1, len(display))
        n = max([i for i in range(len(pos)) if pos[i] <= r + 1e-6] or [0])
        out.append(round(words[n][0] - t0, 3))
    return out


async def main(voice, base_rate):
    os.makedirs(OUT, exist_ok=True)
    durs, wordt = [], []
    for c, segs in enumerate(segments()):
        row, wrow = [], []
        for i, s in enumerate(segs):
            mp3, wav = os.path.join(OUT, f'seg_{c:02d}_{i:02d}.mp3'), os.path.join(OUT, f'seg_{c:02d}_{i:02d}.wav')
            sp = spoken(s)
            for attempt in range(4):
                try:
                    words = await tts(sp, voice, rate_for(base_rate, c, i), mp3)
                    break
                except Exception as e:  # rede instável: tenta de novo
                    if attempt == 3:
                        raise
                    print('retry', c, i, e, file=sys.stderr)
                    await asyncio.sleep(2 ** attempt)
            # corta do começo da primeira palavra até um respiro depois da última
            t0 = max(0.0, words[0][0] - 0.04) if words else 0.0
            cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t0:.3f}', '-i', mp3]
            if words:
                cmd += ['-t', f'{words[-1][1] + 0.18 - t0:.3f}']
            subprocess.run(cmd + ['-af', 'areverse,afade=t=in:d=0.04,areverse', '-ar', '48000', '-ac', '1', wav], check=True)
            os.remove(mp3)
            d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav],
                                     capture_output=True, text=True, check=True).stdout)
            row.append(round(d, 3)); wrow.append(align(s, sp, words, t0))
            print(f'cap {c} frase {i}: {d:.2f}s')
        durs.append(row); wordt.append(wrow)
    with open(os.path.join(OUT, 'narration.js'), 'w') as f:
        f.write('// gerado por narrate.py\nthis.NARR = ' + json.dumps({'voice': voice, 'rate': base_rate, 'durs': durs, 'words': wordt}) + ';\n')


def mix():
    """Monta a faixa de narração completa (48 kHz mono) com cada frase no seu tempo."""
    import wave
    import numpy as np
    js = subprocess.run(['node', '-e', "const T=require('./timeline.js');console.log(JSON.stringify({d:T.duration,s:T.chapters.map(c=>c.segT.map(x=>x.start))}))"],
                        cwd=HERE, capture_output=True, text=True, check=True).stdout
    info = json.loads(js)
    sr = 48000
    track = np.zeros(int(info['d'] * sr) + sr, dtype=np.float32)
    for c, starts in enumerate(info['s']):
        for i, st in enumerate(starts):
            with wave.open(os.path.join(OUT, f'seg_{c:02d}_{i:02d}.wav')) as w:
                x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
            k = int(st * sr)
            track[k:k + len(x)] += x[:len(track) - k]
    peak = np.abs(track).max() or 1
    track = np.clip(track / peak * 0.89, -1, 1)  # cerca de -1 dBFS de pico
    with wave.open(os.path.join(OUT, 'narracao_completa.wav'), 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((track * 32767).astype(np.int16).tobytes())
    print('faixa de narração:', round(len(track) / sr, 1), 's')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--voice', default='pt-BR-ThalitaMultilingualNeural')
    ap.add_argument('--rate', default='+6%')
    ap.add_argument('--mix', action='store_true', help='só monta a faixa completa a partir dos .wav')
    a = ap.parse_args()
    if a.mix:
        mix()
    else:
        asyncio.run(main(a.voice, a.rate))
