# hdpantry – Projektregeln

Self-hosted Vorrats-Tracker: wissen, was da ist und was zuerst gegessen werden sollte. Erfasst wird über den Code auf einem Behälter (QR, Strichcode) oder von Hand. **Nach außen nie als Tracker „für Vakuumbehälter“ beschreiben** – Vakuum ist eine Funktion (Schalter, Haltbarkeit, Zeichnung), nicht der Zweck; es soll mehr dazukommen. Single-User, Docker Compose, Mobile-first, am PC voll nutzbar. Lizenz AGPL-3.0, öffentlich auf GitHub.

## Zusammenarbeit

- Antworten auf Deutsch; jede Änderung in 1–2 Sätzen ohne Fachjargon erklären.
- Kleine Schritte. Vor größeren Aufgaben einen Plan vorlegen, nach jedem Schritt stoppen und erklären, wie man testet. Bei Unklarheiten nachfragen.
- Vor jedem Commit fragen; nach dem Okay selbst committen und im selben Zug pushen.
- Diese Datei bleibt schlank (Richtwert unter 150 Zeilen): nur Regeln und Entscheidungen, die jede Session braucht. Details in Code-Kommentare, Anleitungen ins Wiki. Wird sie länger: kürzen statt anhängen. Keine Angaben über Personen, lokale Pfade oder Rechner.

## Unverhandelbar

- **`data/` wird nie committet oder gepusht.** Steht komplett in `.gitignore` und `.dockerignore`. Vor jedem Commit prüfen (`git status`, `git diff --cached --name-only`), dass nichts aus `data/` dabei ist. Lokal liegt dort die Datenbank (`DATA_DIR=./data`), Screenshots nur in `data/screenshots/`. Achtung: Die Regel `data/` in `.gitignore` trifft **jeden** Ordner dieses Namens – ein neuer Ordner `data` im Quellcode braucht dort eine Ausnahme (wie `src/routes/settings/data/`), sonst fehlt er still im Commit.
- **Null Verbindungen nach außen**, weder Server noch Browser: keine fremden Skripte, Schriften, CDNs, Bilder, Telemetrie, Update-Prüfung. Alles lokal gebündelt (auch die QR-Bibliothek). Server-Code ruft nie `fetch` nach außen auf – **mit genau einer, vom User beschlossenen Ausnahme:** Push-Nachrichten (Standard aus) gehen an den Push-Dienst des Browsers, nur für Geräte, die der User einschaltet, nur an die feste Liste `PUSH_HOSTS` in `src/lib/server/push.ts`. Jede weitere Ausnahme braucht eine ausdrückliche Entscheidung und einen Eintrag im Wiki „Privacy and security“.
- **Keine Marken:** keine Hersteller-Begriffe, -Logos, -Farben oder -Texte in Code, Oberfläche, Doku oder Namen. Die App funktioniert mit jedem QR-Code. Screenshots fremder Apps dienen nur für Ablauf und Reihenfolge; Layout und Gestaltung sind eigenständig.
- `.env` enthält nur `SECRET`, `TZ`, `ORIGIN`. Alles andere wird in der App eingestellt (Tabelle `settings`).

## Stack

SvelteKit 2 (adapter-node, Svelte 5 Runes), TypeScript, Drizzle ORM, better-sqlite3, Tailwind v4. Ein Container, Daten unter `/data`. Konfiguration von SvelteKit steht in `vite.config.ts` (keine `svelte.config.js`).

Versions-Pins – nicht ohne Probelauf anheben:

- `better-sqlite3` bleibt auf v12: v13 hat keine fertigen Binaries mehr und bräuchte einen Compiler im Image.
- SvelteKit bleibt auf 2.x, TypeScript auf 6: SvelteKit 3 verlegt Typen und Konfiguration (viele Typfehler), TypeScript 7 wird von SvelteKit und svelte-check noch nicht unterstützt.
- `overrides` hebt `cookie` auf 0.7.x (Sicherheitshinweis zu älteren Versionen); mit SvelteKit 3 wieder entfernen.
- Vor Abhängigkeits-Updates: Anmelden, Abmelden und ein Durchlauf auf leerer Installation prüfen.

Sparsam bleiben: kleines Image, wenige Abhängigkeiten, schnelle Seiten auf schwachen Handys. Neue Abhängigkeit nur, wenn sie deutlich mehr spart als sie kostet. Was zur Laufzeit ein natives Modul braucht, steht unter `dependencies`, alles andere unter `devDependencies` (wird gebündelt).

