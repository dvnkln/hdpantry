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
- **Farben:** nur die Namen aus `src/routes/layout.css` (`bg-surface`, `text-muted`, `bg-accent`, …), keine festen Farbwerte in Seiten. Die App folgt hell/dunkel des Geräts; kein Theme-System. Systemschrift, keine eigene Schrift.
- Hover-Effekte für alles Klickbare, kurze Übergänge.

## Scanner

- Codes werden nur im Browser gelesen (`src/lib/scanner.ts`): eingebauter Scanner des Browsers (`BarcodeDetector`, z. B. Chrome auf Android – lädt nichts nach), sonst `zxing-wasm` hinter derselben Schnittstelle (Paket `barcode-detector`), erst bei Bedarf geladen. Die wasm-Datei ist gebündelt; die Bibliothek würde sie sonst von einem fremden Server holen – `locateFile` nie entfernen. Dafür steht `'wasm-unsafe-eval'` in der CSP.
- Drei Wege, immer alle anbieten: Kamera (`CameraScanner.svelte`), Foto (wird im Browser gelesen, nie hochgeladen), Eintippen. Am Handy startet die Kamera sofort, am PC (`pointer: fine`) erst per Knopf.
- Eine Web-Adresse in einem Code wird nur angezeigt oder gespeichert, nie geöffnet oder abgerufen.
- Gelesen werden QR, Data Matrix, EAN-13/8, Code 128 (`FORMATS`).
- **Sobald ein Code erkannt ist, geht es ohne Bestätigung weiter** (`/scan`): bekannter Behälter → seine Seite, unbekannter → Formular „Neuer Behälter“ mit optionalem Namen. Kein Zwischenschritt, kein „Foto bestätigen“.
- Code-Parser `src/lib/codes.ts`: zieht die ID eines Behälters aus dem Rohinhalt. Regeln als Tabelle (`PARAMETER_RULES`): Bei Codes mit Parametern ist der Kurzcode-Parameter die ID (er steht auch aufgedruckt auf dem Behälter – eingetippt muss er denselben Behälter finden), Größe und Typ-Code werden mitgenommen; die Adresse davor ist egal. Jeder andere Code zählt als Ganzes. Kurzcodes werden großgeschrieben. Neue Code-Form = neue Regel + Test, mit erfundenen Beispielwerten.
- Behälter (`containers`, `src/lib/server/containers.ts`): Rohinhalt wird immer mitgespeichert. Kein pflegbares Feld für die Art (Beutel/Box); der Typ-Code wird nur gespeichert, nicht gedeutet. Ohne Namen heißt ein Behälter „Größe · Kurzcode“ (`containerLabel()` in `src/lib/containers.ts`).
- `/scan/check` („Code prüfen“) zeigt Rohinhalte, ohne zu speichern – bleibt dauerhaft in der App, für neue Behälter-Systeme und Fehlermeldungen.

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
3. Erfassung
4. Scan-Ablauf (bekannt/aktiv/leer, gegessen, ersetzen, Verlauf je Behälter)
5. Haltbarkeit: Kategorien, Namensvorschlag, Lagerempfehlung, Berechnung
6. Inventar
7. Einstellungen, Export/Import als JSON

**Vor dem ersten Release (v0.1.0, nach Punkt 7) noch offen – bewusst verschoben:** GitHub Action für das Multi-Arch-Image (amd64, arm64 → GHCR bei Tag `v*`, nur nach grüner Prüfung, App-Build nur auf der Build-Plattform, kein Build-Cache) und `CHANGELOG.md` samt Release-Ablauf.

Ideen für später stehen in `ROADMAP.md` (Englisch, aus Nutzersicht) – dort eintragen, nicht umsetzen.
