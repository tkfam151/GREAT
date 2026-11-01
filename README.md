# Blockhaven

An original voxel sandbox game. Explore an endless, procedurally generated world of hills, mountains, lakes, caves and forests; mine blocks, craft new ones, and build whatever you like.

It runs as a desktop app on **macOS** and **Windows**, with a launcher for managing worlds, and also in any modern browser.

## Features

- **Launcher**: create, rename, delete and pick worlds; set render distance, mouse sensitivity and field of view; read the controls.
- **Survival mode**: start with nothing, hold-to-mine with crack animation, block drops, 10 hearts, fall damage, drowning, slow health regeneration, death and respawn.
- **Creative mode**: unlimited blocks, instant breaking, flying, and a creative inventory with every block.
- **Inventory**: 27-slot backpack + 9-slot hotbar, stacks of 64, drag-style click/split/shift-click handling.
- **Crafting**: planks, smooth stone, stone bricks, glass, bricks and turf.
- Day/night cycle, clouds, water, ambient occlusion, and per-world autosave.

## Download

Installers are built automatically by GitHub Actions on every push:

1. Open the **Actions** tab → **Build desktop apps** → the latest successful run.
2. Download **Blockhaven-macOS** (contains the `.dmg`) or **Blockhaven-Windows** (contains `Blockhaven-Setup-x.y.z.exe`).

Pushing a tag such as `v1.0.0` also attaches both files to a GitHub Release.

### macOS

Open the DMG and drag **Blockhaven** into **Applications**. It's a universal app (Apple silicon and Intel).

Because the app isn't notarized with a paid Apple Developer ID, macOS quarantines the downloaded copy and won't open it at first.
Fix it once by running this in **Terminal**:

```bash
xattr -cr /Applications/Blockhaven.app
```

Then open Blockhaven normally. (Alternatively: try to open it once, then **System Settings → Privacy & Security → Open Anyway**.)
The DMG includes a `How to open Blockhaven.txt` file with the same steps.

**Removing this step for good:** with an Apple Developer Program membership, add these repository secrets and the
workflow will sign and notarize the app automatically, so it opens with a normal double-click:
`MAC_CERTS` (base64-encoded "Developer ID Application" `.p12`), `MAC_CERTS_PASSWORD`, `APPLE_ID`,
`APPLE_APP_SPECIFIC_PASSWORD` (from appleid.apple.com) and `APPLE_TEAM_ID`.

### Windows

Run `Blockhaven-Setup-x.y.z.exe`. You can choose the install folder; it adds Start menu and desktop shortcuts and an uninstaller.
The installer isn't code-signed, so SmartScreen may warn you: click **More info → Run anyway**.

## Controls

| Key | Action |
| --- | --- |
| W A S D | Move |
| Mouse | Look |
| Space | Jump / swim up / fly up |
| Shift | Sprint (fly down while flying) |
| Left click | Break block (hold in Survival) |
| Right click | Place block |
| Middle click | Pick block |
| E | Inventory & crafting |
| 1–9 / wheel | Hotbar slot |
| F | Fly (Creative) |
| T | Skip time |
| F3 | Debug info |
| Esc | Pause / change mode / quit to launcher |

## Development

```bash
npm install
npm start            # run the desktop app
npm run dist:mac     # build the DMG (on macOS)
npm run dist:win     # build the Windows installer (on Windows)
```

To play in a browser instead, serve the `app/` folder with any static web server and open `index.html`.

## Project layout

- `app/index.html`: launcher
- `app/game.html`: the game
- `app/storage.js`: world and settings saves (shared by both pages)
- `electron/`: desktop app shell
- `build/icon.png`: app icon used for the Mac and Windows builds
- `electron-builder.cjs`: packaging, signing and installer settings
- `.github/workflows/build-desktop.yml`: builds the DMG and Windows installer, then installs and launches each one and runs `scripts/smoke-test.mjs` against it

Third-party: [three.js](https://threejs.org) r128 (MIT, `app/vendor/`) and the Press Start 2P font (SIL OFL, `app/fonts/`).
