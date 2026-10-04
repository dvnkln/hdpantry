# hdpantry – Projektregeln

Self-hosted Vorrats-Tracker für wiederverwendbare Vakuumbehälter und -beutel mit QR-Code. Single-User, Docker Compose, Mobile-first, am PC voll nutzbar. Lizenz AGPL-3.0, öffentlich auf GitHub.

## Zusammenarbeit

- Antworten auf Deutsch; jede Änderung in 1–2 Sätzen ohne Fachjargon erklären.
- Kleine Schritte. Vor größeren Aufgaben einen Plan vorlegen, nach jedem Schritt stoppen und erklären, wie man testet. Bei Unklarheiten nachfragen.
- Vor jedem Commit fragen; nach dem Okay selbst committen und im selben Zug pushen.
- Diese Datei bleibt schlank (Richtwert unter 150 Zeilen): nur Regeln und Entscheidungen, die jede Session braucht. Details in Code-Kommentare, Anleitungen ins Wiki. Wird sie länger: kürzen statt anhängen. Keine Angaben über Personen, lokale Pfade oder Rechner.

## Unverhandelbar

- **`data/` wird nie committet oder gepusht.** Steht komplett in `.gitignore` und `.dockerignore`. Vor jedem Commit prüfen (`git status`, `git diff --cached --name-only`), dass nichts aus `data/` dabei ist. Lokal liegt dort die Datenbank (`DATA_DIR=./data`), Screenshots nur in `data/screenshots/`.
- **Null Verbindungen nach außen**, weder Server noch Browser: keine fremden Skripte, Schriften, CDNs, Bilder, Telemetrie, Update-Prüfung. Alles lokal gebündelt (auch die QR-Bibliothek). Server-Code ruft nie `fetch` nach außen auf.
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
- **Migrationen:** Schema ändern → `npm run db:generate` → Migration mit committen. Bis zum ersten Release (v0.1.0) darf alles in `drizzle/0000_init.sql` zusammengefasst werden. **Ab v0.1.0** nur noch neue Migrationen, die bestehende Daten erhalten – nie alte ändern oder löschen.
- **Texte:** Alle sichtbaren Texte in `src/lib/i18n/de.ts` + `en.ts` (gleiche Struktur, TypeScript prüft das). Im Browser `m.xyz` aus `$lib/i18n/index.svelte`, auf dem Server `serverMessages(locale)`. Der Server liefert Werte (ISO-Datum, Zahlen), formatiert wird in der Oberfläche. Sprache einer Anfrage: `event.locals.locale`.
- **Farben:** nur die Namen aus `src/routes/layout.css` (`bg-surface`, `text-muted`, `bg-accent`, …), keine festen Farbwerte in Seiten. Die App folgt bisher hell/dunkel des Geräts; mit Punkt 7 wird das wählbar (System, Dunkel, Hell – siehe MVP). Weitere Farbschemata sind nicht geplant. Systemschrift; die einzige eigene Schrift ist Outfit für den Schriftzug „hdpantry“.
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
- Einstellungen (`/settings`): Liste aller Behälter. Einzelnen löschen = doppelte Bestätigung; **„Alle Behälter löschen“ nur nach Eintippen des Bestätigungsworts** (prüft auch der Server).
- Rückmeldung beim Erkennen: nur eine kurze Vibration (wirkt nur, wenn das Handy haptisches Feedback erlaubt – von einer Webseite nicht zu umgehen). Bewusst kein Ton und kein optischer Effekt: Das Ergebnis erscheint ohnehin sofort.
- `/scan/check` („Code prüfen“) zeigt Rohinhalte, ohne zu speichern – bleibt dauerhaft in der App, für neue Behälter-Systeme und Fehlermeldungen.

## Inhalte

