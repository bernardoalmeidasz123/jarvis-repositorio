# A HISTÓRIA REAL DE LEONIDA · Vice City

Vídeo em motion design (1920x1080, 30fps) gerado direto do roteiro, sem edição manual.
A duração sai da narração (hoje cerca de 5 min).

- `timeline.js`: roteiro com capítulos, frases da legenda e planos (imagem, mapa, cartões JOGO | VIDA REAL, gráficos).
- `render.js`: desenha cada quadro no canvas (Ken Burns, LUPAS, selos, mini-mapa, legenda queimada, cards de capítulo).
- `capture.js`: captura os quadros com Playwright e codifica com ffmpeg.
- `narrate.py`: gera a narração em pt-BR (edge-tts, voz `pt-BR-ThalitaMultilingualNeural`) frase por frase,
  com o tempo de cada palavra (legenda palavra por palavra) e pronúncia "Vaice Cíti"; grava tudo em
  `narration/narration.js` e, com `--mix`, monta `narration/narracao_completa.wav`.
- `music.py`: trilha synthwave original sintetizada no tempo do vídeo (`narration/music.wav`).
- `sfx.py`: sintetiza os efeitos sonoros (whoosh, impacto, pop, tick, brilho da lupa, contador) e mixa voz, efeitos e trilha
  (efeitos e trilha baixam sozinhos quando a voz fala).
- `srt.js`: exporta as legendas (`out/vice_city.srt`) e um guia de tempos (`out/roteiro_tempos.txt`).

As imagens ficam em `assets/src/1_Vice_City/`.

## Gerar o vídeo

```bash
cd video
export NODE_PATH=$(npm root -g)          # usa o Playwright instalado globalmente
pip install edge-tts numpy scipy
python3 narrate.py                       # narração frase por frase + durações
python3 narrate.py --mix                 # faixa completa no tempo certo
python3 music.py                         # trilha
node capture.js fx && python3 sfx.py     # efeitos sonoros + mix final (narration/mix_final.wav)
node capture.js stills 3 95 300          # quadros de teste em out/stills
for i in 0 1 2 3; do node capture.js part $i 4 & done; wait
node capture.js concat 4                 # out/vice_city.mp4 com narração, efeitos e trilha
node srt.js
```

## Tempos da narração

Com `narration/narration.js` presente, cada frase começa no tempo real da fala e cada
capítulo dura o que a fala dura: legendas, cartões, LUPAS e gráficos seguem as frases.
Os efeitos sonoros saem dos mesmos eventos que desenham cada elemento. Sem esse arquivo, os tempos são estimados pelo tamanho de cada frase.
Para trocar por uma locução gravada, substitua os `.wav` e as durações em `narration.js`.

## Acabamento "feito à mão"

Câmera na mão (tremor leve), círculos de marcador imperfeitos, cortes variados (fade, whip pan,
punch-in), punch-in nas frases de impacto (`punch` em cada capítulo), grão de filme e legenda que
entra palavra por palavra no ritmo da fala, com números e nomes em destaque.
