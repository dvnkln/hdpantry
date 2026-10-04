// English texts of the user interface. Same structure as de.ts (checked by TypeScript).
import type { Messages } from './de';

export const en: Messages = {
	locale: 'en-US',

	common: {
		home: 'Home',
		logout: 'Log out',
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
		scan: 'Scan',
		scanSoon: 'The scanner comes with the next step.'
	},

	errorPage: {
		notFound: 'Page not found',
		notFoundHint: 'This address does not exist (any more).',
		failed: 'That did not work',
		failedHint: 'Please try again.',
		home: 'Back to home'
	}
};