## Code

- Server-Code liegt unter `src/lib/server/` (nie im Browser-Bundle).
- Code, URLs, DB-Werte und Kommentare auf Englisch.
- DB wird erst bei Bedarf über `getDb()` geöffnet; Migrationen laufen automatisch beim Start (`src/hooks.server.ts`).
- **Migrationen:** Schema ändern → `npm run db:generate` → Migration mit committen. Bis zum ersten Release (v0.1.0) darf alles in `drizzle/0000_init.sql` zusammengefasst werden (zuletzt geschehen: eine einzige Migration; bestehende Test-Datenbanken müssen danach neu angelegt werden). **Ab v0.1.0** nur noch neue Migrationen, die bestehende Daten erhalten – nie alte ändern oder löschen.
- **Texte:** Alle sichtbaren Texte in `src/lib/i18n/de.ts` + `en.ts` (gleiche Struktur, TypeScript prüft das). Im Browser `m.xyz` aus `$lib/i18n/index.svelte`, auf dem Server `serverMessages(locale)`. Der Server liefert Werte (ISO-Datum, Zahlen), formatiert wird in der Oberfläche. Sprache einer Anfrage: `event.locals.locale`.
- **Farben:** nur die Namen aus `src/routes/layout.css` (`bg-surface`, `text-muted`, `bg-accent`, …), keine festen Farbwerte in Seiten. Farbschema wählbar: System (folgt dem Gerät, Standard), Dunkel, Hell – als Attribut `data-theme` am `<html>`, vom Server ins HTML geschrieben (kein Aufblitzen; `hooks.server.ts`, `src/lib/server/theme.ts`, Liste in `src/lib/themes.ts`). Die Login-Seite nimmt das zuletzt auf dem Gerät benutzte Schema (Cookie `hdpantry_theme`), sonst das des Geräts. In `layout.css` stehen die dunklen Werte zweimal (Block `dark` und `system` bei dunklem Gerät) – beide zusammen pflegen. Weitere Farbschemata sind nicht geplant. Systemschrift; die einzige eigene Schrift ist Outfit für den Schriftzug „hdpantry“.
- Hover-Effekte für alles Klickbare, kurze Übergänge.
- Seitentitel, die sich von selbst erklären (Vorrat, Einstellungen), sind nur für Screenreader da (`sr-only`), nicht sichtbar.

## Scanner

