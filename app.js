// Sistema de inhouse – 100% front-end (HTML + CSS + JS). Dados salvos no localStorage do navegador.
// Troque a senha de admin abaixo. ATENÇÃO: como tudo roda no navegador, essa senha NÃO é segura de verdade.
const ADMIN_KEY = "troque-esta-chave";
const ROLES = ["TOP", "JG", "MID", "BOT", "SUP"];

// ---------- "banco de dados" local ----------
const DB_KEY = "inhouse_db_v1";
const db = JSON.parse(localStorage.getItem(DB_KEY) || "null") || { players: [], queue: [], matches: [], votes: [], events: [], seq: { player: 0, match: 0, event: 0 } };
const save = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
const now = () => new Date().toISOString().slice(0, 16).replace("T", " ");
const tierOf = (r) => (r < 900 ? "Ferro" : r < 1000 ? "Bronze" : r < 1100 ? "Prata" : r < 1200 ? "Ouro" : r < 1300 ? "Platina" : "Diamante");
const withTier = (p) => ({ ...p, tier: tierOf(p.rating) });
const fail = (msg) => { throw new Error(msg); };

function balanceTeams(players) {
  const sorted = [...players].sort((a, b) => b.rating - a.rating);
  const blue = [], red = [];
  sorted.forEach((p, i) => ([0, 3].includes(i % 4) ? blue : red).push(p));
  const assign = (team) => {
    const free = new Set(ROLES), out = [], rest = [];
    for (const p of team) {
      if (free.has(p.role)) { free.delete(p.role); out.push({ ...p, assigned: p.role }); } else rest.push(p);
    }
    const left = [...free];
    rest.forEach((p, i) => out.push({ ...p, assigned: left[i] }));
    return out;
  };
  return { blue: assign(blue), red: assign(red) };
}

function createMatch() {
  if (db.queue.length < 10) fail(`Fila tem ${db.queue.length}/10 jogadores`);
  const picked = db.queue.slice(0, 10).map((q) => ({ id: q.player_id, role: q.role, rating: db.players.find((p) => p.id === q.player_id).rating }));
  const { blue, red } = balanceTeams(picked);
  const id = ++db.seq.match;
  db.matches.push({
    id, status: "scheduled", winner: null, created: now(), finished: null,
    players: [...blue.map((p) => ({ player_id: p.id, team: "blue", role: p.assigned, delta: null })),
              ...red.map((p) => ({ player_id: p.id, team: "red", role: p.assigned, delta: null }))],
  });
  const ids = new Set(picked.map((p) => p.id));
  db.queue = db.queue.filter((q) => !ids.has(q.player_id));
  save();
  return id;
}

function finishMatch(id, winner) {
  const m = db.matches.find((x) => x.id === id) || fail("Partida não encontrada");
  if (m.status === "finished") fail("Partida já finalizada");
  const rating = (pid) => db.players.find((p) => p.id === pid).rating;
  const avg = (t) => m.players.filter((x) => x.team === t).reduce((s, x) => s + rating(x.player_id), 0) / 5;
  const eBlue = 1 / (1 + 10 ** ((avg("red") - avg("blue")) / 400));
  for (const x of m.players) {
    const expected = x.team === "blue" ? eBlue : 1 - eBlue;
    const won = x.team === winner ? 1 : 0;
    x.delta = Math.round(32 * (won - expected));
    const p = db.players.find((q) => q.id === x.player_id);
    p.rating += x.delta; p.wins += won; p.losses += 1 - won;
  }
  m.status = "finished"; m.winner = winner; m.finished = now();
  save();
}

function matchDetail(id) {
  const m = db.matches.find((x) => x.id === id) || fail("Partida não encontrada");
  const players = m.players.map((mp) => {
    const p = db.players.find((q) => q.id === mp.player_id);
    return { id: p.id, nick: p.nick, rating: p.rating, tier: tierOf(p.rating), team: mp.team, role: mp.role, delta: mp.delta,
             votes: db.votes.filter((v) => v.match_id === id && v.target_id === p.id).length };
  });
  return { id: m.id, status: m.status, winner: m.winner, created: m.created, finished: m.finished, players };
}

