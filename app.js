/* ============================================================================
   app.js — Bücking Einnahmen-Dashboard (Visualisierung)
   ============================================================================ */
(function () {
  "use strict";
  let D = window.DASHBOARD_DATA || {};
  const FE = window.FinanceEngine;
  const SESSION = "buecking_income_v1";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const eur = n => (Number(n) || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const eur2 = n => (Number(n) || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const el = h => { const t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstElementChild; };
  const monthShort = m => { const d = new Date(m + "-01"); return d.toLocaleDateString("de-DE", { month: "short" }); };


  /* ---------- ICONS ---------- */
  const IC = {
    grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    chart: '<path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    home: '<path d="M4 11l8-6 8 6M6 10v9h12v-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    coins: '<ellipse cx="8" cy="7" rx="5" ry="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M3 7v5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V7" stroke="currentColor" stroke-width="1.8"/><path d="M11 14.5c.6 1.2 2.6 2 5 2 2.8 0 5-1.1 5-2.5v-5" stroke="currentColor" stroke-width="1.8"/><ellipse cx="16" cy="9" rx="5" ry="2.5" stroke="currentColor" stroke-width="1.8"/>',
    euro: '<path d="M15 8a5 5 0 1 0 0 8M5 10h7M5 14h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    key: '<circle cx="8" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M11 11l7 7M16 16l2-2M14 18l2-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    bank: '<path d="M4 10l8-5 8 5M5 10v8M19 10v8M9 10v8M15 10v8M3 20h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 7h16M16 12h5v4h-5a2 2 0 0 1 0-4z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    debt: '<path d="M12 3v18M8 7h6a2.5 2.5 0 0 1 0 5H9a2.5 2.5 0 0 0 0 5h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    tool: '<path d="M14.5 6.2a4 4 0 0 0-5.3 5.3L4 16.7V20h3.3l5.2-5.2a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.2-.6-.6-2.2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    beleg: '<path d="M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1zM9 8h6M9 12h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    calendar: '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 9h16M8 3v3M16 3v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    user: '<circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  const svg = (k, cls) => `<svg viewBox="0 0 24 24" fill="none" class="${cls || ''}">${IC[k] || IC.grid}</svg>`;

  /* ---------- AUTH ---------- */
  let currentUser = null;   // { id, name, anrede }

  const ZUGANG_ENTFERNT = "Dein Zugang wurde entfernt. Bitte wende dich an den Inhaber des Kontos.";

  // Lädt das Profil des angemeldeten Nutzers aus der Datenbank.
  // Gelesen wird ausdrücklich die eigene Zeile: In einem Konto mit mehreren Nutzern
  // liefert die Datenbank sonst auch die Zeilen der Kollegen.
  async function ladeProfil(session) {
    const mail = ((session.user && session.user.email) || "");
    const { data, error } = await window.sb.from("mitglieder")
      .select("name, email, avatar_url, rolle, theme, tipps_an")
      .eq("auth_user_id", session.user.id).limit(1);
    if (error) throw error;
    const profil = data && data[0];
    if (!profil) {
      // Angemeldet, aber kein Mitglied mehr: Der Zugang wurde entfernt.
      const e = new Error(ZUGANG_ENTFERNT);
      e.keinMitglied = true;
      throw e;
    }
    const name = profil.name || mail.split("@")[0];
    currentUser = {
      id: session.user.id,
      name: name,
      anrede: (name || "").split(" ")[0],
      email: mail,
      avatar: profil.avatar_url || null,
      rolle: profil.rolle || "bearbeiter",
      theme: profil.theme || null,
      tipps_an: profil.tipps_an === false ? false : true
    };
    merkUmzug();
    // Farbschema aus dem Profil anwenden (geräteübergreifend).
    // Der im Gerät gemerkte Wert zählt nur, wenn er von diesem Nutzer stammt.
    // Sonst Standard Anthrazit.
    let lokalTheme = null;
    try {
      const besitzer = localStorage.getItem("estriq_nutzer");
      if (!besitzer || besitzer === currentUser.id) lokalTheme = localStorage.getItem("estriq_theme");
    } catch (_) {}
    const theme = themeGueltig(currentUser.theme || lokalTheme);
    themeAnwenden(theme);
    themeSpeichern(theme);
  }

  /* ---------- GERÄTESPEICHER JE NUTZER ---------- */
  // Was die App im Gerät merkt (Onboarding erledigt, Zähler für Tipps), gilt je Login.
  // So übernimmt am selben Gerät niemand den Stand eines anderen Nutzers.
  const merkKey = (name) => name + ":" + (currentUser ? currentUser.id : "gast");
  function merkLesen(name) { try { return localStorage.getItem(merkKey(name)); } catch (_) { return null; } }
  function merkSetzen(name, wert) { try { localStorage.setItem(merkKey(name), wert); } catch (_) {} }
  function merkLoeschen(name) { try { localStorage.removeItem(merkKey(name)); } catch (_) {} }
  // Einmaliger Umzug der früheren, gemeinsamen Einträge zu dem Nutzer, dem das Gerät bisher gehörte
  function merkUmzug() {
    try {
      const besitzer = localStorage.getItem("estriq_nutzer");
      const meins = !besitzer || besitzer === currentUser.id;
      ["estriq_onboarding_fertig", "estriq_tarif_gewaehlt",
       "estriq_checkout_aus_onboarding", "estriq_login_zaehler"].forEach(k => {
        const alt = localStorage.getItem(k);
        if (alt === null) return;
        if (meins && localStorage.getItem(merkKey(k)) === null) localStorage.setItem(merkKey(k), alt);
        localStorage.removeItem(k);
      });
    } catch (_) {}
  }

  // Angemeldet, aber kein Mitglied: abmelden und den Grund im Login-Fenster nennen
  async function zugangEntfernt() {
    try { await window.sb.auth.signOut({ scope: "local" }); } catch (_) {}
    currentUser = null;
    loginOeffnen("anmelden");
    const m = $("#loginMsg");
    if (m) { m.textContent = ZUGANG_ENTFERNT; m.className = "login-msg bad"; }
  }

  // Prüft die Supabase-Sitzung
  async function sessionOK() {
    let session = null;
    try {
      if (!window.sb) return false;
      ({ data: { session } } = await window.sb.auth.getSession());
      if (!session) return false;
      await ladeProfil(session);
      return true;
    } catch (e) {
      if (e && e.keinMitglied) { await zugangEntfernt(); return false; }
      if (session) {
        // Angemeldet, aber das Profil ließ sich nicht laden → Login-Popup mit Hinweis
        loginOeffnen("anmelden");
        const m = $("#loginMsg");
        if (m) { m.textContent = window.fehlerText(e); m.className = "login-msg bad"; }
        console.error(e);
      }
      return false;
    }
  }

  async function tryLogin() {
    const msg = $("#loginMsg"), v = $("#pw").value;
    const mail = ($("#mail") && $("#mail").value.trim()) || "";
    if (!mail) { msg.textContent = "Bitte E-Mail eingeben."; msg.className = "login-msg bad"; return; }
    if (!v) { msg.textContent = "Bitte Passwort eingeben."; msg.className = "login-msg bad"; return; }
    msg.textContent = "Anmeldung läuft…"; msg.className = "login-msg";

    const { data, error } = await window.sb.auth.signInWithPassword({
      email: mail, password: v
    });
    if (error) {
      msg.textContent = "Anmeldung fehlgeschlagen. E-Mail oder Passwort falsch.";
      msg.className = "login-msg bad";
      $("#pw").select();
      console.error(error);
      return;
    }
    try {
      await ladeProfil(data.session);
      await window.ladeDaten();
      D = window.DASHBOARD_DATA;
      enterApp();
    } catch (e) {
      if (e && e.keinMitglied) {
        try { await window.sb.auth.signOut({ scope: "local" }); } catch (_) {}
        currentUser = null;
        msg.textContent = ZUGANG_ENTFERNT;
      } else {
        msg.textContent = window.fehlerText(e);
      }
      msg.className = "login-msg bad";
      console.error(e);
    }
  }

  async function logout() {
    try { if (window.sb) await window.sb.auth.signOut(); } catch (_) {}
    localStorage.removeItem(SESSION);
    // Nichts aus dieser Sitzung für den nächsten Nutzer am selben Gerät stehen lassen
    try { sessionStorage.removeItem("estriq_miete_spaeter"); } catch (_) {}
    location.reload();
  }

  /* ---------- DESIGN / FARBSCHEMA ---------- */
  // Fünf Schemata, jedes mit fest abgestimmtem Akzent. Die Farbwerte stehen im CSS.
  // "graphit" (Anthrazit) ist der Standard und kommt ohne Attribut aus.
  const THEMES = [
    { id: "hell",    name: "Weiß" },
    { id: "graphit", name: "Anthrazit" },
    { id: "marine",  name: "Dunkelblau" },
    { id: "smaragd", name: "Smaragdgrün" },
    { id: "violett", name: "Violett" }
  ];
  const themeGueltig = (theme) => THEMES.some(x => x.id === theme) ? theme : "graphit";
  function themeAnwenden(theme) {
    const de = document.documentElement;
    theme = themeGueltig(theme);
    if (theme === "graphit") de.removeAttribute("data-theme");
    else de.setAttribute("data-theme", theme);
    statusleisteFarbe();
  }
  // Die Farbe der Statusleiste folgt nach dem Login dem Schema. Davor bleibt sie wie auf der Landing.
  function statusleisteFarbe() {
    const tc = document.querySelector('meta[name="theme-color"]');
    if (!tc) return;
    const drin = document.documentElement.classList.contains("eq-app");
    tc.setAttribute("content", drin ? cssVar("--bg", "#16181D") : "#0B1220");
  }
  function themeSpeichern(theme) {
    try {
      if (theme === "graphit") localStorage.removeItem("estriq_theme");
      else localStorage.setItem("estriq_theme", theme);
      // Die frühere freie Akzentwahl gibt es nicht mehr
      localStorage.removeItem("estriq_accent");
      // Merken, wessen Farben das sind – der nächste Nutzer am Gerät übernimmt sie nicht
      if (currentUser) localStorage.setItem("estriq_nutzer", currentUser.id);
    } catch (_) {}
  }
  // Farbschema am Nutzer in der Datenbank speichern (geräteübergreifend)
  async function themeInDB(theme) {
    try {
      if (!currentUser || !window.sb) return;
      await window.sb.from("mitglieder")
        .update({ theme: theme }).eq("auth_user_id", currentUser.id);
      currentUser.theme = theme;
    } catch (_) {}
  }
  function aktThemeId() {
    return themeGueltig(document.documentElement.getAttribute("data-theme"));
  }
  // Farbwahl: fünf Vorschau-Kacheln mit Hintergrund, Fläche, Text und Akzent
  function schemaKacheln(id) {
    return `<div class="eq-schemata" id="${id}" role="group" aria-label="Farbschema">
      ${THEMES.map(th => `<button type="button" class="eq-schema" data-theme="${th.id}" aria-pressed="false">
        <span class="eq-schema-bild" aria-hidden="true"><i><b></b><b class="kurz"></b><b class="ak"></b></i></span>
        <span class="eq-schema-n">${esc(th.name)}</span></button>`).join("")}
    </div>`;
  }
  // Ein Antippen wechselt sofort sichtbar; beiWahl speichert zusätzlich
  function schemaVerdrahten(wurzel, id, beiWahl) {
    const knoepfe = wurzel.querySelectorAll("#" + id + " .eq-schema");
    const markiere = () => {
      const tid = aktThemeId();
      knoepfe.forEach(b => {
        const an = b.dataset.theme === tid;
        b.classList.toggle("active", an);
        b.setAttribute("aria-pressed", an ? "true" : "false");
      });
    };
    knoepfe.forEach(b => b.onclick = () => {
      themeAnwenden(b.dataset.theme);
      themeSpeichern(b.dataset.theme);
      if (beiWahl) beiWahl(b.dataset.theme);
      markiere();
    });
    markiere();
  }

  /* ---------- ABO / TARIF ---------- */
  // Einzige Quelle für Preise, Grenzen und Leistungen. Tarif-Fenster, Upgrade-Fenster
  // und Empfehlung lesen von hier. Dieselben Texte stehen wörtlich auf der Landing Page.
  const TARIFE = {
    basic: {
      name: "Basic", preis: "19,99 €", objekte: 3, einheiten: 10, nutzer: 1,
      kurz: "Für den Einstieg mit wenigen Wohnungen.",
      leistungen: [
        "Bis zu 3 Objekte und 10 Einheiten",
        "1 Nutzer",
        "Mieter, Mieten und Mieteingänge im Blick",
        "Finanzierungen mit Tilgungsplan",
        "Kennzahlen, Kalender und Lernecke"
      ]
    },
    premium: {
      name: "Premium", preis: "29,99 €", objekte: Infinity, einheiten: Infinity, nutzer: 3,
      kurz: "Für größere Bestände, Teams und alle, die abrechnen und sanieren.",
      leistungen: [
        "Unbegrenzt Objekte und Einheiten",
        "Bis zu 3 Nutzer mit eigenem Login",
        "Alles aus Basic",
        "Nebenkostenabrechnung je Einheit",
        "Handwerker und Gewerke: Zahlung gegen Fortschritt"
      ]
    }
  };
  // Module, die nur mit Premium bearbeitet werden können.
  // Im Basic-Tarif bleiben sie sichtbar: als Vorschau oder, wenn es schon Daten gibt, lesbar.
  const PREMIUM_MODULE = {
    nebenkosten: { name: "Nebenkostenabrechnung", icon: "beleg",
      nutzen: "Kostenarten erfassen, auf die Mieter verteilen und je Einheit Guthaben oder Nachzahlung sehen." },
    gewerke: { name: "Handwerker und Gewerke", icon: "tool",
      nutzen: "Angebot, Rechnungen und Baufortschritt je Handwerker gegenüberstellen. Du siehst sofort, ob du mehr gezahlt hast, als gebaut wurde." },
    nutzer: { name: "Mehrere Nutzer", icon: "user",
      titel: "Mehrere Nutzer gibt es in Premium",
      vorsatz: "Im Basic-Tarif gehört ein Nutzer zum Konto. ",
      nutzen: "Lade bis zu zwei weitere Personen in dein Konto ein. Alle sehen dieselben Objekte und Zahlen, jede Person hat ihr eigenes Login und ihr eigenes Farbschema." }
  };
  const leistungsListe = (plan) => TARIFE[plan].leistungen.map(l => `<li>${esc(l)}</li>`).join("");

  function abo() {
    return (D && D.abo) || { tarif: "premium", roh_tarif: "test", objekte: 0, einheiten: 0 };
  }
  function istPremium() { return abo().tarif === "premium"; }
  // Ein Abo besteht erst, wenn Stripe es gemeldet hat. Die Kundennummer allein genügt nicht,
  // sie wird schon beim Öffnen der Bezahlseite gespeichert.
  function hatAbo() { const a = abo(); return a.hat_abo != null ? !!a.hat_abo : !!a.hat_stripe; }

  /* ---------- ROLLEN ---------- */
  // Inhaber: verwaltet Abo und Nutzer, kann das Konto löschen.
  // Nutzer (in der Datenbank "bearbeiter"): sieht und bearbeitet alle Daten.
  function istInhaber() { return !!currentUser && currentUser.rolle === "inhaber"; }
  function inhaberName() { const n = abo().inhaber_name; return n ? String(n) : ""; }
  function nurInhaberSatz() {
    const n = inhaberName();
    return "Den Tarif kann nur der Inhaber des Kontos ändern" + (n ? ": " + n + "." : ".");
  }
  // Fehlt eine Funktion in der Datenbank, wurde die zugehörige SQL-Datei noch nicht ausgeführt
  function funktionFehlt(e) {
    const s = (String((e && e.code) || "") + " " + String((e && (e.message || e.details || e.hint)) || "")).toLowerCase();
    return s.includes("pgrst202") || s.includes("42883")
      || s.includes("could not find the function") || s.includes("does not exist");
  }
  function istGesperrt() { return abo().tarif === "gesperrt"; }
  // Premium-Module sind nur mit Premium bearbeitbar (Testphase zählt wie Premium)
  function hatModul() { return istPremium(); }

  // Prüft, ob eine Aktion erlaubt ist. Gibt true zurück oder zeigt den Upgrade-Hinweis.
  function pruefeObjekt() {
    const a = abo();
    if (a.tarif === "gesperrt") { openUpgradeSheet("gesperrt"); return false; }
    if (a.tarif === "premium") return true;
    if (a.objekte >= TARIFE.basic.objekte) { openUpgradeSheet("objekte"); return false; }
    return true;
  }
  function pruefeEinheit() {
    const a = abo();
    if (a.tarif === "gesperrt") { openUpgradeSheet("gesperrt"); return false; }
    if (a.tarif === "premium") return true;
    if (a.einheiten >= TARIFE.basic.einheiten) { openUpgradeSheet("einheiten"); return false; }
    return true;
  }
  // Vor jedem Anlegen, Ändern oder Löschen in einem Premium-Modul
  function pruefeModul(id) {
    const a = abo();
    if (a.tarif === "gesperrt") { openUpgradeSheet("gesperrt"); return false; }
    if (a.tarif === "premium") return true;
    openUpgradeSheet("modul", id);
    return false;
  }

  function openUpgradeSheet(grund, modulId) {
    const b = TARIFE.basic, prem = TARIFE.premium;
    const darf = istInhaber();   // nur der Inhaber kann den Tarif wechseln
    const mod = PREMIUM_MODULE[modulId];
    const texte = {
      objekte:   { t: "Objekt-Grenze erreicht", d: `Im Basic-Tarif kannst du bis zu ${b.objekte} Objekte verwalten. Mit Premium werden es unbegrenzt viele.` },
      einheiten: { t: "Einheiten-Grenze erreicht", d: `Basic umfasst bis zu ${b.einheiten} Einheiten. Premium hebt die Grenze vollständig auf.` },
      modul:     { t: mod && mod.titel ? mod.titel : (mod ? mod.name : "Dieses Modul") + " gehört zu Premium",
                   d: (mod && mod.vorsatz ? mod.vorsatz : "Im Basic-Tarif ist dieses Modul gesperrt. ") + (mod ? mod.nutzen : "") },
      gesperrt:  { t: "Bearbeiten pausiert", d: darf
        ? "Dein Testzeitraum ist abgelaufen oder es liegt keine gültige Zahlung vor. Deine Daten bleiben erhalten und lesbar — mit einem aktiven Abo kannst du sie wieder bearbeiten."
        : "Für dieses Konto läuft gerade kein gültiges Abo. Die Daten bleiben erhalten und lesbar — bearbeiten könnt ihr wieder, sobald ein Abo aktiv ist." }
    };
    const info = texte[grund] || texte.objekte;
    const body = `
      <div class="up-hero">
        <div class="up-badge">${grund === "gesperrt" ? "Pausiert" : "Upgrade"}</div>
        <div class="up-t">${esc(info.t)}</div>
        <div class="up-d">${esc(info.d)}</div>
      </div>
      <div class="up-plan">
        <div class="up-plan-h">
          <div><div class="up-plan-n">${esc(prem.name)}</div>
            <div class="up-plan-s">${esc(prem.kurz)}</div></div>
          <div class="up-plan-p">${prem.preis}<span>/Monat</span></div>
        </div>
        <ul class="up-feats">${leistungsListe("premium")}</ul>
        ${darf ? `<button class="up-cta" id="upCta">Auf Premium wechseln</button>
        <div class="up-note">Erster Monat kostenlos · monatlich kündbar</div>`
          : `<div class="nu-nur-inhaber">${esc(nurInhaberSatz())}</div>`}
      </div>`;
    const sheet = openSheet(grund === "gesperrt" ? "Abo" : "Mehr freischalten", "", body);
    const cta = sheet.querySelector("#upCta");
    if (cta) cta.onclick = () => { closeSheet(); openTarifSheet(); };
  }

  // Name des gebuchten Tarifs. Testphase und Onboarding sind kein gebuchter Tarif.
  function gebuchterTarif() {
    const r = abo().roh_tarif;
    return (r === "basic" || r === "premium") ? r : null;
  }

  // Tarifübersicht (Vergleich beider Stufen)
  function openTarifSheet() {
    if (!istInhaber()) { showToast(nurInhaberSatz()); return; }
    const a = abo();
    const aktuell = gebuchterTarif();
    const karte = (plan) => {
      const tf = TARIFE[plan], prem = plan === "premium";
      return `<div class="tarif-card${prem ? " premium" : ""}${aktuell === plan ? " current" : ""}">
          ${prem ? `<div class="tarif-flag">Empfohlen</div>` : ""}
          <div class="tarif-n">${esc(tf.name)}</div>
          <div class="tarif-p">${tf.preis}<span>/Monat</span></div>
          <div class="tarif-k">${esc(tf.kurz)}</div>
          <ul class="tarif-feats">${leistungsListe(plan)}</ul>
          ${aktuell === plan ? `<div class="tarif-badge">Dein Tarif</div>`
            : `<button class="tarif-btn${prem ? " prem" : ""}" data-plan="${plan}">${esc(tf.name)} wählen</button>`}
        </div>`;
    };
    const body = `
      <div class="tarif-grid">
        ${karte("basic")}
        ${karte("premium")}
      </div>
      <div class="tarif-code">
        <label class="ef-l">Rabattcode</label>
        <div class="tarif-code-row">
          <input class="ef-i" id="rabattCode" placeholder="Code eingeben">
          <button class="tarif-code-btn" id="rabattBtn">Einlösen</button>
        </div>
        <div class="ef-msg" id="rabattMsg"></div>
      </div>
      <div class="up-note" style="margin-top:14px">Erster Monat kostenlos · jederzeit kündbar</div>
      ${a.hat_stripe ? `<div class="abo-verwalten"><a href="#" id="portalLink">Abo verwalten oder kündigen</a></div>` : ""}`;
    const stand = aktuell ? TARIFE[aktuell].name
      : a.tarif === "gesperrt" ? "Pausiert"
      : a.roh_tarif === "onboarding" ? "Kein Abo" : "Test";
    const sheet = openSheet("Tarif wählen", "Aktuell: " + stand, body);

    const pl = sheet.querySelector("#portalLink");
    if (pl) pl.onclick = (e) => { e.preventDefault(); oeffnePortal(pl); };

    sheet.querySelectorAll(".tarif-btn").forEach(b => b.onclick = () => starteCheckout(b.dataset.plan, sheet));
    sheet.querySelector("#rabattBtn").onclick = () => loeseRabattEin(sheet);
  }

  // Öffnet das Stripe-Kundenportal (Abo ansehen, Zahlungsmittel, kündigen)
  async function oeffnePortal(link) {
    if (!istInhaber()) { showToast(nurInhaberSatz()); return; }
    const alt = link.textContent;
    link.textContent = "Portal wird geöffnet…";
    try {
      const { data: { session } } = await window.sb.auth.getSession();
      const token = session && session.access_token;
      const res = await fetch(window.SB_FUNKTION + "/portal-oeffnen", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ zurueck_url: location.origin + location.pathname })
      });
      const j = await res.json();
      if (j.url) { location.href = j.url; }
      else { link.textContent = alt; showToast(j.fehler || "Portal konnte nicht geöffnet werden."); }
    } catch (e) {
      link.textContent = alt; showToast("Verbindung fehlgeschlagen.");
    }
  }

  // Leitet zur von Stripe gehosteten Bezahlseite (30 Tage Test, Karte vorab)
  async function starteCheckout(plan, sheet) {
    if (!istInhaber()) { showToast(nurInhaberSatz()); return; }
    const msg = sheet.querySelector("#rabattMsg");
    msg.textContent = "Bezahlseite wird geöffnet…"; msg.className = "ef-msg";
    try {
      const { data: { session } } = await window.sb.auth.getSession();
      const token = session && session.access_token;
      const res = await fetch(window.SB_FUNKTION + "/checkout-starten", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({
          plan,
          erfolg_url: location.origin + location.pathname + "?bezahlt=1",
          abbruch_url: location.origin + location.pathname + "?abbruch=1"
        })
      });
      const j = await res.json();
      if (j.url) { location.href = j.url; }   // weiter zu Stripe
      else { msg.textContent = j.fehler || "Bezahlseite konnte nicht geöffnet werden."; msg.className = "ef-msg bad"; }
    } catch (e) {
      msg.textContent = "Verbindung zu Stripe fehlgeschlagen. Bitte später erneut."; msg.className = "ef-msg bad";
    }
  }

  async function loeseRabattEin(sheet) {
    if (!istInhaber()) { showToast(nurInhaberSatz()); return; }
    const code = (sheet.querySelector("#rabattCode").value || "").trim();
    const msg = sheet.querySelector("#rabattMsg");
    if (!code) { msg.textContent = "Bitte Code eingeben."; msg.className = "ef-msg bad"; return; }
    msg.textContent = "Prüfe Code…"; msg.className = "ef-msg";
    try {
      const { data: { session } } = await window.sb.auth.getSession();
      const token = session && session.access_token;
      const res = await fetch(window.SB_FUNKTION + "/rabatt-einloesen", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ code })
      });
      const j = await res.json();
      if (j.status === "ok") {
        msg.textContent = "Code eingelöst – Premium ist freigeschaltet."; msg.className = "ef-msg";
        await window.nachSpeichern();
        setTimeout(closeSheet, 900);
      } else if (j.status === "ungueltig") {
        msg.textContent = "Dieser Code ist ungültig."; msg.className = "ef-msg bad";
      } else {
        msg.textContent = "Code konnte nicht eingelöst werden."; msg.className = "ef-msg bad";
      }
    } catch (e) {
      msg.textContent = "Verbindung fehlgeschlagen. Bitte später erneut."; msg.className = "ef-msg bad";
    }
  }

  /* ---------- BILD ZUSCHNEIDEN ---------- */
  // Öffnet den Zuschneider und liefert per Callback eine quadratische Bilddatei
  function zuschneiden(file, fertig) {
    const overlay = $("#cropper");
    const stage = $("#cropStage");
    const img = $("#cropImg");
    const zoom = $("#cropZoom");
    const AUSGABE = 512;              // Kantenlänge des fertigen Bildes
    const RAHMEN = 260;              // Größe der Bühne (muss zum CSS passen)

    let natW = 0, natH = 0, basis = 1, scale = 1;
    let posX = 0, posY = 0;
    let drag = false, sx = 0, sy = 0, px = 0, py = 0;

    const url = URL.createObjectURL(file);
    img.onload = () => {
      natW = img.naturalWidth; natH = img.naturalHeight;
      // Basis-Skalierung: Bild füllt den Rahmen (kleinere Seite = Rahmen)
      basis = Math.max(RAHMEN / natW, RAHMEN / natH);
      zoom.value = "1";
      scale = basis;
      // zentrieren
      posX = (RAHMEN - natW * scale) / 2;
      posY = (RAHMEN - natH * scale) / 2;
      anwenden();
      overlay.classList.remove("hide");
    };
    img.src = url;

    function grenzen() {
      const w = natW * scale, h = natH * scale;
      posX = Math.min(0, Math.max(RAHMEN - w, posX));
      posY = Math.min(0, Math.max(RAHMEN - h, posY));
    }
    function anwenden() {
      grenzen();
      img.style.transform = `translate(${posX}px,${posY}px) scale(${scale})`;
    }

    zoom.oninput = () => {
      const faktor = parseFloat(zoom.value);
      const neu = basis * faktor;
      // um die Bildmitte zoomen
      const mx = RAHMEN / 2, my = RAHMEN / 2;
      const bx = (mx - posX) / scale, by = (my - posY) / scale;
      scale = neu;
      posX = mx - bx * scale;
      posY = my - by * scale;
      anwenden();
    };

    const start = (x, y) => { drag = true; sx = x; sy = y; px = posX; py = posY; };
    const move = (x, y) => { if (!drag) return; posX = px + (x - sx); posY = py + (y - sy); anwenden(); };
    const ende = () => { drag = false; };

    stage.onmousedown = e => { e.preventDefault(); start(e.clientX, e.clientY); };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    function mm(e) { move(e.clientX, e.clientY); }
    function mu() { ende(); }
    stage.ontouchstart = e => { const t = e.touches[0]; start(t.clientX, t.clientY); };
    stage.ontouchmove = e => { e.preventDefault(); const t = e.touches[0]; move(t.clientX, t.clientY); };
    stage.ontouchend = ende;

    function aufraeumen() {
      overlay.classList.add("hide");
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      URL.revokeObjectURL(url);
    }

    $("#cropCancel").onclick = () => aufraeumen();
    $("#cropOk").onclick = () => {
      // Sichtbaren Kreisausschnitt in ein quadratisches Bild rendern
      const cv = document.createElement("canvas");
      cv.width = AUSGABE; cv.height = AUSGABE;
      const ctx = cv.getContext("2d");
      const f = AUSGABE / RAHMEN;
      // Position/Skalierung vom Rahmen auf die Ausgabegröße umrechnen
      ctx.drawImage(img, posX * f, posY * f, natW * scale * f, natH * scale * f);
      aufraeumen();
      cv.toBlob(blob => {
        if (!blob) return;
        const datei = new File([blob], "profil.jpg", { type: "image/jpeg" });
        fertig(datei, cv.toDataURL("image/jpeg", 0.9));
      }, "image/jpeg", 0.9);
    };
  }

  /* ---------- PROFIL ---------- */
  let profilAvatarDatei = null;

  function openProfilSheet(opt) {
    if (!currentUser) return;
    const zuNutzer = !!(opt && opt.zu === "nutzer");   // nach dem Einladen zurück an dieselbe Stelle
    const inhaber = istInhaber();
    const chef = inhaberName();
    const ava = currentUser.avatar;
    const initial = (currentUser.name || "?").slice(0, 1).toUpperCase();
    const body = `
      <div class="prof-head">
        <button type="button" class="ava-circle ${ava ? "filled" : ""}" id="pAvaBtn" aria-label="Profilbild ändern">
          <div class="ava-img" id="pAvaPrev" ${ava ? `style="background-image:url(${esc(ava)})"` : ""}></div>
          ${ava ? "" : `<div class="ava-letter">${esc(initial)}</div>`}
          <div class="ava-edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></div>
        </button>
        <input type="file" id="pAvaFile" accept="image/*" class="hide">
        <div class="prof-cap" id="pAvaCap">Zum Ändern tippen</div>
      </div>
      ${efTitel("Konto")}
      ${ef("Name", "name", currentUser.name || "", "text", { pflicht: true })}
      ${ef("E-Mail", "email", currentUser.email || "", "email", { readonly: true, hinweis: "E-Mail kann derzeit nicht geändert werden" })}
      <div class="ef-actions">
        <button class="ef-save" id="pSave">Speichern</button>
      </div>
      <div class="ef-msg" id="pMsg"></div>
      ${efTitel("Darstellung")}
      <div class="ef-l">Farbschema</div>
      ${schemaKacheln("themeRow")}
      <div class="ef-h">Gilt nur für dich und auf all deinen Geräten.</div>
      ${efTitel("Hinweise")}
      <div class="opt-row">
        <div class="opt-tx">
          <div class="opt-n">Verbesserungs-Vorschläge</div>
          <div class="opt-m">Ab und zu ein Hinweis, wie du dein Portfolio vollständiger pflegst</div>
        </div>
        <button type="button" class="opt-schalter" id="pTipps" role="switch" aria-checked="false" aria-label="Verbesserungs-Vorschläge"><span></span></button>
      </div>
      ${efTitel("Tarif")}
      <div class="prof-tarif" id="pTarif"></div>
      ${inhaber
        ? `<button class="add-btn wide" id="pTarifBtn" style="margin-top:12px">Tarif verwalten</button>`
        : `<div class="ef-h" style="margin-top:10px">${esc(chef ? "Den Tarif verwaltet " + chef + "." : "Den Tarif verwaltet der Inhaber des Kontos.")}</div>`}
      ${efTitel("Nutzer")}
      <div class="nu-box" id="pNutzer"></div>
      ${efTitel("Konto")}
      <button class="add-btn wide" id="pLogout" style="margin-top:4px">Abmelden</button>
      ${efTitel("Gefahrenzone")}
      <button class="ef-del" id="pDel" style="width:100%">${inhaber ? "Konto löschen" : "Meinen Zugang löschen"}</button>
      <div class="ef-h" id="pDelHinweis" style="margin-top:8px">${esc(inhaber
        ? loeschHinweis(Math.max(0, (Number(abo().nutzer) || 1) - 1))
        : "Entfernt nur deinen eigenen Zugang. Die Daten der Firma bleiben vollständig erhalten.")}</div>
      <div class="ef-msg" id="pDelMsg"></div>`;

    const sheet = openSheet("Mein Profil", currentUser.email || "", body);

    // Tarif-Status anzeigen — bildet den echten (Stripe-)Zustand ab
    const a = abo();
    const istOnboarding = a.roh_tarif === "onboarding";
    const tarifName = istOnboarding ? "Kein Abo"
      : a.tarif === "premium" ? "Premium"
      : a.tarif === "basic" ? "Basic"
      : a.tarif === "gesperrt" ? "Pausiert" : "Test";
    const ss = a.stripe_status || "";
    // Nur ein echtes Stripe-Trialing ist eine Testphase – nicht der Onboarding-Zustand
    const imTest = ss === "trialing";
    let statusZeile = "";
    if (istOnboarding) {
      statusZeile = "Wähle einen Tarif, um alle Funktionen zu behalten";
    } else if (a.tarif === "gesperrt") {
      statusZeile = "Bearbeiten pausiert — Daten bleiben lesbar";
    } else if (imTest && a.tarif_bis) {
      const tage = Math.max(0, Math.ceil((new Date(a.tarif_bis) - new Date()) / 86400000));
      statusZeile = `Testphase · noch ${tage} Tag${tage === 1 ? "" : "e"}, danach kostenpflichtig`;
    } else if (ss === "active" && a.tarif_bis) {
      const d = new Date(a.tarif_bis).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
      statusZeile = `Aktiv · verlängert sich am ${d}`;
    } else if (a.tarif === "basic") {
      statusZeile = `${a.objekte}/${TARIFE.basic.objekte} Objekte · ${a.einheiten}/${TARIFE.basic.einheiten} Einheiten`;
    } else if (a.tarif === "premium") {
      statusZeile = ss === "demo_code" ? "Freigeschaltet (Demo)" : "Unbegrenzt";
    }
    const pt = sheet.querySelector("#pTarif");
    if (pt) pt.innerHTML = `
      <div class="pt-row">
        <div class="pt-name ${a.tarif}">${esc(tarifName)}</div>
        <div class="pt-status">${esc(statusZeile)}</div>
      </div>`;
    const ptb = sheet.querySelector("#pTarifBtn");
    if (ptb) ptb.onclick = () => { closeSheet(); openTarifSheet(); };
    const plo = sheet.querySelector("#pLogout");
    if (plo) plo.onclick = () => logout();

    // Nutzer des Kontos. Für den Inhaber stimmt danach auch der Hinweis beim Löschen.
    const pn = sheet.querySelector("#pNutzer");
    if (pn) zeichneNutzer(pn, {
      aufGeladen: (r) => {
        const h = sheet.querySelector("#pDelHinweis");
        if (h && inhaber) h.textContent = loeschHinweis(Math.max(0, (r.mitglieder || []).length - 1));
        // Nur den Inhalt des Fensters verschieben, nicht das Fenster selbst
        const b = sheet.querySelector(".sheet-b");
        if (zuNutzer && b) b.scrollTop += pn.getBoundingClientRect().top - b.getBoundingClientRect().top - 56;
      }
    });

    // Schalter für Verbesserungs-Vorschläge
    const tp = sheet.querySelector("#pTipps");
    if (tp) {
      const setzen = () => {
        const an = !!(currentUser && currentUser.tipps_an !== false);
        tp.classList.toggle("an", an);
        tp.setAttribute("aria-checked", an ? "true" : "false");
      };
      setzen();
      tp.onclick = async () => {
        const neu = !(currentUser && currentUser.tipps_an !== false);
        await tippsSchalten(neu); setzen();
      };
    }

    // Farbschema: sofortige Vorschau, direkt gespeichert
    schemaVerdrahten(sheet, "themeRow", (theme) => themeInDB(theme));

    // Bildauswahl
    const avaBtn = sheet.querySelector("#pAvaBtn");
    const avaFile = sheet.querySelector("#pAvaFile");
    avaBtn.onclick = () => avaFile.click();
    avaFile.onchange = (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        const m = sheet.querySelector("#pMsg");
        m.textContent = "Bild ist zu groß (max. 10 MB)."; m.className = "ef-msg bad"; return;
      }
      zuschneiden(file, (datei, vorschau) => {
        profilAvatarDatei = datei;
        sheet._geaendert = true;   // neues Bild ist noch nicht gespeichert
        const prev = sheet.querySelector("#pAvaPrev");
        prev.style.backgroundImage = `url(${vorschau})`;
        avaBtn.classList.add("filled");
        const letter = sheet.querySelector(".ava-letter");
        if (letter) letter.remove();
        sheet.querySelector("#pAvaCap").textContent = "Bild geändert";
      });
      ev.target.value = "";   // erneutes Wählen desselben Bildes erlauben
    };

    // Speichern
    sheet.querySelector("#pSave").onclick = async () => {
      const msg = sheet.querySelector("#pMsg");
      const name = sheet.querySelector('[data-f="name"]').value.trim();
      if (!name) { msg.textContent = "Bitte Namen eingeben."; msg.className = "ef-msg bad"; return; }
      msg.textContent = "Speichere…"; msg.className = "ef-msg";
      try {
        const werte = { name };
        if (profilAvatarDatei) {
          const url = await ladeAvatarHoch(currentUser.id, profilAvatarDatei);
          if (url) werte.avatar_url = url;
        }
        const { error } = await window.sb.from("mitglieder")
          .update(werte).eq("auth_user_id", currentUser.id);
        if (error) throw error;
        currentUser.name = name;
        currentUser.anrede = name.split(" ")[0];
        if (werte.avatar_url) currentUser.avatar = werte.avatar_url;
        profilAvatarDatei = null;
        closeSheet();
        route(currentView);   // Begrüßung mit neuem Bild/Namen neu zeichnen
      } catch (e) {
        msg.textContent = window.fehlerText(e);
        msg.className = "ef-msg bad";
      }
    };

    // Löschen (zweistufig). Inhaber: das ganze Konto. Nutzer: nur der eigene Zugang.
    // Gelöscht wird in der Datenbank über konto_loeschen(), nicht mehr direkt aus dem Browser.
    const del = sheet.querySelector("#pDel");
    const delText = inhaber ? "Konto löschen" : "Meinen Zugang löschen";
    const delRuhe = () => { del.dataset.sicher = ""; del.textContent = delText; del.classList.remove("armed"); };
    del.onclick = async () => {
      if (del.dataset.sicher !== "1") {
        del.dataset.sicher = "1";
        del.textContent = inhaber ? "Wirklich? Konto endgültig löschen" : "Wirklich? Zugang endgültig löschen";
        del.classList.add("armed");
        setTimeout(() => { if (del.dataset.sicher === "1" && !del.disabled) delRuhe(); }, 4000);
        return;
      }
      const msg = sheet.querySelector("#pDelMsg");
      msg.textContent = inhaber ? "Konto wird gelöscht…" : "Zugang wird gelöscht…";
      msg.className = "ef-msg"; del.disabled = true;
      try {
        const { data, error } = await window.sb.rpc("konto_loeschen");
        if (error) throw error;
        if (data === "abo_aktiv") {
          msg.textContent = "Es läuft noch ein Abo. Kündige es zuerst unter „Tarif verwalten“ und dort „Abo verwalten oder kündigen“. Sobald das Abo beendet ist, kannst du das Konto löschen.";
          msg.className = "ef-msg bad"; del.disabled = false; delRuhe();
          return;
        }
        if (data !== "ok") throw new Error("konto_loeschen: " + data);
        // Das Login gibt es nicht mehr – nur noch die Sitzung im Gerät beenden
        try { await window.sb.auth.signOut({ scope: "local" }); } catch (_) {}
        try { sessionStorage.removeItem("estriq_miete_spaeter"); } catch (_) {}
        location.reload();
      } catch (e) {
        msg.textContent = funktionFehlt(e)
          ? "Das Löschen ist noch nicht eingerichtet. Bitte versuch es später noch einmal."
          : window.fehlerText(e);
        msg.className = "ef-msg bad"; del.disabled = false; delRuhe();
      }
    };
  }

  // Hinweis unter „Konto löschen“: nennt, wie viele weitere Nutzer ihren Zugang verlieren
  function loeschHinweis(weitere) {
    const basis = "Löscht dein Konto und alle zugehörigen Daten unwiderruflich.";
    if (!weitere) return basis;
    return basis + (weitere === 1
      ? " Auch 1 weiterer Nutzer verliert seinen Zugang."
      : " Auch " + weitere + " weitere Nutzer verlieren ihren Zugang.");
  }

  /* ---------- NUTZER DES KONTOS ---------- */
  const ROLLEN_NAME = { inhaber: "Inhaber", bearbeiter: "Nutzer", betrachter: "Nutzer" };
  const NUTZER_MAX = TARIFE.premium.nutzer;
  const einladungsLink = (code) => location.origin + location.pathname + "?einladung=" + encodeURIComponent(code);
  // Vorschlag für die Nachricht, mit der der Inhaber den Link weitergibt
  function einladungsText(name, firma, link) {
    const vor = String(name || "").trim().split(" ")[0];
    return "Hallo" + (vor ? " " + vor : "") + ", ich lade dich in unser ESTRIQ-Konto"
      + (firma ? " „" + firma + "“" : "") + " ein. Öffne den Link und leg dein Passwort fest. "
      + "Der Link gilt 14 Tage und nur für deine E-Mail-Adresse.\n" + link;
  }
  async function kopiere(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return true; }
    } catch (_) {}
    try {
      const ta = el(`<textarea style="position:fixed;left:-999px;top:0;opacity:0" readonly></textarea>`);
      ta.value = text; document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy"); ta.remove();
      return !!ok;
    } catch (_) { return false; }
  }
  // Öffnet das Teilen-Menü des Geräts. Gibt es keines, landet die Nachricht in der Zwischenablage.
  async function einladungTeilen(e, firma) {
    const text = einladungsText(e.name, firma, einladungsLink(e.code));
    if (navigator.share) {
      try { await navigator.share({ title: "Einladung zu ESTRIQ", text: text }); return; }
      catch (err) { if (err && err.name === "AbortError") return; }
    }
    showToast(await kopiere(text)
      ? "Nachricht mit Link kopiert – füg sie in WhatsApp oder eine E-Mail ein."
      : "Teilen ist auf diesem Gerät nicht möglich. Kopier den Link bitte von Hand.");
  }

  // Bild eines Kollegen: nur Adressen aus dem eigenen Bildspeicher, sicher in den Stil eingesetzt.
  // Die Adresse stammt aus der Zeile einer anderen Person und wird deshalb streng geprüft.
  function bildStil(adresse) {
    const s = String(adresse || "");
    const basis = String(window.SB_FUNKTION || "").replace("/functions/v1", "/storage/v1/object/public/");
    if (!s || !basis || !s.startsWith(basis) || /[\s"'()\\<>]/.test(s)) return "";
    return ` style="background-image:url('${esc(s)}')"`;
  }

  // Zeichnet den Bereich „Nutzer“ im Profil
  async function zeichneNutzer(host, opt) {
    opt = opt || {};
    const r = await nutzerInhalt(host, opt);
    if (r && opt.aufGeladen && host.isConnected) opt.aufGeladen(r);
  }
  async function nutzerInhalt(host, opt) {
    host.innerHTML = `<div class="ef-h">Nutzer werden geladen…</div>`;
    let r = null;
    try {
      const { data, error } = await window.sb.rpc("meine_nutzer");
      if (error) throw error;
      if (!data || data.status !== "ok") throw new Error("meine_nutzer");
      r = data;
    } catch (e) {
      if (!host.isConnected) return null;
      host.innerHTML = `<div class="nu-hinweis">${esc(funktionFehlt(e)
        ? "Die Nutzerverwaltung ist noch nicht eingerichtet. Bis dahin arbeitest du wie gewohnt allein in deinem Konto."
        : "Die Nutzer konnten gerade nicht geladen werden. Bitte versuch es später noch einmal.")}</div>`;
      return null;
    }
    if (!host.isConnected) return null;

    const a = abo();
    const inhaber = istInhaber();
    const mitglieder = r.mitglieder || [];
    const einladungen = inhaber ? (r.einladungen || []) : [];
    const offen = einladungen.filter(e => !e.abgelaufen);
    const belegt = mitglieder.length + offen.length;
    const onboarding = a.roh_tarif === "onboarding";
    const premium = a.tarif === "premium" && !onboarding;
    const neuZeichnen = () => zeichneNutzer(host, opt);

    // Basic oder pausiert, bisher allein im Konto: gesperrte Vorschau wie bei den Premium-Modulen
    if (inhaber && !premium && !onboarding && mitglieder.length <= 1 && !einladungen.length) {
      const m = PREMIUM_MODULE.nutzer;
      host.innerHTML = `<div class="nu-sperre">
          <div class="nu-sperre-t">${esc(m.name)} <span class="lock-badge">Premium</span></div>
          <div class="nu-sperre-d">${esc(m.nutzen)}</div>
          <button type="button" class="add-btn wide" id="nuFrei">Mit Premium freischalten</button>
        </div>`;
      host.querySelector("#nuFrei").onclick = () => pruefeModul("nutzer");
      return r;
    }

    const zeile = (m) => `<div class="nu-row">
        <div class="nu-ava"${bildStil(m.avatar_url)}>${bildStil(m.avatar_url) ? "" : esc(String(m.name || m.email || "?").slice(0, 1).toUpperCase())}</div>
        <div class="nu-tx">
          <div class="nu-n">${esc(m.name || m.email || "")}${m.ich ? ` <span class="nu-du">Du</span>` : ""}</div>
          <div class="nu-m">${esc(m.email || "")}</div>
        </div>
        <div class="nu-rolle">${esc(ROLLEN_NAME[m.rolle] || "Nutzer")}</div>
        ${inhaber && !m.ich && m.rolle !== "inhaber" ? `<div class="nu-akt">
          <button type="button" class="nu-btn weg" data-weg="${esc(m.id)}">Entfernen</button></div>` : ""}
      </div>`;
    const einlZeile = (e) => `<div class="nu-row">
        <div class="nu-ava offen">${svg("user")}</div>
        <div class="nu-tx">
          <div class="nu-n">${esc(e.name || e.email || "")}</div>
          <div class="nu-m">${esc(e.email || "")} · ${e.abgelaufen ? "Einladung abgelaufen" : "eingeladen, gültig bis " + dateDE(e.gueltig_bis)}</div>
        </div>
        <div class="nu-akt">
          ${!e.abgelaufen && premium ? `<button type="button" class="nu-btn" data-teilen="${esc(e.id)}">Link teilen</button>` : ""}
          ${e.abgelaufen && premium ? `<button type="button" class="nu-btn" data-neu="${esc(e.id)}">Neu einladen</button>` : ""}
          <button type="button" class="nu-btn" data-zurueck="${esc(e.id)}">Zurückziehen</button>
        </div>
      </div>`;

    let h = "";
    if (inhaber) {
      h += `<div class="ef-row" style="margin-bottom:4px">
          <label class="ef-l">Firmenname</label>
          <div class="tarif-code-row">
            <input class="ef-i" id="nuFirma" maxlength="80" value="${esc(r.firma || "")}">
            <button type="button" class="tarif-code-btn" id="nuFirmaBtn">Speichern</button>
          </div>
          <div class="ef-h">Der Name steht in der Einladung.</div>
        </div>`;
    } else {
      h += `<div class="ef-h" style="margin:0 0 2px">Diese Personen arbeiten im Konto${r.firma ? " „" + esc(r.firma) + "“" : ""}. Alle sehen dieselben Objekte und Zahlen.</div>`;
    }
    h += mitglieder.map(zeile).join("");
    if (inhaber) {
      if (einladungen.length) h += einladungen.map(einlZeile).join("");
      if (premium) {
        h += `<div class="nu-plaetze"><b>${belegt} von ${NUTZER_MAX} Nutzern</b>${offen.length
          ? " · davon " + offen.length + (offen.length === 1 ? " offene Einladung" : " offene Einladungen") : ""}</div>`;
        h += belegt < NUTZER_MAX
          ? `<button type="button" class="add-btn wide" id="nuNeu">+ Nutzer einladen</button>`
          : `<div class="nu-hinweis">Alle ${NUTZER_MAX} Plätze sind belegt${offen.length ? ", offene Einladungen zählen mit" : ""}. Entferne einen Nutzer oder zieh eine Einladung zurück, dann kannst du wieder jemanden einladen.</div>`;
        h += `<div class="ef-h">Jede Person meldet sich mit ihrer eigenen E-Mail an. Eine E-Mail, zu der es schon ein ESTRIQ-Konto gibt, kann nicht eingeladen werden. Ein Login gehört zu genau einem Konto.</div>`;
      } else if (onboarding) {
        h += `<div class="nu-hinweis">Weitere Nutzer kannst du einladen, sobald du einen Tarif gewählt hast. Mehrere Nutzer gehören zu Premium.</div>`;
      } else {
        h += `<div class="nu-hinweis">Im Basic-Tarif gehört ein Nutzer zum Konto. Alle bisherigen Nutzer behalten ihren Zugang. Neue Einladungen gibt es wieder mit Premium.</div>
          <button type="button" class="add-btn wide" id="nuFrei">Mit Premium freischalten</button>`;
      }
    }
    h += `<div class="ef-msg" id="nuMsg"></div>`;
    host.innerHTML = h;

    const msg = host.querySelector("#nuMsg");
    const sag = (text, schlecht) => { msg.textContent = text; msg.className = "ef-msg" + (schlecht ? " bad" : ""); };
    const fehlerSatz = (e) => funktionFehlt(e)
      ? "Die Nutzerverwaltung ist noch nicht eingerichtet." : window.fehlerText(e);
    if (!inhaber) return r;

    const frei = host.querySelector("#nuFrei");
    if (frei) frei.onclick = () => pruefeModul("nutzer");

    // Firmenname
    host.querySelector("#nuFirmaBtn").onclick = async () => {
      const name = host.querySelector("#nuFirma").value.trim();
      if (!name) { sag("Bitte gib einen Firmennamen ein.", true); return; }
      sag("Speichere…");
      try {
        const { data, error } = await window.sb.rpc("firma_umbenennen", { p_name: name });
        if (error) throw error;
        if (data === "ok") { r.firma = name; if (D && D.abo) D.abo.firma = name; sag("Firmenname gespeichert."); }
        else if (data === "name_ungueltig") sag("Der Firmenname darf höchstens 80 Zeichen lang sein.", true);
        else sag("Nur der Inhaber kann den Firmennamen ändern.", true);
      } catch (e) { sag(fehlerSatz(e), true); }
    };

    // Einladen
    const neu = host.querySelector("#nuNeu");
    if (neu) neu.onclick = () => openEinladenSheet(r.firma, {});
    host.querySelectorAll("[data-neu]").forEach(b => b.onclick = () => {
      const e = einladungen.find(x => String(x.id) === b.dataset.neu);
      if (e) openEinladenSheet(r.firma, { name: e.name || "", email: e.email || "" });
    });
    host.querySelectorAll("[data-teilen]").forEach(b => b.onclick = () => {
      const e = einladungen.find(x => String(x.id) === b.dataset.teilen);
      if (e) einladungTeilen(e, r.firma);
    });
    host.querySelectorAll("[data-zurueck]").forEach(b => b.onclick = async () => {
      b.disabled = true; sag("Einladung wird zurückgezogen…");
      try {
        const { data, error } = await window.sb.rpc("einladung_zurueckziehen", { p_id: b.dataset.zurueck });
        if (error) throw error;
        if (data === "kein_recht") { sag("Nur der Inhaber kann Einladungen zurückziehen.", true); b.disabled = false; return; }
        showToast(data === "ok" ? "Einladung zurückgezogen. Der Link gilt nicht mehr." : "Diese Einladung gab es nicht mehr.");
        neuZeichnen();
      } catch (e) { sag(fehlerSatz(e), true); b.disabled = false; }
    });

    // Entfernen in zwei Schritten, mit klarer Rückfrage
    host.querySelectorAll("[data-weg]").forEach(b => b.onclick = () => {
      const m = mitglieder.find(x => String(x.id) === b.dataset.weg);
      if (!m) return;
      const akt = b.parentElement, wer = m.name || m.email || "Diese Person";
      akt.innerHTML = `<div class="nu-frage"><b>${esc(wer)}</b> verliert sofort den Zugang. Die Daten der Firma bleiben vollständig erhalten.</div>
        <button type="button" class="nu-btn weg voll" id="nuWegJa">Ja, Zugang entfernen</button>
        <button type="button" class="nu-btn" id="nuWegNein">Abbrechen</button>`;
      akt.querySelector("#nuWegNein").onclick = neuZeichnen;
      const ja = akt.querySelector("#nuWegJa");
      ja.onclick = async () => {
        ja.disabled = true; sag("Zugang wird entfernt…");
        try {
          const { data, error } = await window.sb.rpc("nutzer_entfernen", { p_mitglied_id: m.id });
          if (error) throw error;
          if (data === "ok") {
            showToast(wer + " hat keinen Zugang mehr.");
            if (D && D.abo && D.abo.nutzer) D.abo.nutzer = Math.max(1, Number(D.abo.nutzer) - 1);
            neuZeichnen();
          } else if (data === "nicht_gefunden") { showToast("Diese Person gehört nicht mehr zum Konto."); neuZeichnen(); }
          else if (data === "inhaber") { sag("Der Inhaber kann nicht entfernt werden.", true); ja.disabled = false; }
          else { sag("Nur der Inhaber kann Nutzer entfernen.", true); ja.disabled = false; }
        } catch (e) { sag(fehlerSatz(e), true); ja.disabled = false; }
      };
    });
    return r;
  }

  // Nutzer einladen: Name und E-Mail, danach der Link zum Teilen und Kopieren
  function openEinladenSheet(firma, vor) {
    vor = vor || {};
    const zurueck = () => openProfilSheet({ zu: "nutzer" });
    const body = `<div id="einlBody">
      <div class="wc-hero" style="padding-bottom:12px">
        <div class="wc-badge">Mehrere Nutzer</div>
        <div class="wc-t" style="font-size:19px">Wen möchtest du einladen?</div>
        <div class="wc-d">Die Person bekommt ein eigenes Login und sieht dieselben Objekte und Zahlen wie du. Du erhältst einen Link und gibst ihn selbst weiter. ESTRIQ verschickt keine E-Mail.</div>
      </div>
      ${ef("Name", "name", vor.name || "", "text", { platzhalter: "Vor- und Nachname" })}
      ${ef("E-Mail", "email", vor.email || "", "email", { pflicht: true, platzhalter: "name@beispiel.de", hinweis: "Die Einladung gilt nur für diese E-Mail-Adresse." })}
      <button class="wc-cta prem" id="einlGo" style="margin-top:8px">Einladung erstellen</button>
      <button class="wc-cta" id="einlAb" style="margin-top:10px">Zurück zum Profil</button>
      <div class="ef-msg" id="einlMsg"></div>
    </div>`;
    const sheet = openSheet("Nutzer einladen", firma || "", body);
    const wurzel = sheet.querySelector("#einlBody");
    sheet.querySelector("#einlAb").onclick = zurueck;
    const SAETZE = {
      kein_recht: "Nur der Inhaber kann Nutzer einladen.",
      email_ungueltig: "Bitte gib eine gültige E-Mail-Adresse ein.",
      tarif: "Mehrere Nutzer gibt es im Premium-Tarif.",
      schon_konto: "Zu dieser E-Mail gibt es schon ein ESTRIQ-Konto. Sie kann nicht eingeladen werden.",
      voll: "Alle " + NUTZER_MAX + " Plätze sind belegt. Offene Einladungen zählen mit."
    };
    const go = sheet.querySelector("#einlGo");
    go.onclick = async () => {
      const msg = sheet.querySelector("#einlMsg");
      const w = efWerte(sheet);
      const name = (w.name || "").trim(), mail = (w.email || "").trim();
      if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
        msg.textContent = SAETZE.email_ungueltig; msg.className = "ef-msg bad"; return;
      }
      msg.textContent = "Einladung wird erstellt…"; msg.className = "ef-msg"; go.disabled = true;
      try {
        const { data, error } = await window.sb.rpc("nutzer_einladen", { p_email: mail, p_name: name || null });
        if (error) throw error;
        if (!data || data.status !== "ok") {
          msg.textContent = SAETZE[data && data.status] || "Die Einladung konnte nicht erstellt werden.";
          msg.className = "ef-msg bad"; go.disabled = false; return;
        }
        if (D && D.abo) D.abo.einladungen_offen = (Number(D.abo.einladungen_offen) || 0) + 1;
        zeigeLink({ name: name, email: mail.toLowerCase(), code: data.code, gueltig_bis: data.gueltig_bis });
      } catch (e) {
        msg.textContent = funktionFehlt(e) ? "Die Nutzerverwaltung ist noch nicht eingerichtet." : window.fehlerText(e);
        msg.className = "ef-msg bad"; go.disabled = false;
      }
    };

    function zeigeLink(e) {
      const link = einladungsLink(e.code);
      const wer = (e.name || "").split(" ")[0] || "der Person";
      wurzel.innerHTML = `
        <div class="wc-hero" style="padding-bottom:12px">
          <div class="wc-badge">Einladung erstellt</div>
          <div class="wc-t" style="font-size:19px">Schick ${esc(wer)} diesen Link</div>
          <div class="wc-d">Der Link gilt bis ${esc(dateDE(e.gueltig_bis))}, nur für ${esc(e.email)} und genau einmal. Gib ihn nur an diese Person weiter.</div>
        </div>
        <label class="ef-l">Link</label>
        <div class="nu-link" id="einlLink">${esc(link)}</div>
        <label class="ef-l" style="margin-top:14px">Vorschlag für deine Nachricht</label>
        <div class="nu-link text">${esc(einladungsText(e.name, firma, link))}</div>
        <button class="wc-cta prem" id="einlTeilen" style="margin-top:16px">Teilen</button>
        <button class="wc-cta" id="einlKopieren" style="margin-top:10px">Link kopieren</button>
        <button class="wc-cta" id="einlFertig" style="margin-top:10px">Fertig</button>`;
      wurzel.querySelector("#einlTeilen").onclick = () => einladungTeilen(e, firma);
      wurzel.querySelector("#einlKopieren").onclick = async () => {
        showToast(await kopiere(link) ? "Link kopiert." : "Kopieren ist nicht möglich. Markier den Link bitte von Hand.");
      };
      wurzel.querySelector("#einlFertig").onclick = zurueck;
    }
  }

  /* ---------- EINLADUNG ANNEHMEN ---------- */
  // Eigenes Fenster über der Landing, im Stil des Login-Fensters.
  // Landing und Login-Fenster bleiben unberührt, alle Klassen beginnen mit eq-.
  function eqSchliessen() { const n = $("#eqEinladung"); if (n) n.remove(); }
  function eqFenster(inhalt) {
    eqSchliessen();
    const bd = el(`<div id="eqEinladung" class="eq-einl" role="dialog" aria-modal="true" aria-label="Einladung">
      <div class="eq-einl-karte">
        <button type="button" class="eq-einl-zu" aria-label="Schließen">×</button>
        <div class="eq-einl-logo"><img src="estriq.PNG" alt="ESTRIQ" onerror="this.style.display='none'"></div>
        <div class="eq-einl-inhalt">${inhalt}</div>
      </div></div>`);
    document.body.appendChild(bd);
    bd.querySelector(".eq-einl-zu").onclick = eqSchliessen;
    return bd;
  }
  // Entfernt nur ?einladung=… aus der Adresszeile
  function einladungAusAdresse() {
    try {
      const u = new URL(location.href);
      u.searchParams.delete("einladung");
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    } catch (_) {}
  }

  // Der Link wurde geöffnet, während schon jemand angemeldet ist
  function openEinladungAngemeldet() {
    const bd = eqFenster(`
      <div class="eq-einl-t">Du bist schon angemeldet</div>
      <div class="eq-einl-d">Du bist gerade als <b>${esc(currentUser ? currentUser.email : "")}</b> angemeldet. Eine Einladung kannst du nur annehmen, wenn niemand angemeldet ist. Melde dich zuerst ab, danach öffnet sich die Einladung von selbst.</div>
      <button type="button" class="eq-einl-btn" id="eqAb">Abmelden und Einladung öffnen</button>
      <button type="button" class="eq-einl-btn zweit" id="eqBleib">Angemeldet bleiben</button>`);
    const bleib = () => { eqSchliessen(); einladungAusAdresse(); };
    bd.querySelector("#eqAb").onclick = () => logout();   // lädt neu, der Link bleibt in der Adresse
    bd.querySelector("#eqBleib").onclick = bleib;
    bd.querySelector(".eq-einl-zu").onclick = bleib;
  }

  // Niemand ist angemeldet: Code prüfen, dann Passwort festlegen
  async function openEinladungFenster(code) {
    const NEUER_LINK = "Bitte lass dir vom Inhaber des Kontos einen neuen Link schicken.";
    const bd = eqFenster(`<div class="eq-einl-t">Einladung annehmen</div>
      <div class="eq-einl-d">Die Einladung wird geprüft…</div>`);
    const inhalt = bd.querySelector(".eq-einl-inhalt");
    const nurSatz = (titel, satz) => {
      inhalt.innerHTML = `<div class="eq-einl-t">${esc(titel)}</div>
        <div class="eq-einl-d">${esc(satz)}</div>
        <button type="button" class="eq-einl-btn zweit" id="eqOk">Schließen</button>`;
      inhalt.querySelector("#eqOk").onclick = () => { eqSchliessen(); einladungAusAdresse(); };
    };

    let r = null;
    try {
      if (!window.sb) throw new Error("keine Verbindung");
      const { data, error } = await window.sb.rpc("einladung_pruefen", { p_code: code });
      if (error) throw error;
      r = data;
    } catch (e) {
      console.error(e);
      nurSatz("Einladung annehmen", funktionFehlt(e)
        ? "Einladungen sind in diesem Konto noch nicht eingerichtet. Bitte sag dem Inhaber des Kontos Bescheid."
        : "Die Einladung konnte gerade nicht geprüft werden. Prüf deine Internetverbindung und öffne den Link noch einmal.");
      return;
    }
    if (!r || !r.gueltig) {
      if (r && r.grund === "platz") nurSatz("In diesem Konto ist kein Platz frei", "Das Konto hat gerade keinen freien Platz für weitere Nutzer. " + NEUER_LINK);
      else nurSatz("Diese Einladung gilt nicht mehr", "Der Link ist abgelaufen, wurde schon benutzt oder zurückgezogen. " + NEUER_LINK);
      return;
    }

    inhalt.innerHTML = `
      <div class="eq-einl-t">Einladung annehmen</div>
      <div class="eq-einl-d">Du wurdest in das ESTRIQ-Konto <b>${esc(r.firma || "")}</b> eingeladen. Leg dein Passwort fest, danach siehst du die Immobilien der Firma.</div>
      <div class="eq-einl-feld">
        <label for="eqMail">E-Mail</label>
        <input id="eqMail" type="email" value="${esc(r.email || "")}" readonly aria-readonly="true">
      </div>
      <div class="eq-einl-feld">
        <label for="eqName">Name</label>
        <input id="eqName" type="text" autocomplete="name" placeholder="Vor- und Nachname" value="${esc(r.name || "")}">
      </div>
      <div class="eq-einl-feld">
        <label for="eqPw">Passwort</label>
        <input id="eqPw" type="password" autocomplete="new-password" placeholder="Mindestens 8 Zeichen">
      </div>
      <label class="eq-einl-zustimmung">
        <input type="checkbox" id="eqZu">
        <span>Ich stimme der Speicherung meiner Daten gemäß der <a href="#" id="eqDs">Datenschutzerklärung</a> zu.</span>
      </label>
      <button type="button" class="eq-einl-btn" id="eqGo">Einladung annehmen</button>
      <div class="eq-einl-msg" id="eqMsg"></div>`;

    const msg = inhalt.querySelector("#eqMsg"), go = inhalt.querySelector("#eqGo");
    const sag = (text, schlecht) => { msg.textContent = text; msg.className = "eq-einl-msg" + (schlecht ? " bad" : ""); };
    inhalt.querySelector("#eqDs").onclick = (ev) => {
      ev.preventDefault();
      const ds = $("#datenschutzLink"); if (ds) ds.click();   // derselbe Text wie bei der Registrierung
    };

    const los = async () => {
      if (go.disabled) return;   // läuft schon
      const name = inhalt.querySelector("#eqName").value.trim();
      const pw = inhalt.querySelector("#eqPw").value;
      if (!name) { sag("Bitte Namen eingeben.", true); return; }
      if (pw.length < 8) { sag("Das Passwort muss mindestens 8 Zeichen lang sein.", true); return; }
      if (!inhalt.querySelector("#eqZu").checked) { sag("Bitte stimme der Speicherung deiner Daten zu, um fortzufahren.", true); return; }
      sag("Dein Zugang wird angelegt…"); go.disabled = true;

      // Der Code reist in den Zusatzdaten mit. Die Datenbank ordnet die Person dem Konto zu.
      let data = null, error = null;
      try {
        ({ data, error } = await window.sb.auth.signUp({
          email: r.email, password: pw,
          options: { data: { name: name, einladung: code } }
        }));
      } catch (e) { error = e; }
      if (error) {
        const roh = (String(error.message || "") + " " + String(error.code || "")).toLowerCase();
        sag(/signup/.test(roh)
          ? "Neue Zugänge sind gerade abgeschaltet. Bitte sag dem Inhaber des Kontos Bescheid."
          : /database error|einladung|unexpected_failure/.test(roh)
          ? "Diese Einladung gilt nicht mehr. " + NEUER_LINK
          : /password/.test(roh)
          ? "Dieses Passwort wird nicht angenommen. Bitte wähle ein längeres oder ungewöhnlicheres."
          : window.fehlerText(error), true);
        go.disabled = false;
        console.error(error);
        return;
      }
      einladungAusAdresse();

      // Ohne aktive Sitzung: erst die E-Mail bestätigen, dann anmelden
      if (!data || !data.session) {
        inhalt.innerHTML = `<div class="eq-einl-t">Fast fertig</div>
          <div class="eq-einl-d">Bitte bestätige die E-Mail, die wir an <b>${esc(r.email || "")}</b> geschickt haben. Danach meldest du dich mit deiner E-Mail und deinem Passwort an.</div>
          <button type="button" class="eq-einl-btn" id="eqLogin">Zur Anmeldung</button>`;
        inhalt.querySelector("#eqLogin").onclick = () => { eqSchliessen(); loginOeffnen("anmelden"); };
        return;
      }

      // Direkt angemeldet: ins Dashboard der Firma
      try {
        await ladeProfil(data.session);
        await window.ladeDaten();
        D = window.DASHBOARD_DATA;
        eqSchliessen();
        enterApp();
      } catch (e) {
        console.error(e);
        inhalt.innerHTML = `<div class="eq-einl-t">Dein Zugang ist angelegt</div>
          <div class="eq-einl-d">Die Daten konnten gerade nicht geladen werden. Bitte melde dich mit deiner E-Mail und deinem Passwort an.</div>
          <button type="button" class="eq-einl-btn" id="eqLogin">Zur Anmeldung</button>`;
        inhalt.querySelector("#eqLogin").onclick = () => { eqSchliessen(); loginOeffnen("anmelden"); };
      }
    };
    go.onclick = los;
    inhalt.querySelector("#eqPw").addEventListener("keydown", (ev) => { if (ev.key === "Enter") los(); });
    setTimeout(() => { const f = inhalt.querySelector(r.name ? "#eqPw" : "#eqName"); if (f) f.focus(); }, 150);
  }

  let regMode = false;            // false = anmelden, true = registrieren
  let avatarDatei = null;         // gewählte Bilddatei

  function setRegMode(on) {
    regMode = on;
    const zeig = (id, sichtbar) => { const n = $(id); if (n) n.classList.toggle("hide", !sichtbar); };
    zeig("#rowAvatar", on);
    zeig("#rowName", on);
    zeig("#rowConsent", on);
    zeig("#loginBtn", !on);
    zeig("#registerBtn", on);
    // Reiter-Optik
    $("#tabLogin").classList.toggle("active", !on);
    $("#tabRegister").classList.toggle("active", on);
    $("#tabInd").classList.toggle("right", on);
    $("#pw").setAttribute("autocomplete", on ? "new-password" : "current-password");
    $("#pw").value = "";
    $("#loginMsg").textContent = "";
    $("#loginMsg").className = "login-msg";
  }

  function waehleAvatar() {
    const f = $("#avaFile");
    if (f) f.click();
  }
  function avatarGewaehlt(ev) {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      $("#loginMsg").textContent = "Bild ist zu groß (max. 10 MB).";
      $("#loginMsg").className = "login-msg bad";
      return;
    }
    zuschneiden(file, (datei, vorschau) => {
      avatarDatei = datei;
      $("#avaPrev").style.backgroundImage = `url(${vorschau})`;
      $("#avaBtn").classList.add("filled");
      $("#avaCap").textContent = "Bild ändern";
    });
    ev.target.value = "";
  }

  async function tryRegister() {
    const msg = $("#loginMsg");
    const name = $("#regName").value.trim();
    const mail = $("#mail").value.trim();
    const pw = $("#pw").value;
    if (!name) { msg.textContent = "Bitte Namen eingeben."; msg.className = "login-msg bad"; return; }
    if (!mail) { msg.textContent = "Bitte E-Mail eingeben."; msg.className = "login-msg bad"; return; }
    if (pw.length < 6) { msg.textContent = "Das Passwort muss mindestens 6 Zeichen lang sein."; msg.className = "login-msg bad"; return; }
    if (!$("#consentBox") || !$("#consentBox").checked) {
      msg.textContent = "Bitte stimme der Speicherung deiner Daten zu, um fortzufahren.";
      msg.className = "login-msg bad"; return;
    }
    msg.textContent = "Konto wird erstellt…"; msg.className = "login-msg";
    $("#registerBtn").disabled = true;

    // 1. Konto anlegen. Der Datenbank-Trigger legt automatisch die eigene Organisation an.
    const { data, error } = await window.sb.auth.signUp({
      email: mail, password: pw,
      options: { data: { name: name } }
    });
    if (error) {
      msg.textContent = window.fehlerText(error);
      msg.className = "login-msg bad";
      $("#registerBtn").disabled = false;
      return;
    }

    // 2. Ohne aktive Sitzung (E-Mail-Bestätigung nötig): Hinweis zeigen
    if (!data.session) {
      msg.textContent = "Fast fertig — bitte bestätige die E-Mail, die wir dir geschickt haben.";
      msg.className = "login-msg";
      $("#registerBtn").disabled = false;
      return;
    }

    // 3. Profilbild hochladen (falls gewählt)
    try {
      if (avatarDatei && data.user) {
        const url = await ladeAvatarHoch(data.user.id, avatarDatei);
        if (url) await window.sb.from("mitglieder")
          .update({ avatar_url: url }).eq("auth_user_id", data.user.id);
      }
    } catch (e) { console.error("Avatar:", e); }

    // 4. Direkt einloggen
    try {
      await ladeProfil(data.session);
      await window.ladeDaten();
      D = window.DASHBOARD_DATA;
      enterApp();
    } catch (e) {
      msg.textContent = "Dein Konto wurde erstellt. " + window.fehlerText(e);
      msg.className = "login-msg bad";
      $("#registerBtn").disabled = false;
    }
  }

  async function ladeAvatarHoch(userId, file) {
    const endung = (file.name.split(".").pop() || "jpg").toLowerCase();
    const pfad = `${userId}/profil.${endung}`;
    const { error } = await window.sb.storage.from("avatars")
      .upload(pfad, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data } = window.sb.storage.from("avatars").getPublicUrl(pfad);
    return data.publicUrl;
  }

  // Brücken für data-save.js
  window.setD = (neu) => { D = neu; };
  window.refreshView = () => {
    // Falls das aktuelle Objekt gelöscht wurde: zurück zur Übersicht
    const bekannt = currentView === "overview" || currentView === "vermietung"
      || (D.streams || []).some(x => x.id === currentView);
    const weg = fokusWeg(document.activeElement);
    buildRail();
    route(bekannt ? currentView : "overview");
    fokusAufWeg(weg);
  };

  function enterApp() {
    // Ab hier greift das gewählte Farbschema. Vor dem Login sieht die Seite für jeden gleich aus.
    const de = document.documentElement;
    de.classList.remove("pre-login", "eq-wartet");
    de.classList.add("eq-app");
    const lp = $("#landing"); if (lp) lp.classList.add("hide");
    statusleisteFarbe();
    $("#login").classList.add("hide"); $("#app").classList.remove("hide");
    buildRail(); route("overview");
    // Rückkehr von der Stripe-Bezahlseite auswerten
    const params = new URLSearchParams(location.search);
    if (params.get("bezahlt") === "1") {
      merkSetzen("estriq_tarif_gewaehlt", "1");
      merkSetzen("estriq_onboarding_fertig", "1");
      merkLoeschen("estriq_checkout_aus_onboarding");
      geschichteBereinigen();
      // Der Webhook braucht evtl. 1–3 Sek. Mehrfach nachladen, bis der Tarif steht,
      // und danach die Übersicht sicher neu zeichnen.
      let versuche = 0;
      const nachladen = async () => {
        versuche++;
        try {
          await window.nachSpeichern();
          route("overview");   // Ansicht mit frischen Daten neu rendern
        } catch (_) {}
        // Weiter versuchen, bis der gebuchte Tarif in der Datenbank steht. Die Kundennummer
        // allein sagt nichts mehr, sie wird schon beim Öffnen der Bezahlseite gespeichert.
        const steht = !!gebuchterTarif() && abo().hat_abo !== false;
        if (!steht && versuche < 6) {
          setTimeout(nachladen, 1500);
        } else {
          showToast(steht ? "Zahlung erfolgreich – dein Tarif ist aktiv."
            : "Bestellung erhalten. Dein Tarif wird gleich freigeschaltet – lade die Seite in einer Minute neu.");
        }
      };
      setTimeout(nachladen, 1000);
      return;
    }
    if (params.get("abbruch") === "1") {
      geschichteBereinigen();
      // B1: Kam der Abbruch aus dem Onboarding, wird auf "nur lesen" gesetzt.
      // Der Nutzer sieht sein gefülltes Dashboard, kann aber nicht bearbeiten,
      // bis er einen Tarif wählt.
      if (merkLesen("estriq_checkout_aus_onboarding") === "1") {
        merkLoeschen("estriq_checkout_aus_onboarding");
        (async () => {
          let gesperrt = false;
          try {
            // Die Datenbank sperrt nur, wenn noch kein Abo besteht. Der Browser ändert
            // den Tarif nicht mehr selbst.
            if (istInhaber() && abo().roh_tarif === "onboarding") {
              const { data, error } = await window.sb.rpc("onboarding_abbrechen");
              if (error) throw error;
              if (data === "ok") {
                gesperrt = true;
                await window.nachSpeichern();
                route("overview");
              }
            }
          } catch (e) { console.error(e); }
          showToast(gesperrt
            ? "Kein Tarif gewählt – du kannst dein Dashboard ansehen, aber nicht bearbeiten."
            : "Bezahlvorgang abgebrochen. Einen Tarif kannst du jederzeit im Profil wählen.");
        })();
      } else {
        showToast("Bezahlvorgang abgebrochen.");
      }
    }
    // Neuen Nutzern den Onboarding-Funnel zeigen (einmalig):
    // Farbe → erstes Objekt → Einheit → 3 Fragen → Abo-Empfehlung → Checkout
    try {
      const a = abo();
      if (!istInhaber()) {
        // Eingeladene Person: kein Ablauf für neue Inhaber. Nur einmal die Wahl der Farben.
        if (!currentUser.theme && !merkLesen("estriq_willkommen")) {
          merkSetzen("estriq_willkommen", "1");
          setTimeout(() => openFarbwahlSheet({ willkommen: true }), 400);
          return;
        }
      } else {
        const fertig = merkLesen("estriq_onboarding_fertig");
        const nochKeinAbo = a && (a.roh_tarif === "onboarding" || a.roh_tarif === "test") && !hatAbo();
        if (!fertig && nochKeinAbo) {
          setTimeout(() => openFarbwahlSheet({ onboarding: true }), 400);
          return;
        }
      }
      // Sonst: fällige Mieten prüfen, danach ggf. ein Verbesserungs-Tipp
      setTimeout(() => { if (!pruefeMieteingaenge()) zeigeTippWennFaellig(); }, 600);
    } catch (_) {}
  }

  /* ---------- GEFÜHRTE EINGABE (ASSISTENT) ---------- */

  // Zeigt eine Frage pro Schritt. schritte = [{ id, frage, hinweis, typ, platzhalter,
  // einheit, pflicht, optionen:[{t,v}], vorgabe, ueberspringbar }]
  // aufFertig(antworten) wird am Ende aufgerufen.
  function openAssistent(titel, schritte, aufFertig) {
    const antworten = {};
    let idx = 0;
    const sheet = openSheet(titel, "", `<div id="asBody"></div>`);
    const bodyEl = sheet.querySelector("#asBody");

    function punkte() {
      return `<div class="wc-steps">${schritte.map((_, i) =>
        `<span class="${i < idx ? "done" : i === idx ? "on" : ""}"></span>`).join("")}</div>`;
    }

    function zeige() {
      const f = schritte[idx];
      const istWahl = !!f.optionen;
      bodyEl.innerHTML = `
        <div class="wc-hero" style="padding-bottom:16px">
          ${punkte()}
          <div class="wc-badge">Schritt ${idx + 1} von ${schritte.length}</div>
          <div class="wc-t" style="font-size:19px">${esc(f.frage)}</div>
          ${f.hinweis ? `<div class="wc-d">${esc(f.hinweis)}</div>` : ""}
        </div>
        ${istWahl
          ? `<div class="frage-opts">${f.optionen.map(o =>
              `<button class="frage-opt" data-v="${esc(o.v)}">${esc(o.t)}</button>`).join("")}</div>`
          : `<div class="as-feld">
               <input class="ef-i as-i" id="asInput" type="${f.typ || "text"}"
                 placeholder="${esc(f.platzhalter || "")}"
                 value="${esc(antworten[f.id] != null ? antworten[f.id] : (f.vorgabe != null ? f.vorgabe : ""))}"
                 ${f.typ === "number" ? 'inputmode="decimal" step="any"' : ""}>
               ${f.einheit ? `<span class="as-einheit">${esc(f.einheit)}</span>` : ""}
             </div>
             <div class="ef-msg" id="asMsg"></div>`}
        <div class="as-nav">
          ${istWahl ? "" : `<button class="wc-cta prem" id="asWeiter">${idx === schritte.length - 1 ? "Fertig" : "Weiter"}</button>`}
          ${idx > 0 ? `<button class="wc-cta" id="asZurueck" style="margin-top:10px">Zurück</button>` : ""}
          ${f.ueberspringbar && !istWahl ? `<div class="wc-skip"><a href="#" id="asSkip">Überspringen</a></div>` : ""}
        </div>`;

      if (istWahl) {
        bodyEl.querySelectorAll(".frage-opt").forEach(b => b.onclick = () => {
          antworten[f.id] = b.dataset.v; weiter();
        });
      } else {
        const inp = bodyEl.querySelector("#asInput");
        setTimeout(() => { try { inp.focus(); } catch (_) {} }, 120);
        const abschicken = () => {
          const wert = (inp.value || "").trim();
          if (f.pflicht && !wert) {
            const m = bodyEl.querySelector("#asMsg");
            m.textContent = "Bitte ausfüllen, um fortzufahren."; m.className = "ef-msg bad";
            return;
          }
          antworten[f.id] = wert; weiter();
        };
        bodyEl.querySelector("#asWeiter").onclick = abschicken;
        inp.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); abschicken(); } };
        const sk = bodyEl.querySelector("#asSkip");
        if (sk) sk.onclick = (e) => { e.preventDefault(); antworten[f.id] = ""; weiter(); };
      }
      const zb = bodyEl.querySelector("#asZurueck");
      if (zb) zb.onclick = () => { idx--; zeige(); };
    }

    async function weiter() {
      sheet._geaendert = true;   // ab hier gibt es Antworten, die beim Schließen verloren gingen
      if (idx < schritte.length - 1) { idx++; zeige(); return; }
      // Letzter Schritt: speichern
      bodyEl.innerHTML = `<div class="wc-hero"><div class="wc-t" style="font-size:18px">Wird gespeichert…</div></div>`;
      try {
        await aufFertig(antworten);
      } catch (e) {
        bodyEl.innerHTML = `<div class="wc-hero">
          <div class="wc-t" style="font-size:18px">Das hat nicht geklappt</div>
          <div class="wc-d">${esc(window.fehlerText(e))}</div></div>
          <button class="wc-cta prem" id="asNochmal">Nochmal versuchen</button>`;
        bodyEl.querySelector("#asNochmal").onclick = () => { idx = schritte.length - 1; zeige(); };
      }
    }
    zeige();
    return sheet;
  }

  // Geführtes Anlegen eines Mietobjekts
  function assistentObjekt(opt) {
    opt = opt || {};
    const schritte = [
      { id: "name", frage: "Wie soll dein Objekt heißen?",
        hinweis: "Ein Name, unter dem du es wiedererkennst.",
        typ: "text", pflicht: true,
        platzhalter: "z. B. Haus Bergstraße 12" },
      { id: "ort", frage: "Wo liegt das Objekt?",
        hinweis: "Nur für dich zur Orientierung – wird nirgends veröffentlicht.",
        typ: "text", ueberspringbar: true, platzhalter: "z. B. Bremen" },
      { id: "invest", frage: "Was hast du insgesamt investiert?",
        hinweis: "Kaufpreis inklusive Nebenkosten wie Notar, Grunderwerbsteuer und Makler. Daraus berechnet ESTRIQ deine Rendite.",
        typ: "number", einheit: "€", pflicht: true, platzhalter: "z. B. 250000" },
      { id: "nk_als_puffer", frage: "Wie sollen Nebenkosten behandelt werden?",
        hinweis: "Als Rücklage bedeutet: Die Nebenkosten deiner Mieter werden für Ausgaben zurückgelegt und nicht als Gewinn gezählt. Das ist die vorsichtigere Rechnung.",
        optionen: [
          { t: "Als Rücklage zurücklegen", v: "1" },
          { t: "Als Ertrag mitzählen", v: "0" }
        ] }
    ];
    openAssistent("Objekt anlegen",
      schritte, async (a) => {
        await neuesObjekt({
          name: a.name || "Objekt",
          slug: (a.name || "objekt").toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          art: "miete",
          icon: "home",
          ort: a.ort || "",
          notiz: "",
          invest: Number(String(a.invest).replace(",", ".")) || null,
          nk_als_puffer: a.nk_als_puffer === "1",
          nk_positionen: null
        });
        closeSheet();
        await window.nachSpeichern();
        const streams = (D.streams || []);
        const neuesObj = streams[streams.length - 1];
        if (opt.nachOnboarding) {
          if (neuesObj) setTimeout(() => assistentEinheit(neuesObj, { nachOnboarding: true }), 300);
          else setTimeout(() => openTarifFragenSheet(), 300);
        } else {
          showToast("Objekt angelegt.");
          if (neuesObj) setTimeout(() => assistentEinheit(neuesObj), 350);
        }
      });
  }

  // Geführtes Anlegen einer Einheit
  function assistentEinheit(s, opt) {
    opt = opt || {};
    const schritte = [
      { id: "bezeichnung", frage: "Wie heißt diese Wohneinheit?",
        hinweis: "Zum Beispiel nach Lage oder Nummer.",
        typ: "text", pflicht: true, platzhalter: "z. B. Erdgeschoss links" },
      { id: "status", frage: "Ist die Einheit vermietet?",
        optionen: [
          { t: "Ja, sie ist vermietet", v: "vermietet" },
          { t: "Nein, sie steht leer", v: "frei" }
        ] },
      { id: "flaeche", frage: "Wie groß ist die Wohnung?",
        hinweis: "Die Wohnfläche in Quadratmetern.",
        typ: "number", einheit: "m²", ueberspringbar: true, platzhalter: "z. B. 72" },
      { id: "kalt_fix", frage: "Wie hoch ist die Kaltmiete?",
        hinweis: "Die reine Miete pro Monat, ohne Nebenkosten.",
        typ: "number", einheit: "€ / Monat", pflicht: true, platzhalter: "z. B. 650" },
      { id: "nk_fix", frage: "Was zahlt der Mieter an Nebenkosten?",
        hinweis: "Die monatliche Vorauszahlung für Heizung, Wasser, Müll und so weiter.",
        typ: "number", einheit: "€ / Monat", ueberspringbar: true, platzhalter: "z. B. 180" },
      { id: "zahltag", frage: "An welchem Tag im Monat kommt die Miete?",
        hinweis: "Ab diesem Tag fragt ESTRIQ beim Login nach, ob die Zahlung eingegangen ist.",
        typ: "number", einheit: "des Monats", vorgabe: 1, platzhalter: "1" },
      { id: "mieter", frage: "Wer wohnt dort?",
        hinweis: "Der Name deines Mieters – hilfreich für die Zahlungskontrolle.",
        typ: "text", ueberspringbar: true, platzhalter: "z. B. Familie Müller" }
    ];
    openAssistent("Einheit anlegen", schritte, async (a) => {
      const z = (v) => { const n = Number(String(v).replace(",", ".")); return isFinite(n) && v !== "" ? n : null; };
      await neueEinheit(s._id, {
        bezeichnung: a.bezeichnung || "Einheit",
        flaeche: z(a.flaeche),
        status: a.status || "vermietet",
        kalt_fix: z(a.kalt_fix), nk_fix: z(a.nk_fix),
        zahltag: Math.min(31, Math.max(1, Number(a.zahltag) || 1)),
        mieter: a.mieter || "", einzug: null,
        vertrag: {}
      });
      closeSheet();
      await window.nachSpeichern();
      if (opt.nachOnboarding) setTimeout(() => openTarifFragenSheet(), 300);
      else { showToast("Einheit angelegt – deine Zahlen sind aktualisiert."); route(s.id); }
    });
  }

  /* ---------- VERBESSERUNGS-TIPPS ---------- */

  // Sucht echte Lücken im Portfolio und macht daraus konkrete Vorschläge
  function findeTipps() {
    const t = [];
    const streams = (D.streams || []);
    if (!streams.length) return t;

    streams.forEach(s => {
      // Fehlende Investitionssumme -> keine Rendite berechenbar
      if (!s.invest) {
        t.push({
          titel: "Rendite für " + s.name + " freischalten",
          text: "Ohne Investitionssumme kann ESTRIQ keine Rendite berechnen. Trag den Kaufpreis inkl. Nebenkosten ein.",
          aktion: "Jetzt eintragen", ziel: () => pflegeInvest(s)
        });
      }
      // Objekt ohne Einheiten
      if (s.kind === "miete" && !(s.einheiten || []).length) {
        t.push({
          titel: s.name + " hat noch keine Einheit",
          text: "Leg eine Wohnung an, damit Einnahmen und Auslastung berechnet werden.",
          aktion: "Einheit anlegen", ziel: () => assistentEinheit(s)
        });
      }
      // Freie Einheiten -> Potenzial sichtbar machen
      (s.einheiten || []).forEach(u => {
        if (u.status !== "vermietet") {
          const i = FE.unitIncome(u);
          if (i.gesamt > 0) {
            t.push({
              titel: (u.wohnung || "Eine Einheit") + " steht leer",
              text: "Bei Vermietung kämen " + eur(i.gesamt) + " im Monat dazu – das sind " + eur(i.gesamt * 12) + " im Jahr.",
              aktion: "Status prüfen", ziel: () => pflegeLeerstand(s, u)
            });
          }
        }
        // Vermietet, aber kein Mieter hinterlegt
        if (u.status === "vermietet" && !u.mieter) {
          t.push({
            titel: "Mieter bei " + (u.wohnung || "einer Einheit") + " ergänzen",
            text: "Mit hinterlegtem Mieter behältst du Verträge und Zahlungseingänge besser im Blick.",
            aktion: "Mieter eintragen", ziel: () => pflegeMieter(s, u)
          });
        }
      });
      // Keine Nebenkosten hinterlegt
      if (s.kind === "miete" && !(s.nkPositionen || []).length) {
        t.push({
          titel: "Nebenkosten bei " + s.name + " erfassen",
          text: "Trag Grundsteuer, Versicherung & Co. ein, damit dein Cashflow realistisch wird.",
          aktion: "Jetzt erfassen", ziel: () => pflegeNebenkosten(s)
        });
      }
    });
    return t;
  }

  function zeigeTippWennFaellig() {
    try {
      if (currentUser && currentUser.tipps_an === false) return;   // im Profil abgeschaltet
      const n = Number(merkLesen("estriq_login_zaehler") || "0") + 1;
      merkSetzen("estriq_login_zaehler", String(n));
      if (n % 3 !== 0) return;                                     // nur jeden dritten Login
      const tipps = findeTipps();
      if (!tipps.length) return;
      // Wechselnden Tipp zeigen, damit es nicht immer derselbe ist
      const idx = Math.floor(n / 3) % tipps.length;
      openTippSheet(tipps[idx]);
    } catch (_) {}
  }

  function openTippSheet(tipp) {
    const body = `
      <div class="wc-hero" style="padding-bottom:10px">
        <div class="wc-badge">Vorschlag für dich</div>
        <div class="wc-t" style="font-size:19px">${esc(tipp.titel)}</div>
        <div class="wc-d">${esc(tipp.text)}</div>
      </div>
      <button class="wc-cta prem" id="tippGo">${esc(tipp.aktion)}</button>
      <button class="wc-cta" id="tippSpaeter" style="margin-top:10px">Nicht jetzt</button>
      <div class="wc-skip"><a href="#" id="tippAus">Solche Vorschläge abschalten</a></div>`;
    const sheet = openSheet("Tipp", "", body);
    sheet.querySelector("#tippGo").onclick = () => { closeSheet(); setTimeout(() => tipp.ziel(), 250); };
    sheet.querySelector("#tippSpaeter").onclick = () => closeSheet();
    sheet.querySelector("#tippAus").onclick = async (e) => {
      e.preventDefault();
      await tippsSchalten(false);
      closeSheet(); showToast("Vorschläge abgeschaltet – im Profil jederzeit wieder einschaltbar.");
    };
  }

  // Einstellung speichern (geräteübergreifend am Nutzer)
  async function tippsSchalten(an) {
    try {
      if (currentUser) currentUser.tipps_an = an;
      if (window.sb && currentUser) {
        await window.sb.from("mitglieder").update({ tipps_an: an }).eq("auth_user_id", currentUser.id);
      }
    } catch (_) {}
  }

  /* ---------- GEFÜHRTE NACHPFLEGE (aus Tipps) ---------- */

  const alsZahl = (v) => {
    const n = Number(String(v == null ? "" : v).replace(",", "."));
    return (isFinite(n) && String(v).trim() !== "") ? n : null;
  };

  // Investitionssumme nachtragen → schaltet die Rendite frei
  function pflegeInvest(s) {
    openAssistent("Rendite freischalten", [
      { id: "invest", frage: "Was hast du in " + s.name + " investiert?",
        hinweis: "Kaufpreis inklusive Nebenkosten wie Notar, Grunderwerbsteuer und Makler. Daraus berechnet ESTRIQ deine Rendite.",
        typ: "number", einheit: "€", pflicht: true, platzhalter: "z. B. 250000" }
    ], async (a) => {
      await speichereObjekt(s._id, { invest: alsZahl(a.invest) });
      closeSheet(); await window.nachSpeichern();
      showToast("Rendite wird jetzt berechnet."); route(s.id);
    });
  }

  // Mieter nachtragen
  function pflegeMieter(s, u) {
    openAssistent("Mieter eintragen", [
      { id: "mieter", frage: "Wer wohnt in " + (u.wohnung || "dieser Einheit") + "?",
        hinweis: "Der Name hilft dir bei der Zahlungskontrolle und den Verträgen.",
        typ: "text", pflicht: true, platzhalter: "z. B. Familie Müller" },
      { id: "einzug", frage: "Seit wann wohnt die Person dort?",
        hinweis: "Kannst du auch später ergänzen.",
        typ: "date", ueberspringbar: true }
    ], async (a) => {
      await speichereEinheit(u._id, { mieter: a.mieter || null, einzug: a.einzug || null });
      closeSheet(); await window.nachSpeichern();
      showToast("Mieter gespeichert."); route(s.id);
    });
  }

  // Leerstand prüfen → ggf. auf vermietet setzen
  function pflegeLeerstand(s, u) {
    openAssistent("Status prüfen", [
      { id: "jetzt_vermietet", frage: "Ist " + (u.wohnung || "die Einheit") + " inzwischen vermietet?",
        hinweis: "Sobald du sie als vermietet führst, fließt die Miete in deine Einnahmen ein.",
        optionen: [
          { t: "Ja, sie ist vermietet", v: "ja" },
          { t: "Nein, sie steht weiter leer", v: "nein" }
        ] },
      { id: "mieter", frage: "Wer wohnt dort?",
        hinweis: "Der Name hilft bei der Zahlungskontrolle.",
        typ: "text", ueberspringbar: true, platzhalter: "z. B. Familie Müller" }
    ], async (a) => {
      if (a.jetzt_vermietet === "ja") {
        await speichereEinheit(u._id, { status: "vermietet", mieter: a.mieter || null });
        closeSheet(); await window.nachSpeichern();
        showToast("Einheit ist jetzt als vermietet erfasst.");
      } else {
        closeSheet();
        showToast("Alles klar – Status bleibt unverändert.");
      }
      route(s.id);
    });
  }

  // Nebenkosten geführt erfassen
  function pflegeNebenkosten(s) {
    openAssistent("Nebenkosten erfassen", [
      { id: "grundsteuer", frage: "Wie viel Grundsteuer zahlst du?",
        hinweis: "Pro Monat. Wenn du den Jahresbetrag kennst, teile ihn durch zwölf.",
        typ: "number", einheit: "€ / Monat", ueberspringbar: true, platzhalter: "z. B. 45" },
      { id: "versicherung", frage: "Was kostet die Versicherung?",
        hinweis: "Gebäude- und Haftpflichtversicherung, pro Monat.",
        typ: "number", einheit: "€ / Monat", ueberspringbar: true, platzhalter: "z. B. 60" },
      { id: "hausgeld", frage: "Zahlst du Hausgeld oder Verwaltung?",
        hinweis: "Zum Beispiel an die Hausverwaltung, pro Monat.",
        typ: "number", einheit: "€ / Monat", ueberspringbar: true, platzhalter: "z. B. 120" },
      { id: "sonstige", frage: "Gibt es weitere laufende Kosten?",
        hinweis: "Zum Beispiel Wartung, Gartenpflege oder Schornsteinfeger – zusammengefasst pro Monat.",
        typ: "number", einheit: "€ / Monat", ueberspringbar: true, platzhalter: "z. B. 30" }
    ], async (a) => {
      const pos = [];
      const nimm = (titel, wert) => { const n = alsZahl(wert); if (n) pos.push({ titel: titel, betrag: n }); };
      nimm("Grundsteuer", a.grundsteuer);
      nimm("Versicherung", a.versicherung);
      nimm("Hausgeld / Verwaltung", a.hausgeld);
      nimm("Sonstige Kosten", a.sonstige);
      await speichereObjekt(s._id, { nk_positionen: pos.length ? pos : null });
      closeSheet(); await window.nachSpeichern();
      showToast(pos.length ? "Nebenkosten gespeichert." : "Keine Angaben – nichts geändert.");
      route(s.id);
    });
  }

  /* ---------- MIETEN IM LAUFENDEN MONAT ---------- */

  const monatsName = () => new Date().toLocaleDateString("de-DE", { month: "long" });
  const qm = (n) => (Number(n) || 0).toLocaleString("de-DE", { maximumFractionDigits: 2 }) + "\u00A0m²";
  const mehrzahl = (n, eins, viele) => n + " " + (n === 1 ? eins : viele);
  // Hausnummer nicht vom Straßennamen trennen („Parkallee 8" bricht nicht vor der 8 um)
  const nameOhneBruch = (s) => String(s || "").replace(/ (\d+\s?[a-zA-Z]?)$/, "\u00A0$1");

  // Tag, an dem die Miete in diesem Monat fällig ist. Ein Zahltag 29 bis 31 fällt in kürzeren Monaten
  // auf den letzten Tag – sonst würde die Miete dort nie fällig.
  function zahltagIm(u, d) {
    d = d || new Date();
    const letzter = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return Math.min(Math.max(1, Math.round(Number(u.zahltag) || 1)), letzter);
  }
  // Mieten, die in dieser Ansicht gerade als eingegangen vermerkt wurden. Ihre Zeile bleibt stehen,
  // bis man die Ansicht wechselt – so rutscht kein anderer Knopf unter den Finger.
  const frischEingegangen = new Set();
  const mieteInArbeit = new Set();      // Einheiten, deren Mieteingang gerade gespeichert wird
  let mieteKette = Promise.resolve();   // Speichervorgänge laufen nacheinander – kein Antippen geht verloren
  const MIETE_FRIST = 15000;            // antwortet der Server so lange nicht, endet der Versuch mit einer Meldung
  const NEULADEN_HINWEIS = "Gespeichert. Die Anzeige ließ sich nicht neu laden – bitte lade die Seite neu.";

  // Wo der Fokus in der Ansicht steht, als Weg aus Kind-Nummern. Damit übersteht er das Neuzeichnen
  // nach dem Speichern: Wer mit der Tastatur arbeitet, macht an derselben Stelle weiter.
  const fokusMerkmal = (n) => n.tagName + "." + (n.classList[0] || "");
  function fokusWeg(n) {
    const wurzel = $("#views");
    if (!n || !wurzel || n === wurzel || !wurzel.contains(n)) return null;
    const weg = [];
    while (n !== wurzel) { const p = n.parentNode; weg.unshift({ i: Array.prototype.indexOf.call(p.children, n), m: fokusMerkmal(n) }); n = p; }
    return weg;
  }
  function fokusAufWeg(weg) {
    if (!weg || !feinerZeiger()) return;
    let n = $("#views");
    const kette = [];
    // Nur so weit folgen, wie der Aufbau noch derselbe ist – sonst landete der Fokus auf etwas Fremdem
    for (const s of weg) { n = n && n.children[s.i]; if (!n || fokusMerkmal(n) !== s.m) break; kette.push(n); }
    // das Element selbst oder das nächste darüber, das den Fokus annehmen kann (etwa die Zeile statt des Knopfs)
    for (let i = kette.length - 1; i >= 0; i--) {
      if (kette[i].matches("button:not([disabled]), [tabindex], a[href], input, select, textarea")) {
        try { kette[i].focus({ preventScroll: true }); } catch (_) {}
        return;
      }
    }
    // Die Stelle gibt es nicht mehr: Der Fokus geht auf den Seitentitel, die Tabulatortaste führt von dort in den Inhalt
    const titel = $("#pageTitle");
    if (titel) { titel.setAttribute("tabindex", "-1"); try { titel.focus({ preventScroll: true }); } catch (_) {} }
  }

  // Liefert alle Einheiten, deren Miete diesen Monat fällig, aber noch nicht bestätigt ist
  function offeneMieten() {
    const jetzt = new Date();
    const tagHeute = jetzt.getDate();
    const jahr = jetzt.getFullYear(), monat = jetzt.getMonth() + 1;
    const zahlungen = (D.zahlungen || []);
    const erledigt = new Set(zahlungen.filter(z => z.status === "eingegangen").map(z => z.einheit_id));
    const offen = [];
    (D.streams || []).filter(s => s.kind === "miete").forEach(s => {
      (s.einheiten || []).forEach(u => {
        if (u.status !== "vermietet") return;          // nur vermietete Einheiten
        if (tagHeute < zahltagIm(u, jetzt)) return;    // noch nicht fällig
        if (erledigt.has(u._id)) return;               // schon eingegangen
        const i = FE.unitIncome(u);
        if (!(i.gesamt > 0)) return;                   // keine Miete hinterlegt: nichts zu bestätigen
        offen.push({ objekt: s, einheit: u, soll: i.gesamt, jahr, monat });
      });
    });
    return offen;
  }

  // Bestätigter Eingang dieser Einheit im laufenden Monat (oder nichts)
  function zahlungVon(u) {
    return (D.zahlungen || []).find(z => z.einheit_id === u._id && z.status === "eingegangen") || null;
  }

  // Stand der Miete einer Einheit im laufenden Monat – dieselbe Regel wie offeneMieten():
  // "frei" · "bestaetigt" (eingegangen) · "offen" (fällig, nicht eingegangen) · "spaeter" (noch nicht fällig)
  // · "keine" (vermietet, aber keine Miete hinterlegt)
  function mietStand(u) {
    if (u.status !== "vermietet") return "frei";
    if (zahlungVon(u)) return "bestaetigt";
    if (!(FE.unitIncome(u).gesamt > 0)) return "keine";
    return new Date().getDate() >= zahltagIm(u) ? "offen" : "spaeter";
  }

  // Zahlen für die Hauptaussage: Was kommt rein, was steht leer, wer hat nicht gezahlt?
  // Summen aus FE.streamMonthly, damit sie zu allen anderen Stellen passen.
  function vermietungsStand(streams) {
    const r = { ist: 0, pot: 0, einheiten: 0, vermietet: 0, frei: [], offen: [], bestaetigt: 0, spaeter: 0 };
    (streams || []).forEach(s => {
      const m = FE.streamMonthly(s);
      r.ist += m.gesamt; r.pot += m.gesamtPotenzial;
      r.einheiten += m.einheiten; r.vermietet += m.vermietet;
      (s.einheiten || []).forEach(u => {
        const stand = mietStand(u);
        const i = FE.unitIncome(u);
        if (stand === "frei") r.frei.push({ objekt: s, einheit: u, ertrag: m.puffer ? i.gesamt - i.nk : i.gesamt });
        else if (stand === "offen") r.offen.push({ objekt: s, einheit: u, soll: i.gesamt });
        else if (stand === "bestaetigt") r.bestaetigt++;
        else if (stand === "spaeter") r.spaeter++;
      });
    });
    r.summeOffen = r.offen.reduce((a, o) => a + o.soll, 0);
    r.leerstand = r.pot - r.ist;                                   // was durch Leerstand im Monat fehlt
    r.auslastung = r.einheiten ? Math.round(r.vermietet / r.einheiten * 100) : 0;
    return r;
  }

  // Die drei Zustände neben der Hauptzahl. Jeder Zustand steht in Worten da, die Farbe kommt nur dazu.
  function standFakten(stand) {
    const frei = stand.frei.length, offen = stand.offen.length;
    const vermietet = {
      titel: "Vermietet",
      wert: stand.vermietet + " von " + stand.einheiten,
      text: stand.einheiten ? stand.auslastung + " % Auslastung" : "Noch keine Einheit angelegt",
      zustand: stand.einheiten && !frei ? "gut" : ""
    };
    const leer = !stand.einheiten
      ? { titel: "Leerstand", wert: "—", text: "Noch keine Einheit angelegt", zustand: "" }
      : frei
        ? { titel: "Leerstand", wert: mehrzahl(frei, "Einheit", "Einheiten") + " frei", text: eur(stand.leerstand) + " im Monat ungenutzt", zustand: "achtung" }
        : { titel: "Leerstand", wert: "Kein Leerstand", text: "Alle Einheiten sind vermietet", zustand: "gut" };
    const titelMiete = "Mieteingang " + monatsName();
    let miete;
    if (!stand.vermietet) miete = { titel: titelMiete, wert: "—", text: "Keine vermietete Einheit", zustand: "" };
    else if (offen) miete = { titel: titelMiete, wert: mehrzahl(offen, "Miete", "Mieten") + " offen", text: "zusammen " + eur(stand.summeOffen), zustand: "achtung",
      // Antippen öffnet die Mietkontrolle: alle offenen Mieten auf einen Blick, einzeln oder zusammen bestätigen
      tun: () => openMietCheckSheet(stand.offen, { vonHand: true }), hinweis: "Offene Mieten ansehen" };
    else if (stand.spaeter && !stand.bestaetigt) miete = { titel: titelMiete, wert: "Noch nichts fällig", text: mehrzahl(stand.spaeter, "Miete wird", "Mieten werden") + " später im Monat fällig", zustand: "" };
    else if (stand.spaeter) miete = { titel: titelMiete, wert: stand.bestaetigt + " eingegangen", text: mehrzahl(stand.spaeter, "Miete wird", "Mieten werden") + " später im Monat fällig", zustand: "gut" };
    else if (!stand.bestaetigt) miete = { titel: titelMiete, wert: "—", text: "Keine Miete hinterlegt", zustand: "" };
    else miete = { titel: titelMiete, wert: "Alle eingegangen", text: mehrzahl(stand.bestaetigt, "Miete", "Mieten"), zustand: "gut" };
    return [vermietet, leer, miete];
  }

  // Speichert einen Mieteingang über die Datenbankfunktion miete_bestaetigen – mit Frist,
  // damit ein Server ohne Antwort nicht alles blockiert.
  function mieteSpeichern(einheitId, eingegangen, betrag) {
    const jetzt = new Date();
    let uhr;
    const frist = new Promise((_, nein) => { uhr = setTimeout(() => { const e = new Error("Zeit abgelaufen"); e.eqFrist = true; nein(e); }, MIETE_FRIST); });
    return Promise.race([
      window.mietEingangSetzen(einheitId, jetzt.getFullYear(), jetzt.getMonth() + 1, eingegangen ? "eingegangen" : "offen", eingegangen ? betrag : null),
      frist
    ]).finally(() => clearTimeout(uhr));
  }
  const mieteFehlerText = (e) => e && e.eqFrist
    ? "Der Server antwortet gerade nicht. Bitte versuch es gleich noch einmal."
    : window.fehlerText(e);

  // Einen Mieteingang festhalten oder zurücknehmen: ein Schritt, mit sichtbarer Bestätigung.
  // Mehrere Antipper hintereinander werden der Reihe nach gespeichert.
  function mieteSetzen(u, eingegangen, knopf) {
    if (istGesperrt()) { openUpgradeSheet("gesperrt"); return Promise.resolve(false); }
    if (mieteInArbeit.has(u._id)) return Promise.resolve(false);
    mieteInArbeit.add(u._id);
    const vorher = knopf ? knopf.textContent : "";
    const weg = knopf && document.activeElement === knopf ? fokusWeg(knopf) : null;
    if (knopf) { knopf.disabled = true; knopf.textContent = "Speichere…"; }
    const lauf = mieteKette.then(() => mieteAusfuehren(u, eingegangen, knopf, vorher, weg));
    mieteKette = lauf.catch(() => {});
    return lauf;
  }
  async function mieteAusfuehren(u, eingegangen, knopf, vorher, weg) {
    try {
      await mieteSpeichern(u._id, eingegangen, FE.unitIncome(u).gesamt);
    } catch (e) {
      mieteInArbeit.delete(u._id);
      // Der Knopf kann inzwischen neu gezeichnet sein (ein früherer Vorgang hat die Ansicht aufgefrischt)
      if (knopf && knopf.isConnected) { knopf.disabled = false; knopf.textContent = vorher; }
      else window.refreshView();
      showToast(mieteFehlerText(e));
      return false;
    }
    // Ab hier ist gespeichert. Scheitert nur das Neuladen, sagt die Meldung genau das.
    mieteInArbeit.delete(u._id);
    if (eingegangen) frischEingegangen.add(u._id); else frischEingegangen.delete(u._id);
    const fuer = u.wohnung ? " für " + u.wohnung : "";
    try {
      await window.nachSpeichern();
      fokusAufWeg(weg);
      showToast(eingegangen ? "Gespeichert: Miete" + fuer + " ist eingegangen." : "Gespeichert: Miete" + fuer + " ist wieder offen.");
    } catch (_) {
      if (knopf && knopf.isConnected) {
        knopf.textContent = eingegangen ? "eingegangen" : "zurückgenommen";
        const zeile = knopf.closest(".mk-row, .eq-tab-z");
        if (zeile && eingegangen) { zeile.classList.add("erledigt"); const h = zeile.querySelector(".eq-c-e .eq-nur-schmal"); if (h) h.textContent = "Miete " + monatsName(); }
      }
      showToast(NEULADEN_HINWEIS);
      return "ungeladen";   // gespeichert, aber die Anzeige zeigt noch den alten Stand
    }
    return true;
  }
  // Knopf „Eingegangen" einer Zeile. Wird die Einheit gerade gespeichert, zeigt er das auch nach einem Neuzeichnen.
  const mietKnopf = (u, attribute) => mieteInArbeit.has(u._id)
    ? `<button type="button" class="mk-ok" ${attribute} disabled>Speichere…</button>`
    : `<button type="button" class="mk-ok" ${attribute}>Eingegangen</button>`;

  // Zeile einer Miete: offen mit dem Knopf „Eingegangen", sonst mit dem Vermerk „eingegangen"
  function mietZeile(o, mitObjekt) {
    return `<div class="mk-row${o.erledigt ? " erledigt" : ""}" data-einheit="${o.einheit._id}" tabindex="-1">
      <div class="mk-tx">
        <div class="mk-n">${esc(o.einheit.wohnung || "Einheit")}${mitObjekt ? ` <span class="mk-o">${esc(nameOhneBruch(o.objekt.name))}</span>` : ""}</div>
        <div class="mk-m">${esc(o.einheit.mieter || "ohne Namen")}\u00A0· fällig am\u00A0${zahltagIm(o.einheit)}.</div>
      </div>
      <div class="mk-soll">${eur(o.soll)}</div>
      ${o.erledigt
        ? `<div class="mk-da"><span class="eq-marke gut">eingegangen</span></div>`
        : mietKnopf(o.einheit, `data-einheit="${o.einheit._id}" data-betrag="${o.soll}"`)}
    </div>`;
  }

  // Karte „Offene Mieten": Wer hat diesen Monat noch nicht gezahlt? Bestätigen in einem Schritt.
  // Eine gerade vermerkte Miete bleibt als „eingegangen" stehen, bis man die Ansicht wechselt.
  // Gibt nichts zurück, wenn es nichts zu zeigen gibt.
  function offeneMietenKarte(streams) {
    const zeilen = [];
    (streams || []).forEach(s => (s.einheiten || []).forEach(u => {
      const stand = mietStand(u);
      const frisch = stand === "bestaetigt" && frischEingegangen.has(u._id);
      if (stand === "offen" || frisch) zeilen.push({ objekt: s, einheit: u, soll: FE.unitIncome(u).gesamt, erledigt: frisch });
    }));
    if (!zeilen.length) return null;
    const offen = zeilen.filter(z => !z.erledigt);
    const summe = offen.reduce((a, o) => a + o.soll, 0);
    // Höchstens sechs offene Mieten stehen in der Karte. Schon vermerkte Zeilen zählen nicht mit,
    // damit hinter ihnen immer die nächsten offenen sichtbar werden.
    const GRENZE = 6;
    const zeigen = []; let gezeigtOffen = 0;
    for (const z of zeilen) { if (!z.erledigt) { if (gezeigtOffen >= GRENZE) continue; gezeigtOffen++; } zeigen.push(z); }
    const satz = !offen.length ? "Alle fälligen Mieten sind eingegangen."
      : (offen.length === 1 ? "Eine Miete ist" : offen.length + " Mieten sind") + " fällig und noch offen · zusammen " + eur(summe);
    const karte = el(`<div class="card eq-mieten">
      <div class="card-h">
        <div><div class="card-t">${offen.length ? "Offene Mieten" : "Mieteingang"} im ${esc(monatsName())}</div>
          <div class="card-s">${satz}</div></div>
        ${offen.length && zeilen.length > 1 ? `<button type="button" class="add-btn" data-alle>Alle ansehen</button>` : ""}
      </div>
      <div class="card-b">${zeigen.map(o => mietZeile(o, (streams || []).length > 1)).join("")}
        ${offen.length > gezeigtOffen ? `<button type="button" class="add-btn wide" data-alle style="margin-top:12px">Alle ${offen.length} offenen ansehen</button>` : ""}</div></div>`);
    karte.querySelectorAll(".mk-ok").forEach(b => b.onclick = () => {
      const o = offen.find(x => x.einheit._id === b.dataset.einheit);
      if (o) mieteSetzen(o.einheit, true, b);
    });
    karte.querySelectorAll("[data-alle]").forEach(b => b.onclick = () => openMietCheckSheet(offen, { vonHand: true }));
    return karte;
  }

  // Beim Login: fällige Mieten abfragen. Gibt true zurück, wenn ein Fenster geöffnet wurde.
  function pruefeMieteingaenge() {
    // "Später erinnern" gilt bis zum nächsten Login
    if (sessionStorage.getItem("estriq_miete_spaeter") === "1") return false;
    const offen = offeneMieten();
    if (!offen.length) return false;
    openMietCheckSheet(offen);
    return true;
  }

  // opt.vonHand: selbst geöffnet (nicht die Nachfrage beim Login) – dann heißt der zweite Knopf „Schließen"
  function openMietCheckSheet(offen, opt) {
    opt = opt || {};
    const monatName = new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    // Nach Objekt gruppieren
    const gruppen = {};
    offen.forEach(o => {
      const k = o.objekt._id;
      if (!gruppen[k]) gruppen[k] = { name: o.objekt.name, icon: o.objekt.icon || "home", zeilen: [] };
      gruppen[k].zeilen.push(o);
    });
    const summe = offen.reduce((a, o) => a + o.soll, 0);

    const body = `
      <div class="wc-hero" style="padding-bottom:14px">
        <div class="wc-badge">Mietkontrolle · ${esc(monatName)}</div>
        <div class="wc-t">Sind diese Mieten eingegangen?</div>
        <div class="wc-d" id="mkStand">${offen.length === 1 ? "Eine Miete ist" : offen.length + " Mieten sind"} fällig · zusammen ${eur(summe)}</div>
      </div>
      <div id="mkListe">
        ${Object.keys(gruppen).map(k => `
          <div class="mk-obj">
            <div class="mk-obj-h">${svg(gruppen[k].icon)}<span>${esc(nameOhneBruch(gruppen[k].name))}</span></div>
            ${gruppen[k].zeilen.map(o => mietZeile(o, false)).join("")}
          </div>`).join("")}
      </div>
      <div class="ef-actions eq-fest mk-actions">
        <div class="ef-msg" id="mkMsg" role="status"></div>
        <div class="ef-knoepfe">
          <button type="button" class="eq-btn" id="mkAlle">${offen.length === 1 ? "Eingegangen" : "Alle eingegangen"}</button>
          <button type="button" class="eq-btn zweit" id="mkSpaeter">${opt.vonHand ? "Schließen" : "Später erinnern"}</button>
        </div>
      </div>`;
    const sheet = openSheet("Mieteingänge", "", body);
    const msg = sheet.querySelector("#mkMsg");
    const alle = sheet.querySelector("#mkAlle");
    let etwasBestaetigt = false;

    // Kopfzeile auf dem Stand halten: wie viele Mieten in diesem Fenster noch offen sind
    function standZeigen() {
      const rest = [...sheet.querySelectorAll(".mk-row:not(.erledigt) .mk-ok")];
      const sum = rest.reduce((a, b) => a + (Number(b.dataset.betrag) || 0), 0);
      sheet.querySelector("#mkStand").textContent = !rest.length ? "Alle Mieten sind eingegangen."
        : (rest.length === 1 ? "Eine Miete ist" : rest.length + " Mieten sind") + " fällig · zusammen " + eur(sum);
      if (alle.textContent !== "Speichere…") alle.textContent = rest.length === 1 ? "Eingegangen" : "Alle eingegangen";
    }
    // Die Ansicht dahinter neu laden. Scheitert das, ist trotzdem gespeichert – das steht dann in der Meldung.
    async function neuLaden() {
      try { await window.nachSpeichern(); return true; }
      catch (_) { msg.textContent = NEULADEN_HINWEIS; msg.className = "ef-msg bad"; return false; }
    }

    // Meldung nach dem Schließen: Stehen woanders noch Mieten offen, behauptet sie nicht „alle"
    const fertigText = () => {
      const n = sheet.querySelectorAll(".mk-row.erledigt").length;
      return offeneMieten().length ? "Gespeichert: " + (n === 1 ? "Die Miete ist" : "Die " + n + " Mieten sind") + " eingegangen."
        : "Gespeichert: Alle Mieten sind eingegangen.";
    };

    async function bestaetige(einheitId, betrag, zeile) {
      try {
        await mieteSpeichern(einheitId, true, betrag);
        etwasBestaetigt = true;
        if (zeile) { zeile.classList.add("erledigt"); const b = zeile.querySelector(".mk-ok"); if (b) { b.textContent = "eingegangen"; b.disabled = true; } }
        standZeigen();
        return true;
      } catch (e) {
        msg.textContent = mieteFehlerText(e); msg.className = "ef-msg bad";
        return false;
      }
    }

    sheet.querySelectorAll(".mk-ok").forEach(b => b.onclick = async () => {
      if (istGesperrt()) { openUpgradeSheet("gesperrt"); return; }
      b.disabled = true; b.textContent = "Speichere…";
      const ok = await bestaetige(b.dataset.einheit, Number(b.dataset.betrag), b.closest(".mk-row"));
      if (!ok) { b.disabled = false; b.textContent = "Eingegangen"; return; }
      const geladen = await neuLaden();
      // Wenn alle erledigt sind, Fenster schließen
      if (geladen && sheet.isConnected && !sheet.querySelectorAll(".mk-row:not(.erledigt)").length) {
        const text = fertigText();
        closeSheet(); showToast(text);
      }
    });

    alle.onclick = async () => {
      if (istGesperrt()) { openUpgradeSheet("gesperrt"); return; }
      alle.disabled = true; alle.textContent = "Speichere…";
      let fehler = 0;
      for (const b of sheet.querySelectorAll(".mk-row:not(.erledigt) .mk-ok")) {
        const r = await bestaetige(b.dataset.einheit, Number(b.dataset.betrag), b.closest(".mk-row"));
        if (!r) fehler++;
      }
      if (fehler) {
        // Nicht schließen und keinen Erfolg melden, wenn etwas schiefging
        if (etwasBestaetigt) { try { await window.nachSpeichern(); } catch (_) {} }
        alle.disabled = false; alle.textContent = "Erneut versuchen";
        return;
      }
      if (!(await neuLaden())) { alle.textContent = "Gespeichert"; return; }
      // Gegenprobe: Stehen die Mieten dieses Fensters wirklich in der Datenbank?
      const hier = new Set(offen.map(o => o.einheit._id));
      const nochOffen = offeneMieten().filter(o => hier.has(o.einheit._id)).length;
      const text = nochOffen
        ? "Gespeichert, aber " + (nochOffen === 1 ? "eine Miete ist" : nochOffen + " Mieten sind") + " noch offen."
        : fertigText();
      closeSheet();
      showToast(text);
    };

    sheet.querySelector("#mkSpaeter").onclick = () => {
      if (opt.vonHand) { closeSheet(); return; }
      sessionStorage.setItem("estriq_miete_spaeter", "1");
      closeSheet();
      showToast("Wir erinnern dich beim nächsten Login.");
    };
  }

  // Entfernt ?bezahlt / ?abbruch aus der Adresszeile
  function geschichteBereinigen() {
    try { history.replaceState(null, "", location.origin + location.pathname); } catch (_) {}
  }

  // Kurze Einblend-Nachricht am unteren Rand
  function showToast(text) {
    let t = $("#toast");
    if (!t) { t = el(`<div id="toast" class="toast"></div>`); document.body.appendChild(t); }
    t.textContent = text;
    t.classList.add("on");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("on"), 3500);
  }

  // Willkommen: Abo wählen (30 Tage Test)
  // Onboarding-Schritt 1: Farbschema wählen
  function openFarbwahlSheet(opt) {
    opt = opt || {};
    // opt.willkommen: erster Start einer eingeladenen Person – nur die Farben, kein weiterer Ablauf
    const firma = abo().firma;
    const body = `
      <div class="wc-hero">
        ${opt.onboarding || opt.willkommen ? `<span class="eq-logo wc-logo" role="img" aria-label="ESTRIQ"></span>` : ""}
        ${opt.onboarding ? `<div class="wc-steps"><span class="on"></span><span></span><span></span></div>` : ""}
        <div class="wc-badge">${opt.onboarding || opt.willkommen ? "Willkommen bei ESTRIQ" : "Darstellung"}</div>
        <div class="wc-t">Mach es zu deinem</div>
        <div class="wc-d">${opt.willkommen ? esc(firma ? "Du arbeitest jetzt im Konto „" + firma + "“. " : "Du arbeitest jetzt im Konto deiner Firma. ") : ""}Wähle dein Farbschema. Du kannst es jederzeit im Profil ändern — die Auswahl gilt auf all deinen Geräten${opt.willkommen ? " und nur für dich" : ""}.</div>
      </div>
      ${schemaKacheln("wcTheme")}
      <button class="wc-cta prem" id="wcDone" style="margin-top:24px">${opt.onboarding ? "Weiter" : opt.willkommen ? "Los geht’s" : "Speichern"}</button>`;
    const sheet = openSheet("Darstellung", "", body);

    schemaVerdrahten(sheet, "wcTheme");
    sheet.querySelector("#wcDone").onclick = async () => {
      await themeInDB(aktThemeId());
      if (opt.onboarding) { closeSheet(); setTimeout(() => openErstesObjektSheet(), 250); }
      else { closeSheet(); }
    };
  }

  // Onboarding-Schritt 2: erstes Objekt anlegen (erzeugt Bindung)
  function openErstesObjektSheet() {
    const body = `
      <div class="wc-hero">
        <div class="wc-steps"><span class="done"></span><span class="on"></span><span></span></div>
        <div class="wc-badge">Erster Schritt in dein Portfolio</div>
        <div class="wc-t">Leg dein erstes Objekt an</div>
        <div class="wc-d">Trag eine Immobilie ein, die du vermietest. Du siehst sofort, wie ESTRIQ deine Einnahmen und Rendite berechnet.</div>
      </div>
      <button class="wc-cta prem" id="obStart">Erstes Objekt anlegen</button>
      <div class="wc-skip"><a href="#" id="obSkip">Überspringen</a></div>`;
    const sheet = openSheet("Erstes Objekt", "", body);
    sheet.querySelector("#obStart").onclick = () => {
      closeSheet();
      // Nach dem Speichern des Objekts geht es weiter zu den Fragen
      setTimeout(() => assistentObjekt({ nachOnboarding: true }), 200);
    };
    sheet.querySelector("#obSkip").onclick = (e) => { e.preventDefault(); closeSheet(); setTimeout(() => openTarifFragenSheet(), 200); };
  }

  // Onboarding-Schritt 3: drei Fragen → Abo-Empfehlung
  // Jede Frage bildet einen echten Unterschied zwischen Basic und Premium ab.
  function openTarifFragenSheet() {
    const b = TARIFE.basic;
    const fragen = [
      { id: "objekte", frage: "Wie viele Immobilien möchtest du verwalten?",
        hinweis: `Basic reicht für bis zu ${b.objekte} Objekte. Premium ist unbegrenzt.`,
        opt: [
          { t: "1 – 3 Objekte", v: "wenige" },
          { t: "4 – 10 Objekte", v: "mittel" },
          { t: "Mehr als 10", v: "viele" }
        ] },
      { id: "einheiten", frage: "Wie viele Wohnungen oder Einheiten sind das zusammen?",
        hinweis: `Zähl alle Wohnungen und Gewerbeeinheiten zusammen. Basic reicht für bis zu ${b.einheiten}.`,
        opt: [
          { t: "Bis 10", v: "bis10" },
          { t: "11 – 30", v: "bis30" },
          { t: "Mehr als 30", v: "mehr" }
        ] },
      { id: "ziel", frage: "Was möchtest du mit ESTRIQ außerdem erledigen?",
        hinweis: "Nebenkostenabrechnung, Handwerker und mehrere Nutzer gehören zu Premium.",
        opt: [
          { t: "Nur Mieten und Finanzierung im Blick behalten", v: "basis" },
          { t: "Nebenkosten abrechnen oder Sanierungen steuern", v: "module" },
          { t: "Mit Kollegen oder Partner gemeinsam arbeiten", v: "team" }
        ] }
    ];
    const antworten = {};
    let idx = 0;

    const sheet = openSheet("Kurz gefragt", "", `<div id="fragenBody"></div>`);
    const bodyEl = sheet.querySelector("#fragenBody");

    function zeigeFrage() {
      const f = fragen[idx];
      bodyEl.innerHTML = `
        <div class="wc-hero">
          <div class="wc-steps"><span class="done"></span><span class="done"></span><span class="on"></span></div>
          <div class="wc-badge">Frage ${idx + 1} von ${fragen.length}</div>
          <div class="wc-t" style="font-size:19px">${esc(f.frage)}</div>
          <div class="wc-d">${esc(f.hinweis)}</div>
        </div>
        <div class="frage-opts">
          ${f.opt.map(o => `<button class="frage-opt" data-v="${o.v}">${esc(o.t)}</button>`).join("")}
        </div>`;
      bodyEl.querySelectorAll(".frage-opt").forEach(b => b.onclick = () => {
        antworten[f.id] = b.dataset.v;
        if (idx < fragen.length - 1) { idx++; zeigeFrage(); }
        else { closeSheet(); setTimeout(() => openEmpfehlungSheet(antworten), 200); }
      });
    }
    zeigeFrage();
  }

  // Regel der Empfehlung: Premium, sobald eine Basic-Grenze überschritten wird
  // oder ein Premium-Modul bzw. mehrere Nutzer gewünscht sind. Sonst Basic.
  function empfohlenerTarif(antworten) {
    const b = TARIFE.basic, gruende = [];
    if (antworten.objekte === "mittel" || antworten.objekte === "viele")
      gruende.push(`du mehr als ${b.objekte} Objekte verwaltest`);
    if (antworten.einheiten === "bis30" || antworten.einheiten === "mehr")
      gruende.push(`es mehr als ${b.einheiten} Einheiten sind`);
    if (antworten.ziel === "module") gruende.push("du Nebenkosten abrechnen oder Sanierungen steuern willst");
    if (antworten.ziel === "team") gruende.push("ihr zu mehreren arbeiten wollt");
    return { plan: gruende.length ? "premium" : "basic", gruende };
  }

  // Onboarding-Schritt 4: Empfehlung + Checkout
  function openEmpfehlungSheet(antworten) {
    const e = empfohlenerTarif(antworten);
    const plan = e.plan, tf = TARIFE[plan];
    const brauchtPremium = plan === "premium";
    const preis = tf.preis, name = tf.name;
    const liste = e.gruende.length > 1
      ? e.gruende.slice(0, -1).join(", ") + " und " + e.gruende[e.gruende.length - 1]
      : e.gruende[0];
    const begruendung = brauchtPremium
      ? `Wir empfehlen Premium, weil ${liste}.`
      : `Für deinen Bestand genügt Basic: bis zu ${TARIFE.basic.objekte} Objekte und ${TARIFE.basic.einheiten} Einheiten mit allen Kennzahlen. Wechseln kannst du jederzeit.`;

    const body = `
      <div class="wc-hero">
        <div class="wc-steps"><span class="done"></span><span class="done"></span><span class="done"></span></div>
        <div class="wc-badge">Unsere Empfehlung für dich</div>
        <div class="wc-t">${esc(name)}</div>
        <div class="wc-d">${esc(begruendung)}</div>
      </div>
      <div class="empf-plan ${brauchtPremium ? "premium" : ""}">
        <div class="empf-top">
          <div class="empf-n">${esc(name)}</div>
          <div class="empf-p">${preis}<span>/Monat</span></div>
        </div>
        <ul class="wc-feats">${leistungsListe(plan)}</ul>
      </div>
      <button class="wc-cta prem" id="empfCta" style="margin-top:8px">30 Tage kostenlos testen</button>
      <button class="wc-cta" id="empfAlt" style="margin-top:10px">${brauchtPremium ? "Lieber mit Basic starten" : "Doch lieber Premium ansehen"}</button>
      <div class="wc-note" style="margin-top:14px">Erster Monat kostenlos · jederzeit kündbar · danach ${preis}/Monat</div>`;
    const sheet = openSheet("Dein Tarif", "", body);

    sheet.querySelector("#empfCta").onclick = () => onboardingCheckout(plan, sheet.querySelector("#empfCta"));
    sheet.querySelector("#empfAlt").onclick = () => {
      const anderer = plan === "premium" ? "basic" : "premium";
      onboardingCheckout(anderer, sheet.querySelector("#empfAlt"));
    };
  }

  // Checkout aus dem Onboarding: markiert Fluss als fertig, dann zu Stripe
  async function onboardingCheckout(plan, btn) {
    if (!istInhaber()) { showToast(nurInhaberSatz()); return; }
    const alt = btn.textContent;
    btn.disabled = true; btn.textContent = "Bezahlseite wird geöffnet…";
    try {
      merkSetzen("estriq_onboarding_fertig", "1");
      merkSetzen("estriq_checkout_aus_onboarding", "1");   // für B1 bei Abbruch
      const { data: { session } } = await window.sb.auth.getSession();
      const token = session && session.access_token;
      const res = await fetch(window.SB_FUNKTION + "/checkout-starten", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({
          plan,
          erfolg_url: location.origin + location.pathname + "?bezahlt=1",
          abbruch_url: location.origin + location.pathname + "?abbruch=1"
        })
      });
      const j = await res.json();
      if (j.url) { location.href = j.url; }
      else { btn.disabled = false; btn.textContent = alt; showToast(j.fehler || "Konnte nicht öffnen."); }
    } catch (e) {
      btn.disabled = false; btn.textContent = alt; showToast("Verbindung fehlgeschlagen.");
    }
  }

  /* ---------- NAV ---------- */
  // Alle Mietobjekte (kind === "miete") laufen unter einem Sammel-Reiter
  function mietStreams() { return (D.streams || []).filter(s => s.kind === "miete"); }

  function navItems() {
    return [
      { id: "overview", label: "Übersicht", icon: "grid" },
      { id: "vermietung", label: "Vermietung", icon: "home", group: true },
      { id: "tools", label: "Tools", icon: "chart" }
    ];
  }
  function shortLabel(n) { return (n || "").split(" · ")[0]; }

  // Drei Formen der Navigation: unten am Handy, schmale Leiste am iPad, breite Leiste ab 1200 Pixel.
  const istHandy = () => window.matchMedia("(max-width: 599px)").matches;
  const navForm = () => istHandy() ? "handy" : window.matchMedia("(min-width: 1200px)").matches ? "breit" : "schmal";

  // Baut die Navigation vollständig auf – unten am Handy, links als Leiste auf iPad und Mac.
  function buildRail() {
    const rail = $("#rail");
    if (!rail) return;
    rail.innerHTML = "";
    const mk = (cls, icon, label, fn, opt) => {
      opt = opt || {};
      const b = el(`<button type="button" class="rail-btn${cls ? " " + cls : ""}"${opt.id ? ` id="${opt.id}"` : ""}${opt.ansicht ? ` data-id="${opt.ansicht}"` : ""} title="${esc(opt.titel || label)}">
        ${svg(icon)}<span class="tip">${esc(label)}</span></button>`);
      b.onclick = fn;
      rail.appendChild(b);
      return b;
    };
    const neu = (label) => mk("rail-add", "plus", label,
      (e) => { e.stopPropagation(); openAnlegenMenu(e.currentTarget); }, { id: "railAdd", titel: "Neu anlegen" });
    const profil = () => mk("profile", "user", "Profil", () => openProfilSheet(), { id: "profileBtn" });
    if (istHandy()) {
      // Fünf Einträge, „Neu“ in der Mitte. Abmelden steht im Profil.
      mk("", "grid", "Übersicht", () => geheZu("overview"), { ansicht: "overview" });
      mk("", "home", "Objekte", (e) => { e.stopPropagation(); openObjekteMenu(e.currentTarget); }, { ansicht: "vermietung" });
      neu("Neu");
      mk("", "chart", "Tools", () => geheZu("tools"), { ansicht: "tools" });
      profil();
    } else {
      rail.appendChild(el(`<div class="rail-mark"><span class="eq-logo" role="img" aria-label="ESTRIQ"></span></div>`));
      neu(navForm() === "breit" ? "Neu anlegen" : "Neu");
      navItems().forEach(it => mk("", it.icon, it.label, (e) => {
        if (it.group) { e.stopPropagation(); openSubmenu(e.currentTarget); }
        else geheZu(it.id);
      }, { ansicht: it.id }));
      rail.appendChild(el(`<div class="rail-spacer"></div>`));
      profil();
      mk("logout", "logout", "Abmelden", () => logout(), { id: "logoutBtn" });
    }
    railMarkieren(currentView);
  }
  // Antippen in der Navigation: Ansicht zeigen und oben beginnen – auch wenn man schon dort ist
  function geheZu(id) {
    route(id);
    const sc = $(".scroll"); if (sc) sc.scrollTop = 0;
  }
  // Zeigt in der Navigation, wo man gerade ist
  function railMarkieren(id) {
    const isMiete = mietStreams().some(s => s.id === id) || id === "vermietung";
    $$("#rail .rail-btn").forEach(b => {
      const d = b.dataset.id;
      const an = !!d && (d === id || (d === "vermietung" && isMiete));
      b.classList.toggle("on", an);
      if (an) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
  }

  // Objekte-Menü: die Sammelübersicht und jedes Objekt mit seinem Stand.
  // Am Handy als Blatt von unten, auf iPad und Mac neben der Leiste – derselbe Inhalt.
  function openObjekteMenu(anchor) {
    closeSubmenu();
    const streams = mietStreams();
    const inhalt = streams.map(s => {
      const m = FE.streamMonthly(s);
      const offen = vermietungsStand([s]).offen.length;
      const on = currentView === s.id;
      const stand = m.vermietet + " von " + m.einheiten + " vermietet" + (offen ? " · " + mehrzahl(offen, "Miete", "Mieten") + " offen" : "");
      return `<div class="sub-item${on ? " on" : ""}" data-id="${s.id}">
        <div class="sub-ic">${svg(s.icon || "home")}</div>
        <div class="sub-tx"><div class="sub-n">${esc(s.name)}</div>
          <div class="sub-m">${esc(stand)}</div></div>
        <div class="sub-v">${eur(m.gesamt)}<span>im Monat</span></div></div>`;
    }).join("");
    const bd = el(`<div class="sub-bd"></div>`);
    const menu = el(`<div class="submenu obj-menu">
      <div class="submenu-t">Vermietung</div>
      <div class="sub-item${currentView === "vermietung" ? " on" : ""}" data-id="vermietung">
        <div class="sub-ic">${svg("layers")}</div>
        <div class="sub-tx"><div class="sub-n">Alle Mietobjekte</div>
          <div class="sub-m">${streams.length ? mehrzahl(streams.length, "Objekt", "Objekte") + " im Bestand" : "Übersicht"}</div></div></div>
      ${inhalt || `<div class="sub-empty">Noch kein Objekt angelegt. Über „Neu“ legst du das erste an.</div>`}
    </div>`);
    document.body.appendChild(bd); document.body.appendChild(menu);
    positioniereSubmenu(anchor, menu);
    menu.querySelectorAll(".sub-item[data-id]").forEach(it =>
      it.onclick = () => { const id = it.dataset.id; closeSubmenu(); geheZu(id); });
    bd.onclick = closeSubmenu;
  }

  /* ---------- ANLEGEN (zentrales +) ---------- */
  function openAnlegenMenu(anchor) {
    closeSubmenu();
    const bd = el(`<div class="sub-bd"></div>`);
    const menu = el(`<div class="submenu anlegen-menu">
      <div class="submenu-t">Neu anlegen</div>
      <div class="sub-item anlegen-item" data-neu="objekt">
        <div class="sub-ic">${svg("home")}</div>
        <div class="sub-tx"><div class="sub-n">Mietobjekt</div>
          <div class="sub-m">Wohnung oder Haus mit Mietern</div></div>
        <div class="sub-v">${svg("plus")}</div></div>
      <div class="anlegen-sep"></div>
      <div class="sub-item anlegen-item" data-neu="termin">
        <div class="sub-ic">${svg("calendar")}</div>
        <div class="sub-tx"><div class="sub-n">Termin</div>
          <div class="sub-m">Frist, Zahlung oder Notiz</div></div>
        <div class="sub-v">${svg("plus")}</div></div>
    </div>`);
    document.body.appendChild(bd); document.body.appendChild(menu);
    positioniereSubmenu(anchor, menu);

    const schliessenUndTun = (fn) => { closeSubmenu(); fn(); };
    const o = menu.querySelector('[data-neu="objekt"]');
    if (o) o.onclick = () => {
      if (!pruefeObjekt()) { closeSubmenu(); return; }
      schliessenUndTun(() => assistentObjekt());
    };
    const t = menu.querySelector('[data-neu="termin"]');
    if (t) t.onclick = () => schliessenUndTun(() => openTerminEdit(null, true));
    bd.onclick = closeSubmenu;
  }

  // Auf iPad und Mac neben der Leiste, am Handy als Blatt von unten (per CSS)
  function positioniereSubmenu(anchor, menu) {
    const bd = menu.previousElementSibling;
    if (!istHandy()) {
      const r = anchor.getBoundingClientRect();
      const leiste = $("#rail") ? $("#rail").getBoundingClientRect().right : 0;
      const b = menu.offsetWidth, h = menu.offsetHeight;
      menu.style.left = Math.max(12, Math.min(Math.max(r.right + 10, leiste + 8), window.innerWidth - b - 12)) + "px";
      menu.style.top = Math.max(12, Math.min(r.top, window.innerHeight - h - 12)) + "px";
    }
    if (bd && bd.classList.contains("sub-bd")) bd.classList.add("on");
    menu.classList.add("on");
    menu.setAttribute("role", "menu");
    // Einträge mit Tabulator erreichbar, Enter oder Leertaste wählt
    menu.querySelectorAll(".sub-item").forEach(it => {
      it.setAttribute("role", "menuitem");
      it.setAttribute("tabindex", "0");
      it.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); it.click(); } });
    });
    if (feinerZeiger()) {
      menu._zurueck = anchor;
      const erster = menu.querySelector(".sub-item.on") || menu.querySelector(".sub-item");
      if (erster) { try { erster.focus({ preventScroll: true }); } catch (_) {} }
    }
    document.addEventListener("keydown", subEsc);
  }

  // Leiste auf iPad und Mac: dasselbe Menü wie am Handy
  function openSubmenu(anchor) { openObjekteMenu(anchor); }
  function subEsc(e) { if (e.key === "Escape") closeSubmenu(); }
  function closeSubmenu() {
    document.removeEventListener("keydown", subEsc);
    $$(".sub-bd, .submenu").forEach(n => {
      n.classList.remove("on");
      n.classList.add("eq-zu");
      setTimeout(() => n.remove(), 200);
      const z = n._zurueck;
      if (z && z.focus && document.contains(z) && n.contains(document.activeElement)) { try { z.focus({ preventScroll: true }); } catch (_) {} }
    });
  }

  let currentView = "overview";
  let gezeigteAnsicht = null;   // was gerade gezeichnet ist (currentView kann vorab umgestellt sein, etwa beim Löschen)
  function route(id) {
    const host = $("#views");
    // Eine neue Ansicht blendet sanft ein und beginnt oben. Werden nur die Daten derselben
    // Ansicht neu gezeichnet (nach dem Speichern), bewegt sich nichts und die Stelle bleibt.
    const wechsel = id !== gezeigteAnsicht || !host.childElementCount;
    if (wechsel) frischEingegangen.clear();
    gezeigteAnsicht = id;
    currentView = id;
    railMarkieren(id);
    host.classList.toggle("eq-neu", wechsel);
    host.innerHTML = "";
    if (id === "overview") renderOverview(host);
    else if (id === "vermietung") renderVermietung(host);
    else if (id === "tools") renderTools(host);
    else renderStream(host, id);
    if (wechsel) $(".scroll").scrollTop = 0;
  }

  /* ---------- shared bits ---------- */

  /* ================= NEBENKOSTENABRECHNUNG ================= */

  // Verteilerschlüssel nach Betriebskostenverordnung
  const NK_SCHLUESSEL = {
    flaeche:   { name: "Wohnfläche", kurz: "m²", info: "Standard – nach Quadratmetern" },
    einheiten: { name: "Einheiten", kurz: "je Einheit", info: "Gleicher Anteil für jede Wohnung" },
    personen:  { name: "Personen", kurz: "je Person", info: "Nach Kopfzahl im Haushalt" },
    verbrauch: { name: "Verbrauch", kurz: "erfasst", info: "Nach Zähler – hier nicht automatisch verteilt" }
  };

  // Typische Kostenarten als Vorlage (Betriebskostenverordnung)
  const NK_VORLAGE = [
    { art: "Grundsteuer", schluessel: "flaeche" },
    { art: "Gebäudeversicherung", schluessel: "flaeche" },
    { art: "Wasser und Abwasser", schluessel: "personen" },
    { art: "Heizung und Warmwasser", schluessel: "verbrauch" },
    { art: "Müllabfuhr", schluessel: "personen" },
    { art: "Straßenreinigung", schluessel: "flaeche" },
    { art: "Gebäudereinigung", schluessel: "flaeche" },
    { art: "Gartenpflege", schluessel: "flaeche" },
    { art: "Allgemeinstrom", schluessel: "flaeche" },
    { art: "Schornsteinfeger", schluessel: "flaeche" },
    { art: "Hauswart", schluessel: "flaeche" },
    { art: "Aufzug", schluessel: "einheiten" }
  ];

  let nkCache = {};   // { "objektId:jahr": [posten] }

  async function ladeNebenkosten(objektId, jahr) {
    const key = objektId + ":" + jahr;
    try {
      const { data, error } = await window.sb.from("nebenkosten")
        .select("*").eq("objekt_id", objektId).eq("jahr", jahr).order("art");
      if (error) { console.error("Nebenkosten:", error.message || error); return []; }
      nkCache[key] = data || [];
      return nkCache[key];
    } catch (e) { console.error("Nebenkosten:", e); return []; }
  }

  // Rechnet die Anteile je Einheit aus
  function nkVerteilung(s, posten) {
    const einheiten = (s.einheiten || []);
    const flaecheGes = einheiten.reduce((a, u) => a + (Number(u.flaeche) || 0), 0);
    const personenGes = einheiten.reduce((a, u) => a + (Number(u.personen) || 1), 0);
    const anzahl = einheiten.length || 1;

    const umlagefaehig = posten.filter(p => p.umlagefaehig !== false);
    const nichtUmlage = posten.filter(p => p.umlagefaehig === false);
    const summeUml = umlagefaehig.reduce((a, p) => a + (Number(p.betrag) || 0), 0);
    const summeNicht = nichtUmlage.reduce((a, p) => a + (Number(p.betrag) || 0), 0);

    const zeilen = einheiten.map(u => {
      const flaeche = Number(u.flaeche) || 0;
      const personen = Number(u.personen) || 1;
      let anteil = 0;
      const detail = [];
      umlagefaehig.forEach(p => {
        const b = Number(p.betrag) || 0;
        let x = 0;
        if (p.schluessel === "einheiten") x = b / anzahl;
        else if (p.schluessel === "personen") x = personenGes ? b * personen / personenGes : 0;
        else if (p.schluessel === "verbrauch") x = flaecheGes ? b * flaeche / flaecheGes : 0; // ersatzweise nach Fläche
        else x = flaecheGes ? b * flaeche / flaecheGes : 0;
        anteil += x;
        detail.push({ art: p.art, betrag: x, schluessel: p.schluessel });
      });
      const inc = FE.unitIncome(u);
      const voraus = (Number(inc.nk) || 0) * 12;
      return { u, anteil, voraus, saldo: voraus - anteil, detail };
    });

    return {
      zeilen, summeUml, summeNicht, flaecheGes, personenGes, anzahl,
      vorausGes: zeilen.reduce((a, z) => a + z.voraus, 0),
      saldoGes: zeilen.reduce((a, z) => a + z.saldo, 0),
      hatVerbrauch: umlagefaehig.some(p => p.schluessel === "verbrauch")
    };
  }

  // Ruhige Vorschau eines Premium-Moduls für den Basic-Tarif
  function modulVorschau(id) {
    const m = PREMIUM_MODULE[id];
    const karte = el(`<div class="card pad modul-sperre">
      <div class="ms-kopf">
        <div class="tile-ic">${svg(m.icon)}</div>
        <div class="ms-tx">
          <div class="card-t">${esc(m.name)} <span class="lock-badge">Premium</span></div>
          <div class="card-s">${esc(m.nutzen)}</div>
        </div>
      </div>
      <button class="add-btn wide ms-frei">Mit Premium freischalten</button>
    </div>`);
    karte.querySelector(".ms-frei").onclick = () => pruefeModul(id);
    return karte;
  }
  const NUR_LESEN = "Im Basic-Tarif kannst du diese Daten ansehen. Zum Bearbeiten brauchst du Premium.";

  // Basic: Vorschau. Gibt es schon Abrechnungsdaten (etwa aus der Testphase), bleiben sie lesbar.
  function nebenkostenGesperrt(s) {
    const karte = modulVorschau("nebenkosten");
    (async () => {
      try {
        const { data, error } = await window.sb.from("nebenkosten").select("jahr").eq("objekt_id", s._id);
        if (error || !data || !data.length) return;
        const jahr = Math.max(...data.map(x => Number(x.jahr) || 0));
        const b = el(`<button class="add-btn wide ms-lesen">Vorhandene Abrechnung ${jahr} ansehen</button>`);
        b.onclick = () => openNkAbrechnung(s, jahr);
        karte.appendChild(b);
      } catch (_) {}
    })();
    return karte;
  }

  // Karte in der Objektansicht
  function nebenkostenKarte(s) {
    if (!hatModul()) return nebenkostenGesperrt(s);
    const jahr = new Date().getFullYear() - 1;   // Abrechnung betrifft das Vorjahr
    const karte = el(`<div class="card nk-card">
      <div class="card-h">
        <div><div class="card-t">Nebenkostenabrechnung</div>
          <div class="card-s">Kostenarten erfassen und auf die Mieter verteilen</div></div>
        <button class="add-btn" id="nkOeffnen">Öffnen</button>
      </div>
      <div class="card-b"><div class="note" id="nkVorschau">Wird geladen…</div></div></div>`);
    karte.querySelector("#nkOeffnen").onclick = () => openNkAbrechnung(s, jahr);
    karte.onclick = (e) => { if (!e.target.closest("button")) openNkAbrechnung(s, jahr); };
    karte.classList.add("clickable");

    ladeNebenkosten(s._id, jahr).then(posten => {
      const v = karte.querySelector("#nkVorschau");
      if (!v) return;
      if (!posten.length) {
        v.innerHTML = `Für ${jahr} sind noch keine Kostenarten erfasst. Öffne die Abrechnung und übernimm die Vorlage nach Betriebskostenverordnung.`;
        return;
      }
      const r = nkVerteilung(s, posten);
      v.outerHTML = `
        <div class="gw-kacheln drei">
          <div class="gw-kachel"><span>Umlagefähig ${jahr}</span><b>${eur(r.summeUml)}</b></div>
          <div class="gw-kachel"><span>Vorauszahlungen</span><b>${eur(r.vorausGes)}</b></div>
          <div class="gw-kachel"><span>${r.saldoGes >= 0 ? "Guthaben Mieter" : "Nachzahlung"}</span>
            <b class="${r.saldoGes >= 0 ? "gut" : "warn"}">${eur(Math.abs(r.saldoGes))}</b></div>
        </div>
        <div class="note">${posten.length} Kostenarten erfasst${r.summeNicht > 0 ? ` · ${eur(r.summeNicht)} davon nicht umlagefähig` : ""}.</div>`;
    });
    return karte;
  }

  // Die eigentliche Abrechnung
  function openNkAbrechnung(s, jahr) {
    const sheet = openSheet("Nebenkostenabrechnung", s.name, `<div id="nkBody"><div class="note">Wird geladen…</div></div>`);
    const body = sheet.querySelector("#nkBody");

    async function zeichne() {
      const posten = await ladeNebenkosten(s._id, jahr);
      const r = nkVerteilung(s, posten);

      const liste = posten.length ? posten.map(p => {
        const sch = NK_SCHLUESSEL[p.schluessel] || NK_SCHLUESSEL.flaeche;
        return `<div class="nk-p${p.umlagefaehig === false ? " nicht" : ""}" data-p="${p.id}">
          <div class="nk-p-tx"><div class="nk-p-n">${esc(p.art)}</div>
            <div class="nk-p-m">${esc(sch.name)}${p.umlagefaehig === false ? " · nicht umlagefähig" : ""}</div></div>
          <b>${eur(Number(p.betrag) || 0)}</b></div>`;
      }).join("") : `<div class="note">Noch keine Kostenart erfasst.</div>`;

      const tabelle = r.zeilen.length ? `
        <div class="nk-tab">
          <div class="nk-t-kopf"><div>Einheit</div><div class="nk-c">Anteil</div>
            <div class="nk-c">Vorauszahlung</div><div class="nk-c">Saldo</div></div>
          ${r.zeilen.map((z, i) => `
            <div class="nk-t-row" data-einheit="${i}">
              <div class="nk-t-n">${esc(z.u.wohnung || "Einheit")}<small>${(Number(z.u.flaeche) || 0)} m²${z.u.mieter ? " · " + esc(z.u.mieter) : ""}</small></div>
              <div class="nk-c">${eur(z.anteil)}</div>
              <div class="nk-c dim">${eur(z.voraus)}</div>
              <div class="nk-c stark ${z.saldo >= 0 ? "gut" : "warn"}">${z.saldo >= 0 ? "+" : "−"}${eur(Math.abs(z.saldo))}</div>
            </div>`).join("")}
        </div>
        <div class="note" style="margin-top:10px">Plus bedeutet Guthaben für den Mieter, Minus eine Nachzahlung an dich.</div>`
        : `<div class="note">Dieses Objekt hat noch keine Wohneinheiten.</div>`;

      body.innerHTML = `
        <div class="nk-jahr">
          <button class="cal-btn" id="nkPrev">‹</button>
          <span>Abrechnungsjahr <b>${jahr}</b></span>
          <button class="cal-btn" id="nkNext">›</button>
        </div>
        <div class="gw-kacheln vier">
          <div class="gw-kachel"><span>Umlagefähig</span><b>${eur(r.summeUml)}</b></div>
          <div class="gw-kachel"><span>Nicht umlagefähig</span><b>${eur(r.summeNicht)}</b></div>
          <div class="gw-kachel"><span>Vorauszahlungen</span><b>${eur(r.vorausGes)}</b></div>
          <div class="gw-kachel"><span>${r.saldoGes >= 0 ? "Guthaben" : "Nachzahlung"}</span>
            <b class="${r.saldoGes >= 0 ? "gut" : "warn"}">${eur(Math.abs(r.saldoGes))}</b></div>
        </div>
        ${hatModul() ? "" : `<div class="gw-hinweis">${NUR_LESEN}</div>`}
        ${r.hatVerbrauch ? `<div class="gw-hinweis">Heizung und Warmwasser werden hier ersatzweise nach Fläche verteilt. Die Heizkostenverordnung verlangt eine verbrauchsabhängige Abrechnung — nimm dafür die Werte deines Ablesedienstes.</div>` : ""}
        ${efTitel("Kostenarten " + jahr)}
        <div class="nk-liste">${liste}</div>
        <div class="nk-btns">
          <button class="add-btn" id="nkAdd">+ Kostenart</button>
          ${posten.length ? "" : `<button class="add-btn" id="nkVorlage">Vorlage übernehmen</button>`}
        </div>
        ${efTitel("Verteilung auf die Mieter")}
        ${tabelle}
        <div class="wi-hinweis">Die Abrechnung muss dem Mieter innerhalb von zwölf Monaten nach Ende des Abrechnungszeitraums zugehen. Orientierung, keine Rechtsberatung.</div>`;

      body.querySelector("#nkPrev").onclick = () => { jahr--; zeichne(); };
      body.querySelector("#nkNext").onclick = () => { jahr++; zeichne(); };
      body.querySelector("#nkAdd").onclick = () => openNkPosten(s, jahr, null, zeichne);
      const vb = body.querySelector("#nkVorlage");
      if (vb) vb.onclick = async () => {
        if (!pruefeModul("nebenkosten")) return;
        vb.disabled = true; vb.textContent = "Wird angelegt…";
        try {
          const rows = NK_VORLAGE.map(v => ({ objekt_id: s._id, jahr, art: v.art, betrag: 0,
            schluessel: v.schluessel, umlagefaehig: true }));
          const { error } = await window.sb.from("nebenkosten").insert(rows);
          if (error) throw error;
          await zeichne();
          showToast("Vorlage übernommen – jetzt die Beträge eintragen.");
        } catch (e) { vb.disabled = false; vb.textContent = "Vorlage übernehmen"; showToast(window.fehlerText(e)); }
      };
      body.querySelectorAll("[data-p]").forEach(n => n.onclick = () => {
        openNkPosten(s, jahr, posten.find(x => x.id === n.dataset.p), zeichne);
      });
      body.querySelectorAll("[data-einheit]").forEach(n => n.onclick = () => {
        openNkEinheit(r.zeilen[Number(n.dataset.einheit)], jahr);
      });
    }
    zeichne();
  }

  // Eine Kostenart anlegen oder bearbeiten
  function openNkPosten(s, jahr, p, fertig) {
    if (!pruefeModul("nebenkosten")) return;
    const body = `
      ${ef("Kostenart", "art", p ? p.art : "", "text", { pflicht: true, platzhalter: "z. B. Grundsteuer" })}
      ${ef("Betrag im Jahr", "betrag", p ? (p.betrag ?? "") : "", "number",
        { pflicht: true, minus: true, hinweis: "Gesamtbetrag für " + jahr })}
      ${efSel("Verteilerschlüssel", "schluessel", p ? p.schluessel : "flaeche",
        Object.keys(NK_SCHLUESSEL).map(k => ({ v: k, t: NK_SCHLUESSEL[k].name + " – " + NK_SCHLUESSEL[k].info })))}
      ${efSel("Umlagefähig", "umlagefaehig", p && p.umlagefaehig === false ? "0" : "1",
        [{ v: "1", t: "ja – wird auf Mieter verteilt" }, { v: "0", t: "nein – trägst du selbst" }],
        { hinweis: "Instandhaltung, Verwaltung und Rücklagen sind nicht umlagefähig." })}
      ${efArea("Notiz", "notiz", p ? (p.notiz || "") : "")}
      ${efAktionen({ loeschen: p ? "Löschen" : null })}`;
    const sheet = openSheet(p ? "Kostenart bearbeiten" : "Kostenart erfassen", jahr + " · " + s.name, body);
    const bauen = (w) => ({
      art: text(w.art) || "Kostenart",
      betrag: zahl(w.betrag) || 0,
      schluessel: w.schluessel,
      umlagefaehig: w.umlagefaehig === "1",
      notiz: text(w.notiz)
    });
    // Eigene Speicherlogik – das Sheet danach neu zeichnen
    const msg = () => sheet.querySelector("#efMsg");
    sheet.querySelector("#efSave").onclick = async () => {
      const m = msg(); m.textContent = "Speichere…"; m.className = "ef-msg";
      try {
        const w = bauen(efWerte(sheet));
        const { error } = p
          ? await window.sb.from("nebenkosten").update(w).eq("id", p.id)
          : await window.sb.from("nebenkosten").insert({ ...w, objekt_id: s._id, jahr });
        if (error) throw error;
        closeSheet();
        setTimeout(() => { openNkAbrechnung(s, jahr); }, 260);
      } catch (e) { m.textContent = window.fehlerText(e); m.className = "ef-msg bad"; }
    };
    const del = sheet.querySelector("#efDel");
    if (del && p) del.onclick = async () => {
      if (del.dataset.sicher !== "1") {
        del.dataset.sicher = "1"; del.textContent = "Wirklich löschen?"; del.classList.add("armed");
        setTimeout(() => { if (del.dataset.sicher === "1") { del.dataset.sicher = ""; del.textContent = "Löschen"; del.classList.remove("armed"); } }, 4000);
        return;
      }
      try {
        const { error } = await window.sb.from("nebenkosten").delete().eq("id", p.id);
        if (error) throw error;
        closeSheet();
        setTimeout(() => { openNkAbrechnung(s, jahr); }, 260);
      } catch (e) { const m = msg(); m.textContent = window.fehlerText(e); m.className = "ef-msg bad"; }
    };
  }

  // Einzelabrechnung für eine Wohnung – das, was der Mieter bekommt
  function openNkEinheit(z, jahr) {
    const body = `
      <div class="nk-erg ${z.saldo >= 0 ? "gut" : "warn"}">
        <div class="nk-erg-z">${z.saldo >= 0 ? "+" : "−"}${eur(Math.abs(z.saldo))}</div>
        <div class="nk-erg-t">${z.saldo >= 0 ? "Guthaben für den Mieter" : "Nachzahlung an dich"}</div>
      </div>
      ${efTitel("Aufteilung der Kosten")}
      <div class="nk-liste">
        ${z.detail.map(d => `<div class="nk-p">
          <div class="nk-p-tx"><div class="nk-p-n">${esc(d.art)}</div>
            <div class="nk-p-m">verteilt nach ${esc((NK_SCHLUESSEL[d.schluessel] || NK_SCHLUESSEL.flaeche).name)}</div></div>
          <b>${eur(d.betrag)}</b></div>`).join("")}
      </div>
      <div class="rc-zeilen">
        <div class="rc-z gross"><span>Anteil gesamt</span><b>${eur(z.anteil)}</b></div>
        <div class="rc-z"><span>− Vorauszahlungen ${jahr}</span><b>− ${eur(z.voraus)}</b></div>
        <div class="rc-z gross"><span>${z.saldo >= 0 ? "Guthaben" : "Nachzahlung"}</span><b>${eur(Math.abs(z.saldo))}</b></div>
      </div>
      <div class="wi-hinweis">Die Vorauszahlung ergibt sich aus den bei der Einheit hinterlegten monatlichen Nebenkosten × 12.</div>`;
    openSheet(z.u.wohnung || "Einheit", (z.u.mieter || "ohne Mieter") + " · " + jahr, body);
  }

  /* ================= GEWERKE & KOSTENKONTROLLE ================= */

  // Alle Gewerke eines Objekts: Angebot, Zahlungen, Baufortschritt und Abweichung
  function gewerkeVon(s) {
    const alle = (D.gewerke || []).filter(g => g.objekt_id === s._id);
    return alle.map(g => {
      const rn = (D.rechnungen || []).filter(r => r.gewerk_id === g.id)
        .sort((a, b) => String(a.datum || "").localeCompare(String(b.datum || "")));
      // Gezahlt = tatsächlich beglichene Rechnungen; gestellt = alles inkl. offener
      const gezahlt  = rn.filter(r => r.bezahlt).reduce((a, r) => a + (Number(r.betrag) || 0), 0);
      const gestellt = rn.reduce((a, r) => a + (Number(r.betrag) || 0), 0);
      const soll = Number(g.angebot) || 0;
      const fortschritt = Math.max(0, Math.min(100, Number(g.fortschritt) || 0));
      const quote = soll ? gezahlt / soll * 100 : 0;
      // Freigegeben: so viel darf nach Baufortschritt bezahlt sein
      const freigegeben = soll * fortschritt / 100;
      const vorleistung = Math.max(0, gezahlt - freigegeben);   // mehr gezahlt als gebaut
      return {
        ...g, rechnungen: rn,
        soll, gezahlt, gestellt,
        offenRn: gestellt - gezahlt,              // gestellt, aber noch nicht bezahlt
        restBudget: Math.max(0, soll - gestellt), // vom Angebot noch nicht abgerechnet
        fortschritt, quote, freigegeben, vorleistung,
        punkte: quote - fortschritt,              // Prozentpunkte Abweichung
        diff: gestellt - soll,
        prozent: soll ? (gestellt - soll) / soll * 100 : (gestellt ? 100 : 0)
      };
    });
  }

  // Ampel nach Abweichung in Prozentpunkten (Zahlungsquote gegen Baufortschritt)
  function ampel(punkte, hatZahlung) {
    if (!hatZahlung) return "neutral";
    if (punkte > 15) return "ueber";      // deutlich mehr gezahlt als gebaut
    if (punkte > 5)  return "achtung";
    return "gut";
  }
  function abwKlasse(p, hatIst) {
    if (!hatIst) return "neutral";
    if (p > 5) return "ueber";
    if (p < -5) return "unter";
    return "punkt";
  }

  const proz = (v) => (Number(v) || 0).toFixed(0) + " %";

  function gewerkeKarte(s) {
    const frei = hatModul();
    const gw = gewerkeVon(s);
    if (!gw.length) {
      if (!frei) return modulVorschau("gewerke");
      const leer = el(`<div class="card">
        <div class="card-h"><div><div class="card-t">Gewerke &amp; Kosten</div>
          <div class="card-s">Zahlung gegen Baufortschritt</div></div>
          <button class="add-btn" id="addGewerk">+ Gewerk</button></div>
        <div class="card-b"><div class="note">Noch keine Gewerke erfasst. Leg den ersten Handwerker an — ESTRIQ stellt dann Angebot, Zahlungen und Baufortschritt gegenüber.</div></div></div>`);
      leer.querySelector("#addGewerk").onclick = () => openGewerkEdit(s, null, true);
      return leer;
    }

    const soll = gw.reduce((a, g) => a + g.soll, 0);
    const gezahlt = gw.reduce((a, g) => a + g.gezahlt, 0);
    const vorleistung = gw.reduce((a, g) => a + g.vorleistung, 0);
    // Ø Fortschritt nach Auftragswert gewichtet – große Gewerke zählen stärker
    const fortschritt = soll ? gw.reduce((a, g) => a + g.soll * g.fortschritt, 0) / soll : 0;
    const quote = soll ? gezahlt / soll * 100 : 0;
    const kritisch = gw.filter(g => ampel(g.punkte, g.gezahlt > 0) === "ueber");

    const zeilen = gw.map(g => {
      const kl = ampel(g.punkte, g.gezahlt > 0);
      return `<div class="gwt-row ${kl}" data-gewerk="${g.id}">
        <div class="gwt-n">${esc(g.name)}<small>${esc(g.gewerk || "Gewerk")}</small></div>
        <div class="gwt-c">${eur(g.soll)}</div>
        <div class="gwt-c stark ${kl}">${eur(g.gezahlt)}</div>
        <div class="gwt-c stark ${kl}">${proz(g.quote)}</div>
        <div class="gwt-c dim">${proz(g.fortschritt)}</div>
      </div>`;
    }).join("");

    const karte = el(`<div class="card">
      <div class="card-h">
        <div><div class="card-t">Zahlung gegen Fortschritt${frei ? "" : ' <span class="lock-badge">Premium</span>'}</div>
          <div class="card-s">${gw.length} ${gw.length === 1 ? "Gewerk" : "Gewerke"} · Quote gegen Baufortschritt</div></div>
        <button class="add-btn" id="addGewerk">${frei ? "+ Gewerk" : "Freischalten"}</button>
      </div>
      <div class="card-b">
        ${frei ? "" : `<div class="gw-hinweis" style="margin:0 0 12px">${NUR_LESEN}</div>`}
        <div class="gwt">
          <div class="gwt-kopf">
            <div>Gewerk</div><div class="gwt-c">Angebot</div><div class="gwt-c">Gezahlt</div>
            <div class="gwt-c">Quote</div><div class="gwt-c">Gebaut</div>
          </div>
          ${zeilen}
        </div>
        <div class="gw-kacheln">
          <div class="gw-kachel"><span>Angebotssumme</span><b>${eur(soll)}</b></div>
          <div class="gw-kachel"><span>Gezahlt</span><b class="${quote > fortschritt + 15 ? "warn" : ""}">${eur(gezahlt)}</b></div>
          <div class="gw-kachel"><span>Ø Fortschritt</span><b>${proz(fortschritt)}</b></div>
          <div class="gw-kachel"><span>In Vorleistung</span><b class="${vorleistung > 0 ? "warn" : "gut"}">${eur(vorleistung)}</b></div>
        </div>
        ${vorleistung > 0
          ? `<div class="gw-hinweis warn">Auffällig: Zahlungsquote liegt über dem Baufortschritt — ${eur(vorleistung)} sind vorausgezahlt.${kritisch.length ? " Betroffen: " + kritisch.map(g => esc(g.name)).join(", ") + "." : ""} Abschläge und offene Posten prüfen.</div>`
          : `<div class="gw-hinweis gut">Zahlungen decken sich mit dem Baufortschritt. Keine Vorleistung.</div>`}
      </div></div>`);
    karte.querySelector("#addGewerk").onclick = () => openGewerkEdit(s, null, true);
    karte.querySelectorAll("[data-gewerk]").forEach(n =>
      n.onclick = () => openGewerkDetail(s, n.dataset.gewerk));
    return karte;
  }

  // Ein Gewerk im Detail: Angebot, Zahlungen, Baufortschritt, alle Rechnungen
  function openGewerkDetail(s, id) {
    const g = gewerkeVon(s).find(x => x.id === id);
    if (!g) return;
    const kl = ampel(g.punkte, g.gezahlt > 0);
    const pkt = Math.round(g.punkte);

    const rechnungen = g.rechnungen.length
      ? `<div class="gwr">
          <div class="gwr-kopf"><div>Beleg</div><div>Datum</div><div class="gwr-c">Betrag</div><div class="gwr-s">Status</div></div>
          ${g.rechnungen.map(r => `
            <div class="gwr-row" data-rechnung="${r.id}">
              <div class="gwr-b">${esc(r.beleg || r.bezeichnung || "Rechnung")}</div>
              <div class="gwr-d">${r.datum ? new Date(r.datum).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) + "." : "—"}</div>
              <div class="gwr-c">${eur(Number(r.betrag) || 0)}</div>
              <div class="gwr-s"><span class="gwr-tag ${r.bezahlt ? "ok" : "offen"}">${r.bezahlt ? "bezahlt" : "offen"}</span></div>
            </div>`).join("")}
        </div>`
      : `<div class="note">Noch keine Rechnung erfasst.</div>`;

    // Nächste Schritte aus den Daten ableiten
    const schritte = [];
    if (g.fortschritt < 100) schritte.push({ ok: true, t: "Teilabnahme dokumentieren, bevor der nächste Abschlag freigegeben wird" });
    const offeneRn = g.rechnungen.filter(r => !r.bezahlt);
    if (offeneRn.length) schritte.push({
      ok: g.vorleistung <= 0,
      t: (offeneRn[0].beleg ? "Abschlag " + offeneRn[0].beleg : "Offenen Abschlag")
         + (g.vorleistung > 0 ? " erst nach weiterem Baufortschritt freigeben" : " kann freigegeben werden")
    });
    if (pkt > 15) schritte.push({ ok: false, t: g.name + ": Abweichung " + pkt + " Punkte — Rückfrage beim Handwerker offen" });
    schritte.push({ ok: true, t: "Schlusszahlung an das Abnahmeprotokoll binden" });

    const body = `
      <div class="gw-kacheln vier">
        <div class="gw-kachel"><span>Angebot</span><b>${eur(g.soll)}</b></div>
        <div class="gw-kachel"><span>Gezahlt</span><b class="${kl === "ueber" ? "warn" : ""}">${eur(g.gezahlt)}</b></div>
        <div class="gw-kachel"><span>Offen</span><b>${eur(g.restBudget + g.offenRn)}</b></div>
        <div class="gw-kachel"><span>Fortschritt</span><b>${proz(g.fortschritt)}</b></div>
      </div>

      <div class="gw-bar-blk">
        <div class="gw-bar-top"><span>Zahlungen</span>
          <b class="${kl === "ueber" ? "warn" : "gut"}">${proz(g.quote)} · ${eur(g.gezahlt)}</b></div>
        <div class="gw-bar"><i class="${kl}" style="width:${Math.min(100, g.quote).toFixed(1)}%"></i></div>
      </div>
      <div class="gw-bar-blk">
        <div class="gw-bar-top"><span>Baufortschritt</span><b>${proz(g.fortschritt)}</b></div>
        <div class="gw-bar"><i class="bau" style="width:${g.fortschritt}%"></i></div>
      </div>

      ${g.gezahlt > 0 && pkt > 5
        ? `<div class="gw-hinweis warn">${pkt} Punkte Abweichung — anteilig mehr gezahlt als gebaut. ${eur(g.vorleistung)} sind vorausgezahlt.</div>`
        : g.gezahlt > 0 && pkt < -5
          ? `<div class="gw-hinweis gut">${Math.abs(pkt)} Punkte Puffer — es ist weniger gezahlt als gebaut.</div>`
          : g.gezahlt > 0
            ? `<div class="gw-hinweis gut">Zahlung und Baufortschritt laufen im Gleichschritt.</div>`
            : `<div class="gw-hinweis">Noch keine Zahlung geleistet.</div>`}

      ${efTitel("Zahlungsfreigabe")}
      <div class="gw-kacheln drei">
        <div class="gw-kachel"><span>Freigegeben</span><b class="gut">${eur(g.freigegeben)}</b></div>
        <div class="gw-kachel"><span>Gesperrt</span><b class="${g.vorleistung > 0 ? "warn" : ""}">${eur(g.vorleistung)}</b></div>
        <div class="gw-kachel"><span>Fortschritt</span><b>${proz(g.fortschritt)}</b></div>
      </div>
      <div class="gw-schritte">
        ${schritte.map(x => `<div class="gw-schritt ${x.ok ? "ok" : "warn"}">
          <i>${x.ok ? "✓" : "!"}</i><span>${esc(x.t)}</span></div>`).join("")}
      </div>
      ${g.vorleistung > 0 ? `<div class="gw-hinweis gut" style="margin-top:10px">Sobald die Zahlungsquote wieder unter dem Fortschritt liegt, verschwindet die Warnung.</div>` : ""}

      ${g.notiz ? `<div class="note" style="margin-top:14px">${esc(g.notiz)}</div>` : ""}
      ${efTitel("Rechnungen")}
      ${rechnungen}
      <button class="add-btn" id="addRn" style="margin-top:12px;width:100%">+ Rechnung erfassen</button>
      <div class="ef-actions" style="margin-top:22px">
        <button class="ef-save" id="gwEdit">Gewerk bearbeiten</button>
      </div>`;
    const unter = esc(g.name) + (g.auftrag_am ? " · Auftrag vom " + dateDE(g.auftrag_am) : "");
    const sheet = openSheet(g.gewerk || g.name, unter, (hatModul() ? "" : `<div class="gw-hinweis" style="margin:0 0 14px">${NUR_LESEN}</div>`) + body);
    sheet.querySelector("#addRn").onclick = () => { closeSheet(); openRechnungEdit(s, g, null, true); };
    sheet.querySelector("#gwEdit").onclick = () => { closeSheet(); openGewerkEdit(s, g, false); };
    sheet.querySelectorAll("[data-rechnung]").forEach(n => n.onclick = () => {
      const r = g.rechnungen.find(x => x.id === n.dataset.rechnung);
      closeSheet(); openRechnungEdit(s, g, r, false);
    });
  }

  // Gewerk anlegen oder bearbeiten
  function openGewerkEdit(s, g, neu) {
    if (!pruefeModul("gewerke")) return;
    const body = `
      ${efTitel("Handwerker")}
      ${ef("Firma oder Name", "name", g ? g.name : "", "text", { pflicht: true, platzhalter: "z. B. Elektro Meyer GmbH" })}
      ${ef("Gewerk", "gewerk", g ? (g.gewerk || "") : "", "text", { platzhalter: "z. B. Elektrik, Sanitär, Maler" })}
      ${efTitel("Kalkulation")}
      ${ef("Angebotssumme", "angebot", g ? (g.angebot ?? "") : "", "number",
        { pflicht: true, einheit: "€", hinweis: "Brutto, wie im Angebot ausgewiesen" })}
      ${ef("Baufortschritt in %", "fortschritt", g ? (g.fortschritt ?? 0) : 0, "number",
        { step: "1", hinweis: "Wie viel der Leistung ist erbracht? ESTRIQ vergleicht das mit deinen Zahlungen." })}
      ${ef("Auftrag vom", "auftrag_am", g ? (g.auftrag_am || "") : "", "date")}
      ${efSel("Status", "status", g ? (g.status || "offen") : "offen",
        [{ v: "offen", t: "beauftragt" }, { v: "laufend", t: "in Arbeit" }, { v: "fertig", t: "abgeschlossen" }])}
      ${efArea("Notiz", "notiz", g ? (g.notiz || "") : "")}
      ${efAktionen({ loeschen: neu ? null : "Gewerk löschen" })}`;
    const sheet = openSheet(neu ? "Gewerk anlegen" : "Gewerk bearbeiten", neu ? s.name : "", body);
    const bauen = (w) => ({
      name: text(w.name) || "Gewerk",
      gewerk: text(w.gewerk),
      angebot: zahl(w.angebot) || 0,
      fortschritt: Math.max(0, Math.min(100, Number(w.fortschritt) || 0)),
      auftrag_am: text(w.auftrag_am),
      status: w.status,
      notiz: text(w.notiz)
    });
    efBind(sheet,
      async (w) => neu ? await window.neuesGewerk(s._id, bauen(w)) : await window.speichereGewerk(g.id, bauen(w)),
      neu ? null : async () => { await window.loescheGewerk(g.id); },
      "Gewerk mit allen Rechnungen löschen?");
  }

  // Rechnung anlegen oder bearbeiten
  function openRechnungEdit(s, g, r, neu) {
    if (!pruefeModul("gewerke")) return;
    const heute = new Date().toISOString().slice(0, 10);
    const body = `
      ${efTitel("Rechnung")}
      ${ef("Belegnummer", "beleg", r ? (r.beleg || "") : "", "text",
        { platzhalter: "z. B. AR-2026-081" })}
      ${ef("Bezeichnung", "bezeichnung", r ? (r.bezeichnung || "") : "", "text",
        { platzhalter: "z. B. Abschlag 1 oder Schlussrechnung" })}
      ${ef("Betrag", "betrag", r ? (r.betrag ?? "") : "", "number",
        { pflicht: true, minus: true, einheit: "€", hinweis: "Brutto laut Rechnung" })}
      ${ef("Rechnungsdatum", "datum", r ? (r.datum || "") : heute, "date")}
      ${efSel("Zahlung", "bezahlt", r && r.bezahlt ? "1" : "0",
        [{ v: "0", t: "noch offen" }, { v: "1", t: "bezahlt" }])}
      ${efAktionen({ loeschen: neu ? null : "Rechnung löschen" })}`;
    const sheet = openSheet(neu ? "Rechnung erfassen" : "Rechnung bearbeiten", g.name, body);
    const bauen = (w) => ({
      beleg: text(w.beleg),
      bezeichnung: text(w.bezeichnung),
      betrag: zahl(w.betrag) || 0,
      datum: text(w.datum),
      bezahlt: w.bezahlt === "1"
    });
    efBind(sheet,
      async (w) => neu ? await window.neueRechnung(g.id, bauen(w)) : await window.speichereRechnung(r.id, bauen(w)),
      neu ? null : async () => { await window.loescheRechnung(r.id); },
      "Rechnung löschen?");
  }

  /* ================= TOOLS: RECHNER & WISSEN ================= */

  const WISSEN = [
    { id: "mietarten", kat: "grundlagen", icon: "euro", titel: "Kaltmiete, Warmmiete, Nettokaltmiete",
      kurz: "Drei Begriffe, die ständig verwechselt werden.",
      inhalt: `
        <p><b>Nettokaltmiete</b> ist die reine Miete für den Wohnraum. Kein Strom, keine Heizung, kein Wasser. Das ist die Zahl, mit der du rechnest — bei Rendite, bei Mieterhöhung, bei allem.</p>
        <p><b>Kaltmiete</b> wird umgangssprachlich meist gleichbedeutend benutzt. In Mietverträgen taucht manchmal die Bruttokaltmiete auf: Nettokaltmiete plus kalte Betriebskosten, aber ohne Heizung.</p>
        <p><b>Warmmiete</b> ist alles zusammen: Nettokaltmiete plus sämtliche Nebenkosten inklusive Heizung. Das ist die Zahl, die dein Mieter überweist.</p>
        <div class="wi-merke">Für deine Kalkulation zählt ausschließlich die Nettokaltmiete. Wer mit der Warmmiete rechnet, überschätzt seine Rendite deutlich — die Nebenkosten gehören dir nicht, du reichst sie nur durch.</div>`
    },
    { id: "cashflow-rendite", kat: "grundlagen", icon: "chart", titel: "Cashflow ist nicht Rendite",
      kurz: "Zwei Zahlen, zwei völlig verschiedene Aussagen.",
      inhalt: `
        <p><b>Rendite</b> misst die Qualität des Objekts: Wie viel Miete bringt es im Verhältnis zum Kaufpreis? Sie ist unabhängig davon, wie du finanziert hast.</p>
        <p><b>Cashflow</b> misst deine Liquidität: Was bleibt nach Abzug der Kreditrate übrig? Er hängt massiv von deiner Finanzierung ab.</p>
        <p>Dasselbe Objekt kann mit hoher Tilgung negativen Cashflow haben und mit niedriger Tilgung positiven — die Rendite bleibt identisch.</p>
        <div class="wi-merke">Rendite sagt dir, ob das Objekt gut ist. Cashflow sagt dir, ob du es dir leisten kannst. Du brauchst beide Zahlen.</div>`
    },
    { id: "umlagefaehig", kat: "betrieb", icon: "layers", titel: "Umlagefähig oder nicht?",
      kurz: "Was du auf den Mieter umlegen darfst — und was nicht.",
      inhalt: `
        <p><b>Umlagefähig</b> nach Betriebskostenverordnung sind unter anderem: Grundsteuer, Wasser und Abwasser, Heizung, Aufzug, Straßenreinigung, Müllabfuhr, Gebäudereinigung, Gartenpflege, Beleuchtung, Schornsteinfeger, Sach- und Haftpflichtversicherung, Hauswart und Gemeinschaftsantenne.</p>
        <p><b>Nicht umlagefähig</b> sind: Instandhaltung und Reparaturen, Verwaltungskosten, Kontoführung, Rechtsberatung, Mietausfallwagnis, Leerstandskosten und Rücklagen.</p>
        <div class="wi-merke">Die Faustregel: Laufender Betrieb ja, Werterhalt nein. Reparaturen sind immer deine Sache — auch wenn es im Mietvertrag anders steht, solche Klauseln sind meist unwirksam.</div>
        <div class="wi-hinweis">Das ist eine Orientierung, keine Rechtsberatung. Im Zweifel den Mieterverein oder einen Fachanwalt fragen.</div>`
    },
    { id: "versteckte-kosten", kat: "grundlagen", icon: "wallet", titel: "Die vier versteckten Kosten",
      kurz: "Was in fast jeder Renditerechnung fehlt.",
      inhalt: `
        <p><b>1. Instandhaltung.</b> Rechne mit etwa 1 Prozent des Gebäudewerts pro Jahr, oder rund 10 Euro je Quadratmeter. Das Dach kommt irgendwann, garantiert.</p>
        <p><b>2. Mietausfall.</b> Leerstand, Mietnomaden, Zahlungsausfälle. Zwei bis fünf Prozent der Jahresmiete als Puffer sind realistisch.</p>
        <p><b>3. Verwaltung.</b> Auch wenn du selbst verwaltest, kostet es Zeit. Bei Fremdverwaltung etwa 20 bis 30 Euro je Einheit und Monat.</p>
        <p><b>4. Kaufnebenkosten.</b> Grunderwerbsteuer, Notar, Grundbuch, Makler — je nach Bundesland 9 bis 15 Prozent des Kaufpreises. Sie gehören in die Investitionssumme.</p>
        <div class="wi-merke">Wer diese vier Posten weglässt, rechnet sich eine Rendite schön, die es nie gab.</div>`
    },
    { id: "mieterhoehung", kat: "recht", icon: "trend", titel: "Mieterhöhung: die Regeln",
      kurz: "Wann, wie viel und in welcher Form.",
      inhalt: `
        <p><b>Sperrfrist:</b> Seit der letzten Erhöhung müssen zwölf Monate vergangen sein, und die Miete muss fünfzehn Monate unverändert gewesen sein.</p>
        <p><b>Kappungsgrenze:</b> Innerhalb von drei Jahren höchstens 20 Prozent. In angespannten Wohnlagen sind es nur 15 Prozent.</p>
        <p><b>Obergrenze:</b> Die ortsübliche Vergleichsmiete. Nachweisen kannst du sie über den Mietspiegel, ein Gutachten oder drei Vergleichswohnungen.</p>
        <p><b>Form:</b> Schriftlich mit Begründung. Der Mieter hat dann bis zum Ende des übernächsten Monats Zeit zuzustimmen.</p>
        <div class="wi-hinweis">Orientierung, keine Rechtsberatung. Regionale Regeln können abweichen.</div>`
    },
    { id: "nebenkosten", kat: "recht", icon: "calendar", titel: "Nebenkostenabrechnung: Pflichtangaben",
      kurz: "Sechs Punkte, ohne die sie angreifbar ist.",
      inhalt: `
        <p><b>1.</b> Zusammenstellung der Gesamtkosten je Kostenart.<br>
           <b>2.</b> Angabe und Erläuterung des Verteilerschlüssels.<br>
           <b>3.</b> Berechnung des Anteils für diesen Mieter.<br>
           <b>4.</b> Abzug der geleisteten Vorauszahlungen.<br>
           <b>5.</b> Klarer Abrechnungszeitraum von zwölf Monaten.<br>
           <b>6.</b> Zugang innerhalb von zwölf Monaten nach Ende des Zeitraums.</p>
        <div class="wi-merke">Die Frist ist hart: Kommt die Abrechnung zu spät, kannst du keine Nachzahlung mehr verlangen — Guthaben musst du trotzdem auszahlen.</div>
        <div class="wi-hinweis">Orientierung, keine Rechtsberatung.</div>`
    },
    { id: "leise-verluste", kat: "betrieb", icon: "debt", titel: "Wo Geld leise verschwindet",
      kurz: "Sechs Stellen, die kaum jemand prüft.",
      inhalt: `
        <p><b>Mieten, die nie angepasst wurden.</b> Nach fünf Jahren unter Marktniveau summiert sich das erheblich.</p>
        <p><b>Zu niedrige Vorauszahlungen.</b> Du streckst die Betriebskosten das ganze Jahr vor und bekommst erst spät Geld zurück.</p>
        <p><b>Nicht umgelegte Positionen.</b> Umlagefähige Kosten, die schlicht vergessen wurden.</p>
        <p><b>Leerstand zwischen zwei Mietern.</b> Jeder Monat ist unwiederbringlich weg.</p>
        <p><b>Zu hohe Zinsen nach Ablauf der Bindung.</b> Anschlussfinanzierung nicht rechtzeitig geprüft.</p>
        <p><b>Ungenutzte Sondertilgung.</b> Das vertragliche Recht verfällt jedes Jahr aufs Neue.</p>
        <div class="wi-merke">Keiner dieser Punkte tut spürbar weh. Zusammen kosten sie oft mehr als eine ganze Monatsmiete pro Jahr.</div>`
    },
    { id: "zinsbindung", kat: "finanzierung", icon: "bank", titel: "Zinsbindung und Anschlussfinanzierung",
      kurz: "Warum du Jahre vorher anfangen solltest.",
      inhalt: `
        <p>Nach Ablauf der Zinsbindung wird die Restschuld neu finanziert — zum dann geltenden Zins. Steigt der von 2 auf 5 Prozent, kann sich deine Rate fast verdoppeln.</p>
        <p><b>Forward-Darlehen</b> sichern dir den heutigen Zins bis zu 60 Monate im Voraus. Dafür zahlst du einen kleinen Aufschlag je Monat Vorlauf.</p>
        <p><b>Sondertilgung</b> senkt die Restschuld und damit dein Risiko bei der Anschlussfinanzierung. Viele Verträge erlauben 5 Prozent jährlich.</p>
        <div class="wi-merke">Trag dir das Ende der Zinsbindung drei Jahre vorher in den Kalender. Wer erst im letzten Monat verhandelt, hat keine Verhandlungsposition.</div>`
    }
  ];

  const WISSEN_KAT = [
    { id: "grundlagen", name: "Grundlagen", info: "Die Begriffe, die alles bestimmen" },
    { id: "betrieb", name: "Betrieb & Kosten", info: "Was im Alltag Geld kostet" },
    { id: "recht", name: "Recht & Fristen", info: "Regeln, die du kennen musst" },
    { id: "finanzierung", name: "Finanzierung", info: "Kredit, Zins und Tilgung" }
  ];

  const RECHNER = [
    {
      id: "rendite", titel: "Renditerechner", icon: "trend", kat: "kauf",
      kurz: "Was wirft eine Immobilie im Verhältnis zum Kaufpreis ab?",
      felder: [
        { id: "kaufpreis", label: "Kaufpreis", einheit: "€", wert: 250000 },
        { id: "nebenkosten", label: "Kaufnebenkosten", einheit: "%", wert: 12, hinweis: "Notar, Grunderwerbsteuer, Makler" },
        { id: "miete", label: "Kaltmiete pro Monat", einheit: "€", wert: 950 },
        { id: "bewirt", label: "Bewirtschaftungskosten", einheit: "% der Miete", wert: 20, hinweis: "Instandhaltung, Verwaltung, Mietausfall" }
      ],
      rechne: (w) => {
        const invest = w.kaufpreis * (1 + w.nebenkosten / 100);
        const jahr = w.miete * 12;
        const netto = jahr * (1 - w.bewirt / 100);
        return {
          zeilen: [
            { l: "Gesamtinvestition", v: eur(invest), gross: true },
            { l: "Jahreskaltmiete", v: eur(jahr) },
            { l: "Bruttorendite", v: (invest ? (jahr / invest * 100) : 0).toFixed(2).replace(".", ",") + " %", gross: true },
            { l: "Nettorendite", v: (invest ? (netto / invest * 100) : 0).toFixed(2).replace(".", ",") + " %", gross: true },
            { l: "davon Bewirtschaftung", v: "− " + eur(jahr - netto) }
          ],
          balken: Math.max(0, Math.min(100, invest ? (jahr / invest * 100) * 10 : 0)),
          fazit: invest && (jahr / invest * 100) >= 5
            ? "Solide Ausgangslage. Prüf trotzdem den Cashflow nach Finanzierung."
            : "Rechnerisch dünn. Bei dieser Rendite wird positiver Cashflow schwierig."
        };
      }
    },
    {
      id: "kredit", titel: "Kreditrechner", icon: "bank", kat: "finanzierung",
      kurz: "Was kostet dich die Finanzierung monatlich?",
      felder: [
        { id: "summe", label: "Darlehenssumme", einheit: "€", wert: 200000 },
        { id: "zins", label: "Sollzins", einheit: "% p. a.", wert: 3.5 },
        { id: "tilgung", label: "Anfangstilgung", einheit: "% p. a.", wert: 2 }
      ],
      rechne: (w) => {
        const rate = w.summe * (w.zins + w.tilgung) / 100 / 12;
        const zinsM = w.summe * w.zins / 100 / 12;
        const tilgM = rate - zinsM;
        // Laufzeit bis vollständige Tilgung
        let rest = w.summe, monate = 0;
        const zM = w.zins / 100 / 12;
        while (rest > 0 && monate < 1200) { rest = rest + rest * zM - rate; monate++; }
        const jahre = Math.floor(monate / 12), restM = monate % 12;
        return {
          zeilen: [
            { l: "Monatliche Rate", v: eur(rate), gross: true },
            { l: "davon Zinsen", v: eur(zinsM) },
            { l: "davon Tilgung", v: eur(tilgM) },
            { l: "Schuldenfrei nach", v: jahre + " Jahren " + restM + " Monaten", gross: true },
            { l: "Zinskosten gesamt", v: eur(Math.max(0, rate * monate - w.summe)) }
          ],
          verhaeltnis: { zins: rate ? zinsM / rate * 100 : 0, tilgung: rate ? tilgM / rate * 100 : 0 },
          fazit: "Eine höhere Anfangstilgung verkürzt die Laufzeit stark und spart Zinsen — kostet aber monatlich mehr."
        };
      }
    },
    {
      id: "zinseszins", titel: "Zinseszinsrechner", icon: "chart", kat: "vermoegen",
      kurz: "Wie stark wächst Kapital über die Zeit?",
      felder: [
        { id: "start", label: "Startkapital", einheit: "€", wert: 20000 },
        { id: "sparrate", label: "Monatliche Sparrate", einheit: "€", wert: 500 },
        { id: "zins", label: "Rendite", einheit: "% p. a.", wert: 6 },
        { id: "jahre", label: "Laufzeit", einheit: "Jahre", wert: 20 }
      ],
      rechne: (w) => {
        const m = w.zins / 100 / 12;
        let kap = w.start;
        const verlauf = [kap];
        for (let i = 0; i < w.jahre * 12; i++) { kap = kap * (1 + m) + w.sparrate; if ((i + 1) % 12 === 0) verlauf.push(kap); }
        const eingezahlt = w.start + w.sparrate * 12 * w.jahre;
        return {
          zeilen: [
            { l: "Endkapital", v: eur(kap), gross: true },
            { l: "davon eingezahlt", v: eur(eingezahlt) },
            { l: "davon Zinsertrag", v: eur(Math.max(0, kap - eingezahlt)), gross: true }
          ],
          verlauf: verlauf,
          fazit: "Der Zinsertrag wächst nicht gleichmäßig, sondern beschleunigt sich. Die letzten Jahre bringen am meisten."
        };
      }
    },
    {
      id: "opportunitaet", titel: "Opportunitätskosten", icon: "layers", kat: "vermoegen",
      kurz: "Was hätte dein Geld woanders gebracht?",
      felder: [
        { id: "kapital", label: "Eingesetztes Eigenkapital", einheit: "€", wert: 60000 },
        { id: "immoRendite", label: "Rendite der Immobilie", einheit: "% p. a.", wert: 5 },
        { id: "altRendite", label: "Alternative Anlage", einheit: "% p. a.", wert: 7, hinweis: "z. B. breit gestreuter Aktienindex" },
        { id: "jahre", label: "Zeitraum", einheit: "Jahre", wert: 15 }
      ],
      rechne: (w) => {
        const immo = w.kapital * Math.pow(1 + w.immoRendite / 100, w.jahre);
        const alt = w.kapital * Math.pow(1 + w.altRendite / 100, w.jahre);
        const diff = immo - alt;
        return {
          zeilen: [
            { l: "Immobilie nach " + w.jahre + " Jahren", v: eur(immo), gross: true },
            { l: "Alternative nach " + w.jahre + " Jahren", v: eur(alt), gross: true },
            { l: "Unterschied", v: (diff >= 0 ? "+ " : "− ") + eur(Math.abs(diff)) }
          ],
          vergleich: { a: immo, b: alt },
          fazit: diff >= 0
            ? "Rechnerisch liegt die Immobilie vorn. Bedenke: Sie bringt Aufwand mit, dafür kannst du sie mit Fremdkapital hebeln."
            : "Rechnerisch läge die Alternative vorn. Der Vergleich blendet aber den Kredithebel aus — mit Fremdkapital arbeitet die Immobilie mit dem Geld der Bank."
        };
      }
    },
    {
      id: "kaufneben", titel: "Kaufnebenkosten", icon: "coins", kat: "kauf",
      kurz: "Was zum Kaufpreis noch obendrauf kommt.",
      felder: [
        { id: "kaufpreis", label: "Kaufpreis", einheit: "€", wert: 250000 },
        { id: "grest", label: "Grunderwerbsteuer", einheit: "%", wert: 5, hinweis: "Bundeslandabhängig: 3,5 bis 6,5 %" },
        { id: "notar", label: "Notar und Grundbuch", einheit: "%", wert: 2 },
        { id: "makler", label: "Maklercourtage", einheit: "%", wert: 3.57, hinweis: "Oft geteilt, entfällt beim Direktkauf" }
      ],
      rechne: (w) => {
        const g = w.kaufpreis * w.grest / 100, n = w.kaufpreis * w.notar / 100, m = w.kaufpreis * w.makler / 100;
        const nk = g + n + m, ges = w.kaufpreis + nk;
        return {
          zeilen: [
            { l: "Grunderwerbsteuer", v: eur(g) },
            { l: "Notar und Grundbuch", v: eur(n) },
            { l: "Makler", v: eur(m) },
            { l: "Nebenkosten gesamt", v: eur(nk), gross: true },
            { l: "Anteil am Kaufpreis", v: (w.kaufpreis ? nk / w.kaufpreis * 100 : 0).toFixed(1).replace(".", ",") + " %" },
            { l: "Gesamtinvestition", v: eur(ges), gross: true }
          ],
          stapel: [
            { l: "Kaufpreis", v: w.kaufpreis, f: "a" },
            { l: "Grunderwerbsteuer", v: g, f: "b" },
            { l: "Notar", v: n, f: "c" },
            { l: "Makler", v: m, f: "d" }
          ],
          fazit: "Die Nebenkosten sind verlorenes Geld — sie stecken nicht im Wert der Immobilie. Deshalb gehören sie zwingend in die Renditerechnung."
        };
      }
    },
    {
      id: "cashflow", titel: "Cashflow-Rechner", icon: "wallet", kat: "kauf",
      kurz: "Was bleibt nach allen Kosten und der Kreditrate übrig?",
      felder: [
        { id: "miete", label: "Kaltmiete pro Monat", einheit: "€", wert: 950 },
        { id: "rate", label: "Kreditrate pro Monat", einheit: "€", wert: 780 },
        { id: "instand", label: "Instandhaltung", einheit: "€/Monat", wert: 80, hinweis: "Faustregel: 1 € je m² und Monat" },
        { id: "verwaltung", label: "Verwaltung", einheit: "€/Monat", wert: 25 },
        { id: "ausfall", label: "Mietausfallrisiko", einheit: "% der Miete", wert: 3 }
      ],
      rechne: (w) => {
        const ausfall = w.miete * w.ausfall / 100;
        const cf = w.miete - (w.rate + w.instand + w.verwaltung + ausfall);
        return {
          zeilen: [
            { l: "Mieteinnahme", v: eur(w.miete) },
            { l: "− Kreditrate", v: "− " + eur(w.rate) },
            { l: "− Instandhaltung", v: "− " + eur(w.instand) },
            { l: "− Verwaltung", v: "− " + eur(w.verwaltung) },
            { l: "− Mietausfallrisiko", v: "− " + eur(ausfall) },
            { l: "Cashflow pro Monat", v: eur(cf), gross: true },
            { l: "Cashflow pro Jahr", v: eur(cf * 12), gross: true }
          ],
          wasserfall: [
            { l: "Miete", v: w.miete, typ: "plus" },
            { l: "Rate", v: w.rate, typ: "minus" },
            { l: "Kosten", v: w.instand + w.verwaltung + ausfall, typ: "minus" },
            { l: "Rest", v: Math.abs(cf), typ: cf >= 0 ? "rest" : "neg" }
          ],
          fazit: cf >= 0
            ? "Positiver Cashflow: Das Objekt trägt sich selbst und wirft zusätzlich etwas ab."
            : "Negativer Cashflow: Du legst monatlich " + eur(Math.abs(cf)) + " drauf. Das kann sich lohnen, wenn die Tilgung hoch ist — du musst es dir aber leisten können."
        };
      }
    },
    {
      id: "sondertilgung", titel: "Sondertilgung", icon: "coins", kat: "finanzierung",
      kurz: "Wie viel Zinsen sparst du durch eine Extrazahlung?",
      felder: [
        { id: "summe", label: "Restschuld", einheit: "€", wert: 200000 },
        { id: "zins", label: "Sollzins", einheit: "% p. a.", wert: 3.5 },
        { id: "rate", label: "Monatliche Rate", einheit: "€", wert: 917 },
        { id: "sonder", label: "Sondertilgung pro Jahr", einheit: "€", wert: 5000 }
      ],
      rechne: (w) => {
        const lauf = (mitSonder) => {
          let rest = w.summe, mon = 0, zins = 0;
          const zM = w.zins / 100 / 12;
          while (rest > 0 && mon < 1200) {
            const z = rest * zM; zins += z;
            rest = rest + z - w.rate;
            if (mitSonder && (mon + 1) % 12 === 0) rest -= w.sonder;
            mon++;
          }
          return { mon, zins };
        };
        const ohne = lauf(false), mit = lauf(true);
        const sparMon = Math.max(0, ohne.mon - mit.mon), sparZins = Math.max(0, ohne.zins - mit.zins);
        return {
          zeilen: [
            { l: "Ohne Sondertilgung", v: Math.floor(ohne.mon / 12) + " J " + (ohne.mon % 12) + " M" },
            { l: "Mit Sondertilgung", v: Math.floor(mit.mon / 12) + " J " + (mit.mon % 12) + " M", gross: true },
            { l: "Schneller schuldenfrei", v: Math.floor(sparMon / 12) + " J " + (sparMon % 12) + " M", gross: true },
            { l: "Gesparte Zinsen", v: eur(sparZins), gross: true }
          ],
          vergleich: { a: ohne.mon, b: mit.mon, la: "ohne Sondertilgung", lb: "mit Sondertilgung", einheit: "Monate" },
          fazit: "Sondertilgung wirkt am stärksten früh in der Laufzeit, weil dann der Zinsanteil am höchsten ist. Viele Verträge erlauben 5 % jährlich kostenfrei."
        };
      }
    },
    {
      id: "anschluss", titel: "Anschlussfinanzierung", icon: "debt", kat: "finanzierung",
      kurz: "Was passiert, wenn der Zins nach der Bindung steigt?",
      felder: [
        { id: "rest", label: "Restschuld bei Ablauf", einheit: "€", wert: 150000 },
        { id: "altZins", label: "Bisheriger Zins", einheit: "% p. a.", wert: 2 },
        { id: "neuZins", label: "Erwarteter neuer Zins", einheit: "% p. a.", wert: 4.5 },
        { id: "tilgung", label: "Tilgung", einheit: "% p. a.", wert: 2 }
      ],
      rechne: (w) => {
        const alt = w.rest * (w.altZins + w.tilgung) / 100 / 12;
        const neu = w.rest * (w.neuZins + w.tilgung) / 100 / 12;
        const diff = neu - alt;
        return {
          zeilen: [
            { l: "Bisherige Rate", v: eur(alt) },
            { l: "Neue Rate", v: eur(neu), gross: true },
            { l: "Mehrbelastung pro Monat", v: (diff >= 0 ? "+ " : "− ") + eur(Math.abs(diff)), gross: true },
            { l: "Mehrbelastung pro Jahr", v: (diff >= 0 ? "+ " : "− ") + eur(Math.abs(diff * 12)) }
          ],
          vergleich: { a: alt, b: neu, la: "bisherige Rate", lb: "neue Rate", waehrung: true },
          fazit: diff > 0
            ? "Deine Rate steigt spürbar. Prüfe rechtzeitig ein Forward-Darlehen oder erhöhe vorher die Tilgung, um die Restschuld zu senken."
            : "Die Anschlussfinanzierung wird günstiger. Überlege, ob du stattdessen die Tilgung erhöhst."
        };
      }
    },
    {
      id: "kauffaktor", titel: "Kaufpreisfaktor", icon: "layers", kat: "kauf",
      kurz: "Wie viele Jahresmieten kostet die Immobilie?",
      felder: [
        { id: "kaufpreis", label: "Kaufpreis", einheit: "€", wert: 250000 },
        { id: "miete", label: "Kaltmiete pro Monat", einheit: "€", wert: 950 }
      ],
      rechne: (w) => {
        const jahr = w.miete * 12;
        const faktor = jahr ? w.kaufpreis / jahr : 0;
        const rendite = w.kaufpreis ? jahr / w.kaufpreis * 100 : 0;
        return {
          zeilen: [
            { l: "Jahreskaltmiete", v: eur(jahr) },
            { l: "Kaufpreisfaktor", v: faktor.toFixed(1).replace(".", ",") + " ×", gross: true },
            { l: "entspricht Bruttorendite", v: rendite.toFixed(2).replace(".", ",") + " %", gross: true }
          ],
          faktor: faktor,
          fazit: faktor <= 20
            ? "Unter Faktor 20 gilt als günstig — in Städten kaum noch zu finden, in ländlichen Lagen realistisch."
            : faktor <= 28
              ? "Im normalen Bereich für gute Lagen. Der Cashflow wird hier meist knapp."
              : "Hoher Faktor. Das lohnt sich fast nur, wenn du auf Wertsteigerung setzt — nicht auf laufende Erträge."
        };
      }
    },
    {
      id: "instandhaltung", titel: "Instandhaltungsrücklage", icon: "home", kat: "betrieb",
      kurz: "Wie viel solltest du monatlich zurücklegen?",
      felder: [
        { id: "flaeche", label: "Wohnfläche", einheit: "m²", wert: 80 },
        { id: "baujahr", label: "Baujahr", einheit: "", wert: 1985 },
        { id: "gebaeude", label: "Gebäudewert", einheit: "€", wert: 200000, hinweis: "Kaufpreis ohne Grundstücksanteil" }
      ],
      rechne: (w) => {
        const alter = Math.max(0, new Date().getFullYear() - w.baujahr);
        const proQm = alter < 22 ? 9 : alter < 32 ? 11.5 : 14;
        const nachFlaeche = w.flaeche * proQm / 12;
        const nachWert = w.gebaeude * 0.01 / 12;
        const empfehlung = Math.max(nachFlaeche, nachWert);
        return {
          zeilen: [
            { l: "Gebäudealter", v: alter + " Jahre" },
            { l: "Nach Fläche", v: eur(nachFlaeche) + " / Monat" },
            { l: "Nach Gebäudewert (1 % p. a.)", v: eur(nachWert) + " / Monat" },
            { l: "Empfehlung", v: eur(empfehlung) + " / Monat", gross: true },
            { l: "Pro Jahr", v: eur(empfehlung * 12), gross: true }
          ],
          vergleich: { a: nachFlaeche, b: nachWert, la: "nach Fläche", lb: "nach Wert", waehrung: true },
          fazit: "Ältere Gebäude brauchen mehr Rücklage — ab 32 Jahren rechnet man mit rund 14 € je m² und Jahr. Wer nichts zurücklegt, finanziert das nächste Dach über einen teuren Kredit."
        };
      }
    },
    {
      id: "mieterhoehung", titel: "Mieterhöhung", icon: "trend", kat: "betrieb",
      kurz: "Wie viel darfst du erhöhen — und was bringt es?",
      felder: [
        { id: "aktuell", label: "Aktuelle Kaltmiete", einheit: "€/Monat", wert: 700 },
        { id: "vergleich", label: "Ortsübliche Vergleichsmiete", einheit: "€/Monat", wert: 880 },
        { id: "kappung", label: "Kappungsgrenze", einheit: "%", wert: 20, hinweis: "15 % in angespannten Wohnlagen" }
      ],
      rechne: (w) => {
        const maxKappung = w.aktuell * (1 + w.kappung / 100);
        const neu = Math.min(maxKappung, w.vergleich);
        const plus = Math.max(0, neu - w.aktuell);
        return {
          zeilen: [
            { l: "Grenze durch Kappung", v: eur(maxKappung) },
            { l: "Grenze durch Vergleichsmiete", v: eur(w.vergleich) },
            { l: "Zulässige neue Miete", v: eur(neu), gross: true },
            { l: "Erhöhung pro Monat", v: "+ " + eur(plus), gross: true },
            { l: "Mehr pro Jahr", v: "+ " + eur(plus * 12), gross: true }
          ],
          grenzen: { aktuell: w.aktuell, kappung: maxKappung, vergleich: w.vergleich, neu: neu },
          fazit: "Es gilt immer die niedrigere der beiden Grenzen. Zwischen zwei Erhöhungen müssen zwölf Monate liegen, die Miete muss fünfzehn Monate unverändert gewesen sein.",
          rechtlich: true
        };
      }
    }
  ];

  /* Zielgrößen: Für die wichtigsten Rechner kann gewählt werden, welcher Wert
     gesucht ist. Die Eingabefelder wechseln entsprechend. */
  const ZIELE = {
    rendite: [
      { id: "rendite", label: "Rendite", frage: "Welche Rendite bringt dieses Objekt?" },
      { id: "kaufpreis", label: "Max. Kaufpreis", frage: "Was darf das Objekt höchstens kosten?",
        felder: [
          { id: "miete", label: "Kaltmiete pro Monat", einheit: "€", wert: 950 },
          { id: "wunsch", label: "Gewünschte Bruttorendite", einheit: "%", wert: 5 },
          { id: "nebenkosten", label: "Kaufnebenkosten", einheit: "%", wert: 12 }
        ],
        rechne: (w) => {
          const jahr = w.miete * 12;
          const invest = w.wunsch ? jahr / (w.wunsch / 100) : 0;
          const kaufpreis = invest / (1 + w.nebenkosten / 100);
          return {
            zeilen: [
              { l: "Jahreskaltmiete", v: eur(jahr) },
              { l: "Zulässige Gesamtinvestition", v: eur(invest), gross: true },
              { l: "Davon Kaufnebenkosten", v: "− " + eur(invest - kaufpreis) },
              { l: "Maximaler Kaufpreis", v: eur(kaufpreis), gross: true },
              { l: "Kaufpreisfaktor", v: (jahr ? kaufpreis / jahr : 0).toFixed(1).replace(".", ",") + " ×" }
            ],
            fazit: "Mehr als " + eur(kaufpreis) + " darfst du nicht zahlen, wenn du " +
              w.wunsch.toLocaleString("de-DE") + " % Bruttorendite erreichen willst."
          };
        } },
      { id: "miete", label: "Nötige Miete", frage: "Welche Miete brauche ich für meine Zielrendite?",
        felder: [
          { id: "kaufpreis", label: "Kaufpreis", einheit: "€", wert: 250000 },
          { id: "nebenkosten", label: "Kaufnebenkosten", einheit: "%", wert: 12 },
          { id: "wunsch", label: "Gewünschte Bruttorendite", einheit: "%", wert: 5 },
          { id: "flaeche", label: "Wohnfläche", einheit: "m²", wert: 72 }
        ],
        rechne: (w) => {
          const invest = w.kaufpreis * (1 + w.nebenkosten / 100);
          const jahr = invest * w.wunsch / 100;
          const monat = jahr / 12;
          return {
            zeilen: [
              { l: "Gesamtinvestition", v: eur(invest) },
              { l: "Nötige Jahreskaltmiete", v: eur(jahr) },
              { l: "Nötige Kaltmiete", v: eur(monat) + " / Monat", gross: true },
              { l: "Entspricht", v: (w.flaeche ? monat / w.flaeche : 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " € / m²", gross: true }
            ],
            fazit: "Vergleich diesen Wert mit dem örtlichen Mietspiegel. Liegt er deutlich darüber, ist der Kaufpreis zu hoch."
          };
        } }
    ],
    kredit: [
      { id: "rate", label: "Rate", frage: "Was kostet mich die Finanzierung monatlich?" },
      { id: "summe", label: "Mögliche Summe", frage: "Wie viel Darlehen kann ich mir leisten?",
        felder: [
          { id: "rate", label: "Rate, die ich tragen kann", einheit: "€/Monat", wert: 900 },
          { id: "zins", label: "Sollzins", einheit: "% p. a.", wert: 3.5 },
          { id: "tilgung", label: "Anfangstilgung", einheit: "% p. a.", wert: 2 }
        ],
        rechne: (w) => {
          const summe = (w.zins + w.tilgung) ? w.rate * 12 / ((w.zins + w.tilgung) / 100) : 0;
          const zinsM = summe * w.zins / 100 / 12;
          return {
            zeilen: [
              { l: "Mögliche Darlehenssumme", v: eur(summe), gross: true },
              { l: "davon Zinsen im 1. Monat", v: eur(zinsM) },
              { l: "davon Tilgung im 1. Monat", v: eur(w.rate - zinsM) },
              { l: "Mit 20 % Eigenkapital Kaufpreis bis", v: eur(summe / 0.8), gross: true }
            ],
            verhaeltnis: { zins: w.rate ? zinsM / w.rate * 100 : 0, tilgung: w.rate ? (w.rate - zinsM) / w.rate * 100 : 0 },
            fazit: "Banken rechnen zusätzlich mit einem Sicherheitspuffer. Plane die Rate so, dass sie auch bei Leerstand tragbar bleibt."
          };
        } },
      { id: "tilgung", label: "Nötige Tilgung", frage: "Wie schnell bin ich schuldenfrei?",
        felder: [
          { id: "summe", label: "Darlehenssumme", einheit: "€", wert: 200000 },
          { id: "zins", label: "Sollzins", einheit: "% p. a.", wert: 3.5 },
          { id: "jahre", label: "Gewünschte Laufzeit", einheit: "Jahre", wert: 20 }
        ],
        rechne: (w) => {
          const zM = w.zins / 100 / 12, n = w.jahre * 12;
          const rate = zM ? w.summe * zM / (1 - Math.pow(1 + zM, -n)) : w.summe / n;
          const zinsM = w.summe * zM;
          const tilgProz = w.summe ? (rate - zinsM) * 12 / w.summe * 100 : 0;
          return {
            zeilen: [
              { l: "Nötige Monatsrate", v: eur(rate), gross: true },
              { l: "Nötige Anfangstilgung", v: tilgProz.toFixed(2).replace(".", ",") + " % p. a.", gross: true },
              { l: "Zinskosten gesamt", v: eur(Math.max(0, rate * n - w.summe)) },
              { l: "Gesamtaufwand", v: eur(rate * n) }
            ],
            fazit: "Je höher die Anfangstilgung, desto kürzer die Laufzeit und desto weniger Zinsen zahlst du insgesamt."
          };
        } }
    ],
    zinseszins: [
      { id: "endkapital", label: "Endkapital", frage: "Wie viel wird daraus?" },
      { id: "sparrate", label: "Nötige Sparrate", frage: "Wie viel muss ich monatlich zurücklegen?",
        felder: [
          { id: "ziel", label: "Zielkapital", einheit: "€", wert: 300000 },
          { id: "start", label: "Startkapital", einheit: "€", wert: 20000 },
          { id: "zins", label: "Rendite", einheit: "% p. a.", wert: 6 },
          { id: "jahre", label: "Laufzeit", einheit: "Jahre", wert: 20 }
        ],
        rechne: (w) => {
          const m = w.zins / 100 / 12, n = w.jahre * 12;
          const ausStart = w.start * Math.pow(1 + m, n);
          const luecke = Math.max(0, w.ziel - ausStart);
          const faktor = m ? (Math.pow(1 + m, n) - 1) / m : n;
          const rate = faktor ? luecke / faktor : 0;
          return {
            zeilen: [
              { l: "Startkapital wächst auf", v: eur(ausStart) },
              { l: "Verbleibende Lücke", v: eur(luecke) },
              { l: "Nötige Sparrate", v: eur(rate) + " / Monat", gross: true },
              { l: "Eingezahlt insgesamt", v: eur(w.start + rate * n) },
              { l: "Davon Zinsertrag", v: eur(Math.max(0, w.ziel - w.start - rate * n)), gross: true }
            ],
            fazit: "Jedes Jahr früher senkt die nötige Sparrate spürbar — der Zinseszins übernimmt den Rest."
          };
        } },
      { id: "dauer", label: "Nötige Zeit", frage: "Wie lange dauert es bis zum Ziel?",
        felder: [
          { id: "ziel", label: "Zielkapital", einheit: "€", wert: 300000 },
          { id: "start", label: "Startkapital", einheit: "€", wert: 20000 },
          { id: "sparrate", label: "Monatliche Sparrate", einheit: "€", wert: 500 },
          { id: "zins", label: "Rendite", einheit: "% p. a.", wert: 6 }
        ],
        rechne: (w) => {
          const m = w.zins / 100 / 12;
          let kap = w.start, mon = 0;
          const verlauf = [kap];
          while (kap < w.ziel && mon < 1200) { kap = kap * (1 + m) + w.sparrate; mon++; if (mon % 12 === 0) verlauf.push(kap); }
          const erreicht = mon < 1200;
          return {
            zeilen: [
              { l: "Ziel erreicht nach", v: erreicht ? Math.floor(mon / 12) + " Jahren " + (mon % 12) + " Monaten" : "über 100 Jahren", gross: true },
              { l: "Eingezahlt bis dahin", v: eur(w.start + w.sparrate * mon) },
              { l: "Davon Zinsertrag", v: eur(Math.max(0, kap - w.start - w.sparrate * mon)), gross: true },
              { l: "Endkapital", v: eur(kap) }
            ],
            verlauf: verlauf.length > 1 ? verlauf : null,
            fazit: erreicht
              ? "Eine um 1 Prozentpunkt höhere Rendite verkürzt die Zeit meist um mehrere Jahre."
              : "Mit diesen Werten ist das Ziel praktisch nicht erreichbar. Erhöhe die Sparrate oder senke das Ziel."
          };
        } }
    ],
    cashflow: [
      { id: "cashflow", label: "Cashflow", frage: "Was bleibt am Monatsende übrig?" },
      { id: "miete", label: "Nötige Miete", frage: "Welche Miete brauche ich für schwarze Zahlen?",
        felder: [
          { id: "rate", label: "Kreditrate pro Monat", einheit: "€", wert: 780 },
          { id: "instand", label: "Instandhaltung", einheit: "€/Monat", wert: 80 },
          { id: "verwaltung", label: "Verwaltung", einheit: "€/Monat", wert: 25 },
          { id: "ausfall", label: "Mietausfallrisiko", einheit: "% der Miete", wert: 3 },
          { id: "wunsch", label: "Gewünschter Cashflow", einheit: "€/Monat", wert: 0 }
        ],
        rechne: (w) => {
          const fix = w.rate + w.instand + w.verwaltung + w.wunsch;
          const miete = (1 - w.ausfall / 100) ? fix / (1 - w.ausfall / 100) : fix;
          return {
            zeilen: [
              { l: "Feste Kosten je Monat", v: eur(w.rate + w.instand + w.verwaltung) },
              { l: "Gewünschter Überschuss", v: eur(w.wunsch) },
              { l: "Puffer für Mietausfall", v: eur(miete - fix) },
              { l: "Nötige Kaltmiete", v: eur(miete) + " / Monat", gross: true },
              { l: "Pro Jahr", v: eur(miete * 12), gross: true }
            ],
            fazit: "Liegt dieser Wert über der ortsüblichen Miete, trägt sich das Objekt mit dieser Finanzierung nicht."
          };
        } }
    ]
  };

  const RECHNER_KAT = [
    { id: "kauf", name: "Kauf & Rendite", info: "Lohnt sich dieses Objekt?" },
    { id: "finanzierung", name: "Finanzierung", info: "Was kostet dich die Bank?" },
    { id: "betrieb", name: "Betrieb & Miete", info: "Laufende Kosten und Mieteinnahmen" },
    { id: "vermoegen", name: "Vermögen & Vergleich", info: "Was macht dein Geld sonst?" }
  ];


  // Themenwelten: jede Kategorie zeigt Rechner UND passende Artikel zusammen
  const THEMEN = [
    { id: "kauf", name: "Kauf & Rendite", info: "Lohnt sich dieses Objekt?",
      wissen: ["versteckte-kosten", "cashflow-rendite", "mietarten"] },
    { id: "finanzierung", name: "Finanzierung", info: "Was kostet dich die Bank?",
      wissen: ["zinsbindung"] },
    { id: "betrieb", name: "Betrieb & Miete", info: "Laufende Kosten und Mieteinnahmen",
      wissen: ["umlagefaehig", "nebenkosten", "mieterhoehung", "leise-verluste"] },
    { id: "vermoegen", name: "Vermögen & Vergleich", info: "Was macht dein Geld sonst?",
      wissen: [] }
  ];
  let toolFilter = "alle";

  function renderTools(host) {
    $("#eyebrow").textContent = "Lernecke";
    $("#pageTitle").textContent = "Rechner & Wissen";
    $("#pageSub").textContent = RECHNER.length + " Rechner · " + WISSEN.length + " Themen";

    // Filterleiste
    const filter = el(`<div class="tl-filter">
      <button class="tl-f${toolFilter === "alle" ? " on" : ""}" data-f="alle">Alles</button>
      ${THEMEN.map(t => `<button class="tl-f${toolFilter === t.id ? " on" : ""}" data-f="${t.id}">${esc(t.name)}</button>`).join("")}
    </div>`);
    filter.querySelectorAll(".tl-f").forEach(b => b.onclick = () => {
      toolFilter = b.dataset.f; route("tools");
    });
    host.appendChild(filter);

    const sichtbar = THEMEN.filter(t => toolFilter === "alle" || toolFilter === t.id);
    sichtbar.forEach(t => {
      const rechner = RECHNER.filter(r => r.kat === t.id);
      const artikel = t.wissen.map(id => WISSEN.find(a => a.id === id)).filter(Boolean);
      if (!rechner.length && !artikel.length) return;

      const block = el(`<div class="card tw-card">
        <div class="card-h"><div><div class="card-t">${esc(t.name)}</div>
          <div class="card-s">${esc(t.info)}</div></div>
          <div class="head-pill" style="padding:7px 13px">${rechner.length} Rechner</div></div>
        <div class="card-b">
          <div class="tw-rechner">${rechner.map(r => {
            const z = ZIELE[r.id];
            return `<button class="tw-r" data-rechner="${r.id}">
              <span class="tw-r-ic">${svg(r.icon)}</span>
              <span class="tw-r-tx">
                <b>${esc(r.titel)}</b>
                <small>${esc(r.kurz)}</small>
                ${z ? `<span class="tw-r-ziele">${z.map(x => `<i data-rechner="${r.id}" data-ziel="${x.id}">${esc(x.label)}</i>`).join("")}</span>` : ""}
              </span>
              <span class="tw-r-pfeil">›</span>
            </button>`;
          }).join("")}</div>
          ${artikel.length ? `<div class="tw-wissen">
            <div class="tw-w-kopf">Zum Nachlesen</div>
            ${artikel.map(a => `<button class="tw-w" data-wissen="${a.id}">
              <span class="tw-w-ic">${svg(a.icon || "chart")}</span>
              <span class="tw-w-tx"><b>${esc(a.titel)}</b><small>${esc(a.kurz)}</small></span>
              <span class="tw-r-pfeil">›</span></button>`).join("")}
          </div>` : ""}
        </div></div>`);

      block.querySelectorAll("[data-ziel]").forEach(n => n.onclick = (e) => {
        e.stopPropagation(); openRechner(n.dataset.rechner, n.dataset.ziel);
      });
      block.querySelectorAll(".tw-r").forEach(n => n.onclick = () => openRechner(n.dataset.rechner));
      block.querySelectorAll(".tw-w").forEach(n => n.onclick = () => openWissen(n.dataset.wissen));
      host.appendChild(block);
    });

    host.appendChild(el(`<div class="note" style="margin-top:2px">
      Angaben zu Mietrecht und Betriebskosten dienen der Orientierung und ersetzen keine Rechts- oder Steuerberatung.</div>`));
  }

  function openWissen(id) {
    const a = WISSEN.find(x => x.id === id);
    if (!a) return;
    // Lesezeit grob aus der Textlänge (rund 200 Wörter je Minute)
    const woerter = a.inhalt.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    const minuten = Math.max(1, Math.round(woerter / 200));
    const thema = THEMEN.find(t => (t.wissen || []).includes(a.id));
    const passende = RECHNER.filter(r => r.kat === a.kat ||
      (thema && r.kat === thema.id)).slice(0, 2);

    const body = `
      <div class="wi-kopf">
        <div class="wi-meta">
          ${thema ? `<span class="wi-tag">${esc(thema.name)}</span>` : ""}
          <span class="wi-zeit">${minuten} Min. Lesezeit</span>
        </div>
        <div class="wi-lead">${esc(a.kurz)}</div>
      </div>
      <div class="wi-inhalt">${a.inhalt}</div>
      ${passende.length ? `${efTitel("Selbst durchrechnen")}
        <div class="rc-mehr">${passende.map(r => `
          <button class="rc-mehr-i" data-oeffne-rechner="${r.id}">
            <span class="rc-mehr-ic">${svg(r.icon)}</span>
            <span class="rc-mehr-tx"><b>${esc(r.titel)}</b><small>${esc(r.kurz)}</small></span>
          </button>`).join("")}</div>` : ""}
      ${(() => {
        const rest = WISSEN.filter(x => x.kat === a.kat && x.id !== a.id).slice(0, 2);
        return rest.length ? `${efTitel("Weiterlesen")}
          <div class="rc-mehr">${rest.map(x => `
            <button class="rc-mehr-i" data-oeffne-wissen="${x.id}">
              <span class="rc-mehr-ic">${svg(x.icon || "chart")}</span>
              <span class="rc-mehr-tx"><b>${esc(x.titel)}</b><small>${esc(x.kurz)}</small></span>
            </button>`).join("")}</div>` : "";
      })()}`;
    const sheet = openSheet(a.titel, "", body);
    sheet.querySelectorAll("[data-oeffne-rechner]").forEach(b =>
      b.onclick = () => { closeSheet(); setTimeout(() => openRechner(b.dataset.oeffneRechner), 220); });
    sheet.querySelectorAll("[data-oeffne-wissen]").forEach(b =>
      b.onclick = () => { closeSheet(); setTimeout(() => openWissen(b.dataset.oeffneWissen), 220); });
  }

  function openRechner(id, zielId) {
    const r = RECHNER.find(x => x.id === id);
    if (!r) return;
    // Zielgrößen: entweder definiert, oder der Rechner hat nur einen Modus
    const ziele = (ZIELE[r.id] || [{ id: "standard", label: r.titel, frage: r.kurz }])
      .map(z => ({ ...z, felder: z.felder || r.felder, rechne: z.rechne || r.rechne }));
    let aktiv = Math.max(0, ziele.findIndex(z => z.id === zielId));

    const sheet = openSheet(r.titel, "", `<div id="rcBody"></div>`);
    const bodyEl = sheet.querySelector("#rcBody");

    function zeichne() {
      const z = ziele[aktiv];
      bodyEl.innerHTML = `
        ${ziele.length > 1 ? `<div class="rc-ziel">
          <div class="rc-ziel-l">Was möchtest du berechnen?</div>
          <div class="rc-ziel-tabs">${ziele.map((x, i) =>
            `<button class="rc-ziel-t${i === aktiv ? " on" : ""}" data-z="${i}">${esc(x.label)}</button>`).join("")}</div>
        </div>` : ""}
        <div class="rechner-kurz">${esc(z.frage || r.kurz)}</div>
        <div id="rcFelder">${z.felder.map(f => `
          <div class="rc-row">
            <label class="rc-l">${esc(f.label)}${f.hinweis ? `<small>${esc(f.hinweis)}</small>` : ""}</label>
            <div class="rc-feld">
              <input class="ef-i rc-i" type="number" step="any" inputmode="decimal"
                data-f="${f.id}" value="${f.wert}">
              <span class="rc-e">${esc(f.einheit)}</span>
            </div>
          </div>`).join("")}</div>
        <div id="rcErgebnis" class="rc-erg"></div>
        ${verwandtes(r)}`;

      bodyEl.querySelectorAll(".rc-ziel-t").forEach(b => b.onclick = () => {
        aktiv = Number(b.dataset.z); zeichne();
      });
      bodyEl.querySelectorAll("[data-oeffne-wissen]").forEach(b =>
        b.onclick = () => { closeSheet(); setTimeout(() => openWissen(b.dataset.oeffneWissen), 220); });
      bodyEl.querySelectorAll("[data-oeffne-rechner]").forEach(b =>
        b.onclick = () => { closeSheet(); setTimeout(() => openRechner(b.dataset.oeffneRechner), 220); });

      const rechnen = () => {
        const w = {};
        bodyEl.querySelectorAll(".rc-i").forEach(i => {
          w[i.dataset.f] = Number(String(i.value).replace(",", ".")) || 0;
        });
        bodyEl.querySelector("#rcErgebnis").innerHTML = ergebnisHtml(z.rechne(w));
      };
      bodyEl.querySelectorAll(".rc-i").forEach(i => i.addEventListener("input", rechnen));
      rechnen();
    }
    zeichne();
  }

  // Grafik + Zahlen + Fazit eines Rechenergebnisses
  function ergebnisHtml(e) {
    let extra = "";
    if (e.verhaeltnis) extra = `
      <div class="rc-vh"><i class="z" style="width:${e.verhaeltnis.zins.toFixed(1)}%"></i><i class="t" style="width:${e.verhaeltnis.tilgung.toFixed(1)}%"></i></div>
      <div class="rc-leg"><b class="z"></b>Zinsanteil <b class="t"></b>Tilgungsanteil</div>`;
    else if (e.balken != null) extra = `
      <div class="rc-skala"><i style="width:${e.balken.toFixed(1)}%"></i></div>
      <div class="rc-leg-s"><span>0 %</span><span>5 %</span><span>10 %</span></div>`;
    else if (e.verlauf) extra = rcVerlauf(e.verlauf);
    else if (e.stapel) {
      const ges = e.stapel.reduce((a, x) => a + x.v, 0) || 1;
      extra = `<div class="rc-stapel">${e.stapel.map(x =>
        `<i class="f-${x.f}" style="width:${(x.v / ges * 100).toFixed(2)}%" title="${esc(x.l)}"></i>`).join("")}</div>
        <div class="rc-stapel-leg">${e.stapel.map(x =>
        `<span><b class="f-${x.f}"></b>${esc(x.l)}</span>`).join("")}</div>`;
    }
    else if (e.wasserfall) {
      const max = Math.max(...e.wasserfall.map(x => x.v)) || 1;
      extra = `<div class="rc-wf">${e.wasserfall.map(x =>
        `<div class="rc-wf-i">
           <i class="${x.typ}" style="height:${Math.max(5, x.v / max * 100).toFixed(1)}%"></i>
           <span>${esc(x.l)}</span><b>${eur(x.v)}</b>
         </div>`).join("")}</div>`;
    }
    else if (e.faktor != null) {
      const pos = Math.max(0, Math.min(100, (e.faktor - 12) / 28 * 100));
      extra = `<div class="rc-faktor">
          <div class="rc-fk-bar"><i style="left:${pos.toFixed(1)}%"></i></div>
          <div class="rc-fk-marks"><span>12×<small>günstig</small></span><span>20×</span><span>28×</span><span>40×<small>teuer</small></span></div>
        </div>`;
    }
    else if (e.grenzen) {
      const g = e.grenzen, max = Math.max(g.kappung, g.vergleich) || 1;
      const bar = (v, kl, l) => `<div class="rc-vg"><span>${l}</span><i class="${kl}" style="width:${(v / max * 100).toFixed(1)}%"></i><b>${eur(v)}</b></div>`;
      extra = `<div class="rc-verg">${bar(g.aktuell, "grau", "heute")}${bar(g.kappung, "alt", "Kappung")}${bar(g.vergleich, "alt", "Vergleich")}${bar(g.neu, "", "zulässig")}</div>`;
    }
    else if (e.vergleich) {
      const max = Math.max(e.vergleich.a, e.vergleich.b) || 1;
      const f = (v) => e.vergleich.einheit ? Math.round(v) + " " + e.vergleich.einheit : eur(v);
      extra = `<div class="rc-verg">
        <div class="rc-vg"><span>${esc(e.vergleich.la || "Immobilie")}</span><i style="width:${(e.vergleich.a / max * 100).toFixed(1)}%"></i><b>${f(e.vergleich.a)}</b></div>
        <div class="rc-vg"><span>${esc(e.vergleich.lb || "Alternative")}</span><i class="alt" style="width:${(e.vergleich.b / max * 100).toFixed(1)}%"></i><b>${f(e.vergleich.b)}</b></div>
      </div>`;
    }
    // Die erste hervorgehobene Zeile ist die eigentliche Antwort
    const haupt = e.zeilen.find(z => z.gross);
    const rest = e.zeilen.filter(z => z !== haupt);
    return `${haupt ? `<div class="rc-antwort">
        <div class="rc-a-l">${esc(haupt.l)}</div>
        <div class="rc-a-v">${esc(haupt.v)}</div>
      </div>` : ""}
      ${extra}
      <div class="rc-zeilen">${rest.map(z =>
        `<div class="rc-z${z.gross ? " gross" : ""}"><span>${esc(z.l)}</span><b>${esc(z.v)}</b></div>`).join("")}</div>
      <div class="rc-fazit">${esc(e.fazit)}</div>
      ${e.rechtlich ? `<div class="wi-hinweis">Orientierung, keine Rechtsberatung.</div>` : ""}`;
  }

  // Passende Artikel und Rechner unter dem Ergebnis anbieten
  function verwandtes(r) {
    const artikel = WISSEN.filter(a => a.kat === r.kat || (r.kat === "kauf" && a.kat === "grundlagen")).slice(0, 2);
    const andere = RECHNER.filter(x => x.kat === r.kat && x.id !== r.id).slice(0, 2);
    if (!artikel.length && !andere.length) return "";
    return `${efTitel("Passt dazu")}
      <div class="rc-mehr">
        ${artikel.map(a => `<button class="rc-mehr-i" data-oeffne-wissen="${a.id}">
          <span class="rc-mehr-ic">${svg(a.icon || "chart")}</span>
          <span class="rc-mehr-tx"><b>${esc(a.titel)}</b><small>Zum Nachlesen</small></span></button>`).join("")}
        ${andere.map(x => `<button class="rc-mehr-i" data-oeffne-rechner="${x.id}">
          <span class="rc-mehr-ic">${svg(x.icon)}</span>
          <span class="rc-mehr-tx"><b>${esc(x.titel)}</b><small>Rechner</small></span></button>`).join("")}
      </div>`;
  }

  // Kleines Liniendiagramm für den Zinseszins-Verlauf
  function rcVerlauf(werte) {
    const max = Math.max(...werte) || 1, n = werte.length;
    const pkt = werte.map((v, i) => `${(i / (n - 1) * 200).toFixed(1)},${(70 - v / max * 62).toFixed(1)}`).join(" ");
    return `<svg viewBox="0 0 200 72" class="rc-svg" preserveAspectRatio="none">
      <polyline points="${pkt}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg><div class="rc-leg-s"><span>Start</span><span>Ende</span></div>`;
  }
  // Jede Kennzahl bekommt ein kleines "i". Aufbau: Was ist das, wie rechnet ESTRIQ,
  // was ist ein guter Wert, und eine kleine Grafik zur Veranschaulichung.
  const KPI_INFO = {
    einnahmen: {
      titel: "Einnahmen pro Monat",
      kurz: "Was tatsächlich jeden Monat auf dein Konto kommt.",
      text: "Summe aller Mieten aus <b>vermieteten</b> Einheiten. Leerstehende Wohnungen zählen hier nicht mit — die findest du im Potenzial.",
      formel: "Kaltmiete + Nebenkosten (aller vermieteten Einheiten)",
      merke: "Einnahmen sind nicht dein Gewinn. Kreditrate und laufende Kosten gehen noch ab — das siehst du im Netto-Cashflow.",
      grafik: "balken"
    },
    potenzial: {
      titel: "Potenzial pro Monat",
      kurz: "Was möglich wäre, wenn alles vermietet ist.",
      text: "Rechnet alle Einheiten mit, auch die leerstehenden. Die Lücke zu den echten Einnahmen ist dein <b>Leerstandsverlust</b>.",
      formel: "Einnahmen bei Vollvermietung",
      merke: "Jeder Monat Leerstand ist verlorenes Geld, das nicht nachgeholt werden kann.",
      grafik: "luecke"
    },
    cashflow: {
      titel: "Netto-Cashflow",
      kurz: "Was von den Einnahmen nach den Kreditraten übrig bleibt.",
      text: "Von den Einnahmen wird die Kreditrate abgezogen. <b>Laufende Kosten sind nicht abgezogen</b> – Instandhaltung, Verwaltung, nicht umlagefähige Nebenkosten und Steuern kommen noch dazu. Ist die Zahl negativ, legst du schon ohne diese Kosten jeden Monat Geld drauf.",
      formel: "Einnahmen − Kreditraten (Zins und Tilgung)",
      merke: "Ein negativer Cashflow ist nicht automatisch schlecht: Tilgung ist Vermögensaufbau. Aber du musst ihn dir leisten können.",
      grafik: "wasserfall"
    },
    rendite: {
      titel: "Bruttomietrendite",
      kurz: "Wie viel Prozent deines Kaufpreises die Miete jährlich einbringt.",
      text: "Die Standardkennzahl zum Vergleichen von Objekten. Sie sagt nichts über Kosten oder Finanzierung — dafür ist sie schnell und überall gleich gerechnet.",
      formel: "(Jahreskaltmiete ÷ Investition) × 100",
      merke: "Als grobe Orientierung: unter 4 % wird es in der Regel schwer, positiven Cashflow zu erreichen. Ab etwa 6 % wird es interessant. Die Lage entscheidet mit.",
      grafik: "skala"
    },
    auslastung: {
      titel: "Auslastung",
      kurz: "Wie viele deiner Einheiten vermietet sind.",
      text: "Verhältnis von vermieteten zu allen Einheiten. Schon eine leere Wohnung von fünf drückt deine Einnahmen um rund 20 Prozent.",
      formel: "(Vermietete Einheiten ÷ alle Einheiten) × 100",
      merke: "Dauerhafter Leerstand hat fast immer einen von drei Gründen: zu hoher Preis, schlechter Zustand oder schwache Lage.",
      grafik: "kreis"
    },
    restschuld: {
      titel: "Restschuld",
      kurz: "Was du der Bank aktuell noch schuldest.",
      text: "Summe aller offenen Kredite. Sie sinkt mit jeder Tilgungsrate und mit Sondertilgungen.",
      formel: "Ursprungsdarlehen − geleistete Tilgung",
      merke: "Die Restschuld allein sagt wenig. Entscheidend ist, ob der Wert der Immobilie darüber liegt und ob du die Rate tragen kannst.",
      grafik: "abbau"
    },
    tilgung: {
      titel: "Tilgung pro Monat",
      kurz: "Der Teil deiner Rate, der die Schulden verringert.",
      text: "Deine Kreditrate besteht aus Zins und Tilgung. Nur die Tilgung baut Vermögen auf — der Zins ist der Preis fürs Geliehene.",
      formel: "Kreditrate − Zinsanteil",
      merke: "Am Anfang der Laufzeit ist der Zinsanteil hoch. Mit jeder Rate verschiebt sich das Verhältnis zugunsten der Tilgung.",
      grafik: "zinstilgung"
    },
    invest: {
      titel: "Investition",
      kurz: "Was dich das Objekt insgesamt gekostet hat.",
      text: "Kaufpreis plus Kaufnebenkosten: Grunderwerbsteuer, Notar, Grundbuch und gegebenenfalls Makler. Basis für alle Renditekennzahlen.",
      formel: "Kaufpreis + Kaufnebenkosten",
      merke: "Die Kaufnebenkosten liegen in Deutschland je nach Bundesland bei etwa 9 bis 15 Prozent. Wer sie weglässt, rechnet sich die Rendite schön.",
      grafik: "anteile"
    },
    roi: {
      titel: "Cashflow-ROI",
      kurz: "Wie stark sich dein eingesetztes Kapital verzinst.",
      text: "Setzt den jährlichen Netto-Cashflow ins Verhältnis zur Investition. Anders als die Bruttorendite berücksichtigt er die Finanzierung.",
      formel: "(Netto-Cashflow × 12 ÷ Investition) × 100",
      merke: "Vergleich diesen Wert mit dem, was dein Geld woanders bringen würde — das nennt man Opportunitätskosten.",
      grafik: "skala"
    },
    nkpuffer: {
      titel: "Nebenkosten-Rücklage",
      kurz: "Was du für Betriebskosten zurücklegst.",
      text: "Nebenkosten sind durchlaufende Posten: Dein Mieter zahlt sie voraus, du gibst sie für Heizung, Wasser, Müll und Versicherung wieder aus.",
      formel: "Nebenkostenvorauszahlungen der Mieter",
      merke: "Nebenkosten als Gewinn zu zählen ist der häufigste Rechenfehler von Vermietern. Am Jahresende sind sie meist weg.",
      grafik: "durchlauf"
    }
  };

  // Kleine Grafiken zu den Erklärungen (schlicht, ohne Zusatzbibliothek)
  function infoGrafik(art) {
    const g = (inhalt) => `<div class="ig">${inhalt}</div>`;
    switch (art) {
      case "balken": return g(`
        <div class="ig-bal"><span style="height:78%"></span><span style="height:88%"></span><span style="height:84%"></span><span style="height:92%"></span></div>
        <div class="ig-cap">Monatliche Mieteingänge</div>`);
      case "luecke": return g(`
        <div class="ig-stack"><div class="ig-voll"><i style="width:100%"></i><span>Potenzial</span></div>
          <div class="ig-voll"><i class="ist" style="width:80%"></i><span>tatsächlich</span></div></div>
        <div class="ig-cap">Die Lücke ist dein Leerstand</div>`);
      case "wasserfall": return g(`
        <div class="ig-wf">
          <div class="ig-wf-i"><b>+</b><i style="height:100%"></i><span>Miete</span></div>
          <div class="ig-wf-i"><b>−</b><i class="ab" style="height:58%"></i><span>Rate</span></div>
          <div class="ig-wf-i"><b>=</b><i class="rest" style="height:42%"></i><span>übrig</span></div>
        </div>
        <div class="ig-cap">Von der Miete zur Rate zum Rest</div>`);
      case "skala": return g(`
        <div class="ig-skala"><div class="ig-sk-bar"><i></i></div>
          <div class="ig-sk-marks"><span>0 %</span><span>4 %</span><span>6 %</span><span>10 %</span></div></div>
        <div class="ig-cap">Grobe Einordnung — die Lage entscheidet mit</div>`);
      case "kreis": return g(`
        <div class="ig-kreis" style="--p:80"><div class="ig-kr-in">80<small>%</small></div></div>
        <div class="ig-cap">4 von 5 Einheiten vermietet</div>`);
      case "abbau": return g(`
        <svg viewBox="0 0 200 70" class="ig-svg"><path d="M0,12 C60,16 120,42 200,62" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
        <div class="ig-cap">Restschuld sinkt mit jeder Rate</div>`);
      case "zinstilgung": return g(`
        <div class="ig-zt">
          <div class="ig-zt-r"><span>Jahr 1</span><i class="z" style="width:70%"></i><i class="t" style="width:30%"></i></div>
          <div class="ig-zt-r"><span>Jahr 10</span><i class="z" style="width:48%"></i><i class="t" style="width:52%"></i></div>
          <div class="ig-zt-r"><span>Jahr 20</span><i class="z" style="width:22%"></i><i class="t" style="width:78%"></i></div>
        </div>
        <div class="ig-leg"><b class="z"></b>Zins <b class="t"></b>Tilgung</div>`);
      case "anteile": return g(`
        <div class="ig-anteil"><i style="width:88%">Kaufpreis</i><i class="nk" style="width:12%">NK</i></div>
        <div class="ig-cap">Kaufnebenkosten: rund 9 – 15 %</div>`);
      case "durchlauf": return g(`
        <div class="ig-durch"><span>Mieter zahlt</span><b>→</b><span>du legst zurück</span><b>→</b><span>Versorger</span></div>
        <div class="ig-cap">Durchlaufender Posten, kein Gewinn</div>`);
      default: return "";
    }
  }

  function openInfoSheet(schluessel) {
    const i = KPI_INFO[schluessel];
    if (!i) return;
    const body = `
      <div class="info-kopf">
        <div class="info-kurz">${esc(i.kurz)}</div>
      </div>
      ${infoGrafik(i.grafik)}
      <p class="info-text">${i.text}</p>
      <div class="info-formel"><span>So rechnet ESTRIQ</span><b>${esc(i.formel)}</b></div>
      <div class="info-merke"><span>Merke</span>${esc(i.merke)}</div>
      <button class="wc-cta" id="infoTools" style="margin-top:20px">Passende Rechner öffnen</button>`;
    const sheet = openSheet(i.titel, "", body);
    sheet.querySelector("#infoTools").onclick = () => { closeSheet(); route("tools"); };
  }

  // Kleines "i" für eine Kennzahl
  function infoIcon(schluessel) {
    return KPI_INFO[schluessel]
      ? `<button type="button" class="kpi-i" data-info="${schluessel}" aria-label="Erklärung: ${esc(KPI_INFO[schluessel].titel)}" title="Was bedeutet das?">i</button>`
      : "";
  }

  // Kennzahl-Karte: Beschriftung, große Zahl, Erläuterung. Überall gleich aufgebaut.
  // (icon bleibt als Parameter erhalten, wird aber nicht mehr gezeichnet.)
  function kpiCard(icon, num, lab, desc, accent, action, info) {
    return `<div class="card kpi${accent ? ' accent' : ''}${action ? ' clickable' : ''}"${action ? ` data-act="${action}" role="button" tabindex="0"` : ''}>
      ${infoIcon(info)}
      <div class="lab">${esc(lab)}</div>
      <div class="num" style="--eq-z:${String(num == null ? "" : num).length}">${esc(num)}</div>
      <div class="desc">${esc(desc)}</div>
      ${action ? '<span class="tapme" aria-hidden="true">›</span>' : ''}</div>`;
  }
  // verdrahtet [data-act] innerhalb eines Containers
  function wireActs(node, map) {
    node.querySelectorAll("[data-act]").forEach(n => {
      const fn = map[n.dataset.act];
      if (!fn) return;
      // Das Info-Symbol auf der Karte öffnet nur die Erklärung, nicht zusätzlich die Karte
      n.onclick = (e) => { if (e && e.target && e.target.closest && e.target.closest("[data-info]")) return; fn(e); };
      // Mit der Tastatur: Enter oder Leertaste auf der Karte selbst
      n.onkeydown = (e) => { if ((e.key === "Enter" || e.key === " ") && e.target === n) { e.preventDefault(); fn(e); } };
    });
    return node;
  }

  // SVG area+line chart from values
  function areaChart(values, labels, markerIndex) {
    const W = 720, H = 220, pad = 16;
    if (!values.length) return `<div class="note">Keine Daten.</div>`;
    const max = Math.max(...values) * 1.12, min = Math.min(...values, 0) * 0.9;
    const span = (max - min) || 1;
    const n = values.length;
    const x = i => pad + i * (W - pad * 2) / (n - 1 || 1);
    const y = v => H - pad - (v - min) / span * (H - pad * 2);
    const pts = values.map((v, i) => [x(i), y(v)]);
    // smooth path
    let dLine = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i - 1], [cx, cy] = pts[i];
      const mx = (px + cx) / 2;
      dLine += ` C ${mx},${py} ${mx},${cy} ${cx},${cy}`;
    }
    const dArea = dLine + ` L ${pts[n - 1][0]},${H - pad} L ${pts[0][0]},${H - pad} Z`;
    const gridY = [0.25, 0.5, 0.75].map(f => `<line class="grid-l" x1="${pad}" x2="${W - pad}" y1="${pad + f * (H - pad * 2)}" y2="${pad + f * (H - pad * 2)}"/>`).join("");
    const last = pts[n - 1];
    const xlabs = labels ? `<div class="chart-x">${labels.map(l => `<span>${esc(l)}</span>`).join("")}</div>` : "";
    // "Heute"-Marker
    let marker = "", heute = "";
    if (markerIndex != null && markerIndex >= 0 && markerIndex < n) {
      const mp = pts[markerIndex];
      marker = `<line x1="${mp[0]}" x2="${mp[0]}" y1="${pad}" y2="${H - pad}" stroke="var(--mint-2)" stroke-width="1.5" stroke-dasharray="4 4" opacity=".7"/>
        <circle cx="${mp[0]}" cy="${mp[1]}" r="5" fill="var(--mint-2)" stroke="var(--panel-solid)" stroke-width="2"/>`;
      const anteil = mp[0] / W * 100;
      heute = `<span class="chart-heute${anteil > 82 ? " links" : ""}" style="left:${anteil.toFixed(2)}%">heute</span>`;
    }
    return `<div class="chart-wrap">
      <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:220px">
        <defs><linearGradient id="mintFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="color-mix(in srgb,var(--mint) 34%,transparent)"/><stop offset="100%" stop-color="transparent"/>
        </linearGradient></defs>
        ${gridY}
        <path class="area" d="${dArea}"/>
        <path class="line" d="${dLine}"/>
        ${marker}
        <circle class="dot lastdot" cx="${last[0]}" cy="${last[1]}" r="4.5"/>
      </svg>${heute}${xlabs}</div>`;
  }

  // Donut chart (composition)
  function donut(segments, size) {
    const S = size || 168, r = S / 2 - 14, cx = S / 2, cy = S / 2, C = 2 * Math.PI * r;
    const total = segments.reduce((a, s) => a + s.value, 0) || 1;
    let off = 0;
    const rings = segments.map(s => {
      const frac = s.value / total, len = frac * C;
      const ring = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" style="stroke:${s.color}" stroke-width="14"
        stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cy})" stroke-linecap="butt"/>`;
      off += len; return ring;
    }).join("");
    return `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" class="donut">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="14"/>
      ${rings}
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="var(--text)" font-family="var(--fdisp)" font-size="26" font-weight="600">${eur(total).replace(/\s?€/, "")}</text>
      <text x="${cx}" y="${cy + 17}" text-anchor="middle" fill="var(--soft)" font-size="13">€ / Monat</text>
    </svg>`;
  }

  // Liest eine CSS-Variable des aktuellen Schemas
  function cssVar(name, fallback) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (_) { return fallback; }
  }
  // Farben für Diagrammreihen: Akzent für die Hauptreihe, neutrale Töne für Vergleichswerte.
  // Es sind Verweise auf Variablen – sie folgen dem Schema von selbst.
  const PALETTE = ["var(--eq-reihe-1)", "var(--eq-reihe-2)", "var(--eq-reihe-3)",
    "var(--eq-reihe-4)", "var(--eq-reihe-5)", "var(--eq-reihe-6)"];

  /* ---------- SHEET (Detail-Overlay) ---------- */
  function openSheet(title, subtitle, bodyHtml) {
    // Es gibt immer nur ein Fenster: Ein neues ersetzt das alte sofort.
    document.removeEventListener("keydown", sheetEsc);
    // Ersetzt das neue Fenster ein altes, erbt es dessen Rückweg: Nach dem Schließen steht der Fokus dort, wo alles begann.
    const vorgaenger = $(".sheet-bd");
    const erbe = vorgaenger && (vorgaenger._zurueck || vorgaenger._weg) ? { z: vorgaenger._zurueck, weg: vorgaenger._weg } : null;
    $$(".sheet-bd").forEach(n => n.remove());
    const bd = el(`<div class="sheet-bd on">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}" tabindex="-1">
        <div class="sheet-grip"></div>
        <div class="sheet-h">
          <div class="eq-kopf"><div class="sheet-t">${esc(title)}</div>
            ${subtitle ? `<div class="sheet-s">${esc(subtitle)}</div>` : ""}</div>
          <button type="button" class="sheet-x" aria-label="Schließen">×</button>
        </div>
        <div class="sheet-b">${bodyHtml}<div class="eq-fuss"></div></div>
      </div></div>`);
    document.body.appendChild(bd);
    // Geänderte Felder merken: Wer das Fenster dann schließt, wird gefragt.
    // Zählt: Formularfelder und die Eingabe im Assistenten. Rechner zählen nicht.
    const merken = (e) => { if (e.target && e.target.closest && e.target.closest("[data-f]:not(.rc-i), .as-i")) bd._geaendert = true; };
    bd.addEventListener("input", merken);
    bd.addEventListener("change", merken);
    bd.addEventListener("click", e => { if (e.target === bd) sheetZu(bd); });
    bd.querySelector(".sheet-x").onclick = () => sheetZu(bd);
    // Mac: Enter in einem einzeiligen Feld speichert. Am Handy und iPad nicht –
    // dort würde die Eingabetaste der Bildschirmtastatur sonst ungewollt speichern.
    bd.addEventListener("keydown", e => {
      if (e.key === "Tab") { fokusImFenster(bd, e); return; }
      if (e.key !== "Enter" || !e.target || !e.target.matches || !e.target.matches("input[data-f]")) return;
      if (!feinerZeiger()) return;
      const s = bd.querySelector("#efSave") || bd.querySelector(".ef-save");
      if (s && !s.disabled) { e.preventDefault(); s.click(); }
    });
    // Ein Feld, das den Fokus bekommt, darf nicht unter der festen Aktionsleiste liegen
    const inhalt = bd.querySelector(".sheet-b");
    const leiste = inhalt.querySelector(".ef-actions.eq-fest");
    if (leiste) {
      inhalt.style.scrollPaddingBottom = (leiste.offsetHeight + 12) + "px";
      bd.addEventListener("focusin", e => {
        if (!e.target || leiste.contains(e.target) || !inhalt.contains(e.target)) return;
        requestAnimationFrame(() => {
          const f = e.target.getBoundingClientRect(), oben = inhalt.getBoundingClientRect().top, grenze = leiste.getBoundingClientRect().top;
          if (f.bottom > grenze - 12) inhalt.scrollTop += Math.min(f.bottom - grenze + 12, Math.max(0, f.top - oben - 8));
          else if (f.top < oben + 8) inhalt.scrollTop -= oben + 8 - f.top;
        });
      });
    }
    document.addEventListener("keydown", sheetEsc);
    // Mac: Der Fokus wandert ins Fenster, damit die Tabulatortaste dort weitergeht.
    // Am Handy und iPad nicht – dort würde sonst die Tastatur aufgehen oder die Seite springen.
    if (feinerZeiger()) {
      const a = document.activeElement;
      if (erbe && (!a || a === document.body)) { bd._zurueck = erbe.z; bd._weg = erbe.weg; }
      else { bd._zurueck = a; bd._weg = fokusWeg(a); }
      try { bd.querySelector(".sheet").focus({ preventScroll: true }); } catch (_) {}
    }
    return bd;
  }
  const feinerZeiger = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  // Tabulator bleibt im Fenster: nach dem letzten Element geht es mit dem ersten weiter
  function fokusImFenster(bd, e) {
    const alle = [...bd.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter(n => !n.disabled && n.type !== "hidden" && n.getClientRects().length);
    if (!alle.length) return;
    const erst = alle[0], letzt = alle[alle.length - 1], jetzt = document.activeElement;
    if (e.shiftKey && (jetzt === erst || !bd.contains(jetzt) || jetzt === bd.querySelector(".sheet"))) { e.preventDefault(); letzt.focus(); }
    else if (!e.shiftKey && jetzt === letzt) { e.preventDefault(); erst.focus(); }
  }
  function sheetEsc(e) {
    if (e.key !== "Escape") return;
    const bd = $(".sheet-bd.on");
    const frage = bd && bd.querySelector(".eq-frage");
    if (frage) { frage.remove(); return; }
    sheetZu(bd);
  }
  // Schließen durch den Nutzer (X, Fläche daneben, Escape):
  // Bei ungespeicherten Änderungen erst fragen. closeSheet() selbst fragt nie.
  function sheetZu(bd) {
    if (!bd || !bd._geaendert) { closeSheet(); return; }
    const sheet = bd.querySelector(".sheet");
    if (sheet.querySelector(".eq-frage")) return;
    const frage = el(`<div class="eq-frage" role="alertdialog" aria-label="Änderungen verwerfen?">
      <span>Änderungen verwerfen?</span>
      <button type="button" class="eq-btn zweit" data-frage="weg">Verwerfen</button>
      <button type="button" class="eq-btn" data-frage="bleiben">Weiter bearbeiten</button>
    </div>`);
    sheet.appendChild(frage);
    frage.querySelector('[data-frage="weg"]').onclick = () => closeSheet();
    frage.querySelector('[data-frage="bleiben"]').onclick = () => frage.remove();
    if (feinerZeiger()) { try { frage.querySelector('[data-frage="bleiben"]').focus(); } catch (_) {} }
  }
  function closeSheet() {
    document.removeEventListener("keydown", sheetEsc);
    $$(".sheet-bd").forEach(n => {
      n.classList.remove("on");
      n.classList.add("eq-zu");
      setTimeout(() => n.remove(), 200);
      // Fokus zurück an die Stelle, von der das Fenster geöffnet wurde
      const z = n._zurueck;
      if (z && z.focus && document.contains(z) && !z.closest(".sheet-bd")) { try { z.focus({ preventScroll: true }); } catch (_) {} }
      else if (n._weg) fokusAufWeg(n._weg);   // die Ansicht wurde inzwischen neu gezeichnet: dieselbe Stelle suchen
    });
  }
  /* ---------- BEARBEITEN: Formular-Bausteine ---------- */
  // Einzelnes Eingabefeld
  function ef(label, name, wert, typ, opt) {
    opt = opt || {};
    const v = (wert === null || wert === undefined) ? "" : wert;
    // Zahlenfelder öffnen am Handy die Zahlentastatur (bei Beträgen mit Komma).
    // opt.minus: Feld darf negativ sein (Gutschrift) – die Zahlentastatur am iPhone hat kein Minus, also normale Tastatur.
    const step = typ === "number"
      ? ` step="${opt.step || "0.01"}"${opt.minus ? "" : ` inputmode="${String(opt.step || "") === "1" ? "numeric" : "decimal"}"`}` : "";
    const ph = opt.platzhalter ? ` placeholder="${esc(opt.platzhalter)}"` : "";
    return `<div class="ef-row">
      <label class="ef-l" for="ef-${name}">${esc(label)}${opt.pflicht ? ' <span class="ef-req">*</span>' : ""}</label>
      <div class="${opt.einheit ? "ef-mit-e" : ""}">
        <input class="ef-i" id="ef-${name}" data-f="${name}"${opt.pflicht ? ' data-pflicht="1" aria-required="true"' : ""}${opt.min != null ? ` min="${opt.min}"` : ""}${opt.max != null ? ` max="${opt.max}"` : ""} type="${typ || "text"}"${step}${ph}
               value="${esc(v)}"${opt.readonly ? " readonly" : ""}>
        ${opt.einheit ? `<span class="ef-e">${esc(opt.einheit)}</span>` : ""}
      </div>
      ${opt.hinweis ? `<div class="ef-h">${esc(opt.hinweis)}</div>` : ""}
    </div>`;
  }
  // Auswahlfeld
  function efSel(label, name, wert, optionen, opt) {
    opt = opt || {};
    return `<div class="ef-row">
      <label class="ef-l" for="ef-${name}">${esc(label)}</label>
      <select class="ef-i" id="ef-${name}" data-f="${name}">
        ${optionen.map(o => `<option value="${esc(o.v)}"${o.v === wert ? " selected" : ""}>${esc(o.t)}</option>`).join("")}
      </select>
      ${opt.hinweis ? `<div class="ef-h">${esc(opt.hinweis)}</div>` : ""}
    </div>`;
  }
  // Mehrzeiliges Feld
  function efArea(label, name, wert, opt) {
    opt = opt || {};
    return `<div class="ef-row">
      <label class="ef-l" for="ef-${name}">${esc(label)}</label>
      <textarea class="ef-i" id="ef-${name}" data-f="${name}" rows="3">${esc(wert || "")}</textarea>
      ${opt.hinweis ? `<div class="ef-h">${esc(opt.hinweis)}</div>` : ""}
    </div>`;
  }
  // Abschnittsüberschrift im Formular
  const efTitel = (t) => `<div class="ef-sec">${esc(t)}</div>`;
  // Knopfleiste: bleibt am unteren Rand des Fensters stehen, die Meldung direkt darüber.
  function efAktionen(opt) {
    opt = opt || {};
    return `<div class="ef-actions eq-fest">
      <div class="ef-msg" id="efMsg" role="status"></div>
      <div class="ef-knoepfe">
        <button type="button" class="ef-save" id="efSave">${esc(opt.speichern || "Speichern")}</button>
        ${opt.loeschen ? `<button type="button" class="ef-del" id="efDel">${esc(opt.loeschen)}</button>` : ""}
      </div>
    </div>`;
  }
  // Werte aus dem Formular auslesen
  function efWerte(wurzel) {
    const o = {};
    wurzel.querySelectorAll("[data-f]").forEach(n => { o[n.dataset.f] = n.value; });
    return o;
  }
  const zahl = v => (v === "" || v === null || v === undefined) ? null : Number(v);
  const text = v => (v === "" || v === null || v === undefined) ? null : String(v).trim();

  // Felder prüfen, bevor gespeichert wird: Pflichtfelder gefüllt, Zahlen in ihren Grenzen.
  // Der Hinweis steht direkt am Feld, das erste betroffene Feld rückt ins Bild.
  function efPflichtOk(sheet) {
    let erstes = null;
    sheet.querySelectorAll(".ef-row").forEach(zeile => {
      const alt = zeile.querySelector(".ef-fehler"); if (alt) alt.remove();
      const f = zeile.querySelector("input.ef-i, select.ef-i, textarea.ef-i");
      if (!f) return;
      f.classList.remove("eq-fehlt"); f.removeAttribute("aria-invalid"); f.removeAttribute("aria-describedby");
      const wert = String(f.value || "").trim();
      let fehler = "";
      if (wert === "") { if (f.hasAttribute("data-pflicht")) fehler = "Bitte ausfüllen."; }
      // Zahlen nur prüfen, wenn das Feld geändert wurde – ein alter Wert blockiert nicht das Speichern von etwas anderem
      else if (f.type === "number" && f.value !== f.defaultValue && (f.min !== "" || f.max !== "" || f.step === "1")) {
        const z = Number(wert), min = f.min !== "" ? Number(f.min) : null, max = f.max !== "" ? Number(f.max) : null;
        if (f.step === "1" && !Number.isInteger(z)) fehler = "Bitte eine ganze Zahl eingeben.";
        else if ((min != null && z < min) || (max != null && z > max))
          fehler = min != null && max != null ? "Bitte eine Zahl von " + min + " bis " + max + " eingeben."
            : min === 0 ? "Bitte keine negative Zahl eingeben."
            : min != null ? "Bitte mindestens " + min + " eingeben." : "Bitte höchstens " + max + " eingeben.";
      }
      if (!fehler) return;
      const id = "ef-fehler-" + (f.dataset.f || "");
      f.classList.add("eq-fehlt"); f.setAttribute("aria-invalid", "true"); f.setAttribute("aria-describedby", id);
      zeile.appendChild(el(`<div class="ef-fehler" id="${id}" role="alert">${fehler}</div>`));
      if (!erstes) erstes = f;
    });
    // Sobald ein markiertes Feld geändert wird, verschwindet der Hinweis wieder
    if (!sheet._pflichtHoert) {
      sheet._pflichtHoert = true;
      sheet.addEventListener("input", e => {
        const f = e.target;
        if (!f || !f.classList || !f.classList.contains("eq-fehlt")) return;
        f.classList.remove("eq-fehlt"); f.removeAttribute("aria-invalid"); f.removeAttribute("aria-describedby");
        const h = f.closest(".ef-row") && f.closest(".ef-row").querySelector(".ef-fehler"); if (h) h.remove();
        // Ist nichts mehr markiert, verschwindet auch die Meldung über den Knöpfen
        const m = sheet.querySelector("#efMsg");
        if (m && !sheet.querySelector(".eq-fehlt") && m.classList.contains("bad")) { m.textContent = ""; m.className = "ef-msg"; }
      });
    }
    if (erstes) {
      const b = sheet.querySelector(".sheet-b");
      if (b) b.scrollTop += erstes.getBoundingClientRect().top - b.getBoundingClientRect().top - 72;
      try { erstes.focus({ preventScroll: true }); } catch (_) {}
    }
    return !erstes;
  }

  // Speichern-Knopf verdrahten, inkl. Fehleranzeige
  function efBind(sheet, speichernFn, loeschenFn, loeschFrage, nachErfolg) {
    const msg = sheet.querySelector("#efMsg");
    const btn = sheet.querySelector("#efSave");
    if (btn) btn.onclick = async () => {
      if (istGesperrt()) { closeSheet(); openUpgradeSheet("gesperrt"); return; }
      if (!efPflichtOk(sheet)) { msg.textContent = "Bitte prüfe die markierten Felder."; msg.className = "ef-msg bad"; return; }
      msg.textContent = "Speichere…"; msg.className = "ef-msg";
      btn.disabled = true;
      try { await speichernFn(efWerte(sheet)); }
      catch (e) {
        msg.textContent = window.fehlerText(e);
        msg.className = "ef-msg bad";
        btn.disabled = false;
        return;
      }
      closeSheet();
      try { await window.nachSpeichern(); }
      catch (_) { showToast(NEULADEN_HINWEIS); return; }
      if (nachErfolg) nachErfolg(); else showToast("Gespeichert.");
    };
    const del = sheet.querySelector("#efDel");
    if (del && loeschenFn) del.onclick = async () => {
      if (istGesperrt()) { closeSheet(); openUpgradeSheet("gesperrt"); return; }
      if (del.dataset.sicher !== "1") {
        const beschriftung = del.textContent;
        del.dataset.sicher = "1";
        del.textContent = loeschFrage || "Wirklich löschen?";
        del.classList.add("armed");
        setTimeout(() => {
          if (del.dataset.sicher === "1") {
            del.dataset.sicher = ""; del.textContent = beschriftung; del.classList.remove("armed");
          }
        }, 4000);
        return;
      }
      msg.textContent = "Lösche…"; msg.className = "ef-msg";
      del.disabled = true;
      try { await loeschenFn(); }
      catch (e) {
        msg.textContent = window.fehlerText(e);
        msg.className = "ef-msg bad";
        del.disabled = false;
        return;
      }
      closeSheet();
      try { await window.nachSpeichern(); showToast("Gelöscht."); }
      catch (_) { showToast(NEULADEN_HINWEIS); }
    };
  }

  const kv = (k, v, muted) => `<div class="kv${muted ? " muted" : ""}"><span>${esc(k)}</span><b>${v}</b></div>`;
  function miniBars(rows) {
    const max = Math.max(...rows.map(r => r.value), 1);
    return `<div class="mini">${rows.map(r => `<div class="mini-row">
      <span class="mini-lab">${esc(r.label)}</span>
      <span class="mini-track"><span style="width:${Math.round(r.value / max * 100)}%;background:${r.color || "var(--eq-reihe-1)"}"></span></span>
      <span class="mini-val">${r.display || eur(r.value)}</span></div>`).join("")}</div>`;
  }

  /* ---------- INTELLIGENTE SUCHE ---------- */
  // Baut eine durchsuchbare Wissensbasis aus allen Dashboard-Daten
  function wissensBasis() {
    const eintraege = [];
    const t = FE.totals(D);
    const add = (titel, wert, detail, worte, aktion) =>
      eintraege.push({ titel, wert, detail, worte: worte.toLowerCase(), aktion });

    // Portfolio-Kennzahlen
    let debtMonth = 0, debtRest = 0, units = 0, let_ = 0;
    (D.streams || []).forEach(s => {
      (s.einheiten || []).forEach(u => { units++; if (u.status === "vermietet") let_++; });
      FE.creditsOf(s).forEach(kr => {
        debtMonth += Number(kr.abtragMonat) || 0;
        const p = FE.creditPlan(kr); debtRest += p ? p.restAktuell : 0;
      });
    });
    add("Einnahmen gesamt", eur(t.ist), "pro Monat über alle Objekte",
        "einnahmen gesamt monat portfolio umsatz miete summe wieviel verdiene ich einnahme",
        () => route("overview"));
    add("Einnahmen pro Jahr", eur(t.jahrIst), "hochgerechnet",
        "einnahmen jahr jaehrlich jährlich hochgerechnet", () => route("overview"));
    add("Netto-Cashflow", eur(t.ist - debtMonth), "nach allen Kreditraten",
        "netto cashflow überschuss gewinn nach tilgung übrig bleibt",
        () => route("overview"));
    add("Auslastung", Math.round(let_ / (units || 1) * 100) + " %",
        let_ + " von " + units + " Einheiten vermietet",
        "auslastung vermietet frei leer quote wieviele wohnungen",
        () => route("overview"));
    add("Restschuld", eur(debtRest), "über alle Kredite",
        "restschuld schulden kredit darlehen offen rest tilgung schuld",
        () => route("overview"));
    add("Tilgung pro Monat", eur(debtMonth), "alle Kreditraten zusammen",
        "tilgung rate monatlich kredit zahlung abtrag", () => route("overview"));
    add("Potenzial", eur(t.potenzial), "bei Vollvermietung möglich",
        "potenzial möglich maximal vollvermietung upside luft nach oben",
        () => route("overview"));

    // je Objekt
    (D.streams || []).forEach(s => {
      const m = FE.streamMonthly(s);
      add(s.name, eur(m.gesamt), "Einnahmen pro Monat" + (s.ort ? " · " + s.ort : ""),
          s.name + " " + (s.ort || "") + " " + s.kind + " objekt einnahmen",
          () => route(s.id));

      if (s.kind === "miete" && s.invest) {
        const k = FE.immoKPIs(s);
        add("Rendite " + shortLabel(s.name), k.bruttoRendite.toLocaleString("de-DE") + " %",
            "Bruttomietrendite · Cashflow-ROI " + k.cashflowRoi.toLocaleString("de-DE") + " %",
            "rendite " + s.name + " roi ertrag verzinsung prozent", () => route(s.id));
      }
      if (m.nkPuffer) {
        add("Nebenkosten " + shortLabel(s.name), eur(m.nkPuffer), "Rücklage pro Monat",
            "nebenkosten nk puffer rücklage " + s.name, () => route(s.id));
      }

      // Wohneinheiten und Mieter
      (s.einheiten || []).forEach(u => {
        const inc = FE.unitIncome(u);
        const warm = eur(inc.gesamt);
        if (u.mieter) {
          add(u.mieter, warm, u.wohnung + " · " + u.flaeche + " m² · " + shortLabel(s.name)
              + (u.einzug ? " · Einzug " + dateDE(u.einzug) : ""),
              u.mieter + " " + u.wohnung + " mieter wohnt miete zahlt " + s.name,
              () => { route(s.id); setTimeout(() => openUnitSheet(s, u), 260); });
        } else {
          add(u.wohnung + " (frei)", warm, "würde " + warm + " bringen · "
              + u.flaeche + " m² · " + shortLabel(s.name),
              u.wohnung + " frei leer unvermietet " + s.name,
              () => { route(s.id); setTimeout(() => openUnitSheet(s, u), 260); });
        }
      });

      // Kredite
      FE.creditsOf(s).forEach(kr => {
        const p = FE.creditPlan(kr);
        add(kr.name, eur(p.restAktuell),
            "Restschuld · " + eur(kr.abtragMonat) + "/Monat · " + kr.zinsPa.toLocaleString("de-DE")
            + " % · abbezahlt " + (p.abzahlDatum ? monthYear(p.abzahlDatum) : "—"),
            kr.name + " kredit darlehen restschuld zins laufzeit " + s.name,
            () => { route(s.id); setTimeout(() => openCreditSheet(kr), 260); });
      });
    });

    // Termine
    (D.termine || []).forEach(tm => {
      add(tm.titel, dateDE(tm.datum), tm.info || "",
          tm.titel + " " + (tm.info || "") + " termin datum wann einzug zahlung",
          () => route("overview"));
    });
    return eintraege;
  }

  // Bewertet, wie gut ein Eintrag zur Frage passt
  // Wörter, die in Fragen häufig vorkommen und nichts zur Auswahl beitragen
  const STOPP = new Set(["was", "wer", "wie", "wo", "wann", "welche", "welcher", "welches",
    "der", "die", "das", "den", "dem", "ein", "eine", "einen", "ist", "sind", "hat",
    "habe", "haben", "wird", "werden", "für", "von", "mit", "und", "oder", "ich", "mir",
    "mein", "meine", "viel", "hoch", "aktuell", "gerade", "bitte", "zeig", "zeige"]);

  function bewerte(eintrag, frage) {
    const q = frage.toLowerCase().replace(/[?.,!]/g, " ");
    const roh = q.split(/\s+/).filter(w => w.length > 1);
    const woerter = roh.filter(w => !STOPP.has(w) && w.length > 2);
    if (!woerter.length && !roh.length) return 0;
    let score = 0;
    const titel = eintrag.titel.toLowerCase();
    const heu = (eintrag.titel + " " + eintrag.worte + " " + eintrag.detail).toLowerCase();

    // Wohnungsnummern gezielt behandeln: "we 2" / "we2" / "wohnung 2"
    const nr = q.match(/\b(?:we|wohnung|einheit)\s*(\d+)\b/);
    if (nr) {
      const treffer = new RegExp("we\\s*" + nr[1] + "\\b").test(heu);
      if (treffer) score += 30; else score -= 6;
    }
    woerter.forEach(w => {
      if (titel.includes(w)) score += 10;
      else if (heu.includes(w)) score += 4;
      else if (w.length > 4) {
        const stamm = w.slice(0, Math.max(4, w.length - 2));
        if (heu.includes(stamm)) score += 2;
      }
    });
    return score;
  }

  function sucheAntwort(frage) {
    const basis = wissensBasis();
    const treffer = basis
      .map(e => ({ e, score: bewerte(e, frage) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
    return treffer;
  }

  function searchCard() {
    const card = el(`<div class="card pad search-card">
      <div class="card-t" style="margin-bottom:4px">Suche</div>
      <div class="card-s" style="margin-bottom:14px">Frag nach Mietern, Zahlen oder Terminen</div>
      <div class="search-box">
        <span class="search-ic">${svg("chart")}</span>
        <input id="qInput" type="search" placeholder="z. B. Wie viel Miete nehme ich ein?"
               autocomplete="off" enterkeyhint="search">
        <button class="mic-btn" id="micBtn" title="Spracheingabe" aria-label="Spracheingabe">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
               stroke-linecap="round"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/>
          <path d="M19 11a7 7 0 0 1-14 0"/><path d="M12 18v3"/></svg>
        </button>
      </div>
      <div class="search-hint" id="qHint">Tipp: „Restschuld", „freie Wohnung", „Rendite"</div>
      <div id="qOut"></div>
    </div>`);

    const input = card.querySelector("#qInput");
    const out = card.querySelector("#qOut");
    const hint = card.querySelector("#qHint");

    const zeige = (frage) => {
      const q = frage.trim();
      if (!q) { out.innerHTML = ""; hint.style.display = ""; return; }
      hint.style.display = "none";
      const treffer = sucheAntwort(q);
      if (!treffer.length) {
        out.innerHTML = `<div class="note" style="margin-top:12px">Dazu habe ich nichts gefunden.
          Versuch es mit einem Namen, einer Wohnung oder einem Begriff wie „Restschuld".</div>`;
        return;
      }
      out.innerHTML = `<div class="qres">${treffer.map((x, i) => `
        <div class="qr${i === 0 ? " top" : ""}" data-i="${i}">
          <div class="qr-l"><div class="qr-t">${esc(x.e.titel)}</div>
            <div class="qr-d">${esc(x.e.detail)}</div></div>
          <div class="qr-v">${x.e.wert}</div>
        </div>`).join("")}</div>`;
      out.querySelectorAll(".qr").forEach(n => n.onclick = () => {
        const x = treffer[Number(n.dataset.i)];
        if (x && x.e.aktion) x.e.aktion();
      });
    };

    let timer = null;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => zeige(input.value), 160);
    });
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") { clearTimeout(timer); zeige(input.value); }
      if (e.key === "Escape") { input.value = ""; zeige(""); }
    });

    // Spracheingabe (Web Speech API – im Browser eingebaut, kostenlos)
    const mic = card.querySelector("#micBtn");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      mic.style.display = "none";
    } else {
      let rec = null, laeuft = false;
      mic.onclick = () => {
        if (laeuft && rec) { rec.stop(); return; }
        rec = new SR();
        rec.lang = "de-DE";
        rec.interimResults = true;
        rec.continuous = false;
        rec.onstart = () => { laeuft = true; mic.classList.add("on");
          hint.style.display = ""; hint.textContent = "Ich höre zu…"; };
        rec.onresult = (e) => {
          let text = "";
          for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript;
          input.value = text;
          if (e.results[e.results.length - 1].isFinal) zeige(text);
        };
        rec.onerror = (e) => {
          mic.classList.remove("on"); laeuft = false;
          hint.style.display = "";
          hint.textContent = e.error === "not-allowed"
            ? "Mikrofon-Zugriff wurde abgelehnt."
            : "Spracheingabe nicht möglich.";
        };
        rec.onend = () => { mic.classList.remove("on"); laeuft = false;
          if (hint.textContent === "Ich höre zu…") {
            hint.textContent = 'Tipp: „Restschuld", „freie Wohnung", „Rendite"';
          }
          if (input.value.trim()) zeige(input.value); };
        try { rec.start(); } catch (_) {}
      };
    }
    return card;
  }

  /* ---------- BEGRÜSSUNG ---------- */
  function tagesZeit() {
    const h = new Date().getHours();
    if (h < 5)  return "nacht";
    if (h < 11) return "morgen";
    if (h < 18) return "tag";
    if (h < 23) return "abend";
    return "nacht";
  }
  // Sammelt ausschließlich erfreuliche Kennzahlen
  function motivierendeFakten() {
    const f = [];
    const t = FE.totals(D);
    let units = 0, let_ = 0, tilgGetilgt = 0, tilgMonat = 0, nkJahr = 0;
    (D.streams || []).forEach(s => {
      const m = FE.streamMonthly(s);
      (s.einheiten || []).forEach(u => { units++; if (u.status === "vermietet") let_++; });
      if (m.nkPuffer) nkJahr += m.nkPuffer * 12;
      FE.creditsOf(s).forEach(kr => {
        const p = FE.creditPlan(kr);
        tilgGetilgt += p.getilgtBisher; tilgMonat += Number(kr.abtragMonat) || 0;
      });
    });

    if (t.ist > 0) f.push(`Aktuell fließen <b>${eur(t.ist)}</b> pro Monat herein.`);
    if (t.jahrIst > 0) f.push(`Hochgerechnet sind das <b>${eur(t.jahrIst)}</b> im Jahr.`);
    if (units && let_ === units) f.push(`Alle <b>${units} Einheiten</b> sind vermietet – volle Auslastung.`);
    else if (units && let_ / units >= 0.6)
      f.push(`<b>${let_} von ${units}</b> Einheiten sind vermietet – ${Math.round(let_ / units * 100)} % Auslastung.`);
    if (tilgMonat > 0) f.push(`Jeden Monat wandern <b>${eur(tilgMonat)}</b> in die Tilgung – das ist Vermögensaufbau.`);
    if (tilgGetilgt > 0) f.push(`Bereits <b>${eur(tilgGetilgt)}</b> Schulden getilgt.`);
    if (nkJahr > 0) f.push(`<b>${eur(nkJahr)}</b> Nebenkosten-Rücklage pro Jahr sorgen für Puffer.`);

    // objektbezogene Fakten
    (D.streams || []).forEach(s => {
      if (s.kind === "miete" && s.invest) {
        const k = FE.immoKPIs(s);
        if (k.bruttoRendite > 0)
          f.push(`${esc(shortLabel(s.name))} erzielt <b>${k.bruttoRendite.toLocaleString("de-DE")} %</b> Bruttomietrendite.`);
      }
    });

    // freie Einheit als Chance formulieren, nicht als Mangel
    const upside = t.potenzial - t.ist;
    if (upside > 0) f.push(`Noch <b>${eur(upside)}</b> monatlich Luft nach oben bei Vollvermietung.`);
    return f;
  }
  function begruessungsKarte() {
    const zeit = tagesZeit();
    const vorlagen = (D.begruessungen && D.begruessungen[zeit]) || ["Hallo {name}!"];
    const name = (currentUser && currentUser.anrede) || "";
    const gruss = vorlagen[Math.floor(Math.random() * vorlagen.length)]
      .replace("{name}", name).replace(/\s*,\s*!/, "!").trim();
    const fakten = motivierendeFakten();
    const fakt = fakten.length ? fakten[Math.floor(Math.random() * fakten.length)] : "";
    const datum = new Date().toLocaleDateString("de-DE",
      { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    const ava = currentUser && currentUser.avatar;
    const avaHtml = ava
      ? `<div class="hello-ava" style="background-image:url(${esc(ava)})"></div>`
      : (name ? `<div class="hello-ava hello-ava-i">${esc(name.slice(0,1).toUpperCase())}</div>` : "");
    return el(`<div class="card pad hello${avaHtml ? " has-ava" : ""}">
      ${avaHtml}
      <div class="hello-body">
        <div class="hello-t">${esc(gruss)}</div>
        ${fakt ? `<div class="hello-f">${fakt}</div>` : ""}
        <div class="hello-d">${esc(datum)}</div>
      </div></div>`);
  }

  /* ---------- SAMMELSEITE VERMIETUNG ---------- */
  // Was beim Netto-Cashflow abgezogen ist – und was nicht. Steht überall gleich.
  const CF_HINWEIS = "nach Kreditraten, ohne laufende Kosten";

  // Hauptaussage einer Ansicht: eine große Zahl, darunter die Begründung, daneben bis zu drei Zustände.
  // o: { zeile, zahl, unter, anteil (0–100 oder null), info, fakten: [{ titel, wert, text, zustand, tun, hinweis }], knopf: { text, tun } }
  // Ein Zustand mit „tun" ist ein Knopf: Antippen führt zu den Einzelheiten.
  function hauptKarte(o) {
    const fakten = (o.fakten || []).map((f, i) => {
      const innen = `<span class="eq-fakt-t">${esc(f.titel)}</span>
        <span class="eq-fakt-w">${esc(f.wert)}</span>
        <span class="eq-fakt-d">${esc(f.text || "")}${f.tun ? `<span class="eq-fakt-pfeil" aria-hidden="true">›</span>` : ""}</span>`;
      const klasse = "eq-fakt" + (f.zustand ? " " + f.zustand : "");
      return f.tun
        ? `<button type="button" class="${klasse} eq-fakt-knopf" data-fakt="${i}" title="${esc(f.hinweis || "")}">${innen}</button>`
        : `<div class="${klasse}">${innen}</div>`;
    }).join("");
    const karte = el(`<div class="card eq-haupt">
      <div class="eq-haupt-l">
        <div class="eq-haupt-zeile"><span>${esc(o.zeile)}</span>${o.info ? infoKnopf(o.info) : ""}</div>
        <div class="eq-haupt-zahl">${esc(o.zahl)}</div>
        <div class="eq-haupt-unter">${esc(o.unter || "")}</div>
        ${o.anteil != null ? `<div class="eq-fort" role="img" aria-label="${o.anteil} Prozent des möglichen Ertrags"><i style="width:${Math.max(0, Math.min(100, o.anteil))}%"></i></div>` : ""}
      </div>
      ${fakten ? `<div class="eq-fakten">${fakten}</div>` : ""}
      ${o.knopf ? `<div class="eq-haupt-fuss"><button type="button" class="add-btn eq-haupt-knopf"${o.knopf.id ? ` id="${o.knopf.id}"` : ""}>${esc(o.knopf.text)}</button></div>` : ""}</div>`);
    if (o.knopf) karte.querySelector(".eq-haupt-knopf").onclick = o.knopf.tun;
    karte.querySelectorAll("[data-fakt]").forEach(b => b.onclick = o.fakten[Number(b.dataset.fakt)].tun);
    return karte;
  }

  // Satz unter der Hauptzahl. „Alles ist vermietet" steht nur da, wenn wirklich keine Einheit frei ist.
  function ertragSatz(stand) {
    if (!stand.einheiten) return "Noch keine Einheit angelegt";
    if (stand.pot > stand.ist) return "von " + eur(stand.pot) + " bei Vollvermietung";
    if (stand.frei.length) return (stand.frei.length === 1 ? "Eine Einheit ist" : stand.frei.length + " Einheiten sind") + " frei – dort ist noch keine Miete hinterlegt.";
    return "Das ist der volle Ertrag: Alles ist vermietet.";
  }
  // Kleiner Erklär-Knopf in einer Zeile (die Kennzahl-Karten haben ihren eigenen in der Ecke)
  function infoKnopf(schluessel) {
    return KPI_INFO[schluessel]
      ? `<button type="button" class="eq-info" data-info="${schluessel}" aria-label="Erklärung: ${esc(KPI_INFO[schluessel].titel)}" title="Was bedeutet das?">i</button>`
      : "";
  }
  // Zeile „Bezeichnung – Wert" mit Erklär-Knopf
  const kvInfo = (k, v, schluessel) => `<div class="kv"><span class="eq-kv-k">${esc(k)}${infoKnopf(schluessel)}</span><b>${v}</b></div>`;

  // Überschrift eines Abschnitts, auf Wunsch mit einem zurückhaltenden Knopf rechts
  function abschnittKopf(titel, unter, knopf) {
    const kopf = el(`<div class="eq-abschnitt">
      <div><div class="eq-abschnitt-t">${esc(titel)}</div>${unter ? `<div class="eq-abschnitt-s">${esc(unter)}</div>` : ""}</div>
      ${knopf ? `<button type="button" class="add-btn" id="${knopf.id}">${esc(knopf.text)}</button>` : ""}</div>`);
    if (knopf) kopf.querySelector("button").onclick = knopf.tun;
    return kopf;
  }

  // Karte „Leerstand": welche Einheiten frei sind und was sie im Monat bringen würden
  function leerstandKarte(streams) {
    const frei = vermietungsStand(streams).frei;
    if (!frei.length) return null;
    const mehrere = (streams || []).length > 1;
    // Wo Nebenkosten als Puffer zurückgelegt werden, zählen sie nicht zum Ertrag – das steht dann dabei
    const ohneNk = frei.some(f => f.objekt.nkAlsPuffer && FE.unitIncome(f.einheit).nk > 0);
    const zeilen = frei.map((f, i) => `<div class="drow clickable" data-i="${i}" role="button" tabindex="0">
        <div class="drow-l"><div><div class="drow-name">${esc(f.einheit.wohnung || "Einheit")}</div>
          <div class="drow-sub">${esc([mehrere ? nameOhneBruch(f.objekt.name) : "", f.einheit.flaeche ? qm(f.einheit.flaeche) : ""].filter(Boolean).join(" · "))}</div></div></div>
        <div class="drow-val"><b>${eur(f.ertrag)}</b><span>möglich im Monat</span></div></div>`).join("");
    const karte = el(`<div class="card">
      <div class="card-h"><div><div class="card-t">Leerstand</div>
        <div class="card-s">${frei.length === 1 ? "Eine Einheit ist" : frei.length + " Einheiten sind"} frei. ${ohneNk ? "Die Beträge zählen ohne Nebenkosten. " : ""}Zeile antippen für die Einzelheiten.</div></div></div>
      <div class="card-b">${zeilen}</div></div>`);
    karte.querySelectorAll(".drow[data-i]").forEach(z => {
      const f = frei[Number(z.dataset.i)];
      z.onclick = () => openUnitSheet(f.objekt, f.einheit);
      z.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); z.click(); } };
    });
    return karte;
  }

  // Karte eines Objekts in der Sammelübersicht: Name, Einnahmen, Zustand, drei Eckwerte
  function objektKarte(s) {
    const m = FE.streamMonthly(s);
    const k = FE.immoKPIs(s);
    const stand = vermietungsStand([s]);
    const flaeche = (s.einheiten || []).reduce((a, u) => a + (Number(u.flaeche) || 0), 0);
    const marken = [`<span class="eq-marke${m.einheiten && m.vermietet === m.einheiten ? " gut" : ""}">${m.vermietet} von ${m.einheiten} vermietet</span>`];
    if (stand.frei.length) marken.push(`<span class="eq-marke achtung">${stand.frei.length} frei</span>`);
    if (stand.offen.length) marken.push(`<span class="eq-marke achtung">${mehrzahl(stand.offen.length, "Miete", "Mieten")} offen</span>`);
    const karte = el(`<div class="card clickable eq-obj obj-card" data-id="${s.id}" role="button" tabindex="0">
      <div class="eq-obj-kopf">
        <div class="tile-ic">${svg(s.icon || "home")}</div>
        <div class="eq-obj-n"><div class="tile-name">${esc(s.name)}</div><div class="tile-loc">${esc(s.ort || "")}</div></div>
        <div class="eq-obj-z"><b>${eur(m.gesamt)}</b><span>pro Monat</span></div>
      </div>
      <div class="eq-marken">${marken.join("")}</div>
      <div class="eq-obj-fuss">
        <div><span>Netto-Cashflow</span><b${m.netto < 0 ? ' style="color:var(--danger)"' : ""}>${eur(m.netto)}</b></div>
        <div><span>Bruttomietrendite</span><b>${s.invest ? k.bruttoRendite.toLocaleString("de-DE") + " %" : "—"}</b></div>
        <div><span>Fläche</span><b>${flaeche ? qm(flaeche) : "—"}</b></div>
      </div></div>`);
    karte.onclick = () => geheZu(s.id);
    karte.onkeydown = (e) => { if ((e.key === "Enter" || e.key === " ") && e.target === karte) { e.preventDefault(); karte.click(); } };
    return karte;
  }

  // Sammelübersicht. Frage: Was kommt rein, was steht leer, wer hat nicht gezahlt?
  function renderVermietung(host) {
    $("#eyebrow").textContent = "Vermietung";
    $("#pageTitle").textContent = "Alle Mietobjekte";
    const streams = mietStreams();
    $("#pageSub").textContent = mehrzahl(streams.length, "Objekt", "Objekte") + " im Bestand";

    const objektAnlegen = () => { if (pruefeObjekt()) assistentObjekt(); };
    if (!streams.length) {
      const leer = el(`<div class="card eq-leer">
        <div>Noch kein Objekt im Bestand. Leg dein erstes Mietobjekt an – danach siehst du hier Einnahmen, Leerstand und Mieteingänge.</div>
        <button type="button" class="eq-btn" id="addObjekt">Objekt anlegen</button></div>`);
      leer.querySelector("#addObjekt").onclick = objektAnlegen;
      host.appendChild(leer);
      return;
    }

    let tilg = 0, rest = 0, nkP = 0, invest = 0;
    streams.forEach(s => {
      const m = FE.streamMonthly(s);
      tilg += m.kreditAbtrag; nkP += m.nkPuffer; invest += Number(s.invest) || 0;
      FE.creditsOf(s).forEach(kr => { const p = FE.creditPlan(kr); rest += p ? p.restAktuell : (kr.summe || 0); });
    });
    const stand = vermietungsStand(streams);
    const ist = stand.ist, pot = stand.pot, netto = ist - tilg;

    // 1 Hauptaussage
    host.appendChild(hauptKarte({
      zeile: "Einnahmen pro Monat", info: "einnahmen",
      zahl: eur(ist),
      unter: ertragSatz(stand),
      anteil: pot > 0 ? Math.round(ist / pot * 100) : null,
      fakten: standFakten(stand)
    }));

    // 2 Wer hat nicht gezahlt, was steht leer
    const mieten = offeneMietenKarte(streams); if (mieten) host.appendChild(mieten);
    const leer = leerstandKarte(streams); if (leer) host.appendChild(leer);

    // 3 Geld im Überblick
    host.appendChild(el(`<div class="grid g-kpi">
      ${kpiCard("wallet", eur(netto), "Netto-Cashflow / Monat", CF_HINWEIS, netto >= 0, null, "cashflow")}
      ${kpiCard("bank", eur(tilg), "Tilgung / Monat", eur(tilg * 12) + " / Jahr", false, null, "tilgung")}
      ${kpiCard("debt", eur(rest), "Restschuld heute", "exakt " + eur2(rest), false, null, "restschuld")}
      ${kpiCard("trend", eur(ist * 12), "Einnahmen / Jahr", "hochgerechnet")}
    </div>`));

    // 4 Die Objekte
    host.appendChild(abschnittKopf("Objekte", "Antippen öffnet das Objekt", { id: "addObjekt", text: "+ Objekt anlegen", tun: objektAnlegen }));
    const grid = el(`<div class="grid g-objekte"></div>`);
    streams.forEach(s => grid.appendChild(objektKarte(s)));
    host.appendChild(grid);

    // 5 Verteilung und weitere Kennzahlen
    const segs = streams.map((s, i) => ({ name: s.name, value: FE.streamMonthly(s).gesamt, color: PALETTE[i % PALETTE.length] })).filter(x => x.value > 0);
    const legend = segs.map(x => `<div class="leg"><span class="sw" style="background:${x.color}"></span>
      <span class="lt">${esc(x.name)}</span><span class="lv">${eur(x.value)}</span></div>`).join("");
    const verteilung = segs.length > 1 ? `<div class="card pad"><div class="card-t" style="margin-bottom:4px">Verteilung</div>
        <div class="card-s" style="margin-bottom:18px">Einnahmen je Objekt</div>
        <div class="donut-row">${donut(segs)}<div class="legend">${legend}</div></div></div>` : "";
    host.appendChild(el(`<div class="grid${verteilung ? " g-2" : ""}">
      ${verteilung}
      <div class="card pad"><div class="card-t" style="margin-bottom:4px">Weitere Kennzahlen</div>
        <div class="card-s" style="margin-bottom:14px">Über alle Mietobjekte</div>
        ${kvInfo("Auslastung", stand.einheiten ? stand.auslastung + " %" : "—", "auslastung")}
        ${kvInfo("Potenzial / Monat", eur(pot), "potenzial")}
        ${kvInfo("Investition", eur(invest), "invest")}
        ${kv("Nebenkosten-Puffer / Monat", eur(nkP))}
        ${kv("Netto-Cashflow / Jahr", eur(netto * 12))}
      </div></div>`));
  }

  /* ---------- OVERVIEW ---------- */
  function renderOverview(host) {
    const t = FE.totals(D);
    // Portfolio-Kredite + Einheiten aggregieren
    let debtMonth = 0, debtRest = 0, debtOrig = 0, paidSoFar = 0;
    let unitsTotal = 0, unitsLet = 0;
    (D.streams || []).forEach(s => {
      FE.creditsOf(s).forEach(kr => {
        debtMonth += Number(kr.abtragMonat) || 0;
        debtOrig += Number(kr.summe) || 0;
        const pl = FE.creditPlan(kr);
        debtRest += pl ? pl.restAktuell : (Number(kr.summe) || 0);
        paidSoFar += pl ? pl.getilgtBisher : 0;
      });
      (s.einheiten || []).forEach(u => { unitsTotal++; if (u.status === "vermietet") unitsLet++; });
    });
    const nettoMonth = t.ist - debtMonth;
    const occ = unitsTotal ? Math.round(unitsLet / unitsTotal * 100) : 0;
    const upside = t.potenzial - t.ist;          // ungenutztes Einnahmenpotenzial
    const nettoPot = t.potenzial - debtMonth;    // Netto bei Vollvermietung

    $("#eyebrow").textContent = "Portfolio";
    $("#pageTitle").textContent = "Übersicht";
    $("#pageSub").textContent = "Alle Mietobjekte auf einen Blick · Stand " + ((D.meta && D.meta.version) || "");

    const ctx = { t, debtMonth, debtRest, paidSoFar, debtOrig, unitsTotal, unitsLet, nettoMonth, nettoPot, upside };

    // Persönliche Begrüßung + Suche
    host.appendChild(begruessungsKarte());
    host.appendChild(searchCard());

    // KPI-Reihe 1 — Einnahmen & Cashflow
    host.appendChild(wireActs(el(`<div class="grid g-kpi">
      ${kpiCard("euro", eur(t.ist), "Einnahmen / Monat", "aktuell vermietet", true, "einnahmen", "einnahmen")}
      ${kpiCard("layers", eur(t.potenzial), "Potenzial / Monat", "+" + eur(upside) + " ungenutzt", false, "potenzial", "potenzial")}
      ${kpiCard("wallet", eur(nettoMonth), "Netto-Cashflow / Monat", CF_HINWEIS, nettoMonth >= 0, "netto", "cashflow")}
      ${kpiCard("home", occ + " %", "Auslastung", unitsLet + " / " + unitsTotal + " Einheiten", occ >= 60, "auslastung", "auslastung")}
    </div>`), {
      einnahmen: () => openPortfolioSheet("einnahmen", ctx),
      potenzial: () => openPortfolioSheet("potenzial", ctx),
      netto: () => openPortfolioSheet("netto", ctx),
      auslastung: () => openPortfolioSheet("auslastung", ctx)
    }));

    // KPI-Reihe 2 — Jahr, Tilgung, Schuldenstand
    host.appendChild(wireActs(el(`<div class="grid g-kpi">
      ${kpiCard("trend", eur(t.jahrIst), "Einnahmen / Jahr", "hochgerechnet", false, "jahr")}
      ${kpiCard("chart", eur(nettoPot), "Netto-Potenzial / Mon.", "bei Vollvermietung", nettoPot >= 0, "potenzial")}
      ${kpiCard("bank", eur(debtMonth), "Tilgung / Monat", eur(debtMonth * 12) + " / Jahr", false, "tilgung", "tilgung")}
      ${kpiCard("debt", eur(debtRest), "Restschuld heute", "exakt " + eur2(debtRest), false, "schuld", "restschuld")}
    </div>`), {
      jahr: () => openPortfolioSheet("einnahmen", ctx),
      potenzial: () => openPortfolioSheet("potenzial", ctx),
      tilgung: () => openPortfolioSheet("schuld", ctx),
      schuld: () => openPortfolioSheet("schuld", ctx)
    }));

    // Composition donut + legend (nur echte Einnahmen)
    const segs = (D.streams || []).map((s, i) => {
      const m = FE.streamMonthly(s);
      return { id: s.id, name: s.name, value: m.gesamt, color: PALETTE[i % PALETTE.length], kind: s.kind };
    }).filter(x => x.value > 0);
    const legend = segs.map(s => `<div class="leg clickable" data-sid="${esc(s.id)}">
      <span class="sw" style="background:${s.color}"></span>
      <span class="lt">${esc(s.name)}</span>
      <span class="lv">${eur(s.value)}</span></div>`).join("");
    const compCard = el(`<div class="card pad">
      <div class="card-t" style="margin-bottom:4px">Zusammensetzung</div>
      <div class="card-s" style="margin-bottom:18px">Einnahmen je Objekt / Monat</div>
      <div class="donut-row">${donut(segs)}<div class="legend">${legend}</div></div></div>`);
    compCard.querySelectorAll(".leg[data-sid]").forEach(l =>
      l.onclick = () => route(l.dataset.sid));
    host.appendChild(compCard);

    // Kalender + Wetter nebeneinander
    const row = el(`<div class="grid g-2"></div>`);
    row.appendChild(calendarCard());
    row.appendChild(weatherCard());
    host.appendChild(row);

    // Stream tiles
    const tiles = el(`<div class="tiles"></div>`);
    (D.streams || []).forEach(s => {
      const m = FE.streamMonthly(s);
      let meta = "";
      const kr = FE.creditsOf(s);
      if (kr.length) {
        meta = `<span class="pillet on">Netto ${eur(m.netto)}</span><span class="pillet">${kr.length} Kredit${kr.length > 1 ? "e" : ""}</span>`;
      }
      else meta = `<span class="pillet on">${m.vermietet}/${m.einheiten} vermietet</span><span class="pillet">Potenzial ${eur(m.gesamtPotenzial)}</span>`;
      const t = el(`<div class="tile" data-id="${s.id}">
        <div class="tile-go">${svg("trend")}</div>
        <div class="tile-head"><div class="tile-ic">${svg(s.icon || "home")}</div>
          <div><div class="tile-name">${esc(s.name)}</div><div class="tile-loc">${esc(s.ort || "")}</div></div></div>
        <div class="tile-num">${eur(m.gesamt)} <small>/ Mon.</small></div>
        <div class="tile-meta">${meta}</div></div>`);
      t.onclick = () => route(s.id);
      tiles.appendChild(t);
    });
    host.appendChild(tiles);
  }

  /* ---------- KALENDER (Monatsansicht) ---------- */
  // Alle Termine eines Monats als Map { "YYYY-MM-DD": [events] }
  function eventsForMonth(year, month) {
    const map = {};
    const push = (d, t) => {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      (map[key] = map[key] || []).push(t);
    };
    const first = new Date(year, month, 1), last = new Date(year, month + 1, 0);
    (D.termine || []).forEach(t => {
      const base = new Date(t.datum);
      if (t.wiederholung === "monatlich") {
        const d = new Date(year, month, Math.min(base.getDate(), last.getDate()));
        push(d, t);
      } else if (t.wiederholung === "jaehrlich") {
        if (base.getMonth() === month && new Date(year, month, 1) >= new Date(base.getFullYear(), base.getMonth(), 1))
          push(new Date(year, month, base.getDate()), t);
      } else if (t.wiederholung === "halbjaehrlich") {
        // alle 6 Monate ab Basismonat
        const diff = (year - base.getFullYear()) * 12 + (month - base.getMonth());
        if (diff >= 0 && diff % 6 === 0) push(new Date(year, month, base.getDate()), t);
      } else {
        if (base.getFullYear() === year && base.getMonth() === month) push(base, t);
      }
    });
    return map;
  }

  const EVT = {
    miete:   { col: "var(--mint)", bg: "color-mix(in srgb,var(--mint) 14%,transparent)",  br: "color-mix(in srgb,var(--mint) 40%,transparent)",  label: "Miete" },
    einzug:  { col: "var(--mint-2)", bg: "color-mix(in srgb,var(--mint-2) 14%,transparent)", br: "color-mix(in srgb,var(--mint-2) 40%,transparent)", label: "Einzug" },
    zahlung: { col: "var(--warn)", bg: "color-mix(in srgb,var(--warn) 16%,transparent)", br: "color-mix(in srgb,var(--warn) 45%,transparent)", label: "Zahlung" },
    termin:  { col: "var(--soft)", bg: "color-mix(in srgb,var(--soft) 16%,transparent)",  br: "color-mix(in srgb,var(--soft) 45%,transparent)",  label: "Termin" }
  };

  let calYear = null, calMonth = null, calSelected = null;
  function calendarCard() {
    const now = new Date();
    if (calYear == null) { calYear = now.getFullYear(); calMonth = now.getMonth(); }
    const card = el(`<div class="card cal-card">
      <div class="card-h">
        <div><div class="card-t">Kalender</div><div class="card-s" id="calSub"></div></div>
        <div class="cal-nav">
          <button class="cal-btn" id="calPrev" aria-label="Vorheriger Monat">‹</button>
          <button class="cal-btn" id="calToday">heute</button>
          <button class="cal-btn" id="calNext" aria-label="Nächster Monat">›</button>
          <button class="cal-btn" id="calAdd" aria-label="Termin anlegen" title="Termin anlegen">+</button>
          <button class="cal-btn" id="calInfo" aria-label="Übersicht" title="Jahresübersicht">⋯</button>
        </div>
      </div>
      <div class="card-b"><div id="calGridHost"></div><div id="calDetail"></div></div></div>`);

    const draw = () => {
      const host = card.querySelector("#calGridHost");
      const detail = card.querySelector("#calDetail");
      const map = eventsForMonth(calYear, calMonth);
      const first = new Date(calYear, calMonth, 1);
      const daysIn = new Date(calYear, calMonth + 1, 0).getDate();
      const startDow = (first.getDay() + 6) % 7; // Montag = 0
      const todayKey = new Date().toISOString().slice(0, 10);

      card.querySelector("#calSub").textContent =
        first.toLocaleDateString("de-DE", { month: "long", year: "numeric" });

      const dows = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
        .map(d => `<div class="cal-dow">${d}</div>`).join("");
      let cells = "";
      for (let i = 0; i < startDow; i++) cells += `<div class="cal-cell empty"></div>`;
      for (let day = 1; day <= daysIn; day++) {
        const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const evts = map[key] || [];
        const isToday = key === todayKey;
        const isSel = key === calSelected;
        // Farbe nach höchster Priorität: einzug > zahlung > miete
        let cfg = null;
        if (evts.length) {
          const order = ["einzug", "zahlung", "miete", "termin"];
          const typ = order.find(o => evts.some(e => e.typ === o)) || "termin";
          cfg = EVT[typ];
        }
        const style = cfg ? `background:${cfg.bg};border-color:${cfg.br}` : "";
        const dots = evts.slice(0, 3).map(e => {
          const c = EVT[e.typ] || EVT.termin;
          return `<span class="cal-d" style="background:${c.col}"></span>`;
        }).join("");
        cells += `<div class="cal-cell${evts.length ? " has" : ""}${isToday ? " today" : ""}${isSel ? " sel" : ""}"
          data-key="${key}" style="${style}">
          <span class="cal-n">${day}</span>
          <span class="cal-dots">${dots}</span></div>`;
      }
      host.innerHTML = `<div class="cal-grid">${dows}${cells}</div>`;

      // Detailbereich
      const renderDetail = (key) => {
        const evts = (map[key] || []);
        if (!key) { detail.innerHTML = `<div class="cal-hint">Tag antippen, um Ereignisse zu sehen.</div>`; return; }
        const d = new Date(key);
        const head = d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
        if (!evts.length) {
          detail.innerHTML = `<div class="cal-detail"><div class="cal-detail-h">${esc(head)}</div>
            <div class="cal-hint">Keine Ereignisse an diesem Tag.</div></div>`;
          return;
        }
        const t = FE.totals(D);
        const list = evts.map(e => {
          const c = EVT[e.typ] || EVT.termin;
          // Betrag je Ereignistyp ableiten
          let betrag = "";
          if (e.typ === "miete") betrag = eur(t.miete);
          else if (e.typ === "zahlung" && e.info) {
            const mm = String(e.info).match(/([\d.]+(?:,\d+)?)\s*€/);
            if (mm) betrag = mm[0];
          }
          return `<div class="cal-ev${e._id ? " clickable" : ""}" ${e._id ? `data-ti="${evts.indexOf(e)}"` : ""} style="border-left-color:${c.col}">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline">
              <div class="cal-ev-t">${esc(e.titel)}</div>
              ${betrag ? `<div class="tl-v" style="color:${c.col}">${esc(betrag)}</div>` : ""}
            </div>
            <div class="cal-ev-i">${esc(e.info || c.label)}</div></div>`;
        }).join("");
        // Tagessumme, falls Mieteingang dabei
        const hatMiete = evts.some(e => e.typ === "miete");
        const foot = hatMiete
          ? `<div class="note" style="margin-top:10px">Zufluss an diesem Tag: ${eur(t.miete)} aus ${mietStreams().length === 1 ? "einem Objekt" : mietStreams().length + " Objekten"}.</div>`
          : "";
        detail.innerHTML = `<div class="cal-detail"><div class="cal-detail-h">${esc(head)}</div>${list}${foot}</div>`;
      };
      renderDetail(calSelected);

      // Termin anlegen / bearbeiten
      const neuBtn = card.querySelector("#calAdd");
      if (neuBtn) neuBtn.onclick = () => {
        const vor = calSelected
          ? { titel: "", datum: calSelected, typ: "termin" }
          : null;
        openTerminEdit(vor ? { titel: "", datum: calSelected, typ: "termin" } : null, true);
      };
      detail.querySelectorAll(".cal-ev[data-ti]").forEach(n => n.onclick = (ev) => {
        ev.stopPropagation();
        const key = calSelected;
        const liste = (map[key] || []);
        const t = liste[Number(n.dataset.ti)];
        if (t && t._id) openTerminEdit(t, false);
      });

      host.querySelectorAll(".cal-cell[data-key]").forEach(c => {
        c.onclick = () => {
          calSelected = (calSelected === c.dataset.key) ? null : c.dataset.key;
          draw();
        };
      });
    };

    card.querySelector("#calPrev").onclick = () => {
      calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } calSelected = null; draw();
    };
    card.querySelector("#calNext").onclick = () => {
      calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } calSelected = null; draw();
    };
    card.querySelector("#calInfo").onclick = () => openCalendarSheet();
    card.querySelector("#calToday").onclick = () => {
      const n = new Date(); calYear = n.getFullYear(); calMonth = n.getMonth();
      calSelected = n.toISOString().slice(0, 10); draw();
    };
    draw();
    return card;
  }

  /* ---------- WETTER ---------- */
  const WCODE = {
    0: ["Klar", "☀️"], 1: ["Überwiegend klar", "🌤"], 2: ["Teils bewölkt", "⛅️"], 3: ["Bedeckt", "☁️"],
    45: ["Nebel", "🌫"], 48: ["Reifnebel", "🌫"], 51: ["Leichter Niesel", "🌦"], 53: ["Niesel", "🌦"],
    55: ["Starker Niesel", "🌧"], 61: ["Leichter Regen", "🌦"], 63: ["Regen", "🌧"], 65: ["Starker Regen", "🌧"],
    71: ["Leichter Schnee", "🌨"], 73: ["Schnee", "🌨"], 75: ["Starker Schnee", "❄️"],
    80: ["Schauer", "🌦"], 81: ["Schauer", "🌧"], 82: ["Starke Schauer", "⛈"],
    95: ["Gewitter", "⛈"], 96: ["Gewitter mit Hagel", "⛈"], 99: ["Schweres Gewitter", "⛈"]
  };
  function weatherCard() {
    const w = D.wetter || { ort: null, lat: null, lon: null };
    const card = el(`<div class="card">
      <div class="card-h"><div><div class="card-t">Wetter</div>
        <div class="card-s" id="wOrt">${w.ort ? esc(w.ort) + " · " : ""}Tag antippen für Stundenverlauf</div></div>
        <div class="head-pill" style="padding:7px 13px" id="wNow">lädt…</div></div>
      <div class="card-b" id="wBody"><div class="note">Wetterdaten werden geladen…</div></div></div>`);

    function ladeWetter(lat, lon, ortName) {
      const ortEl = card.querySelector("#wOrt");
      if (ortName && ortEl) ortEl.textContent = ortName + " · Tag antippen für Stundenverlauf";
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
      + `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m`
      + `&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m`
      + `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,sunrise,sunset`
      + `&timezone=auto&forecast_days=5`;
      fetchWetter(url);
    }

    // Ort bestimmen: hinterlegter Ort > Gerätestandort > Karte ausblenden
    if (w.lat && w.lon) {
      ladeWetter(w.lat, w.lon, w.ort);
    } else if (navigator.geolocation) {
      card.querySelector("#wNow").textContent = "Standort…";
      navigator.geolocation.getCurrentPosition(
        pos => ladeWetter(pos.coords.latitude, pos.coords.longitude, "Dein Standort"),
        ()  => { card.style.display = "none"; },
        { timeout: 8000, maximumAge: 3600000 }
      );
    } else {
      card.style.display = "none";
    }

    function fetchWetter(url) {
    fetch(url).then(r => r.json()).then(j => {
      const body = card.querySelector("#wBody"), now = card.querySelector("#wNow");
      if (!j || !j.current) throw new Error("keine Daten");
      const c = j.current, cc = WCODE[c.weather_code] || ["—", "•"];
      now.innerHTML = `${cc[1]} <b style="margin-left:5px">${Math.round(c.temperature_2m)}°</b>`;
      const days = (j.daily && j.daily.time || []).map((t, i) => {
        const dc = WCODE[j.daily.weather_code[i]] || ["—", "•"];
        const dd = new Date(t);
        return `<div class="w-day clickable" data-i="${i}">
          <span class="w-dow">${i === 0 ? "heute" : dd.toLocaleDateString("de-DE", { weekday: "short" })}</span>
          <span class="w-ic">${dc[1]}</span>
          <span class="w-t"><b>${Math.round(j.daily.temperature_2m_max[i])}°</b><i>${Math.round(j.daily.temperature_2m_min[i])}°</i></span>
        </div>`;
      }).join("");
      body.innerHTML = `<div class="w-now">
          <div class="w-now-ic">${cc[1]}</div>
          <div><div class="w-now-t">${Math.round(c.temperature_2m)}°</div>
            <div class="w-now-d">${esc(cc[0])} · ${Math.round(c.wind_speed_10m)} km/h · ${Math.round(c.relative_humidity_2m)} % rF</div></div>
        </div><div class="w-days">${days}</div>`;
      body.querySelectorAll(".w-day").forEach(d =>
        d.onclick = () => openWeatherSheet(j, Number(d.dataset.i)));
    }).catch(() => {
      card.querySelector("#wNow").textContent = "offline";
      card.querySelector("#wBody").innerHTML = `<div class="note">Wetterdaten konnten nicht geladen werden (keine Internetverbindung).</div>`;
    });
    }
    return card;
  }

  function openWeatherSheet(j, idx) {
    const day = j.daily.time[idx];
    const dc = WCODE[j.daily.weather_code[idx]] || ["—", "•"];
    const d = new Date(day);
    const head = d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
    // Stunden dieses Tages
    const hrs = [];
    (j.hourly && j.hourly.time || []).forEach((t, i) => {
      if (t.slice(0, 10) !== day) return;
      const h = Number(t.slice(11, 13));
      if (h % 3 !== 0) return; // 3-Stunden-Schritte
      const hc = WCODE[j.hourly.weather_code[i]] || ["—", "•"];
      hrs.push(`<div class="hour"><div class="hh">${String(h).padStart(2, "0")}:00</div>
        <div class="hi">${hc[1]}</div>
        <div class="ht">${Math.round(j.hourly.temperature_2m[i])}°</div>
        <div class="hr">${j.hourly.precipitation_probability ? Math.round(j.hourly.precipitation_probability[i]) + " %" : ""}</div></div>`);
    });
    const sr = j.daily.sunrise ? j.daily.sunrise[idx].slice(11, 16) : "—";
    const ss = j.daily.sunset ? j.daily.sunset[idx].slice(11, 16) : "—";
    const body = `
      <div class="stat-strip" style="margin-bottom:18px">
        <div class="s"><span>Höchst</span><b>${Math.round(j.daily.temperature_2m_max[idx])}°</b></div>
        <div class="s"><span>Tiefst</span><b>${Math.round(j.daily.temperature_2m_min[idx])}°</b></div>
        <div class="s"><span>Niederschlag</span><b>${(j.daily.precipitation_sum ? j.daily.precipitation_sum[idx] : 0).toLocaleString("de-DE")} mm</b></div>
        <div class="s"><span>Wind max</span><b>${Math.round(j.daily.wind_speed_10m_max ? j.daily.wind_speed_10m_max[idx] : 0)} km/h</b></div>
      </div>
      <div class="card-t" style="font-size:14px;margin-bottom:10px">Tagesverlauf</div>
      <div class="hours">${hrs.join("")}</div>
      <div style="margin-top:18px">
        ${kv("Sonnenaufgang", sr + " Uhr")}
        ${kv("Sonnenuntergang", ss + " Uhr")}
      </div>`;
    openSheet(dc[1] + "  " + dc[0], head, body);
  }

  /* ---------- STREAM DETAIL ---------- */
  /* ---------- OBJEKTSEITE ---------- */
  // Die Seite besteht aus Bausteinen in fester Reihenfolge. Jeder Baustein ist einzeln
  // aufrufbar: Er bekommt das Objekt und liefert einen Knoten, eine Liste von Knoten oder nichts.
  // Die Projektseite (Phase 7) setzt sich aus denselben Bausteinen zusammen.

  // Kopf: Hauptzahl und Zustand des Objekts
  function objektKopf(s) {
    const m = FE.streamMonthly(s);
    const stand = vermietungsStand([s]);
    return hauptKarte({
      zeile: "Einnahmen pro Monat", info: "einnahmen",
      zahl: eur(m.gesamt),
      unter: ertragSatz(stand),
      anteil: m.gesamtPotenzial > 0 ? Math.round(m.gesamt / m.gesamtPotenzial * 100) : null,
      fakten: standFakten(stand),
      knopf: { id: "editObj", text: "Objekt bearbeiten", tun: () => openObjektEdit(s, false) }
    });
  }

  // Kennzahlen: was das Objekt nach Kreditraten bringt und wie es sich rechnet
  function objektKennzahlen(s) {
    const m = FE.streamMonthly(s);
    const kredite = FE.creditsOf(s);
    const hasImmo = s.invest || kredite.length || s.nkAlsPuffer;
    const k = hasImmo ? FE.immoKPIs(s) : null;
    const flaeche = (s.einheiten || []).reduce((a, u) => a + (Number(u.flaeche) || 0), 0);
    const karten = [];
    if (k && (s.invest || kredite.length))
      karten.push(kpiCard("wallet", eur(m.netto), "Netto-Cashflow / Monat", CF_HINWEIS, m.netto >= 0, "cf", "cashflow"));
    if (k && s.invest) {
      karten.push(kpiCard("trend", k.bruttoRendite.toLocaleString("de-DE") + " %", "Brutto\u00ADmiet\u00ADrendite", "Jahreskaltmiete ÷ Investition", false, null, "rendite"));
      karten.push(kpiCard("chart", k.cashflowRoi.toLocaleString("de-DE") + " %", "Cashflow-ROI", "Netto-Cashflow im Jahr ÷ Investition", false, null, "roi"));
      karten.push(kpiCard("coins", eur(k.invest), "Investition", "eingesetztes Kapital", false, null, "invest"));
    }
    if (k && kredite.length) {
      karten.push(kpiCard("bank", eur(k.kreditAbtrag), "Tilgung / Monat", mehrzahl(kredite.length, "Kredit", "Kredite"), false, null, "tilgung"));
      karten.push(kpiCard("debt", eur(k.restschuldGesamt), "Restschuld heute", "exakt " + eur2(k.restschuldGesamt), false, null, "restschuld"));
    }
    karten.push(kpiCard("trend", eur(m.gesamt * 12), "Einnahmen / Jahr", "hochgerechnet"));
    // Die Einheiten-Karte füllt die Reihe auf, wenn sonst eine Lücke bliebe
    if (karten.length % 2) karten.push(kpiCard("home", m.einheiten, "Einheiten", flaeche ? qm(flaeche) + " gesamt" : "noch ohne Fläche"));
    return wireActs(el(`<div class="grid g-kpi">${karten.join("")}</div>`), { cf: () => openCashflowSheet(s) });
  }

  // Einheiten: am Handy eine Liste, auf breiten Bildschirmen eine Tabelle.
  // Spalten: Bezeichnung, Mieter, Fläche, Miete, Status, Mieteingang im laufenden Monat.
  function einheitenKarte(s) {
    const einheiten = s.einheiten || [];
    const anlegen = () => { if (pruefeEinheit()) assistentEinheit(s); };
    if (!einheiten.length) {
      const leer = el(`<div class="card">
        <div class="card-h"><div><div class="card-t">Einheiten</div></div></div>
        <div class="card-b"><div class="eq-leer">Noch keine Einheit angelegt. Mit der ersten Wohnung beginnen die Zahlen zu laufen.
          <div><button type="button" class="eq-btn" id="addUnit">Einheit anlegen</button></div></div></div></div>`);
      leer.querySelector("#addUnit").onclick = anlegen;
      return leer;
    }
    const monat = monatsName();
    const zeilen = einheiten.map((u, i) => {
      const inc = FE.unitIncome(u);
      const stand = mietStand(u);
      const frei = stand === "frei";
      // gerade als eingegangen vermerkt: Die Zeile behält ihre Höhe, damit nichts unter den Finger rutscht
      const frisch = stand === "bestaetigt" && frischEingegangen.has(u._id);
      const status = frei ? `<span class="eq-marke achtung">frei</span>` : `<span class="eq-marke">vermietet</span>`;
      const eingang = frei ? `<span class="eq-leise">—</span>`
        : frisch ? `<span class="eq-nur-schmal">Miete ${esc(monat)}</span><span class="eq-marke gut">eingegangen</span>`
        : stand === "bestaetigt" ? `<span class="eq-marke gut">eingegangen</span>`
        : stand === "offen" ? `<span class="eq-nur-schmal eq-warnt">Miete ${esc(monat)} offen</span>${mietKnopf(u, `data-miete="${i}"`)}`
        : stand === "keine" ? `<span class="eq-leise">keine Miete hinterlegt</span>`
        : `<span class="eq-leise">fällig am ${zahltagIm(u)}.</span>`;
      const klassen = "eq-tab-z" + (frei ? " eq-frei" : "") + (stand === "offen" || frisch ? " eq-faellig" : "");
      return `<div class="${klassen}" data-i="${i}" role="row" tabindex="0" title="Antippen öffnet die Einheit">
        <div class="eq-c-n" role="cell">${esc(u.wohnung || "Einheit")}</div>
        <div class="eq-c-m" role="cell">${frei ? `<span class="eq-leise">kein Mieter</span>` : u.mieter ? esc(u.mieter) : `<span class="eq-leise">ohne Namen</span>`}<span class="eq-nur-schmal">${u.flaeche ? "\u00A0· " + qm(u.flaeche) : ""}</span></div>
        <div class="eq-c-f" role="cell">${u.flaeche ? qm(u.flaeche) : "—"}</div>
        <div class="eq-c-b${frei ? " eq-moeglich" : ""}" role="cell">${eur(inc.gesamt)}${frei ? `<span class="eq-c-zus">möglich</span>` : ""}</div>
        <div class="eq-c-s" role="cell">${status}</div>
        <div class="eq-c-e" role="cell">${eingang}</div></div>`;
    }).join("");
    const karte = el(`<div class="card eq-einheiten">
      <div class="card-h"><div><div class="card-t">Einheiten</div>
        <div class="card-s">Zeile antippen für Mieter, Vertrag und Mieteingang</div></div>
        <button type="button" class="add-btn" id="addUnit">+ Einheit</button></div>
      <div class="card-b"><div class="eq-tab" role="table" aria-label="Einheiten">
        <div class="eq-tab-kopf" role="row">
          <div role="columnheader">Bezeichnung</div><div role="columnheader">Mieter</div>
          <div role="columnheader" class="eq-c-f">Fläche</div><div role="columnheader" class="eq-c-b">Miete</div>
          <div role="columnheader">Status</div><div role="columnheader">Miete ${esc(monat)}</div></div>
        ${zeilen}</div></div></div>`);
    karte.querySelectorAll(".eq-tab-z").forEach(z => {
      const u = einheiten[Number(z.dataset.i)];
      z.onclick = (e) => { if (e.target.closest("button")) return; openUnitSheet(s, u); };
      // e.repeat: Wer die Eingabetaste auf „Eingegangen" gedrückt hält, öffnet nicht danach noch das Fenster
      z.onkeydown = (e) => { if ((e.key === "Enter" || e.key === " ") && e.target === z && !e.repeat) { e.preventDefault(); openUnitSheet(s, u); } };
    });
    karte.querySelectorAll("[data-miete]").forEach(b =>
      b.onclick = () => mieteSetzen(einheiten[Number(b.dataset.miete)], true, b));
    karte.querySelector("#addUnit").onclick = anlegen;
    return karte;
  }

  // Woraus sich die Miete zusammensetzt
  function zusammensetzungKarte(s) {
    const einheiten = s.einheiten || [];
    const totalKalt = einheiten.reduce((a, u) => a + FE.unitIncome(u).kalt, 0);
    const totalNk = einheiten.reduce((a, u) => a + FE.unitIncome(u).nk, 0);
    const totalKueche = einheiten.reduce((a, u) => a + (Number(u.kueche) || 0), 0);
    const totalStrom = einheiten.reduce((a, u) => a + (Number(u.strom) || 0), 0);
    const totalStell = einheiten.reduce((a, u) => a + (Number(u.stellplatz) || 0), 0);
    const comp = [
      { name: "Kaltmiete", value: totalKalt, color: PALETTE[0] },
      { name: s.nkAlsPuffer ? "Nebenkosten (Puffer)" : "Nebenkosten", value: totalNk, color: PALETTE[1] },
      { name: "Küche", value: totalKueche, color: PALETTE[3] },
      { name: "Strom", value: totalStrom, color: PALETTE[4] },
      { name: "Stellplatz", value: totalStell, color: PALETTE[5] }
    ].filter(x => x.value > 0);
    if (!comp.length) return null;
    const legend = comp.map(x => `<div class="leg"><span class="sw" style="background:${x.color}"></span>
      <span class="lt">${esc(x.name)}</span><span class="lv">${eur(x.value)}</span></div>`).join("");
    return el(`<div class="card pad">
      <div class="card-t" style="margin-bottom:4px">Zusammensetzung</div>
      <div class="card-s" style="margin-bottom:18px">${s.nkAlsPuffer ? "Alle Einheiten bei Vollvermietung, mit Nebenkosten-Puffer" : "Alle Einheiten bei Vollvermietung"}</div>
      <div class="donut-row">${donut(comp)}<div class="legend">${legend}</div></div></div>`);
  }

  // Nebenkosten, die als Rücklage behandelt werden
  function nkPufferKarte(s) {
    const m = FE.streamMonthly(s);
    if (!(m.nkPuffer > 0)) return null;
    const karte = el(`<div class="card pad clickable" role="button" tabindex="0" style="border-color:color-mix(in srgb,var(--warn) 45%,transparent)">
      <div class="eq-puffer">
        <div class="tile-ic" style="color:var(--warn)">${svg("layers")}</div>
        <div class="eq-puffer-tx"><div class="card-t">Nebenkosten als Puffer</div>
          <div class="note">${eur(m.nkPuffer)} im Monat (${eur(m.nkPuffer * 12)} im Jahr) werden vollständig zurückgelegt. Antippen zeigt die Aufschlüsselung.</div></div>
        <div class="eq-puffer-z"><div class="tile-num" style="color:var(--gold)">${eur(m.nkPuffer)}</div><div class="note">Rücklage im Monat</div></div>
      </div></div>`);
    karte.onclick = () => openNkSheet(s, m);
    karte.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openNkSheet(s, m); } };
    return karte;
  }

  // Finanzierung: eine Karte je Kredit
  function finanzierungBereich(s) {
    const kredite = FE.creditsOf(s);
    const anlegen = () => openCreditEdit(s, null, true);
    if (!kredite.length) {
      const leer = el(`<div class="card">
        <div class="card-h"><div><div class="card-t">Finanzierung</div></div></div>
        <div class="card-b"><div class="eq-leer">Noch kein Kredit erfasst. Mit einem Kredit rechnet ESTRIQ Tilgung, Restschuld und Netto-Cashflow.
          <div><button type="button" class="add-btn" id="addCredit">+ Kredit hinzufügen</button></div></div></div></div>`);
      leer.querySelector("#addCredit").onclick = anlegen;
      return leer;
    }
    const teile = [abschnittKopf("Finanzierung", mehrzahl(kredite.length, "Kredit", "Kredite") + " · Karte antippen für den Tilgungsplan",
      { id: "addCredit", text: "+ Kredit", tun: anlegen })];
    kredite.forEach(kr => {
      const c = creditCard(kr);
      c.classList.add("clickable");
      c.setAttribute("role", "button"); c.setAttribute("tabindex", "0");
      c.onclick = () => openCreditSheet(kr);
      c.onkeydown = (e) => { if ((e.key === "Enter" || e.key === " ") && e.target === c && !e.repeat) { e.preventDefault(); openCreditSheet(kr); } };
      teile.push(c);
    });
    return teile;
  }

  const OBJEKT_BAUSTEINE = {
    kopf: objektKopf,
    mieten: (s) => offeneMietenKarte([s]),
    kennzahlen: objektKennzahlen,
    einheiten: einheitenKarte,
    zusammensetzung: zusammensetzungKarte,
    ruecklage: nkPufferKarte,
    finanzierung: finanzierungBereich,
    handwerker: (s) => gewerkeKarte(s),
    nebenkosten: (s) => nebenkostenKarte(s)
  };
  // Feste Reihenfolge der Objektseite. Der Baustein „mieten" (Karte Offene Mieten) steht hier nicht:
  // Auf der Objektseite bestätigt man den Eingang direkt in der Einheitenliste.
  const OBJEKT_REIHENFOLGE = ["kopf", "kennzahlen", "einheiten", "zusammensetzung", "ruecklage", "finanzierung", "handwerker", "nebenkosten"];

  // Setzt eine Seite aus Bausteinen zusammen
  function objektSeite(host, s, reihenfolge) {
    (reihenfolge || OBJEKT_REIHENFOLGE).forEach(name => {
      const teil = OBJEKT_BAUSTEINE[name](s);
      (Array.isArray(teil) ? teil : [teil]).forEach(k => { if (k) host.appendChild(k); });
    });
  }

  function renderStream(host, id) {
    const s = (D.streams || []).find(x => x.id === id);
    if (!s) {
      $("#eyebrow").textContent = "Vermietung"; $("#pageTitle").textContent = "Objekt"; $("#pageSub").textContent = "";
      const fehlt = el(`<div class="card eq-leer"><div>Dieses Objekt gibt es nicht mehr.</div>
        <button type="button" class="eq-btn">Zu allen Mietobjekten</button></div>`);
      fehlt.querySelector("button").onclick = () => geheZu("vermietung");
      host.appendChild(fehlt);
      return;
    }
    const m = FE.streamMonthly(s);
    const flaeche = (s.einheiten || []).reduce((a, u) => a + (Number(u.flaeche) || 0), 0);
    $("#eyebrow").textContent = "Vermietung";
    $("#pageTitle").textContent = s.name;
    $("#pageSub").textContent = [s.ort, "Mietobjekt", mehrzahl(m.einheiten, "Einheit", "Einheiten"), flaeche ? qm(flaeche) : ""]
      .filter(Boolean).join(" · ");
    objektSeite(host, s);
  }

  function dateDE(iso) { const d = new Date(iso); return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }); }

  // Eine Kredit-Tilgungskarte (Zins, optional Sondertilgung, Restschuld-Kurve)
  function creditCard(kr) {
    const plan = FE.creditPlan(kr);
    const months = plan ? plan.monate : 0;
    const rowsPlan = plan ? plan.rows : [];
    const curve = [];
    const rawKeys = [];
    const stepN = Math.min(rowsPlan.length, 96);
    let markerIdx = null;
    const nowKey = new Date().toISOString().slice(0, 7);
    if (rowsPlan.length) {
      curve.push(kr.summe); rawKeys.push(plan.startKey); // Startpunkt
      for (let x = 1; x <= stepN; x++) {
        const rowI = Math.min(rowsPlan.length - 1, Math.round(x * rowsPlan.length / stepN) - 1);
        curve.push(rowsPlan[rowI].rest);
        rawKeys.push(rowsPlan[rowI].monat);
      }
      // Index des ersten Kurvenpunkts, dessen Monat >= heute ist
      if (plan.startKey <= nowKey) {
        let idx = 0;
        for (let j = 0; j < rawKeys.length; j++) { if (rawKeys[j] <= nowKey) idx = j; }
        markerIdx = idx;
      }
    }
    const hasSt = !!kr.sondertilgung;
    const stTxt = hasSt ? `${eur(kr.sondertilgung.betrag)} zum 01.06. & 01.12.` : "keine";
    const title = kr.name || "Kredit";
    const restNow = plan ? plan.restAktuell : kr.summe;
    const paid = plan ? plan.getilgtBisher : 0;
    const startTxt = plan && plan.startKey ? monthYear(plan.startKey) : "";
    const endTxt = plan && plan.abzahlDatum ? monthYear(plan.abzahlDatum) : "";
    const startFuture = plan && plan.startKey > nowKey;
    const chartLabels = plan ? [startTxt, "", "", endTxt] : null;
    return el(`<div class="card"><div class="card-h"><div><div class="card-t">${esc(title)}</div>
      <div class="card-s">${eur(kr.summe)} · ${kr.zinsPa ? kr.zinsPa.toLocaleString("de-DE") + " % Zins · " : ""}${eur2(kr.abtragMonat)}/Monat · Start ${startTxt}</div></div>
      <div class="head-pill" style="padding:7px 13px">${plan && plan.getilgt ? "Laufzeit " + plan.jahre.toLocaleString("de-DE") + " J." : "läuft"}</div></div>
      <div class="card-b">
        <div class="stat-strip" style="margin-bottom:16px">
          <div class="s"><span>Restschuld heute</span><b>${eur2(restNow)}</b></div>
          <div class="s"><span>getilgt bisher</span><b>${startFuture ? "—" : eur2(paid)}</b></div>
          <div class="s"><span>Rate/Monat</span><b>${eur2(kr.abtragMonat)}</b></div>
          ${hasSt ? `<div class="s"><span>Sondertilgung</span><b>${eur(kr.sondertilgung.betrag)}</b></div>` : ""}
          <div class="s"><span>Laufzeit</span><b>${months} Mon. (bis ${endTxt})</b></div>
          ${hasSt ? `<div class="s"><span>Σ Sondertilgung</span><b>${eur(plan.sonderGesamt)}</b></div>` : ""}
        </div>
        ${areaChart(curve.length ? curve : [kr.summe, 0], chartLabels, startFuture ? null : markerIdx)}
        <div class="note" style="margin-top:8px">${startFuture ? "Tilgung beginnt " + startTxt + ". " : "Der Punkt markiert die heutige Restschuld. "}Restschuld inkl. ${kr.zinsPa ? kr.zinsPa.toLocaleString("de-DE") + " % Zins p.a." : "Zins"}${hasSt ? " und Sondertilgung (" + stTxt + ")" : ""}. Nach Tilgung steigt der Netto-Cashflow um ${eur(kr.abtragMonat)}/Monat.</div>
      </div></div>`);
  }
  function monthYear(key) { const d = new Date(key + "-01"); return d.toLocaleDateString("de-DE", { month: "2-digit", year: "numeric" }); }

  /* ---------- DETAIL-SHEETS ---------- */
  // opt.geradeGeaendert: Das Fenster zeigt den Stand direkt nach „Eingegangen" oder „Zurücknehmen".
  // Der Knopf an derselben Stelle ist dann kurz gesperrt, damit ein zweites Tippen nichts zurückdreht.
  function openUnitSheet(s, u, opt) {
    if (!u) return;
    opt = opt || {};
    const inc = FE.unitIncome(u);
    const alle = (s.einheiten || []).map(x => FE.unitIncome(x).gesamt);
    const gesamtAlle = alle.reduce((a, b) => a + b, 0) || 1;
    const anteil = Math.round(inc.gesamt / gesamtAlle * 100);
    const proM2 = u.flaeche ? inc.kalt / u.flaeche : 0;
    const schnitt = (s.einheiten || []).reduce((a, x) => {
      const i2 = FE.unitIncome(x); return a + (x.flaeche ? i2.kalt / x.flaeche : 0);
    }, 0) / ((s.einheiten || []).length || 1);
    const v = u.vertrag || {};
    const on = u.status === "vermietet";
    const ertrag = s.nkAlsPuffer ? inc.gesamt - inc.nk : inc.gesamt;

    // Mietdauer
    let dauer = "—";
    if (u.einzug) {
      const d0 = new Date(u.einzug), now = new Date();
      const mon = (now.getFullYear() - d0.getFullYear()) * 12 + (now.getMonth() - d0.getMonth());
      dauer = d0 > now ? "Einzug steht bevor" : (mon < 1 ? "seit diesem Monat" : mon + " Monate");
    }

    const parts = [
      { label: "Kaltmiete", value: inc.kalt, color: PALETTE[0] },
      { label: "Nebenkosten", value: inc.nk, color: PALETTE[1] },
      { label: "Küche", value: inc.kueche, color: PALETTE[3] },
      { label: "Strom", value: inc.strom, color: PALETTE[4] },
      { label: "Stellplatz", value: inc.stell, color: PALETTE[5] }
    ].filter(x => x.value > 0);

    // Zustand zuerst: frei, Miete da, Miete offen oder noch nicht fällig
    const stand = mietStand(u), monat = monatsName();
    const zahlung = zahlungVon(u);
    const tag = zahltagIm(u);
    let zustand;
    if (stand === "frei") {
      zustand = `<div class="eq-zustand achtung"><div class="eq-zustand-tx">
          <div class="eq-zustand-t">Diese Einheit ist frei</div>
          <div class="eq-zustand-d">${ertrag > 0 ? "Vermietet brächte sie " + eur(ertrag) + " Ertrag im Monat" + (s.nkAlsPuffer && inc.nk > 0 ? " (ohne Nebenkosten)." : ".") : "Für sie ist noch keine Miete hinterlegt."}</div></div></div>`;
    } else if (stand === "bestaetigt") {
      zustand = `<div class="eq-zustand gut"><div class="eq-zustand-tx">
          <div class="eq-zustand-t">Miete für ${esc(monat)} ist eingegangen</div>
          <div class="eq-zustand-d">${zahlung && zahlung.bestaetigt_am ? "Gespeichert am " + dateDE(zahlung.bestaetigt_am) + " · " : ""}${eur(inc.gesamt)}</div></div>
        <button type="button" class="eq-btn zweit" data-miete="0">Zurücknehmen</button></div>`;
    } else if (stand === "offen") {
      zustand = `<div class="eq-zustand achtung"><div class="eq-zustand-tx">
          <div class="eq-zustand-t">Miete für ${esc(monat)} ist offen</div>
          <div class="eq-zustand-d">Fällig seit dem ${tag}. · ${eur(inc.gesamt)}</div></div>
        <button type="button" class="eq-btn" data-miete="1">Eingegangen</button></div>`;
    } else if (stand === "keine") {
      zustand = `<div class="eq-zustand"><div class="eq-zustand-tx">
          <div class="eq-zustand-t">Für diese Einheit ist keine Miete hinterlegt</div>
          <div class="eq-zustand-d">Trag die Miete über „Bearbeiten“ ein – dann fragt ESTRIQ jeden Monat nach dem Eingang.</div></div></div>`;
    } else {
      zustand = `<div class="eq-zustand"><div class="eq-zustand-tx">
          <div class="eq-zustand-t">Miete für ${esc(monat)} wird am ${tag}. fällig</div>
          <div class="eq-zustand-d">${eur(inc.gesamt)}</div></div>
        <button type="button" class="eq-btn zweit" data-miete="1">Schon eingegangen</button></div>`;
    }

    const body = `
      ${zustand}
      <div class="stat-strip" style="margin-bottom:18px">
        <div class="s"><span>Warmmiete</span><b>${eur(inc.gesamt)}</b></div>
        <div class="s"><span>Ertrag${s.nkAlsPuffer ? " ohne Nebenkosten" : ""}</span><b style="color:var(--mint-2)">${eur(ertrag)}</b></div>
        <div class="s"><span>€ / m²</span><b>${proM2.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></div>
        <div class="s"><span>Anteil Objekt</span><b>${anteil} %</b></div>
      </div>
      <div class="card-t" style="font-size:14px;margin-bottom:10px">Zusammensetzung</div>
      ${miniBars(parts)}
      <div class="card-t" style="font-size:14px;margin:20px 0 6px">Mieter</div>
      ${kv("Name", on ? esc(u.mieter || "—") : '<span style="color:var(--gold)">frei</span>')}
      ${kv("Einzug", u.einzug ? dateDE(u.einzug) : "—")}
      ${kv("Mietdauer", dauer)}
      ${u.personen ? kv("Personen im Haushalt", esc(u.personen)) : ""}
      ${v.telefon ? kv("Telefon", esc(v.telefon)) : ""}
      ${v.email ? kv("E-Mail", esc(v.email)) : ""}
      <div class="card-t" style="font-size:14px;margin:20px 0 6px">Vertrag</div>
      ${kv("Miete fällig am", Math.min(31, Math.max(1, Math.round(Number(u.zahltag) || 1))) + ". des Monats")}
      ${kv("Kaution", v.kaution != null ? eur(v.kaution) : "—", v.kaution == null)}
      ${kv("Vertragsdatum", v.vertragsdatum ? dateDE(v.vertragsdatum) : "—", !v.vertragsdatum)}
      ${kv("Laufzeit", v.laufzeit ? esc(v.laufzeit) : "—", !v.laufzeit)}
      ${kv("Kündigungsfrist", v.kuendigungsfrist ? esc(v.kuendigungsfrist) : "—", !v.kuendigungsfrist)}
      ${v.notiz ? `<div class="note" style="margin-top:14px">${esc(v.notiz)}</div>` : ""}
      <div class="note" style="margin-top:16px">Vergleich: ${proM2 >= schnitt ? "über" : "unter"} dem Objektschnitt von ${schnitt.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/m².</div>
      <button class="ef-open" id="efEdit">Bearbeiten</button>`;
    const sh = openSheet((u.wohnung || "Einheit") + (u.flaeche ? " · " + qm(u.flaeche) : ""), s.name, body);
    sh.querySelector("#efEdit").onclick = () => openUnitEdit(s, u, false);
    // Mieteingang in einem Schritt bestätigen oder zurücknehmen; danach zeigt das Fenster den neuen Stand
    const mb = sh.querySelector("[data-miete]");
    if (mb && opt.geradeGeaendert) {
      mb.disabled = true;
      setTimeout(() => { if (mb.isConnected) mb.disabled = false; }, 1200);
    }
    if (mb) mb.onclick = async () => {
      const ok = await mieteSetzen(u, mb.dataset.miete === "1", mb);
      if (ok !== true) return;
      const s2 = (D.streams || []).find(x => x._id === s._id);
      const u2 = s2 && (s2.einheiten || []).find(x => x._id === u._id);
      if (u2 && sh.isConnected) openUnitSheet(s2, u2, { geradeGeaendert: true });
    };
  }

  function openCreditSheet(kr) {
    const p = FE.creditPlan(kr);
    if (!p) return;
    const rows = p.rows;
    // Jahresweise verdichten
    const byYear = {};
    rows.forEach(r => {
      const y = r.monat.slice(0, 4);
      byYear[y] = byYear[y] || { zins: 0, tilgung: 0, sonder: 0, rest: 0 };
      byYear[y].zins += r.zins; byYear[y].tilgung += r.tilgung;
      byYear[y].sonder += r.sonder; byYear[y].rest = r.rest;
    });
    const trs = Object.keys(byYear).sort().map(y => {
      const b = byYear[y];
      return `<tr><td>${y}</td><td>${eur(b.zins)}</td><td>${eur(b.tilgung + b.sonder)}</td>
        <td class="hl">${eur(b.rest)}</td></tr>`;
    }).join("");
    const zinsAnteil = p.zinsGesamt / ((Number(kr.summe) || 1) + p.zinsGesamt) * 100;
    const body = `
      <div class="stat-strip" style="margin-bottom:18px">
        <div class="s"><span>Restschuld heute</span><b>${eur(p.restAktuell)}</b></div>
        <div class="s"><span>getilgt</span><b>${eur(p.getilgtBisher)}</b></div>
        <div class="s"><span>Zinsen gesamt</span><b>${eur(p.zinsGesamt)}</b></div>
        <div class="s"><span>Laufzeit</span><b>${p.jahre.toLocaleString("de-DE")} J.</b></div>
      </div>
      <div class="card-t" style="font-size:14px;margin-bottom:10px">Kostenverteilung</div>
      ${miniBars([
        { label: "Darlehen", value: Number(kr.summe) || 0, color: "var(--eq-reihe-1)" },
        { label: "Zinskosten", value: p.zinsGesamt, color: "var(--eq-reihe-2)" }
      ])}
      <div class="note" style="margin-top:8px">${zinsAnteil.toFixed(1)} % der Gesamtkosten sind Zinsen.</div>
      <div class="card-t" style="font-size:14px;margin:20px 0 10px">Tilgung je Jahr</div>
      <table class="tbl"><thead><tr><th>Jahr</th><th>Zins</th><th>Tilgung</th><th>Restschuld</th></tr></thead>
      <tbody>${trs}</tbody></table>
      <button class="ef-open" id="efEdit">Bearbeiten</button>`;
    const sh = openSheet(kr.name || "Kredit", eur(kr.summe) + " · " + (kr.zinsPa || 0).toLocaleString("de-DE") + " % · " + eur(kr.abtragMonat) + "/Monat", body);
    const kstream = (D.streams || []).find(x => FE.creditsOf(x).some(c => c._id === kr._id));
    sh.querySelector("#efEdit").onclick = () => openCreditEdit(kstream, kr, false);
  }

  function openCashflowSheet(s) {
    const m = FE.streamMonthly(s);
    const k = FE.immoKPIs(s);
    const kredite = FE.creditsOf(s);
    const body = `
      <div class="card-t" style="font-size:14px;margin-bottom:10px">Herleitung</div>
      ${kv("Ertrag" + (s.nkAlsPuffer ? " ohne Nebenkosten" : ""), eur(m.gesamt))}
      ${kredite.map(kr => kv("− " + (kr.name || "Kredit"), "−" + eur(kr.abtragMonat))).join("")}
      ${kv("Netto-Cashflow im Monat", eur(m.netto))}
      <div class="eq-zustand" style="margin:14px 0 0"><div class="eq-zustand-tx">
        <div class="eq-zustand-t">Laufende Kosten sind hier nicht abgezogen</div>
        <div class="eq-zustand-d">Instandhaltung, Verwaltung, nicht umlagefähige Nebenkosten und Steuern fehlen in dieser Zahl. Mit dem Cashflow-Rechner rechnest du sie dazu.</div></div>
        <button type="button" class="eq-btn zweit" id="cfRechner">Zum Rechner</button></div>
      ${s.nkAlsPuffer ? `<div class="note" style="margin-top:12px">Zusätzlich ${eur(m.nkPuffer)}/Monat Nebenkosten als Rücklage (nicht im Ertrag).</div>` : ""}
      <div class="card-t" style="font-size:14px;margin:20px 0 10px">Wenn alles vermietet wäre</div>
      ${kv("Ertrag bei Vollvermietung", eur(m.gesamtPotenzial))}
      ${kv("Netto-Cashflow im Monat", eur(m.gesamtPotenzial - m.kreditAbtrag))}
      ${kv("Cashflow-ROI", s.invest ? ((m.gesamtPotenzial - m.kreditAbtrag) * 12 / s.invest * 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " %" : "—")}
      <div class="note" style="margin-top:14px">Differenz zu heute: ${eur(m.gesamtPotenzial - m.gesamt)}/Monat aus leerstehenden Einheiten.</div>`;
    const sh = openSheet("Netto-Cashflow", s.name, body);
    sh.querySelector("#cfRechner").onclick = () => openRechner("cashflow");
  }

  function openNkSheet(s, m) {
    const verm = (s.einheiten || []).filter(u => u.status === "vermietet");
    const proWohnung = verm.map((u, i) => {
      const inc = FE.unitIncome(u);
      return { label: u.wohnung, value: inc.nk, color: PALETTE[i % PALETTE.length],
               display: eur(inc.nk) };
    });
    const jahr = m.nkPuffer * 12;
    const pos = (s.nkPositionen || []).map((p, i) => {
      // Neue Daten haben feste Beträge; alte hatten Prozent-Anteile
      const wert = p.betrag != null ? Number(p.betrag) : (m.nkPuffer * (p.anteil || 0) / 100);
      return { label: p.titel, value: wert, color: PALETTE[i % PALETTE.length], display: eur(wert) + " /Monat" };
    });
    const frei = (s.einheiten || []).filter(u => u.status !== "vermietet");
    const entgangen = frei.reduce((a, u) => a + FE.unitIncome(u).nk, 0);

    const body = `
      <div class="stat-strip" style="margin-bottom:18px">
        <div class="s"><span>je Monat</span><b style="color:var(--gold)">${eur(m.nkPuffer)}</b></div>
        <div class="s"><span>je Jahr</span><b>${eur(jahr)}</b></div>
        <div class="s"><span>je m²</span><b>${(s.einheiten || [])[0] ? ((s.einheiten[0].nkProM2 != null ? s.einheiten[0].nkProM2 : (FE.unitIncome(s.einheiten[0]).nk / (s.einheiten[0].flaeche || 1)))).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"} €</b></div>
        <div class="s"><span>Einheiten</span><b>${verm.length} vermietet</b></div>
      </div>
      <div class="card-t" style="font-size:14px;margin-bottom:10px">Beitrag je Wohnung</div>
      ${miniBars(proWohnung)}
      ${entgangen > 0 ? `<div class="note" style="margin-top:10px">Durch Leerstand fehlen zusätzlich ${eur(entgangen)}/Monat an NK-Umlage.</div>` : ""}
      ${pos.length ? `<div class="card-t" style="font-size:14px;margin:20px 0 10px">Wofür die Rücklage verwendet wird</div>
      ${miniBars(pos)}
      <div class="note" style="margin-top:10px">Richtwerte für die Verteilung. Die tatsächliche Abrechnung erfolgt jährlich gegenüber den Mietern.</div>` : ""}
      <div class="card-t" style="font-size:14px;margin:20px 0 6px">Warum Puffer statt Ertrag</div>
      <div class="note">Nebenkosten sind durchlaufende Posten: Die Mieter zahlen Vorauszahlungen, aus denen Heizung, Grundsteuer, Versicherung und Wartung beglichen werden. Über- oder Nachzahlungen werden jährlich ausgeglichen. Deshalb zählen sie hier nicht zum Ertrag – sonst würde der Cashflow zu hoch ausgewiesen.</div>
      <div style="margin-top:16px">
        ${kv("Rücklage über 3 Jahre", eur(jahr * 3))}
        ${kv("Rücklage über 10 Jahre", eur(jahr * 10))}
      </div>`;
    openSheet("Nebenkosten-Puffer", s.name, body);
  }

  function openCalendarSheet() {
    const now = new Date();
    const y = now.getFullYear(), mo = now.getMonth();
    // Jahresübersicht der Zahlungsströme
    const monate = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(y, mo + i, 1);
      const map = eventsForMonth(d.getFullYear(), d.getMonth());
      let anzahl = 0, typen = {};
      Object.values(map).forEach(list => list.forEach(e => { anzahl++; typen[e.typ] = (typen[e.typ] || 0) + 1; }));
      monate.push({ d, anzahl, typen });
    }
    const t = FE.totals(D);
    // Sondertilgungen im Jahresverlauf
    let sonderJahr = 0;
    (D.streams || []).forEach(s => FE.creditsOf(s).forEach(kr => {
      if (kr.sondertilgung) sonderJahr += (kr.sondertilgung.betrag || 0) * (kr.sondertilgung.monate || []).length;
    }));

    const trs = monate.map(x => `<tr>
      <td>${x.d.toLocaleDateString("de-DE", { month: "short", year: "2-digit" })}</td>
      <td>${x.typen.miete || 0}</td><td>${x.typen.einzug || 0}</td>
      <td>${x.typen.zahlung || 0}</td><td class="hl">${x.anzahl}</td></tr>`).join("");

    const body = `
      <div class="stat-strip" style="margin-bottom:18px">
        <div class="s"><span>Mieteingang/Mon.</span><b>${eur(t.miete)}</b></div>
        <div class="s"><span>Mieteingang/Jahr</span><b>${eur(t.miete * 12)}</b></div>
        <div class="s"><span>Sondertilgung/Jahr</span><b>${eur(sonderJahr)}</b></div>
        <div class="s"><span>Termine 12 Mon.</span><b>${monate.reduce((a, x) => a + x.anzahl, 0)}</b></div>
      </div>
      <div class="card-t" style="font-size:14px;margin-bottom:10px">Wiederkehrende Ereignisse</div>
      <div class="tl">
        ${t.miete > 0 ? `<div class="tl-i"><span class="tl-dot" style="background:${EVT.miete.col}"></span>
          <div class="tl-b"><div class="tl-t">Mieteingang</div>
            <div class="tl-s">jeden 1. des Monats · alle Objekte</div></div>
          <span class="tl-v">${eur(t.miete)}</span></div>` : ""}
        ${(D.streams || []).flatMap(s => FE.creditsOf(s).filter(kr => kr.sondertilgung).map(kr => {
          const st = kr.sondertilgung;
          const monLabel = (st.monate || []).map(m => ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"][m-1]).join(" und ");
          return `<div class="tl-i"><span class="tl-dot" style="background:${EVT.zahlung.col}"></span>
            <div class="tl-b"><div class="tl-t">Sondertilgung ${esc(kr.name || "")}</div>
              <div class="tl-s">${monLabel || "jährlich"}</div></div>
            <span class="tl-v">${eur(st.betrag || 0)}</span></div>`;
        })).join("")}
      </div>
      <div class="card-t" style="font-size:14px;margin:20px 0 10px">Termine je Monat</div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Monat</th><th>Miete</th><th>Einzug</th><th>Zahlung</th><th>Gesamt</th></tr></thead>
        <tbody>${trs}</tbody></table></div>
      ${sonderJahr > 0 ? `<div class="note" style="margin-top:12px">Sondertilgungen summieren sich über das Jahr auf ${eur(sonderJahr)}.</div>` : ""}`;
    openSheet("Kalender-Übersicht", "Zahlungsströme der nächsten 12 Monate", body);
  }

  function openPortfolioSheet(kind, c) {
    const t = c.t;
    const streams = (D.streams || []);
    if (kind === "einnahmen") {
      const rows = streams.map((s, i) => {
        const m = FE.streamMonthly(s);
        return { label: shortLabel(s.name), value: m.gesamt, color: PALETTE[i % PALETTE.length] };
      }).filter(x => x.value > 0);
      const body = `
        <div class="stat-strip" style="margin-bottom:18px">
          <div class="s"><span>je Monat</span><b style="color:var(--mint-2)">${eur(t.ist)}</b></div>
          <div class="s"><span>je Jahr</span><b>${eur(t.jahrIst)}</b></div>
          <div class="s"><span>je Quartal</span><b>${eur(t.ist * 3)}</b></div>
          <div class="s"><span>je Tag</span><b>${eur(t.ist * 12 / 365)}</b></div>
        </div>
        <div class="card-t" style="font-size:14px;margin-bottom:10px">Nach Objekt</div>
        ${rows.length ? miniBars(rows) : `<div class="note">Noch keine Einnahmen erfasst.</div>`}
        <div class="note" style="margin-top:12px">Nebenkosten sind nicht enthalten – sie laufen als Rücklage separat.</div>`;
      return openSheet("Einnahmen", "Alle Objekte · Stand heute", body);
    }
    if (kind === "potenzial") {
      const rows = streams.map((s, i) => {
        const m = FE.streamMonthly(s);
        const diff = (m.gesamtPotenzial || m.gesamt) - m.gesamt;
        return { label: shortLabel(s.name), value: diff, color: PALETTE[i % PALETTE.length] };
      }).filter(x => x.value > 0);
      const frei = [];
      streams.forEach(s => (s.einheiten || []).forEach(u => {
        if (u.status !== "vermietet") frei.push({ s, u, inc: FE.unitIncome(u) });
      }));
      const body = `
        <div class="stat-strip" style="margin-bottom:18px">
          <div class="s"><span>Ist</span><b>${eur(t.ist)}</b></div>
          <div class="s"><span>Potenzial</span><b style="color:var(--mint-2)">${eur(t.potenzial)}</b></div>
          <div class="s"><span>Differenz</span><b>${eur(c.upside)}</b></div>
          <div class="s"><span>je Jahr</span><b>${eur(c.upside * 12)}</b></div>
        </div>
        ${rows.length ? `<div class="card-t" style="font-size:14px;margin-bottom:10px">Ungenutztes Potenzial</div>${miniBars(rows)}` : ""}
        ${frei.length ? `<div class="card-t" style="font-size:14px;margin:20px 0 10px">Leerstehende Einheiten</div>
        ${frei.map(f => kv(f.u.wohnung + " · " + f.u.flaeche + " m² (" + shortLabel(f.s.name) + ")",
          eur(f.s.nkAlsPuffer ? f.inc.gesamt - f.inc.nk : f.inc.gesamt))).join("")}` : ""}
        <div class="card-t" style="font-size:14px;margin:20px 0 6px">Auswirkung bei Vollvermietung</div>
        ${kv("Netto-Cashflow heute", eur(c.nettoMonth))}
        ${kv("Netto-Cashflow voll", eur(c.nettoPot))}
        ${kv("Zuwachs je Jahr", eur((c.nettoPot - c.nettoMonth) * 12))}`;
      return openSheet("Einnahmen-Potenzial", "Was bei Vollvermietung möglich ist", body);
    }
    if (kind === "netto") {
      const body = `
        <div class="card-t" style="font-size:14px;margin-bottom:10px">Herleitung</div>
        ${kv("Einnahmen gesamt", eur(t.ist))}
        ${kv("− Tilgung alle Kredite", "−" + eur(c.debtMonth))}
        ${kv("Netto-Cashflow", eur(c.nettoMonth))}
        <div class="card-t" style="font-size:14px;margin:20px 0 10px">Tilgungsanteil je Kredit</div>
        ${miniBars((() => {
          const out = [];
          streams.forEach((s, si) => FE.creditsOf(s).forEach((kr, ki) => out.push({
            label: (kr.name || "Kredit"), value: Number(kr.abtragMonat) || 0,
            color: PALETTE[(si + ki) % PALETTE.length]
          })));
          return out;
        })())}
        <div class="note" style="margin-top:12px">Die Tilgung ist kein Verlust – sie baut Eigenkapital auf. Aktuell fließen ${eur(c.debtMonth)}/Monat in die Entschuldung.</div>
        <div class="card-t" style="font-size:14px;margin:20px 0 6px">Zeitraum</div>
        ${kv("je Monat", eur(c.nettoMonth))}
        ${kv("je Jahr", eur(c.nettoMonth * 12))}
        ${kv("bei Vollvermietung / Jahr", eur(c.nettoPot * 12))}`;
      return openSheet("Netto-Cashflow", "Nach allen Kreditraten", body);
    }
    if (kind === "auslastung") {
      const rows = [];
      streams.forEach(s => (s.einheiten || []).forEach(u => {
        const inc = FE.unitIncome(u);
        rows.push({ s, u, inc, on: u.status === "vermietet" });
      }));
      const frei = rows.filter(r => !r.on);
      const body = `
        <div class="stat-strip" style="margin-bottom:18px">
          <div class="s"><span>Vermietet</span><b style="color:var(--mint-2)">${c.unitsLet}</b></div>
          <div class="s"><span>Frei</span><b style="color:var(--gold)">${c.unitsTotal - c.unitsLet}</b></div>
          <div class="s"><span>Quote</span><b>${Math.round(c.unitsLet / c.unitsTotal * 100)} %</b></div>
          <div class="s"><span>Fläche gesamt</span><b>${rows.reduce((a, r) => a + (Number(r.u.flaeche) || 0), 0)} m²</b></div>
        </div>
        <div class="card-t" style="font-size:14px;margin-bottom:10px">Alle Einheiten</div>
        ${rows.map(r => kv(
          r.u.wohnung + " · " + r.u.flaeche + " m²" + (r.u.mieter ? " · " + r.u.mieter : ""),
          r.on ? eur(r.s.nkAlsPuffer ? r.inc.gesamt - r.inc.nk : r.inc.gesamt)
               : '<span style="color:var(--gold)">frei</span>')).join("")}
        ${frei.length ? `<div class="note" style="margin-top:12px">Bei Vermietung der ${frei.length === 1 ? "freien Einheit" : frei.length + " freien Einheiten"} steigt der Ertrag um ${eur(c.upside)}/Monat.</div>` : `<div class="note" style="margin-top:12px">Alle Einheiten sind vermietet.</div>`}`;
      return openSheet("Auslastung", c.unitsLet + " von " + c.unitsTotal + " Einheiten vermietet", body);
    }
    if (kind === "schuld") {
      const list = [];
      streams.forEach(s => FE.creditsOf(s).forEach(kr => {
        const p = FE.creditPlan(kr);
        list.push({ s, kr, p });
      }));
      const quote = c.debtOrig ? (c.paidSoFar / c.debtOrig * 100) : 0;
      const trs = list.map(x => `<tr><td>${esc(x.kr.name || "Kredit")}</td>
        <td>${eur(x.kr.summe)}</td><td>${eur(x.p.restAktuell)}</td>
        <td>${(x.kr.zinsPa || 0).toLocaleString("de-DE")} %</td>
        <td class="hl">${x.p.jahre.toLocaleString("de-DE")} J</td></tr>`).join("");
      const body = `
        <div class="stat-strip" style="margin-bottom:18px">
          <div class="s"><span>Restschuld</span><b>${eur(c.debtRest)}</b></div>
          <div class="s"><span>getilgt</span><b style="color:var(--mint-2)">${eur(c.paidSoFar)}</b></div>
          <div class="s"><span>Tilgungsquote</span><b>${quote.toFixed(1)} %</b></div>
          <div class="s"><span>Rate/Monat</span><b>${eur(c.debtMonth)}</b></div>
        </div>
        <div class="card-t" style="font-size:14px;margin-bottom:10px">Restschuld je Kredit</div>
        ${miniBars(list.map((x, i) => ({ label: x.kr.name || "Kredit", value: x.p.restAktuell, color: PALETTE[i % PALETTE.length] })))}
        <div class="card-t" style="font-size:14px;margin:20px 0 10px">Konditionen</div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Kredit</th><th>Ursprung</th><th>Rest</th><th>Zins</th><th>Laufzeit</th></tr></thead>
          <tbody>${trs}</tbody></table></div>
        <div class="note" style="margin-top:12px">Tilgung ${eur(c.debtMonth * 12)}/Jahr. Die Restschuld sinkt mit jeder Rate, der Tilgungsanteil steigt dabei kontinuierlich.</div>`;
      return openSheet("Restschuld", "Alle Kredite im Portfolio", body);
    }
  }

  /* ---------- BEARBEITEN: Masken ---------- */

  // --- Wohneinheit ---
  function openUnitEdit(s, u, neu) {
    const v = (u && u.vertrag) || {};
    const fix = s.einheiten && s.einheiten.some(x => x.kaltFix != null);
    const body = `
      ${efTitel("Grunddaten")}
      ${ef("Bezeichnung", "bezeichnung", u ? u.wohnung : "", "text", { pflicht: true, platzhalter: "z. B. WE 6" })}
      ${ef("Fläche", "flaeche", u ? u.flaeche : "", "number", { step: "0.01", einheit: "m²", min: 0 })}
      ${efSel("Status", "status", u ? u.status : "frei",
        [{ v: "vermietet", t: "vermietet" }, { v: "frei", t: "frei" }])}
      ${efTitel("Miete im Monat")}
      ${fix
        ? ef("Kaltmiete", "kalt_fix", u ? (u.kaltFix ?? "") : "", "number", { einheit: "€", min: 0, hinweis: "Fester Betrag statt €/m²" }) +
          ef("Nebenkosten", "nk_fix", u ? (u.nkFix ?? "") : "", "number", { einheit: "€", min: 0 })
        : ef("Kaltmiete je m²", "kalt_pro_m2", u ? (u.kaltProM2 ?? "") : "", "number", { einheit: "€", min: 0 }) +
          ef("Nebenkosten je m²", "nk_pro_m2", u ? (u.nkProM2 ?? "") : "", "number", { einheit: "€", min: 0 })}
      ${ef("Küche", "kueche", u ? (u.kueche ?? "") : "", "number", { einheit: "€", min: 0 })}
      ${ef("Strom", "strom", u ? (u.strom ?? "") : "", "number", { einheit: "€", min: 0 })}
      ${ef("Stellplatz", "stellplatz", u ? (u.stellplatz ?? "") : "", "number", { einheit: "€", min: 0 })}
      ${ef("Miete fällig am", "zahltag", (u && u.zahltag) || 1, "number",
        { step: "1", min: 1, max: 31, einheit: "des Monats", hinweis: "Ab diesem Tag gilt die Miete als offen, bis du sie als eingegangen vermerkst. In kürzeren Monaten zählt der letzte Tag.", platzhalter: "1" })}
      ${efTitel("Mieter")}
      ${ef("Name", "mieter", u ? (u.mieter || "") : "")}
      ${ef("Einzug", "einzug", u ? (u.einzug || "") : "", "date")}
      ${ef("Personen im Haushalt", "personen", (u && u.personen) || "", "number",
        { step: "1", min: 1, hinweis: "Für Nebenkosten, die nach Personen verteilt werden (z. B. Wasser, Müll)" })}
      ${ef("Telefon", "v_telefon", v.telefon || "", "tel")}
      ${ef("E-Mail", "v_email", v.email || "", "email")}
      ${efTitel("Vertrag")}
      ${ef("Kaution", "v_kaution", v.kaution ?? "", "number", { einheit: "€", min: 0 })}
      ${ef("Vertragsdatum", "v_vertragsdatum", v.vertragsdatum || "", "date")}
      ${ef("Laufzeit", "v_laufzeit", v.laufzeit || "", "text", { platzhalter: "z. B. unbefristet" })}
      ${ef("Kündigungsfrist", "v_kuendigungsfrist", v.kuendigungsfrist || "", "text", { platzhalter: "z. B. 3 Monate" })}
      ${efArea("Notiz", "v_notiz", v.notiz || "")}
      ${efAktionen({ loeschen: neu ? null : "Löschen" })}`;

    const sheet = openSheet(neu ? "Neue Einheit" : "Einheit bearbeiten",
      (neu ? "" : u.wohnung + " · ") + s.name, body);

    const bauen = (w) => {
      const o = {
        bezeichnung: text(w.bezeichnung) || "Einheit",
        flaeche: zahl(w.flaeche),
        status: w.status,
        kueche: zahl(w.kueche), strom: zahl(w.strom), stellplatz: zahl(w.stellplatz),
        mieter: text(w.mieter), einzug: text(w.einzug),
        zahltag: Math.min(31, Math.max(1, Math.round(Number(w.zahltag)) || 1)),
        personen: w.personen ? Math.max(1, Math.round(Number(w.personen))) : null,
        vertrag: {
          kaution: zahl(w.v_kaution),
          vertragsdatum: text(w.v_vertragsdatum),
          laufzeit: text(w.v_laufzeit),
          kuendigungsfrist: text(w.v_kuendigungsfrist),
          telefon: w.v_telefon || "", email: w.v_email || "", notiz: w.v_notiz || ""
        }
      };
      if ("kalt_fix" in w) { o.kalt_fix = zahl(w.kalt_fix); o.nk_fix = zahl(w.nk_fix); }
      else { o.kalt_pro_m2 = zahl(w.kalt_pro_m2); o.nk_pro_m2 = zahl(w.nk_pro_m2); }
      return o;
    };
    efBind(sheet,
      async (w) => neu ? await neueEinheit(s._id, bauen(w)) : await speichereEinheit(u._id, bauen(w)),
      neu ? null : async () => await loescheEinheit(u._id),
      "Einheit endgültig löschen?");
  }

  // --- Kredit ---
  function openCreditEdit(s, kr, neu) {
    const st = (kr && kr.sondertilgung) || null;
    const body = `
      ${efTitel("Grunddaten")}
      ${ef("Bezeichnung", "name", kr ? kr.name : "", "text", { pflicht: true, platzhalter: "z. B. KfW-Darlehen" })}
      ${ef("Darlehenssumme", "summe", kr ? kr.summe : "", "number", { pflicht: true })}
      ${ef("Zinssatz % p. a.", "zins_pa", kr ? kr.zinsPa : "", "number", { step: "0.001", pflicht: true })}
      ${ef("Rate je Monat", "rate_monat", kr ? kr.abtragMonat : "", "number", { pflicht: true })}
      ${ef("Erste Rate am", "start", kr ? (kr.start || "") : "", "date",
        { hinweis: "Bestimmt den Tilgungsverlauf" })}
      ${efTitel("Kontostand")}
      ${ef("Restschuld laut Bank", "rest_stand_betrag", kr && kr.restStand ? kr.restStand.betrag : "", "number",
        { hinweis: "Maßgeblich für die Anzeige – überschreibt die Modellrechnung" })}
      ${ef("Stand vom", "rest_stand_datum", kr && kr.restStand ? kr.restStand.datum : "", "date")}
      ${efTitel("Sondertilgung")}
      ${ef("Betrag je Zahlung", "st_betrag", st ? st.betrag : "", "number",
        { hinweis: "Leer lassen, wenn keine Sondertilgung vereinbart ist" })}
      ${ef("Monate", "st_monate", st ? (st.monate || []).join(", ") : "", "text",
        { platzhalter: "z. B. 12  oder  6, 12", hinweis: "Monatsnummern durch Komma getrennt" })}
      ${efAktionen({ loeschen: neu ? null : "Löschen" })}`;

    const sheet = openSheet(neu ? "Neuer Kredit" : "Kredit bearbeiten",
      (neu ? "" : (kr.name + " · ")) + s.name, body);

    const bauen = (w) => {
      const monate = String(w.st_monate || "").split(",")
        .map(x => parseInt(x.trim(), 10)).filter(x => x >= 1 && x <= 12);
      const betrag = zahl(w.st_betrag);
      return {
        name: text(w.name) || "Kredit",
        summe: zahl(w.summe) || 0,
        zins_pa: zahl(w.zins_pa) || 0,
        rate_monat: zahl(w.rate_monat) || 0,
        start: text(w.start),
        rest_stand_betrag: zahl(w.rest_stand_betrag),
        rest_stand_datum: text(w.rest_stand_datum),
        sondertilgung: (betrag && monate.length) ? { betrag, monate } : null
      };
    };
    efBind(sheet,
      async (w) => neu ? await neuerKredit(s._id, bauen(w)) : await speichereKredit(kr._id, bauen(w)),
      neu ? null : async () => await loescheKredit(kr._id),
      "Kredit endgültig löschen?");
  }

  // --- Objekt ---
  function openObjektEdit(s, neu, opt) {
    opt = opt || {};
    const nkPos = (s && s.nkPositionen) || [];
    const body = `
      ${opt.nachOnboarding ? `<div class="wc-hero" style="padding-bottom:14px">
        <div class="wc-steps"><span class="done"></span><span class="on"></span><span></span></div>
        <div class="wc-badge">Dein erstes Objekt</div>
        <div class="wc-d">Gib deiner Immobilie einen Namen und trag die Eckdaten ein. Danach legst du gleich die erste Wohnung an.</div>
      </div>` : ""}
      ${neu && !opt.nachOnboarding ? `<div class="anlegen-kopf">${svg("home")}<span>Mietobjekt</span></div>` : ""}
      ${efTitel("Grunddaten")}
      ${ef("Name", "name", s ? s.name : "", "text", { pflicht: true, platzhalter: "z. B. Haus Bergstraße 12" })}
      ${ef("Ort", "ort", s ? (s.ort || "") : "")}
      ${efArea("Notiz", "notiz", s ? (s.note || "") : "")}
      ${ef("Kurzname (intern)", "slug", s ? s.id : "", "text",
        { pflicht: true, hinweis: "Nur für die App, ohne Leerzeichen, z. B. haus-nord. Im Zweifel so lassen." })}
      ${efTitel("Wirtschaftlich")}
      ${ef("Investitionssumme", "invest", s ? (s.invest ?? "") : "", "number",
        { einheit: "€", min: 0, hinweis: "Kaufpreis inkl. Kaufnebenkosten – Basis für die Rendite", platzhalter: "z. B. 250000" })}
      ${efSel("Nebenkosten", "nk_als_puffer", s && s.nkAlsPuffer ? "1" : "0",
        [{ v: "1", t: "als Rücklage behandeln" }, { v: "0", t: "als Ertrag zählen" }],
        { hinweis: "Rücklage: NK werden für Ausgaben zurückgelegt. Ertrag: NK zählen zu den Einnahmen." })}
      ${efArea("Nebenkosten-Arten", "nk_positionen",
        nkPos.map(p => p.titel + " | " + (p.betrag != null ? p.betrag : (p.anteil || 0))).join("\n"),
        { hinweis: "Je Zeile eine Position: Bezeichnung | Betrag pro Monat in €. Beispiel: Grundsteuer | 45" })}
      ${efAktionen({ loeschen: neu ? null : "Objekt löschen", speichern: opt.nachOnboarding ? "Weiter zur Wohnung" : "Speichern" })}`;

    const sheet = openSheet(neu ? "Neues Mietobjekt" : "Objekt bearbeiten", neu ? "" : s.name, body);

    const bauen = (w) => {
      // Nebenkosten-Zeilen "Bezeichnung | Betrag" einlesen (€ pro Monat)
      const pos = String(w.nk_positionen || "").split("\n")
        .map(z => z.split("|"))
        .filter(t => t.length === 2 && t[0].trim())
        .map(t => ({ titel: t[0].trim(), betrag: Number(String(t[1]).replace(",", ".").trim()) || 0 }));
      return {
        name: text(w.name) || "Objekt",
        slug: (text(w.slug) || "objekt").toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        art: "miete",
        icon: "home",
        ort: text(w.ort),
        notiz: text(w.notiz),
        invest: zahl(w.invest),
        nk_als_puffer: w.nk_als_puffer === "1",
        nk_positionen: pos.length ? pos : null
      };
    };
    efBind(sheet,
      async (w) => {
        if (neu) { await neuesObjekt(bauen(w)); }
        else {
          const d = bauen(w);
          await speichereObjekt(s._id, d);
          if (d.slug !== s.id && currentView === s.id) { currentView = d.slug; gezeigteAnsicht = d.slug; }
        }
      },
      neu ? null : async () => { await loescheObjekt(s._id); currentView = "overview"; },
      "Objekt mit allen Daten löschen?",
      opt.nachOnboarding ? () => {
        // Nach dem Objekt direkt eine Einheit anlegen (füllt das Dashboard).
        // Das gerade angelegte Objekt ist das zuletzt erstellte (höchste created_at bzw. letztes in der Liste).
        const streams = (D.streams || []);
        const neuesObj = streams[streams.length - 1];
        if (neuesObj) {
          setTimeout(() => openErsteEinheitSheet(neuesObj), 300);
        } else {
          setTimeout(() => openTarifFragenSheet(), 300);
        }
      } : null);
  }

  // Onboarding: erste Wohneinheit mit Details anlegen → sofort Zahlen im Dashboard
  function openErsteEinheitSheet(s) {
    const body = `
      <div class="wc-hero">
        <div class="wc-steps"><span class="done"></span><span class="on"></span><span></span></div>
        <div class="wc-badge">Damit dein Dashboard sofort lebt</div>
        <div class="wc-t">Erste Wohneinheit</div>
        <div class="wc-d">Trag die wichtigsten Zahlen zu einer Wohnung ein. ESTRIQ berechnet daraus sofort deine Einnahmen, Rendite und den Cashflow.</div>
      </div>
      ${efTitel("Wohnung")}
      ${ef("Bezeichnung", "bezeichnung", "", "text", { pflicht: true, platzhalter: "z. B. Erdgeschoss links" })}
      ${ef("Fläche in m²", "flaeche", "", "number", { step: "0.01", platzhalter: "z. B. 72" })}
      ${efSel("Status", "status", "vermietet",
        [{ v: "vermietet", t: "vermietet" }, { v: "frei", t: "frei / in Vermarktung" }])}
      ${efTitel("Miete pro Monat")}
      ${ef("Kaltmiete", "kalt_fix", "", "number", { pflicht: true, platzhalter: "z. B. 650", hinweis: "Reine Miete ohne Nebenkosten" })}
      ${ef("Nebenkosten", "nk_fix", "", "number", { platzhalter: "z. B. 180", hinweis: "Monatliche Vorauszahlung des Mieters" })}
      ${efTitel("Mieter (optional)")}
      ${ef("Name", "mieter", "", "text", { platzhalter: "z. B. Familie Müller" })}
      ${ef("Einzug", "einzug", "", "date")}
      <div class="wc-skip"><a href="#" id="ehSkip">Ohne Einheit weiter</a></div>
      ${efAktionen({ speichern: "Speichern & weiter" })}`;
    const sheet = openSheet("Erste Einheit", "", body);

    const bauen = (w) => {
      const o = {
        bezeichnung: text(w.bezeichnung) || "Einheit",
        flaeche: zahl(w.flaeche),
        status: w.status,
        mieter: text(w.mieter), einzug: text(w.einzug),
        kalt_fix: zahl(w.kalt_fix), nk_fix: zahl(w.nk_fix),
        vertrag: {}
      };
      return o;
    };
    efBind(sheet,
      async (w) => { await neueEinheit(s._id, bauen(w)); },
      null, null,
      () => { setTimeout(() => openTarifFragenSheet(), 250); });

    sheet.querySelector("#ehSkip").onclick = (e) => { e.preventDefault(); closeSheet(); setTimeout(() => openTarifFragenSheet(), 200); };
  }

  // --- Termin ---
  function openTerminEdit(t, neu) {
    const body = `
      ${ef("Titel", "titel", t ? t.titel : "", "text", { pflicht: true })}
      ${ef("Datum", "datum", t ? t.datum : new Date().toISOString().slice(0, 10), "date", { pflicht: true })}
      ${efSel("Art", "art", t ? t.typ : "termin",
        [{ v: "miete", t: "Mieteingang" }, { v: "einzug", t: "Einzug" },
         { v: "zahlung", t: "Zahlung" }, { v: "termin", t: "Termin" }])}
      ${efSel("Wiederholung", "wiederholung", t ? (t.wiederholung || "") : "",
        [{ v: "", t: "einmalig" }, { v: "monatlich", t: "monatlich" },
         { v: "halbjaehrlich", t: "halbjährlich" }, { v: "jaehrlich", t: "jährlich" }])}
      ${ef("Zusatz", "info", t ? (t.info || "") : "", "text",
        { platzhalter: "z. B. 10.000 €", hinweis: "Erscheint in der Tagesansicht" })}
      ${efAktionen({ loeschen: neu ? null : "Löschen" })}`;

    const sheet = openSheet(neu ? "Neuer Termin" : "Termin bearbeiten",
      neu ? "" : dateDE(t.datum), body);

    const bauen = (w) => ({
      titel: text(w.titel) || "Termin",
      datum: text(w.datum),
      art: w.art,
      wiederholung: text(w.wiederholung),
      info: text(w.info)
    });
    efBind(sheet,
      async (w) => neu ? await neuerTermin(bauen(w)) : await speichereTermin(t._id, bauen(w)),
      neu ? null : async () => await loescheTermin(t._id),
      "Termin löschen?");
  }

  /* ---------- BOOT ---------- */
  // Zoom unterbinden (iOS ignoriert user-scalable=no)
  function blockZoom() {
    document.addEventListener("gesturestart", e => e.preventDefault(), { passive: false });
    document.addEventListener("gesturechange", e => e.preventDefault(), { passive: false });
    document.addEventListener("gestureend", e => e.preventDefault(), { passive: false });
    document.addEventListener("touchmove", e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
    let lastTouch = 0;
    document.addEventListener("touchend", e => {
      const now = Date.now();
      if (now - lastTouch <= 320) e.preventDefault(); // Doppeltipp-Zoom
      lastTouch = now;
    }, { passive: false });
    document.addEventListener("wheel", e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  }

  /* ---------- LANDING ---------- */

  function loginOeffnen(modus) {
    $("#login").classList.remove("hide");
    setRegMode(false);   // Beta: keine Selbstregistrierung
    setTimeout(() => { const f = $("#mail"); if (f) f.focus(); }, 180);
  }
  function loginSchliessen() {
    $("#login").classList.add("hide");
    const m = $("#loginMsg"); if (m) { m.textContent = ""; m.className = "login-msg"; }
  }

  function landingVerdrahten() {
    // Landing sichtbar, Login zunächst geschlossen
    const lp = $("#landing");
    if (lp) $("#login").classList.add("hide");

    document.querySelectorAll("[data-login]").forEach(b =>
      b.addEventListener("click", () => loginOeffnen(b.dataset.login)));

    const zu = $("#loginZu");
    if (zu) zu.addEventListener("click", loginSchliessen);
    // Klick auf den abgedunkelten Hintergrund schließt ebenfalls
    const lg = $("#login");
    if (lg) lg.addEventListener("click", (e) => { if (e.target === lg) loginSchliessen(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lg && !lg.classList.contains("hide")) loginSchliessen();
    });

    // Sanftes Scrollen zu den Ankern
    document.querySelectorAll('.lp-nav-links a[href^="#"]').forEach(a =>
      a.addEventListener("click", (e) => {
        const ziel = document.querySelector(a.getAttribute("href"));
        if (ziel) { e.preventDefault(); ziel.scrollIntoView({ behavior: "smooth", block: "start" }); }
      }));

    zaehleHoch();
    kippBeimScrollen();
    tunnelVerdrahten();
    stickyKnopf();
    impressumVerdrahten();
    wartelisteVerdrahten();
  }

  /* ---------- TUNNEL: Eintauchen ins Produkt ---------- */
  function tunnelVerdrahten() {
    const lp = $("#landing"), tn = $("#tunnel"), szene = $("#tnSzene");
    if (!lp || !tn || !szene) return;
    const karten = Array.from(szene.querySelectorAll(".lp-tn-karte"));
    if (!karten.length) return;

    const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (ruhig) return;   // Ohne 3D bleibt die sichtbare Liste stehen
    tn.classList.add("tn-aktiv");

    const titelEl = $("#tnTitel"), textEl = $("#tnText");
    const nrEl = $("#tnNr"), vonEl = $("#tnVon"), fortEl = $("#tnFort");
    if (vonEl) vonEl.textContent = "/ " + String(karten.length).padStart(2, "0");

    let aktiv = -1, warten = false;

    const zeichne = () => {
      warten = false;
      const box = tn.getBoundingClientRect();
      const hoehe = lp.clientHeight || window.innerHeight;
      // Fortschritt durch den Tunnel: 0 beim Eintritt, 1 beim Austritt
      const gesamt = tn.offsetHeight - hoehe;
      const p = Math.max(0, Math.min(1, -box.top / (gesamt || 1)));
      if (fortEl) fortEl.style.width = (p * 100).toFixed(1) + "%";

      // Jede Karte hat ihren eigenen Abschnitt auf der Strecke
      const n = karten.length;
      karten.forEach((k, i) => {
        // relative Position: 0 = genau vorn, negativ = noch fern, positiv = vorbei
        const eigen = (p * n) - i;
        // Tiefe: von weit hinten (-1800) nach ganz nah (+900)
        const z = -2100 + eigen * 3000;
        // Sichtbar nur im Fenster um die Mitte
        const sicht = 1 - Math.min(1, Math.abs(eigen - 0.5) / 0.8);
        if (sicht <= 0) { k.style.opacity = "0"; k.style.visibility = "hidden"; return; }
        k.style.visibility = "visible";
        k.style.opacity = sicht.toFixed(3);
        // Leichte Drehung für Raumgefühl, nimmt beim Näherkommen ab
        const dreh = (1 - Math.min(1, Math.max(0, eigen))) * 8;
        const seit = (i % 2 === 0 ? 1 : -1) * dreh;
        k.style.transform = `translate3d(0,0,${z.toFixed(0)}px) rotateY(${seit.toFixed(1)}deg) rotateX(${(dreh * 0.4).toFixed(1)}deg)`;
        k.style.filter = eigen < 0.15 ? `blur(${((0.15 - eigen) * 14).toFixed(1)}px)` : "none";
      });

      // Überschrift wechselt mit der Karte, die gerade vorn ist
      const idx = Math.max(0, Math.min(n - 1, Math.floor(p * n)));
      if (idx !== aktiv) {
        aktiv = idx;
        const k = karten[idx];
        if (titelEl) {
          titelEl.style.opacity = "0"; titelEl.style.transform = "translateY(8px)";
          if (textEl) textEl.style.opacity = "0";
          setTimeout(() => {
            titelEl.textContent = k.dataset.titel || "";
            if (textEl) textEl.textContent = k.dataset.text || "";
            titelEl.style.opacity = "1"; titelEl.style.transform = "translateY(0)";
            if (textEl) textEl.style.opacity = "1";
          }, 160);
        }
        if (nrEl) nrEl.textContent = String(idx + 1).padStart(2, "0");
      }
    };

    lp.addEventListener("scroll", () => {
      if (!warten) { warten = true; requestAnimationFrame(zeichne); }
    }, { passive: true });
    window.addEventListener("resize", zeichne);
    zeichne();
  }

  /* ---------- WARTELISTE (Beta-Phase) ---------- */

  async function wartelisteEintragen(mail, feld, msg, btn) {
    const wert = (mail || "").trim().toLowerCase();
    if (!wert || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wert)) {
      msg.textContent = "Bitte gib eine gültige E-Mail-Adresse ein.";
      msg.className = "lp-warte-msg bad";
      return false;
    }
    const alt = btn.textContent;
    btn.disabled = true; btn.textContent = "Moment…";
    try {
      // Woher kommt der Besuch? (für die Auswertung eurer Werbung)
      const p = new URLSearchParams(location.search);
      const quelle = p.get("utm_source") || p.get("quelle") || (document.referrer ? "web" : "direkt");
      if (!window.sb) throw new Error("Keine Verbindung zur Datenbank.");
      const { error } = await window.sb.from("warteliste").insert({ email: wert, quelle: quelle });
      // Doppelte Eintragung ist für den Besucher kein Fehler
      const txt = String((error && (error.message || error.details)) || "");
      const schonDrin = /duplicate|unique|23505/i.test(txt);
      if (error && !schonDrin) throw error;
      msg.textContent = schonDrin
        ? "Du stehst bereits auf der Liste — wir melden uns zum Start."
        : "Danke! Du stehst auf der Liste — wir melden uns zum Start.";
      msg.className = "lp-warte-msg ok";
      if (feld) feld.classList.add("fertig");
      return true;
    } catch (e) {
      btn.disabled = false; btn.textContent = alt;
      const detail = String((e && (e.message || e.details)) || "");
      console.error("Warteliste:", e);
      // Klartext statt Rätselraten
      msg.textContent = /permission|denied|row-level|policy|42501/i.test(detail)
        ? "Eintragen ist gerade nicht möglich (Zugriff). Bitte melde dich unter info@buecking-immobilien.de."
        : "Das hat leider nicht geklappt: " + (detail || "unbekannter Fehler");
      msg.className = "lp-warte-msg bad";
      return false;
    }
  }

  function wartelisteVerdrahten() {
    // Formular im Heldenbereich
    const f1 = $("#warteForm");
    if (f1) f1.addEventListener("submit", (e) => {
      e.preventDefault();
      wartelisteEintragen($("#warteMail").value, f1, $("#warteMsg"), $("#warteBtn"));
    });

    // Popup-Formular
    const box = $("#warteBox"), f2 = $("#warteForm2"), zu = $("#wbZu");
    if (f2) f2.addEventListener("submit", (e) => {
      e.preventDefault();
      wartelisteEintragen($("#warteMail2").value, f2, $("#warteMsg2"), $("#warteBtn2"));
    });
    if (zu) zu.addEventListener("click", () => box.classList.add("hide"));
    if (box) box.addEventListener("click", (e) => { if (e.target === box) box.classList.add("hide"); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && box && !box.classList.contains("hide")) box.classList.add("hide");
    });

    // Alle Knöpfe mit data-warte öffnen das Popup
    document.querySelectorAll("[data-warte]").forEach(b =>
      b.addEventListener("click", () => {
        box.classList.remove("hide");
        setTimeout(() => { const i = $("#warteMail2"); if (i) i.focus(); }, 180);
      }));

    // Aus dem Login heraus zur Warteliste
    const bw = $("#betaWarte");
    if (bw) bw.addEventListener("click", (e) => {
      e.preventDefault();
      loginSchliessen();
      box.classList.remove("hide");
      setTimeout(() => { const i = $("#warteMail2"); if (i) i.focus(); }, 200);
    });
  }

  // Impressum & Datenschutz
  function impressumVerdrahten() {
    const link = $("#lpImpressum"), box = $("#impressum"), zu = $("#impZu");
    if (!link || !box) return;
    link.addEventListener("click", (e) => { e.preventDefault(); box.classList.remove("hide"); });
    if (zu) zu.addEventListener("click", () => box.classList.add("hide"));
    box.addEventListener("click", (e) => { if (e.target === box) box.classList.add("hide"); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !box.classList.contains("hide")) box.classList.add("hide");
    });
  }

  // Fester Handlungsknopf auf dem Handy: erscheint, sobald der Held vorbei ist
  function stickyKnopf() {
    const bar = $("#lpSticky"), lp = $("#landing");
    if (!bar || !lp) return;
    let warten = false;
    const pruefen = () => {
      warten = false;
      bar.classList.toggle("an", lp.scrollTop > 420);
    };
    lp.addEventListener("scroll", () => {
      if (!warten) { warten = true; requestAnimationFrame(pruefen); }
    }, { passive: true });
    pruefen();
  }

  // Die Produktvorschau richtet sich beim Scrollen langsam auf
  function kippBeimScrollen() {
    const shot = $("#lpShot"), lp = $("#landing");
    if (!lp) return;
    const minis = Array.from(document.querySelectorAll(".lp-mini"));
    const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const schmal = window.innerWidth <= 900;
    if (ruhig || schmal) {
      if (shot) shot.style.transform = "none";
      minis.forEach(m => m.style.transform = "none");
      return;
    }
    let warten = false;
    const anpassen = () => {
      warten = false;
      // Heldenbereich: über die ersten 520 Pixel aufrichten
      if (shot) {
        const p = Math.max(0, Math.min(1, lp.scrollTop / 520));
        shot.style.transform = `rotateY(${(-9 * (1 - p)).toFixed(2)}deg) rotateX(${(5 * (1 - p)).toFixed(2)}deg)`;
      }
      // Einblick-Karten: aufrichten, während sie durchs Bild wandern
      const hoehe = lp.clientHeight || window.innerHeight;
      minis.forEach(m => {
        const r = m.getBoundingClientRect();
        const mitte = r.top + r.height / 2;
        // 0 = weit unten, 1 = auf Höhe der Bildmitte
        const p = Math.max(0, Math.min(1, (hoehe - mitte) / (hoehe * 0.55)));
        const seite = m.closest(".lp-ein-dreh") ? -7 : 7;
        m.style.transform = `rotateY(${(seite * (1 - p)).toFixed(2)}deg) rotateX(${(4 * (1 - p)).toFixed(2)}deg)`;
      });
    };
    lp.addEventListener("scroll", () => {
      if (!warten) { warten = true; requestAnimationFrame(anpassen); }
    }, { passive: true });
    anpassen();
  }

  // Die Zahl im Heldenbereich zählt beim Laden hoch — das Versprechen des Produkts
  function zaehleHoch() {
    const el1 = $("#lpZahl"), el2 = $("#lpRendite");
    if (!el1) return;
    const kurz = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const zielB = 8326, zielR = 6.11;
    if (kurz) {
      el1.textContent = zielB.toLocaleString("de-DE") + " €";
      if (el2) el2.textContent = zielR.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " %";
      return;
    }
    const start = performance.now(), dauer = 1500;
    const lauf = (t) => {
      const p = Math.min(1, (t - start) / dauer);
      const e = 1 - Math.pow(1 - p, 3);   // weich auslaufend
      el1.textContent = Math.round(zielB * e).toLocaleString("de-DE") + " €";
      if (el2) el2.textContent = (zielR * e).toLocaleString("de-DE",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " %";
      if (p < 1) requestAnimationFrame(lauf);
    };
    requestAnimationFrame(lauf);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    blockZoom();
    landingVerdrahten();
    // Erklär-Knöpfe an Kennzahlen (gilt auch für später gezeichnete Karten)
    document.addEventListener("click", (e) => {
      const b = e.target.closest && e.target.closest("[data-info]");
      if (b) { e.stopPropagation(); openInfoSheet(b.dataset.info); }
    });
    $("#loginBtn").addEventListener("click", tryLogin);
    $("#pw").addEventListener("keydown", e => { if (e.key === "Enter") regMode ? tryRegister() : tryLogin(); });
    // Navigation neu aufbauen, wenn sich ihre Form ändert (Drehen, Fenstergröße)
    let navWar = navForm();
    window.addEventListener("resize", () => {
      const navJetzt = navForm();
      if (navJetzt !== navWar) { navWar = navJetzt; closeSubmenu(); buildRail(); }
    });
    tastaturBeobachten();
    mitLadebalken("ladeDaten");
    mitLadebalken("nachSpeichern");

    // Registrierung
    if ($("#registerBtn")) $("#registerBtn").addEventListener("click", tryRegister);
    if ($("#tabLogin")) $("#tabLogin").addEventListener("click", () => setRegMode(false));
    if ($("#tabRegister")) $("#tabRegister").addEventListener("click", () => setRegMode(true));
    if ($("#avaBtn")) $("#avaBtn").addEventListener("click", waehleAvatar);
    if ($("#avaFile")) $("#avaFile").addEventListener("change", avatarGewaehlt);
    if ($("#datenschutzLink")) $("#datenschutzLink").addEventListener("click", (e) => {
      e.preventDefault();
      alert("Datenschutzerklärung\n\nDeine Daten werden verschlüsselt gespeichert und sind ausschließlich für dich zugänglich. Der Betreiber kann deine Immobiliendaten nicht einsehen.\n\n(Dies ist ein Platzhalter. Eine vollständige Datenschutzerklärung wird vor dem öffentlichen Start hinterlegt.)");
    });

    // Einladungslink: …/?einladung=CODE
    let einlCode = "";
    try { einlCode = (new URLSearchParams(location.search).get("einladung") || "").trim(); } catch (_) {}

    try {
      if (await sessionOK()) {
        try {
          await window.ladeDaten();
          D = window.DASHBOARD_DATA;
          enterApp();
          // Schon angemeldet: erklären, dass man sich zuerst abmelden muss
          if (einlCode) openEinladungAngemeldet();
        } catch (e) {
          // Angemeldet, aber Daten konnten nicht geladen werden → Login-Popup mit Hinweis
          loginOeffnen("anmelden");
          $("#loginMsg").textContent = window.fehlerText(e);
          $("#loginMsg").className = "login-msg bad";
          console.error(e);
        }
      } else if (einlCode) {
        // Niemand angemeldet: eigenes Fenster über der Landing
        loginSchliessen();
        openEinladungFenster(einlCode);
      }
      // Sonst bleibt die Landing-Seite stehen; der Login öffnet sich erst per Klick.
    } finally {
      startbildAus();
    }
  });

  // Startbild für angemeldete Nutzer wieder wegnehmen, falls die App nicht geöffnet wurde.
  // Dann gilt wieder der Zustand vor dem Login – die Landing erscheint wie für jeden Besucher.
  function startbildAus() {
    const de = document.documentElement;
    if (!de.classList.contains("eq-wartet")) return;
    de.classList.remove("eq-wartet");
    if (!de.classList.contains("eq-app")) { de.classList.add("pre-login"); statusleisteFarbe(); }
  }

  // Balken am oberen Rand, solange Daten geladen oder gespeichert werden
  let ladeZahl = 0, ladeTimer = null;
  function ladebalken(an) {
    const b = $("#eqLadebalken");
    if (!b) return;
    ladeZahl = Math.max(0, ladeZahl + (an ? 1 : -1));
    clearTimeout(ladeTimer);
    if (ladeZahl > 0) { b.classList.remove("fertig"); b.classList.add("on"); }
    else if (b.classList.contains("on")) {
      b.classList.remove("on"); b.classList.add("fertig");
      ladeTimer = setTimeout(() => b.classList.remove("fertig"), 600);
    }
  }
  // Legt den Balken um eine vorhandene Funktion. Aufruf, Ergebnis und Fehler bleiben unverändert.
  function mitLadebalken(name) {
    const alt = window[name];
    if (typeof alt !== "function" || alt._eqBalken) return;
    const neu = async function () {
      ladebalken(true);
      try { return await alt.apply(this, arguments); }
      finally { ladebalken(false); }
    };
    neu._eqBalken = true;
    window[name] = neu;
  }

  // Tastatur am Handy: Das Fenster rückt über die Tastatur, damit der Speichern-Knopf erreichbar bleibt.
  function tastaturBeobachten() {
    const vv = window.visualViewport;
    if (!vv) return;
    let zuletzt = 0;
    const setzen = () => {
      const a = document.activeElement;
      const tippt = !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.closest && a.closest(".sheet-bd"));
      let h = tippt ? Math.round(window.innerHeight - vv.height - vv.offsetTop) : 0;
      if (h < 120) h = 0;                                   // nur eine echte Tastatur zählt
      h = Math.min(h, Math.round(window.innerHeight * 0.6));
      if (h === zuletzt) return;
      zuletzt = h;
      document.documentElement.style.setProperty("--eq-tastatur", h + "px");
    };
    vv.addEventListener("resize", setzen);
    vv.addEventListener("scroll", setzen);
    document.addEventListener("focusin", setzen);
    document.addEventListener("focusout", () => setTimeout(setzen, 80));
  }
})();