- Codes werden nur im Browser gelesen (`src/lib/scanner.ts`): eingebauter Scanner des Browsers (`BarcodeDetector`, z. B. Chrome auf Android – lädt nichts nach), sonst `zxing-wasm` hinter derselben Schnittstelle (Paket `barcode-detector`), erst bei Bedarf geladen. Die wasm-Datei ist gebündelt; die Bibliothek würde sie sonst von einem fremden Server holen – `locateFile` nie entfernen. Dafür steht `'wasm-unsafe-eval'` in der CSP.
- **Scannen steht im Mittelpunkt:** Die Scan-Seite zeigt nur die Kamera (`CameraScanner.svelte`; am Handy startet sie sofort, am PC – `pointer: fine` – per Knopf). Eintippen und Foto (wird im Browser gelesen, nie hochgeladen) erscheinen erst über den Knopf „Ohne Kamera erfassen“ – nie als direkt sichtbares Eingabefeld.
- Eine Web-Adresse in einem Code wird nur angezeigt oder gespeichert, nie geöffnet oder abgerufen.
- Gelesen werden QR, Data Matrix, EAN-13/8, Code 128 (`FORMATS`).
- **Sobald ein Code erkannt ist, geht es ohne Rückfrage weiter** (`/scan`): Ein voller Behälter zeigt seinen Inhalt; ein leerer – auch ein zum ersten Mal gesehener, der dabei still angelegt wird – fragt sofort nach dem Namen des Inhalts. Kein Zwischenschritt, kein „Foto bestätigen“.
- Code-Parser `src/lib/codes.ts`: zieht die ID eines Behälters aus dem Rohinhalt. Regeln als Tabelle (`PARAMETER_RULES`): Bei Codes mit Parametern ist der Kurzcode-Parameter die ID (er steht auch aufgedruckt auf dem Behälter – eingetippt muss er denselben Behälter finden), Größe und Typ-Code werden mitgenommen; die Adresse davor ist egal. Jeder andere Code zählt als Ganzes. Kurzcodes werden großgeschrieben. Neue Code-Form = neue Regel + Test, mit erfundenen Beispielwerten.
- Behälter (`containers`, `src/lib/server/containers.ts`): Rohinhalt und Herkunft des Codes (`source`: Kamera, Foto, eingetippt) werden mitgespeichert. Kein pflegbares Feld für die Art (Beutel/Box); der Typ-Code wird nur gespeichert, nicht gedeutet. **Es gibt keine Behälter-Übersicht:** Leere Behälter interessieren nicht, gefüllte stehen im Vorrat. Auf der Detailseite steht der Behälter nur in zwei leisen Zeilen: Bezeichnung, darunter „manuell erfasst“ oder „gescannt“. Der Inhalt des Codes interessiert im Alltag nicht; er steht nur in den Einstellungen hinter dem Info-Symbol des Behälters.
- **Manuell erfasste und gescannte Behälter sind getrennte Gruppen** (`manual`; derselbe Code darf in jeder Gruppe einmal vorkommen). Eingetippt wird zuerst der gescannte Behälter gesucht (der Kurzcode steht aufgedruckt), dann der manuelle, sonst ein manueller angelegt. Wird ein Code gescannt, den es nur manuell gibt, fragt die App „Zusammenführen?“: Ja = der manuelle wird zum gescannten (Inhalt und Verlauf bleiben), Nein = eigener gescannter Behälter; später zusammenführen geht in den Einstellungen (nicht, solange beide gefüllt sind). Nur bei manuellen lässt sich der Code ändern.
- Einstellungen → Behälter (`/settings/containers`): Liste aller Behälter. Einzelnen löschen = doppelte Bestätigung; **„Alle Behälter löschen“ nur nach Eintippen des Bestätigungsworts** (prüft auch der Server).
- Rückmeldung beim Erkennen: nur eine kurze Vibration (wirkt nur, wenn das Handy haptisches Feedback erlaubt – von einer Webseite nicht zu umgehen). Bewusst kein Ton und kein optischer Effekt: Das Ergebnis erscheint ohnehin sofort.
- `/scan/check` („Code prüfen“) zeigt Rohinhalte, ohne zu speichern – bleibt dauerhaft in der App, für neue Behälter-Systeme und Fehlermeldungen.

## Inhalte

