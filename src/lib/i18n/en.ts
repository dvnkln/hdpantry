// English texts of the user interface. Same structure as de.ts (checked by TypeScript).
import type { Messages } from './de';

export const en: Messages = {
	locale: 'en-US',

	common: {
		home: 'Home',
		logout: 'Log out',
		cancel: 'Cancel',
		save: 'Save',
		saved: 'Saved',
		showPassword: 'Show password',
		hidePassword: 'Hide password'
	},

	languages: { de: 'Deutsch', en: 'English' },

	auth: {
		loginTitle: 'Log in',
		setupTitle: 'Set-up',
		welcome: 'Welcome! Create your account – it is the only one of this installation.',
		language: 'Language',
		username: 'Username',
		password: 'Password',
		passwordMin: (n: number) => `Password (min. ${n} characters)`,
		passwordRepeat: 'Repeat password',
		login: 'Log in',
		createAccount: 'Create account',
		wrongCredentials: 'Wrong username or password',
		tooManyAttempts: (seconds: number) =>
			`Too many failed attempts. Please wait ${seconds >= 120 ? `${Math.ceil(seconds / 60)} min` : `${seconds} s`}.`,
		usernameRule: 'Username: 3–32 characters, only letters, digits, _ . -',
		passwordTooShort: (n: number) => `Password must be at least ${n} characters long`,
		passwordsDiffer: 'Passwords do not match'
	},

	home: {
		empty: 'Nothing in stock yet',
		emptyHint: 'Scan a container or bag to record its first content.',
		scan: 'Scan'
	},

	scan: {
		title: 'Scan',
		intro: 'Hold the code of the container or bag in front of the camera.',
		startCamera: 'Start camera',
		cameraStarting: 'Starting camera …',
		photo: 'Take or choose a photo',
		photoReading: 'Reading photo …',
		photoNoCode: 'No code was found in the photo.',
		photoFailed: 'The photo could not be read.',
		manual: 'Type a code',
		open: 'Open',
		failed: 'That did not work. Please try again.',
		unreadable: 'hdpantry cannot use this code (empty or too long).',
		newTitle: 'New container',
		newHint: 'hdpantry does not know this code yet.',
		addContainer: 'Add container',
		checkLink: 'Check a code (show raw content)',
		problems: {
			noHttps:
				'The camera only works over a secure connection (https). Photo and typing still work.',
			denied:
				'Access to the camera was not allowed. You can allow it for this page in the settings of your browser.',
			noCamera: 'No camera was found.',
			failed: 'The camera could not be started.'
		}
	},

	scanCheck: {
		title: 'Check a code',
		intro:
			'Shows exactly what a code contains – helpful when a code is not recognised as expected. Nothing is saved here; a web address in a code is never opened.',
		add: 'Add',
		results: (n: number) => `Codes read (${n})`,
		empty: 'No code read yet.',
		copy: 'Copy',
		copyAll: 'Copy all',
		clear: 'Clear',
		length: (n: number) => `${n} characters`,
		isUrl: 'Web address',
		sources: { camera: 'Camera', photo: 'Photo', manual: 'Typed' },
		formats: {
			qr_code: 'QR code',
			data_matrix: 'Data Matrix',
			ean_13: 'Barcode (EAN-13)',
			ean_8: 'Barcode (EAN-8)',
			code_128: 'Barcode (Code 128)',
			manual: 'Text'
		}
	},

	containers: {
		title: 'Containers',
		empty: 'No containers yet. Scan a code to add the first one.',
		count: (n: number) => (n === 1 ? '1 container' : `${n} containers`),
		nameOptional: 'Name (optional)',
		namePlaceholder: 'e.g. Bag L 3',
		emptyContainer: 'This container is empty.',
		code: 'Code',
		size: 'Size',
		added: 'Added on',
		rawContent: 'Content of the code',
		delete: 'Delete container',
		deleteQuestion:
			'Really delete this container? It can be added again the next time its code is scanned.',
		deleteConfirm: 'Delete',
		notFound: 'This container does not exist (any more).'
	},

	errorPage: {
		notFound: 'Page not found',
		notFoundHint: 'This address does not exist (any more).',
		failed: 'That did not work',
		failedHint: 'Please try again.',
		home: 'Back to home'
	}
};
