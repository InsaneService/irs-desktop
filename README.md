## zines
1. Create `assets/zines/` in your repository.
2. Upload your zine PDF there.
3. Open `script.js` and find `const ZINE =`.
4. Change `enabled: false` to `enabled: true`.
5. Change `file` to the exact PDF path, for example `assets/zines/irs-zine-01.pdf`.
6. Change `label` to the menu text you want.

The zine stays hidden until `enabled` is set to `true`.

## Adding music to audio player
Upload MP3s into `assets/music/`. In `script.js`, find `const TRACKS = []` and add entries like:
```js
const TRACKS = [
  { title: "Track title", artist: "Insane Revenue Service", src: "assets/music/track01.mp3" }
];
```

