// Saf oyun mantığı: tarayıcıda (Local) ve server.js'de (Multiplayer doğrulama) aynı kod kullanılır.
(function (root) {
  const A = {};
  A.shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  A.create = (names, ids, rounds = 20, budget = 20) => {
    const pool = A.shuffle(ids).slice(0, Math.min(rounds, ids.length)); // tekrar yok
    const s = { names, budgets: [budget, budget], won: [[], []], pool, total: pool.length, round: 0, current: null, bid: 0, bidder: null, turn: 0, passedOnce: false, phase: "auction", last: null };
    return A.next(s);
  };
  A.next = s => {
    if (s.round >= s.total) { s.phase = "end"; s.current = null; return s; }
    s.current = s.pool[s.round++]; s.bid = 0; s.bidder = null; s.turn = (s.round - 1) % 2; s.passedOnce = false; s.phase = "auction"; s.last = null;
    return s;
  };
  A.bid = (s, p, amt) => {
    if (s.phase !== "auction") return "Aktif açık artırma yok.";
    if (s.turn !== p) return "Sıra sende değil.";
    amt = Number(amt);
    if (!Number.isInteger(amt) || amt < 1) return "Geçersiz teklif.";
    if (amt <= s.bid) return `Teklif ${s.bid} TL'den yüksek olmalı.`;
    if (amt > s.budgets[p]) return "Bütçen yetmiyor.";
    s.bid = amt; s.bidder = p; s.turn = 1 - p; s.passedOnce = false; return null;
  };
  A.pass = (s, p) => {
    if (s.phase !== "auction") return "Aktif açık artırma yok.";
    if (s.turn !== p) return "Sıra sende değil.";
    if (s.bidder !== null) { // diğer oyuncu pas: en yüksek teklif sahibi kazanır
      s.budgets[s.bidder] -= s.bid; s.won[s.bidder].push(s.current);
      s.last = { id: s.current, winner: s.bidder, price: s.bid }; s.phase = "sold";
    } else if (s.passedOnce) { s.last = { id: s.current, winner: null, price: 0 }; s.phase = "sold"; }
    else { s.passedOnce = true; s.turn = 1 - p; }
    return null;
  };
  if (typeof module !== "undefined") module.exports = A; else root.AuctionCore = A;
})(this);
