/**
 * Bruch-Blitz – Empfänger für das Übungsprotokoll
 * In Google Sheets: Erweiterungen → Apps Script → diesen Code einfügen → speichern →
 * Bereitstellen → Neue Bereitstellung → Typ „Web-App“ →
 *   Ausführen als: Ich   ·   Zugriff: Jeder
 * Die angezeigte Web-App-URL (endet auf /exec) im Spiel bei SHEET_URL eintragen.
 */
const BLATT = 'Protokoll';
const TIERE = [
  'Flinker Fuchs', 'Eifrige Eule', 'Pfiffiger Pinguin', 'Patenter Panda',
  'Tapferer Tiger', 'Kluger Koala', 'Fröhlicher Frosch', 'Dynamischer Delfin',
  'Lässiger Löwe', 'Emsiger Elefant', 'Ideenreicher Igel', 'Oberschlauer Oktopus',
  'Schnelle Schildkröte', 'Gewitzte Giraffe', 'Zackiges Zebra', 'Fleißiges Faultier'
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (TIERE.indexOf(d.tier) < 0) return antwort('unbekanntes Tier');

    const zahl = (x, max) => Math.max(0, Math.min(Number(x) || 0, max));
    const id = String(d.id || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40);
    if (!id) return antwort('keine ID');

    const sh = SpreadsheetApp.getActive().getSheetByName(BLATT);
    const werte = [
      d.tier,
      zahl(d.level, 8),
      String(d.levelName || '').slice(0, 40),
      zahl(d.aufgaben, 5000),
      zahl(d.richtig, 5000),
      zahl(d.streak, 5000),
      zahl(d.dauer, 600)
    ];

    // Gleiche Runde wird nur aktualisiert (das Spiel sendet zwischendurch Zwischenstände)
    const treffer = sh.getRange('A:A').createTextFinder(id).matchEntireCell(true).findNext();
    if (treffer) {
      sh.getRange(treffer.getRow(), 3, 1, werte.length).setValues([werte]);
    } else {
      sh.appendRow([id, new Date()].concat(werte));
    }
    return antwort('ok');
  } catch (err) {
    return antwort('Fehler: ' + err);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return antwort('Bruch-Blitz-Empfänger läuft.');
}

function antwort(text) {
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.TEXT);
}
