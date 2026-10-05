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

	// What the browser shows when hdpantry is installed as an app
	app: {
		description: 'Pantry tracker for reusable vacuum containers and bags',
		scan: 'Scan'
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
		title: 'In stock',
		all: 'All',
		filter: 'Filter by place of storage',
		nothingHere: 'Nothing is stored here.',
		summary: (total: number, soon: number, expired: number) =>
			[
				total === 1 ? '1 item' : `${total} items`,
				soon ? (soon === 1 ? '1 expires soon' : `${soon} expire soon`) : '',
				expired ? `${expired} expired` : ''
			]
				.filter(Boolean)
				.join(' · '),
		// How far away a best-before date is, in words
		relative: (days: number) =>
			days === 0
				? 'today'
				: days === 1
					? 'tomorrow'
					: days > 60
						? `in ${Math.round(days / 30)} months`
						: days > 1
							? `in ${days} days`
							: days === -1
								? 'expired yesterday'
								: `expired ${-days} days ago`,
		expired: 'expired',
		sortBy: 'Sort by',
		sortKeys: { date: 'Best before', name: 'Name', location: 'Stored in' },
		reverse: 'Reverse the order',
		columns: { amount: 'Fill level', container: 'Container' }
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
	ratings: { good: 'recommended', ok: 'possible', bad: 'not recommended', never: 'not possible' },

	item: {
		addTitle: 'New content',
		editTitle: 'Edit content',
		edit: 'Edit',
		eaten: 'Eaten',
		replace: 'Replace',
		replaceTitle: 'Replace content',
		replaceHint: (name: string) =>
			`“${name}” is marked as eaten when you save. If you cancel, everything stays as it is.`,
		eatenQuestion: (name: string) => `“${name}” is eaten? The container will be empty.`,
		eatenConfirm: 'Yes, eaten',
		history: 'Last in this container',
		name: 'Name',
		// Shown in the empty name field, a different one each time: food and dishes only
		nameExamples: [
			'Provolone',
			'Lentil soup',
			'Salmon fillet',
			'Minced beef',
			'Strawberries',
			'Bolognese',
			'Chicken breast',
			'Sourdough bread',
			'Basmati rice',
			'Coffee beans',
			'Carrots',
			'Pumpkin soup',
			'Goulash',
			'Parmesan',
			'Smoked salmon',
			'Chili con carne',
			'Blueberries',
			'Walnuts',
			'Apple pie',
			'Roast beef',
			'Potato salad',
			'Tomato sauce',
			'Cheddar',
			'Pesto'
		],
		namePlaceholder: (example: string) => `e.g. ${example}`,
		note: 'Note',
		notePlaceholder: 'Add a note (optional)',
		vacuumed: 'Vacuum-sealed',
		location: 'Stored in',
		bestBeforeOptional: 'Best before (optional)',
		bestBeforeSuggested: 'Best before',
		category: 'Kind of food',
		chooseCategory: 'Choose the kind of food',
		chooseIcon: 'Choose a symbol',
		iconAutomatic: 'Choose the symbol automatically again',
		guideLink: 'See guide values and sources',
		days: (n: number) => (n === 1 ? '≈ 1 day' : `≈ ${n} days`),
		useSuggestion: 'Use the suggestion',
		guideHint: 'A guide value, not a guarantee – always check before eating.',
		guideHintVacuum:
			'A guide value, not a guarantee – always check before eating. The extra time for vacuum-sealing is a cautious estimate.',
		noGuide: 'There is no guide value for this kind of food – enter a date if you know one.',
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
		groupPersonal: 'Personal',
		groupStock: 'Stock',
		groupAdmin: 'Administration',
		general: 'General',
		generalHint: 'Language, scanning, “expires soon”',
		language: 'Language',
		scanning: 'Scanning',
		vibration: 'Vibrate when a code is recognised',
		vibrationHint:
			'Only works if your phone allows haptic feedback – that cannot be bypassed from here.',
		soon: '“Expires soon”',
		soonHint: 'How many days before its date an item is highlighted in the stock list.',
		days: (n: number) => (n === 1 ? '1 day' : `${n} days`),
		appearance: 'Appearance',
		appearanceHint: 'Colour scheme, symbols',
		account: 'Account',
		accountHint: 'Username, password, devices',
		accountName: 'Change username',
		accountNameNew: 'New username',
		accountNameSave: 'Change username',
		accountNameSaved: 'Username changed ✓',
		accountNameSame: 'That is already your username.',
		accountPassword: 'Change password',
		accountPasswordCurrent: 'Current password',
		accountPasswordConfirm: 'Current password to confirm',
		accountPasswordNew: (n: number) => `New password (min. ${n} characters)`,
		accountPasswordRepeat: 'Repeat new password',
		accountPasswordSave: 'Change password',
		accountPasswordSaved: 'Password changed ✓ All other devices were logged out.',
		accountPasswordHint: 'Changing it logs out all other devices.',
		accountWrongPassword: 'The current password is wrong.',
		accountDevices: 'Other devices',
		accountDevicesNone: 'You are only logged in on this device.',
		accountDevicesCount: (n: number) =>
			n === 1
				? 'You are logged in on one other device.'
				: `You are logged in on ${n} other devices.`,
		accountDevicesLogout: 'Log out all other devices',
		accountDevicesDone: 'All other devices were logged out ✓',
		data: 'Data',
		dataHint: 'Export and import',
		dataExport: 'Export',
		dataExportText:
			'Downloads your stock as a file: all containers, what is inside, the history and what the app has learned about your food. Account and settings are not included.',
		dataNow: (containers: number, filled: number) =>
			`Right now: ${containers} ${containers === 1 ? 'container' : 'containers'}, ${filled} filled.`,
		dataExportButton: 'Download export',
		dataImport: 'Import',
		dataImportText:
			'Loads an export file. Importing replaces the whole stock – it does not add to it. Account and settings stay as they are.',
		dataChoose: 'Choose file',
		dataWarning:
			'Everything in the app right now is deleted and replaced by the file. This cannot be undone – download an export first if you are unsure.',
		dataWord: 'REPLACE',
		dataReplace: 'Replace stock',
		dataWrongWord: 'To replace, please type the confirmation word.',
		dataImported: (containers: number, filled: number) =>
			`Import finished: ${containers} ${containers === 1 ? 'container' : 'containers'}, ${filled} filled.`,
		maintenance: 'Maintenance',
		maintenanceHint: 'Backups of the database',
		backup: 'Backup',
		backupText:
			'Makes a copy of the whole database on a schedule – stock, account and settings. The copies are kept in the data folder under “backups” and can be downloaded here.',
		backupSwitch: 'Automatically on a schedule',
		backupHow: 'How often',
		backupFrequencies: { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' },
		backupMonthlyHint: 'Monthly means: on the first of the month.',
		backupWeekday: 'Day of the week',
		backupTime: 'Time',
		backupKeep: 'How many backups to keep',
		backupKeepHint: 'Older backups are deleted.',
		backupNext: (when: string) => `Next backup: ${when}`,
		backupLast: (when: string) => `Last backup: ${when}`,
		backupNever: 'No backup has been made yet.',
		backupFailed: (error: string) => `Failed: ${error}`,
		backupNow: 'Run now',
		backupRunning: 'Running …',
		backupFiles: 'Existing backups',
		backupNone: 'No backups yet.',
		backupDownload: 'Download',
		backupDeleteQuestion: 'Delete this backup?',
		backupSizes: (database: string, backups: string) =>
			`Database: ${database} · Backups in total: ${backups}`,
		backupRestore: 'How to restore a backup is described in the documentation:',
		backupRestoreLink: 'Backups and restore',
		dataBusy: 'Importing …',
		dataNowColumn: 'Now',
		dataAfterColumn: 'Afterwards',
		dataRows: {
			containers: 'Containers',
			filled: 'of which filled',
			history: 'History entries',
			memory: 'Learned corrections'
		},
		dataFileFrom: (day: string) => `Export from ${day}`,
		dataProblems: {
			tooLarge: 'The file is too large.',
			notBackup: 'This is not an export file of hdpantry.',
			newer: 'The file comes from a newer version of hdpantry. Please update the app first.',
			invalid: (where: string) =>
				`The file is damaged or was changed (at: ${where}). Nothing was changed.`
		},
		server: 'Server',
		serverHint: 'Overview, reverse proxy',
		overview: 'Overview',
		allFine: 'Everything is fine',
		needsAttention: (n: number) =>
			n === 1 ? '1 item needs attention' : `${n} items need attention`,
		fix: 'Fix',
		checks: {
			https: {
				ok: (_n: number) => 'Opened over HTTPS',
				hint: (_n: number) => 'Opened without HTTPS',
				action: (_n: number) => ''
			},
			proxy: {
				ok: (_n: number) => 'Devices are recognised one by one',
				hint: (_n: number) => 'All visitors share one address',
				action: (_n: number) => 'Reverse proxy not confirmed'
			},
			tasks: {
				ok: (_n: number) => 'Background tasks run without errors',
				hint: (_n: number) => '',
				action: (n: number) =>
					n === 1 ? '1 background task failed' : `${n} background tasks failed`
			},
			logins: {
				ok: (_n: number) => 'No address blocked for wrong passwords',
				hint: (n: number) =>
					n === 1
						? '1 address is blocked for wrong passwords'
						: `${n} addresses are blocked for wrong passwords`,
				action: (_n: number) => ''
			}
		},
		infoVersion: 'Version',
		infoRunning: 'Running since',
		infoItems: 'Items in stock',
		infoStorage: 'Storage used',
		connection: 'Connection',
		direct: 'Connected directly',
		directHint: 'Using a reverse proxy? Open this page through it to confirm it.',
		proxyConfirmed: 'Reverse proxy confirmed',
		ownBlock: 'Wrong passwords only block the device they came from.',
		sharedWhy:
			'Docker gives all visitors the same address: five wrong passwords block the login for everybody. Through a confirmed reverse proxy, each device is recognised on its own.',
		proxyPending: 'Reverse proxy not confirmed',
		pendingWhy:
			'hdpantry only uses the reported address once the proxy is confirmed – anybody could claim one. Until then all visitors count as one device.',
		recognisedAs: 'Recognised as',
		proxyReports: 'Proxy reports',
		notUsedYet: '(not used yet)',
		confirmedBy: 'Confirmed by',
		byAddress: 'Address',
		byKey: 'Key',
		confirmProxy: 'Confirm reverse proxy',
		keyStep1: 'Create a key',
		keyStep2: 'Add this line to your proxy',
		keyStep3: 'Reload this page',
		manageKey: 'Manage key',
		snippetWhere: {
			npm: 'Edit Proxy Host → Custom Locations → Add Location “/” → gear next to it',
			caddy: 'Caddyfile, inside the reverse_proxy block',
			traefik: 'Labels of the hdpantry container',
			nginx: 'Inside the location block that has proxy_pass'
		},
		createKey: 'Create key',
		newKey: 'New key',
		removeKey: 'Remove',
		copy: 'Copy',
		copied: 'Copied',
		showKey: 'Show key',
		hideKey: 'Hide key',
		trustedProxies: 'Advanced: several proxies or address ranges',
		trustedProxiesHint:
			'Only needed if the address of your proxy changes (Docker: enter the range of its network) or with several proxies in a row. Separate with commas.',
		proxiesInvalid: (entries: string) => `Not an address or range: ${entries}`,
		proxiesTooMany: 'At most 20 entries.',
		proxiesSaved: 'Saved ✓',
		learnMore: 'Learn more',
		theme: 'Colour scheme',
		themeHint: '“System” follows the setting of your device.',
		themes: { system: 'System', dark: 'Dark', light: 'Light' },
		containersShort: 'Delete, change code, merge',
		guideShort: 'Table of shelf lives with sources',
		aboutHint: 'Version, links, licence',
		icons: 'Symbols',
		iconsHint: 'How food is shown in lists and forms.',
		iconStyles: { color: 'Colourful', line: 'Plain' },
		guide: 'Guide values',
		guideHint: 'How long hdpantry assumes which food keeps, by place of storage – with sources.',
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

	guide: {
		title: 'Shelf-life guide values',
		warning:
			'These are estimates, not guarantees. hdpantry suggests a date so you keep track – whether something is still good is always yours to check: look at it, smell it, and if in doubt throw it away. This holds above all for raw fish, raw meat and minced meat.',
		how: 'How the values were chosen',
		howText: [
			'Figures of German public bodies come first; where there are none, the data of the U.S. Department of Agriculture.',
			'Where a source gives a range, its lower end is used; of two figures the more cautious one.',
			'None of these bodies publishes figures for the zero-degree zone or for food vacuum-sealed at home. Those values are our own cautious estimates.',
			'Raw fish, seafood, poultry and minced meat get no extra time from vacuum-sealing while chilled – only in the freezer.'
		],
		table: 'Table',
		tableHint: 'Days open / vacuum-sealed. A dash means: do not store it there.',
		food: 'Food',
		noValue: 'no guide value',
		sources: 'Sources',
		ownEstimate: 'Own cautious estimate, derived from the value for the fridge',
		ownVacuum:
			'Own cautious estimate for vacuum-sealed food (no public body publishes such figures)'
	},

	about: {
		title: 'About',
		version: (v: string) => `Version ${v}`,
		versionHint: "What's new in this version?",
		text: 'A self-hosted pantry tracker for reusable vacuum containers and bags with a QR code.',
		private:
			'hdpantry runs on your own server and makes no connection to the outside by itself. The links below only open another site when you tap them.',
		links: 'Links',
		docs: 'Documentation (wiki)',
		source: 'Source code on GitHub',
		issues: 'Report a bug or suggest an idea',
		roadmap: 'What is planned',
		license: 'Licence: GNU AGPL v3',
		credits: 'Built with',
		twemoji: 'colourful symbols, © Twitter, Inc and other contributors, licensed under CC BY 4.0',
		lucide: 'line icons, ISC License',
		tabler: 'more line icons, MIT License',
		outfit: 'font of the wordmark, SIL Open Font License',
		bundled: 'All of it is part of the app; nothing is loaded from elsewhere.',
		ai: 'Built with the help of AI (Claude Code).'
	},

	errorPage: {
		notFound: 'Page not found',
		notFoundHint: 'This address does not exist (any more).',
		failed: 'That did not work',
		failedHint: 'Please try again.',
		home: 'Back to home'
	}
};