// ---------- "API" local (mesmas rotas do backend, sem rede) ----------
async function api(path, opts = {}) {
  const method = opts.method || "GET", body = opts.body || {};
  const url = new URL(path, "http://x");
  const [res, a, b] = url.pathname.split("/").filter(Boolean);
  const admin = () => { if (state.adminKey !== ADMIN_KEY) fail("Chave de admin inválida"); };

  if (res === "players") {
    if (method === "GET" && !a) return [...db.players].sort((x, y) => y.rating - x.rating).map(withTier);
    if (method === "GET") return withTier(db.players.find((p) => p.id === Number(a)) || fail("Jogador não encontrado"));
    if (method === "POST") {
      const nick = String(body.nick || "").trim();
      if (nick.length < 3 || nick.length > 32) fail("Nick deve ter 3 a 32 caracteres");
      if (!ROLES.includes(body.role)) fail("Role inválida");
      if (db.players.some((p) => p.nick.toLowerCase() === nick.toLowerCase())) fail("Nick já cadastrado");
      const p = { id: ++db.seq.player, nick, role: body.role, rating: 1000, wins: 0, losses: 0 };
      db.players.push(p); save();
      return { id: p.id, nick, role: p.role };
    }
  }
  if (res === "queue") {
    if (method === "GET")
      return db.queue.map((q) => { const p = db.players.find((x) => x.id === q.player_id); return { id: p.id, nick: p.nick, rating: p.rating, role: q.role, joined: q.joined }; });
    if (method === "POST") {
      if (!ROLES.includes(body.role)) fail("Role inválida");
      if (!db.players.some((p) => p.id === body.player_id)) fail("Jogador não encontrado");
      db.queue = db.queue.filter((q) => q.player_id !== body.player_id);
      db.queue.push({ player_id: body.player_id, role: body.role, joined: now() }); save();
      return { ok: true };
    }
    if (method === "DELETE") { db.queue = db.queue.filter((q) => q.player_id !== Number(a)); save(); return { ok: true }; }
  }
  if (res === "matches") {
    if (method === "GET" && !a) {
      const status = url.searchParams.get("status");
      return db.matches.filter((m) => !status || m.status === status).map(({ id, status, winner, created }) => ({ id, status, winner, created })).reverse().slice(0, 50);
    }
    if (method === "GET") return matchDetail(Number(a));
    if (method === "POST" && a === "create") { admin(); return { id: createMatch() }; }
    if (method === "POST" && b === "start") {
      admin();
      const m = db.matches.find((x) => x.id === Number(a));
      if (m && m.status === "scheduled") { m.status = "live"; save(); }
      return { ok: true };
    }
    if (method === "POST" && b === "result") {
      admin();
      if (!["blue", "red"].includes(body.winner)) fail("winner deve ser blue ou red");
      finishMatch(Number(a), body.winner);
      return { ok: true };
    }
    if (method === "POST" && b === "vote") {
      const id = Number(a), m = db.matches.find((x) => x.id === id);
      if (!m || m.status !== "finished") fail("Votação só após o fim da partida");
      const inMatch = (pid) => m.players.some((p) => p.player_id === pid);
      if (!inMatch(body.voter_id)) fail("Só quem jogou pode votar");
      if (!inMatch(body.target_id)) fail("Alvo não jogou a partida");
      if (body.voter_id === body.target_id) fail("Não pode votar em si mesmo");
      db.votes = db.votes.filter((v) => !(v.match_id === id && v.voter_id === body.voter_id));
      db.votes.push({ match_id: id, voter_id: body.voter_id, target_id: body.target_id }); save();
      return { ok: true };
    }
  }
  if (res === "ranking") return db.players.filter((p) => p.wins + p.losses > 0).sort((x, y) => y.rating - x.rating).slice(0, 100).map(withTier);
  if (res === "events") {
    if (method === "GET") {
      const limit = new Date(Date.now() - 864e5).toISOString().slice(0, 16);
      return db.events.filter((e) => e.starts_at >= limit).sort((x, y) => x.starts_at.localeCompare(y.starts_at));
    }
    if (method === "POST") {
      admin();
      if (!body.title || !body.starts_at) fail("title e starts_at obrigatórios");
      db.events.push({ id: ++db.seq.event, title: String(body.title), starts_at: String(body.starts_at), description: String(body.description || "") }); save();
      return { ok: true };
    }
  }
  if (res === "admin" && a === "check") return { admin: state.adminKey === ADMIN_KEY };
  fail("Rota não encontrada");
}

// ---------- interface ----------
const view = document.getElementById("view");
const state = { me: JSON.parse(localStorage.getItem("me") || "null"), adminKey: localStorage.getItem("adminKey") || "" };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const roleSelect = (id, sel) =>
  `<select id="${id}">${ROLES.map((r) => `<option ${r === sel ? "selected" : ""}>${r}</option>`).join("")}</select>`;
const flash = (msg, err) => { const el = document.createElement("div"); el.className = "msg" + (err ? " err" : ""); el.textContent = msg; view.prepend(el); setTimeout(() => el.remove(), 4000); };
const act = (fn) => async (...a) => { try { await fn(...a); } catch (e) { flash(e.message, true); } };

