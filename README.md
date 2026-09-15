# Unser kleines Für immer

Ein persönliches Erinnerungsjournal für Leticia und Gérôme: eine ruhige Oberfläche in warmem Weiß und Rosé, ein Live-Beziehungszähler, kleine Liebesbriefe, spontane Ideen und eine interaktive Erinnerungskarte.

## Benutzen

Die Startseite zeigt eure Zeit und die Karte. Über **Verwalten** oder `/admin` kann der Besitzer neue Orte hinzufügen, Pins verschieben, Texte und Fotos bearbeiten sowie Erinnerungen löschen. Eine Bestätigung schützt vor versehentlichem Löschen und vor dem Verwerfen ungespeicherter Änderungen.

Unter **Unser Anfang** lassen sich Namen, Datum, Uhrzeit und Zeitzone ändern. Der voreingestellte **12. Oktober 2023, 20:00 Uhr, Europe/Berlin** ist ausdrücklich ein Platzhalter. Alle drei ersten Erinnerungen sind fiktive, gekennzeichnete Beispiele an echten Koordinaten. Die Fotos sind Unsplash-Symbolbilder, keine persönlichen Paarfotos und keine Ortsnachweise.

Die Überraschungen enthalten 6 Date-Ideen, 6 Beispiel-Gutscheine und 6 kleine Quatsch-/Insider-Vorlagen. Sie werden pro Kategorie ohne direkte Wiederholung aus einem gemischten Vorrat gezogen. Die 24 Komplimente wechseln zufällig beim Laden und auf Knopfdruck. Eigene Texte können in `lib/forever/content.ts` ergänzt werden.

## Technik

- React 19, TypeScript und Vinext mit App Router; Vite erzeugt einen Cloudflare-Worker.
- Leaflet **1.9.4 über CDN**, mit gepinnten URLs und Subresource Integrity.
- OpenStreetMap-Rastertiles, per CSS dezent entsättigt. Kein Google-Maps- oder anderer Karten-API-Key.
- Dauerhafte Datenspeicherung in D1, Fotos in einem privaten R2-Bucket. Keine Erinnerungsdaten in localStorage.
- Die drei Beispieldatensätze werden atomar genau einmal initialisiert. Gelöschte Beispiele kommen nicht zurück.
- Geschützte serverseitige API; SIWC-/Sites-Identität, Besitzerberechtigung, Same-Origin-Prüfung, serverseitige Validierung und Größenlimits.
- Eine Revisionsnummer schützt vor dem Überschreiben zwischen zwei offenen Fenstern.
- Bilder werden vor dem Upload auf maximal 2.000 Pixel Kantenlänge verkleinert. Der Server erlaubt nur JPEG, PNG und WebP und prüft die Dateisignatur. Die API akzeptiert maximal 8 MB pro Foto; Originale im Browser bis 25 MB.
- Die Anzeige aktualisiert Daten bei Rückkehr zum Tab und im sichtbaren Tab alle 60 Sekunden.
- Responsive Oberflächen, Tastaturbedienung, zugängliche Dialoge, reduzierte Bewegung und Lade-/Fehlerzustände.

### Warum keine CARTO-Positron-Tiles?

