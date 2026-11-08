/* =====================================================================
   ESTRIQ · Kostenlose Rechner (Website)
   1) Objekt-Check  · 2) Finanzierungsrahmen
   Eingebunden auf /rechner/ und /academy/. Rechnet nur im Browser.
   Vereinfachte Modellrechnung – keine Anlage-, Steuer- oder
   Finanzierungsberatung.
   ===================================================================== */
(function () {
  "use strict";
  const host = document.querySelector("[data-estriq-rechner]");
  if (!host) return;
  const BASIS = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "");
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- Konstanten ---------- */
  // Grunderwerbsteuer in Prozent (Stand 2026, ohne Gewähr)
  const GREST = [["BW","Baden-Württemberg",5],["BY","Bayern",3.5],["BE","Berlin",6],["BB","Brandenburg",6.5],["HB","Bremen",5.5],
    ["HH","Hamburg",5.5],["HE","Hessen",6],["MV","Mecklenburg-Vorpommern",6],["NI","Niedersachsen",5],["NW","Nordrhein-Westfalen",6.5],
    ["RP","Rheinland-Pfalz",5],["SL","Saarland",6.5],["SN","Sachsen",5.5],["ST","Sachsen-Anhalt",5],["SH","Schleswig-Holstein",6.5],["TH","Thüringen",5]];
  const AFA = [["2", "Baujahr 1925 – 2022 · 2 %"], ["2.5", "Baujahr vor 1925 · 2,5 %"], ["3", "Baujahr ab 2023 · 3 %"]];

  /* ---------- Format ---------- */
  const MINUS = "−";
  const eur = (n, cent) => !isFinite(n) ? "–" : (n < 0 ? MINUS + " " : "") + Math.abs(n).toLocaleString("de-DE", { minimumFractionDigits: cent ? 2 : 0, maximumFractionDigits: cent ? 2 : 0 }) + " €";
  const eurS = n => !isFinite(n) ? "–" : (n > 0 ? "+ " : "") + eur(Math.round(n));
  const pz = (n, d = 2) => !isFinite(n) ? "–" : (n < 0 ? MINUS : "") + Math.abs(n).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " %";
  const zahl = (n, d = 1) => !isFinite(n) ? "–" : n.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
  const k = n => !isFinite(n) ? "–" : (Math.abs(n) >= 1e6 ? zahl(n / 1e6, 2) + " Mio." : Math.round(n / 1000).toLocaleString("de-DE") + " Tsd.");
  const parse = v => { const s = String(v == null ? "" : v).replace(/\s|€|%/g, "").replace(/\./g, "").replace(",", "."); const n = parseFloat(s); return isFinite(n) ? n : NaN; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- Darlehen: Monat für Monat ---------- */
  function plan(darlehen, zins, tilg, monate) {
    const rate = darlehen * (zins + tilg) / 1200;
    let rest = darlehen; const jahre = []; let zJ = 0, tJ = 0;
    for (let m = 1; m <= monate; m++) {
      const z = rest * zins / 1200; let t = Math.min(rest, rate - z); if (t < 0) t = 0;
      rest -= t; zJ += z; tJ += t;
      if (m % 12 === 0) { jahre.push({ rest, zinsen: zJ, tilgung: tJ }); zJ = 0; tJ = 0; }
    }
    return { rate, jahre, rest };
  }
  function laufzeit(darlehen, zins, tilg) {
    if (darlehen <= 0) return 0;
    const rate = darlehen * (zins + tilg) / 1200, i = zins / 1200;
    if (rate <= darlehen * i) return Infinity;
    if (i === 0) return darlehen / rate / 12;
    return -Math.log(1 - darlehen * i / rate) / Math.log(1 + i) / 12;
  }

  /* ---------- Ampel ---------- */
  const STUFE = { g: { w: "gut", p: 2 }, y: { w: "prüfen", p: 1 }, r: { w: "kritisch", p: 0 } };
  const stufe = (v, gut, mittel, hoeherBesser = true) => hoeherBesser ? (v >= gut ? "g" : v >= mittel ? "y" : "r") : (v <= gut ? "g" : v <= mittel ? "y" : "r");

  /* =====================================================================
     Felder
     ===================================================================== */
  const FELDER = {
    objekt: [
      { g: "Objekt", id: "kp", l: "Kaufpreis", e: "€", v: 240000, min: 30000, max: 1500000, s: 5000 },
      { g: "Objekt", id: "fl", l: "Wohnfläche", e: "m²", v: 68, min: 15, max: 600, s: 1 },
      { g: "Objekt", id: "miete", l: "Kaltmiete im Monat", e: "€", v: 1050, min: 100, max: 10000, s: 10 },
      { g: "Objekt", id: "land", l: "Bundesland", typ: "land", v: "NI" },
      { g: "Finanzierung", id: "ek", l: "Eigenkapital", e: "€", v: 40000, min: 0, max: 800000, s: 1000 },
      { g: "Finanzierung", id: "zins", l: "Sollzins", e: "%", v: 3.8, min: 0.5, max: 9, s: 0.05, d: 2 },
      { g: "Finanzierung", id: "tilg", l: "Anfangstilgung", e: "%", v: 2, min: 0.5, max: 8, s: 0.1, d: 1 },
      { g: "Finanzierung", id: "bind", l: "Zinsbindung", e: "Jahre", v: 10, min: 5, max: 30, s: 1 },
      { g: "Laufende Kosten", id: "nul", l: "Nicht umlagefähig (Hausgeld-Anteil, Verwaltung)", e: "€ / Mon.", v: 70, min: 0, max: 2000, s: 5, adv: 1 },
      { g: "Laufende Kosten", id: "inst", l: "Eigene Instandhaltungsrücklage", e: "€ / m² · Jahr", v: 9, min: 0, max: 40, s: 0.5, d: 1, adv: 1 },
      { g: "Laufende Kosten", id: "ausf", l: "Mietausfall-Wagnis", e: "%", v: 3, min: 0, max: 20, s: 0.5, d: 1, adv: 1 },
      { g: "Kaufnebenkosten", id: "makler", l: "Makler", e: "%", v: 3.57, min: 0, max: 7.14, s: 0.01, d: 2, adv: 1 },
      { g: "Kaufnebenkosten", id: "notar", l: "Notar und Grundbuch", e: "%", v: 2, min: 1, max: 3, s: 0.1, d: 1, adv: 1 },
      { g: "Kaufnebenkosten", id: "san", l: "Renovierung direkt nach Kauf", e: "€", v: 0, min: 0, max: 300000, s: 1000, adv: 1 },
      { g: "Steuer und Prognose", id: "gst", l: "Persönlicher Grenzsteuersatz", e: "%", v: 35, min: 0, max: 45, s: 1, adv: 1 },
      { g: "Steuer und Prognose", id: "geb", l: "Gebäudeanteil am Kaufpreis", e: "%", v: 75, min: 40, max: 95, s: 1, adv: 1 },
      { g: "Steuer und Prognose", id: "afa", l: "Abschreibung", typ: "afa", v: "2", adv: 1 },
      { g: "Steuer und Prognose", id: "mst", l: "Mietsteigerung pro Jahr", e: "%", v: 1.5, min: 0, max: 5, s: 0.1, d: 1, adv: 1 },
      { g: "Steuer und Prognose", id: "wst", l: "Wertentwicklung pro Jahr", e: "%", v: 1.5, min: -3, max: 6, s: 0.1, d: 1, adv: 1 },
      { g: "Steuer und Prognose", id: "kst", l: "Kostensteigerung pro Jahr", e: "%", v: 2, min: 0, max: 6, s: 0.1, d: 1, adv: 1 }
    ],
    rahmen: [
      { g: "Haushalt", id: "netto", l: "Netto-Haushaltseinkommen", e: "€ / Mon.", v: 4200, min: 1000, max: 30000, s: 50 },
      { g: "Haushalt", id: "leben", l: "Lebenshaltung inkl. eigener Miete", e: "€ / Mon.", v: 2600, min: 500, max: 20000, s: 50 },
      { g: "Haushalt", id: "kredite", l: "Bestehende Kreditraten", e: "€ / Mon.", v: 0, min: 0, max: 10000, s: 25 },
      { g: "Haushalt", id: "ek", l: "Eigenkapital für den Kauf", e: "€", v: 40000, min: 0, max: 800000, s: 1000 },
      { g: "Finanzierung", id: "zins", l: "Sollzins", e: "%", v: 3.8, min: 0.5, max: 9, s: 0.05, d: 2 },
      { g: "Finanzierung", id: "tilg", l: "Anfangstilgung", e: "%", v: 2, min: 0.5, max: 8, s: 0.1, d: 1 },
      { g: "Finanzierung", id: "bind", l: "Zinsbindung", e: "Jahre", v: 10, min: 5, max: 30, s: 1 },
      { g: "Finanzierung", id: "land", l: "Bundesland", typ: "land", v: "NI" },
      { g: "Annahmen", id: "rend", l: "Erwartete Bruttomietrendite des Objekts", e: "%", v: 4.8, min: 2, max: 10, s: 0.1, d: 1, adv: 1 },
      { g: "Annahmen", id: "anr", l: "Mieteinnahmen, die die Bank anrechnet", e: "%", v: 70, min: 0, max: 100, s: 5, adv: 1 },
      { g: "Annahmen", id: "bew", l: "Nicht umlagefähige Kosten und Rücklage", e: "% der Miete", v: 15, min: 0, max: 40, s: 1, adv: 1 },
      { g: "Annahmen", id: "puffer", l: "Sicherheitspuffer, der frei bleiben soll", e: "€ / Mon.", v: 300, min: 0, max: 3000, s: 50, adv: 1 },
      { g: "Annahmen", id: "makler", l: "Makler", e: "%", v: 3.57, min: 0, max: 7.14, s: 0.01, d: 2, adv: 1 },
      { g: "Annahmen", id: "notar", l: "Notar und Grundbuch", e: "%", v: 2, min: 1, max: 3, s: 0.1, d: 1, adv: 1 }
    ]
  };

  /* =====================================================================
     Rechenkern 1 · Objekt-Check
     ===================================================================== */
  function objektRechnen(w) {
    const land = GREST.find(g => g[0] === w.land) || GREST[8];
    const nkP = (land[2] + w.notar + w.makler) / 100;
    const nk = w.kp * nkP, invest = w.kp + nk + w.san;
    const darlehen = Math.max(0, invest - w.ek);
    const a = (w.zins + w.tilg) / 1200;
    const p = plan(darlehen, w.zins, w.tilg, 12 * Math.max(30, w.bind));
    const rate = p.rate;
    const ausfQ = w.ausf / 100;
    const mieteJ = w.miete * 12, ausfall = mieteJ * ausfQ, nulJ = w.nul * 12, instJ = w.inst * w.fl;
    const noi = mieteJ - ausfall - nulJ - instJ;
    const kapJ = rate * 12;
    const cfV = (noi - kapJ) / 12;
    const j1 = p.jahre[0] || { zinsen: 0, tilgung: 0, rest: darlehen };
    const afaBasis = (w.kp + nk) * w.geb / 100 + w.san;
    const afa = afaBasis * parseFloat(w.afa) / 100;
    const zvE = (mieteJ - ausfall) - j1.zinsen - afa - nulJ;
    const steuer = zvE * w.gst / 100;           // negativ = Erstattung
    const cfN = cfV - steuer / 12;
    const wertZ = w.kp * w.wst / 100;
    const vermoegen1 = j1.tilgung + wertZ + cfN * 12;
    const ekRend = w.ek > 0 ? vermoegen1 / w.ek * 100 : NaN;
    const dscr = kapJ > 0 ? noi / kapJ : Infinity;
    const bind = p.jahre[w.bind - 1] || { rest: 0 };
    const restBind = bind.rest;
    const lz = laufzeit(darlehen, w.zins, w.tilg);
    // Hebel für Cashflow 0 (vor Steuern)
    const beMiete = (kapJ + nulJ + instJ) / (12 * (1 - ausfQ));
    const maxKp = a > 0 ? ((noi / 12) / a + w.ek - w.san) / (1 + nkP) : Infinity;
    const ekNoetig = a > 0 ? invest - (noi / 12) / a : NaN;
    const faktor = w.kp / mieteJ;
    // Stresstest (Cashflow vor Steuern, Monat)
    const anschlussRate = restBind * (w.zins + 2 + w.tilg) / 1200;
    const stress = [
      { n: "Nach Plan", v: cfV, basis: true },
      { n: "Anschlusszins + 2 Prozentpunkte", v: (noi - anschlussRate * 12) / 12, info: "nach " + w.bind + " Jahren, auf die Restschuld" },
      { n: "3 Monate Leerstand im Jahr", v: (mieteJ * (1 - .25) - nulJ - instJ - kapJ) / 12, info: "statt " + pz(w.ausf, 1) + " Mietausfall" },
      { n: "Miete 10 % niedriger", v: (mieteJ * .9 * (1 - ausfQ) - nulJ - instJ - kapJ) / 12, info: "z. B. bei Neuvermietung" },
      { n: "Instandhaltung doppelt", v: (noi - instJ - kapJ) / 12, info: "Reparatur oder Sonderumlage" }
    ];
    stress.push({ n: "Alles zusammen", v: (mieteJ * .9 * .75 - nulJ - instJ * 2 - anschlussRate * 12) / 12, info: "der schlechte Fall" });
    const failed = stress.slice(1, 5).filter(s => s.v < 0).length;
    // Prognose 10 Jahre
    const prog = []; let cum = 0;
    for (let y = 1; y <= 10; y++) {
      const g = Math.pow(1 + w.mst / 100, y - 1), kg = Math.pow(1 + w.kst / 100, y - 1);
      const jr = p.jahre[y - 1] || { rest: 0, zinsen: 0 };
      const noiY = mieteJ * g * (1 - ausfQ) - (nulJ + instJ) * kg;
      const cfY = noiY - kapJ;
      const afaY = afaBasis * parseFloat(w.afa) / 100;
      const stY = ((mieteJ * g * (1 - ausfQ)) - jr.zinsen - afaY - nulJ * kg) * w.gst / 100;
      cum += cfY - stY;
      const wert = w.kp * Math.pow(1 + w.wst / 100, y);
      prog.push({ y, wert, rest: jr.rest, eq: wert - jr.rest, cum });
    }
    // Ampel
    const kriterien = [
      { n: "Kaufpreisfaktor", wert: zahl(faktor), st: stufe(faktor, 22, 28, false), t: "Kaufpreis geteilt durch Jahreskaltmiete. Bis 22 gut, bis 28 prüfen." },
      { n: "Nettomietrendite vs. Zins", wert: pz(noi / invest * 100) + " · Zins " + pz(w.zins), st: stufe(noi / invest * 100 - w.zins, .5, 0), t: "Trägt die Immobilie ihre eigene Finanzierung? Gut ab 0,5 Prozentpunkten über dem Zins." },
      { n: "Cashflow nach Steuern", wert: eurS(cfN) + " / Mon.", st: stufe(cfN, 0, -100), t: "Was dir monatlich bleibt oder was du zuschießt – nach Rate, Kosten und Steuereffekt." },
      { n: "Schuldendienstdeckung (DSCR)", wert: isFinite(dscr) ? zahl(dscr, 2) : "–", st: isFinite(dscr) ? stufe(dscr, 1.2, 1) : "g", t: "Reinertrag geteilt durch Kreditrate. Ab 1,2 gut, unter 1 deckt die Miete die Rate nicht." },
      { n: "Eigenkapital deckt Nebenkosten", wert: eur(w.ek) + " · NK " + eur(nk), st: w.ek >= nk ? "g" : w.ek >= nk / 2 ? "y" : "r", t: "Banken finanzieren Kaufnebenkosten ungern mit – dein Eigenkapital sollte sie mindestens decken." },
      { n: "Anfangstilgung", wert: pz(w.tilg, 1), st: stufe(w.tilg, 1.5, 1), t: "Unter 1,5 % dauert die Entschuldung sehr lange." },
      { n: "Stresstest", wert: (4 - failed) + " von 4 Fällen tragen", st: failed === 0 ? "g" : failed === 1 ? "y" : "r", t: "Zinsanstieg, Leerstand, Mietrückgang, Reparatur – jeweils einzeln." },
      { n: "Restschuld nach Zinsbindung", wert: pz(darlehen > 0 ? restBind / w.kp * 100 : 0, 0) + " vom Kaufpreis", st: stufe(darlehen > 0 ? restBind / w.kp * 100 : 0, 60, 80, false), t: "Je höher, desto stärker triffst du ein höherer Anschlusszins." }
    ];
    const score = Math.round(kriterien.reduce((s, x) => s + STUFE[x.st].p, 0) / (kriterien.length * 2) * 100);
    // Empfehlungen
    const emp = [];
    if (cfV < 0) {
      const opt = [];
      if (isFinite(beMiete)) opt.push(["Miete", "Kaltmiete von " + eur(Math.ceil(beMiete / 10) * 10) + " (" + eurS(Math.ceil((beMiete - w.miete) / 10) * 10) + ")"]);
      if (isFinite(maxKp) && maxKp > 0) opt.push(["Kaufpreis", "Kaufpreis von höchstens " + eur(Math.floor(maxKp / 1000) * 1000) + " (" + eurS(Math.floor((maxKp - w.kp) / 1000) * 1000) + ")"]);
      if (isFinite(ekNoetig)) opt.push(["Eigenkapital", "Eigenkapital von " + eur(Math.ceil(ekNoetig / 1000) * 1000) + " (" + eurS(Math.ceil((ekNoetig - w.ek) / 1000) * 1000) + ")"]);
      emp.push({ st: "r", t: "Für einen Cashflow von 0 € brauchst du eine dieser Stellschrauben", l: opt.map(o => o[1]) });
    } else emp.push({ st: "g", t: "Das Objekt trägt sich vor Steuern selbst", l: ["Puffer: " + eurS(cfV) + " im Monat nach Rate und Kosten.", "Die Miete dürfte um bis zu " + eur(Math.max(0, w.miete - beMiete)) + " fallen, bevor du zuschießt."] });
    if (faktor > 22) emp.push({ st: faktor > 28 ? "r" : "y", t: "Kaufpreis verhandeln", l: ["Bei Faktor 22 läge der Kaufpreis bei " + eur(Math.round(mieteJ * 22 / 1000) * 1000) + " – " + eur(Math.round((w.kp - mieteJ * 22) / 1000) * 1000) + " unter dem Angebot.", "Argumente sammeln: Zustand, Rücklage der WEG, Vergleichsangebote."] });
    if (w.ek < nk) emp.push({ st: w.ek >= nk / 2 ? "y" : "r", t: "Nebenkosten aus Eigenkapital zahlen", l: ["Die Kaufnebenkosten liegen bei " + eur(nk) + ". Bring mindestens diesen Betrag mit – sonst wird die Finanzierung deutlich teurer oder gar nicht angeboten."] });
    if (failed > 0) {
      const l = [];
      if (stress[1].v < 0) l.push("Zinsrisiko: Nach " + w.bind + " Jahren steigt die Rate bei +2 Prozentpunkten auf " + eur(anschlussRate) + ". Längere Zinsbindung oder Sondertilgung prüfen.");
      if (stress[2].v < 0 || stress[3].v < 0) l.push("Rücklage für Leerstand aufbauen: mindestens 3 Monatsraten (" + eur(rate * 3) + ") auf die Seite legen.");
      if (stress[4].v < 0) l.push("Bei älteren Objekten Zustand, Protokolle und Rücklage der Eigentümergemeinschaft genau prüfen.");
      emp.push({ st: failed > 1 ? "r" : "y", t: "Absichern gegen den schlechten Fall", l });
    }
    if (w.tilg < 1.5 && darlehen > 0) emp.push({ st: "y", t: "Tilgung erhöhen, wenn es der Cashflow zulässt", l: ["Mit " + pz(w.tilg, 1) + " Tilgung dauert die Entschuldung rund " + (isFinite(lz) ? Math.round(lz) + " Jahre" : "unendlich lange") + ".", "Mit 2 % wären es rund " + Math.round(laufzeit(darlehen, w.zins, 2)) + " Jahre."] });
    if (steuer < 0) emp.push({ st: "g", t: "Steuereffekt mitnehmen", l: ["Abschreibung und Zinsen bringen im ersten Jahr rund " + eur(-steuer) + " Steuererstattung (bei " + pz(w.gst, 0) + " Grenzsteuersatz).", "Tipp: Die Aufteilung Gebäude / Grundstück im Kaufvertrag beeinflusst die Abschreibung."] });
    return { land, nk, nkP, invest, darlehen, rate, noi, cfV, cfN, steuer, afa, zvE, j1, wertZ, vermoegen1, ekRend, dscr, restBind, lz, beMiete, maxKp, ekNoetig, faktor,
      brutto: mieteJ / w.kp * 100, netto: noi / invest * 100, preisM2: w.kp / w.fl, mieteM2: w.miete / w.fl, ausfall, nulJ, instJ, mieteJ,
      stress, failed, prog, kriterien, score, emp, anschlussRate };
  }

  /* =====================================================================
     Rechenkern 2 · Finanzierungsrahmen
     ===================================================================== */
  function rahmenRechnen(w) {
    const land = GREST.find(g => g[0] === w.land) || GREST[8];
    const nkP = (land[2] + w.notar + w.makler) / 100;
    function maxKp(zins, anr, puffer) {
      const a = (zins + w.tilg) / 1200;
      const frei = w.netto - w.leben - w.kredite - puffer;
      const mieteF = w.rend / 100 / 12;              // Miete je € Kaufpreis
      const netto = mieteF * (anr / 100 - w.bew / 100); // anrechenbare Miete minus Kosten
      const den = (1 + nkP) * a - netto;
      const hh = den > 0 ? (frei + w.ek * a) / den : Infinity;
      const ekGrenze = nkP > 0 ? w.ek / nkP : Infinity; // Nebenkosten aus Eigenkapital
      return { hh: Math.max(0, hh), ekGrenze, kp: Math.max(0, Math.min(hh, ekGrenze)), grenze: hh <= ekGrenze ? "haushalt" : "eigenkapital" };
    }
    const real = maxKp(w.zins, w.anr, w.puffer);
    const kons = maxKp(w.zins + 1, Math.min(w.anr, 60), w.puffer * 1.5);
    const maxi = maxKp(w.zins, Math.max(w.anr, 80), 0);
    const kp = real.kp;
    const nk = kp * nkP, darlehen = Math.max(0, kp + nk - w.ek);
    const p = plan(darlehen, w.zins, w.tilg, 12 * Math.max(30, w.bind));
    const rate = p.rate, miete = kp * w.rend / 100 / 12;
    const anrMiete = miete * w.anr / 100, kosten = miete * w.bew / 100;
    const ueber = w.netto - w.leben - w.kredite - rate + miete - kosten;     // echter Überschuss (volle Miete)
    const ueberBank = w.netto - w.leben - w.kredite - rate + anrMiete - kosten;
    const belast = w.netto > 0 ? (rate - anrMiete + kosten + w.kredite) / w.netto * 100 : NaN;
    const restBind = (p.jahre[w.bind - 1] || { rest: 0 }).rest;
    const anschluss = restBind * (w.zins + 2 + w.tilg) / 1200;
    const ueberZins = ueber + rate - anschluss;
    const lz = laufzeit(darlehen, w.zins, w.tilg);
    // Sensitivität Zins
    const zinsReihe = [-1, -.5, 0, .5, 1, 1.5].map(d => ({ z: w.zins + d, kp: maxKp(Math.max(.1, w.zins + d), w.anr, w.puffer).hh, jetzt: d === 0 }));
    // Hebel
    const plusEk = maxKp(w.zins, w.anr, w.puffer).kp;
    const mitEk = (() => { const o = w.ek; w.ek = o + 10000; const r = maxKp(w.zins, w.anr, w.puffer).kp; w.ek = o; return r; })();
    const ohneKredite = (() => { const o = w.kredite; w.kredite = 0; const r = maxKp(w.zins, w.anr, w.puffer).kp; w.kredite = o; return r; })();
    const kriterien = [
      { n: "Belastung nach Mietanrechnung", wert: pz(belast, 0) + " vom Netto", st: stufe(belast, 30, 40, false), t: "Rate minus angerechnete Miete plus Kosten und andere Kredite. Bis 30 % entspannt, bis 40 % eng." },
      { n: "Eigenkapital deckt Nebenkosten", wert: eur(w.ek) + " · NK " + eur(nk), st: w.ek >= nk * .999 ? "g" : w.ek >= nk / 2 ? "y" : "r", t: "Die meisten Banken erwarten, dass du mindestens die Kaufnebenkosten selbst zahlst." },
      { n: "Beleihung (Darlehen / Kaufpreis)", wert: pz(kp > 0 ? darlehen / kp * 100 : 0, 0), st: stufe(kp > 0 ? darlehen / kp * 100 : 0, 80, 100, false), t: "Bis 80 % gibt es die besten Zinsen. Über 100 % finanzierst du Nebenkosten mit – das bieten nur wenige Banken an." },
      { n: "Monatlicher Überschuss", wert: eurS(ueber), st: stufe(ueber, w.puffer, 0), t: "Was nach Lebenshaltung, Rate und Kosten übrig bleibt – mit voller Miete." },
      { n: "Zinsänderung nach Bindung", wert: eurS(ueberZins) + " bei +2 Pkt.", st: stufe(ueberZins, 0, -200), t: "Dein Überschuss, wenn der Anschlusszins 2 Prozentpunkte höher liegt." },
      { n: "Restschuld nach Zinsbindung", wert: pz(kp > 0 ? restBind / kp * 100 : 0, 0) + " vom Kaufpreis", st: stufe(kp > 0 ? restBind / kp * 100 : 0, 60, 80, false), t: "Wie stark dich ein höherer Anschlusszins treffen würde." },
      { n: "Anfangstilgung", wert: pz(w.tilg, 1), st: stufe(w.tilg, 1.5, 1), t: "Unter 1,5 % dauert die Entschuldung sehr lange." }
    ];
    const score = Math.round(kriterien.reduce((s, x) => s + STUFE[x.st].p, 0) / (kriterien.length * 2) * 100);
    const emp = [];
    if (real.grenze === "eigenkapital") emp.push({ st: "y", t: "Dein Eigenkapital ist die Grenze, nicht dein Einkommen", l: ["Dein Haushalt könnte rechnerisch " + eur(Math.floor(real.hh / 1000) * 1000) + " tragen.", "Mit " + eur(w.ek) + " Eigenkapital deckst du aber nur die Nebenkosten bis zu einem Kaufpreis von " + eur(Math.floor(real.ekGrenze / 1000) * 1000) + "."] });
    else emp.push({ st: "g", t: "Dein Einkommen bestimmt den Rahmen", l: ["Bis " + eur(Math.floor(kp / 1000) * 1000) + " bleibt dein Puffer von " + eur(w.puffer) + " im Monat erhalten."] });
    emp.push({ st: "g", t: "So vergrößerst du deinen Rahmen", l: [
      "10.000 € mehr Eigenkapital: " + eurS(Math.round((mitEk - plusEk) / 1000) * 1000) + " Kaufpreis.",
      w.kredite > 0 ? "Bestehende Kredite ablösen: " + eurS(Math.round((ohneKredite - plusEk) / 1000) * 1000) + " Kaufpreis." : "Ohne weitere Kredite bleibt dein Rahmen am größten – neue Ratenkäufe vermeiden.",
      "Objekte mit höherer Mietrendite tragen sich stärker selbst und erweitern den Rahmen."
    ] });
    if (ueberZins < 0) emp.push({ st: "y", t: "Zinsänderungsrisiko absichern", l: ["Steigt der Zins nach " + w.bind + " Jahren um 2 Prozentpunkte, steigt die Rate auf " + eur(anschluss) + ".", "Längere Zinsbindung oder Sondertilgungen reduzieren das Risiko."] });
    emp.push({ st: "y", t: "Bevor du zur Bank gehst", l: ["Banken rechnen mit eigenen Pauschalen für Lebenshaltung und Mietanrechnung – dein Ergebnis kann abweichen.", "Unterlagen bereitlegen: Gehaltsnachweise, Eigenkapitalnachweis, Selbstauskunft, Exposé."] });
    return { land, nkP, real, kons, maxi, kp, nk, darlehen, rate, miete, anrMiete, kosten, ueber, ueberBank, belast, restBind, anschluss, ueberZins, lz, zinsReihe, kriterien, score, emp, p };
  }

  /* =====================================================================
     Oberfläche
     ===================================================================== */
  const werte = { objekt: {}, rahmen: {} };
  Object.keys(FELDER).forEach(r => FELDER[r].forEach(f => werte[r][f.id] = f.v));
  // Rechnung aus dem Link wiederherstellen (#r=<tab>.<base64url JSON>), z. B. aus der Ergebnis-Mail
  let aktiv = "objekt";
  try {
    const m = (location.hash || "").match(/[#&]r=(objekt|rahmen)\.([A-Za-z0-9_-]+)/);
    if (m) {
      const json = decodeURIComponent(escape(atob(m[2].replace(/-/g, "+").replace(/_/g, "/"))));
      const v = JSON.parse(json);
      FELDER[m[1]].forEach(f => {
        if (!(f.id in v)) return;
        if (f.typ) { werte[m[1]][f.id] = String(v[f.id]); return; }
        const n = Number(v[f.id]); if (isFinite(n)) werte[m[1]][f.id] = clamp(n, f.min, f.max);
      });
      aktiv = m[1];
    }
  } catch (e) { /* ungültiger Link: Vorgaben bleiben */ }
  function linkFuer(r, mail) {
    const json = JSON.stringify(werte[r]);
    const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const basis = location.origin + location.pathname.replace(/academy\/?.*$/, "rechner/").replace(/rechner\/.*$/, "rechner/");
    return basis + (mail ? "?m=1" : "") + "#r=" + r + "." + b64;
  }
  // Freischaltung: wer seine Adresse bestätigt hat (oder aus der Mail kommt), wird nicht noch einmal gefragt
  let frei = false;
  try {
    const q = new URLSearchParams(location.search);
    if (q.get("bestaetigt") === "1" || q.get("m") === "1") localStorage.setItem("estriq_rechner_frei", "1");
    frei = localStorage.getItem("estriq_rechner_frei") === "1";
  } catch (e) { const q = new URLSearchParams(location.search); frei = q.get("bestaetigt") === "1" || q.get("m") === "1"; }

  function feldHtml(r, f) {
    const id = "rc-" + r + "-" + f.id;
    if (f.typ === "land" || f.typ === "afa") {
      const opts = f.typ === "land" ? GREST.map(g => `<option value="${g[0]}">${g[1]} · ${String(g[2]).replace(".", ",")} %</option>`).join("") : AFA.map(a => `<option value="${a[0]}">${a[1]}</option>`).join("");
      return `<label class="rc-f" for="${id}"><span class="rc-l">${f.l}</span><span class="rc-in"><select id="${id}" data-r="${r}" data-f="${f.id}">${opts}</select></span></label>`;
    }
    return `<label class="rc-f" for="${id}"><span class="rc-l">${f.l}</span>
      <span class="rc-in"><input id="${id}" inputmode="decimal" data-r="${r}" data-f="${f.id}" value="${fmtIn(f, werte[r][f.id])}"><em>${f.e}</em></span>
      <input class="rc-sl" type="range" tabindex="-1" aria-hidden="true" data-r="${r}" data-sl="${f.id}" min="${f.min}" max="${f.max}" step="${f.s}" value="${werte[r][f.id]}"></label>`;
  }
  function fmtIn(f, v) { return f.d ? Number(v).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: f.d }) : Math.round(v).toLocaleString("de-DE"); }

  function formHtml(r) {
    const gruppen = [];
    FELDER[r].forEach(f => { let g = gruppen.find(x => x.n === f.g); if (!g) gruppen.push(g = { n: f.g, f: [], adv: true }); g.f.push(f); if (!f.adv) g.adv = false; });
    const basis = gruppen.filter(g => !g.adv), profi = gruppen.filter(g => g.adv);
    const block = g => `<fieldset class="rc-grp"><legend>${g.n}</legend><div class="rc-grid">${g.f.map(f => feldHtml(r, f)).join("")}</div></fieldset>`;
    return basis.map(block).join("") + `<details class="rc-profi"><summary><span>Profi-Einstellungen</span><small>Kosten, Steuer, Prognose · ${profi.reduce((s, g) => s + g.f.length, 0)} Werte</small></summary>${profi.map(block).join("")}</details>`;
  }

  function ring(score) {
    const st = score >= 70 ? "g" : score >= 45 ? "y" : "r";
    const c = 2 * Math.PI * 52, off = c * (1 - score / 100);
    return `<div class="rc-ring rc-${st}"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/></svg><div><b>${score}</b><span>von 100</span></div></div>`;
  }
  const ampelWort = s => s >= 70 ? ["g", "Solide aufgestellt"] : s >= 45 ? ["y", "Mit Nachbesserung"] : ["r", "Kritisch"];
  function kritHtml(list) {
    return `<div class="rc-krit">${list.map(x => `<div class="rc-k rc-${x.st}"><i></i><div><b>${x.n}</b><small>${x.t}</small></div><span>${x.wert}</span><em>${STUFE[x.st].w}</em></div>`).join("")}</div>`;
  }
  function empHtml(list) {
    return `<div class="rc-emp">${list.map(e => `<article class="rc-e rc-${e.st}"><h5><i></i>${e.t}</h5><ul>${e.l.map(x => `<li>${x}</li>`).join("")}</ul></article>`).join("")}</div>`;
  }

  /* ---------- Diagramme (SVG, von Hand) ---------- */
  function wasserfall(o) {
    const st = [
      { n: "Kaltmiete", v: o.mieteJ / 12, t: "plus" },
      { n: "Mietausfall", v: -o.ausfall / 12 },
      { n: "Nicht umlagef.", v: -o.nulJ / 12 },
      { n: "Rücklage", v: -o.instJ / 12 },
      { n: "Zins", v: -o.j1.zinsen / 12, c: "#F59E0B" },
      { n: "Tilgung", v: -o.j1.tilgung / 12, c: "#3B82F6" },
      { n: "vor Steuern", v: o.cfV, t: "sum" },
      { n: "Steuer", v: -o.steuer / 12, c: o.steuer < 0 ? "#4ADE80" : "#94A3B8" },
      { n: "nach Steuern", v: o.cfN, t: "sum" }
    ];
    let lauf = 0; const bars = [];
    st.forEach(s => {
      if (s.t === "plus") { bars.push({ ...s, a: 0, b: s.v }); lauf = s.v; }
      else if (s.t === "sum") { bars.push({ ...s, a: 0, b: s.v }); lauf = s.v; }
      else { bars.push({ ...s, a: lauf, b: lauf + s.v }); lauf += s.v; }
    });
    const max = Math.max(...bars.map(b => Math.max(b.a, b.b)), 1), min = Math.min(0, ...bars.map(b => Math.min(b.a, b.b)));
    const W = 640, H = 240, top = 22, bot = 40, n = bars.length, bw = W / n;
    const y = v => top + (max - v) / (max - min) * (H - top - bot);
    let s = `<svg viewBox="0 0 ${W} ${H}" class="rc-svg" role="img" aria-label="Wasserfall: von der Kaltmiete zum Cashflow">`;
    s += `<line x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}" class="ax"/>`;
    bars.forEach((b, i) => {
      const x = i * bw + bw * .16, w2 = bw * .68, y1 = y(Math.max(b.a, b.b)), y2 = y(Math.min(b.a, b.b));
      const col = b.t === "plus" ? "#22C55E" : b.t === "sum" ? (b.v >= 0 ? "#4ADE80" : "#F43F5E") : (b.c || "#64748B");
      s += `<rect x="${x}" y="${y1}" width="${w2}" height="${Math.max(1.5, y2 - y1)}" rx="3" fill="${col}" ${b.t === "sum" ? 'class="sum"' : ""}/>`;
      if (i < n - 1 && b.t !== "sum") s += `<line x1="${x + w2}" x2="${(i + 1) * bw + bw * .16}" y1="${y(b.b)}" y2="${y(b.b)}" class="con"/>`;
      s += `<text x="${x + w2 / 2}" y="${y1 - 6}" class="vl">${(b.t === "plus" ? "" : (b.v < 0 ? MINUS : "+")) + Math.round(Math.abs(b.v)).toLocaleString("de-DE")}</text>`;
      s += `<text x="${x + w2 / 2}" y="${H - 22}" class="lb">${b.n}</text>`;
    });
    return s + `</svg>`;
  }
  function prognose(o) {
    const kp0 = werte.objekt.kp;
    const d = [{ y: 0, wert: kp0, rest: o.darlehen, eq: kp0 - o.darlehen }].concat(o.prog);
    const W = 640, H = 240, l = 56, r = 12, t = 16, b = 30;
    const max = Math.max(...d.map(x => x.wert)) * 1.05;
    const X = i => l + i / 10 * (W - l - r), Y = v => t + (1 - v / max) * (H - t - b);
    const pfad = key => d.map((p, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(Math.max(0, p[key])).toFixed(1)).join(" ");
    let s = `<svg viewBox="0 0 ${W} ${H}" class="rc-svg" role="img" aria-label="Prognose über 10 Jahre">`;
    for (let g = 0; g <= 4; g++) { const v = max * g / 4; s += `<line x1="${l}" x2="${W - r}" y1="${Y(v)}" y2="${Y(v)}" class="gr"/><text x="${l - 8}" y="${Y(v) + 4}" class="ya">${k(v)}</text>`; }
    s += `<path d="${pfad("wert")} L ${X(10)} ${Y(0)} L ${X(0)} ${Y(0)} Z" class="ar-w"/>`;
    s += `<path d="${pfad("rest")} L ${X(10)} ${Y(0)} L ${X(0)} ${Y(0)} Z" class="ar-r"/>`;
    s += `<path d="${pfad("wert")}" class="ln-w"/><path d="${pfad("rest")}" class="ln-r"/><path d="${pfad("eq")}" class="ln-e"/>`;
    d.forEach((p, i) => { if (i % 2 === 0) s += `<text x="${X(i)}" y="${H - 10}" class="xa">${i === 0 ? "heute" : "J" + i}</text>`; });
    const e = d[10];
    s += `<circle cx="${X(10)}" cy="${Y(e.eq)}" r="4.5" class="pt-e"/>`;
    return s + `</svg>`;
  }
  function stressBars(list) {
    const max = Math.max(...list.map(s => Math.abs(s.v)), 1);
    return `<div class="rc-stress">${list.map(s => {
      const w = Math.abs(s.v) / max * 50;
      return `<div class="rc-sr${s.basis ? " basis" : ""}"><div class="n"><b>${s.n}</b>${s.info ? `<small>${s.info}</small>` : ""}</div>
        <div class="bar"><i class="${s.v >= 0 ? "pos" : "neg"}" style="${s.v >= 0 ? "left:50%" : "right:50%"};width:${w.toFixed(1)}%"></i><u></u></div>
        <div class="v ${s.v >= 0 ? "pos" : "neg"}">${eurS(s.v)}<small>${s.v >= 0 ? "trägt sich" : "Zuschuss"}</small></div></div>`;
    }).join("")}</div>`;
  }
  function korridor(o) {
    const lo = Math.min(o.kons.hh, o.real.hh), hhR = o.real.hh, hi = Math.max(o.maxi.hh, hhR * 1.02), ek = o.real.ekGrenze, mid = o.kp;
    const max = Math.max(hi, isFinite(ek) ? ek : 0) * 1.08 || 1, p = v => clamp(v / max * 100, 0, 100);
    const r = v => eur(Math.floor(v / 1000) * 1000);
    return `<div class="rc-kor"><div class="track"><i class="r" style="left:0;width:${p(lo)}%"></i><i class="g" style="left:${p(lo)}%;width:${p(hhR) - p(lo)}%"></i><i class="y" style="left:${p(hhR)}%;width:${p(hi) - p(hhR)}%"></i>
      ${isFinite(ek) ? `<span class="ek" style="left:${p(ek)}%"><small>Eigenkapital-Grenze ${r(ek)}</small></span>` : ""}
      <span class="mk" style="left:${p(mid)}%"><b>${r(mid)}</b></span></div>
      <div class="lg"><span><i class="g"></i>Haushalt konservativ ${r(lo)} – realistisch ${r(hhR)}</span><span><i class="y"></i>An der Grenze bis ${r(hi)}</span></div></div>`;
  }
  function zinsChart(o) {
    const max = Math.max(...o.zinsReihe.map(z => z.kp), 1);
    return `<div class="rc-zr">${o.zinsReihe.map(z => `<div class="${z.jetzt ? "on" : ""}"><span class="v">${k(z.kp)}</span><i style="height:${(z.kp / max * 100).toFixed(1)}%"></i><span class="l">${pz(z.z, 2)}</span></div>`).join("")}</div>`;
  }
  const kpi = (l, v, s, cls) => `<div class="rc-kpi ${cls || ""}"><span>${l}</span><b>${v}</b>${s ? `<small>${s}</small>` : ""}</div>`;

  /* ---------- Ergebnis zeichnen ---------- */
  function zeichneObjekt() {
    const w = werte.objekt, o = objektRechnen(w), [st, wort] = ampelWort(o.score);
    $("#rcOutObjekt").innerHTML = `
      <div class="rc-head">
        ${ring(o.score)}
        <div class="rc-hl"><span class="rc-tag rc-${st}"><i></i>${wort}</span>
          <div class="rc-big ${o.cfN >= 0 ? "pos" : "neg"}">${eurS(o.cfN)}<small> / Monat</small></div>
          <p>Cashflow nach Steuern im ersten Jahr · vor Steuern ${eurS(o.cfV)}</p></div>
      </div>
      <div class="rc-kpis">
        ${kpi("Bruttomietrendite", pz(o.brutto), "Nettomietrendite " + pz(o.netto))}
        ${kpi("Kaufpreisfaktor", zahl(o.faktor), eur(o.preisM2) + " je m² · Miete " + zahl(o.mieteM2, 2) + " €/m²")}
        ${kpi("Gesamtinvestition", eur(o.invest), "davon Nebenkosten " + eur(o.nk) + " (" + pz(o.nkP * 100, 2) + ")")}
        ${kpi("Darlehen · Rate", eur(o.darlehen), eur(o.rate) + " im Monat")}
        ${kpi("Vermögenszuwachs Jahr 1", eurS(o.vermoegen1), "Tilgung + Wertentwicklung + Cashflow", o.vermoegen1 >= 0 ? "pos" : "neg")}
        ${kpi("Eigenkapitalrendite", isFinite(o.ekRend) ? pz(o.ekRend, 1) : "ohne EK", "auf " + eur(werte.objekt.ek) + " Eigenkapital")}
        ${kpi("Steuereffekt Jahr 1", eurS(-o.steuer), "Abschreibung " + eur(o.afa) + " im Jahr", o.steuer <= 0 ? "pos" : "")}
        ${kpi("Restschuld nach " + w.bind + " J.", eur(o.restBind), isFinite(o.lz) ? "schuldenfrei nach ca. " + Math.round(o.lz) + " Jahren" : "Rate deckt die Zinsen nicht", "")}
      </div>
      <div class="rc-panel"><div class="rc-ph"><h4>Wohin die Miete geht</h4><span>Monat, erstes Jahr</span></div><div class="rc-scroll">${wasserfall(o)}</div></div>
      <div class="rc-panel"><div class="rc-ph"><h4>Ampel · 8 Kriterien</h4><span>${o.kriterien.filter(x => x.st === "g").length} gut · ${o.kriterien.filter(x => x.st === "y").length} prüfen · ${o.kriterien.filter(x => x.st === "r").length} kritisch</span></div>${kritHtml(o.kriterien)}</div>
      <div class="rc-two">
        <div class="rc-panel"><div class="rc-ph"><h4>Stresstest</h4><span>Cashflow vor Steuern / Monat</span></div>${stressBars(o.stress)}</div>
        <div class="rc-panel"><div class="rc-ph"><h4>10 Jahre Vermögensaufbau</h4><span>Prognose mit deinen Annahmen</span></div><div class="rc-scroll">${prognose(o)}</div>
          <div class="rc-leg"><span><i class="w"></i>Objektwert</span><span><i class="r"></i>Restschuld</span><span><i class="e"></i>Dein Eigenkapital im Objekt</span></div>
          <div class="rc-mini">${kpi("Eigenkapital im Objekt nach 10 J.", eur(o.prog[9].eq), "", "pos")}${kpi("Summe Cashflow nach Steuern", eurS(o.prog[9].cum), "", o.prog[9].cum >= 0 ? "pos" : "neg")}</div></div>
      </div>
      <div class="rc-panel"><div class="rc-ph"><h4>Handlungsempfehlungen</h4><span>aus deinen Zahlen berechnet</span></div>${empHtml(o.emp)}</div>`;
    window.__estriqErgebnis = "Objekt-Check: KP " + Math.round(w.kp) + ", Miete " + Math.round(w.miete) + ", EK " + Math.round(w.ek) + ", Score " + o.score + ", CF n. St. " + Math.round(o.cfN);
  }
  function zeichneRahmen() {
    const w = werte.rahmen, o = rahmenRechnen(w), [st, wort] = ampelWort(o.score);
    $("#rcOutRahmen").innerHTML = `
      <div class="rc-head">
        ${ring(o.score)}
        <div class="rc-hl"><span class="rc-tag rc-${st}"><i></i>${wort}</span>
          <div class="rc-big">${eur(Math.floor(o.kp / 1000) * 1000)}</div>
          <p>realistischer Kaufpreis für eine vermietete Immobilie · Grenze: ${o.real.grenze === "eigenkapital" ? "dein Eigenkapital" : "dein Haushalt"}</p></div>
      </div>
      <div class="rc-panel"><div class="rc-ph"><h4>Dein Kaufpreis-Korridor</h4><span>konservativ · realistisch · an der Grenze</span></div>${korridor(o)}</div>
      <div class="rc-kpis rc-k3">
        ${kpi("Darlehen", eur(o.darlehen), "Kaufnebenkosten " + eur(o.nk) + (w.ek >= o.nk * .999 ? " aus Eigenkapital" : ""))}
        ${kpi("Rate im Monat", eur(o.rate), pz(w.zins) + " Zins · " + pz(w.tilg, 1) + " Tilgung")}
        ${kpi("Erwartete Kaltmiete", eur(o.miete), "die Bank rechnet mit " + eur(o.anrMiete))}
        ${kpi("Überschuss nach Kauf", eurS(o.ueber), "mit voller Miete · Puffer " + eur(w.puffer), o.ueber >= 0 ? "pos" : "neg")}
        ${kpi("Belastungsquote", pz(o.belast, 0), "vom Netto-Einkommen")}
        ${kpi("Restschuld nach " + w.bind + " J.", eur(o.restBind), "Anschlussrate bei +2 Pkt.: " + eur(o.anschluss))}
      </div>
      <div class="rc-panel"><div class="rc-ph"><h4>Wie der Zins deinen Rahmen verschiebt</h4><span>was dein Haushalt tragen kann${isFinite(o.real.ekGrenze) ? " · Eigenkapital-Grenze " + eur(Math.floor(o.real.ekGrenze / 1000) * 1000) : ""}</span></div>${zinsChart(o)}</div>
      <div><div class="rc-panel"><div class="rc-ph"><h4>Ampel · 7 Kriterien</h4><span>${o.kriterien.filter(x => x.st === "g").length} gut · ${o.kriterien.filter(x => x.st === "y").length} prüfen · ${o.kriterien.filter(x => x.st === "r").length} kritisch</span></div>${kritHtml(o.kriterien)}</div>
      </div>
      <div class="rc-panel"><div class="rc-ph"><h4>Handlungsempfehlungen</h4><span>aus deinen Zahlen berechnet</span></div>${empHtml(o.emp)}</div>`;
    window.__estriqErgebnis = "Finanzierungsrahmen: Netto " + Math.round(w.netto) + ", EK " + Math.round(w.ek) + ", max. KP " + Math.round(o.kp) + ", Score " + o.score;
  }

  /* ---------- Gerüst ---------- */
  host.innerHTML = `
    <div class="rc-tabs" role="tablist">
      <button role="tab" class="on" data-tab="objekt" aria-selected="true"><b>Objekt-Check</b><small>Rechnet sich diese Immobilie?</small></button>
      <button role="tab" data-tab="rahmen" aria-selected="false"><b>Finanzierungsrahmen</b><small>Was kann ich mir leisten?</small></button>
    </div>
    <div class="rc-tools"><button type="button" data-rc="pdf" class="rc-pdfbtn"><b>Analyse-PDF herunterladen</b></button><button type="button" data-rc="link">Link zu dieser Rechnung kopieren</button><span class="rc-hint" aria-live="polite"></span></div>
    <div class="rc-body" data-pane="objekt"><form class="rc-form" novalidate>${formHtml("objekt")}</form><div class="rc-out" id="rcOutObjekt" aria-live="polite"></div></div>
    <div class="rc-body hide" data-pane="rahmen"><form class="rc-form" novalidate>${formHtml("rahmen")}</form><div class="rc-out" id="rcOutRahmen" aria-live="polite"></div></div>
    <p class="rc-fein">Vereinfachte Modellrechnung mit deinen Annahmen. Grunderwerbsteuer Stand 2026 ohne Gewähr. Steuereffekt vereinfacht (Abschreibung, Zinsen, nicht umlagefähige Kosten). Keine Anlage-, Steuer- oder Finanzierungsberatung – Banken und Finanzamt rechnen mit eigenen Werten.</p>`;
  $$("select[data-f]", host).forEach(s => { s.value = werte[s.dataset.r][s.dataset.f]; });

  const zeichne = r => (r === "objekt" ? zeichneObjekt : zeichneRahmen)();
  let timer = {};
  const spaeter = r => { clearTimeout(timer[r]); timer[r] = setTimeout(() => zeichne(r), 60); };
  host.addEventListener("input", e => {
    const t = e.target, r = t.dataset.r; if (!r) return;
    if (t.dataset.sl) {
      const f = FELDER[r].find(x => x.id === t.dataset.sl); const v = parseFloat(t.value);
      werte[r][f.id] = v; const inp = $(`input[data-r="${r}"][data-f="${f.id}"]`, host); if (inp) inp.value = fmtIn(f, v);
    } else if (t.dataset.f) {
      const f = FELDER[r].find(x => x.id === t.dataset.f);
      if (f.typ) werte[r][f.id] = t.value;
      else { const v = parse(t.value); if (!isFinite(v)) return; werte[r][f.id] = v; const sl = $(`input[data-sl="${f.id}"][data-r="${r}"]`, host); if (sl) sl.value = v; }
    }
    spaeter(r);
  });
  host.addEventListener("change", e => { const t = e.target; if (t.dataset.f && !t.dataset.sl) { const r = t.dataset.r, f = FELDER[r].find(x => x.id === t.dataset.f); if (!f.typ) { const v = clamp(werte[r][f.id], f.min, f.max); werte[r][f.id] = v; t.value = fmtIn(f, v); } spaeter(r); } });
  function tabSetzen(t) {
    aktiv = t;
    $$(".rc-tabs button", host).forEach(x => { const on = x.dataset.tab === t; x.classList.toggle("on", on); x.setAttribute("aria-selected", on); });
    $$(".rc-body", host).forEach(p => p.classList.toggle("hide", p.dataset.pane !== t));
    zeichne(t);
  }
  $$(".rc-tabs button", host).forEach(b => b.addEventListener("click", () => tabSetzen(b.dataset.tab)));
  const hint = $(".rc-hint", host);
  const melden = t => { if (!hint) return; hint.textContent = t; clearTimeout(melden.t); melden.t = setTimeout(() => hint.textContent = "", 3500); };
  $('[data-rc="link"]', host).addEventListener("click", async () => {
    const l = linkFuer(aktiv);
    try { await navigator.clipboard.writeText(l); melden("Link kopiert – damit öffnest du genau diese Rechnung wieder."); }
    catch (e) { window.prompt("Link zu deiner Rechnung:", l); }
  });
  function skript(src) { return new Promise((ok, f) => { if (src.indexOf("rechner-pdf") > -1 && window.estriqPdf) return ok(); const t = document.createElement("script"); t.src = src; t.onload = ok; t.onerror = f; document.head.appendChild(t); }); }
  async function pdfLaden(knopf) {
    const alt = knopf ? knopf.innerHTML : "";
    if (knopf) { knopf.disabled = true; knopf.textContent = "PDF wird erstellt …"; }
    try {
      await skript(BASIS + "rechner-pdf.js");
      await window.estriqPdf(aktiv, BASIS);
      melden("Fertig – dein Analyse-PDF ist heruntergeladen.");
    } catch (e) { melden("Das PDF ließ sich gerade nicht erstellen. Bitte lade die Seite neu und versuch es noch einmal."); }
    finally { if (knopf) { knopf.disabled = false; knopf.innerHTML = alt; } }
  }
  function zurMail() {
    const ziel = document.querySelector(".ac-rcta");
    if (ziel) { ziel.scrollIntoView({ behavior: "smooth", block: "center" }); const i = ziel.querySelector("input[type=email]"); if (i) setTimeout(() => i.focus(), 500); ziel.classList.add("rc-blink"); setTimeout(() => ziel.classList.remove("rc-blink"), 1600); }
    melden("Das Analyse-PDF schalten wir mit deiner E-Mail-Adresse frei – einmal bestätigen, dann jederzeit herunterladen.");
  }
  $('[data-rc="pdf"]', host).addEventListener("click", e => frei ? pdfLaden(e.currentTarget) : zurMail());
  // Kasten unter dem Rechner: nach der Freischaltung PDF statt E-Mail-Formular
  function kastenFreischalten() {
    const k = document.querySelector(".ac-rcta"); if (!k) return;
    k.classList.add("rc-frei");
    k.innerHTML = '<div><b>Deine Analyse ist freigeschaltet</b><span>Lade jederzeit dein Analyse-PDF herunter – mit Ampel, Stresstest, Prognose, Empfehlungen und allen Annahmen. Änderst du oben Werte, passt sich das PDF an.</span></div>' +
      '<div class="rc-frei-k"><button type="button" class="btn btn-p rc-frei-pdf">Analyse-PDF herunterladen</button><button type="button" class="btn btn-g rc-frei-link">Link zur Rechnung kopieren</button></div>';
    k.querySelector(".rc-frei-pdf").addEventListener("click", e => pdfLaden(e.currentTarget));
    k.querySelector(".rc-frei-link").addEventListener("click", () => $('[data-rc="link"]', host).click());
  }
  if (frei) kastenFreischalten();
  zeichneObjekt(); zeichneRahmen();
  if (aktiv !== "objekt") tabSetzen(aktiv);
  if (/[#&]r=/.test(location.hash || "")) setTimeout(() => host.scrollIntoView({ block: "start" }), 300);
  window.__acErgebnis = () => window.__estriqErgebnis || "";
  window.__estriqLink = () => linkFuer(aktiv, true);
  window.ESTRIQ_RECHNER = { objektRechnen, rahmenRechnen, werte, FELDER, GREST, AFA };
  window.__estriqTab = () => aktiv;
})();
