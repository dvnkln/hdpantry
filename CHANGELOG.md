# Changelog

All notable changes to hdpantry. Each version is also published as a [GitHub release](https://github.com/dvnkln/hdpantry/releases) with a ready-to-use Docker image.

<!-- Changes since the last release are collected under "## Upcoming release" right below this
     comment – the heading only exists while there are such changes. On release it becomes
     "## X.Y.Z – date". Sections (leave out empty ones): ### ✨ New, ### 🔧 Improved, ### 🐛 Fixed,
     ### 🗑️ Removed, and on release ### ⬆️ Updating (what users have to do when updating). -->

## 0.1.0 – 2026-10-05

First release.

### ✨ New

- **Scan** – hold the code of a container in front of the camera and hdpantry leads on right away: a full container shows what is inside, an empty one asks for a name. A photo of the code or typing it works too, with any QR code
- **Containers** – every code is one container, added by itself the first time it is scanned. Mark the content as eaten or replace it in one go; a container remembers what was in it before
- **Quick entry** – one name, then an optional note, vacuum-sealed or not, where it is stored, best before, how full it is and how much
- **Shelf life** – kind of food, symbol, suitable places of storage and a best-before date are suggested from the name; guide values with their sources, never a guarantee
- **In stock** – what expires first at the top, expired and soon-to-expire items stand out; filter by place of storage, sort by date, name or place
- **Reminders** – a message when something is about to expire (once or every day), on the day and after; one by one or as one summary a day, from an hour you choose. As push messages from the app itself, or through Pushover, ntfy or a webhook – each target with its own switch and test
- **Export and import** – the whole stock with its history as one readable file
- **Maintenance built in** – optional scheduled backups of the database, downloadable in the app
- **Settings** – English and German, light and dark, symbols in two styles, account, reverse proxy; installable as an app on your home screen
- **Private** – runs on your own server and connects to nothing outside, unless you set up notifications

### ⬆️ Updating

This is the first version – nothing to update from. To install it, follow the [installation guide](https://github.com/dvnkln/hdpantry/wiki/Installation).