function renderHeader() {
  document.getElementById("me").textContent = state.me ? state.me.nick : "";
  document.getElementById("btn-admin").textContent = state.adminKey === ADMIN_KEY ? "Admin ✓" : "Admin";
  document.querySelectorAll("nav a").forEach((a) => a.classList.toggle("active", location.hash.startsWith(a.getAttribute("href"))));
}

document.getElementById("btn-login").onclick = act(async () => {
  const nick = prompt("Seu Riot ID / nick (3 a 32 caracteres):");
  if (!nick) return;
  const role = (prompt("Sua role principal: " + ROLES.join(", "), "MID") || "").toUpperCase();
  try {
    state.me = await api("/players", { method: "POST", body: { nick, role } });
  } catch (e) {
    if (!/já cadastrado/.test(e.message)) throw e;
    const found = (await api("/players")).find((x) => x.nick.toLowerCase() === nick.trim().toLowerCase());
    state.me = { id: found.id, nick: found.nick, role: found.role };
  }
  localStorage.setItem("me", JSON.stringify(state.me));
  route();
});
document.getElementById("btn-admin").onclick = act(async () => {
  const k = prompt("Chave de admin:");
  if (k === null) return;
  if (k !== ADMIN_KEY) { state.adminKey = ""; localStorage.removeItem("adminKey"); throw new Error("Chave inválida"); }
  state.adminKey = k; localStorage.setItem("adminKey", k);
  route();
});

