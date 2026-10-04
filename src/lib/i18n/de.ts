// German texts of the user interface. en.ts must have exactly the same structure.

export const de = {
	locale: 'de-DE',

	common: {
		home: 'Startseite'
	},

	home: {
		running: 'hdpantry läuft.',
		next: 'Als Nächstes kommen Einrichtung und Anmeldung.'
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
