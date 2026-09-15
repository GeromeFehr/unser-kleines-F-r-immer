# Unser kleines Für immer

Ein persönliches Erinnerungs-Dashboard für Leticia und Gérôme, gebaut mit **Next.js, React, TypeScript und Leaflet**. Diese Version läuft direkt auf **Netlify**. Anmeldung und Speicherung benötigen weder einen ChatGPT-Account noch Supabase oder einen anderen Dienst.

## Auf Netlify starten

1. Dieses GitHub-Repository mit dem Netlify-Projekt verbinden. Branch: `main`, Basisverzeichnis: Repository-Wurzel.
2. Unter **Project configuration → Environment variables** eine Variable `ADMIN_PASSWORD` mit einem eigenen, langen Passwort (mindestens 12 Zeichen) anlegen. Der Geltungsbereich muss **Functions** enthalten; „All scopes“ funktioniert ebenfalls. Das Passwort niemals in GitHub eintragen.
3. Deploy starten. Die mitgelieferte `netlify.toml` setzt **Build command: `pnpm run build`** und **Publish directory: `.next`**. Netlify erkennt Next.js automatisch und installiert den aktuellen Adapter.
4. Die Website öffnen und oben **Verwalten** wählen. Mit dem Admin-Passwort anmelden und Pins, Bilder oder eure Namen bearbeiten.

Nach einer Passwortänderung in Netlify erneut deployen. Bestehende Sitzungen werden dann ungültig. Ein fehlendes oder zu kurzes Passwort lässt den Adminbereich gesperrt; die Loginseite zeigt die Einrichtung an.

**Sichtbarkeit:** Das Dashboard ist standardmäßig öffentlich, die Verwaltung nur mit Admin-Passwort zugänglich. Wer auch die Karte und Bilder privat halten möchte, legt zusätzlich `JOURNAL_PASSWORD` (mindestens 12 Zeichen) an und deployt erneut. Dieses zweite Passwort erlaubt ausschließlich das Ansehen. Das Admin-Passwort öffnet beide Bereiche. Es gibt keine externe Anmeldung.

### Der frühere Netlify-Build-Fehler

Die vorherige Version verwendete Vinext/Vite und Cloudflare-Bindings; sie erzeugte keinen normalen Next.js-Build. Das Netlify-Plugin konnte deshalb im Publish-Verzeichnis keine erwarteten Artefakte finden. Diese Version baut mit `next build --webpack` tatsächlich nach `.next` und ersetzt auch die inkompatiblen Daten- und Authentifizierungsdienste. Bei einem alten fehlgeschlagenen Deploy einmal **Clear cache and deploy site** ausführen. Keine zusätzliche, alte oder fest auf Version 4 gesetzte Next.js-Plugin-Konfiguration verwenden.

## Funktionen

- Sekundengenauer Kalender-Zähler ab **12. Oktober 2023, 20:00 Uhr, Europe/Berlin**, mit Monatslängen, Schaltjahren und Sommerzeit.
- 24 wechselnde Komplimente und 18 Überraschungen: Date-Ideen, kleine Gutscheine und Insider-Platzhalter.
- Leaflet 1.9.4 über CDN mit Integritätsprüfung, frei nutzbaren OpenStreetMap-Kacheln und dezenter Darstellung. Kein Google-Maps-Key.
- Drei ausdrücklich als Beispiele markierte Erinnerungen an Alster, Lübeck und Ostsee, mit Unsplash-Fotos.
- Vollständiger Adminbereich: Pins per Kartenklick oder Koordinaten setzen, verschieben, bearbeiten und löschen; Datum, Kategorie, Text und Foto pflegen.
- Foto-Upload mit automatischer Verkleinerung und Kompression. Originale bis 25 MB; Upload höchstens 3 MB, passend für Netlifys Funktionsgrenzen.
- Einstellbare Namen, Startdatum und Zeitzone. Schutz vor dem Verwerfen ungespeicherter Eingaben und vor dem Überschreiben einer inzwischen bearbeiteten Erinnerung.
- Responsive Oberfläche in warmem Weiß/Rosé, Tastaturbedienung, reduzierte Animationen bei entsprechender Systemeinstellung.
- Hell-/Dunkelmodus über den Sonnen-/Mondschalter im Kopfbereich und auf der Loginseite. Die erste Darstellung folgt dem System; die eigene Auswahl bleibt gespeichert und gilt auch für Karte, Pop-ups und Verwaltung.

## Speicherung und Zugang

**Netlify Blobs** speichert das Journal und die Bilder dauerhaft im eigenen Netlify-Projekt. Produktionsdaten bleiben bei neuen Deploys erhalten. Vorschau- und Branch-Deploys nutzen getrennte Speicher. Änderungen verwenden starke Lesekonsistenz und atomare ETag-Vergleiche; gelöschte Beispiele erscheinen nicht erneut.

Passwörter bleiben serverseitige Umgebungsvariablen. Zeitlich begrenzte, signierte Sitzungen verwenden HttpOnly-/SameSite-Cookies, unter HTTPS zusätzlich Secure. Jede Schreibroute prüft das Adminrecht und den Request-Ursprung. Loginversuche werden im Speicher begrenzt. Bilder werden nur über die entsprechend geschützte API ausgeliefert. Im optionalen privaten Modus gilt der Passwortschutz auch für Lesedaten und Fotos.

Ein früherer Sites-/Cloudflare-Speicher wird nicht automatisch nach Netlify kopiert. Die Beispielinhalte sind im Code enthalten; persönliche Daten liegen ausschließlich im jeweiligen Hosting-Projekt. Speicherlimits und Abrechnung richten sich nach dem eigenen Netlify-Tarif.

## Lokal entwickeln

Node.js **22.13 oder neuer** und pnpm verwenden:

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
# Eigenes ADMIN_PASSWORD in .env.local setzen
pnpm dev
```

Der Entwicklungsbefehl startet einen lokalen Netlify-Blobs-Emulator. Daten liegen nur für lokale Entwicklung unter `.netlify/local-blobs/`. Ein Netlify-Konto wird lokal nicht benötigt. Unter `http://localhost:3000` ist die Website erreichbar. Die lokale Passwortdatei und lokale Daten werden nicht eingecheckt.

```sh
pnpm test
pnpm build
pnpm test:integration
```

Die Integrationstests starten den echten Next.js-Produktionsserver mit einem temporären Blobs-Speicher und prüfen Zugang, Speichern, Konflikte, Uploads sowie Daten nach einem Neustart. GitHub Actions führt diese Prüfungen ebenfalls aus.

## Inhalte anpassen

- `lib/forever/content.ts`: Komplimente, Überraschungen und Beispiel-Erinnerungen.
- `components/forever/`: Dashboard, Karte, Login und Verwaltung.
- `app/globals.css`: Design und responsive Layouts.
- `lib/forever/storage.ts`: Netlify-Speicherung und Schreibkonflikte.
- `lib/forever/password.ts`: Passwortprüfung und Sitzungen.

[Next.js auf Netlify](https://opennext.js.org/netlify) · [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/) · [Leaflet](https://leafletjs.com/) · [OpenStreetMap-Kacheln](https://operations.osmfoundation.org/policies/tiles/)
