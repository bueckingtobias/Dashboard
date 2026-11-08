/* =====================================================================
   ESTRIQ · Analyse-PDF für die Rechner (läuft komplett im Browser)
   Braucht: pdf-lib (rechner/pdf-lib.min.js, MIT) und window.ESTRIQ_RECHNER
   aus rechner.js. Aufruf: window.estriqPdf(tab) → lädt die Datei herunter.
   ===================================================================== */
(function () {
  "use strict";
  const W = 595.28, H = 841.89, M = 40;          // A4 in Punkt, Rand
  const C = {
    ink: [0.043, 0.071, 0.125], ink2: [0.067, 0.102, 0.169], line: [0.886, 0.906, 0.933], soft: [0.957, 0.965, 0.976],
    tx: [0.067, 0.094, 0.153], tx2: [0.353, 0.396, 0.463], tx3: [0.553, 0.592, 0.651], white: [1, 1, 1],
    g: [0.133, 0.773, 0.369], gD: [0.082, 0.502, 0.239], gL: [0.902, 0.973, 0.933],
    y: [0.961, 0.620, 0.043], yD: [0.604, 0.357, 0], yL: [0.996, 0.957, 0.886],
    r: [0.882, 0.114, 0.282], rD: [0.706, 0.137, 0.094], rL: [0.992, 0.925, 0.925],
    b: [0.231, 0.510, 0.965], bL: [0.918, 0.945, 0.996], grau: [0.58, 0.64, 0.72]
  };
  const STF = { g: { c: C.g, d: C.gD, l: C.gL, w: "GUT" }, y: { c: C.y, d: C.yD, l: C.yL, w: "PRÜFEN" }, r: { c: C.r, d: C.rD, l: C.rL, w: "KRITISCH" } };

  // Helvetica kennt nur WinAnsi: Zeichen außerhalb ersetzen
  const sauber = s => String(s == null ? "" : s).replace(/−/g, "-").replace(/[→➔]/g, "->").replace(/…/g, "...").replace(/ | | /g, " ").replace(/[^\x20-\x7E -ÿ€–—‘’‚“”„•‰]/g, "");
  const eur = (n, c) => !isFinite(n) ? "-" : (n < 0 ? "- " : "") + Math.abs(n).toLocaleString("de-DE", { minimumFractionDigits: c ? 2 : 0, maximumFractionDigits: c ? 2 : 0 }) + " €";
  const eurS = n => !isFinite(n) ? "-" : (n > 0 ? "+ " : "") + eur(Math.round(n));
  const pz = (n, d = 2) => !isFinite(n) ? "-" : (n < 0 ? "-" : "") + Math.abs(n).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " %";
  const zahl = (n, d = 1) => !isFinite(n) ? "-" : n.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
  const k = n => !isFinite(n) ? "-" : (Math.abs(n) >= 1e6 ? zahl(n / 1e6, 2) + " Mio." : Math.round(n / 1000).toLocaleString("de-DE") + " Tsd.");

  async function bauen(tab) {
    const L = window.PDFLib, R = window.ESTRIQ_RECHNER;
    const doc = await L.PDFDocument.create();
    doc.setTitle(tab === "objekt" ? "ESTRIQ Objekt-Check · Analyse" : "ESTRIQ Finanzierungsrahmen · Analyse");
    doc.setAuthor("ESTRIQ · Bücking Immobilien GmbH & Co. KG");
    doc.setCreator("estriq.com/rechner");
    const F = { r: await doc.embedFont(L.StandardFonts.Helvetica), b: await doc.embedFont(L.StandardFonts.HelveticaBold) };
    const rgb = a => L.rgb(a[0], a[1], a[2]);
    let page, seite = 0, gesamt = tab === "objekt" ? 4 : 3;
    const datum = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

    /* ---------- Zeichen-Helfer (Koordinaten von oben) ---------- */
    const T = (s, x, top, o = {}) => {
      const size = o.size || 9.5, font = o.bold ? F.b : F.r; s = sauber(s);
      let xx = x; const w = font.widthOfTextAtSize(s, size);
      if (o.align === "right") xx = x - w; else if (o.align === "center") xx = x - w / 2;
      if (o.spacing) { // Sperrsatz von Hand
        let cx = xx; for (const ch of s) { page.drawText(ch, { x: cx, y: H - top - size * .78, size, font, color: rgb(o.color || C.tx) }); cx += font.widthOfTextAtSize(ch, size) + o.spacing; }
        return w + o.spacing * s.length;
      }
      page.drawText(s, { x: xx, y: H - top - size * .78, size, font, color: rgb(o.color || C.tx) });
      return w;
    };
    const breite = (s, size, bold) => (bold ? F.b : F.r).widthOfTextAtSize(sauber(s), size);
    function umbruch(s, maxW, size, bold) {
      const worte = sauber(s).split(" "), zeilen = []; let z = "";
      worte.forEach(w => { const t = z ? z + " " + w : w; if (breite(t, size, bold) > maxW && z) { zeilen.push(z); z = w; } else z = t; });
      if (z) zeilen.push(z); return zeilen;
    }
    const absatz = (s, x, top, maxW, o = {}) => { const size = o.size || 9.5, lh = o.lh || size * 1.45; const z = umbruch(s, maxW, size, o.bold); z.forEach((zz, i) => T(zz, x, top + i * lh, o)); return z.length * lh; };
    const P = (d, o = {}) => page.drawSvgPath(d, { x: 0, y: H, color: o.fill ? rgb(o.fill) : undefined, borderColor: o.stroke ? rgb(o.stroke) : undefined, borderWidth: o.sw || 0, opacity: o.op, borderOpacity: o.bop, borderDashArray: o.dash });
    const rr = (x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); return `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`; };
    const box = (x, y, w, h, o = {}) => P(rr(x, y, w, h, o.r == null ? 8 : o.r), o);
    const linie = (x1, y1, x2, y2, c, sw = .6, dash) => P(`M${x1} ${y1} L${x2} ${y2}`, { stroke: c, sw, dash });
    const punkt = (cx, cy, r, c) => P(`M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`, { fill: c });

    function neueSeite(titel) {
      page = doc.addPage([W, H]); seite++;
      // Kopf
      P(`M0 0 H${W} V64 H0 Z`, { fill: C.ink });
      P(`M${W - 210} 0 H${W} V64 H${W - 140} Z`, { fill: C.ink2 });
      T("ESTR", M, 24, { size: 14, bold: true, color: C.white, spacing: 3.2 });
      const wE = breite("ESTR", 14, true) + 3.2 * 4;
      T("I", M + wE, 24, { size: 14, bold: true, color: C.g });
      T("Q", M + wE + breite("I", 14, true) + 3.2, 24, { size: 14, bold: true, color: C.white });
      T(titel, W - M, 22, { size: 8, bold: true, color: C.g, align: "right" });
      T("Analyse vom " + datum, W - M, 35, { size: 8, color: [.72, .76, .82], align: "right" });
      // Fuß
      linie(M, H - 38, W - M, H - 38, C.line);
      T("estriq.com/rechner · Vereinfachte Modellrechnung – keine Anlage-, Steuer- oder Finanzierungsberatung", M, H - 30, { size: 7, color: C.tx3 });
      T("Seite " + seite + " von " + gesamt, W - M, H - 30, { size: 7, color: C.tx3, align: "right" });
    }
    function abschnitt(text, top, sub) {
      T(text.toUpperCase(), M, top, { size: 7.5, bold: true, color: C.gD, spacing: 1.2 });
      if (sub) T(sub, W - M, top, { size: 7.5, color: C.tx3, align: "right" });
      return top + 14;
    }
    function ring(cx, cy, rad, score) {
      const st = score >= 70 ? "g" : score >= 45 ? "y" : "r";
      P(`M${cx - rad} ${cy} A${rad} ${rad} 0 1 0 ${cx + rad} ${cy} A${rad} ${rad} 0 1 0 ${cx - rad} ${cy}`, { stroke: [.86, .89, .92], sw: 7 });
      const a = Math.max(.001, Math.min(.999, score / 100)) * Math.PI * 2, x2 = cx + rad * Math.sin(a), y2 = cy - rad * Math.cos(a);
      P(`M${cx} ${cy - rad} A${rad} ${rad} 0 ${a > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`, { stroke: STF[st].c, sw: 7 });
      T(String(score), cx, cy - 12, { size: 22, bold: true, align: "center" });
      T("von 100", cx, cy + 9, { size: 7, color: C.tx3, align: "center" });
      return st;
    }
    function tag(x, top, st, text) {
      const w = breite(text, 7, true) + 20;
      box(x, top, w, 15, { r: 7.5, fill: STF[st].l });
      punkt(x + 8, top + 7.5, 2.6, STF[st].c);
      T(text, x + 14, top + 4.2, { size: 7, bold: true, color: STF[st].d });
      return w;
    }
    function kpis(list, top, spalten) {
      const gap = 8, w = (W - 2 * M - gap * (spalten - 1)) / spalten, h = 50;
      list.forEach((x, i) => {
        const cx = M + (i % spalten) * (w + gap), cy = top + Math.floor(i / spalten) * (h + gap);
        box(cx, cy, w, h, { r: 7, fill: C.soft });
        T(x[0], cx + 10, cy + 8, { size: 7, color: C.tx2 });
        T(x[1], cx + 10, cy + 19, { size: 12.5, bold: true, color: x[3] === "pos" ? C.gD : x[3] === "neg" ? C.r : C.tx });
        const sub = umbruch(x[2] || "", w - 18, 6.6)[0] || "";
        T(sub, cx + 10, cy + 37, { size: 6.6, color: C.tx3 });
      });
      return top + Math.ceil(list.length / spalten) * (h + gap);
    }
    function kriterien(list, top) {
      const h = 34;
      list.forEach((x, i) => {
        const y = top + i * (h + 5); const s = STF[x.st];
        box(M, y, W - 2 * M, h, { r: 7, fill: [1, 1, 1], stroke: C.line, sw: .6 });
        P(rr(M, y, 4, h, 2), { fill: s.c });
        punkt(M + 16, y + h / 2, 4, s.c);
        T(x.n, M + 28, y + 7, { size: 9, bold: true });
        T(umbruch(x.t, 300, 6.8)[0], M + 28, y + 20, { size: 6.8, color: C.tx2 });
        T(x.wert, W - M - 82, y + 12, { size: 9, bold: true, align: "right" });
        const wt = breite(s.w, 6.6, true) + 14;
        box(W - M - 10 - wt, y + 10, wt, 14, { r: 7, fill: s.l });
        T(s.w, W - M - 10 - wt / 2, y + 13.6, { size: 6.6, bold: true, color: s.d, align: "center" });
      });
      return top + list.length * (h + 5);
    }
    function empfehlungen(list, top, bis) {
      let y = top; const w = W - 2 * M;
      for (const e of list) {
        const s = STF[e.st]; const zeilen = e.l.map(t => umbruch(t, w - 40, 8.2));
        const h = 22 + zeilen.reduce((a, z) => a + z.length * 11.5 + 3, 0) + 6;
        if (y + h > bis) break;
        box(M, y, w, h, { r: 8, fill: C.soft });
        P(rr(M, y, 4, h, 2), { fill: s.c });
        T(e.t, M + 16, y + 9, { size: 9.5, bold: true });
        let yy = y + 25;
        zeilen.forEach(z => { punkt(M + 19, yy + 4, 1.6, s.c); z.forEach((zz, i) => T(zz, M + 28, yy + i * 11.5, { size: 8.2, color: C.tx2 })); yy += z.length * 11.5 + 3; });
        y += h + 7;
      }
      return y;
    }
    function eingaben(tabName, top) {
      const felder = R.FELDER[tabName], werte = R.werte[tabName];
      const GREST = R.GREST, AFA = R.AFA;
      const zeilen = felder.map(f => {
        let v = werte[f.id];
        if (f.typ === "land") { const g = GREST.find(x => x[0] === v); v = g ? g[1] + " (" + String(g[2]).replace(".", ",") + " %)" : v; }
        else if (f.typ === "afa") { const a = AFA.find(x => x[0] === String(v)); v = a ? a[1] : v; }
        else v = (f.d ? Number(v).toLocaleString("de-DE", { maximumFractionDigits: f.d }) : Math.round(v).toLocaleString("de-DE")) + " " + f.e;
        return [f.l, v];
      });
      const halb = Math.ceil(zeilen.length / 2), cw = (W - 2 * M - 16) / 2;
      zeilen.forEach((z, i) => {
        const col = i < halb ? 0 : 1, row = i < halb ? i : i - halb; const x = M + col * (cw + 16), y = top + row * 15;
        T(umbruch(z[0], cw - 90, 7.6)[0], x, y, { size: 7.6, color: C.tx2 });
        T(z[1], x + cw, y, { size: 7.6, bold: true, align: "right" });
        linie(x, y + 11.5, x + cw, y + 11.5, C.line, .4);
      });
      return top + halb * 15;
    }
    function methodik(punkte, top) {
      let y = top; const w = W - 2 * M;
      const zeilen = punkte.map(p => [p[0], umbruch(p[1], w - 150, 7.8)]);
      const h = 14 + zeilen.reduce((a, z) => a + Math.max(1, z[1].length) * 10.5 + 7, 0);
      box(M, y, w, h, { r: 8, fill: C.soft });
      y += 10;
      zeilen.forEach(z => { T(z[0], M + 12, y, { size: 7.8, bold: true }); z[1].forEach((t, i) => T(t, M + 138, y + i * 10.5, { size: 7.8, color: C.tx2 })); y += Math.max(1, z[1].length) * 10.5 + 7; });
      return top + h;
    }
    function cta(top) {
      const h = 64;
      box(M, top, W - 2 * M, h, { r: 10, fill: C.ink });
      T("ESTRIQ ACADEMY · BETA", M + 18, top + 13, { size: 7, bold: true, color: C.g, spacing: 1 });
      T("Lerne, solche Rechnungen selbst aufzubauen.", M + 18, top + 26, { size: 12, bold: true, color: C.white });
      T("10 Module, Vorlagen und 6 Monate ESTRIQ Premium · Beta-Preis 99 € bis 31.12.2026", M + 18, top + 44, { size: 8, color: [.72, .76, .82] });
      box(W - M - 140, top + 21, 122, 22, { r: 6, fill: C.g });
      T("estriq.com/academy", W - M - 79, top + 28, { size: 8.5, bold: true, color: [0.02, 0.18, 0.09], align: "center" });
      return top + h;
    }

    /* ---------- Diagramme ---------- */
    function wasserfall(o, top, h) {
      const st = [
        { n: "Kaltmiete", v: o.mieteJ / 12, t: "plus" }, { n: "Mietausfall", v: -o.ausfall / 12 }, { n: "Nicht umlagef.", v: -o.nulJ / 12 },
        { n: "Rücklage", v: -o.instJ / 12 }, { n: "Zins", v: -o.j1.zinsen / 12, c: C.y }, { n: "Tilgung", v: -o.j1.tilgung / 12, c: C.b },
        { n: "vor Steuern", v: o.cfV, t: "sum" }, { n: "Steuer", v: -o.steuer / 12, c: o.steuer < 0 ? C.g : C.grau }, { n: "nach Steuern", v: o.cfN, t: "sum" }
      ];
      let lauf = 0; const bars = st.map(s => { let a, b; if (s.t) { a = 0; b = s.v; } else { a = lauf; b = lauf + s.v; } lauf = s.t ? s.v : b; return { ...s, a, b }; });
      const max = Math.max(...bars.map(b => Math.max(b.a, b.b)), 1), min = Math.min(0, ...bars.map(b => Math.min(b.a, b.b)));
      const x0 = M, w = W - 2 * M, bw = w / bars.length, ch = h - 34, y = v => top + 12 + (max - v) / (max - min) * ch;
      linie(x0, y(0), x0 + w, y(0), C.grau, .7);
      bars.forEach((b, i) => {
        const x = x0 + i * bw + bw * .17, bw2 = bw * .66, y1 = y(Math.max(b.a, b.b)), y2 = y(Math.min(b.a, b.b));
        const col = b.t === "plus" ? C.g : b.t === "sum" ? (b.v >= 0 ? C.gD : C.r) : (b.c || C.grau);
        box(x, y1, bw2, Math.max(1.2, y2 - y1), { r: 2.5, fill: col });
        if (i < bars.length - 1 && !b.t) linie(x + bw2, y(b.b), x0 + (i + 1) * bw + bw * .17, y(b.b), C.grau, .4, [2, 2]);
        const lab = (b.t === "plus" ? "" : (b.v < 0 ? "-" : "+")) + Math.round(Math.abs(b.v)).toLocaleString("de-DE");
        T(lab, x + bw2 / 2, y1 - 10, { size: 7.4, bold: true, align: "center", color: b.t === "sum" ? (b.v >= 0 ? C.gD : C.r) : C.tx });
        T(b.n, x + bw2 / 2, top + h - 12, { size: 6.6, color: C.tx2, align: "center" });
      });
    }
    function stress(list, top) {
      const max = Math.max(...list.map(s => Math.abs(s.v)), 1), x0 = M + 200, w = 190, mid = x0 + w / 2;
      list.forEach((s, i) => {
        const y = top + i * 25;
        T(s.n, M, y + 2, { size: 8.4, bold: true, color: s.basis ? C.gD : C.tx });
        if (s.info) T(s.info, M, y + 13, { size: 6.6, color: C.tx3 });
        box(x0, y + 5, w, 7, { r: 3.5, fill: C.soft });
        const bw = Math.abs(s.v) / max * (w / 2);
        if (s.v >= 0) box(mid, y + 5, Math.max(1, bw), 7, { r: 3.5, fill: C.g }); else box(mid - bw, y + 5, Math.max(1, bw), 7, { r: 3.5, fill: C.r });
        linie(mid, y + 2, mid, y + 15, C.grau, .6);
        T(eurS(s.v), W - M, y + 1, { size: 9, bold: true, align: "right", color: s.v >= 0 ? C.gD : C.r });
        T(s.v >= 0 ? "trägt sich" : "Zuschuss", W - M, y + 12, { size: 6.6, color: C.tx3, align: "right" });
      });
      return top + list.length * 25;
    }
    function prognose(o, kp, top, h) {
      const d = [{ wert: kp, rest: o.darlehen, eq: kp - o.darlehen }].concat(o.prog);
      const x0 = M + 40, x1 = W - M, max = Math.max(...d.map(p => p.wert)) * 1.06, X = i => x0 + i / 10 * (x1 - x0), Y = v => top + (1 - Math.max(0, v) / max) * (h - 18);
      for (let g = 0; g <= 4; g++) { const v = max * g / 4; linie(x0, Y(v), x1, Y(v), C.line, .5); T(k(v), x0 - 6, Y(v) - 3.5, { size: 6.4, color: C.tx3, align: "right" }); }
      const pfad = key => d.map((p, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(p[key]).toFixed(1)).join(" ");
      P(pfad("wert") + ` L${X(10)} ${Y(0)} L${X(0)} ${Y(0)} Z`, { fill: C.gL });
      P(pfad("rest") + ` L${X(10)} ${Y(0)} L${X(0)} ${Y(0)} Z`, { fill: C.rL, op: .8 });
      P(pfad("wert"), { stroke: C.g, sw: 1.6 }); P(pfad("rest"), { stroke: C.r, sw: 1.4, dash: [4, 3] }); P(pfad("eq"), { stroke: C.b, sw: 2 });
      d.forEach((p, i) => { if (i % 2 === 0) T(i === 0 ? "heute" : "Jahr " + i, X(i), top + h - 12, { size: 6.4, color: C.tx3, align: "center" }); });
      punkt(X(10), Y(d[10].eq), 3, C.b);
      const ly = top + h + 2; let lx = M;
      [[C.g, "Objektwert"], [C.r, "Restschuld"], [C.b, "Dein Eigenkapital im Objekt"]].forEach(([c, t]) => { box(lx, ly + 3, 12, 3, { r: 1.5, fill: c }); lx += 16 + T(t, lx + 16, ly, { size: 7.4, color: C.tx2 }) + 18; });
      return ly + 14;
    }
    function korridor(o, top) {
      const lo = Math.min(o.kons.hh, o.real.hh), hhR = o.real.hh, hi = Math.max(o.maxi.hh, hhR * 1.02), ek = o.real.ekGrenze, mid = o.kp;
      const max = Math.max(hi, isFinite(ek) ? ek : 0) * 1.08 || 1, x0 = M, w = W - 2 * M, X = v => x0 + Math.max(0, Math.min(1, v / max)) * w, r = v => eur(Math.floor(v / 1000) * 1000);
      const y = top + 26;
      box(x0, y, w, 10, { r: 5, fill: C.soft });
      box(x0, y, X(lo) - x0, 10, { r: 5, fill: [.86, .89, .92] });
      box(X(lo), y, Math.max(2, X(hhR) - X(lo)), 10, { r: 3, fill: C.g });
      box(X(hhR), y, Math.max(2, X(hi) - X(hhR)), 10, { r: 3, fill: C.y });
      if (isFinite(ek)) { linie(X(ek), y - 6, X(ek), y + 16, C.b, 1.2, [3, 2]); T("Eigenkapital-Grenze " + r(ek), X(ek) + 4, y + 18, { size: 7, color: C.b }); }
      box(X(mid) - 1.5, y - 7, 3, 24, { r: 1.5, fill: C.ink });
      const lab = r(mid), lw = breite(lab, 10, true) + 16;
      box(X(mid) - lw / 2, y - 27, lw, 17, { r: 5, fill: C.ink }); T(lab, X(mid), y - 22, { size: 10, bold: true, color: C.white, align: "center" });
      T("Haushalt konservativ " + r(lo) + " – realistisch " + r(hhR), x0, y + 34, { size: 7.6, color: C.tx2 });
      T("An der Grenze bis " + r(hi), x0 + w, y + 34, { size: 7.6, color: C.tx2, align: "right" });
      return y + 48;
    }
    function zinsBars(o, top, h) {
      const max = Math.max(...o.zinsReihe.map(z => z.kp), 1), n = o.zinsReihe.length, w = (W - 2 * M) / n;
      o.zinsReihe.forEach((z, i) => {
        const bh = z.kp / max * (h - 34), x = M + i * w + w * .14, bw = w * .72, y = top + 14 + (h - 34 - bh);
        box(x, y, bw, bh, { r: 4, fill: z.jetzt ? C.g : [.75, .83, .97] });
        T(k(z.kp), x + bw / 2, y - 11, { size: 7.4, bold: true, align: "center" });
        T(pz(z.z, 2), x + bw / 2, top + h - 12, { size: 7.4, color: z.jetzt ? C.gD : C.tx2, bold: z.jetzt, align: "center" });
      });
    }

    /* ---------- Inhalt ---------- */
    if (tab === "objekt") {
      const w = R.werte.objekt, o = R.objektRechnen(w);
      const krit = o.kriterien.filter(x => x.st === "r").length, gut = o.kriterien.filter(x => x.st === "g").length;
      const verdikt = o.score >= 70 ? "Solide aufgestellt" : o.score >= 45 ? "Mit Nachbesserung" : "Kritisch";
      const satz = (o.cfN >= 0 ? "Das Objekt trägt sich nach Steuern selbst und bringt " + eur(Math.round(o.cfN)) + " im Monat." : "Nach Rate, Kosten und Steuereffekt schießt du monatlich " + eur(Math.round(-o.cfN)) + " zu.") +
        " " + gut + " von 8 Kriterien sind gut, " + krit + " kritisch. " + (o.failed === 0 ? "Alle vier Stressfälle tragen." : o.failed + " von 4 Stressfällen tragen nicht.");
      // Seite 1
      neueSeite("OBJEKT-CHECK · ANALYSE");
      let y = 88;
      T("Rechnet sich diese Immobilie?", M, y, { size: 21, bold: true });
      const land = R.GREST.find(g => g[0] === w.land);
      T(eur(w.kp) + " Kaufpreis · " + Math.round(w.fl) + " m² · " + eur(w.miete) + " Kaltmiete · " + (land ? land[1] : "") + " · " + eur(w.ek) + " Eigenkapital", M, y + 28, { size: 9, color: C.tx2 });
      y += 52;
      box(M, y, W - 2 * M, 104, { r: 12, fill: C.soft });
      const st = ring(M + 54, y + 52, 32, o.score);
      tag(M + 108, y + 16, st, verdikt.toUpperCase());
      T(eurS(o.cfN), M + 108, y + 38, { size: 26, bold: true, color: o.cfN >= 0 ? C.gD : C.r });
      T("/ Monat nach Steuern", M + 112 + breite(eurS(o.cfN), 26, true), y + 50, { size: 8.5, color: C.tx2 });
      absatz(satz, M + 108, y + 72, W - 2 * M - 124, { size: 8.4, color: C.tx2, lh: 11.5 });
      y += 120;
      y = abschnitt("Kennzahlen", y);
      y = kpis([
        ["Bruttomietrendite", pz(o.brutto), "Nettomietrendite " + pz(o.netto)],
        ["Kaufpreisfaktor", zahl(o.faktor), eur(o.preisM2) + " je m² · Miete " + zahl(o.mieteM2, 2) + " €/m²"],
        ["Gesamtinvestition", eur(o.invest), "davon Nebenkosten " + eur(o.nk)],
        ["Darlehen", eur(o.darlehen), "Rate " + eur(o.rate) + " im Monat"],
        ["Cashflow vor Steuern", eurS(o.cfV), "nach Rate und Kosten", o.cfV >= 0 ? "pos" : "neg"],
        ["Steuereffekt Jahr 1", eurS(-o.steuer), "Abschreibung " + eur(o.afa) + " / Jahr", o.steuer <= 0 ? "pos" : ""],
        ["Vermögenszuwachs Jahr 1", eurS(o.vermoegen1), "Tilgung + Wert + Cashflow", o.vermoegen1 >= 0 ? "pos" : "neg"],
        ["Restschuld nach " + w.bind + " J.", eur(o.restBind), isFinite(o.lz) ? "schuldenfrei nach ca. " + Math.round(o.lz) + " Jahren" : "Rate deckt Zinsen nicht"]
      ], y, 4);
      y += 10;
      y = abschnitt("Wohin die Miete geht", y, "pro Monat, erstes Jahr");
      wasserfall(o, y, 268);
      // Seite 2
      neueSeite("OBJEKT-CHECK · ANALYSE");
      y = 88;
      y = abschnitt("Ampel · 8 Kriterien", y, gut + " gut · " + o.kriterien.filter(x => x.st === "y").length + " prüfen · " + krit + " kritisch");
      y = kriterien(o.kriterien, y) + 18;
      y = abschnitt("Stresstest", y, "Cashflow vor Steuern pro Monat");
      y = stress(o.stress, y + 2) + 14;
      box(M, y, W - 2 * M, 34, { r: 8, fill: o.failed ? C.yL : C.gL });
      absatz(o.failed ? "Im Stresstest tragen " + (4 - o.failed) + " von 4 Einzelfällen. Plane eine Rücklage von mindestens drei Monatsraten (" + eur(o.rate * 3) + ") ein." : "Das Objekt trägt jeden der vier Einzelfälle. Eine Rücklage von drei Monatsraten (" + eur(o.rate * 3) + ") bleibt trotzdem sinnvoll.", M + 12, y + 9, W - 2 * M - 24, { size: 8.2, color: o.failed ? C.yD : C.gD, lh: 11 });
      // Seite 3
      neueSeite("OBJEKT-CHECK · ANALYSE");
      y = 88;
      y = abschnitt("10 Jahre Vermögensaufbau", y, "Prognose mit deinen Annahmen");
      y = prognose(o, w.kp, y + 4, 180) + 8;
      y = kpis([["Eigenkapital im Objekt nach 10 Jahren", eur(o.prog[9].eq), "Objektwert minus Restschuld", "pos"], ["Summe Cashflow nach Steuern", eurS(o.prog[9].cum), "über 10 Jahre", o.prog[9].cum >= 0 ? "pos" : "neg"]], y, 2) + 6;
      y = abschnitt("Handlungsempfehlungen", y, "aus deinen Zahlen berechnet");
      empfehlungen(o.emp, y, H - 50);
      // Seite 4
      neueSeite("OBJEKT-CHECK · ANALYSE");
      y = 88;
      y = abschnitt("Deine Eingaben und Annahmen", y);
      y = eingaben("objekt", y) + 18;
      y = abschnitt("So rechnet der Objekt-Check", y);
      y = methodik([
        ["Cashflow vor Steuern", "Kaltmiete minus Mietausfall-Wagnis, nicht umlagefähige Kosten und eigene Instandhaltungsrücklage, minus Kreditrate (Zins und Tilgung)."],
        ["Steuereffekt", "Vereinfacht: (Miete minus Ausfall, Zinsen, Abschreibung und nicht umlagefähige Kosten) mal Grenzsteuersatz. Die eigene Rücklage wird erst bei Ausgabe absetzbar und ist hier nicht abgezogen."],
        ["Abschreibung", "(Kaufpreis + Nebenkosten) mal Gebäudeanteil mal AfA-Satz nach Baujahr, zuzüglich Renovierung. Die 15-Prozent-Grenze für anschaffungsnahe Kosten ist nicht geprüft."],
        ["Darlehen", "Gesamtinvestition minus Eigenkapital, Annuität Monat für Monat gerechnet."],
        ["DSCR", "Reinertrag (Miete nach Ausfall und Kosten) geteilt durch die jährliche Kreditrate."],
        ["Stresstest", "Jeder Fall einzeln, Cashflow vor Steuern. Anschlusszins auf die Restschuld nach Ablauf der Zinsbindung."],
        ["Prognose", "Miete und Kosten steigen mit deinen Raten, der Objektwert mit der Wertentwicklung. Keine Garantie für die Zukunft."],
        ["Gesamtnote", "Anteil erreichter Punkte aus 8 Kriterien (gut 2, prüfen 1, kritisch 0). Ab 70 solide, ab 45 mit Nachbesserung."]
      ], y) + 18;
      cta(y);
    } else {
      const w = R.werte.rahmen, o = R.rahmenRechnen(w);
      const verdikt = o.score >= 70 ? "Solide aufgestellt" : o.score >= 45 ? "Mit Nachbesserung" : "Kritisch";
      neueSeite("FINANZIERUNGSRAHMEN · ANALYSE");
      let y = 88;
      T("Was kann ich mir leisten?", M, y, { size: 21, bold: true });
      T(eur(w.netto) + " Netto · " + eur(w.leben) + " Lebenshaltung · " + eur(w.ek) + " Eigenkapital · " + pz(w.zins) + " Zins · " + pz(w.tilg, 1) + " Tilgung", M, y + 28, { size: 9, color: C.tx2 });
      y += 52;
      box(M, y, W - 2 * M, 104, { r: 12, fill: C.soft });
      const st = ring(M + 54, y + 52, 32, o.score);
      tag(M + 108, y + 16, st, verdikt.toUpperCase());
      T(eur(Math.floor(o.kp / 1000) * 1000), M + 108, y + 38, { size: 26, bold: true });
      T("realistischer Kaufpreis", M + 112 + breite(eur(Math.floor(o.kp / 1000) * 1000), 26, true), y + 50, { size: 8.5, color: C.tx2 });
      absatz("Begrenzt durch " + (o.real.grenze === "eigenkapital" ? "dein Eigenkapital: Dein Haushalt könnte rechnerisch " + eur(Math.floor(o.real.hh / 1000) * 1000) + " tragen." : "deinen Haushalt: Bis zu diesem Preis bleibt dein Puffer von " + eur(w.puffer) + " im Monat erhalten.") + " Überschuss nach Kauf: " + eurS(o.ueber) + " im Monat.", M + 108, y + 72, W - 2 * M - 124, { size: 8.4, color: C.tx2, lh: 11.5 });
      y += 124;
      y = abschnitt("Dein Kaufpreis-Korridor", y, "konservativ · realistisch · an der Grenze");
      y = korridor(o, y + 4) + 8;
      y = abschnitt("Kennzahlen", y);
      y = kpis([
        ["Darlehen", eur(o.darlehen), "Nebenkosten " + eur(o.nk)], ["Rate im Monat", eur(o.rate), pz(w.zins) + " Zins · " + pz(w.tilg, 1) + " Tilgung"],
        ["Erwartete Kaltmiete", eur(o.miete), "Bank rechnet mit " + eur(o.anrMiete)], ["Überschuss nach Kauf", eurS(o.ueber), "mit voller Miete", o.ueber >= 0 ? "pos" : "neg"],
        ["Belastungsquote", pz(o.belast, 0), "vom Netto-Einkommen"], ["Restschuld nach " + w.bind + " J.", eur(o.restBind), "Anschlussrate +2 Pkt.: " + eur(o.anschluss)]
      ], y, 3) + 8;
      y = abschnitt("Wie der Zins deinen Rahmen verschiebt", y, "was dein Haushalt tragen kann");
      zinsBars(o, y, 190);
      neueSeite("FINANZIERUNGSRAHMEN · ANALYSE");
      y = 88;
      y = abschnitt("Ampel · 7 Kriterien", y);
      y = kriterien(o.kriterien, y) + 16;
      y = abschnitt("Handlungsempfehlungen", y, "aus deinen Zahlen berechnet");
      empfehlungen(o.emp, y, H - 50);
      neueSeite("FINANZIERUNGSRAHMEN · ANALYSE");
      y = 88;
      y = abschnitt("Deine Eingaben und Annahmen", y);
      y = eingaben("rahmen", y) + 18;
      y = abschnitt("So rechnet der Finanzierungsrahmen", y);
      y = methodik([
        ["Haushaltsgrenze", "Höchster Kaufpreis, bei dem Netto-Einkommen minus Lebenshaltung, Kredite und Puffer plus angerechnete Miete minus Kosten die neue Rate noch deckt."],
        ["Eigenkapital-Grenze", "Höchster Kaufpreis, bei dem dein Eigenkapital die Kaufnebenkosten deckt. Der realistische Kaufpreis ist der kleinere der beiden Werte."],
        ["Korridor", "Konservativ: Zins +1 Prozentpunkt, höchstens 60 % Mietanrechnung, 1,5-facher Puffer. Grenze: mindestens 80 % Mietanrechnung, kein Puffer."],
        ["Miete", "Kaufpreis mal erwartete Bruttomietrendite. Die Bank rechnet nur mit dem angerechneten Anteil."],
        ["Belastungsquote", "Rate minus angerechnete Miete plus Kosten und andere Kredite, geteilt durch das Netto-Einkommen."],
        ["Gesamtnote", "Anteil erreichter Punkte aus 7 Kriterien (gut 2, prüfen 1, kritisch 0)."]
      ], y) + 18;
      cta(y);
    }
    return doc.save();
  }

  function laden(src) {
    return new Promise((ok, fehler) => {
      if (window.PDFLib) return ok();
      const s = document.createElement("script"); s.src = src; s.onload = () => ok(); s.onerror = () => fehler(new Error("pdf-lib nicht geladen")); document.head.appendChild(s);
    });
  }
  window.estriqPdf = async function (tab, basis) {
    await laden((basis || "") + "pdf-lib.min.js");
    const bytes = await bauen(tab);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const name = "ESTRIQ-" + (tab === "objekt" ? "Objekt-Check" : "Finanzierungsrahmen") + "-" + new Date().toISOString().slice(0, 10) + ".pdf";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return { name, bytes };
  };
  window.__estriqPdfBytes = tab => laden("").then(() => bauen(tab)); // für Tests
})();
