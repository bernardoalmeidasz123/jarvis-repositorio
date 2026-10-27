"""Trilha synthwave original (sintetizada, sem samples), no tempo do vídeo.

Seções seguem o roteiro: abertura só com pad e arpejo, batida cheia nos capítulos,
capítulo do gângster mais sombrio (sem chimbal nem arpejo) e final aberto com fade.
Saída: narration/music.wav (48 kHz, estéreo).
"""
import json, os, subprocess, wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
BPM = 96
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(11)

# i–VI–III–VII em lá menor: Am, F, C, G (fundamental do baixo + tríade)
CHORDS = [(110.0, [220.0, 261.63, 329.63]), (87.31, [174.61, 220.0, 261.63]),
          (130.81, [261.63, 329.63, 392.0]), (98.0, [196.0, 246.94, 293.66])]


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def saw(f, n, detune=0.0):
    ph = np.cumsum(np.full(n, f * 2 ** (detune / 1200) / SR)) + rng.random()
    return 2 * (ph % 1) - 1


def square(f, n):
    t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * k * t) / k for k in (1, 3, 5, 7))


def adsr(n, a, d, s, r):
    e = np.full(n, s)
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na) if na else e[:na]
    e[na:na + nd] = np.linspace(1, s, len(e[na:na + nd]))
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def add(buf, x, t):
    i = int(t * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(x))
    buf[i:j] += x[:j - i]


def kick():
    n = int(0.4 * SR); t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)


def snare():
    n = int(0.3 * SR); t = np.arange(n) / SR
    noise = hp(rng.standard_normal(n), 1200) * np.exp(-t / 0.07)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05)
    return 0.7 * noise + 0.5 * body


def hat():
    n = int(0.05 * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000, 4) * np.exp(-t / 0.012)


def reverb_ir(sec, seed):
    r = np.random.default_rng(seed); n = int(sec * SR); t = np.arange(n) / SR
    return lp(r.standard_normal(n) * np.exp(-t / (sec / 5)), 5000) * 0.02


def timeline():
    js = subprocess.run(['node', '-e', "const T=require('./timeline.js');console.log(JSON.stringify({d:T.duration,c:T.chapters.map(c=>[c.n,c.start,c.end]),m:T.chapters[0].shots[1].start}))"],
                        cwd=HERE, capture_output=True, text=True, check=True).stdout
    return json.loads(js)


def section(t, info):
    if t < info['m'] - 0.5:
        return 'intro'
    for n, a, b in info['c']:
        if a <= t < b:
            return 'dark' if n == 7 else 'outro' if n == 10 else 'full'
    return 'outro'


def main():
    info = timeline()
    dur = info['d'] + 2
    n = int(dur * SR)
    pad, bass, arp, drums, side = (np.zeros(n) for _ in range(5))
    K, S, H = kick(), snare(), hat()
    nbars = int(dur / BAR) + 1
    for b in range(nbars):
        t0 = b * BAR
        sec = section(t0, info)
        root, tri = CHORDS[b % 4]
        nb = int(BAR * SR)
        # pad: 3 serras desafinadas por nota, ataque lento, liga no compasso seguinte
        nn = int((BAR + 0.6) * SR)
        p = sum(saw(f, nn, d) for f in tri for d in (-8, 0, 7)) / 9
        add(pad, p * adsr(nn, 0.5, 0.3, 0.8, 0.6), t0)
        # baixo: colcheias pulsando entre fundamental e oitava
        if sec in ('full', 'dark') or (sec == 'outro' and b % 2 == 0 and t0 < info['d'] - 8):
            for k in range(8):
                f = root * (2 if (k % 2 and sec == 'full') else 1)
                m = int(BEAT / 2 * SR * 0.9)
                add(bass, saw(f, m) * adsr(m, 0.005, 0.12, 0.5, 0.05), t0 + k * BEAT / 2)
        # arpejo em semicolcheias sobre as notas do acorde, uma oitava acima
        if sec in ('intro', 'full', 'outro'):
            notes = [x * 2 for x in tri] + [tri[0] * 4]
            for k in range(16):
                f = notes[[0, 1, 2, 3, 2, 1, 0, 1][k % 8]]
                m = int(BEAT / 4 * SR)
                add(arp, square(f, m) * adsr(m, 0.003, 0.09, 0.0, 0.01) * (0.6 if sec == 'intro' else 1), t0 + k * BEAT / 4)
        # bateria
        if sec in ('full', 'dark'):
            for k in range(4):
                add(drums, K, t0 + k * BEAT)
                add(side, np.ones(1), t0 + k * BEAT)
                if k in (1, 3):
                    add(drums, S * (0.8 if sec == 'dark' else 1), t0 + k * BEAT)
            if sec == 'full':
                for k in range(8):
                    add(drums, H * (0.5 if k % 2 == 0 else 0.8), t0 + k * BEAT / 2)
    pad = lp(pad, 1400)
    bass = lp(bass, 380) * 0.9
    arp = lp(arp, 2600) * 0.22
    # eco do arpejo (3/16) dos dois lados
    dl = int(BEAT * 0.75 * SR)
    arpL, arpR = arp.copy(), arp.copy()
    for k, g in ((1, 0.4), (2, 0.22), (3, 0.12)):
        (arpL if k % 2 else arpR)[k * dl:] += arp[:-k * dl] * g
    # bombeamento estilo synthwave: pad e baixo abaixam a cada bumbo
    pump = np.ones(n)
    env = 1 - 0.55 * np.exp(-np.arange(int(0.3 * SR)) / SR / 0.09)
    for i in np.nonzero(side)[0]:
        j = min(n, i + len(env)); pump[i:j] = np.minimum(pump[i:j], env[:j - i])
    pad *= pump; bass *= pump
    wet = pad * 0.6 + arp * 0.8 + drums * 0.15
    L = pad * 0.55 + bass + arpL + drums * 0.8 + fftconvolve(wet, reverb_ir(2.2, 1))[:n]
    R = pad * 0.55 + bass + arpR + drums * 0.8 + fftconvolve(wet, reverb_ir(2.2, 2))[:n]
    mix = np.stack([L, R], 1)
    # entrada e saída suaves
    fi, fo = int(1.5 * SR), int(4 * SR)
    mix[:fi] *= np.linspace(0, 1, fi)[:, None]
    end = int(info['d'] * SR)
    mix[end - fo:end] *= np.linspace(1, 0, fo)[:, None]
    mix[end:] = 0
    mix /= np.abs(mix).max() + 1e-9
    with wave.open(os.path.join(HERE, 'narration', 'music.wav'), 'w') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((mix * 0.9 * 32767).astype(np.int16).tobytes())
    print('trilha:', round(info['d'], 1), 's')


if __name__ == '__main__':
    main()
