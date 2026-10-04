// Symbols for food. Every symbol exists in two styles (chosen in the settings):
//  - colour: Twemoji graphics, static/food/color/<key>.svg
//  - line:   Lucide or Tabler line icons, static/food/line/<name>.svg
// The files are made by scripts/food-icons.mjs from this list; run it after changing the list.
import type { Category } from './categories';

// key (the Twemoji name) : line icon as "set:name"; without one, the symbol of the kind of food
// or the fallback is used in the line style
const LIST = {
	// fish and seafood
	fish: 'lucide:fish',
	sushi: 'lucide:fish',
	shrimp: 'lucide:shrimp',
	'fried-shrimp': 'lucide:shrimp',
	lobster: 'lucide:shell',
	squid: 'lucide:shell',
	oyster: 'lucide:shell',
	// meat and sausage
	'cut-of-meat': 'lucide:beef',
	'meat-on-bone': 'tabler:meat',
	'poultry-leg': 'lucide:drumstick',
	bacon: 'lucide:ham',
	'hot-dog': 'tabler:sausage',
	hamburger: 'lucide:hamburger',
	// cheese, dairy, eggs, plant-based
	'cheese-wedge': 'tabler:cheese',
	'glass-of-milk': 'lucide:milk',
	butter: 'lucide:milk',
	egg: 'lucide:egg',
	cooking: 'lucide:egg-fried',
	beans: 'lucide:bean',
	falafel: 'lucide:bean',
	// vegetables
	carrot: 'lucide:carrot',
	broccoli: 'lucide:broccoli',
	'leafy-green': 'lucide:leafy-green',
	'green-salad': 'lucide:salad',
	'brown-mushroom': 'tabler:mushroom',
	'bell-pepper': 'tabler:pepper',
	'hot-pepper': 'tabler:pepper',
	tomato: 'lucide:cherry',
	cucumber: 'lucide:carrot',
	eggplant: 'lucide:carrot',
	potato: 'lucide:carrot',
	onion: 'lucide:carrot',
	garlic: 'lucide:carrot',
	'ginger-root': 'lucide:carrot',
	'ear-of-corn': 'lucide:wheat',
	'pea-pod': 'lucide:bean',
	olive: 'lucide:bean',
	avocado: 'tabler:avocado',
	// fruit
	'red-apple': 'lucide:apple',
	'green-apple': 'lucide:apple',
	pear: 'lucide:apple',
	peach: 'lucide:apple',
	mango: 'lucide:apple',
	banana: 'lucide:banana',
	cherries: 'lucide:cherry',
	strawberry: 'lucide:cherry',
	blueberries: 'lucide:grape',
	grapes: 'lucide:grape',
	lemon: 'tabler:lemon',
	lime: 'tabler:lemon',
	tangerine: 'lucide:citrus',
	pineapple: 'lucide:citrus',
	'kiwi-fruit': 'lucide:citrus',
	melon: 'tabler:melon',
	watermelon: 'tabler:melon',
	coconut: 'lucide:nut',
	// bread and baked goods
	bread: 'tabler:bread',
	'baguette-bread': 'tabler:baguette',
	croissant: 'lucide:croissant',
	pretzel: 'tabler:bread',
	bagel: 'lucide:donut',
	flatbread: 'tabler:bread',
	pancakes: 'lucide:cookie',
	waffle: 'lucide:cookie',
	shortcake: 'lucide:cake-slice',
	'birthday-cake': 'lucide:cake',
	cupcake: 'lucide:cake',
	pie: 'lucide:cake-slice',
	doughnut: 'lucide:donut',
	cookie: 'lucide:cookie',
	'chocolate-bar': 'lucide:candy',
	// dishes
	'pot-of-food': 'lucide:cooking-pot',
	'shallow-pan-of-food': 'lucide:cooking-pot',
	'steaming-bowl': 'lucide:soup',
	'bowl-with-spoon': 'lucide:soup',
	'curry-rice': 'lucide:soup',
	spaghetti: 'lucide:soup',
	pizza: 'lucide:pizza',
	sandwich: 'lucide:sandwich',
	burrito: 'lucide:sandwich',
	taco: 'lucide:sandwich',
	dumpling: 'lucide:soup',
	'french-fries': 'lucide:popcorn',
	'bento-box': 'lucide:package-open',
	// dry goods and the rest
	'cooked-rice': 'lucide:wheat',
	peanuts: 'lucide:nut',
	chestnut: 'lucide:nut',
	popcorn: 'lucide:popcorn',
	jar: 'lucide:amphora',
	'canned-food': 'lucide:amphora',
	'honey-pot': 'lucide:amphora',
	salt: 'lucide:amphora',
	'hot-beverage': 'lucide:coffee',
	'ice-cream': 'lucide:ice-cream-cone',
	custard: 'lucide:dessert',
	'fork-and-knife-with-plate': 'lucide:utensils'
} as const;

export type IconKey = keyof typeof LIST;
export const ICONS = Object.keys(LIST) as IconKey[];
export const FALLBACK_ICON: IconKey = 'fork-and-knife-with-plate';

export function isIcon(value: unknown): value is IconKey {
	return typeof value === 'string' && value in LIST;
}

// File name of the line icon for a symbol, e.g. "lucide-fish"
export function lineFile(icon: IconKey) {
	return LIST[icon].replace(':', '-');
}

// The symbol a kind of food gets when its name says nothing more specific
export const CATEGORY_ICONS: Record<Category, IconKey> = {
	fish_raw: 'fish',
	fish_smoked: 'fish',
	seafood: 'shrimp',
	beef_raw: 'cut-of-meat',
	pork_raw: 'cut-of-meat',
	poultry_raw: 'poultry-leg',
	minced: 'cut-of-meat',
	meat_cooked: 'meat-on-bone',
	cold_cuts: 'hot-dog',
	cured: 'bacon',
	cheese_hard: 'cheese-wedge',
	cheese_soft: 'cheese-wedge',
	dairy: 'glass-of-milk',
	eggs: 'egg',
	plant_based: 'beans',
	veg_raw: 'carrot',
	veg_cooked: 'shallow-pan-of-food',
	salad_herbs: 'leafy-green',
	fruit: 'red-apple',
	berries: 'strawberry',
	bread: 'bread',
	cake: 'shortcake',
	leftovers: 'pot-of-food',
	dry_goods: 'jar',
	other: FALLBACK_ICON
};
