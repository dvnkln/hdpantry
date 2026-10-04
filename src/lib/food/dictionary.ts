// Guesses the kind of food from its name – German and English, with synonyms. Everything
// happens here, locally; nothing is looked up anywhere.
//
// How it works: the name is simplified (lower case, no umlauts), then the longest word of the
// lists below that occurs in it decides ("Rinderfilet" contains "rind"). Words that say how
// something was prepared come first: a dish is a dish whatever is in it ("Linsensuppe"),
// smoked fish is not raw fish ("Räucherlachs"), fried chicken is cooked meat.
import type { Category } from './categories';
import { CATEGORY_ICONS, type IconKey } from './icons';

// "Käse" -> "kase", "Soße" -> "sosse": the same is done to the lists, so both sides match
export function simplify(text: string) {
	return text
		.toLowerCase()
		.replace(/ß/g, 'ss')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

const words = (list: string) => list.split(',').map((word) => simplify(word));

// Whole dishes: always "leftovers / cooked"
const DISHES = words(
	'suppe,eintopf,auflauf,gulasch,ragout,curry,chili,bolognese,lasagne,sosse,sauce,bruhe,fond,pesto,risotto,pfanne,gratin,frikassee,puree,pueree,brei,knodel,klosse,spatzle,nudelsalat,kartoffelsalat,reste,gekochte nudeln,gekochter reis,pizza,quiche,' +
		'soup,stew,casserole,goulash,broth,stock,gravy,mash,dumpling,leftover,cooked pasta,cooked rice,meal'
);
const SMOKED = words('gerauchert,raucher,rauch,smoked,gebeizt,graved');
const COOKED = words(
	'gekocht,gebraten,gegart,gegrillt,geschmort,gedunstet,gedampft,blanchiert,gebacken,frittiert,pulled,' +
		'cooked,fried,roasted,grilled,braised,steamed,blanched,baked,boiled'
);

// kind of food : words that name it
const FOODS: [Category, string][] = [
	// First, so that "vegane Wurst" is not taken for sausage
	[
		'plant_based',
		'tofu,tempeh,seitan,vegan,veggie,vegetarisch,soja,sojaschnetzel,hummus,falafel,lupine,jackfruit,pflanzendrink,haferdrink,hafermilch,sojamilch,mandelmilch,reismilch,sojajoghurt,haferjoghurt,' +
			'plant based,oat milk,soy milk,almond milk,meat substitute'
	],
	[
		'fish_raw',
		'fisch,lachs,forelle,kabeljau,dorsch,seelachs,thunfisch,hering,makrele,zander,saibling,dorade,wolfsbarsch,heilbutt,scholle,rotbarsch,sardine,sardelle,karpfen,pangasius,' +
			'fish,salmon,trout,cod,tuna,herring,mackerel,halibut,haddock,pollock,seabass,sea bass,plaice,anchovy'
	],
	[
		'seafood',
		'meeresfruchte,garnele,krabbe,shrimp,scampi,gamba,muschel,tintenfisch,calamari,oktopus,hummer,krebs,jakobsmuschel,auster,' +
			'seafood,prawn,mussel,clam,squid,octopus,lobster,crab,scallop,oyster'
	],
	[
		'beef_raw',
		'rind,kalb,lamm,entrecote,rumpsteak,roastbeef,tafelspitz,ochse,wild,hirsch,reh,hase,kaninchen,' +
			'beef,veal,lamb,venison,sirloin,ribeye,brisket,rabbit'
	],
	['pork_raw', 'schwein,kasseler,schweinefilet,bauchfleisch,spareribs,' + 'pork'],
	[
		'poultry_raw',
		'geflugel,hahnchen,hahn,huhn,pute,truthahn,ente,gans,poularde,wachtel,' +
			'poultry,chicken,turkey,duck,goose,quail'
	],
	[
		'minced',
		'hackfleisch,hack,gehacktes,mett,tatar,faschiertes,burgerpatty,patty,' +
			'minced,mince,ground beef,ground meat'
	],
	[
		'meat_cooked',
		'frikadelle,bulette,fleischpflanzerl,fleischkuchle,hackbraten,' + 'meatball,meatloaf'
	],
	[
		'cold_cuts',
		'aufschnitt,wurst,wurstchen,bratwurst,leberwurst,fleischwurst,lyoner,mortadella,kochschinken,putenbrust,leberkase,wiener wurstchen,wienerle,bockwurst,weisswurst,fleischkase,' +
			'cold cuts,sausage,luncheon,hot dog,frankfurter,bologna,cooked ham'
	],
	[
		'cured',
		'salami,schinken,rohschinken,speck,bacon,prosciutto,serrano,chorizo,landjager,cabanossi,kabanos,mettwurst,bresaola,pancetta,parmaschinken,schwarzwalder,' +
			'cured,pepperoni,jerky,dry sausage'
	],
	[
		'cheese_hard',
		'kase,hartkase,schnittkase,parmesan,provolone,gouda,emmentaler,bergkase,cheddar,gruyere,greyerzer,comte,pecorino,manchego,tilsiter,edamer,appenzeller,raclette,butterkase,grana padano,' +
			'cheese,hard cheese'
	],
	[
		'cheese_soft',
		'weichkase,frischkase,mozzarella,feta,brie,camembert,ricotta,mascarpone,burrata,quark,huttenkase,ziegenkase,schafskase,gorgonzola,blauschimmel,halloumi,' +
			'soft cheese,cream cheese,cottage cheese,goat cheese,blue cheese'
	],
	[
		'dairy',
		'milch,joghurt,sahne,schmand,creme fraiche,saure sahne,kefir,buttermilch,skyr,pudding,' +
			'milk,yogurt,yoghurt,cream,sour cream,custard'
	],
	['eggs', 'ei,eier,eigelb,eiweiss,' + 'egg,eggs,yolk'],
	[
		'salad_herbs',
		'salat,rucola,feldsalat,kopfsalat,eisbergsalat,spinat,mangold,krauter,petersilie,schnittlauch,basilikum,dill,koriander,minze,kresse,' +
			'salad,lettuce,arugula,rocket,spinach,chard,herbs,parsley,chives,basil,cilantro,coriander,mint'
	],
	[
		'veg_raw',
		'gemuse,mohre,karotte,brokkoli,blumenkohl,paprika,zucchini,aubergine,tomate,gurke,kartoffel,zwiebel,knoblauch,lauch,porree,sellerie,kohl,kohlrabi,rosenkohl,wirsing,rotkohl,weisskohl,bohne,erbse,mais,spargel,pilz,champignon,kurbis,fenchel,rote bete,radieschen,rettich,pastinake,susskartoffel,ingwer,' +
			'vegetable,carrot,broccoli,cauliflower,pepper,courgette,eggplant,tomato,cucumber,potato,onion,garlic,leek,celery,cabbage,bean,pea,corn,asparagus,mushroom,pumpkin,squash,fennel,beetroot,radish,ginger'
	],
	[
		'berries',
		'beere,erdbeere,himbeere,heidelbeere,blaubeere,brombeere,johannisbeere,preiselbeere,stachelbeere,kirsche,traube,weintraube,' +
			'berry,berries,strawberry,raspberry,blueberry,blackberry,currant,cranberry,cherry,grape'
	],
	[
		'fruit',
		'obst,obstsalat,apfel,birne,banane,orange,apfelsine,mandarine,clementine,zitrone,limette,pfirsich,nektarine,aprikose,pflaume,zwetschge,mango,ananas,melone,kiwi,feige,dattel,granatapfel,rhabarber,avocado,' +
			'fruit,apple,pear,banana,tangerine,lemon,lime,peach,nectarine,apricot,plum,pineapple,melon,fig,date,pomegranate,rhubarb'
	],
	[
		'bread',
		'brot,brotchen,baguette,toast,semmel,weck,laugen,brezel,ciabatta,fladenbrot,bagel,tortilla,wrap,pita,knackebrot,zwieback,' +
			'bread,roll,bun,pretzel,flatbread,loaf'
	],
	[
		'cake',
		'kuchen,torte,geback,keks,platzchen,muffin,croissant,waffel,pfannkuchen,strudel,stollen,brownie,donut,berliner,hefezopf,teilchen,plunder,' +
			'cake,pie,cookie,biscuit,pastry,waffle,pancake,tart'
	],
	[
		'dry_goods',
		'reis,nudeln,pasta,spaghetti,mehl,kaffeebohne,linsen,kichererbsen,haferflocken,musli,nusse,nuss,mandeln,walnusse,haselnusse,cashew,erdnusse,kaffee,tee,zucker,salz,gewurz,couscous,bulgur,quinoa,hirse,griess,getrocknete,trockenobst,rosinen,kerne,samen,' +
			'rice,noodles,flour,lentils,chickpeas,oats,muesli,granola,nuts,almonds,walnuts,hazelnuts,peanuts,coffee,sugar,spice,dried,raisins,seeds'
	]
];

// Names of cuts say little about the animal ("Putenschnitzel" is poultry): they only count
// when nothing else was recognised.
const CUTS: [Category, string][] = [
	['beef_raw', 'steak,rouladen,braten,filet,fleisch,' + 'roast,meat'],
	['pork_raw', 'schnitzel,kotelett,nacken,rippchen,' + 'chop,ribs']
];

const toLists = (foods: [Category, string][]) =>
	foods.map(([category, list]) => ({ category, words: words(list) }));
const LISTS = toLists(FOODS);
const CUT_LISTS = toLists(CUTS);

// Where the word occurs in the simplified name: 'end' = at the end of one of its words (plural
// endings ignored), 'inside' = somewhere else, null = not at all. Very short words have to
// stand alone, so that "tee" is not found in "Teewurst".
function find(name: string, word: string): 'end' | 'inside' | null {
	if (word.length <= 3) return ` ${name} `.includes(` ${word} `) ? 'end' : null;
	if (!name.includes(word)) return null;
	const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`${escaped}(e|n|en|er|es|s)?( |$)`).test(name) ? 'end' : 'inside';
}
const has = (name: string, word: string) => find(name, word) !== null;