- **Es gibt genau einen Namen: den des Inhalts** (z. B. „Provolone“). Das leere Namensfeld zeigt jedes Mal ein anderes Beispiel in der gewählten Sprache (`nameExamples` in `de.ts`/`en.ts`, nur Lebensmittel und Gerichte, die das Wörterbuch kennt – ein Test prüft das). Er wird nach dem Scan abgefragt, steht in der Vorratsübersicht und steuert die Automatik (Kategorie, Symbol, Lagerort, Datum). Ein Behälter hat keinen eigenen Namen; er heißt „Größe · Kurzcode“ (`codeLabel()`) und steht nur bei den Details. Nie ein zweites Namensfeld einführen.
- Tabelle `items`: was in einem Behälter ist oder war. „Gegessen“ (immer mit Rückfrage) löscht nicht, sondern setzt `removed_at`; danach ist der Behälter leer und fragt beim nächsten Scan nach einem neuen Namen. Darunter steht der Verlauf dieses Behälters, das Neueste zuerst; Antippen übernimmt den Eintrag als Vorlage (alles außer dem Datum). Höchstens ein aktiver Inhalt je Behälter – das sichert auch ein Index in der Datenbank.
- Felder, Grenzen und die Prüfung des Formulars stehen in `src/lib/items.ts` (`readItemForm()`), für Browser und Server gemeinsam. Lagerorte: `pantry`, `fridge`, `zero`, `freezer`; Füllstand: `low`, `medium`, `full`. Menge optional als Zahl + Einheit (`g`, `kg`, `ml`, `l`, `pcs`, `servings`). **Die Menge folgt dem Füllstand-Regler in Dritteln** (voll = 3/3, mittel = 2/3, niedrig = 1/3; `scaleAmount()`), gerechnet ab der zuletzt eingetippten Menge und der Stufe, bei der sie eingetippt wurde.
- „Ersetzen“ (`/containers/[id]/add?replace=1`): Der alte Inhalt wird erst beim Speichern des neuen als gegessen vermerkt, beides in einer Transaktion (`replaceItem()`); Abbrechen ändert nichts. Deshalb keine eigene Rückfrage.
- Ein Formular für Neu und Bearbeiten (`ItemForm.svelte`). Neu (`/containers/[id]/add`): erst nur der Name (Fokus sofort, Enter = weiter), dann der Rest – dort ist nichts fokussiert, damit die Handy-Tastatur zugeht. Bearbeiten (`/containers/[id]/edit`) über das Stift-Symbol neben dem Namen – Bearbeiten immer per Stift, nicht über Extra-Felder auf der Detailseite. **Nach jedem Speichern (neu, ersetzen, bearbeiten) und nach „Gegessen“ geht es zurück zum Vorrat;** nur „Abbrechen“ beim Bearbeiten führt zur Detailseite zurück.
- Füllstand wird als Zeichnung gezeigt (`FillGauge.svelte`), im Formular über dem Regler, auf Detailseite und in der Vorratsliste: gescannte Behälter als Vakuumbeutel (eckig, Verschlussleiste, rundes Ventil – eigene Zeichnung), manuell erfasste als Glas, damit man sie unterscheiden kann. Der Inhalt ist im Verlauf des Schriftzugs gezeichnet, unten Grün, oben Hellgrün – je voller, desto heller die Oberkante. Der Regler hat drei Markierungen statt Beschriftung; die gewählte Stufe steht unter der Zeichnung.
- Kein Foto-Upload. Optionale Notiz je Inhalt: im Formular eine unauffällige Zeile direkt unter dem Namen, ohne Rahmen und Überschrift. Optionales bleibt dezent: Die Menge erscheint erst über „Menge hinzufügen“.
- Knöpfe nur zeigen, wenn die Aktion gerade möglich ist; sonst gleich den Grund nennen (Beispiel: Zusammenführen bei zwei gefüllten Behältern).
- Der große Scan-Knopf steht nur auf der Startseite (Vorrat), nicht auf den anderen Seiten.
- Startseite = Vorrat (`src/routes/+page.svelte`, Regeln in `src/lib/stock.ts`): Filter nach Lagerort und Sortierung (Haltbar bis, Name, Lagerort; nochmal antippen dreht um) stehen in der Adresse (`?place=&sort=&dir=`). Abgelaufenes rot, „läuft bald ab“ (Standard 3 Tage, einstellbar) gelb, dazu das Datum in Worten. Die Filterknöpfe zeigen unter 640 px nur Symbol und Anzahl. Bis 1024 px Karten (ab 768 px zweispaltig), darüber eine Tabelle mit sortierbaren Spaltenköpfen, die ganze Zeile ist anklickbar; die Spalten Vakuumiert, Behälter und Seit erst ab 1280 px. Inhalte ohne Datum stehen immer am Ende. Keine Suche, kein „Gegessen“ direkt aus der Liste.
- Raster am Handy immer mit `grid-cols-1` anlegen – sonst machen lange Namen die Seite breiter als den Bildschirm.

## Haltbarkeit