Die aktuelle [CARTO-Dokumentation](https://github.com/CartoDB/basemap-styles) verlangt einen API-Key und weist bei Rastertiles auf deren Auslaufen hin. Damit das Projekt ohne zusätzlichen Schlüssel startet, verwendet es OpenStreetMap mit einer sanften Darstellung. Sichtbare [OpenStreetMap-Attribution](https://www.openstreetmap.org/copyright), normale Browser-Caches und ein gültiger Origin-Referrer bleiben erhalten. Keine Offline-Downloads, Scraping- oder Prefetch-Funktion. [Tile-Nutzungsrichtlinie](https://operations.osmfoundation.org/policies/tiles/).

Leaflet-CDN und Tiles werden im Browser geladen. Bei einer externen Störung zeigt die Seite eine Meldung und bietet einen erneuten Versuch; die Erinnerungsliste und die Detailansicht bleiben zugänglich.

## Zugriff und erster Besitzer

Die veröffentlichte Site startet privat. Der Sites-Zugriff regelt, wer sie besuchen kann. Leser dürfen Erinnerungen ansehen; nur der Besitzer darf sie verändern. Die Site versendet keine Einladungen automatisch.

`ADMIN_BOOTSTRAP_EMAIL` wird als private Laufzeitvariable gesetzt. Beim ersten Aufruf durch die passende, von der Plattform bestätigte Identität wird deren **Site-spezifische stabile User-ID** atomar in der Tabelle `admins` hinterlegt. Danach entscheidet ausschließlich diese ID. Die E-Mail-Adresse steckt weder im Frontend noch im Repository. Die Variable kann nach dem Bootstrap entfernt werden.

Die Header `oai-authenticated-user-id` und `oai-authenticated-user-email` müssen vom vertrauenswürdigen Sites-Dispatcher stammen. Die Anwendung darf nicht unverändert hinter einem beliebigen öffentlich erreichbaren Proxy betrieben werden, der diese Header vom Besucher durchreicht. Ein Umzug auf anderes Hosting benötigt eine gleichwertige Authentifizierung.

D1 und R2 machen eine separate Supabase-Instanz für dieses Projekt überflüssig. Es werden keine vorhandenen Supabase-Projekte verändert. GitHub speichert den Quellcode; ein reines GitHub-Pages-Hosting unterstützt diese Serverfunktionen nicht.

## Entwickeln und prüfen

Die Website lässt sich im Browser ohne lokale Installation verwenden. Für lokale Entwicklung benötigt man Node.js ab 22.13.0 und die im `packageManager` festgelegte pnpm-Version.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
node tests/logic.test.cjs
pnpm run build
node tests/worker.test.mjs
```

`tests/worker.test.mjs` startet keine öffentliche Vorschau. Es führt das echte kompilierte Worker-Modul mit temporären, isolierten D1-/R2-Daten aus. Alle Testidentitäten und Testbilder existieren nur dort; es werden keine Produktionskonten oder produktiven Datensätze angelegt.

Der Workflow `.github/workflows/ci.yml` führt dieselben Prüfungen bei Push und Pull Request aus. Der Lockfile ist verbindlich. Secrets gehören ausschließlich in lokale ignorierte Umgebungsdateien beziehungsweise Laufzeitvariablen der Hosting-Plattform.

### Datenbankschema

Schema: `db/schema.ts`; generierte Migrationen: `drizzle/`. Schemaänderungen erzeugen mit `pnpm run db:generate` eine neue Migration. Bereits veröffentlichte Migrationen nicht umschreiben. Produktionsmigrationen werden beim Sites-Deployment eingespielt. Die Beispieldaten werden getrennt vom Schema im ersten authentifizierten Zugriff initialisiert.

### Verzeichnisse

| Pfad | Inhalt |
| --- | --- |
| `app/page.tsx`, `components/forever/dashboard.tsx` | Dashboard und Erinnerungsansicht |
| `components/forever/memory-map.tsx` | Leaflet-Karte, Marker, sichere Popups und Pin-Auswahl |
| `app/admin`, `components/forever/admin-panel.tsx` | Geschützte Verwaltung |
| `app/api` | Persistenz, Einstellungen, Fotos |
| `lib/forever/time.ts` | Kalendergenauer Timer mit Zeitzonen |
| `lib/forever/content.ts` | Komplimente, Ideen, Platzhalter |
| `lib/forever/server.ts` | Serverrechte, Datenbank, Initialisierung und Fehlerbehandlung |
| `.openai/hosting.json` | Projektidentität und logische Speicherbindungen |

## Fotoquellen

1. See und Steg: [Jan Huber / Unsplash](https://unsplash.com/photos/brown-wooden-dock-on-lake-during-sunset-dXg_3gWI9YQ).
2. Historische Straße in Riga (Symbolbild für einen Stadtbummel): [Carolin Thiergart / Unsplash](https://unsplash.com/photos/a-city-street-filled-with-lots-of-tall-buildings-VyCxq9IyYcs).
3. Meer bei Sonnenuntergang: [Andrus Lukas / Unsplash](https://unsplash.com/photos/the-sun-is-setting-over-the-ocean-with-rocks-in-the-water-FV4LK5pHtmo).

## Prüfgrenzen

Automatisierte Prüfungen decken Kalenderlogik, Validierung, echte Server-Routen, Zugriffsrechte, Konflikte, Persistenz und Uploads ab. Eine visuelle Browserprüfung wurde in dieser Umgebung nicht ausgeführt; externe Unsplash-Dateien konnten wegen Netzbeschränkungen nicht direkt abgerufen werden. Für fehlende Bilder ist eine sichtbare Ersatzanzeige vorhanden.

Optionale WebMCP-Werkzeuge ermöglichen das Auflisten vorhandener Erinnerungen und das Anzeigen eines Pins. Sie sind nur aktiv, wenn der Browser `document.modelContext` unterstützt. Die Ausführung in einem echten unterstützten WebMCP-Browser war hier nicht verfügbar.