// The word that decides: in German the last part of a compound says what it is
// ("Zwiebelkuchen" is a cake), so a word at the end of a word beats one inside; among those
// the longer one wins ("Preiselbeere" beats "Beere").
function bestMatch(name: string, lists: { category: Category; words: string[] }[]) {
	let best: { category: Category; score: number } | null = null;
	for (const { category, words: list } of lists) {
		for (const word of list) {
			const where = find(name, word);
			if (!where) continue;
			const score = (where === 'end' ? 1000 : 0) + word.length;
			if (!best || score > best.score) best = { category, score };
		}
	}
	return best;
}

const RAW_MEAT: Category[] = ['beef_raw', 'pork_raw', 'poultry_raw', 'minced'];
const FISH: Category[] = ['fish_raw', 'seafood'];

// The kind of food a name most likely means; 'other' if nothing is recognised.
export function suggestCategory(name: string): Category {
	const text = simplify(name);
	if (!text) return 'other';
	if (DISHES.some((word) => has(text, word))) return 'leftovers';

	const best = bestMatch(text, LISTS) ?? bestMatch(text, CUT_LISTS);
	if (!best) return 'other';

	const smoked = SMOKED.some((word) => has(text, word));
	const cooked = COOKED.some((word) => has(text, word));
	if (FISH.includes(best.category) && (smoked || cooked)) return 'fish_smoked';
	if (RAW_MEAT.includes(best.category)) {
		if (smoked) return 'cured';
		if (cooked) return 'meat_cooked';
	}
	if (best.category === 'veg_raw' && cooked) return 'veg_cooked';
	return best.category;
}

