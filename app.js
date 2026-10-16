/* ==========================================================================
   PRO PLAYER ACADEMY — app.js
   Núcleo compartilhado: configuração, armazenamento local, utilitários,
   cabeçalho/rodapé, toasts, modais, dados demonstrativos e a página inicial.
   Todos os dados ficam no localStorage do navegador (não há backend).
   ========================================================================== */
(function (w, d) {
  'use strict';

  /* ---------- Constantes ---------- */
  var ELOS = ['Ferro', 'Bronze', 'Prata', 'Ouro', 'Platina', 'Esmeralda', 'Diamante', 'Mestre', 'Grão-Mestre', 'Desafiante'];
  var ROLES = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
  var THEMES = [
    ['macro', 'Macro'], ['micro', 'Micro'], ['farm', 'Farm'],
    ['wave', 'Controle de wave'], ['posicionamento', 'Posicionamento'], ['teamfights', 'Team fights']
  ];
  var STATUS = ['solicitado', 'em contato', 'concluído', 'cancelado'];

  /* ---------- Configuração padrão (editável em Admin > Configurações) ---------- */
  var DEFAULT_SITE = {
    brand: 'PRO PLAYER ACADEMY',
    proName: 'Nome do Pro Player',
    heroTitle: 'Pare de jogar no automático. Comece a jogar com estratégia.',
    heroSub: 'Treinamentos estruturados, exercícios práticos e coaching individual para você entender o jogo, tomar melhores decisões e evoluir com método.',
    about: 'Espaço reservado para a apresentação profissional: trajetória, times, funções dominadas e a filosofia de ensino. Edite este texto no painel administrativo.',
    peak: '—',
    mainRoles: '—',
    achievements: [
      'Conquista competitiva #1 | Espaço reservado — insira apenas resultados verificáveis.',
      'Conquista competitiva #2 | Espaço reservado — informe campeonato, ano e colocação.',
      'Histórico profissional | Espaço reservado — times, períodos e funções.'
    ],
    whatsapp: '',            // somente dígitos com DDI, ex.: 5511999999999
    email: 'contato@exemplo.com',
    youtubeIds: '',          // IDs de vídeos do YouTube separados por vírgula
    social: { youtube: '', instagram: '', twitter: '', discord: '' }
  };

  /* ---------- Armazenamento local ---------- */
  var Store = {
    get: function (k, def) {
      try { var v = w.localStorage.getItem('ppa:' + k); return v ? JSON.parse(v) : def; }
      catch (e) { return def; }
    },
    set: function (k, v) {
      try { w.localStorage.setItem('ppa:' + k, JSON.stringify(v)); return true; }
      catch (e) { toast('Não foi possível salvar neste navegador (armazenamento indisponível ou cheio).', 'error'); return false; }
    },
    remove: function (k) { try { w.localStorage.removeItem('ppa:' + k); } catch (e) { /* ignora */ } },
    clearAll: function () {
      try {
        Object.keys(w.localStorage).filter(function (k) { return k.indexOf('ppa:') === 0; })
          .forEach(function (k) { w.localStorage.removeItem(k); });
      } catch (e) { /* ignora */ }
    }
  };

  /* ---------- Utilitários ---------- */
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function brl(n) { return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function fmtDate(ts) { return new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); }
  function slug(s) { return String(s).toLowerCase().replace(/\s+/g, '-'); }
  function isHttpUrl(u) { try { var x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:'; } catch (e) { return false; } }

  function getSite() {
    var s = Store.get('site', {});
    var site = Object.assign({}, DEFAULT_SITE, s);
    site.social = Object.assign({}, DEFAULT_SITE.social, s.social || {});
    return site;
  }
  function saveSite(s) { return Store.set('site', s); }

  /* Link de WhatsApp (retorna null se o número não estiver configurado) */
  function waLink(text) {
    var n = String(getSite().whatsapp || '').replace(/\D/g, '');
    if (n.length < 10) return null;
    return 'https://wa.me/' + n + '?text=' + encodeURIComponent(text || '');
  }

  /* ---------- Toasts ---------- */
  function toast(msg, type) {
    var box = $('#toasts');
    if (!box) {
      box = d.createElement('div'); box.id = 'toasts';
      box.setAttribute('aria-live', 'polite'); box.setAttribute('role', 'status');
      d.body.appendChild(box);
    }
    var t = d.createElement('div');
    t.className = 'toast ' + (type || 'info');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () { t.remove(); }, type === 'error' ? 6500 : 4000);
  }

  /* ---------- Modal ---------- */
  var lastFocus = null;
  function closeModal() {
    var ov = $('.modal-overlay');
    if (ov) { ov.remove(); d.body.classList.remove('modal-open'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  }
  function openModal(opts) {
    closeModal();
    lastFocus = d.activeElement;
    var ov = d.createElement('div');
    ov.className = 'modal-overlay';
    ov.innerHTML = '<div class="modal' + (opts.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      '<div class="modal-head"><h2 id="modal-title">' + esc(opts.title) + '</h2>' +
      '<button type="button" class="icon-btn" data-close aria-label="Fechar">✕</button></div>' +
      '<div class="modal-body">' + opts.html + '</div></div>';
    d.body.appendChild(ov);
    d.body.classList.add('modal-open');
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) closeModal(); });
    ov.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeModal(); });
    ov.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'Tab') { /* prende o foco dentro do modal */
        var f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', ov).filter(function (x) { return !x.disabled; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var body = $('.modal-body', ov);
    var focusTarget = $('input, select, textarea, .btn', body) || $('[data-close]', ov);
    if (focusTarget) focusTarget.focus();
    return body;
  }
  function confirmDialog(message, okLabel) {
    return new Promise(function (resolve) {
      var body = openModal({
        title: 'Confirmar ação',
        html: '<p>' + esc(message) + '</p><div class="modal-actions">' +
          '<button type="button" class="btn btn-ghost" data-no>Cancelar</button>' +
          '<button type="button" class="btn btn-danger" data-yes>' + esc(okLabel || 'Confirmar') + '</button></div>'
      });
      body.querySelector('[data-yes]').addEventListener('click', function () { closeModal(); resolve(true); });
      body.querySelector('[data-no]').addEventListener('click', function () { closeModal(); resolve(false); });
      body.closest('.modal-overlay').addEventListener('click', function (e) { if (e.target.closest('[data-close]')) resolve(false); });
    });
  }

  /* ---------- Dados demonstrativos: cursos ---------- */
  function mods(list) { /* 'Título do módulo: aula 1|aula 2' */
    return list.map(function (m) {
      var p = m.split(':');
      return { title: p[0].trim(), lessons: p[1].split('|').map(function (x) { return x.trim(); }) };
    });
  }
  var SEED_COURSES = [
    {
      id: 'c1', title: 'ADC do Zero ao Diamante: Fundamentos de Rota', role: 'ADC', theme: 'farm', eloMin: 0, eloMax: 4, price: 197, hue: 280, featured: true, active: true,
      description: 'Construa uma base sólida de farm, trocas e posicionamento na rota inferior.',
      long: 'Curso demonstrativo que organiza os fundamentos do ADC em uma sequência prática: farm consistente, leitura de trocas, uso de recursos e posicionamento na rota.',
      objectives: ['Melhorar o farm com rotinas de treino', 'Entender quando trocar dano e quando recuar', 'Posicionar-se com segurança na rota', 'Revisar partidas com um checklist'],
      audience: ['Jogadores de ADC entre Ferro e Platina', 'Quem sente que perde a rota sem entender o motivo'],
      modules: mods(['Farm e último golpe: Rotina de treino de CS|Last hit com campeões de alcance|Farm sob torre', 'Trocas de dano: Janelas de troca|Leitura de cooldowns|Quando recuar', 'Posicionamento: Distância segura|Posição pós-abate|Revisão de partida'])
    },
    {
      id: 'c2', title: 'Controle de Wave para Todas as Funções', role: 'Todas', theme: 'wave', eloMin: 1, eloMax: 6, price: 147, hue: 140, featured: true, active: true,
      description: 'Congelar, empurrar e puxar: domine as waves e crie vantagem sem depender de abates.',
      long: 'Demonstração de um mini curso focado em controle de wave: como decidir o estado da wave e usar isso para criar vantagem de mapa.',
      objectives: ['Reconhecer os estados da wave', 'Aplicar freeze, slow push e fast push', 'Sincronizar a wave com recalls e objetivos'],
      audience: ['Jogadores de qualquer função', 'Quem perde rota por dar a wave para o oponente'],
      modules: mods(['Conceitos: Estados da wave|Contagem de minions', 'Técnicas: Freeze|Slow push|Fast push', 'Aplicação: Wave e recall|Wave e objetivos'])
    },
    {
      id: 'c3', title: 'Posicionamento em Team Fights', role: 'Todas', theme: 'teamfights', eloMin: 3, eloMax: 7, price: 249, hue: 215, featured: true, active: true,
      description: 'Entenda onde ficar, quando entrar e como sobreviver para causar dano.',
      long: 'Conteúdo demonstrativo sobre fases de uma luta de equipe, prioridade de alvos e posicionamento por função.',
      objectives: ['Identificar o papel da sua função na luta', 'Escolher alvos com critério', 'Evitar mortes por posicionamento'],
      audience: ['Jogadores de Ouro a Mestre', 'Quem morre cedo nas lutas'],
      modules: mods(['Fundamentos: Fases da luta|Frontline e backline', 'Por função: Carries|Engage|Peel', 'Revisão: Análise de lutas|Checklist de decisão'])
    },
    {
      id: 'c4', title: 'Macro Game: Objetivos e Rotações', role: 'Jungle', theme: 'macro', eloMin: 3, eloMax: 8, price: 297, hue: 330, featured: false, active: true,
      description: 'Priorize objetivos, rotacione com propósito e converta vantagens em vitória.',
      long: 'Curso demonstrativo de macro para jungle: caminhos, timers, prioridades e como transformar vantagem em objetivos.',
      objectives: ['Planejar o caminho do jungle', 'Priorizar objetivos por contexto', 'Rotacionar com a equipe'],
      audience: ['Jungles de Ouro a Grão-Mestre'],
      modules: mods(['Planejamento: Rotas iniciais|Timers', 'Objetivos: Dragões|Barão e arauto', 'Decisão: Quando forçar|Quando recuar'])
    },
    {
      id: 'c5', title: 'Mecânica e Micro: Trocas de Dano no Mid', role: 'Mid', theme: 'micro', eloMin: 2, eloMax: 6, price: 177, hue: 190, featured: false, active: true,
      description: 'Refine mecânicas, cancelamentos e trocas curtas para vencer a rota central.',
      long: 'Demonstração de conteúdo de micro: padrões de movimento, trocas curtas e uso de habilidades em janelas.',
      objectives: ['Aperfeiçoar movimentação', 'Executar trocas curtas', 'Gerenciar mana e cooldowns'],
      audience: ['Jogadores de Mid de Prata a Diamante'],
      modules: mods(['Movimentação: Kiting básico|Esquiva de habilidades', 'Trocas: Trocas curtas|Janelas de dano'])
    },
    {
      id: 'c6', title: 'Suporte Estratégico: Visão e Engage', role: 'Support', theme: 'posicionamento', eloMin: 1, eloMax: 5, price: 167, hue: 50, featured: false, active: true,
      description: 'Controle de visão, proteção do carry e engages com intenção.',
      long: 'Mini curso demonstrativo para suporte: posicionamento, visão e comunicação com o ADC e o jungle.',
      objectives: ['Planejar visão por fase do jogo', 'Posicionar-se para proteger ou iniciar', 'Comunicar-se com a rota'],
      audience: ['Suportes de Bronze a Esmeralda'],
      modules: mods(['Visão: Wards de rota|Controle de mapa', 'Engage e peel: Quando iniciar|Proteger o carry'])
    },
    {
      id: 'c7', title: 'Top Lane: Waves, Teleport e Macro', role: 'Top', theme: 'macro', eloMin: 2, eloMax: 7, price: 187, hue: 20, featured: false, active: true,
      description: 'Use a ilha do top para criar vantagem: wave, teleport e side lane.',
      long: 'Conteúdo demonstrativo sobre decisões do top: quando pressionar, quando usar teleport e como dividir o mapa.',
      objectives: ['Gerenciar wave sob pressão', 'Decidir o uso do teleport', 'Aplicar pressão de side lane'],
      audience: ['Jogadores de Top de Prata a Mestre'],
      modules: mods(['Wave no top: Freeze|Controle sob torre', 'Teleport: Quando usar|Teleport e objetivos', 'Side lane: Pressão|Split push'])
    }
  ];

  function getCourses() {
    var c = Store.get('courses', null);
    if (!c) { c = JSON.parse(JSON.stringify(SEED_COURSES)); Store.set('courses', c); }
    return c;
  }
  function saveCourses(c) { return Store.set('courses', c); }
  function countLessons(c) { return c.modules.reduce(function (n, m) { return n + m.lessons.length; }, 0); }
  function eloRange(c) { return c.eloMin === c.eloMax ? ELOS[c.eloMin] : ELOS[c.eloMin] + ' – ' + ELOS[c.eloMax]; }
  function themeLabel(k) { var t = THEMES.filter(function (x) { return x[0] === k; })[0]; return t ? t[1] : k; }

  /* Capa gerada em SVG (sem imagens externas, leve e sem direitos autorais) */
  function cover(c) {
    var h = Number(c.hue) || 270, h2 = (h + 60) % 360;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + h + ',70%,22%)"/><stop offset="1" stop-color="hsl(' + h2 + ',70%,10%)"/></linearGradient></defs>' +
      '<rect width="640" height="360" fill="url(#g)"/>' +
      '<g fill="none" stroke="hsl(' + h + ',90%,65%)" stroke-opacity=".25" stroke-width="2">' +
      '<path d="M0 300 L640 60"/><path d="M0 340 L640 100"/><circle cx="470" cy="150" r="90"/><circle cx="470" cy="150" r="140"/></g>' +
      '<polygon points="470,70 540,110 540,190 470,230 400,190 400,110" fill="hsl(' + h + ',90%,60%)" fill-opacity=".18" stroke="hsl(' + h + ',90%,70%)" stroke-width="3"/>' +
      '<text x="36" y="300" font-family="Segoe UI,Arial" font-weight="800" font-size="54" fill="#fff" fill-opacity=".92">' + esc(String(c.role).toUpperCase()) + '</text>' +
      '<text x="38" y="330" font-family="Segoe UI,Arial" font-size="18" fill="#fff" fill-opacity=".65" letter-spacing="3">' + esc(themeLabel(c.theme).toUpperCase()) + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function courseCard(c) {
    var href = '#/curso/' + encodeURIComponent(c.id);
    return '<article class="card course-card">' +
      '<a class="cover" href="' + href + '" tabindex="-1" aria-hidden="true"><img src="' + cover(c) + '" alt="" loading="lazy" width="640" height="360"></a>' +
      '<div class="card-body"><div class="chips"><span class="chip role">' + esc(c.role) + '</span><span class="chip elo">' + esc(eloRange(c)) + '</span><span class="chip">' + esc(themeLabel(c.theme)) + '</span></div>' +
      '<h3><a href="' + href + '">' + esc(c.title) + '</a></h3><p>' + esc(c.description) + '</p>' +
      '<ul class="meta"><li>📚 ' + c.modules.length + ' módulos</li><li>🎬 ' + countLessons(c) + ' aulas</li></ul>' +
      '<div class="card-foot"><div class="price"><small>Preço demonstrativo</small>' + brl(c.price) + '</div>' +
      '<a class="btn btn-sm" href="' + href + '">Ver detalhes</a></div></div></article>';
  }

  /* ---------- Aluno (compartilhado: curso.js grava matrícula, aluno.js lê) ---------- */
  function defaultStudent() {
    return {
      name: 'Invocador', eloAtual: 'Ouro', eloDesejado: 'Diamante', role: 'ADC', champs: ['Jinx', "Kai'Sa"],
      difficulties: '', objective: '', enrolled: ['c1', 'c2'], done: { c1: ['0-0'] },
      goals: {}, weekly: [], activity: [{ ts: Date.now(), text: 'Painel demonstrativo criado neste navegador.' }]
    };
  }
  function getStudent() { return Object.assign(defaultStudent(), Store.get('student', {})); }
  function saveStudent(s) { return Store.set('student', s); }
  function logActivity(s, text) { s.activity.unshift({ ts: Date.now(), text: text }); s.activity = s.activity.slice(0, 100); }

  /* ---------- Layout: cabeçalho e rodapé ---------- */
  var PAGES = [['#/', 'Início', 'home'], ['#/cursos', 'Cursos', 'cursos'], ['#/coaching', 'Coaching', 'coaching'], ['#/aluno', 'Área do aluno', 'aluno'], ['#/admin', 'Admin (demo)', 'admin']];

  function renderLayout() {
    var site = getSite();
        var mark = '<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="none" stroke="#a855f7" stroke-width="2.5"/><path d="M12 25 L20 10 L28 25 L20 21 Z" fill="#b6ff3c"/></svg>';
    var hdr = $('#site-header');
    if (hdr) {
      hdr.innerHTML = '<div class="demo-strip">Versão de demonstração: dados fictícios e salvos apenas neste navegador (localStorage).</div>' +
        '<header class="site-header"><div class="container nav"><a class="brand" href="#/">' + mark + '<span>' + esc(site.brand) + '</span></a>' +
        '<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="nav-menu" aria-label="Abrir menu">☰</button>' +
        '<nav id="nav-menu" class="nav-menu" aria-label="Principal">' +
        PAGES.map(function (p) { return '<a href="' + p[0] + '"' + '' + '>' + p[1] + '</a>'; }).join('') +
        '</nav></div></header>';
      var tg = $('.nav-toggle', hdr), menu = $('#nav-menu', hdr);
      tg.addEventListener('click', function () {
        var open = menu.classList.toggle('open');
        tg.setAttribute('aria-expanded', String(open));
        tg.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      });
      d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { menu.classList.remove('open'); tg.setAttribute('aria-expanded', 'false'); tg.focus(); } });
    }
    var ftr = $('#site-footer');
    if (ftr) {
      var soc = [['youtube', 'YouTube'], ['instagram', 'Instagram'], ['twitter', 'X / Twitter'], ['discord', 'Discord']].map(function (s) {
        var u = site.social[s[0]];
        return '<li>' + (u && isHttpUrl(u) ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + s[1] + '</a>'
          : '<button type="button" class="link-btn" data-unconfigured="' + s[1] + '">' + s[1] + '</button>') + '</li>';
      }).join('');
      ftr.innerHTML = '<footer class="site-footer"><div class="container"><div class="footer-grid">' +
        '<div><div class="brand">' + mark + '<span>' + esc(site.brand) + '</span></div><p class="muted" style="margin-top:12px">Plataforma demonstrativa de cursos e coaching de League of Legends com ' + esc(site.proName) + '.</p></div>' +
        '<div><h4>Navegação</h4><ul>' + PAGES.map(function (p) { return '<li><a href="' + p[0] + '">' + p[1] + '</a></li>'; }).join('') + '</ul></div>' +
        '<div><h4>Contato e redes</h4><ul><li><a href="mailto:' + esc(site.email) + '">' + esc(site.email) + '</a></li>' + soc +
        '<li><button type="button" class="link-btn" data-legal="termos">Termos de uso</button></li>' +
        '<li><button type="button" class="link-btn" data-legal="privacidade">Política de privacidade</button></li></ul></div></div>' +
        '<p class="legal">© ' + new Date().getFullYear() + ' ' + esc(site.brand) + ' — projeto demonstrativo. Informações comerciais (razão social, CNPJ, endereço) devem ser inseridas antes de qualquer venda real. ' +
        'Este site não é endossado pela Riot Games e não reflete as opiniões da Riot Games ou de quem trabalha com League of Legends. League of Legends e Riot Games são marcas registradas da Riot Games, Inc.</p></div></footer>';
    }
    d.addEventListener('click', function (e) {
      var u = e.target.closest('[data-unconfigured]');
      if (u) toast(u.getAttribute('data-unconfigured') + ' ainda não configurado. Defina o link em Admin > Configurações.', 'info');
      var l = e.target.closest('[data-legal]');
      if (l) {
        var t = l.getAttribute('data-legal') === 'termos';
        openModal({
          title: t ? 'Termos de uso (modelo)' : 'Política de privacidade (modelo)',
          html: t
            ? '<p>Texto-modelo para demonstração. Esta versão não realiza vendas, não processa pagamentos e não oferece garantia de evolução de elo. Antes de operar comercialmente, substitua por termos redigidos por profissional jurídico, com regras de compra, reembolso e uso do conteúdo.</p>'
            : '<p>Texto-modelo para demonstração. Nesta versão os dados informados são gravados somente no seu navegador (localStorage) e não são enviados a nenhum servidor. Ao enviar uma solicitação por WhatsApp, os dados são compartilhados com esse serviço por sua ação. Substitua por uma política adequada à LGPD antes de coletar dados reais.</p>'
        });
      }
    });
  }

  /* ---------- Página inicial ---------- */
  function renderHome() {
    var site = getSite();
    $$('[data-site]').forEach(function (el) { el.textContent = site[el.getAttribute('data-site')]; });

    var feat = $('#featured-courses');
    if (feat) {
      var list = getCourses().filter(function (c) { return c.active; });
      var f = list.filter(function (c) { return c.featured; });
      if (!f.length) f = list;
      feat.innerHTML = f.slice(0, 3).map(courseCard).join('') || '<div class="empty">Nenhum curso ativo. Cadastre cursos em Admin.</div>';
    }

    var ach = $('#achievements');
    if (ach) {
      ach.innerHTML = site.achievements.filter(Boolean).map(function (a) {
        var p = a.split('|');
        return '<div class="card achievement static"><span class="ico" aria-hidden="true">🏆</span><div><h3>' + esc(p[0].trim()) + '</h3><p class="muted" style="margin:0">' + esc((p[1] || '').trim()) + '</p></div></div>';
      }).join('');
    }

    var vids = $('#videos');
    if (vids) {
      var ids = String(site.youtubeIds || '').split(',').map(function (x) { return x.trim(); }).filter(function (x) { return /^[\w-]{11}$/.test(x); });
      if (!ids.length) {
        vids.innerHTML = '<div class="video-box"><div><p>▶ Espaço para vídeo do YouTube</p><p class="muted">Informe os IDs dos vídeos em Admin &gt; Configurações.</p><a class="btn btn-sm btn-ghost" href="#/admin/config">Configurar</a></div></div>';
      } else {
        vids.innerHTML = ids.slice(0, 2).map(function (id) {
          return '<div class="video-box"><button type="button" class="btn btn-primary" data-yt="' + id + '">▶ Carregar vídeo</button></div>';
        }).join('');
        vids.onclick = function (e) {
          var b = e.target.closest('[data-yt]'); if (!b) return;
          var box = b.parentNode;
          box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + b.getAttribute('data-yt') + '?autoplay=1" title="Vídeo do YouTube" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
        };
      }
    }
  }

  /* ---------- Roteador (página única: #/home, #/cursos, #/curso/ID, #/coaching, #/aluno[/aba], #/admin[/aba]) ---------- */
  var routes = {};            /* cada módulo registra routes[nome] = function (arg) {...} */
  var TITLES = { home: 'Cursos e coaching de League of Legends', cursos: 'Cursos', curso: 'Curso', coaching: 'Coaching', aluno: 'Área do aluno (demo)', admin: 'Admin (demo)' };

  function navigate() {
    var h = w.location.hash;
    if (h && h.indexOf('#/') !== 0) return;           /* ignora âncoras como #main */
    var parts = h.slice(2).split('/').map(decodeURIComponent);
    var name = parts[0] || 'home';
    if (!routes[name] && name !== 'home') name = 'home';
    $$('[data-view]').forEach(function (v) {
      var on = v.getAttribute('data-view') === name;
      v.hidden = !on;
      if (on) v.id = 'main'; else v.removeAttribute('id');
    });
    $$('.nav-menu a').forEach(function (a) {
      var cur = a.getAttribute('href') === '#/' + (name === 'home' ? '' : (name === 'curso' ? 'cursos' : name));
      if (cur) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var menu = $('#nav-menu'); if (menu) menu.classList.remove('open');
    d.title = TITLES[name] + ' — ' + getSite().brand;
    if (name === 'home') renderHome(); else routes[name](parts[1]);
    closeModal();
    w.scrollTo(0, 0);
  }

  function init() {
    renderLayout();
    w.addEventListener('hashchange', navigate);
    navigate();
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
  /* API pública usada pelos demais scripts */
  w.PPA = {
    ELOS: ELOS, ROLES: ROLES, THEMES: THEMES, STATUS: STATUS, DEFAULT_SITE: DEFAULT_SITE, SEED_COURSES: SEED_COURSES,
    routes: routes, navigate: navigate, Store: Store, $: $, $$: $$, esc: esc, brl: brl, uid: uid, fmtDate: fmtDate, slug: slug, isHttpUrl: isHttpUrl,
    getSite: getSite, saveSite: saveSite, waLink: waLink, toast: toast, openModal: openModal, closeModal: closeModal, confirmDialog: confirmDialog,
    getCourses: getCourses, saveCourses: saveCourses, countLessons: countLessons, eloRange: eloRange, themeLabel: themeLabel,
    cover: cover, courseCard: courseCard, getStudent: getStudent, saveStudent: saveStudent, logActivity: logActivity
  };
})(window, document);

/* ==========================================================================
   PRO PLAYER ACADEMY — cursos.js
   Catálogo (filtros, busca, ordenação) e página de detalhes do curso.
   ========================================================================== */
(function (w, d) {
  'use strict';
  var P = w.PPA, $ = P.$, esc = P.esc;

  P.routes.cursos = catalog;
  P.routes.curso = detail;

  /* ---------- Catálogo ---------- */
  var catalogBound = false, catalogApply = null, catalogClear = null;
  function catalog() {
    var courses = P.getCourses().filter(function (c) { return c.active; });
    var f = { q: $('#f-q'), role: $('#f-role'), elo: $('#f-elo'), theme: $('#f-theme'), sort: $('#f-sort') };

    f.role.innerHTML = '<option value="">Todas</option>' + P.ROLES.map(function (r) { return '<option>' + r + '</option>'; }).join('');
    f.elo.innerHTML = '<option value="">Todos</option>' + P.ELOS.map(function (e, i) { return '<option value="' + i + '">' + e + '</option>'; }).join('');
    f.theme.innerHTML = '<option value="">Todos</option>' + P.THEMES.map(function (t) { return '<option value="' + t[0] + '">' + t[1] + '</option>'; }).join('');

    /* Restaura preferências salvas */
    var saved = P.Store.get('catalogFilters', {});
    Object.keys(f).forEach(function (k) { if (saved[k] != null) f[k].value = saved[k]; });

    function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

    function apply() {
      var q = norm(f.q.value.trim());
      var list = courses.map(function (c, i) { return { c: c, i: i }; }).filter(function (o) {
        var c = o.c;
        if (q && norm(c.title + ' ' + c.description).indexOf(q) === -1) return false;
        if (f.role.value && c.role !== f.role.value && c.role !== 'Todas') return false;
        if (f.elo.value !== '' && !(Number(f.elo.value) >= c.eloMin && Number(f.elo.value) <= c.eloMax)) return false;
        if (f.theme.value && c.theme !== f.theme.value) return false;
        return true;
      });
      list.sort(function (a, b) {
        if (f.sort.value === 'asc') return a.c.price - b.c.price;
        if (f.sort.value === 'desc') return b.c.price - a.c.price;
        return (b.c.featured - a.c.featured) || (a.i - b.i); /* relevância: destaque primeiro */
      });
      $('#grid').innerHTML = list.length
        ? list.map(function (o) { return P.courseCard(o.c); }).join('')
        : '<div class="empty" style="grid-column:1/-1"><div class="big" aria-hidden="true">🔍</div><h3>Nenhum curso encontrado</h3><p>Tente remover alguns filtros ou buscar por outro termo.</p><button type="button" class="btn btn-ghost" id="empty-clear">Limpar filtros</button></div>';
      $('#count').textContent = list.length + (list.length === 1 ? ' curso encontrado' : ' cursos encontrados');
      var s = {}; Object.keys(f).forEach(function (k) { s[k] = f[k].value; });
      P.Store.set('catalogFilters', s);
    }
    function clear() { Object.keys(f).forEach(function (k) { f[k].value = ''; }); f.sort.value = 'rel'; apply(); }

    catalogApply = apply; catalogClear = clear;
    if (!catalogBound) {
      catalogBound = true;
      Object.keys(f).forEach(function (k) { f[k].addEventListener(k === 'q' ? 'input' : 'change', function () { catalogApply(); }); });
      $('#f-clear').addEventListener('click', function () { catalogClear(); });
      $('#grid').addEventListener('click', function (e) { if (e.target.id === 'empty-clear') catalogClear(); });
      $('#filters').addEventListener('submit', function (e) { e.preventDefault(); });
    }
    apply();
  }

  /* ---------- Detalhes ---------- */
  function detail(id) {
    var c = P.getCourses().filter(function (x) { return x.id === id; })[0];
    var root = $('#course-root');
    if (!c || !c.active) {
      root.innerHTML = '<div class="empty"><div class="big" aria-hidden="true">🕳️</div><h2>Curso não encontrado</h2><p>O curso não existe ou foi desativado.</p><a class="btn" href="#/cursos">Voltar ao catálogo</a></div>';
      return;
    }
    d.title = c.title + ' — ' + P.getSite().brand;
    var site = P.getSite();
    var total = P.countLessons(c);
    root.innerHTML =
      '<p class="crumbs"><a href="#/cursos">Cursos</a> / ' + esc(c.title) + '</p>' +
      '<div class="course-layout"><div>' +
      '<div class="chips"><span class="chip role">' + esc(c.role) + '</span><span class="chip elo">' + esc(P.eloRange(c)) + '</span><span class="chip">' + esc(P.themeLabel(c.theme)) + '</span><span class="badge-demo">Demonstração</span></div>' +
      '<h1 style="font-size:clamp(1.8rem,4vw,2.8rem)">' + esc(c.title) + '</h1>' +
      '<p class="lead muted">' + esc(c.description) + '</p>' +
      '<h2>Apresentação</h2><p>' + esc(c.long || c.description) + '</p>' +
      '<h2>O que você vai aprender</h2><ul class="bullets">' + c.objectives.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul>' +
      '<h2>Para quem é</h2><ul class="bullets">' + c.audience.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul>' +
      '<h2>Conteúdo programático</h2>' +
      c.modules.map(function (m, i) {
        return '<details class="module"' + (i === 0 ? ' open' : '') + '><summary><span>Módulo ' + (i + 1) + ' — ' + esc(m.title) + '</span><span class="muted">' + m.lessons.length + ' aulas</span></summary><ul>' +
          m.lessons.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul></details>';
      }).join('') +
      '<p class="placeholder-note">Os resultados dependem da dedicação e do contexto de cada jogador. Este curso não promete que você alcançará um elo específico.</p>' +
      '</div><aside class="card buy-card static" aria-label="Inscrição">' +
      '<div class="cover"><img src="' + P.cover(c) + '" alt="" width="640" height="360"></div>' +
      '<div class="price" style="font-size:2rem"><small>Preço demonstrativo</small>' + P.brl(c.price) + '</div>' +
      '<ul class="meta" style="margin-top:12px"><li>📚 ' + c.modules.length + ' módulos</li><li>🎬 ' + total + ' aulas</li></ul>' +
      '<button type="button" class="btn btn-primary" id="enroll" style="width:100%">Inscrever-se</button>' +
      '<p class="hint" style="margin-top:10px">Demonstração: nenhuma cobrança é realizada.</p>' +
      '<hr style="border:0;border-top:1px solid var(--line);margin:16px 0"><strong>Instrutor</strong><p class="muted" style="margin:4px 0 0">' + esc(site.proName) + '</p></aside></div>';

    $('#enroll').addEventListener('click', function () { enrollModal(c, site); });
  }

  function enrollModal(c, site) {
    var wa = P.waLink('Olá! Tenho interesse no curso "' + c.title + '" (' + P.brl(c.price) + ').');
    var s = P.getStudent();
    var already = s.enrolled.indexOf(c.id) !== -1;
    var body = P.openModal({
      title: 'Inscrição demonstrativa',
      html: '<p><strong>' + esc(c.title) + '</strong> — ' + P.brl(c.price) + '</p>' +
        '<p class="muted">Esta é uma demonstração: <strong>nenhuma compra ou cobrança é realizada</strong>. Você pode adicionar o curso ao painel demonstrativo do aluno (salvo só neste navegador) ou falar com o instrutor.</p>' +
        '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancelar</button>' +
        '<button type="button" class="btn btn-ghost" id="m-wa"' + (wa ? '' : ' disabled title="WhatsApp não configurado"') + '>Falar pelo WhatsApp</button>' +
        '<button type="button" class="btn btn-primary" id="m-add"' + (already ? ' disabled' : '') + '>' + (already ? 'Já está no painel' : 'Adicionar ao painel demo') + '</button></div>' +
        (wa ? '' : '<p class="hint">WhatsApp não configurado. Defina o número em Admin &gt; Configurações.</p>')
    });
    var add = $('#m-add', body), wb = $('#m-wa', body);
    if (wb && wa) wb.addEventListener('click', function () { w.open(wa, '_blank', 'noopener'); });
    add.addEventListener('click', function () {
      var st = P.getStudent();
      if (st.enrolled.indexOf(c.id) === -1) st.enrolled.push(c.id);
      P.logActivity(st, 'Curso adicionado ao painel (demonstração): ' + c.title);
      if (P.saveStudent(st)) {
        P.closeModal();
        P.toast('Curso adicionado ao painel demonstrativo do aluno.', 'success');
      }
    });
  }

})(window, document);

/* ==========================================================================
   PRO PLAYER ACADEMY — coaching.js
   Serviços de coaching, formulário de solicitação (localStorage) e envio
   opcional por WhatsApp. Nenhuma sessão é confirmada automaticamente.
   ========================================================================== */
(function (w, d) {
  'use strict';
  var P = w.PPA, $ = P.$, esc = P.esc;

  /* Serviços demonstrativos — preços e durações fictícios */
  var SERVICES = [
    { id: 's1', name: 'Revisão de partida (VOD)', mins: 45, price: 120, desc: 'Análise de uma partida enviada por você, com pontos de melhoria objetivos.' },
    { id: 's2', name: 'Coaching individual ao vivo', mins: 60, price: 180, desc: 'Sessão por chamada com revisão de decisões, rota e plano de treino.' },
    { id: 's3', name: 'Pacote evolução (4 sessões)', mins: 240, price: 620, desc: 'Acompanhamento semanal com metas, revisões e exercícios práticos.' }
  ];

  var bound = false;
  function init() {
    if (!bound) {
      bound = true;
      renderServices();
      fillSelects();
      $('#req-form').addEventListener('submit', onSubmit);
      $('#req-form').addEventListener('input', function (e) { var f = e.target.closest('.field'); if (f) setErr(f, ''); });
    }
    renderMine();
  }
  P.routes.coaching = init;

  function renderServices() {
    $('#services').innerHTML = SERVICES.map(function (s, i) {
      return '<label class="card service"><input type="radio" name="service" value="' + s.id + '"' + (i === 0 ? ' checked' : '') + '>' +
        '<h3>' + esc(s.name) + '</h3><p class="muted">' + esc(s.desc) + '</p>' +
        '<ul class="meta"><li>⏱ ' + s.mins + ' min</li></ul><div class="price"><small>Preço demonstrativo</small>' + P.brl(s.price) + '</div></label>';
    }).join('');
  }

  function fillSelects() {
    $('#r-elo').innerHTML = '<option value="">Selecione</option>' + P.ELOS.map(function (e) { return '<option>' + e + '</option>'; }).join('');
    $('#r-role').innerHTML = '<option value="">Selecione</option>' + P.ROLES.map(function (e) { return '<option>' + e + '</option>'; }).join('');
  }

  function setErr(field, msg) {
    field.classList.toggle('invalid', !!msg);
    var m = $('.error-msg', field); if (m) m.textContent = msg;
  }

  function onSubmit(e) {
    e.preventDefault();
    var form = e.target, ok = true;
    var v = function (id) { return $('#' + id).value.trim(); };
    function check(id, cond, msg) { var f = $('#' + id).closest('.field'); setErr(f, cond ? '' : msg); if (!cond) ok = false; }

    check('r-name', v('r-name').length >= 2, 'Informe seu nome.');
    check('r-elo', !!v('r-elo'), 'Selecione seu elo.');
    check('r-role', !!v('r-role'), 'Selecione sua função.');
    check('r-diff', v('r-diff').length >= 10, 'Descreva suas dificuldades (mínimo 10 caracteres).');
    check('r-link', !v('r-link') || P.isHttpUrl(v('r-link')), 'Informe um link válido (http ou https).');
    if (!ok) { P.toast('Corrija os campos destacados.', 'error'); var bad = $('.field.invalid input, .field.invalid select, .field.invalid textarea', form); if (bad) bad.focus(); return; }

    var svc = SERVICES.filter(function (s) { return s.id === form.service.value; })[0];
    var req = {
      id: P.uid(), ts: Date.now(), service: svc.name, price: svc.price, mins: svc.mins,
      name: v('r-name'), elo: v('r-elo'), role: v('r-role'), difficulties: v('r-diff'), link: v('r-link'),
      status: 'solicitado'
    };
    var list = P.Store.get('requests', []);
    list.unshift(req);
    if (!P.Store.set('requests', list)) return;
    form.reset(); $('#services input').checked = true;
    P.toast('Solicitação registrada neste navegador.', 'success');
    showConfirmation(req);
    renderMine();
  }

  function waText(r) {
    return 'Olá! Gostaria de solicitar coaching.\nServiço: ' + r.service + '\nNome: ' + r.name + '\nElo: ' + r.elo + ' | Função: ' + r.role +
      '\nDificuldades: ' + r.difficulties + (r.link ? '\nPartida: ' + r.link : '');
  }

  function showConfirmation(r) {
    var wa = P.waLink(waText(r));
    var body = P.openModal({
      title: 'Solicitação registrada',
      html: '<p><strong>Sua solicitação foi salva apenas neste navegador.</strong> Ela <strong>ainda não é uma sessão confirmada</strong>: o horário e o valor dependem de contato e confirmação do profissional.</p>' +
        '<p class="muted">Para enviar os dados ao profissional, use o WhatsApp abaixo.</p>' +
        '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Fechar</button>' +
        '<button type="button" class="btn btn-primary" id="m-wa"' + (wa ? '' : ' disabled') + '>Enviar por WhatsApp</button></div>' +
        (wa ? '' : '<p class="hint">WhatsApp não configurado. Defina o número em Admin &gt; Configurações.</p>')
    });
    var b = $('#m-wa', body);
    if (wa) b.addEventListener('click', function () { w.open(wa, '_blank', 'noopener'); });
  }

  function renderMine() {
    var list = P.Store.get('requests', []);
    var box = $('#mine');
    if (!list.length) {
      box.innerHTML = '<div class="empty"><div class="big" aria-hidden="true">📭</div><p>Nenhuma solicitação ainda. Preencha o formulário acima.</p></div>';
      return;
    }
    box.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Data</th><th>Serviço</th><th>Elo / Função</th><th>Status</th><th><span class="visually-hidden">Ações</span></th></tr></thead><tbody>' +
      list.map(function (r) {
        return '<tr><td>' + P.fmtDate(r.ts) + '</td><td>' + esc(r.service) + '</td><td>' + esc(r.elo) + ' / ' + esc(r.role) + '</td>' +
          '<td><span class="status ' + P.slug(r.status) + '">' + esc(r.status) + '</span></td>' +
          '<td><button type="button" class="btn btn-sm btn-ghost" data-wa="' + r.id + '">WhatsApp</button> ' +
          (r.status === 'solicitado' ? '<button type="button" class="btn btn-sm btn-danger" data-cancel="' + r.id + '">Cancelar</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  d.addEventListener('click', function (e) {
    var wb = e.target.closest('[data-wa]'), cb = e.target.closest('[data-cancel]');
    if (wb) {
      var r = P.Store.get('requests', []).filter(function (x) { return x.id === wb.getAttribute('data-wa'); })[0];
      var link = r && P.waLink(waText(r));
      if (!link) { P.toast('WhatsApp não configurado. Defina o número em Admin > Configurações.', 'error'); return; }
      w.open(link, '_blank', 'noopener');
    }
    if (cb) {
      P.confirmDialog('Cancelar esta solicitação?', 'Cancelar solicitação').then(function (yes) {
        if (!yes) return;
        var list = P.Store.get('requests', []);
        list.forEach(function (x) { if (x.id === cb.getAttribute('data-cancel')) x.status = 'cancelado'; });
        P.Store.set('requests', list); renderMine(); P.toast('Solicitação cancelada.', 'success');
      });
    }
  });

})(window, document);

/* ==========================================================================
   PRO PLAYER ACADEMY — aluno.js
   Painel demonstrativo do aluno + módulo de evolução. Sem login real:
   tudo é salvo no localStorage deste navegador.
   ========================================================================== */
(function (w, d) {
  'use strict';
  var P = w.PPA, $ = P.$, $$ = P.$$, esc = P.esc;
  var S, openMods = {};

  /* Metas de treinamento. ADC é o conjunto principal; as demais funções usam o conjunto geral. */
  var GOALS = {
    adc: [
      { id: 'adc-farm', t: 'Melhorar o farm', ex: 'Treino de 10 min focado em último golpe, sem ferramentas de trapaça; anote seu CS aos 10 minutos.' },
      { id: 'adc-wave', t: 'Aprender controle de wave', ex: 'Em 3 partidas, tente identificar o estado da wave antes de cada troca.' },
      { id: 'adc-pos', t: 'Melhorar o posicionamento', ex: 'Revise suas mortes e marque as evitáveis por posição.' },
      { id: 'adc-trade', t: 'Aprimorar trocas de dano', ex: 'Anote cooldowns do oponente e só troque em janelas favoráveis.' },
      { id: 'adc-tf', t: 'Evoluir nas team fights', ex: 'Defina antes da luta quem é seu alvo prioritário e onde você fica.' },
      { id: 'adc-dec', t: 'Melhorar a tomada de decisão', ex: 'Ao fim de cada partida, descreva 1 decisão boa e 1 a melhorar.' }
    ],
    geral: [
      { id: 'ger-rev', t: 'Revisar partidas com regularidade', ex: 'Revise ao menos 1 partida por semana com perguntas fixas.' },
      { id: 'ger-wave', t: 'Melhorar o controle de wave', ex: 'Observe o estado da wave antes de recall e de trocas.' },
      { id: 'ger-vis', t: 'Melhorar o uso de visão', ex: 'Defina onde e quando colocar wards em cada fase.' },
      { id: 'ger-pos', t: 'Melhorar o posicionamento', ex: 'Revise as mortes e marque as evitáveis.' },
      { id: 'ger-tf', t: 'Evoluir nas team fights', ex: 'Defina seu papel e seu alvo antes da luta.' },
      { id: 'ger-dec', t: 'Melhorar a tomada de decisão', ex: 'Registre 1 decisão boa e 1 a melhorar por partida.' }
    ]
  };
  function goalSet() { return S.role === 'ADC' ? GOALS.adc : GOALS.geral; }

  function save() { return P.Store.set('student', S); }
  function log(t) { P.logActivity(S, t); }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }

  function enrolledCourses() {
    var all = P.getCourses();
    return S.enrolled.map(function (id) { return all.filter(function (c) { return c.id === id; })[0]; }).filter(Boolean);
  }
  function validKeys(c) {
    var k = [];
    c.modules.forEach(function (m, i) { m.lessons.forEach(function (_, j) { k.push(i + '-' + j); }); });
    return k;
  }
  function doneCount(c) { var v = validKeys(c), dn = S.done[c.id] || []; return dn.filter(function (k) { return v.indexOf(k) !== -1; }).length; }
  function bar(p) { return '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"><span style="width:' + p + '%"></span></div>'; }

  /* ---------- Resumo ---------- */
  function renderResumo() {
    var cs = enrolledCourses();
    var totalL = 0, doneL = 0;
    cs.forEach(function (c) { totalL += P.countLessons(c); doneL += doneCount(c); });
    var gs = goalSet(), gDone = gs.filter(function (g) { return (S.goals[g.id] || {}).done; }).length;
    var overall = pct(doneL, totalL);

    $('#greet').textContent = 'Olá, ' + S.name + '!';
    $('#journey').textContent = S.eloAtual + ' → ' + S.eloDesejado + ' · ' + S.role;

    $('#stats').innerHTML = [
      [cs.length, 'Cursos no painel'], [doneL + '/' + totalL, 'Aulas concluídas'], [overall + '%', 'Progresso geral'], [gDone + '/' + gs.length, 'Metas concluídas']
    ].map(function (s) { return '<div class="card stat-card static"><div class="num">' + s[0] + '</div><div class="lbl">' + s[1] + '</div></div>'; }).join('');

    $('#course-progress').innerHTML = cs.length ? cs.map(function (c) {
      var p = pct(doneCount(c), P.countLessons(c));
      return '<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;gap:10px"><strong>' + esc(c.title) + '</strong><span class="muted">' + p + '%</span></div>' + bar(p) + '</div>';
    }).join('') : '<div class="empty"><div class="big" aria-hidden="true">🎓</div><p>Você ainda não tem cursos no painel.</p><a class="btn" href="#/cursos">Explorar cursos</a></div>';

    var champs = S.champs.length ? S.champs.map(function (c) { return '<span class="chip role">' + esc(c) + '</span>'; }).join('') : '<span class="muted">Nenhum campeão informado. Cadastre na aba Evolução.</span>';
    $('#champs').innerHTML = champs;

    renderWeekly();
    renderCharts(cs);
  }

  function renderWeekly() {
    var box = $('#weekly');
    box.innerHTML = S.weekly.length ? S.weekly.map(function (g) {
      return '<li class="' + (g.done ? 'done' : '') + '"><input type="checkbox" id="w-' + g.id + '" data-weekly="' + g.id + '"' + (g.done ? ' checked' : '') + '>' +
        '<label class="txt" for="w-' + g.id + '">' + esc(g.text) + '</label>' +
        '<button type="button" class="icon-btn" data-weekly-del="' + g.id + '" aria-label="Remover meta ' + esc(g.text) + '">🗑</button></li>';
    }).join('') : '<li class="muted">Nenhuma meta semanal. Adicione a primeira abaixo.</li>';
  }

  function renderCharts(cs) {
    /* Gráfico real: progresso por curso (com os dados do próprio aluno) */
    var rows = cs.map(function (c) { return { l: c.title.slice(0, 18) + (c.title.length > 18 ? '…' : ''), v: pct(doneCount(c), P.countLessons(c)) }; });
    var bars = rows.length ? '<svg viewBox="0 0 400 ' + (rows.length * 34 + 10) + '" role="img" aria-label="Progresso por curso">' +
      rows.map(function (r, i) {
        var y = i * 34 + 6;
        return '<text x="0" y="' + (y + 14) + '">' + esc(r.l) + '</text><rect x="140" y="' + y + '" width="220" height="14" rx="7" fill="#1b1b2a"/>' +
          '<rect x="140" y="' + y + '" width="' + (r.v * 2.2) + '" height="14" rx="7" fill="#a855f7"/><text x="368" y="' + (y + 12) + '">' + r.v + '%</text>';
      }).join('') + '</svg>' : '<p class="muted">Sem cursos para exibir.</p>';
    $('#chart-bars').innerHTML = bars;

    /* Gráfico DEMONSTRATIVO: valores fixos, não representam partidas reais */
    var demo = [42, 48, 45, 55, 60, 58, 66, 72], pts = demo.map(function (v, i) { return (20 + i * 52) + ',' + (140 - v * 1.5); });
    $('#chart-demo').innerHTML = '<svg viewBox="0 0 400 160" role="img" aria-label="Gráfico demonstrativo de evolução, dados fictícios">' +
      '<line x1="20" y1="140" x2="390" y2="140" stroke="#2a2a40"/>' +
      '<polyline fill="none" stroke="#b6ff3c" stroke-width="3" points="' + pts.join(' ') + '"/>' +
      pts.map(function (p) { var a = p.split(','); return '<circle cx="' + a[0] + '" cy="' + a[1] + '" r="4" fill="#b6ff3c"/>'; }).join('') +
      demo.map(function (_, i) { return '<text x="' + (14 + i * 52) + '" y="156">S' + (i + 1) + '</text>'; }).join('') + '</svg>';
  }

  /* ---------- Cursos ---------- */
  function renderCursos() {
    var cs = enrolledCourses(), box = $('#courses-list');
    if (!cs.length) {
      box.innerHTML = '<div class="empty"><div class="big" aria-hidden="true">📚</div><h3>Nenhum curso no painel</h3><p>Inscreva-se em um curso demonstrativo para acompanhar suas aulas.</p><a class="btn" href="#/cursos">Ver catálogo</a></div>';
      return;
    }
    box.innerHTML = cs.map(function (c) {
      var dn = S.done[c.id] || [], p = pct(doneCount(c), P.countLessons(c));
      return '<section class="card card-pad static" style="margin-bottom:18px"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center"><h3 style="margin:0">' + esc(c.title) + '</h3>' +
        '<button type="button" class="btn btn-sm btn-danger" data-unenroll="' + esc(c.id) + '">Remover do painel</button></div>' +
        '<div style="margin:12px 0 16px">' + bar(p) + '<small class="muted">' + doneCount(c) + ' de ' + P.countLessons(c) + ' aulas concluídas (' + p + '%)</small></div>' +
        c.modules.map(function (m, i) {
          var key = c.id + '-' + i;
          return '<details class="module"' + (openMods[key] !== false && (openMods[key] || i === 0) ? ' open' : '') + ' data-mod="' + key + '"><summary><span>' + esc(m.title) + '</span></summary><ul class="list" style="padding:0 18px 10px">' +
            m.lessons.map(function (l, j) {
              var k = i + '-' + j, chk = dn.indexOf(k) !== -1, id = 'l-' + c.id + '-' + k;
              return '<li class="' + (chk ? 'done' : '') + '"><input type="checkbox" id="' + id + '" data-lesson="' + esc(c.id) + '|' + k + '"' + (chk ? ' checked' : '') + '><label class="txt" for="' + id + '">' + esc(l) + '</label></li>';
            }).join('') + '</ul></details>';
        }).join('') + '</section>';
    }).join('');
  }

  /* ---------- Evolução ---------- */
  function renderEvolucao() {
    $('#p-name').value = S.name;
    $('#p-atual').innerHTML = P.ELOS.map(function (e) { return '<option' + (e === S.eloAtual ? ' selected' : '') + '>' + e + '</option>'; }).join('');
    $('#p-desejado').innerHTML = P.ELOS.map(function (e) { return '<option' + (e === S.eloDesejado ? ' selected' : '') + '>' + e + '</option>'; }).join('');
    $('#p-role').innerHTML = P.ROLES.map(function (e) { return '<option' + (e === S.role ? ' selected' : '') + '>' + e + '</option>'; }).join('');
    $('#p-champs').value = S.champs.join(', ');
    $('#p-diff').value = S.difficulties;
    $('#p-obj').value = S.objective;
    renderGoals();
  }

  function renderGoals() {
    var gs = goalSet(), done = gs.filter(function (g) { return (S.goals[g.id] || {}).done; }).length, p = pct(done, gs.length);
    $('#goals-title').textContent = S.role === 'ADC' ? 'Metas de treinamento — ADC' : 'Metas de treinamento — ' + S.role;
    $('#goals-progress').innerHTML = bar(p) + '<small class="muted">' + done + ' de ' + gs.length + ' metas concluídas (' + p + '%)</small>';
    $('#goals').innerHTML = gs.map(function (g) {
      var st = S.goals[g.id] || {};
      return '<div class="card goal static"><div class="goal-head"><input type="checkbox" id="' + g.id + '" data-goal="' + g.id + '"' + (st.done ? ' checked' : '') + '>' +
        '<div style="flex:1"><label for="' + g.id + '"><strong>' + esc(g.t) + '</strong></label><small>Exercício sugerido: ' + esc(g.ex) + '</small></div></div>' +
        '<label class="visually-hidden" for="n-' + g.id + '">Observações sobre ' + esc(g.t) + '</label>' +
        '<textarea id="n-' + g.id + '" data-note="' + g.id + '" placeholder="Suas observações (salvas automaticamente)" maxlength="800">' + esc(st.note || '') + '</textarea></div>';
    }).join('');
  }

  /* ---------- Atividade ---------- */
  function renderAtividade() {
    $('#activity').innerHTML = S.activity.length ? S.activity.map(function (a) {
      return '<div class="activity-item"><time>' + P.fmtDate(a.ts) + '</time><span>' + esc(a.text) + '</span></div>';
    }).join('') : '<div class="empty"><p>Nenhuma atividade registrada.</p></div>';
  }

  function renderAll() { renderResumo(); renderCursos(); renderEvolucao(); renderAtividade(); }

  /* ---------- Abas ---------- */
  var V = '[data-view="aluno"] ';
  function showTab(name) {
    var ok = ['resumo', 'cursos', 'evolucao', 'atividade'];
    if (ok.indexOf(name) === -1) name = 'resumo';
    $$(V + '.tab').forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-tab') === name)); });
    $$(V + '.panel').forEach(function (p) { p.hidden = p.id !== 'panel-' + name; });
  }

  /* ---------- Eventos ---------- */
  function bind() {
    $$(V + '.tab').forEach(function (t) {
      t.addEventListener('click', function () { showTab(t.getAttribute('data-tab')); });
    });

    d.addEventListener('change', function (e) {
      var t = e.target, v;
      if ((v = t.getAttribute('data-lesson'))) {
        var p = v.split('|'), cid = p[0], k = p[1];
        var arr = S.done[cid] || [];
        var c = P.getCourses().filter(function (x) { return x.id === cid; })[0];
        var title = c ? c.modules[Number(k.split('-')[0])].lessons[Number(k.split('-')[1])] : k;
        if (t.checked && arr.indexOf(k) === -1) { arr.push(k); log('Aula concluída: ' + title); }
        if (!t.checked) { arr = arr.filter(function (x) { return x !== k; }); log('Aula desmarcada: ' + title); }
        S.done[cid] = arr; save(); renderResumo(); renderCursos(); renderAtividade();
        if (t.checked) P.toast('Aula marcada como concluída.', 'success');
      } else if ((v = t.getAttribute('data-goal'))) {
        var g = S.goals[v] || {}; g.done = t.checked; S.goals[v] = g;
        var meta = goalSet().filter(function (x) { return x.id === v; })[0];
        log((t.checked ? 'Meta concluída: ' : 'Meta reaberta: ') + (meta ? meta.t : v));
        save(); renderGoals(); renderResumo(); renderAtividade();
        if (t.checked) P.toast('Meta concluída!', 'success');
      } else if ((v = t.getAttribute('data-note'))) {
        var gg = S.goals[v] || {}; gg.note = t.value; S.goals[v] = gg; save(); P.toast('Observação salva.', 'success');
      } else if ((v = t.getAttribute('data-weekly'))) {
        S.weekly.forEach(function (x) { if (x.id === v) { x.done = t.checked; if (t.checked) log('Meta semanal concluída: ' + x.text); } });
        save(); renderWeekly(); renderAtividade();
      }
    });

    d.addEventListener('toggle', function (e) {
      var m = e.target.getAttribute && e.target.getAttribute('data-mod');
      if (m) openMods[m] = e.target.open;
    }, true);

    d.addEventListener('click', function (e) {
      var del = e.target.closest('[data-weekly-del]'), un = e.target.closest('[data-unenroll]');
      if (del) { S.weekly = S.weekly.filter(function (x) { return x.id !== del.getAttribute('data-weekly-del'); }); save(); renderWeekly(); }
      if (un) {
        P.confirmDialog('Remover este curso do painel? O progresso salvo será mantido caso você o adicione novamente.', 'Remover').then(function (yes) {
          if (!yes) return;
          S.enrolled = S.enrolled.filter(function (x) { return x !== un.getAttribute('data-unenroll'); });
          log('Curso removido do painel.'); save(); renderAll(); P.toast('Curso removido do painel.', 'success');
        });
      }
    });

    $('#weekly-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var i = $('#weekly-input'), t = i.value.trim();
      if (t.length < 3) { P.toast('Descreva a meta com pelo menos 3 caracteres.', 'error'); i.focus(); return; }
      S.weekly.push({ id: P.uid(), text: t, done: false }); i.value = '';
      log('Meta semanal criada: ' + t); save(); renderWeekly(); renderAtividade();
    });

    $('#profile-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#p-name').value.trim(), a = $('#p-atual').value, b = $('#p-desejado').value;
      if (!name) { P.toast('Informe um nome.', 'error'); $('#p-name').focus(); return; }
      if (P.ELOS.indexOf(b) < P.ELOS.indexOf(a)) { P.toast('O elo desejado não pode ser menor que o elo atual.', 'error'); $('#p-desejado').focus(); return; }
      S.name = name; S.eloAtual = a; S.eloDesejado = b; S.role = $('#p-role').value;
      S.champs = $('#p-champs').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 10);
      S.difficulties = $('#p-diff').value.trim(); S.objective = $('#p-obj').value.trim();
      log('Perfil de evolução atualizado.');
      if (save()) { P.toast('Perfil salvo neste navegador.', 'success'); renderAll(); }
    });

    $('#clear-activity').addEventListener('click', function () {
      P.confirmDialog('Apagar todo o histórico de atividades?', 'Apagar').then(function (yes) {
        if (yes) { S.activity = []; save(); renderAtividade(); P.toast('Histórico apagado.', 'success'); }
      });
    });
    $('#reset-student').addEventListener('click', function () {
      P.confirmDialog('Restaurar o painel demonstrativo? Seu perfil, progresso, metas e anotações serão apagados.', 'Restaurar').then(function (yes) {
        if (yes) { P.Store.remove('student'); S = P.getStudent(); renderAll(); P.toast('Painel restaurado.', 'success'); }
      });
    });
  }

  var bound = false;
  P.routes.aluno = function (tab) {
    S = P.getStudent();
    if (!bound) { bound = true; bind(); }
    renderAll(); showTab(tab);
  };
})(window, document);

