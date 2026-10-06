// Sadece Multiplayer için. Local Player bu dosyaya ihtiyaç duymaz.
const express = require("express"), http = require("http"), { Server } = require("socket.io");
const Core = require("./auction-core.js"), PLAYERS = require("./players.js");
const app = express(); app.use(express.static(__dirname));
const server = http.createServer(app), io = new Server(server, { cors: { origin: "*" } });
const rooms = {}, ids = PLAYERS.map(p => p.id);
const clean = (n, fb) => String(n || "").trim().slice(0, 14) || fb;
const newCode = () => { let c; do c = Math.random().toString(36).slice(2, 7).toUpperCase(); while (rooms[c]); return c; };
const emit = r => io.to(r.code).emit("room", { code: r.code, names: r.names, connected: r.sockets.map(Boolean), started: !!r.state, state: r.state });
const room = s => rooms[s.data.room];

io.on("connection", s => {
  s.on("create", (name, cb) => {
    const r = { code: newCode(), names: [clean(name, "Oyuncu 1"), "—"], sockets: [s.id, null], state: null };
    rooms[r.code] = r; s.join(r.code); s.data = { room: r.code, idx: 0 };
    cb({ ok: true, idx: 0, code: r.code }); emit(r);
  });
  s.on("join", (code, name, cb) => {
    const r = rooms[String(code).trim().toUpperCase()];
    if (!r) return cb({ error: "Oda bulunamadı." });
    if (r.sockets[1] || r.state) return cb({ error: "Oda dolu." });
    r.names[1] = clean(name, "Oyuncu 2"); r.sockets[1] = s.id; s.join(r.code); s.data = { room: r.code, idx: 1 };
    cb({ ok: true, idx: 1, code: r.code }); emit(r);
  });
  s.on("start", () => { const r = s.data && room(s); if (r && s.data.idx === 0 && r.sockets[1] && !r.state) { r.state = Core.create(r.names, ids, 20); emit(r); } });
  s.on("replay", () => { const r = s.data && room(s); if (r && s.data.idx === 0 && r.state && r.state.phase === "end") { r.state = Core.create(r.names, ids, 20); emit(r); } });
  const act = fn => {
    const r = s.data && room(s); if (!r || !r.state) return;
    const err = fn(r.state, s.data.idx); if (err) return s.emit("err", err); // tüm doğrulama server'da
    emit(r);
    if (r.state.phase === "sold") setTimeout(() => { if (rooms[r.code]) { Core.next(r.state); emit(r); } }, 2500);
  };
  s.on("bid", amt => act((st, i) => Core.bid(st, i, amt)));
  s.on("pass", () => act((st, i) => Core.pass(st, i)));
  s.on("disconnect", () => { const r = s.data && room(s); if (!r) return; io.to(r.code).emit("left"); delete rooms[r.code]; });
});
server.listen(process.env.PORT || 3000, () => console.log("Sunucu: http://localhost:" + (process.env.PORT || 3000)));
