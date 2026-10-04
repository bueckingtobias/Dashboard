/* =============================================================
   data-save.js — schreibt Änderungen zurück nach Supabase
   Wird nach data-loader.js eingebunden.
   Die Rechenlogik bleibt unberührt: hier werden ausschließlich
   Rohwerte gespeichert, gerechnet wird weiterhin in finance-engine.js
   ============================================================= */

// ---------- Hilfsfunktionen ----------
// Liest ausdrücklich die Zeile des angemeldeten Nutzers. In einem Konto mit
// mehreren Nutzern liefert die Datenbank sonst auch die Zeilen der Kollegen.
async function meineOrgId() {
  const { data: { session } } = await window.sb.auth.getSession();
  if (!session) throw new Error('Deine Sitzung ist abgelaufen (session).');
  const { data, error } = await window.sb
    .from('mitglieder').select('org_id').eq('auth_user_id', session.user.id).limit(1);
  if (error) throw error;
  if (!data || !data[0]) throw new Error('Dein Zugang wurde entfernt.');
  return data[0].org_id;
}

function fehlerText(e) {
  const roh = (e && (e.message || e.hint || e.details || e.code || e.error_description || e.error)) || "";
  const s = String(roh).toLowerCase();

  if (s.includes("zugang wurde entfernt")) {
    return "Dein Zugang wurde entfernt. Bitte wende dich an den Inhaber des Kontos.";
  }
  // Häufige technische Meldungen in verständliches Deutsch übersetzen
  if (s.includes("violates row-level security") || s.includes("row-level security")) {
    return "Diese Änderung ist mit deinem aktuellen Tarif nicht möglich. Ein Upgrade schaltet sie frei.";
  }
  if (s.includes("null value") && s.includes("column")) {
    // Spaltenname herausziehen, falls vorhanden
    const m = String(roh).match(/column "([^"]+)"/);
    const feld = m ? feldName(m[1]) : "ein Pflichtfeld";
    return "Bitte fülle " + feld + " aus.";
  }
  if (s.includes("duplicate key") || s.includes("already exists")) {
    return "Dieser Eintrag existiert bereits. Bitte wähle einen anderen Namen oder Kurznamen.";
  }
  if (s.includes("violates check constraint")) {
    return "Ein Wert ist ungültig. Bitte prüfe deine Eingaben.";
  }
  if (s.includes("violates foreign key")) {
    return "Der Vorgang konnte nicht abgeschlossen werden, weil ein verknüpfter Eintrag fehlt.";
  }
  if (s.includes("invalid input syntax")) {
    return "Ein Wert hat das falsche Format. Bitte prüfe Zahlen- und Datumsfelder.";
  }
  if (s.includes("numeric field overflow") || s.includes("out of range")) {
    return "Eine Zahl ist zu groß. Bitte gib einen kleineren Wert ein.";
  }
  if (s.includes("permission denied")) {
    return "Dir fehlt die Berechtigung für diese Aktion.";
  }
  if (s.includes("jwt") || s.includes("token") || s.includes("session")) {
    return "Deine Sitzung ist abgelaufen. Bitte melde dich neu an.";
  }
  if (s.includes("failed to fetch") || s.includes("network")) {
    return "Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung.";
  }
  if (s.includes("invalid login credentials")) {
    return "E-Mail oder Passwort ist falsch.";
  }
  if (s.includes("email not confirmed")) {
    return "Bitte bestätige zuerst deine E-Mail-Adresse.";
  }
  if (s.includes("user already registered") || s.includes("already been registered")) {
    return "Für diese E-Mail existiert bereits ein Konto. Bitte melde dich an.";
  }
  if (s.includes("over_email_send_rate_limit") || s.includes("rate limit")) {
    return "Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.";
  }
  // Nichts erkannt: freundliche Standardmeldung statt technischem Text
  return roh ? "Es ist ein Fehler aufgetreten. Bitte versuche es erneut." : "Unbekannter Fehler.";
}

// Übersetzt Datenbank-Spaltennamen in verständliche Feldbezeichnungen
function feldName(spalte) {
  const map = {
    bezeichnung: "die Bezeichnung", name: "den Namen", flaeche: "die Fläche",
    summe: "die Darlehenssumme", zins_pa: "den Zinssatz", rate_monat: "die Monatsrate",
    titel: "den Titel", datum: "das Datum", slug: "den Kurznamen",
    mieter: "den Mieter", status: "den Status"
  };
  return map[spalte] || "das Feld „" + spalte + "“";
}

// ---------- Einheiten ----------
// Leere Texte zu null machen. Verhindert Formatfehler, wenn ein leeres
// Feld in eine Datums- oder Zahlenspalte geschrieben wird.
function ohneLeere(werte) {
  const o = {};
  Object.keys(werte || {}).forEach(k => {
    const v = werte[k];
    o[k] = (typeof v === "string" && v.trim() === "") ? null : v;
  });
  return o;
}