// Foods that have a symbol of their own; everything else gets the symbol of its kind.
const ICON_WORDS: [IconKey, string][] = [
	['banana', 'banane,banana'],
	['red-apple', 'apfel,apple'],
	['pear', 'birne,pear'],
	['peach', 'pfirsich,nektarine,aprikose,pflaume,zwetschge,peach,apricot,plum'],
	['lemon', 'zitrone,lemon'],
	['lime', 'limette,lime'],
	['tangerine', 'orange,apfelsine,mandarine,clementine,tangerine'],
	['grapes', 'traube,weintraube,grape'],
	['cherries', 'kirsche,cherry'],
	['strawberry', 'erdbeere,himbeere,strawberry,raspberry'],
	['blueberries', 'heidelbeere,blaubeere,brombeere,johannisbeere,blueberry,blackberry,currant'],
	['mango', 'mango'],
	['pineapple', 'ananas,pineapple'],
	['kiwi-fruit', 'kiwi'],
	['watermelon', 'wassermelone,watermelon'],
	['melon', 'melone,melon'],
	['avocado', 'avocado'],
	['coconut', 'kokos,coconut'],
	['carrot', 'mohre,karotte,carrot'],
	['broccoli', 'brokkoli,blumenkohl,rosenkohl,broccoli,cauliflower'],
	['bell-pepper', 'paprika,bell pepper'],
	['hot-pepper', 'peperoni,chilischote,jalapeno'],
	['tomato', 'tomate,tomato'],
	['cucumber', 'gurke,zucchini,cucumber,courgette'],
	['eggplant', 'aubergine,eggplant'],
	['potato', 'kartoffel,potato'],
	['onion', 'zwiebel,lauch,porree,onion,leek'],
	['garlic', 'knoblauch,garlic'],
	['ginger-root', 'ingwer,ginger'],
	['ear-of-corn', 'mais,corn'],
	['pea-pod', 'erbse,zuckerschote,pea'],
	['beans', 'bohne,linsen,kichererbsen,bean,lentils,chickpeas'],
	['brown-mushroom', 'pilz,champignon,pfifferling,steinpilz,mushroom'],
	['green-salad', 'salat,salad'],
	['olive', 'olive'],
	['baguette-bread', 'baguette,ciabatta'],
	['croissant', 'croissant,plunder,teilchen'],
	['pretzel', 'brezel,laugen,pretzel'],
	['bagel', 'bagel'],
	['flatbread', 'fladenbrot,pita,tortilla,wrap,flatbread'],
	['pancakes', 'pfannkuchen,pancake'],
	['waffle', 'waffel,waffle'],
	['cookie', 'keks,platzchen,cookie,biscuit'],
	['doughnut', 'donut,berliner,krapfen'],
	['cupcake', 'muffin,cupcake'],
	['pie', 'quiche,tarte,pie'],
	['birthday-cake', 'torte'],
	['chocolate-bar', 'schokolade,chocolate,brownie'],
	['pizza', 'pizza'],
	['hamburger', 'burger,patty'],
	['sandwich', 'sandwich,belegtes'],
	['spaghetti', 'nudeln,pasta,spaghetti,bolognese,lasagne,spatzle,noodles'],
	['cooked-rice', 'reis,risotto,rice'],
	['curry-rice', 'curry'],
	['steaming-bowl', 'suppe,bruhe,fond,eintopf,soup,broth,stew'],
	['french-fries', 'pommes,fries'],
	['dumpling', 'knodel,klosse,maultasche,dumpling,gnocchi'],
	['falafel', 'falafel,frikadelle,bulette,meatball'],
	['sushi', 'sushi'],
	['shrimp', 'garnele,krabbe,scampi,gamba,shrimp,prawn'],
	['lobster', 'hummer,lobster'],
	['squid', 'tintenfisch,calamari,oktopus,squid,octopus'],
	['oyster', 'auster,muschel,oyster,mussel,clam,scallop'],
	['bacon', 'speck,bacon,pancetta'],
	['meat-on-bone', 'keule,haxe,braten,rippchen,spareribs,ribs,roast'],
	['poultry-leg', 'hahnchen,huhn,pute,ente,gans,chicken,turkey,duck'],
	['egg', 'ei,eier,egg,eggs'],
	['glass-of-milk', 'milch,drink,milk'],
	['butter', 'butter,margarine'],
	['custard', 'pudding,joghurt,quark,skyr,yogurt,yoghurt,custard'],
	['honey-pot', 'honig,honey'],
	['jar', 'marmelade,konfiture,pesto,aufstrich,hummus,jam'],
	['peanuts', 'erdnuss,erdnusse,peanut'],
	['chestnut', 'nuss,nusse,mandel,walnuss,haselnuss,cashew,marone,nut,nuts,almond'],
	['popcorn', 'popcorn'],
	['hot-beverage', 'kaffee,tee,coffee,tea'],
	['salt', 'salz,gewurz,zucker,mehl,salt,spice,sugar,flour'],
	['ice-cream', 'eis,eiscreme,ice cream']
];
const ICON_LISTS = ICON_WORDS.map(([icon, list]) => ({ icon, words: words(list) }));

// The symbol for a name: its own if the name says so ("Banane"), else that of its kind of food.
export function suggestIcon(name: string, category: Category): IconKey {
	const text = simplify(name);
	// "Zwiebelkuchen" is a cake: when the name ends in a food word, words inside it say nothing
	// about the symbol ("Apfelmus" has no such ending, so the apple counts)
	const endsInFood = LISTS.some(({ words: list }) => list.some((w) => find(text, w) === 'end'));
	let best: { icon: IconKey; score: number } | null = null;
	for (const { icon, words: list } of ICON_LISTS) {
		for (const word of list) {
			const where = find(text, word);
			if (!where || (where === 'inside' && endsInFood)) continue;
			const score = (where === 'end' ? 1000 : 0) + word.length;
			if (!best || score > best.score) best = { icon, score };
		}
	}
	return best?.icon ?? CATEGORY_ICONS[category];
}
