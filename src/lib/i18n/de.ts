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
		invalid: 'Das hat nicht geklappt.',
		showPassword: 'Passwort anzeigen',
		hidePassword: 'Passwort verbergen'
	},

	// What the browser shows when hdpantry is installed as an app
	app: {
		description: 'Vorrats-Tracker: wissen, was da ist und was zuerst gegessen werden sollte',
		scan: 'Scannen'
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
		emptyHint: 'Scanne einen Behälter, um den ersten Inhalt zu erfassen.',
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
		// Small marks above the list
		marks: {
			expired: (n: number) => `${n} abgelaufen`,
			soon: (n: number) => `${n} bald`
		},
		sortBy: 'Sortieren nach',
		sortKeys: { date: 'Haltbar bis', name: 'Name', location: 'Lagerort' },
		reverse: 'Reihenfolge umkehren',
		columns: { amount: 'Füllstand', container: 'Behälter' }
	},

	scan: {
		title: 'Scannen',
		intro: 'Halte den Code des Behälters vor die Kamera.',
		startCamera: 'Kamera starten',
		cameraStarting: 'Kamera startet …',
		photo: 'Foto aufnehmen oder auswählen',
		photoReading: 'Foto wird gelesen …',
		photoNoCode: 'Auf dem Foto wurde kein Code gefunden.',
		photoFailed: 'Das Foto konnte nicht gelesen werden.',
		manual: 'Code eintippen',
		manualHint: 'Der Kurzcode steht meist unter dem QR-Code auf dem Behälter.',
		create: 'Anlegen',
		createHint: 'Diesen Code gibt es noch nicht – es wird ein neuer Behälter angelegt.',
		openHint: (content: string | null) =>
			content
				? `Diesen Behälter gibt es schon – darin: ${content}.`
				: 'Diesen Behälter gibt es schon – er ist leer.',
		other: 'Ohne Kamera erfassen',
		// The containers offered below the field for typing
		kinds: 'Nach Art filtern',
		typedGroup: 'Manuell',
		scannedGroup: 'Gescannt',
		empty: 'leer',
		emptyLast: (name: string) => `leer · ${name}`,
		more: (n: number) => (n === 1 ? '1 weiterer' : `${n} weitere`),
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
		results: (n: number) => `Gelesene Codes (${n})`,
		empty: 'Noch kein Code gelesen.',
		copy: 'Kopieren',
		copyAll: 'Alle kopieren',
		clear: 'Leeren',
		length: (n: number) => `${n} Zeichen`,
		isUrl: 'Web-Adresse',
		sources: { camera: 'Kamera', photo: 'Foto' },
		formats: {
			qr_code: 'QR-Code',
			data_matrix: 'Data Matrix',
			ean_13: 'Strichcode (EAN-13)',
			ean_8: 'Strichcode (EAN-8)',
			code_128: 'Strichcode (Code 128)'
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
		recent: 'Zuletzt erfasst',
		moreHistory: (n: number) => (n === 1 ? '1 weiteren anzeigen' : `${n} weitere anzeigen`),
		name: 'Name',
		// Shown in the empty name field, a different one each time: food and dishes only
		nameExamples: [
			'Provolone',
			'Linsensuppe',
			'Lachsfilet',
			'Hackfleisch',
			'Erdbeeren',
			'Bolognese',
			'Hähnchenbrust',
			'Sauerteigbrot',
			'Basmatireis',
			'Kaffeebohnen',
			'Möhren',
			'Kürbissuppe',
			'Gulasch',
			'Parmesan',
			'Räucherlachs',
			'Chili con Carne',
			'Blaubeeren',
			'Walnüsse',
			'Zwiebelkuchen',
			'Rinderbraten',
			'Kartoffelsalat',
			'Tomatensoße',
			'Apfelkuchen',
			'Pesto'
		],
		namePlaceholder: (example: string) => `z. B. ${example}`,
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
		groupAdmin: 'Verwaltung',
		general: 'Allgemein',
		generalHint: 'Sprache, Scannen, Schwelle',
		language: 'Sprache',
		display: 'Anzeige',
		scanning: 'Scannen',
		vibration: 'Vibration beim Erkennen eines Codes',
		vibrationHint:
			'Wirkt nur, wenn dein Handy haptisches Feedback erlaubt – das lässt sich von hier aus nicht umgehen.',
		soon: '„Läuft bald ab“',
		soonHint: 'Ab wie vielen Tagen vor dem Datum ein Inhalt im Vorrat hervorgehoben wird.',
		days: (n: number) => (n === 1 ? '1 Tag' : `${n} Tage`),
		appearance: 'Design',
		appearanceHint: 'Farbschema, Symbole, Möbel',
		account: 'Konto',
		accountHint: 'Name, Passwort, Geräte',
		accountName: 'Benutzernamen ändern',
		accountNameNew: 'Neuer Benutzername',
		accountNameSave: 'Benutzername ändern',
		accountNameSaved: 'Benutzername geändert ✓',
		accountNameSame: 'Das ist bereits dein Benutzername.',
		accountPassword: 'Passwort ändern',
		accountPasswordCurrent: 'Aktuelles Passwort',
		accountPasswordConfirm: 'Aktuelles Passwort zur Bestätigung',
		accountPasswordNew: (n: number) => `Neues Passwort (min. ${n} Zeichen)`,
		accountPasswordRepeat: 'Neues Passwort wiederholen',
		accountPasswordSave: 'Passwort ändern',
		accountPasswordSaved: 'Passwort geändert ✓ Alle anderen Geräte wurden abgemeldet.',
		accountPasswordHint: 'Nach der Änderung werden alle anderen Geräte abgemeldet.',
		accountWrongPassword: 'Das aktuelle Passwort ist falsch.',
		accountDevices: 'Andere Geräte',
		accountDevicesNone: 'Du bist nur auf diesem Gerät angemeldet.',
		accountDevicesCount: (n: number) =>
			n === 1
				? 'Du bist auf einem weiteren Gerät angemeldet.'
				: `Du bist auf ${n} weiteren Geräten angemeldet.`,
		accountDevicesLogout: 'Alle anderen Geräte abmelden',
		accountDevicesDone: 'Alle anderen Geräte wurden abgemeldet ✓',
		data: 'Daten',
		dataHint: 'Export, Import',
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
		saved: 'Gespeichert ✓',
		maintenance: 'Wartung',
		maintenanceHint: 'Aufgaben, Speicher, Backups',
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
		server: 'Server',
		serverHint: 'Übersicht, Proxy',
		overview: 'Übersicht',
		allFine: 'Alles in Ordnung',
		needsAttention: (n: number) =>
			n === 1 ? '1 Punkt braucht Aufmerksamkeit' : `${n} Punkte brauchen Aufmerksamkeit`,
		fix: 'Beheben',
		checks: {
			https: {
				ok: (_n: number) => 'Über HTTPS geöffnet',
				hint: (_n: number) => 'Ohne HTTPS geöffnet',
				action: (_n: number) => ''
			},
			proxy: {
				ok: (_n: number) => 'Geräte werden einzeln erkannt',
				hint: (_n: number) => 'Alle Besucher teilen sich eine Adresse',
				action: (_n: number) => 'Reverse Proxy nicht bestätigt'
			},
			tasks: {
				ok: (_n: number) => 'Hintergrundaufgaben laufen ohne Fehler',
				hint: (_n: number) => '',
				action: (n: number) =>
					n === 1
						? '1 Hintergrundaufgabe fehlgeschlagen'
						: `${n} Hintergrundaufgaben fehlgeschlagen`
			},
			logins: {
				ok: (_n: number) => 'Keine Adresse wegen falscher Passwörter gesperrt',
				hint: (n: number) =>
					n === 1
						? '1 Adresse ist wegen falscher Passwörter gesperrt'
						: `${n} Adressen sind wegen falscher Passwörter gesperrt`,
				action: (_n: number) => ''
			}
		},
		infoVersion: 'Version',
		infoRunning: 'Läuft seit',
		infoItems: 'Inhalte im Vorrat',
		infoStorage: 'Belegter Speicher',
		connection: 'Verbindung',
		direct: 'Direkt verbunden',
		directHint: 'Mit Reverse Proxy? Öffne diese Seite über ihn, um ihn zu bestätigen.',
		proxyConfirmed: 'Reverse Proxy bestätigt',
		ownBlock: 'Falsche Passwörter sperren nur das Gerät, von dem sie kamen.',
		sharedWhy:
			'Docker gibt allen Besuchern dieselbe Adresse: Fünf falsche Passwörter sperren die Anmeldung für alle. Über einen bestätigten Reverse Proxy wird jedes Gerät einzeln erkannt.',
		proxyPending: 'Reverse Proxy nicht bestätigt',
		pendingWhy:
			'hdpantry verwendet die gemeldete Adresse erst, wenn der Proxy bestätigt ist – behaupten könnte sie jeder. Bis dahin zählen alle Besucher als ein Gerät.',
		recognisedAs: 'Erkannt als',
		proxyReports: 'Proxy meldet',
		notUsedYet: '(noch nicht verwendet)',
		confirmedBy: 'Bestätigt über',
		byAddress: 'Adresse',
		byKey: 'Schlüssel',
		confirmProxy: 'Reverse Proxy bestätigen',
		keyStep1: 'Schlüssel erzeugen',
		keyStep2: 'Diese Zeile bei deinem Proxy eintragen',
		keyStep3: 'Diese Seite neu laden',
		manageKey: 'Schlüssel verwalten',
		snippetWhere: {
			npm: 'Edit Proxy Host → Custom Locations → Add Location „/“ → Zahnrad daneben',
			caddy: 'Caddyfile, im reverse_proxy-Block',
			traefik: 'Labels des hdpantry-Containers',
			nginx: 'Im location-Block mit proxy_pass'
		},
		createKey: 'Schlüssel erzeugen',
		newKey: 'Neuer Schlüssel',
		removeKey: 'Entfernen',
		copy: 'Kopieren',
		copied: 'Kopiert',
		showKey: 'Schlüssel anzeigen',
		hideKey: 'Schlüssel verbergen',
		trustedProxies: 'Erweitert: mehrere Proxys oder Adressbereiche',
		trustedProxiesHint:
			'Nur nötig, wenn sich die Adresse deines Proxys ändert (Docker: den Bereich seines Netzes eintragen) oder bei mehreren Proxys hintereinander. Mit Komma trennen.',
		proxiesInvalid: (entries: string) => `Keine Adresse und kein Bereich: ${entries}`,
		proxiesTooMany: 'Höchstens 20 Einträge.',
		proxiesSaved: 'Gespeichert ✓',
		learnMore: 'Mehr dazu',
		theme: 'Farbschema',
		themeHint: '„System“ folgt der Einstellung deines Geräts.',
		themes: { system: 'System', dark: 'Dunkel', light: 'Hell' },
		containersShort: 'Löschen, Code, Zusammenführen',
		guideShort: 'Haltbarkeit, Quellen',
		aboutHint: 'Version, Links, Lizenz',
		icons: 'Symbole',
		iconsHint: 'Wie Lebensmittel in Listen und Formularen dargestellt werden.',
		iconStyles: { color: 'Farbig', line: 'Schlicht' },
		scene: 'Vorrat im Schrank',
		sceneSwitch: 'Lagerort als Möbel zeichnen',
		sceneHint:
			'Wählst du im Vorrat einen Lagerort, steht die Liste in einem gezeichneten Kühlschrank, Gefrierschrank oder Vorratsschrank. Nur am Handy und Tablet; bei „Alle“ bleibt die Liste, wie sie ist.',
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
			'Eigene vorsichtige Schätzung für vakuumierte Lebensmittel (keine öffentliche Stelle veröffentlicht dazu Zahlen)'
	},

	maintenance: {
		intro: (timeZone: string) =>
			`Diese Aufgaben laufen automatisch im Hintergrund. Uhrzeiten gelten in der Zeitzone des Servers (${timeZone}).`,
		tasks: {
			notifications: {
				name: 'Benachrichtigungen senden',
				description:
					'Schickt die Erinnerungen an das, was bald abläuft – jeweils ab der Uhrzeit, die unter „Benachrichtigungen“ gewählt ist. Läuft immer; sind die Erinnerungen dort aus, passiert nichts.'
			},
			optimize: {
				name: 'Datenbank-Pflege',
				description: 'Räumt die Datenbank auf und macht die Datei kompakter.'
			},
			sessions: {
				name: 'Abgelaufene Anmeldungen löschen',
				description: 'Entfernt Anmeldungen, die ohnehin nicht mehr gültig sind.'
			},
			backup: {
				name: 'Backup',
				description: 'Speichert eine Kopie der Datenbank im Ordner /data/backups.'
			}
		},
		frequency: 'Wie oft',
		frequencies: {
			hourly: 'Stündlich',
			daily: 'Täglich',
			weekly: 'Wöchentlich',
			monthly: 'Monatlich'
		},
		time: 'Uhrzeit',
		weekday: 'Wochentag',
		resetSchedule: 'Zurück zum Standard-Zeitplan',
		hourlyHint: 'Immer zur vollen Stunde.',
		monthlyHint: 'Immer am 1. des Monats.',
		lastRun: (date: string) => `Zuletzt: ${date}`,
		neverRun: 'Noch nie ausgeführt',
		nextRun: (date: string) => `Nächster Lauf: ${date}`,
		freed: (size: string) => `${size} freigegeben`,
		// What a task looks after takes this much space (not: what a run would free)
		stored: {
			optimize: (size: string) => `Größe der Datenbank: ${size}`,
			backup: (size: string) => `Backups gesamt: ${size}`
		},
		off: 'Ausgeschaltet',
		failed: 'Fehlgeschlagen:',
		running: 'Läuft gerade …',
		runNow: 'Jetzt ausführen',
		done: 'Erledigt ✓',
		stillRunning:
			'Läuft im Hintergrund weiter – das Ergebnis steht nach dem Neuladen der Seite hier.',
		keep: 'Wie viele Backups behalten',
		volumeHint:
			'Sicherst du stattdessen das ganze Docker-Volume? Dann kopiere es bei gestopptem Container – oder immer die drei Dateien hdpantry.db, hdpantry.db-wal und hdpantry.db-shm zusammen. Sonst kann die Kopie der Datenbank unvollständig sein.',
		backups: 'Vorhandene Backups',
		noBackups: 'Noch keine Backups vorhanden.',
		download: 'Herunterladen',
		deleteQuestion: 'Dieses Backup löschen?',
		deleteAll: 'Alle löschen',
		deleteAllConfirm: 'Wirklich alle löschen?',
		restoreHint: 'Wie man ein Backup zurückspielt, steht in der Dokumentation:',
		restoreLink: 'Backups and restore'
	},
	notifications: {
		title: 'Benachrichtigungen',
		navHint: 'Erinnerungen, Ziele',
		learnMore: 'Wie das funktioniert und wer was sieht',
		// What and when
		reminders: 'Erinnerungen',
		mode: 'Melden',
		modes: {
			off: 'Aus',
			single: 'Einzeln – eine Nachricht je Inhalt',
			digest: 'Gesammelt – eine Nachricht am Tag'
		},
		hour: 'Ab wann',
		oclock: (hour: number) => `${hour} Uhr`,
		occasions: 'Woran erinnern',
		kinds: {
			soon: 'Läuft bald ab',
			today: 'Läuft heute ab',
			expired: 'Ist abgelaufen'
		},
		kindHints: {
			soon: (days: number, daily: boolean) =>
				days === 1
					? 'Einen Tag vor dem Haltbarkeitsdatum – die Schwelle aus „Allgemein“.'
					: daily
						? `Jeden Tag, ab ${days} Tagen vor dem Haltbarkeitsdatum – die Schwelle aus „Allgemein“.`
						: `${days} Tage vor dem Haltbarkeitsdatum – die Schwelle aus „Allgemein“.`,
			today: 'Am Tag des Haltbarkeitsdatums.',
			expired: 'Einmal am Tag danach.'
		},
		what: 'Was schon beim Erfassen kurz vor dem Ablauf steht, meldet sich erst am nächsten Morgen.',
		repeat: 'Wie oft',
		repeats: { once: 'Einmal', daily: 'Täglich' },
		// Where to: the list of targets
		targets: 'Ziele',
		noTargets: 'Noch kein Ziel. Füge dieses Gerät hinzu, Pushover, ntfy oder einen Webhook.',
		addTarget: 'Ziel hinzufügen',
		targetKinds: {
			device: 'Dieses Gerät',
			pushover: 'Pushover',
			ntfy: 'ntfy',
			webhook: 'Webhook'
		} as Record<string, string>,
		targetHints: {
			device: 'Push-Nachrichten direkt aus der App, ohne weiteren Dienst',
			pushover: 'Über dein Pushover-Konto, an alle oder einzelne Geräte',
			ntfy: 'An ein Thema bei ntfy.sh oder auf deinem eigenen ntfy-Server',
			webhook: 'An eine Adresse deiner Wahl, z. B. Gotify, Apprise oder Home Assistant'
		} as Record<string, string>,
		here: 'dieses Gerät',
		switchLabel: (name: string) => `${name} benachrichtigen`,
		lastReached: (date: string) => `zuletzt erreicht ${date}`,
		neverReached: 'noch keine Nachricht',
		lastError: (reason: string) => `Fehler: ${reason}`,
		// This device
		blockedHint:
			'Du hast Benachrichtigungen für diese Seite abgelehnt. Erlaube sie in den Einstellungen des Browsers und lade die Seite neu.',
		needsHttpsHint:
			'Push-Nachrichten gibt es nur über eine https://-Adresse. Öffne hdpantry über deinen Reverse Proxy.',
		unsupportedHint:
			'Dieser Browser kann keine Push-Nachrichten. Auf iPhone und iPad geht es nur in der installierten App (Teilen → Zum Home-Bildschirm).',
		notReady: 'App-Dateien noch nicht bereit – lade die Seite neu.',
		failed: 'Hinzufügen fehlgeschlagen. Versuche es erneut.',
		refused: 'Dieses Gerät wurde nicht angenommen (unbekannter Push-Dienst oder zu viele Geräte).',
		// Fields of a target
		name: 'Name',
		token: 'App-Token',
		tokenHint: 'Von deiner eigenen Anwendung bei pushover.net („Create an Application“).',
		user: 'Benutzerschlüssel',
		userHint: 'Steht oben rechts auf pushover.net („Your User Key“).',
		kept: 'gespeichert',
		keptHint: 'Gespeichert. Leer lassen, um ihn zu behalten.',
		paused: 'Erinnerungen sind aus – die Ziele bekommen gerade nichts (ein Test geht trotzdem).',
		openLink: 'In hdpantry öffnen',
		devices: 'Nur an diese Geräte',
		devicesHint:
			'Leer = alle Geräte. Mehrere mit Komma. Ein falsch geschriebener Name heißt bei Pushover: an alle.',
		known: 'Deine Geräte bei Pushover:',
		url: 'Adresse',
		urlHint: 'Dorthin wird jede Nachricht geschickt (POST).',
		body: 'Inhalt',
		bodyHint: (placeholders: string) => `Platzhalter: ${placeholders}`,
		header: 'Kopfzeile (optional)',
		headerHint: 'Für einen Schlüssel, z. B. „Authorization: Bearer …“.',
		clearHeader: 'Gespeicherte Kopfzeile entfernen',
		templates: 'Vorlagen für Gotify, Apprise und andere',
		server: 'Server',
		topic: 'Thema',
		topicHint: 'Dasselbe Thema abonnierst du in der ntfy-App. Wer den Namen kennt, kann mitlesen.',
		ntfyGuide: 'Anleitung',
		ntfyToken: 'Zugangsschlüssel (optional)',
		ntfyTokenHint: 'Nur für geschützte Themen („tk_…“).',
		clearToken: 'Gespeicherten Schlüssel entfernen',
		icon: 'Icon-Adresse (optional)',
		iconHint: 'Leer = das Icon dieses hdpantry. Das Handy lädt es selbst von dieser Adresse.',
		save: 'Speichern',
		saved: 'Gespeichert ✓',
		test: 'Test',
		remove: 'Entfernen',
		removed: 'Entfernt ✓',
		testSent: 'Gesendet ✓',
		testFailed: (reason: string) => `Nicht zugestellt: ${reason}`,
		gone: 'Dieses Gerät ist beim Push-Dienst nicht mehr angemeldet und wurde entfernt.',
		unreachable: 'Der Dienst ist gerade nicht erreichbar.',
		rejected: (reason: string) => `Pushover lehnt die Angaben ab: ${reason}`,
		invalid: 'Das hat nicht geklappt.',
		channelErrors: {
			unknown: 'Dieses Ziel gibt es nicht (mehr).',
			tooMany: 'Mehr als 10 Ziele dieser Art gehen nicht.',
			name: 'Bitte einen Namen angeben (höchstens 40 Zeichen).',
			keys: 'App-Token und Benutzerschlüssel haben je 30 Zeichen (Buchstaben und Ziffern).',
			unreachable: 'Pushover ist gerade nicht erreichbar – nichts gespeichert.',
			url: 'Die Adresse muss mit http:// oder https:// beginnen.',
			body: 'Der Inhalt darf nicht leer sein (höchstens 4000 Zeichen).',
			header: 'Die Kopfzeile braucht die Form „Name: Wert“.',
			topic: 'Das Thema darf nur Buchstaben, Ziffern, - und _ enthalten (höchstens 64 Zeichen).',
			ntfyToken: 'Der Zugangsschlüssel enthält unerlaubte Zeichen.',
			icon: 'Die Icon-Adresse muss mit http:// oder https:// beginnen.'
		} as Record<string, string>,
		// Texts of the messages themselves
		testMark: 'Test',
		testTitle: 'hdpantry',
		testBody: 'Das ist eine Testnachricht. Es funktioniert ✓',
		expires: (when: string) => `läuft ${when} ab`,
		digestTitle: (soon: number, today: number, expired: number) =>
			'Vorrat: ' +
			[
				soon ? (soon === 1 ? '1 läuft bald ab' : `${soon} laufen bald ab`) : '',
				today ? (today === 1 ? '1 läuft heute ab' : `${today} laufen heute ab`) : '',
				expired ? `${expired} abgelaufen` : ''
			]
				.filter(Boolean)
				.join(', '),
		more: (count: number) => `… und ${count} weitere`
	},

	about: {
		title: 'Über',
		version: (v: string) => `Version ${v}`,
		versionHint: 'Was ist neu in dieser Version?',
		text: 'Ein Vorrats-Tracker zum Selberhosten – wissen, was da ist und was zuerst gegessen werden sollte.',
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