- Alles unter `src/lib/food/`: `categories.ts` (25 Kategorien, Einstufung der Lagerorte: gut / möglich / schlecht / gesperrt), `shelfLife.ts` (Richtwerte in Tagen je Kategorie × Lagerort × offen/vakuumiert, **jeder Wert mit Quelle**), `dictionary.ts` (Name → Kategorie, de/en).
- **Die Richtwerte sind bewusst vorsichtig und mit dem User abgestimmt – nicht ohne Rückfrage lockern.** Reihenfolge der Quellen: deutsche Stellen (BVL, BfR, BZfE, BMEL, Verbraucherzentrale), USDA FoodKeeper für Lücken, unteres Ende einer Spanne, bei zwei Angaben die vorsichtigere. Null-Grad-Zone und Vakuum sind eigene Schätzungen (`est`, `vac`).
- **Roher Fisch, Meeresfrüchte, Geflügel und Hackfleisch bekommen gekühlt keinen Vakuum-Aufschlag** (nur im Gefrierschrank); Verderbliches im Kühlschrank auch vakuumiert höchstens 10 Tage. Tests sichern das ab.
- Wörterbuch: Gerichte gehen vor („Linsensuppe“), der letzte Wortteil entscheidet („Zwiebelkuchen“), Teilstücke zählen nur ohne Tier („Putenschnitzel“). Korrekturen des Users je Name landen in `food_memory` und gehen dem Wörterbuch vor.
- Formular: Kategorie aus dem Namen (antippbar, Auswahl mit Beispielzeile), Lagerorte in vier Zuständen, die sich klar unterscheiden müssen: grün = empfohlen, ohne Farbe = möglich, orange = nicht empfohlen (nie rot, das hieße „verboten“), gestrichelter Rand mit blasser Schrift = nicht möglich und nicht wählbar (keine Schraffur, war zu laut) (prüft auch der Server). Darunter eine Legende aus kleinen Farbfeldern, nur mit den Zuständen, die bei der Kategorie vorkommen. Der beste Lagerort ist vorausgewählt. Das Datum folgt Kategorie, Lagerort und Vakuum, bis es von Hand gesetzt wird (`date_manual`); dann „Vorschlag übernehmen“.
- **Überall, wo ein Datum vorgeschlagen wird, steht der Hinweis „Richtwert, keine Garantie – immer selbst prüfen“.**
- Symbole (`src/lib/food/icons.ts`, `FoodIcon.svelte`): zwei Stile, umschaltbar in den Einstellungen (`iconStyle`) – farbig = Twemoji (CC BY 4.0, Namensnennung Pflicht: in der README und in der App unter „Über“, nur dort), schlicht = Lucide/Tabler als Maske in Textfarbe. Die Dateien liegen fertig unter `static/food/` und werden mit `scripts/food-icons.mjs` aus der Liste erzeugt (Pakete dafür nur vorübergehend installieren, keine Projekt-Abhängigkeit). Symbol je Inhalt: von Hand gewählt (`items.icon`) oder aus Name und Kategorie (`suggestIcon()`).
- Seite `/settings/guide` zeigt Tabelle, Quellen und Hinweis; die README hat nur den kurzen Hinweis mit Link ins Wiki. Ändern sich Werte oder Quellen: `shelfLife.ts` und Wiki-Seite „Shelf life guide values“ zusammen anpassen.

## Sicherheit

- Start über `start.js`: `ORIGIN` darf mehrere Adressen (kommagetrennt) enthalten. Die eigene Origin-Prüfung in `hooks.server.ts` ersetzt SvelteKits CSRF-Check. Ohne `ORIGIN` scheitern Formulare im Container mit 403 – deshalb Pflicht.
- Login-Cookie ist nur bei HTTPS „secure“ (`isHttps()` in `origins.ts`), damit die Anmeldung auch im LAN ohne HTTPS geht.
- CSP in `vite.config.ts`: Der Browser lädt und startet nur, was vom eigenen Server kommt. Weitere Kopfzeilen in `hooks.server.ts`; die Kamera ist nur für eigene Seiten freigegeben. Neue Oberflächenteile nutzen deshalb keine eingebetteten Skripte (`<script>` in `app.html`, `onclick="…"`).
- Ein Konto, angelegt im First-Run-Wizard (`/setup`, nur einmal nutzbar). Ohne Anmeldung erreichbar sind nur `/health`, `/login`, `/setup` (`PUBLIC_PATHS` in `hooks.server.ts`); alles andere leitet zur Anmeldung.
- Login-Sperre je Adresse: 5 Fehlversuche → 1, dann 5, dann 15 Minuten (im Speicher). Fehlversuche stehen im Log, nie Passwort oder Benutzername.
- Adresse eines Besuchers immer über `clientAddress(event)` (`auth.ts`) holen, nie `getClientAddress()`: Was ein Reverse Proxy weiterreicht (`X-Forwarded-For`), zählt nur, wenn er sich ausgewiesen hat (`proxy.ts`, Settings `trustedProxies`/`proxyKey`, einstellbar unter Einstellungen → Server).
- Passwort vergessen: `reset-password.js` (im Image). Schreibt dasselbe Hash-Format wie `hashPassword()` in `auth.ts` – beide zusammen ändern.
- Die Kamera funktioniert im Browser nur über HTTPS (oder `localhost`). Das Projekt bringt kein eigenes HTTPS mit, sondern geht von einem Reverse Proxy aus; Foto und manuelle Eingabe funktionieren immer.

## Als App installierbar

