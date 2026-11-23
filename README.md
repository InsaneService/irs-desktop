# Insane Revenue Service desktop

Replace the existing `index.html`, `style.css`, and `script.js` in your GitHub Pages repository with the files in this package. Keep your existing `assets/` folder and its images.

## Required existing image assets
Keep these filenames exactly (capitalization matters):
- `bliss-wallpaper.jpg`
- `folder-music.png`
- `folder-shows.png`
- `folder-instagram.png`
- `internet-explorer.png`
- `email.png`
- `winamp.png`
- `speed-dial.png`
- `Document.png`
- `Snake.png`
- `john.png`

## New assets for jonkotrain
Add these files to the same `assets/` folder:
- `jonkotrain.png` — desktop shortcut icon
- `train.png` — front-facing train image, ideally PNG with transparent background
- `jonkotrain.mp3` — sound for the train animation

The train shortcut is included in the page. If one of these three files is not uploaded yet, that feature will show a missing asset until you add it.

## Zine download switch
1. Create `assets/zines/` in your repository.
2. Upload your zine PDF there.
3. Open `script.js` and find `const ZINE =`.
4. Change `enabled: false` to `enabled: true`.
5. Change `file` to the exact PDF path, for example `assets/zines/irs-zine-01.pdf`.
6. Change `label` to the menu text you want.

The zine entry stays hidden until `enabled` is set to `true`.

## Adding music to the audio player
Upload MP3s into `assets/music/`. In `script.js`, find `const TRACKS = []` and add entries like:
```js
const TRACKS = [
  { title: "Track title", artist: "Insane Revenue Service", src: "assets/music/track01.mp3" }
];
```

## Notes
- Snake 97 runs locally in the page and does not need an internet connection.
- John de Mol and the fake virus are fictional, in-page effects. They do not open system dialogs or damage anything.
- YouTube may block embedded playback in some browser configurations; the window includes a direct YouTube link as a fallback.
- GitHub Pages may take a minute or two to publish changes after you commit them.
