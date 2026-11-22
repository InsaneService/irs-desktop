# Insane Revenue Service — website starter

A static HTML/CSS/JavaScript site designed for GitHub Pages.

## Preview locally
Open `index.html` in a browser. For the best local preview, use VS Code's Live Server extension.

## Publish with GitHub Pages
1. Create a GitHub repository (for example `irs-desktop`).
2. Upload **the contents** of this folder, keeping `index.html` at the repository root.
3. Open **Settings → Pages**.
4. Under Build and deployment, choose **Deploy from a branch**.
5. Choose branch `main`, folder `/ (root)`, then Save.
6. Wait for the published URL shown in Pages settings.

## Add MP3s later
1. Put MP3 files in `assets/music/`.
2. Open `script.js` and find `const TRACKS = [`.
3. Add one entry per song, for example:

```js
const TRACKS = [
  { title: "Track One", artist: "Insane Revenue Service", src: "assets/music/track01.mp3" },
  { title: "Track Two", artist: "Insane Revenue Service", src: "assets/music/track02.mp3" }
];
```

4. Save and upload the changed `script.js` plus the MP3 files to GitHub.

Keep individual repository files under GitHub's 100 MB limit; smaller compressed MP3s are preferable.

## Included behaviour
- Music, Shows, Instagram and Speed Dial links.
- `mailto:` booking link.
- Click-to-load YouTube embed (does not autoplay on page visit).
- Start menu with supplied IRS PDF links, YouTube destination and Snake 97.
- Draggable desktop shortcuts with saved positions on desktop browsers.
- IRS-styled player shell with empty playlist, ready for tracks later.

## Notes
- The Bliss background currently loads from an external wallpaper image host. For a more durable published site, download an appropriately licensed Bliss image and put it in `assets/bliss.jpg`, then change the CSS `background-image` URL to `url("assets/bliss.jpg")`.
- The visual icons are recreated with CSS/text rather than copied proprietary Windows icon files.
- Mobile layout is responsive; drag positions are intentionally not restored from desktop on narrow screens so the phone arrangement remains usable.