- **Es gibt genau einen Namen: den des Inhalts** (z. B. „Provolone“). Er wird nach dem Scan abgefragt, steht in der Vorratsübersicht und steuert die Automatik (Kategorie, Symbol, Lagerort, Datum). Ein Behälter hat keinen eigenen Namen; er heißt „Größe · Kurzcode“ (`codeLabel()`) und steht nur bei den Details. Nie ein zweites Namensfeld einführen.
- Tabelle `items`: was in einem Behälter ist oder war. „Gegessen“ (immer mit Rückfrage) löscht nicht, sondern setzt `removed_at`; danach ist der Behälter leer und fragt beim nächsten Scan nach einem neuen Namen. Darunter steht der Verlauf dieses Behälters, das Neueste zuerst; Antippen übernimmt den Eintrag als Vorlage (alles außer dem Datum). Höchstens ein aktiver Inhalt je Behälter – das sichert auch ein Index in der Datenbank.
- Felder, Grenzen und die Prüfung des Formulars stehen in `src/lib/items.ts` (`readItemForm()`), für Browser und Server gemeinsam. Lagerorte: `pantry`, `fridge`, `zero`, `freezer`; Füllstand: `low`, `medium`, `full`. Menge optional als Zahl + Einheit (`g`, `kg`, `ml`, `l`, `pcs`, `servings`). **Die Menge folgt dem Füllstand-Regler in Dritteln** (voll = 3/3, mittel = 2/3, niedrig = 1/3; `scaleAmount()`), gerechnet ab der zuletzt eingetippten Menge und der Stufe, bei der sie eingetippt wurde.
- Ein Formular für Neu und Bearbeiten (`ItemForm.svelte`). Neu (`/containers/[id]/add`): erst nur der Name (Fokus sofort, Enter = weiter), dann der Rest – dort ist nichts fokussiert, damit die Handy-Tastatur zugeht. Bearbeiten (`/containers/[id]/edit`) über das Stift-Symbol neben dem Namen – Bearbeiten immer per Stift, nicht über Extra-Felder auf der Detailseite.
- Füllstand wird als Zeichnung gezeigt (`FillGauge.svelte`), im Formular über dem Regler, auf Detailseite und in der Vorratsliste: gescannte Behälter als Vakuumbeutel (eckig, Verschlussleiste, rundes Ventil – eigene Zeichnung), manuell erfasste als Glas, damit man sie unterscheiden kann. Der Regler hat drei Markierungen statt Beschriftung; die gewählte Stufe steht unter der Zeichnung.
- Kein Foto-Upload. Optionale Notiz je Inhalt: im Formular eine unauffällige Zeile direkt unter dem Namen, ohne Rahmen und Überschrift. Optionales bleibt dezent: Die Menge erscheint erst über „Menge hinzufügen“.
- Knöpfe nur zeigen, wenn die Aktion gerade möglich ist; sonst gleich den Grund nennen (Beispiel: Zusammenführen bei zwei gefüllten Behältern).
- Der große Scan-Knopf steht nur auf der Startseite (Vorrat), nicht auf den anderen Seiten.
- Startseite: einfache Vorratsliste, sortiert nach Datum (ohne Datum zuletzt). Filter, Hervorhebung und Tabellenansicht folgen mit dem Inventar-Punkt.

## Haltbarkeit

