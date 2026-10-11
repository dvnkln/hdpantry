# Changelog

All notable changes to hdpantry. Each version is also published as a [GitHub release](https://github.com/dvnkln/hdpantry/releases) with a ready-to-use Docker image.

<!-- Changes since the last release are collected right below this comment, under a second-level
     heading "Upcoming release" – it only exists while there are such changes. On release it
     becomes "X.Y.Z – date". Sections (leave out empty ones): ✨ New, 🔧 Improved, 🐛 Fixed,
     🗑️ Removed, and on release ⬆️ Updating (what users have to do when updating).
     This comment spells no heading out with its "#" signs on purpose: a search for the heading
     must not land in here (it did, and a release section ended up hidden inside the comment). -->

## 0.2.1 – 2026-10-11

A small follow-up to 0.2.0.

### 🔧 Improved

- **About** – names what the text recognition is built with: the PP-OCRv5 models of PaddleOCR, their browser-ready files from RapidOCR, and ONNX Runtime

### ⬆️ Updating

- `docker compose pull`, then `docker compose up -d` – see [Updating](https://github.com/dvnkln/hdpantry/wiki/Updating). Nothing else to do.

## 0.2.0 – 2026-10-11

Scanning gets a second way in: besides QR codes and barcodes, hdpantry can now read a code that is printed as text.

### ✨ New

- **Text recognition (OCR)** – besides QR codes and barcodes, hdpantry now also reads a code printed as plain text. A QR code stops working once its label is creased, dented or frosted over; printed characters usually stay legible. It runs entirely in your browser. For now it only reads codes of exactly four capital letters or digits, and only for containers whose QR code carries that same short code. A code it has never seen is confirmed with one tap
- **Since** – recording something that has been in the freezer for a few days? Set the day it went in; the suggested best-before date counts from there. It can be corrected later, too

### 🔧 Improved

- **Scanning** – the camera now asks for a sharper picture and keeps focusing; phones with a lamp get a light button in the camera picture, and where the camera allows it, tapping the picture focuses there
- **Code not readable?** – if the camera finds nothing for a few seconds, a short note in the camera picture points to typing the code by hand, then tucks itself away behind an info button next to the light
- **Check a code** – reads every picture with both code readers (the browser's own, the bundled one) and shows which one found the code and how fast; it also shows printed text it can read, stops by itself and lists what the camera of the device can do

### ⬆️ Updating

- `docker compose pull`, then `docker compose up -d` – see [Updating](https://github.com/dvnkln/hdpantry/wiki/Updating). The database is updated by itself.
- After the update every device fetches the files of the text recognition once, in the background (about 15 MB, from your own hdpantry). The image is about 33 MB larger.
- hdpantry now sends two more headers with every answer (`Cross-Origin-Opener-Policy`, `Cross-Origin-Embedder-Policy`). A reverse proxy passes them on by itself – nothing to set up.

## 0.1.0 – 2026-10-06

First release.

### ✨ New

- **Scan** – hold the code of a container in front of the camera and hdpantry leads on right away: a full container shows what is inside, an empty one asks for a name. A photo of the code or typing it works too, with any QR code
- **Containers** – every code is one container, added by itself the first time it is scanned. Mark the content as eaten or replace it in one go; a container remembers what was in it before
- **Quick entry** – one name, then an optional note, vacuum-sealed or not, where it is stored, best before, how full it is and how much
- **Shelf life** – kind of food, symbol, suitable places of storage and a best-before date are suggested from the name; guide values with their sources, never a guarantee
- **In stock** – what expires first at the top, expired and soon-to-expire items stand out; filter by place of storage, sort by date, name or place
- **Stock in the cabinet** – a bit of fun you can switch on under Appearance: pick a place of storage and the list stands inside a drawn fridge, freezer or wooden cabinet
- **Reminders** – a message when something is about to expire (once or every day), on the day and after; one by one or as one summary a day, from an hour you choose. As push messages from the app itself, or through Pushover, ntfy or a webhook – each target with its own switch and test
- **Export and import** – the whole stock with its history as one readable file
- **Maintenance built in** – the background tasks with their schedule and how the last run went; optional scheduled backups of the database, downloadable in the app
- **Settings** – English and German, light and dark, symbols in two styles, account, reverse proxy; installable as an app on your home screen
- **Private** – runs on your own server and connects to nothing outside, unless you set up notifications

### ⬆️ Updating

This is the first version – nothing to update from. To install it, follow the [installation guide](https://github.com/dvnkln/hdpantry/wiki/Installation).
