const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const Core = AuctionCore, BYID = Object.fromEntries(PLAYERS.map(p => [p.id, p]));
const cfg = { sound: true, rounds: 20 };
try { Object.assign(cfg, JSON.parse(localStorage.getItem("sla") || "{}")); } catch (e) {}
const saveCfg = () => { try { localStorage.setItem("sla", JSON.stringify(cfg)); } catch (e) {} };
const G = { state: null, me: null, prev: "" }; // me=null → Local (aynı cihaz)
const up = t => t.toLocaleUpperCase("tr");

let ac;
function beep(f, d = .12) { if (!cfg.sound) return; try { ac = ac || new AudioContext(); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.value = .07; o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch (e) {} }
const SND = { card: [520, .2], bid: [660], high: [880], pass: [300], sold: [988, .4] };
const snd = k => beep(...SND[k]);
const show = id => $$(".screen").forEach(e => e.classList.toggle("on", e.id === id));
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2200); }

const actor = () => G.me === null ? G.state.turn : G.me;
function act(fn) { // Local: işlemi doğrudan tarayıcıda uygula
  const s = G.state, err = fn(s); if (err) return toast(err);
  render(); if (s.phase === "sold") setTimeout(() => { Core.next(s); render(); }, 2300);
}
function bid(a) { G.me === null ? act(s => Core.bid(s, s.turn, a)) : MP.sock.emit("bid", a); }
function pass() { snd("pass"); G.me === null ? act(s => Core.pass(s, s.turn)) : MP.sock.emit("pass"); }

function render() {
  const s = G.state; if (!s) return;
  if (s.phase === "end") return showEnd();
  show("game");
  const a = actor(), mine = s.phase === "auction" && s.turn === a, key = `${s.round}:${s.bid}:${s.phase}`;
  if (key !== G.prev) {
    const [r, b, ph] = G.prev.split(":");
    if (+r !== s.round) { snd("card"); const c = $("#card"); c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); }
    else if (ph !== "sold" && s.phase === "sold") snd("sold");
    else if (+b !== s.bid) snd(s.bid > +b + 1 ? "high" : "bid");
    $("#amt").value = Math.min(s.bid + 1, Math.max(s.budgets[a], 1)); G.prev = key;
  }
  $("#round").textContent = `TUR ${s.round} / ${s.total}`;
  $("#pname").textContent = up(BYID[s.current].name);
  $("#curbid").textContent = s.bid + " TL";
  $("#bidder").textContent = s.bidder === null ? "Henüz teklif yok" : "En yüksek teklif: " + s.names[s.bidder];
  [0, 1].forEach(i => { const e = $("#p" + i); e.querySelector("b").textContent = s.names[i] + (G.me === i ? " (SEN)" : ""); e.querySelector("i").textContent = s.budgets[i] + " TL"; e.classList.toggle("turn", s.phase === "auction" && s.turn === i); });
  $("#turn").textContent = s.phase !== "auction" ? "" : G.me === null ? `🟢 ${up(s.names[s.turn])}'İN SIRASI` : mine ? "🟢 SENİN SIRAN" : `⚪ ${up(s.names[s.turn])} BEKLİYOR`;
  $$("[data-inc]").forEach(b => b.disabled = !mine || s.bid + +b.dataset.inc > s.budgets[a]);
  $("#amt").max = s.budgets[a]; $("#amt").min = s.bid + 1;
  $("#bidBtn").disabled = $("#amt").disabled = !mine || s.budgets[a] <= s.bid;
  $("#passBtn").disabled = !mine;
  const so = $("#sold");
  if (s.phase === "sold") { const l = s.last; so.innerHTML = l.winner === null ? `<h1>SATILMADI</h1><div>${BYID[l.id].name}</div>` : `<h1>SATILDI!</h1><div>${up(BYID[l.id].name)}</div><div>${s.names[l.winner]} • ${l.price} TL</div>`; so.classList.add("on"); }
  else so.classList.remove("on");
}
function showEnd() {
  const s = G.state; $("#sold").classList.remove("on");
  $("#results").innerHTML = [0, 1].map(i => `<div class="res"><h3>${s.names[i]}</h3>${s.won[i].map(id => `<p>${BYID[id].name}</p>`).join("") || "<p>Futbolcu alınmadı</p>"}<p><b>Kalan para: ${s.budgets[i]} TL</b></p></div>`).join("");
  $("#replayBtn").style.display = G.me === null || G.me === 0 ? "" : "none"; show("end");
}
function startLocal(names) { G.me = null; G.prev = ""; G.state = Core.create(names, PLAYERS.map(p => p.id), cfg.rounds); render(); }

$$("[data-go]").forEach(b => b.onclick = () => { if (b.dataset.go === "menu" && typeof MP !== "undefined") MP.leave(); show(b.dataset.go); });
$$("[data-inc]").forEach(b => b.onclick = () => bid(G.state.bid + +b.dataset.inc));
$("#bidBtn").onclick = () => bid($("#amt").value);
$("#passBtn").onclick = pass;
$("#startLocal").onclick = () => startLocal([$("#n0").value.trim() || "Oyuncu 1", $("#n1").value.trim() || "Oyuncu 2"]);
$("#replayBtn").onclick = () => G.me === null ? startLocal(G.state.names) : MP.sock.emit("replay");
$("#endMenu").onclick = () => { MP.leave(); G.state = null; show("menu"); };
$("#optSound").checked = cfg.sound; $("#optRounds").value = cfg.rounds;
$("#optSound").onchange = e => { cfg.sound = e.target.checked; saveCfg(); };
$("#optRounds").onchange = e => { cfg.rounds = +e.target.value; saveCfg(); };
