// English texts of the user interface. Same structure as de.ts (checked by TypeScript).
import type { Messages } from './de';

export const en: Messages = {
	locale: 'en-US',

	common: {
		home: 'Home',
		logout: 'Log out',
		cancel: 'Cancel',
		next: 'Next',
		yes: 'Yes',
		no: 'No',
		save: 'Save',
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
		title: 'In stock'
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
		manualHint: 'The short code is usually printed below the QR code on the container.',
		other: 'Record without camera',
		open: 'Open',
		failed: 'That did not work. Please try again.',
		unreadable: 'hdpantry cannot use this code (empty or too long).',
		checkLink: 'Check a code (show raw content)',
		twinTitle: 'Already recorded by hand',
		twinText: (label: string, content: string | null, history: number) =>
			`This code already exists as container ${label}, recorded by hand (${[content ? `content: ${content}` : 'empty', history ? (history === 1 ? '1 earlier content' : `${history} earlier contents`) : ''].filter(Boolean).join(', ')}).`,
		twinHint:
			'Is it the same container? Then merge the two: content and history are kept. Merging is also possible later in the settings.',
		twinMerge: 'Merge',
		twinSeparate: 'Keep separate',
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
		typed: 'recorded by hand',
		scanned: 'scanned',
		emptyTitle: 'Empty container',
		container: 'Container',
		fill: 'Record content',
		notFound: 'This container does not exist (any more).'
	},

	locations: {
		pantry: 'Pantry',
		fridge: 'Fridge',
		zero: 'Zero-degree zone',
		freezer: 'Freezer'
	},

	fillLevels: { low: 'Low', medium: 'Medium', full: 'Full' },

	// Units of an amount: with the number ("2 servings") and as a choice in the form
	units: {
		g: () => 'g',
		kg: () => 'kg',
		ml: () => 'ml',
		l: () => 'l',
		pcs: (n: number) => (n === 1 ? 'piece' : 'pieces'),
		servings: (n: number) => (n === 1 ? 'serving' : 'servings')
	},
	unitNames: { g: 'g', kg: 'kg', ml: 'ml', l: 'l', pcs: 'pieces', servings: 'servings' },

	// Kinds of food: name, and examples shown when choosing one
	categories: {
		fish_raw: 'Fish, raw',
		fish_smoked: 'Fish, smoked or cooked',
		seafood: 'Seafood',
		beef_raw: 'Beef, veal, lamb, game – raw',
		pork_raw: 'Pork, raw',
		poultry_raw: 'Poultry, raw',
		minced: 'Minced meat',
		meat_cooked: 'Meat, cooked',
		cold_cuts: 'Cold cuts and cooked sausage',
		cured: 'Cured sausage and ham',
		cheese_hard: 'Hard and semi-hard cheese',
		cheese_soft: 'Soft and fresh cheese',
		dairy: 'Dairy',
		eggs: 'Eggs',
		plant_based: 'Tofu and plant-based alternatives',
		veg_raw: 'Vegetables, raw',
		veg_cooked: 'Vegetables, cooked',
		salad_herbs: 'Salad and herbs',
		fruit: 'Fruit',
		berries: 'Berries',
		bread: 'Bread and rolls',
		cake: 'Cake and pastry',
		leftovers: 'Leftovers and cooked dishes',
		dry_goods: 'Dry goods',
		other: 'Other'
	},
	categoryExamples: {
		fish_raw: 'salmon, trout, cod, tuna',
		fish_smoked: 'smoked salmon, fried fish fillet',
		seafood: 'prawns, mussels, squid',
		beef_raw: 'beef fillet, steak, leg of lamb, venison',
		pork_raw: 'schnitzel, chops, pork fillet',
		poultry_raw: 'chicken breast, turkey, duck',
		minced: 'minced meat, burger patties',
		meat_cooked: 'roast, meatballs, fried chicken',
		cold_cuts: 'cooked ham, liver sausage, frankfurters',
		cured: 'salami, cured ham, bacon',
		cheese_hard: 'parmesan, gouda, provolone, cheddar',
		cheese_soft: 'mozzarella, feta, camembert, cream cheese',
		dairy: 'milk, yoghurt, cream – opened',
		eggs: 'eggs in the shell',
		plant_based: 'tofu, tempeh, seitan, vegan sausage, hummus, oat milk',
		veg_raw: 'carrots, broccoli, peppers, mushrooms, potatoes',
		veg_cooked: 'boiled, fried or blanched vegetables',
		salad_herbs: 'lettuce, spinach, parsley, basil',
		fruit: 'apples, bananas, lemons, mango',
		berries: 'strawberries, raspberries, cherries, grapes',
		bread: 'bread, rolls, baguette, toast',
		cake: 'cake, cookies, croissants, muffins',
		leftovers: 'soup, stew, sauce, cooked pasta, pizza',
		dry_goods: 'rice, pasta, flour, lentils, nuts, coffee',
		other: 'anything without a guide value – no date is suggested'
	},
	ratings: { good: 'recommended', ok: 'possible', bad: 'not recommended', never: 'not suitable' },

	item: {
		addTitle: 'New content',
		editTitle: 'Edit content',
		edit: 'Edit',
		eaten: 'Eaten',
		eatenQuestion: (name: string) => `“${name}” is eaten? The container will be empty.`,
		eatenConfirm: 'Yes, eaten',
		history: 'Last in this container',
		name: 'Name',
		namePlaceholder: 'e.g. provolone',
		note: 'Note',
		notePlaceholder: 'Add a note (optional)',
		vacuumed: 'Vacuum-sealed',
		location: 'Stored in',
		bestBeforeOptional: 'Best before (optional)',
		bestBeforeSuggested: 'Best before',
		category: 'Kind of food',
		chooseCategory: 'Choose the kind of food',
		days: (n: number) => (n === 1 ? '≈ 1 day' : `≈ ${n} days`),
		useSuggestion: 'Use the suggestion',
		guideHint: 'A guide value, not a guarantee – always check before eating.',
		guideHintVacuum:
			'A guide value, not a guarantee – always check before eating. The extra time for vacuum-sealing is a cautious estimate.',
		noGuide: 'There is no guide value for this kind of food – enter a date if you know one.',
		locationLegend:
			'Green: recommended · Red: not recommended · Grey: not suitable for this kind of food',
		fill: 'Fill level',
		amount: 'Amount',
		addAmount: 'Add an amount',
		unit: 'Unit',
		add: 'Add',
		alreadyFull: 'There is already something in this container.',
		bestBefore: 'Best before',
		noDate: 'No date',
		since: 'Since',
		problems: {
			name: 'Please enter a name.',
			location: 'Please choose where it is stored.',
			date: 'The date is not valid.',
			fill: 'Please choose a fill level.',
			amount: 'Amount: please enter a number above 0 (99999 at most) and a unit.'
		}
	},

	settings: {
		title: 'Settings',
		containers: 'Containers',
		containersHint:
			'All containers hdpantry knows – empty ones too. Deleting removes a container with its history; it is added again the next time its code is scanned.',
		noContainers: 'No containers yet.',
		empty: 'empty',
		typed: 'recorded by hand',
		history: (n: number) => (n === 1 ? '1 earlier content' : `${n} earlier contents`),
		delete: 'Delete',
		deleteQuestion: (label: string, content: string | null, history: number) => {
			const lost = [
				content ? `“${content}”` : '',
				history ? (history === 1 ? '1 earlier content' : `${history} earlier contents`) : ''
			].filter(Boolean);
			return `Really delete container ${label}?${lost.length ? ` Also deleted: ${lost.join(' and ')}.` : ''} This cannot be undone.`;
		},
		deleteConfirm: 'Yes, delete',
		showCode: 'Show the content of the code',
		codeContent: 'Content of the scanned code',
		changeCode: 'Change code',
		newCode: 'New code',
		codeProblems: {
			invalid: 'Please enter a code.',
			taken: 'Another container recorded by hand already has this code.',
			notManual: 'Only containers recorded by hand can get another code.'
		},
		open: 'Open container',
		merge: 'Merge',
		mergeQuestion: (label: string) =>
			`There is a scanned container with the same code (${label}). Merge them? Content and history move to the scanned container, the one recorded by hand disappears.`,
		mergeConfirm: 'Yes, merge',
		mergeProblems: {
			bothFull:
				'Both containers are full. A container holds one thing at a time – mark one as eaten first.',
			noTwin: 'There is no scanned container with the same code.'
		},
		deleteAll: 'Delete all containers',
		deleteAllHint:
			'Removes every container, the whole stock and all history. hdpantry is then as empty as on the first day; your account stays.',
		deleteAllQuestion: (n: number) =>
			`Really delete ${n === 1 ? 'the one container' : `all ${n} containers`} with stock and history? This cannot be undone.`,
		deleteWord: 'DELETE',
		typeToConfirm: (word: string) => `Type ${word} to confirm`,
		deleteAllConfirm: 'Delete everything for good',
		wrongWord: 'To delete, please type the confirmation word.'
	},

	errorPage: {
		notFound: 'Page not found',
		notFoundHint: 'This address does not exist (any more).',
		failed: 'That did not work',
		failedHint: 'Please try again.',
		home: 'Back to home'
	}
};
