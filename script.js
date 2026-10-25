(() => {
  "use strict";

  /* cenas: tamanho em px da imagem e esconderijos.
     cada esconderijo é [x, y, a] em px da imagem: (x, y) é onde o Bulaxa
     pisa (centro da base) e "a" é a altura de uma pessoa naquele ponto,
     que dá a escala do recorte (perspectiva) */
  const CENAS = [
    {
      id: "praia", nome: "Praia", l: 3000, a: 1926, onde: "no meio da praia",
      alt: "Praia lotada do Onde está Wally, com centenas de banhistas, barcos no mar e burricos na areia.",
      esconderijos: [[2380, 560, 70], [380, 760, 75], [1450, 1180, 100], [2700, 1120, 105], [900, 1650, 130], [1780, 430, 55], [2050, 860, 85]]
    },
    {
      id: "trem", nome: "Estação de trem", l: 2048, a: 1280, onde: "na estação de trem",
      alt: "Estação de trem lotada do Onde está Wally, com plataformas cheias de passageiros, malas e trens chegando.",
      esconderijos: [[1290, 480, 55], [560, 920, 70], [1440, 760, 65], [1150, 1240, 90], [260, 520, 55], [1900, 330, 50], [880, 1080, 80]]
    },
    {
      id: "safari", nome: "Safári", l: 2048, a: 1378, onde: "no safári",
      alt: "Parque safári do Onde está Wally, com leões, girafas, elefantes, carros e um labirinto de plantas.",
      esconderijos: [[1620, 900, 60], [960, 820, 55], [430, 1180, 75], [1150, 1340, 90], [1770, 600, 45], [760, 900, 60], [1960, 1110, 70]]
    },
    {
      id: "aeroporto", nome: "Aeroporto", l: 2048, a: 1310, onde: "no aeroporto",
      alt: "Aeroporto lotado do Onde está Wally, com aviões, esteira de bagagens, caixas e passageiros correndo.",
      esconderijos: [[150, 1170, 80], [1420, 1000, 65], [250, 640, 55], [1300, 1290, 90], [1000, 310, 35], [300, 240, 40], [790, 900, 70]]
    },
    {
      id: "babel", nome: "Torre de Babel", l: 3200, a: 2342, onde: "na Torre de Babel",
      alt: "A Torre de Babel, pintura de Pieter Bruegel de 1563, com a torre enorme, operários, o rei e o porto.",
      esconderijos: [[708, 2183, 233], [1250, 1250, 32], [2167, 1775, 36], [2042, 1908, 40], [417, 1683, 40], [2750, 2133, 40], [2250, 1183, 30]]
    }
  ];

  /* recortes do Bulaxa para esconder: tamanho do arquivo e altura relativa à pessoa */
  const RECORTES = [
    { id: "orelhas", l: 203, a: 300, fator: 0.85 },
    { id: "filhote", l: 160, a: 300, fator: 0.7 },
    { id: "coleira", l: 205, a: 300, fator: 0.7 },
    { id: "focinho", l: 186, a: 300, fator: 0.65 },
    { id: "deitado", l: 236, a: 220, fator: 0.85 }
  ];

  /* fotos que aparecem quando acha */
  const FOTOS = [
    { id: "capuz", alt: "Bulaxa, um cachorro caramelo, de capuz cinza olhando para a câmera." },
    { id: "lencol", alt: "Só a cabeça do Bulaxa saindo de baixo do lençol." },
    { id: "lingua", alt: "Bulaxa feliz, de língua de fora." },
    { id: "dino", alt: "Bulaxa fantasiado de dinossauro verde." },
    { id: "peixe", alt: "Bulaxa de pijama segurando um peixe de pelúcia na boca." },
    { id: "olhos", alt: "Bulaxa no escuro com os olhos brilhando e uma mão acenando." },
    { id: "capa", alt: "Bulaxa de capuz preto em cima da cama." },
    { id: "camisa10", alt: "Bulaxa com a camisa 10 da seleção brasileira." },
    { id: "oculos", alt: "Bulaxa de moletom e óculos escuros espelhados." }
  ];

  /* rodada atual: cena, tamanho e retângulo do Bulaxa em px da imagem */
  let cenaAtual = null;
  let CENA_L = 1;
  let CENA_A = 1;
  let BULAXA = { x: 0, y: 0, w: 0, h: 0 };
  let ultimoRecorte = -1;
  let ultimaFoto = -1;

  /* tolerância extra do clique, em px de tela (ajuda no toque) */
  const FOLGA_TELA = 8;

  const palco = document.getElementById("palco");
  const camada = document.getElementById("camada");
  const cena = document.getElementById("cena");
  const fotoVitoria = document.getElementById("foto-vitoria");
  const escolha = document.getElementById("escolha-cena");
  const marcas = document.getElementById("marcas");
  const elMira = document.querySelector(".mira");
  const carregando = document.getElementById("carregando");
  const mensagem = document.getElementById("mensagem");
  const placar = document.getElementById("tentativas");
  const btnAmpliar = document.getElementById("ampliar");
  const btnReduzir = document.getElementById("reduzir");
  const btnAjustar = document.getElementById("ajustar");
  const btnDeNovoRodape = document.getElementById("denovo-rodape");
  const dialogo = document.getElementById("vitoria");
  const resumo = document.getElementById("vitoria-resumo");
  const btnDeNovo = document.getElementById("denovo");
  const btnVerCena = document.getElementById("ver-cena");

  const poucoMovimento = matchMedia("(prefers-reduced-motion: reduce)");
  const toque = matchMedia("(pointer: coarse)");

  const DICA = {
    toque: "Amplie com dois dedos, arraste para procurar e toque no Bulaxa quando encontrar.",
    mouse: "Role para ampliar, arraste para procurar e clique no Bulaxa quando encontrar.",
    teclado: "Setas movem a mira, + e − ampliam, 0 mostra a cena inteira. Enter escolhe o ponto da mira."
  };

  const ERROS = [
    "Esse não é o Bulaxa. Continue procurando.",
    "Nada de Bulaxa por aqui.",
    "Ali só tem gente.",
    "Não é ele. Olhe com mais calma."
  ];

  /* vista: escala (px de tela por px da imagem) e deslocamento */
  let vista = { s: 1, x: 0, y: 0 };
  let encaixe = 1;
  let larg = 0;
  let alt = 0;

  let pronta = false;
  let achou = false;
  let tentativas = 0;
  let inicio = 0;
  let ultimoErro = -1;
  let animacao = 0;
  let fimAnimacao = null;
  let mira = null; /* ponto da imagem onde está a mira do teclado */

  /* ---------- geometria ---------- */

  function limites() {
    return { min: encaixe, max: Math.max(2, encaixe * 3) };
  }

  function prender(v) {
    const { min, max } = limites();
    const s = Math.min(max, Math.max(min, v.s));
    const w = CENA_L * s;
    const h = CENA_A * s;
    const x = w <= larg ? (larg - w) / 2 : Math.min(0, Math.max(larg - w, v.x));
    const y = h <= alt ? (alt - h) / 2 : Math.min(0, Math.max(alt - h, v.y));
    return { s, x, y };
  }

  /* põe o ponto (nx, ny) da imagem na posição (px, py) do palco */
  function vistaCentradaEm(nx, ny, s, px = larg / 2, py = alt / 2) {
    return prender({ s, x: px - nx * s, y: py - ny * s });
  }

  function doCliente(clientX, clientY) {
    const r = palco.getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - r.top;
    return { px, py, nx: (px - vista.x) / vista.s, ny: (py - vista.y) / vista.s };
  }

  /* ---------- desenho ---------- */

  function desenhar() {
    cena.style.width = CENA_L * vista.s + "px";
    cena.style.height = CENA_A * vista.s + "px";
    camada.style.transform = `translate3d(${vista.x}px, ${vista.y}px, 0)`;

    for (const m of marcas.children) {
      if (m.classList.contains("marca-achou")) {
        const folga = 12;
        const w = Math.max(48, BULAXA.w * vista.s + folga * 2);
        const h = Math.max(48, BULAXA.h * vista.s + folga * 2);
        const cx = vista.x + (BULAXA.x + BULAXA.w / 2) * vista.s;
        const cy = vista.y + (BULAXA.y + BULAXA.h / 2) * vista.s;
        m.style.left = cx - w / 2 + "px";
        m.style.top = cy - h / 2 + "px";
        m.style.width = w + "px";
        m.style.height = h + "px";
      } else {
        m.style.left = vista.x + Number(m.dataset.nx) * vista.s + "px";
        m.style.top = vista.y + Number(m.dataset.ny) * vista.s + "px";
      }
    }

    if (mira) {
      elMira.style.left = vista.x + mira.nx * vista.s + "px";
      elMira.style.top = vista.y + mira.ny * vista.s + "px";
    }

    const { min, max } = limites();
    btnAmpliar.setAttribute("aria-disabled", String(vista.s >= max - 1e-6));
    btnReduzir.setAttribute("aria-disabled", String(vista.s <= min + 1e-6));
    btnAjustar.setAttribute("aria-disabled", String(vista.s <= min + 1e-6));
  }

  function aplicar(v) {
    vista = prender(v);
    desenhar();
  }

  /* interromper uma animação (toque, resize) ainda resolve quem esperava por ela */
  function pararAnimacao() {
    cancelAnimationFrame(animacao);
    animacao = 0;
    if (fimAnimacao) {
      const f = fimAnimacao;
      fimAnimacao = null;
      f();
    }
  }

  /* anima o ponto central e a escala (em log), para o zoom parecer natural */
  function animarPara(alvo, dur = 320) {
    pararAnimacao();
    alvo = prender(alvo);
    if (poucoMovimento.matches || dur <= 0 || document.hidden) {
      aplicar(alvo);
      return Promise.resolve();
    }
    const de = { ...vista };
    const c0 = { x: (larg / 2 - de.x) / de.s, y: (alt / 2 - de.y) / de.s };
    const c1 = { x: (larg / 2 - alvo.x) / alvo.s, y: (alt / 2 - alvo.y) / alvo.s };
    const t0 = performance.now();

    return new Promise((resolver) => {
      fimAnimacao = resolver;
      const passo = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        const s = de.s * Math.pow(alvo.s / de.s, e);
        const cx = c0.x + (c1.x - c0.x) * e;
        const cy = c0.y + (c1.y - c0.y) * e;
        aplicar(k < 1 ? { s, x: larg / 2 - cx * s, y: alt / 2 - cy * s } : alvo);
        if (k < 1) {
          animacao = requestAnimationFrame(passo);
        } else {
          animacao = 0;
          fimAnimacao = null;
          resolver();
        }
      };
      animacao = requestAnimationFrame(passo);
    });
  }

  function zoomEm(fator, px, py) {
    const nx = (px - vista.x) / vista.s;
    const ny = (py - vista.y) / vista.s;
    const s = vista.s * fator;
    aplicar({ s, x: px - nx * s, y: py - ny * s });
  }

  function zoomAnimado(fator) {
    const s = vista.s * fator;
    const nx = (larg / 2 - vista.x) / vista.s;
    const ny = (alt / 2 - vista.y) / vista.s;
    animarPara(vistaCentradaEm(nx, ny, s));
  }

  function ajustar() {
    animarPara({ s: encaixe, x: 0, y: 0 });
  }

  /* em tela em pé a cena inteira vira uma faixa fina: começa preenchendo a altura */
  function vistaInicial() {
    const preencher = Math.max(larg / CENA_L, alt / CENA_A);
    const s = alt > larg ? preencher : encaixe;
    return { s, x: (larg - CENA_L * s) / 2, y: (alt - CENA_A * s) / 2 };
  }

  /* mantém o mesmo trecho e o mesmo nível de zoom ao girar ou redimensionar */
  function medir() {
    const r = palco.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const tinhaMedida = larg > 0;
    const centro = tinhaMedida
      ? { x: (larg / 2 - vista.x) / vista.s, y: (alt / 2 - vista.y) / vista.s }
      : null;
    const zoom = tinhaMedida ? vista.s / encaixe : 1;

    larg = r.width;
    alt = r.height;
    encaixe = Math.min(larg / CENA_L, alt / CENA_A);

    pararAnimacao();
    aplicar(centro ? vistaCentradaEm(centro.x, centro.y, encaixe * zoom) : vistaInicial());
  }

  /* ---------- mensagens ---------- */

  function dizer(texto, tom = "") {
    mensagem.dataset.tom = tom;
    mensagem.textContent = texto;
  }

  function dicaInicial() {
    dizer(toque.matches ? DICA.toque : DICA.mouse);
  }

  function formatarTempo(ms) {
    const total = Math.max(1, Math.round(ms / 1000));
    const min = Math.floor(total / 60);
    const seg = total % 60;
    if (min === 0) return `${seg} s`;
    return seg === 0 ? `${min} min` : `${min} min ${seg} s`;
  }

  /* ---------- jogo ---------- */

  function palpite(clientX, clientY) {
    if (!pronta || achou) return;
    const p = doCliente(clientX, clientY);

    /* clique fora do palco ou nas faixas fora da imagem não conta */
    if (p.px < 0 || p.py < 0 || p.px > larg || p.py > alt) return;
    if (p.nx < 0 || p.ny < 0 || p.nx > CENA_L || p.ny > CENA_A) return;

    tentativas += 1;
    placar.textContent = String(tentativas);

    const folga = FOLGA_TELA / vista.s;
    const acertou =
      p.nx >= BULAXA.x - folga &&
      p.nx <= BULAXA.x + BULAXA.w + folga &&
      p.ny >= BULAXA.y - folga &&
      p.ny <= BULAXA.y + BULAXA.h + folga;

    if (acertou) {
      venceu();
    } else {
      errou(p);
    }
  }

  function errou(p) {
    const marca = document.createElement("div");
    marca.className = "marca-erro";
    marca.dataset.nx = String(p.nx);
    marca.dataset.ny = String(p.ny);
    marca.addEventListener("animationend", () => marca.remove(), { once: true });
    marcas.append(marca);
    desenhar();

    /* em tela pequena e sem zoom, o Bulaxa tem poucos pixels: sugerir ampliar */
    if (vista.s <= encaixe + 1e-6 && encaixe < 0.45) {
      dizer("Não é ele. Amplie a cena para ver os detalhes.", "erro");
      return;
    }
    let i;
    do {
      i = Math.floor(Math.random() * ERROS.length);
    } while (i === ultimoErro);
    ultimoErro = i;
    dizer(ERROS[i], "erro");
  }

  async function venceu() {
    achou = true;
    const tempo = performance.now() - inicio;
    palco.classList.add("achou");

    for (const m of [...marcas.querySelectorAll(".marca-erro")]) m.remove();
    const anel = document.createElement("div");
    anel.className = "marca-achou";
    marcas.append(anel);

    dizer(`Achou! Bulaxa estava ${cenaAtual.onde}.`, "achou");
    btnDeNovoRodape.hidden = false;

    const cx = BULAXA.x + BULAXA.w / 2;
    const cy = BULAXA.y + BULAXA.h / 2;
    const s = (Math.min(larg, alt) * 0.4) / BULAXA.h;
    await animarPara(vistaCentradaEm(cx, cy, s), 700);

    resumo.textContent =
      tentativas === 1
        ? `De primeira, em ${formatarTempo(tempo)}.`
        : `${tentativas} tentativas em ${formatarTempo(tempo)}.`;

    await esperar(poucoMovimento.matches ? 0 : 350);
    if (!achou) return;
    dialogo.showModal();

    /* se o painel cobrir o Bulaxa, move a cena para ele ficar na área livre */
    const rp = palco.getBoundingClientRect();
    const rd = dialogo.getBoundingClientRect();
    const livreEsquerda = rd.left - rp.left;
    const livreAcima = rd.top - rp.top;
    if (livreEsquerda > larg * 0.3) {
      animarPara(vistaCentradaEm(cx, cy, vista.s, livreEsquerda / 2, alt / 2), 450);
    } else if (livreAcima < alt * 0.85) {
      animarPara(vistaCentradaEm(cx, cy, vista.s, larg / 2, Math.max(80, livreAcima) / 2), 450);
    }
  }

  function esperar(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /* sorteia um índice de 0 a n-1 diferente de "evitar" (quando houver opção) */
  function sortear(n, evitar = -1) {
    if (n < 2) return 0;
    let i;
    do {
      i = Math.floor(Math.random() * n);
    } while (i === evitar);
    return i;
  }

  /* imagens já baixadas, por endereço (trocar de cena e voltar não baixa de novo) */
  const imagens = new Map();

  function carregar(src) {
    if (!imagens.has(src)) {
      const pedido = new Promise((resolver, rejeitar) => {
        const img = new Image();
        img.onload = () => resolver(img);
        img.onerror = () => rejeitar(new Error(src));
        img.src = src;
      });
      pedido.catch(() => imagens.delete(src));
      imagens.set(src, pedido);
    }
    return imagens.get(src);
  }

  /* esconde o Bulaxa: um esconderijo e um recorte sorteados; devolve o arquivo do recorte */
  function esconder() {
    const [x, y, a] = cenaAtual.esconderijos[sortear(cenaAtual.esconderijos.length)];
    ultimoRecorte = sortear(RECORTES.length, ultimoRecorte);
    const r = RECORTES[ultimoRecorte];
    const h = Math.round(a * r.fator);
    const w = Math.round((r.l * h) / r.a);
    BULAXA = { x: Math.round(x - w / 2), y: y - h, w, h };

    /* a foto do final já vai carregando */
    ultimaFoto = sortear(FOTOS.length, ultimaFoto);
    const f = FOTOS[ultimaFoto];
    fotoVitoria.src = `assets/bulaxa/foto-${f.id}.webp`;
    fotoVitoria.alt = f.alt;

    return `assets/bulaxa/esconde-${r.id}.webp`;
  }

  /* desenha cena e Bulaxa juntos no canvas: assim ele nunca aparece antes da cena */
  async function montarCena(pedida, recorte) {
    try {
      const [fundo, bulaxa] = await Promise.all([carregar(`assets/cenas/${pedida.id}.webp`), carregar(recorte)]);
      if (pedida !== cenaAtual) return;
      cena.width = CENA_L;
      cena.height = CENA_A;
      const ctx = cena.getContext("2d");
      ctx.drawImage(fundo, 0, 0, CENA_L, CENA_A);
      ctx.drawImage(bulaxa, BULAXA.x, BULAXA.y, BULAXA.w, BULAXA.h);
      cenaPronta();
    } catch {
      if (pedida === cenaAtual) {
        carregando.textContent = "Não foi possível carregar a cena. Recarregue a página.";
      }
    }
  }

  /* começa uma rodada na cena pedida (ou numa sorteada, diferente da atual) */
  function novaRodada(id) {
    const anterior = cenaAtual;
    cenaAtual = id
      ? CENAS.find((c) => c.id === id) || CENAS[0]
      : CENAS[sortear(CENAS.length, CENAS.indexOf(anterior))];
    escolha.value = cenaAtual.id;

    achou = false;
    tentativas = 0;
    placar.textContent = "0";
    palco.classList.remove("achou");
    marcas.replaceChildren();
    btnDeNovoRodape.hidden = true;
    if (dialogo.open) dialogo.close();
    mira = null;
    const recorte = esconder();
    dicaInicial();

    palco.setAttribute("aria-label", `Cena: ${cenaAtual.nome}`);
    cena.setAttribute("aria-label", cenaAtual.alt);
    pronta = false;
    pararAnimacao();
    palco.classList.remove("pronta");
    carregando.textContent = `Carregando: ${cenaAtual.nome}…`;
    carregando.hidden = false;
    CENA_L = cenaAtual.l;
    CENA_A = cenaAtual.a;
    if (larg > 0) {
      encaixe = Math.min(larg / CENA_L, alt / CENA_A);
      aplicar(vistaInicial());
    }
    montarCena(cenaAtual, recorte);
  }

  function reiniciar() {
    novaRodada();
    palco.focus({ preventScroll: true });
  }

  /* ---------- ponteiro: arrastar, pinçar e tocar ---------- */

  const ponteiros = new Map();
  let gesto = null;

  function meio(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function distancia(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  }

  function comecarArrasto(x, y, tipo) {
    gesto = { tipo, x0: x, y0: y, vx: vista.x, vy: vista.y };
  }

  palco.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pararAnimacao();
    try {
      palco.setPointerCapture(e.pointerId);
    } catch {
      /* ponteiro já liberado: segue sem captura */
    }
    ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (ponteiros.size === 1) {
      comecarArrasto(e.clientX, e.clientY, "toque");
      gesto.limiar = e.pointerType === "mouse" ? 4 : 10;
    } else if (ponteiros.size === 2) {
      const [a, b] = [...ponteiros.values()];
      const m = meio(a, b);
      const p = doCliente(m.x, m.y);
      gesto = { tipo: "pinca", d0: distancia(a, b), s0: vista.s, nx: p.nx, ny: p.ny };
      palco.classList.add("arrastando");
    }
  });

  palco.addEventListener("pointermove", (e) => {
    if (!ponteiros.has(e.pointerId) || !gesto) return;
    ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (gesto.tipo === "pinca") {
      const [a, b] = [...ponteiros.values()];
      const m = meio(a, b);
      const r = palco.getBoundingClientRect();
      const s = gesto.s0 * (distancia(a, b) / gesto.d0);
      aplicar({ s, x: m.x - r.left - gesto.nx * s, y: m.y - r.top - gesto.ny * s });
      return;
    }

    const dx = e.clientX - gesto.x0;
    const dy = e.clientY - gesto.y0;
    if (gesto.tipo === "toque" && Math.hypot(dx, dy) > gesto.limiar) {
      gesto.tipo = "arrasto";
      palco.classList.add("arrastando");
    }
    if (gesto.tipo === "arrasto") {
      aplicar({ s: vista.s, x: gesto.vx + dx, y: gesto.vy + dy });
    }
  });

  function soltar(e) {
    if (!ponteiros.has(e.pointerId)) return;
    const anterior = gesto;
    ponteiros.delete(e.pointerId);

    if (anterior && anterior.tipo === "toque" && e.type === "pointerup" && ponteiros.size === 0) {
      palpite(e.clientX, e.clientY);
    }

    if (ponteiros.size === 0) {
      gesto = null;
      palco.classList.remove("arrastando");
    } else if (ponteiros.size === 1) {
      /* saiu um dedo da pinça: continua arrastando com o outro, sem contar como toque */
      const [p] = [...ponteiros.values()];
      comecarArrasto(p.x, p.y, "arrasto");
    }
  }

  palco.addEventListener("pointerup", soltar);
  palco.addEventListener("pointercancel", soltar);
  palco.addEventListener("lostpointercapture", soltar);

  palco.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      pararAnimacao();
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 16;
      else if (e.deltaMode === 2) d *= alt;
      const fator = Math.exp(-d * (e.ctrlKey ? 0.01 : 0.0015));
      const r = palco.getBoundingClientRect();
      zoomEm(fator, e.clientX - r.left, e.clientY - r.top);
    },
    { passive: false }
  );

  /* Safari no Mac: impede o zoom da página ao pinçar no trackpad */
  palco.addEventListener("gesturestart", (e) => e.preventDefault());
  palco.addEventListener("contextmenu", (e) => {
    if (e.pointerType !== "mouse") e.preventDefault();
  });

  /* ---------- teclado ---------- */

  function miraNaTela() {
    return { x: vista.x + mira.nx * vista.s, y: vista.y + mira.ny * vista.s };
  }

  /* a mira começa no centro; se saiu da tela (por arrasto ou zoom), volta para o centro */
  function prepararMira() {
    if (mira) {
      const m = miraNaTela();
      if (m.x >= 0 && m.x <= larg && m.y >= 0 && m.y <= alt) return;
    }
    mira = {
      nx: Math.min(CENA_L, Math.max(0, (larg / 2 - vista.x) / vista.s)),
      ny: Math.min(CENA_A, Math.max(0, (alt / 2 - vista.y) / vista.s))
    };
    desenhar();
  }

  /* move a mira pela imagem inteira; perto da borda do palco, a cena rola junto */
  function moverMira(dx, dy) {
    mira.nx = Math.min(CENA_L, Math.max(0, mira.nx + dx / vista.s));
    mira.ny = Math.min(CENA_A, Math.max(0, mira.ny + dy / vista.s));
    const m = miraNaTela();
    const bx = larg * 0.25;
    const by = alt * 0.25;
    const alvoX = Math.min(larg - bx, Math.max(bx, m.x));
    const alvoY = Math.min(alt - by, Math.max(by, m.y));
    aplicar({ s: vista.s, x: vista.x + alvoX - m.x, y: vista.y + alvoY - m.y });
  }

  function zoomNaMira(fator) {
    const m = miraNaTela();
    animarPara(vistaCentradaEm(mira.nx, mira.ny, vista.s * fator, m.x, m.y));
  }

  palco.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const passo = (e.shiftKey ? 0.25 : 0.06) * Math.min(larg, alt);

    switch (e.key) {
      case "ArrowLeft":
        prepararMira();
        moverMira(-passo, 0);
        break;
      case "ArrowRight":
        prepararMira();
        moverMira(passo, 0);
        break;
      case "ArrowUp":
        prepararMira();
        moverMira(0, -passo);
        break;
      case "ArrowDown":
        prepararMira();
        moverMira(0, passo);
        break;
      case "+":
      case "=":
        prepararMira();
        zoomNaMira(1.5);
        break;
      case "-":
      case "_":
        prepararMira();
        zoomNaMira(1 / 1.5);
        break;
      case "0":
        ajustar();
        break;
      case "Enter":
      case " ": {
        prepararMira();
        const m = miraNaTela();
        const r = palco.getBoundingClientRect();
        palpite(r.left + m.x, r.top + m.y);
        break;
      }
      default:
        return;
    }
    e.preventDefault();
  });

  palco.addEventListener("focus", () => {
    prepararMira();
    if (!achou && palco.matches(":focus-visible")) dizer(DICA.teclado);
  });

  palco.addEventListener("blur", () => {
    if (!achou && mensagem.textContent === DICA.teclado) dicaInicial();
  });

  /* ---------- botões ---------- */

  function seAtivo(botao, acao) {
    botao.addEventListener("click", () => {
      if (botao.getAttribute("aria-disabled") !== "true") acao();
    });
  }

  seAtivo(btnAmpliar, () => zoomAnimado(1.6));
  seAtivo(btnReduzir, () => zoomAnimado(1 / 1.6));
  seAtivo(btnAjustar, ajustar);
  btnDeNovo.addEventListener("click", reiniciar);
  btnDeNovoRodape.addEventListener("click", reiniciar);
  btnVerCena.addEventListener("click", () => dialogo.close());

  /* ---------- início ---------- */

  function cenaPronta() {
    pronta = true;
    inicio = performance.now();
    carregando.hidden = true;
    palco.classList.add("pronta");
  }

  for (const c of CENAS) escolha.add(new Option(c.nome, c.id));
  escolha.addEventListener("change", () => novaRodada(escolha.value));

  novaRodada();
  new ResizeObserver(medir).observe(palco);
  medir();
})();
