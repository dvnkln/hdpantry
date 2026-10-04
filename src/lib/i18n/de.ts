// German texts of the user interface. en.ts must have exactly the same structure.

import type { Unit } from '$lib/items';

export const de = {
	locale: 'de-DE',

	common: {
		home: 'Startseite',
		logout: 'Abmelden',
		cancel: 'Abbrechen',
		next: 'Weiter',
		yes: 'Ja',
		no: 'Nein',
		save: 'Speichern',
		showPassword: 'Passwort anzeigen',
		hidePassword: 'Passwort verbergen'
	},

	languages: { de: 'Deutsch', en: 'English' },

	auth: {
		loginTitle: 'Anmelden',
		setupTitle: 'Einrichtung',
		welcome: 'Willkommen! Lege dein Konto an – es ist das einzige dieser Installation.',
		language: 'Sprache',
		username: 'Benutzername',
		password: 'Passwort',
		passwordMin: (n: number) => `Passwort (min. ${n} Zeichen)`,
		passwordRepeat: 'Passwort wiederholen',
		login: 'Anmelden',
		createAccount: 'Konto anlegen',
		wrongCredentials: 'Benutzername oder Passwort falsch',
		tooManyAttempts: (seconds: number) =>
			`Zu viele Fehlversuche. Bitte ${seconds >= 120 ? `${Math.ceil(seconds / 60)} min` : `${seconds} s`} warten.`,
		usernameRule: 'Benutzername: 3–32 Zeichen, nur Buchstaben, Zahlen, _ . -',
		passwordTooShort: (n: number) => `Passwort muss mindestens ${n} Zeichen lang sein`,
		passwordsDiffer: 'Passwörter stimmen nicht überein'
	},

	home: {
		empty: 'Noch nichts im Vorrat',
		emptyHint: 'Scanne einen Behälter oder Beutel, um den ersten Inhalt zu erfassen.',
		scan: 'Scannen',
		title: 'Vorrat',
		all: 'Alle',
		filter: 'Nach Lagerort filtern',
		nothingHere: 'An diesem Lagerort ist nichts.',
		summary: (total: number, soon: number, expired: number) =>
			[
				total === 1 ? '1 Inhalt' : `${total} Inhalte`,
				soon ? (soon === 1 ? '1 läuft bald ab' : `${soon} laufen bald ab`) : '',
				expired ? `${expired} abgelaufen` : ''
			]
				.filter(Boolean)
				.join(' · '),
		// How far away a best-before date is, in words
		relative: (days: number) =>
			days === 0
				? 'heute'
				: days === 1
					? 'morgen'
					: days > 60
						? `in ${Math.round(days / 30)} Monaten`
						: days > 1
							? `in ${days} Tagen`
							: days === -1
								? 'seit gestern abgelaufen'
								: `seit ${-days} Tagen abgelaufen`,
		expired: 'abgelaufen',
		sortBy: 'Sortieren nach',
		sortKeys: { date: 'Haltbar bis', name: 'Name', location: 'Lagerort' },
		reverse: 'Reihenfolge umkehren',
		columns: { amount: 'Füllstand', container: 'Behälter' }
	},

	scan: {
		title: 'Scannen',
		intro: 'Halte den Code des Behälters oder Beutels vor die Kamera.',
		startCamera: 'Kamera starten',
		cameraStarting: 'Kamera startet …',
		photo: 'Foto aufnehmen oder auswählen',
		photoReading: 'Foto wird gelesen …',
		photoNoCode: 'Auf dem Foto wurde kein Code gefunden.',
		photoFailed: 'Das Foto konnte nicht gelesen werden.',
		manual: 'Code eintippen',
		manualHint: 'Der Kurzcode steht meist unter dem QR-Code auf dem Behälter.',
		other: 'Ohne Kamera erfassen',
		open: 'Öffnen',
		failed: 'Das hat nicht geklappt. Bitte noch einmal versuchen.',
		unreadable: 'Mit diesem Code kann hdpantry nichts anfangen (leer oder zu lang).',
		checkLink: 'Code prüfen (Rohinhalt anzeigen)',
		twinTitle: 'Schon manuell erfasst',
		twinText: (label: string, content: string | null, history: number) =>
			`Diesen Code gibt es bereits als manuell erfassten Behälter ${label} (${[content ? `Inhalt: ${content}` : 'leer', history ? (history === 1 ? '1 früherer Inhalt' : `${history} frühere Inhalte`) : ''].filter(Boolean).join(', ')}).`,
		twinHint:
			'Ist das derselbe Behälter? Dann führe die beiden zusammen: Inhalt und Verlauf bleiben erhalten. Zusammenführen geht auch später noch in den Einstellungen.',
		twinMerge: 'Zusammenführen',
		twinSeparate: 'Getrennt lassen',
		problems: {
			noHttps:
				'Die Kamera geht nur über eine sichere Verbindung (https). Foto und Eintippen funktionieren trotzdem.',
			denied:
				'Der Zugriff auf die Kamera wurde nicht erlaubt. Du kannst ihn in den Einstellungen des Browsers für diese Seite freigeben.',
			noCamera: 'Es wurde keine Kamera gefunden.',
			failed: 'Die Kamera konnte nicht gestartet werden.'
		}
	},

	scanCheck: {
		title: 'Code prüfen',
		intro:
			'Zeigt, was genau in einem Code steht – hilfreich, wenn ein Code nicht wie erwartet erkannt wird. Gespeichert wird hier nichts; eine Web-Adresse im Code wird nie geöffnet.',
		add: 'Hinzufügen',
		results: (n: number) => `Gelesene Codes (${n})`,
		empty: 'Noch kein Code gelesen.',
		copy: 'Kopieren',
		copyAll: 'Alle kopieren',
		clear: 'Leeren',
		length: (n: number) => `${n} Zeichen`,
		isUrl: 'Web-Adresse',
		sources: { camera: 'Kamera', photo: 'Foto', manual: 'Eingetippt' },
		formats: {
			qr_code: 'QR-Code',
			data_matrix: 'Data Matrix',
			ean_13: 'Strichcode (EAN-13)',
			ean_8: 'Strichcode (EAN-8)',
			code_128: 'Strichcode (Code 128)',
			manual: 'Text'
		}
	},

	containers: {
		typed: 'manuell erfasst',
		scanned: 'gescannt',
		emptyTitle: 'Leerer Behälter',
		container: 'Behälter',
		fill: 'Inhalt erfassen',
		notFound: 'Diesen Behälter gibt es nicht (mehr).'
	},

	locations: {
		pantry: 'Vorratsschrank',
		fridge: 'Kühlschrank',
		zero: 'Null-Grad-Zone',
		freezer: 'Gefrierschrank'
	},

	fillLevels: { low: 'Niedrig', medium: 'Mittel', full: 'Voll' },

	// Units of an amount: with the number ("2 Portionen") and as a choice in the form
	units: {
		g: () => 'g',
		kg: () => 'kg',
		ml: () => 'ml',
		l: () => 'l',
		pcs: () => 'Stück',
		servings: (n: number) => (n === 1 ? 'Portion' : 'Portionen')
	} as Record<Unit, (n: number) => string>,
	unitNames: { g: 'g', kg: 'kg', ml: 'ml', l: 'l', pcs: 'Stück', servings: 'Portionen' },

	// Kinds of food: name, and examples shown when choosing one
	categories: {
		fish_raw: 'Fisch, roh',
		fish_smoked: 'Fisch, geräuchert oder gegart',
		seafood: 'Meeresfrüchte',
		beef_raw: 'Rind, Kalb, Lamm, Wild – roh',
		pork_raw: 'Schwein, roh',
		poultry_raw: 'Geflügel, roh',
		minced: 'Hackfleisch',
		meat_cooked: 'Fleisch, gegart',
		cold_cuts: 'Aufschnitt und Brühwurst',
		cured: 'Rohwurst und Schinken',
		cheese_hard: 'Hart- und Schnittkäse',
		cheese_soft: 'Weich- und Frischkäse',
		dairy: 'Milchprodukte',
		eggs: 'Eier',
		plant_based: 'Tofu und pflanzliche Alternativen',
		veg_raw: 'Gemüse, roh',
		veg_cooked: 'Gemüse, gegart',
		salad_herbs: 'Salat und Kräuter',
		fruit: 'Obst',
		berries: 'Beeren',
		bread: 'Brot und Brötchen',
		cake: 'Kuchen und Gebäck',
		leftovers: 'Reste und Gekochtes',
		dry_goods: 'Trockenware',
		other: 'Sonstiges'
	},
	categoryExamples: {
		fish_raw: 'Lachs, Forelle, Kabeljau, Thunfisch',
		fish_smoked: 'Räucherlachs, gebratenes Fischfilet',
		seafood: 'Garnelen, Muscheln, Tintenfisch',
		beef_raw: 'Rinderfilet, Steak, Lammkeule, Hirsch',
		pork_raw: 'Schnitzel, Kotelett, Schweinefilet',
		poultry_raw: 'Hähnchenbrust, Putenschnitzel, Ente',
		minced: 'Hackfleisch, Mett, Burger-Patties',
		meat_cooked: 'Braten, Frikadellen, gebratenes Hähnchen',
		cold_cuts: 'Kochschinken, Leberwurst, Wiener, Fleischkäse',
		cured: 'Salami, roher Schinken, Speck',
		cheese_hard: 'Parmesan, Gouda, Provolone, Bergkäse',
		cheese_soft: 'Mozzarella, Feta, Camembert, Frischkäse, Quark',
		dairy: 'Milch, Joghurt, Sahne – geöffnet',
		eggs: 'Eier in der Schale',
		plant_based: 'Tofu, Tempeh, Seitan, vegane Wurst, Hummus, Haferdrink',
		veg_raw: 'Möhren, Brokkoli, Paprika, Pilze, Kartoffeln',
		veg_cooked: 'gekochtes, gebratenes oder blanchiertes Gemüse',
		salad_herbs: 'Blattsalat, Spinat, Petersilie, Basilikum',
		fruit: 'Äpfel, Bananen, Zitronen, Mango',
		berries: 'Erdbeeren, Himbeeren, Kirschen, Trauben',
		bread: 'Brot, Brötchen, Baguette, Toast',
		cake: 'Kuchen, Kekse, Croissants, Muffins',
		leftovers: 'Suppe, Eintopf, Soße, gekochte Nudeln, Pizza',
		dry_goods: 'Reis, Nudeln, Mehl, Linsen, Nüsse, Kaffee',
		other: 'alles, wofür es keinen Richtwert gibt – ohne Datumsvorschlag'
	},
	ratings: { good: 'empfohlen', ok: 'möglich', bad: 'nicht empfohlen', never: 'nicht möglich' },

	item: {
		addTitle: 'Neuer Inhalt',
		editTitle: 'Inhalt bearbeiten',
		edit: 'Bearbeiten',
		eaten: 'Gegessen',
		replace: 'Ersetzen',
		replaceTitle: 'Inhalt ersetzen',
		replaceHint: (name: string) =>
			`„${name}“ wird beim Speichern als gegessen vermerkt. Brichst du ab, bleibt alles, wie es ist.`,
		eatenQuestion: (name: string) => `„${name}“ ist gegessen? Der Behälter ist danach leer.`,
		eatenConfirm: 'Ja, gegessen',
		history: 'Zuletzt in diesem Behälter',
		name: 'Name',
		namePlaceholder: 'z. B. Provolone',
		note: 'Notiz',
		notePlaceholder: 'Notiz hinzufügen (optional)',
		vacuumed: 'Vakuumiert',
		location: 'Lagerort',
		bestBeforeOptional: 'Haltbar bis (optional)',
		bestBeforeSuggested: 'Haltbar bis',
		category: 'Kategorie',
		chooseCategory: 'Kategorie wählen',
		chooseIcon: 'Symbol wählen',
		iconAutomatic: 'Symbol wieder automatisch wählen',
		guideLink: 'Richtwerte und Quellen ansehen',
		days: (n: number) => (n === 1 ? '≈ 1 Tag' : `≈ ${n} Tage`),
		useSuggestion: 'Vorschlag übernehmen',
		guideHint: 'Richtwert, keine Garantie – vor dem Essen immer selbst prüfen.',
		guideHintVacuum:
			'Richtwert, keine Garantie – vor dem Essen immer selbst prüfen. Der Aufschlag fürs Vakuumieren ist eine vorsichtige Schätzung.',
		noGuide:
			'Für diese Kategorie gibt es keinen Richtwert – trag ein Datum ein, wenn du eines kennst.',
		fill: 'Füllstand',
		amount: 'Menge',
		addAmount: 'Menge hinzufügen',
		unit: 'Einheit',
		add: 'Hinzufügen',
		alreadyFull: 'In diesem Behälter ist schon etwas.',
		bestBefore: 'Haltbar bis',
		noDate: 'Kein Datum',
		since: 'Seit',
		problems: {
			name: 'Bitte einen Namen eingeben.',
			location: 'Bitte einen Lagerort wählen.',
			date: 'Das Datum ist ungültig.',
			fill: 'Bitte einen Füllstand wählen.',
			amount: 'Menge: bitte eine Zahl größer als 0 (höchstens 99999) und eine Einheit.'
		}
	},

	settings: {
		title: 'Einstellungen',
		groupPersonal: 'Persönlich',
		groupStock: 'Vorrat',
		groupSystem: 'System',
		general: 'Allgemein',
		generalHint: 'Sprache, Scannen, „läuft bald ab“',
		language: 'Sprache',
		scanning: 'Scannen',
		vibration: 'Vibration beim Erkennen eines Codes',
		vibrationHint:
			'Wirkt nur, wenn dein Handy haptisches Feedback erlaubt – das lässt sich von hier aus nicht umgehen.',
		soon: '„Läuft bald ab“',
		soonHint: 'Ab wie vielen Tagen vor dem Datum ein Inhalt im Vorrat hervorgehoben wird.',
		days: (n: number) => (n === 1 ? '1 Tag' : `${n} Tage`),
		appearance: 'Aussehen',
		appearanceHint: 'Farbschema, Symbole',
		account: 'Konto',
		accountHint: 'Benutzername, Passwort, andere Geräte',
		accountName: 'Benutzername',
		accountNameNew: 'Neuer Benutzername',
		accountNameSave: 'Benutzername ändern',
		accountNameSaved: 'Benutzername geändert.',
		accountNameSame: 'Das ist bereits dein Benutzername.',
		accountPassword: 'Passwort',
		accountPasswordCurrent: 'Aktuelles Passwort',
		accountPasswordNew: (n: number) => `Neues Passwort (min. ${n} Zeichen)`,
		accountPasswordRepeat: 'Neues Passwort wiederholen',
		accountPasswordSave: 'Passwort ändern',
		accountPasswordSaved: 'Passwort geändert. Alle anderen Geräte wurden abgemeldet.',
		accountPasswordHint: 'Nach der Änderung werden alle anderen Geräte abgemeldet.',
		accountWrongPassword: 'Das aktuelle Passwort stimmt nicht',
		accountDevices: 'Andere Geräte',
		accountDevicesNone: 'Du bist nur auf diesem Gerät angemeldet.',
		accountDevicesCount: (n: number) =>
			n === 1
				? 'Du bist auf einem weiteren Gerät angemeldet.'
				: `Du bist auf ${n} weiteren Geräten angemeldet.`,
		accountDevicesLogout: 'Andere Geräte abmelden',
		accountDevicesDone: 'Alle anderen Geräte wurden abgemeldet.',
		data: 'Daten',
		dataHint: 'Export und Import',
		dataExport: 'Export',
		dataExportText:
			'Lädt deinen Vorrat als Datei herunter: alle Behälter, was drin ist, der Verlauf und was die App über deine Lebensmittel gelernt hat. Konto und Einstellungen sind nicht enthalten.',
		dataNow: (containers: number, filled: number) =>
			`Aktuell: ${containers} Behälter, davon ${filled} gefüllt.`,
		dataExportButton: 'Export herunterladen',
		dataImport: 'Import',
		dataImportText:
			'Spielt eine Export-Datei ein. Der Import ersetzt den ganzen Vorrat – er fügt nichts hinzu. Konto und Einstellungen bleiben, wie sie sind.',
		dataChoose: 'Datei auswählen',
		dataWarning:
			'Alles, was jetzt in der App ist, wird gelöscht und durch die Datei ersetzt. Das lässt sich nicht rückgängig machen – lade vorher einen Export herunter, wenn du unsicher bist.',
		dataWord: 'ERSETZEN',
		dataReplace: 'Vorrat ersetzen',
		dataWrongWord: 'Zum Ersetzen bitte das Bestätigungswort eintippen.',
		dataImported: (containers: number, filled: number) =>
			`Import abgeschlossen: ${containers} Behälter, davon ${filled} gefüllt.`,
		maintenance: 'Wartung',
		maintenanceHint: 'Automatische Sicherung der Datenbank',
		backup: 'Automatische Sicherung',
		backupText:
			'Legt nach Zeitplan eine Kopie der ganzen Datenbank an – Vorrat, Konto und Einstellungen. Die Kopien liegen im Datenordner unter „backups“ und lassen sich hier herunterladen.',
		backupSwitch: 'Nach Zeitplan sichern',
		backupHow: 'Wie oft',
		backupFrequencies: { daily: 'Täglich', weekly: 'Wöchentlich', monthly: 'Monatlich' },
		backupMonthlyHint: 'Monatlich heißt: am Ersten des Monats.',
		backupWeekday: 'Wochentag',
		backupTime: 'Uhrzeit',
		backupKeep: 'Aufbewahren',
		backupKeepHint: 'So viele Sicherungen bleiben; ältere werden gelöscht.',
		backupNext: (when: string) => `Nächste Sicherung: ${when}`,
		backupLast: (when: string) => `Letzte Sicherung: ${when}`,
		backupNever: 'Bisher wurde keine Sicherung angelegt.',
		backupFailed: (error: string) => `Die letzte Sicherung ist fehlgeschlagen: ${error}`,
		backupNow: 'Jetzt sichern',
		backupRunning: 'Sichert …',
		backupFiles: 'Sicherungen',
		backupNone: 'Noch keine Sicherung vorhanden.',
		backupDownload: 'Herunterladen',
		backupDeleteQuestion: 'Diese Sicherung löschen?',
		backupSizes: (database: string, backups: string) =>
			`Datenbank: ${database} · Sicherungen: ${backups}`,
		backupRestore:
			'Eine Sicherung wird außerhalb der App zurückgespielt. Die Anleitung steht im Wiki unter „Backups and restore“.',
		dataBusy: 'Wird importiert …',
		dataNowColumn: 'Jetzt',
		dataAfterColumn: 'Danach',
		dataRows: {
			containers: 'Behälter',
			filled: 'davon gefüllt',
			history: 'Einträge im Verlauf',
			memory: 'Gelernte Zuordnungen'
		},
		dataFileFrom: (day: string) => `Export vom ${day}`,
		dataProblems: {
			tooLarge: 'Die Datei ist zu groß.',
			notBackup: 'Das ist keine Export-Datei von hdpantry.',
			newer:
				'Die Datei stammt aus einer neueren Version von hdpantry. Bitte zuerst die App aktualisieren.',
			invalid: (where: string) =>
				`Die Datei ist beschädigt oder wurde verändert (Stelle: ${where}). Es wurde nichts geändert.`
		},
		theme: 'Farbschema',
		themeHint: '„System“ folgt der Einstellung deines Geräts.',
		themes: { system: 'System', dark: 'Dunkel', light: 'Hell' },
		containersShort: 'Löschen, Code ändern, zusammenführen',
		guideShort: 'Tabelle der Haltbarkeiten mit Quellen',
		aboutHint: 'Version, Links, Lizenz',
		icons: 'Symbole',
		iconsHint: 'Wie Lebensmittel in Listen und Formularen dargestellt werden.',
		iconStyles: { color: 'Farbig', line: 'Schlicht' },
		guide: 'Richtwerte',
		guideHint:
			'Wie lange hdpantry welches Lebensmittel für haltbar hält, je nach Lagerort – mit Quellen.',
		containers: 'Behälter',
		containersHint:
			'Alle Behälter, die hdpantry kennt – auch leere. Löschen entfernt einen Behälter samt seinem Verlauf; beim nächsten Scan seines Codes wird er neu angelegt.',
		noContainers: 'Noch keine Behälter.',
		empty: 'leer',
		typed: 'manuell erfasst',
		history: (n: number) => (n === 1 ? '1 früherer Inhalt' : `${n} frühere Inhalte`),
		delete: 'Löschen',
		deleteQuestion: (label: string, content: string | null, history: number) => {
			const lost = [
				content ? `„${content}“` : '',
				history ? (history === 1 ? '1 früherer Inhalt' : `${history} frühere Inhalte`) : ''
			].filter(Boolean);
			return `Behälter ${label} wirklich löschen?${lost.length ? ` Mit gelöscht: ${lost.join(' und ')}.` : ''} Das lässt sich nicht rückgängig machen.`;
		},
		deleteConfirm: 'Ja, löschen',
		showCode: 'Inhalt des Codes anzeigen',
		codeContent: 'Inhalt des gescannten Codes',
		changeCode: 'Code ändern',
		newCode: 'Neuer Code',
		codeProblems: {
			invalid: 'Bitte einen Code eingeben.',
			taken: 'Diesen Code hat schon ein anderer manuell erfasster Behälter.',
			notManual: 'Nur manuell erfasste Behälter können einen anderen Code bekommen.'
		},
		open: 'Behälter öffnen',
		merge: 'Zusammenführen',
		mergeQuestion: (label: string) =>
			`Es gibt einen gescannten Behälter mit demselben Code (${label}). Zusammenführen? Inhalt und Verlauf wandern zum gescannten Behälter, der manuell erfasste verschwindet.`,
		mergeConfirm: 'Ja, zusammenführen',
		mergeProblems: {
			bothFull:
				'Beide Behälter sind gefüllt. Ein Behälter kann nur einen Inhalt haben – markiere erst einen als gegessen.',
			noTwin: 'Dazu gibt es keinen gescannten Behälter mit demselben Code.'
		},
		deleteAll: 'Alle Behälter löschen',
		deleteAllHint:
			'Entfernt sämtliche Behälter, den ganzen Vorrat und jeden Verlauf. hdpantry ist danach leer wie am ersten Tag; dein Konto bleibt.',
		deleteAllQuestion: (n: number) =>
			`Wirklich ${n === 1 ? 'den einen Behälter' : `alle ${n} Behälter`} samt Vorrat und Verlauf löschen? Das lässt sich nicht rückgängig machen.`,
		deleteWord: 'LÖSCHEN',
		typeToConfirm: (word: string) => `Zum Bestätigen ${word} eintippen`,
		deleteAllConfirm: 'Alles endgültig löschen',
		wrongWord: 'Zum Löschen bitte das Bestätigungswort eintippen.'
	},

	guide: {
		title: 'Richtwerte zur Haltbarkeit',
		warning:
			'Das sind Schätzungen, keine Garantien. hdpantry schlägt ein Datum vor, damit du den Überblick behältst – ob etwas noch gut ist, musst du immer selbst prüfen: ansehen, riechen, und im Zweifel wegwerfen. Das gilt besonders für rohen Fisch, rohes Fleisch und Hackfleisch.',
		how: 'So kommen die Werte zustande',
		howText: [
			'Zuerst gelten Angaben deutscher öffentlicher Stellen; wo es keine gibt, die Daten des US-Landwirtschaftsministeriums.',
			'Nennt eine Quelle eine Spanne, gilt ihr unteres Ende; bei zwei Angaben die vorsichtigere.',
			'Für die Null-Grad-Zone und für zu Hause vakuumierte Lebensmittel veröffentlicht keine dieser Stellen Zahlen. Diese Werte sind eigene vorsichtige Schätzungen.',
			'Roher Fisch, Meeresfrüchte, Geflügel und Hackfleisch bekommen gekühlt keinen Aufschlag fürs Vakuumieren – nur im Gefrierschrank.'
		],
		table: 'Tabelle',
		tableHint: 'Tage offen / vakuumiert. Ein Strich bedeutet: dort nicht lagern.',
		food: 'Lebensmittel',
		noValue: 'kein Richtwert',
		sources: 'Quellen',
		ownEstimate: 'Eigene vorsichtige Schätzung, abgeleitet vom Wert für den Kühlschrank',
		ownVacuum:
			'Eigene vorsichtige Schätzung für vakuumierte Lebensmittel (keine öffentliche Stelle veröffentlicht dazu Zahlen)',
		symbols: 'Symbole',
		symbolsText:
			'Farbige Symbole: Twemoji, © Twitter, Inc. und weitere Mitwirkende, Lizenz CC BY 4.0. Schlichte Symbole: Lucide (ISC-Lizenz) und Tabler Icons (MIT-Lizenz).'
	},

	about: {
		title: 'Über',
		version: (v: string) => `Version ${v}`,
		text: 'Ein Vorrats-Tracker zum Selberhosten für wiederverwendbare Vakuumbehälter und -beutel mit QR-Code.',
		private:
			'hdpantry läuft auf deinem eigenen Server und nimmt von sich aus keine Verbindung nach außen auf. Die Links unten öffnen erst auf deinen Tipp hin eine andere Seite.',
		links: 'Links',
		docs: 'Dokumentation (Wiki)',
		source: 'Quellcode auf GitHub',
		issues: 'Fehler melden oder Idee vorschlagen',
		roadmap: 'Was noch geplant ist',
		license: 'Lizenz: GNU AGPL v3',
		credits: 'Verwendet',
		twemoji: 'farbige Symbole, © Twitter, Inc. und weitere Mitwirkende, Lizenz CC BY 4.0',
		lucide: 'Strich-Symbole, ISC-Lizenz',
		tabler: 'weitere Strich-Symbole, MIT-Lizenz',
		outfit: 'Schrift des Schriftzugs, SIL Open Font License',
		bundled: 'Alles davon ist Teil der App; nichts wird von anderswo geladen.',
		ai: 'Entwickelt mit Unterstützung von KI (Claude Code).'
	},

	errorPage: {
		notFound: 'Seite nicht gefunden',
		notFoundHint: 'Diese Adresse gibt es nicht (mehr).',
		failed: 'Das hat nicht geklappt',
		failedHint: 'Bitte versuche es noch einmal.',
		home: 'Zur Startseite'
	}
};

export type Messages = typeof de;
