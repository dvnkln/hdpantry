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
		title: 'Vorrat'
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

	item: {
		addTitle: 'Neuer Inhalt',
		editTitle: 'Inhalt bearbeiten',
		edit: 'Bearbeiten',
		eaten: 'Gegessen',
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

	errorPage: {
		notFound: 'Seite nicht gefunden',
		notFoundHint: 'Diese Adresse gibt es nicht (mehr).',
		failed: 'Das hat nicht geklappt',
		failedHint: 'Bitte versuche es noch einmal.',
		home: 'Zur Startseite'
	}
};

export type Messages = typeof de;
