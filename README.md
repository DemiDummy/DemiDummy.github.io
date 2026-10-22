# DemiDummy Games

The landing page for every game DemiDummy has published on GitHub Pages. **Live at https://demidummy.github.io/**

Plain HTML, CSS and a little JavaScript. No build step: GitHub Pages serves this folder as it is.

## Files

- `index.html`: the page. Each game is one `<li class="card">` block.
- `style.css`: the look. Each card takes its colour from `--accent` (and `--accent-ink` for text on it).
- `site.js`: optional extras. It fills in "Updated ..." from each repo's last push, and adds a placeholder card for
  any public repo with Pages turned on that isn't on the page yet, so a new game shows up here on its own. It also
  runs the Surprise me button.
- `img/`: one 16:9 WebP cover per game, at most 960x540.
- `og-image.jpg`: the 1200x630 picture link previews show (Discord, iMessage).
- `tools/`: screenshot and image helpers (not used by the page).

## Adding a game

1. Take a screenshot: `node tools/shot.mjs "https://demidummy.github.io/<game>/" shots/<game>.png --size 1280x720 --wait 8000`
   (headless Edge; Node is at `C:\tools\node`). A game's own screenshots or `og-image` work too.
2. Make the cover: `python tools/make-card.py shots/<game>.png img/<game>.webp`
3. Copy a card in `index.html`, then change its accent colours, image, genre, title, link, blurb, facts and
   `data-repo` (the GitHub repo name, for the "Updated" date). Update the count in the headline if it's spelled out.
4. Optional: `python tools/make-og.py` remakes `og-image.jpg` from the first six covers.
5. Commit and push. Pages updates in a minute or two.
