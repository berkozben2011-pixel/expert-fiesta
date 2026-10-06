// Socket.io yalnızca Multiplayer'a girilince yüklenir; Local Player buna hiç dokunmaz.
const MP = { sock: null, idx: 0 };
const loadIO = base => new Promise((ok, no) => { if (window.io) return ok(); const s = document.createElement("script"); s.src = base + "/socket.io/socket.io.js"; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
MP.connect = async () => {
  if (MP.sock && MP.sock.connected) return;
  const base = location.protocol === "file:" ? "http://localhost:3000" : "";
  await loadIO(base);
  await new Promise((ok, no) => { const s = io(base || undefined, { reconnection: false, timeout: 4000 }); MP.sock = s; s.on("connect", ok); s.on("connect_error", no); bind(s); });
};
MP.leave = () => { if (MP.sock) { const s = MP.sock; MP.sock = null; G.me = null; s.close(); } };
function bind(s) {
  s.on("room", r => {
    if (!r.started) { $("#lobCode").textContent = r.code; $("#lobPl").textContent = r.names[0] + (r.connected[1] ? " ⚔️ " + r.names[1] : " — rakip bekleniyor..."); $("#startMp").style.display = MP.idx === 0 ? "" : "none"; $("#startMp").disabled = !r.connected[1]; show("lobby"); }
    else { G.me = MP.idx; G.state = r.state; render(); }
  });
  s.on("err", toast);
  s.on("left", () => { MP.leave(); G.state = null; show("menu"); toast("Rakibin bağlantısı koptu."); });
  s.on("disconnect", () => { if (MP.sock === s) { MP.leave(); G.state = null; show("menu"); toast("Sunucu bağlantısı koptu."); } });
}
async function mpDo(kind) {
  $("#mpErr").textContent = "";
  try { await MP.connect(); } catch (e) { MP.sock = null; $("#mpErr").textContent = "Multiplayer sunucusuna bağlanılamadı."; return; }
  const name = $("#mpName").value, cb = r => { if (r.error) { $("#mpErr").textContent = r.error; return; } MP.idx = r.idx; };
  kind === "create" ? MP.sock.emit("create", name, cb) : MP.sock.emit("join", $("#joinCode").value, name, cb);
}
$("#createBtn").onclick = () => mpDo("create");
$("#joinBtn").onclick = () => mpDo("join");
$("#startMp").onclick = () => MP.sock.emit("start");
