/* =========================================================
   LISTE DER ANWENDUNGEN
   ---------------------------------------------------------
   Nur diese Datei musst du bearbeiten, wenn du eine neue
   Anwendung hinzufügst.

   So geht's:
   1. HTML-Datei in den passenden Ordner unter "apps/" hochladen
      (z. B. apps/physik/millikan.html)
   2. Unten einen neuen Eintrag nach demselben Muster ergänzen
      (Komma zwischen den Einträgen nicht vergessen!)

   Felder:
   titel        – Name, der auf der Karte steht
   fach         – z. B. "Physik", "Sport" (Gruppierung auf der Seite)
   thema        – Unterthema innerhalb des Fachs
   klasse       – z. B. "9/10" oder "7"
   beschreibung – ein bis zwei Sätze für die Schüler
   datei        – Pfad zur HTML-Datei
   neu          – optional: true zeigt ein „Neu“-Schild
   ========================================================= */

const APPS = [
  {
    titel: "Millikan-Versuch",
    fach: "Physik",
    thema: "Elektrizitätslehre",
    klasse: "9/10",
    beschreibung: "Bestimme die Elementarladung, indem du geladene Öltröpfchen im elektrischen Feld zum Schweben bringst.",
    datei: "apps/physik/millikan.html",
    neu: true
  },

  /* Beispiel für einen weiteren Eintrag – zum Benutzen die
     Zeichen /* und *\/ drumherum entfernen und ausfüllen:

  {
    titel: "Freier Fall",
    fach: "Physik",
    thema: "Mechanik",
    klasse: "9/10",
    beschreibung: "Untersuche, wie die Fallstrecke von der Zeit abhängt.",
    datei: "apps/physik/freier-fall.html"
  },
  */
];

/* Name der Seite (erscheint oben) */
const SEITE = {
  titel: "Lernanwendungen",
  untertitel: "Interaktive Simulationen und Übungen von Herrn Hochmuth"
};