- Alles unter `src/lib/food/`: `categories.ts` (25 Kategorien, Einstufung der Lagerorte: gut / möglich / schlecht / gesperrt), `shelfLife.ts` (Richtwerte in Tagen je Kategorie × Lagerort × offen/vakuumiert, **jeder Wert mit Quelle**), `dictionary.ts` (Name → Kategorie, de/en).
- **Die Richtwerte sind bewusst vorsichtig und mit dem User abgestimmt – nicht ohne Rückfrage lockern.** Reihenfolge der Quellen: deutsche Stellen (BVL, BfR, BZfE, BMEL, Verbraucherzentrale), USDA FoodKeeper für Lücken, unteres Ende einer Spanne, bei zwei Angaben die vorsichtigere. Null-Grad-Zone und Vakuum sind eigene Schätzungen (`est`, `vac`).
- **Roher Fisch, Meeresfrüchte, Geflügel und Hackfleisch bekommen gekühlt keinen Vakuum-Aufschlag** (nur im Gefrierschrank); Verderbliches im Kühlschrank auch vakuumiert höchstens 10 Tage. Tests sichern das ab.
- Wörterbuch: Gerichte gehen vor („Linsensuppe“), der letzte Wortteil entscheidet („Zwiebelkuchen“), Teilstücke zählen nur ohne Tier („Putenschnitzel“). Korrekturen des Users je Name landen in `food_memory` und gehen dem Wörterbuch vor.
- Formular: Kategorie aus dem Namen (antippbar, Auswahl mit Beispielzeile), Lagerorte eingefärbt, gesperrte nicht wählbar (prüft auch der Server), bester vorausgewählt. Das Datum folgt Kategorie, Lagerort und Vakuum, bis es von Hand gesetzt wird (`date_manual`); dann „Vorschlag übernehmen“.
- **Überall, wo ein Datum vorgeschlagen wird, steht der Hinweis „Richtwert, keine Garantie – immer selbst prüfen“.**
- Symbole (`src/lib/food/icons.ts`, `FoodIcon.svelte`): zwei Stile, umschaltbar in den Einstellungen (`iconStyle`) – farbig = Twemoji (CC BY 4.0, Namensnennung in README und App Pflicht), schlicht = Lucide/Tabler als Maske in Textfarbe. Die Dateien liegen fertig unter `static/food/` und werden mit `scripts/food-icons.mjs` aus der Liste erzeugt (Pakete dafür nur vorübergehend installieren, keine Projekt-Abhängigkeit). Symbol je Inhalt: von Hand gewählt (`items.icon`) oder aus Name und Kategorie (`suggestIcon()`).
- Seite `/settings/guide` zeigt Tabelle, Quellen und Hinweis; README hat denselben Hinweis samt Quellenliste. Ändern sich Werte oder Quellen: `shelfLife.ts`, README und Wiki-Seite „Shelf life guide values“ zusammen anpassen.

## Sicherheit

- Start über `start.js`: `ORIGIN` darf mehrere Adressen (kommagetrennt) enthalten. Die eigene Origin-Prüfung in `hooks.server.ts` ersetzt SvelteKits CSRF-Check. Ohne `ORIGIN` scheitern Formulare im Container mit 403 – deshalb Pflicht.
- Login-Cookie ist nur bei HTTPS „secure“ (`isHttps()` in `origins.ts`), damit die Anmeldung auch im LAN ohne HTTPS geht.
- CSP in `vite.config.ts`: Der Browser lädt und startet nur, was vom eigenen Server kommt. Weitere Kopfzeilen in `hooks.server.ts`; die Kamera ist nur für eigene Seiten freigegeben. Neue Oberflächenteile nutzen deshalb keine eingebetteten Skripte (`<script>` in `app.html`, `onclick="…"`).
- Ein Konto, angelegt im First-Run-Wizard (`/setup`, nur einmal nutzbar). Ohne Anmeldung erreichbar sind nur `/health`, `/login`, `/setup` (`PUBLIC_PATHS` in `hooks.server.ts`); alles andere leitet zur Anmeldung.
- Login-Sperre je Adresse: 5 Fehlversuche → 1, dann 5, dann 15 Minuten (im Speicher). Fehlversuche stehen im Log, nie Passwort oder Benutzername.
- Adresse eines Besuchers immer über `clientAddress(event)` (`auth.ts`) holen, nie `getClientAddress()`: Was ein Reverse Proxy weiterreicht (`X-Forwarded-For`), zählt nur, wenn er sich ausgewiesen hat (`proxy.ts`, Settings `trustedProxies`/`proxyKey`; die Einstellseite dazu kommt mit Punkt 7).
- Passwort vergessen: `reset-password.js` (im Image). Schreibt dasselbe Hash-Format wie `hashPassword()` in `auth.ts` – beide zusammen ändern.
- Die Kamera funktioniert im Browser nur über HTTPS (oder `localhost`). Das Projekt bringt kein eigenes HTTPS mit, sondern geht von einem Reverse Proxy aus; Foto und manuelle Eingabe funktionieren immer.

## Tests

- `npm test` (vitest): Jede Testdatei bekommt eine leere, echte Datenbank in einem Temp-Ordner und **kein Netz** (`src/tests/setup.ts`). Tests liegen neben dem Code (`*.test.ts`).
- **Neue oder geänderte Regel-Logik bekommt einen Test** (Login, Code-Parser, Haltbarkeit, Kategorievorschlag, Import/Export).
- GitHub prüft bei jedem Push auf `main` und bei Pull Requests: `check`, `lint`, `test` (`.github/workflows/check.yml`).
- Keine Browser-Tests (Playwright) – bewusst, wegen der großen Abhängigkeit. Erst nachziehen, wenn der Scan-Ablauf steht und der Nutzen klar ist.