/* ==========================================================================
   PRO PLAYER ACADEMY — admin.js
   Painel administrativo DEMONSTRATIVO. Sem autenticação: qualquer pessoa com
   acesso a esta página no navegador pode editar. Dados ficam no localStorage.
   ========================================================================== */
(function (w, d) {
  'use strict';
  var P = w.PPA, $ = P.$, $$ = P.$$, esc = P.esc;

  /* ---------- Indicadores ---------- */
  function renderStats() {
    var cs = P.getCourses(), reqs = P.Store.get('requests', []), st = P.getStudent();
    var active = cs.filter(function (c) { return c.active; });
    var lessons = cs.reduce(function (n, c) { return n + P.countLessons(c); }, 0);
    var avg = cs.length ? cs.reduce(function (n, c) { return n + Number(c.price); }, 0) / cs.length : 0;
    var pend = reqs.filter(function (r) { return r.status === 'solicitado'; }).length;
    var doneL = 0;
    st.enrolled.forEach(function (id) { doneL += (st.done[id] || []).length; });
    var cards = [
      [cs.length, 'Cursos cadastrados'], [active.length, 'Cursos ativos'], [lessons, 'Aulas no total'], [P.brl(avg), 'Preço médio (demo)'],
      [reqs.length, 'Solicitações de coaching'], [pend, 'Aguardando contato'], [st.enrolled.length, 'Cursos no painel do aluno'], [doneL, 'Aulas concluídas (aluno demo)']
    ];
    $('#admin-stats').innerHTML = cards.map(function (c) {
      return '<div class="card stat-card static"><div class="num">' + esc(c[0]) + '</div><div class="lbl">' + c[1] + '</div></div>';
    }).join('');

    /* Demonstrativo: dados fictícios fixos, sinalizados na interface */
    var demo = [['Visitas (demo)', 1280], ['Cliques em cursos (demo)', 340], ['Solicitações (demo)', 42]];
    var max = 1280;
    $('#demo-chart').innerHTML = '<svg viewBox="0 0 400 110" role="img" aria-label="Indicadores demonstrativos fictícios">' + demo.map(function (r, i) {
      var y = i * 34 + 4;
      return '<text x="0" y="' + (y + 13) + '">' + r[0] + '</text><rect x="150" y="' + y + '" width="' + (r[1] / max * 200) + '" height="16" rx="8" fill="#3b82f6"/><text x="' + (156 + r[1] / max * 200) + '" y="' + (y + 13) + '">' + r[1] + '</text>';
    }).join('') + '</svg>';
  }

  /* ---------- Cursos ---------- */
  function renderCourses() {
    var cs = P.getCourses();
    $('#courses-body').innerHTML = cs.length ? cs.map(function (c) {
      return '<tr><td><strong>' + esc(c.title) + '</strong><br><small class="muted">' + esc(c.role) + ' · ' + esc(P.eloRange(c)) + ' · ' + esc(P.themeLabel(c.theme)) + '</small></td>' +
        '<td>' + P.brl(c.price) + '</td><td>' + c.modules.length + ' / ' + P.countLessons(c) + '</td>' +
        '<td>' + (c.active ? '<span class="status concluído">Ativo</span>' : '<span class="status cancelado">Inativo</span>') + '</td>' +
        '<td><button type="button" class="btn btn-sm btn-ghost" data-edit="' + esc(c.id) + '">Editar</button> ' +
        '<button type="button" class="btn btn-sm btn-danger" data-del="' + esc(c.id) + '">Excluir</button></td></tr>';
    }).join('') : '<tr><td colspan="5"><div class="empty">Nenhum curso. Clique em “Novo curso”.</div></td></tr>';
  }

  /* Estrutura em texto: "# Módulo" seguido de uma aula por linha */
  function modsToText(c) { return c.modules.map(function (m) { return '# ' + m.title + '\n' + m.lessons.join('\n'); }).join('\n\n'); }
  function textToMods(t) {
    var out = [], cur = null;
    t.split('\n').map(function (l) { return l.trim(); }).filter(Boolean).forEach(function (l) {
      if (l.charAt(0) === '#') { cur = { title: l.replace(/^#+\s*/, ''), lessons: [] }; out.push(cur); }
      else if (cur) cur.lessons.push(l);
      else out.error = 'Comece com uma linha de módulo (# Nome do módulo).';
    });
    if (out.error) return { error: out.error };
    if (!out.length || out.some(function (m) { return !m.title || !m.lessons.length; })) return { error: 'Cada módulo precisa de título e ao menos uma aula.' };
    return { mods: out };
  }

  function courseForm(c) {
    var isNew = !c;
    c = c || { id: '', title: '', description: '', long: '', role: 'Todas', theme: 'macro', eloMin: 0, eloMax: 9, price: 0, hue: 270, featured: false, active: true, objectives: [], audience: [], modules: [] };
    var roleOpts = ['Todas'].concat(P.ROLES).map(function (r) { return '<option' + (r === c.role ? ' selected' : '') + '>' + r + '</option>'; }).join('');
    var themeOpts = P.THEMES.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === c.theme ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('');
    var eloOpts = function (sel) { return P.ELOS.map(function (e, i) { return '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>' + e + '</option>'; }).join(''); };

    var body = P.openModal({
      wide: true, title: isNew ? 'Novo curso' : 'Editar curso',
      html: '<form id="course-form" novalidate><div class="form-grid">' +
        '<div class="field full"><label for="c-title">Nome *</label><input type="text" id="c-title" maxlength="120" value="' + esc(c.title) + '"><span class="error-msg"></span></div>' +
        '<div class="field full"><label for="c-desc">Descrição curta *</label><input type="text" id="c-desc" maxlength="200" value="' + esc(c.description) + '"><span class="error-msg"></span></div>' +
        '<div class="field full"><label for="c-long">Apresentação</label><textarea id="c-long">' + esc(c.long) + '</textarea></div>' +
        '<div class="field"><label for="c-role">Função</label><select id="c-role">' + roleOpts + '</select></div>' +
        '<div class="field"><label for="c-theme">Tema</label><select id="c-theme">' + themeOpts + '</select></div>' +
        '<div class="field"><label for="c-emin">Elo mínimo</label><select id="c-emin">' + eloOpts(c.eloMin) + '</select></div>' +
        '<div class="field"><label for="c-emax">Elo máximo</label><select id="c-emax">' + eloOpts(c.eloMax) + '</select><span class="error-msg"></span></div>' +
        '<div class="field"><label for="c-price">Preço demonstrativo (R$) *</label><input type="number" id="c-price" min="0" step="0.01" value="' + esc(c.price) + '"><span class="error-msg"></span></div>' +
        '<div class="field"><label for="c-hue">Cor da capa (0–360)</label><input type="number" id="c-hue" min="0" max="360" value="' + esc(c.hue) + '"></div>' +
        '<div class="field full"><label for="c-mods">Módulos e aulas *</label><textarea id="c-mods" style="min-height:160px" aria-describedby="c-mods-h">' + esc(modsToText(c)) + '</textarea>' +
        '<span class="hint" id="c-mods-h">Uma linha começando com # cria um módulo; cada linha seguinte é uma aula. Alterar a estrutura pode afetar o progresso já salvo.</span><span class="error-msg"></span></div>' +
        '<div class="field"><label for="c-obj">Objetivos (um por linha)</label><textarea id="c-obj">' + esc(c.objectives.join('\n')) + '</textarea></div>' +
        '<div class="field"><label for="c-aud">Público-alvo (um por linha)</label><textarea id="c-aud">' + esc(c.audience.join('\n')) + '</textarea></div>' +
        '<label class="check"><input type="checkbox" id="c-active"' + (c.active ? ' checked' : '') + '> Ativo (visível no catálogo)</label>' +
        '<label class="check"><input type="checkbox" id="c-feat"' + (c.featured ? ' checked' : '') + '> Destaque na página inicial</label>' +
        '</div><div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="submit" class="btn btn-primary">Salvar curso</button></div></form>'
    });

    $('#course-form', body).addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      function err(id, msg) { var f = $('#' + id, body).closest('.field'); f.classList.toggle('invalid', !!msg); $('.error-msg', f).textContent = msg || ''; if (msg) ok = false; }
      var title = $('#c-title', body).value.trim(), desc = $('#c-desc', body).value.trim(), price = parseFloat($('#c-price', body).value);
      var emin = Number($('#c-emin', body).value), emax = Number($('#c-emax', body).value);
      var parsed = textToMods($('#c-mods', body).value);
      err('c-title', title.length >= 3 ? '' : 'Informe o nome (mínimo 3 caracteres).');
      err('c-desc', desc ? '' : 'Informe a descrição curta.');
      err('c-price', isFinite(price) && price >= 0 ? '' : 'Informe um preço válido (0 ou mais).');
      err('c-emax', emax >= emin ? '' : 'O elo máximo deve ser maior ou igual ao mínimo.');
      err('c-mods', parsed.error || '');
      if (!ok) { P.toast('Corrija os campos destacados.', 'error'); return; }

      var lines = function (id) { return $('#' + id, body).value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); };
      var data = {
        id: isNew ? 'c-' + P.uid() : c.id, title: title, description: desc, long: $('#c-long', body).value.trim(),
        role: $('#c-role', body).value, theme: $('#c-theme', body).value, eloMin: emin, eloMax: emax,
        price: Math.round(price * 100) / 100, hue: Math.min(360, Math.max(0, Number($('#c-hue', body).value) || 0)),
        featured: $('#c-feat', body).checked, active: $('#c-active', body).checked,
        objectives: lines('c-obj'), audience: lines('c-aud'), modules: parsed.mods
      };
      var all = P.getCourses();
      if (isNew) all.push(data); else all = all.map(function (x) { return x.id === data.id ? data : x; });
      if (P.saveCourses(all)) { P.closeModal(); renderCourses(); renderStats(); P.toast('Curso salvo.', 'success'); }
    });
  }

  /* ---------- Solicitações de coaching ---------- */
  function renderRequests() {
    var list = P.Store.get('requests', []), box = $('#requests');
    if (!list.length) { box.innerHTML = '<div class="empty"><div class="big" aria-hidden="true">📭</div><p>Nenhuma solicitação recebida neste navegador.</p></div>'; return; }
    box.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Data</th><th>Aluno</th><th>Serviço</th><th>Detalhes</th><th>Status</th><th><span class="visually-hidden">Ações</span></th></tr></thead><tbody>' +
      list.map(function (r) {
        return '<tr><td>' + P.fmtDate(r.ts) + '</td><td>' + esc(r.name) + '<br><small class="muted">' + esc(r.elo) + ' · ' + esc(r.role) + '</small></td><td>' + esc(r.service) + '<br><small class="muted">' + P.brl(r.price) + '</small></td>' +
          '<td>' + esc(r.difficulties) + (r.link ? '<br><a href="' + esc(r.link) + '" target="_blank" rel="noopener noreferrer">Link da partida</a>' : '') + '</td>' +
          '<td><label class="visually-hidden" for="s-' + r.id + '">Status</label><select id="s-' + r.id + '" data-status="' + r.id + '">' +
          P.STATUS.map(function (s) { return '<option' + (s === r.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td>' +
          '<td><button type="button" class="btn btn-sm btn-danger" data-delreq="' + r.id + '">Excluir</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ---------- Configurações e conteúdo da home ---------- */
  function fillConfig() {
    var s = P.getSite();
    var set = function (id, v) { $('#' + id).value = v; };
    set('s-brand', s.brand); set('s-pro', s.proName); set('s-title', s.heroTitle); set('s-sub', s.heroSub); set('s-about', s.about);
    set('s-peak', s.peak); set('s-roles', s.mainRoles); set('s-ach', s.achievements.join('\n'));
    set('s-wa', s.whatsapp); set('s-email', s.email); set('s-yt', s.youtubeIds);
    set('s-soc-yt', s.social.youtube); set('s-soc-ig', s.social.instagram); set('s-soc-tw', s.social.twitter); set('s-soc-dc', s.social.discord);
  }

  function bindConfig() {
    $('#config-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      function err(id, msg) { var fl = $('#' + id).closest('.field'); fl.classList.toggle('invalid', !!msg); $('.error-msg', fl).textContent = msg || ''; if (msg) ok = false; }
      var v = function (id) { return $('#' + id).value.trim(); };
      var wa = v('s-wa').replace(/\D/g, '');
      err('s-brand', v('s-brand') ? '' : 'Informe o nome da plataforma.');
      err('s-pro', v('s-pro') ? '' : 'Informe o nome do profissional.');
      err('s-wa', !v('s-wa') || wa.length >= 10 ? '' : 'Use DDI + DDD + número, só dígitos (ex.: 5511999999999).');
      err('s-email', !v('s-email') || /^\S+@\S+\.\S+$/.test(v('s-email')) ? '' : 'E-mail inválido.');
      [['s-soc-yt', 'YouTube'], ['s-soc-ig', 'Instagram'], ['s-soc-tw', 'X'], ['s-soc-dc', 'Discord']].forEach(function (x) { err(x[0], !v(x[0]) || P.isHttpUrl(v(x[0])) ? '' : 'Informe uma URL válida (https://...).'); });
      if (!ok) { P.toast('Corrija os campos destacados.', 'error'); return; }
      var site = {
        brand: v('s-brand'), proName: v('s-pro'), heroTitle: v('s-title') || P.DEFAULT_SITE.heroTitle, heroSub: v('s-sub') || P.DEFAULT_SITE.heroSub, about: v('s-about'),
        peak: v('s-peak') || '—', mainRoles: v('s-roles') || '—', achievements: v('s-ach').split('\n').map(function (x) { return x.trim(); }).filter(Boolean),
        whatsapp: wa, email: v('s-email'), youtubeIds: v('s-yt'),
        social: { youtube: v('s-soc-yt'), instagram: v('s-soc-ig'), twitter: v('s-soc-tw'), discord: v('s-soc-dc') }
      };
      if (P.saveSite(site)) P.toast('Configurações salvas. Abra a página inicial para ver as mudanças.', 'success');
    });
  }

  /* ---------- Abas e eventos ---------- */
  var V = '[data-view="admin"] ';
  function showTab(name) {
    var ok = ['stats', 'courses', 'requests', 'config'];
    if (ok.indexOf(name) === -1) name = 'stats';
    $$(V + '.tab').forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-tab') === name)); });
    $$(V + '.panel').forEach(function (p) { p.hidden = p.id !== 'panel-' + name; });
  }

  function bindOnce() {
    $$(V + '.tab').forEach(function (t) { t.addEventListener('click', function () { showTab(t.getAttribute('data-tab')); }); });
    $('#new-course').addEventListener('click', function () { courseForm(null); });

    d.addEventListener('click', function (e) {
      var ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]'), dr = e.target.closest('[data-delreq]');
      if (ed) courseForm(P.getCourses().filter(function (c) { return c.id === ed.getAttribute('data-edit'); })[0]);
      if (dl) {
        var c = P.getCourses().filter(function (x) { return x.id === dl.getAttribute('data-del'); })[0];
        P.confirmDialog('Excluir o curso "' + c.title + '"? Esta ação não pode ser desfeita.', 'Excluir').then(function (yes) {
          if (!yes) return;
          P.saveCourses(P.getCourses().filter(function (x) { return x.id !== c.id; }));
          renderCourses(); renderStats(); P.toast('Curso excluído.', 'success');
        });
      }
      if (dr) {
        P.confirmDialog('Excluir esta solicitação?', 'Excluir').then(function (yes) {
          if (!yes) return;
          P.Store.set('requests', P.Store.get('requests', []).filter(function (r) { return r.id !== dr.getAttribute('data-delreq'); }));
          renderRequests(); renderStats(); P.toast('Solicitação excluída.', 'success');
        });
      }
    });
    d.addEventListener('change', function (e) {
      var s = e.target.getAttribute('data-status');
      if (!s) return;
      var list = P.Store.get('requests', []);
      list.forEach(function (r) { if (r.id === s) r.status = e.target.value; });
      if (P.Store.set('requests', list)) { renderStats(); P.toast('Status atualizado.', 'success'); }
    });

    $('#reset-courses').addEventListener('click', function () {
      P.confirmDialog('Restaurar os cursos demonstrativos originais? Suas edições nos cursos serão perdidas.', 'Restaurar').then(function (yes) {
        if (yes) { P.Store.remove('courses'); P.getCourses(); renderCourses(); renderStats(); P.toast('Cursos restaurados.', 'success'); }
      });
    });
    $('#reset-all').addEventListener('click', function () {
      P.confirmDialog('Apagar TODOS os dados locais desta demonstração (cursos, solicitações, painel do aluno e configurações)?', 'Apagar tudo').then(function (yes) {
        if (yes) { P.Store.clearAll(); w.location.reload(); }
      });
    });

    bindConfig();
  }

  var bound = false;
  P.routes.admin = function (tab) {
    if (!bound) { bound = true; bindOnce(); }
    renderStats(); renderCourses(); renderRequests(); fillConfig(); showTab(tab);
  };
})(window, document);

