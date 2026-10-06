(function (root) {
  const CURRENT = "Victor Osimhen|Marco Asensio|Orkun Kökçü|Milan Škriniar|Çağlar Söyüncü|Mauro Icardi|Youssef En-Nesyri|Sofyan Amrabat|Kerem Aktürkoğlu|Barış Alper Yılmaz|Cengiz Ünder".split("|");
  const LEGENDS = ("Ricardo Quaresma|Mario Gómez|Alex de Souza|Robin van Persie|Didier Drogba|Wesley Sneijder|Samuel Eto'o|Roberto Carlos|Nicolas Anelka|Guti|Diego Lugano|Radamel Falcao|Bafétimbi Gomis|Edin Džeko|Dries Mertens|Mesut Özil|Mario Jardel|Gheorghe Hagi|Gheorghe Popescu|Cláudio Taffarel|Pierre van Hooijdonk|Milan Baroš|Shabani Nonda|Elvir Bolić|Jay-Jay Okocha|John Carew|Harry Kewell|Nani|Diego Ribas|Raul Meireles|Bruno Alves|Pepe|Simon Kjær|Emre Belözoğlu|Burak Yılmaz|Arda Turan|Hakan Şükür|Sergen Yalçın|Tanju Çolak|" +
    "Hamit Altıntop|Rüştü Reçber|Hasan Şaş|Fernando Muslera|Volkan Demirel|Lukas Podolski|Dirk Kuyt|Mateja Kežman|Hugo Almeida|Ryan Babel|Felipe Melo|Lincoln|Anderson Talisca|Cenk Tosun|Selçuk İnan|Tuncay Şanlı").split("|");
  const slug = n => n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const list = [...CURRENT.map(n => ({ id: slug(n), name: n, category: "current" })),
                ...LEGENDS.map(n => ({ id: slug(n), name: n, category: "legend" }))];
  if (typeof module !== "undefined") module.exports = list; else root.PLAYERS = list;
})(this);
