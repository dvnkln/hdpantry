<!-- Logo with wordmark; GitHub picks the variant matching its light or dark theme -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/brand/wordmark-dark.png" />
    <img src="docs/brand/wordmark-light.png" width="380" alt="hdpantry" />
  </picture>
</p>

<p align="center">
  <a href="https://github.com/dvnkln/hdpantry/actions/workflows/check.yml"><img src="https://img.shields.io/github/actions/workflow/status/dvnkln/hdpantry/check.yml?label=checks&style=for-the-badge" alt="Checks" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-1f7a5c?style=for-the-badge" alt="License: AGPL-3.0" /></a>
</p>

<p align="center">
  Self-hosted pantry tracker for reusable <b>vacuum containers and bags</b> with a QR code – scan a container, note what is inside, and see what should be eaten first.
</p>

> [!NOTE]
> 🚧 **Early development.** Scanning, recording what is inside, shelf-life suggestions and the stock list work; settings for language and colour scheme, and export are still missing. There is no release and no published image. This page grows with the app.

## 📖 Documentation

The guides will live in the **[wiki](https://github.com/dvnkln/hdpantry/wiki)** (installation, HTTPS, privacy and security, resetting your password, development). They are written as the features arrive.

What's planned for later: [Roadmap](ROADMAP.md).

## ✨ Features

Working today:

- 📷 **Scan** – hold a code in front of the camera and hdpantry leads on right away, without a button or a question: a full container shows what is inside, an empty one asks for a name. A photo of the code or typing it works too. Any QR code will do.
- 🥡 **Containers and bags** – every code is one container, added by itself the first time it is scanned. Mark the content as eaten – or replace it in one go – and the container is free for the next thing; scanning it then shows what was in it before, ready to be used again with one tap. Containers without a code can be recorded by hand and merged with their code later.
- 📝 **Quick entry** – one name, then an optional note, vacuum-sealed or not, where it is stored, best before, how full it is and, if you like, how much (g, kg, ml, l, pieces, servings – it follows the fill level). Everything can be corrected later.
- 📅 **Shelf life** – the kind of food and a symbol are suggested from its name (German and English; your corrections are remembered). Suitable places of storage are marked, unsuitable ones locked, and a best-before date is suggested from the kind of food, the place and whether it is vacuum-sealed – [guide values, not a guarantee](#shelf-life-guide-values-not-guarantees).
- 🎨 **Symbols in two styles** – colourful or plain line icons, your choice.
- 📋 **In stock** – everything you have, what expires first at the top; expired and soon-to-expire items stand out. Filter by place of storage, sort by date, name or place. Cards on phones, a wide table on computers.
- 🔒 **Private** – runs on your own server, single account, all data in one SQLite file. No tracking, no cloud, no foreign scripts or fonts; at present hdpantry does not connect to any outside service at all.
- 🛡️ **Protected login** – repeated wrong passwords block the address they come from.
- 🌍 **English and German** – follows your browser on first start, chosen during set-up.
- 🌗 **Light and dark** – follows your device.

Being built for the first version:

- 📤 **Export and import** – your data as a file.

## Shelf life: guide values, not guarantees

hdpantry suggests a best-before date so you keep track of what to eat first. **These dates are estimates. They are not a guarantee and no substitute for your own judgement:** always look at food and smell it before eating, and if in doubt throw it away. This holds above all for raw fish, raw meat and minced meat.

How the values were chosen:

- Figures of German public bodies come first; where they give none, the FoodKeeper data of the U.S. Department of Agriculture.
- Where a source gives a range, its lower end is used; of two figures the more cautious one.
- None of these bodies publishes figures for the zero-degree zone or for food vacuum-sealed at home. Those values are the project's own cautious estimates. Raw fish, seafood, poultry and minced meat get no extra time from vacuum-sealing while chilled.

Every value and its source can be looked up in the app (Settings → Guide values) and in [`src/lib/food/shelfLife.ts`](src/lib/food/shelfLife.ts). Sources:

- [Bundesamt für Verbraucherschutz und Lebensmittelsicherheit (BVL) – Lebensmittel richtig lagern](https://www.bvl.bund.de/DE/Arbeitsbereiche/01_Lebensmittel/03_Verbraucher/03_UmgangLM/01_LMkonservierenLagern/01_Lagerung/lm_lagerung_node.html)
- [Bundesinstitut für Risikobewertung (BfR) – Fragen und Antworten zu verdorbenem Fleisch](https://www.bfr.bund.de/fragen-und-antworten/thema/fragen-und-antworten-zu-verdorbenem-fleisch/)
- [Bundeszentrum für Ernährung (BZfE) – Lagerung](https://www.bzfe.de/einfache-sprache/kochen-und-aufbewahren/lagerung)
- [Bundesministerium für Ernährung und Landwirtschaft, „Zu gut für die Tonne!“ – Richtig lagern](https://www.zugutfuerdietonne.de/tipps-fuer-zu-hause/richtig-lagern)
- [Verbraucherzentrale – Fleisch: Haltbarkeit und Lagerung](https://www.verbraucherzentrale.de/wissen/lebensmittel/auswaehlen-zubereiten-aufbewahren/fleisch-das-muessen-sie-bei-haltbarkeit-und-lagerung-beachten-58928)
- [Klingshirn et al. (2025): Gefrierlagerung und Verbraucherverhalten, Hauswirtschaft und Wissenschaft](https://haushalt-wissenschaft.de/wp-content/uploads/2025/01/HUW_10_2024_Klingshirn_Gefrierlagerung.pdf)
- [U.S. Department of Agriculture, FSIS – FoodKeeper data](https://catalog.data.gov/dataset/fsis-foodkeeper-data) (public domain)

## 🐳 Quick start

There is no published image yet. To try the current state, build it from source:

1. Clone the repository and create a `.env` file in it (template: [`.env.example`](.env.example)) with a random `SECRET`, your time zone and `ORIGIN` – **exactly** the address you open the app with, e.g. `http://192.168.1.50:3001`.

2. Build and start it, then open that address. On first start you create your account.

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
   ```

The camera scanner will need HTTPS (a rule of the browsers); hdpantry expects a reverse proxy for that.

## 🙏 Credits

Colourful food symbols: [Twemoji](https://github.com/jdecked/twemoji), © Twitter, Inc and other contributors, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Plain symbols: [Lucide](https://lucide.dev) (ISC License) and [Tabler Icons](https://tabler.io/icons) (MIT License). Wordmark font: [Outfit](https://github.com/Outfitio/Outfit-Fonts) (SIL Open Font License). All of them are bundled with the app – nothing is loaded from elsewhere.

## 🤖 Built with AI

hdpantry is heavily AI-assisted, and I want to be upfront about that. Most of the code is written by [Claude Code](https://claude.com/claude-code), Anthropic's AI coding assistant.

My part is the product side: what hdpantry should do, how it should look and feel, and how it should behave. I describe ideas and decisions, review and test every change in a running instance, and decide what goes into a release. The AI turns that into code, tests it and documents it.

If you find a bug or something that looks odd in the code, please open an [issue](https://github.com/dvnkln/hdpantry/issues) – that helps.

## 📜 License

[GNU AGPL v3](LICENSE) – you may use, change and share hdpantry freely. If you distribute a modified version or offer it to others over a network, you have to publish your changes under the same license. This is a personal project, provided as-is without support or guarantees; if it's useful to you too, even better.
