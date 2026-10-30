/**
 * Bruch-Blitz – Empfänger für das Übungsprotokoll (Version 2: Anmeldung über Zugänge)
 *
 * Einrichten bzw. aktualisieren:
 *   Erweiterungen → Apps Script → gesamten Code durch diesen ersetzen → speichern.
 *   Erstes Mal:  Bereitstellen → Neue Bereitstellung → Web-App
 *                (Ausführen als: Ich · Zugriff: Jeder)
 *   Update:      Bereitstellen → Bereitstellungen verwalten → Stift ✏️ →
 *                Version: „Neue Version“ → Bereitstellen  (die URL bleibt gleich)
 *
 * Wer sich anmelden darf, steht im Blatt „Zugänge“:
 *   Spalte A Zugangsname · B Tier · C Klasse · D aktiv (Häkchen)
 * Klasse, die mit „Lehr“ beginnt (z. B. „Lehrkraft“) = alle Level offen.
 */
const BLATT_PROTOKOLL = 'Protokoll';
const BLATT_ZUGAENGE = 'Zugänge';

function norm(t) {
  return String(t).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');
}

/** Sucht einen Namen in „Zugänge“. Ergebnis: {name, klasse, aktiv, lehrer} oder null */
function finde(eingabe) {
  const k = norm(eingabe);
  if (!k) return null;
  const sh = SpreadsheetApp.getActive().getSheetByName(BLATT_ZUGAENGE);
  const n = sh.getLastRow() - 1;
  if (n < 1) return null;
  const zeilen = sh.getRange(2, 1, n, 4).getValues();
  for (const z of zeilen) {
    if (z[0] && norm(z[0]) === k) {
      const klasse = String(z[2] || '');
      return { name: String(z[0]).trim(), klasse: klasse, aktiv: z[3] === true, lehrer: norm(klasse).indexOf('lehr') === 0 };
    }
  }
  return null;
}

/** Anmeldung prüfen:  …/exec?name=2 Fuchs */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.name !== undefined) {
    const z = finde(p.name);
    if (!z) return json({ ok: false });
    if (!z.aktiv) return json({ ok: false, inaktiv: true });
    return json({ ok: true, name: z.name, klasse: z.klasse, lehrer: z.lehrer });
  }
  return ContentService.createTextOutput('Bruch-Blitz-Empfänger läuft (Version 2).');
}

/** Spielrunde eintragen bzw. aktualisieren */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    const z = finde(d.tier);
    if (!z || !z.aktiv) return json({ ok: false, grund: 'Zugang unbekannt oder nicht aktiv' });

    const zahl = (x, max) => Math.max(0, Math.min(Number(x) || 0, max));
    const id = String(d.id || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40);
    if (!id) return json({ ok: false, grund: 'keine ID' });

    const sh = SpreadsheetApp.getActive().getSheetByName(BLATT_PROTOKOLL);
    const werte = [
      z.name,
      zahl(d.level, 20),
      String(d.levelName || '').slice(0, 60),
      zahl(d.aufgaben, 5000),
      zahl(d.richtig, 5000),
      zahl(d.streak, 5000),
      zahl(d.dauer, 600),
      z.klasse
    ];
    // Gleiche Runde nur aktualisieren (das Spiel sendet zwischendurch Zwischenstände)
    const treffer = sh.getRange('A:A').createTextFinder(id).matchEntireCell(true).findNext();
    if (treffer) {
      sh.getRange(treffer.getRow(), 3, 1, werte.length).setValues([werte]);
    } else {
      sh.appendRow([id, new Date()].concat(werte));
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, grund: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