- Manifest unter `/manifest.webmanifest` (`src/routes/manifest.webmanifest/+server.ts`, ohne Anmeldung erreichbar, Texte in der Sprache der App, Kurzbefehl „Scannen“), Angaben fürs iPhone in `app.html`. Symbole unter `static/icons/` und `static/apple-touch-icon.png`, erzeugt mit `scripts/app-icons.mjs` aus dem Logo (`src/lib/assets/favicon.svg`).
- `src/service-worker.ts` hält **nur die Programmdateien** der App vor (Skripte, Stile, Schrift; Lebensmittel-Symbole und die wasm-Datei erst bei Benutzung). Seiten und Daten kommen immer vom Server – nichts aus dem Vorrat wird im Browser gespeichert, ohne Server gibt es keine App. Nie Seiten oder Antworten mit Daten in den Zwischenspeicher legen.

## Benachrichtigungen (Web Push)

- Aufbau wie bei hdtracker: Bereich `/settings/notifications` (Zustand dieses Geräts, Geräteliste mit Umbenennen/Entfernen, Test-Knopf). Braucht HTTPS; iPhone/iPad nur als installierte App.
- Versand in `src/lib/server/push.ts`: Baustein `web-push` (gebündelt, `devDependency`) nur für Verschlüsselung und Signatur, **gesendet wird mit unserem `fetch`** (Tests ohne Netz greifen). Die Adresse eines Geräts kommt vom Browser → nur `PUSH_HOSTS` (Google, Mozilla, Apple, Microsoft; nur https), geprüft beim Speichern und beim Senden. Antwort 404/410 = Gerät gibt es nicht mehr → Eintrag löschen. Schlüssel der Installation (VAPID) liegen in `settings`, der private Teil wird nie ausgeliefert.
- Der Service Worker zeigt die Nachricht (`push`), meldet ein vom Browser erneuertes Abo (`pushsubscriptionchange`) und öffnet beim Antippen die Seite. Android braucht als `badge` eine weiße Form auf transparent (`static/icons/badge-96.png`, aus `scripts/app-icons.mjs`). Das Bild der Nachricht (`icon`) ist bewusst **nicht** das App-Symbol (das zeigt das Handy ohnehin daneben), sondern `static/icons/notify.png`: aufgebaut wie bei hdtracker (192 px, kleine Zeichnung von rund 80 px mittig auf dunklem Quadrat), nur in unseren Farben – Kalender mit Uhr im Verlauf des Schriftzugs auf `#111513`.
- **Erinnerungen** (`src/lib/server/notifications.ts`, Arten in `src/lib/reminders.ts`): drei einzeln schaltbare Anlässe – „läuft bald ab“ (am Tag, an dem die Schwelle `soonDays()` erreicht wird; **nicht** für Inhalte, die erst an oder nach diesem Tag erfasst wurden), „läuft heute ab“, „ist abgelaufen“ (einmal am Tag danach). Form `single` (je Inhalt, öffnet den Behälter) oder `digest` (eine am Tag, öffnet den Vorrat), ab der gewählten Stunde; Wortwahl aus `m.home.relative()` wie in der Vorratsliste. Nichts doppelt (`notifications_sent`, Schlüssel mit dem Haltbarkeitsdatum – ein geändertes Datum meldet neu), Verpasstes wird 2 Tage nachgeholt und eine neuere Meldung erledigt die älteren mit, beim Einschalten zählt erst ab heute (`notifyFrom`), ohne Gerät wird nichts aufgespart. Angestoßen von `src/lib/server/scheduler.ts` (jede volle Stunde und kurz nach dem Start; dort läuft auch das Backup) und sofort nach jeder Änderung der Einstellungen. Kein Stummschalten einzelner Inhalte.
- Echte Zustellung lässt sich nicht automatisch testen (der Testbrowser hat keinen Push-Dienst) – das prüft der User am Gerät.

## Tests

- `npm test` (vitest): Jede Testdatei bekommt eine leere, echte Datenbank in einem Temp-Ordner und **kein Netz** (`src/tests/setup.ts`). Tests liegen neben dem Code (`*.test.ts`).
- **Neue oder geänderte Regel-Logik bekommt einen Test** (Login, Code-Parser, Haltbarkeit, Kategorievorschlag, Import/Export).
- GitHub prüft bei jedem Push auf `main` und bei Pull Requests: `check`, `lint`, `test` (`.github/workflows/check.yml`).
- Keine Browser-Tests (Playwright) – bewusst, wegen der großen Abhängigkeit. Erst nachziehen, wenn der Scan-Ablauf steht und der Nutzen klar ist.

## Dokumentation

