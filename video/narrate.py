"""Gera a narração (TTS pt-BR) frase por frase e grava a duração de cada uma.

Saída: narration/seg_<cap>_<i>.wav e narration/narration.js (durações lidas pelo timeline.js).
Uso: python3 narrate.py [--voice pt-BR-AntonioNeural] [--rate -6%]
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


def duration(path):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                                capture_output=True, text=True, check=True).stdout)


async def main(voice, rate):
    os.makedirs(OUT, exist_ok=True)
    durs = []
    for c, segs in enumerate(segments()):
        row = []
        for i, s in enumerate(segs):
            mp3, wav = os.path.join(OUT, f'seg_{c:02d}_{i:02d}.mp3'), os.path.join(OUT, f'seg_{c:02d}_{i:02d}.wav')
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(spoken(s), voice, rate=rate).save(mp3)
                    break
                except Exception as e:  # rede instável: tenta de novo
                    if attempt == 3:
                        raise
                    print('retry', c, i, e, file=sys.stderr)
                    await asyncio.sleep(2 ** attempt)
            # remove silêncio das pontas para o encaixe ficar preciso
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mp3, '-af',
                            'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse',
                            '-ar', '48000', '-ac', '1', wav], check=True)
            os.remove(mp3)
            row.append(round(duration(wav), 3))
            print(f'cap {c} frase {i}: {row[-1]:.2f}s')
        durs.append(row)
    with open(os.path.join(OUT, 'narration.js'), 'w') as f:
        f.write('// gerado por narrate.py\nthis.NARR = ' + json.dumps({'voice': voice, 'rate': rate, 'durs': durs}) + ';\n')


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
    ap.add_argument('--voice', default='pt-BR-AntonioNeural')
    ap.add_argument('--rate', default='-6%')
    ap.add_argument('--mix', action='store_true', help='só monta a faixa completa a partir dos .wav')
    a = ap.parse_args()
    if a.mix:
        mix()
    else:
        asyncio.run(main(a.voice, a.rate))
