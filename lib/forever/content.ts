import type { CoupleSettings, Memory } from './types';
// Platzhalter: 12. Oktober 2023, 20:00 Uhr in Deutschland. Im Adminbereich änderbar.
export const DEFAULT_SETTINGS: CoupleSettings = {
  firstName: 'Leticia', secondName: 'Gérôme',
  startLocal: '2023-10-12T20:00:00', timeZone: 'Europe/Berlin',
};
export const COMPLIMENTS = [
  'Mit dir fühlt sich selbst ein ganz gewöhnlicher Dienstag ein bisschen nach Magie an.',
  'Du bist mein liebster Zufall und meine schönste Entscheidung.',
  'Es gibt viele schöne Orte. Mein Lieblingsplatz bleibt neben dir.',
  'Dein Lachen macht aus einem kleinen Moment eine große Erinnerung.',
  'Ich mag die Welt ein bisschen mehr, seit ich sie mit dir teilen darf.',
  'Bei dir muss ich nichts sein. Bei dir darf ich einfach ich sein.',
  'Du bist mein schönstes Nachhausekommen.',
  'Mit dir würde ich mich immer wieder in dieselbe Geschichte verlieben.',
  'Ich liebe nicht nur unsere großen Abenteuer. Ich liebe auch unser gemeinsames Nichtstun.',
  'Du machst mein Leben nicht perfekt. Du machst es zu meinem Lieblingsleben.',
  'Wenn du meine Hand nimmst, wird die Welt für einen Moment ganz leise.',
  'Es ist dieses kleine Lächeln von dir, an das ich mitten am Tag denken muss.',
  'Du bist der Mensch, dem ich auch die völlig unwichtigen Dinge erzählen will.',
  'Ich mag uns. Mit zerzausten Haaren, müden Augen und allen kleinen Macken.',
  'Mein Lieblingsgeräusch? Wenn du über etwas lachst, das nur wir beide lustig finden.',
  'Mit dir werden aus Wegen Spaziergänge und aus Tagen Geschichten.',
  'Du musst heute nichts Besonderes tun. Schön, dass es dich gibt.',
  'Ich würde zwischen tausend Möglichkeiten immer wieder einen Abend mit dir wählen.',
  'Danke, dass du aus meinem Alltag so oft etwas Besonderes machst.',
  'Du bist meine beste Idee für heute, morgen und ziemlich viele Tage danach.',
  'Auch wenn wir gerade nichts sagen, fühlt sich alles gesagt an.',
  'Mit dir ist Zuhause weniger ein Ort und viel mehr ein Gefühl.',
  'Ich bin so gern der Mensch, der neben dir alt werden darf.',
  'Du bist mein kleiner Glücksmoment. Und manchmal ein ziemlich großer.',
] as const;
export type SurpriseKind = 'Date-Idee' | 'Gutschein' | 'Kleiner Quatsch';
export type Surprise = { title: string; text: string; kind: SurpriseKind; note: string };
// Persönliche Insider und Gutscheine können hier ergänzt oder ausgetauscht werden.
export const SURPRISES: Surprise[] = [
  { kind: 'Date-Idee', title: 'Ein Date für fünf Euro', text: 'Jeder sucht im Supermarkt eine kleine Lieblingssache aus. Danach gibt es ein Picknick auf dem Wohnzimmerboden. Handys bleiben weg.', note: '30–60 Minuten · zu Hause' },
  { kind: 'Date-Idee', title: 'Dem Sonnenuntergang hinterher', text: 'Nehmt eine Decke und etwas Warmes zu trinken mit. Sucht euch einen ruhigen Platz und bleibt, bis aus Rosa langsam Blau wird.', note: '1 Stunde · draußen' },
  { kind: 'Date-Idee', title: 'Unser kleines Filmfestival', text: 'Jeder wählt einen Film aus seiner Kindheit. Baut ein Nest aus Decken, macht Popcorn und verratet euch, warum ihr den Film damals geliebt habt.', note: 'Ein Abend · gemütlich' },
  { kind: 'Date-Idee', title: 'Ein kleines Küchenabenteuer', text: 'Nacheinander probiert ihr mit geschlossenen Augen drei Zutaten und ratet, was es ist. Danach kocht ihr zusammen euer Lieblingsessen.', note: '1–2 Stunden · in der Küche' },
  { kind: 'Date-Idee', title: 'Ein Spaziergang ohne Plan', text: 'An jeder zweiten Kreuzung entscheidet eine Münze: links oder rechts. Findet einen Ort, an dem ihr zusammen noch nie wart.', note: '45 Minuten · ein kleines Abenteuer' },
  { kind: 'Date-Idee', title: 'Post an unser Zukunfts-Ich', text: 'Schreibt euch einen Brief: Was liebt ihr gerade an eurem Leben? Was wünscht ihr euch? Verschließt die Briefe bis zum nächsten Jahrestag.', note: '30 Minuten · Papier & Stift' },
  { kind: 'Gutschein', title: 'Ein Morgen nur für dich', text: 'Einlösbar bei deinem Lieblingsmenschen: Frühstück, dein Lieblingsgetränk und noch fünf Minuten liegen bleiben. Mindestens.', note: 'Ein Beispiel-Gutschein · persönlich einlösen' },
  { kind: 'Gutschein', title: 'Du hast die Fernbedienung', text: 'Heute entscheidest du den Film, die Serie und die Snacks. Ich übernehme das Kuscheln und stelle keine Fragen zur Handlung.', note: 'Ein Beispiel-Gutschein · für einen Filmabend' },
  { kind: 'Gutschein', title: 'Eine kleine Auszeit', text: '15 Minuten Schultermassage. Dazu deine Lieblingsmusik und absolut keine To-do-Liste. Nur du und ein bisschen Ruhe.', note: 'Ein Beispiel-Gutschein · ganz ohne Ablaufdatum' },
  { kind: 'Gutschein', title: 'Ein Wunsch-Spaziergang', text: 'Du bestimmst den Weg und das Tempo. Ich bringe Zeit, eine freie Hand und ein offenes Ohr mit.', note: 'Ein Beispiel-Gutschein · für uns zwei' },
  { kind: 'Gutschein', title: 'Lieblingsessen-Service', text: 'Ein Essen deiner Wahl, von mir gekocht oder liebevoll organisiert. Abwasch inklusive. Die Dessertfrage bleibt selbstverständlich offen.', note: 'Ein Beispiel-Gutschein · Hunger mitbringen' },
  { kind: 'Gutschein', title: 'Ein Abend ohne Müssen', text: 'Wir sagen für einen Abend allen unnötigen Plänen ab. Schlafanzug an, Welt aus. Du musst nichts leisten.', note: 'Ein Beispiel-Gutschein · für einen müden Tag' },
  { kind: 'Kleiner Quatsch', title: 'Die wissenschaftliche Kuschelprobe', text: 'Hypothese: Eine Umarmung macht den Tag besser. Bitte führt jetzt eine 20-sekündige Versuchsreihe durch. Zur Sicherheit zweimal.', note: 'Ein kleiner Quatsch-Moment · Insider-Platzhalter' },
  { kind: 'Kleiner Quatsch', title: 'Ein sehr seriöses Interview', text: 'Frage deinen Lieblingsmenschen: Wenn wir beide Kartoffelgerichte wären, welche wären wir? Eine ausführliche Begründung ist Pflicht.', note: 'Diskussionszeit · ungefähr drei Pommes' },
  { kind: 'Kleiner Quatsch', title: 'Unser Bandname', text: 'Euer letzter Snack plus die Farbe eurer Socken ergibt den Namen eurer Band. Jetzt fehlt nur noch das erste Albumcover.', note: 'Kreativität erwünscht · Talent optional' },
  { kind: 'Kleiner Quatsch', title: 'Die Fünf-Sterne-Bewertung', text: 'Bewertet euch gegenseitig wie ein besonders gutes Café: Atmosphäre, Umarmungsqualität und Snackbereitschaft. Freundliche Rezensionen erwünscht.', note: 'Fünf Sterne · würde wieder verlieben' },
  { kind: 'Kleiner Quatsch', title: 'Unser geheimes Handzeichen', text: 'Erfindet eine kleine Geste, die nur für euch „Ich hab dich lieb“ bedeutet. Ab jetzt kann sie überall auftauchen.', note: 'Ein Insider zum Selbermachen' },
  { kind: 'Kleiner Quatsch', title: 'Ein Song, zwei Hauptrollen', text: 'Spielt den nächsten Song zufällig ab und tut für 30 Sekunden so, als wärt ihr die Hauptfiguren im Musikvideo. Wohnzimmerbühne frei.', note: 'Peinlich ist nur, wenn niemand mitmacht' },
];
const createdAt = '2026-09-15T00:00:00Z';
// Alle drei Pins sind frei erfundene Beispiel-Erinnerungen an echten Koordinaten.
// Die Unsplash-Fotos sind Symbolbilder, keine Fotos des Paares oder der markierten Orte.
export const EXAMPLE_MEMORIES: Memory[] = [
  { id: 'example-alster', title: 'Wo alles ein bisschen schöner wurde', place: 'An der Alster, Hamburg', date: '2023-10-12', story: 'Ein Spaziergang, kalte Hände und dieses warme Gefühl, dass etwas ganz Besonderes beginnt. Manchmal braucht ein Lieblingsmoment nicht mehr als uns zwei.', category: 'Meilenstein', latitude: 53.5645, longitude: 10.0038, photoUrl: 'https://images.unsplash.com/photo-1604238376125-16f8b38fe32d?auto=format&fit=crop&w=1200&q=85', photoAlt: 'Symbolbild: ein Holzsteg an einem ruhigen See bei Sonnenuntergang, Foto von Jan Huber / Unsplash', isExample: true, createdAt, updatedAt: createdAt, revision: 1 },
  { id: 'example-luebeck', title: 'Verlaufen. Und genau richtig.', place: 'Altstadt, Lübeck', date: '2024-05-18', story: 'Durch kleine Gassen schlendern, irgendwo einen Kaffee trinken und die Zeit vergessen. Der schönste Plan war an diesem Tag, keinen zu haben.', category: 'Date', latitude: 53.8655, longitude: 10.6866, photoUrl: 'https://images.unsplash.com/photo-1633620148148-e60da8755579?auto=format&fit=crop&w=1200&q=85', photoAlt: 'Symbolbild: eine historische Straße in Riga, Foto von Carolin Thiergart / Unsplash', isExample: true, createdAt, updatedAt: createdAt, revision: 1 },
  { id: 'example-coast', title: 'Salz auf der Haut. Du an meiner Seite.', place: 'Strand, Timmendorfer Strand', date: '2025-07-26', story: 'Wind in den Haaren, Sand in den Schuhen und das Meer vor uns. Von solchen Tagen möchte ich noch ganz viele mit dir sammeln.', category: 'Abenteuer', latitude: 53.9973, longitude: 10.7854, photoUrl: 'https://images.unsplash.com/photo-1695487177869-304d6feb38d3?auto=format&fit=crop&w=1200&q=85', photoAlt: 'Symbolbild: Sonnenuntergang über dem Meer, Foto von Andrus Lukas / Unsplash', isExample: true, createdAt, updatedAt: createdAt, revision: 1 },
];
