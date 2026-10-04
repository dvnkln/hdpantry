// German texts of the user interface. en.ts must have exactly the same structure.

export const de = {
	locale: 'de-DE',

	common: {
		home: 'Startseite',
		logout: 'Abmelden',
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
		title: 'Scanner-Test',
		intro:
			'Zeigt, was genau in einem Code steht. Gespeichert wird hier nichts; eine Web-Adresse im Code wird nie geöffnet.',
		startCamera: 'Kamera starten',
		cameraStarting: 'Kamera startet …',
		photo: 'Foto aufnehmen oder auswählen',
		photoReading: 'Foto wird gelesen …',
		photoNoCode: 'Auf dem Foto wurde kein Code gefunden.',
		photoFailed: 'Das Foto konnte nicht gelesen werden.',
		manual: 'Code eintippen',
		add: 'Hinzufügen',
		results: (n: number) => `Gelesene Codes (${n})`,
		empty: 'Noch kein Code gelesen.',
		copy: 'Kopieren',
		copyAll: 'Alle kopieren',
		clear: 'Leeren',
		length: (n: number) => `${n} Zeichen`,
		isUrl: 'Web-Adresse',
		problems: {
			noHttps:
				'Die Kamera geht nur über eine sichere Verbindung (https). Foto und Eintippen funktionieren trotzdem.',
			denied:
				'Der Zugriff auf die Kamera wurde nicht erlaubt. Du kannst ihn in den Einstellungen des Browsers für diese Seite freigeben.',
			noCamera: 'Es wurde keine Kamera gefunden.',
			failed: 'Die Kamera konnte nicht gestartet werden.'
		},
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

	errorPage: {
		notFound: 'Seite nicht gefunden',
		notFoundHint: 'Diese Adresse gibt es nicht (mehr).',
		failed: 'Das hat nicht geklappt',
		failedHint: 'Bitte versuche es noch einmal.',
		home: 'Zur Startseite'
	}
};

export type Messages = typeof de;
