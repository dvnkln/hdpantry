# Changelog

All notable changes to hdpantry. Each version is also published as a [GitHub release](https://github.com/dvnkln/hdpantry/releases) with a ready-to-use Docker image.

<!-- Changes since the last release are collected under "## Upcoming release" right below this
     comment – the heading only exists while there are such changes. On release it becomes
     "## X.Y.Z – date". Sections (leave out empty ones): ### ✨ New, ### 🔧 Improved, ### 🐛 Fixed,
     ### 🗑️ Removed, and on release ### ⬆️ Updating (what users have to do when updating). -->

## Upcoming release

The first version: scan a container, note what is inside, and see what should be eaten first.

### ✨ New

- **Scan:** hold the code of a container or bag in front of the camera and hdpantry leads on right away – a full container shows what is inside, an empty one asks for a name. A photo of the code or typing it works too, with any QR code
- **Containers and bags:** every code is one container, added by itself the first time it is scanned. Mark the content as eaten or replace it in one go; a container remembers what was in it before and offers it again with one tap. Containers without a code can be recorded by hand and merged with their code later
- **Quick entry:** one name, then an optional note, vacuum-sealed or not, where it is stored, best before, how full it is and, if you like, how much
- **Shelf life:** the kind of food and a symbol are suggested from the name (German and English; your corrections are remembered), suitable places of storage are marked, and a best-before date is suggested – guide values with their sources under Settings → Guide values, never a guarantee
- **In stock:** everything you have, what expires first at the top; expired and soon-to-expire items stand out. Filter by place of storage, sort by date, name or place; cards on phones, a table on computers
- **Settings:** language (English, German), colour scheme (system, dark, light), symbols in two styles, vibration when scanning, when something counts as “expires soon”
- **Account:** change username and password, log out all other devices
- **Export and import:** the whole stock with its history as one readable file; importing replaces the stock after showing what will change
- **Backups:** optional scheduled copies of the database that can be downloaded in the app
- **Behind a reverse proxy:** Settings → Connection shows whether the connection is encrypted and lets you confirm the proxy, with one tap or with a key
- **Install as an app** on the home screen of your phone or on your computer
- **Private:** hdpantry runs on your own server and does not connect to any outside service; repeated wrong passwords block the address they come from