const pages = {
  async queue() {
    const q = await api("/queue");
    const joinForm = state.me
      ? `<div class="row">${roleSelect("q-role", state.me.role)}<button id="q-join">Entrar na fila</button><button id="q-leave" class="btn ghost">Sair</button></div>`
      : `<p class="muted">Cadastre-se ou entre (canto superior direito) para entrar na fila.</p>`;
    view.innerHTML = `<h1>Fila</h1>
      <div class="card"><h2>${q.length}/10 jogadores</h2>
        <div class="progress"><div style="width:${Math.min(q.length * 10, 100)}%"></div></div>
        ${joinForm}
        ${state.adminKey === ADMIN_KEY ? `<p style="margin-top:12px"><button id="q-create" ${q.length < 10 ? "disabled" : ""}>Criar partida balanceada</button></p>` : ""}
      </div>
      <div class="card"><table><tr><th>#</th><th>Jogador</th><th>Role</th><th>Rating</th></tr>
        ${q.map((p, i) => `<tr><td>${i + 1}</td><td><a href="#/player/${p.id}">${esc(p.nick)}</a></td><td class="role">${p.role}</td><td>${p.rating}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">Fila vazia</td></tr>`}
      </table></div>`;
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = act(fn); };
    on("q-join", async () => { await api("/queue", { method: "POST", body: { player_id: state.me.id, role: document.getElementById("q-role").value } }); route(); });
    on("q-leave", async () => { await api("/queue/" + state.me.id, { method: "DELETE" }); route(); });
    on("q-create", async () => { const r = await api("/matches/create", { method: "POST" }); location.hash = "#/match/" + r.id; });
  },

  async live() {
    const [live, sched] = await Promise.all([api("/matches?status=live"), api("/matches?status=scheduled")]);
    const list = (ms) => ms.map((m) => `<tr><td><a href="#/match/${m.id}">Partida #${m.id}</a></td><td><span class="badge ${m.status}">${m.status}</span></td><td>${esc(m.created)}</td></tr>`).join("") || `<tr><td class="muted">Nenhuma</td></tr>`;
    view.innerHTML = `<h1>Ao vivo</h1><div class="card"><h2>Em andamento</h2><table>${list(live)}</table></div>
      <div class="card"><h2>Agendadas</h2><table>${list(sched)}</table></div>`;
  },

  async matches() {
    const ms = await api("/matches");
    view.innerHTML = `<h1>Partidas</h1><div class="card"><table><tr><th>ID</th><th>Status</th><th>Vencedor</th><th>Data</th></tr>
      ${ms.map((m) => `<tr><td><a href="#/match/${m.id}">#${m.id}</a></td><td><span class="badge ${m.status}">${m.status}</span></td><td>${m.winner || "-"}</td><td>${esc(m.created)}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">Sem partidas</td></tr>`}</table></div>`;
  },

  async match(id) {
    const m = await api("/matches/" + id);
    const team = (t) => m.players.filter((p) => p.team === t).sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role));
    const col = (t, title) => `<div class="card team-col ${t}"><h2>${title}${m.winner === t ? " 🏆" : ""}</h2>
      ${team(t).map((p) => `<div class="player"><div class="info"><span class="role">${p.role}</span>
        <a href="#/player/${p.id}"><strong>${esc(p.nick)}</strong></a><small class="muted">${p.tier} · ${p.rating}</small></div>
        ${p.delta != null ? `<span class="delta ${p.delta >= 0 ? "pos" : "neg"}">${p.delta >= 0 ? "+" : ""}${p.delta}</span>` : ""}
        ${m.status === "finished" ? `<span class="badge">${p.votes} voto(s)</span>${state.me && state.me.id !== p.id ? `<button class="btn small ghost vote" data-id="${p.id}">MVP</button>` : ""}` : ""}
      </div>`).join("")}</div>`;
    view.innerHTML = `<h1>Partida #${m.id} <span class="badge ${m.status}">${m.status}</span></h1>
      ${state.adminKey === ADMIN_KEY && m.status !== "finished" ? `<div class="card row">
        ${m.status === "scheduled" ? `<button id="m-start">Iniciar</button>` : ""}
        <button id="m-blue" class="btn blue">Vitória Azul</button><button id="m-red" class="btn red">Vitória Vermelho</button></div>` : ""}
      <div class="grid2">${col("blue", "Lado Azul")}${col("red", "Lado Vermelho")}</div>`;
    const on = (sel, fn) => document.querySelectorAll(sel).forEach((el) => (el.onclick = act(() => fn(el))));
    on("#m-start", async () => { await api(`/matches/${id}/start`, { method: "POST" }); route(); });
    on("#m-blue", async () => { await api(`/matches/${id}/result`, { method: "POST", body: { winner: "blue" } }); route(); });
    on("#m-red", async () => { await api(`/matches/${id}/result`, { method: "POST", body: { winner: "red" } }); route(); });
    on(".vote", async (el) => { await api(`/matches/${id}/vote`, { method: "POST", body: { voter_id: state.me.id, target_id: Number(el.dataset.id) } }); route(); });
  },

  async ranking() {
    const r = await api("/ranking");
    view.innerHTML = `<h1>Ranking</h1><div class="card"><table><tr><th>#</th><th>Jogador</th><th>Tier</th><th>Rating</th><th>V</th><th>D</th><th>WR</th></tr>
      ${r.map((p, i) => `<tr><td>${i + 1}</td><td><a href="#/player/${p.id}">${esc(p.nick)}</a></td><td>${p.tier}</td><td>${p.rating}</td><td>${p.wins}</td><td>${p.losses}</td><td>${Math.round((100 * p.wins) / (p.wins + p.losses))}%</td></tr>`).join("") || `<tr><td colspan="7" class="muted">Ainda sem partidas finalizadas</td></tr>`}</table></div>`;
  },

  async players() {
    const r = await api("/players");
    view.innerHTML = `<h1>Jogadores</h1><div class="card"><table><tr><th>Jogador</th><th>Role</th><th>Tier</th><th>Rating</th></tr>
      ${r.map((p) => `<tr><td><a href="#/player/${p.id}">${esc(p.nick)}</a></td><td class="role">${p.role}</td><td>${p.tier}</td><td>${p.rating}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">Nenhum jogador</td></tr>`}</table></div>`;
  },

  async player(id) {
    const p = await api("/players/" + id);
    view.innerHTML = `<h1>${esc(p.nick)}</h1><div class="card"><p><span class="role">${p.role}</span> · ${p.tier} · ${p.rating} pts</p>
      <p class="muted">${p.wins} vitórias · ${p.losses} derrotas</p></div>`;
  },

  async calendar() {
    const ev = await api("/events");
    view.innerHTML = `<h1>Calendário</h1>
      ${state.adminKey === ADMIN_KEY ? `<div class="card row"><input id="e-title" placeholder="Título"><input id="e-date" type="datetime-local"><input id="e-desc" placeholder="Descrição"><button id="e-add">Adicionar</button></div>` : ""}
      <div class="card"><table>${ev.map((e) => `<tr><td>${esc(e.starts_at.replace("T", " "))}</td><td><strong>${esc(e.title)}</strong></td><td class="muted">${esc(e.description)}</td></tr>`).join("") || `<tr><td class="muted">Nenhum evento agendado</td></tr>`}</table></div>`;
    const add = document.getElementById("e-add");
    if (add) add.onclick = act(async () => {
      await api("/events", { method: "POST", body: { title: document.getElementById("e-title").value, starts_at: document.getElementById("e-date").value, description: document.getElementById("e-desc").value } });
      route();
    });
  },
};

async function route() {
  const [, name = "queue", arg] = location.hash.split("/");
  renderHeader();
  try { await (pages[name] || pages.queue)(arg); } catch (e) { view.innerHTML = `<div class="msg err">${esc(e.message)}</div>`; }
}
window.addEventListener("hashchange", route);
route();
