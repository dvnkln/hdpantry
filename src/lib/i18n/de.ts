// German texts of the user interface. en.ts must have exactly the same structure.

export const de = {
	locale: 'de-DE',

	common: {
		home: 'Startseite',
		logout: 'Abmelden',
		cancel: 'Abbrechen',
		save: 'Speichern',
		saved: 'Gespeichert',
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
		scan: 'Scannen'
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
		open: 'Öffnen',
		failed: 'Das hat nicht geklappt. Bitte noch einmal versuchen.',
		unreadable: 'Mit diesem Code kann hdpantry nichts anfangen (leer oder zu lang).',
		newTitle: 'Neuer Behälter',
		newHint: 'Diesen Code kennt hdpantry noch nicht.',
		addContainer: 'Behälter anlegen',
		checkLink: 'Code prüfen (Rohinhalt anzeigen)',
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
		title: 'Behälter',
		empty: 'Noch keine Behälter. Scanne einen Code, um den ersten anzulegen.',
		count: (n: number) => (n === 1 ? '1 Behälter' : `${n} Behälter`),
		nameOptional: 'Name (optional)',
		namePlaceholder: 'z. B. Beutel L 3',
		emptyContainer: 'Dieser Behälter ist leer.',
		code: 'Code',
		size: 'Größe',
		added: 'Angelegt am',
		rawContent: 'Inhalt des Codes',
		delete: 'Behälter löschen',
		deleteQuestion:
			'Diesen Behälter wirklich löschen? Beim nächsten Scan seines Codes kann er neu angelegt werden.',
		deleteConfirm: 'Löschen',
		notFound: 'Diesen Behälter gibt es nicht (mehr).'
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
