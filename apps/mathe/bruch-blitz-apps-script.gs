/**
 * Bruch-Blitz – Empfänger für das Übungsprotokoll (Version 3: Zugänge, Klassenziele, Bestenliste)
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

/** Klassenziel und Wochen-Bestenliste für einen Zugang (Lehrkraft: alle Klassen) */
function klassenInfo(z) {
  const ss = SpreadsheetApp.getActive();
  const zielSh = ss.getSheetByName('Klassenziele');
  if (!zielSh || zielSh.getLastRow() < 2) return [];
  const ziele = zielSh.getRange(2, 1, zielSh.getLastRow() - 1, 5).getValues();   // Klasse · Ziel · zählt ab · Belohnung · Bestenliste zeigen
  const prot = ss.getSheetByName(BLATT_PROTOKOLL);
  const n = prot.getLastRow() - 1;
  const zeilen = n > 0 ? prot.getRange(2, 1, n, 10).getValues() : [];
  const montag = new Date(); montag.setHours(0, 0, 0, 0); montag.setDate(montag.getDate() - ((montag.getDay() + 6) % 7));
  const top = o => Object.keys(o).filter(k => o[k] > 0).sort((a, b) => o[b] - o[a] || a.localeCompare(b)).slice(0, 5).map(k => [k, o[k]]);
  const aus = [];
  for (const zl of ziele) {
    const klasse = String(zl[0] || '').trim();
    if (!klasse || (!z.lehrer && klasse !== z.klasse)) continue;
    const ab = zl[2] instanceof Date ? zl[2] : null;
    let stand = 0; const richtig = {}, streak = {};
    for (const r of zeilen) {
      if (String(r[9]).trim() !== klasse) continue;
      const t = r[1] instanceof Date ? r[1] : null, ri = Number(r[6]) || 0;
      if (!ab || (t && t >= ab)) stand += ri;
      if (t && t >= montag) {
        const nm = String(r[2]);
        richtig[nm] = (richtig[nm] || 0) + ri;
        streak[nm] = Math.max(streak[nm] || 0, Number(r[7]) || 0);
      }
    }
    aus.push({ klasse: klasse, ziel: Number(zl[1]) || 0, stand: stand, belohnung: String(zl[3] || ''),
      liste: zl[4] === true ? { richtig: top(richtig), streak: top(streak) } : null });
  }
  return aus;
}

/** Anmeldung prüfen:  …/exec?name=2 Fuchs      Klassen-Ecke:  …/exec?info=2 Fuchs */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.info !== undefined) {
    const z = finde(p.info);
    if (!z || !z.aktiv) return json({ ok: false });
    return json({ ok: true, klassen: klassenInfo(z) });
  }
  if (p.name !== undefined) {
    const z = finde(p.name);
    if (!z) return json({ ok: false });
    if (!z.aktiv) return json({ ok: false, inaktiv: true });
    return json({ ok: true, name: z.name, klasse: z.klasse, lehrer: z.lehrer });
  }
  return ContentService.createTextOutput('Bruch-Blitz-Empfänger läuft (Version 3).');
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