async function speichereEinheit(id, werte) {
  const { error } = await window.sb.from('einheiten').update(ohneLeere(werte)).eq('id', id);
  if (error) throw error;
}
async function neueEinheit(objektId, werte) {
  const { error } = await window.sb.from('einheiten')
    .insert({ ...ohneLeere(werte), objekt_id: objektId });
  if (error) throw error;
}
async function loescheEinheit(id) {
  const { error } = await window.sb.from('einheiten').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Kredite ----------
async function speichereKredit(id, werte) {
  const { error } = await window.sb.from('kredite').update(werte).eq('id', id);
  if (error) throw error;
}
async function neuerKredit(objektId, werte) {
  const { error } = await window.sb.from('kredite')
    .insert({ ...werte, objekt_id: objektId });
  if (error) throw error;
}
async function loescheKredit(id) {
  const { error } = await window.sb.from('kredite').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Objekte ----------
async function speichereObjekt(id, werte) {
  const { error } = await window.sb.from('objekte').update(ohneLeere(werte)).eq('id', id);
  if (error) throw error;
}
async function neuesObjekt(werte) {
  const org = await meineOrgId();
  const { error } = await window.sb.from('objekte')
    .insert({ ...ohneLeere(werte), org_id: org });
  if (error) throw error;
}
async function loescheObjekt(id) {
  // Einheiten und Kredite verschwinden automatisch mit
  const { error } = await window.sb.from('objekte').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Projekte ----------
// Ein Projekt ist ein Objekt der Art "projekt". Die Art setzt nur das Anlegen; danach ändert sie
// ausschließlich die Datenbank-Funktion projekt_uebernehmen. Beim Speichern wird art nie mitgeschickt.
function ohneArt(werte) {
  const o = { ...(werte || {}) };
  delete o.art; delete o.org_id;
  return o;
}
// Legt ein Projekt an und gibt seine Kennung zurück
async function neuesProjekt(werte) {
  const org = await meineOrgId();
  const { data, error } = await window.sb.from('objekte')
    .insert({ ...ohneLeere(ohneArt(werte)), art: 'projekt', org_id: org })
    .select('id').single();
  if (error) throw error;
  return data && data.id;
}
// Name, Ort, Notiz und andere Stammdaten eines Projekts
async function speichereProjekt(id, werte) {
  const { error } = await window.sb.from('objekte').update(ohneArt(werte)).eq('id', id);
  if (error) throw error;
}
// Planungsdaten (Spalte projekt) und die daraus berechnete Gesamtinvestition
async function speichereProjektPlan(id, plan, invest) {
  const paket = { projekt: plan };
  if (invest !== undefined) paket.invest = invest;
  const { error } = await window.sb.from('objekte').update(paket).eq('id', id);
  if (error) throw error;
}
// Kopie eines Projekts mit Planungsdaten, Einheiten und Krediten. Gibt die Kennung der Kopie zurück.
async function dupliziereProjekt(werte, einheiten, kredite) {
  const id = await neuesProjekt(werte);
  for (const e of (einheiten || [])) await neueEinheit(id, e);
  for (const k of (kredite || [])) await neuerKredit(id, k);
  return id;
}
// Macht aus dem Projekt ein Mietobjekt. Antwort der Datenbank:
// ok | kein_zugriff | nicht_gefunden | kein_projekt | gesperrt | objekte | einheiten
async function projektUebernehmen(id) {
  const { data, error } = await window.sb.rpc('projekt_uebernehmen', { p_objekt: id });
  if (error) throw error;
  return data;
}

// ---------- Termine ----------
async function speichereTermin(id, werte) {
  const { error } = await window.sb.from('termine').update(werte).eq('id', id);
  if (error) throw error;
}
async function neuerTermin(werte) {
  const org = await meineOrgId();
  const { error } = await window.sb.from('termine')
    .insert({ ...werte, org_id: org });
  if (error) throw error;
}
async function loescheTermin(id) {
  const { error } = await window.sb.from('termine').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Nach dem Speichern: neu laden und Ansicht auffrischen ----------
async function nachSpeichern() {
  await window.ladeDaten();
  window.setD(window.DASHBOARD_DATA);
  window.refreshView();
}

// Mieteingang für eine Einheit im laufenden Monat festhalten
async function mietEingangSetzen(einheitId, jahr, monat, status, betrag) {
  // Über eine geprüfte Datenbankfunktion – umgeht Upsert-Berechtigungsprobleme
  const { data, error } = await window.sb.rpc('miete_bestaetigen', {
    p_einheit: einheitId,
    p_jahr: jahr,
    p_monat: monat,
    p_status: status,
    p_betrag: betrag ?? null
  });
  if (error) throw error;
  if (data === 'kein_zugriff') throw new Error('Diese Einheit gehört nicht zu deinem Konto.');
}

// ---------- Gewerke & Rechnungen ----------
async function neuesGewerk(objektId, werte) {
  const { error } = await window.sb.from('gewerke')
    .insert({ ...ohneLeere(werte), objekt_id: objektId });
  if (error) throw error;
}
async function speichereGewerk(id, werte) {
  const { error } = await window.sb.from('gewerke').update(ohneLeere(werte)).eq('id', id);
  if (error) throw error;
}
async function loescheGewerk(id) {
  const { error } = await window.sb.from('gewerke').delete().eq('id', id);
  if (error) throw error;
}
async function neueRechnung(gewerkId, werte) {
  const { error } = await window.sb.from('rechnungen')
    .insert({ ...ohneLeere(werte), gewerk_id: gewerkId });
  if (error) throw error;
}
async function speichereRechnung(id, werte) {
  const { error } = await window.sb.from('rechnungen').update(ohneLeere(werte)).eq('id', id);
  if (error) throw error;
}
async function loescheRechnung(id) {
  const { error } = await window.sb.from('rechnungen').delete().eq('id', id);
  if (error) throw error;
}
window.neuesGewerk = neuesGewerk;
window.speichereGewerk = speichereGewerk;
window.loescheGewerk = loescheGewerk;
window.neueRechnung = neueRechnung;
window.speichereRechnung = speichereRechnung;
window.loescheRechnung = loescheRechnung;

window.meineOrgId = meineOrgId;
window.nachSpeichern = nachSpeichern;
window.neuesProjekt = neuesProjekt;
window.speichereProjekt = speichereProjekt;
window.speichereProjektPlan = speichereProjektPlan;
window.dupliziereProjekt = dupliziereProjekt;
window.projektUebernehmen = projektUebernehmen;
window.mietEingangSetzen = mietEingangSetzen;
window.fehlerText = fehlerText;