- Logo (`src/lib/assets/favicon.svg`): die beiden Farben des Schriftzugs wie bei hdtracker – grüne Fläche `#149a6b`, weißes Glas, Inhalt hellgrün `#b3d94d` (bleibt innerhalb des Glases). Dieselbe Fläche ist die Startfarbe der installierten App (`BRAND` im Manifest). Nach Änderungen am Logo neu erzeugen: App-Symbole (`scripts/app-icons.mjs`), Schriftzug-Bilder und alle Screenshots.
- Schriftzug für die README: `docs/brand/wordmark-light.png` / `-dark.png` (Logo + „hdpantry“ in der Schrift Outfit, „hd“ extrafett mit Verlauf von Grün `#149a6b` nach Hellgrün `#b3d94d`, Rest halbfett; als Bild erzeugt, weil GitHub keine eigenen Schriften lädt). In der App derselbe Schriftzug als Text (`Brand.svelte`, Schrift lokal gebündelt über `@fontsource/outfit`, Klasse `font-brand`).
- README (Englisch) ist das Schaufenster: Name, Kurzbeschreibung, Hinweis „Early development“ (bis zum ersten Release), Links ins Wiki, Features – ehrlich getrennt in „funktioniert heute“ und „in Arbeit“, nur was hdpantry auszeichnet, keine Selbstverständlichkeiten (Sprachen, als App installierbar, Login-Schutz und Konto-Einstellungen bekommen keinen eigenen Punkt; so auch bei hdtracker) –, Quick start, **Built with AI** und License. oben das Titelbild `devices.jpg` (Bildschirm + zwei Handys, eigene Zeichnung der Geräte), Screenshot-Tabelle (`docs/screenshots/`, Handy 390×844 in doppelter Auflösung, englische Oberfläche, dunkles Farbschema, **nur erfundene Beispieldaten**, drei pro Zeile) – nach sichtbaren Änderungen neu aufnehmen. Feature-Liste aktuell halten.
- Anleitungen für Nutzer gehören ins GitHub-Wiki (eigenes Git-Repo, Englisch), nicht in die README. Ändert sich etwas an Installation, `.env`, Update oder Rettungswegen: Wiki-Seite mit anpassen. Die Seite „Privacy and security“ hält fest, dass es keine Verbindung nach außen gibt und wie Daten gespeichert sind.

## Befehle

