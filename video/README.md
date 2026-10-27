# A HISTÓRIA REAL DE LEONIDA · Vice City

Vídeo em motion design (1920x1080, 30fps, 9:45) gerado direto do roteiro, sem edição manual.

- `timeline.js`: roteiro com capítulos, frases da legenda e planos (imagem, mapa, cartões JOGO | VIDA REAL, gráficos).
- `render.js`: desenha cada quadro no canvas (Ken Burns, LUPAS, selos, mini-mapa, legenda queimada, cards de capítulo).
- `capture.js`: captura os quadros com Playwright e codifica com ffmpeg.
- `srt.js`: exporta as legendas (`out/vice_city.srt`) e um guia de tempos (`out/roteiro_tempos.txt`).

As imagens ficam em `assets/src/1_Vice_City/`.

## Gerar o vídeo

```bash
cd video
export NODE_PATH=$(npm root -g)          # usa o Playwright instalado globalmente
node capture.js stills 3 95 300          # quadros de teste em out/stills
for i in 0 1 2 3; do node capture.js part $i 4 & done; wait
node capture.js concat 4                 # out/vice_city.mp4 (áudio mudo)
node srt.js
```

## Tempos da narração

Sem a narração gravada, cada frase recebe um tempo proporcional ao tamanho falado
(anos contam por extenso). Quando a locução estiver pronta, basta trocar `segT` em
`timeline.js` pelos tempos reais: legendas, cartões, LUPAS e gráficos seguem as frases.
