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

<p align="center">
  <img src="docs/screenshots/devices.jpg" alt="hdpantry on a desktop screen and two phones" />
</p>

> [!NOTE]
> 🚧 **Early development.** Scanning, recording what is inside, shelf-life suggestions, the stock list, export and import and the settings work. Still to come before the first version: a published image. There is no release and no published image. This page grows with the app.

## 📖 Documentation

The guides live in the **[wiki](https://github.com/dvnkln/hdpantry/wiki)**:

- 🐳 [Installation](https://github.com/dvnkln/hdpantry/wiki/Installation) – Docker Compose and the `.env` file
- 🔐 [HTTPS](https://github.com/dvnkln/hdpantry/wiki/HTTPS) – reverse proxy, `ORIGIN`, why the camera needs it, installing as an app
- 📅 [Shelf life guide values](https://github.com/dvnkln/hdpantry/wiki/Shelf-life-guide-values) – what the suggested dates are worth and where they come from
- 📤 [Export and import](https://github.com/dvnkln/hdpantry/wiki/Export-and-import) – your stock as a file
- 💾 [Backups and restore](https://github.com/dvnkln/hdpantry/wiki/Backups-and-restore)
- 🛡️ [Privacy and security](https://github.com/dvnkln/hdpantry/wiki/Privacy-and-security) – what stays on your server, how your data is stored
- 🔑 [Reset your password](https://github.com/dvnkln/hdpantry/wiki/Reset-your-password)
- 💻 [Development](https://github.com/dvnkln/hdpantry/wiki/Development) – running hdpantry from source

What's planned for later: [Roadmap](ROADMAP.md).

## ✨ Features

Working today:

- 📷 **Scan** – hold a code in front of the camera and hdpantry leads on right away, without a button or a question: a full container shows what is inside, an empty one asks for a name. A photo of the code or typing it works too. Any QR code will do.
- 🥡 **Containers and bags** – every code is one container, added by itself the first time it is scanned. Mark the content as eaten – or replace it in one go – and the container is free for the next thing; scanning it then shows what was in it before, ready to be used again with one tap. Containers without a code can be recorded by hand and merged with their code later.
- 📝 **Quick entry** – one name, then an optional note, vacuum-sealed or not, where it is stored, best before, how full it is and, if you like, how much (g, kg, ml, l, pieces, servings – it follows the fill level). Everything can be corrected later.
- 📅 **Shelf life** – the kind of food and a symbol are suggested from its name (German and English; your corrections are remembered). Suitable places of storage are marked, unsuitable ones locked, and a best-before date is suggested from the kind of food, the place and whether it is vacuum-sealed – [guide values, not a guarantee](#-shelf-life).
- 🎨 **Symbols in two styles** – colourful or plain line icons, your choice.
- 📋 **In stock** – everything you have, what expires first at the top; expired and soon-to-expire items stand out. Filter by place of storage, sort by date, name or place. Cards on phones, a wide table on computers.
- 🔒 **Private** – runs on your own server, single account, all data in one SQLite file. No tracking, no cloud, no foreign scripts or fonts; at present hdpantry does not connect to any outside service at all.
- 🛡️ **Protected login** – repeated wrong passwords block the address they come from. Behind a reverse proxy, hdpantry tells visitors apart once the proxy is confirmed – with one tap, or with a key where Docker hides the addresses. Change your username or password in the settings and log out your other devices with one tap.
- 📲 **Install as an app** – on the home screen of your phone or on your computer, with its own icon and without the browser's bars. Long-press the icon to go straight to the scanner.
- 🌍 **English and German** – follows your browser on first start; change it any time in the settings.
- 🌗 **Light and dark** – follows your device, or pick one.
- 📤 **Export and import** – your whole stock with its history as one readable file (JSON). Importing replaces the stock, after a clear warning.
- 💾 **Automatic backups** – optional copies of the database on a schedule, kept inside the data folder and downloadable in the app. Off until you switch it on.

Being built for the first version:

- 📦 **A published image** – so installing no longer means building from source.

## 📅 Shelf life

hdpantry suggests a best-before date so you keep track of what to eat first. **These dates are estimates based on published sources – not a guarantee and no substitute for your own judgement:** always look at food and smell it before eating, and if in doubt throw it away. How the values were chosen, the full table and all sources: [Shelf life guide values](https://github.com/dvnkln/hdpantry/wiki/Shelf-life-guide-values).

## 📱 Screenshots

|                               In stock                                |                                   New content                                    |                                 Details                                  |
| :-------------------------------------------------------------------: | :------------------------------------------------------------------------------: | :----------------------------------------------------------------------: |
| <img src="docs/screenshots/stock.jpg" alt="Stock list" width="260" /> | <img src="docs/screenshots/form.jpg" alt="Form for a new content" width="260" /> | <img src="docs/screenshots/details.jpg" alt="Detail page" width="260" /> |

|                                    Guide values                                    |                                        Appearance                                         |                                              Dark                                              |
| :--------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------: |
| <img src="docs/screenshots/guide.jpg" alt="Shelf-life guide values" width="260" /> | <img src="docs/screenshots/appearance.jpg" alt="Colour scheme and symbols" width="260" /> | <img src="docs/screenshots/dark.jpg" alt="Stock list in the dark colour scheme" width="260" /> |

<p align="center"><sub>Screenshots with an invented demo stock. Colourful symbols: Twemoji.</sub></p>

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
