// Roteiro "A HISTÓRIA REAL DE LEONIDA" · Vice City
// Cada capítulo: frases da legenda/narração e planos (shots).
// Um shot começa no início da frase `s` (ou em `at` segundos dentro do capítulo).
// A duração de cada capítulo sai da narração (narration/narration.js); sem ela, é estimada.
(function (root) {
  const REGION = { name: 'VICE CITY', color: '#FF4F8B', next: 'LEONIDA KEYS', nextColor: '#2EC4B6' };

  // Coordenadas em pixels da imagem original.
  const P = {
    MAP: { viceBeach: [2640, 840], littleCuba: [1056, 1229], downtown: [1352, 1085], arena: [1592, 1064],
      rialto: [2101, 563], stockyard: [1627, 301], viceRiver: [1563, 1738], river: [1000, 1300], port: [2224, 1704] },
    LEO: { vice: [984, 1020] },
  };

  const chapters = [
    {
      n: 0, title: 'ABERTURA', minLen: 17, punch: [1],
      segs: [
        'Vice City tá de volta, gente.',
        'E dessa vez, ela é gigante.',
        'Praia, neon, carro rebaixado e muito dinheiro sujo.',
        'Só que quase tudo que aparece no jogo tem uma versão real, em Miami.',
        'Então bora atravessar a cidade bairro por bairro e ver o que é o quê.',
      ],
      shots: [
        { at: 0, type: 'opening', img: 'VC_01', a: { x: 1620, y: 1080, w: 3240 }, b: { x: 1700, y: 1060 }, seal: 'OFICIAL' },
        { s: 3, type: 'map', img: 'LEO', bg: '#2D69A7', a: { x: 660, y: 1050, w: 2100 }, z: { x: 900, y: 1010, w: 760 }, zoomDur: 4,
          circle: { p: P.LEO.vice, r: 70, at: 4.1 }, tag: { text: 'VICE CITY → MIAMI', at: 4.7 }, seal: 'COMUNIDADE', fan: true },
      ],
    },
    {
      n: 1, title: 'A CIDADE DO DINHEIRO', punch: [6],
      segs: [
        'Calma, é rapidinho: pra entender Vice City, vale um minutinho de história.',
        'No fim do século XIX, uma geada acabou com os laranjais do norte da Flórida.',
        'O magnata Henry Flagler viu a chance e levou o trem até o sul.',
        'Em 1896, Miami virou cidade.',
        'Ou seja: Miami nasceu de uma jogada de negócio.',
        'E é exatamente essa a vibe de Vice City:',
        'quem arrisca mais leva tudo. E quem perde, perde feio.',
      ],
      shots: [
        { s: 0, type: 'gfx', gfx: 'florida', seal: 'HISTÓRIA REAL' },
        { s: 5, type: 'image', img: 'VC_01', a: { x: 2350, y: 1000, w: 1900 }, b: { x: 2150, y: 1060 }, seal: 'OFICIAL' },
        { s: 6, type: 'gfx', gfx: 'growth', seal: 'OFICIAL' },
      ],
    },
    {
      n: 2, title: 'VICE BEACH E OS HOTÉIS DE NEON',
      segs: [
        'Do outro lado da baía fica Vice Beach, a Miami Beach do jogo.',
        'E olha, os fãs foram longe: compararam cada prédio dos trailers com a vida real.',
        'O Dominion Hotel? É o Cardozo.',
        'O Cortez? É o Colony.',
        'O Ocean View? O Clevelander.',
        'E o museu de arte de Vice Beach é o The Bass, um museu de verdade.',
        'Repara no estilo: fachada branca, cor pastel, letreiro de neon.',
        'É o art déco da Ocean Drive, que quase foi demolido nos anos 70',
        'e acabou virando patrimônio histórico em 1979.',
        'E a Rockstar recriou tudo isso praticamente prédio por prédio.',
      ],
      shots: [
        { s: 0, type: 'map', img: 'MAP', a: { x: 1600, y: 900, w: 3200 }, z: { x: 2500, y: 900, w: 1250 }, zoomDur: 3.2,
          circle: { p: P.MAP.viceBeach, r: 150, at: 3 }, tag: { text: 'VICE BEACH → MIAMI BEACH', at: 3.6 }, seal: 'COMUNIDADE', fan: true },
        { s: 2, type: 'cards', bg: { img: 'MAP', x: 2600, y: 900, w: 1400 }, seal: 'COMUNIDADE', fan: true,
          cards: [{ s: 2, game: 'DOMINION HOTEL', real: 'CARDOZO' }, { s: 3, game: 'CORTEZ HOTEL', real: 'COLONY' },
            { s: 4, game: 'OCEAN VIEW HOTEL', real: 'CLEVELANDER' }, { s: 5, game: 'VICE MUSEUM OF ART', real: 'THE BASS' }] },
        { s: 6, type: 'image', img: 'VC_04', a: { x: 2900, y: 1250, w: 2400 }, b: { x: 2700, y: 1300 }, seal: 'OFICIAL',
          lupas: [{ s: 6, p: [3392, 1504], label: 'FACHADA BRANCA' }] },
        { s: 7, type: 'gfx', gfx: 'artdeco', seal: 'HISTÓRIA REAL' },
        { s: 9, type: 'image', img: 'VC_04', a: { x: 1500, y: 1400, w: 2600 }, b: { x: 1750, y: 1300 }, seal: 'OFICIAL',
          lupas: [{ s: 9, p: [1824, 2000], label: 'HOTEL VALETTA' }] },
      ],
    },
    {
      n: 3, title: 'O NASCIMENTO DE VICE CITY',
      segs: [
        'Nos anos 80, Miami ficou famosa pelo tráfico e pelo dinheiro fácil.',
        'Em 1984 estreou Miami Vice: terno claro, carro esportivo e sintetizador.',
        'A Rockstar pegou essa estética e, em 2002, lançou o GTA Vice City,',
        'que se passava em 1986 e bebia direto de Miami Vice e Scarface.',
        'Sabe esse letreiro gigante, com o avião passando? É uma piscadela pra quem jogou aquele jogo.',
        'Quarenta anos depois, a cidade volta maior, mais rica e bem mais perigosa.',
      ],
      shots: [
        { s: 0, type: 'image', img: 'VC_02', a: { x: 1300, y: 1250, w: 2600 }, b: { x: 1700, y: 1200 }, seal: 'HISTÓRIA REAL', tint: 0.35 },
        { s: 1, type: 'gfx', gfx: 'timeline80', bgImg: 'VC_02', seal: 'HISTÓRIA REAL' },
        { s: 4, type: 'image', img: 'VC_02', a: { x: 2100, y: 900, w: 2800 }, b: { x: 1900, y: 1000 }, seal: 'OFICIAL',
          lupas: [{ s: 4, p: [1600, 1150], label: 'LETREIRO VICE CITY', dt: 0.1 }] },
        { s: 5, type: 'gfx', gfx: 'timeline80', bgImg: 'VC_02', final: true, seal: 'OFICIAL' },
      ],
    },
    {
      n: 4, title: 'LITTLE CUBA',
      segs: [
        'Agora, um dos meus bairros favoritos do mapa: Little Cuba.',
        'É a versão do jogo da Little Havana, o bairro cubano de Miami.',
        'Depois da revolução de 1959 e do êxodo de Mariel, em 1980,',
        'cerca de 125 mil cubanos chegaram de barco à Flórida.',
        'Um deles, na ficção, é o Tony Montana, de Scarface. E Scarface inspirou o primeiro Vice City.',
        'No trailer, dá pra sentir essa energia: mural colorido, música e a rua sempre cheia.',
      ],
      shots: [
        { s: 0, type: 'image', img: 'VC_05', a: { x: 1500, y: 1080, w: 3000 }, b: { x: 1800, y: 1080 }, seal: 'COMUNIDADE',
          name: { text: 'LITTLE CUBA', s: 0, dt: 1.6 }, nameTag: { text: 'LITTLE CUBA → LITTLE HAVANA', s: 1 } },
        { s: 2, type: 'gfx', gfx: 'cuba', seal: 'HISTÓRIA REAL' },
        { s: 4, type: 'gfx', gfx: 'connect', seal: 'HISTÓRIA REAL' },
        { s: 5, type: 'image', img: 'VC_05', a: { x: 1000, y: 900, w: 2000 }, b: { x: 1150, y: 1000 }, seal: 'OFICIAL',
          lupas: [{ s: 5, p: [272, 784], label: 'MURAL', dt: 0.6 }] },
      ],
    },
    {
      n: 5, title: 'O CENTRO E O DINHEIRO NOVO', punch: [9],
      segs: [
        'E no centro de Vice City, sério, a comunidade fez um trabalho impressionante.',
        'Essa arena iluminada é a Sahara Arena,',
        'inspirada no Kaseya Center, a casa do Miami Heat.',
        'A casa de ópera do jogo é o Adrienne Arsht Center.',
        'O estádio de beisebol é o dos Marlins,',
        'e a boate NINE1NINE é a E11EVEN, o clube que funciona 24 horas.',
        'E repara no nome do estádio: Fleeca Field. Fleeca é o banco do GTA V.',
        'É a Rockstar zoando estádio americano com nome de empresa.',
        'Prédio de vidro, apartamento de luxo e dinheiro que ninguém sabe de onde vem.',
        'Ou seja: perfeito pra GTA.',
      ],
      shots: [
        { s: 0, type: 'map', img: 'MAP', a: { x: 1600, y: 900, w: 3200 }, z: { x: 1450, y: 1080, w: 1300 }, zoomDur: 3,
          circle: { p: P.MAP.downtown, r: 140, at: 2.8 }, tag: { text: 'DOWNTOWN → CENTRO DE MIAMI', at: 3.4 }, seal: 'COMUNIDADE', fan: true },
        { s: 1, type: 'image', img: 'VC_03', a: { x: 1900, y: 900, w: 2900 }, b: { x: 2050, y: 950 }, seal: 'OFICIAL',
          lupas: [{ s: 1, p: [2112, 845], label: 'SAHARA ARENA → KASEYA CENTER', dt: 0.1 }] },
        { s: 3, type: 'cards', bg: { img: 'VC_03', x: 2000, y: 900, w: 3000 }, seal: 'COMUNIDADE',
          cards: [{ s: 3, game: 'GALINA BALLET OPERA HOUSE', real: 'ADRIENNE ARSHT CENTER' },
            { s: 4, game: 'FLEECA FIELD', real: 'LOANDEPOT PARK' }, { s: 5, game: 'NINE1NINE', real: 'E11EVEN', badge: '24H' }] },
        { s: 6, type: 'gfx', gfx: 'fleeca', seal: 'COMUNIDADE' },
        { s: 8, type: 'image', img: 'VC_03', a: { x: 2900, y: 700, w: 2000 }, b: { x: 3000, y: 800 }, seal: 'OFICIAL',
          lupas: [{ s: 8, p: [3456, 768], label: 'PRÉDIOS DE VIDRO', dt: 0.3 }] },
        { s: 9, type: 'image', img: 'VC_03', a: { x: 1500, y: 600, w: 1900 }, b: { x: 1700, y: 640 }, seal: 'OFICIAL' },
      ],
    },
    {
      n: 6, title: 'AS ILHAS DA BAÍA',
      segs: [
        'Entre o centro e a praia tem uma fileira de ilhas ligadas por uma ponte.',
        'No jogo, são as Rialto Islands.',
        'Na vida real, as Venetian Islands: ilhas artificiais dos anos 20, cheias de mansão.',
        'Em GTA, é ali que mora quem tem dinheiro demais pra ser honesto.',
      ],
      shots: [
        { s: 0, type: 'map', img: 'MAP', a: { x: 1600, y: 900, w: 3200 }, z: { x: 2100, y: 620, w: 1200 }, zoomDur: 3.2,
          circle: { p: P.MAP.rialto, r: 150, at: 'seg1' }, tag: { text: 'RIALTO ISLANDS → VENETIAN ISLANDS', at: 'seg2' }, seal: 'COMUNIDADE', fan: true },
        { s: 3, type: 'image', img: 'VC_01', a: { x: 700, y: 1250, w: 1500 }, b: { x: 950, y: 1200 }, seal: 'OFICIAL' },
      ],
    },
    {
      n: 7, title: 'O GÂNGSTER DA BAÍA', punch: [4],
      segs: [
        'Antes de Vice City existir, Miami já tinha o seu chefão do crime.',
        'Nos anos 20, a cidade viveu uma febre de terrenos, até um furacão estourar a bolha em 1926.',
        'Foi aí que chegou Al Capone, o gângster mais famoso dos Estados Unidos.',
        'Em 1928, ele comprou uma mansão em Palm Island, bem no meio da baía.',
        'E viveu ali até morrer, em 1947. Bem GTA, né?',
      ],
      shots: [{ s: 0, type: 'gfx', gfx: 'boom', seal: 'HISTÓRIA REAL' }],
    },
    {
      n: 8, title: 'STOCKYARD, O BAIRRO DOS GRAFITES',
      segs: [
        'Agora, Stockyard. Os fãs ligaram esse bairro a Wynwood, lá em Miami.',
        'Wynwood era só galpão e fábrica de roupa abandonada.',
        'Até que, em 2009, artistas do mundo inteiro foram chamados pra pintar essas paredes.',
        'Nasceu o Wynwood Walls, um museu de grafite a céu aberto.',
        'Hoje é mural, bar e encontro de carros.',
        'E, segundo os fãs, é em Stockyard que rola o encontro de carros dos trailers.',
      ],
      shots: [
        { s: 0, type: 'map', img: 'MAP', a: { x: 1600, y: 900, w: 3200 }, z: { x: 1600, y: 480, w: 1200 }, zoomDur: 3,
          circle: { p: P.MAP.stockyard, r: 140, at: 2.6 }, tag: { text: 'STOCKYARD → WYNWOOD', at: 3.2 }, seal: 'COMUNIDADE', fan: true },
        { s: 1, type: 'gfx', gfx: 'walls', seal: 'HISTÓRIA REAL' },
        { s: 4, type: 'image', img: 'VC_05', a: { x: 700, y: 1300, w: 1500 }, b: { x: 850, y: 900 }, seal: 'OFICIAL' },
        { s: 5, type: 'map', img: 'MAP', a: { x: 1700, y: 420, w: 1500 }, b: { x: 1550, y: 480 }, seal: 'COMUNIDADE', fan: true,
          circle: { p: P.MAP.stockyard, r: 120, at: 0.6 }, tag: { text: 'ENCONTRO DE CARROS DOS TRAILERS', at: 1.2 } },
      ],
    },
    {
      n: 9, title: 'O RIO, O PORTO E O ESTÁDIO', punch: [3],
      segs: [
        'Cortando a cidade tem um rio, com um terminal de carga.',
        'Os fãs ligaram ao rio Miami, de onde saem cargueiros lotados pro Haiti e pro Caribe:',
        'bicicleta, colchão, geladeira, carro usado.',
        'Pra um jogo de contrabando? Cenário perfeito.',
        'E o Fleeca Field fica onde era o Orange Bowl, um estádio lendário demolido em 2008.',
      ],
      shots: [
        { s: 0, type: 'map', img: 'MAP', a: { x: 1600, y: 900, w: 3200 }, z: { x: 1150, y: 1250, w: 1500 }, zoomDur: 3,
          circle: { p: P.MAP.river, r: 110, at: 2.6 }, tag: { text: 'NAVARO SHIPPING TERMINAL → RIO MIAMI', at: 3.2 }, seal: 'COMUNIDADE', fan: true },
        { s: 1, type: 'gfx', gfx: 'river', seal: 'HISTÓRIA REAL' },
        { s: 4, type: 'gfx', gfx: 'stadium', seal: 'HISTÓRIA REAL' },
      ],
    },
    {
      n: 10, title: 'FINAL', minLen: 20,
      segs: [
        'Vice City é dinheiro, neon e crime, mas com raízes bem reais.',
        'No próximo vídeo, a gente desce pras ilhas onde a história do Jason começa:',
        'Leonida Keys.',
        'Se curtiu, deixa o like e se inscreve pra não perder.',
      ],
      shots: [{ s: 0, type: 'ending', img: 'VC_01', a: { x: 1500, y: 1080, w: 3240 }, b: { x: 1350, y: 1080 } }],
    },
  ];

  // Sem narração gravada: estima a fala (~14 caracteres por segundo, anos por extenso).
  function estimate(t) {
    return t.replace(/125 mil/g, 'cento e vinte e cinco mil')
      .replace(/\b(19|20|18)\d\d\b/g, 'mil novecentos e noventa e seis')
      .replace(/\bXIX\b/g, 'dezenove').length / 14;
  }

  // Durações reais da narração (narration/narration.js, gerado por narrate.py), se existirem.
  let NARR = root.NARR;
  if (typeof module !== 'undefined') {
    try {
      const fs = require('fs'), p = require('path').join(__dirname, 'narration', 'narration.js');
      const box = {}; new Function(fs.readFileSync(p, 'utf8')).call(box); NARR = box.NARR;
    } catch (e) { NARR = undefined; }
  }

  let t = 0;
  for (const c of chapters) {
    c.start = t;
    const lead = c.n === 0 ? 0.5 : c.n === 10 ? 0.8 : 1.3; // deixa o card de capítulo respirar
    const nd = NARR && NARR.durs[c.n];
    const durs = nd && nd.length === c.segs.length ? nd : c.segs.map(estimate);
    // pausa curta depois de vírgula/dois-pontos, maior depois de ponto final
    const gaps = c.segs.map((s, i) => (/[,:]$/.test(s) ? 0.16 : /\?$/.test(s) ? 0.7 : 0.38 + 0.12 * ((c.n * 7 + i * 3) % 3)));
    let acc = c.start + lead;
    const words = nd && NARR.words && NARR.words[c.n];
    c.segT = durs.map((d, i) => {
      const s = acc; acc += d + gaps[i];
      return { start: s, end: s + d + Math.min(gaps[i], 0.3), speech: d, words: words && words[i] && words[i].length ? words[i] : null };
    });
    c.end = Math.max(acc - gaps[gaps.length - 1] + (c.n === 10 ? 3 : 1.0), c.start + (c.minLen || 0));
    t = c.end;
    c.shots.forEach((sh) => {
      sh.start = sh.at !== undefined ? c.start + sh.at : sh.s === 0 ? c.start : c.segT[sh.s].start - 0.2;
    });
    c.shots.forEach((sh, i) => { sh.end = i + 1 < c.shots.length ? c.shots[i + 1].start : c.end; sh.chapter = c; });
  }

  const TL = { REGION, chapters, P, duration: t, fps: 30, narrated: !!NARR };
  if (typeof module !== 'undefined') module.exports = TL; else root.TL = TL;
})(this);
