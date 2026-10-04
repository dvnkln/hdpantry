<h1 align="center">hdpantry</h1>

<p align="center">
  <a href="https://github.com/dvnkln/hdpantry/actions/workflows/check.yml"><img src="https://img.shields.io/github/actions/workflow/status/dvnkln/hdpantry/check.yml?label=checks&style=for-the-badge" alt="Checks" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-1f7a5c?style=for-the-badge" alt="License: AGPL-3.0" /></a>
</p>

<p align="center">
  Self-hosted pantry tracker for reusable <b>vacuum containers and bags</b> with a QR code – scan a container, note what is inside, and see what should be eaten first.
</p>

> [!NOTE]
> 🚧 **Early development.** hdpantry cannot track food yet: so far there is the foundation – set-up, login, scanning codes and managing containers. There is no release and no published image. This page grows with the app.

## 📖 Documentation

The guides will live in the **[wiki](https://github.com/dvnkln/hdpantry/wiki)** (installation, HTTPS, privacy and security, resetting your password, development). They are written as the features arrive.

What's planned for later: [Roadmap](ROADMAP.md).

## ✨ Features

Working today:

- 📷 **Scan** – hold a code in front of the camera and hdpantry opens the container right away; no button, no confirmation. A photo of the code or typing it works too. Any QR code will do.
- 🥡 **Containers and bags** – every code is one container; give it a name if you like.
- 🔒 **Private** – runs on your own server, single account, all data in one SQLite file. No tracking, no cloud, no foreign scripts or fonts; at present hdpantry does not connect to any outside service at all.
- 🛡️ **Protected login** – repeated wrong passwords block the address they come from.
- 🌍 **English and German** – follows your browser on first start, chosen during set-up.
- 🌗 **Light and dark** – follows your device.

Being built for the first version:

- 📝 **Quick entry** – what is inside, vacuum-sealed or not, where it is stored, how full it is.
- 📅 **Shelf life** – a suggested date from the kind of food, the place of storage and whether it is vacuum-sealed. Guide values, not a guarantee – and always yours to change.
- 📋 **Inventory** – everything in stock, sorted by date, with what expires soon highlighted.
- 📤 **Export and import** – your data as a file.

## 🐳 Quick start

There is no published image yet. To try the current state, build it from source:

1. Clone the repository and create a `.env` file in it (template: [`.env.example`](.env.example)) with a random `SECRET`, your time zone and `ORIGIN` – **exactly** the address you open the app with, e.g. `http://192.168.1.50:3001`.

2. Build and start it, then open that address. On first start you create your account.

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
   ```

The camera scanner will need HTTPS (a rule of the browsers); hdpantry expects a reverse proxy for that.

## 🤖 Built with AI

hdpantry is heavily AI-assisted, and I want to be upfront about that. Most of the code is written by [Claude Code](https://claude.com/claude-code), Anthropic's AI coding assistant.

My part is the product side: what hdpantry should do, how it should look and feel, and how it should behave. I describe ideas and decisions, review and test every change in a running instance, and decide what goes into a release. The AI turns that into code, tests it and documents it.

If you find a bug or something that looks odd in the code, please open an [issue](https://github.com/dvnkln/hdpantry/issues) – that helps.

## 📜 License

[GNU AGPL v3](LICENSE) – you may use, change and share hdpantry freely. If you distribute a modified version or offer it to others over a network, you have to publish your changes under the same license. This is a personal project, provided as-is without support or guarantees; if it's useful to you too, even better.
