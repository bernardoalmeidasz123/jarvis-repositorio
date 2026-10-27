// Roteiro "A HISTÓRIA REAL DE LEONIDA" · Vice City
// Cada capítulo: início/fim (s), frases da legenda e planos (shots).
// Um shot começa no início da frase `s` (ou em `at` segundos dentro do capítulo).
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
      n: 0, title: 'ABERTURA', start: 0, end: 27,
      segs: [
        'Vice City é o coração de GTA VI.',
        'Praia, neon, dinheiro e crime.',
        'Mas quase tudo que você vê nessa cidade tem um original de verdade,',
        'num lugar chamado Miami.',
        'Neste vídeo, a gente vai atravessar Vice City bairro por bairro',
        'e descobrir a história real por trás de cada um.',
      ],
      shots: [
        { at: 0, type: 'opening', img: 'VC_01', a: { x: 1620, y: 1080, w: 3240 }, b: { x: 1700, y: 1060 }, seal: 'OFICIAL' },
        { at: 10, type: 'map', img: 'LEO', bg: '#2D69A7', a: { x: 660, y: 1050, w: 2100 }, z: { x: 900, y: 1010, w: 760 }, zoomDur: 6,
          circle: { p: P.LEO.vice, r: 70, at: 6.2 }, tag: { text: 'VICE CITY → MIAMI', at: 7 }, seal: 'COMUNIDADE', fan: true },
      ],
    },
    {
      n: 1, title: 'UMA CIDADE QUE NASCEU DE UM NEGÓCIO', start: 27, end: 91,
      segs: [
        'A história de Miami começa com uma mulher chamada Julia Tuttle.',
        'No fim do século XIX, uma geada destruiu as plantações de laranja do norte da Flórida.',
        'Conta a história que a Julia mandou flores de laranjeira pro Henry Flagler,',
        'um milionário das ferrovias, pra provar que no sul não tinha congelado.',
        'Pode ser lenda, mas o resultado é real:',
        'o Flagler levou o trem até lá, e em 1896 Miami virou cidade.',
        'Ou seja, Miami nasceu de uma jogada de negócio.',
        'E isso explica muita coisa sobre Vice City:',
        'uma cidade construída pra ganhar dinheiro,',
        'onde quem chega primeiro e arrisca mais fica com tudo.',
        'Em poucas décadas, um lugar de mangue e mosquito virou destino de milionário,',
        'com hotel de luxo, cassino e gente vindo do país inteiro atrás de sol e de oportunidade.',
      ],
      shots: [
        { s: 0, type: 'gfx', gfx: 'florida', seal: 'HISTÓRIA REAL' },
        { s: 7, type: 'image', img: 'VC_01', a: { x: 2350, y: 1000, w: 1900 }, b: { x: 2150, y: 1060 }, seal: 'OFICIAL' },
        { s: 10, type: 'gfx', gfx: 'growth', seal: 'HISTÓRIA REAL' },
      ],
    },
    {
      n: 2, title: 'VICE BEACH E OS HOTÉIS DE NEON', start: 91, end: 166,
      segs: [
        'Do outro lado da baía fica Vice Beach, a Miami Beach do jogo,',
        'segundo o mapa da comunidade.',
        'E os fãs foram longe: eles compararam os prédios dos trailers com a vida real',
        'e identificaram dezenas de hotéis da Ocean Drive, a avenida mais famosa de Miami Beach.',
        'O Dominion Hotel do jogo seria o Cardozo.',
        'O Cortez seria o Colony.',
        'O Ocean View seria o Clevelander.',
        'E o museu de arte de Vice Beach seria o The Bass, um museu de verdade.',
        'Esses hotéis são do estilo art déco, dos anos 30:',
        'fachada branca, cor pastel, letreiro em neon.',
        'Só que nos anos 70 eles estavam velhos e a ideia era derrubar tudo.',
        'Uma mulher chamada Barbara Capitman liderou um movimento pra salvar o bairro,',
        'e em 1979 ele virou patrimônio histórico, com centenas de prédios protegidos.',
        'Sem a Barbara, não existiria a Miami Beach que a gente conhece.',
        'E não existiria a Vice Beach que a Rockstar recriou prédio por prédio.',
      ],
      shots: [
        { s: 0, type: 'map', img: 'MAP', a: { x: 1600, y: 900, w: 3200 }, z: { x: 2500, y: 900, w: 1250 }, zoomDur: 4,
          circle: { p: P.MAP.viceBeach, r: 150, at: 3.6 }, tag: { text: 'VICE BEACH → MIAMI BEACH', at: 4.4 }, seal: 'COMUNIDADE', fan: true },
        { s: 4, type: 'cards', bg: { img: 'MAP', x: 2600, y: 900, w: 1400 }, seal: 'COMUNIDADE', fan: true,
          cards: [{ s: 4, game: 'DOMINION HOTEL', real: 'CARDOZO' }, { s: 5, game: 'CORTEZ HOTEL', real: 'COLONY' },
            { s: 6, game: 'OCEAN VIEW HOTEL', real: 'CLEVELANDER' }, { s: 7, game: 'VICE MUSEUM OF ART', real: 'THE BASS' }] },
        { s: 8, type: 'image', img: 'VC_04', a: { x: 2900, y: 1250, w: 2400 }, b: { x: 2700, y: 1300 }, seal: 'HISTÓRIA REAL',
          lupas: [{ s: 8, p: [3392, 1504], label: 'FACHADA BRANCA' }, { s: 10, p: [3536, 1056], label: 'LETREIRO ART DÉCO' }] },
        { s: 11, type: 'gfx', gfx: 'artdeco', seal: 'HISTÓRIA REAL' },
        { s: 13, type: 'image', img: 'VC_04', a: { x: 1500, y: 1400, w: 2600 }, b: { x: 1750, y: 1300 }, seal: 'OFICIAL',
          lupas: [{ s: 14, p: [1824, 2000], label: 'HOTEL VALETTA' }] },
      ],
    },
    {
      n: 3, title: 'OS ANOS 80 E O NASCIMENTO DE VICE CITY', start: 166, end: 229,
      segs: [
        'Nos anos 80, Miami ficou famosa por outro motivo: o tráfico.',
        'Muito dinheiro de droga passava pela cidade, e isso mudou tudo.',
        'Bancos cresceram, prédios subiram e a cidade virou cenário de filme e de série.',
        'Em 1984 estreou Miami Vice,',
        'com policiais de terno claro, carro esportivo e trilha de sintetizador.',
        'Virou febre no mundo inteiro.',
        'E é aqui que entra a Rockstar.',
        'Em 2002 ela lançou o GTA Vice City, que se passava em 1986',
        'e era praticamente uma carta de amor a Miami Vice e ao filme Scarface.',
        'Esse letreiro gigante escrito Vice City, com o avião passando,',
        'é uma piscadela pra quem jogou aquele jogo.',
        'Quarenta anos depois, a cidade volta, só que maior, mais rica e mais perigosa.',
      ],
      shots: [
        { s: 0, type: 'image', img: 'VC_02', a: { x: 1300, y: 1250, w: 2600 }, b: { x: 1700, y: 1200 }, seal: 'HISTÓRIA REAL', tint: 0.35 },
        { s: 3, type: 'gfx', gfx: 'timeline80', bgImg: 'VC_02', seal: 'HISTÓRIA REAL' },
        { s: 9, type: 'image', img: 'VC_02', a: { x: 2100, y: 900, w: 2800 }, b: { x: 1900, y: 1000 }, seal: 'OFICIAL',
          lupas: [{ s: 9, p: [2112, 538], label: 'O AVIÃO', dt: 0.3 }, { s: 10, p: [1600, 1150], label: 'LETREIRO VICE CITY' }] },
        { s: 11, type: 'gfx', gfx: 'timeline80', bgImg: 'VC_02', final: true, seal: 'HISTÓRIA REAL' },
      ],
    },
    {
      n: 4, title: 'LITTLE CUBA', start: 229, end: 294,
      segs: [
        'Agora o bairro que eu mais quero explorar:',
        'o bairro cubano, que a comunidade chama de Little Cuba.',
        'Ele é inspirado na Little Havana, de Miami.',
        'Em 1959 aconteceu a revolução em Cuba,',
        'e muita gente fugiu pra Miami, a menos de uma hora de avião.',
        'Depois, em 1980, aconteceu o Mariel:',
        'em poucos meses, cerca de 125 mil cubanos atravessaram o mar até a Flórida,',
        'em barcos lotados.',
        'Na ficção, um desses refugiados é o Tony Montana, do Scarface.',
        'E o Scarface inspirou o primeiro Vice City. Tudo se conecta.',
        'Hoje a Little Havana é cheia de mural, café cubano, charuto,',
        'dominó na praça e música na rua.',
        'Os murais dessa imagem têm exatamente essa energia:',
        'cor forte, arte nas paredes e a cidade vivendo do lado de fora das casas.',
      ],
      shots: [
        { s: 0, type: 'image', img: 'VC_05', a: { x: 1500, y: 1080, w: 3000 }, b: { x: 1800, y: 1080 }, seal: 'COMUNIDADE',
          name: { text: 'LITTLE CUBA', s: 1 }, nameTag: { text: 'LITTLE CUBA → LITTLE HAVANA', s: 2 } },
        { s: 3, type: 'gfx', gfx: 'cuba', seal: 'HISTÓRIA REAL' },
        { s: 8, type: 'gfx', gfx: 'connect', seal: 'HISTÓRIA REAL' },
        { s: 10, type: 'image', img: 'VC_05', a: { x: 900, y: 500, w: 1700 }, b: { x: 700, y: 620 }, seal: 'HISTÓRIA REAL' },
        { s: 12, type: 'image', img: 'VC_05', a: { x: 1000, y: 900, w: 2000 }, b: { x: 1150, y: 1000 }, seal: 'OFICIAL',
          lupas: [{ s: 12, p: [272, 784], label: 'MURAL', dt: 0.8 }] },
      ],
    },
    {
      n: 5, title: 'O CENTRO E O DINHEIRO NOVO', start: 294, end: 370,
      segs: [
        'Do outro lado, o centro de Vice City mostra a Miami de hoje.',
        'E aqui a comunidade fez um trabalho impressionante.',
        'Essa arena iluminada, que no jogo se chama Sahara Arena,',
        'seria o Kaseya Center, a casa do time de basquete Miami Heat.',
        'A casa de ópera do jogo seria o Adrienne Arsht Center,',
        'o maior centro de artes da cidade.',
        'O estádio de beisebol seria o do Miami Marlins.',
        'E tem até uma boate, a NINE1NINE, que seria a E11EVEN,',
        'um clube famoso de Miami que funciona 24 horas.',
        'Repara no nome do estádio: Fleeca Field.',
        'Fleeca é o banco fictício que aparece no GTA V.',
        'É a Rockstar brincando com o fato de estádio americano sempre ter nome de empresa.',
        'Esses prédios de vidro contam a fase mais recente de Miami:',
        'dinheiro do mundo inteiro, apartamento de luxo e uma cidade que não para de subir.',
        'Rica, moderna e cheia de dinheiro que ninguém sabe muito bem de onde vem.',
        'Ou seja, perfeita pra GTA.',
      ],
      shots: [
        { s: 0, type: 'map', img: 'MAP', a: { x: 1600, y: 900, w: 3200 }, z: { x: 1450, y: 1080, w: 1300 }, zoomDur: 4,
          circle: { p: P.MAP.downtown, r: 140, at: 3.6 }, tag: { text: 'DOWNTOWN → CENTRO DE MIAMI', at: 4.4 }, seal: 'COMUNIDADE', fan: true },
        { s: 2, type: 'image', img: 'VC_03', a: { x: 1900, y: 900, w: 2900 }, b: { x: 2050, y: 950 }, seal: 'COMUNIDADE',
          lupas: [{ s: 2, p: [2112, 845], label: 'SAHARA ARENA', dt: 0.6 }] },
        { s: 3, type: 'cards', bg: { img: 'VC_03', x: 2000, y: 900, w: 3000 }, seal: 'COMUNIDADE',
          cards: [{ s: 3, game: 'SAHARA ARENA', real: 'KASEYA CENTER' }] },
        { s: 4, type: 'image', img: 'VC_03', a: { x: 2700, y: 1350, w: 2400 }, b: { x: 2550, y: 1300 }, seal: 'COMUNIDADE',
          lupas: [{ s: 4, p: [3000, 1380], label: 'CASA DE ÓPERA', dt: 0.4 }] },
        { s: 5, type: 'cards', bg: { img: 'VC_03', x: 2600, y: 1300, w: 2600 }, seal: 'COMUNIDADE',
          cards: [{ s: 5, game: 'GALINA BALLET OPERA HOUSE', real: 'ADRIENNE ARSHT CENTER' }, { s: 6, game: 'FLEECA FIELD', real: 'LOANDEPOT PARK' },
            { s: 7, game: 'NINE1NINE', real: 'E11EVEN', badge: '24H' }] },
        { s: 9, type: 'gfx', gfx: 'fleeca', seal: 'COMUNIDADE' },
        { s: 12, type: 'image', img: 'VC_03', a: { x: 2900, y: 700, w: 2000 }, b: { x: 3000, y: 800 }, seal: 'HISTÓRIA REAL',
          lupas: [{ s: 12, p: [3456, 768], label: 'PRÉDIOS DE VIDRO', dt: 0.6 }] },
        { s: 14, type: 'image', img: 'VC_03', a: { x: 1500, y: 600, w: 1900 }, b: { x: 1750, y: 650 }, seal: 'HISTÓRIA REAL',
          lupas: [{ s: 14, p: [1642, 445], label: 'RODA-GIGANTE', dt: 0.6 }] },
      ],
    },
    {
      n: 6, title: 'AS ILHAS DA BAÍA', start: 370, end: 404,
      segs: [
        'Entre o centro e a praia existe uma fileira de ilhas pequenas, ligadas por pontes.',
        'No jogo elas são as Rialto Islands,',
        'e a comunidade identificou como as Venetian Islands, de Miami:',
        'ilhas artificiais, criadas nos anos 20, cheias de mansão',
        'e ligadas por uma estrada que atravessa a baía.',
        'É o tipo de lugar onde, em GTA, mora quem tem dinheiro demais pra ser honesto.',
      ],
      shots: [
        { s: 0, type: 'map', img: 'MAP', a: { x: 1600, y: 900, w: 3200 }, z: { x: 2100, y: 620, w: 1200 }, zoomDur: 4,
          circle: { p: P.MAP.rialto, r: 150, at: 'seg1' }, tag: { text: 'RIALTO ISLANDS → VENETIAN ISLANDS', at: 'seg2' }, seal: 'COMUNIDADE', fan: true },
        { s: 3, type: 'map', img: 'MAP', a: { x: 1750, y: 720, w: 1300 }, b: { x: 2500, y: 520 }, seal: 'COMUNIDADE', fan: true,
          path: [[1600, 728], [1780, 667], [1950, 630], [2100, 595], [2300, 540], [2450, 485], [2600, 425], [2720, 395]], tag: { text: 'RIVO BRIDGE → VENETIAN CAUSEWAY', at: 1.2 } },
        { s: 5, type: 'image', img: 'VC_01', a: { x: 700, y: 1250, w: 1500 }, b: { x: 950, y: 1200 }, seal: 'OFICIAL' },
      ],
    },
    {
      n: 7, title: 'A MIAMI DOS ANOS 20 E O GÂNGSTER NA PRAIA', start: 404, end: 462,
      segs: [
        'Nos anos 20, Miami viveu uma febre.',
        'Todo mundo queria comprar terreno na Flórida, e os preços subiam toda semana.',
        'Gente comprava lote de manhã e vendia mais caro à tarde, sem nem ver o terreno.',
        'Em 1926, um furacão atingiu a cidade e a bolha estourou.',
        'Muita gente perdeu tudo.',
        'E foi nessa Miami que chegou um morador famoso:',
        'Al Capone, o gângster mais conhecido dos Estados Unidos.',
        'Em 1928 ele comprou uma mansão em Palm Island,',
        'uma ilha na baía entre Miami e Miami Beach.',
        'Viveu ali até morrer, em 1947.',
        'Antes de existir Vice City, Miami já tinha o seu chefão do crime morando de frente pro mar.',
      ],
      shots: [{ s: 0, type: 'gfx', gfx: 'boom', seal: 'HISTÓRIA REAL' }],
    },
    {
      n: 8, title: 'STOCKYARD, O BAIRRO DOS GRAFITES', start: 462, end: 511,
      segs: [
        'No mapa da comunidade existe um bairro chamado Stockyard,',
        'e os fãs ligaram vários lugares dele a endereços de Wynwood, em Miami.',
        'Wynwood era uma área de galpões e fábricas de roupa.',
        'Quando as fábricas fecharam, sobraram prédios enormes de parede lisa.',
        'Em 2009, um empresário chamado Tony Goldman',
        'chamou artistas do mundo inteiro pra pintar essas paredes,',
        'e nasceu o Wynwood Walls, um museu de grafite a céu aberto.',
        'Hoje o bairro é cheio de mural, galeria, bar e encontro de carros.',
        'Não é à toa que, segundo os fãs,',
        'é em Stockyard que acontece o encontro de carros dos trailers.',
      ],
      shots: [
        { s: 0, type: 'map', img: 'MAP', a: { x: 1600, y: 900, w: 3200 }, z: { x: 1600, y: 480, w: 1200 }, zoomDur: 4,
          circle: { p: P.MAP.stockyard, r: 140, at: 3.4 }, tag: { text: 'STOCKYARD → WYNWOOD', at: 'seg1' }, seal: 'COMUNIDADE', fan: true },
        { s: 2, type: 'gfx', gfx: 'walls', seal: 'HISTÓRIA REAL' },
        { s: 7, type: 'image', img: 'VC_05', a: { x: 700, y: 1300, w: 1500 }, b: { x: 850, y: 900 }, seal: 'HISTÓRIA REAL' },
        { s: 8, type: 'map', img: 'MAP', a: { x: 1700, y: 420, w: 1500 }, b: { x: 1550, y: 480 }, seal: 'COMUNIDADE', fan: true,
          circle: { p: P.MAP.stockyard, r: 120, at: 0.6 }, tag: { text: 'ENCONTRO DE CARROS DOS TRAILERS', at: 1.2 } },
      ],
    },
    {
      n: 9, title: 'O RIO, O PORTO E O ESTÁDIO', start: 511, end: 559,
      segs: [
        'Cortando a cidade existe um rio,',
        'e nele fica um terminal de carga que a comunidade ligou ao rio Miami.',
        'Esse rio tem um movimento curioso:',
        'pequenos navios cargueiros saem dali pro Haiti e outras ilhas do Caribe,',
        'lotados de bicicleta, colchão, eletrodoméstico e carro usado.',
        'É um comércio enorme, meio escondido no meio da cidade.',
        'Pra um jogo de contrabando, é um cenário perfeito.',
        'E o estádio de beisebol, o Fleeca Field, fica num lugar com história.',
        'O estádio real dos Marlins foi construído onde ficava o Orange Bowl,',
        'um estádio lendário de futebol americano, demolido em 2008.',
      ],
      shots: [
        { s: 0, type: 'map', img: 'MAP', a: { x: 1600, y: 900, w: 3200 }, z: { x: 1150, y: 1250, w: 1500 }, zoomDur: 4,
          circle: { p: P.MAP.river, r: 110, at: 3.4 }, tag: { text: 'NAVARO SHIPPING TERMINAL → TERMINAL NO RIO MIAMI', at: 'seg1' }, seal: 'COMUNIDADE', fan: true },
        { s: 2, type: 'gfx', gfx: 'river', seal: 'HISTÓRIA REAL' },
        { s: 7, type: 'cards', bg: { img: 'MAP', x: 1400, y: 1200, w: 1800 }, seal: 'COMUNIDADE', fan: true,
          cards: [{ s: 7, game: 'FLEECA FIELD', real: 'LOANDEPOT PARK', sub: 'ANTIGO ORANGE BOWL' }] },
        { s: 8, type: 'gfx', gfx: 'stadium', seal: 'HISTÓRIA REAL' },
      ],
    },
    {
      n: 10, title: 'FINAL', start: 559, end: 585,
      segs: [
        'Vice City nasceu de uma jogada de negócio,',
        'foi salva por quem não quis ver os hotéis caírem,',
        'ficou famosa pelo crime e virou o símbolo de uma cidade que sempre recomeça.',
        'No próximo vídeo, a gente desce pras ilhas',
        'onde a história do Jason começa: Leonida Keys.',
      ],
      shots: [{ s: 0, type: 'ending', img: 'VC_01', a: { x: 1500, y: 1080, w: 3240 }, b: { x: 1350, y: 1080 } }],
    },
  ];

  // Peso de fala: números são lidos por extenso (ex.: 1896 = "mil oitocentos e noventa e seis").
  function spokenWeight(t) {
    return t.replace(/125 mil/g, 'cento e vinte e cinco mil')
      .replace(/\b(19|20|18)\d\d\b/g, 'mil novecentos e noventa e seis')
      .replace(/\bXIX\b/g, 'dezenove').replace(/\b(20|30|70|80)\b/g, 'oitenta').replace(/\b24\b/g, 'vinte e quatro')
      .length + 6; // pausa entre frases
  }

  for (const c of chapters) {
    const lead = c.n === 0 || c.n === 10 ? 0.6 : 1.4; // deixa o card de capítulo respirar
    const t0 = c.start + lead, t1 = c.end - 0.6;
    const ws = c.segs.map(spokenWeight), total = ws.reduce((a, b) => a + b, 0);
    let acc = t0;
    c.segT = ws.map((w) => { const s = acc; acc += (w / total) * (t1 - t0); return { start: s, end: acc - 0.12 }; });
    c.shots.forEach((sh, i) => {
      sh.start = sh.at !== undefined ? c.start + sh.at : sh.s === 0 ? c.start : c.segT[sh.s].start - 0.25;
    });
    c.shots.forEach((sh, i) => { sh.end = i + 1 < c.shots.length ? c.shots[i + 1].start : c.end; sh.chapter = c; });
  }

  const TL = { REGION, chapters, P, duration: 585, fps: 30 };
  if (typeof module !== 'undefined') module.exports = TL; else root.TL = TL;
})(this);
