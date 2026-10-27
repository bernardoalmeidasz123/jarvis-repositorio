# A HISTÓRIA REAL DE LEONIDA · Vice City

Vídeo em motion design (1920x1080, 30fps, 9:45) gerado direto do roteiro, sem edição manual.

- `timeline.js`: roteiro com capítulos, frases da legenda e planos (imagem, mapa, cartões JOGO | VIDA REAL, gráficos).
- `render.js`: desenha cada quadro no canvas (Ken Burns, LUPAS, selos, mini-mapa, legenda queimada, cards de capítulo).
- `capture.js`: captura os quadros com Playwright e codifica com ffmpeg.
- `narrate.py`: gera a narração em pt-BR (edge-tts, voz `pt-BR-AntonioNeural`) frase por frase,
  grava as durações em `narration/narration.js` e, com `--mix`, monta `narration/narracao_completa.wav`.
- `srt.js`: exporta as legendas (`out/vice_city.srt`) e um guia de tempos (`out/roteiro_tempos.txt`).

As imagens ficam em `assets/src/1_Vice_City/`.

## Gerar o vídeo

```bash
cd video
export NODE_PATH=$(npm root -g)          # usa o Playwright instalado globalmente
pip install edge-tts numpy
python3 narrate.py                       # narração frase por frase + durações
python3 narrate.py --mix                 # faixa completa no tempo certo
node capture.js stills 3 95 300          # quadros de teste em out/stills
for i in 0 1 2 3; do node capture.js part $i 4 & done; wait
node capture.js concat 4                 # out/vice_city.mp4 com a narração
node srt.js
```

## Tempos da narração

Com `narration/narration.js` presente, cada frase começa no tempo real da fala: legendas,
cartões, LUPAS e gráficos seguem as frases, e um capítulo só se alonga se a fala não couber
no tempo do roteiro. Sem esse arquivo, os tempos são estimados pelo tamanho de cada frase.
Para trocar por uma locução gravada, substitua os `.wav` e as durações em `narration.js`.