## Dokumentation

- Schriftzug für die README: `docs/brand/wordmark-light.png` / `-dark.png` (Logo + „hdpantry“ in der Schrift Outfit, „hd“ extrafett mit Verlauf von Grün `#149a6b` nach Hellgrün `#b3d94d`, Rest halbfett; als Bild erzeugt, weil GitHub keine eigenen Schriften lädt). In der App derselbe Schriftzug als Text (`Brand.svelte`, Schrift lokal gebündelt über `@fontsource/outfit`, Klasse `font-brand`).
- README (Englisch) ist das Schaufenster: Name, Kurzbeschreibung, Hinweis „Early development“ (bis zum ersten Release), Links ins Wiki, Features – ehrlich getrennt in „funktioniert heute“ und „in Arbeit“, nur was hdpantry auszeichnet –, Quick start, **Built with AI** und License. Screenshots kommen, sobald es etwas zu zeigen gibt. Mit jedem MVP-Punkt die Feature-Liste nachziehen.
- Anleitungen für Nutzer gehören ins GitHub-Wiki (eigenes Git-Repo, Englisch), nicht in die README. Ändert sich etwas an Installation, `.env`, Update oder Rettungswegen: Wiki-Seite mit anpassen. Die Seite „Privacy and security“ hält fest, dass es keine Verbindung nach außen gibt und wie Daten gespeichert sind.

## Befehle

- `npm run dev` – Dev-Server (http://localhost:5173); braucht `.env` mit `SECRET`
- `npm run check` – Typprüfung · `npm run lint` – Formatprüfung · `npm run format` – formatieren
- `npm test` – automatische Tests
- `npm run build` / `npm start` – Production-Build bauen und starten
- `npm run db:generate` – nach Schema-Änderung neue Migration erzeugen
- `docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build` – Testcontainer aus dem Quellcode (Port 3001, eigener Datenspeicher)

## MVP

1. Scaffold + Infrastruktur, First-Run-Wizard, Login – ✅
2. Scanner, Code-Parser, Behälterverwaltung – ✅
3. Erfassung (alle Felder von Hand), Bearbeiten, „Gegessen“, Verlauf je Behälter als Vorlage, einfache Vorratsliste – ✅
4. Haltbarkeit: Kategorie und Symbol aus dem Namen, eingefärbte Lagerorte, berechnetes Datum, Richtwerte mit Quellen – ✅
5. Scan-Ablauf, Rest: „ersetzen“ (alten Inhalt entfernen und neuen erfassen in einem Zug)
6. Inventar
7. Einstellungen ausbauen (Seite `/settings` gibt es schon, bisher nur Behälter; Aufbau dann in Bereiche gliedern: am PC Seitenleiste, am Handy gruppierte Liste). Dazu gehören vor dem ersten Release:
   - Sprache der Oberfläche nachträglich ändern (Deutsch/Englisch; bisher nur im Einrichtungs-Wizard wählbar)
   - Farbschema wählen: System (folgt dem Gerät, Standard), Dunkel, Hell – mit kleiner Vorschau je Schema. Technik: Attribut `data-theme` am `<html>`, vom Server direkt ins HTML geschrieben (kein Aufblitzen), die Login-Seite merkt sich das Schema des Geräts per Cookie; die Farbwerte in `layout.css` dafür auf `[data-theme]`-Blöcke umstellen
   - Vibration beim Scan abschaltbar
   - Passwort ändern, Reverse Proxy bestätigen (`trustedProxies`/`proxyKey`)
   - Export/Import als JSON

**Vor dem ersten Release (v0.1.0, nach Punkt 7) noch offen – bewusst verschoben:** GitHub Action für das Multi-Arch-Image (amd64, arm64 → GHCR bei Tag `v*`, nur nach grüner Prüfung, App-Build nur auf der Build-Plattform, kein Build-Cache) und `CHANGELOG.md` samt Release-Ablauf.

Ideen für später stehen in `ROADMAP.md` (Englisch, aus Nutzersicht) – dort eintragen, nicht umsetzen.
