"""Efeitos sonoros de motion design, sintetizados (sem samples de terceiros), mixados com a narração.

Entrada: out/fx.json (node capture.js fx) e narration/narracao_completa.wav (narrate.py --mix).
Saída:   narration/mix_final.wav (narração + efeitos + trilha do music.py), usada pelo capture.js concat.
"""
import json, os, wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
rng = np.random.default_rng(7)


def db(x):
    return 10 ** (x / 20)


def env(n, attack, release_pow=2.0):
    t = np.linspace(0, 1, n)
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * (1 - t) ** release_pow


def sweep_noise(dur, f0, f1, q=0.6):
    """Ruído filtrado com passa-banda (biquad) cuja frequência varre de f0 a f1."""
    n = int(dur * SR)
    x = rng.standard_normal(n)
    y = np.zeros(n)
    x1 = x2 = y1 = y2 = 0.0
    fs = np.geomspace(f0, f1, n)
    for i in range(n):
        w0 = 2 * np.pi * fs[i] / SR
        alpha = np.sin(w0) / (2 * q)
        b0, a0, a1, a2 = alpha, 1 + alpha, -2 * np.cos(w0), 1 - alpha
        yi = (b0 * x[i] - b0 * x2 - a1 * y1 - a2 * y2) / a0
        x2, x1, y2, y1 = x1, x[i], y1, yi
        y[i] = yi
    return y / (np.abs(y).max() + 1e-9)


def tone(dur, f0, f1, decay):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = np.geomspace(f0, f1, n)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / decay)


def whoosh(dur=0.5, f0=250, f1=3200):
    n = int(dur * SR)
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.6
    return sweep_noise(dur, f0, f1, 0.8) * e


def hit(dur=0.45, f0=130, f1=48):
    n = int(dur * SR)
    body = tone(dur, f0, f1, 0.12)
    click = rng.standard_normal(n) * np.exp(-np.arange(n) / (SR * 0.006)) * 0.5
    return body + click


SOUNDS = {
    'whoosh': db(-17) * whoosh(0.5, 260, 3600),
    'swish': db(-21) * whoosh(0.26, 900, 5200),
    'zoom': db(-23) * whoosh(0.6, 180, 1600),
    'hit': db(-15) * hit(),
    'boom': db(-13) * hit(0.9, 95, 38) + db(-20) * whoosh(0.9, 120, 500),
    'pop': db(-21) * tone(0.09, 620, 980, 0.025),
    'tick': db(-27) * tone(0.03, 2300, 2100, 0.006),
    'circle': db(-25) * (tone(0.4, 900, 1500, 0.18) + 0.6 * tone(0.4, 1350, 2250, 0.14) + 0.4 * tone(0.4, 1800, 3000, 0.1)),
}
_h = SOUNDS['hit'] * db(2)
SOUNDS['card'] = np.pad(SOUNDS['whoosh'], (0, len(_h)))
SOUNDS['card'][int(0.22 * SR):int(0.22 * SR) + len(_h)] += _h


def count_ticks(dur):
    """Contador: ticks acelerando levemente, com um 'ding' no fim."""
    out = np.zeros(int((dur + 0.4) * SR))
    t, k = 0.0, 0
    while t < dur:
        tk = db(-28) * tone(0.025, 1900 + 600 * t / max(dur, 0.1), 1800, 0.005)
        i = int(t * SR); out[i:i + len(tk)] += tk[:len(out) - i]
        t += max(0.035, 0.07 - 0.03 * t / max(dur, 0.1)); k += 1
    ding = db(-22) * (tone(0.4, 1320, 1320, 0.12) + 0.5 * tone(0.4, 1980, 1980, 0.08))
    i = int(dur * SR); out[i:i + len(ding)] += ding[:len(out) - i]
    return out


def read_wav(p):
    with wave.open(p) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        if w.getnchannels() == 2:
            x = x.reshape(-1, 2).mean(1)
    return x


def main():
    events = json.load(open(os.path.join(HERE, 'out', 'fx.json')))
    voice = read_wav(os.path.join(HERE, 'narration', 'narracao_completa.wav'))
    fxt = np.zeros_like(voice)
    last = {}
    for e in events:
        typ, at = e['type'], e['at']
        # evita metralhadora de sons iguais em sequência
        gap = {'tick': 0.12, 'pop': 0.1}.get(typ, 0.25)
        if at - last.get(typ, -9) < gap:
            continue
        last[typ] = at
        s = count_ticks(e['dur']) if typ == 'count' else SOUNDS[typ]
        start = int(at * SR) - (int(0.3 * SR) if typ in ('whoosh', 'card') else 0)  # o whoosh chega junto do corte
        start = max(0, start)
        end = min(len(fxt), start + len(s))
        fxt[start:end] += s[:end - start]
    # abaixa efeitos e trilha enquanto a voz fala (envelope da voz, com soltura lenta)
    win = int(0.05 * SR)
    venv = np.convolve(np.abs(voice), np.ones(win) / win, mode='same')
    speech = np.clip(venv / 0.05, 0, 1)
    rel = int(0.35 * SR)  # segura o ducking entre palavras para a trilha não "respirar"
    speech = np.clip(np.convolve(speech, np.ones(rel) / rel, mode='full')[:len(speech)] * 2.5, 0, 1)
    mono = voice + fxt * (1 - 0.45 * speech)
    stereo = np.stack([mono, mono], 1)
    mpath = os.path.join(HERE, 'narration', 'music.wav')
    if os.path.exists(mpath):  # trilha: baixa sob a voz, sobe nas pausas
        with wave.open(mpath) as w:
            m = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32).reshape(-1, 2) / 32768
        m = np.pad(m, ((0, max(0, len(mono) - len(m))), (0, 0)))[:len(mono)]
        stereo += m * (db(-17) * (1 - 0.6 * speech))[:, None]
    mix = stereo / (np.abs(stereo).max() + 1e-9) * db(-1)
    with wave.open(os.path.join(HERE, 'narration', 'mix_final.wav'), 'w') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    print(len(events), 'eventos;', sum(1 for _ in last), 'tipos;', round(len(mix) / SR, 1), 's')


if __name__ == '__main__':
    main()