- `npm run dev` – Dev-Server (http://localhost:5173); braucht `.env` mit `SECRET`
- `npm run check` – Typprüfung · `npm run lint` – Formatprüfung · `npm run format` – formatieren
- `npm test` – automatische Tests
- `npm run build` / `npm start` – Production-Build bauen und starten
- `npm run db:generate` – nach Schema-Änderung neue Migration erzeugen
- `docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build` – Testcontainer aus dem Quellcode (Port 3001, eigener Datenspeicher)

## MVP

Alle Punkte sind fertig (✅): Infrastruktur und Login · Scanner und Behälter · Erfassung · Haltbarkeit · Inventar · „Ersetzen“ · Einstellungen. Zu den Einstellungen im Einzelnen:

- **Gerüst ✅:** Bereiche in `src/lib/settingsNav.ts` (neuer Bereich = eine Zeile dort + Seite unter `src/routes/settings/`); am PC Seitenleiste, am Handy zeigt `/settings` die gruppierte Liste, jeder Bereich hat „← Einstellungen“. Gruppen wie bei hdtracker: Persönlich (Allgemein, Design, Konto, Benachrichtigungen, Daten) · Vorrat (Behälter, Richtwerte) · Verwaltung (Server, Wartung) · Über. **Jede Seite besteht aus Kästen mit Symbol-Überschrift** (Klassen aus `src/lib/ui.ts`); auf eine Anleitung wird **verlinkt** (`WIKI` + `ui.link`, „Mehr dazu“), nicht nur ihr Name genannt. Erfolgsmeldungen enden auf „✓“.
- **Allgemein ✅** (Sprache, Vibration beim Scan, Schwelle „läuft bald ab“) und **Design ✅** (Farbschema mit Vorschau, Symbole). Jede Wahl wird sofort gespeichert, ohne „Speichern“-Knopf; die Seite wird dabei nicht neu geladen – `+layout.svelte` zieht Sprache, Schema und Farbe der Browser-Leiste nach.
- **Konto ✅** (`src/lib/server/account.ts`): Benutzername und Passwort ändern – beides nur mit dem aktuellen Passwort; ein falsches zählt zur Login-Sperre. Eine Passwortänderung meldet alle anderen Geräte ab; dafür gibt es auch einen eigenen Knopf.
- **Daten ✅:** Export und Import als JSON – nur der Vorrat (Behälter, Inhalte, Verlauf, `food_memory`), **nie** Konto, Anmeldungen oder Einstellungen. Import **ersetzt** den ganzen Vorrat, nur mit Bestätigungswort, in einer Transaktion; davor eine Gegenüberstellung „Jetzt / Danach“. Format und Prüfung in `src/lib/backup.ts` (für Browser-Vorschau und Server gemeinsam), `BACKUP_FORMAT` bei jeder Änderung der Datei anheben – ältere Dateien müssen lesbar bleiben. Neue Spalte in `containers`/`items` = auch dort und in `src/lib/server/backup.ts` ergänzen.
- **Wartung ✅** (`/settings/maintenance`, `src/lib/server/backups.ts`, Zeitplan in `src/lib/schedule.ts`): automatische Kopie der ganzen Datenbank nach `DATA_DIR/backups`, **standardmäßig aus**; täglich/wöchentlich/monatlich, Anzahl behalten, „Jetzt sichern“, Herunterladen, Löschen. Zeitplaner in der App (kein Cron, `scheduler.ts`), Verpasstes wird nach dem Start einmal nachgeholt. Einstellungen und letzter Lauf stehen in `settings` (`backup…`). Zurückspielen nur außerhalb der App (Wiki „Backups and restore“).
- **Server ✅** (`/settings/server`, wie bei hdtracker): oben die **Übersicht** – Prüfpunkte in drei Stufen (in Ordnung / Hinweis / zu tun: HTTPS, Reverse Proxy, fehlgeschlagene Hintergrundaufgaben, gesperrte Adressen – genau die Punkte und Texte von hdtracker; Ausgeschaltetes wie Backups ist kein Hinweis; Regeln in `evaluate()` in `src/lib/server/overview.ts`, mit Test) und ein paar Angaben (Version mit Link auf die Release-Notizen, läuft seit, Inhalte, Speicher). Darunter **Verbindung**: Reverse Proxy bestätigen per Adresse (ein Knopf) oder – wenn Docker die Adressen verbirgt – per Schlüssel mit fertiger Zeile für gängige Proxys (`src/lib/proxySnippets.ts`). Was die App von einer Anfrage sieht: `connectionOf()` in `auth.ts`.

## Release

- `CHANGELOG.md` (Englisch, Emoji-Stil): Jede für Nutzer sichtbare Änderung sofort unter `## Upcoming release` eintragen (die Überschrift gibt es nur, solange es solche Änderungen gibt), in `### ✨ New` / `### 🔧 Improved` / `### 🐛 Fixed` / `### 🗑️ Removed`. Aus Nutzersicht formulieren. Rein Internes (CI, Aufräumen, Tests) und README/Wiki gehören nicht hinein.
- Versionen bis 1.0: neue Funktionen → `0.X.0`, nur Fehlerbehebungen → `0.X.Y`.
- Ablauf: Changelog-Text vorher dem User zeigen. Dann `## Upcoming release` → `## X.Y.Z – JJJJ-MM-TT` (kurzer Einleitungssatz, Wichtigstes zuerst, am Ende `### ⬆️ Updating`), Version in `package.json` (`npm version X.Y.Z --no-git-tag-version`), Commit, Tag `vX.Y.Z`, Push.
- `.github/workflows/release.yml` baut bei Tag `v*` nach grüner Prüfung das Image für amd64 und arm64 → `ghcr.io/dvnkln/hdpantry` (Tags `X.Y.Z`, `X.Y`, `latest`; ohne Build-Cache; die App wird nur einmal auf der Build-Plattform gebaut, siehe `Dockerfile`) und stellt den Release-Text in ihre Zusammenfassung (ohne Changelog-Abschnitt schlägt sie fehl). **Das GitHub-Release legt der User selbst an** (kein Personal Access Token); den Text nach dem Tag-Push im Chat mitgeben.
- **Direkt nach dem ersten Release (v0.1.0):** Abzeichen oben in der README wie bei hdtracker (Version, Docker-Image, Checks, Lizenz – in den Farben des Logos), Hinweis „Early development“ entfernen, Quick start und Wiki („Installation“, „Reset your password“, neu „Updating“) auf das veröffentlichte Image umstellen.

Ideen für später stehen in `ROADMAP.md` (Englisch, aus Nutzersicht) – dort eintragen, nicht umsetzen.
