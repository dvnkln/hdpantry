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
		scan: 'Scannen',
		scanSoon: 'Der Scanner kommt mit dem nächsten Schritt.'
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
